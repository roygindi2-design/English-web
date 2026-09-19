/**
 * `plan/38-character-base.md § 3` · `§ 4` — **שלד הדמות, כשכבה טהורה.**
 * T-215 · D-133 § ב׳ · סוגר את F-157 ⓘ.
 *
 * ⛔ **כל מספר כאן הועתק מ-`38 § 3`, ⛔ ואף אחד מהם ⛔ לא נבחר כאן.** זו ⛔ אינה קפדנות
 * לשמה: `38 § 3` קובע במפורש ש«פריט שלא מתיישב על נקודת עיגון קיימת הוא פריט **פסול**,
 * ⛔ לא סיבה לשנות את השלד» — ⇒ ברגע שמספר אחד נגזר כאן מחדש, המשפט הזה מפסיק להיות
 * ניתן לאכיפה, ו⛔ אין דרך למדוד איזה פריט תקף.
 *
 * ⛔ **ולמה זה מודול טהור ו⛔ לא קבועים ברכיב:** `components/ArenaAvatar.tsx` מצייר,
 * ‏`components/ArenaResult.tsx` מצייר את אותה דמות במסך אחר, ו-`T-216` (א4) תזיז שלוש
 * מהשכבות בפיגור של שני פריימים. שלושה צרכנים לאותו שלד ⇒ שלושה עותקים שסוטים.
 * ‏`npm run check:core` מוודא שאין כאן React, `window`, `document` ואחסון.
 *
 * ⚠️ **פער מוצהר, ⛔ ולא השמטה שקטה (F-160):** `38 § 4` מונה **אחת־עשרה** שכבות, ואחריהן
 * מוסיף משפט שהגלימה «מרונדרת פעמיים — חלק אחורי מתחת לגוף וחלק קדמי מעל הרגליים».
 * ⛔ **שכבה שתים־עשרה ⛔ אינה קיימת ברשימה**, והתוכנית שהוקפאה (C-0333) מקפיאה אחת־עשרה
 * עם `capeBack` בלבד. ⇒ החצי הקדמי של הגלימה ⛔ אינו מצויר, וזה נרשם כממצא ⛔ ולא נבלע.
 */

/**
 * שבע המשבצות של `38 § 3`. 🔬 **⟦19/09 · `C-0722`⟧ המספרים שם **נמדדו מהרנדר**
 * ‏(`kol-B-03-battle.png`) ⛔ ואינם עוד נבחרים — הפער המלא, בשש שורות, נמצא בטבלה
 * שם. ⇒ המשפט למטה («⛔ אף מספר ⛔ לא נבחר כאן») ⛔ לא רוכך: הוא רק הפך **נכון גם
 * על המקור**. ⛔ הכותרת של `§ 2` אומרת «שש», והטבלה שמתחתיה מונה **שבע**
 * שורות — ⇒ הרשימה כאן היא של **טבלת נקודות העיגון** (`§ 3`), שהיא זו שהשלד נבנה עליה.
 */
export type CharacterSlot =
  | 'head' | 'shoulders' | 'body' | 'belt'
  | 'mainHand' | 'offHand' | 'legs';

export interface AnchorPoint {
  readonly x: number;
  readonly y: number;
}

/** `38 § 4`, in render order. The cape renders twice — back, then front. */
export const LAYER_ORDER = Object.freeze([
  'capeBack', 'legs', 'boots', 'body', 'chest', 'belt',
  'offHand', 'head', 'headgear', 'shoulders', 'mainHand',
] as const);

export type Layer = (typeof LAYER_ORDER)[number];

/**
 * נקודות העיגון, **מילה במילה מ-`38 § 3`**. ביחידות לוגיות ביחס למרכז הדמות.
 * ⛔ **שתי משבצות סימטריות** — `shoulders` ו-`legs` — והערך כאן הוא ה**ימני**, בדיוק
 * כפי שהטבלה כותבת אותו (`(-46,-13) / (46,-13)` · `(-20,112) / (20,112)`). השמאלי מתקבל
 * מ-`mirror()`, ⛔ ולא ממספר שני שאפשר לסטות בו.
 */
const ANCHORS: Readonly<Record<CharacterSlot, AnchorPoint>> = Object.freeze({
  head: { x: 0, y: -62 },
  shoulders: { x: 46, y: -13 },
  body: { x: 0, y: 16 },
  belt: { x: 0, y: 72 },
  mainHand: { x: 48, y: -10 },
  offHand: { x: -60, y: 5 },
  legs: { x: 20, y: 112 },
});

