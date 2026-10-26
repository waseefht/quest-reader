// jsdom smoke test of translate.js with a mock bridge (or live Google when LIVE=1)
const {JSDOM}=require('/tmp/mt/node_modules/jsdom');
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../app/src/main/assets/translate.js','utf8');
const html=`<!doctype html><html lang=en><head><title>World news today</title></head><body>
<nav><a href=#>Home</a> <a href=#>News</a> <button>Sign in</button></nav>
<h1>Big storm hits the coast</h1>
<p>The storm <b>brought heavy rain</b> and strong winds to <a href=#>several towns</a> on Monday.</p>
<ul><li>First item in the list here</li></ul>
<input placeholder="Search the site">
<pre>code stays</pre>
<div id=feed></div></body></html>`;
async function run(mode){
 const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;let titles=[],modes=[];
 w.ArBridge={initialMode:()=>mode+'|0',onMode:m=>modes.push(m),onTitle:t=>titles.push(t),onReadable:j=>{w.__read=JSON.parse(j)},
  translate:(id,json)=>{const a=JSON.parse(json);setTimeout(async()=>{let out;
   if(process.env.LIVE){const body=a.map(q=>'q='+encodeURIComponent(q)).join('&');
    const r=await fetch('https://translate.googleapis.com/translate_a/t?client=gtx&sl=auto&tl=ar&format=html',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
    const j=await r.json();out=a.length===1?[Array.isArray(j[0])?j[0][0]:j[0]]:j.map(x=>Array.isArray(x)?x[0]:x);}
   else out=a.map(s=>s.replace(/>([^<]+)</g,'>عربي $1<').replace(/^([^<]+)$/,'عربي $1'));
   w.__arT.cb(id,out);},10);}};
 w.eval(src);
 await new Promise(r=>setTimeout(r,600));
 const f=w.document.createElement('p');f.textContent='Dynamic paragraph loaded later by infinite scroll';w.document.getElementById('feed').appendChild(f);
 await new Promise(r=>setTimeout(r,process.env.LIVE?2500:800));
 console.log('==',mode,'modes',modes,'title',w.document.title);
 console.log(w.document.body.innerHTML.replace(/\n/g,''));
 console.log('stats',w.__arT.stats());
 w.__arT.setMode('off',false);
 console.log('restored:',w.document.body.textContent.replace(/\s+/g,' ').slice(0,140), w.document.querySelectorAll('font.art-bi').length);
}
(async()=>{await run('ar');await run('bi');})();
