import { chromium, devices } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ ...devices['iPhone 13'], hasTouch: true, isMobile: true });
const p = await ctx.newPage();
await p.goto('http://localhost:3000/dev/arcade', { waitUntil: 'networkidle' });
const word = () => p.evaluate(() => (document.body.innerText.match(/Lorem\d+|Ipsum\d+/)||['?'])[0]);
const layout = await p.evaluate(() => {
  const r = (s) => { const e=document.querySelector(s); if(!e) return null; const b=e.getBoundingClientRect(); return {t:Math.round(b.top),b:Math.round(b.bottom),h:Math.round(b.height)}; };
  const cards=[...document.querySelectorAll('button')].filter(b=>!b.hasAttribute('data-arena-fire')&&b.textContent.trim()).map(e=>{const b=e.getBoundingClientRect();return {txt:e.textContent.trim().slice(0,12),t:Math.round(b.top),h:Math.round(b.height)};});
  return { fire:r('[data-arena-fire]'), cards, vh: window.innerHeight };
});
console.log('פריסה:', JSON.stringify(layout));
console.log('\n=== מסלול הגרירה: גוררים קלף כלפי מעלה ===');
const before = await word();
const c = layout.cards[0];
const x = 195, y0 = c.t + c.h/2;
await p.mouse.move(x, y0); await p.mouse.down();
for (let i=1;i<=10;i++){ await p.mouse.move(x, y0 - (220*i)/10); await new Promise(r=>setTimeout(r,25)); }
await p.mouse.up(); await p.waitForTimeout(900);
console.log(`  «${before}» ⇒ «${await word()}»  ${before!==await word()?'✅ הגרירה עבדה':'⛔ הגרירה ⛔ לא עשתה כלום'}`);
await b.close();
