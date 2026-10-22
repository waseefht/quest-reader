import * as THREE from './lib/three.module.min.js';
const $=id=>document.getElementById(id), SS=window.speechSynthesis;
const st={fmt:'flat',speak:true};try{Object.assign(st,JSON.parse(localStorage.getItem('vr_cfg')||'{}'));}catch(e){}
const save=()=>{try{localStorage.setItem('vr_cfg',JSON.stringify(st));}catch(e){}};
$('fmt').value=st.fmt;$('speak').checked=st.speak;
const status=t=>$('status').textContent=t||'';
// ---------- reader engine (female preferred, auto language) ----------
let voices=[];const loadV=()=>{if(SS)voices=SS.getVoices();};if(SS){loadV();SS.addEventListener('voiceschanged',loadV);}
const FEM=/female|woman|zira|samantha|aria|jenny|hoda|salma|zariyah|amira|laila|layla|mona|hala|karen|victoria|susan|google (us|uk english female)|sara/i;
const detect=t=>{const a=(t.match(/[\u0600-\u06FF]/g)||[]).length,l=(t.match(/[A-Za-z]/g)||[]).length;return a>=l&&a>0?'ar':'en';};
function pickVoice(lg){const m=voices.filter(v=>v.lang.toLowerCase().startsWith(lg));return m.find(v=>FEM.test(v.name))||m[0]||null;}
const Q=window.QOTTS;if(Q)Q.waitVoices(SS,l=>{voices=l;if(!l.length)status('🌐 لا توجد أصوات مدمجة — يُستخدم صوت نسائي عبر الإنترنت');});
let lastSaid='';function say(t){if(!st.speak||!t||t==lastSaid)return;lastSaid=t;const lg0=detect(t);if(!SS||!voices.length||!pickVoice(lg0)){if(SS)SS.cancel();Q.speak(t,{lang:lg0,rate:1.05});return;}const u=new SpeechSynthesisUtterance(t),lg=detect(t),v=pickVoice(lg);u.lang=v?v.lang:(lg=='ar'?'ar-SA':'en-US');if(v)u.voice=v;u.rate=1.05;u.onerror=e=>{if(e.error!='interrupted'&&e.error!='canceled')Q.speak(t,{lang:lg,rate:1.05});};Q.cancel();SS.cancel();SS.speak(u);}
// ---------- video ----------
const video=document.createElement('video');video.crossOrigin='anonymous';video.playsInline=true;video.preload='auto';
const tex=new THREE.VideoTexture(video);tex.colorSpace=THREE.SRGBColorSpace;
function setSrc(src){video.src=src;video.load();status('⏳ تحميل الفيديو…');}
video.addEventListener('loadedmetadata',()=>{status('✅ '+video.videoWidth+'×'+video.videoHeight);build();});
video.addEventListener('error',()=>status('❌ تعذّر تحميل الفيديو. للروابط يجب أن يسمح الخادم بـ CORS، وقد لا يدعم الجهاز الصيغة.'));
$('vfile').onchange=e=>{const f=e.target.files[0];if(f){video.removeAttribute('crossorigin');setSrc(URL.createObjectURL(f));}};
$('loadUrl').onclick=()=>{const u=$('vurl').value.trim();if(u){video.crossOrigin='anonymous';setSrc(u);}};
// ---------- subtitles ----------
let track=null;
export function srtToVtt(s){return 'WEBVTT\n\n'+s.replace(/\r/g,'').replace(/^\d+\s*\n(?=\d\d:)/gm,'').replace(/(\d\d:\d\d:\d\d),(\d{3})/g,'$1.$2').trim()+'\n';}
$('sfile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>loadSubText(String(r.result));r.readAsText(f,'utf-8');};
function loadSubText(t){if(!/^\uFEFF?WEBVTT/.test(t))t=srtToVtt(t);
 [...video.querySelectorAll('track')].forEach(x=>x.remove());const el=document.createElement('track');el.kind='subtitles';el.default=true;el.src=URL.createObjectURL(new Blob([t],{type:'text/vtt'}));video.appendChild(el);
 track=el.track;track.mode='hidden';track.addEventListener('cuechange',onCue);status('✅ تم تحميل الترجمة');}
function onCue(){const c=track.activeCues;let t='';for(let i=0;i<(c?c.length:0);i++)t+=(t?' ':'')+c[i].text;t=t.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim();$('sub2d').textContent=t;drawSub(t);say(t);}
// ---------- scene ----------
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(devicePixelRatio);renderer.xr.enabled=true;renderer.xr.setReferenceSpaceType('local');
$('stage').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x05070a);
const camera=new THREE.PerspectiveCamera(75,1,0.05,2000);camera.layers.enable(1);
const world=new THREE.Group();scene.add(world);const media=new THREE.Group();world.add(media);
function resize(){const w=$('stage').clientWidth,h=$('stage').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}addEventListener('resize',resize);resize();
function eyeMesh(geo,layer,rep,off){const t=tex.clone();t.repeat.set(rep[0],rep[1]);t.offset.set(off[0],off[1]);t.needsUpdate=true;const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:t}));m.layers.set(layer);media.add(m);return m;}
function build(){media.clear();const f=st.fmt,is180=f.startsWith('180'),stereo=/sbs|tb/.test(f);
 if(f=='flat'){const ar=(video.videoWidth/video.videoHeight)||16/9,h=4;const m=new THREE.Mesh(new THREE.PlaneGeometry(h*ar,h),new THREE.MeshBasicMaterial({map:tex}));m.position.set(0,1.4,-6);media.add(m);return;}
 const geo=new THREE.SphereGeometry(500,64,32,is180?Math.PI:0,is180?Math.PI:Math.PI*2);geo.scale(-1,1,1);
 if(!stereo){const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:tex}));media.add(m);return;}
 // layer 1 = left eye (+ non-XR preview), layer 2 = right eye
 if(f.endsWith('sbs')){eyeMesh(geo,1,[.5,1],[0,0]);eyeMesh(geo,2,[.5,1],[.5,0]);}else{eyeMesh(geo,1,[1,.5],[0,.5]);eyeMesh(geo,2,[1,.5],[0,0]);}}
