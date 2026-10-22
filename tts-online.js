/* QOTTS: online female TTS via Google Translate (no API key), played with <audio referrerPolicy=no-referrer>. Used when speechSynthesis has no voices (e.g. Meta Quest Browser). */
(function(W){if(W.QOTTS)return;
var V=[{id:'g:ar',name:'صوت نسائي عربي (إنترنت)',lang:'ar',tl:'ar',r:1},{id:'g:ar-slow',name:'صوت نسائي عربي بطيء (إنترنت)',lang:'ar',tl:'ar',r:0.85},{id:'g:en-US',name:'صوت نسائي إنجليزي أمريكي (إنترنت)',lang:'en-US',tl:'en-US',r:1},{id:'g:en-GB',name:'صوت نسائي إنجليزي بريطاني (إنترنت)',lang:'en-GB',tl:'en-GB',r:1},{id:'g:en-AU',name:'صوت نسائي إنجليزي أسترالي (إنترنت)',lang:'en-AU',tl:'en-AU',r:1}];
function url(t,tl){return 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl='+encodeURIComponent(tl)+'&q='+encodeURIComponent(t);}
function chunk(t,n){n=n||180;t=String(t).replace(/\s+/g,' ').trim();var out=[];while(t.length>n){var s=t.slice(0,n),c=Math.max(s.search(/[.!?؟؛،,][^.!?؟؛،,]*$/)+1,0);if(c<40)c=s.lastIndexOf(' ');if(c<20)c=n;out.push(t.slice(0,c).trim());t=t.slice(c).trim();}if(t)out.push(t);return out;}
function mk(u){var a=new Audio();a.referrerPolicy='no-referrer';try{a.setAttribute('referrerpolicy','no-referrer');}catch(e){}a.preload='auto';if(u)a.src=u;return a;}
var cur=null,job=0,DC={duck:75,blend:40,spatial:true,base:W.__QSR_TTSBASE||''},AC=null,CH=null,waBad=false,stats={wa:0,plain:0};
function ac(){if(!AC){var C=W.AudioContext||W.webkitAudioContext;if(!C)return null;try{AC=new C();}catch(e){return null;}}if(AC.state=='suspended'){try{AC.resume();}catch(e){}}return AC;}
function impulse(c,sec){var n=Math.floor(c.sampleRate*sec),b=c.createBuffer(2,n,c.sampleRate);for(var ch=0;ch<2;ch++){var d=b.getChannelData(ch);for(var i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,3);}return b;}
function chain(){var c=ac();if(!c)return null;if(CH)return CH;var hp=c.createBiquadFilter();hp.type='highpass';hp.frequency.value=120;var pr=c.createBiquadFilter();pr.type='peaking';pr.frequency.value=3000;pr.Q.value=1;pr.gain.value=3;
 var cp=c.createDynamicsCompressor();cp.threshold.value=-22;cp.ratio.value=3;cp.attack.value=0.005;cp.release.value=0.2;var dry=c.createGain(),wet=c.createGain(),cv=c.createConvolver();cv.buffer=impulse(c,0.4);
 var pan=c.createStereoPanner?c.createStereoPanner():c.createGain();hp.connect(pr);pr.connect(cp);cp.connect(dry);cp.connect(cv);cv.connect(wet);dry.connect(pan);wet.connect(pan);pan.connect(c.destination);CH={inp:hp,dry:dry,wet:wet,pan:pan,pr:pr};return CH;}
function setBlend(v){var c=chain();if(!c)return;var b=DC.blend/100;c.wet.gain.value=0.3*b;c.dry.gain.value=1-0.15*b;c.pr.gain.value=1+3*b;
 if(c.pan.pan){var p=0;if(DC.spatial&&v&&v.getBoundingClientRect){var r=v.getBoundingClientRect(),cx=(r.left+r.width/2)/(W.innerWidth||1);p=Math.max(-1,Math.min(1,(cx*2-1)))*0.7*b;}c.pan.pan.value=p;}}
/* ---- ducking ---- */
function bigVideo(){var best=null,a=0;try{document.querySelectorAll('video').forEach(function(v){var r=v.getBoundingClientRect(),s=r.width*r.height;if(s>a||(!v.paused&&best&&best.paused)){a=s;best=v;}});}catch(e){}return best;}
function fade(v,to,ms){clearInterval(v.__qF);var from=v.volume,t0=Date.now();v.__qF=setInterval(function(){var k=Math.min(1,(Date.now()-t0)/ms);try{v.volume=Math.max(0,Math.min(1,from+(to-from)*k));}catch(e){}if(k>=1)clearInterval(v.__qF);},15);}
function routeVideo(v){if(v.__qR!==undefined)return v.__qR;v.__qR=null;var c=AC;if(!DC.spatial||!c||c.state!='running'||v.mediaKeys)return null;var src=v.currentSrc||v.src||'';
 var same=/^blob:/.test(src)?src.indexOf('blob:'+location.origin)==0:(function(){try{return new URL(src,location.href).origin==location.origin;}catch(e){return false;}})();
 if(!same&&!(v.crossOrigin&&v.readyState>0&&(function(){try{var x=document.createElement('canvas').getContext('2d');x.drawImage(v,0,0,1,1);x.getImageData(0,0,1,1);return true;}catch(e){return false;}})()))return null;
 try{var s=c.createMediaElementSource(v),f=c.createBiquadFilter();f.type='peaking';f.frequency.value=1100;f.Q.value=0.45;f.gain.value=0;s.connect(f);f.connect(c.destination);v.__qR=f;}catch(e){v.__qR=null;}return v.__qR;}
function duck(v,on){v=v||bigVideo();if(!v)return;var k=DC.duck/100;if(on){if(v.__qD)return;v.__qD=1;clearTimeout(v.__qT);if(v.__qO==null)v.__qO=v.volume;var f=routeVideo(v);
  if(f){f.gain.setTargetAtTime(-9*k,AC.currentTime,0.05);fade(v,v.__qO*(1-k*0.5),150);}else fade(v,v.__qO*(1-k),150);}
 else{if(!v.__qD)return;v.__qD=0;if(v.__qR&&AC)v.__qR.gain.setTargetAtTime(0,AC.currentTime,0.08);var o=v.__qO==null?1:v.__qO;fade(v,o,200);v.__qT=setTimeout(function(){if(!v.__qD)v.__qO=null;},260);}}
/* ---- timing fit ---- */
function estDur(t,lg){return String(t).length/(lg=='ar'?13:15);}
function fitRate(t,lg,avail,user){user=+user||1;if(!(avail>0))return user;return Math.max(0.9,Math.min(1.6,Math.max(user,estDur(t,lg)/avail)));}
function cancel(){job++;if(cur){try{cur.pause();cur.removeAttribute('src');cur.load();}catch(e){}cur=null;}if(W.QOTTS&&W.QOTTS._dv){duck(W.QOTTS._dv,false);W.QOTTS._dv=null;}}
function speak(text,o){o=o||{};cancel();var my=job,v=byId(o.voice)||forLang(o.lang||'ar'),parts=chunk(text),i=0,rate=(+o.rate||1)*v.r,nextA=null,vid=o.video||(o.duck!==false?bigVideo():null),useWA=!waBad&&!!DC.base&&!!ac()&&AC.state=='running';
 var lg=v.lang.slice(0,2),avail=0;if(o.cue&&vid){avail=(o.cue.end-vid.currentTime)/(vid.playbackRate||1);rate=fitRate(text,lg,avail,rate);}
 W.QOTTS._dv=vid;if(vid)duck(vid,true);if(useWA)setBlend(vid);
 function src(t){return useWA?DC.base.replace(/\/+$/,'')+'/__tts?tl='+encodeURIComponent(v.tl)+'&q='+encodeURIComponent(t):url(t,v.tl);}
 function mkA(t){var a=mk(null);if(useWA){a.crossOrigin='anonymous';}a.src=src(t);if(useWA){try{chain();AC.createMediaElementSource(a).connect(CH.inp);}catch(e){}}return a;}
 function done(){if(my==job){cur=null;if(vid)duck(vid,false);W.QOTTS._dv=null;o.onend&&o.onend();}}
 function play(a){if(my!=job)return;cur=a;a.playbackRate=Math.max(0.5,Math.min(2,rate));stats[useWA?'wa':'plain']++;
  if(o.cue&&vid&&parts.length==1)a.onloadedmetadata=function(){if(isFinite(a.duration)&&avail>0){rate=Math.max(0.9,Math.min(1.6,Math.max(rate,a.duration/avail)));a.playbackRate=rate;}};
  a.onended=function(){if(my!=job)return;i++;a.removeAttribute('src');if(i>=parts.length)return done();play(nextA||mkA(parts[i]));nextA=null;};
  function fail(e){if(my!=job||a.__f)return;a.__f=1;cur=null;if(useWA){waBad=true;useWA=false;nextA=null;return play(mkA(parts[i]));}if(vid)duck(vid,false);o.onerror?o.onerror(e&&e.name||'net'):done();}
  a.onerror=fail;
  if(i+1<parts.length){nextA=mkA(parts[i+1]);}
  var p=a.play();if(p&&p.catch)p.catch(function(e){if(e&&e.name=='AbortError')return;fail(e);});}
 if(!parts.length)return done();W.QOTTS.lastUrl=src(parts[0]);W.QOTTS.lastRate=rate;play(mkA(parts[0]));}
function byId(id){for(var i=0;i<V.length;i++)if(V[i].id==id)return V[i];return null;}
function forLang(lg){lg=String(lg).toLowerCase();for(var i=0;i<V.length;i++)if(V[i].lang.toLowerCase().indexOf(lg.slice(0,2))==0)return V[i];return V[0];}
/* wait for native voices: retry now, on voiceschanged, after first tap; cb(list) once (list may be empty after ~1.5s) */
function waitVoices(SS,cb){var fired=0;function chk(force){var l=SS?SS.getVoices():[];if(fired&&!l.length)return;if(l.length||force){fired=1;cb(l);}}
 if(!SS){setTimeout(function(){cb([]);},0);return;}chk();try{SS.addEventListener('voiceschanged',function(){chk(1);});}catch(e){}
 var tap=function(){try{SS.speak(new SpeechSynthesisUtterance(''));}catch(e){}setTimeout(function(){chk(1);},300);};W.addEventListener('pointerdown',tap,{once:true,capture:true});
 setTimeout(function(){chk(1);},1500);}

/* ---- translation to Arabic (unofficial free Google endpoints; text is sent to Google) ---- */
var TC=new Map();function tget(k){if(!TC.has(k))return;var v=TC.get(k);TC.delete(k);TC.set(k,v);return v;}function tset(k,v){TC.set(k,v);while(TC.size>200)TC.delete(TC.keys().next().value);}
var EP=[function(qs,tl){return 'https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl='+tl+qs.map(function(q){return '&q='+encodeURIComponent(q);}).join('');},
 function(qs,tl){return DC.base?DC.base.replace(/\/+$/,'')+'/__tr?tl='+tl+qs.map(function(q){return '&q='+encodeURIComponent(q);}).join(''):null;}];
function parseT(j,n){var out=[];if(!Array.isArray(j))return null;if(n==1&&typeof j[0]=='string')return [j[0]];for(var i=0;i<j.length;i++){var x=j[i];out.push(Array.isArray(x)?String(x[0]):String(x));}return out.length==n?out:null;}
function fetchT(qs,tl,ei){ei=ei||0;var u=EP[ei]&&EP[ei](qs,tl);if(!u)return Promise.reject(new Error('translate-failed'));
 return fetch(u,{referrerPolicy:'no-referrer',credentials:'omit'}).then(function(r){if(!r.ok)throw new Error('http '+r.status);return r.json();}).then(function(j){var o=parseT(j,qs.length);if(!o)throw new Error('bad');return o;}).catch(function(e){if(ei+1<EP.length)return fetchT(qs,tl,ei+1);throw e;});}
var pend={};
function translate(list,tl){tl=tl||'ar';var single=typeof list=='string';list=single?[list]:list.slice();var res=new Array(list.length),need=[],idx=[],ps=[];
 list.forEach(function(t,i){var k=tl+'|'+t,c=tget(k);if(c!=null)res[i]=c;else if(pend[k])ps.push(pend[k].then(function(v){res[i]=v;}));else{need.push(t);idx.push(i);}});
 var batches=[],b=[],len=0;need.forEach(function(t,j){if(b.length&&(len+t.length>1500||b.length>=20)){batches.push(b);b=[];len=0;}b.push(j);len+=t.length+10;});if(b.length)batches.push(b);
 batches.forEach(function(bb){var qs=bb.map(function(j){return need[j];}),p=fetchT(qs,tl).then(function(o){bb.forEach(function(j,n){tset(tl+'|'+need[j],o[n]);res[idx[j]]=o[n];delete pend[tl+'|'+need[j]];});},function(e){bb.forEach(function(j){delete pend[tl+'|'+need[j]];});throw e;});
  bb.forEach(function(j,n){pend[tl+'|'+need[j]]=p.then(function(){return res[idx[j]];});});ps.push(p);});
 return Promise.all(ps).then(function(){return single?res[0]:res;});}
function isAr(t){var a=(String(t).match(/[\u0600-\u06FF]/g)||[]).length,l=(String(t).match(/[A-Za-z\u00C0-\u024F\u0400-\u04FF]/g)||[]).length;return a>0&&a>=l;}

/* ---- listen mode: speech-to-text when a video has no text subtitles ---- */
var LS={on:false};
function sttOpenAI(blob,o){var fd=new FormData();fd.append('file',blob,'seg.webm');fd.append('model',o.model||'gpt-4o-mini-transcribe');fd.append('response_format','json');
 return fetch('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:'Bearer '+o.key},body:fd}).then(function(r){if(!r.ok)throw new Error(r.status==401?'auth':'http '+r.status);return r.json();}).then(function(j){return (j.text||'').trim();});}
function dedup(prev,t){var a=prev.split(/\s+/),b=t.split(/\s+/);for(var n=Math.min(a.length,b.length,8);n>0;n--){if(a.slice(-n).join(' ').toLowerCase()==b.slice(0,n).join(' ').toLowerCase())return b.slice(n).join(' ');}return t;}
function capture(v){var f=v.captureStream||v.mozCaptureStream;if(!f)return {err:'nosupport'};if(v.mediaKeys)return {err:'drm'};try{var ms=f.call(v),at=ms.getAudioTracks();if(!at.length)return {err:'noaudio'};return {stream:new MediaStream(at)};}catch(e){return {err:/secur|cross|origin/i.test(e.message+e.name)?'cors':'fail',e:e};}}
function listen(v,o){stopListen();o=o||{};var st=o.onStatus||function(){},seg=+o.seg||5,ov=0.6,prev='',recs=[],timer=0,me=LS={on:true,mode:null,v:v,stop:null,segs:0};
 var stt=W.QOTTS.stt||(o.key?function(b){return sttOpenAI(b,o);}:null),c=stt?capture(v):{err:'nokey'};
 if(c.stream&&typeof MediaRecorder!='undefined'){me.mode='capture';var mime=['audio/webm;codecs=opus','audio/webm','audio/mp4'].filter(function(m){return MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(m);})[0]||'';
  function startRec(){if(!me.on||v.paused)return;var r,parts=[],t0=v.currentTime;try{r=new MediaRecorder(c.stream,mime?{mimeType:mime}:undefined);}catch(e){st('err',e);return;}
   r.ondataavailable=function(e){if(e.data&&e.data.size)parts.push(e.data);};r.onstop=function(){recs=recs.filter(function(x){return x!==r;});if(!parts.length)return;var b=new Blob(parts,{type:r.mimeType||'audio/webm'}),t1=v.currentTime;me.segs++;
    stt(b).then(function(t){if(!me.on||!t)return;var d=dedup(prev,t);prev=t;if(d)o.onText&&o.onText(d,{start:t0,end:t1,video:v});},function(e){st('stt-error',e);});};
   r.start();recs.push(r);me.last=r;timer=setTimeout(function(){startRec();setTimeout(function(){if(r.state!='inactive')r.stop();},ov*1000);},(seg-ov)*1000);}
  me.onplay=function(){clearTimeout(timer);startRec();};me.onpause=function(){clearTimeout(timer);recs.forEach(function(r){if(r.state!='inactive')r.stop();});};
  v.addEventListener('play',me.onplay);v.addEventListener('pause',me.onpause);if(!v.paused)startRec();
  me.stop=function(){me.on=false;clearTimeout(timer);v.removeEventListener('play',me.onplay);v.removeEventListener('pause',me.onpause);recs.forEach(function(r){try{r.stop();}catch(e){}});};st('capture');return me;}
 var SR=W.SpeechRecognition||W.webkitSpeechRecognition;
 if(SR&&o.mic!==false){me.mode='mic';var rec=new SR();rec.continuous=true;rec.interimResults=false;rec.lang=o.srcLang||'en-US';
  rec.onresult=function(e){for(var i=e.resultIndex;i<e.results.length;i++)if(e.results[i].isFinal){var t=e.results[i][0].transcript.trim();if(t&&!v.paused)o.onText&&o.onText(t,{video:v});}};
  rec.onend=function(){if(me.on)try{rec.start();}catch(e){}};rec.onerror=function(e){if(e.error=='not-allowed'||e.error=='service-not-allowed'){me.on=false;st('mic-denied');}};
  try{rec.start();}catch(e){st('err',e);}me.stop=function(){me.on=false;try{rec.stop();}catch(e){}};st('mic',c.err);return me;}
 me.on=false;st('none',c.err);return me;}
function stopListen(){if(LS&&LS.stop)LS.stop();LS={on:false};}
var LMSG={capture:'👂 وضع الاستماع: تحويل كلام الفيديو إلى نص ← ترجمة ← دبلجة (تأخير 3–6 ثوانٍ)',mic:'🎤 وضع الاستماع عبر الميكروفون (جودة أقل): يلتقط صوت السماعات',drm:'🔒 الفيديو محمي (DRM) — لا يمكن التقاط صوته',cors:'🔒 الفيديو من مصدر خارجي يمنع التقاط الصوت (CORS)',nokey:'🔑 أدخل مفتاح OpenAI في الإعدادات لتحويل كلام الفيديو إلى نص',nosupport:'⚠️ المتصفح لا يدعم التقاط صوت الفيديو',noaudio:'⚠️ لا يوجد مسار صوت قابل للالتقاط',none:'⚠️ لا يمكن الاستماع: لا التقاط للصوت ولا ميكروفون مدعوم','mic-denied':'🎤 تم رفض إذن الميكروفون','stt-error':'⚠️ فشل تحويل الكلام إلى نص (المفتاح/الشبكة/الرصيد)'};
W.QOTTS={voices:V,speak:speak,cancel:cancel,chunk:chunk,url:url,byId:byId,forLang:forLang,waitVoices:waitVoices,isOn:function(id){return /^g:/.test(id||'');},speaking:function(){return !!cur;},cfg:DC,duck:duck,listen:listen,stopListen:stopListen,listening:function(){return LS;},LMSG:LMSG,capture:capture,dedup:dedup,bigVideo:bigVideo,translate:translate,isAr:isAr,tcache:TC,fitRate:fitRate,estDur:estDur,mode:function(){return !waBad&&DC.base&&(W.AudioContext||W.webkitAudioContext)?'webaudio':'duck-only';},stats:stats,ac:function(){return AC;}};
})(window);
