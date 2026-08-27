/**
 * T-176 · `37-arena-spec § 3–5` — **חוקי הקרב.** טהור: ⛔ אפס React, DOM, רשת ו-env.
 *
 * ⚠️ זהו **המקום היחיד** שיודע מה קורה בקרב. `<ArenaBattle>` מצייר ו⛔ אינו מחשב —
 * רכיב שמוריד חיים בעצמו הוא עותק שני של החוק, והשני תמיד סוטה. הקובץ מחליף את
 * `lib/core/arcadeBattle.ts`, שנמחק **באותו קומיט** ⛔ ולא «אחר כך»: שני חוקי קרב
 * שחיים יחד ולו קומיט אחד הם בדיוק אותה סטייה, בשני מקומות.
 *
 * ⛔ **⛔ אין כאן `setTimeout` · `setInterval` · `Date.now` · `requestAnimationFrame`**
 * (D-126 § ג׳). ‏`elapsedMs` הוא **קלט** בכל קריאה, ולולאת ה-`requestAnimationFrame`
 * היחידה חיה במסך. שלוש סיבות, וכולן מדידות:
 *   1. **בדיקת השומר שורדת במקום להימחק** — האיסור משנה משמעות («⛔ אין שעון נסתר»)
 *      ⛔ ולא נמחק. מחיקת שומר בלי שהוא מוחלף היא מה שהפיל את `T-164`.
 *   2. **90 שניות נבדקות ב-0 שניות** — טיימר אמיתי היה מוסיף 90 שניות לכל `npm run verify`.
 *   3. **`prefers-reduced-motion` נשאר עניין של המסך בלבד** (חוקה שכבה א׳ · א7) ⇒ לומד
 *      שכיבה תנועה מקבל **אותו קרב בדיוק**.
 *
 * ⛔ **אינווריאנט `37 § 13.1`:** הזירה ⛔ אינה כותבת ל-`word_progress` ו⛔ אינה מזיזה
 * SM-2. אף פעם. ⛔ הערה אינה אכיפה — `battle.test.ts` סורק את המקור.
 *
 * ✅ **ניקוד בזירה מותר** (`36 § 2` שורה 7 הגבילה את D-050 ל«מחוץ לזירה»), ולכן האיסור
 * `xp|score|points|coin` של `arcadeBattle.test.ts:100-102` ⛔ **אינו** עובר לכאן.
 */
import type { ArenaWord } from './arenaWords';

/** `37 § 3` — **שעון אחד לקרב שלם**, ⛔ ולא טיימר לשאלה. */
export const BATTLE_MS = 90_000;
/** `37 § 3` — 20 השניות האחרונות הן `זמן זעם`: מאנה כפולה. */
export const RAGE_FROM_MS = 70_000;
/** `37 § 3` — היריב מתקיף **בקצב עצמאי**, ⛔ ללא תלות בקצב התשובות. */
export const ENEMY_SWING_MS = 8_000;
/** `37 § 4` — מאנה 1 ל-2 שניות. */
export const MANA_MS = 2_000;
/** `37 § 4` — תקרה 10. */
export const MANA_CAP = 10;
/** `37 § 5` — מתחת ל-1.5 שניות: קריטי. */
export const CRITICAL_MS = 1_500;

/** ⛔ מכה אחת = חיים אחד. הפער בין מכה למכה נוצר מ-`§ 5` («המכה הבאה חזקה יותר») ⛔ ולא מהבסיס. */
const SWING_DAMAGE = 1;
/** `37 § 5` — «שגויה: הלחש מתפוגג, **המכה הבאה של היריב חזקה יותר**». */
const SWING_PENALTY = 1;
const HIT_DAMAGE = 1;
const CRITICAL_DAMAGE = 2;

/**
 * ⛔ **ארבעה מוצאים, ⛔ ולא שלושה** (D-126 § ד׳). ההערה ב-`arcadeBattle.ts:24` («⛔ שני
 * מוצאים … «הפסד» אינו מצב») **בוטלה**: `37 § 3` קובע «בתום השעון מנצח אחוז החיים
 * הגבוה» ⇒ הפסד **הוא** מצב.
 * ⛔ **והמילה «הפסדת» ⛔ אינה מופיעה על המסך אף פעם** — `37 § 9` ח4 קובע מסגור
 * «היית 2 מילים מהבוס». ⇒ **המצב קיים, הנוסח ⛔ לא.**
 */
export type BattleOutcome = 'running' | 'victory' | 'survived' | 'outlasted';

export interface BattleCast {
  readonly wordId: string;
  readonly correct: boolean;
  readonly responseMs: number;
  readonly critical: boolean;
}

export interface BattleState {
  readonly words: readonly ArenaWord[];
  readonly index: number;
  readonly learnerHp: number;
  readonly learnerHpMax: number;
  readonly enemyHp: number;
  readonly enemyHpMax: number;
  /**
   * ⚠️ **סטייה מדודה משם השדה בתוכנית (§ 5), ⛔ ולא מהחתימה.** התוכנית קראה לו `mana`,
   * ו-`manaAt(elapsed, spent)` מקבלת **מה שהוצא** ⛔ ולא את המפלס. שדה בשם `mana`
   * שנושא את ההוצאה הוא שם משקר, ו⛔ הריפו הזה כבר שילם על אחד כזה
   * (`ArcadeCandidate.distractorsEn`). המפלס נגזר תמיד מ-`manaAt`, ⇒ מקום אחד.
   */
  readonly manaSpent: number;
  /** מתי המילה הנוכחית עלתה למסך — הבסיס ל`§ 5` («הנזק נגזר ממהירות התשובה»). */
  readonly shownAtMs: number;
  /** ה-`elapsedMs` של המכה האחרונה שכבר יושמה. ⛔ הקצב עצמאי, ולכן הוא נמדד מהשעון. */
  readonly lastSwingMs: number;
  /** `§ 5` — אחרי תשובה שגויה, המכה הבאה **בלבד** חזקה יותר. */
  readonly pendingPenalty: number;
  readonly casts: readonly BattleCast[];
}

