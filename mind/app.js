(function(){
const $=s=>document.querySelector(s);const C=window.Core;
const cfg=()=>({key:localStorage.mind_key||'',base:(localStorage.mind_base||'https://api.openai.com/v1').replace(/\/$/,''),model:localStorage.mind_model||'gpt-4o-mini',tts:localStorage.mind_tts||'auto'});
// ---------- IndexedDB ----------
const STORES=['facts','chunks','docs','reminders','notes','chat'];let dbp;
function db(){return dbp||(dbp=new Promise((res,rej)=>{const r=indexedDB.open('mind',1);r.onupgradeneeded=()=>STORES.forEach(s=>r.result.objectStoreNames.contains(s)||r.result.createObjectStore(s,{keyPath:'id',autoIncrement:true}));r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);}));}
async function tx(s,mode,fn){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(s,mode);const st=t.objectStore(s);const r=fn(st);t.oncomplete=()=>res(r&&r.result);t.onerror=()=>rej(t.error);});}
const all=s=>tx(s,'readonly',st=>st.getAll()),put=(s,v)=>tx(s,'readwrite',st=>st.put(v)),del=(s,id)=>tx(s,'readwrite',st=>st.delete(id)),clear=s=>tx(s,'readwrite',st=>st.clear());
// ---------- API ----------
async function api(path,body,raw){const c=cfg();if(!c.key)throw new Error('ما في مفتاح API — روح عالإعدادات');
  const r=await fetch(c.base+path,{method:'POST',headers:Object.assign({Authorization:'Bearer '+c.key},body instanceof FormData?{}:{'Content-Type':'application/json'}),body:body instanceof FormData?body:JSON.stringify(body)});
  if(!r.ok)throw new Error('API '+r.status+': '+(await r.text()).slice(0,200));return raw?r:r.json();}
async function embed(texts){const out=[];for(let i=0;i<texts.length;i+=64){const j=await api('/embeddings',{model:'text-embedding-3-small',input:texts.slice(i,i+64)});j.data.forEach(d=>out.push(d.embedding));}return out;}
// ---------- UI tabs ----------
document.querySelectorAll('header button').forEach(b=>b.onclick=()=>{document.querySelectorAll('header button,section').forEach(x=>x.classList.remove('on'));b.classList.add('on');$('#'+b.dataset.t).classList.add('on');render();});
function msg(cls,text){const d=document.createElement('div');d.className='m '+cls;d.textContent=text;$('#log').appendChild(d);d.scrollIntoView&&d.scrollIntoView({block:"end"});return d;}
// ---------- Tools ----------
const tools=[
 {type:'function',function:{name:'remember_fact',description:'احفظ معلومة دائمة عن المستخدم',parameters:{type:'object',properties:{text:{type:'string'},category:{type:'string'}},required:['text']}}},
 {type:'function',function:{name:'search_knowledge',description:'ابحث في ملاحظات وملفات المستخدم',parameters:{type:'object',properties:{query:{type:'string'}},required:['query']}}},
 {type:'function',function:{name:'create_reminder',description:'أنشئ تذكير بوقت محدد (ISO datetime محلي)',parameters:{type:'object',properties:{text:{type:'string'},when:{type:'string'}},required:['text','when']}}},
 {type:'function',function:{name:'create_note',description:'احفظ ملاحظة جديدة (تُفهرس بالمعرفة)',parameters:{type:'object',properties:{title:{type:'string'},text:{type:'string'}},required:['title','text']}}}];
async function search(query,k=4){const chunks=await all('chunks');if(!chunks.length)return[];const[qv]=await embed([query]);return C.topK(qv,chunks,k).map(x=>({source:x.title,text:x.text,score:+x.score.toFixed(3)}));}
async function runTool(name,a){
 if(name==='remember_fact'){await put('facts',{text:a.text,category:a.category||'عام',ts:Date.now()});return{ok:true};}
 if(name==='search_knowledge')return{results:await search(a.query)};
 if(name==='create_reminder'){const t=Date.parse(a.when);await put('reminders',{text:a.text,when:isNaN(t)?Date.now()+3600e3:t,done:false});return{ok:true,when:new Date(isNaN(t)?Date.now()+3600e3:t).toLocaleString('ar')};}
 if(name==='create_note'){await put('notes',{title:a.title,text:a.text,ts:Date.now()});await indexDoc(a.title,a.text);return{ok:true};}
 return{error:'unknown tool'};}
