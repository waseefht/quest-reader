/* متصفح بلو العربي — immersive Arabic page translator (injected at document start, main frame only).
   Modes: 'ar' = full Arabic (in-place, RTL, Arabic font), 'bi' = bilingual (translation under each paragraph), 'off'.
   Network goes through the native bridge (ArBridge.translate) so page CSP/CORS cannot block it. */
(function(){
'use strict';
var W=window,D=document;
if(W.top!==W||W.__arT)return;
var B=W.ArBridge;if(!B)return;
var mode='off',flip=false,started=false,arabicPage=false;
var INLINE={A:1,ABBR:1,B:1,BDI:1,BDO:1,CITE:1,DATA:1,DFN:1,EM:1,FONT:1,I:1,MARK:1,Q:1,S:1,SMALL:1,SPAN:1,STRONG:1,SUB:1,SUP:1,TIME:1,U:1,LABEL:1,INS:1,DEL:1,BIG:1,TT:1,ACRONYM:1,STRIKE:1,NOBR:1,WBR:1,BR:0};
var SKIP={SCRIPT:1,STYLE:1,NOSCRIPT:1,TEXTAREA:1,INPUT:1,SELECT:1,CODE:1,PRE:1,SVG:1,MATH:1,KBD:1,SAMP:1,VAR:1,TEMPLATE:1,IFRAME:1,CANVAS:1,VIDEO:1,AUDIO:1,OBJECT:1,HEAD:1,TITLE:1};
var PARA={P:1,H1:1,H2:1,H3:1,H4:1,H5:1,H6:1,LI:1,DD:1,DT:1,TD:1,TH:1,BLOCKQUOTE:1,FIGCAPTION:1,CAPTION:1,SUMMARY:1,LEGEND:1,ARTICLE:1,SECTION:1,DIV:1,MAIN:1,ASIDE:1};
var UI_SEL='nav,button,[role=button],[role=menu],[role=menubar],[role=navigation],[role=tab],[role=menuitem],select,label';
var LETTER=/[A-Za-z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0590-\u05FF\u0900-\u097F\u0E00-\u0E7F\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/;
var ARABIC=/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
var cache=new Map();           // src -> tr
var recs=[];                   // {n:textNode,o:orig,t:translated} for restore
var nodeRec=new WeakMap();     // textNode -> rec
var attrRecs=[];               // {el,a,o,t}
var touched=[];                // elements given classes/dir
var biNodes=[];
var segOf=new WeakMap();       // block el -> true when observed/queued
var pendingByEl=new Map();     // el -> [segments waiting for visibility]
var queue=[],inflight=0,MAXF=4,reqId=0,cbs={},flushT=0,stats={req:0,seg:0,err:0};
var forceAll=false,readWaiter=null;

function isArabicText(t){var m=t.match(ARABIC);if(!m)return false;var l=t.replace(/[\s\d\p{P}]/gu,'').length;return m.length>=l*0.4;}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function unesc(s){return s.replace(/&#(\d+);/g,function(_,n){return String.fromCharCode(+n)}).replace(/&#x([0-9a-f]+);/gi,function(_,n){return String.fromCharCode(parseInt(n,16))})
 .replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,'\u00A0').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');}
function strip(s){return unesc(s.replace(/<[^>]*>/g,''));}

function css(){
 if(D.getElementById('art-css'))return;
 var s=D.createElement('style');s.id='art-css';
 s.textContent="@font-face{font-family:'ArBlueNaskh';src:url('https://appassets.androidplatform.net/fonts/ar-font.ttf') format('truetype');font-display:swap}"+
 ".art-f{font-family:'ArBlueNaskh','Noto Naskh Arabic','Noto Sans Arabic',Tahoma,sans-serif!important;}"+
 ".art-rtl{direction:rtl!important;text-align:right!important;unicode-bidi:isolate}"+
 "font.art-bi{display:block!important;direction:rtl;text-align:right;unicode-bidi:isolate;font-family:'ArBlueNaskh','Noto Naskh Arabic','Noto Sans Arabic',Tahoma,sans-serif!important;line-height:1.75;margin:.25em 0 .5em;padding:0 .5em;border-right:3px solid #1E88E5;opacity:.95;font-weight:inherit;white-space:normal}"+
 "html.art-flip body{direction:rtl}";
 (D.head||D.documentElement).appendChild(s);
}

function skipEl(el){
 for(var e=el;e&&e!==D.documentElement;e=e.parentElement){
  if(SKIP[e.tagName])return true;
  if(e.classList&&(e.classList.contains('art-bi')||e.classList.contains('notranslate')))return true;
  if(e.getAttribute){var tr=e.getAttribute('translate');if(tr==='no')return true;if(e.isContentEditable&&e.getAttribute('contenteditable')!==null)return true;}
 }
 return false;
}
function blockOf(n){var e=n.parentElement;while(e&&INLINE[e.tagName]&&e.parentElement&&e!==D.body)e=e.parentElement;return e;}
function wanted(n){var t=n.data;if(!t||t.length<1||!LETTER.test(t))return false;if(isArabicText(t))return false;return true;}

/* ---------- scanning ---------- */
function scan(root){
 if(mode==='off'||!root)return;
 if(root.nodeType===3){root=root.parentElement;if(!root)return;}
 if(root.nodeType!==1)return;
 if(skipEl(root))return;
 var groups=new Map();
 var tw=D.createTreeWalker(root,NodeFilter.SHOW_TEXT,null);var n;
 while((n=tw.nextNode())){
  if(nodeRec.has(n)){var r=nodeRec.get(n);if(n.data===r.t||n.data===r.o&&r.p)continue;}
  if(!wanted(n))continue;
  var p=n.parentElement;if(!p||skipEl(p))continue;
  var b=blockOf(n);if(!b)continue;
  var g=groups.get(b);if(!g){g=[];groups.set(b,g);}g.push(n);
 }
 groups.forEach(function(nodes,el){
  // split very large groups
  var cur=[],len=0;
  nodes.forEach(function(x){if(len+x.data.length>2500&&cur.length){mk(el,cur);cur=[];len=0;}cur.push(x);len+=x.data.length;});
  if(cur.length)mk(el,cur);
 });
 attrs(root);
}
function mk(el,nodes){
 nodes.forEach(function(x){var r=nodeRec.get(x);if(!r){r={n:x,o:x.data,t:null,p:true};nodeRec.set(x,r);recs.push(r);}else{r.o=x.data;r.t=null;r.p=true;}});
 var src;
 if(nodes.length===1)src=esc(nodes[0].data.trim());
 else src=nodes.map(function(x,i){return '<a i='+i+'>'+esc(x.data.trim())+'</a>';}).join(' ');
 var seg={el:el,nodes:nodes,src:src,ui:isUI(el,nodes)};
 if(forceAll||!io){queue.push(seg);kick();return;}
 var arr=pendingByEl.get(el);if(!arr){arr=[];pendingByEl.set(el,arr);}arr.push(seg);
 io.observe(el);
}
function isUI(el,nodes){
 if(el.closest&&el.closest(UI_SEL))return true;
 var txt=nodes.map(function(x){return x.data}).join(' ').trim();
 if(PARA[el.tagName]&&txt.length>=20)return false;
 if(/^H[1-6]$/.test(el.tagName))return false;
 return txt.length<20;
}
var io=('IntersectionObserver' in W)?new IntersectionObserver(function(es){
 es.forEach(function(e){if(e.isIntersecting||e.boundingClientRect.height===0&&false){var a=pendingByEl.get(e.target);io.unobserve(e.target);pendingByEl.delete(e.target);if(a)a.forEach(function(s){queue.push(s)});}});
 kick();
},{rootMargin:'150% 0px 150% 0px'}):null;

function attrs(root){
 var list=[];
 try{list=root.querySelectorAll('[title],[placeholder],[aria-label],img[alt],input[type=submit],input[type=button],input[type=reset]');}catch(e){}
 var c=0;
 for(var i=0;i<list.length&&c<300;i++){var el=list[i];
  ['title','placeholder','aria-label','alt','value'].forEach(function(a){
   if(a==='value'&&el.tagName!=='INPUT')return;
   var v=el.getAttribute(a);if(!v||v.length>300||!LETTER.test(v)||isArabicText(v))return;
   if(el.__artA&&el.__artA[a]===v)return;
   var rec={el:el,a:a,o:v,t:null};attrRecs.push(rec);c++;
   queue.push({attr:rec,src:esc(v.trim())});
  });
 }
 kick();
}
function doTitle(){
 var t=D.title;if(!t||!LETTER.test(t)||isArabicText(t))return;
 if(W.__artTitle&&W.__artTitle.t===t)return;
 var rec={o:t,t:null};W.__artTitle=rec;
 queue.unshift({title:rec,src:esc(t)});kick();
}

/* ---------- batching / bridge ---------- */
var GLOSS={'live':'مباشر','news':'أخبار','home':'الرئيسية','menu':'القائمة','search':'بحث','sign in':'تسجيل الدخول','log in':'تسجيل الدخول','sport':'رياضة','sports':'رياضة','more':'المزيد','video':'فيديو','share':'مشاركة','save':'حفظ','close':'إغلاق','next':'التالي','previous':'السابق','watch':'شاهد','listen':'استمع','read more':'اقرأ المزيد','subscribe':'اشترك','contents':'المحتويات','edit':'تحرير','talk':'نقاش','article':'مقالة'};
function gloss(s){var k=strip(s.src).trim().toLowerCase();var g=GLOSS[k];if(!g)return null;if(s.title||s.attr)return g;if(s.nodes&&s.nodes.length===1)return g;return null;}
function kick(){if(!flushT)flushT=setTimeout(flush,60);}
function flush(){
 flushT=0;
 while(queue.length&&inflight<MAXF){
  var batch=[],len=0;
  while(queue.length&&batch.length<60){var s=queue[0];
   if(cache.has(s.src)){queue.shift();apply(s,cache.get(s.src));continue;}
   var gl=gloss(s);if(gl){queue.shift();apply(s,gl);continue;}
   if(len+s.src.length>4500&&batch.length)break;queue.shift();batch.push(s);len+=s.src.length;}
  if(!batch.length)break;
  send(batch);
 }
 checkRead();
}
function send(batch){
 var id=++reqId;inflight++;stats.req++;
 // de-duplicate sources
 var uniq=[],idx={};batch.forEach(function(s){if(!(s.src in idx)){idx[s.src]=uniq.length;uniq.push(s.src);}});
 cbs[id]=function(res){
  inflight--;
  if(!res){stats.err++;batch.forEach(function(s){s.tries=(s.tries||0)+1;if(s.tries<3)queue.push(s);});setTimeout(kick,1500);return;}
  batch.forEach(function(s){var tr=res[idx[s.src]];if(tr==null){return;}cache.set(s.src,tr);apply(s,tr);});
  stats.seg+=batch.length;kick();
 };
 try{B.translate(id,JSON.stringify(uniq));}catch(e){cbs[id](null);}
}
function cb(id,res){var f=cbs[id];delete cbs[id];if(f)f(res);}

/* ---------- applying ---------- */
function parts(tr,n){
 var out=new Array(n),found=0,re=/<a\s+i="?(\d+)"?\s*>([\s\S]*?)<\/a>/gi,m;
 while((m=re.exec(tr))){var k=+m[1];if(k<n){out[k]=(out[k]?out[k]+' ':'')+strip(m[2]);found++;}}
 return found?out:null;
}
function setNode(x,txt){
 var r=nodeRec.get(x);var o=r?r.o:x.data;
 var lead=o.match(/^\s*/)[0],trail=o.match(/\s*$/)[0];
 var v=txt?lead+txt+trail:(o.trim()?' ':o);
 if(r){r.t=v;r.p=false;}
 if(x.data!==v)x.data=v;
}
function mark(el,cls){if(!el.classList.contains(cls)){el.classList.add(cls);touched.push([el,cls]);}}
function apply(s,tr){
 if(mode==='off')return;
 if(s.title){s.title.t=strip(tr);D.title=s.title.t;W.__artTitle=s.title;B.onTitle&&B.onTitle(s.title.t);return;}
 if(s.attr){var r=s.attr;r.t=strip(tr);if(!r.el.__artA)r.el.__artA={};r.el.__artA[r.a]=r.t;r.el.setAttribute(r.a,r.t);return;}
 var nodes=s.nodes.filter(function(x){return x.isConnected;});if(!nodes.length)return;
 if(mode==='bi'&&!s.ui){
  var full=strip(tr).trim();if(!full)return;
  var el=s.el;
  var ex=el.querySelector(':scope > font.art-bi');
  var f=D.createElement('font');f.className='art-bi';f.setAttribute('dir','rtl');f.setAttribute('lang','ar');f.textContent=full;
  if(ex&&ex.__src===s.src)return;
  f.__src=s.src;el.appendChild(f);biNodes.push(f);
  s.nodes.forEach(function(x){var r=nodeRec.get(x);if(r){r.t=x.data;r.p=false;}});
  return;
 }
 if(s.nodes.length===1){setNode(s.nodes[0],strip(tr).trim());}
 else{
  var p=parts(tr,s.nodes.length);
  if(!p){setNode(s.nodes[0],strip(tr).trim());for(var i=1;i<s.nodes.length;i++)setNode(s.nodes[i],'');}
  else s.nodes.forEach(function(x,i){setNode(x,(p[i]||'').trim());});
 }
 mark(s.el,'art-f');
 if(PARA[s.el.tagName]||/^H[1-6]$/.test(s.el.tagName)){if(!s.ui||s.el.tagName==='LI')mark(s.el,'art-rtl');}
}

/* ---------- dynamic content ---------- */
var dirty=new Set(),mutT=0;
var mo=new MutationObserver(function(ms){
 if(mode==='off')return;
 for(var i=0;i<ms.length;i++){var m=ms[i];
  if(m.type==='characterData'){var r=nodeRec.get(m.target);if(r&&(m.target.data===r.t||r.p))continue;dirty.add(m.target.parentElement);}
  else if(m.type==='childList'){
   if(m.target.nodeName==='TITLE'){setTimeout(doTitle,50);continue;}
   for(var j=0;j<m.addedNodes.length;j++){var a=m.addedNodes[j];
    if(a.nodeType===1&&(a.classList.contains('art-bi')||a.id==='art-css'))continue;
    if(a.nodeType===3){var rr=nodeRec.get(a);if(rr&&a.data===rr.t)continue;}
    dirty.add(a.nodeType===3?a.parentElement:a);}
  }
 }
 if(dirty.size&&!mutT)mutT=setTimeout(function(){mutT=0;var d=Array.from(dirty);dirty.clear();d.forEach(function(e){if(e&&e.isConnected)scan(e);});},250);
});

/* ---------- mode control ---------- */
function restore(){
 recs.forEach(function(r){if(r.n.isConnected&&r.t!=null&&r.n.data===r.t)r.n.data=r.o;});
 recs=[];nodeRec=new WeakMap();
 attrRecs.forEach(function(r){if(r.t!=null&&r.el.getAttribute(r.a)===r.t)r.el.setAttribute(r.a,r.o);if(r.el.__artA)delete r.el.__artA[r.a];});attrRecs=[];
 if(W.__artTitle&&W.__artTitle.t&&D.title===W.__artTitle.t)D.title=W.__artTitle.o;W.__artTitle=null;
 biNodes.forEach(function(f){f.remove();});biNodes=[];
 D.querySelectorAll('font.art-bi').forEach(function(f){f.remove();});
 touched.forEach(function(p){p[0].classList.remove(p[1]);});touched=[];
 pendingByEl.forEach(function(a,el){io&&io.unobserve(el);});pendingByEl.clear();queue=[];
 D.documentElement.classList.remove('art-flip');
 if(D.documentElement.__artDir!==undefined){D.documentElement.setAttribute('dir',D.documentElement.__artDir||'ltr');if(!D.documentElement.__artDir)D.documentElement.removeAttribute('dir');delete D.documentElement.__artDir;}
}
function detectArabic(){
 var l=(D.documentElement.lang||'').toLowerCase();if(/^ar\b|^ar-/.test(l))return true;
 var t=(D.body&&D.body.innerText||'').slice(0,3000);var m=t.match(ARABIC)||[];var lat=t.match(/[A-Za-z]/g)||[];
 return m.length>200&&m.length>lat.length*1.5;
}
function begin(){
 if(!D.body){D.addEventListener('DOMContentLoaded',begin,{once:true});return;}
 css();
 if(!started){started=true;mo.observe(D,{childList:true,subtree:true,characterData:true});}
 if(mode==='off'){B.onMode&&B.onMode('off');return;}
 if(!forced&&detectArabic()){arabicPage=true;mode='off';B.onMode&&B.onMode('arabic');return;}
 B.onMode&&B.onMode(mode);
 if(mode==='ar'&&flip){var h=D.documentElement;if(h.__artDir===undefined)h.__artDir=h.getAttribute('dir');h.setAttribute('dir','rtl');h.classList.add('art-flip');}
 doTitle();scan(D.body);
}
var forced=false;
function setMode(m,fl,force){
 if(m===mode&&!!fl===flip&&!force)return mode;
 if(force)forced=true;
 if(mode!=='off')restore();
 mode=m;flip=!!fl;
 begin();
 return mode;
}

/* ---------- read aloud helpers ---------- */
function readable(){
 var root=D.querySelector('article')||D.querySelector('main')||D.querySelector('[role=main]')||D.body;
 var out=[];
 root.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,figcaption,dd,font.art-bi').forEach(function(el){
  if(el.closest('nav,footer,aside,[role=navigation]'))return;
  var t;
  if(el.tagName==='FONT'){t=el.textContent;}
  else{if(el.querySelector('h1,h2,h3,h4,p,li,blockquote'))return;
   var bi=el.querySelector(':scope > font.art-bi');if(bi)return;t=el.innerText||'';}
  t=t.replace(/\s+/g,' ').trim();
  if(t.length>1&&(mode==='off'||isArabicText(t)))out.push(t);
 });
 return out;
}
function prepareRead(){
 forceAll=true;
 pendingByEl.forEach(function(a,el){io&&io.unobserve(el);a.forEach(function(s){queue.push(s)});});pendingByEl.clear();
 readWaiter=Date.now();kick();
 checkRead();
}
function checkRead(){
 if(readWaiter==null)return;
 if((queue.length===0&&inflight===0)||Date.now()-readWaiter>15000){readWaiter=null;forceAll=false;setTimeout(function(){B.onReadable(JSON.stringify(readable()));},30);}
 else setTimeout(checkRead,400);
}

W.__arT={setMode:setMode,cb:cb,readable:readable,prepareRead:prepareRead,
 get mode(){return mode},stats:function(){return JSON.stringify({mode:mode,req:stats.req,seg:stats.seg,err:stats.err,recs:recs.length,bi:D.querySelectorAll('font.art-bi').length,q:queue.length,pend:pendingByEl.size,arabic:arabicPage});}};
try{var init=B.initialMode&&B.initialMode(location.href);if(init){var pr=init.split('|');setMode(pr[0],pr[1]==='1');}}catch(e){}
})();
