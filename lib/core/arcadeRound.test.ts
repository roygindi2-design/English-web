import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ARCADE_MIN_WORDS,
  ARCADE_OPTION_COUNT,
  ARCADE_ROUND_SIZE,
  buildRound,
  eligibleCandidates,
  type ArcadeCandidate,
} from './arcadeRound';
import type { CefrBand } from './cefrLevels';

/**
 * ⚠️ **הפיקסטורה היא החור שהיה כאן** (T-152 · D-087). עד 27/08 היא הזינה `distractorsHe`
 * **בעברית**, ולכן 2,403 בדיקות היו ירוקות בזמן שהייצור הגיש ללומד תרגום עברי אחד מול
 * שלוש מילים **באנגלית** — כלומר תשובה נכונה בלי לדעת ולו מילה אחת.
 * ⇒ מכאן ואילך הפיקסטורה מזינה **אנגלית**, בדיוק כמו `sense_distractors` בייצור,
 * והבדיקות מוכיחות שהיא ⛔ אינה מגיעה ל-`options`.
 */
function candidate(i: number, over: Partial<ArcadeCandidate> = {}): ArcadeCandidate {
  return {
    wordId: `w-${String(i).padStart(2, '0')}`,
    headword: `word${i}`,
    band: 'A2' as CefrBand,
    ngslRank: 100 + i,
    translationHe: `תרגום-${i}`,
    distractorsEn: ['rest', 'play', 'window'],
    ...over,
  };
}

/** מועמדים כשירים ברמה מבוקשת, ממוספרים ברצף כדי שסדר התדירות יהיה סדר המזהים. */
function makeCandidates(band: CefrBand, count: number): ArcadeCandidate[] {
  return Array.from({ length: count }, (_, i) => candidate(i, { band }));
}

const POOL = Array.from({ length: 20 }, (_, i) => candidate(i));

/** ⛔ רמת משחק ⛔ ולא רמת לומד: 5 ו-6 הן שתי הפרוסות של A2 בסולם (D-061). */
const A2_FIRST = 5;
const A2_SECOND = 6;

const HEBREW = /[֐-׿]/;
const LATIN = /[A-Za-z]/;

describe('כשירות — מה הופך מועמד לפריט קרב', () => {
  it('⛔ תרגום ריק ⇒ מדולג — בלי תשובה נכונה אין שאלה', () => {
    const blank = candidate(99, { translationHe: '   ' });
    expect(eligibleCandidates([blank, ...POOL], 'A2')).toHaveLength(POOL.length);
  });

  it('⛔ הכשירות ⛔ אינה נשענת עוד על מסיחי המילה — הם אנגלית ואינם מוצגים (T-152)', () => {
    const noEn = candidate(94, { distractorsEn: [] });
    expect(eligibleCandidates([noEn], 'A2').map((c) => c.wordId)).toEqual(['w-94']);
  });

  it('⛔ רמה אחרת אינה נכנסת — לומד ב-A2 ⛔ לעולם אינו נלחם על מילת C1', () => {
    const other = candidate(96, { band: 'C1' as CefrBand });
    expect(eligibleCandidates([other, ...POOL], 'A2').map((c) => c.wordId)).not.toContain('w-96');
  });

  it('band ריק ⛔ אינו נחשב שייך לרמה', () => {
    expect(eligibleCandidates([candidate(95, { band: null })], 'A2')).toHaveLength(0);
  });
});

describe('רמה קטנה מדי — מספר, ⛔ לא מסך ריק', () => {
  it(`פחות מ-${ARCADE_MIN_WORDS} כשירות ⇒ level_too_small עם הספירה האמיתית`, () => {
    const small = POOL.slice(0, 8);
    const round = buildRound({ gameLevel: A2_FIRST, candidates: small, seed: 1 });
    expect(round).toEqual({ ok: false, reason: 'level_too_small', eligible: 8, required: ARCADE_MIN_WORDS });
  });

  it('הספירה סופרת כשירות ⛔ ולא שורות — 20 שורות שרק 8 מהן כשירות הן 8', () => {
    const mixed = [
      ...POOL.slice(0, 8),
      ...Array.from({ length: 12 }, (_, i) => candidate(50 + i, { translationHe: '' })),
    ];
    const round = buildRound({ gameLevel: A2_FIRST, candidates: mixed, seed: 1 });
    expect(round).toMatchObject({ ok: false, eligible: 8 });
  });
});

