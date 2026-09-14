import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/** `<UnknownList>` — שורה 5 של § 4.2ז (T-083). שומר מקור, כמו שאר רכיבי המסך. */
const SRC = readFileSync('components/UnknownList.tsx', 'utf8');
const SCREEN = readFileSync('components/LevelMapScreen.tsx', 'utf8');

const CODE = withoutComments(SRC);

describe('רשימה, ⛔ ולא מונה (T-083)', () => {
  it('מציגה את המילה ואת התרגום, ⛔ ולא רק מספר', () => {
    expect(CODE).toContain('headword');
    expect(CODE).toContain('translation_he');
  });

  it('המילה האנגלית עוברת ב-<EnWord> (חוקה § 2)', () => {
    expect(CODE).toContain('EnWord');
  });

  it('פעולה אחת בראש הרשימה, ליעד הקיים', () => {
    expect(CODE).toContain('/study?deck=unknown');
    expect(CODE).toContain('תרגל את הרשימה');
  });
});

describe('⛔ אין הגדרה שנייה לחפיסה (§ 4.2ז)', () => {
  it('קוראת את הנתיב הקיים ⛔ ולא נתיב חדש', () => {
    expect(CODE).toContain('/api/study/queue?deck=unknown');
    expect(CODE).not.toContain('/api/levels/unknown');
  });

  it('⛔ אינה ממיינת מחדש בלקוח — המיון הוא של lib/core/deck.ts', () => {
    expect(CODE).not.toContain('.sort(');
  });

  it('⛔ אין גישה ישירה לדאטהבייס', () => {
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });
});

describe('⛔ אין מחיקה ידנית — יציאה מהרשימה היא דרך המנוע בלבד', () => {
  it.each(['DELETE', 'apiPatch', 'הסר', 'מחק'])('⛔ «%s» אינו מופיע', (needle) => {
    expect(CODE).not.toContain(needle);
  });
});

describe('אמת על מספרים', () => {
  it('כשל קריאה ⇒ «—» ⛔ ולא 0', () => {
    expect(CODE).toContain("'—'");
  });

  it('רשימה חתוכה אומרת את הסך ⛔ ואינה מתחזה לשלמה', () => {
    expect(CODE).toContain('מתוך');
    expect(CODE).toContain('MAX_QUEUE_LIMIT');
  });
});

describe('חוקת העיצוב', () => {
  it('⛔ אין מרכוז אנכי ואין h-screen', () => {
    expect(CODE).not.toContain('justify-center');
    expect(CODE).not.toContain('h-screen');
  });

  it('⛔ אין hex גולמי ואין אמוג\'י (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it.each(['נעול', 'שולט', 'כל הכבוד', 'ניקוד', 'רצף'])('⛔ המילה «%s» אינה מופיעה', (word) => {
    expect(CODE).not.toContain(word);
  });
});

describe('הרכיב הוא שורה 5 של המסך, ⛔ ואינו יתום', () => {
  it('‏<LevelMapScreen> מרנדר אותו', () => {
    expect(SCREEN).toContain('UnknownList');
  });

  it('שורה 5 מופיעה אחרי שורה 4 במקור — הסדר של § 4.2ז', () => {
    // ⚠️ **סטייה מנוסח התוכנית, ⛔ ולא קפידה — היא מדידה.** התוכנית נוקבת ב-
    // `SCREEN.indexOf('UnknownList')`, וההופעה הראשונה של המחרוזת הזאת בקובץ היא
    // **שורת ה-import** בראשו (~שורה 6), שקודמת ל-`PRACTICE_HE = 'דרכים לתרגל'`
    // (~שורה 31). ⇒ האסרציה נכשלת גם על חיבור תקין לחלוטין, ומודדת סדר ייבוא ולא
    // סדר שורות במסך. זו בדיוק סטייה ⓑ של C-0227, ואותו תיקון: מודדים באתר
    // הקריאה (`<UnknownList`) כמו ב-`world/bank/route.test.ts:16`.
    expect(SCREEN.indexOf('דרכים לתרגל')).toBeLessThan(SCREEN.indexOf('<UnknownList'));
  });
});
