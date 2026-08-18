import { describe, expect, it } from 'vitest';
import { BAND_ORDER } from './cefrLevels';
import {
  LEVEL_LABELS_HE,
  classifyProgress,
  parseLevel,
  summarizeLevel,
  type ProgressFacts,
} from './levelSummary';

const row = (over: Partial<ProgressFacts> = {}): ProgressFacts => ({
  attempts: 0,
  repetition: 0,
  selfMarkedKnown: false,
  ...over,
});

describe('classifyProgress — ההגדרה היחידה של שלוש הקבוצות (§ 4.2ז)', () => {
  it('סימון עצמי הוא «ידוע», גם בלי שום ניסיון', () => {
    expect(classifyProgress(row({ selfMarkedKnown: true }))).toBe('known');
  });

  it('repetition ≥ 1 הוא «ידוע», גם בלי סימון עצמי', () => {
    expect(classifyProgress(row({ attempts: 4, repetition: 1 }))).toBe('known');
  });

  it('⛔ הבדיקה שתופסת ספירה כפולה: גם סימון עצמי וגם ניסיונות ⇒ «ידוע», פעם אחת', () => {
    // זו הפיקסטורה ש-§ 4.2ז נוקב בה בשמה. בלי הענף הזה אותה מילה נספרת פעמיים
    // ושלוש הקבוצות מפסיקות להיות זרות.
    expect(classifyProgress(row({ attempts: 5, repetition: 0, selfMarkedKnown: true }))).toBe('known');
  });

  it('ניסיונות בלי repetition ובלי סימון עצמי ⇒ «ברשימת החזרה»', () => {
    expect(classifyProgress(row({ attempts: 1, repetition: 0 }))).toBe('in_review');
  });

  it('שורה בלי ניסיונות ובלי סימון ⇒ not_started, ⛔ ולא «ברשימת החזרה»', () => {
    expect(classifyProgress(row())).toBe('not_started');
  });
});

describe('summarizeLevel — שלוש קבוצות זרות שסכומן הוא הסך', () => {
  const rows: ProgressFacts[] = [
    row({ selfMarkedKnown: true }), // known
    row({ attempts: 9, repetition: 3 }), // known
    row({ attempts: 5, repetition: 0, selfMarkedKnown: true }), // known — הכפולה
    row({ attempts: 2, repetition: 0 }), // in_review
    row({ attempts: 1, repetition: 0 }), // in_review
    row(), // not_started ⇒ unseen
  ];

  it('סופר כל שורה פעם אחת בדיוק', () => {
    const s = summarizeLevel({ level: 'A1', totalInLevel: 10, rows });
    expect(s.known).toBe(3);
    expect(s.inReviewList).toBe(2);
  });

  it('הסכום שווה לסך — אי-שוויון הוא באג, ⛔ לא עיגול', () => {
    const s = summarizeLevel({ level: 'A1', totalInLevel: 10, rows });
    expect(s.known + s.inReviewList + s.unseen).toBe(s.totalInLevel);
  });

  it('שורה בלי ניסיונות נופלת ל-unseen בגזירה (הכרעה ⓒ בתוכנית)', () => {
    const s = summarizeLevel({ level: 'A1', totalInLevel: 10, rows });
    expect(s.unseen).toBe(5); // 10 − 3 − 2
  });

  it('לומד ללא שום שורה: הכל טרם נראה', () => {
    const s = summarizeLevel({ level: 'B2', totalInLevel: 8, rows: [] });
    expect(s).toEqual({ level: 'B2', totalInLevel: 8, known: 0, inReviewList: 0, unseen: 8 });
  });

  it('רמה ריקה במאגר (C1/C2 היום) היא אפסים, ⛔ ולא שגיאה', () => {
    const s = summarizeLevel({ level: 'C1', totalInLevel: 0, rows: [] });
    expect(s.unseen).toBe(0);
  });

  it('⛔ זורק כשהספירות בלתי אפשריות — יותר ידועות מאשר מילים ברמה', () => {
    // המשמעות היחידה של המצב הזה היא ששתי השאילתות סיננו לרמות שונות. מספר
    // שלילי על המסך היה נראה כמו באג תצוגה; חריגה כאן עוצרת את השקר במקור.
    expect(() =>
      summarizeLevel({ level: 'A1', totalInLevel: 1, rows: [row({ selfMarkedKnown: true }), row({ attempts: 1 })] }),
    ).toThrow(RangeError);
  });

  it('⛔ זורק על סך שלילי או לא שלם', () => {
    expect(() => summarizeLevel({ level: 'A1', totalInLevel: -1, rows: [] })).toThrow(RangeError);
    expect(() => summarizeLevel({ level: 'A1', totalInLevel: 3.5, rows: [] })).toThrow(RangeError);
  });
});

describe('parseLevel — שער אחד לשש הרמות', () => {
  it.each(BAND_ORDER)('מקבל %s', (band) => {
    expect(parseLevel(band)).toBe(band);
  });

  it('⛔ דוחה כל דבר אחר, ומחזיר null במקום לזרוק', () => {
    for (const bad of [null, undefined, '', 'a1', 'A3', 'D1', 1, {}, ['A1']]) {
      expect(parseLevel(bad)).toBeNull();
    }
  });
});

describe('LEVEL_LABELS_HE — תווית עובדתית, ⛔ בלי טענת מוכנות (R-017)', () => {
  it('יש תווית לכל אחת משש הרמות', () => {
    for (const band of BAND_ORDER) expect(LEVEL_LABELS_HE[band]).toMatch(/רמה \d מתוך 6/);
  });

  it('⛔ אף תווית אינה מכילה מילת שליטה, מוכנות או נעילה', () => {
    const forbidden = ['שולט', 'שליטה', 'מוכן', 'נעול', 'מתקדם', 'מומחה'];
    for (const band of BAND_ORDER) {
      for (const word of forbidden) expect(LEVEL_LABELS_HE[band]).not.toContain(word);
    }
  });
});