// ---------- Chat ----------
let history=[];
async function ask(q){
 msg('u',q);const wait=msg('a','... عم فكّر');
 try{
  const facts=await all('facts');let ctx=[];try{ctx=await search(q,4);}catch(e){}
  const sys=`أنت مساعد شخصي ذكي لـ waseem. احكِ دايماً باللهجة الشامية (الفلسطينية/الشامية) بشكل ودود ومختصر.
فكّر خطوة بخطوة اعتماداً على ذاكرته ومعرفته، واستعمل الأدوات لما يلزم (احفظ المعلومات المهمة، ابحث بالملاحظات، اعمل تذكيرات وملاحظات). الوقت الحالي: ${new Date().toString()}.
لما تستعمل معلومة من الملاحظات اذكر المصدر بين [قوسين].
ذاكرة المستخدم:\n${facts.map(f=>'- '+f.text).join('\n')||'(فاضية)'}
مقاطع من معرفته ذات صلة:\n${ctx.map(c=>`[${c.source}] ${c.text}`).join('\n---\n')||'(لا شيء)'}`;
  const msgs=[{role:'system',content:sys},...history.slice(-12),{role:'user',content:q}];let used=new Set(ctx.map(c=>c.source));let ans='';
  for(let i=0;i<5;i++){
   const j=await api('/chat/completions',{model:cfg().model,messages:msgs,tools});const m=j.choices[0].message;msgs.push(m);
   if(!m.tool_calls||!m.tool_calls.length){ans=m.content||'';break;}
   for(const tc of m.tool_calls){let a={};try{a=JSON.parse(tc.function.arguments||'{}');}catch(e){}
    const r=await runTool(tc.function.name,a);if(r.results)r.results.forEach(x=>used.add(x.source));
    msg('s','🔧 '+tc.function.name+' '+JSON.stringify(a).slice(0,120));msgs.push({role:'tool',tool_call_id:tc.id,content:JSON.stringify(r)});}
  }
  wait.textContent=ans+(used.size?'\n\n📎 المصادر: '+[...used].join('، '):'');
  history.push({role:'user',content:q},{role:'assistant',content:ans});put('chat',{q,a:ans,ts:Date.now()});
  if($('#speak').checked)speak(ans);
  extractMemory(q,ans,facts).catch(e=>console.warn(e));
 }catch(e){wait.textContent='⚠️ '+e.message;}
}
async function extractMemory(q,a,facts){
 const j=await api('/chat/completions',{model:cfg().model,response_format:{type:'json_object'},messages:[{role:'system',content:'Extract durable facts/preferences about the USER (not general knowledge) from this exchange. Skip facts already known. Return JSON {"facts":[{"text":"...in Arabic","category":"..."}]} or {"facts":[]}.'},{role:'user',content:'Known:\n'+facts.map(f=>f.text).join('\n')+'\n\nUser: '+q+'\nAssistant: '+a}]});
 const nf=C.parseFacts(j.choices[0].message.content);const known=new Set(facts.map(f=>f.text));
 for(const f of nf)if(!known.has(f.text))await put('facts',{...f,ts:Date.now()});
 if(nf.length)msg('s','🧠 حفظت '+nf.length+' معلومة جديدة');}
