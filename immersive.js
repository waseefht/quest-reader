(function(){
'use strict';
var W=window,D=document,NS='__qrImm';
if(W[NS]){W[NS].cycle();return;}
var EP='https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=auto&tl=ar';
var BLOCK='p,li,h1,h2,h3,h4,h5,h6,td,th,blockquote,dt,dd,figcaption,caption,summary';
var SKIP='script,style,noscript,code,pre,textarea,input,select,button,svg,math,kbd,samp,.qr-imm-tr,#qr-imm-btn,[contenteditable="true"]';
var AR=/[\u0600-\u06FF]/g;
var mode=1; // 1 bilingual, 2 translation-only, 0 off
var cache={},queue=[],timer=null,seen=new WeakSet();
function css(){if(D.getElementById('qr-imm-css'))return;var s=D.createElement('style');s.id='qr-imm-css';
s.textContent='.qr-imm-tr{display:block;direction:rtl;text-align:right;font-size:.92em;color:#6b7280;border-left:3px solid #3b82f6;padding:2px 8px;margin:4px 0 8px;line-height:1.7;font-family:Tahoma,Arial,sans-serif}'+
'html.qr-imm-off .qr-imm-tr{display:none!important}html.qr-imm-only .qr-imm-src{display:none!important}'+
'html.qr-imm-only .qr-imm-tr{color:inherit;font-size:1em;border-left:0}'+
'#qr-imm-btn{position:fixed;bottom:18px;left:18px;z-index:2147483647;width:58px;height:58px;border-radius:50%;border:0;background:#2563eb;color:#fff;font:bold 18px sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.4);cursor:pointer}';
(D.head||D.documentElement).appendChild(s);}
function txt(el){return (el.innerText||el.textContent||'').replace(/\s+/g,' ').trim();}
function isAr(t){var m=t.match(AR);return m&&m.length>t.replace(/\s/g,'').length*0.3;}
function ok(el){
 if(seen.has(el)||el.closest(SKIP))return false;
 if(el.querySelector(BLOCK))return false; // translate innermost
 var t=txt(el);if(t.length<2||!/[A-Za-z\u00C0-\u024F\u0400-\u04FF\u3040-\u9FFF]/.test(t)||isAr(t))return false;
 if(el.closest('nav')&&t.length<25)return false;
 if(t.length>4500)return false;
 return true;}
function leaf(el){ // div/span with substantial own text and no block children
 if(el.querySelector(BLOCK+',div'))return false;var t=txt(el);return t.length>=40;}
function scan(root){
 if(!root||root.nodeType!==1)return;var list=[];
 if(root.matches&&(root.matches(BLOCK)||((root.tagName==='DIV'||root.tagName==='SPAN')&&leaf(root))))list.push(root);
 root.querySelectorAll(BLOCK).forEach(function(e){list.push(e)});
 root.querySelectorAll('div,span').forEach(function(e){if(leaf(e)&&!e.closest(BLOCK))list.push(e)});
 list.forEach(function(el){if(ok(el)){seen.add(el);io?io.observe(el):enqueue(el);}});}
function enqueue(el){queue.push(el);if(!timer)timer=setTimeout(flush,150);}
function flush(){timer=null;var batch=[],len=0;
 while(queue.length&&batch.length<25){var e=queue[0],t=txt(e);if(len+t.length>1800&&batch.length)break;queue.shift();batch.push([e,t]);len+=t.length;}
 if(!batch.length)return;
 var need=batch.filter(function(b){return !(b[1] in cache)});
 var done=function(){batch.forEach(function(b){if(cache[b[1]])put(b[0],cache[b[1]])});if(queue.length)timer=setTimeout(flush,100);};
 if(!need.length)return done();
 translate(need.map(function(b){return b[1]})).then(function(r){need.forEach(function(b,i){cache[b[1]]=r[i]});done();})
 .catch(function(){need.forEach(function(b){seen.delete(b[0])});if(queue.length)timer=setTimeout(flush,2000);});}
function translate(arr){
 var u=EP+arr.map(function(s){return '&q='+encodeURIComponent(s)}).join('');
 return fetch(u).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()}).then(parse);}
function parse(j){if(!Array.isArray(j))j=[j];return j.map(function(x){return Array.isArray(x)?x[0]:(typeof x==='string'?x:'')});}
function put(el,tr){
 if(!tr||(el.nextElementSibling&&el.nextElementSibling.classList.contains('qr-imm-tr')))return;
 var tag=/^(LI|TD|TH|DT|DD|SPAN|SUMMARY|CAPTION)$/.test(el.tagName)?null:'div';
 var n=D.createElement(tag?'div':'span');n.className='qr-imm-tr';n.dir='rtl';n.lang='ar';n.textContent=tr;
 if(tag){el.classList.add('qr-imm-src');el.insertAdjacentElement('afterend',n);}
 else{n.style.display='block';var w=D.createElement('span');w.className='qr-imm-src';while(el.firstChild)w.appendChild(el.firstChild);el.appendChild(w);el.appendChild(n);}}
var io=('IntersectionObserver' in W)?new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);enqueue(e.target);}})},{rootMargin:'600px 0px'}):null;
var mo=new MutationObserver(function(ms){if(!mode)return;ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1&&!(n.classList&&(n.classList.contains('qr-imm-tr')||n.classList.contains('qr-imm-src')))&&n.id!=='qr-imm-btn')scan(n)})})});
var btn;
function apply(){var h=D.documentElement.classList;h.toggle('qr-imm-off',mode===0);h.toggle('qr-imm-only',mode===2);
 if(btn){btn.textContent=['⛔','ع+A','ع'][mode];btn.title=['متوقف','ثنائي اللغة','الترجمة فقط'][mode];}}
function cycle(){mode=(mode+1)%3;apply();if(mode)scan(D.body);}
function start(){css();btn=D.createElement('button');btn.id='qr-imm-btn';btn.onclick=cycle;D.body.appendChild(btn);apply();scan(D.body);mo.observe(D.body,{childList:true,subtree:true});}
W[NS]={cycle:cycle,translate:translate,parse:parse,scan:scan,get mode(){return mode}};
if(D.body)start();else D.addEventListener('DOMContentLoaded',start);
})();
