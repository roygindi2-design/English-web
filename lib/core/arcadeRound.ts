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
  /**
   * ⛔ **אנגלית, ו⛔ לעולם אינה מוצגת ללומד** (T-152 · D-087). היא נטענת מ-`sense_distractors`,
   * ולכן השם ⛔ אינו יכול להיות `distractorsHe` — השם הישן שיקר, ותחתיו הזירה הגישה תרגום
   * עברי אחד מול שלוש מילים באנגלית, כלומר תשובה נכונה בלי לדעת ולו מילה.
   * ⚠️ השדה נשאר בטיפוס **כדי שבדיקה תוכיח שהוא ⛔ אינו מגיע ל-`options`** — ⛔ אין לו קורא
   * ב-`buildRound`, ו-`arcadeRound.test.ts` סורק את המקור ונופל בשם אם יחזור.
   */
  readonly distractorsEn: readonly string[];
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

/**
 * 🔴 T-152 · D-087 — **מאגר המסיחים של הרמה.** התרגומים העבריים של המועמדים הכשירים,
 * ⛔ בלי כפילות ו⛔ בלי ריקים, בסדר הקלט (⇒ ניתן לשחזור מה-seed בלבד).
 * ⚠️ זהו **המקור היחיד** לשלוש האפשרויות השגויות. ⛔ אין מקור אנגלי, ⛔ אין ייצור בזמן אמת.
 */
function levelTranslations(pool: readonly ArcadeCandidate[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of pool) {
    const t = c.translationHe.trim();
    if (t.length === 0 || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * ⚠️ **הכשירות ⛔ אינה נשענת עוד על מסיחי המילה עצמה** (T-152): הם אנגלית, ⛔ אינם מוצגים,
 * ולכן «מילה בלי שלושה מסיחים» ⛔ אינה עוד סיבה לדלג. מה שנשאר הוא מה שהשאלה באמת דורשת —
 * הרמה הנכונה ותשובה נכונה. המחסור באפשרויות נמדד **ברמה** (ⓒ ב-`buildRound`), ⛔ ולא במילה.
 */
export function isEligible(c: ArcadeCandidate, level: CefrBand): boolean {
  if (c.band !== level) return false;
  return c.translationHe.trim().length > 0;
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
  // ⛔ המסיחים נמשכים מ**כל הרמה** ⛔ ולא מהחלון: החלון הוא פרוסת התדירות של הקרב,
  // וצמצום המסיחים אליו היה מקטין את המאגר בלי סיבה לימודית.
  const translations = levelTranslations(pool);
  const picked = shuffle(window, rnd).slice(0, ARCADE_ROUND_SIZE);
  const questions: ArcadeQuestion[] = [];
  for (const c of picked) {
    const answer = c.translationHe.trim();
    // ⛔ המסיח ⛔ אינו זהה לתשובה (ⓑ), והרשימה כבר ייחודית ⇒ ⛔ אינו חוזר פעמיים.
    const wrong = shuffle(translations.filter((t) => t !== answer), rnd).slice(0, ARCADE_OPTION_COUNT - 1);
    // ⓒ ⛔ **אין נפילה חזרה לאנגלית.** אין ברמה מספיק תרגומים שונים ⇒ השאלה יורדת
    // מהסיבוב, והסיבוב החסר מדווח `level_too_small` — בדיוק כמו רמה קטנה מדי.
    if (wrong.length < ARCADE_OPTION_COUNT - 1) continue;
    questions.push({
      wordId: c.wordId,
      headword: c.headword,
      answer,
      options: shuffle([answer, ...wrong], rnd),
    });
  }
  if (questions.length < ARCADE_ROUND_SIZE) {
    // ⛔ `eligible` הוא מה שהרמה באמת יכולה להגיש — שאלה בלי ארבע אפשרויות עבריות
    // ⛔ אינה פריט קרב, גם אם המילה עצמה כשירה.
    return { ok: false, reason: 'level_too_small', eligible: questions.length, required: ARCADE_MIN_WORDS };
  }
  return { ok: true, band: rung.band, gameLevel: rung.level, questions };
}
