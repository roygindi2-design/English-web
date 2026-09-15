import { chromium, devices } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ ...devices['iPhone 13'], hasTouch: true, isMobile: true });
const p = await ctx.newPage();
await p.goto('http://localhost:3000/dev/arcade', { waitUntil: 'networkidle' });
const word = () => p.evaluate(() => (document.body.innerText.match(/Lorem\d+|Ipsum\d+/)||['?'])[0]);

const geo = await p.evaluate(() => ({
  vh: window.innerHeight, scrollH: document.documentElement.scrollHeight,
  canScroll: document.documentElement.scrollHeight > window.innerHeight,
  bodyOverflow: getComputedStyle(document.body).overflow,
}));
console.log('גיאומטריה:', JSON.stringify(geo));

// scroll the cards into view, then measure again
await p.evaluate(() => { const c=[...document.querySelectorAll('button')].filter(b=>!b.hasAttribute('data-arena-fire')&&b.textContent.trim())[0]; c?.scrollIntoView({block:'center'}); });
await p.waitForTimeout(300);
const after = await p.evaluate(() => {
  const cards=[...document.querySelectorAll('button')].filter(b=>!b.hasAttribute('data-arena-fire')&&b.textContent.trim()).map(e=>{const b=e.getBoundingClientRect();return {txt:e.textContent.trim().slice(0,10),t:Math.round(b.top),l:Math.round(b.left),w:Math.round(b.width),h:Math.round(b.height)};});
  return { cards, scrollY: Math.round(window.scrollY), vh: window.innerHeight };
});
console.log('אחרי גלילה:', JSON.stringify(after));

if (after.cards.length) {
  const c = after.cards[0];
  const x = c.l + c.w/2, y0 = c.t + c.h/2;
  const before = await word();
  console.log(`\n=== גרירה מ-(${Math.round(x)},${Math.round(y0)}) כלפי מעלה 200px ===`);
  await p.mouse.move(x, y0); await p.mouse.down();
  for (let i=1;i<=12;i++){ await p.mouse.move(x, y0 - (200*i)/12); await new Promise(r=>setTimeout(r,22)); }
  await p.mouse.up(); await p.waitForTimeout(1000);
  const a = await word();
  console.log(`  «${before}» ⇒ «${a}»  ${before!==a?'✅ הגרירה עבדה':'⛔ הגרירה ⛔ לא הטילה'}`);
}
await b.close();
