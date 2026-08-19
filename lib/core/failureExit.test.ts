import { describe, expect, it } from 'vitest';
import { failureExit, isRetryable, type FailureCode } from './failureExit';

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
