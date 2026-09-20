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

/**
 * `38 § 4`, in render order. The cape renders twice — back, then front.
 *
 * 🧥 **⟦20/09 · `C-0745` · `F-307`⟧ שתים־עשרה, ⛔ ולא אחת־עשרה — וזה **ביצוע**
 * של `D-136`, ⛔ ולא הכרעה חדשה.**
 *
 * 🔬 **ההחלטה בת שלושה שבועות, והיא נוקבת בשינוי הזה בשמו:** «`LAYER_ORDER`
 * ב-`lib/core/characterBase.ts` עובר ל-12, ו-`toHaveLength(11)` ⇒
 * `toHaveLength(12)`» (`D-136`, ‏31/08). ‏`38 § 4` אומר את אותו הדבר במילים —
 * «הגלימה מרונדרת פעמיים — חלק אחורי מתחת לגוף וחלק **קדמי מעל הרגליים**».
 * ⇒ המסמך והחוק הסכימו, ו**חצי הקוד ⛔ מעולם ⛔ לא נעשה**.
 *
 * ⛔ **ו⛔ אין כאן שכבה שהומצאה** (`38 § 5`): `capeFront` נקוב בשמו ובמיקומו
 * — **מיד אחרי `legs`** — בהכרעה עצמה. ⇒ ההערה שמעל שאמרה «back, then
 * front» מאז שנכתבה **מפסיקה לשקר**.
 */
