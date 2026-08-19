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

describe('ארבע השורות של § 4.2ז, בסדרן', () => {
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
