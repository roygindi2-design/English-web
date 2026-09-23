#!/usr/bin/env node
/**
 * ⟦NEW 11/09 · `F-213`⟧ **«האם הראש הזה כבר אומת?» — קוד יציאה, ⛔ ולא הוראת קריאה.**
 *
 * 🔬 **הממצא שהוליד את זה, נמדד 11/09 13:43:35Z:** טיק QA-שער רץ **4:59** והריץ
 * `verify` מלא (183ש), בעוד `refs/notes/verify` נשא על **אותו ראש בדיוק**
 * `verify: exit 0 · 13:40:35Z · 1f55520`. ⛔ **וההוראה ⛔ לא הייתה שבורה** — שתי
 * הפקודות שלה הורצו מילה במילה בשיבוט נקי והחזירו exit 0 עם החותמת. ⇒ **הכשל היה
 * באכיפה:** כלל שנכתב כפרוזה בתוך בלוק דחוס ⛔ אינו מותיר עקבות ו⛔ אינו נמדד.
 *
 * ⇒ ‏`npm run verify:attested && echo skip || npm run verify` — **ההכרעה היא קוד
 * יציאה**, ו⛔ לא שאלה של מה הסוכן קרא.
 *
 * ⛔ **והכלל עצמו ⛔ לא זז ו⛔ לא רוכך:**
 *   exit 0  ⇐ ⛔ **רק** `verify:` מלא, exit 0, על ה-SHA הזה בדיוק
 *   exit 1  ⇐ `verify(fast)` · ⛔ אין הערה · SHA אחר · כל ספק ⇒ **הרץ**
 *
 * ⚠️ **ו-`verify(fast)` מוחזר במפורש כ-«הרץ»**, ⛔ ולא כ«אומת»: המסלול המהיר מריץ
 * שלוש בדיקות מתוך תשע, וחותמת שאומרת `fast` היא בדיוק הצהרה שהשאר ⛔ לא רץ.
 *
 *   npm run verify:attested [ref]     ⇐ ברירת מחדל: HEAD
 */
import { execFileSync } from 'node:child_process';

const REF = process.argv[2] ?? 'HEAD';

function git(args, quiet = true) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: quiet ? ['ignore', 'pipe', 'ignore'] : 'inherit' }).trim();
  } catch {
    return null;
  }
}

function main() {
  // ⛔ ההערות ⛔ אינן מגיעות עם `git clone` — הן ref נפרד. ⛔ כישלון כאן ⛔ אינו שגיאה:
  // קלון בלי רשת פשוט ⛔ לא ידע, ו«⛔ לא ידע» ⇒ **הרץ**.
  git(['fetch', 'origin', '+refs/heads/notes-verify:refs/notes/verify']);

  const sha = git(['rev-parse', REF]);
  if (!sha) {
    console.log(`verify:attested — ⛔ לא נמדד: ${REF} ⛔ אינו ref תקף ⇒ הרץ verify.`);
    return 1;
  }
  const note = git(['notes', '--ref=verify', 'show', sha]);
  if (!note) {
    console.log(`verify:attested — ⛔ אין הערה על ${sha.slice(0, 7)} ⇒ הרץ verify.`);
    return 1;
  }
  const line = note.split('\n')[0].trim();

  // ⛔ `verify(fast)` נדחה **לפני** שנבדק exit 0: המסלול המהיר הוא הצהרה שהשאר ⛔ לא רץ.
  // ⏱️ ⟦23/09 · `T-429`⟧ ו-`verify(3w)`/`verify(docs)` מאותה סיבה: ההוק הריץ check:mobile
  // בשלושה רוחבים ⛔ ולא בשישה, או ⛔ לא הריץ build ⇒ QA מריצה את המלא.
  if (/^verify\((3w|docs)\)/.test(line)) {
    console.log(`verify:attested — החותמת היא ריצה חלקית של ההוק ⇒ הרץ verify המלא.  «${line}»`);
    return 1;
  }
  if (/^verify\(fast\)/.test(line)) {
    console.log(`verify:attested — החותמת היא המסלול המהיר ⇒ הרץ verify.  «${line}»`);
    return 1;
  }
  if (!/^verify:\s*exit 0\b/.test(line)) {
    console.log(`verify:attested — החותמת ⛔ אינה «verify: exit 0» ⇒ הרץ verify.  «${line}»`);
    return 1;
  }
  // ⛔ החותמת נושאת את ה-SHA שלה. ⛔ הערה שהועתקה מראש אחר ⛔ אינה עדות על הראש הזה.
  if (!line.includes(sha.slice(0, 7))) {
    console.log(`verify:attested — החותמת ⛔ אינה נושאת את ${sha.slice(0, 7)} ⇒ הרץ verify.  «${line}»`);
    return 1;
  }
  console.log(`verify:attested — הראש אומת: «${line}» ⇒ ⛔ אין צורך להריץ verify שוב.`);
  return 0;
}

process.exit(main());
