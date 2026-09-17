import { describe, expect, it } from 'vitest';
import { GESTURE_THRESHOLD_PX, cardLift, resolveGesture, type GestureInput } from './arenaGesture';

const VW = 375;
const base = { startX: 180, startY: 600, viewportWidth: VW };

describe('37 § 5 — כלל מקור המחווה: קלף = התקפה, מעלה בלבד', () => {
  it('גרירה מעלה מעל הסף על קלף ⇒ הטלה', () => {
    expect(resolveGesture({ ...base, source: 'card', endX: 180, endY: 600 - GESTURE_THRESHOLD_PX }))
      .toEqual({ kind: 'cast' });
  });

  it('⛔ פיקסל אחד מתחת לסף ⛔ אינו הטלה — הגבול נבדק, ⛔ לא מונח', () => {
    expect(resolveGesture({ ...base, source: 'card', endX: 180, endY: 600 - (GESTURE_THRESHOLD_PX - 1) }))
      .toBeNull();
  });

  it('⛔ גרירה מטה על קלף ⛔ אינה דבר — «מעלה בלבד»', () => {
    expect(resolveGesture({ ...base, source: 'card', endX: 180, endY: 600 + 200 })).toBeNull();
  });

  it('⛔ גרירה לצדדים על קלף ⛔ אינה מזיזה את הדמות — זהו בדיוק תרחיש הכשל של T-178', () => {
    expect(resolveGesture({ ...base, source: 'card', endX: 180 + 200, endY: 600 })).toBeNull();
  });

  it('⛔ אלכסון מעבר ל-30° ⛔ אינו הטלה, ובדיוק 30° כן', () => {
    // 30° מהאנך: dx = dy * tan(30°) ≈ 80 * 0.5774 = 46.19
    expect(resolveGesture({ ...base, source: 'card', endX: 180 + 46, endY: 600 - 80 }))
      .toEqual({ kind: 'cast' });
    expect(resolveGesture({ ...base, source: 'card', endX: 180 + 60, endY: 600 - 80 })).toBeNull();
  });
});

describe('37 § 5 — מחווה על הזירה = תזוזה, לצדדים בלבד', () => {
  it('החלקה לצד מעל הסף ⇒ תזוזה, והסימן נישא ו⛔ אינו מפורש', () => {
    expect(resolveGesture({ ...base, source: 'stage', endX: 180 + GESTURE_THRESHOLD_PX, endY: 600 }))
      .toEqual({ kind: 'move', dx: GESTURE_THRESHOLD_PX });
    expect(resolveGesture({ ...base, source: 'stage', endX: 180 - GESTURE_THRESHOLD_PX, endY: 600 }))
      .toEqual({ kind: 'move', dx: -GESTURE_THRESHOLD_PX });
  });

  it('⛔ גרירה מעלה על הזירה ⛔ אינה מטילה לחש — הכיוון ההפוך של אותו כלל', () => {
    expect(resolveGesture({ ...base, source: 'stage', endX: 180, endY: 600 - 200 })).toBeNull();
  });

  it('⛔ מחווה שמתחילה ברצועת הקצה נדחית — D-042ⓐ, ⛔ אותו מספר ⛔ ולא עותק שני', () => {
    expect(resolveGesture({ ...base, source: 'stage', startX: 8, endX: 8 + 200, endY: 600 })).toBeNull();
    expect(resolveGesture({ ...base, source: 'stage', startX: VW - 8, endX: VW - 208, endY: 600 })).toBeNull();
  });
});

describe('⛔ מספר שאינו סופי ⛔ אינו «אפס» ו⛔ אינו «הרבה»', () => {
  // ⛔ טלאי מוקלד ⛔ ולא מפתח מחושב: `{ [key]: NaN }` על מחרוזת מייצר index signature
  // ש-`GestureInput` ⛔ אינו מקבל, ו-`tsc` היה נופל על הבדיקה עצמה.
  it.each<Partial<GestureInput>>([
    { startX: Number.NaN }, { startY: Number.NaN }, { endX: Number.NaN },
    { endY: Number.NaN }, { viewportWidth: Number.NaN },
  ])('⛔ %o ⇒ null', (patch) => {
    expect(resolveGesture({ ...base, source: 'card', endX: 180, endY: 520, ...patch })).toBeNull();
  });
});

describe('cardLift — ההרמה, ⛔ ולא ההכרעה', () => {
  it('מעקב 1:1 כלפי מעלה, ⛔ בלי transition בזמן הגרירה', () => {
    expect(cardLift({ startY: 600, currentY: 570, reducedMotion: false }))
      .toEqual({ y: -30, lift: 0.5, settleMs: 0 });
  });

  it('⛔ אינו יורד מתחת לאפס — «מעלה בלבד» חל גם על הציור', () => {
    expect(cardLift({ startY: 600, currentY: 640, reducedMotion: false }).y).toBe(0);
  });

  it('⛔ נעצר בסף — הרמה ⛔ אינה גדלה בלי גבול', () => {
    expect(cardLift({ startY: 600, currentY: 400, reducedMotion: false }).lift).toBe(1);
  });

  // ✋ `T-418` · סוגר את `F-280` — **הטענה נוסחה מחדש, ו⛔ לא רוככה.**
  // עד היום היא דרשה `lift: 0` תחת ההעדפה, כלומר **`data-arena-lift` שנשאר `'rest'`
  // לאורך כל הגרירה** — ⇒ היא נעלה את הפגם במקום למדוד אותו. מה שהיא שומרת הוא
  // המספר שבאמת נושא את שכבה א׳ א7: **`y === 0`, אפס תנועה, בכל אחת מהנקודות.**
  it('⛔ prefers-reduced-motion ⇒ אפס תנועה — `y` הוא 0 גם בסף מלא (שכבה א׳ א7)', () => {
    expect(cardLift({ startY: 600, currentY: 540, reducedMotion: true }).y).toBe(0);
    expect(cardLift({ startY: 600, currentY: 500, reducedMotion: true }).y).toBe(0);
    expect(cardLift({ startY: 600, currentY: 400, reducedMotion: true }).settleMs).toBe(0);
  });

  it('✋ ההעדפה מכבה תנועה ⛔ ולא הצהרה — חצייה מלאה ⇒ `y === 0` **וגם** `lift >= 1`', () => {
    // ⓓ של `T-418`, מילה במילה: `delta = -60` הוא הסף עצמו.
    const crossed = cardLift({ startY: 600, currentY: 540, reducedMotion: true });
    expect(crossed.y).toBe(0);
    expect(crossed.lift).toBeGreaterThanOrEqual(1);
  });

  it('✋ ובאמצע הדרך ההצהרה ⛔ עדיין לא נדלקת — `delta = -30` ⇒ `lift` בין 0 ל-1', () => {
    const halfway = cardLift({ startY: 600, currentY: 570, reducedMotion: true });
    expect(halfway.y).toBe(0);
    expect(halfway.lift).toBeGreaterThan(0);
    expect(halfway.lift).toBeLessThan(1);
  });

  it('⛔ והסף ⛔ לא ירד: `lift` ⛔ אינו מגיע ל-1 לפני 60px, בשני המצבים', () => {
    for (const reducedMotion of [true, false]) {
      expect(cardLift({ startY: 600, currentY: 541, reducedMotion }).lift).toBeLessThan(1);
      expect(cardLift({ startY: 600, currentY: 540, reducedMotion }).lift).toBe(1);
    }
  });
});
