#!/usr/bin/env node
/**
 * 🚶 **הליכת מסכים — פתיחת מסך אמיתי בדפדפן, ⛔ לא טענה עליו.**  ⟦NEW 09/09 · הוראת רוי⟧
 *
 * 🔬 **למה זה קיים, ומה `check:mobile` ⛔ אינו עושה.** `verify-mobile.mjs` מריץ 1,519
 * טענות על 320/375/414 — ⛔ והוא ⛔ אינו מצלם דבר (מופע `screenshot` אחד בכל הקובץ).
 * ⇒ «ירוק» שם אומר **שהטענות שנכתבו עברו**, ⛔ ולא שמישהו ראה מסך. הכלי הזה פותח כל
 * מסך בדפדפן אמיתי ברזולוציית טלפון, **מצלם אותו**, ומדווח ארבעה דברים שטענה
 * ⛔ אינה תופסת: קוד HTTP · גלילה אופקית · שגיאות קונסול · וכמה טקסט בכלל נצבע.
 *
 * ⚠️ **ומה הוא ⛔ אינו:** הוא ⛔ אינו שופט עיצוב. הוא מפיק **ראיה** — PNG שאדם או סוכן
 * מסתכל בו. ⛔ «ההליכה עברה» ⛔ אינה טענה על איכות המסך.
 *
 * שימוש:  node scripts/walk-screens.mjs [base] [--out=dir] [--width=390] [--routes=a,b]
 *         ברירת מחדל: http://127.0.0.1:3000 ⇐ דורש `next build` ואז `next start`.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';
import { resolveChromiumPath } from './lib/chromium-path.mjs';

const ARGV = process.argv.slice(2);
const flag = (name, dflt) => {
  const hit = ARGV.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? dflt : hit.slice(name.length + 3);
};
const BASE = ARGV.find((a) => !a.startsWith('--')) || `http://127.0.0.1:${process.env.PORT || 3000}`;
const OUT = flag('out', 'walk-shots');
const WIDTH = Number(flag('width', '390'));

/**
 * ⛔ המסכים שהלומד באמת פוגש, ⛔ ולא כל `page.tsx` במאגר. ⇒ רשימה מוצהרת, כדי
 * שהוספת מסך תהיה **החלטה** ו⛔ לא תוצר לוואי של גלוב.
 */
const DEFAULT_ROUTES = [
  '/',
  '/dev/onboarding',
  '/dev/tabs/cards',
  '/dev/card/choice',
  '/dev/tabs/studies',
  '/dev/story',
  '/dev/arcade/home',
  '/dev/arcade/summary',
  '/dev/world',
  '/dev/tabs/me',
];
const ROUTES = (flag('routes', '') || '').trim() === ''
  ? DEFAULT_ROUTES
  : flag('routes', '').split(',').map((r) => r.trim()).filter((r) => r !== '');

const slug = (r) => (r === '/' ? 'root' : r.replace(/^\//, '').replace(/\//g, '-'));

mkdirSync(OUT, { recursive: true });

// ⛔ אותו גישוש שבו `verify-mobile.mjs` משתמש — מודול אחד, ⛔ לא עותק שני.
const executablePath = resolveChromiumPath();
if (executablePath === null) {
  console.log('⛔ לא נמדד — ⛔ אין Chromium על הדיסק. ⇒ ההליכה ⛔ לא רצה.');
  process.exit(1);
}
const browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({
  viewport: { width: WIDTH, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
const allErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') allErrors.push(m.text().slice(0, 200));
});
page.on('pageerror', (e) => allErrors.push(`PAGEERROR: ${String(e).slice(0, 200)}`));
// 🔴 **והכתובת שנכשלה, ⛔ לא רק «נכשל».** «Failed to load resource: 503» ⛔ אינו אומר
// **מה** נכשל ⇒ ⛔ אי אפשר להבחין בין פגם במוצר ובין משתנה סביבה חסר בשיבוט הזה.
page.on('requestfailed', (r) =>
  allErrors.push(`REQFAIL ${r.failure()?.errorText ?? '?'} ⇐ ${r.url().slice(0, 140)}`),
);
page.on('response', (r) => {
  if (r.status() >= 400) allErrors.push(`HTTP ${r.status()} ⇐ ${r.url().slice(0, 140)}`);
});

const rows = [];
for (const route of ROUTES) {
  const before = allErrors.length;
  let status = 0;
  try {
    const res = await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 25_000 });
    status = res?.status() ?? 0;
  } catch (e) {
    rows.push({ route, status: 'NAV-FAIL', note: String(e).slice(0, 100) });
    continue;
  }
  await page.waitForTimeout(400);
  const shot = join(OUT, `${slug(route)}.png`);
  await page.screenshot({ path: shot });
  const text = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  const dir = await page.locator('html').getAttribute('dir').catch(() => null);
  const lang = await page.locator('html').getAttribute('lang').catch(() => null);
  // ⛔ גלילה אופקית בטלפון היא פגם נראה; מדידה ישרה מה-DOM, ⛔ לא מ-CSS.
  const overflowPx = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  rows.push({
    route, status, dir, lang, overflowPx,
    chars: text.length,
    head: text.slice(0, 100),
    newErrors: allErrors.length - before,
    shot,
  });
}
await browser.close();

// ⛔ **מה מפיל, ו⛔ מה רק מדווח.** נפילת ניווט · שגיאת עמוד · גלילה אופקית · מסך
// ריק — ארבעתם פגמים נראים. ⛔ טקסט «מעט» ⛔ אינו פגם, ולכן ⛔ אינו מפיל.
const hard = [];
for (const r of rows) {
  if (r.status === 'NAV-FAIL') hard.push(`${r.route}: ⛔ הניווט נכשל — ${r.note}`);
  else {
    if (typeof r.status === 'number' && r.status >= 400) hard.push(`${r.route}: HTTP ${r.status}`);
    if (r.overflowPx > 0) hard.push(`${r.route}: גלילה אופקית ${r.overflowPx}px ברוחב ${WIDTH}`);
    if (r.chars === 0) hard.push(`${r.route}: ⛔ אפס טקסט נצבע`);
    if (r.newErrors > 0) hard.push(`${r.route}: ${r.newErrors} שגיאות קונסול`);
  }
}

const pad = (s, n) => String(s).padEnd(n);
console.log(`🚶 הליכת מסכים — ${BASE} · רוחב ${WIDTH}px · ${rows.length} מסכים`);
console.log(`${pad('מסך', 24)} ${pad('HTTP', 9)} ${pad('ovf', 5)} ${pad('dir', 5)} ${pad('שגיאות', 7)} טקסט`);
for (const r of rows) {
  console.log(
    `${pad(r.route, 24)} ${pad(r.status, 9)} ${pad(r.overflowPx ?? '-', 5)} ${pad(r.dir ?? '-', 5)} ${pad(r.newErrors ?? '-', 7)} ${r.chars ?? '-'}`,
  );
}
writeFileSync(join(OUT, 'walk.json'), JSON.stringify({ base: BASE, width: WIDTH, rows, allErrors }, null, 1), 'utf8');
console.log(`\n📸 ${rows.filter((r) => r.shot).length} צילומים ⇒ ${OUT}/`);
if (hard.length > 0) {
  console.log(`\n⛔ ${hard.length} פגמים נראים:`);
  for (const h of hard) console.log(`  ⛔ ${h}`);
  process.exit(1);
}
console.log('\n✅ ⛔ אין פגם נראה בהליכה. ⚠️ וזו ⛔ אינה טענה על איכות העיצוב — הסתכל בצילומים.');
