import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/ArenaResult.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/**
 * הלבנה לפני כל טענה — `ComposeDraft.test.ts:1-31` (F-041 · F-065).
 *
 * ⚠️ אסרציית איסור היא **על גבול מזהה** (`/\bxp\b/`) ⛔ ולא `toContain`: `xp` יושב בתוך
 * מילים תמימות, וזה בדיוק מה שעלה טיק ב-C-0182.
 */
const CLASS_CONSTS = Object.fromEntries(
  [...CODE.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*([\s\S]*?);\n/g)].map((m) => [
    m[1] ?? '',
    m[2] ?? '',
  ]),
);
function classesOf(tag: string): string {
  const attribute = tag.match(/className=(?:"([^"]*)"|\{([\s\S]*?)\})/);
  if (attribute === null) return '';
  const literal = attribute[1] ?? '';
  const expression = attribute[2] ?? '';
  const referenced = [...expression.matchAll(/[A-Z][A-Z0-9_]*/g)]
    .map((m) => CLASS_CONSTS[m[0]] ?? '')
    .join(' ');
  return `${literal} ${expression} ${referenced}`;
}

describe('<ArenaResult>', () => {
  it('⛔ תצוגה בלבד: אפס כתיבה, אפס נגיעה במנוע החזרות (D-047 · D-044)', () => {
    expect(CODE, '⛔ מסך הסיום אינו כותב').not.toMatch(/apiPost|fetch\(/);
    for (const banned of [/word_progress/, /easiness/, /repetition/, /next_review_at/]) {
      expect(CODE, `${banned} אסור — D-044`).not.toMatch(banned);
    }
    // ⛔ הכפתור «הוסף לרשימת החזרה» אינו בתחולה — הוא ממתין לרוי (03-for-roy פריט 31):
    expect(CODE).not.toContain('הוסף לרשימת החזרה');
  });

  it('⛔ אפס ניקוד, מטבע, XP ולוח תוצאות (D-050)', () => {
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i, /\bcoin\b/i, /\bleaderboard\b/i]) {
      expect(CODE, `${banned} אסור`).not.toMatch(banned);
    }
    for (const word of ['ניקוד', 'מטבע', 'לוח תוצאות', 'רצף יומי']) {
      expect(CODE, `«${word}» אסורה`).not.toContain(word);
    }
  });

  it('«המילים שהפילו אותך» — עד 5, עם התרגום ועם המסיח שפיתה (D-047)', () => {
    expect(CODE).toContain('המילים שהפילו אותך');
    expect(CODE).toMatch(/ARCADE_MISSED_LIMIT|missed\.slice\(0,\s*5\)/);
    expect(CODE).toMatch(/\.answer\b/);
    expect(CODE).toMatch(/\.chosen\b/);
    expect(CODE).toMatch(/<EnWord[^>]*>\{[^}]*headword/);
  });

  it('שני הצדדים נושאים תווית עברית ⛔ ואינם נבדלים בצבע בלבד (חוקה § 1)', () => {
    expect(CODE).toContain('התשובה');
    expect(CODE).toContain('בחרת');
  });

  it('רשימה ריקה היא משפט ⛔ ולא בלוק ריק', () => {
    expect(CODE).toMatch(/missed\.length === 0/);
    expect(CODE).toContain('לא פספסת אף מילה');
  });

  it('הפריט שנפתח מוצג בדמות ⛔ ולא כמספר מופשט (§ 4.2י שאלה 2)', () => {
    expect(CODE).toMatch(/<ArenaAvatar/);
    expect(CODE).toMatch(/unlocked/);
  });

  it('שתי דרכים החוצה, שתיהן יעד מגע', () => {
    expect(CODE).toContain('עוד קרב');
    expect(CODE).toMatch(/href="\/world"/); // T-253ⓐ · D-186 — היה `/cards`, חוזר לטבעת
    expect(CODE).toMatch(/onAgain/);
    const again = CODE.match(/<button[^>]*data-arena-again[\s\S]*?>/);
    expect(again, 'הכפתור חייב לשאת data-arena-again').not.toBeNull();
    expect(classesOf(again?.[0] ?? '')).toMatch(/min-h-touch/);
    const back = CODE.match(/<Link[^>]*data-arena-back[\s\S]*?>/);
    expect(back, 'הקישור חייב לשאת data-arena-back').not.toBeNull();
    expect(classesOf(back?.[0] ?? '')).toMatch(/min-h-touch/);
  });

  it('⛔ אין שבח ואין נזיפה, וכישלון לנצח ⛔ אינו «הפסדת» (R-016 · § 4.2י)', () => {
    for (const word of ['כל הכבוד', 'נהדר', 'מצוין', 'טעית', 'נכשלת', 'הפסדת']) {
      expect(CODE, `«${word}» אסורה`).not.toContain(word);
    }
  });

  it('⛔ אפס hex, אפס מרכוז אנכי, אפס h-screen', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/justify-center/);
    expect(CODE).not.toMatch(/\bh-screen\b/);
  });

  it('⛔ אין שעון (D-045 · R-020)', () => {
    for (const banned of [
      /\bsetTimeout\b/,
      /\bsetInterval\b/,
      /\brequestAnimationFrame\b/,
      /\bcountdown\b/i,
      /\bDate\.now\b/,
    ]) {
      expect(CODE, `${banned} אסור`).not.toMatch(banned);
    }
  });

  it('⛔ רכיב ממשק אינו ניגש לדאטהבייס', () => {
    expect(CODE).not.toMatch(/supabase|\.from\(/);
  });

  /**
   * T-253ⓐ · D-186 — היציאה השנייה (`data-arena-back`) ממסך תוצאת הקרב הובילה
   * ל-`/cards`, ⛔ ולא לטבעת שממנה הכניסה הגיעה. ⛔ **גדר:** ⛔ אין שינוי
   * בארוקאה של הקרב (`onAgain` · `data-arena-again`) — רק היעד והתווית של
   * `data-arena-back`.
   */
  it('T-253ⓐ — `data-arena-back` חוזר ל-`/world`, ⛔ לא ל-`/cards`', () => {
    expect(CODE).toContain('data-arena-back href="/world"');
    expect(CODE).not.toMatch(/data-arena-back href="\/cards"/);
    expect(SRC).toContain('חזרה לעולם');
  });
});
