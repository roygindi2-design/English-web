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
  /** 🔬 `C-0724` — **85, ⛔ ולא 77.** המדידה הראשונה קראה פרופיל שורות; הפילוח לפי
   *  צבע נתן `x 421..583` ⇒ חצי-רוחב `81` בפיקסלים, `85` ביחידות השלד. */
  hemHalfWidth: 85,
  /** קו הפיצול בין הצד המואר למוצל, **בשוליים**: פילוח הצד המוצל נתן `x 482`. */
  hemSplitX: -21,
  faceY: -12,
  faceRadius: 35,
  eyeX: 16,
  eyeY: -9,
  eyeRadius: 8,
  eyeCoreRadius: 3,
  /**
   * ⚠️ **הגולה — סטייה מוצהרת, ⛔ ולא מיקום שנבחר.** 🔬 ברנדר מרכזה
   * ‏`(583.5, 869.5)` ⇒ ביחידות השלד **`(85, -124.5)`** — ⛔ **מעל גג ה-`viewBox`
   * ‏(`-108`) ומעבר לקצה הימני**. ⇒ היא הונמכה למקום הגבוה ביותר שהמסגרת נושאת.
   */
  orbX: 76,
  orbY: -82,
  orbRadius: 11,
  orbGlowRadius: 27,
  /** קצות הזרוע המורמת: מהכתף אל היד, בארבע נקודות. */
  armInnerX: 21, armInnerY: 17,
  armOuterX: 53, armOuterY: 14,
  armTipX: 74, armTipY: -40,
  armTopX: 62, armTopY: -45,
  /** המטה — מקל קצר מכף היד אל הגולה. */
  wandX: 66, wandY: -36,
  wandW: 10, wandH: -6,
  wandRunX: 20, wandRunY: 32,
});

/**
 * ⚔️ **⟦19/09 · `C-0724`⟧ חתימת הלוחם — מגן, חרב ומסרק שיער, **מפילוח צבע**.**
 *
 * 🔬 נמדדו מ-`kol-B-03-battle.png` באותה המרה כמו כל שורה ב-`38 § 3`
 * ‏(מרכז `x 544`, מרכז הראש `y 1298.5`, `s = 0.902`):
 * ```
 * מגן   זהב  x 432..496  y 1336..1419   פנים #60749e  בליטה (463.5,1377.5) r13.5
 * חרב   להב  x 607..728  y 1246..1362   ניצב  x 585..630  y 1350..1379
 * שיער  x 510..572  y 1249..1277  ⇒ חמישה קוצות · ⛔ המרווח הוא הרקע
 * ```
 * ⛔ **ולמה כאן ו⛔ לא ברכיב:** בדיוק כמו `CONE` — `ArenaAvatar.test.ts:119` אוסר
 * ‏`d="M…"` עם מספרים ברכיב, והוא **צודק**: קואורדינטה שנכתבת ברכיב היא קואורדינטה
 * שאיש ⛔ אינו יכול למדוד מול הרנדר.
 * ⚠️ **הלהב יוצא מהמסגרת בכוונה:** ברנדר הוא מגיע ל-`x 166` ביחידות השלד ⇒ הוא
 * נחתך ב-`100`. חרב שנגמרת בתוך המסגרת הייתה חרב **קצרה**, ⛔ ולא חרב שנחתכה.
 */
export const WARRIOR = Object.freeze({
  shieldX: -99, shieldY: -28, shieldW: 58, shieldH: 75, shieldR: 15,
  shieldFaceInset: 6, shieldFaceR: 10,
  bossX: -70, bossY: 9, bossRadius: 12,
  bladeNearX: 57, bladeNearY: 3,
  bladeFarX: 100, bladeFarY: -40,
  bladeBackX: 43, bladeBackY: 3,
  bladeTipY: -54,
  gripX: 40, gripY: 16, gripRun: 33, gripW: 9,
  hairBarX: Object.freeze([-30, -17, -4, 9, 22]),
  hairY: -107, hairH: 28, hairBarW: 8, hairBarR: 2,
  legHalfWidth: 17, legTopY: 54, legR: 11,
  shoulderRadius: 24,
  beltR: 5,
  chestTopY: -15, chestH: 60, chestHalfWidth: 2,
});

/**
 * 🤖 **⟦19/09 · `C-0724`⟧ השריונאי — ⚠️ **נגזר מהמילים, ⛔ ולא מרנדר.**
 * ‏`kol-B-03-battle.png` מצייר **קוסם ולוחם בלבד**; ל-`שריונאי` יש ב-`37 § 7`
 * תיאור מילולי («חליפת קרב טכנולוגית · ירי מטווח») ⛔ ואין לו תמונת ייחוס.
 * ⇒ המספרים כאן הם **החלטה מוצהרת**, ⛔ ולא מדידה — וזה נכתב כאן במפורש כדי
 * ש-`38 § 3` ⛔ לא ייקרא כאילו כל שורה בו נמדדה.
 */
export const ARMORER = Object.freeze({
  visorOverhang: 4, visorTopY: -10, visorH: 16, visorR: 6,
  capRadius: 13, capRise: 6,
  barrelBackX: -14, barrelTopY: -7, barrelW: 52, barrelH: 14, barrelR: 5,
  gripX: -10, gripY: 3, gripW: 14, gripH: 20, gripR: 4,
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
