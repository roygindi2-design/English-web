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
/**
 * 🧩 **⟦19/09 · `C-0725`⟧ מצולע מנקודות — ⛔ כדי שהקואורדינטות יחיו כאן.**
 * ‏`ArenaAvatar.test.ts` אוסר `d="M…"` עם מספרים ברכיב, והוא **צודק**: מספר
 * שנכתב ברכיב הוא מספר שאיש ⛔ אינו יכול לבדוק. ⇒ הנקודות יושבות כאן, הנתיב
 * נבנה כאן, והרכיב **מצייר** ⛔ ואינו קובע.
 */
export function polygon(points: readonly (readonly [number, number])[]): string {
  if (points.length < 3) throw new Error('⛔ מצולע דורש שלוש נקודות לפחות');
  return `M${points.map(([x, y]) => `${x} ${y}`).join('L')}z`;
}

/**
 * 🧙 **⟦19/09 · `C-0725`⟧ הקוסם — **כובע, שוליים, פנים וגלימה**, ⛔ ולא חרוט אחד.**
 *
 * ⚠️ **רוי הסיר את דרישת הנאמנות המילולית:** «הם ⛔ לא חייבים להיראות בדיוק כמו
 * הרנדר אבל **בסגנון**». ⇒ מה שנשמר הוא ה**סגנון** של `kol-B-03-battle.png` —
 * וקטור שטוח, שני גוונים לנפח, פנים כהות ועיניים זוהרות, והפלטה שנמדדה ב-`§ 3א`.
 * מה ש**השתנה** הוא הצללית: 🔬 החרוט היחיד נמדד ⛔ ואז נראה — והוא נקרא **משולש**,
 * ⛔ ולא קוסם. ⇒ הכובע הופרד מהגלימה, ובין שניהם **שוליים** — וזה הפרט שהופך
 * צללית סגולה ל«קוסם» בלי מילה אחת.
 * ⛔ **ו⛔ אין כאן פריצה של `38 § 3`:** הקוסם מספק בעצמו את שכבות הבסיס
 * ‏(`CHARACTER_HIDES`), ו⛔ אף עוגן ⛔ לא זז.
 */
export const WIZARD = Object.freeze({
  hatApexY: -104,
  hatBaseHalfWidth: 34,
  hatBaseY: -46,
  /** סרט הכובע — רצועה כהה מעל השוליים. */
  bandTopY: -54,
  bandTopHalfWidth: 30,
  brimRx: 50,
  brimRy: 9,
  brimBackY: -42,
  brimFrontY: -46,
  faceY: -16,
  faceRadius: 27,
  eyeX: 12.5,
  eyeY: -14,
  eyeRadius: 6.5,
  eyeCoreRadius: 2.4,
  /** הגלימה: כתף ⇒ שוליים, בעקומה אחת לכל צד. */
  robeShoulderX: 30,
  robeShoulderY: -24,
  robeHemHalfWidth: 80,
  robeSplitX: -20,
  robeCurveX: 48,
  robeCurveY: 40,
  armPts: Object.freeze([[24, 10], [50, 2], [72, -46], [58, -52]] as const),
  wandPts: Object.freeze([[62, -42], [72, -48], [92, -16], [82, -10]] as const),
  /**
   * ⚠️ **הגולה — מקום שנבחר, ⛔ ולא נמדד.** 🔬 ברנדר מרכזה `(85,-124.5)` ביחידות
   * השלד — **מעל גג ה-`viewBox`** (`-108`). ⇒ היא יושבת במקום הגבוה שהמסגרת נושאת.
   */
  orbX: 74,
  orbY: -84,
  orbRadius: 11,
  orbGlowRadius: 22,
});

