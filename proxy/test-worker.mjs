// Node mock test of worker-single.js for non-HTML paths (redirect, m3u8, reader endpoint, headers)
import assert from 'node:assert';
const W=(await import('./worker-single.js')).default;
globalThis.fetch=async(u,init)=>{ if(u.endsWith('/go')) return new Response(null,{status:302,headers:{location:'/dest?a=1','content-security-policy':"default-src 'none'"}});
 return new Response('#EXTM3U\nseg.ts\n',{headers:{'content-type':'application/vnd.apple.mpegurl','x-frame-options':'DENY'}}); };
let r=await W.fetch(new Request('https://w.dev/https://s.com/go'));assert.equal(r.status,302);assert.equal(r.headers.get('location'),'https://w.dev/https://s.com/dest?a=1');assert.equal(r.headers.get('content-security-policy'),null);
r=await W.fetch(new Request('https://w.dev/https://s.com/v/list.m3u8'));assert.equal(await r.text(),'#EXTM3U\nhttps://w.dev/https://s.com/v/seg.ts\n');assert.equal(r.headers.get('x-frame-options'),null);
r=await W.fetch(new Request('https://w.dev/__reader.js'));assert.ok((await r.text()).includes('__QSR'));
r=await W.fetch(new Request('https://w.dev/img/a.png',{headers:{referer:'https://w.dev/https://s.com/page'}}));assert.equal(r.headers.get('location'),'https://w.dev/https://s.com/img/a.png');
console.log('worker mock tests passed');
