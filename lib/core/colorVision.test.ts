import { describe, expect, it } from 'vitest';
import {
  CATEGORICAL_MIN_DELTA_E,
  CVD_TYPES,
  categoricalClashes,
  deltaE76,
  simulateCvd,
} from '@/lib/core/colorVision';

/**
 * ⛔ **אין כאן ולו מספר קסם אחד שהועתק מהרצה.** סימולציית CVD ⛔ אינה ניתנת
 * לאימות מול «הערך הנכון» בלי מימוש ייחוס, ולכן כל טענה כאן היא **תכונה** —
 * משהו שחייב להתקיים לכל קלט, ⛔ ולא פלט שנצפה פעם אחת וקובע.
 */
const RED = '#ff0000';
const GREEN = '#00ff00';
const BLUE = '#0000ff';
const YELLOW = '#ffff00';

describe('deltaE76', () => {
  it('אפס לצבע מול עצמו, וסימטרי', () => {
    expect(deltaE76(RED, RED)).toBeCloseTo(0, 10);
    expect(deltaE76(RED, BLUE)).toBeCloseTo(deltaE76(BLUE, RED), 10);
  });

  it('שחור מול לבן הוא 100 — ‏L* נע 0…100 ושני הצבעים ניטרליים', () => {
    expect(deltaE76('#000000', '#ffffff')).toBeCloseTo(100, 4);
  });

  it('⛔ עוצר בשם על קלט שאינו hex בן 6', () => {
    expect(() => deltaE76('#fff', RED)).toThrow(/אינו hex/);
    expect(() => deltaE76('red', RED)).toThrow(/אינו hex/);
  });
});

describe('simulateCvd', () => {
  it('⛔ אינו נוגע באפור — לדיכרומט אפור נשאר אפור', () => {
    for (const grey of ['#000000', '#808080', '#ffffff']) {
      for (const type of CVD_TYPES) {
        expect(deltaE76(grey, simulateCvd(grey, type)), `${grey} · ${type}`).toBeLessThan(2);
      }
    }
  });

  it('אדום וירוק מתקרבים זה לזה בשתי הראיות — זו כל ההגדרה של עיוורון אדום־ירוק', () => {
    const normal = deltaE76(RED, GREEN);
    for (const type of CVD_TYPES) {
      const simulated = deltaE76(simulateCvd(RED, type), simulateCvd(GREEN, type));
      expect(simulated, type).toBeLessThan(normal);
    }
  });

  it('כחול וצהוב שורדים את שתי הראיות — הציר הצהוב־כחול אינו הפגוע בהן', () => {
    for (const type of CVD_TYPES) {
      const simulated = deltaE76(simulateCvd(BLUE, type), simulateCvd(YELLOW, type));
      expect(simulated, type).toBeGreaterThan(CATEGORICAL_MIN_DELTA_E);
    }
  });

  /**
   * ⛔ **הבדיקה ששומרת על מה שהמודול ⛔ אינו מתיימר.** אם מישהו יחזיר טריטן,
   * `CVD_TYPES` יגדל והבדיקה הזאת תיפול — ואז חובה עליו להוכיח שהמודל החדש
   * **כן** מקרב כחול לצהוב, ⛔ ולא משאיר אותם במקומם כפי שהמקדמים הנפוצים עושים.
   */
  it('⛔ שתי ראיות בדיוק, ⛔ ולא שלוש — טריטן ⛔ אינו מדומה כאן', () => {
    expect([...CVD_TYPES]).toEqual(['protan', 'deutan']);
  });

  it('הזוג הקטגורי של המוצר עצמו קורס בדויטן — התיעוד ב-palette.ts ⛔ אינו טענה ריקה', () => {
    const [success, danger] = ['#4ade80', '#f87171'];
    expect(deltaE76(success, danger)).toBeGreaterThan(100);
    expect(deltaE76(simulateCvd(success, 'deutan'), simulateCvd(danger, 'deutan'))).toBeLessThan(
      CATEGORICAL_MIN_DELTA_E,
    );
  });

  it('הסימולציה יציבה: להריץ אותה פעמיים ⛔ אינו מזיז את הצבע שוב', () => {
    for (const type of CVD_TYPES) {
      const once = simulateCvd(RED, type);
      expect(deltaE76(once, simulateCvd(once, type)), type).toBeLessThan(3);
    }
  });
});

describe('categoricalClashes', () => {
  it('⛔ רשימה ריקה על סדרה שנבדלת בכל ארבע הראיות', () => {
    expect(categoricalClashes(['#000000', '#ffffff'])).toEqual([]);
  });

  it('תופס את הזוג האמיתי של המוצר ומדווח **באיזו ראייה** — ⛔ לא «נכשל»', () => {
    const clashes = categoricalClashes(['#4ade80', '#f87171']);
    expect(clashes.length).toBeGreaterThan(0);
    const visions = clashes.map((c) => c.vision);
    expect(visions).toContain('deutan');
    expect(visions).not.toContain(null);
    for (const c of clashes) expect(c.deltaE).toBeLessThan(CATEGORICAL_MIN_DELTA_E);
  });

  it('בודק כל זוג — סדרה של שלושה נבדקת שלוש פעמים בכל ראייה', () => {
    const all = categoricalClashes([RED, GREEN, BLUE], 1e6);
    expect(all).toHaveLength(3 * (1 + CVD_TYPES.length));
  });

  it('⛔ צבע יחיד ⛔ אינו יכול להתנגש עם עצמו', () => {
    expect(categoricalClashes([RED], 1e6)).toEqual([]);
    expect(categoricalClashes([], 1e6)).toEqual([]);
  });
});
