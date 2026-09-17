import { describe, expect, it } from 'vitest';
import { BAND_ORDER } from './cefrLevels';
import {
  LEVEL_LABELS_HE,
  classifyProgress,
  parseLevel,
  summarizeAllLevels,
  summarizeLevel,
  unfilteredInLevel,
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

describe('T-102 — שש רשומות, בסדר, וסכום שלוש הספירות בכל אחת הוא הסך', () => {
  const EMPTY_TOTALS = { A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0 } as const;

  it('מחזיר בדיוק שש רשומות בסדר A1…C2, גם על מאגר ריק לגמרי', () => {
    const levels = summarizeAllLevels({ totals: EMPTY_TOTALS, rows: [] });
    expect(levels.map((l) => l.level)).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
  });

  it('רמה בלי מילים במאגר היא 0 בכל השדות, ⛔ ולא נעדרת מהמערך (C1/C2 היום)', () => {
    const levels = summarizeAllLevels({ totals: EMPTY_TOTALS, rows: [] });
    const c2 = levels.find((l) => l.level === 'C2');
    expect(c2).toEqual({ level: 'C2', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 });
  });

  it('שורה מקובצת לרמה שלה ⛔ ולא לרמה הנוכחית', () => {
    const levels = summarizeAllLevels({
      totals: { ...EMPTY_TOTALS, A1: 5, B1: 3 },
      rows: [
        { band: 'A1', attempts: 0, repetition: 0, selfMarkedKnown: true },
        { band: 'B1', attempts: 2, repetition: 0, selfMarkedKnown: false },
      ],
    });
    expect(levels.find((l) => l.level === 'A1')).toMatchObject({ known: 1, inReviewList: 0, unseen: 4 });
    expect(levels.find((l) => l.level === 'B1')).toMatchObject({ known: 0, inReviewList: 1, unseen: 2 });
  });

  it('⛔ שורה עם band = null ⛔ אינה מנוחשת לרמה — היא מושמטת מכל שש הספירות', () => {
    const levels = summarizeAllLevels({
      totals: { ...EMPTY_TOTALS, A1: 2 },
      rows: [{ band: null, attempts: 3, repetition: 0, selfMarkedKnown: false }],
    });
    expect(levels.find((l) => l.level === 'A1')).toMatchObject({ known: 0, inReviewList: 0, unseen: 2 });
  });

  it('⛔ הספירה הכפולה נתפסת גם כאן: אותה מילה גם סומנה וגם נוסתה נספרת פעם אחת', () => {
    const levels = summarizeAllLevels({
      totals: { ...EMPTY_TOTALS, A1: 1 },
      rows: [{ band: 'A1', attempts: 4, repetition: 0, selfMarkedKnown: true }],
    });
    const a1 = levels.find((l) => l.level === 'A1');
    expect(a1).toMatchObject({ known: 1, inReviewList: 0, unseen: 0 });
    expect((a1?.known ?? 0) + (a1?.inReviewList ?? 0) + (a1?.unseen ?? 0)).toBe(a1?.totalInLevel);
  });

  it('סכום שלוש הספירות = הסך, בכל אחת משש הרמות', () => {
    const levels = summarizeAllLevels({
      totals: { A1: 10, A2: 7, B1: 4, B2: 2, C1: 0, C2: 0 },
      rows: [
        { band: 'A1', attempts: 1, repetition: 2, selfMarkedKnown: false },
        { band: 'A1', attempts: 1, repetition: 0, selfMarkedKnown: false },
        { band: 'A2', attempts: 0, repetition: 0, selfMarkedKnown: true },
      ],
    });
    for (const level of levels) {
      expect(level.known + level.inReviewList + level.unseen).toBe(level.totalInLevel);
    }
  });

  it('ספירה בלתי-אפשרית זורקת ⛔ ואינה מחזירה מספר שלילי', () => {
    expect(() =>
      summarizeAllLevels({
        totals: { ...EMPTY_TOTALS, A1: 0 },
        rows: [{ band: 'A1', attempts: 0, repetition: 1, selfMarkedKnown: false }],
      }),
    ).toThrow(RangeError);
  });
});

/**
 * `T-413` · `F-277` · `D-266` — «עוד לא סוננו» is a question about the BOOKMARK, and this
 * is the only place it is answered.
 */
describe('unfilteredInLevel — one definition of «עוד לא סוננו»', () => {
  it('⛔ no bookmark ⇒ the whole level, ⛔ and ⛔ not zero', () => {
    // A learner who never opened A1 has filtered ⛔ nothing in it. This is also the value
    // every failure path of `readLevelCursor` produces, and «the whole level» is the
    // honest claim there — ⛔ not a smaller number that flatters the product.
    expect(unfilteredInLevel({ totalInLevel: 315, aheadOfCursor: null })).toBe(315);
  });

  it('🔴 the number falls by twenty after twenty were SERVED, ⛔ with nothing graded', () => {
    // This is the whole of `F-277` as the learner meets it: before today the tile read
    // `totalInLevel − known − inReviewList`, so a learner who filtered and did ⛔ not grade
    // saw the same 315 tomorrow.
    expect(unfilteredInLevel({ totalInLevel: 315, aheadOfCursor: 295 })).toBe(295);
  });

  it('the end of the level is 0, ⛔ and 0 is a real answer', () => {
    expect(unfilteredInLevel({ totalInLevel: 315, aheadOfCursor: 0 })).toBe(0);
  });

  it('⛔ more ahead than the level holds ⇒ throws, ⛔ never a number on the screen', () => {
    // The only meaning is that the two counts ran against different bands. A number larger
    // than the level itself looks like a display bug; throwing says the truth.
    expect(() => unfilteredInLevel({ totalInLevel: 10, aheadOfCursor: 11 })).toThrow(RangeError);
  });

  it('⛔ rejects a non-integer and a negative, exactly like the other counts', () => {
    expect(() => unfilteredInLevel({ totalInLevel: 315, aheadOfCursor: -1 })).toThrow(RangeError);
    expect(() => unfilteredInLevel({ totalInLevel: 315, aheadOfCursor: 2.5 })).toThrow(RangeError);
    expect(() => unfilteredInLevel({ totalInLevel: -3, aheadOfCursor: null })).toThrow(RangeError);
  });

  it('⛔ it is ⛔ NOT `unseen` — the two answer different questions about the same level', () => {
    // 315 words · 189 known · 18 in review ⇒ `unseen` (never started) is 108. The learner
    // has been served 20. «עוד לא סוננו» is 295, ⛔ not 108, and both are correct.
    const summary = summarizeLevel({
      level: 'A1',
      totalInLevel: 315,
      rows: [
        ...Array.from({ length: 189 }, () => ({ attempts: 3, repetition: 2, selfMarkedKnown: false })),
        ...Array.from({ length: 18 }, () => ({ attempts: 1, repetition: 0, selfMarkedKnown: false })),
      ],
    });
    expect(summary.unseen).toBe(108);
    expect(unfilteredInLevel({ totalInLevel: 315, aheadOfCursor: 295 })).toBe(295);
  });
});
