import { describe, expect, it } from 'vitest';
import { failureExit, isRetryable, toFailureCode, worstFailure, type FailureCode } from './failureExit';

/**
 * T-124 · D-065 — הכלל הבינארי, כטבלה אחת.
 */
const ALL: readonly FailureCode[] = ['session_expired', 'schema_missing', 'unavailable'];

describe('לכל קוד כשל יש יציאה', () => {
  it('⛔ אין קוד בלי יעד ניווט, ובעברית', () => {
    for (const code of ALL) {
      const exit = failureExit(code);
      expect(exit.href.startsWith('/')).toBe(true);
      expect(exit.labelHe).toMatch(/[֐-׿]/);
    }
  });
});

describe('session_expired', () => {
  it('שולח ל-/login ⇒ תמיד', () => {
    expect(failureExit('session_expired').href).toBe('/login');
  });

  it('⛔ אינו ניתן לניסיון חוזר — טעינה חוזרת עם סשן מת מחזירה 401 שוב', () => {
    expect(isRetryable('session_expired')).toBe(false);
  });
});

describe('schema_missing', () => {
  it('⛔ אינו ניתן לניסיון חוזר — התקלה אינה חולפת מעצמה', () => {
    // זהו ⓒ במשימה: «נסה שוב» שלעולם לא יצליח. מיגרציה שלא רצה
    // לא תרוץ מפני שהלומד לחץ על כפתור.
    expect(isRetryable('schema_missing')).toBe(false);
  });

  it('מנווט ללשונית שכן עובדת ⛔ ולא לאותו מסך', () => {
    expect(failureExit('schema_missing').href).toBe('/studies');
  });
});

describe('unavailable', () => {
  it('ניתן לניסיון חוזר — זו התקלה החולפת היחידה מהשלוש', () => {
    expect(isRetryable('unavailable')).toBe(true);
  });

  it('⛔ ובנוסף יש יציאה: «נסה שוב» לבדו הוא מסך ללא דרך החוצה', () => {
    expect(failureExit('unavailable').href).toBe('/studies');
  });
});

/**
 * T-146ⓐ + ⓒ together. ⓐ says a screen shows **one** error region and **one**
 * action; ⓒ says that action is always an exit. A screen that read two endpoints
 * and got two different failures therefore has to pick ONE code — and «pick» with
 * no rule is «pick the one that answered last», which makes the exit depend on
 * network timing. `worstFailure` is that rule, written once.
 */
describe('worstFailure — one screen ⇒ one code (T-146ⓐ · D-065)', () => {
  it('⛔ אין קודים ⇒ `unavailable` — התקלה החולפת, ⛔ ולא הקשה מכולן', () => {
    expect(worstFailure([])).toBe('unavailable');
  });

  it('`session_expired` גובר על השניים האחרים — סשן מת מסביר גם אותם', () => {
    expect(worstFailure(['unavailable', 'session_expired'])).toBe('session_expired');
    expect(worstFailure(['schema_missing', 'session_expired'])).toBe('session_expired');
  });

  it('`schema_missing` גובר על `unavailable` — ⛔ «נסה שוב» ⛔ אינו מוצע על תקלה שאינה חולפת', () => {
    expect(worstFailure(['unavailable', 'schema_missing'])).toBe('schema_missing');
  });

  it('⛔ הסדר של הקלט ⛔ אינו משנה — אחרת היציאה תלויה בזמני הרשת', () => {
    expect(worstFailure(['session_expired', 'schema_missing'])).toBe(
      worstFailure(['schema_missing', 'session_expired']),
    );
  });
});

describe('toFailureCode — הצרה, ⛔ ולא אמון בשרת (T-146ⓒ)', () => {
  it('שני הקודים הידועים עוברים כמות שהם', () => {
    expect(toFailureCode('session_expired')).toBe('session_expired');
    expect(toFailureCode('schema_missing')).toBe('schema_missing');
  });

  it('⛔ כל דבר אחר נופל ל-`unavailable` ⛔ ולא זולג למסך', () => {
    for (const raw of ['boom', '', null, undefined, 42, {}, 'session_expired ']) {
      expect(toFailureCode(raw)).toBe('unavailable');
    }
  });
});
