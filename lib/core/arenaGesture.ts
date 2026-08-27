/**
 * T-178 · `37-arena-spec § 5` — **כלל מקור המחווה.** PURE: ⛔ אפס React, DOM, שעון, env.
 *
 * ⛔ **המודול עונה על שאלה אחת — «איזו מחווה זו הייתה» — ו⛔ לעולם לא על «מה היא עושה».**
 * ההשלכה חיה ב-`lib/core/battle.ts`, במקום שבו השעון כבר חי. ⛔ שני מודולים שמכריעים
 * מה קורה בקרב הם בדיוק אותה סטייה, בשני מקומות.
 *
 * ⚠️ **למה הכלל הוא קוד ו⛔ לא הערה:** שורת T-178 מנסחת את תרחיש הכשל שהוא סוגר —
 * «בלי כלל מקור המחווה, גרירה אלכסונית מזיזה את הדמות **וגם** משגרת לחש, והלומד לא
 * מבין מה קרה». ⇒ **ענף אחד, ⛔ ולא שניים:** מחווה שהתחילה על קלף ⛔ אינה יכולה להזיז
 * דמות, ומחווה שהתחילה על הזירה ⛔ אינה יכולה להטיל.
 *
 * ⚠️ **שני המספרים המיובאים ⛔ אינם מועתקים** מ-`swipeGrade.ts`: הקובץ ההוא כותב
 * במפורש שהם **נמדדו** (רצועת ה-back-swipe של iOS · הסף שמפריד מחווה מגלילה מעט
 * אלכסונית) ⛔ ולא נבחרו. עותק שני שלהם הוא מספר שיסטה.
 */
import { SWIPE_EDGE_PX, SWIPE_MAX_ANGLE_DEG } from './swipeGrade';

export type GestureSource = 'card' | 'stage';

/**
 * `37 § 5` — «סף **60px** כלפי מעלה». ⚠️ `§ 6` ⛔ אינו נותן מספר לגלגול הצדדי, ולכן
 * הזירה נושאת **מרחק אחד** ⛔ ולא שניים: מספר שני שהומצא כאן הוא כלל שני לתחזק.
 * ⛔ החלטה הפיכה (`RULES § 0.16`) — קומיט אחד מפריד אותם אם המדידה תדרוש.
 */
export const GESTURE_THRESHOLD_PX = 60;

/** `spell_card` ברנדר: `py = (y - pad - lift*14)` ⇒ הקלף עולה **14px** בהרמה מלאה. */
export const CARD_LIFT_MAX_PX = 14;

export interface GestureInput {
  readonly source: GestureSource;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly viewportWidth: number;
}

export type ArenaGesture =
  | { readonly kind: 'cast' }
  | { readonly kind: 'move'; readonly dx: number }
  | null;

const MAX_ANGLE_RAD = (SWIPE_MAX_ANGLE_DEG * Math.PI) / 180;

export function resolveGesture(input: GestureInput): ArenaGesture {
  const { source, startX, startY, endX, endY, viewportWidth } = input;

  // ⛔ אותו נימוק של `resolveSwipe`: מספר שאינו סופי מחזיר false בשקט בכל השוואה,
  // וההשתקה הזאת היא בדיוק איך שמחווה מומצאת נכנסת.
  for (const value of [startX, startY, endX, endY, viewportWidth]) {
    if (!Number.isFinite(value)) return null;
  }

  const dx = endX - startX;
  const dy = endY - startY;

  if (source === 'card') {
    // «מעלה בלבד» — ⛔ ולא «אנכית»: מטה הוא ⛔ לא מחווה איטית, הוא מחווה אחרת.
    if (dy >= 0) return null;
    if (Math.abs(dy) < GESTURE_THRESHOLD_PX) return null;
    // הסטייה נמדדת **מהאנך** כאן, ⛔ ולא מהאופק: זהו הציר שהמחווה נעה עליו.
    if (Math.atan2(Math.abs(dx), Math.abs(dy)) > MAX_ANGLE_RAD) return null;
    return { kind: 'cast' };
  }

  // D-042ⓐ — רצועת הקצה, על נקודת ההתחלה בלבד: החלקה שמסתיימת בקצה היא מחווה תקינה
  // שחצתה את המסך, וזו שהדפדפן חוטף היא זו שמתחילה שם.
  if (startX <= SWIPE_EDGE_PX) return null;
  if (startX >= viewportWidth - SWIPE_EDGE_PX) return null;
  if (Math.abs(dx) < GESTURE_THRESHOLD_PX) return null;
  if (Math.atan2(Math.abs(dy), Math.abs(dx)) > MAX_ANGLE_RAD) return null;
  // ⛔ הסימן **נישא** ו⛔ אינו מפורש: `§ 5` אומר «לצדדים», ו-`§ 6` אומר «לצד» —
  // ⛔ אף אחד מהם ⛔ אינו מייחד ימין או שמאל, ופירוש שהומצא כאן הוא מכניקה מומצאת.
  return { kind: 'move', dx };
}

export interface CardLift {
  readonly y: number;
  readonly lift: number;
  readonly settleMs: number;
}

/**
 * ⚠️ **תקרת שמונת הפיקסלים של חוקה § 5 ⛔ אינה חלה כאן, מאותו נימוק בדיוק שנרשם
 * ב-`swipeGrade.dragOffset`:** § 5 חלה על **השחרור** — אנימציה שהמוצר מנגן. גרירה היא
 * **מניפולציה ישירה**: היא האצבע. ⇒ `settleMs: 0` בזמן הגרירה, וההשתקעות שייכת לשחרור.
 */
export function cardLift(input: {
  readonly startY: number;
  readonly currentY: number;
  readonly reducedMotion: boolean;
}): CardLift {
  // ⛔ ההעדפה נבדקת **ראשונה** ומחזירה אפס תנועה, ⛔ ולא מספר קטן יותר: שכבה א׳ א7
  // דורשת שהתנועה **תיפסק**. המחווה עצמה עדיין מוכרעת ב-`resolveGesture`, ⇒ לומד
  // שכיבה תנועה עדיין מטיל בגרירה.
  if (input.reducedMotion) return { y: 0, lift: 0, settleMs: 0 };
  const delta = input.currentY - input.startY;
  if (!Number.isFinite(delta)) return { y: 0, lift: 0, settleMs: 0 };
  if (delta >= 0) return { y: 0, lift: 0, settleMs: 0 };
  const travel = Math.min(Math.abs(delta), GESTURE_THRESHOLD_PX);
  return { y: -travel, lift: travel / GESTURE_THRESHOLD_PX, settleMs: 0 };
}