$('fmt').onchange=e=>{st.fmt=e.target.value;save();build();drawPanel();};$('speak').onchange=e=>{st.speak=e.target.checked;save();};
// ---------- canvas panels ----------
function canvasPlane(w,h,cw,ch){const c=document.createElement('canvas');c.width=cw;c.height=ch;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,depthTest:false}));m.renderOrder=10;return {c,x:c.getContext('2d'),t,m};}
const sub=canvasPlane(3,.5,1536,256);sub.m.position.set(0,.55,-3);world.add(sub.m);
function drawSub(t){const{x,c}=sub;x.clearRect(0,0,c.width,c.height);if(!t){sub.t.needsUpdate=true;return;}x.font='bold 64px Tahoma,sans-serif';x.textAlign='center';x.direction=detect(t)=='ar'?'rtl':'ltr';
 const w=Math.min(c.width,x.measureText(t).width+60);x.fillStyle='rgba(0,0,0,.65)';x.fillRect((c.width-w)/2,40,w,170);x.fillStyle='#fff';
 const words=t.split(' '),lines=[''];words.forEach(wd=>{const L=lines[lines.length-1];if(x.measureText(L+' '+wd).width>c.width-80)lines.push(wd);else lines[lines.length-1]=(L?L+' ':'')+wd;});
 lines.slice(0,2).forEach((l,i)=>x.fillText(l,c.width/2,lines.length>1?110+i*72:145));sub.t.needsUpdate=true;}
const panel=canvasPlane(1.6,.5,1024,320);panel.m.position.set(0,.9,-1.6);panel.m.rotation.x=-.35;world.add(panel.m);
const BTN=[{id:'play',x:20,w:180,l:()=>video.paused?'▶ Play':'⏸ Pause'},{id:'back',x:210,w:130,l:()=>'⏪ 10'},{id:'fwd',x:350,w:130,l:()=>'10 ⏩'},{id:'fmt',x:490,w:300,l:()=>'Format: '+st.fmt},{id:'center',x:800,w:204,l:()=>'🎯 Center'}];
function drawPanel(){const{x,c}=panel;x.clearRect(0,0,c.width,c.height);x.fillStyle='rgba(17,20,24,.88)';x.fillRect(0,0,c.width,c.height);x.font='bold 40px sans-serif';x.textAlign='center';x.direction='ltr';
 BTN.forEach(b=>{x.fillStyle=b.id==hover?'#1f6feb':'#262c34';x.fillRect(b.x,20,b.w,110);x.fillStyle='#fff';x.fillText(b.l(),b.x+b.w/2,90);});
 const d=video.duration||0,p=d?video.currentTime/d:0;x.fillStyle='#333a44';x.fillRect(20,190,984,40);x.fillStyle='#58a6ff';x.fillRect(20,190,984*p,40);
 x.fillStyle='#ccc';x.font='32px sans-serif';x.fillText(fmtT(video.currentTime)+' / '+fmtT(d),512,290);panel.t.needsUpdate=true;}
