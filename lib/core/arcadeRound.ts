/**
 * § 4.2י — סיבוב קרב אחד בזירה. טהור: אפס React, DOM, רשת ו-env.
 *
 * ⚠️ זהו **המקום היחיד** שמחליט אילו מילים נלחמות ואילו ארבע אפשרויות מוצגות.
 * `app/api/arcade/round/route.ts` שואל את הדאטהבייס «אילו מילים ומסיחים יש ברמה
 * הזאת» ומעביר אותם לכאן — ⛔ הוא אינו מסנן ואינו מגריל ב-SQL.
 *
 * ⛔ שום דבר כאן אינו קורא, כותב או מפרש SM-2, ו⛔ אין בקובץ `Math.random`:
 * הגרלה שאינה ניתנת לשחזור היא סיבוב שאי-אפשר לכתוב עליו בדיקה. ה-seed מגיע
 * מהנתיב.
 */
import type { CefrBand } from './cefrLevels';

export const ARCADE_MIN_WORDS = 12;
export const ARCADE_ROUND_SIZE = 8;
export const ARCADE_OPTION_COUNT = 4;

export interface ArcadeCandidate {
  readonly wordId: string;
  readonly headword: string;
  readonly band: CefrBand | null;
  readonly ngslRank: number | null;
  readonly translationHe: string;
  readonly distractorsHe: readonly string[];
}

export interface ArcadeQuestion {
  readonly wordId: string;
  readonly headword: string;
  readonly answer: string;
  readonly options: readonly string[];
}

export type ArcadeRound =
  | { readonly ok: true; readonly level: CefrBand; readonly questions: readonly ArcadeQuestion[] }
  | { readonly ok: false; readonly reason: 'level_too_small'; readonly eligible: number; readonly required: number };

function usableDistractors(c: ArcadeCandidate): string[] {
  const seen = new Set<string>([c.translationHe]);
  const out: string[] = [];
  for (const d of c.distractorsHe) {
    const t = d.trim();
    if (t.length === 0 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

export function isEligible(c: ArcadeCandidate, level: CefrBand): boolean {
  if (c.band !== level) return false;
  if (c.translationHe.trim().length === 0) return false;
  return usableDistractors(c).length >= ARCADE_OPTION_COUNT - 1;
}

export function eligibleCandidates(
  candidates: readonly ArcadeCandidate[],
  level: CefrBand,
): ArcadeCandidate[] {
  return candidates.filter((c) => isEligible(c, level));
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: readonly T[], rnd: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    // ⛔ ⛔ לא destructuring swap: `noUncheckedIndexedAccess` מטפס `out[i]` ל-`T | undefined`
    // וההשמה ההדדית אינה מהדרת (נמדד בהרצת `tsc --noEmit`, C-0178).
    const atI = out[i] as T;
    const atJ = out[j] as T;
    out[i] = atJ;
    out[j] = atI;
  }
  return out;
}

export function buildRound(input: {
  readonly level: CefrBand;
  readonly candidates: readonly ArcadeCandidate[];
  readonly seed: number;
  readonly arcadeLevel?: number;
}): ArcadeRound {
  const pool = eligibleCandidates(input.candidates, input.level);
  if (pool.length < ARCADE_MIN_WORDS) {
    return { ok: false, reason: 'level_too_small', eligible: pool.length, required: ARCADE_MIN_WORDS };
  }
  const byRank = pool
    .slice()
    .sort((a, b) => (a.ngslRank ?? Number.MAX_SAFE_INTEGER) - (b.ngslRank ?? Number.MAX_SAFE_INTEGER) || a.wordId.localeCompare(b.wordId));
  const depth = Math.max(0, (input.arcadeLevel ?? 1) - 1);
  const offset = Math.min(depth * ARCADE_ROUND_SIZE, Math.max(0, byRank.length - ARCADE_ROUND_SIZE));
  const window = byRank.slice(offset, offset + Math.max(ARCADE_ROUND_SIZE, ARCADE_MIN_WORDS));
  const rnd = mulberry32(input.seed);
  const picked = shuffle(window, rnd).slice(0, ARCADE_ROUND_SIZE);
  const questions = picked.map((c) => {
    const wrong = shuffle(usableDistractors(c), rnd).slice(0, ARCADE_OPTION_COUNT - 1);
    return {
      wordId: c.wordId,
      headword: c.headword,
      answer: c.translationHe,
      options: shuffle([c.translationHe, ...wrong], rnd),
    };
  });
  return { ok: true, level: input.level, questions };
}
