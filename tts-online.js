/* QOTTS: online female TTS via Google Translate (no API key), played with <audio referrerPolicy=no-referrer>. Used when speechSynthesis has no voices (e.g. Meta Quest Browser). */
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
})(window);
