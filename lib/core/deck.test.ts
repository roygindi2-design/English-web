import { describe, expect, it } from 'vitest';
import {
  applyPractice, bandRank, checkPracticePayload, clampQueueLimit, DEFAULT_QUEUE_LIMIT,
  excludeSeen, isUnknownRow, parseDeckName, selectDeck, sortQueue, toQueueCardInput,
  type QueueRow,
} from '@/lib/core/deck';

const row = (over: Partial<QueueRow>): QueueRow => ({
  wordId: '00000000-0000-4000-8000-000000000001',
  headword: 'word', translationHe: 'מילה',
  examples: { supportive: 'A supportive word.', neutral: 'The word is here.' },
  needsHumanReview: false, cefrProfileBand: 'A1', nextReviewAtMs: 1_000,
  // T-100 — ברירת מחדל `0` = «SM-2 טרם תזמן», בדיוק כמו `not null default 0` בעמודה.
  intervalDays: 0,
  attempts: 0, repetition: 0, consecutiveCorrectRecognition: 0, ...over,
});

describe('sortQueue — D-034', () => {
  it('ממיין לפי cefr_profile_band עולה', () => {
    const out = sortQueue([row({ cefrProfileBand: 'B2' }), row({ cefrProfileBand: 'A1' })]);
    expect(out.map((r) => r.cefrProfileBand)).toEqual(['A1', 'B2']);
  });

  it('NULL הוא סוף התור, ⛔ ולא רמה מנוחשת', () => {
    const out = sortQueue([row({ cefrProfileBand: null }), row({ cefrProfileBand: 'C2' })]);
    expect(out.map((r) => r.cefrProfileBand)).toEqual(['C2', null]);
  });

  it('רמה לא מוכרת נופלת לסוף ולא זורקת', () => {
    expect(bandRank('B3')).toBe(bandRank(null));
  });

  it('בתוך רמה — next_review_at עולה, ו-null אחרון', () => {
    const out = sortQueue([
      row({ nextReviewAtMs: null, headword: 'c' }),
      row({ nextReviewAtMs: 900, headword: 'b' }),
      row({ nextReviewAtMs: 100, headword: 'a' }),
    ]);
    expect(out.map((r) => r.headword)).toEqual(['a', 'b', 'c']);
  });

  it('שובר שוויון מלא לפי headword — סדר יציב, ⛔ לא תלוי-מנוע', () => {
    const out = sortQueue([row({ headword: 'zebra' }), row({ headword: 'apple' })]);
    expect(out.map((r) => r.headword)).toEqual(['apple', 'zebra']);
  });

  it('⛔ אינו משנה את המערך שהתקבל', () => {
    const input = [row({ cefrProfileBand: 'B1' }), row({ cefrProfileBand: 'A1' })];
    sortQueue(input);
    // `?.` ולא גישה ישירה: `noUncheckedIndexedAccess` דולק בפרויקט הזה, והבלוק כפי שנכתב
    // בתוכנית נופל ב-tsc. הבדיקה עצמה לא נחלשה — `undefined` אינו 'B1'.
    expect(input[0]?.cefrProfileBand).toBe('B1');
  });
});

describe('חפיסת «לא ידעתי» — attempts > 0 AND repetition = 0 (⛔ אפס מיגרציה)', () => {
  it('נכשל לפחות פעם אחת ולא ענה נכון מאז', () => {
    expect(isUnknownRow(row({ attempts: 3, repetition: 0 }))).toBe(true);
  });
  it('מילה שטרם נגעו בה אינה «לא ידעתי»', () => {
    expect(isUnknownRow(row({ attempts: 0, repetition: 0 }))).toBe(false);
  });
  it('מילה שענו עליה נכון יצאה מהחפיסה', () => {
    expect(isUnknownRow(row({ attempts: 5, repetition: 2 }))).toBe(false);
  });
  it('selectDeck מסנן, ממיין וחותך ב-limit', () => {
    const rows = [
      row({ wordId: 'a', attempts: 1, repetition: 0, cefrProfileBand: 'B1' }),
      row({ wordId: 'b', attempts: 1, repetition: 0, cefrProfileBand: 'A1' }),
      row({ wordId: 'c', attempts: 0, repetition: 0 }),
    ];
    expect(selectDeck(rows, 'unknown', 1).map((r) => r.wordId)).toEqual(['b']);
  });
  it('deck=due אינו מסנן — הסינון שלו נעשה בשאילתה', () => {
    expect(selectDeck([row({}), row({ wordId: 'x' })], 'due', 50)).toHaveLength(2);
  });
});

// ⚠️ נוסף מעבר לבלוק שבתוכנית: `excludeSeen` מופיע בבלוק `Interfaces` ומשמש את משימה 3,
// והכלל «⛔ אל תוסיף פונקציה שאין לה בדיקה כאן» מחייב שתהיה לו בדיקה כבר עכשיו.
describe('excludeSeen — ⛔ במקום not.in שגדל עם ההיסטוריה', () => {
  it('מסיר מזהים שכבר נמשכו ושומר על הסדר', () => {
    const rows = [row({ wordId: 'a' }), row({ wordId: 'b' }), row({ wordId: 'c' })];
    expect(excludeSeen(rows, ['b']).map((r) => r.wordId)).toEqual(['a', 'c']);
  });
  it('רשימה ריקה אינה מסננת דבר, ⛔ ואינה משנה את הקלט', () => {
    const rows = [row({ wordId: 'a' })];
    expect(excludeSeen(rows, [])).toHaveLength(1);
    expect(rows).toHaveLength(1);
  });
});

