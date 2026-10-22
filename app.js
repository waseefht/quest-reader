(function(){
var SS=window.speechSynthesis,$=function(i){return document.getElementById(i);},K='qr_state';
var st={text:'',rate:1,pitch:1,voice:'',auto:true,dwell:true,worker:'',duck:75,blend:40,spatial:true};try{Object.assign(st,JSON.parse(localStorage.getItem(K)||'{}'));}catch(e){}
function save(){try{localStorage.setItem(K,JSON.stringify(st));}catch(e){}}
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(function(){});
var txt=$('txt'),view=$('view'),sel=$('voice'),voices=[],chunks=[],idx=0,playing=false,bubbleText='';
txt.value=st.text;$('rate').value=st.rate;$('pitch').value=st.pitch;$('autoVoice').checked=st.auto;$('dwell').checked=st.dwell;$('workerUrl').value=st.worker;
$('duck').value=st.duck;$('blend').value=st.blend;$('spatial').checked=st.spatial;
function lbl(){$('duckV').textContent=st.duck;$('blendV').textContent=st.blend;$('rateV').textContent=(+st.rate).toFixed(1);$('pitchV').textContent=(+st.pitch).toFixed(1);}lbl();
$('openProxy').onclick=function(){var w=$('workerUrl').value.trim().replace(/\/+$/,''),u=$('siteUrl').value.trim();if(!w||!u){alert('أدخل رابط الـ Worker ورابط الموقع');return;}if(!/^https?:\/\//i.test(u))u='https://'+u;if(!/^https?:\/\//i.test(w))w='https://'+w;st.worker=w;save();location.href=w+'/'+u;};
var Q=window.QOTTS,online=false;if(!SS){$('nosupport').hidden=false;}
var FEM=/female|woman|zira|samantha|aria|jenny|hoda|salma|zariyah|amira|laila|layla|mona|hala|karen|victoria|susan|sara/i;function loadV(){voices=(SS?SS.getVoices():[]).filter(function(v){return FEM.test(v.name);});online=!voices.length;sel.innerHTML=voices.map(function(v){return '<option value="'+v.voiceURI.replace(/"/g,'')+'">'+v.name+' ('+v.lang+')</option>';}).join('')+Q.voices.map(function(v){return '<option value="'+v.id+'">'+v.name+'</option>';}).join('');if(st.voice)sel.value=st.voice;if(!sel.value)sel.selectedIndex=0;$('onlineNote').hidden=!online;}
loadV();Q.waitVoices(SS,loadV);if(SS)SS.addEventListener('voiceschanged',loadV);
function lang(t){var a=(t.match(/[\u0600-\u06FF]/g)||[]).length,l=(t.match(/[A-Za-z]/g)||[]).length;return a>=l&&a>0?'ar':'en';}
function voiceFor(t){var lg=lang(t);if(!st.auto)return voices.filter(function(v){return v.voiceURI==st.voice;})[0]||null;return voices.filter(function(v){return v.lang.toLowerCase().indexOf(lg)==0;})[0]||null;}
function split(t){var out=[];(t.match(/[^.!?؟\n؛]+[.!?؟؛]*\s*|\n+/g)||[]).forEach(function(s){s=s.trim();if(!s)return;while(s.length>220){var c=s.lastIndexOf(' ',220);if(c<50)c=220;out.push(s.slice(0,c));s=s.slice(c).trim();}if(s)out.push(s);});return out;}
function render(){chunks=split(txt.value);view.innerHTML='';chunks.forEach(function(c,i){var s=document.createElement('span');s.className='s';s.dataset.i=i;s.textContent=c+' ';view.appendChild(s);});}
function hi(i){view.querySelectorAll('.s.on').forEach(function(e){e.classList.remove('on');});var e=view.querySelector('[data-i="'+i+'"]');if(e){e.classList.add('on');e.scrollIntoView({block:'nearest'});}}
function useOnline(t){if(!SS||!voices.length)return true;if(Q.isOn(st.voice)&&(!st.auto||Q.byId(st.voice).lang.slice(0,2)==lang(t)))return true;return !voiceFor(t);}
function speakOnline(t,onend,nat){var id=Q.isOn(st.voice)&&(!st.auto||Q.byId(st.voice).lang.slice(0,2)==lang(t))?st.voice:Q.forLang(lang(t)).id;Q.speak(t,{voice:id,rate:st.rate,onend:onend,onerror:function(){if(nat&&SS&&voices.length)nat();else onend();}});}
function utter(t,onend){if(useOnline(t))return speakOnline(t,onend,function(){nativeU(t,onend);});nativeU(t,onend,true);}
function nativeU(t,onend,fb){var u=new SpeechSynthesisUtterance(t),v=voiceFor(t);if(v){u.voice=v;u.lang=v.lang;}else u.lang=lang(t)=='ar'?'ar-SA':'en-US';u.rate=+st.rate;u.pitch=+st.pitch;u.onend=onend;u.onerror=function(){if(fb)speakOnline(t,onend);else onend();};SS.speak(u);}
function next(){if(!playing||idx>=chunks.length){playing=false;hi(-1);return;}hi(idx);utter(chunks[idx],function(){if(playing){idx++;next();}});}
function showView(){render();$('editSec').hidden=true;$('viewSec').hidden=false;}
function stopAll(){if(SS)SS.cancel();Q.cancel();}
$('readBtn').onclick=function(){stopAll();if($('viewSec').hidden)showView();idx=0;playing=true;next();};
$('pauseBtn').onclick=function(){if(Q.speaking()||(!SS&&playing)){if(playing){playing=false;Q.cancel();this.textContent='▶️ استئناف';}return;}if(!playing&&this.textContent.indexOf('▶')==0&&!(SS&&SS.paused)){playing=true;this.textContent='⏸️ إيقاف مؤقت';next();return;}if(!SS)return;if(SS.paused){SS.resume();this.textContent='⏸️ إيقاف مؤقت';}else{SS.pause();this.textContent='▶️ استئناف';}};
$('stopBtn').onclick=function(){playing=false;stopAll();hi(-1);};
$('doneBtn').onclick=showView;$('editBtn').onclick=function(){$('stopBtn').onclick();$('editSec').hidden=false;$('viewSec').hidden=true;};
txt.oninput=function(){st.text=txt.value;save();};
$('file').onchange=function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){txt.value=r.result;st.text=r.result;save();showView();};r.readAsText(f,'utf-8');};
sel.onchange=function(){st.voice=sel.value;save();};$('autoVoice').onchange=function(){st.auto=this.checked;save();};$('dwell').onchange=function(){st.dwell=this.checked;save();};
['duck','blend'].forEach(function(k){$(k).oninput=function(){st[k]=+this.value;lbl();save();};});$('spatial').onchange=function(){st.spatial=this.checked;save();};
$('rate').oninput=function(){st.rate=this.value;lbl();save();};$('pitch').oninput=function(){st.pitch=this.value;lbl();save();};
var bubble=$('bubble'),dwellT=0;
function readOne(t){if(!t)return;playing=false;stopAll();utter(t,function(){});}
function showBubble(t,r,auto){bubbleText=t;bubble.hidden=false;bubble.style.top=(r.top+scrollY-80)+'px';bubble.style.left=Math.max(8,r.left+scrollX)+'px';if(auto)readOne(t);}
view.addEventListener('pointerover',function(e){var s=e.target.closest('.s');if(!s||!st.dwell)return;clearTimeout(dwellT);dwellT=setTimeout(function(){idx=+s.dataset.i;hi(idx);showBubble(chunks[idx],s.getBoundingClientRect(),true);},600);});
view.addEventListener('pointerout',function(){clearTimeout(dwellT);});
view.addEventListener('click',function(e){var s=e.target.closest('.s');if(!s||String(getSelection()).trim())return;clearTimeout(dwellT);idx=+s.dataset.i;hi(idx);showBubble(chunks[idx],s.getBoundingClientRect(),true);});
document.addEventListener('selectionchange',function(){var s=getSelection(),t=String(s).trim();if(t.length<2||!s.rangeCount||!view.contains(s.anchorNode))return;clearTimeout(dwellT);dwellT=setTimeout(function(){showBubble(t,s.getRangeAt(0).getBoundingClientRect(),false);},400);});
$('bPlay').onclick=function(){readOne(bubbleText);};$('bStop').onclick=stopAll;$('bClose').onclick=function(){bubble.hidden=true;stopAll();};
if(st.text)showView();
})();
