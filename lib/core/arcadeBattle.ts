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
import type { ArcadeAnswer } from './arcadeResult';
import type { ArcadeQuestion } from './arcadeRound';

/**
 * ⚠️ **המקור של המספר, ⛔ ולא ניחוש:** `docs/api-contract.md` מקבע 5 בדוגמת הבקשה של
 * `POST /api/arcade/result`, ו-`lib/core/arcadeResult.test.ts` מריץ את כל מקרי הניצחון
 * וההפסד שלו מול `enemyHp: 5`. `ARCADE_ROUND_SIZE` הוא 8 ⇒ לומד עם 5 נכונות מתוך 8 מנצח.
 * ⛔ קבוע, ⛔ אינו נגזר מהלומד ו⛔ אינו עולה עם הרמה — «קושי שגדל» הוא החלטת PM,
 * ⛔ לא ברירת מחדל של Dev (F-066, נפתחה בטיק התכנון C-0183).
 */
export const ARCADE_ENEMY_HP = 5;

export interface BattleState {
  readonly questions: readonly ArcadeQuestion[];
  readonly index: number;
  readonly enemyHp: number;
  readonly answers: readonly ArcadeAnswer[];
  readonly chosen: string | null;
}

export function startBattle(questions: readonly ArcadeQuestion[]): BattleState {
  return { questions, index: 0, enemyHp: ARCADE_ENEMY_HP, answers: [], chosen: null };
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

export function advance(state: BattleState): BattleState {
  if (state.chosen === null) return state;
  return { ...state, index: state.index + 1, chosen: null };
}

export function isFinished(state: BattleState): boolean {
  return state.enemyHp === 0 || state.index >= state.questions.length;
}

export function enemyDefeated(state: BattleState): boolean {
  return state.enemyHp === 0;
}