$('#send').onclick=()=>{const q=$('#q').value.trim();if(q){$('#q').value='';ask(q);}};
$('#q').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#send').click();}};
// ---------- Voice in ----------
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec,mr,chunksA=[];
$('#mic').onclick=async()=>{const b=$('#mic');
 if(SR&&!b._fallback){ if(rec){rec.stop();return;}
  rec=new SR();rec.lang='ar-JO';rec.interimResults=true;b.classList.add('rec');
  rec.onresult=e=>{$('#q').value=[...e.results].map(r=>r[0].transcript).join('');};
  rec.onerror=e=>{if(e.error==='network'||e.error==='not-allowed'||e.error==='service-not-allowed'){b._fallback=true;msg('s','التعرف المباشر مش متاح، رح نسجّل ونرسل لـOpenAI. اضغط 🎤 مرة ثانية');}};
  rec.onend=()=>{b.classList.remove('rec');rec=null;if($('#q').value.trim())$('#send').click();};rec.start();return;}
 if(mr&&mr.state==='recording'){mr.stop();return;}
 try{const st=await navigator.mediaDevices.getUserMedia({audio:true});mr=new MediaRecorder(st);chunksA=[];mr.ondataavailable=e=>chunksA.push(e.data);
  mr.onstop=async()=>{b.classList.remove('rec');st.getTracks().forEach(t=>t.stop());const fd=new FormData();fd.append('file',new Blob(chunksA,{type:mr.mimeType}),'a.webm');fd.append('model','gpt-4o-mini-transcribe');fd.append('language','ar');
   try{const j=await api('/audio/transcriptions',fd);if(j.text){$('#q').value=j.text;$('#send').click();}}catch(e){msg('s','⚠️ '+e.message);}};
  mr.start();b.classList.add('rec');}catch(e){msg('s','⚠️ ما قدرت أفتح المايك: '+e.message);}};
