import { chromium, devices } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ ...devices['iPhone 13'], hasTouch:true, isMobile:true });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('🔴 pageerror:', e.message.slice(0,140)));
await p.goto('http://localhost:3000/dev/arcade', { waitUntil:'networkidle' });

const probe = () => p.evaluate(() => {
  const hp = document.querySelector('[data-arena-hp-fill]');
  const mana = document.querySelector('[data-arena-mana-fill]');
  const dmg = document.querySelector('[data-arena-damage]');
  const stage = document.querySelector('[data-arena-stage-area]');
  return {
    hpTransition: hp ? getComputedStyle(hp).transitionDuration : null,
    manaTransition: mana ? getComputedStyle(mana).transitionDuration : null,
    damage: dmg ? dmg.textContent.trim() : null,
    damageAnim: dmg ? getComputedStyle(dmg).animationName : null,
    crit: stage ? stage.getAttribute('data-arena-crit') : null,
    word: (document.body.innerText.match(/Lorem\d+|Ipsum\d+/)||['?'])[0],
  };
});
console.log('לפני הטלה:', JSON.stringify(await probe()));
const card = p.locator('button').filter({ hasText: /אפשרות|מסיח/ }).first();
await card.scrollIntoViewIfNeeded(); await card.click(); await p.waitForTimeout(120);
await card.click();
await p.waitForTimeout(120);
console.log('120ms אחרי:', JSON.stringify(await probe()));
await p.waitForTimeout(700);
console.log('820ms אחרי:', JSON.stringify(await probe()));
await b.close();