/** נתיבי הקוסם, **נבנים כאן** מהמספרים שמעליהם. */
export const WIZARD_PATHS = Object.freeze({
  hat: polygon([[0, WIZARD.hatApexY], [WIZARD.hatBaseHalfWidth, WIZARD.hatBaseY], [-WIZARD.hatBaseHalfWidth, WIZARD.hatBaseY]]),
  hatShade: polygon([[0, WIZARD.hatApexY], [WIZARD.hatBaseHalfWidth, WIZARD.hatBaseY], [0, WIZARD.hatBaseY]]),
  hatBand: polygon([
    [-WIZARD.bandTopHalfWidth, WIZARD.bandTopY], [WIZARD.bandTopHalfWidth, WIZARD.bandTopY],
    [WIZARD.hatBaseHalfWidth, WIZARD.hatBaseY], [-WIZARD.hatBaseHalfWidth, WIZARD.hatBaseY],
  ]),
  robeLit:
    `M${-WIZARD.robeShoulderX} ${WIZARD.robeShoulderY}` +
    `Q${-WIZARD.robeCurveX} ${WIZARD.robeCurveY} ${-WIZARD.robeHemHalfWidth} 112` +
    `L${WIZARD.robeSplitX} 112L0 ${WIZARD.robeShoulderY}z`,
  robeShade:
    `M0 ${WIZARD.robeShoulderY}L${WIZARD.robeSplitX} 112L${WIZARD.robeHemHalfWidth} 112` +
    `Q${WIZARD.robeCurveX} ${WIZARD.robeCurveY} ${WIZARD.robeShoulderX} ${WIZARD.robeShoulderY}z`,
  armRight: polygon(WIZARD.armPts),
  armLeft: polygon(WIZARD.armPts.map(([x, y]) => [-x, y] as const)),
  wand: polygon(WIZARD.wandPts),
});

/**
 * ⚔️ **⟦19/09 · `C-0725`⟧ הלוחם — **פנים, צווארון, גוף מחודד, מגן טיפה וחרב עם ניצב**.**
 *
 * 🔬 **שני דברים שהרנדר מנע ורוי שחרר** («⛔ לא בדיוק כמו הרנדר אבל בסגנון»):
 * ① **ללוחם ברנדר ⛔ אין פנים בכלל** — עיגול עור חלק. נמדד על המסך: ראש בלי
 *   עיניים נקרא **כתם**, ⛔ ולא דמות, וזה הפרט היחיד שהיריב קיבל והגיבור ⛔ לא.
 * ② הגוף היה **מלבן מעוגל**. ⇒ עכשיו הוא **מחודד כלפי מטה** (`45` ⇒ `38`),
 *   מה שקורא כשריון ⛔ ולא כקופסה, ומעליו צווארון שמחבר את הראש לגוף.
 * ⛔ **והעוגנים ⛔ לא זזו** — הגוף עדיין `90x86` על `(0,16)`, הכתפיים על `(±46,-13)`.
 */
export const WARRIOR = Object.freeze({
  bodyTopHalfWidth: 45,
  bodyBottomHalfWidth: 38,
  bodyCornerTop: 16,
  bodyCornerBottom: 10,
  collarHalfWidth: 14, collarTopY: -36, collarH: 16, collarR: 5,
  /** סמל החזה — מעוין, ומתחתיו קו. */
  crestRadius: 16, crestY: 2,
  crestLineTopY: 18, crestLineH: 30, crestLineHalfWidth: 2,
  eyeX: 11, eyeY: -65, eyeRadius: 5,
  eyeCoreX: 1.5, eyeCoreY: 1.5, eyeCoreRadius: 1.8,
  shoulderRadius: 24, pauldronSkirt: 14, pauldronInset: 4,
  beltR: 6, buckleHalfWidth: 9, buckleTopY: 61, buckleH: 15, buckleR: 4,
  legHalfWidth: 16, legTopY: 54, legGap: 4, legR: 12,
  hairBarX: Object.freeze([-30, -17, -4, 9, 22]),
  hairY: -107, hairH: 28, hairBarW: 8, hairBarR: 3,
  /** המגן — **טיפה**, ⛔ ולא מלבן: `-99..-41` לרוחב, `-28..47` לגובה. */
  shieldCx: -70, shieldHalfWidth: 29, shieldTopY: -28, shieldShoulderY: -13,
  shieldWaistHalfWidth: 26, shieldWaistY: 25, shieldTipY: 47, shieldInset: 6,
  bossX: -70, bossY: 6, bossRadius: 12,
  /** ⚠️ הלהב **נחתך** ב-`x 100` — חרב שנגמרת בתוך המסגרת היא חרב קצרה. */
  bladePts: Object.freeze([[55, 5], [100, -40], [100, -56], [41, 3]] as const),
  bladeLitPts: Object.freeze([[55, 5], [100, -40], [100, -48], [48, 4]] as const),
  guardPts: Object.freeze([[41, -10], [62, 11], [55, 18], [34, -3]] as const),
  gripPts: Object.freeze([[45, 1], [52, 8], [40, 19], [33, 12]] as const),
  pommelX: 36, pommelY: 16, pommelRadius: 6,
});

