import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  dragOffset,
  resolveSwipe,
  SWIPE_EDGE_PX,
  SWIPE_FEEDBACK_MAX_MS,
  SWIPE_MAX_ANGLE_DEG,
  SWIPE_MIN_DISTANCE_PX,
} from './swipeGrade';

/**
 * T-099 · D-042 — שלושת הסייגים, כל אחד עם שתי הצדדים של הגבול שלו.
 *
 * בדיקות יחידה אמיתיות ⛔ ולא שומר מקור: המודול טהור, ולכן הטענה «סף 64px»
 * נמדדת ב-63 וב-64 ⛔ ולא בכך שהמספר 64 מופיע בקובץ.
 */
const VW = 375;
const base = { startX: 100, startY: 400, viewportWidth: VW };

describe('resolveSwipe — הכיוון (D-042, ⛔ ראה F-102 על סתירת ה-RTL)', () => {
  it('ימין ⇒ «ידעתי»', () => {
    expect(resolveSwipe({ ...base, endX: 180, endY: 400 })).toBe('good');
  });

  it('שמאל ⇒ «לא ידעתי»', () => {
    expect(resolveSwipe({ ...base, endX: 20, endY: 400 })).toBe('again');
  });

  it('⛔ אפס תזוזה ⇒ ⛔ לא מחווה (הקשה רגילה חייבת לשרוד)', () => {
    expect(resolveSwipe({ ...base, endX: 100, endY: 400 })).toBeNull();
  });
});

describe('D-042ⓐ — רצועת הקצה ⛔ אינה מגיבה', () => {
  it('התחלה בתוך 20px משמאל ⇒ null, גם למחווה מושלמת', () => {
    expect(
      resolveSwipe({ startX: SWIPE_EDGE_PX, startY: 400, endX: 300, endY: 400, viewportWidth: VW }),
    ).toBeNull();
  });

  it('התחלה בתוך 20px מימין ⇒ null', () => {
    expect(
      resolveSwipe({ startX: VW - SWIPE_EDGE_PX, startY: 400, endX: 100, endY: 400, viewportWidth: VW }),
    ).toBeNull();
  });

  it('פיקסל אחד פנימה משתי הרצועות ⇒ המחווה חיה', () => {
    expect(
      resolveSwipe({ startX: SWIPE_EDGE_PX + 1, startY: 400, endX: 300, endY: 400, viewportWidth: VW }),
    ).toBe('good');
    expect(
      resolveSwipe({ startX: VW - SWIPE_EDGE_PX - 1, startY: 400, endX: 100, endY: 400, viewportWidth: VW }),
    ).toBe('again');
  });

  it('מסך צר מפעמיים הרצועה ⇒ ⛔ אין בו מחווה כלל, ⛔ ולא חלוקה באפס', () => {
    expect(
      resolveSwipe({ startX: 20, startY: 400, endX: 100, endY: 400, viewportWidth: 30 }),
    ).toBeNull();
  });
});