describe('הסיבוב עצמו', () => {
  const round = buildRound({ gameLevel: A2_FIRST, candidates: POOL, seed: 7 });

  it(`${ARCADE_ROUND_SIZE} שאלות`, () => {
    expect(round.ok && round.questions).toHaveLength(ARCADE_ROUND_SIZE);
  });

  it(`כל שאלה ${ARCADE_OPTION_COUNT} אפשרויות, ⛔ בלי כפילות, והנכונה ביניהן`, () => {
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    for (const q of round.questions) {
      expect(q.options).toHaveLength(ARCADE_OPTION_COUNT);
      expect(new Set(q.options).size).toBe(ARCADE_OPTION_COUNT);
      expect(q.options).toContain(q.answer);
    }
  });

  it('⛔ אותה מילה אינה חוזרת בסיבוב אחד', () => {
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    expect(new Set(round.questions.map((q) => q.wordId)).size).toBe(round.questions.length);
  });

  it('אותו seed ⇒ אותו סיבוב בדיוק — הפונקציה טהורה ו⛔ אינה מגרילה בעצמה', () => {
    const again = buildRound({ gameLevel: A2_FIRST, candidates: POOL, seed: 7 });
    expect(JSON.stringify(again)).toBe(JSON.stringify(round));
  });

  it('seed אחר ⇒ סידור אחר', () => {
    const other = buildRound({ gameLevel: A2_FIRST, candidates: POOL, seed: 8 });
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(round));
  });

  it('רמת משחק גבוהה מושכת מהחלק הרחוק של אותה רמה — ⛔ ולא מרמה אחרת', () => {
    const deep = buildRound({ gameLevel: A2_SECOND, candidates: POOL, seed: 7 });
    expect(deep.ok).toBe(true);
    if (!deep.ok || !round.ok) return;
    const deepRanks = deep.questions.map((q) => Number(q.wordId.slice(2)));
    expect(Math.max(...deepRanks)).toBeGreaterThan(Math.max(...round.questions.map((q) => Number(q.wordId.slice(2)))));
    // ⛔ ועדיין A2 בלבד: כל מזהה מגיע מהמאגר שסונן לרמה
    expect(deep.questions.every((q) => POOL.some((c) => c.wordId === q.wordId))).toBe(true);
  });
});

/**
 * 🔴 T-152 · D-087 — **המשחק מפסיק להיות בחירה לפי א"ב.**
 * המסיחים הם תרגומים עבריים של **מועמדים אחרים באותה רמה**, ⛔ ולא `sense_distractors`
 * האנגליים. ⛔ אפס מיגרציה · אפס תוכן חדש · אפס מקור חדש.
 */
describe('T-152 — ארבע האפשרויות עבריות, ⛔ ואין נפילה חזרה לאנגלית', () => {
  const round = buildRound({ gameLevel: A2_FIRST, candidates: POOL, seed: 11 });

  it('⛔ ולו מסיח אנגלי אחד ⛔ אינו מגיע ל-options — הפיקסטורה מזינה אנגלית בכוונה', () => {
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    const english = new Set(POOL.flatMap((c) => c.distractorsEn));
    for (const q of round.questions) {
      for (const opt of q.options) expect(english.has(opt)).toBe(false);
    }
  });

  it('⛔ אף אפשרות אינה נושאת אות לטינית, וכולן בטווח היוניקוד העברי', () => {
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    for (const q of round.questions) {
      for (const opt of q.options) {
        expect(opt).toMatch(HEBREW);
        expect(opt).not.toMatch(LATIN);
      }
    }
  });

  it('כל מסיח הוא תרגום של מועמד אחר באותה רמה — ⛔ ולא מחרוזת שיוצרה בזמן אמת', () => {
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    const levelTranslations = new Set(POOL.map((c) => c.translationHe));
    for (const q of round.questions) {
      for (const opt of q.options) expect(levelTranslations.has(opt)).toBe(true);
    }
  });

  it('⛔ המסיח לעולם אינו זהה לתשובה ו⛔ אינו חוזר פעמיים', () => {
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    for (const q of round.questions) {
      const wrong = q.options.filter((o) => o !== q.answer);
      expect(wrong).toHaveLength(ARCADE_OPTION_COUNT - 1);
      expect(new Set(wrong).size).toBe(ARCADE_OPTION_COUNT - 1);
    }
  });

  it('⛔ מסיחים אנגליים ⛔ אינם מרפדים סיבוב חסר — רמה בת שלושה תרגומים היא level_too_small', () => {
    // עשרים מועמדים כשירים, ⛔ אך רק שלושה תרגומים שונים ביניהם ⇒ אי-אפשר לבנות
    // ארבע אפשרויות עבריות ⇒ כל שאלה יורדת, ⛔ ואין ריפוד באנגלית (ⓒ).
    const thin = Array.from({ length: 20 }, (_, i) =>
      candidate(i, { translationHe: `תרגום-${i % 3}` }));
    const round2 = buildRound({ gameLevel: A2_FIRST, candidates: thin, seed: 5 });
    expect(round2).toMatchObject({ ok: false, reason: 'level_too_small' });
  });

  it('ארבעה תרגומים שונים ברמה מספיקים — הסף הוא ARCADE_OPTION_COUNT, ⛔ ולא יותר', () => {
    const four = Array.from({ length: 20 }, (_, i) =>
      candidate(i, { translationHe: `תרגום-${i % 4}` }));
    const round3 = buildRound({ gameLevel: A2_FIRST, candidates: four, seed: 5 });
    expect(round3.ok).toBe(true);
    if (!round3.ok) return;
    expect(round3.questions).toHaveLength(ARCADE_ROUND_SIZE);
  });

  /**
   * ⛔ שומר-המקור: המוטציה שהממצא נועד למנוע היא «להחזיר את `c.distractorsEn`
   * ל-`options`». ⛔ סריקה על המקור נופלת **בשם** אם מישהו יחזיר אותה.
   */
  it('⛔ `buildRound` ⛔ אינו קורא את מסיחי המילה בכלל', () => {
    const src = readFileSync('lib/core/arcadeRound.ts', 'utf8');
    const body = src.slice(src.indexOf('export function buildRound'));
    expect(body).not.toContain('distractorsEn');
    expect(body).not.toContain('distractorsHe');
  });
});