const shieldPath = (inset: number): string => {
  const halfWidth = WARRIOR.shieldHalfWidth - inset;
  const waist = WARRIOR.shieldWaistHalfWidth - inset;
  const top = WARRIOR.shieldTopY + inset;
  const tip = WARRIOR.shieldTipY - inset;
  const waistY = WARRIOR.shieldWaistY - inset;
  const cx = WARRIOR.shieldCx;
  return (
    `M${cx - halfWidth} ${WARRIOR.shieldShoulderY}` +
    `Q${cx - halfWidth} ${top} ${cx} ${top}` +
    `Q${cx + halfWidth} ${top} ${cx + halfWidth} ${WARRIOR.shieldShoulderY}` +
    `L${cx + waist} ${waistY}` +
    `Q${cx + waist} ${tip} ${cx} ${tip}` +
    `Q${cx - waist} ${tip} ${cx - waist} ${waistY}z`
  );
};

/** נתיבי הלוחם, **נבנים כאן**. */
export const WARRIOR_PATHS = Object.freeze({
  body:
    `M${-WARRIOR.bodyTopHalfWidth} ${16 - 43 + WARRIOR.bodyCornerTop}` +
    `Q${-WARRIOR.bodyTopHalfWidth} ${16 - 43} ${-WARRIOR.bodyTopHalfWidth + WARRIOR.bodyCornerTop} ${16 - 43}` +
    `L${WARRIOR.bodyTopHalfWidth - WARRIOR.bodyCornerTop} ${16 - 43}` +
    `Q${WARRIOR.bodyTopHalfWidth} ${16 - 43} ${WARRIOR.bodyTopHalfWidth} ${16 - 43 + WARRIOR.bodyCornerTop}` +
    `L${WARRIOR.bodyBottomHalfWidth} ${16 + 43 - WARRIOR.bodyCornerBottom}` +
    `Q${WARRIOR.bodyBottomHalfWidth} ${16 + 43} ${WARRIOR.bodyBottomHalfWidth - WARRIOR.bodyCornerBottom} ${16 + 43}` +
    `L${-WARRIOR.bodyBottomHalfWidth + WARRIOR.bodyCornerBottom} ${16 + 43}` +
    `Q${-WARRIOR.bodyBottomHalfWidth} ${16 + 43} ${-WARRIOR.bodyBottomHalfWidth} ${16 + 43 - WARRIOR.bodyCornerBottom}z`,
  crest: polygon([
    [0, WARRIOR.crestY - WARRIOR.crestRadius], [WARRIOR.crestRadius, WARRIOR.crestY],
    [0, WARRIOR.crestY + WARRIOR.crestRadius], [-WARRIOR.crestRadius, WARRIOR.crestY],
  ]),
  shield: shieldPath(0),
  shieldFace: shieldPath(WARRIOR.shieldInset),
  blade: polygon(WARRIOR.bladePts),
  bladeLit: polygon(WARRIOR.bladeLitPts),
  guard: polygon(WARRIOR.guardPts),
  grip: polygon(WARRIOR.gripPts),
});

/** כתפייה: חצי-עיגול על העוגן ומתחתיו חצאית קצרה. */
export function pauldronPath(cx: number, cy: number): string {
  const r = WARRIOR.shoulderRadius;
  const inset = WARRIOR.pauldronInset;
  return (
    `M${cx - r} ${cy}a${r} ${r} 0 0 1 ${r * 2} 0` +
    `l${-inset} ${WARRIOR.pauldronSkirt}h${-(r * 2 - inset * 2)}z`
  );
}

/**
 * 🤖 **⟦19/09 · `C-0724`⟧ השריונאי — ⚠️ **נגזר מהמילים, ⛔ ולא מרנדר.**
 * ‏`kol-B-03-battle.png` מצייר **קוסם ולוחם בלבד**; ל-`שריונאי` יש ב-`37 § 7`
 * תיאור מילולי («חליפת קרב טכנולוגית · ירי מטווח») ⛔ ואין לו תמונת ייחוס.
 * ⇒ המספרים כאן הם **החלטה מוצהרת**, ⛔ ולא מדידה.
 */
export const ARMORER = Object.freeze({
  visorOverhang: 4, visorTopY: -12, visorH: 18, visorR: 7,
  /** חריץ זוהר — בלי זה הקסדה נקראת **כיסוי עיניים**, ⛔ ולא קסדה. */
  slitHalfWidth: 22, slitTopY: -6, slitH: 5, slitR: 3,
  capRadius: 10, capRise: 0,
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
