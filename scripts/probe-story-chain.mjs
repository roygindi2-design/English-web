#!/usr/bin/env node
/**
 * 🔑 **`T-380` — שרשרת הסיפור, נמדדת מול ה-API האמיתי.**
 *
 * 🔬 **מה זה עונה, ו⛔ למה ⛔ אף כלי קיים ⛔ לא ענה עליו.** `check:mobile` מריץ טענות
 * על פיקסטורה; `walk-screens.mjs` מצלם מסכים. ⛔ שניהם ⛔ אינם נוגעים ב-`GET
 * /api/world/story` ⇒ «הסיפור נסגר מקצה לקצה **על נתונים אמיתיים**» — יעד המחלקה
 * `story` — ⛔ מעולם ⛔ לא נמדד. הכלי הזה מבקש את הסיפורים מהנתיב האמיתי וסופר
 * שלושה דברים: כמה מהם נטענים עם מילים להקשה, כמה מהם מקבלים הקשה שנכתבת, וכמה
 * מהם מחזירים שאלה בת שלוש תשובות.
 *
 * ⛔ **⛔ אינו שער.** **מספר מאכזב הוא התוצאה, ⛔ ולא כישלון** (`D-120 § ב`) ⇒ הוא
 * יוצא `0` גם כשהשרשרת שבורה, ⛔ ואינו נכנס ל-`verify`. מי שיהפוך אותו לשער יגלה
 * שהוא מאדים על **סביבה בלי env**, ⛔ ולא על מוצר שבור (`F-262`).
 *
 * ⛔ **⛔ ואינו כותב סיסמה, טוקן או כתובת מסד לדיסק** — הסשן מגיע מ-`/api/dev/session`
 * שכבר קיים, והעוגייה נשארת בזיכרון התהליך.
 *
 * ⛔ **⛔ ואין כאן תלות חדשה.** ‏Node 22 מפשיט טיפוסים במקור ⇒ ייבוא ישיר של
 * `lib/core/storyChainProbe.ts` עובד בלי `tsx` ובלי צעד בנייה. ⛔ זו הסיבה שהחשבון
 * יושב בשכבה הטהורה ו⛔ לא הועתק לכאן: עותק שני הוא בדיוק מה ש-`archive-registers.mjs`
 * שילם עליו (8 תאים מול 9).
 *
 * שימוש:  npm run probe:story -- [base] [--stories=12] [--tap]
 *         ברירת מחדל: http://127.0.0.1:3000 ⇐ דורש `next build` ואז `next start`.
 */
import { reportStoryChain, storyChainLineHe, REQUIRED_ANSWERS } from '../lib/core/storyChainProbe.ts';

const ARGV = process.argv.slice(2);
const flag = (name, dflt) => {
  const hit = ARGV.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? dflt : hit.slice(name.length + 3);
};
const BASE = ARGV.find((a) => !a.startsWith('--')) || `http://127.0.0.1:${process.env.PORT || 3000}`;
const STORIES = Number(flag('stories', '12'));
const TRY_TAP = ARGV.includes('--tap');

/**
 * ⛔ **עוגייה בזיכרון, ⛔ ולא קובץ.** `fetch` של Node ⛔ אינו שומר עוגיות בין קריאות,
 * והחלופה — `--cookie-jar` על הדיסק — הייתה כותבת סשן חי לקלון. ⇒ כותרת אחת.
 */
let cookie = '';

async function call(path, init = {}) {
  const res = await fetch(new URL(path, BASE), {
    ...init,
    redirect: 'manual',
    headers: { ...(init.headers ?? {}), ...(cookie === '' ? {} : { cookie }) },
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (setCookie.length > 0) cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  let body = null;
  try {
    body = await res.json();
  } catch {
    // ⛔ תשובה שאינה JSON ⛔ אינה קריסה כאן: 404 עירום הוא בדיוק מה ש-`/api/dev/session`
    // מחזיר כששער ה-dev סגור, וזו **מדידה** — ⛔ לא שגיאה בכלי.
  }
  return { status: res.status, body };
}

/**
 * ⛔ **שרת שאינו עונה ⛔ אינו קריסה כאן.** הכלי מודד — וכשאין מה למדוד הוא אומר זאת
 * במשפט, ⛔ ולא ב-stack trace. ⛔ «⛔ לא נמדד» ו«נמדד ויצא אפס» הם שני דברים שונים.
 */
let session;
try {
  session = await call('/api/dev/session');
} catch (err) {
  console.log(`⛔ ⛔ לא נמדד — ⛔ אין שרת ב-${BASE} (${String(err?.cause?.code ?? err?.message ?? err)}).`);
  console.log(storyChainLineHe(reportStoryChain([])));
  process.exit(0);
}
if (session.status !== 302 && session.status !== 200) {
  // ⛔ **וזו הצהרה על הסביבה, ⛔ ולא על המוצר** — בדיוק ההבחנה ש-`F-262` מדד.
  console.log(
    `⛔ ⛔ לא נמדד — \`GET /api/dev/session\` החזיר ${session.status}. ` +
      '⇒ ⛔ אין סשן dev בסביבה הזאת, והשרשרת ⛔ אינה בת-מדידה כאן.',
  );
  console.log(storyChainLineHe(reportStoryChain([])));
  process.exit(0);
}

const samples = [];
const seen = new Set();
for (let i = 0; i < STORIES; i += 1) {
  // ⛔ `?read=` הוא **רשימת הדילוג** שהנתיב כבר מקבל (`docs/api-contract.md`) ⇒ כך
  // מגיעים לסיפור הבא בלי לכתוב היסטוריה, ו⛔ בלי להמציא נקודת קצה שנייה.
  const query = seen.size === 0 ? '' : `?read=${[...seen].join(',')}`;
  const { status, body } = await call(`/api/world/story${query}`);
  if (status !== 200 || body === null || body.ok !== true) {
    console.log(`⛔ סיפור ${i + 1}: הנתיב החזיר ${status}${body?.code ? ` · ${body.code}` : ''}`);
    break;
  }
  const storyId = body.story?.id ?? `#${i + 1}`;
  if (seen.has(storyId)) break; // ⛔ אותו סיפור חזר ⇒ המלאי נגמר, ⛔ ולא לולאה אינסופית.
  seen.add(storyId);

  const glossCount = Object.keys(body.glosses ?? {}).length;
  const answerCount = body.question?.answersHe?.length ?? 0;

  let tapOk;
  if (TRY_TAP) {
    const firstLemma = Object.keys(body.glosses ?? {})[0];
    const wordId = firstLemma === undefined ? undefined : body.glosses[firstLemma]?.wordId;
    if (wordId !== undefined) {
      const wrote = await call('/api/review/context', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ wordId }),
      });
      tapOk = wrote.status === 200 && wrote.body?.ok === true;
    }
  }

  samples.push({ storyId, glossCount, answerCount, ...(tapOk === undefined ? {} : { tapOk }) });
  console.log(
    `  ${String(i + 1).padStart(2)} · ${storyId} · ${glossCount} מילים להקשה · ` +
      `${answerCount}/${REQUIRED_ANSWERS} תשובות${tapOk === undefined ? '' : tapOk ? ' · הקשה נכתבה' : ' · ⛔ הקשה נכשלה'}`,
  );
}

console.log(storyChainLineHe(reportStoryChain(samples)));