// ---------- Voice out ----------
let audio=new Audio();
function deviceVoice(){const v=speechSynthesis.getVoices().filter(v=>v.lang&&v.lang.startsWith('ar'));return v.find(x=>/female|zira|hoda|salma|laila|mariam|amira/i.test(x.name))||v[0];}
async function speak(t){t=t.replace(/[*#`]/g,'');const mode=cfg().tts;
 if((mode==='auto'||mode==='device')&&window.speechSynthesis&&deviceVoice()){const u=new SpeechSynthesisUtterance(t);u.voice=deviceVoice();u.lang=u.voice.lang;speechSynthesis.cancel();speechSynthesis.speak(u);return;}
 if((mode==='auto'||mode==='openai')&&cfg().key){try{const r=await api('/audio/speech',{model:'gpt-4o-mini-tts',voice:'nova',input:t.slice(0,4000),instructions:'Speak in a warm Levantine Arabic female voice.'},true);audio.src=URL.createObjectURL(await r.blob());await audio.play();return;}catch(e){console.warn(e);}}
 const parts=t.match(/.{1,180}(\s|$)/gs)||[];for(const p of parts){audio.src='https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ar&q='+encodeURIComponent(p);try{await audio.play();await new Promise(r=>audio.onended=r);}catch(e){break;}}}
// ---------- Knowledge ----------
async function indexDoc(title,text){const ch=C.chunkText(text);if(!ch.length)return 0;$('#kbStatus').textContent='عم فهرس '+title+' ('+ch.length+' مقطع)...';
 const vecs=await embed(ch);const docId=await put('docs',{title,size:text.length,n:ch.length,ts:Date.now()});
 for(let i=0;i<ch.length;i++)await put('chunks',{docId,title,text:ch[i],vec:vecs[i]});$('#kbStatus').textContent='✅ '+title;return ch.length;}
async function pdfText(file){if(!window.pdfjsLib)throw new Error('pdf.js ما تحمّل');pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
 const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;let s='';for(let p=1;p<=pdf.numPages;p++){const c=await(await pdf.getPage(p)).getTextContent();s+=c.items.map(i=>i.str).join(' ')+'\n';}return s;}
$('#files').onchange=async e=>{for(const f of e.target.files){try{const t=f.name.toLowerCase().endsWith('.pdf')?await pdfText(f):C.importToText(f.name,await f.text());await indexDoc(f.name,t);}catch(er){$('#kbStatus').textContent='⚠️ '+f.name+': '+er.message;}}render();};
$('#addPaste').onclick=async()=>{const t=$('#ptext').value.trim();if(!t)return;const ti=$('#ptitle').value.trim()||('ملاحظة '+new Date().toLocaleDateString('ar'));
 try{await put('notes',{title:ti,text:t,ts:Date.now()});await indexDoc(ti,t);$('#ptext').value='';$('#ptitle').value='';}catch(e){$('#kbStatus').textContent='⚠️ '+e.message;}render();};
// ---------- Render lists ----------
function card(html,btns){const d=document.createElement('div');d.className='card';d.innerHTML=html;btns.forEach(([l,f])=>{const b=document.createElement('button');b.textContent=l;b.onclick=f;d.appendChild(b);});return d;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function render(){
 const F=$('#facts');F.innerHTML='';(await all('facts')).reverse().forEach(f=>F.appendChild(card(`<b>${esc(f.category)}</b>: <span>${esc(f.text)}</span> `,[['✏️',async()=>{const t=prompt('عدّل',f.text);if(t){f.text=t;await put('facts',f);render();}}],['🗑️',async()=>{await del('facts',f.id);render();}]])));
 const D=$('#docs');D.innerHTML='';(await all('docs')).reverse().forEach(d=>D.appendChild(card(`📄 ${esc(d.title)} <span class="s">(${d.n} مقطع)</span> `,[['🗑️',async()=>{const cs=await all('chunks');for(const c of cs)if(c.docId===d.id)await del('chunks',c.id);await del('docs',d.id);render();}]])));
 const R=$('#rems');R.innerHTML='';(await all('reminders')).sort((a,b)=>a.when-b.when).forEach(r=>R.appendChild(card(`${r.done?'✅':'⏰'} ${esc(r.text)} <span class="s">${new Date(r.when).toLocaleString('ar')}</span> `,[['🗑️',async()=>{await del('reminders',r.id);render();}]])));
 const N=$('#notes');N.innerHTML='';(await all('notes')).reverse().forEach(n=>N.appendChild(card(`<b>${esc(n.title)}</b><div>${esc(n.text)}</div>`,[['🗑️',async()=>{await del('notes',n.id);render();}]])));}
$('#addFact').onclick=async()=>{const t=$('#newFact').value.trim();if(t){await put('facts',{text:t,category:'يدوي',ts:Date.now()});$('#newFact').value='';render();}};
// reminders check
async function checkRem(){for(const r of await all('reminders'))if(!r.done&&r.when<=Date.now()){r.done=true;await put('reminders',r);
 try{if(Notification.permission==='granted'){const reg=await navigator.serviceWorker?.getRegistration();reg?reg.showNotification('⏰ تذكير',{body:r.text}):new Notification('⏰ تذكير',{body:r.text});}else alert('⏰ '+r.text);}catch(e){alert('⏰ '+r.text);}}}
setInterval(checkRem,30000);
// ---------- Settings / backup ----------
const c0=cfg();$('#key').value=c0.key;$('#base').value=localStorage.mind_base||'';$('#model').value=localStorage.mind_model||'';$('#ttsMode').value=c0.tts;
$('#save').onclick=()=>{localStorage.mind_key=$('#key').value.trim();localStorage.mind_base=$('#base').value.trim();localStorage.mind_model=$('#model').value.trim();localStorage.mind_tts=$('#ttsMode').value;$('#setStatus').textContent='✅ انحفظ';};
$('#notif').onclick=()=>window.Notification&&Notification.requestPermission().then(p=>$('#setStatus').textContent='الإشعارات: '+p);
$('#export').onclick=async()=>{const o={app:'mind',v:1,date:new Date().toISOString()};for(const s of STORES)o[s]=await all(s);
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(o)],{type:'application/json'}));a.download='mind-backup-'+Date.now()+'.json';a.click();};
$('#importB').onchange=async e=>{try{const o=JSON.parse(await e.target.files[0].text());for(const s of STORES)if(Array.isArray(o[s])){await clear(s);for(const v of o[s])await put(s,v);}$('#setStatus').textContent='✅ استوردت';render();}catch(er){$('#setStatus').textContent='⚠️ '+er.message;}};
$('#wipe').onclick=async()=>{if(confirm('أكيد بدك تمسح كل شي؟')){for(const s of STORES)await clear(s);render();}};
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
if(!c0.key)msg('s','👋 أهلين! حط مفتاح API من ⚙️ الإعدادات لتبلّش.');
render();checkRem();
window.MindApp={runTool,extractMemory,search,all};
})();
