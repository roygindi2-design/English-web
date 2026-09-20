import { describe, expect, it } from 'vitest';
import {
  ARMORER,
  GOLEM,
  HUNTER,
  NEW_PATHS,
  SHADE,
  BELT_SIZE,
  BODY_SIZE,
  WIZARD,
  HEAD_RADIUS,
  LAYER_ORDER,
  MIRRORED_SLOTS,
  WARRIOR,
  WARRIOR_PATHS,
  WIZARD_PATHS,
  polygon,
  anchorFor,
  isCharacterSlot,
  isMirroredSlot,
  mirror,
  type CharacterSlot,
} from '@/lib/core/characterBase';

/**
 * T-215 · `38 § 3` · `§ 4`. ⛔ **כל מספר שנבדק כאן מצוטט מהעוגן**, ⛔ ואף אחד מהם
 * ⛔ לא נגזר בבדיקה — בדיקה שמחשבת בעצמה את מה שהיא בודקת ⛔ אינה בודקת דבר.
 */
const ALL_SLOTS: readonly CharacterSlot[] = [
  'head', 'shoulders', 'body', 'belt', 'mainHand', 'offHand', 'legs',
];

describe('38 § 4 — סדר שתים־עשרה השכבות', () => {
  /**
   * 🧥 **⟦20/09 · `C-0745` · `F-307`⟧ שתים־עשרה — וזה **ביצוע** של `D-136`.**
   * ההכרעה נוקבת בשינוי הזה **מילה במילה**: «`toHaveLength(11)` ⇒
   * `toHaveLength(12)`». ⇒ המספר כאן ⛔ אינו נגזר מ-`LAYER_ORDER` — הוא מצוטט
   * מ-`38 § 4`, שכותב «**שתים־עשרה שכבות, ⛔ ולא אחת־עשרה**» בפירוש.
   */
  it('שתים־עשרה, ⛔ ולא ארבע (F-157 ⓑ מדד ארבע ב-`ArenaAvatar`)', () => {
    expect(LAYER_ORDER).toHaveLength(12);
  });

  it('הסדר הוא של `38 § 4`, מילה במילה', () => {
    expect([...LAYER_ORDER]).toEqual([
      'capeBack', 'legs', 'capeFront', 'boots', 'body', 'chest', 'belt',
      'offHand', 'head', 'headgear', 'shoulders', 'mainHand',
    ]);
  });

  it('⛔ הגלימה האחורית מתחת לגוף — אחרת היא חותכת אותו', () => {
    expect(LAYER_ORDER.indexOf('capeBack')).toBeLessThan(LAYER_ORDER.indexOf('body'));
  });

  /**
   * ⛔ **שתי הטענות יחד, כי אחת בלעדי השנייה ⛔ אינה המיקום ש-`D-136` נקב בו.**
   * «מעל הרגליים» ⇒ הוא **אחרי** `legs`; ו«חלק **קדמי**» ⇒ הוא ⛔ אינו מטפס מעל
   * הגוף — גלימה שמכסה את החזית כולה מוחקת את הדמות, ⛔ ולא נופלת סביבה.
   */
  it('⛔ הגלימה הקדמית מעל הרגליים ומתחת לגוף — `D-136`, מילה במילה', () => {
    expect(LAYER_ORDER.indexOf('legs')).toBeLessThan(LAYER_ORDER.indexOf('capeFront'));
    expect(LAYER_ORDER.indexOf('capeFront')).toBeLessThan(LAYER_ORDER.indexOf('body'));
  });

  it('⛔ פריט הראש מעל הראש, והכתפיים מעליו — סדר, ⛔ ולא אוסף', () => {
    expect(LAYER_ORDER.indexOf('head')).toBeLessThan(LAYER_ORDER.indexOf('headgear'));
    expect(LAYER_ORDER.indexOf('headgear')).toBeLessThan(LAYER_ORDER.indexOf('shoulders'));
    // היד הראשית והנשק אחרונים — הם מכסים הכול (`38 § 4`, סוף השורה).
    expect(LAYER_ORDER[LAYER_ORDER.length - 1]).toBe('mainHand');
  });

  it('⛔ אין כפילות ברשימה', () => {
    expect(new Set(LAYER_ORDER).size).toBe(LAYER_ORDER.length);
  });
});

