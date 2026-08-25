#!/usr/bin/env node
/**
 * T-196 · P4-2 — **צילום ורנדר זה לצד זה, ⛔ ולא השוואת פיקסלים.**
 *
 * ⛔ **למה ⛔ לא השוואת פיקסלים, וזו ההכרעה המרכזית כאן:** הרנדרים ב-`docs/design/`
 * רונדרו בכלי גרפי אחר, בגופנים אחרים ובאנטי-אליאסינג אחר. השוואה מספרית ביניהם
 * לבין דפדפן אמיתי מחזירה **הבדל בכל פיקסל כמעט**, כלומר רעש. ⇒ **כלי שמדווח
 * «נכשל» על מסך מושלם הוא כלי שכל סוכן לומד להתעלם ממנו** — וזה גרוע מלא למדוד.
 * ⇒ הכלי מייצר **תמונה אחת**, שני חצאים, ו**עין אנושית או עין של סוכן מסתכלת**.
 *
 * ⛔ **הכלי ⛔ אינו מכריע ו⛔ אינו חוסם.** הוא מכין את הראיה; ההכרעה היא של QA.
 *
 * שימוש:
 *   npm run diff:render /world/story docs/design/kol-A-05-story.png
 *   npm run diff:render /dev/lesson docs/design/kol-A-07-lesson.png out.png
 *
 * ⚠️ דורש שרת חי על PORT (ברירת מחדל 3000). ⛔ הוא ⛔ אינו מרים שרת בעצמו:
 * ‏`next dev` ו-`next start` הם החלטות של הקורא, ⛔ ולא של כלי השוואה.
 */
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [route, renderPath, outArg] = process.argv.slice(2);
if (!route || !renderPath) {
  console.error('usage: diff:render <route> <render.png> [out.png]');
  process.exit(2);
}
if (!route.startsWith('/')) throw new Error(`diff:render: route "${route}" ⛔ אינו מתחיל ב-/`);
if (!existsSync(renderPath)) throw new Error(`diff:render: ⛔ אין קובץ רנדר ב-${renderPath}`);

const PORT = Number(process.env.PORT ?? 3000);
const WIDTH = 375;
const HEIGHT = 780;
const out = outArg ?? path.join('docs', `diff-render-${route.replace(/\W+/g, '-').replace(/^-|-$/g, '')}.png`);

/** ⛔ מועתק מ-`scripts/verify-mobile.mjs` בכוונה: הפין של playwright ⛔ אינו תקף בארגז החול. */
function resolveChromiumPath() {
  const candidates = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (root && existsSync(root)) {
    candidates.push(path.join(root, 'chromium'));
    const subs = [
      'chrome-linux/chrome',
      'chrome-linux64/chrome',
      'chrome-headless-shell-linux64/chrome-headless-shell',
      'chrome-linux/headless_shell',
    ];
    const dirs = readdirSync(root)
      .filter((e) => e.startsWith('chromium'))
      .sort((a, b) => Number(a.includes('headless')) - Number(b.includes('headless')));
    for (const d of dirs) for (const s of subs) candidates.push(path.join(root, d, s));
  }
  try {
    candidates.push(chromium.executablePath());
  } catch {
    /* no registry entry — the explicit probes above still apply */
  }
  candidates.push('/usr/bin/chromium', '/usr/bin/chromium-browser');
  return candidates.find((c) => c && existsSync(c)) ?? null;
}

const url = `http://127.0.0.1:${PORT}${route}`;
try {
  const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (res.status >= 400) {
    throw new Error(`diff:render: ${url} החזיר ${res.status} — ⛔ אין מה להשוות`);
  }
} catch (e) {
  throw new Error(
    `diff:render: ⛔ אין שרת על ${url} (${e instanceof Error ? e.message : e}). הרם אותו: (npx next dev -p ${PORT} &) && sleep 25`,
  );
}

const exe = resolveChromiumPath();
if (exe === null) throw new Error('diff:render: ⛔ לא נמצא chromium');

const browser = await chromium.launch({ executablePath: exe });
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
await page.goto(url, { waitUntil: 'networkidle' });
const shot = await page.screenshot();
await browser.close();

/**
 * ההרכבה נעשית בדפדפן עצמו: שני `<img>` זה לצד זה על קנבס אחד. ⛔ אין תלות חדשה
 * בספריית תמונות — הכלי שכבר קיים בריפו הוא זה שמצייר.
 */
const b64 = (buf) => `data:image/png;base64,${buf.toString('base64')}`;
const renderB64 = b64(await (await import('node:fs/promises')).readFile(renderPath));
const composer = await chromium.launch({ executablePath: exe });
const cp = await composer.newPage({ viewport: { width: WIDTH * 2 + 60, height: HEIGHT + 90 } });
await cp.setContent(`<!doctype html><meta charset="utf-8">
<style>
  body { margin:0; background:#111827; font:13px system-ui,sans-serif; color:#e5e7eb; }
  .row { display:flex; gap:20px; padding:20px; }
  figure { margin:0; }
  figcaption { padding:6px 2px; direction:ltr; }
  img { width:${WIDTH}px; display:block; border:1px solid #374151; }
  .n { color:#9ca3af; }
</style>
<div class="row">
  <figure><figcaption>RENDER <span class="n">${renderPath}</span></figcaption><img src="${renderB64}"></figure>
  <figure><figcaption>LIVE <span class="n">${route} @ ${WIDTH}x${HEIGHT}</span></figcaption><img src="${b64(shot)}"></figure>
</div>`);
const composed = await cp.screenshot();
await composer.close();
writeFileSync(out, composed);

console.log(`diff:render — ${out}`);
console.log(`  שמאל: הרנדר ${renderPath}`);
console.log(`  ימין: ${route} חי ב-${WIDTH}x${HEIGHT}`);
console.log('');
console.log('⛔ הכלי ⛔ אינו מכריע ו⛔ אינו חוסם — הוא מכין את הראיה.');
console.log('⇒ **קרא את הקובץ בעיניים** ודווח הבדלים בשבעת הסעיפים שבפרומפט QA.');
console.log('⛔ ⛔ אין כאן השוואת פיקסלים: הרנדרים רונדרו בכלי אחר, וכל פיקסל היה נחשב הבדל.');
console.log('');
console.log('⚠️ **סגור את `next dev` לפני `npm run verify`.** נמדד 24/08: שרת פיתוח שנשאר חי');
console.log('   על 3000 גרם ל-`check:mobile` להיבדק מולו במקום מול `next start` — **שני כשלים');
console.log('   שנראו אמיתיים ו⛔ לא היו**: service worker ⛔ אינו נרשם ב-dev, ו-`/api/*` מחזיר 503.');