describe('parseDeckName · clampQueueLimit — קלט מהכתובת הוא קלט זר', () => {
  it('מקבל את שני השמות בלבד', () => {
    expect(parseDeckName('due')).toBe('due');
    expect(parseDeckName('unknown')).toBe('unknown');
    expect(parseDeckName('sentences')).toBeNull(); // ⛔ D-035 — חסומה
    expect(parseDeckName(null)).toBe('due');       // ברירת מחדל = מנת היום
  });
  it('limit פסול נופל לברירת מחדל, ⛔ ולא ל-NaN בשאילתה', () => {
    for (const bad of ['0', '-3', 'abc', '2.5', '']) {
      expect(clampQueueLimit(bad)).toBe(DEFAULT_QUEUE_LIMIT);
    }
    expect(clampQueueLimit(null)).toBe(DEFAULT_QUEUE_LIMIT);
    expect(clampQueueLimit('7')).toBe(7);
    expect(clampQueueLimit('9999')).toBe(50);
  });
});

describe('toQueueCardInput — צורת החוט שנכנסת ל-buildCard', () => {
  it('needs_human_review נוסע כמו שהוא — D-024', () => {
    const out = toQueueCardInput(row({ needsHumanReview: true }), 3);
    expect(out.sense.needs_human_review).toBe(true);
  });
  it('attempts=0 ⇒ מפגש ראשון ⇒ המשפט התומך', () => {
    expect(toQueueCardInput(row({ attempts: 0 }), 3).is_first_encounter).toBe(true);
    expect(toQueueCardInput(row({ attempts: 1 }), 3).is_first_encounter).toBe(false);
  });
  it('הכיוון נגזר מהרצף דרך directionFor, ⛔ ולא מדגל חדש', () => {
    expect(toQueueCardInput(row({ consecutiveCorrectRecognition: 0 }), 3).direction).toBe('recognition');
    expect(toQueueCardInput(row({ consecutiveCorrectRecognition: 3 }), 3).direction).toBe('production');
  });
});

describe('applyPractice — ⛔ הבדיקה החשובה בכל התוכנית (D-033)', () => {
  it('סופר ניסיון, ומעלה correct רק על good', () => {
    expect(applyPractice({ attempts: 4, correctAttempts: 1 }, 'good')).toEqual({ attempts: 5, correctAttempts: 2 });
    expect(applyPractice({ attempts: 4, correctAttempts: 1 }, 'again')).toEqual({ attempts: 5, correctAttempts: 1 });
  });
  it('⛔ מחזיר שני שדות בלבד — אין דרך לכתוב תזמון דרך הפונקציה הזו', () => {
    expect(Object.keys(applyPractice({ attempts: 0, correctAttempts: 0 }, 'good')).sort())
      .toEqual(['attempts', 'correctAttempts']);
  });
});

describe('checkPracticePayload — F-004 בגבול הזה', () => {
  const id = '00000000-0000-4000-8000-000000000001';
  it('דוחה null, מערך ופרימיטיב', () => {
    for (const bad of [null, [], 'x', 7]) expect(checkPracticePayload(bad).ok).toBe(false);
  });
  it('דוחה word_id שאינו UUID ו-grade שאינו בינארי', () => {
    expect(checkPracticePayload({ word_id: 'nope', grade: 'good' }).ok).toBe(false);
    expect(checkPracticePayload({ word_id: id, grade: 'easy' }).ok).toBe(false);
  });
  it('מקבל את השניים התקינים', () => {
    const check = checkPracticePayload({ word_id: id, grade: 'again' });
    expect(check.ok && check.payload).toEqual({ wordId: id, grade: 'again' });
  });
});

describe('T-100 · D-043 — התזמון נוסע בחוט, ⛔ ואפס עמודה חדשה', () => {
  const row = {
    wordId: '11111111-2222-3333-4444-555555555555',
    headword: 'budget',
    translationHe: 'תקציב',
    examples: { supportive: 'a', neutral: 'b' },
    needsHumanReview: false,
    cefrProfileBand: 'A1',
    nextReviewAtMs: Date.parse('2026-08-01T09:00:00.000Z'),
    attempts: 3,
    repetition: 2,
    consecutiveCorrectRecognition: 1,
    intervalDays: 7,
  };

  it('מעביר את שני השדות, ⛔ ובלי לגעת בארבעת הקיימים', () => {
    const card = toQueueCardInput(row, 3);
    expect(card.review).toEqual({ next_review_at: '2026-08-01T09:00:00.000Z', interval_days: 7 });
    expect(card.word_id).toBe(row.wordId);
    expect(card.sense.headword).toBe('budget');
    expect(card.is_first_encounter).toBe(false);
  });

  it('המרת ms⇄ISO נאמנה למילישנייה — ⛔ אין כאן איבוד דיוק', () => {
    const odd = { ...row, nextReviewAtMs: Date.parse('2026-08-01T09:00:00.123Z') };
    expect(Date.parse(toQueueCardInput(odd, 3).review.next_review_at ?? '')).toBe(odd.nextReviewAtMs);
  });

  it('מילה שטרם תוזמנה ⇒ null ⛔ ולא אפוק 0', () => {
    const fresh = { ...row, nextReviewAtMs: null, intervalDays: 0, attempts: 0 };
    expect(toQueueCardInput(fresh, 3).review).toEqual({ next_review_at: null, interval_days: 0 });
  });
});
