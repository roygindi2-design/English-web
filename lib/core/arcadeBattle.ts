/**
 * § 4.2י — חוקי הקרב עצמו. טהור: ⛔ אפס React, DOM, רשת ו-env.
 *
 * ⚠️ זהו **המקום היחיד** שיודע מה קורה כשלומד מקיש על אפשרות. `<ArenaBoard>` מצייר
 * ו⛔ אינו מחשב — רכיב שמוריד חיים בעצמו הוא עותק שני של החוק, והשני תמיד סוטה.
 *
 * ⛔ **אין כאן זמן.** אין `setTimeout`, אין `deadline` ואין «נגמר הזמן» (D-045 · R-020):
 * סיבוב **ממתין** ללומד. לחץ זמן שמור לרצועת השטף על מילים ידועות בלבד (T-103).
 *
 * ⛔ **אין כאן ניקוד** (D-050 — ניקוד g=0.340 מול בלי ניקוד g=0.840, p=0.013), ו⛔ אין
 * כאן חיים ללומד: תשובה שגויה ⛔ אינה מורידה דבר ⛔ ואינה מסיימת דבר.
 */
import { ARCADE_ENEMY_HP, requiredHits } from './arcadeLadder';
import type { ArcadeAnswer } from './arcadeResult';
import type { ArcadeQuestion } from './arcadeRound';

/**
 * ⛔ הקבוע חי ב-`arcadeLadder` (D-059) — זהו ייצוא מחדש לתאימות של `components/ArenaBoard.tsx`.
 * ⛔ שני מקומות למספר אחד הם עותק שני של החוק, והשני תמיד סוטה.
 */
export { ARCADE_ENEMY_HP };

/** ⛔ שני מוצאים, ⛔ ואין שלישי. «הפסד» אינו מצב במוצר הזה. */
export type BattleOutcome = 'running' | 'victory' | 'survived';

/** ⛔ שלוש תנוחות, ⛔ ואין רביעית. «הפסד» אינו מצב במוצר הזה (D-059). */
export type StagePhase = 'idle' | 'hit' | 'dodge';

export interface BattleState {
  readonly questions: readonly ArcadeQuestion[];
  readonly index: number;
  readonly enemyHp: number;
  /** ⛔ המקסימום נשמר, כי הוא נגזר: המסך מצייר «M מתוך N» ו⛔ אינו רשאי לגזור שוב. */
  readonly enemyHpMax: number;
  readonly answers: readonly ArcadeAnswer[];
  readonly chosen: string | null;
}

export function startBattle(questions: readonly ArcadeQuestion[]): BattleState {
  // ⛔ הנגזרת ⛔ ולא הקבוע (D-067ⓑ): סיבוב קצר מהתחמושת חייב יריב חלש יותר,
  // אחרת הוא קרב שאי-אפשר לנצח בו. ⛔ והמקסימום נשמר, כי המסך מצייר «M מתוך N».
  const hp = requiredHits(questions.length);
  return { questions, index: 0, enemyHp: hp, enemyHpMax: hp, answers: [], chosen: null };
}

export function chooseOption(state: BattleState, option: string): BattleState {
  // ⛔ אידמפוטנטית, ומחזירה את **אותה הפניה**: הקשה כפולה על מסך מגע היא אירוע אחד,
  // ומצב חדש שווה-ערך היה מרנדר מחדש ומהבהב את החשיפה.
  if (state.chosen !== null) return state;
  const question = state.questions[state.index];
  if (question === undefined) return state;

  const correct = option === question.answer;
  return {
    ...state,
    // ⛔ `Math.max` ולא חיסור חופשי: חיים שליליים הם מצב שאין לו ציור.
    enemyHp: correct ? Math.max(0, state.enemyHp - 1) : state.enemyHp,
    answers: [
      ...state.answers,
      { wordId: question.wordId, correct, chosen: option, answer: question.answer },
    ],
    chosen: option,
  };
}

/**
 * D-070 — כמה קליעים נשארו. ⛔ הקליע נשרף ב-`chooseOption` ⛔ ולא ב-`advance`:
 * הלומד רואה את המחיר של הבחירה **בזמן שהוא רואה את התשובה**, ⛔ ולא אחריה.
 * ⛔ `Math.max(0, …)` — תחמושת שלילית היא מצב שאין לו ציור.
 */
export function ammoLeft(state: BattleState): number {
  const spent = state.index + (state.chosen === null ? 0 : 1);
  return Math.max(0, state.questions.length - spent);
}

export function advance(state: BattleState): BattleState {
  if (state.chosen === null) return state;
  return { ...state, index: state.index + 1, chosen: null };
}

/**
 * D-060 — מה הבמה מציירת. ⛔ הרכיב ⛔ אינו מחשב את זה בעצמו: תנוחה שנגזרת בשני
 * מקומות סוטה בשלישי. ⛔ שגיאה היא **התחמקות שמצליחה תמיד** ⛔ ולא פגיעה בלומד.
 */
export function stagePhase(state: BattleState): StagePhase {
  if (state.chosen === null) return 'idle';
  const last = state.answers[state.answers.length - 1];
  if (last === undefined) return 'idle';
  return last.correct ? 'hit' : 'dodge';
}

export function isFinished(state: BattleState): boolean {
  return state.enemyHp === 0 || state.index >= state.questions.length;
}

export function enemyDefeated(state: BattleState): boolean {
  return state.enemyHp === 0;
}

/**
 * ⛔ שני מוצאים בלבד: «ניצחון» או «היריב שרד» (D-059).
 * ⛔ תשובה שגויה אינה מסיימת דבר ואינה מרפאת דבר — היא קליע שבוזבז.
 */
export function battleOutcome(state: BattleState): BattleOutcome {
  if (state.enemyHp === 0) return 'victory';
  if (state.index >= state.questions.length) return 'survived';
  return 'running';
}
