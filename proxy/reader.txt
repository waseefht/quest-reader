/*QOTTS*//* QOTTS: online female TTS via Google Translate (no API key), played with <audio referrerPolicy=no-referrer>. Used when speechSynthesis has no voices (e.g. Meta Quest Browser). */
(function(W){if(W.QOTTS)return;
var V=[{id:'g:ar',name:'صوت نسائي عربي (إنترنت)',lang:'ar',tl:'ar',r:1},{id:'g:ar-slow',name:'صوت نسائي عربي بطيء (إنترنت)',lang:'ar',tl:'ar',r:0.85},{id:'g:en-US',name:'صوت نسائي إنجليزي أمريكي (إنترنت)',lang:'en-US',tl:'en-US',r:1},{id:'g:en-GB',name:'صوت نسائي إنجليزي بريطاني (إنترنت)',lang:'en-GB',tl:'en-GB',r:1},{id:'g:en-AU',name:'صوت نسائي إنجليزي أسترالي (إنترنت)',lang:'en-AU',tl:'en-AU',r:1}];
function url(t,tl){return 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl='+encodeURIComponent(tl)+'&q='+encodeURIComponent(t);}
function chunk(t,n){n=n||180;t=String(t).replace(/\s+/g,' ').trim();var out=[];while(t.length>n){var s=t.slice(0,n),c=Math.max(s.search(/[.!?؟؛،,][^.!?؟؛،,]*$/)+1,0);if(c<40)c=s.lastIndexOf(' ');if(c<20)c=n;out.push(t.slice(0,c).trim());t=t.slice(c).trim();}if(t)out.push(t);return out;}
function mk(u){var a=new Audio();a.referrerPolicy='no-referrer';try{a.setAttribute('referrerpolicy','no-referrer');}catch(e){}a.preload='auto';a.src=u;return a;}
var cur=null,job=0;
function cancel(){job++;if(cur){try{cur.pause();cur.removeAttribute('src');cur.load();}catch(e){}cur=null;}}
function speak(text,o){o=o||{};cancel();var my=job,v=byId(o.voice)||forLang(o.lang||'ar'),parts=chunk(text),i=0,rate=(+o.rate||1)*v.r,nextA=null;
 function done(){if(my==job){cur=null;o.onend&&o.onend();}}
 function play(a){if(my!=job)return;cur=a;a.playbackRate=Math.max(0.5,Math.min(2,rate));
  a.onended=function(){if(my!=job)return;i++;a.removeAttribute('src');if(i>=parts.length)return done();play(nextA||mk(url(parts[i],v.tl)));nextA=null;};
  a.onerror=function(){if(my!=job)return;cur=null;o.onerror?o.onerror('net'):done();};
  if(i+1<parts.length){nextA=mk(url(parts[i+1],v.tl));}
  var p=a.play();if(p&&p.catch)p.catch(function(e){if(my!=job)return;o.onerror?o.onerror(e&&e.name||'play'):done();});}
 if(!parts.length)return done();play(mk(url(parts[0],v.tl)));W.QOTTS.lastUrl=url(parts[0],v.tl);}
function byId(id){for(var i=0;i<V.length;i++)if(V[i].id==id)return V[i];return null;}
function forLang(lg){lg=String(lg).toLowerCase();for(var i=0;i<V.length;i++)if(V[i].lang.toLowerCase().indexOf(lg.slice(0,2))==0)return V[i];return V[0];}
/* wait for native voices: retry now, on voiceschanged, after first tap; cb(list) once (list may be empty after ~1.5s) */
function waitVoices(SS,cb){var fired=0;function chk(force){var l=SS?SS.getVoices():[];if(fired&&!l.length)return;if(l.length||force){fired=1;cb(l);}}
 if(!SS){setTimeout(function(){cb([]);},0);return;}chk();try{SS.addEventListener('voiceschanged',function(){chk(1);});}catch(e){}
 var tap=function(){try{SS.speak(new SpeechSynthesisUtterance(''));}catch(e){}setTimeout(function(){chk(1);},300);};W.addEventListener('pointerdown',tap,{once:true,capture:true});
 setTimeout(function(){chk(1);},1500);}
W.QOTTS={voices:V,speak:speak,cancel:cancel,chunk:chunk,url:url,byId:byId,forLang:forLang,waitVoices:waitVoices,isOn:function(id){return /^g:/.test(id||'');},speaking:function(){return !!cur;}};
})(window);/*/QOTTS*/
(function(){
if(window.__QSR){window.__QSR.toggle();return;}
var W=window,D=document,SS=W.speechSynthesis,K='qsr_cfg';
var cfg={x:40,y:W.innerHeight*0.6,w:Math.min(900,W.innerWidth-80),h:160,on:true,rate:1.1,voice:'',mode:'interrupt',ocr:false,min:false,region:true};
try{Object.assign(cfg,JSON.parse(localStorage.getItem(K)||'{}'));}catch(e){}
var HID=!!W.__QSR_HIDDEN;if(W.__QSR_AUTO||HID){cfg.region=false;}if(HID){cfg.on=true;cfg.ocr=false;cfg.min=false;}
function save(){try{localStorage.setItem(K,JSON.stringify(cfg));}catch(e){}}
var css='#qsr{position:fixed;z-index:2147483647;border:3px dashed rgba(88,166,255,.8);background:rgba(88,166,255,.06);border-radius:10px;box-sizing:border-box;pointer-events:none;font:18px system-ui,Tahoma,sans-serif;direction:rtl}'+
'#qsr *{box-sizing:border-box}#qsr .bar{position:absolute;top:-62px;right:0;left:0;min-width:320px;height:58px;display:flex;gap:6px;align-items:center;background:rgba(17,20,24,.92);color:#fff;border-radius:12px;padding:4px 8px;pointer-events:auto;cursor:move;touch-action:none;overflow-x:auto}'+
'#qsr button,#qsr select{pointer-events:auto;min-height:46px;min-width:46px;font-size:20px;border-radius:10px;border:1px solid #556;background:#262c34;color:#fff;cursor:pointer}#qsr select{max-width:170px;font-size:15px}#qsr input{pointer-events:auto;width:90px;height:36px}'+
'#qsr .h{position:absolute;pointer-events:auto;touch-action:none;background:rgba(88,166,255,.35)}#qsr .msg{position:absolute;bottom:4px;right:8px;left:8px;color:#fff;text-shadow:0 0 4px #000;font-size:16px;pointer-events:none}'+
'#qsr.min{height:0!important;border:0}#qsr.min .h,#qsr.min .msg,#qsr.min .x{display:none}#qsr.off{border-color:rgba(200,80,80,.8)}';
var st=D.createElement('style');st.textContent=css;
var box=D.createElement('div');box.id='qsr';
box.innerHTML='<div class="bar"><button data-a="on" title="تشغيل/إيقاف">🔊</button><span style="font-size:22px;padding:0 6px">✥</span><span class="x"><select data-a="voice"></select> <input type="range" min="0.5" max="2" step="0.1" data-a="rate" title="السرعة"> <button data-a="mode" title="مقاطعة/طابور"></button> <button data-a="region" title="تقييد القراءة بمنطقة الصندوق">🎯</button> <button data-a="ocr" title="OCR للترجمة المحروقة">🔍</button></span><button data-a="min" title="تصغير">▁</button><button data-a="close" title="إغلاق">✕</button></div><div class="msg"></div>';
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
 box.classList.toggle('min',cfg.min);box.classList.toggle('off',!cfg.on);$('on').textContent=cfg.on?'🔊':'🔇';$('mode').textContent=cfg.mode=='queue'?'⏭️طابور':'⚡مقاطعة';$('ocr').style.background=cfg.ocr?'#1f6feb':'';$('region').style.background=cfg.region?'#1f6feb':'';$('rate').value=cfg.rate;}
function mount(){if(HID)return;var p=D.fullscreenElement||D.webkitFullscreenElement||D.body;if(p.tagName=='VIDEO')p=p.parentNode||D.body;if(box.parentNode!==p){p.appendChild(st);p.appendChild(box);}}
var drag=null;
box.addEventListener('pointerdown',function(e){var t=e.target,d=t.dataset&&t.dataset.d;if(!d&&(!t.closest||!t.closest('.bar')||/^(BUTTON|SELECT|INPUT|OPTION)$/.test(t.tagName)))return;
 drag={d:d||'move',sx:e.clientX,sy:e.clientY,o:{x:cfg.x,y:cfg.y,w:cfg.w,h:cfg.h}};try{t.setPointerCapture(e.pointerId);}catch(_){}e.preventDefault();e.stopPropagation();},true);
box.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.sx,dy=e.clientY-drag.sy,o=drag.o,d=drag.d;
 if(d=='move'){cfg.x=o.x+dx;cfg.y=o.y+dy;}else{if(d.indexOf('e')>=0)cfg.w=o.w+dx;if(d.indexOf('s')>=0)cfg.h=o.h+dy;if(d.indexOf('w')>=0){cfg.x=o.x+dx;cfg.w=o.w-dx;}if(d.indexOf('n')>=0){cfg.y=o.y+dy;cfg.h=o.h-dy;}}place();},true);
