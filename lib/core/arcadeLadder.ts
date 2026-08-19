/**
 * D-059 · D-061 — קבועי הקרב וסולם 12 רמות המשחק. טהור: ⛔ אפס React, DOM, רשת ו-env.
 *
 * ⚠️ זהו **המקום היחיד** שבו שלושת מספרי הקרב וחלוקת הרמות קיימים. R-023 פתוחה,
 * וכשיגיע שכיול מחדש הוא חייב להיות **עריכת שורה בטבלה** ⛔ ולא ציד ב-`if`-ים
 * במסך, בנתיב ובמנוע.
 *
 * ⛔ **הסולם ⛔ אינו קורא את הצד הלימודי** (D-052): הוא מתחיל ב-1 לכל לומד, גם למי
 * שהוא C1 בכרטיסיות, ועולה אך ורק מניצחונות בזירה.
 */
import type { CefrBand } from './cefrLevels';

/** «תחמושת» — מספר השאלות בקרב. קבוע, ⛔ אינו נגזר מהלומד ו⛔ אינו עולה עם הרמה. */
export const ARCADE_AMMO = 15;

/** חיי היריב. ניצחון = להפיל את כולם בתוך התחמושת ⇒ סף דיוק 67%. */
export const ARCADE_ENEMY_HP = 10;

/** ⛔ תיקו אינו מוריד ואינו מאפס את המונה (D-061). */
export const ARCADE_WINS_PER_LEVEL = 3;

export const MAX_GAME_LEVEL = 12;

/** רמה שאין לה כל כך הרבה מילים כשירות מוצגת **נעולה עם המספר** (D-046). */
export const ARCADE_MIN_WORDS_PER_LEVEL = 12;

/**
 * D-060 · `03-for-roy` פריט 39 — תנוחת המתנה חיה היא **לולאה מתמשכת**, וחוקה § 5
 * הקפואה מתירה 150–300ms של **מעבר**. ⛔ סוכן אינו משנה חוקה קפואה ⇒ ברירת המחדל
 * היא «בלי לולאה», וההיפוך הוא **השורה הזאת בלבד**.
 */
export const ARENA_IDLE_LOOP = false;

export interface GameLevel {
  readonly level: number;
  readonly band: CefrBand;
  /** איזו פרוסת תדירות בתוך הרמה, 0 = השכיחה ביותר. */
  readonly sliceIndex: number;
  /** לכמה פרוסות הרמה הזאת מחולקת. */
  readonly slicesInBand: number;
}

/**
 * ⛔ הטבלה, ⛔ ולא נוסחה: «1–4 = A1» אינו חוק מתמטי אלא הכרעה, ונוסחה הייתה
 * הופכת כל שכיול עתידי לשינוי אלגוריתם במקום לשינוי שורה.
 */
export const GAME_LEVELS: readonly GameLevel[] = Object.freeze([
  { level: 1,  band: 'A1', sliceIndex: 0, slicesInBand: 4 },
  { level: 2,  band: 'A1', sliceIndex: 1, slicesInBand: 4 },
  { level: 3,  band: 'A1', sliceIndex: 2, slicesInBand: 4 },
  { level: 4,  band: 'A1', sliceIndex: 3, slicesInBand: 4 },
  { level: 5,  band: 'A2', sliceIndex: 0, slicesInBand: 2 },
  { level: 6,  band: 'A2', sliceIndex: 1, slicesInBand: 2 },
  { level: 7,  band: 'B1', sliceIndex: 0, slicesInBand: 2 },
  { level: 8,  band: 'B1', sliceIndex: 1, slicesInBand: 2 },
  { level: 9,  band: 'B2', sliceIndex: 0, slicesInBand: 2 },
  { level: 10, band: 'B2', sliceIndex: 1, slicesInBand: 2 },
  { level: 11, band: 'C1', sliceIndex: 0, slicesInBand: 1 },
  { level: 12, band: 'C2', sliceIndex: 0, slicesInBand: 1 },
] as const);

export function gameLevelAt(level: number): GameLevel | null {
  if (!Number.isInteger(level)) return null;
  // ⛔ `?? null` ולא `as GameLevel`: `noUncheckedIndexedAccess` מטפס את האינדוקס
  // ל-`GameLevel | undefined`, ו-cast היה מחזיר `undefined` שנראה כמו רמה.
  return GAME_LEVELS[level - 1] ?? null;
}

export function describeLevel(
  level: number,
  eligible: number,
): { readonly unlocked: boolean; readonly required: number; readonly eligible: number } {
  void level;
  return {
    unlocked: eligible >= ARCADE_MIN_WORDS_PER_LEVEL,
    required: ARCADE_MIN_WORDS_PER_LEVEL,
    eligible,
  };
}

/** ⛔ `>=` ולא `===`: תחמושת עודפת אינה מבטלת ניצחון. */
export function isVictory(correct: number): boolean {
  return correct >= ARCADE_ENEMY_HP;
}

export function applyWin(
  before: { readonly level: number; readonly wins: number },
): { readonly level: number; readonly wins: number; readonly leveledUp: boolean } {
  const wins = before.wins + 1;
  if (wins < ARCADE_WINS_PER_LEVEL) return { level: before.level, wins, leveledUp: false };
  // ⛔ המונה מתאפס גם בתקרה: לומד ברמה 12 שממשיך לנצח ⛔ אינו צובר מונה שאין לו יעד.
  if (before.level >= MAX_GAME_LEVEL) return { level: MAX_GAME_LEVEL, wins: 0, leveledUp: false };
  return { level: before.level + 1, wins: 0, leveledUp: true };
}
