/**
 * D-057 · T-113 — the "fails closed" gate for the local dev test user.
 *
 * Roy's explicit risk decision (D-057, 19/08). PM and Critic objections were
 * recorded and overruled by the owner — this is his call, and this file's
 * only job is enforcing it exactly as written, not a comma wider.
 *
 * `production` is checked FIRST, on `nodeEnv !== 'development'` (⛔ not the
 * inverse `=== 'production'`): `undefined`, `''`, `'test'`, `'staging'` are
 * all closed. This matters because the "not_configured" message is an
 * oracle — it would tell an unauthorized reader the feature exists and what
 * is missing to turn it on. In production it must never be reachable.
 *
 * ⛔ Zero `process.env` here — this module is pure. The env read lives in
 * `lib/supabase/devUser.ts` only.
 */

export type DevUserGateClosedReason =
  | 'production' // NODE_ENV !== 'development' — overrides everything else
  | 'not_configured' // one of the two variables is missing/blank — the default
  | 'unsafe_password'; // password shorter than DEV_USER_MIN_PASSWORD

export type DevUserGate =
  | { readonly open: false; readonly reason: DevUserGateClosedReason }
  | { readonly open: true; readonly credentials: { readonly email: string; readonly password: string } };

export const DEV_USER_MIN_PASSWORD = 12;

export function devUserGate(input: {
  readonly nodeEnv: string | undefined;
  readonly email: string | undefined;
  readonly password: string | undefined;
}): DevUserGate {
  if (input.nodeEnv !== 'development') {
    return { open: false, reason: 'production' };
  }

  const email = (input.email ?? '').trim();
  const password = input.password ?? '';

  if (email.length === 0 || password.trim().length === 0) {
    return { open: false, reason: 'not_configured' };
  }

  if (password.length < DEV_USER_MIN_PASSWORD) {
    return { open: false, reason: 'unsafe_password' };
  }

  return { open: true, credentials: { email: email.toLowerCase(), password } };
}