describe('T-108 — הסיבוב נגזר מרמת משחק, ⛔ לא מרמת הלומד', () => {
  it('רמת משחק 13 ⇒ no_such_level, ⛔ ולא נפילה חזרה ל-A1', () => {
    const round = buildRound({ gameLevel: 13, candidates: [], seed: 1 });
    expect(round).toEqual({ ok: false, reason: 'no_such_level' });
  });

  it('רמת משחק 1 מחזירה band A1 ואת מספר הרמה', () => {
    const pool = makeCandidates('A1', 20);
    const round = buildRound({ gameLevel: 1, candidates: pool, seed: 7 });
    expect(round.ok).toBe(true);
    if (!round.ok) return;
    expect(round.band).toBe('A1');
    expect(round.gameLevel).toBe(1);
    expect(round.questions).toHaveLength(15);
  });

  it('שתי פרוסות באותה רמה ⛔ אינן מחזירות את אותן מילים', () => {
    const pool = makeCandidates('A1', 80);
    const a = buildRound({ gameLevel: 1, candidates: pool, seed: 7 });
    const b = buildRound({ gameLevel: 4, candidates: pool, seed: 7 });
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    const idsA = new Set(a.questions.map((q) => q.wordId));
    const overlap = b.questions.filter((q) => idsA.has(q.wordId));
    expect(overlap).toHaveLength(0);
  });

  it('⛔ החלון לעולם אינו קטן מהתחמושת — 20 מועמדים בפרוסה של רבע עדיין נותנים 15 שאלות', () => {
    // הפרוסה החשבונית של רמה 1 היא 20/4 = 5. ⛔ סיבוב בן 5 שאלות עם 15 תחמושת אינו קרב.
    const pool = makeCandidates('A1', 20);
    const round = buildRound({ gameLevel: 1, candidates: pool, seed: 3 });
    expect(round.ok && round.questions.length).toBe(ARCADE_ROUND_SIZE);
  });
});

/**
 * 🔴 T-219 · `37 § 2` — **הסיבוב נושא את סוג המילה.** ⛔ הפיקסטורה כאן ⛔ אינה יורשת את
 * `POOL` שלמעלה: היא ממוספרת `w0…w39` כדי שהמזהים בבדיקה יהיו קריאים, והיא ב-A1 כדי
 * שרמת המשחק 1 תגיש אותה.
 */
const mixCand = (n: number): ArcadeCandidate => ({
  wordId: `w${n}`,
  headword: `h${n}`,
  band: 'A1' as CefrBand,
  ngslRank: n,
  translationHe: `ת${n}`,
  distractorsEn: [],
});
const MIX_POOL = Array.from({ length: 40 }, (_, i) => mixCand(i));

describe('37 § 2 — כל שאלה נושאת את סוג המילה', () => {
  it('⛔ בלי הקבוצות — כל השאלות `base`, בדיוק ההתנהגות של היום', () => {
    const r = buildRound({ gameLevel: 1, candidates: MIX_POOL, seed: 7 });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.questions.every((q) => q.kind === 'base')).toBe(true);
  });

  it('מילה שסומנה `ידעתי` היא `known`; מילה בלי שורת התקדמות היא `unfiltered`', () => {
    const known = new Set(['w0', 'w1']);
    const touched = new Set(['w0', 'w1', 'w2']);
    const r = buildRound({
      gameLevel: 1,
      candidates: MIX_POOL,
      seed: 7,
      knownWordIds: known,
      touchedWordIds: touched,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (const q of r.questions) {
      if (known.has(q.wordId)) expect(q.kind).toBe('known');
      else if (touched.has(q.wordId)) expect(q.kind).toBe('base');
      else expect(q.kind).toBe('unfiltered');
    }
  });
});
