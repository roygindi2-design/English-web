import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<WritingChain>` — «שרשרת הכתיבה» (T-106 · § 4.2יב · D-050 · E4 · תוכנית
 * `2026-08-19-world-home.md` § 4).
 *
 * שומר מקור, באותה צורה ומאותו נימוק כמו `RecallCard.test.ts` ו-`AppGrid.test.ts`:
 * סביבת vitest היא `node` במכוון (`vitest.config.ts`) ו-jsdom נעדר, ולכן בדיקת רינדור
 * ⛔ אינה שייכת לכאן. הגיאומטריה — יעד מגע ≥44px, אפס גלילה אופקית — נמדדת ב-
 * `check:mobile` על `/world/chain`, שנוסף לרשימת המסלולים באותו טיק.
 *
 * מה שהקובץ הזה מוכיח, וללא זה היה מאמין ⛔ ולא מודד:
 *
 *   ✔ **המספר הוא ספירת טבלה (`count`) ⛔ ולא גודל התשובה (`total`)** — `total` נחתך
 *     ב-`MAX_FEED_ROWS = 100`, ולכן הצגתו כ«אי-פעם» היא מספר שמשקר ביום ה-101
 *   ✔ ⛔ **אינו רצף יומי** (E4 · D-050): ⛔ אפס `streak`, ⛔ אפס «רצף» — מספר שאינו
 *     יורד ואינו נשבר, ויום שהוחמץ ⛔ אינו מוחק דבר
 *   ✔ ⛔ **לא `dataviz`**: ⛔ אפס `svg`/`chart`/`bar`/`Recharts`/`canvas` — אין כאן גרף
 *     ואין מדד, יש **מספר יחיד ורשימה** (אילוץ 14 של התוכנית)
 *   ✔ ⛔ אין שיתוף, אין פומבי ואין משתמש אחר
 *   ✔ «—» ⛔ ולא «0» כשהמספר אינו ידוע — כלל `<MeScreen>`/`<WorldFeed>`
 *   ✔ ⛔ אפס שעון ואפס תלות בזמן ריצה: התאריך נגזר מהמחרוזת שהשרת שלח, ⛔ ולא
 *     מ-`new Date()`/`toLocaleDateString` — אחרת השרת והלקוח היו מדפיסים שני ערכים
 *   ✔ ⛔ אפס hex גולמי, ⛔ אפס מרכוז אנכי (F-011 · F-016)
 *
 * ⛔ מה שהוא **אינו** מוכיח, ונאמר כאן כדי שירוק לא ייקרא כיסוי: שהבקשה באמת חוזרת,
 * ושהרשימה באמת מצוירת בדפדפן.
 */
const SRC = readFileSync('components/WritingChain.tsx', 'utf8');

/** C-0032/C-0071/C-0072 · F-065: שומר שהערה יכולה לספק אינו שומר על דבר. */
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('<WritingChain>', () => {
  it('הוא רכיב לקוח וקורא לנקודת הקצה שבחוזה ⛔ ולא לשם שהומצא', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
    expect(CODE).toMatch(/apiGet<[^>]*>\('\/api\/world\/posts'\)/);
  });

  it('המספר הוא `count` (ספירת טבלה) ⛔ ולא `total` (גודל התשובה)', () => {
    // ⚠️ `toContain('count')` לבדו הוא בדיקה עיוורת — שם הטיפוס מספק אותה. נמדד על
    // **אתר הקריאה**: הערך שנשמר במצב המסך הוא זה שמגיע מהשדה הזה.
    expect(CODE).toMatch(/body\.count/);
    expect(CODE, '⛔ `total` נחתך ב-MAX_FEED_ROWS ⇒ אינו «אי-פעם»').not.toMatch(/body\.total/);
  });

  it('⛔ אינו רצף יומי — יום שהוחמץ אינו מוחק דבר (E4 · D-050)', () => {
    expect(CODE).not.toMatch(/\bstreak\b|\bxp\b|\bscore\b|\bpoints\b|\bcoin\b|leaderboard/i);
    expect(CODE).not.toMatch(/רצף|ניקוד|מטבע|לוח תוצאות/);
  });

  it('⛔ לא `dataviz` — אין כאן גרף ואין מדד (אילוץ 14)', () => {
    expect(CODE).not.toMatch(/<svg|Recharts|recharts|<canvas|chart|\bbar-/i);
  });

  it('⛔ אין שיתוף, אין פומבי ואין משתמש אחר', () => {
    expect(CODE).not.toMatch(/navigator\.share|\bshare\b|\bpublic\b/i);
    expect(CODE).not.toMatch(/שיתוף|לשתף|פומבי/);
  });

  it('⛔ אינו כותב דבר — לא לפוסטים ולא למנוע החזרות (D-051)', () => {
    expect(CODE).not.toMatch(/apiPost/);
    expect(CODE).not.toMatch(
      /easiness|interval_days|repetition|next_review_at|self_marked_known|word_progress/,
    );
  });

  it('«—» ⛔ ולא «0» כשהמספר אינו ידוע', () => {
    expect(CODE).toContain('—');
    // המספר נמצא במצב המסך, ולכן «אינו ידוע» הוא `null` ⛔ ולא אפס.
    expect(CODE).toMatch(/===\s*null\s*\?/);
  });

  it('מצב ריק מוביל לכתיבה ⛔ ולא למסך לבן', () => {
    expect(CODE).toContain('כתוב את המשפט הראשון שלך');
    expect(CODE).toContain('/world/compose');
  });

  it('⛔ אינו ממיין מחדש — השרת ענה לפי תאריך יורד, וכלל אחד די לו בבית אחד', () => {
    expect(CODE).not.toMatch(/\.sort\(/);
  });

  it('⛔ אפס שעון ואפס תלות בזמן ריצה — התאריך נגזר מהמחרוזת של השרת', () => {
    expect(CODE).not.toMatch(/setTimeout|setInterval/);
    expect(CODE).not.toMatch(/new Date\(|Date\.now\(|toLocaleDateString|toLocaleString/);
  });

  it('האנגלית עוברת דרך העטיפה האחת ⛔ ולא דרך lang שנכתב ביד (T-009)', () => {
    expect(CODE).toContain('EnWord');
    expect(CODE).not.toMatch(/lang=["']en["']/);
  });

  it('⛔ אפס מרכוז אנכי ואפס hex גולמי (חוקה § 4 · § 6 · F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/\bh-screen\b/);
    expect(CODE).not.toMatch(/justify-center/);
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/backdrop-blur|shadow-2xl|rotate-|perspective/);
  });

  it('כל בקרה ניתנת להקשה היא יעד מגע, ונוסח הכשל מגיע מהמקום האחד (T-056)', () => {
    expect(CODE).toContain('min-h-touch');
    expect(CODE).toContain('FAILURE_HE');
    expect(CODE).toContain('RETRY_HE');
  });
});
