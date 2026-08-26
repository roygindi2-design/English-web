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
import { ARCADE_AMMO, ARCADE_MIN_WORDS_PER_LEVEL, gameLevelAt } from './arcadeLadder';
import type { CefrBand } from './cefrLevels';
// ⛔ העותקים הפרטיים של mulberry32/shuffle יצאו ל-`./shuffle` ב-C-0321, מילה במילה.
// ⛔ אין כאן שינוי התנהגות: `shuffle.test.ts` מחזיק את התמורות שנמדדו לפני ההעברה.
import { mulberry32, shuffle } from './shuffle';

export const ARCADE_MIN_WORDS = ARCADE_MIN_WORDS_PER_LEVEL;
/** ⛔ שם היסטורי. גודל הסיבוב הוא התחמושת (D-059) — ⛔ אין כאן מספר משלו. */
export const ARCADE_ROUND_SIZE = ARCADE_AMMO;
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
  | {
      readonly ok: true;
      readonly band: CefrBand;
      readonly gameLevel: number;
      readonly questions: readonly ArcadeQuestion[];
    }
  | { readonly ok: false; readonly reason: 'level_too_small'; readonly eligible: number; readonly required: number }
  | { readonly ok: false; readonly reason: 'no_such_level' };

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

export function buildRound(input: {
  readonly gameLevel: number;
  readonly candidates: readonly ArcadeCandidate[];
  readonly seed: number;
}): ArcadeRound {
  // ⛔ הרמה נגזרת מהסולם ⛔ ולא מהלומד (D-052). רמה שאינה בטבלה אינה נופלת ל-A1.
  const rung = gameLevelAt(input.gameLevel);
  if (rung === null) return { ok: false, reason: 'no_such_level' };

  const pool = eligibleCandidates(input.candidates, rung.band);
  if (pool.length < ARCADE_MIN_WORDS) {
    return { ok: false, reason: 'level_too_small', eligible: pool.length, required: ARCADE_MIN_WORDS };
  }
  const byRank = pool
    .slice()
    .sort((a, b) => (a.ngslRank ?? Number.MAX_SAFE_INTEGER) - (b.ngslRank ?? Number.MAX_SAFE_INTEGER) || a.wordId.localeCompare(b.wordId));

  // הפרוסה: הרמה מחולקת ל-`slicesInBand` חלקים שווים לפי תדירות יורדת, והרמה הזאת
  // לוקחת את החלק שלה. ⛔ החלון לעולם אינו קטן מ-`ARCADE_ROUND_SIZE` — פרוסה חשבונית
  // דקה מהתחמושת הייתה מחזירה קרב בן חמש שאלות עם חמש-עשרה תחמושת, כלומר ניצחון
  // שאי-אפשר להשיג (סף הניצחון הוא 10). ⛔ והרצפה היא התחמושת ⛔ ולא `ARCADE_MIN_WORDS`:
  // השער הועלה ל-`ARCADE_AMMO` ב-T-126 (D-067ⓐ) ⇒ החור נסגר בבריכה עצמה, ⛔ ולא כאן.
  const sliceSize = Math.max(ARCADE_ROUND_SIZE, Math.ceil(byRank.length / rung.slicesInBand));
  const offset = Math.min(rung.sliceIndex * sliceSize, Math.max(0, byRank.length - sliceSize));
  const window = byRank.slice(offset, offset + sliceSize);

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
  return { ok: true, band: rung.band, gameLevel: rung.level, questions };
}
