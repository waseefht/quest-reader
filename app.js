(function(){
var SS=window.speechSynthesis,$=function(i){return document.getElementById(i);},K='qr_state';
var st={text:'',rate:1,pitch:1,voice:'',auto:true,dwell:true,worker:''};try{Object.assign(st,JSON.parse(localStorage.getItem(K)||'{}'));}catch(e){}
function save(){try{localStorage.setItem(K,JSON.stringify(st));}catch(e){}}
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(function(){});
var txt=$('txt'),view=$('view'),sel=$('voice'),voices=[],chunks=[],idx=0,playing=false,bubbleText='';
txt.value=st.text;$('rate').value=st.rate;$('pitch').value=st.pitch;$('autoVoice').checked=st.auto;$('dwell').checked=st.dwell;$('workerUrl').value=st.worker;
function lbl(){$('rateV').textContent=(+st.rate).toFixed(1);$('pitchV').textContent=(+st.pitch).toFixed(1);}lbl();
$('openProxy').onclick=function(){var w=$('workerUrl').value.trim().replace(/\/+$/,''),u=$('siteUrl').value.trim();if(!w||!u){alert('أدخل رابط الـ Worker ورابط الموقع');return;}if(!/^https?:\/\//i.test(u))u='https://'+u;if(!/^https?:\/\//i.test(w))w='https://'+w;st.worker=w;save();location.href=w+'/'+u;};
if(!SS){$('nosupport').hidden=false;['readBtn','pauseBtn','stopBtn'].forEach(function(i){$(i).disabled=true;});}
function loadV(){voices=SS.getVoices();sel.innerHTML=voices.map(function(v){return '<option value="'+v.voiceURI.replace(/"/g,'')+'">'+v.name+' ('+v.lang+')</option>';}).join('')||'<option>لا توجد أصوات</option>';if(st.voice)sel.value=st.voice;}
if(SS){loadV();SS.addEventListener('voiceschanged',loadV);}
function lang(t){var a=(t.match(/[\u0600-\u06FF]/g)||[]).length,l=(t.match(/[A-Za-z]/g)||[]).length;return a>=l&&a>0?'ar':'en';}
function voiceFor(t){var lg=lang(t);if(!st.auto)return voices.filter(function(v){return v.voiceURI==st.voice;})[0];return voices.filter(function(v){return v.lang.toLowerCase().indexOf(lg)==0;})[0]||null;}
function split(t){var out=[];(t.match(/[^.!?؟\n؛]+[.!?؟؛]*\s*|\n+/g)||[]).forEach(function(s){s=s.trim();if(!s)return;while(s.length>220){var c=s.lastIndexOf(' ',220);if(c<50)c=220;out.push(s.slice(0,c));s=s.slice(c).trim();}if(s)out.push(s);});return out;}
function render(){chunks=split(txt.value);view.innerHTML='';chunks.forEach(function(c,i){var s=document.createElement('span');s.className='s';s.dataset.i=i;s.textContent=c+' ';view.appendChild(s);});}
function hi(i){view.querySelectorAll('.s.on').forEach(function(e){e.classList.remove('on');});var e=view.querySelector('[data-i="'+i+'"]');if(e){e.classList.add('on');e.scrollIntoView({block:'nearest'});}}
function utter(t,onend){var u=new SpeechSynthesisUtterance(t),v=voiceFor(t);if(v){u.voice=v;u.lang=v.lang;}else u.lang=lang(t)=='ar'?'ar-SA':'en-US';u.rate=+st.rate;u.pitch=+st.pitch;u.onend=onend;u.onerror=onend;SS.speak(u);}
function next(){if(!playing||idx>=chunks.length){playing=false;hi(-1);return;}hi(idx);utter(chunks[idx],function(){if(playing){idx++;next();}});}
function showView(){render();$('editSec').hidden=true;$('viewSec').hidden=false;}
$('readBtn').onclick=function(){SS.cancel();if($('viewSec').hidden)showView();idx=0;playing=true;next();};
$('pauseBtn').onclick=function(){if(SS.paused){SS.resume();this.textContent='⏸️ إيقاف مؤقت';}else{SS.pause();this.textContent='▶️ استئناف';}};
$('stopBtn').onclick=function(){playing=false;if(SS)SS.cancel();hi(-1);};
$('doneBtn').onclick=showView;$('editBtn').onclick=function(){$('stopBtn').onclick();$('editSec').hidden=false;$('viewSec').hidden=true;};
txt.oninput=function(){st.text=txt.value;save();};
$('file').onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){txt.value=r.result;st.text=r.result;save();showView();};r.readAsText(f,'utf-8');};
sel.onchange=function(){st.voice=sel.value;save();};$('autoVoice').onchange=function(){st.auto=this.checked;save();};$('dwell').onchange=function(){st.dwell=this.checked;save();};
$('rate').oninput=function(){st.rate=this.value;lbl();save();};$('pitch').oninput=function(){st.pitch=this.value;lbl();save();};
var bubble=$('bubble'),dwellT=0;
function readOne(t){if(!SS||!t)return;playing=false;SS.cancel();utter(t,function(){});}
function showBubble(t,r,auto){bubbleText=t;bubble.hidden=false;bubble.style.top=(r.top+scrollY-80)+'px';bubble.style.left=Math.max(8,r.left+scrollX)+'px';if(auto)readOne(t);}
view.addEventListener('pointerover',function(e){var s=e.target.closest('.s');if(!s||!st.dwell)return;clearTimeout(dwellT);dwellT=setTimeout(function(){idx=+s.dataset.i;hi(idx);showBubble(chunks[idx],s.getBoundingClientRect(),true);},600);});
view.addEventListener('pointerout',function(){clearTimeout(dwellT);});
view.addEventListener('click',function(e){var s=e.target.closest('.s');if(!s||String(getSelection()).trim())return;clearTimeout(dwellT);idx=+s.dataset.i;hi(idx);showBubble(chunks[idx],s.getBoundingClientRect(),true);});
document.addEventListener('selectionchange',function(){var s=getSelection(),t=String(s).trim();if(t.length<2||!s.rangeCount||!view.contains(s.anchorNode))return;clearTimeout(dwellT);dwellT=setTimeout(function(){showBubble(t,s.getRangeAt(0).getBoundingClientRect(),false);},400);});
$('bPlay').onclick=function(){readOne(bubbleText);};$('bStop').onclick=function(){if(SS)SS.cancel();};$('bClose').onclick=function(){bubble.hidden=true;if(SS)SS.cancel();};
if(st.text)showView();
})();
