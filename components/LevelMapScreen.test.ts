import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<LevelMapScreen>` — לשונית «כרטיסיות» כמפת הרמה (T-081 · § 4.2ז).
 *
 * שומר מקור, כמו `DeckSelector.test.ts` ו-`StudyDeckScreen.test.ts`: סביבת vitest היא
 * `node` ו-jsdom נעדר בכוונה, ולכן בדיקת רינדור אינה שייכת לכאן. גיאומטריה — 44px, אפס
 * גלילה אופקית, והמספר הגדול בתוך הצפייה הראשונה ב-375 — היא עבודתו של `check:mobile`
 * דרך הפיקסטורה `/dev/tabs/cards`.
 */
const SRC = readFileSync('components/LevelMapScreen.tsx', 'utf8');

function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('חמש השורות של § 4.2ז, בסדרן', () => {
  it('שורה 1 — כותרת רמה עם תווית עברית ⛔ ולא אות בלבד (חוקה § 1)', () => {
    expect(CODE).toContain('LEVEL_LABELS_HE');
    expect(CODE).toContain('הרמה שלך');
  });

  it('שורה 2 — המספר הגדול הוא unseen, ומופיע לפני שלוש הספירות במקור', () => {
    expect(CODE).toContain('נשארו לך');
    expect(CODE.indexOf('נשארו לך')).toBeLessThan(CODE.indexOf('ברשימת החזרה'));
  });

  it('שורה 3 — שלוש הספירות, כל אחת עם תווית עברית', () => {
    expect(CODE).toContain('ברמה');
    expect(CODE).toContain('סימנת שידעת');
    expect(CODE).toContain('ברשימת החזרה');
  });

  it('שורה 4 — שלושת כרטיסי החפיסה ⛔ לא נמחקו, הם ירדו לבלוק «דרכים לתרגל»', () => {
    expect(CODE).toContain('DeckSelector');
    expect(CODE).toContain('דרכים לתרגל');
  });

  it('שורה 5 — רשימת «לא ידעתי», אחרי בלוק «דרכים לתרגל»', () => {
    // ⚠️ **סטייה מנוסח התוכנית, והיא מדידה ⛔ ולא העדפה.** התוכנית נוקבת ב-
    // `CODE.indexOf('UnknownList')`, וההופעה הראשונה שלה בקובץ היא **שורת הייבוא**
    // בראשו — שקודמת ל-`PRACTICE_HE`, ולכן האסרציה נכשלת גם על חיבור תקין ומודדת
    // סדר ייבוא ולא סדר שורות. אותה מחלקה כמו סטייה ⓑ של C-0227; מודדים באתר
    // הקריאה, `<UnknownList`.
    expect(CODE).toContain('UnknownList');
    expect(CODE.indexOf('דרכים לתרגל')).toBeLessThan(CODE.indexOf('<UnknownList'));
  });
});

describe('⛔ מה שאסור להופיע במסך הזה', () => {
  it('⛔ אין מרכוז אנכי על מכולת העמוד (F-011 · F-016 · חוקה § 4)', () => {
    expect(CODE).not.toContain('justify-center');
    expect(CODE).not.toContain('h-screen');
  });

  it.each(['שולט', 'מוכן', 'נעול', 'כל הכבוד', 'ניקוד', 'רצף'])(
    '⛔ המילה «%s» אינה מופיעה (R-017 · D-037)',
    (word) => {
      expect(CODE).not.toContain(word);
    },
  );

  it('⛔ אין גישה ישירה לדאטהבייס — הכל דרך lib/api/client.ts', () => {
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });

  it('⛔ אין hex גולמי (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('⛔ אין אמוג\'י (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });
});

describe('מצבי הקצה שהמפרט נוקב בהם', () => {
  it('level:null ⇒ מצב בחירה, ⛔ ולא ברירת מחדל שקטה ל-A1', () => {
    expect(CODE).toContain('בחר רמה');
    expect(CODE).not.toMatch(/level\s*[?:]{1,2}\s*['"]A1['"]/);
    expect(CODE).not.toMatch(/\?\?\s*['"]A1['"]/);
  });

  it('הבחירה כותבת דרך POST /api/levels/current, ⛔ לא דרך /api/review', () => {
    expect(CODE).toContain("'/api/levels/current'");
    expect(CODE).not.toContain('/api/review');
  });

  it('כשל סכמה ⇒ משפט עברי, ⛔ ולא «0 מילים»', () => {
    expect(CODE).toContain('schema_missing');
    expect(CODE).toContain('המאגר עדיין לא הוקם');
  });

  it('טעינה ⇒ aria-busy עם השורות כבר במקום, ⛔ לא ספינר (חוקה § 5)', () => {
    expect(CODE).toContain('aria-busy');
    expect(CODE).not.toMatch(/animate-spin|spinner/i);
  });

  it('כל יעד מגע נושא min-h-touch (44px)', () => {
    // ⚠️ **סטייה מנוסח התוכנית, והיא תיקון של אסרציה עיוורת** (מחלקת F-039). התוכנית
    // נוקבת ב-`/<button[\s\S]{0,400}?>/g`, והכמת העצל עוצר ב-`>` הראשון — שהוא ה-`>`
    // של `onClick={() => …}` ⛔ ולא סוגר התגית. ⇒ הקטע שנתפס הוא `<button ... () =`,
    // הוא לעולם אינו מכיל `min-h-touch`, והבדיקה נכשלת גם על קוד תקין. נמדד בטיק הזה.
    // ה-lookbehind פוסל `>` שקודמו `=`, ולכן התגית נסגרת במקום הנכון.
    const buttons = CODE.match(/<button[\s\S]{0,600}?(?<!=)>/g) ?? [];
    expect(buttons.length).toBeGreaterThan(0);
    for (const button of buttons) expect(button).toContain('min-h-touch');
  });
});

/**
 * T-124 · D-065 — כל ענף כשל נושא יציאה.
 *
 * ⚠️ **סטייה מוצהרת מנוסח התוכנית, והקוד הוא שכפה אותה:** התוכנית מוסיפה
 * `data-primary-action="true"` לקישור היציאה כאן. ⛔ אסור. `<DeckSelector>`
 * במסך הזה מרונדר **ללא תנאי** (⛔ לא בתוך ענף מצב), הוא כבר נושא את הסימון
 * מאז T-123, ולכן במצב `failed` היו נספרים **שני** סימונים באותו מסך.
 */
describe('T-124 · D-065 — כל ענף כשל נושא יציאה', () => {
  it('הטבלה מיובאת ⛔ והכלל אינו משוכפל כאן', () => {
    expect(CODE).toContain('failureExit');
    expect(CODE).toContain('isRetryable');
  });

  it('⛔ «נסה שוב» כבר אינו מותנה בקוד קשיח בקובץ הזה', () => {
    expect(CODE).not.toMatch(/state\.code === 'unavailable' \?/);
  });

  it('בלוק הכשל מכיל <a> — יציאה, ⛔ ולא רק משפט', () => {
    const start = CODE.indexOf("state.kind === 'failed'");
    expect(start).toBeGreaterThan(-1);
    const block = CODE.slice(start, start + 1400);
    expect(block).toMatch(/<a\s/);
  });

  it('⛔ אין סימון פעולה ראשית שני — DeckSelector כבר נושא אותו במסך הזה', () => {
    const start = CODE.indexOf("state.kind === 'failed'");
    const block = CODE.slice(start, start + 1400);
    expect(block).not.toContain('data-primary-action');
  });
});
