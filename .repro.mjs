import { chromium, devices } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ ...devices['iPhone 13'], hasTouch: true, isMobile: true });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('  🔴 pageerror:', e.message.slice(0,140)));
await p.goto('http://localhost:3000/dev/arcade', { waitUntil: 'networkidle' });

const state = () => p.evaluate(() => {
  const all = (document.body.innerText||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const word = all.find(s => /^Lorem|^Ipsum|^[A-Za-z]+\d*$/.test(s) && s.length<20);
  const fire = document.querySelector('[data-arena-fire]');
  const hp = all.find(s => /\d+\/\d+/.test(s));
  return { word, fireDisabled: fire ? fire.disabled : null, fireText: fire?fire.textContent.trim().slice(0,30):null, hp,
           cards: [...document.querySelectorAll('[data-arena-card],button')].filter(b=>!b.hasAttribute('data-arena-fire')).map(b=>b.textContent.trim().slice(0,16)) };
});

console.log('① התחלה:', JSON.stringify(await state()));
const card = p.locator('button').filter({ hasText: 'אפשרות 1' }).first();
await card.click();
await p.waitForTimeout(400);
console.log('② אחרי הקשה על קלף:', JSON.stringify(await state()));
const fire = p.locator('[data-arena-fire]');
if (await fire.isEnabled()) {
  await fire.click();
  await p.waitForTimeout(900);
  console.log('③ אחרי הקשה על היריב:', JSON.stringify(await state()));
} else { console.log('③ ⛔ כפתור היריב עדיין מנוטרל'); }
await b.close();