export const LAYER_ORDER = Object.freeze([
  'capeBack', 'legs', 'capeFront', 'boots', 'body', 'chest', 'belt',
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

/**
 * 🆕 **⟦19/09 · `C-0726`⟧ שלוש דמויות שאין להן רנדר — `צייד` · `גולם` · `צל`.**
 *
 * ⚠️ **⛔ אף מספר כאן ⛔ לא נמדד, וזה נאמר במפורש.** `kol-B-03-battle.png` מצייר
 * **קוסם ולוחם בלבד** ⇒ אלה **בחירות עיצוב** תחת החוזה של `38 § 3ב` (וקטור שטוח ·
 * שני גוונים לנפח · פנים כהות ועיניים זוהרות). ⛔ **ואין לקרוא את `38 § 3` כאילו
 * כל שורה בו נמדדה** — זו בדיוק הסתירה ש-`F-296` סגר, ו⛔ לא אחזיר אותה בדלת האחורית.
 *
 * 🔴 **הדרישה שכן נאכפת: כל אחת נקראת לפי ה**צללית** לבדה.** 🔬 נמדד ב-64px, ⛔ ולא
 * שוער: **קשת** (צייד) · **מסה** (גולם) · **זנב קרוע בלי רגליים** (צל). שלושתן
 * ⛔ **אינן** הצללית של קוסם/לוחם/שריונאי, וזו הדרישה של רוי מילה במילה
 * («שיהיו שונות מהדמויות הקיימות»).
 */
export const HUNTER = Object.freeze({
  bowTopX: -52, bowTopY: -74, bowBellyX: -88, bowNockX: -26, bowWidth: 9, stringWidth: 3,
  legHalfWidth: 10, legInner: 4, legTopY: 56,
  tunicShoulderX: 34, tunicShoulderY: -26, tunicCorner: 12,
  tunicWaistX: 30, tunicWaistY: 44, tunicHemY: 62,
  beltHalfWidth: 27, beltTopY: 26, beltH: 14, beltR: 4,
  headY: -58, headRadius: 26, eyeX: 10, eyeY: -60, eyeRadius: 4.5,
  hoodPts: Object.freeze([[-46, -48], [-20, -92], [0, -100], [20, -92], [30, -50], [-14, -62]] as const),
  hoodShadePts: Object.freeze([[0, -96], [20, -92], [30, -50], [0, -66]] as const),
  shaftFarX: 78, headTipX: 92, headBackX: 70, headHalf: 9,
  fletchBackX: -30, fletchTipX: -18, fletchHalf: 8,
});

export const GOLEM = Object.freeze({
  legHalfWidth: 18, legInner: 8, legTopY: 52, legR: 12,
  bodyShoulderX: 52, bodyShoulderY: -34, bodyCorner: 20,
  bodyHipX: 46, bodyHipY: 44, bodyHemY: 58, bodyHemX: 30,
  coreRadius: 20, coreY: 6, coreInner: 12,
  headHalfWidth: 20, headTopY: -64, headH: 34, headR: 8,
  headEyeX: 9, headEyeY: -48, headEyeRadius: 5,
  boulderX: 54, boulderY: -22, boulderRadius: 30,
});

export const SHADE = Object.freeze({
  /** ⛔ **אין רגליים** — הזנב הקרוע הוא מה שהופך את הצללית לשונה מכולן. */
  tailPts: Object.freeze([
    [-34, -26], [-46, 40], [-34, 74], [-20, 56], [-6, 96], [6, 62],
    [22, 92], [30, 48], [38, 66], [46, 26], [34, -26],
  ] as const),
  tailLitPts: Object.freeze([
    [0, -26], [-46, 40], [-34, 74], [-20, 56], [-6, 96], [0, 62],
  ] as const),
  armPts: Object.freeze([[26, -8], [54, -20], [72, -58], [58, -64]] as const),
  hoodPts: Object.freeze([[-32, -40], [-24, -76], [0, -84], [24, -76], [32, -40], [32, -22], [0, -8], [-32, -22]] as const),
  faceY: -42, faceRx: 24, faceRy: 22,
  eyeX: 10, eyeY: -44, eyeRadius: 6,
  moteX: 68, moteY: -78, moteRadius: 9,
  sparkX: -62, sparkY: -84, sparkRadius: 5,
});

/** נתיבי שלוש החדשות, **נבנים כאן** כמו כל השאר. */
export const NEW_PATHS = Object.freeze({
  hunterBow:
    `M${HUNTER.bowTopX} ${HUNTER.bowTopY}` +
    `Q${HUNTER.bowBellyX} 0 ${HUNTER.bowTopX} ${-HUNTER.bowTopY}`,
  hunterString:
    `M${HUNTER.bowTopX} ${HUNTER.bowTopY}L${HUNTER.bowNockX} 0L${HUNTER.bowTopX} ${-HUNTER.bowTopY}`,
  hunterShaft: `M${HUNTER.bowNockX} 0L${HUNTER.shaftFarX} 0`,
  hunterArrowHead: polygon([
    [HUNTER.headBackX, -HUNTER.headHalf], [HUNTER.headTipX, 0], [HUNTER.headBackX, HUNTER.headHalf],
  ]),
  hunterFletch: polygon([
    [HUNTER.fletchBackX, -HUNTER.fletchHalf], [HUNTER.fletchTipX, 0], [HUNTER.fletchBackX, HUNTER.fletchHalf],
  ]),
  hunterTunic:
    `M${-HUNTER.tunicShoulderX} ${HUNTER.tunicShoulderY + HUNTER.tunicCorner}` +
    `Q${-HUNTER.tunicShoulderX} ${HUNTER.tunicShoulderY} ${-HUNTER.tunicShoulderX + HUNTER.tunicCorner} ${HUNTER.tunicShoulderY}` +
    `L${HUNTER.tunicShoulderX - HUNTER.tunicCorner} ${HUNTER.tunicShoulderY}` +
    `Q${HUNTER.tunicShoulderX} ${HUNTER.tunicShoulderY} ${HUNTER.tunicShoulderX} ${HUNTER.tunicShoulderY + HUNTER.tunicCorner}` +
    `L${HUNTER.tunicWaistX} ${HUNTER.tunicWaistY}L0 ${HUNTER.tunicHemY}L${-HUNTER.tunicWaistX} ${HUNTER.tunicWaistY}z`,
  hunterTunicShade:
    `M0 ${HUNTER.tunicShoulderY}L${HUNTER.tunicShoulderX - HUNTER.tunicCorner} ${HUNTER.tunicShoulderY}` +
    `Q${HUNTER.tunicShoulderX} ${HUNTER.tunicShoulderY} ${HUNTER.tunicShoulderX} ${HUNTER.tunicShoulderY + HUNTER.tunicCorner}` +
    `L${HUNTER.tunicWaistX} ${HUNTER.tunicWaistY}L0 ${HUNTER.tunicHemY}z`,
  hunterHood: polygon(HUNTER.hoodPts),
  hunterHoodShade: polygon(HUNTER.hoodShadePts),
  golemBody:
    `M${-GOLEM.bodyShoulderX} ${GOLEM.bodyShoulderY + GOLEM.bodyCorner}` +
    `Q${-GOLEM.bodyShoulderX} ${GOLEM.bodyShoulderY} ${-GOLEM.bodyShoulderX + GOLEM.bodyCorner} ${GOLEM.bodyShoulderY}` +
    `L${GOLEM.bodyShoulderX - GOLEM.bodyCorner} ${GOLEM.bodyShoulderY}` +
    `Q${GOLEM.bodyShoulderX} ${GOLEM.bodyShoulderY} ${GOLEM.bodyShoulderX} ${GOLEM.bodyShoulderY + GOLEM.bodyCorner}` +
    `L${GOLEM.bodyHipX} ${GOLEM.bodyHipY}Q${GOLEM.bodyHipX} ${GOLEM.bodyHemY} ${GOLEM.bodyHemX} ${GOLEM.bodyHemY}` +
    `L${-GOLEM.bodyHemX} ${GOLEM.bodyHemY}Q${-GOLEM.bodyHipX} ${GOLEM.bodyHemY} ${-GOLEM.bodyHipX} ${GOLEM.bodyHipY}z`,
  golemCore: polygon([
    [0, GOLEM.coreY - GOLEM.coreRadius], [GOLEM.coreRadius - 2, GOLEM.coreY],
    [0, GOLEM.coreY + GOLEM.coreRadius], [-(GOLEM.coreRadius - 2), GOLEM.coreY],
  ]),
  golemCoreInner: polygon([
    [0, GOLEM.coreY - GOLEM.coreInner], [GOLEM.coreInner - 3, GOLEM.coreY],
    [0, GOLEM.coreY + GOLEM.coreInner], [-(GOLEM.coreInner - 3), GOLEM.coreY],
  ]),
  golemBoulderShadeRight:
    `M${GOLEM.boulderX - GOLEM.boulderRadius} ${GOLEM.boulderY}` +
    `a${GOLEM.boulderRadius} ${GOLEM.boulderRadius} 0 0 0 ${GOLEM.boulderRadius * 2} 0z`,
  golemBoulderShadeLeft:
    `M${-GOLEM.boulderX - GOLEM.boulderRadius} ${GOLEM.boulderY}` +
    `a${GOLEM.boulderRadius} ${GOLEM.boulderRadius} 0 0 0 ${GOLEM.boulderRadius * 2} 0z`,
  shadeTail: polygon(SHADE.tailPts),
  shadeTailLit: polygon(SHADE.tailLitPts),
  shadeArmRight: polygon(SHADE.armPts),
  shadeArmLeft: polygon(SHADE.armPts.map(([x, y]) => [-x, y] as const)),
  shadeHood: polygon(SHADE.hoodPts),
});

/**
 * 🎒 **⟦19/09 · `C-0727`⟧ חמשת פריטי `ARCADE_ITEMS` — **עצמים**, ⛔ ולא קו.**
 *
 * 🔬 **הפגם נמדד על הדף החי, ⛔ ולא שוער:** הציוד צויר כ-`stroke` אחד ב-`text-ink`,
 * שבתוך הזירה נפתר ל-`rgb(28,38,66)` — **בדיוק `--arena-night`, רקע הבמה** ⇒ יחס
 * **`1.00:1`**. ⇒ הגלימה והדגל, שרוב שטחם תלוי **מחוץ** לגוף, היו **בלתי נראים**.
 * ⚠️ **וההנמקה שהייתה בקוד התיישנה בשקט:** «הבסיס ממולא ב-`currentColor` של התפקיד,
 * וקו באותו גוון היה נעלם» — אלא ש-`C-0724` הפסיק לצבוע את הבסיס בצבע התפקיד.
 * ⇒ הנימוק מת לפני התיקון, ואיש ⛔ לא חזר לשורה שהוא החזיק.
 */
const CAPE_PTS = Object.freeze([
  [-46, -20], [-66, 98], [-50, 86], [-34, 106], [-18, 86], [0, 106],
  [18, 86], [34, 106], [50, 86], [66, 98], [46, -20],
] as const);

const CAPE_FOLD_PTS = Object.freeze([
  [46, -20], [66, 98], [50, 86], [34, 106], [18, 86], [28, -20],
] as const);

/**
 * 🧥 **⟦20/09 · `C-0745` · `F-307`⟧ שולי הגלימה — **נגזרים**, ⛔ ולא מוקלדים שוב.**
 *
 * ‏`D-136` מורה על «חלק אחורי מתחת לגוף וחלק קדמי **מעל הרגליים**». ⇒ החצי הקדמי
 * הוא **אותו מצולע**, חתוך בקו העמקים של השִׁנַּיִם: הנקודות `1…9` של `CAPE_PTS`
 * הן **רצף אחד** — כל אלה שעומקן `y ≥ 86` — ו-`CAPE_HEM_Y` הוא העומק הזה עצמו,
 * ⛔ **⛔ ולא מספר שנבחר**: הוא נקרא מתוך `CAPE_PTS[2][1]`.
 *
 * ⛔ **וזו הסיבה שזה `slice` ו⛔ לא רשימה שנייה:** מצולע שני שמוקלד ביד הוא מקום
 * שבו השניים יכולים לסטות בשקט — בדיוק המחלקה של «שמאלי ⛔ ולא מספר שני שאפשר
 * לסטות בו» שכבר כתובה מעל `MIRRORED_SLOTS`.
 *
 * ⚠️ **והקפל נגזר באותה שורה בדיוק.** בלעדיו השוליים הקדמיים היו מכסים את החצי
 * התחתון של הקפל בצבע אחיד ⇒ הצללית שנותנת לגלימה נפח הייתה נקטעת באמצע.
 */
const CAPE_HEM_Y = CAPE_PTS[2][1];

export const ITEMS = Object.freeze({
  capePts: CAPE_PTS,
  capeFoldPts: CAPE_FOLD_PTS,
  capeHemPts: Object.freeze([
    [-66, CAPE_HEM_Y], ...CAPE_PTS.slice(1, 10), [66, CAPE_HEM_Y],
  ] as readonly (readonly [number, number])[]),
  capeFoldHemPts: Object.freeze([
    [66, CAPE_HEM_Y], ...CAPE_FOLD_PTS.slice(1, 5),
  ] as readonly (readonly [number, number])[]),
  helmetRadius: 33, helmetSkirtY: -54,
  browHalfWidth: 37, browTopY: -58, browH: 11, browR: 4,
  crestTopY: -96, crestTopHalf: 4, crestBaseHalf: 7,
  lanternX: -60, lanternTopY: -6, lanternHalfWidth: 17, lanternH: 36, lanternR: 6,
  lanternPaneInset: 6, lanternPaneR: 4, lanternFootH: 7, lanternLoopRadius: 10,
  bootTopY: 88, bootCuffY: 86, bootCuffH: 8, bootCuffR: 3,
  bootInner: 6, bootOuter: 40, bootFlare: 6,
  poleX: 44, poleTopY: -92, poleW: 8, poleH: 150, poleR: 4,
  finialY: -96, finialRadius: 7,
  flagPts: Object.freeze([[52, -88], [98, -76], [84, -68], [98, -60], [52, -48]] as const),
  flagFoldPts: Object.freeze([[52, -68], [98, -60], [52, -48]] as const),
});

export const ITEM_PATHS = Object.freeze({
  cape: polygon(ITEMS.capePts),
  capeFold: polygon(ITEMS.capeFoldPts),
  capeHem: polygon(ITEMS.capeHemPts),
  capeFoldHem: polygon(ITEMS.capeFoldHemPts),
  helmetDome:
    `M${-ITEMS.helmetRadius} ${-62}A${ITEMS.helmetRadius} ${ITEMS.helmetRadius} 0 0 1 ${ITEMS.helmetRadius} ${-62}` +
    `L${ITEMS.helmetRadius} ${ITEMS.helmetSkirtY}L${-ITEMS.helmetRadius} ${ITEMS.helmetSkirtY}z`,
  helmetCrest: polygon([
    [-ITEMS.crestTopHalf, ITEMS.crestTopY], [ITEMS.crestTopHalf, ITEMS.crestTopY],
    [ITEMS.crestBaseHalf, -62], [-ITEMS.crestBaseHalf, -62],
  ]),
  lanternLoop:
    `M${ITEMS.lanternX} ${ITEMS.lanternTopY - ITEMS.lanternLoopRadius}` +
    `A${ITEMS.lanternLoopRadius} ${ITEMS.lanternLoopRadius} 0 0 1 ${ITEMS.lanternX + ITEMS.lanternLoopRadius} ${ITEMS.lanternTopY}` +
    `L${ITEMS.lanternX - ITEMS.lanternLoopRadius} ${ITEMS.lanternTopY}z`,
  bootLeft: polygon([
    [-ITEMS.bootOuter, ITEMS.bootTopY], [-ITEMS.bootInner, ITEMS.bootTopY],
    [-ITEMS.bootInner, 112], [-ITEMS.bootOuter - ITEMS.bootFlare, 112],
  ]),
  bootRight: polygon([
    [ITEMS.bootInner, ITEMS.bootTopY], [ITEMS.bootOuter, ITEMS.bootTopY],
    [ITEMS.bootOuter + ITEMS.bootFlare, 112], [ITEMS.bootInner, 112],
  ]),
  flag: polygon(ITEMS.flagPts),
  flagFold: polygon(ITEMS.flagFoldPts),
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

/**
 * 🎭 **⟦19/09 · `C-0731` · `T-432` · `D-269` הכרעה ② · `38 § 1א`⟧ הדמות מגבה.**
 *
 * ⚠️ **זו הכרעת בעלים שנרשמה לפני שנגעו בקוד.** `38 § 1` פסק «חזיתי, ⛔ לא מגב»,
 * והנימוק היה נכון: דמות מגבה מסתירה את החזה ואת הפנים — שתי משבצות הציוד היקרות.
 * ‏`38 § 1א` מצמצם אותו ⛔ ואינו מוחק אותו: **חזיתי הוא ברירת המחדל, ובקרב בלבד —
 * מגב.** החזה והפנים נראים ב**בית**, ב**בחירת דמות** וב**סיכום**, שהם בדיוק שלושת
 * המסכים שבהם הלומד בוחן ציוד.
 *
 * 🔬 **ומה שזה סוגר ⛔ אינו רק בקשה של רוי:** `38 § 5` סימן את «האביר **מגבו**»
 * שברנדר כ«מוחלף», בעוד **ארבעת** רנדרי הקרב מציירים גיבור מגבו ⇒ המסמך והרנדר
 * סתרו זה את זה מאז 23/08.
 *
 * ⛔ **ו⛔ אין כאן דמות שנייה:** אותו שלד, אותם עוגנים. מה שמשתנה הוא ⓐ **אילו
 * שכבות מצוירות**, ⓑ **כמה מספרים** — והם כאן, כמו כל מספר אחר בריפו.
 */
export const BACK = Object.freeze({
  /**
   * 💇 מסת שיער העורף. 🔬 **נגזרת ⛔ ולא נבחרת:** הראש הוא עיגול ברדיוס
   * `HEAD_RADIUS` על `ANCHORS.head` ⇒ המסה היא אותו עיגול, מעט שטוח, כי מאחור
   * רואים **קודקוד** ⛔ ולא פרופיל.
   */
  hairCapRx: HEAD_RADIUS,
  hairCapRy: HEAD_RADIUS - 3,
  hairCapY: -64,
  /**
   * 🦢 העורף — הקטע שבין תחתית הראש לצווארון. ⛔ בלעדיו הראש **צף**, וזו בדיוק
   * הסיבה שהצווארון נוסף בחזית (`WARRIOR.collar*`).
   */
  napeHalfWidth: 11, napeTopY: -40, napeH: 12, napeR: 4,
  /**
   * 🦴 תפר עמוד השדרה — ⛔ **הפרט היחיד שהופך «גב» ל«גב»**, ⛔ ולא ל«חזית בלי
   * פנים». 🔬 נגזר מגבולות הגוף: `ANCHORS.body.y ± BODY_SIZE.height / 2`
   * ⇒ ‏`-27…59`, והתפר יושב בפנים.
   */
  spineHalfWidth: 3, spineTopY: -24, spineH: 62, spineR: 3,
});

/**
 * ⛔ **השכבות ש⛔ אינן מצוירות מגב.** ⛔ אחת, ⛔ ולא רשימה שנוח להאריך: סמל החזה
 * הוא **חזית**, ⇒ הוא ⛔ אינו נראה מאחור. כל השאר — הגוף, החגורה, הרגליים,
 * הכתפיות — נראים **משני הכיוונים**, ולהסתיר אותם היה בונה דמות שנייה.
 */
export const BACK_HIDDEN_LAYERS: readonly Layer[] = Object.freeze(['chest'] as const);

/**
 * 🪞 **השיקוף של משבצות היד.** ⛔ זה ⛔ אינו «הופכים את הדמות»: שיקוף הדמות כולה
 * היה הופך גם את תפר הגב ואת שיער העורף, והם ⛔ אינם סימטריים במקרה — הם **אותה
 * צורה**. ⇒ מה שמשתקף הוא **מי מחזיק מה**: יד ימין של הדמות נראית מאחור בצד
 * שמאל של המסך.
 * ⛔ **והמחרוזת כאן ⛔ ולא ברכיב**, מאותה סיבה שכל קואורדינטה אחרת כאן.
 */
export const BACK_MIRROR = 'scale(-1,1)';
/** משבצות היד — ⛔ ואין שלישית. */
export const BACK_MIRRORED_LAYERS: readonly Layer[] = Object.freeze(['mainHand', 'offHand'] as const);

/**
 * 🛡️ **⟦19/09 · `C-0737` · `T-438` · `D-270` ②⟧ ההגנה המוצבת — הצורה.**
 *
 * ⚠️ **הכרעת רוי, מילה במילה:** «פשוט **לפי סוג הדמות**. אם זה מכשף אז **שדה**,
 * אם זה לוחם אז **חומה או מגן מונח על הקרקע** כזה.»
 *
 * ⛔ **ו⛔ אין כאן שכבה חדשה:** `38 § 5` אוסר להמציא שכבות, ו-`LAYER_ORDER`
 * נשאר **אחת־עשרה**. ההגנה היא צומת של ה**במה** — אח של סימן הרצפה — ⛔ ולא
 * שכבה של הדמות. ⇒ היא מצוירת ב-`viewBox` משלה, ⛔ ואינה נוגעת בעוגנים.
 *
 * 🔬 **והמידות נגזרות מהנתיב, ⛔ ולא נבחרות:** רוחב הנתיב בחזית הרצפה הוא
 * שליש מרוחב הבמה, ⇒ ההגנה יושבת בתוכו ⛔ ואינה גולשת לנתיב השכן.
 */
export const GUARD_VIEW = Object.freeze({ width: 100, height: 52 });

/** ⛔ שלוש צורות, ⛔ ולא שש — כל דמות **מצביעה** על אחת מהן. */
export type GuardKind = 'wall' | 'field' | 'stakes';

export const GUARD_PATHS: Readonly<Record<GuardKind, readonly string[]>> = Object.freeze({
  /**
   * 🧱 **חומה** — לוחם · שריונאי · גולם. שתי שורות לבנים בהיסט, בדיוק הדפוס
   * שהחומה של `ArenaScene` כבר משתמשת בו ⇒ הזירה נקראת כמקום אחד.
   */
  wall: Object.freeze([
    polygon([[6, 52], [12, 20], [88, 20], [94, 52]]),
    polygon([[12, 20], [18, 8], [82, 8], [88, 20]]),
  ]),
  /**
   * 🔮 **שדה אנרגיה** — קוסם · צל. כיפה, ⛔ ולא מלבן: הצל שלה על הרצפה הוא
   * מה שאומר «זה עומד כאן», ⛔ והקשת היא מה שאומר «זה ⛔ אינו מוצק».
   */
  field: Object.freeze([
    `M6 52A44 44 0 0 1 94 52Z`,
    `M20 52A30 30 0 0 1 80 52Z`,
  ]),
  /**
   * 🪵 **יתדות** — צייד. שני מוטות מוצלבים, ⛔ ולא חומה: הצייד ⛔ אינו בונה,
   * הוא **מציב מלכודת**.
   */
  stakes: Object.freeze([
    polygon([[14, 52], [24, 6], [32, 8], [22, 52]]),
    polygon([[68, 8], [76, 6], [86, 52], [78, 52]]),
    polygon([[16, 26], [84, 20], [84, 28], [16, 34]]),
  ]),
});