/** המשבצות שהטבלה כותבת בזוג «שמאל / ימין». ⛔ שתיים, ⛔ ואין שלישית. */
export const MIRRORED_SLOTS = Object.freeze(['shoulders', 'legs'] as const);

/** מידות הגוף מ-`38 § 3`. ⛔ הראש הוא רדיוס ⛔ ולא מלבן, ולכן הוא ⛔ אינו כאן. */
/**
 * 🧙 **⟦19/09 · `C-0722`⟧ צללית החרוט — **מדידה, ⛔ ולא בחירה.**
 *
 * 🔬 נמדדה מ-`docs/design/kol-B-03-battle.png` באותה המרה כמו כל שורה אחרת בטבלה:
 * קודקוד הכובע `y 73`, שולי הגלימה `y 276` ברוחב `144`, פנים במרכז `(102,157)`
 * ברדיוס `34`, עיניים ברדיוס `8`. ⇒ ביחידות השלד, בהתאמה לגובה המסגרת.
 *
 * ⛔ **ולמה זה כאן ו⛔ לא ברכיב:** הקוסם הוא הדמות שהצללית שלה **מחליפה** את הגוף,
 * ⇒ המספרים האלה הם עובדה **ברמת השלד** בדיוק כמו `BODY_SIZE` — ⛔ ולא קואורדינטות
 * שרכיב בחר. ‏`ArenaAvatar.test.ts:123` דורש בדיוק את זה, והוא **צדק**: הגרסה
 * הראשונה שלי קידדה אותן כ-`d="M-21 17…"` בתוך הרכיב, והשער האדים.
 */
export const CONE = Object.freeze({
  apexY: -100,
  hemHalfWidth: 77,
  faceY: -12,
  faceRadius: 35,
  eyeX: 16,
  eyeY: -9,
  eyeRadius: 8,
  orbX: 74,
  orbY: -58,
  orbRadius: 13,
  /** קצות הזרוע המורמת: מהכתף אל היד, בארבע נקודות. */
  armInnerX: 21, armInnerY: 17,
  armOuterX: 53, armOuterY: 14,
  armTipX: 74, armTipY: -40,
  armTopX: 62, armTopY: -45,
});

export const BODY_SIZE = Object.freeze({ width: 90, height: 86 });
export const BELT_SIZE = Object.freeze({ width: 61, height: 24 });
export const HEAD_RADIUS = 30;

/**
 * ⛔ **פריט שאינו מתיישב על נקודת עיגון קיימת הוא פריט פסול** (`38 § 3`, מילה במילה) —
 * ⇒ הבדיקה הזאת קיימת כדי ש«פסול» יהיה **ענף בקוד** ⛔ ולא משפט במסמך.
 */
export function isCharacterSlot(name: string): name is CharacterSlot {
  return Object.prototype.hasOwnProperty.call(ANCHORS, name);
}

/**
 * נקודת העיגון של משבצת. ⛔ זורק על שם שאינו משבצת — ⛔ ולא מחזיר `null` שהקורא
 * יכול לדלג עליו בשקט: `38 § 3` קובע שפריט כזה **פסול**, וכשל שקט הוא בדיוק
 * המצב שבו שכבה מצוירת על (0,0) ואיש ⛔ אינו רואה שהשלד הופר.
 */
export function anchorFor(slot: CharacterSlot): AnchorPoint {
  /* ⛔ **`isCharacterSlot` ו⛔ לא `ANCHORS[slot] === undefined`** — נמדד בבדיקה, ⛔ ולא
     שוער: `ANCHORS['toString']` מחזיר את הפונקציה של `Object.prototype`, כלומר ערך
     **אמיתי** ⇒ הענף «פסול» ⛔ לא היה נורה, והשלד היה נפרץ דרך שם ירושה. */
  if (!isCharacterSlot(slot)) throw new Error(`⛔ משבצת פסולה: ${String(slot)}`);
  return ANCHORS[slot];
}

/** הצד השמאלי של משבצת סימטרית. ⛔ שיקוף, ⛔ ולא מספר שני. */
export function mirror(point: AnchorPoint): AnchorPoint {
  return { x: -point.x, y: point.y };
}

export function isMirroredSlot(slot: CharacterSlot): boolean {
  return (MIRRORED_SLOTS as readonly string[]).includes(slot);
}
