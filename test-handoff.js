// node test-handoff.js : unit tests for intent URL builder and format guess
const assert=require('assert'),vm=require('vm'),fs=require('fs');const ctx={window:{__QVR_TEST:1},document:{},URL,encodeURIComponent};ctx.window.window=ctx.window;
vm.runInNewContext(fs.readFileSync(__dirname+'/handoff.js','utf8').replace('var W=window','var W=window'),Object.assign(ctx,{window:ctx.window}));
const Q=ctx.window.__QVR;
const r=Q.buildIntent('https://me.github.io/QuestReader/vr/index.html','https://cdn.x.com/v/My Film_180_SBS.mp4?t=1&k=2','180sbs');
assert.equal(r.https,'https://me.github.io/QuestReader/vr/index.html?src=https%3A%2F%2Fcdn.x.com%2Fv%2FMy%20Film_180_SBS.mp4%3Ft%3D1%26k%3D2&fmt=180sbs');
assert.equal(r.intent,'intent://me.github.io/QuestReader/vr/index.html?src=https%3A%2F%2Fcdn.x.com%2Fv%2FMy%20Film_180_SBS.mp4%3Ft%3D1%26k%3D2&fmt=180sbs#Intent;scheme=https;package=com.oculus.browser;S.browser_fallback_url='+encodeURIComponent(r.https)+';end');
assert.ok(!r.intent.split('#Intent')[0].includes('#'));
assert.throws(()=>Q.buildIntent('http://x.com/vr/','a','flat'));
const s=Q.buildIntent('https://x.netlify.app/vr/','https://a/b.mp4','360','https://a/b.vtt');assert.ok(s.https.endsWith('&sub=https%3A%2F%2Fa%2Fb.vtt'));
const g=Q.guessFmt;[['movie.mp4','flat'],['tour_360.mp4','360'],['clip_180_sbs.mp4','180sbs'],['x360_TB.webm','360tb'],['concert_3dh.mp4','180sbs'],['VR180 LR.mp4','180'],['film_180_lr.mp4','180sbs'],['360 top-bottom','360tb'],['side by side 3d','180sbs']].forEach(([i,o])=>assert.equal(g(i),o,i));
console.log('handoff tests passed');
