#!/usr/bin/env node
/**
 * 📏 **`T-209` ⓒ — כמה חזרתיות סידור מחדש של אותם סיפורים באמת קונה.**
 *
 * `D-121 § ה` קובע שהסיפור הבא נבחר **כדי לחזור על מילים, ⛔ ולא כדי לגוון**, ו-
 * `lib/core/storyPick.ts` בוחר ⛔ בלי להסתכל על חפיפת אוצר מילים. ⓒ של השורה דורש
 * **מדידה לפני מימוש**: התפלגות החזרתיות בסדר הנוכחי מול הסדר הממוקסם.
 * **מספר מאכזב הוא התוצאה, ⛔ ולא כישלון** (`D-120 § ב`).
 *
 * 🔴 **והדבר האחד שקובע את גודל המנוף, ⛔ ונמדד ⛔ ולא שוער:**
 * `app/api/world/story/route.ts:78` מסנן `.eq('cefr_level', level)` **לפני**
 * `pickStory` ⇒ הבריכה שהלומד רואה היא **רמה אחת**, ⛔ ולא שנים-עשר הסיפורים.
 * ⇒ הסקריפט מודד **לכל רמה בנפרד**, וזה מה שהלומד באמת פוגש.
 *
 * שימוש:  npm run measure:story-repetition [-- <path-to-seed.sql>]
 */
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';

// ⛔ אותו hook בדיוק ש-`scripts/measure-gate.mjs` משתמש בו — Node 22 מפשיט טיפוסים
// ⛔ אבל ⛔ אינו פותר ייבוא בלי סיומת. ⛔ עותק שני של הרעיון, ⛔ ולא של הקוד.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return withTsFormat(nextResolve(`${specifier}.ts`, context));
      } catch {
        // ⛔ אין אח TypeScript — הפתרון הרגיל ממשיך.
      }
    }
    return withTsFormat(nextResolve(specifier, context));
  },
});

function withTsFormat(resolved) {
  if (resolved && typeof resolved.url === 'string' && resolved.url.endsWith('.ts')) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}

const { cumulativeRepeatCurve, maximiseOverlapOrder, repetitionProfile } = await import(
  '../lib/core/storyOverlap.ts'
);

const SEED = process.argv[2] ?? 'supabase/seed/0004_stories.sql';

/**
 * ⛔ **הפרסור הוא של שורות ה-`values` של ה-seed, ⛔ ולא של SQL כללי** — הקובץ
 * **נוצר** על ידי `scripts/build-stories-sql.mjs`, ⇒ הצורה ידועה וקבועה.
 * `''` הוא גרש בתוך מחרוזת SQL, ⇒ הוא מפוענח חזרה לגרש אחד.
 */
export function parseStorySeed(sql) {
  const rows = [];
  const RE = /\(\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*,\s*'((?:[^']|'')*)'\s*\)/g;
  let m;
  let n = 0;
  while ((m = RE.exec(sql)) !== null) {
    const unq = (s) => s.replace(/''/g, "'");
    n += 1;
    rows.push({
      id: `${unq(m[1])}-${String(n).padStart(2, '0')}`,
      cefrLevel: unq(m[1]),
      titleEn: unq(m[2]),
      bodyEn: unq(m[3]),
      // ⛔ אין `created_at` ב-seed ⇒ סדר ההכנסה הוא הסדר שהמסד ייתן, וזה בדיוק
      // מה ש-`orderStories` היה רואה. הוא מקודד כאן כמספר רץ.
      createdAt: `0000-00-00T00:00:${String(n).padStart(2, '0')}Z`,
    });
  }
  return rows;
}

const pad = (s, n) => String(s).padEnd(n);

/**
 * ⛔ **הדוח רץ ⛔ רק בהרצה ישירה.** הבדיקה מייבאת `parseStorySeed` מהקובץ הזה, ⇒ בלי
 * השער הזה `npm test` היה **מדפיס את כל המדידה** באמצע פלט הבדיקות — ⛔ ופלט ⛔ לא נקי
 * הוא בדיוק מה ש-`test-driven-development` פוסל («Output pristine»).
 */
