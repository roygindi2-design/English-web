import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  BOSS_EVERY,
  HOME_SLOTS,
  ITEM_SLOTS,
  SLOT_LABELS_HE,
  bossTrack,
  closetTiles,
  homeSlots,
  winsToBoss,
} from './arenaHome';
import { ARCADE_ITEMS } from './arcadeResult';

describe('bossTrack — `37 § 9`, and the render is the fixture', () => {
  it('⛔ מצייר בדיוק את מה ש-`render_video_B.py:71` מצייר עבור 3 ניצחונות', () => {
    // BOSS_STATES = ["done", "done", "done", "current", "boss"]
    expect(bossTrack(3)).toEqual([
      { state: 'done', isBoss: false },
      { state: 'done', isBoss: false },
      { state: 'done', isBoss: false },
      { state: 'current', isBoss: false },
      { state: 'pending', isBoss: true },
    ]);
  });

  it('⛔ הכיתוב של הרנדר נגזר מאותו מספר — «נותרו 2»', () => {
    expect(winsToBoss(3)).toBe(2);
  });

  it('מחזור: 5 ניצחונות מחזירים את המסלול להתחלה, ⛔ ולא לצומת שישית', () => {
    expect(bossTrack(5)).toEqual(bossTrack(0));
    expect(bossTrack(0)[0]).toEqual({ state: 'current', isBoss: false });
    expect(winsToBoss(0)).toBe(BOSS_EVERY);
    expect(winsToBoss(5)).toBe(BOSS_EVERY);
  });

  it('הצומת האחרונה נכבשת: 4 ניצחונות ⇒ צומת הבוס היא הנוכחית ו⛔ נשארת בוס', () => {
    expect(bossTrack(4)[4]).toEqual({ state: 'current', isBoss: true });
    expect(winsToBoss(4)).toBe(1);
  });

  it('⛔ תמיד חמש צמתים, וקלט פגום ⛔ אינו זורק — הזירה אינה כלי אבחון', () => {
    for (const w of [-7, 0, 1, 13, 4321, Number.NaN]) {
      expect(bossTrack(w)).toHaveLength(BOSS_EVERY);
    }
    expect(bossTrack(-7)).toEqual(bossTrack(0));
    expect(bossTrack(Number.NaN)).toEqual(bossTrack(0));
  });
});

describe('המשבצות — `38 § 2` ו-D-135, ⛔ ולא שמות פריטים (D-132)', () => {
  /**
   * ⚠️ **D-135 (PM, C-0338) דרס את הכרעת-הביניים של DEV שהתוכנית נשענה עליה, וזו
   * הסיבה שהרשימה כאן ⛔ אינה זו שבתוכנית:** התוכנית קפאה על
   * `mainHand · offHand · head · body` תחת `RULES § 0.22`, ו-D-135 מדד ש-**0 מתוך 5**
   * הפריטים ב-`ARCADE_ITEMS` יכולים למלא `mainHand` ⇒ `mainHand` יורדת ו-`legs`
   * נכנסת **באותו מקום**, מחרוזת אחת. ⛔ הכרעת PM גוברת על התוכנית.
   */
  it('⛔ ארבע משבצות, בסדר הימין-לשמאל של הרנדר, אחרי D-135', () => {
    expect(HOME_SLOTS).toEqual(['legs', 'offHand', 'head', 'body']);
    expect(HOME_SLOTS).not.toContain('mainHand');
  });

  it('⛔ אף שם פריט של הרנדר ⛔ אינו נכנס לקוד (D-132 סעיף 3)', () => {
    const src = readFileSync(new URL('./arenaHome.ts', import.meta.url), 'utf8');
    for (const banned of ['חרב הניצוץ', 'מגן אבן', 'לחש אש', 'שריון קל', 'להב הסער']) {
      expect(src).not.toContain(banned);
    }
  });

  it('לכל פריט חי יש משבצת או `null` מוצהר, ו⛔ אין משבצת שאינה ב-`38 § 2`', () => {
    for (const item of ARCADE_ITEMS) {
      const slot = ITEM_SLOTS[item];
      if (slot === null) continue;
      expect(SLOT_LABELS_HE[slot]).toBeTypeOf('string');
    }
  });

  it('⛔ `banner` ⛔ אינה משבצת ציוד (D-135) — היא `null`, ⛔ ולא משבצת מומצאת', () => {
    expect(ITEM_SLOTS.banner).toBeNull();
  });

  it('משבצת ריקה היא `null`, ⛔ ולא מחרוזת מומצאת', () => {
    expect(homeSlots([])).toEqual([
      { slot: 'legs', label: 'רגליים', item: null },
      { slot: 'offHand', label: 'יד משנית', item: null },
      { slot: 'head', label: 'ראש', item: null },
      { slot: 'body', label: 'גוף', item: null },
    ]);
  });

  it('פריט שנפתח מאכלס את משבצתו; שם זר ופריט בלי משבצת מדולגים בשקט', () => {
    const slots = homeSlots(['helmet', 'banner', 'not-an-item', 'boots']);
    expect(slots.find((s) => s.slot === 'head')?.item).toBe('helmet');
    expect(slots.find((s) => s.slot === 'legs')?.item).toBe('boots');
    expect(slots.find((s) => s.slot === 'offHand')?.item).toBeNull();
    expect(slots.find((s) => s.slot === 'body')?.item).toBeNull();
  });

  it('שלוש מארבע המשבצות נמלאות בפריט שנקרא בשם המשבצת — המדידה של D-135', () => {
    expect(ITEM_SLOTS.helmet).toBe('head');
    expect(ITEM_SLOTS.cape).toBe('body');
    expect(ITEM_SLOTS.boots).toBe('legs');
    expect(ITEM_SLOTS.lantern).toBe('offHand');
  });

  it('⛔ כל ארבע המשבצות ניתנות למילוי — ⛔ אין חריץ שנשאר ריק לנצח (D-135)', () => {
    const fillable = new Set(
      ARCADE_ITEMS.map((item) => ITEM_SLOTS[item]).filter((slot) => slot !== null),
    );
    for (const slot of HOME_SLOTS) expect(fillable.has(slot)).toBe(true);
  });
});

