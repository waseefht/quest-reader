// Quest Subtitle Reader – Cloudflare Worker proxy.
// Usage: https://<your-worker>.workers.dev/https://site.com/page
// Personal use only. Does not handle DRM; many login/anti-bot sites may break.
import { proxify, targetFrom, rewriteSrcset, rewriteText } from './rewrite.js';
import READER from './reader.txt';

const ATTRS = [['a','href'],['area','href'],['link','href'],['form','action'],['img','src'],['script','src'],['iframe','src'],['frame','src'],['video','src'],['video','poster'],['audio','src'],['source','src'],['track','src'],['embed','src'],['object','data'],['input','src']];
const DROP = ['content-security-policy','content-security-policy-report-only','x-frame-options','cross-origin-embedder-policy','cross-origin-opener-policy','cross-origin-resource-policy','strict-transport-security','content-encoding','content-length'];

class AttrRW { constructor(a,b,o){this.a=a;this.b=b;this.o=o;}
  element(el){ const v=el.getAttribute(this.a); if(v!=null) el.setAttribute(this.a, proxify(v,this.b,this.o));
    if(el.hasAttribute('integrity')) el.removeAttribute('integrity');
    const ss=el.getAttribute('srcset'); if(ss) el.setAttribute('srcset', rewriteSrcset(ss,this.b,this.o)); } }

export default {
  async fetch(request) {
    const url = new URL(request.url), origin = url.origin;
    if (url.pathname === '/__reader.js') return new Response(READER, {headers:{'content-type':'application/javascript; charset=utf-8','cache-control':'max-age=3600','access-control-allow-origin':'*'}});
    if (url.pathname === '/__tts') { // CORS-enabled TTS so the reader can route the voice through Web Audio
      const q=(url.searchParams.get('q')||'').slice(0,200), tl=(url.searchParams.get('tl')||'ar').slice(0,10);
      const r=await fetch('https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl='+encodeURIComponent(tl)+'&q='+encodeURIComponent(q));
      return new Response(r.body,{status:r.status,headers:{'content-type':r.headers.get('content-type')||'audio/mpeg','access-control-allow-origin':'*','cache-control':'max-age=86400'}});
    }
    let target = targetFrom(request.url);
    // UI mode: invisible by default; ?ui=box shows the box (remembered in a cookie)
    let ui = /(?:^|;\s*)qsr_ui=box/.test(request.headers.get('cookie')||'') ? 'box' : 'hidden', setUi = null;
    if (target && /^(box|hidden)$/.test(target.searchParams.get('ui')||'')) { ui = setUi = target.searchParams.get('ui'); target.searchParams.delete('ui'); }
    if (!target) {
      // relative request that escaped rewriting: use Referer to recover the target site
      const ref = request.headers.get('referer'); const rt = ref && targetFrom(ref);
      if (rt) return Response.redirect(origin + '/' + new URL(url.pathname + url.search, rt).href, 302);
      return new Response('<meta charset=utf-8><body dir=rtl style="font:22px sans-serif;background:#111;color:#eee;padding:30px"><h1>قارئ الترجمة – Proxy</h1><p>اكتب: '+origin+'/https://example.com</p>', {headers:{'content-type':'text/html; charset=utf-8'}});
    }
    const h = new Headers();
    for (const k of ['accept','accept-language','range','content-type','user-agent','cookie']) { const v=request.headers.get(k); if(v) h.set(k,v); }
    h.set('referer', target.origin + '/');
    const init = {method:request.method, headers:h, redirect:'manual'};
    if (!['GET','HEAD'].includes(request.method)) init.body = request.body;
    const res = await fetch(target.href, init);
    const out = new Headers(res.headers); DROP.forEach(k=>out.delete(k));
    out.set('access-control-allow-origin','*');
    const loc = res.headers.get('location'); if (loc) out.set('location', proxify(loc, target.href, origin));
    // cookies: drop Domain/Secure-site binding so they stick to the worker host (minimal forwarding)
    const sc = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (sc.length){ out.delete('set-cookie'); sc.forEach(c=>out.append('set-cookie', c.replace(/;\s*domain=[^;]*/ig,'').replace(/;\s*samesite=[^;]*/ig,'')+'; SameSite=Lax')); }
    if (setUi) out.append('set-cookie','qsr_ui='+setUi+'; Path=/; Max-Age=31536000; SameSite=Lax');
    const ct = (res.headers.get('content-type')||'').toLowerCase();
    if (ct.includes('text/html')) {
      let rw = new HTMLRewriter()
        .on('head', {element(e){ e.prepend('<script>window.__QSR_AUTO=1;window.__QSR_UNI=1;window.__QSR_TTSBASE="'+origin+'";'+(ui=='box'?'':'window.__QSR_HIDDEN=1;')+'</script><script src="'+origin+'/__reader.js" defer></script>', {html:true}); }})
        .on('meta[http-equiv]', {element(e){ if(/content-security-policy/i.test(e.getAttribute('http-equiv')||'')) e.remove(); }})
        .on('base[href]', {element(e){ e.setAttribute('href', proxify(e.getAttribute('href'), target.href, origin)); }});
      for (const [t,a] of ATTRS) rw = rw.on(t+'['+a+']', new AttrRW(a, target.href, origin));
      rw = rw.on('img[srcset],source[srcset]', {element(e){ e.setAttribute('srcset', rewriteSrcset(e.getAttribute('srcset'), target.href, origin)); }});
      return rw.transform(new Response(res.body, {status:res.status, headers:out}));
    }
    if (ct.includes('mpegurl') || ct.includes('text/vtt') || /\.(m3u8|vtt)(\?|$)/i.test(target.pathname)) {
      const txt = await res.text();
      return new Response(rewriteText(txt, target.href, origin), {status:res.status, headers:out});
    }
    return new Response(res.body, {status:res.status, headers:out}); // stream video/images/etc.
  }
};
