// node build.mjs : regenerates bookmarklets, install.html and proxy/worker-single.js from overlay.js
import fs from 'node:fs';
let ov = fs.readFileSync('overlay.js','utf8');
const tts = fs.readFileSync('tts-online.js','utf8');
ov = ov.replace(/\/\*QOTTS\*\/[\s\S]*?\/\*\/QOTTS\*\/\n?/,'');
ov = '/*QOTTS*/'+tts.trim()+'/*/QOTTS*/\n'+ov;
fs.writeFileSync('overlay.js', ov);
let min = ov; try { const t = await import('/tmp/pw/node_modules/terser/main.js'); min = (await t.minify(ov,{format:{ascii_only:true}})).code; } catch(e) { min = ov.replace(/\n/g,''); }
fs.writeFileSync('bookmarklet.js', min + '\n');
const reader = 'javascript:' + encodeURIComponent(min);
const uni = 'javascript:' + encodeURIComponent('window.__QSR_HIDDEN=1;window.__QSR_UNI=1;' + min);
const hidden = 'javascript:' + encodeURIComponent('window.__QSR_HIDDEN=1;' + min);
const hiddenNT = 'javascript:' + encodeURIComponent('window.__QSR_HIDDEN=1;window.__QSR_NOTOAST=1;' + min);
fs.writeFileSync('hidden-bookmarklet.js', 'window.__QSR_HIDDEN=1;' + min + '\n');
const tProxy = "javascript:(function(){var tl=prompt('\u0644\u063a\u0629 \u0627\u0644\u062a\u0631\u062c\u0645\u0629 (ar, en, fr...)',localStorage.qsrTl||'ar');if(!tl)return;try{localStorage.qsrTl=tl}catch(e){}var h=location.hostname;if(/\\.translate\\.goog$/.test(h)){var u=new URL(location.href);u.searchParams.set('_x_tr_tl',tl);location.href=u.href;return}var L=location;if(L.protocol!='https:'){L.href='https://translate.google.com/translate?sl=auto&tl='+encodeURIComponent(tl)+'&u='+encodeURIComponent(L.href);return}var q=L.search?L.search+'&':'?';L.href='https://'+h.replace(/-/g,'--').replace(/\\./g,'-')+'.translate.goog'+L.pathname+q+'_x_tr_sl=auto&_x_tr_tl='+encodeURIComponent(tl)+'&_x_tr_hl='+encodeURIComponent(tl)+'&_x_tr_pto=wapp'+L.hash})();";
const tInpage = "javascript:(function(){var tl='ar';document.cookie='googtrans=/auto/'+tl+';path=/';document.cookie='googtrans=/auto/'+tl+';path=/;domain='+location.hostname;if(!document.getElementById('google_translate_element')){var d=document.createElement('div');d.id='google_translate_element';d.style.cssText='position:fixed;top:8px;left:8px;z-index:2147483647;background:#fff;padding:6px;border-radius:8px';document.body.appendChild(d)}window.googleTranslateElementInit=function(){new google.translate.TranslateElement({pageLanguage:'auto',autoDisplay:true},'google_translate_element');setTimeout(function(){var s=document.querySelector('select.goog-te-combo');if(s){s.value=tl;s.dispatchEvent(new Event('change'))}},1500)};var s=document.createElement('script');s.src='https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';s.onerror=function(){alert('\u062a\u0639\u0630\u0651\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u062a\u0631\u062c\u0645 (\u0633\u064a\u0627\u0633\u0629 CSP \u0644\u0644\u0645\u0648\u0642\u0639). \u062c\u0631\u0651\u0628 \u0648\u0636\u0639 \u0627\u0644\u0640 Proxy.')};document.head.appendChild(s)})();";
const ho=fs.readFileSync('handoff.js','utf8');let hmin=ho;try{const t=await import('/tmp/pw/node_modules/terser/main.js');hmin=(await t.minify(ho,{format:{ascii_only:true}})).code;}catch(e){}
fs.writeFileSync('handoff-bookmarklet.js',hmin+'\n');const vrBm='javascript:'+encodeURIComponent(hmin);
fs.writeFileSync('translate-bookmarklets.txt', 'PROXY MODE:\n'+tProxy+'\n\nIN-PAGE MODE:\n'+tInpage+'\n');
const esc = s => s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const block = (title, desc, code) => `<section class="card"><h2>${title}</h2><p>${desc}</p>
<div class="row"><a class="btn bm" href="${esc(code)}">${title}</a><button class="btn primary" onclick="cp(this)">📋 نسخ الكود</button></div>
<textarea class="code" readonly>${esc(code)}</textarea></section>`;
fs.writeFileSync('install.html', `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><meta name="viewport" content="width=device-width,initial-scale=1"><title>تثبيت الإضافات</title><link rel="stylesheet" href="style.css"></head><body>
<header><h1>⭐ إضافات المتصفح (Bookmarklets)</h1><a class="btn small" href="index.html">الرئيسية</a></header><main>
<section class="card"><h2>كيف أضيف إضافة في Meta Quest Browser؟</h2><ol>
<li>اضغط «📋 نسخ الكود» تحت الإضافة المطلوبة.</li>
<li>افتح أي صفحة، ثم من القائمة (⋮ أو أيقونة النجمة) اختر <b>إضافة إشارة مرجعية / Add bookmark</b>.</li>
<li>افتح <b>الإشارات المرجعية / Bookmarks</b>، اضغط ⋮ بجانب الإشارة الجديدة ← <b>تعديل / Edit</b>.</li>
<li>غيّر الاسم (مثلاً «قارئ الترجمة») واحذف الرابط والصق الكود مكانه (يبدأ بـ <code>javascript:</code>) ثم احفظ.</li>
<li>افتح موقع الفيلم، ثم افتح الإشارة من قائمة الإشارات ليعمل على الصفحة الحالية.</li></ol>
<p class="hint">على الكمبيوتر يمكن سحب الزر الأخضر إلى شريط الإشارات مباشرة.</p></section>
<section class="card" style="border:2px solid #2ea043"><h2>🎬 الدبلجة — الأداة الوحيدة التي تحتاجها</h2><p><b>ضغطة واحدة</b> على موقع الفيلم: تبدأ قراءة الترجمة بصوت نسائي «مدبلج» بلا أي واجهة، ويُخفَض صوت الفيديو أثناء الكلام ليبدو الصوت جزءًا من الفيلم. <b>اضغطها مرة ثانية خلال 3 ثوانٍ</b> لفتح الصندوق (اختيار منطقة الترجمة والإعدادات). ضغطة لاحقة = إيقاف. إعداداتك من الصفحة الرئيسية (الخفض، الدمج، الصوت المكاني، السرعة) تُضمَّن في الإضافة عند نسخها من هنا.</p>
<div class="row"><a class="btn bm primary" id="uniA" href="${esc(uni)}" data-base="${esc(uni)}" style="font-size:1.4em">🎬 الدبلجة</a><button class="btn primary" onclick="cp(this)">📋 نسخ الكود</button></div>
<textarea class="code" id="uniT" readonly>${esc(uni)}</textarea></section>
<details class="card"><summary><h2 style="display:inline">⚙️ أدوات متقدمة (القديمة)</h2></summary>
${block('🔊 قارئ الترجمة', 'صندوق قابل للسحب وتغيير الحجم: ضعه فوق الترجمة فيُقرأ ما بداخله فقط (ترجمة VTT، YouTube، ترجمات نصية في الصفحة، وOCR اختياري). اضغطه مرة أخرى لإخفائه/إظهاره.', reader)}
${block('🔈 قارئ مخفي', 'ضغطة واحدة تبدأ قراءة الترجمة تلقائيًا بلا أي صندوق أو واجهة: مسارات ترجمة الفيديو وترجمات الصفحة في أي مكان، بصوت أنثوي تلقائي وبإعداداتك المحفوظة. يقول «تم التشغيل» مع إشعار صغير يختفي خلال 1.5 ثانية. اضغط الإشارة نفسها مرة أخرى للإيقاف («تم الإيقاف»). يعمل في ملء الشاشة.', hidden)}
${block('🔈 قارئ مخفي (بدون إشعار)', 'نفس القارئ المخفي لكن بدون الإشعار المرئي (التأكيد الصوتي فقط).', hiddenNT)}
${block('🌐 ترجمة الصفحة (Proxy)', 'ينقلك إلى نسخة مترجمة من Google (translate.goog) وتبقى الروابط مترجمة أثناء التصفح. يسألك عن اللغة (الافتراضي ar).', tProxy)}
${block('🌐 ترجمة داخل الصفحة', 'بديل للمواقع التي تفشل مع الـ Proxy (تسجيل دخول/مواقع ديناميكية): يحقن مترجم Google داخل الصفحة. قد تمنعه سياسة CSP في بعض المواقع.', tInpage)}
${block('🥽 افتح في VR', 'من Chrome/Edge المثبّت جانبيًا على Quest: يجد فيديو الصفحة (الأكبر/المشغّل، أو source، أو og:video) ويفتحه في مشغّل VR داخل Meta Quest Browser عبر Android intent، ويضيف زر «افتح في VR» فوق كل فيديو. أول مرة يسألك عن رابط مشغّل VR المستضاف (مثل https://USER.github.io/QuestReader/vr/index.html) ويحفظه. لتغييره: <code>localStorage.removeItem(\'qsr_vr_base\')</code>. يعمل فقط مع روابط ملفات مباشرة (mp4/webm/m3u8)، وليس blob/MSE/DRM. لم يُجرَّب على الجهاز.', vrBm)}
</details></main><script>(function(){try{var s=JSON.parse(localStorage.getItem('qr_state')||'{}'),d={};['duck','blend','rate'].forEach(function(k){if(s[k]!=null)d[k]=+s[k];});if(s.spatial!=null)d.spatial=!!s.spatial;if(s.voice&&/^g:/.test(s.voice))d.voice=s.voice;if(!Object.keys(d).length)return;var a=document.getElementById('uniA'),base=a.dataset.base,code='javascript:'+encodeURIComponent('window.__QSR_DEF='+JSON.stringify(d)+';'+decodeURIComponent(base.slice(11)));a.href=code;document.getElementById('uniT').value=code;}catch(e){}})();function cp(b){var t=b.parentNode.nextElementSibling;t.select();try{navigator.clipboard.writeText(t.value).then(function(){b.textContent='✅ تم النسخ';},function(){document.execCommand('copy');b.textContent='✅ تم النسخ';});}catch(e){document.execCommand('copy');b.textContent='✅ تم النسخ';}}</script></body></html>
`);
fs.copyFileSync('overlay.js','proxy/reader.txt');
let rw = fs.readFileSync('proxy/rewrite.js','utf8').replace(/^export /gm,'');
let wk = fs.readFileSync('proxy/worker.js','utf8').replace(/^import .*$/gm,'');
fs.writeFileSync('proxy/worker-single.js', '// AUTO-GENERATED single file for Cloudflare dashboard paste-and-deploy (node build.mjs)\nconst READER = ' + JSON.stringify(ov) + ';\n' + rw + wk);
console.log('uni:',uni.length,'bookmarklet chars:', reader.length, 'hidden:', hidden.length);