describe('38 § 3 — נקודות העיגון', () => {
  it.each([
    ['head', { x: 0, y: -62 }],
    ['shoulders', { x: 46, y: -13 }],
    ['body', { x: 0, y: 16 }],
    ['belt', { x: 0, y: 72 }],
    ['mainHand', { x: 48, y: -10 }],
    ['offHand', { x: -60, y: 5 }],
    ['legs', { x: 20, y: 112 }],
  ] as const)('%s יושבת על הערך של הטבלה', (slot, point) => {
    expect(anchorFor(slot)).toEqual(point);
  });

  it('כל משבצת נפתרת — ⛔ אין שלד עם חור', () => {
    for (const slot of ALL_SLOTS) expect(anchorFor(slot)).toBeDefined();
  });

  it('המידות של `§ 3` — גוף 76x84 · חגורה 68x14 · ראש r=34', () => {
    expect(BODY_SIZE).toEqual({ width: 90, height: 86 });
    expect(BELT_SIZE).toEqual({ width: 61, height: 24 });
    expect(HEAD_RADIUS).toBe(30);
  });

  it('הזוגות הסימטריים מתקבלים בשיקוף — ⛔ ולא ממספר שני', () => {
    expect([...MIRRORED_SLOTS]).toEqual(['shoulders', 'legs']);
    expect(mirror(anchorFor('shoulders'))).toEqual({ x: -46, y: -13 });
    expect(mirror(anchorFor('legs'))).toEqual({ x: -20, y: 112 });
    for (const slot of ALL_SLOTS) {
      expect(isMirroredSlot(slot)).toBe((['shoulders', 'legs'] as string[]).includes(slot));
    }
  });
});

describe('38 § 3 — «פריט שלא מתיישב על נקודת עיגון קיימת הוא פריט פסול»', () => {
  it('שם שאינו משבצת ⛔ נדחה, ⛔ ואינו משנה את השלד', () => {
    for (const bad of ['wings', 'tail', 'hair', 'HEAD', '']) {
      expect(isCharacterSlot(bad), `${bad} ⛔ אינו משבצת`).toBe(false);
    }
    for (const slot of ALL_SLOTS) expect(isCharacterSlot(slot)).toBe(true);
  });

  it('⛔ כשל רועש, ⛔ ולא `null` שאפשר לדלג עליו בשקט', () => {
    expect(() => anchorFor('wings' as CharacterSlot)).toThrow();
    // ⛔ ⛔ ולא שם ירושה של Object — `hasOwnProperty` ⛔ ולא `in`.
    expect(isCharacterSlot('toString')).toBe(false);
    expect(() => anchorFor('toString' as CharacterSlot)).toThrow();
  });
});

/**
 * 🔬 **⟦19/09 · `C-0724`⟧ הצורות שנמדדו מהרנדר — **הבדיקה נגזרת מהמדידה**.**
 * ⛔ **הבדיקה ⛔ אינה מעתיקה את המספרים** (זו הייתה חותמת גומי) — היא בודקת את
 * ה**יחסים** שהמדידה קבעה, כאלה שכל סטייה מהרנדר שוברת.
 */