describe('closetTiles — `T-487` · `D-292`: הארון אומר מה יבוא ומתי', () => {
  it('⛔ אריח לכל פריט ב-`ARCADE_ITEMS`, בסדר שלהם — כולל `banner`', () => {
    expect(closetTiles([], 1).map((t) => t.item)).toEqual([...ARCADE_ITEMS]);
  });

  it('פיקסטורת `/dev/arcade/home` (רמה 7 · helmet·lantern·banner) ⇒ cape=8 · boots=9', () => {
    expect(closetTiles(['helmet', 'lantern', 'banner'], 7)).toEqual([
      { item: 'helmet', held: true, unlockLevel: null },
      { item: 'cape', held: false, unlockLevel: 8 },
      { item: 'lantern', held: true, unlockLevel: null },
      { item: 'boots', held: false, unlockLevel: 9 },
      { item: 'banner', held: true, unlockLevel: null },
    ]);
  });

  it('⛔ תרחיש הכישלון: הסדר הוא הסדר של `arcadeResult` — ⛔ לא הפוך', () => {
    // arcadeResult.ts:140 מעניק את הפריט הראשון שאינו מוחזק בכל עליית רמה.
    const tiles = closetTiles(['helmet'], 3);
    expect(tiles.find((t) => t.item === 'cape')?.unlockLevel).toBe(4);
    expect(tiles.find((t) => t.item === 'lantern')?.unlockLevel).toBe(5);
    expect(tiles.find((t) => t.item === 'boots')?.unlockLevel).toBe(6);
    expect(tiles.find((t) => t.item === 'banner')?.unlockLevel).toBe(7);
  });

  it('הכול מוחזק ⇒ 0 נעולים', () => {
    const tiles = closetTiles([...ARCADE_ITEMS], 9);
    expect(tiles.filter((t) => !t.held)).toHaveLength(0);
    expect(tiles.every((t) => t.unlockLevel === null)).toBe(true);
  });

  it('`NaN` / שלילי ⇒ רמה 1 כבסיס', () => {
    for (const bad of [Number.NaN, -3, 0]) {
      expect(closetTiles([], bad)[0]).toEqual({ item: 'helmet', held: false, unlockLevel: 2 });
    }
  });

  it('⛔ שם מחוץ ל-`ARCADE_ITEMS` מדולג בשקט (כמו `homeSlots`)', () => {
    expect(closetTiles(['sword', 'helmet'], 7)).toEqual(closetTiles(['helmet'], 7));
  });

  it('⛔ רמה שהסולם ⛔ אינו מגיע אליה ⛔ אינה מובטחת: מעבר ל-`MAX_GAME_LEVEL` ⇒ `null`', () => {
    // רמה 11, שני פריטים חסרים: הראשון נפתח ב-12, השני ⛔ לעולם לא (applyWin נעצר ב-12).
    const locked = closetTiles(['helmet', 'cape', 'lantern'], 11).filter((t) => !t.held);
    expect(locked).toEqual([
      { item: 'boots', held: false, unlockLevel: 12 },
      { item: 'banner', held: false, unlockLevel: null },
    ]);
  });
});