const INVOKED_DIRECTLY = process.argv[1] !== undefined && process.argv[1].endsWith('measure-story-repetition.mjs');
if (!INVOKED_DIRECTLY) {
  // ⛔ אין `process.exit` כאן — ייבוא ⛔ אינו כישלון.
} else {
  main();
}

function main() {
const rows = parseStorySeed(readFileSync(SEED, 'utf8'));

if (rows.length === 0) {
  console.log(`⛔ ⛔ לא נמדד — ⛔ אף שורת סיפור ⛔ לא פוענחה מ-${SEED}.`);
  process.exit(1);
}

const levels = [...new Set(rows.map((r) => r.cefrLevel))].sort();

console.log(`📏 חזרתיות סיפורים — ${rows.length} סיפורים · ${levels.length} רמות · ${SEED}`);
console.log('');
console.log('🔴 הבריכה שהלומד רואה היא **רמה אחת** — `route.ts:78` מסנן `.eq(cefr_level)`');
console.log('   לפני `pickStory` ⇒ הסידור מחדש פועל על הבריכה הזאת, ⛔ ולא על כל השנים-עשר.');
console.log('');
console.log(
  `${pad('רמה', 6)}${pad('סיפורים', 10)}${pad('מילות תוכן', 12)}${pad('נפגשות ≥2', 11)}${pad('פעם אחת', 9)}`,
);

let poolTotal = 0;
let poolRepeat = 0;
const gains = [];

for (const level of levels) {
  const pool = rows.filter((r) => r.cefrLevel === level);
  const profile = repetitionProfile(pool);
  poolTotal += profile.distinct;
  poolRepeat += profile.metTwiceOrMore;
  console.log(
    `${pad(level, 6)}${pad(pool.length, 10)}${pad(profile.distinct, 12)}${pad(profile.metTwiceOrMore, 11)}${pad(profile.metOnce, 9)}`,
  );

  const asWritten = cumulativeRepeatCurve(pool);
  const maximised = cumulativeRepeatCurve(maximiseOverlapOrder(pool));
  gains.push({ level, asWritten, maximised });
}

console.log('');
console.log('🔬 **התקרה, ו⛔ סידור מחדש ⛔ אינו יכול להזיז אותה.** מעבר מלא על בריכה קורא');
console.log('   את אותם סיפורים ⇒ «נפגשות ≥2» הוא **קבוע** בכל סדר. הדבר היחיד שסדר מזיז');
console.log('   הוא **מתי** החזרה מגיעה — העקומה שלמטה.');
console.log('');
console.log(`${pad('רמה', 6)}${pad('בסדר הנוכחי', 24)}${pad('בסדר הממוקסם', 24)}הפרש`);

let movedAny = 0;
for (const g of gains) {
  const a = g.asWritten.join(' · ');
  const b = g.maximised.join(' · ');
  const midA = g.asWritten.slice(0, -1);
  const midB = g.maximised.slice(0, -1);
  const delta = midB.reduce((s, v, i) => s + (v - (midA[i] ?? 0)), 0);
  movedAny += delta;
  console.log(`${pad(g.level, 6)}${pad(a, 24)}${pad(b, 24)}${delta >= 0 ? '+' : ''}${delta}`);
}

console.log('');
console.log(`סך מילות תוכן בכל הרמות: ${poolTotal} · נפגשות ≥2 בתוך רמה: ${poolRepeat}`);
console.log(
  `סך ההקדמה שהסידור קונה (מפגשים שהוקדמו, ⛔ לא מפגשים שנוספו): ${movedAny >= 0 ? '+' : ''}${movedAny}`,
);
console.log('');
if (movedAny === 0) {
  console.log('🔴 **⛔ אפס.** הסידור מחדש ⛔ אינו קונה ולו מפגש מוקדם אחד בבריכות האלה.');
} else {
  console.log(`▶️ הסידור מחדש מקדים ${movedAny} מפגשים. ⛔ הוא ⛔ אינו מוסיף ולו מפגש אחד.`);
}
}
