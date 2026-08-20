/**
 * PURE. ⛔ No React, no DOM, no clock, no env, no I/O.
 *
 * T-125 · D-066 — המשפט שהלומד קורא כשלשונית «העולם» נעולה.
 *
 * ⚠️ הלשונית נעולה על **שני** תנאים (`isWorldUnlocked`), והמשפט סיפר על אחד.
 * במאגר ריק הלומד ראה יעד של 12 מילים פעילות שלעולם לא היה פותח את הלשונית,
 * כי התנאי החוסם ⛔ אינו בשליטתו ו⛔ לא הוצג לו.
 *
 * ⛔ הספים ⛔ אינם כאן. הם מגיעים כארגומנט, מאותה סיבה בדיוק ש-`isWorldUnlocked`
 * מקבל אותם: קבוע שמיוצא מהשכבה הטהורה מצוטט אחר כך כאילו היא גזרה אותו,
 * ו-D-031 קובע שאלה מספרי מוצר ⛔ ולא מספרים פדגוגיים.
 */

import type { WorldThresholds } from './world';

export interface WorldGateCounts {
  /** ⛔ `null` הוא «לא ידוע» ⛔ ואינו `0`. */
  readonly functionWords: number | null;
  readonly activeWords: number | null;
}

/**
 * ⚠️ **סטייה מוצהרת מנוסח התוכנית, ⛔ ולא הכרעת סגנון.** התוכנית מכתיבה
 * `interface WorldGateThresholds { minFunctionWords; minActiveWords }` — שדה
 * בשדה, אותו מבנה בדיוק של `WorldThresholds` ב-`./world`. שני הצרכנים מקבלים
 * את **אותו אובייקט** מ-`app/api/world/status/route.ts`: `isWorldUnlocked`
 * מחליט אם לפתוח, והמשפט כאן מספר על מה. הצהרה שנייה הייתה מתירה לשני
 * החוזים להיפרד בשקט בעוד המקור אחד — בדיוק הכפילות שהכרעה 3 של התוכנית
 * אוסרת על `12` בתוך `TabBar`. השם שהתוכנית מייצאת נשמר כשם נרדף.
 */
export type WorldGateThresholds = WorldThresholds;

/** ⛔ כשהמאגר טרם מוכן ⛔ אין מספר במשפט: היעד אינו בשליטת הלומד. */
const BANK_NOT_READY_HE = 'המאגר עדיין נבנה. העולם ייפתח כשהוא יהיה מוכן.';

export function worldGateSentenceHe(
  counts: WorldGateCounts,
  thresholds: WorldGateThresholds,
): string {
  // ⛔ `null` ⇒ ⛔ לא «לא מוכן». ספירה שלא הגיעה אינה עדות לכך שהמאגר חסר,
  // וטענה כזאת היא עובדה שאיש לא מדד — אותו כלל של «—» מול `0`.
  if (counts.functionWords !== null && counts.functionWords < thresholds.minFunctionWords) {
    return BANK_NOT_READY_HE;
  }
  const base = `העולם ייפתח כשיהיו לך ${thresholds.minActiveWords} מילים פעילות.`;
  return counts.activeWords === null ? base : `${base} יש לך ${counts.activeWords}.`;
}