const fmtT=s=>{s=Math.floor(s||0);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
const FMTS=['flat','360','180','360sbs','360tb','180sbs','180tb'];
function act(id,u){if(id=='play')toggle();else if(id=='back')seek(-10);else if(id=='fwd')seek(10);else if(id=='fmt'){st.fmt=FMTS[(FMTS.indexOf(st.fmt)+1)%FMTS.length];$('fmt').value=st.fmt;save();build();}
 else if(id=='center')recenter();else if(id=='bar'&&video.duration)video.currentTime=u*video.duration;drawPanel();}
function hitPanel(uv){const px=uv.x*1024,py=(1-uv.y)*320;if(py>=170&&py<=250)return{id:'bar',u:Math.min(1,Math.max(0,(px-20)/984))};if(py>=20&&py<=130){const b=BTN.find(b=>px>=b.x&&px<=b.x+b.w);if(b)return{id:b.id};}return null;}
const toggle=()=>{if(!video.src)return;video.paused?video.play().catch(e=>status('❌ '+e.message)):video.pause();};
const seek=s=>{if(video.duration)video.currentTime=Math.min(video.duration,Math.max(0,video.currentTime+s));};
function recenter(){const xr=renderer.xr.isPresenting?renderer.xr.getCamera():camera;const e=new THREE.Euler().setFromQuaternion(xr.quaternion,'YXZ');world.rotation.y=e.y;}
$('play').onclick=toggle;$('recenter').onclick=recenter;
// ---------- controllers ----------
let hover=null;const ray=new THREE.Raycaster(),ctrls=[];
for(let i=0;i<2;i++){const c=renderer.xr.getController(i);const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]),new THREE.LineBasicMaterial({color:0x58a6ff}));line.scale.z=5;c.add(line);scene.add(c);ctrls.push(c);
 c.addEventListener('select',()=>{const h=intersect(c);if(h&&panel.m.visible){const r=hitPanel(h.uv);if(r)act(r.id,r.u);}else toggle();drawPanel();});
 c.addEventListener('squeeze',()=>{panel.m.visible=!panel.m.visible;});}
const m4=new THREE.Matrix4();function intersect(c){m4.identity().extractRotation(c.matrixWorld);ray.ray.origin.setFromMatrixPosition(c.matrixWorld);ray.ray.direction.set(0,0,-1).applyMatrix4(m4);return panel.m.visible?ray.intersectObject(panel.m)[0]:null;}
let lastSeek=0;const prevBtn={};
function pollGamepads(t){const s=renderer.xr.getSession();if(!s)return;let nh=null;ctrls.forEach(c=>{const h=intersect(c);if(h){const r=hitPanel(h.uv);if(r)nh=r.id;}});if(nh!=hover){hover=nh;drawPanel();}
 for(const src of s.inputSources){const g=src.gamepad;if(!g)continue;const ax=g.axes[2]||g.axes[0]||0;if(Math.abs(ax)>.7&&t-lastSeek>400){seek(ax>0?10:-10);lastSeek=t;}
  const k=src.handedness,b4=!!(g.buttons[4]&&g.buttons[4].pressed);if(b4&&!prevBtn[k])panel.m.visible=!panel.m.visible;prevBtn[k]=b4;}}
// ---------- XR session ----------
async function enterVR(){if(!navigator.xr){status('❌ WebXR غير متاح');return;}try{const s=await navigator.xr.requestSession('immersive-vr',{optionalFeatures:['local-floor']});await renderer.xr.setSession(s);if(video.src)video.play().catch(()=>{});s.addEventListener('end',()=>status('خرجت من VR'));}catch(e){status('❌ '+e.message);}}
$('enter').onclick=enterVR;
if(!navigator.xr)$('noxr').hidden=false;else navigator.xr.isSessionSupported('immersive-vr').then(ok=>{if(!ok){$('noxr').hidden=false;}}).catch(()=>{$('noxr').hidden=false;});
// 2D preview drag-to-look
let drag=null,yaw=0,pitch=0;renderer.domElement.addEventListener('pointerdown',e=>drag=[e.clientX,e.clientY,yaw,pitch]);addEventListener('pointerup',()=>drag=null);
addEventListener('pointermove',e=>{if(!drag)return;yaw=drag[2]+(e.clientX-drag[0])*.005;pitch=Math.max(-1.4,Math.min(1.4,drag[3]+(e.clientY-drag[1])*.005));});
camera.position.set(0,1.4,0);let lastDraw=0;
renderer.setAnimationLoop(t=>{if(!renderer.xr.isPresenting)camera.rotation.set(pitch,yaw,0,'YXZ');pollGamepads(t);if(t-lastDraw>500){lastDraw=t;drawPanel();}renderer.render(scene,camera);});
// ---------- URL params handoff: ?src=&fmt=&sub= ----------
const P=new URLSearchParams(location.search);
if(P.get('fmt')&&FMTS.includes(P.get('fmt'))){st.fmt=P.get('fmt');$('fmt').value=st.fmt;}
if(P.get('src')){const s=P.get('src');$('vurl').value=s;video.crossOrigin='anonymous';setSrc(s);$('bigEnter').hidden=false;
 if(/^blob:/.test(s))status('❌ روابط blob لا يمكن نقلها بين المتصفحات.');}
if(P.get('sub'))fetch(P.get('sub')).then(r=>r.text()).then(t=>loadSubText(t)).catch(()=>status('❌ تعذّر تحميل الترجمة (CORS؟)'));
$('bigEnter').onclick=()=>{$('bigEnter').hidden=true;enterVR();};
drawPanel();build();window.__VR={video,st,srtToVtt,say,act};
