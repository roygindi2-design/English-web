import { describe, expect, it } from 'vitest';
import {
  ARCADE_AMMO, ARCADE_ENEMY_HP, ARCADE_MIN_WORDS_PER_LEVEL, ARCADE_WINS_PER_LEVEL,
  ARENA_IDLE_LOOP, GAME_LEVELS, MAX_GAME_LEVEL,
  applyWin, describeLevel, gameLevelAt, isVictory, requiredHits,
} from './arcadeLadder';

describe('D-059 · D-067 — שלושת קבועי הקרב, והסף שנגזר מהם', () => {
  it('15 שאלות · 10 חיי יריב · 3 ניצחונות לרמה', () => {
    expect(ARCADE_AMMO).toBe(15);
    expect(ARCADE_ENEMY_HP).toBe(10);
    expect(ARCADE_WINS_PER_LEVEL).toBe(3);
  });

  it('D-067ⓐ — שער הבריכה הוא התחמושת עצמה, ⛔ ולא 12', () => {
    expect(ARCADE_MIN_WORDS_PER_LEVEL).toBe(ARCADE_AMMO);
  });

  it('D-067ⓑ — הסף הוא 67% של מה שנשלח בפועל, בכל אורך סיבוב', () => {
    expect(requiredHits(15)).toBe(10);
    expect(requiredHits(12)).toBe(8);
    expect(requiredHits(14)).toBe(10);
    expect(requiredHits(30)).toBe(20);
    for (const q of [12, 13, 14, 15, 20, 30]) {
      const ratio = requiredHits(q) / q;
      expect(ratio).toBeGreaterThanOrEqual(2 / 3);
      expect(ratio).toBeLessThan(2 / 3 + 1 / q);
    }
  });

  it('⛔ קלט פסול ⛔ אינו מקל — הרצפה היא הקבוע', () => {
    expect(requiredHits(0)).toBe(ARCADE_ENEMY_HP);
    expect(requiredHits(-5)).toBe(ARCADE_ENEMY_HP);
    expect(requiredHits(1.5)).toBe(ARCADE_ENEMY_HP);
    expect(requiredHits(Number.NaN)).toBe(ARCADE_ENEMY_HP);
  });

  it('סיבוב מלא: 10 מנצח, 9 ⛔ לא — ⛔ ובסיבוב בן 12 הסף הוא 8', () => {
    expect(isVictory(9, 15)).toBe(false);
    expect(isVictory(10, 15)).toBe(true);
    expect(isVictory(15, 15)).toBe(true);
    expect(isVictory(7, 12)).toBe(false);
    expect(isVictory(8, 12)).toBe(true);
  });

  it('D-060 · פריט 39 — לולאת ההמתנה כבויה בברירת מחדל', () => {
    expect(ARENA_IDLE_LOOP).toBe(false);
  });
});

describe('D-061 — סולם 12 רמות המשחק', () => {
  it('בדיוק 12 שורות, ממוספרות 1..12 ברצף', () => {
    expect(GAME_LEVELS).toHaveLength(12);
    expect(GAME_LEVELS.map((g) => g.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(MAX_GAME_LEVEL).toBe(12);
  });

  it('חלוקת הרמות היא בדיוק זו שב-D-061', () => {
    expect(GAME_LEVELS.map((g) => g.band)).toEqual([
      'A1', 'A1', 'A1', 'A1', 'A2', 'A2', 'B1', 'B1', 'B2', 'B2', 'C1', 'C2',
    ]);
  });

  it('פרוסות התדירות בתוך כל רמה רצות מ-0 ועד slicesInBand-1', () => {
    for (const band of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const) {
      const rows = GAME_LEVELS.filter((g) => g.band === band);
      expect(rows.map((r) => r.sliceIndex)).toEqual(rows.map((_, i) => i));
      for (const r of rows) expect(r.slicesInBand).toBe(rows.length);
    }
  });

  it('רמה 13 ⛔ אינה קיימת, וגם 0 ושבר אינם', () => {
    expect(gameLevelAt(13)).toBeNull();
    expect(gameLevelAt(0)).toBeNull();
    expect(gameLevelAt(1.5)).toBeNull();
    expect(gameLevelAt(1)).toEqual({ level: 1, band: 'A1', sliceIndex: 0, slicesInBand: 4 });
    expect(gameLevelAt(12)).toEqual({ level: 12, band: 'C2', sliceIndex: 0, slicesInBand: 1 });
  });
});

describe('D-061 · D-046 · D-067ⓐ — רמה בלי 15 מילים כשירות נעולה **עם המספר**', () => {
  it('14 כשירות ⇒ נעולה, והמספרים חוזרים ללומד', () => {
    expect(describeLevel(3, 14)).toEqual({ unlocked: false, required: 15, eligible: 14 });
  });

  it('15 כשירות ⇒ פתוחה', () => {
    expect(describeLevel(3, 15)).toEqual({ unlocked: true, required: 15, eligible: 15 });
  });

  it('הסף הוא הקבוע ⛔ ולא מספר בקוד', () => {
    expect(ARCADE_MIN_WORDS_PER_LEVEL).toBe(15);
  });

  it('C1/C2 היום = 0 כשירות (R-021) ⇒ נעולות עם 0, ⛔ לא מוסתרות', () => {
    expect(describeLevel(11, 0)).toEqual({ unlocked: false, required: 15, eligible: 0 });
    expect(describeLevel(12, 0)).toEqual({ unlocked: false, required: 15, eligible: 0 });
  });
});

describe('D-061 — עלייה = 3 ניצחונות, ⛔ ואין ירידה', () => {
  it('ניצחון ראשון ושני מעלים מונה בלבד', () => {
    expect(applyWin({ level: 2, wins: 0 })).toEqual({ level: 2, wins: 1, leveledUp: false });
    expect(applyWin({ level: 2, wins: 1 })).toEqual({ level: 2, wins: 2, leveledUp: false });
  });

  it('השלישי מעלה רמה ומאפס את המונה', () => {
    expect(applyWin({ level: 2, wins: 2 })).toEqual({ level: 3, wins: 0, leveledUp: true });
  });

  it('⛔ רמה 12 היא התקרה — ניצחון שם ⛔ אינו יוצר רמה 13', () => {
    expect(applyWin({ level: 12, wins: 2 })).toEqual({ level: 12, wins: 0, leveledUp: false });
  });
});
