// URL rewriting helpers shared by worker.js and tests
export function proxify(raw, base, origin) {
  if (raw == null) return raw;
  var v = String(raw).trim();
  if (!v || /^(data:|blob:|javascript:|mailto:|tel:|about:|#)/i.test(v)) return raw;
  if (v.indexOf(origin + '/') === 0) return raw;
  var abs;
  try { abs = new URL(v, base); } catch (e) { return raw; }
  if (abs.protocol !== 'http:' && abs.protocol !== 'https:') return raw;
  return origin + '/' + abs.href;
}
export function targetFrom(reqUrl) {
  var u = new URL(reqUrl);
  var rest = u.pathname.slice(1) + u.search;
  rest = rest.replace(/^(https?):\/(?!\/)/i, '$1://');
  if (!/^https?:\/\//i.test(rest)) return null;
  try { return new URL(rest); } catch (e) { return null; }
}
export function rewriteSrcset(v, base, origin) {
  return String(v).split(',').map(function (p) {
    var t = p.trim().split(/\s+/); if (!t[0]) return p;
    t[0] = proxify(t[0], base, origin); return t.join(' ');
  }).join(', ');
}
export function rewriteText(body, base, origin) {
  // m3u8 / vtt : rewrite URL lines and URI="..." attributes
  return body.split(/\r?\n/).map(function (line) {
    if (/^#/.test(line)) return line.replace(/URI="([^"]+)"/g, function (_, u) { return 'URI="' + proxify(u, base, origin) + '"'; });
    if (/^\s*$/.test(line) || /-->/.test(line) || /^WEBVTT/.test(line)) return line;
    if (/^(https?:\/\/|\/|[\w.-]+\.(ts|m4s|mp4|aac|m3u8|vtt|key)(\?|$))/i.test(line.trim())) return proxify(line.trim(), base, origin);
    return line;
  }).join('\n');
}
