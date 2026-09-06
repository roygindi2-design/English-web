import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { anchorsOf, citationsIn } from './check-rules-citations.mjs';

/**
 * 🔢 **‏C-0376 — שני דברים ששוב ושוב התיישנו בשקט, וכאן הם מפסיקים.**
 *
 * ⓐ **ציטוטי `RULES § x.y`.** ‏C-0375 סירבה במפורש למספר מחדש באותו קומיט של הקיצוץ,
 *    בנימוק «קיצוץ ומספור מחדש באותו קומיט שוברים ציטוט **בשקט**». ⇒ המספור נעשה כאן,
 *    ו-`scripts/check-rules-citations.mjs` הוא מה שהופך «⛔ אף ציטוט לא נשבר» **ממשפט
 *    למדידה**. הבדיקות למטה מוודאות ש**הכלי עצמו ⛔ אינו חלול**.
 *
 * ⓑ **מספר הפקודות ב-`npm run verify`.** השורה הזאת התיישנה **פעמיים** — «ארבע»⇢«חמש»
 *    ב-23/08, «חמש»⇢«שש» ב-31/08 — ובשני המקרים הסכנה זהה: סוכן שקורא «חמש», מריץ
 *    חמש ומכריז ירוק **מדלג בדיוק על הפקודה האחרונה**. ⇒ המספר ⛔ מפסיק להיכתב ביד:
 *    הוא נגזר מ-`package.json` ומושווה לטקסט.
 */
const read = (p: string): string => readFileSync(p, 'utf8');

describe('scripts/check-rules-citations.mjs — «⛔ אף ציטוט לא נשבר» הוא מדידה', () => {
  it('קורא את העוגנים של `plan/RULES.md`, כולל תת-הסעיפים באותיות', () => {
    const a = anchorsOf(read('plan/RULES.md'));
    expect(a.has('0.0'), 'מפת המספור').toBe(true);
    expect(a.has('0.1'), 'הסעיף הראשון').toBe(true);
    expect(a.has('0.6א'), 'תת-סעיף ממוספר').toBe(true);
    expect(a.has('0.23ט'), 'תת-סעיף באות תחת הורה ממוספר').toBe(true);
    // ⛔ והמספרים הישנים ⛔ אינם עוגנים יותר — אחרת הבדיקה הייתה עוברת גם בלי המיפוי.
    expect(a.has('0.14ב'), '⛔ מספר לשעבר ⛔ אינו עוגן').toBe(false);
    expect(a.has('0.1.1'), '⛔ מספר לשעבר ⛔ אינו עוגן').toBe(false);
  });

  it('⛔ ⛔ אינו סופר את סמן ⟨לשעבר⟩ ו⛔ לא את § 0.1 של `00-control`', () => {
    expect(citationsIn('### 0.18 · בריאות הלופ  ⟨לשעבר § 0.14ב⟩')).toEqual([]);
    expect(citationsIn('שורה ב-`plan/00-control.md § 0.1` שאומרת למה')).toEqual([]);
    // ⛔ אבל ציטוט אמיתי כן נספר — אחרת הסינון היה בולע הכול והבדיקה הייתה חלולה.
    expect(citationsIn('לפי `RULES § 0.23ז` בלבד')).toEqual([
      { ref: '0.23ז', bare: '0.23', line: 1 },
    ]);
  });

  it('🔬 ⛔ ⛔ אינו חלול — ציטוט לסעיף שאינו קיים ⛔ אינו עובר', () => {
    const anchors = anchorsOf(read('plan/RULES.md'));
    // ⛔ הציטוט המזויף נבנה מחלקים במכוון: כתוב שלם, `npm run check:rules` היה נופל
    // **על קובץ הבדיקה הזה עצמו** — והשער סורק את כל הריפו החי, כולל אותו.
    const fake = `RULES § 0.${'9'}9`;
    const [c] = citationsIn(`ראה \`${fake}\``);
    expect(c?.ref).toBe('0.99');
    // ⛔ **וגם הודעת הכישלון ⛔ אינה מכילה אותו כטקסט שלם.** הגרסה הראשונה בנתה
    // את `fake` מחלקים אבל הותירה את הציטוט המזויף, שלם, במחרוזת ההודעה כאן —
    // ו-`check:rules` נפל על **קובץ הבדיקה של השער עצמו**:
    // 313 ציטוטים תקינים ואחד «שבור» שהוא בעצם הפיקסטורה. נמדד 01/09/2026.
    expect(anchors.has(c?.ref ?? ''), `⛔ ${fake} ⛔ אינו קיים ⇒ חייב ליפול`).toBe(false);
  });
});

describe('🔢 מספר הפקודות ב-`npm run verify` נגזר, ⛔ ולא נכתב ביד', () => {
  const verify = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts
    .verify as string;
  const commands = verify.split('&&').map((c) => c.trim().replace(/^npm (run )?/, ''));
  const WORDS: Record<number, string> = { 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine' };
  const HEB: Record<number, string> = { 5: 'חמש', 6: 'שש', 7: 'שבע', 8: 'שמונה', 9: 'תשע' };

  it('כל פקודה ב-`verify` היא סקריפט אמיתי ב-`package.json`', () => {
    const scripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts;
    for (const c of commands) expect(Object.keys(scripts), c).toContain(c);
    expect(commands).toContain('check:rules');
  });

  it('🔴 `plan/RULES.md` נוקב במספר הנכון — ובשמות הפקודות בפועל', () => {
    const rules = read('plan/RULES.md');
    const word = HEB[commands.length];
    expect(word, `⛔ אין מילה עברית ל-${commands.length}`).toBeDefined();
    expect(rules, `RULES: «${word} פקודות»`).toContain(`${word} פקודות`);
    // ⛔ ⛔ ולא רק המספר: הרשימה עצמה. מספר נכון עם רשימה ישנה הוא בדיוק אותו שקר.
    for (const c of commands) expect(rules, `RULES: הפקודה ${c}`).toContain(c);
  });

  it('🔴 ‏`CRITIC.md` ו-`CONTENT.md` נוקבים באותו מספר — הם השער והכותב', () => {
    const word = WORDS[commands.length];
    for (const a of ['CRITIC', 'CONTENT']) {
      expect(read(`docs/agents/${a}.md`), `${a}: «${word} commands»`).toContain(
        `${word} commands`,
      );
    }
  });
});

/**
 * ⛔ **הצהרת הטיפוסים ⛔ אינה רשאית להיפרד מהמודול.** אותו דפוס בדיוק כמו
 * `scripts/motion-gate.test.ts`: `allowJs: false`, ולכן `check-rules-citations.d.mts`
 * נכתב ביד — והסכנה היא **סחיפה**: הצהרה שחדלה להתאים מטייפצ׳קת **שקר**.
 */
describe('scripts/check-rules-citations.d.mts — ההצהרה ⛔ אינה נפרדת מהמודול', () => {
  it('כל שם שההצהרה מייצאת קיים במודול, ולהפך', () => {
    const declared = [...read('scripts/check-rules-citations.d.mts').matchAll(/export (?:declare )?(?:function|const) (\w+)/g)]
      .map((m) => m[1])
      .sort();
    const actual = [...read('scripts/check-rules-citations.mjs').matchAll(/^export function (\w+)/gm)]
      .map((m) => m[1])
      .sort();
    expect(declared).toEqual(actual);
  });
});
