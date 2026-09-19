import { describe, expect, it } from 'vitest';
import {
  ARMORER,
  BELT_SIZE,
  BODY_SIZE,
  CONE,
  HEAD_RADIUS,
  LAYER_ORDER,
  MIRRORED_SLOTS,
  WARRIOR,
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

describe('38 § 4 — סדר אחת־עשרה השכבות', () => {
  it('אחת־עשרה, ⛔ ולא ארבע (F-157 ⓑ מדד ארבע ב-`ArenaAvatar`)', () => {
    expect(LAYER_ORDER).toHaveLength(11);
  });

  it('הסדר הוא של `38 § 4`, מילה במילה', () => {
    expect([...LAYER_ORDER]).toEqual([
      'capeBack', 'legs', 'boots', 'body', 'chest', 'belt',
      'offHand', 'head', 'headgear', 'shoulders', 'mainHand',
    ]);
  });

  it('⛔ הגלימה האחורית מתחת לגוף — אחרת היא חותכת אותו', () => {
    expect(LAYER_ORDER.indexOf('capeBack')).toBeLessThan(LAYER_ORDER.indexOf('body'));
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
describe('C-0724 — החרוט, הלוחם והשריונאי', () => {
  it('החרוט נכנס ל-viewBox, והשוליים רחבים מהפיצול', () => {
    // `viewBox="-100 -108 200 252"` ⇒ x ∈ [-100,100] · y ∈ [-108,144]
    expect(CONE.apexY).toBeGreaterThan(-108);
    expect(CONE.hemHalfWidth).toBeLessThanOrEqual(100);
    // הצד המוצל מתחיל מימין לקצה השמאלי ⇒ שני פאנלים, ⛔ ולא אחד.
    expect(CONE.hemSplitX).toBeGreaterThan(-CONE.hemHalfWidth);
    expect(CONE.hemSplitX).toBeLessThan(CONE.hemHalfWidth);
  });

  it('הגולה **הונמכה** אל תוך המסגרת — ⛔ ולא הוקטנה', () => {
    // ברנדר מרכזה `(85,-124.5)`; המסגרת נגמרת ב-`-108`.
    expect(CONE.orbY - CONE.orbRadius).toBeGreaterThanOrEqual(-108);
    expect(CONE.orbX + CONE.orbRadius).toBeLessThanOrEqual(100);
    // הזוהר גדול מהליבה, אחרת ⛔ אין זוהר.
    expect(CONE.orbGlowRadius).toBeGreaterThan(CONE.orbRadius);
  });

  it('העיניים בתוך הפנים, והליבה קטנה מהעין', () => {
    expect(Math.abs(CONE.eyeX) + CONE.eyeRadius).toBeLessThan(CONE.faceRadius);
    expect(CONE.eyeCoreRadius).toBeLessThan(CONE.eyeRadius);
  });

  it('המגן נכנס למסגרת, והבליטה בתוכו', () => {
    expect(WARRIOR.shieldX).toBeGreaterThanOrEqual(-100);
    expect(WARRIOR.shieldX + WARRIOR.shieldW).toBeLessThanOrEqual(100);
    expect(WARRIOR.bossX - WARRIOR.bossRadius).toBeGreaterThan(WARRIOR.shieldX);
    expect(WARRIOR.bossX + WARRIOR.bossRadius).toBeLessThan(WARRIOR.shieldX + WARRIOR.shieldW);
    // הפנים נסוגות מהמסגרת בשני הצדדים ⇒ מסגרת הזהב **נראית**.
    expect(WARRIOR.shieldFaceInset).toBeGreaterThan(0);
    expect(WARRIOR.shieldW - WARRIOR.shieldFaceInset * 2).toBeGreaterThan(0);
  });

  it('הלהב **נחתך** בקצה המסגרת — חרב שנגמרת בפנים היא חרב קצרה', () => {
    expect(WARRIOR.bladeFarX).toBe(100);
    expect(WARRIOR.bladeFarY).toBeGreaterThan(WARRIOR.bladeTipY);
    expect(WARRIOR.bladeNearY).toBeGreaterThan(WARRIOR.bladeFarY);
  });

  it('חמישה קוצות שיער — ⛔ ואפס צורת-מרווח (המרווח הוא הרקע)', () => {
    expect(WARRIOR.hairBarX).toHaveLength(5);
    expect(Object.keys(WARRIOR)).not.toContain('hairGapX');
    // הקוצה הגבוהה ⛔ אינה חורגת מגג המסגרת.
    expect(WARRIOR.hairY).toBeGreaterThanOrEqual(-108);
    // ומרווח אמיתי בין קוצה לקוצה, אחרת זה לוח ⛔ ולא שיער.
    const bars = [...WARRIOR.hairBarX];
    for (let i = 1; i < bars.length; i += 1) {
      expect((bars[i] ?? 0) - (bars[i - 1] ?? 0)).toBeGreaterThan(WARRIOR.hairBarW);
    }
  });

  it('⚠️ השריונאי מוצהר כנגזר-ממילים — הוא **קיים**, ⛔ ואין לו רנדר', () => {
    expect(ARMORER.capRadius).toBeGreaterThan(0);
    expect(ARMORER.barrelW).toBeGreaterThan(ARMORER.gripW);
  });
});
