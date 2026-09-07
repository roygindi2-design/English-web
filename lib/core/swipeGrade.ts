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
/**
 * משך ההשתקעות של **השחרור**, ⛔ ולא של הגרירה — חוקה § 5 («150–300ms, easing אחד»).
 * ⛔ ערך אחד לשני הכיוונים: יציאה מעל הסף וחזרה למקום מתחתיו הן אותה תנועה בשני יעדים,
 * ושני משכים היו שני easing בפועל.
 */
export const SWIPE_FEEDBACK_MAX_MS = 200;

/**
 * T-157 · D-090ⓑ — **הכרטיס נצמד לאצבע.**
 *
 * ⚠️ **תקרת שמונת הפיקסלים פרשה כאן, וזה ⛔ אינו ריכוך של חוקה § 5.** § 5 חלה על
 * **השחרור** — אנימציה מתוזמנת. גרירה היא **מניפולציה ישירה**: היא ⛔ אינה תנועה שהמוצר
 * מנגן, היא האצבע. תקרה של 8 פיקסלים על מעקב אחרי אצבע ⛔ אינה «פחות תנועה» — היא משוב
 * שהלומד ⛔ אינו מרגיש בכלל.
 *
 * ⚠️ **ועקרון הקוהרנטיות של Mayer (T-041) ⛔ אינו חל כאן:** הוא אוסר **קישוט שמתחרה
 * בתוכן**, וכרטיס שעוקב אחרי האצבע הוא **המשוב על המחווה עצמה**.
 *
 * ⛔ **שלושת הספים למעלה ⛔ אינם זזים** — הם **נמדדו** (רצועת ה-back-swipe של iOS · הסף
 * שמפריד מחווה מגלילה מעט אלכסונית), ⛔ ולא נבחרו בטעם.
 */
export type DragOffset = { readonly x: number; readonly settleMs: number };

export function dragOffset(input: {
  readonly startX: number;
  readonly currentX: number;
  readonly reducedMotion: boolean;
  /** T-259 · `apple-design` § 3 — the card's presentation offset at `pointerdown`, when the
   *  finger grabs it MID-FLIGHT. Default 0: a grab at rest is the old behaviour exactly. */
  readonly baseX?: number;
}): DragOffset {
  // ⛔ `prefers-reduced-motion` נבדק **ראשון** ומחזיר **אפס תנועה**, ⛔ ולא מספר קטן
  // יותר: חוקה שכבה A דורשת שהתנועה **תיפסק**. המחווה עצמה עדיין מוכרעת ב-`resolveSwipe`,
  // ⇒ לומד שכיבה תנועה עדיין מדרג בהחלקה.
  if (input.reducedMotion) return { x: 0, settleMs: 0 };
  const base = input.baseX ?? 0;
  const delta = input.currentX - input.startX + base;
  // אותו כלל של `resolveSwipe`: מספר שאינו סופי ⛔ אינו «אפס» ו⛔ אינו «הרבה».
  if (!Number.isFinite(delta)) return { x: 0, settleMs: 0 };
  // ⛔ `settleMs: 0` **בזמן הגרירה** — 1:1 הוא מניפולציה ישירה ⛔ ולא אנימציה, וכל
  // `transition` כאן היה מכניס פיגור בין האצבע לכרטיס. ההשתקעות שייכת ל**שחרור**, והמשך
  // שלה הוא `SWIPE_FEEDBACK_MAX_MS` — ⛔ קבוע אחד, ⛔ ולא שני שמות לאותו מספר.
  return { x: delta, settleMs: 0 };
}

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

/**
 * T-259 · 36 § 14.4 — the exit pose is the RENDER, quoted, ⛔ not designed:
 *   `render_video_A.py:424`  dx  = p * (LW + 120)        ⇒ the card leaves the viewport by 120px
 *   `render_video_A.py:425`  rot = -p * 15               ⇒ −15° at full travel, rightward
 *   `render_video_A.py:364`  y   = CARD_Y + abs(dx) * .06 ⇒ it drops 6% of its travel
 * A leftward swipe is the mirror. `p` is the fraction of the travel, so the pose during the
 * DRAG is the same function of `x` — the finger draws the same curve the spring finishes.
 */
export const SWIPE_EXIT_OVERSHOOT_PX = 120;
export const SWIPE_EXIT_ROTATE_DEG = 15;
export const SWIPE_EXIT_DROP_RATIO = 0.06;

export function swipeExitX(grade: CardGrade, viewportWidth: number): number {
  const travel = viewportWidth + SWIPE_EXIT_OVERSHOOT_PX;
  return grade === 'good' ? travel : -travel;
}

export interface SwipePose {
  readonly x: number;
  readonly y: number;
  readonly rotateDeg: number;
}

const REST_POSE: SwipePose = { x: 0, y: 0, rotateDeg: 0 };

export function swipePose(x: number, viewportWidth: number): SwipePose {
  if (!Number.isFinite(x) || !Number.isFinite(viewportWidth) || x === 0) return REST_POSE;
  const travel = viewportWidth + SWIPE_EXIT_OVERSHOOT_PX;
  if (!(travel > 0)) return REST_POSE;
  const p = x / travel;
  return { x, y: Math.abs(x) * SWIPE_EXIT_DROP_RATIO, rotateDeg: -SWIPE_EXIT_ROTATE_DEG * p };
}

export function swipeTransform(pose: SwipePose): string {
  if (pose.x === 0 && pose.y === 0 && pose.rotateDeg === 0) return '';
  return `translateX(${pose.x}px) translateY(${pose.y}px) rotate(${pose.rotateDeg}deg)`;
}
