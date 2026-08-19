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

function candidate(i: number, over: Partial<ArcadeCandidate> = {}): ArcadeCandidate {
  return {
    wordId: `w-${String(i).padStart(2, '0')}`,
    headword: `word${i}`,
    band: 'A2' as CefrBand,
    ngslRank: 100 + i,
    translationHe: `תרגום-${i}`,
    distractorsHe: [`מסיח-${i}-א`, `מסיח-${i}-ב`, `מסיח-${i}-ג`],
    ...over,
  };
}

const POOL = Array.from({ length: 20 }, (_, i) => candidate(i));

describe('כשירות — ⛔ מילה בלי ארבעה מסיחים כשירים מדולגת בשקט', () => {
  it('שלושה מסיחים ייחודיים הם המינימום; שניים ⇒ מדולגת', () => {
    const thin = candidate(99, { distractorsHe: ['מסיח-א', 'מסיח-ב'] });
    expect(eligibleCandidates([thin, ...POOL], 'A2')).toHaveLength(POOL.length);
  });

  it('מסיח שזהה לתרגום הנכון ⛔ אינו נספר — ארבע אפשרויות עם כפילות אינן ארבע', () => {
    const dup = candidate(98, { distractorsHe: ['תרגום-98', 'מסיח-א', 'מסיח-ב'] });
    expect(eligibleCandidates([dup], 'A2')).toHaveLength(0);
  });

  it('שני מסיחים זהים זה לזה נספרים כאחד', () => {
    const dup = candidate(97, { distractorsHe: ['מסיח-א', 'מסיח-א', 'מסיח-ב'] });
    expect(eligibleCandidates([dup], 'A2')).toHaveLength(0);
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
    const round = buildRound({ level: 'A2', candidates: small, seed: 1 });
    expect(round).toEqual({ ok: false, reason: 'level_too_small', eligible: 8, required: ARCADE_MIN_WORDS });
  });

  it('הספירה סופרת כשירות ⛔ ולא שורות — 20 שורות שרק 8 מהן כשירות הן 8', () => {
    const mixed = [
      ...POOL.slice(0, 8),
      ...Array.from({ length: 12 }, (_, i) => candidate(50 + i, { distractorsHe: ['רק-אחד'] })),
    ];
    const round = buildRound({ level: 'A2', candidates: mixed, seed: 1 });
    expect(round).toMatchObject({ ok: false, eligible: 8 });
  });
});

describe('הסיבוב עצמו', () => {
  const round = buildRound({ level: 'A2', candidates: POOL, seed: 7 });

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
    const again = buildRound({ level: 'A2', candidates: POOL, seed: 7 });
    expect(JSON.stringify(again)).toBe(JSON.stringify(round));
  });

  it('seed אחר ⇒ סידור אחר', () => {
    const other = buildRound({ level: 'A2', candidates: POOL, seed: 8 });
    expect(JSON.stringify(other)).not.toBe(JSON.stringify(round));
  });

  it('רמת משחק גבוהה מושכת מהחלק הרחוק של אותה רמה — ⛔ ולא מרמה אחרת', () => {
    const deep = buildRound({ level: 'A2', candidates: POOL, seed: 7, arcadeLevel: 3 });
    expect(deep.ok).toBe(true);
    if (!deep.ok || !round.ok) return;
    const deepRanks = deep.questions.map((q) => Number(q.wordId.slice(2)));
    expect(Math.max(...deepRanks)).toBeGreaterThan(Math.max(...round.questions.map((q) => Number(q.wordId.slice(2)))));
    // ⛔ ועדיין A2 בלבד: כל מזהה מגיע מהמאגר שסונן לרמה
    expect(deep.questions.every((q) => POOL.some((c) => c.wordId === q.wordId))).toBe(true);
  });
});