describe('D-042ⓑ — סף המרחק', () => {
  /**
   * F-105ⓐ — הנוסח שהתוכנית הכתיבה בנה את הקלט מ-`SWIPE_MIN_DISTANCE_PX` עצמו,
   * ולכן הזזת הקבוע הזיזה **גם את הקלט וגם את הציפייה** והבדיקה עברה בכל ערך.
   * נמדד: המוטציה `64 ⇒ 32` שהתוכנית מחייבת ⛔ לא הפילה דבר. ⛔ הבדיקה ⛔ לא
   * הוחלשה — המספרים כאן **מילוליים**, וקבוע שזז מפיל אותם.
   */
  it('הקבוע עצמו הוא 64 — ⛔ ולא «מה שכתוב בקובץ»', () => {
    expect(SWIPE_MIN_DISTANCE_PX).toBe(64);
  });

  it('63px ⇒ null', () => {
    expect(resolveSwipe({ ...base, endX: 163, endY: 400 })).toBeNull();
  });

  it('64px בדיוק ⇒ מחווה', () => {
    expect(resolveSwipe({ ...base, endX: 164, endY: 400 })).toBe('good');
  });

  it('הסף נמדד על הציר האופקי בלבד — גלילה אנכית ארוכה ⛔ אינה מחווה', () => {
    expect(resolveSwipe({ ...base, endX: 110, endY: 100 })).toBeNull();
  });

  /**
   * F-105ⓑ — הבדיקה שמעליה ⛔ אינה מבחינה בין `Math.abs(dx)` ל-`Math.hypot(dx, dy)`:
   * גלילה אנכית ארוכה נדחית ממילא על **הזווית**, ולכן שער המרחק היה יכול להיות
   * אוקלידי ואיש לא היה יודע (נמדד — המוטציה השלישית של התוכנית ⛔ לא הפילה דבר).
   * המקרה היחיד שמפריד ביניהם הוא זווית **כשרה** עם מרחק אוקלידי שעובר ומרחק
   * אופקי שאינו: dx=60 · dy=30 ⇒ 26.6° ✓ · hypot≈67.1 ✓ · |dx|=60 ✗.
   */
  it('⛔ ואינו המרחק האוקלידי — 60px אופקי בזווית כשרה ⛔ אינם מחווה', () => {
    expect(Math.hypot(60, 30)).toBeGreaterThan(SWIPE_MIN_DISTANCE_PX);
    expect(resolveSwipe({ ...base, endX: 160, endY: 430 })).toBeNull();
  });
});

describe(`D-042ⓑ — הזווית ≤${SWIPE_MAX_ANGLE_DEG}°`, () => {
  it('אלכסון של ~36.9° ⇒ null (dx=80, dy=60)', () => {
    expect(resolveSwipe({ ...base, endX: 180, endY: 460 })).toBeNull();
  });

  it('אלכסון של ~26.6° ⇒ מחווה (dx=80, dy=40)', () => {
    expect(resolveSwipe({ ...base, endX: 180, endY: 440 })).toBe('good');
  });

  /**
   * F-104 — הנוסח שהתוכנית הכתיבה כאן טען ש-`endY: 340` (כלומר dy=**-60**, 36.9°)
   * הוא `'good'`, בעוד שתי הבדיקות שמעליו קובעות ש-36.9° הוא `null`. ⛔ הבדיקה
   * ⛔ לא הוחלשה — היא **כוונה מחדש** לטענה שהיא התיימרה לטעון: הסימטריה נמדדת
   * על **שני** צדי הגבול, ⛔ ולא בהשוואת קריאה לעצמה (‏`460 - 120 === 340`).
   */
  it('הזווית סימטרית לשני הכיוונים האנכיים — בשני צדי הגבול', () => {
    // מתחת לסף: מראה מדויקת של 26.6° כלפי מעלה וכלפי מטה.
    expect(resolveSwipe({ ...base, endX: 180, endY: 360 })).toBe('good');
    expect(resolveSwipe({ ...base, endX: 180, endY: 360 })).toBe(
      resolveSwipe({ ...base, endX: 180, endY: 440 }),
    );
    // מעל הסף: אותה מראה, ושתי הצדדים נדחים.
    expect(resolveSwipe({ ...base, endX: 180, endY: 340 })).toBeNull();
    expect(resolveSwipe({ ...base, endX: 180, endY: 340 })).toBe(
      resolveSwipe({ ...base, endX: 180, endY: 460 }),
    );
  });

  it('ומטפלת בשמאל בדיוק אותו דבר', () => {
    expect(resolveSwipe({ ...base, endX: 20, endY: 460 })).toBeNull();
    expect(resolveSwipe({ ...base, endX: 20, endY: 440 })).toBe('again');
  });
});

