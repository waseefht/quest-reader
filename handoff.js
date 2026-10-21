(function(){
var W=window,D=document,K='qsr_vr_base';
function guessFmt(s){s=String(s||'').toLowerCase();var d=/180/.test(s)?'180':(/360|vr|equirect/.test(s)?'360':'');
 var st=/(sbs|side[ _-]?by[ _-]?side|_lr\b|[_\.-]lr[_\.-]|3dh)/.test(s)?'sbs':(/(\btb\b|top[ _-]?bottom|over[ _-]?under|_ou\b|[_\.-]tb[_\.-]|3dv)/.test(s)?'tb':'');
 if(!d&&st)d='180';return d?d+st:(st?'180'+st:'flat');}
function buildIntent(base,src,fmt,sub){var u=new URL(base);if(u.protocol!='https:')throw new Error('base must be https');
 var q='src='+encodeURIComponent(src)+'&fmt='+encodeURIComponent(fmt||'flat')+(sub?'&sub='+encodeURIComponent(sub):'');
 var path=u.pathname+(u.pathname.indexOf('?')<0?'?':'&')+q,https='https://'+u.host+path;
 return {intent:'intent://'+u.host+path+'#Intent;scheme=https;package=com.oculus.browser;S.browser_fallback_url='+encodeURIComponent(https)+';end',https:https};}
function findVideo(){var vs=[].slice.call(D.querySelectorAll('video')),best=null,ba=-1;
 vs.forEach(function(v){var r=v.getBoundingClientRect(),a=r.width*r.height+(v.paused?0:1e9);if(a>ba){ba=a;best=v;}});
 var cands=[];if(best){cands.push(best.currentSrc,best.src);[].forEach.call(best.querySelectorAll('source'),function(s){cands.push(s.src);});}
 [].forEach.call(D.querySelectorAll('video source[src],source[type^="video"]'),function(s){cands.push(s.src);});
 [].forEach.call(D.querySelectorAll('meta[property="og:video"],meta[property="og:video:url"],meta[property="og:video:secure_url"]'),function(m){cands.push(m.content);});
 for(var i=0;i<cands.length;i++){var c=cands[i];if(c&&/^https?:/i.test(c))return {src:c,v:best,direct:true};}
 return {src:location.href,v:best,direct:false,blob:cands.some(function(c){return /^blob:/.test(c||'');})};}
function base(){var b=localStorage.getItem(K);if(!b){b=prompt('رابط مشغّل VR المستضاف (https://.../vr/index.html):','https://');if(!b||!/^https:\/\//.test(b))return null;try{localStorage.setItem(K,b);}catch(e){}}return b;}
function go(f){var b=base();if(!b)return;if(!f.direct&&f.blob&&!confirm('الفيديو هنا تدفّق محمي/blob (MSE/DRM) ولا يمكن نقله. سيتم إرسال رابط الصفحة فقط — متابعة؟'))return;
 var r=buildIntent(b,f.src,guessFmt(f.src+' '+D.title));
 if(/android/i.test(navigator.userAgent)&&!/OculusBrowser/i.test(navigator.userAgent))location.href=r.intent;else location.href=r.https;}
function buttons(){[].forEach.call(D.querySelectorAll('video'),function(v){if(v.__qvr)return;v.__qvr=1;var b=D.createElement('button');b.textContent='🥽 افتح في VR';
 b.style.cssText='position:absolute;z-index:2147483647;font:bold 22px sans-serif;padding:14px 20px;border-radius:14px;border:0;background:#1f6feb;color:#fff;cursor:pointer';
 function pos(){var r=v.getBoundingClientRect();b.style.top=(r.top+scrollY+10)+'px';b.style.left=(r.left+scrollX+10)+'px';b.style.display=r.width>80?'':'none';}
 b.onclick=function(e){e.preventDefault();e.stopPropagation();var s=v.currentSrc||v.src;go(/^https?:/.test(s)?{src:s,direct:true}:findVideo());};
 D.body.appendChild(b);pos();setInterval(pos,1000);});}
W.__QVR={guessFmt:guessFmt,buildIntent:buildIntent,findVideo:findVideo};
if(!W.__QVR_TEST){var f=findVideo();buttons();if(confirm('فتح الفيديو في مشغّل VR الآن؟\n'+f.src.slice(0,120)))go(f);}
})();
