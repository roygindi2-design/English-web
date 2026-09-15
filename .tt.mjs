import { chromium, devices } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ ...devices['iPhone 13'], hasTouch:true, isMobile:true });
const p = await ctx.newPage();
await p.goto('http://localhost:3000/dev/arcade', { waitUntil:'networkidle' });
const w = () => p.evaluate(()=> (document.body.innerText.match(/Lorem\d+|Ipsum\d+/)||['?'])[0]);
const hp = () => p.evaluate(()=> (document.body.innerText.match(/(\d+)\/100/)||[,'?'])[1]);
console.log('התחלה:', await w(), 'חיי יריב:', await hp());
for (let r=1;r<=3;r++){
  const card = p.locator('button').filter({ hasText: /אפשרות|מסיח/ }).first();
  await card.scrollIntoViewIfNeeded();
  await card.click(); await p.waitForTimeout(250);
  await card.click(); await p.waitForTimeout(800);
  console.log(`אחרי הקשה-הקשה #${r}:`, await w(), 'חיי יריב:', await hp());
}
await b.close();