describe('קלט לא סביר ⛔ אינו מייצר ציון', () => {
  it('NaN ⇒ null ⛔ ולא ניחוש', () => {
    expect(resolveSwipe({ ...base, endX: Number.NaN, endY: 400 })).toBeNull();
  });

  it('אינסוף ⇒ null', () => {
    expect(resolveSwipe({ ...base, endX: Number.POSITIVE_INFINITY, endY: 400 })).toBeNull();
  });
});

/**
 * T-157 · D-090ⓑ — הכרטיס נצמד לאצבע.
 *
 * ⚠️ שלושת הספים של `resolveSwipe` נבדקים למעלה ו⛔ **אינם זזים** — הם נמדדו (רצועת
 * ה-back-swipe של iOS · הסף שמפריד מחווה מגלילה מעט אלכסונית), ⛔ ולא נבחרו בטעם.
 * מה שחדש הוא **המשוב**, ⛔ ולא ההכרעה.
 */
describe('dragOffset — מעקב 1:1 אחרי האצבע', () => {
  it('עוקב אחרי האצבע 1:1, בשני הכיוונים', () => {
    expect(dragOffset({ startX: 200, currentX: 260, reducedMotion: false }).x).toBe(60);
    expect(dragOffset({ startX: 200, currentX: 140, reducedMotion: false }).x).toBe(-60);
  });

  it('⛔ אין תקרה — 300 פיקסלים הם 300 פיקסלים, ⛔ ולא 8', () => {
    expect(dragOffset({ startX: 20, currentX: 320, reducedMotion: false }).x).toBe(300);
  });

  it('תנועה מופחתת פירושה אפס תנועה, ⛔ ולא פחות תנועה', () => {
    expect(dragOffset({ startX: 200, currentX: 260, reducedMotion: true }).x).toBe(0);
    expect(dragOffset({ startX: 200, currentX: 900, reducedMotion: true }).x).toBe(0);
  });

  it('והמחווה עצמה עדיין מוכרעת כשהתנועה כבויה — הקיצור ⛔ לא בוטל', () => {
    expect(
      resolveSwipe({ startX: 200, startY: 400, endX: 300, endY: 400, viewportWidth: 375 }),
    ).toBe('good');
  });

  it('מספר שאינו סופי ⛔ אינו «אפס» ו⛔ אינו «הרבה» — אותו כלל של resolveSwipe', () => {
    expect(dragOffset({ startX: Number.NaN, currentX: 260, reducedMotion: false }).x).toBe(0);
    expect(
      dragOffset({ startX: 200, currentX: Number.POSITIVE_INFINITY, reducedMotion: false }).x,
    ).toBe(0);
  });

  it('⛔ בזמן הגרירה אין השתקעות — 1:1 הוא מניפולציה ישירה, ⛔ ולא אנימציה', () => {
    expect(dragOffset({ startX: 200, currentX: 260, reducedMotion: false }).settleMs).toBe(0);
  });

  it('מוטציה: שלושת הספים שנמדדו ⛔ אינם זזים', () => {
    expect(SWIPE_EDGE_PX).toBe(20);
    expect(SWIPE_MIN_DISTANCE_PX).toBe(64);
    expect(SWIPE_MAX_ANGLE_DEG).toBe(30);
  });

  it('מוטציה: משך ההשתקעות בשחרור בטווח 150–300ms של חוקה § 5', () => {
    expect(SWIPE_FEEDBACK_MAX_MS).toBeGreaterThanOrEqual(150);
    expect(SWIPE_FEEDBACK_MAX_MS).toBeLessThanOrEqual(300);
  });

  it('מוטציה: המעבר מכובה בזמן הגרירה, ⛔ ומוחזר בשחרור', () => {
    const css = readFileSync('app/globals.css', 'utf8');
    expect(css).toMatch(/\[data-flashcard\]\[data-dragging\]\s*\{\s*transition:\s*none;/);
    expect(css).toMatch(/\[data-flashcard\]\s*\{\s*transition:\s*transform\s+200ms/);
  });
});
