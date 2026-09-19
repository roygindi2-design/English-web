import { describe, expect, it } from 'vitest';
import {
  BELT_SIZE,
  BODY_SIZE,
  HEAD_RADIUS,
  LAYER_ORDER,
  MIRRORED_SLOTS,
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
