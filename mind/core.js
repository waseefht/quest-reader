// Pure logic (browser + node)
(function(root){
function chunkText(text,size=800,overlap=150){
  text=String(text||'').replace(/\r/g,'').replace(/[ \t]+/g,' ').trim();
  if(!text) return [];
  const out=[];let i=0;
  while(i<text.length){
    let end=Math.min(i+size,text.length);
    if(end<text.length){const cut=Math.max(text.lastIndexOf('\n',end),text.lastIndexOf('. ',end),text.lastIndexOf('。',end));if(cut>i+size*0.5) end=cut+1;}
    const c=text.slice(i,end).trim(); if(c) out.push(c);
    if(end>=text.length) break;
    i=Math.max(end-overlap,i+1);
  }
  return out;
}
function cosine(a,b){let d=0,na=0,nb=0;const n=Math.min(a.length,b.length);for(let i=0;i<n;i++){d+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}return na&&nb?d/(Math.sqrt(na)*Math.sqrt(nb)):0;}
function topK(qv,items,k=4,min=0.2){return items.map(it=>({...it,score:cosine(qv,it.vec)})).filter(x=>x.score>=min).sort((a,b)=>b.score-a.score).slice(0,k);}
function parseFacts(content){
  if(content==null) return [];
  let s=typeof content==='string'?content:JSON.stringify(content);
  s=s.replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
  let j;try{j=JSON.parse(s);}catch(e){const m=s.match(/\{[\s\S]*\}|\[[\s\S]*\]/);if(!m)return [];try{j=JSON.parse(m[0]);}catch(e2){return [];}}
  const arr=Array.isArray(j)?j:(j.facts||j.memories||[]);
  return arr.map(f=>typeof f==='string'?{text:f,category:'عام'}:{text:String(f.text||f.fact||'').trim(),category:f.category||'عام'}).filter(f=>f.text.length>2);
}
function importToText(name,raw){
  const ext=(name.split('.').pop()||'').toLowerCase();
  if(ext==='json'){try{const j=JSON.parse(raw);const msgs=[];
    const walk=o=>{if(Array.isArray(o))o.forEach(walk);else if(o&&typeof o==='object'){
      if(o.mapping)Object.values(o.mapping).forEach(n=>{const m=n.message;if(m&&m.content&&m.content.parts)msgs.push((m.author&&m.author.role||'')+': '+m.content.parts.filter(p=>typeof p==='string').join(' '));});
      else if(typeof o.content==='string'&&o.role)msgs.push(o.role+': '+o.content);
      else if(typeof o.text==='string')msgs.push(o.text);
      else Object.values(o).forEach(walk);}};
    walk(j);return msgs.length?msgs.join('\n'):JSON.stringify(j,null,1);}catch(e){return raw;}}
  if(ext==='csv') return raw.split('\n').map(l=>l.split(',').join(' | ')).join('\n');
  return raw;
}
const api={chunkText,cosine,topK,parseFacts,importToText};
if(typeof module!=='undefined')module.exports=api;else root.Core=api;
})(this);
