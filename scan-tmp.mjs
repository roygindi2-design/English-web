import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const LINK_WITH_LABEL =
  /<Link\b[^>]*href=\{?['"`](\/[\w\-/]*)['"`][^>]*>\s*\{?\s*'?"?([^<>{}'"]{2,40}?)'?"?\s*\}?\s*<\/Link>/g;
const HEB = /[֐-׿]/;
function walk(d, out=[]) { for (const n of readdirSync(d)) { const p=join(d,n); const s=statSync(p);
  if (s.isDirectory()) walk(p,out); else if (/\.tsx?$/.test(n) && !/\.test\./.test(n)) out.push(p); } return out; }
const files = [...walk('app'), ...walk('components')];
const src = files.map(f=>readFileSync(f,'utf8')).join('\n');
const map = new Map();
for (const m of src.matchAll(LINK_WITH_LABEL)) {
  const d=m[1], l=(m[2]??'').trim(); if(!HEB.test(l)) continue;
  (map.get(d) ?? map.set(d,new Set()).get(d)).add(l);
}
console.log('destinations the gate can see:', map.size);
for (const [d,s] of map) console.log('   ', d, '=>', [...s].join(' | '));
let total=0, constLabel=0; const consts=[];
const ALL = /<Link\b[^>]*href=\{?['"`]?([^\s'"`>]*)['"`]?[^>]*>([\s\S]{0,140}?)<\/Link>/g;
for (const mm of src.matchAll(ALL)) { total++; if (/\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}/.test(mm[2])) { constLabel++; consts.push(mm[1]+' <= '+mm[2].replace(/\s+/g,' ').trim().slice(0,60)); } }
console.log('total <Link ...>…</Link>:', total, '· label is an EXPRESSION (const):', constLabel);
consts.forEach(c=>console.log('   ⛔ invisible:', c));