function endDrag(){if(drag){drag=null;save();}}
box.addEventListener('pointerup',endDrag,true);box.addEventListener('pointercancel',endDrag,true);
var voices=[],Q=W.QOTTS;
function loadVoices(){voices=SS?SS.getVoices():[];var sel=$('voice');sel.innerHTML='<option value="">تلقائي حسب اللغة</option>'+voices.map(function(v,i){return '<option value="'+v.voiceURI.replace(/"/g,'')+'">'+v.name+' ('+v.lang+')</option>';}).join('')+Q.voices.map(function(v){return '<option value="'+v.id+'">'+v.name+'</option>';}).join('');sel.value=cfg.voice;if(sel.selectedIndex<0)sel.value='';}
function onId(lg){var o=Q.byId(cfg.voice);return o&&o.lang.slice(0,2)==lg?o.id:Q.forLang(lg).id;}
function useOn(lg){if(!SS||!voices.length)return true;var o=Q.byId(cfg.voice);if(o&&o.lang.slice(0,2)==lg)return true;return !pick(lg);}
function lang(t){var a=(t.match(/[\u0600-\u06FF]/g)||[]).length,l=(t.match(/[A-Za-z]/g)||[]).length;return a>=l&&a>0?'ar':'en';}
function pick(lg){if(cfg.voice){var v=voices.filter(function(v){return v.voiceURI==cfg.voice;})[0];if(v&&v.lang.toLowerCase().indexOf(lg)==0)return v;}
 var F=/female|woman|zira|samantha|aria|jenny|hoda|salma|zariyah|amira|laila|layla|mona|hala|karen|victoria|susan|sara/i;return voices.filter(function(v){return v.lang.toLowerCase().indexOf(lg)==0&&F.test(v.name);})[0]||voices.filter(function(v){return v.lang.toLowerCase().indexOf(lg)==0&&v.localService;})[0]||voices.filter(function(v){return v.lang.toLowerCase().indexOf(lg)==0;})[0]||null;}
var last='',lastT=0,warned=false;
function clean(t){var e=D.createElement('div');e.innerHTML=String(t).replace(/<[^>]*>/g,' ');return (e.textContent||'').replace(/\s+/g,' ').trim();}
function speak(t,src){t=clean(t);if(!t||!cfg.on)return;var now=Date.now();if(t==last&&now-lastT<8000)return;last=t;lastT=now;
 var lg=lang(t);if(useOn(lg)){if(cfg.mode!='queue'||!Q.speaking()){Q.cancel();if(SS)SS.cancel();Q.speak(t,{voice:onId(lg),rate:cfg.rate,onerror:function(){var v=pick(lg);if(v){var u=new SpeechSynthesisUtterance(t);u.voice=v;u.lang=v.lang;u.rate=+cfg.rate;SS.speak(u);}else msg('⚠️ تعذّر تشغيل الصوت عبر الإنترنت');}});}msg('🌐 '+t.slice(0,80));W.__QSR.log.push({t:t,src:src,lang:lg,online:1});return;}
 var u=new SpeechSynthesisUtterance(t),v=pick(lg);u.lang=v?v.lang:(lg=='ar'?'ar-SA':'en-US');if(v)u.voice=v;u.rate=+cfg.rate;
 u.onerror=function(e){if(e&&e.error=='interrupted'||e&&e.error=='canceled')return;Q.speak(t,{voice:onId(lg),rate:cfg.rate});};
 if(!v&&lg=='ar'&&!warned){warned=true;msg('⚠️ لا يوجد صوت عربي مثبّت على الجهاز، قد لا تُقرأ العربية.');}
 if(cfg.mode!='queue')SS.cancel();SS.speak(u);if(!warned)msg('🗨️ '+t.slice(0,80));W.__QSR.log.push({t:t,src:src,lang:u.lang});}
var bound=new WeakSet();
function cueText(tr){var c=tr.activeCues,a=[];if(!c)return '';for(var i=0;i<c.length;i++)a.push(c[i].text);return a.join(' ');}
function bindVideos(){D.querySelectorAll('video').forEach(function(v){if(bound.has(v))return;bound.add(v);
 function hook(tr){if(tr.__qsr||!/subtitles|captions/.test(tr.kind))return;tr.__qsr=1;if(tr.mode=='disabled')tr.mode='hidden';tr.addEventListener('cuechange',function(){if(tr.mode!='disabled')speak(cueText(tr),'track');});}
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
 if(a=='on'){cfg.on=!cfg.on;if(!cfg.on&&SS)SS.cancel();}else if(a=='mode')cfg.mode=cfg.mode=='queue'?'interrupt':'queue';else if(a=='min')cfg.min=!cfg.min;else if(a=='region'){cfg.region=!cfg.region;msg(cfg.region?'🎯 القراءة داخل الصندوق فقط':'🌐 القراءة التلقائية لكل الترجمات');}else if(a=='ocr'){cfg.ocr=!cfg.ocr;startOcr();}else if(a=='close'){api.destroy();return;}place();save();},true);
$('voice').addEventListener('change',function(){cfg.voice=this.value;save();});$('rate').addEventListener('input',function(){cfg.rate=+this.value;save();});
function onFs(){mount();}
var api=W.__QSR={place:place,log:[],speak:speak,cfg:cfg,toggle:function(){if(HID){api.destroy();confirmSay('تم الإيقاف');return;}box.style.display=box.style.display=='none'?'':'none';},
 destroy:function(){mo.disconnect();clearInterval(ocrTimer);clearInterval(poll);if(SS)SS.cancel();Q.cancel();box.remove();st.remove();D.removeEventListener('fullscreenchange',onFs);D.removeEventListener('webkitfullscreenchange',onFs);if(ocrW)ocrW.terminate();delete W.__QSR;}};
W.addEventListener('resize',place);D.addEventListener('fullscreenchange',onFs);D.addEventListener('webkitfullscreenchange',onFs);
mount();place();loadVoices();Q.waitVoices(SS,function(){loadVoices();if(!voices.length&&!HID)msg('🌐 لا توجد أصوات مدمجة — يُستخدم صوت نسائي عبر الإنترنت');});if(SS&&SS.addEventListener)SS.addEventListener('voiceschanged',loadVoices);
mo.observe(D.documentElement,{subtree:true,childList:true,characterData:true});var poll=setInterval(function(){bindVideos();domScan();},1000);bindVideos();
if(cfg.ocr)startOcr();if(HID){var said=0,hi=function(){if(said++)return;confirmSay('تم التشغيل');};if(SS&&!SS.getVoices().length)Q.waitVoices(SS,function(){loadVoices();hi();});else hi();}else msg('✅ قارئ الترجمة يعمل — ضع الصندوق فوق الترجمة');
})();
