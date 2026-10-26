// Renders the app's own home.html / quicklinks.html (served at the same appassets origin the app uses) in Chrome for UI screenshots.
const puppeteer=require('/tmp/mt/node_modules/puppeteer-core');const fs=require('fs');const path=require('path');
const A='/workspace/BlueArabicBrowser/app/src/main/assets/';const OUT='/workspace/BlueArabicBrowser/shots/';
const types={'.html':'text/html; charset=utf-8','.json':'application/json','.js':'text/javascript','.ttf':'font/ttf','.css':'text/css'};
(async()=>{const b=await puppeteer.launch({executablePath:'/usr/bin/google-chrome',headless:'new',args:['--no-sandbox']});
 for(const [n,f] of [['ui_home','home.html'],['ui_quicklinks','quicklinks.html']]){
  const p=await b.newPage();await p.setViewport({width:412,height:860,deviceScaleFactor:2,isMobile:true});
  await p.setRequestInterception(true);p.on('request',r=>{const u=new URL(r.url());if(u.host==='appassets.androidplatform.net'){const fn=path.basename(u.pathname);const fp=A+fn;
   if(fs.existsSync(fp))r.respond({status:200,contentType:types[path.extname(fn)]||'application/octet-stream',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(fp)});else r.respond({status:404,body:''});}else if(u.protocol==='arblue:')r.abort();else r.continue();});
  await p.goto('https://appassets.androidplatform.net/assets/'+f,{waitUntil:'networkidle2',timeout:60000}).catch(e=>console.log(e.message));
  await new Promise(r=>setTimeout(r,2500));await p.screenshot({path:OUT+n+'.png'});
  if(f==='quicklinks.html'){const inp=await p.$('input');if(inp){await inp.type('wiki');await new Promise(r=>setTimeout(r,1200));await p.screenshot({path:OUT+'ui_quicklinks_search.png'});}}
  await p.close();}
 await b.close();})();
