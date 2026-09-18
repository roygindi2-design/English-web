import { describe, expect, it } from 'vitest';
import {
  CARD_RUBBER_CONSTANT, GESTURE_THRESHOLD_PX, cardLift, resolveGesture, type GestureInput,
} from './arenaGesture';

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
      .toEqual({ y: -30, x: 0, lift: 0.5, settleMs: 0 });
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

/**
 * 🎯 **⟦18/09 · `C-0717`⟧ הקלף נוסע אל היריב — ⛔ ולא נעצר אחרי 60px.**
 *
 * 🔬 **המספר ⛔ אינו מומצא:** נמדד ב-393×852 על `/dev/arcade` לפני השינוי —
 * ראש הקלף `y 576.6`, רגלי `[data-arena-figure=enemy]` ‏`y 315` ⇒ **261.6px**.
 * הבדיקות למטה משתמשות ב-**260** כטווח עגול מאותו סדר גודל; מה שהן נועלות הוא
 * **ההתנהגות**, ⛔ ולא המספר — המספר נמדד חי ב-`arenaAnchors.foeReach`.
 */
describe('🎯 cardLift · הטווח — «ממש לכיוון היריב» (C-0717)', () => {
  const REACH = 260;

  it('עוקב 1:1 **לכל אורך הטווח**, ⛔ ולא עד הסף', () => {
    // ⛔ זו הטענה שהייתה מאדימה לפני השינוי: `-200` היה `-60`.
    expect(cardLift({ startY: 600, currentY: 400, reducedMotion: false, reach: REACH }).y).toBe(-200);
    expect(cardLift({ startY: 600, currentY: 340, reducedMotion: false, reach: REACH }).y).toBe(-REACH);
  });

  it('⛔ אינו נעצר בקיר מעבר לטווח — גומייה, ו⛔ היא ⛔ אינה 1:1', () => {
    const past = cardLift({ startY: 600, currentY: 200, reducedMotion: false, reach: REACH });
    // ⓐ **זז** מעבר לטווח — ⛔ לא קפוא.
    expect(past.y).toBeLessThan(-REACH);
    // ⓑ ו⛔ **לא** 1:1 — 400px של אצבע ⛔ אינם 400px של קלף.
    expect(past.y).toBeGreaterThan(-400);
  });

  it('⛔ ולעולם ⛔ אינו חוצה את גג הגומייה — `2 · reach`', () => {
    // 🔬 **הגג נגזר, ⛔ ולא נבחר:** `resisted = over·reach·c / (reach + c·over)`,
    // וכש-`over → ∞` שני האגפים נשלטים על ידי `c · over` ⇒ `resisted → reach`.
    // ⇒ גרירה של קילומטר ⛔ אינה מוציאה את הקלף מהמסך: זה מה שהופך «התנגדות»
    // ל**גבול** ⛔ ולא להאטה בלבד.
    for (const currentY of [200, 0, -5_000, -1_000_000]) {
      const y = cardLift({ startY: 600, currentY, reducedMotion: false, reach: REACH }).y;
      expect(Math.abs(y)).toBeLessThan(2 * REACH);
      expect(Math.abs(y)).toBeGreaterThan(REACH);
    }
  });

  it('⛔ והקבוע הוא הקבוע של אפל — הערך המדויק, ⛔ ולא «בערך»', () => {
    // 🔬 מוטציה: `c = 0.55 ⇒ 0.7` מאדימה את השורה הזאת. ⇒ הקבוע ⛔ אינו ניתן
    // לכוונון בשקט ⛔ ואינו יכול להיטמע כמספר קסם שאיש ⛔ לא יודע מאין בא.
    const over = 100;
    const expected = -(REACH + (over * REACH * CARD_RUBBER_CONSTANT) / (REACH + CARD_RUBBER_CONSTANT * over));
    expect(cardLift({ startY: 600, currentY: 600 - REACH - over, reducedMotion: false, reach: REACH }).y)
      .toBeCloseTo(expected, 10);
  });

  it('⛔ המזהה ⛔ לא זז: `lift` נשאר 1 לאורך כל הטווח, ⛔ ואינו נמתח אליו', () => {
    // ⛔ אם `lift` היה נמדד מול `reach`, הטבעת הייתה נדלקת רק ב-260px —
    // כלומר **השער היה עולה פי ארבעה בשקט**. הוא ⛔ אינו.
    expect(cardLift({ startY: 600, currentY: 540, reducedMotion: false, reach: REACH }).lift).toBe(1);
    expect(cardLift({ startY: 600, currentY: 400, reducedMotion: false, reach: REACH }).lift).toBe(1);
  });

  it('⛔ אין מדידה ⇒ ⛔ אין נסיעה שהומצאה — התקרה הישנה חוזרת', () => {
    for (const reach of [0, undefined, Number.NaN, -40, GESTURE_THRESHOLD_PX]) {
      const y = cardLift({ startY: 600, currentY: 400, reducedMotion: false, reach }).y;
      // מעבר לסף יש גומייה גם כאן — «קיר» נקרא «קפוא» בכל תקרה — אבל התקרה
      // עצמה היא 60px, ⛔ ולא מספר שהומצא מהיריב שאינו במסמך.
      expect(Math.abs(y)).toBeGreaterThan(GESTURE_THRESHOLD_PX);
      expect(Math.abs(y)).toBeLessThan(2 * GESTURE_THRESHOLD_PX);
    }
  });

  it('✋ וההעדפה גוברת על הטווח: `reducedMotion` ⇒ `y === 0` גם עם 260px של טווח', () => {
    const still = cardLift({ startY: 600, currentY: 300, reducedMotion: true, reach: REACH, driftX: -132 });
    expect(still.y).toBe(0);
    // ✋ **שני הצירים**: סחף אופקי הוא תנועה בדיוק כמו הרמה.
    expect(still.x).toBe(0);
    expect(still.lift).toBe(1);
  });

  /**
   * 🎯 **«לכיוון האמצע» — הציר שצילום המסך חשף שחסר.**
   * 🔬 נמדד ב-393×852 אחרי שתוקן `y` בלבד: הקלף הימני עלה 261.8px ונעצר על
   * `cx 329` בעוד היריב עומד על `cx 197` ⇒ **132px** של פער שנשארו פתוחים.
   */
  describe('🎯 הסחף האופקי — הקלף מכוון את עצמו אל היריב', () => {
    const DRIFT = -132; // היריב משמאל לקלף הימני

    it('⛔ אפס בתחילת הגרירה — הקלף ⛔ אינו קופץ הצידה ברגע המגע', () => {
      expect(cardLift({ startY: 600, currentY: 600, reducedMotion: false, reach: REACH, driftX: DRIFT }).x).toBe(0);
      expect(cardLift({ startY: 600, currentY: 599, reducedMotion: false, reach: REACH, driftX: DRIFT }).x)
        .toBeCloseTo(DRIFT / REACH, 6);
    });

    it('מחצית הדרך ⇒ מחצית הסחף — הכיוון **פרופורציוני**, ⛔ ולא מדרגה', () => {
      expect(cardLift({ startY: 600, currentY: 600 - REACH / 2, reducedMotion: false, reach: REACH, driftX: DRIFT }).x)
        .toBeCloseTo(DRIFT / 2, 6);
    });

    it('בקצה הטווח הקלף יושב **על** היריב — ⛔ ולא לידו', () => {
      expect(cardLift({ startY: 600, currentY: 600 - REACH, reducedMotion: false, reach: REACH, driftX: DRIFT }).x)
        .toBeCloseTo(DRIFT, 6);
    });

    it('⛔ ו⛔ אינו ממשיך מעבר ליריב — הגומייה היא על המרחק, ⛔ ולא על הכוונון', () => {
      for (const currentY of [600 - REACH - 200, -5_000]) {
        expect(cardLift({ startY: 600, currentY, reducedMotion: false, reach: REACH, driftX: DRIFT }).x)
          .toBeCloseTo(DRIFT, 6);
      }
    });

    it('⛔ אין יריב ⇒ ⛔ אין סחף — הקלף עולה ישר, בדיוק כמו קודם', () => {
      for (const driftX of [undefined, 0, Number.NaN]) {
        expect(cardLift({ startY: 600, currentY: 400, reducedMotion: false, reach: REACH, driftX }).x).toBe(0);
      }
    });
  });
});
