// Desktop-Chrome harness: runs the exact app asset translate.js on live sites, with a bridge that mirrors Translator.kt (gtx html POST).
const puppeteer=require('/tmp/mt/node_modules/puppeteer-core');const fs=require('fs');
const A='/workspace/BlueArabicBrowser/app/src/main/assets/';const src=fs.readFileSync(A+'translate.js','utf8');const font=fs.readFileSync(A+'ar-font.ttf');
const OUT='/workspace/BlueArabicBrowser/shots/';
async function gtx(a){const body=a.map(q=>'q='+encodeURIComponent(q)).join('&');
 const r=await fetch('https://translate.googleapis.com/translate_a/t?client=gtx&sl=auto&tl=ar&format=html',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});
 const j=await r.json();return a.length===1?[Array.isArray(j[0])?j[0][0]:j[0]]:j.map(x=>Array.isArray(x)?x[0]:x);}
(async()=>{
 const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox','--lang=en-US']});
 const jobs=[['wiki','https://en.wikipedia.org/wiki/Moon'],['bbc','https://www.bbc.com/news']];
 for(const [name,url] of jobs) for(const mode of ['ar','bi']){
  const p=await b.newPage();await p.setViewport({width:412,height:860,deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await p.setUserAgent('Mozilla/5.0 (Linux; Android 14; 23117RA68G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.5672.136 Mobile Safari/537.36');
  await p.setRequestInterception(true);p.on('request',r=>{if(r.url().startsWith('https://appassets.androidplatform.net/fonts/'))r.respond({status:200,contentType:'font/ttf',headers:{'Access-Control-Allow-Origin':'*'},body:font});else r.continue();});
  await p.exposeFunction('__nodeTr',async j=>{try{return JSON.stringify(await gtx(JSON.parse(j)))}catch(e){return 'null'}});
  await p.evaluateOnNewDocument((mode,src)=>{if(window.top!==window)return;window.__modes=[];window.ArBridge={initialMode:()=>mode+'|0',onMode:m=>window.__modes.push(m),onTitle:t=>{},onReadable:j=>{window.__read=j},
    translate:(id,json)=>{window.__nodeTr(json).then(r=>window.__arT.cb(id,JSON.parse(r)))}};
   try{eval(src)}catch(e){console.log('evalerr',e)}},mode,src);
  try{await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});}catch(e){console.log('goto',e.message)}
  await new Promise(r=>setTimeout(r,9000));
  await p.screenshot({path:OUT+`${name}_${mode}_top.png`});
  // dynamic: scroll down, inject a new paragraph like infinite scroll, wait
  await p.evaluate(()=>{window.scrollBy(0,2600);const d=document.createElement('p');d.id='dyn';d.textContent='This paragraph was added dynamically after the page loaded, like infinite scroll.';const all=[...document.querySelectorAll('p,h2,h3,li')].filter(e=>{const r=e.getBoundingClientRect();return r.top>80&&r.top<400});const ref=all[0];if(ref)ref.parentNode.insertBefore(d,ref);else document.body.appendChild(d);d.style.cssText='background:#fff3c4;padding:6px;border:2px dashed #e0a800';});
  await new Promise(r=>setTimeout(r,6000));
  await p.screenshot({path:OUT+`${name}_${mode}_scrolled.png`});
  const info=await p.evaluate(()=>({modes:window.__modes,title:document.title,stats:window.__arT&&window.__arT.stats(),dyn:document.getElementById('dyn')&&document.getElementById('dyn').innerText}));
  console.log(name,mode,JSON.stringify(info));await p.close();}
 await b.close();})();
