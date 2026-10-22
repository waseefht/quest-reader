/*QOTTS*//* QOTTS: online female TTS via Google Translate (no API key), played with <audio referrerPolicy=no-referrer>. Used when speechSynthesis has no voices (e.g. Meta Quest Browser). */
(function(W){if(W.QOTTS)return;
var V=[{id:'g:ar',name:'صوت نسائي عربي (إنترنت)',lang:'ar',tl:'ar',r:1},{id:'g:ar-slow',name:'صوت نسائي عربي بطيء (إنترنت)',lang:'ar',tl:'ar',r:0.85},{id:'g:en-US',name:'صوت نسائي إنجليزي أمريكي (إنترنت)',lang:'en-US',tl:'en-US',r:1},{id:'g:en-GB',name:'صوت نسائي إنجليزي بريطاني (إنترنت)',lang:'en-GB',tl:'en-GB',r:1},{id:'g:en-AU',name:'صوت نسائي إنجليزي أسترالي (إنترنت)',lang:'en-AU',tl:'en-AU',r:1}];
function url(t,tl){return 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl='+encodeURIComponent(tl)+'&q='+encodeURIComponent(t);}
function chunk(t,n){n=n||180;t=String(t).replace(/\s+/g,' ').trim();var out=[];while(t.length>n){var s=t.slice(0,n),c=Math.max(s.search(/[.!?؟؛،,][^.!?؟؛،,]*$/)+1,0);if(c<40)c=s.lastIndexOf(' ');if(c<20)c=n;out.push(t.slice(0,c).trim());t=t.slice(c).trim();}if(t)out.push(t);return out;}
function mk(u){var a=new Audio();a.referrerPolicy='no-referrer';try{a.setAttribute('referrerpolicy','no-referrer');}catch(e){}a.preload='auto';if(u)a.src=u;return a;}
var cur=null,job=0,DC={duck:75,blend:40,spatial:true,base:W.__QSR_TTSBASE||''},AC=null,CH=null,waBad=false,stats={wa:0,plain:0,resumedVideo:0,resumedSelf:0,ssResumed:0,ssRequeued:0};
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
/* ---- conflict-free playback: ONE persistent <audio> (or AudioContext buffers), media-session guard, video auto-resume; never pauses the video ---- */
var PA=null,PRE=null,ourStop=false,ourStart=0,userAt=0,curSrc=null,guarded=new WeakSet();
['pointerdown','keydown','touchstart'].forEach(function(e){W.addEventListener(e,function(){userAt=Date.now();},true);});
function pa(){if(!PA){PA=mk(null);PA.muted=false;PA.autoplay=false;PA.setAttribute('data-qotts','1');PA.addEventListener('pause',function(){if(!ourStop&&cur===PA&&!PA.ended&&PA.src){setTimeout(function(){if(cur===PA&&PA.paused&&!ourStop){var p=PA.play();p&&p.catch&&p.catch(function(){});stats.resumedSelf++;}},120);}});}return PA;}
function preload(u){if(!PRE){PRE=mk(null);PRE.muted=true;}try{PRE.src=u;PRE.load();}catch(e){}}
function msess(v){var ms=navigator.mediaSession;if(!ms)return;try{ms.setActionHandler('play',function(){if(v&&v.paused)v.play().catch(function(){});});ms.setActionHandler('pause',function(){/* ignore: do not let our voice hijack pause */});}catch(e){}}
function guardVideo(v){if(!v||guarded.has(v))return;guarded.add(v);v.addEventListener('pause',function(){var now=Date.now(),act=cur||SSW.u||(W.QOTTS&&W.QOTTS._dv===v);if(!act&&now-ourStart>=300)return;if(now-userAt<1000)return;{stats.resumedVideo++;setTimeout(function(){if(v.paused&&Date.now()-userAt>1000)v.play().catch(function(){});},60);}});}
/* speechSynthesis watchdog (Chrome Android pauses/drops utterances) */
var SSW={u:null,t:0};
function ssSpeak(SS,u,v){if(v)guardVideo(v);var ended=false,mk2=function(){var c=new SpeechSynthesisUtterance(u.text);['voice','lang','rate','pitch','volume','onstart','onend','onerror'].forEach(function(k){c[k]=u[k];});return c;},oe=u.onend,ox=u.onerror,tries=0;
 function fin(){ended=true;if(SSW.u===u){SSW.u=null;clearInterval(SSW.t);}}
 u.onend=function(e){fin();oe&&oe(e);};u.onerror=function(e){fin();ox&&ox(e);};SSW.u=u;ourStart=Date.now();clearInterval(SSW.t);var idle=0;
 SSW.t=setInterval(function(){if(ended||SSW.u!==u){clearInterval(SSW.t);return;}if(SS.paused){SS.resume();stats.ssResumed++;}if(!SS.speaking&&!SS.pending){if(++idle>=2&&tries<2){tries++;idle=0;var c=mk2();c.onend=u.onend;c.onerror=u.onerror;SS.speak(c);stats.ssRequeued++;}}else idle=0;},700);
 SS.speak(u);}
function cancel(){job++;ourStop=true;if(cur&&cur.stop){try{cur.stop();}catch(e){}}else if(cur){try{cur.pause();}catch(e){}}ourStop=false;cur=null;if(W.QOTTS&&W.QOTTS._dv){duck(W.QOTTS._dv,false);W.QOTTS._dv=null;}}
function speak(text,o){o=o||{};cancel();var my=job,v=byId(o.voice)||forLang(o.lang||'ar'),parts=chunk(text),i=0,rate=(+o.rate||1)*v.r,nextB=null,vid=o.video||(o.duck!==false?bigVideo():null),useWA=!waBad&&!!DC.base&&!!ac()&&AC.state=='running';
 var lg=v.lang.slice(0,2),avail=0;if(o.cue&&vid){avail=(o.cue.end-vid.currentTime)/(vid.playbackRate||1);rate=fitRate(text,lg,avail,rate);}
 W.QOTTS._dv=vid;if(vid){guardVideo(vid);duck(vid,true);}msess(vid);if(useWA)setBlend(vid);
 function src(t){return useWA?DC.base.replace(/\/+$/,'')+'/__tts?tl='+encodeURIComponent(v.tl)+'&q='+encodeURIComponent(t):url(t,v.tl);}
 function done(){if(my==job){cur=null;if(vid)duck(vid,false);W.QOTTS._dv=null;o.onend&&o.onend();}}
 function failAll(e){if(my!=job)return;cur=null;if(vid)duck(vid,false);o.onerror?o.onerror(e&&e.name||'net'):done();}
 function buf(t){return fetch(src(t),{credentials:'omit',referrerPolicy:'no-referrer'}).then(function(r){if(!r.ok)throw new Error('http '+r.status);return r.arrayBuffer();}).then(function(ab){return new Promise(function(res,rej){AC.decodeAudioData(ab,res,rej);});});}
 function playWA(p){p.then(function(b){if(my!=job)return;if(i+1<parts.length)nextB=buf(parts[i+1]);var n=AC.createBufferSource();n.buffer=b;n.playbackRate.value=Math.max(0.5,Math.min(2,rate));
   if(o.cue&&vid&&parts.length==1&&avail>0){rate=Math.max(0.9,Math.min(1.6,Math.max(rate,b.duration/avail)));n.playbackRate.value=rate;}
   chain();n.connect(CH.inp);n.onended=function(){if(my!=job||cur!==n)return;i++;if(i>=parts.length)return done();var q=nextB;nextB=null;playWA(q||buf(parts[i]));};cur=n;ourStart=Date.now();stats.wa++;n.start();},
  function(e){if(my!=job)return;waBad=true;useWA=false;playEl();});}
 function playEl(){if(my!=job)return;var a=pa(),u=src(parts[i]);cur=a;a.onended=function(){if(my!=job||cur!==a)return;i++;if(i>=parts.length)return done();playEl();};a.onerror=function(){if(cur===a&&my==job)failAll();};
  a.onloadedmetadata=o.cue&&vid&&parts.length==1?function(){if(isFinite(a.duration)&&avail>0){rate=Math.max(0.9,Math.min(1.6,Math.max(rate,a.duration/avail)));a.playbackRate=rate;}}:null;
  a.src=u;a.playbackRate=Math.max(0.5,Math.min(2,rate));try{a.defaultPlaybackRate=a.playbackRate;}catch(e){}ourStart=Date.now();stats.plain++;if(i+1<parts.length)preload(src(parts[i+1]));
  var p=a.play();if(p&&p.catch)p.catch(function(e){if(e&&e.name=='AbortError')return;failAll(e);});}
 if(!parts.length)return done();W.QOTTS.lastUrl=src(parts[0]);W.QOTTS.lastRate=rate;if(useWA)playWA(buf(parts[0]));else playEl();}
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
W.QOTTS={voices:V,speak:speak,cancel:cancel,chunk:chunk,url:url,byId:byId,forLang:forLang,waitVoices:waitVoices,isOn:function(id){return /^g:/.test(id||'');},speaking:function(){return !!cur||!!SSW.u;},cfg:DC,duck:duck,ssSpeak:ssSpeak,guardVideo:guardVideo,audioEl:function(){return PA;},listen:listen,stopListen:stopListen,listening:function(){return LS;},LMSG:LMSG,capture:capture,dedup:dedup,bigVideo:bigVideo,translate:translate,isAr:isAr,tcache:TC,fitRate:fitRate,estDur:estDur,mode:function(){return !waBad&&DC.base&&(W.AudioContext||W.webkitAudioContext)?'webaudio':'duck-only';},stats:stats,ac:function(){return AC;}};
})(window);/*/QOTTS*/
(function R(){
if(window.__QSR){window.__QSR.toggle();return;}window.__QSR_RUN=R;
var W=window,D=document,SS=W.speechSynthesis,K='qsr_cfg';
var cfg={listen:true,sttKey:'',sttModel:'gpt-4o-mini-transcribe',srcLang:'en-US',dub:true,showAr:true,fs:28,duck:75,blend:40,spatial:true,x:40,y:W.innerHeight*0.6,w:Math.min(900,W.innerWidth-80),h:160,on:true,rate:1.1,voice:'',mode:'interrupt',ocr:false,min:false,region:true};
if(W.__QSR_DEF)Object.assign(cfg,W.__QSR_DEF);try{Object.assign(cfg,JSON.parse(localStorage.getItem(K)||'{}'));}catch(e){}
var HID=!!W.__QSR_HIDDEN;if(W.__QSR_AUTO||HID){cfg.region=false;}if(HID){cfg.on=true;cfg.ocr=false;cfg.min=false;}
function save(){try{localStorage.setItem(K,JSON.stringify(cfg));}catch(e){}}
var css='#qsr{position:fixed;z-index:2147483647;border:3px dashed rgba(88,166,255,.8);background:rgba(88,166,255,.06);border-radius:10px;box-sizing:border-box;pointer-events:none;font:18px system-ui,Tahoma,sans-serif;direction:rtl}'+
'#qsr *{box-sizing:border-box}#qsr .bar{position:absolute;top:-62px;right:0;left:0;min-width:320px;height:58px;display:flex;gap:6px;align-items:center;background:rgba(17,20,24,.92);color:#fff;border-radius:12px;padding:4px 8px;pointer-events:auto;cursor:move;touch-action:none;overflow-x:auto}'+
'#qsr button,#qsr select{pointer-events:auto;min-height:46px;min-width:46px;font-size:20px;border-radius:10px;border:1px solid #556;background:#262c34;color:#fff;cursor:pointer}#qsr select{max-width:170px;font-size:15px}#qsr input{pointer-events:auto;width:90px;height:36px}'+
'#qsr .h{position:absolute;pointer-events:auto;touch-action:none;background:rgba(88,166,255,.35)}#qsr .msg{position:absolute;bottom:4px;right:8px;left:8px;color:#fff;text-shadow:0 0 4px #000;font-size:16px;pointer-events:none}'+
'#qsr.min{height:0!important;border:0}#qsr.min .h,#qsr.min .msg,#qsr.min .x{display:none}#qsr.off{border-color:rgba(200,80,80,.8)}';
var st=D.createElement('style');st.textContent=css;
var box=D.createElement('div');box.id='qsr';
box.innerHTML='<div class="bar"><button data-a="on" title="تشغيل/إيقاف">🔊</button><span style="font-size:22px;padding:0 6px">✥</span><span class="x"><select data-a="voice"></select> <input type="range" min="0.5" max="2" step="0.1" data-a="rate" title="السرعة"> <button data-a="mode" title="مقاطعة/طابور"></button> <button data-a="region" title="تقييد القراءة بمنطقة الصندوق">🎯</button> <button data-a="ocr" title="OCR للترجمة المحروقة">🔍</button> <label title="خفض صوت الفيديو أثناء الكلام">🔉<input type="range" min="0" max="100" data-a="duck"></label> <label title="الدمج مع صوت الفيديو">🎚️<input type="range" min="0" max="100" data-a="blend"></label> <button data-a="spatial" title="صوت مكاني/دمج متقدم">🎧</button> <button data-a="dub" title="دبلجة عربية / قراءة الأصل"></button> <button data-a="showAr" title="إظهار النص العربي">🔤</button> <button data-a="fs" title="حجم الخط">A±</button> <button data-a="tpage" title="ترجمة الصفحة">🌐</button> <button data-a="listen" title="وضع الاستماع (بلا ترجمة نصية)">👂</button></span><button data-a="min" title="تصغير">▁</button><button data-a="close" title="إغلاق">✕</button></div><div class="msg"></div>';
var hs=['n','s','e','w','ne','nw','se','sw'],S=34;
hs.forEach(function(d){var h=D.createElement('div');h.className='h';h.dataset.d=d;var s=h.style;
 if(d.indexOf('n')>=0)s.top=-S/2+'px';if(d.indexOf('s')>=0)s.bottom=-S/2+'px';if(d.indexOf('e')>=0)s.right=-S/2+'px';if(d.indexOf('w')>=0)s.left=-S/2+'px';
 if(d=='n'||d=='s'){s.left='30px';s.right='30px';s.height=S+'px';}else if(d=='e'||d=='w'){s.top='30px';s.bottom='30px';s.width=S+'px';}else{s.width=S+'px';s.height=S+'px';s.borderRadius='50%';}
 s.cursor=d+'-resize';box.appendChild(h);});
var $=function(a){return box.querySelector('[data-a="'+a+'"]');},msgEl=box.querySelector('.msg');
function msg(t){msgEl.textContent=t||'';}
function toast(t){if(W.__QSR_NOTOAST)return;var e=D.createElement('div');e.textContent=t;e.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2147483647;background:rgba(0,0,0,.75);color:#fff;font:16px sans-serif;padding:6px 14px;border-radius:14px;pointer-events:none;transition:opacity .6s;opacity:1';
 var p=D.fullscreenElement||D.webkitFullscreenElement||D.body;if(p.tagName=='VIDEO')p=p.parentNode||D.body;p.appendChild(e);setTimeout(function(){e.style.opacity='0';},800);setTimeout(function(){e.remove();},1450);}
function confirmSay(t){toast(t);if(useOn('ar')){Q.cancel();Q.speak(t,{voice:onId('ar'),rate:cfg.rate});return;}var u=new SpeechSynthesisUtterance(t);u.lang='ar-SA';var v=pick('ar');if(v)u.voice=v;SS.cancel();SS.speak(u);}
function place(){cfg.w=Math.max(160,cfg.w);cfg.h=Math.max(50,cfg.h);cfg.x=Math.min(Math.max(0,cfg.x),W.innerWidth-60);cfg.y=Math.min(Math.max(62,cfg.y),W.innerHeight-30);
 var s=box.style;s.left=cfg.x+'px';s.top=cfg.y+'px';s.width=cfg.w+'px';s.height=cfg.h+'px';
 box.classList.toggle('min',cfg.min);box.classList.toggle('off',!cfg.on);$('on').textContent=cfg.on?'🔊':'🔇';$('mode').textContent=cfg.mode=='queue'?'⏭️طابور':'⚡مقاطعة';$('ocr').style.background=cfg.ocr?'#1f6feb':'';$('region').style.background=cfg.region?'#1f6feb':'';$('rate').value=cfg.rate;$('duck').value=cfg.duck;$('blend').value=cfg.blend;$('spatial').style.background=cfg.spatial?'#1f6feb':'';$('dub').textContent=cfg.dub?'🇸🇦دبلجة':'🗣️الأصل';$('showAr').style.background=cfg.showAr?'#1f6feb':'';$('listen').style.background=cfg.listen?'#1f6feb':'';}
function mount(){if(HID)return;var p=D.fullscreenElement||D.webkitFullscreenElement||D.body;if(p.tagName=='VIDEO')p=p.parentNode||D.body;if(box.parentNode!==p){p.appendChild(st);p.appendChild(box);}}
var drag=null;
box.addEventListener('pointerdown',function(e){var t=e.target,d=t.dataset&&t.dataset.d;if(!d&&(!t.closest||!t.closest('.bar')||/^(BUTTON|SELECT|INPUT|OPTION)$/.test(t.tagName)))return;
 drag={d:d||'move',sx:e.clientX,sy:e.clientY,o:{x:cfg.x,y:cfg.y,w:cfg.w,h:cfg.h}};try{t.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();e.stopPropagation();},true);
box.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.sx,dy=e.clientY-drag.sy,o=drag.o,d=drag.d;
 if(d=='move'){cfg.x=o.x+dx;cfg.y=o.y+dy;}else{if(d.indexOf('e')>=0)cfg.w=o.w+dx;if(d.indexOf('s')>=0)cfg.h=o.h+dy;if(d.indexOf('w')>=0){cfg.x=o.x+dx;cfg.w=o.w-dx;}if(d.indexOf('n')>=0){cfg.y=o.y+dy;cfg.h=o.h-dy;}}place();},true);
function endDrag(){if(drag){drag=null;save();}}
box.addEventListener('pointerup',endDrag,true);box.addEventListener('pointercancel',endDrag,true);
var voices=[],Q=W.QOTTS,T0=Date.now();function dsync(){Q.cfg.duck=+cfg.duck;Q.cfg.blend=+cfg.blend;Q.cfg.spatial=!!cfg.spatial;}dsync();
function loadVoices(){voices=SS?SS.getVoices():[];var sel=$('voice');sel.innerHTML='<option value="">تلقائي حسب اللغة</option>'+voices.map(function(v,i){return '<option value="'+v.voiceURI.replace(/"/g,'')+'">'+v.name+' ('+v.lang+')</option>';}).join('')+Q.voices.map(function(v){return '<option value="'+v.id+'">'+v.name+'</option>';}).join('');sel.value=cfg.voice;if(sel.selectedIndex<0)sel.value='';}
function onId(lg){var o=Q.byId(cfg.voice);return o&&o.lang.slice(0,2)==lg?o.id:Q.forLang(lg).id;}
function useOn(lg){if(!SS||!voices.length)return true;var o=Q.byId(cfg.voice);if(o&&o.lang.slice(0,2)==lg)return true;return !pick(lg);}
function lang(t){var a=(t.match(/[\u0600-\u06FF]/g)||[]).length,l=(t.match(/[A-Za-z]/g)||[]).length;return a>=l&&a>0?'ar':'en';}
function pick(lg){if(cfg.voice){var v=voices.filter(function(v){return v.voiceURI==cfg.voice;})[0];if(v&&v.lang.toLowerCase().indexOf(lg)==0)return v;}
 var F=/female|woman|zira|samantha|aria|jenny|hoda|salma|zariyah|amira|laila|layla|mona|hala|karen|victoria|susan|sara/i;return voices.filter(function(v){return v.lang.toLowerCase().indexOf(lg)==0&&F.test(v.name);})[0]||null;}/* female only: otherwise the online female voice is used */
var last='',lastT=0,warned=false;
function clean(t){var e=D.createElement('div');e.innerHTML=String(t).replace(/<[^>]*>/g,' ');return (e.textContent||'').replace(/\s+/g,' ').trim();}
var subEl=null,subT=0,seq=0;
function showSub(t,v,cx){if(!cfg.showAr){if(subEl)subEl.style.display='none';return;}if(!subEl){subEl=D.createElement('div');subEl.dir='rtl';subEl.style.cssText='position:fixed;z-index:2147483647;left:0;text-align:center;pointer-events:none;color:#fff;font-family:Tahoma,system-ui,sans-serif;text-shadow:0 0 4px #000,0 0 8px #000;line-height:1.35;padding:0 4%;box-sizing:border-box';}
 var p=D.fullscreenElement||D.webkitFullscreenElement||D.body;if(p.tagName=='VIDEO')p=p.parentNode||D.body;if(subEl.parentNode!==p)p.appendChild(subEl);
 v=v||Q.bigVideo&&Q.bigVideo();var r=v?v.getBoundingClientRect():{left:0,width:W.innerWidth,bottom:W.innerHeight};if(!r.width)r={left:0,width:W.innerWidth,bottom:W.innerHeight};
 subEl.style.left=r.left+'px';subEl.style.width=r.width+'px';subEl.style.top='auto';subEl.style.bottom=Math.max(8,W.innerHeight-r.bottom+r.width*0.0+40)+'px';subEl.style.fontSize=cfg.fs+'px';subEl.textContent=t;subEl.style.display='';
 clearTimeout(subT);var ms=cx&&cx.end&&v?Math.max(1500,(cx.end-v.currentTime)*1000+400):Math.max(2500,t.length*90);subT=setTimeout(function(){subEl.style.display='none';},ms);}
function prefetch(tr){if(!cfg.dub||!tr.cues)return;var ac=tr.activeCues&&tr.activeCues[0],t0=ac?ac.endTime:0,out=[];for(var i=0;i<tr.cues.length&&out.length<3;i++){var c=tr.cues[i];if(c.startTime>=t0){var x=clean(c.text);if(x&&!Q.isAr(x))out.push(x);}}if(out.length)Q.translate(out,'ar').catch(function(){});}
var capAt=0,playT=0,lastTick=0;function lstat(k,x){var m=Q.LMSG[k];if(k=='mic'&&x)m=Q.LMSG[x]+' — '+m;if(m){msg(m);if(HID)toast(m);}}
function listenTick(){var v=Q.bigVideo();var now=Date.now(),dt=lastTick?now-lastTick:0;lastTick=now;if(!v||v.paused||!cfg.on){return;}if(Q.listening().on)return;if(!cfg.listen)return;playT+=dt;if(Date.now()-capAt<8000||playT<8000)return;startListen(v);}
function startListen(v){v=v||Q.bigVideo();if(!v){msg('لا يوجد فيديو');return;}Q.listen(v,{key:cfg.sttKey,model:cfg.sttModel,srcLang:cfg.srcLang,onStatus:lstat,onText:function(t,cx){if(v.paused)return;W.__QSR&&W.__QSR.log.push({heard:t});last='';speak(t,'listen',{video:v});}});}
function speak(t,src,cx){cx=cx||{};t=clean(t);if(!t||!cfg.on)return;if(src!='listen'){capAt=Date.now();playT=0;if(Q.listening().on)Q.stopListen();}var now=Date.now();if(t==last&&now-lastT<8000)return;last=t;lastT=now;var my=++seq;
 if(cfg.dub&&!Q.isAr(t)){Q.translate(t,'ar').then(function(a){if(my!=seq)return;W.__QSR&&W.__QSR.log.push({orig:t,ar:a});showSub(a,cx.video,cx);say(a,src,cx);},function(){if(my!=seq)return;msg('⚠️ تعذّرت الترجمة — قراءة النص الأصلي');say(t,src,cx);});return;}
 if(cfg.dub&&cfg.showAr)showSub(t,cx.video,cx);say(t,src,cx);}
function say(t,src,cx){
 var lg=lang(t);if(useOn(lg)){if(cfg.mode!='queue'||!Q.speaking()){Q.cancel();if(SS)SS.cancel();Q.speak(t,{voice:onId(lg),rate:cfg.rate,video:cx.video,cue:cx.end?cx:null,onerror:function(){var v=pick(lg);if(v){var u=new SpeechSynthesisUtterance(t);u.voice=v;u.lang=v.lang;u.rate=+cfg.rate;SS.speak(u);}else msg('⚠️ تعذّر تشغيل الصوت عبر الإنترنت');}});}msg('🌐 '+t.slice(0,80));W.__QSR.log.push({t:t,src:src,lang:lg,online:1,rate:Q.lastRate,mode:Q.mode()});return;}
 var u=new SpeechSynthesisUtterance(t),v=pick(lg);u.lang=v?v.lang:(lg=='ar'?'ar-SA':'en-US');if(v)u.voice=v;u.rate=+cfg.rate;
 var dv=cx.video||null;if(cx.end&&dv){u.rate=Q.fitRate(t,lg,(cx.end-dv.currentTime)/(dv.playbackRate||1),cfg.rate);}u.onstart=function(){Q.duck(dv,true);};u.onend=function(){Q.duck(dv,false);};
 u.onerror=function(e){Q.duck(dv,false);if(e&&e.error=='interrupted'||e&&e.error=='canceled')return;Q.speak(t,{voice:onId(lg),rate:cfg.rate});};
 if(!v&&lg=='ar'&&!warned){warned=true;msg('⚠️ لا يوجد صوت عربي مثبّت على الجهاز، قد لا تُقرأ العربية.');}
 if(cfg.mode!='queue')SS.cancel();Q.ssSpeak(SS,u,dv);if(!warned)msg('🗨️ '+t.slice(0,80));W.__QSR.log.push({t:t,src:src,lang:u.lang});}
function translatePage(){var L=location,h=L.hostname,tl='ar';if(/\.translate\.goog$/.test(h)){msg('الصفحة مترجمة بالفعل');return;}if(L.protocol!='https:'){L.href='https://translate.google.com/translate?sl=auto&tl='+tl+'&u='+encodeURIComponent(L.href);return;}var q=L.search?L.search+'&':'?';L.href='https://'+h.replace(/-/g,'--').replace(/\./g,'-')+'.translate.goog'+L.pathname+q+'_x_tr_sl=auto&_x_tr_tl='+tl+'&_x_tr_hl='+tl+'&_x_tr_pto=wapp'+L.hash;}
var bound=new WeakSet();
function cueText(tr){var c=tr.activeCues,a=[];if(!c)return '';for(var i=0;i<c.length;i++)a.push(c[i].text);return a.join(' ');}
function bindVideos(){D.querySelectorAll('video').forEach(function(v){if(bound.has(v))return;bound.add(v);
 function hook(tr){if(tr.__qsr||!/subtitles|captions/.test(tr.kind))return;tr.__qsr=1;if(tr.mode=='disabled')tr.mode='hidden';tr.addEventListener('cuechange',function(){if(tr.mode=='disabled')return;var c=tr.activeCues&&tr.activeCues[0];prefetch(tr);speak(cueText(tr),'track',c?{video:v,start:c.startTime,end:c.endTime}:{video:v});});}
 for(var i=0;i<v.textTracks.length;i++)hook(v.textTracks[i]);v.textTracks.addEventListener('addtrack',function(e){hook(e.track);});});}
var SEL='.ytp-caption-segment,.player-timedtext-text-container,.player-timedtext span,[class*="caption"],[class*="subtitle"],[class*="Subtitle"],[class*="Caption"],.vjs-text-track-display,.jw-text-track-cue,.shaka-text-container';
function overlaps(r,b){return r.width>0&&r.height>0&&r.right>b.left&&r.left<b.right&&r.bottom>b.top&&r.top<b.bottom;}
function domScan(){if(!cfg.on||(cfg.min&&cfg.region))return;var b=box.getBoundingClientRect(),seen=new Set(),out=[];
 function take(el){if(!el||box.contains(el)||el===box)return;for(var p=el.parentElement;p;p=p.parentElement)if(seen.has(p))return;var t=(el.innerText||el.textContent||'').trim();if(!t||t.length>400)return;var rr=el.getBoundingClientRect();if(cfg.region?!overlaps(rr,b):!(rr.width>0&&rr.height>0))return;seen.add(el);out.push(t);}
 var known=D.querySelectorAll('.ytp-caption-segment,.player-timedtext-text-container');
 if(known.length)known.forEach(take);else{D.querySelectorAll(SEL).forEach(function(el){if(!el.querySelector(SEL))take(el);});
  if(!out.length&&cfg.region){for(var i=1;i<=4;i++)for(var j=1;j<=2;j++){var els=D.elementsFromPoint(b.left+b.width*i/5,b.top+b.height*j/3);for(var k=0;k<els.length;k++){var e=els[k];if(box.contains(e)||/^(HTML|BODY|VIDEO|CANVAS|IFRAME)$/.test(e.tagName))continue;if(e.children.length<=3&&(e.innerText||'').trim().length<300){take(e);break;}}}}}
 var t=out.join(' ').replace(/\s+/g,' ').trim();if(t&&t!=domLast){domLast=t;speak(t,'dom');}else if(!t)domLast='';}
var domLast='',tm=0;
var mo=new MutationObserver(function(){if(tm)return;tm=setTimeout(function(){tm=0;bindVideos();domScan();},120);});
var ocrW=null,ocrBusy=false,ocrTimer=0,cv=D.createElement('canvas'),cx=cv.getContext('2d');
function loadTess(cb){if(W.Tesseract)return cb();msg('⏳ تحميل OCR (Tesseract.js)…');var s=D.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=cb;s.onerror=function(){msg('❌ تعذّر تحميل Tesseract.js (قد تمنعه سياسة CSP للموقع).');cfg.ocr=false;place();};D.head.appendChild(s);}
function ocrTick(){if(!cfg.ocr||ocrBusy||!cfg.on)return;var b=box.getBoundingClientRect(),v=[].filter.call(D.querySelectorAll('video'),function(v){return overlaps(v.getBoundingClientRect(),b)&&v.videoWidth;})[0];
 if(!v){msg('لا يوجد فيديو تحت الصندوق.');return;}var r=v.getBoundingClientRect(),sx=v.videoWidth/r.width,sy=v.videoHeight/r.height,
 x=Math.max(0,b.left-r.left)*sx,y=Math.max(0,b.top-r.top)*sy,w=Math.min(b.right,r.right)-Math.max(b.left,r.left),h=Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top);
 if(w<5||h<5)return;cv.width=w*sx;cv.height=h*sy;
 try{cx.drawImage(v,x,y,w*sx,h*sy,0,0,cv.width,cv.height);cx.getImageData(0,0,1,1);}catch(e){msg('🔒 لا يمكن قراءة صورة الفيديو (حماية DRM أو مصدر خارجي). OCR غير متاح في هذا الموقع.');cfg.ocr=false;place();return;}
 ocrBusy=true;ocrW.recognize(cv).then(function(r){var t=(r.data.text||'').replace(/\s+/g,' ').trim();if(t.length>2&&(r.data.confidence||100)>55)speak(t,'ocr');}).catch(function(){}).then(function(){ocrBusy=false;});}
function startOcr(){if(!cfg.ocr){clearInterval(ocrTimer);return;}loadTess(function(){if(ocrW){go();return;}W.Tesseract.createWorker('ara+eng').then(function(w){ocrW=w;msg('✅ OCR جاهز');go();}).catch(function(){msg('❌ فشل تشغيل OCR (ربما بسبب CSP).');});});
 function go(){clearInterval(ocrTimer);ocrTimer=setInterval(ocrTick,700);}}
box.addEventListener('click',function(e){var a=e.target.dataset&&e.target.dataset.a;if(!a)return;e.stopPropagation();
 if(a=='on'){cfg.on=!cfg.on;if(!cfg.on&&SS)SS.cancel();}else if(a=='mode')cfg.mode=cfg.mode=='queue'?'interrupt':'queue';else if(a=='min')cfg.min=!cfg.min;else if(a=='region'){cfg.region=!cfg.region;msg(cfg.region?'🎯 القراءة داخل الصندوق فقط':'🌐 القراءة التلقائية لكل الترجمات');}else if(a=='ocr'){cfg.ocr=!cfg.ocr;startOcr();}else if(a=='dub'){cfg.dub=!cfg.dub;msg(cfg.dub?'🇸🇦 دبلجة عربية: تُترجم الترجمة وتُقرأ بالعربية':'🗣️ قراءة النص الأصلي');}else if(a=='showAr'){cfg.showAr=!cfg.showAr;if(!cfg.showAr&&subEl)subEl.style.display='none';}else if(a=='fs'){cfg.fs=cfg.fs>=44?20:cfg.fs+6;if(subEl)subEl.style.fontSize=cfg.fs+'px';msg('حجم الخط '+cfg.fs);}else if(a=='listen'){cfg.listen=!cfg.listen;if(cfg.listen){startListen();}else{Q.stopListen();msg('👂 وضع الاستماع متوقف');}}else if(a=='tpage'){translatePage();return;}else if(a=='spatial'){cfg.spatial=!cfg.spatial;dsync();}else if(a=='close'){api.destroy();return;}place();save();},true);
$('voice').addEventListener('change',function(){cfg.voice=this.value;save();});$('rate').addEventListener('input',function(){cfg.rate=+this.value;save();});['duck','blend'].forEach(function(k){$(k).addEventListener('input',function(){cfg[k]=+this.value;dsync();save();});});
function onFs(){mount();}
var api=W.__QSR={msg:msg,place:place,log:[],speak:speak,cfg:cfg,toggle:function(){if(HID&&W.__QSR_UNI&&Date.now()-T0<3000){api.destroy();W.__QSR_HIDDEN=0;W.__QSR_RUN();W.__QSR&&W.__QSR.msg('📦 وضع الصندوق — اضغط الإضافة مرة أخرى لإخفائه');return;}if(HID){api.destroy();confirmSay('تم الإيقاف');return;}box.style.display=box.style.display=='none'?'':'none';},
 destroy:function(){mo.disconnect();clearInterval(ocrTimer);clearInterval(poll);if(SS)SS.cancel();Q.cancel();Q.stopListen();if(subEl)subEl.remove();box.remove();st.remove();D.removeEventListener('fullscreenchange',onFs);D.removeEventListener('webkitfullscreenchange',onFs);if(ocrW)ocrW.terminate();delete W.__QSR;}};
W.addEventListener('resize',place);D.addEventListener('fullscreenchange',onFs);D.addEventListener('webkitfullscreenchange',onFs);
mount();place();loadVoices();Q.waitVoices(SS,function(){loadVoices();if(!voices.length&&!HID)msg('🌐 لا توجد أصوات مدمجة — يُستخدم صوت نسائي عبر الإنترنت');});if(SS&&SS.addEventListener)SS.addEventListener('voiceschanged',loadVoices);
mo.observe(D.documentElement,{subtree:true,childList:true,characterData:true});var poll=setInterval(function(){bindVideos();domScan();listenTick();},1000);bindVideos();
if(cfg.ocr)startOcr();if(HID){var said=0,hi=function(){if(said++)return;confirmSay(W.__QSR_UNI?'تم التشغيل. اضغط مرة ثانية فورًا لفتح الصندوق':'تم التشغيل');};if(SS&&!SS.getVoices().length)Q.waitVoices(SS,function(){loadVoices();hi();});else hi();}else msg('✅ قارئ الترجمة يعمل — ضع الصندوق فوق الترجمة');
})();