export function startBattle(
  words: readonly ArenaWord[],
  learnerHpMax: number,
  enemyHpMax: number,
): BattleState {
  return {
    words,
    index: 0,
    learnerHp: learnerHpMax,
    learnerHpMax,
    enemyHp: enemyHpMax,
    enemyHpMax,
    manaSpent: 0,
    shownAtMs: 0,
    lastSwingMs: 0,
    pendingPenalty: 0,
    casts: [],
  };
}

/**
 * `37 § 4` — 1 ל-2 שניות, תקרה 10, ו**כפול ב`זמן זעם`**.
 * ⛔ **מענה ⛔ אינו מעלה מאנה אף פעם** — הלמידה ⛔ אינה נחסמת מאחורי משאב, ולכן
 * הפונקציה תלויה בשעון ובהוצאה בלבד ו⛔ אינה מכירה תשובות.
 */
export function manaAt(elapsedMs: number, spent: number): number {
  const calm = Math.min(Math.max(0, elapsedMs), RAGE_FROM_MS);
  const raging = Math.max(0, elapsedMs - RAGE_FROM_MS);
  const earned = Math.floor(calm / MANA_MS) + Math.floor(raging / MANA_MS) * 2;
  return Math.max(0, Math.min(MANA_CAP, earned - spent));
}

export function isRage(elapsedMs: number): boolean {
  return elapsedMs >= RAGE_FROM_MS;
}

/**
 * `37 § 3` — «בתום השעון מנצח **אחוז** החיים הגבוה». ⛔ אחוז ⛔ ולא מספר: שני הצדדים
 * ⛔ אינם חולקים סולם, ולכן השוואת מספרים גולמיים הייתה מכריעה לפי גודל פס.
 */
export function outcomeAt(state: BattleState, elapsedMs: number): BattleOutcome {
  if (state.enemyHp <= 0) return 'victory';
  if (state.learnerHp <= 0) return 'survived';
  if (elapsedMs < BATTLE_MS) return 'running';
  const learnerShare = state.learnerHp / Math.max(1, state.learnerHpMax);
  const enemyShare = state.enemyHp / Math.max(1, state.enemyHpMax);
  return learnerShare > enemyShare ? 'outlasted' : 'survived';
}

/**
 * `37 § 5` — הטלת לחש. **הנזק נגזר ממהירות התשובה**, ומתחת ל-1.5 שניות הוא קריטי.
 * ⛔ **ואין מצב כישלון על איטיות:** נכונה איטית עדיין פוגעת, רק פחות.
 * שגויה ⇒ הלחש מתפוגג (⛔ אפס נזק) והמכה הבאה של היריב חזקה יותר.
 */
export function cast(state: BattleState, chosen: string, elapsedMs: number): BattleState {
  const word = state.words[state.index];
  if (word === undefined) return state;

  const responseMs = Math.max(0, elapsedMs - state.shownAtMs);
  const correct = chosen === word.translationHe;
  const critical = correct && responseMs < CRITICAL_MS;
  const damage = correct ? (critical ? CRITICAL_DAMAGE : HIT_DAMAGE) : 0;

  return {
    ...state,
    index: state.index + 1,
    // ⛔ `Math.max(0, …)` — חיים שליליים הם מצב שאין לו ציור.
    enemyHp: Math.max(0, state.enemyHp - damage),
    shownAtMs: elapsedMs,
    pendingPenalty: correct ? 0 : SWING_PENALTY,
    casts: [...state.casts, { wordId: word.wordId, correct, responseMs, critical }],
  };
}

/**
 * `37 § 3` — קצב היריב. ⛔ **הפונקציה אידמפוטנטית ביחס לשעון**: `lastSwingMs` נושא את
 * המכה האחרונה שיושמה, ולכן קריאה שנייה על אותו `elapsedMs` ⛔ אינה מכה פעמיים.
 * זו הסיבה שהיא בטוחה בתוך לולאת `requestAnimationFrame` שרצה 60 פעמים בשנייה.
 */
export function tick(state: BattleState, elapsedMs: number): BattleState {
  const due = Math.floor(Math.max(0, elapsedMs) / ENEMY_SWING_MS);
  const applied = Math.floor(Math.max(0, state.lastSwingMs) / ENEMY_SWING_MS);
  const swings = due - applied;
  if (swings <= 0) return { ...state, lastSwingMs: Math.max(state.lastSwingMs, elapsedMs) };

  // ⛔ העונש חל על **המכה הבאה בלבד** (`§ 5`), ולכן הוא נצרך פעם אחת ⛔ ולא לכל מכה בקבוצה.
  const damage = swings * SWING_DAMAGE + state.pendingPenalty;
  return {
    ...state,
    learnerHp: state.learnerHp - damage,
    lastSwingMs: elapsedMs,
    pendingPenalty: 0,
  };
}
