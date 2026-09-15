import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [w,h] of [[320,568],[375,667],[390,844],[414,896]]) {
  const ctx = await b.newContext({ viewport:{width:w,height:h}, hasTouch:true, isMobile:true, deviceScaleFactor:2 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:3000/dev/arcade', { waitUntil: 'networkidle' });
  const r = await p.evaluate(() => {
    const cards=[...document.querySelectorAll('button')].filter(b=>!b.hasAttribute('data-arena-fire')&&b.textContent.trim());
    const lowest = cards.length ? Math.max(...cards.map(e=>e.getBoundingClientRect().bottom)) : 0;
    const fire=document.querySelector('[data-arena-fire]');
    return { scrollH: document.documentElement.scrollHeight, vh: window.innerHeight,
             cardsBottom: Math.round(lowest), cardsTop: cards.length?Math.round(Math.min(...cards.map(e=>e.getBoundingClientRect().top))):0,
             fireTop: fire?Math.round(fire.getBoundingClientRect().top):null };
  });
  const over = r.scrollH - r.vh;
  console.log(`${String(w).padStart(3)}×${String(h).padEnd(3)}  מסמך:${String(r.scrollH).padStart(4)}  חלון:${String(r.vh).padStart(3)}  ${over>0?`🔴 גלילה ${String(over).padStart(3)}px`:'✅ נכנס   '}  קלפים ${r.cardsTop}→${r.cardsBottom} ${r.cardsBottom>r.vh?`⛔ ${r.cardsBottom-r.vh}px מתחת לקפל`:'✅ נראים'}`);
  await ctx.close();
}
await b.close();