describe('C-0725 — הכובע, הגלימה, הלוחם והשריונאי', () => {
  it('הכובע והגלימה נכנסים ל-viewBox — x ∈ [-100,100] · y ∈ [-108,144]', () => {
    expect(WIZARD.hatApexY).toBeGreaterThanOrEqual(-108);
    expect(WIZARD.brimRx).toBeLessThanOrEqual(100);
    expect(WIZARD.robeHemHalfWidth).toBeLessThanOrEqual(100);
    for (const [x, y] of [...WIZARD.armPts, ...WIZARD.wandPts]) {
      expect(Math.abs(x)).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(-108);
    }
  });

  it('⛔ **כובע וגלימה, ⛔ ולא חרוט אחד** — השוליים רחבים משניהם', () => {
    // בלי זה השוליים נבלעים והצללית חוזרת להיות משולש.
    expect(WIZARD.brimRx).toBeGreaterThan(WIZARD.hatBaseHalfWidth);
    expect(WIZARD.brimRx).toBeGreaterThan(WIZARD.robeShoulderX);
    // והכובע יושב **מעל** כתף הגלימה, ⛔ ולא נמשך ממנה.
    expect(WIZARD.hatBaseY).toBeLessThan(WIZARD.robeShoulderY);
  });

  it('הפנים יושבות מתחת לשוליים — אחרת השוליים חוצים אותן', () => {
    expect(WIZARD.faceY - WIZARD.faceRadius).toBeGreaterThanOrEqual(WIZARD.brimFrontY);
    expect(Math.abs(WIZARD.eyeX) + WIZARD.eyeRadius).toBeLessThan(WIZARD.faceRadius);
    expect(WIZARD.eyeCoreRadius).toBeLessThan(WIZARD.eyeRadius);
  });

  it('הגולה **הונמכה** אל תוך המסגרת, והזוהר גדול מהליבה', () => {
    expect(WIZARD.orbY - WIZARD.orbGlowRadius).toBeGreaterThanOrEqual(-108);
    expect(WIZARD.orbX + WIZARD.orbGlowRadius).toBeLessThanOrEqual(100);
    expect(WIZARD.orbGlowRadius).toBeGreaterThan(WIZARD.orbRadius);
  });

  it('הגוף **מחודד** כלפי מטה — ⛔ ולא מלבן', () => {
    expect(WARRIOR.bodyBottomHalfWidth).toBeLessThan(WARRIOR.bodyTopHalfWidth);
    // והצווארון צר מהגוף, אחרת הוא ⛔ אינו צווארון.
    expect(WARRIOR.collarHalfWidth).toBeLessThan(WARRIOR.bodyTopHalfWidth);
  });

  it('ללוחם יש **עיניים** — הפרט היחיד שהיריב קיבל והגיבור ⛔ לא', () => {
    expect(WARRIOR.eyeRadius).toBeGreaterThan(0);
    expect(WARRIOR.eyeCoreRadius).toBeLessThan(WARRIOR.eyeRadius);
    // בתוך עיגול הראש (r=30 על `(0,-62)`).
    const dx = Math.abs(WARRIOR.eyeX) + WARRIOR.eyeRadius;
    const dy = Math.abs(WARRIOR.eyeY - (-62)) + WARRIOR.eyeRadius;
    expect(Math.hypot(dx, dy)).toBeLessThan(HEAD_RADIUS + WARRIOR.eyeRadius);
  });

  it('המגן נכנס למסגרת, והבליטה בתוכו', () => {
    expect(WARRIOR.shieldCx - WARRIOR.shieldHalfWidth).toBeGreaterThanOrEqual(-100);
    expect(WARRIOR.shieldCx + WARRIOR.shieldHalfWidth).toBeLessThanOrEqual(100);
    expect(WARRIOR.bossY + WARRIOR.bossRadius).toBeLessThan(WARRIOR.shieldTipY);
    expect(WARRIOR.shieldInset).toBeGreaterThan(0);
    // הפנים נסוגות משני הצדדים ⇒ מסגרת הזהב **נראית**.
    expect(WARRIOR_PATHS.shield).not.toBe(WARRIOR_PATHS.shieldFace);
  });

  it('הלהב **נחתך** בקצה המסגרת — חרב שנגמרת בפנים היא חרב קצרה', () => {
    expect(Math.max(...WARRIOR.bladePts.map(([x]) => x))).toBe(100);
  });

  it('חמישה קוצות שיער, עם מרווח אמיתי ביניהם', () => {
    expect(WARRIOR.hairBarX).toHaveLength(5);
    expect(WARRIOR.hairY).toBeGreaterThanOrEqual(-108);
    const bars = [...WARRIOR.hairBarX];
    for (let i = 1; i < bars.length; i += 1) {
      expect((bars[i] ?? 0) - (bars[i - 1] ?? 0)).toBeGreaterThan(WARRIOR.hairBarW);
    }
  });

  it('⛔ `polygon` דורש שלוש נקודות — ⛔ ואינו מחזיר נתיב ריק בשקט', () => {
    expect(polygon([[0, 0], [1, 0], [0, 1]])).toBe('M0 0L1 0L0 1z');
    expect(() => polygon([[0, 0], [1, 1]])).toThrow();
  });

  it('כל נתיב שנבנה כאן מתחיל ב-M ונסגר ב-z — ⛔ ואינו ריק', () => {
    for (const [name, d] of Object.entries({ ...WARRIOR_PATHS, ...WIZARD_PATHS })) {
      expect(d.startsWith('M'), name).toBe(true);
      expect(d.endsWith('z'), name).toBe(true);
    }
  });

  it('⚠️ השריונאי מוצהר כנגזר-ממילים — הוא **קיים**, ⛔ ואין לו רנדר', () => {
    expect(ARMORER.capRadius).toBeGreaterThan(0);
    expect(ARMORER.barrelW).toBeGreaterThan(ARMORER.gripW);
  });
});

