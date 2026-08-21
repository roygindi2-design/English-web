/**
 * PURE. No React, no DOM, no clock, no env, no I/O.
 *
 * T-099 · D-042 — «החלקה אופקית היא **קיצור**, ⛔ ולעולם לא הערוץ היחיד».
 *
 * למה שלושת הסייגים יושבים כאן ⛔ ולא בתוך מטפל האירועים: כל אחד מהם הוא **מספר
 * שנגזר ממדידה** (רצועת ה-back-swipe של iOS · סף שמפריד מחווה מגלילה מעט אלכסונית),
 * ומספר כזה שקבור בתוך `onPointerUp` נבדק רק בדפדפן ⛔ ואף פעם לא בגבול שלו. כאן
 * הוא נבדק ב-63 וב-64.
 *
 * ⚠️ **הכיוון:** `dx > 0` (ימין פיזי) ⇒ `'good'`, כלשון D-042 ו-T-099. ב-RTL הכפתור
 * «ידעתי» יושב דווקא **משמאל** — הסתירה נמדדה, נרשמה כ-**F-102** והועברה ל-PM.
 * ⛔ אל תהפוך אותה כאן: החלטה חתומה משתנה בהחלטה, ⛔ לא במימוש.
 */
import type { CardGrade } from './flashcard';

export interface SwipeInput {
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly viewportWidth: number;
}

export const SWIPE_EDGE_PX = 20;
export const SWIPE_MIN_DISTANCE_PX = 64;
export const SWIPE_MAX_ANGLE_DEG = 30;
export const SWIPE_FEEDBACK_MAX_PX = 8;
export const SWIPE_FEEDBACK_MAX_MS = 200;

const MAX_ANGLE_RAD = (SWIPE_MAX_ANGLE_DEG * Math.PI) / 180;

export function resolveSwipe(input: SwipeInput): CardGrade | null {
  const { startX, startY, endX, endY, viewportWidth } = input;

  // ⛔ מספר שאינו סופי ⛔ אינו «אפס» ואינו «הרבה»: כל השוואה עליו מחזירה false
  // בשקט, וההשתקה הזאת היא בדיוק איך שמחווה מומצאת נכנסת. נדחה במפורש.
  for (const value of [startX, startY, endX, endY, viewportWidth]) {
    if (!Number.isFinite(value)) return null;
  }

  // D-042ⓐ. הבדיקה היא על נקודת ההתחלה בלבד — ⛔ לא על הסיום: החלקה שמסתיימת
  // בקצה היא מחווה תקינה שחצתה את המסך, וההחלקה שהדפדפן חוטף היא זו שמתחילה שם.
  if (startX <= SWIPE_EDGE_PX) return null;
  if (startX >= viewportWidth - SWIPE_EDGE_PX) return null;

  const dx = endX - startX;
  const dy = endY - startY;

  // D-042ⓑ — המרחק. ⛔ נמדד על הציר האופקי ⛔ ולא כמרחק אוקלידי: גלילה אנכית של
  // 300px עם סטייה של 10px היא גלילה, והמרחק האוקלידי שלה עובר כל סף.
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE_PX) return null;

  // D-042ⓑ — הזווית. `atan2` על הערכים המוחלטים מחזיר את הסטייה מהציר האופקי
  // ברביע הראשון, ולכן הסימטריה בין למעלה/למטה ובין ימין/שמאל היא תכונה של
  // הנוסחה ⛔ ולא ארבעה ענפים שצריך לזכור לתחזק.
  if (Math.atan2(Math.abs(dy), Math.abs(dx)) > MAX_ANGLE_RAD) return null;

  return dx > 0 ? 'good' : 'again';
}
