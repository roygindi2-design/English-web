import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * T-122 · TD-25 — המנעול השני, כשומר מקור.
 *
 * המסך דורש Supabase env וסשן חי, ולכן התנהגותו אינה ניתנת להרצה כאן (אותה
 * סיבה שבגללה `app/(tabs)/me/page.test.ts` הוא שומר מקור). ההחלטה עצמה נמדדת
 * ב-`lib/core/entryRoute.test.ts`.
 */
const SRC = readFileSync('app/onboarding/page.tsx', 'utf8');
const CODE = withoutComments(SRC);

describe('מסך ה-onboarding בודק בעצמו', () => {
  it('קורא onboarded_at ⛔ ולא רק session', () => {
    expect(CODE).toContain('onboarded_at');
  });

  it('משתמש באותה פונקציה טהורה שהפרוקסי משתמש בה ⛔ ולא בהעתק', () => {
    expect(CODE).toContain('signedInRedirect');
    expect(CODE).toContain('onboardedFromRow');
  });

  it('הבדיקה קודמת לרינדור הטופס במקור', () => {
    expect(CODE.indexOf('signedInRedirect')).toBeLessThan(CODE.indexOf('OnboardingForm />'));
  });
});
