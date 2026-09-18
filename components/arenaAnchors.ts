/**
 * 🎯 **⟦18/09 · `C-0717`⟧ עוגן אחד ליריב — למחווה, לרפאים ולהדגמה.**
 *
 * ⛔ **המודול ⛔ אינו ב-`lib/core`** ובכוונה: הוא **קורא DOM**, ו-`check:core` אוסר
 * זאת שם. ⇒ הוא יושב בשכבת הרכיבים, שם המדידה חיה בלאו הכי.
 *
 * 🔬 **הפער שנמדד ב-`C-0717` ב-393×852, ⛔ ולא הוסק מקוד:**
 * ```
 * [data-arena-enemy]          y 170..242   cx 272   ⟵ לוח השם + פס החיים
 * [data-arena-figure=enemy]   y 252..315   cx 197   ⟵ היריב עצמו
 * ```
 * ⇒ שני העוגנים רחוקים **77px אנכית ו-75px אופקית** זה מזה, ו-`launchThrow`
 * ‏(`ArenaBattle.tsx`) ו-`teach` **שניהם כיוונו אל הראשון**. ⛔ **כלומר הקלף עף אל
 * פס החיים, ⛔ ולא אל המפלצת** — ויד הרפאים לימדה את הלומד לגרור לשם.
 *
 * ⚠️ **ולמה זה חשוב עכשיו ⛔ ולא היה חשוב אתמול:** כל עוד הקלף נסע 60px הוא ⛔ לא
 * הגיע לאף אחד מהשניים, ו⛔ אף אחד ⛔ לא יכול היה לראות לאן הוא מכוון. מרגע שהוא
 * נוסע 260px — הכיוון **נראה**, ו«המסלול פנימה והמסלול החוצה חייבים להיות אותו
 * מסלול» מפסיק להיות עיקרון ומתחיל להיות באג.
 *
 * ⛔ **עוגן אחד, ⛔ ולא שלושה שאילתות:** שלוש שאילתות לאותו צומת סוטות בשלישית —
 * בדיוק `F-268` בגרסת DOM.
 */

/** הצומת שהוא **היריב** — הדמות המצוירת, ⛔ ולא הלוח שמעליה. */
export const FOE_SELECTOR = '[data-arena-figure="enemy"]';

/**
 * המלבן של היריב בקואורדינטות חלון, או `null` כשהוא ⛔ אינו במסמך (פיקסטורה,
 * מסך תוצאה, `jsdom` בלי זירה).
 *
 * ⛔ **`0×0` מוחזר כ-`null`:** צומת שנמדד לפני שהריסה צייר אותו ⛔ אינו מיקום —
 * הוא מדידה שטרם קרתה, ומספר שנגזר ממנו הוא מספר מומצא.
 */
export function foeRect(root: ParentNode | null | undefined): DOMRect | null {
  const node = root?.querySelector(FOE_SELECTOR);
  if (!(node instanceof Element)) return null;
  const rect = node.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;
  return rect;
}

/**
 * כמה רחוק קלף שראשו על `cardTop` רשאי לנסוע כלפי מעלה לפני שהוא **נוגע** ביריב.
 *
 * ⛔ **רגליו של היריב (`rect.bottom`), ⛔ ולא מרכזו:** «הקלף הגיע ליריב» הוא דבר
 * שאפשר **לראות** — ראש הקלף פוגש את הרגליים. מרכז היה מכסה את הדמות בדיוק ברגע
 * שבו הלומד רוצה לראות אותה נפגעת.
 *
 * ⛔ מחזיר `0` כשאין יריב ⇒ ‏`cardLift` נופל לתקרה הישנה, ו⛔ אינו ממציא נסיעה.
 */
export function foeReach(cardTop: number, root: ParentNode | null | undefined): number {
  const rect = foeRect(root);
  if (rect === null || !Number.isFinite(cardTop)) return 0;
  return Math.max(0, cardTop - rect.bottom);
}

/**
 * כמה פיקסלים אופקית מפרידים את **מרכז** הקלף ממרכז היריב. חיובי ⇒ היריב מימין.
 *
 * ⛔ **מרכז מול מרכז, ⛔ ולא קצה מול קצה:** «הקלף הגיע אל היריב» אופקית פירושו
 * שהם **מיושרים**, ⛔ ולא שהם נוגעים — הנגיעה היא סיפורו של הציר האנכי.
 *
 * ⛔ מחזיר `0` כשאין יריב ⇒ ⛔ אין סחף, והקלף עולה ישר כמו קודם.
 */
export function foeDrift(cardRect: DOMRect | null, root: ParentNode | null | undefined): number {
  const foe = foeRect(root);
  if (foe === null || cardRect === null) return 0;
  return foe.left + foe.width / 2 - (cardRect.left + cardRect.width / 2);
}
