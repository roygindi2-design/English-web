import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  applyPractice, bandRank, checkPracticePayload, clampQueueLimit, deckCardKey, DEFAULT_QUEUE_LIMIT,
  excludeSeen, isSentenceCard, isUnknownRow, parseDeckName, selectDeck,
  sortQueue, toQueueCardInput, type QueueRow,
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
  it('מקבל את השמות שהמסלול מכיר', () => {
    expect(parseDeckName('due')).toBe('due');
    expect(parseDeckName('unknown')).toBe('unknown');
    expect(parseDeckName('level')).toBe('level');
    // T-165ⓐ · C-0321 — `sentences` נפתחה במסלול (D-097 מדדה את שני תנאי D-035 כמולאים).
    expect(parseDeckName('sentences')).toBe('sentences');
    expect(parseDeckName('nope')).toBeNull();
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
    expect(check.ok && check.payload).toEqual({ wordId: id, grade: 'again', deck: 'due' });
  });
});

describe('checkPracticePayload — T-225: החפיסה נוסעת בגוף הבקשה', () => {
  const id = '00000000-0000-4000-8000-000000000001';

  it("חסר `deck` ⇒ `'due'`, ⛔ ולא דחייה — התאימות לאחור היא הצד הבטוח", () => {
    const check = checkPracticePayload({ word_id: id, grade: 'good' });
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.payload.deck).toBe('due');
  });

  it('ארבעת שמות החפיסה עוברים — `sentences` מאז T-199ⓐ (D-169 · D-142)', () => {
    for (const deck of ['due', 'unknown', 'level', 'sentences'] as const) {
      const check = checkPracticePayload({ word_id: id, grade: 'good', deck });
      expect(check.ok, deck).toBe(true);
      if (check.ok) expect(check.payload.deck).toBe(deck);
    }
  });

  it("T-199ⓐ — `'sentences'` מתקבל: הדירוג של פריט השלמה נוסע בחוט התרגול (D-156 ⓑ)", () => {
    const check = checkPracticePayload({ word_id: id, grade: 'good', deck: 'sentences' });
    expect(check.ok).toBe(true);
    if (check.ok) expect(check.payload.deck).toBe('sentences');
  });

  it('⛔ שם שאינו מוכר נדחה, ⛔ ולא נופל בשקט לברירת מחדל', () => {
    for (const bad of ['level ', 'LEVEL', '', 7, null, {}]) {
      expect(checkPracticePayload({ word_id: id, grade: 'good', deck: bad }).ok, String(bad)).toBe(false);
    }
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

/**
 * T-066 · D-169 — one deck, two shapes. The key is what «a graded card is REMOVED» removes by
 * (`CardDeck.tsx`), so a key that collides is a card that vanishes unanswered.
 */
describe('deckCardKey · isSentenceCard — T-066', () => {
  const word = toQueueCardInput(row({ wordId: '00000000-0000-4000-8000-0000000000aa' }), 3);
  const sentence = (itemIndex: number) => ({
    wordId: '00000000-0000-4000-8000-0000000000bb',
    itemIndex,
    stem: 'The ____ is here.',
    answer: 'word',
    options: ['word', 'ward', 'wood'],
    translationHe: 'מילה',
    exampleNeutral: null,
  });

  it('כרטיס מילה נמפתח לפי word_id', () => {
    expect(isSentenceCard(word)).toBe(false);
    expect(deckCardKey(word)).toBe('00000000-0000-4000-8000-0000000000aa');
  });

  it('פריט משפט נמפתח לפי wordId#itemIndex', () => {
    expect(isSentenceCard(sentence(0))).toBe(true);
    expect(deckCardKey(sentence(0))).toBe('00000000-0000-4000-8000-0000000000bb#0');
  });

  it('שני גזעים של מילה אחת ⇒ שני מפתחות, ⛔ ולא כרטיס אחד שנעלם פעמיים', () => {
    expect(deckCardKey(sentence(0))).not.toBe(deckCardKey(sentence(2)));
    expect(new Set([sentence(0), sentence(1), sentence(2)].map(deckCardKey)).size).toBe(3);
  });
});

/**
 * T-155 · D-089 — «סינון מילים».
 *
 * ⚠️ שלוש הבדיקות האחרונות כאן סורקות את **המסלול** ⛔ ולא את השכבה הטהורה, וזה בכוונה:
 * שלוש ההבטחות של D-089 (⛔ אפס SM-2 · ⛔ אפס `senses.cefr_level` · ⛔ אפס נפילה ל-A1)
 * חיות בקובץ שאין לו בדיקת יחידה — הוא נוגע ב-Supabase — ובלי סריקת מקור אף אחת מהן
 * ⛔ אינה נמדדת בכלל. סריקה היא ראיה חלשה יותר מהרצה, ו⛔ היא חזקה מאינסוף מאין-בדיקה.
 */
describe('חפיסת «סינון מילים» — deck=level (T-155 · D-089)', () => {
  const QUEUE_ROUTE_SRC = readFileSync('app/api/study/queue/route.ts', 'utf8');
  /**
   * ⛔ **הערות מוסרות לפני הסריקה, וזה ⛔ אינו החלשה.** המשפט «⛔ ולעולם לא
   * `senses.cefr_level`» מופיע בקובץ **כהערה שאוסרת אותו**, ולכן סריקה על הקובץ הגולמי
   * הייתה נופלת על התיעוד של הכלל עצמו — ומי שהיה מתקן אותה היה מוחק את ההערה, ⛔ לא
   * את הסכנה. מה שנמדד כאן הוא **קוד חי**. אותו דפוס בדיוק ב-`Flashcard.test.ts`.
   */
  const stripComments = (source: string): string =>
    source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const QUEUE_ROUTE_CODE = stripComments(QUEUE_ROUTE_SRC);

  it('מקבל `level` כשם חפיסה', () => {
    expect(parseDeckName('level')).toBe('level');
  });

  it('⛔ ואינו שובר את שתי החפיסות הקיימות', () => {
    expect(parseDeckName('due')).toBe('due');
    expect(parseDeckName('unknown')).toBe('unknown');
    expect(parseDeckName(null)).toBe('due');
  });

  it('שומר כל שורה שהשאילתה החזירה, בסדר רמה ואז כותרת', () => {
    const rows = [
      row({ cefrProfileBand: 'B1', headword: 'zebra', nextReviewAtMs: null }),
      row({ cefrProfileBand: 'A1', headword: 'apple', nextReviewAtMs: null }),
      row({ cefrProfileBand: 'A1', headword: 'anchor', nextReviewAtMs: null }),
    ];
    expect(selectDeck(rows, 'level', 20).map((r) => r.headword)).toEqual([
      'anchor',
      'apple',
      'zebra',
    ]);
  });

  it('⛔ אינו משמיט מילה שטרם נענתה, כפי ש-`unknown` כן', () => {
    const fresh = row({ attempts: 0, repetition: 0 });
    expect(selectDeck([fresh], 'unknown', 20)).toHaveLength(0);
    expect(selectDeck([fresh], 'level', 20)).toHaveLength(1);
  });

  it('⛔ אינו מסנן מילה שכבר ידועה — היא ברמה, והחפיסה היא הרמה', () => {
    const known = row({ attempts: 9, repetition: 4 });
    expect(selectDeck([known], 'level', 20)).toHaveLength(1);
  });

  // ⛔ שלוש המוטציות. כל אחת נופלת **בשם**, ⛔ ולא בטענה כללית.
  it('מוטציה: דירוג מחפיסת הרמה ⛔ לעולם אינו נוגע ב-SM-2', () => {
    const next = applyPractice({ attempts: 3, correctAttempts: 1 }, 'good');
    expect(Object.keys(next).sort()).toEqual(['attempts', 'correctAttempts']);
  });

  it('מוטציה: חפיסת הרמה ⛔ לעולם אינה ממוינת לפי senses.cefr_level', () => {
    expect(QUEUE_ROUTE_CODE).not.toMatch(/senses[^\n]*cefr_level/);
  });

  it('מוטציה: current_level ריק ⇒ no_level, ⛔ ולעולם לא A1', () => {
    expect(QUEUE_ROUTE_CODE).toContain("'no_level'");
    expect(QUEUE_ROUTE_CODE).not.toMatch(/current_level[^\n]*\?\?\s*'A1'/);
  });

  it('מוטציה: הסדר בשאילתה הוא ngsl_rank, ⛔ ולא שובר-שוויון אלפביתי', () => {
    // ⛔ הבדיקה היא על **הפונקציה**, ⛔ לא על הקובץ כולו: `loadNewWords` מסדר באותה
    // צורה בדיוק, ולכן סריקה גלובלית הייתה עוברת גם אם הענף הזה איבד את הסדר.
    const fn = QUEUE_ROUTE_CODE.slice(QUEUE_ROUTE_CODE.indexOf('async function loadLevelWords'));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    expect(body).toContain("ngsl_rank");
    expect(body).toContain("cefr_profile_band");
    expect(body).not.toContain('excludeSeen');
  });
});

/**
 * T-199ⓐ · D-169 — the narrow screen gate is GONE, and this is its tombstone: a future edit
 * that re-introduces `parseFlashcardDeckName` (or hands `/study` anything but the wide
 * `parseDeckName`) fails here BY NAME. The compile-time half (`FlashcardDeckName`) went with it;
 * what replaced both is `<Flashcard>`'s `choice` variant (T-066), which draws the item.
 */
describe('T-199ⓐ — one gate, parseDeckName (D-169)', () => {
  const stripped = (path: string) =>
    readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
  const DECK_SOURCE = stripped('lib/core/deck.ts');

  it('⛔ parseFlashcardDeckName ⛔ אינו קיים עוד — T-199ⓐ · D-169', () => {
    expect(DECK_SOURCE).not.toContain('parseFlashcardDeckName');
    expect(DECK_SOURCE).not.toContain('FLASHCARD_DECK_NAMES');
    expect(DECK_SOURCE).not.toContain('FlashcardDeckName');
  });

  it('`app/study/page.tsx` קורא ל-parseDeckName הרחב, ⛔ ולא לשער הצר', () => {
    const src = stripped('app/study/page.tsx');
    expect(src).toMatch(/[^a-zA-Z]parseDeckName\s*\(/);
    expect(src).not.toContain('parseFlashcardDeckName');
  });

  it('`sentences` עובר את שער המסלול ⛔ ואת שער התרגול', () => {
    expect(parseDeckName('sentences')).toBe('sentences');
    expect(
      checkPracticePayload({ word_id: '00000000-0000-4000-8000-000000000001', grade: 'again', deck: 'sentences' }).ok,
    ).toBe(true);
  });
});
