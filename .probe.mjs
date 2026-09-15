import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport:{width:375,height:667}, hasTouch:true, isMobile:true });
const p = await ctx.newPage();
await p.goto('http://localhost:3000/dev/arcade', { waitUntil:'networkidle' });
const chain = await p.evaluate(() => {
  const sec = document.querySelector('[data-arena-scope]');
  const out = [];
  for (let n = sec; n && n !== document.documentElement; n = n.parentElement) {
    const cs = getComputedStyle(n), r = n.getBoundingClientRect();
    out.push(`${n.tagName.toLowerCase()}${n.className?('.'+String(n.className).split(' ').slice(0,3).join('.')):''}  h=${Math.round(r.height)} pt=${cs.paddingTop} pb=${cs.paddingBottom} mt=${cs.marginTop} mb=${cs.marginBottom} minh=${cs.minHeight}`);
  }
  out.push(`html h=${Math.round(document.documentElement.getBoundingClientRect().height)} scrollH=${document.documentElement.scrollHeight}`);
  return out;
});
chain.forEach(l=>console.log(' ', l));
await b.close();
