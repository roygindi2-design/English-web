import { describe, expect, it } from 'vitest';
import {
  HOME_PATH,
  SIGNED_IN_HINT_COOKIE,
  hasSignedInHint,
  isEntryPath,
  ONBOARDING_PATH,
  onboardedFromRow,
  signedInRedirect,
  type OnboardedState,
} from './entryRoute';

/**
 * T-122 · D-063 · TD-25 — הלומד החוזר מפסיק להיזרק לטופס.
 *
 * זו בדיקת יחידה אמיתית ⛔ ולא שומר-מקור: ההחלטה היא פונקציה טהורה, ולכן אפשר
 * להריץ אותה. שומרי המקור על `proxy.ts` ועל `app/onboarding/page.tsx` מוכיחים
 * רק שהם *קוראים* לפונקציה הזאת — ההתנהגות עצמה נמדדת כאן.
 */
describe('signedInRedirect — נתיבי הכניסה', () => {
  const ENTRY_PATHS = ['/', '/login', '/signup'];

  it('לומד שסיים onboarding נשלח מכל נתיב כניסה אל /studies', () => {
    for (const pathname of ENTRY_PATHS) {
      expect(signedInRedirect(pathname, true)).toBe(HOME_PATH);
    }
  });

  it('לומד חדש נשלח מכל נתיב כניסה אל /onboarding', () => {
    for (const pathname of ENTRY_PATHS) {
      expect(signedInRedirect(pathname, false)).toBe(ONBOARDING_PATH);
    }
  });

  it('⛔ קריאה שנכשלה אינה שולחת לטופס — היא שולחת ל-/studies', () => {
    // זהו הבאג עצמו, רק מסיבה אחרת: /studies נושא סרגל לשוניות ומטפל
    // ב-exam_date חסר, ו-/onboarding הוא מלכודת בלי דרך החוצה.
    for (const pathname of ENTRY_PATHS) {
      expect(signedInRedirect(pathname, 'unknown')).toBe(HOME_PATH);
    }
  });
});

describe('signedInRedirect — מסך ה-onboarding עצמו', () => {
  it('לומד שכבר סיים ⛔ אינו רואה את הטופס שוב, גם בכתובת ישירה', () => {
    expect(signedInRedirect(ONBOARDING_PATH, true)).toBe(HOME_PATH);
  });

  it('לומד חדש נשאר בטופס', () => {
    expect(signedInRedirect(ONBOARDING_PATH, false)).toBeNull();
  });

  it('⛔ קריאה שנכשלה אינה זורקת אותו החוצה באמצע הטופס', () => {
    // הוא כבר על המסך. הוצאה בכוח מכשל קריאה תמחק טופס שמולא למחצה.
    expect(signedInRedirect(ONBOARDING_PATH, 'unknown')).toBeNull();
  });
});

describe('signedInRedirect — כל שאר המסכים', () => {
  it('⛔ אינו נוגע במסכים שאינם נתיב כניסה', () => {
    for (const pathname of ['/studies', '/cards', '/me', '/study', '/world', '/arcade']) {
      for (const state of [true, false, 'unknown'] as OnboardedState[]) {
        expect(signedInRedirect(pathname, state)).toBeNull();
      }
    }
  });

  it('⛔ אינו מפיל תת-נתיב של מסך כניסה בטעות', () => {
    // `/login-help` אינו `/login`. התאמת תחילית שמתעלמת מהגבול הייתה
    // מפנה מסך ציבורי עתידי בלי שאיש התכוון.
    expect(signedInRedirect('/login-help', true)).toBeNull();
    expect(signedInRedirect('/onboarding-preview', true)).toBeNull();
  });
});

describe('onboardedFromRow — התשובה מ-PostgREST אינה בשליטתנו', () => {
  it('חותמת זמן ⇒ סיים', () => {
    expect(onboardedFromRow({ onboarded_at: '2026-08-01T10:00:00Z' })).toBe(true);
  });

  it('null בעמודה ⇒ לא סיים. זו שורה שקיימת ונקראה', () => {
    expect(onboardedFromRow({ onboarded_at: null })).toBe(false);
  });

  it('מחרוזת ריקה ⇒ לא סיים', () => {
    expect(onboardedFromRow({ onboarded_at: '   ' })).toBe(false);
  });

  it('⛔ אין שורה, אין אובייקט, או טיפוס לא צפוי ⇒ unknown ⛔ ולא false', () => {
    // ההבדל הוא כל המשימה: `false` שולח לטופס, `unknown` שולח הביתה.
    expect(onboardedFromRow(null)).toBe('unknown');
    expect(onboardedFromRow(undefined)).toBe('unknown');
    expect(onboardedFromRow([])).toBe('unknown');
    expect(onboardedFromRow('2026-08-01')).toBe('unknown');
    expect(onboardedFromRow({})).toBe('unknown');
    expect(onboardedFromRow({ onboarded_at: 42 })).toBe('unknown');
  });
});

describe('T-525 — the entry screens outside the proxy', () => {
  it('isEntryPath accepts exactly the three entry screens', () => {
    for (const p of ['/', '/login', '/signup']) expect(isEntryPath(p)).toBe(true);
    for (const p of ['/studies', '/login-help', '/onboarding', '/sources', '', '//evil.example'])
      expect(isEntryPath(p)).toBe(false);
  });

  it('hasSignedInHint reads the exact cookie, ⛔ not a lookalike or another value', () => {
    expect(hasSignedInHint(`${SIGNED_IN_HINT_COOKIE}=1`)).toBe(true);
    expect(hasSignedInHint(`a=b; ${SIGNED_IN_HINT_COOKIE}=1; c=d`)).toBe(true);
    expect(hasSignedInHint('')).toBe(false);
    expect(hasSignedInHint(`${SIGNED_IN_HINT_COOKIE}=0`)).toBe(false);
    expect(hasSignedInHint(`x-${SIGNED_IN_HINT_COOKIE}=1`)).toBe(false);
    expect(hasSignedInHint(`${SIGNED_IN_HINT_COOKIE}=10`)).toBe(false);
  });
});
