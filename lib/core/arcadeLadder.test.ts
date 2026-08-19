import { describe, expect, it } from 'vitest';
import {
  ARCADE_AMMO, ARCADE_ENEMY_HP, ARCADE_MIN_WORDS_PER_LEVEL, ARCADE_WINS_PER_LEVEL,
  ARENA_IDLE_LOOP, GAME_LEVELS, MAX_GAME_LEVEL,
  applyWin, describeLevel, gameLevelAt, isVictory,
} from './arcadeLadder';

describe('D-059 — שלושת קבועי הקרב', () => {
  it('15 שאלות · 10 חיי יריב · 3 ניצחונות לרמה', () => {
    expect(ARCADE_AMMO).toBe(15);
    expect(ARCADE_ENEMY_HP).toBe(10);
    expect(ARCADE_WINS_PER_LEVEL).toBe(3);
  });

  it('סף הניצחון הוא בדיוק 10 מתוך 15 — ⛔ לא 9 ולא 11', () => {
    expect(isVictory(9)).toBe(false);
    expect(isVictory(10)).toBe(true);
    expect(isVictory(15)).toBe(true);
  });

  it('סף הדיוק שנגזר הוא 67% — הבדיקה שתיפול אם מישהו ישנה קבוע אחד לבדו', () => {
    expect(Math.round((ARCADE_ENEMY_HP / ARCADE_AMMO) * 100)).toBe(67);
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

describe('D-061 · D-046 — רמה בלי 12 מילים כשירות נעולה **עם המספר**', () => {
  it('11 כשירות ⇒ נעולה, והמספרים חוזרים ללומד', () => {
    expect(describeLevel(3, 11)).toEqual({ unlocked: false, required: 12, eligible: 11 });
  });

  it('12 כשירות ⇒ פתוחה', () => {
    expect(describeLevel(3, 12)).toEqual({ unlocked: true, required: 12, eligible: 12 });
  });

  it('הסף הוא הקבוע ⛔ ולא מספר בקוד', () => {
    expect(ARCADE_MIN_WORDS_PER_LEVEL).toBe(12);
  });

  it('C1/C2 היום = 0 כשירות (R-021) ⇒ נעולות עם 0, ⛔ לא מוסתרות', () => {
    expect(describeLevel(11, 0)).toEqual({ unlocked: false, required: 12, eligible: 0 });
    expect(describeLevel(12, 0)).toEqual({ unlocked: false, required: 12, eligible: 0 });
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
