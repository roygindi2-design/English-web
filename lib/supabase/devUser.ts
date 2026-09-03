import { devUserGate, type DevUserGate } from '@/lib/core/devUser';

/**
 * D-057 · T-113 — the only file in the tree that reads these two variables.
 * Enforced by `lib/supabase/devUser.test.ts` ("is the ONLY file…") the same
 * way `lib/supabase/serviceRole.test.ts` guards SUPABASE_SERVICE_ROLE_KEY.
 *
 * ⚠️ Read `process.env` with a literal dot-property, ⛔ never through a
 * bracket lookup keyed by a variable: Next.js only replaces a STATIC access
 * at build time — a dynamic lookup comes back `undefined` in the bundled
 * output. The two exported constants below exist for tests and docs, not
 * for the read itself.
 */
export const DEV_USER_EMAIL_VAR = 'DEV_TEST_USER_EMAIL';
export const DEV_USER_PASSWORD_VAR = 'DEV_TEST_USER_PASSWORD';

/** ⛔ Zero logic of its own — every `if` here would duplicate the decision. */
export function readDevUserGate(): DevUserGate {
  return devUserGate({
    nodeEnv: process.env.NODE_ENV,
    email: process.env.DEV_TEST_USER_EMAIL,
    password: process.env.DEV_TEST_USER_PASSWORD,
  });
}