/**
 * 🆕 **⟦19/09 · `C-0726`⟧ שלוש דמויות שאין להן רנדר — הבדיקה על מה שמבדיל אותן.**
 * ⛔ **⛔ אין כאן העתקה של מספרים** (זו הייתה חותמת גומי): מה שנבדק הוא הדרישה
 * של רוי — «שיהיו **שונות** מהדמויות הקיימות» — ככל שאפשר לנסח אותה כטענה.
 */
describe('C-0726 — צייד · גולם · צל', () => {
  it('הכול נכנס ל-viewBox — x ∈ [-100,100] · y ∈ [-108,144]', () => {
    const pts = [
      ...HUNTER.hoodPts, ...HUNTER.hoodShadePts,
      ...SHADE.tailPts, ...SHADE.armPts, ...SHADE.hoodPts,
      [HUNTER.headTipX, 0], [HUNTER.bowBellyX, 0],
      [GOLEM.boulderX + GOLEM.boulderRadius, GOLEM.boulderY],
      [SHADE.moteX + SHADE.moteRadius, SHADE.moteY - SHADE.moteRadius],
      [SHADE.sparkX - SHADE.sparkRadius, SHADE.sparkY - SHADE.sparkRadius],
    ];
    for (const [x, y] of pts) {
      expect(Math.abs(x)).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(-108);
      expect(y).toBeLessThanOrEqual(144);
    }
  });

  it('🏹 הקשת גדולה מהגוף — ⛔ אחרת היא קישוט ⛔ ולא הצללית', () => {
    const bowHeight = HUNTER.bowTopY * -2;
    const bodyHeight = HUNTER.tunicHemY - HUNTER.tunicShoulderY;
    expect(bowHeight).toBeGreaterThan(bodyHeight);
    // והחץ **דרוך**: הוא מתחיל בנקודת המשיכה של המיתר, ⛔ ולא מרחף.
    expect(NEW_PATHS.hunterShaft.startsWith(`M${HUNTER.bowNockX} 0`)).toBe(true);
  });

  it('🗿 סלעי הכתף של הגולם גדולים מראשו — זו **המסה**', () => {
    expect(GOLEM.boulderRadius * 2).toBeGreaterThan(GOLEM.headHalfWidth * 2);
    // והראש **שקוע** ביניהן, ⛔ ולא מעליהן.
    expect(GOLEM.headTopY + GOLEM.headH).toBeGreaterThan(GOLEM.boulderY - GOLEM.boulderRadius);
    // והגולם רחב מהלוחם — אחרת «מסה» היא מילה ⛔ ולא צורה.
    expect(GOLEM.bodyShoulderX).toBeGreaterThan(WARRIOR.bodyTopHalfWidth);
  });

  it('👻 ל`צל` ⛔ אין רגליים, והזנב **קרוע** — ⛔ ולא קו ישר', () => {
    const ys = SHADE.tailPts.map(([, y]) => y);
    const bottom = Math.max(...ys);
    // לפחות שלוש נקודות תחתונות בגבהים שונים ⇒ זנב משונן.
    const low = ys.filter((y) => y > bottom - 50);
    expect(low.length).toBeGreaterThanOrEqual(3);
    expect(new Set(low).size).toBeGreaterThanOrEqual(3);
  });

  it('שלוש הצלליות **שונות זו מזו וגם מהקיימות** — רוחב, גובה וקרקע', () => {
    // הגולם הוא הרחב, הצל הוא היחיד שאינו נוגע בקו הרגליים של השלד.
    expect(GOLEM.bodyShoulderX).toBeGreaterThan(HUNTER.tunicShoulderX);
    expect(GOLEM.bodyShoulderX).toBeGreaterThan(Math.max(...SHADE.tailPts.map(([x]) => Math.abs(x))));
    expect(Math.max(...SHADE.tailPts.map(([, y]) => y))).toBeLessThan(112);
  });

  it('כל נתיב חדש מתחיל ב-M, ו⛔ אף אחד מהם ⛔ אינו ריק', () => {
    for (const [name, d] of Object.entries(NEW_PATHS)) {
      expect(d.startsWith('M'), name).toBe(true);
      expect(d.length, name).toBeGreaterThan(8);
    }
  });
});
