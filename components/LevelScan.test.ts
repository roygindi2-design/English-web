import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<LevelScan>` — סריקת רמה (T-082 · D-041 · § 4.2ז).
 *
 * שומר מקור, כמו `LevelMapScreen.test.ts` ו-`DeckSelector.test.ts`: סביבת vitest היא
 * `node` ו-jsdom נעדר בכוונה. גיאומטריה — 44px ואפס גלילה אופקית — היא עבודתו של
 * `check:mobile` דרך הפיקסטורה `/dev/scan`.
 */
const SRC = readFileSync('components/LevelScan.tsx', 'utf8');
const PAGE = readFileSync('app/study/scan/page.tsx', 'utf8');
const HARNESS = readFileSync('scripts/verify-mobile.mjs', 'utf8');

/**
 * ⚠️ **סטייה מהתוכנית, ⛔ ולא בחירה — ונמדדה.** התוכנית העתיקה את שלוש ההחלפות
 * מ-`components/LevelMapScreen.test.ts:14`, ובהן `{/* … *​/}` נחתך **לפני** בלוקי
 * ההערות הרגילים. הצירוף `{` ⇐ JSDoc ⇐ ‏`*​/}` מאוחר יותר בקובץ גורם לכמת העצל
 * לבלוע את **כל** מה שביניהם: ב-`LevelScan.tsx` הפרופ `initialWords` נושא JSDoc
 * בתוך טיפוס-אובייקט (`}: {`), וההערה הבאה שנסגרת ב-`*​/}` היא הערת ה-JSX בשורה 212
 * ⇒ 128 שורות נמחקו מ-`CODE`, ושלוש בדיקות נפלו על קוד תקין.
 * ⛔ **וזו מחלקת F-064 — בדיקה חלולה:** כל `not.toContain` על קוד שנבלע **עובר לשווא**.
 * נמדד על שלושת הרכיבים הקיימים (`LevelMapScreen` · `ArenaBoard` · `ArcadeEntry`):
 * ⛔ אף אחד מהם ⛔ אינו מפעיל את המלכודת היום. נפתח **F-091 ⚪** על התבנית עצמה.
 * כאן: בלוקי ההערות נחתכים תחילה, ולכן `{/* … *​/}` נותר `{}` — ⛔ בלי בליעה.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('D-041 — הצהרה, ⛔ ולא מבחן', () => {
  it('הרשת נחתכת ל-12 דרך השכבה הטהורה ⛔ ולא במספר מוטבע', () => {
    expect(CODE).toContain('pageOf(');
    expect(CODE).toContain('SCAN_PAGE_SIZE');
    expect(CODE).not.toMatch(/slice\(\s*\d+\s*,\s*\d+\s*\)/);
  });

  it.each(['ניקוד', 'נכון', 'שגוי', 'טעית', 'כל הכבוד', 'ציון', 'שניות', 'טיימר'])(
    '⛔ המילה «%s» אינה מופיעה — אין ניקוד, אין זמן, אין תשובה נכונה',
    (word) => {
      expect(CODE).not.toContain(word);
    },
  );

  it('⛔ אין שעון בקובץ — סריקה אינה מדודה בזמן', () => {
    expect(CODE).not.toContain('setInterval');
    expect(CODE).not.toContain('setTimeout');
    expect(CODE).not.toContain('Date.now');
  });
});

describe('ⓓ מסך הסיום עובדתי, והמספרים נקראים ⛔ ולא נספרים בלקוח', () => {
  it('קורא מחדש את /api/levels/summary ⛔ ואינו סופר markedThisSession', () => {
    expect(CODE).toContain('/api/levels/summary');
    expect(CODE).not.toContain('markedCount');
  });

  it('שני המשפטים העובדתיים בשמם', () => {
    expect(CODE).toContain('סימנת ש-');
    expect(CODE).toContain('נשארו');
  });
});

describe('הסימון נשלח לנתיב הסריקה ⛔ ולעולם לא ל-/api/review', () => {
  it('POST /api/levels/scan', () => {
    expect(CODE).toContain("'/api/levels/scan'");
  });

  it.each(['/api/review', '/api/practice'])('⛔ %s אינו מוזכר', (path) => {
    expect(CODE).not.toContain(path);
  });

  it('⛔ אין גישה ישירה לדאטהבייס — הכל דרך lib/api/client.ts', () => {
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });
});

describe('חוקת העיצוב', () => {
  it('⛔ אין מרכוז אנכי ואין h-screen (F-011 · F-016 · חוקה § 4)', () => {
    expect(CODE).not.toContain('justify-center');
    expect(CODE).not.toContain('h-screen');
  });

  it('⛔ אין hex גולמי (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('⛔ אין אמוג\'י (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it('כל מילה אנגלית עוברת ב-<EnWord> (חוקה § 2)', () => {
    expect(CODE).toContain('EnWord');
  });

  it('כל תא ברשת הוא יעד מגע ≥44px', () => {
    // ⚠️ **סטייה מהתוכנית, ⛔ ולא בחירה — ונמדדה.** הרֶגֶקְס שהתוכנית כתבה כאן נפל על
    // **קוד תקין**: תא הרשת ⛔ אכן נושא `min-h-touch`, אבל הוא יושב בתוך ערך התכונה
    // ‏(`className={[…].join(' ')}`), והחלופה `"[^"]*"` בולעת אותו כערך ⇒ האסימון לעולם
    // ⛔ אינו יכול להופיע במקום שבו הרֶגֶקְס דורש שם-תכונה. ⛔ זו בדיוק **מחלקת F-041**
    // שההערה בתוכנית מצטטת. נמדד: כל 24 הבדיקות האחרות ירוקות, וזו בלבד אדומה.
    // התבנית המחייבת בריפו היא חילוץ המחלקות של **האלמנט עצמו** —
    // ‏`components/ArenaBoard.test.ts:19` ו-`ComposeDraft.test.ts:1-31`.
    // ⚠️ **המוטציה של שלב 8 שרדה את הניסוח הראשון שכתבתי כאן, ולכן הוא הוחלף.** רֶגֶקְס
    // שמתחיל ב-`<button` ורץ עצלנית עד `aria-pressed` פותח ב-**כפתור «נסה שוב»** (הראשון
    // בקובץ) ובולע אותו; ה-`className` הראשון בטווח הוא שלו, והוא נושא `min-h-touch`
    // משלו ⇒ הסרת האסימון מתא הרשת ⛔ לא הפילה דבר. ⛔ בדיוק מחלקת F-064.
    // ⇒ חיתוך לפי **האלמנט**: הקטע שאחרי `<button` ולפני `</button>` שלו עצמו.
    const cell = CODE.split('<button').find((chunk) =>
      chunk.slice(0, chunk.indexOf('</button>')).includes('aria-pressed'),
    );
    expect(cell).toBeDefined();
    const tag = (cell ?? '').slice(0, (cell ?? '').indexOf('</button>'));
    const className = tag.match(/className=(?:"([^"]*)"|\{([\s\S]*?)\})/);
    expect(`${className?.[1] ?? ''} ${className?.[2] ?? ''}`).toMatch(/min-h-touch/);
  });
});

describe('T-124 · D-065 — כל ענף כשל נושא יציאה', () => {
  it('היציאה נגזרת מהטבלה היחידה ⛔ ולא מנוסחת כאן', () => {
    expect(CODE).toContain('failureExit(');
    expect(CODE).toContain('isRetryable(');
  });

  it('נוסח הכשל מיובא ⛔ ואינו מוכפל (T-056)', () => {
    expect(CODE).toContain('FAILURE_HE');
    expect(CODE).toContain('RETRY_HE');
  });
});

describe('המסך מחובר, ⛔ ואינו יתום', () => {
  it('‏/study/scan מרנדר את הרכיב', () => {
    expect(PAGE).toContain('LevelScan');
  });

  it('הפיקסטורה נמדדת ב-check:mobile', () => {
    expect(HARNESS).toContain("'/dev/scan'");
  });
});
