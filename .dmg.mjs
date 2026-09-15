import { chromium, devices } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ ...devices['iPhone 13'], hasTouch:true, isMobile:true });
const p = await ctx.newPage();
await p.goto('http://localhost:3000/dev/arcade', { waitUntil:'networkidle' });
const hp = () => p.evaluate(()=>{const m=(document.body.innerText.match(/(\d+)\/100/)||[,null]);return m[1]?Number(m[1]):null;});
const dmg = () => p.evaluate(()=>{const d=document.querySelector('[data-arena-damage]');return d?d.textContent.trim():null;});
for (let i=1;i<=3;i++){
  const before = await hp();
  const card = p.locator('button').filter({ hasText: /אפשרות|מסיח/ }).first();
  await card.scrollIntoViewIfNeeded(); await card.click(); await p.waitForTimeout(120); await card.click();
  await p.waitForTimeout(150);
  const shown = await dmg();
  await p.waitForTimeout(700);
  const after = await hp();
  console.log(`#${i}  חיים ${before}⇒${after} (ירידה ${before-after})   המסך הראה: ${shown}   ${String(before-after)===String(shown).replace('−','')?'✅ תואם':'⛔ ⛔ לא תואם'}`);
}
await b.close();
