/**
 * Pure auth rules — T-002. No React, no DOM, no network, no env.
 *
 * Everything a screen or an API route needs to *decide* about credentials lives
 * here, so the same rules run unchanged in React Native later (AR-2 / AR-4).
 * The Supabase SDK itself is deliberately absent: this file knows what a valid
 * credential is and what the learner should be told, not who stores it.
 */

/** UX plan T-002: 8 characters, no composition rules. Complexity rules produce
 *  worse passwords and higher abandonment, and a stressed learner abandons happily. */
export const PASSWORD_MIN_LENGTH = 8;

export type AuthMode = 'signup' | 'login';

export type AuthErrorCode =
  | 'invalid_email'
  | 'weak_password'
  | 'email_taken'
  | 'invalid_credentials'
  | 'rate_limited'
  | 'unavailable';

export type FieldErrors = {
  email?: string;
  password?: string;
};

export type CredentialCheck =
  | { ok: true; email: string; password: string }
  | { ok: false; fieldErrors: FieldErrors };

/**
 * A single generic message for bad login details. Never "no such user" —
 * that turns the login screen into a user-enumeration oracle.
 */
export const AUTH_MESSAGES_HE: Record<AuthErrorCode, string> = {
  invalid_email: 'כתובת האימייל לא נראית תקינה',
  weak_password: `הסיסמה צריכה להיות באורך ${PASSWORD_MIN_LENGTH} תווים לפחות`,
  email_taken: 'האימייל הזה כבר רשום',
  invalid_credentials: 'אימייל או סיסמה שגויים',
  rate_limited: 'יותר מדי ניסיונות. אפשר לנסות שוב בעוד כמה דקות',
  unavailable: 'לא הצלחנו להתחבר כרגע',
};

/** Trim + lowercase. Mail domains are case-insensitive and learners type with
 *  a mobile keyboard that capitalises the first letter for them. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Deliberately permissive: one @, something either side, a dot in the domain,
 * no whitespace. Stricter client-side patterns reject real addresses; the
 * authoritative check is the confirmation mail.
 */
export function isPlausibleEmail(raw: string): boolean {
  const email = normalizeEmail(raw);
  if (email.length < 6 || email.length > 254) return false;
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email);
}

export function isAcceptablePassword(raw: string): boolean {
  return raw.length >= PASSWORD_MIN_LENGTH;
}

/**
 * F-004 — the shape guard the route handlers were missing.
 *
 * `await request.json()` on the body `null` does not throw: it returns `null`,
 * slips past the try/catch, and the next property access crashes the handler
 * to a 500 with a full stack trace in the Netlify log. Arrays and bare
 * primitives (`"x"`, `7`, `true`) reach the same dead end. Anything that is not
 * a plain object is rejected here, before a single field is read.
 */
export function isCredentialPayload(
  value: unknown
): value is { email?: unknown; password?: unknown } {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validates a credential pair before it costs a network round-trip.
 * On login we only require non-empty fields: an account created under older
 * rules must still be able to get in, and length feedback on a login screen
 * leaks how long the stored password is.
 */
export function checkCredentials(
  input: { email: string; password: string },
  mode: AuthMode
): CredentialCheck {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const fieldErrors: FieldErrors = {};

  if (!isPlausibleEmail(email)) {
    fieldErrors.email = AUTH_MESSAGES_HE.invalid_email;
  }

  if (mode === 'signup') {
    if (!isAcceptablePassword(password)) {
      fieldErrors.password = AUTH_MESSAGES_HE.weak_password;
    }
  } else if (password.length === 0) {
    fieldErrors.password = AUTH_MESSAGES_HE.invalid_credentials;
  }

  if (fieldErrors.email || fieldErrors.password) return { ok: false, fieldErrors };
  return { ok: true, email, password };
}

/**
 * Translates whatever the auth provider reports into one of our codes.
 * A raw provider string must never reach a Hebrew-speaking learner — same rule
 * as T-001. Anything unrecognised degrades to `unavailable`, which is honest:
 * we do not know what happened, so we do not claim the details were wrong.
 */
export function mapAuthError(raw: { code?: string | null; status?: number | null }): AuthErrorCode {
  const code = (raw.code ?? '').toLowerCase();
  const status = raw.status ?? 0;

  if (code.includes('already') || code === 'email_exists' || code === 'user_already_exists') {
    return 'email_taken';
  }
  if (code === 'weak_password') return 'weak_password';
  if (code === 'email_address_invalid' || code === 'validation_failed') return 'invalid_email';
  if (code === 'invalid_credentials' || code === 'invalid_grant') return 'invalid_credentials';
  if (code.includes('rate_limit') || status === 429) return 'rate_limited';
  if (status === 400 || status === 401) return 'invalid_credentials';
  return 'unavailable';
}

export function messageFor(code: AuthErrorCode): string {
  return AUTH_MESSAGES_HE[code];
}

export type SignupOutcome = 'session_active' | 'awaiting_email_confirmation';

/**
 * Signup can end two ways depending on a Supabase project setting we do not
 * control from code: with a live session, or with a confirmation mail and no
 * session. The product must survive both — see the open question R-008 in
 * plan/20-alerts.md. This function only reports which of the two happened.
 */
export function signupOutcome(hasSession: boolean): SignupOutcome {
  return hasSession ? 'session_active' : 'awaiting_email_confirmation';
}

/** Where the learner goes after a successful auth step. */
export function destinationAfterAuth(outcome: SignupOutcome): '/onboarding' | '/login' {
  return outcome === 'session_active' ? '/onboarding' : '/login';
}

/**
 * F-013 — while email confirmation is off (Q-001 ⓑ) there is no recovery path,
 * so a single unseen typo is a permanently lost account. The eye toggle is the
 * mobile standard and beats a second "confirm password" field on a phone.
 */
export const PASSWORD_TOGGLE_LABELS_HE = {
  show: 'הצגת הסיסמה',
  hide: 'הסתרת הסיסמה',
} as const;

export function passwordInputType(visible: boolean): 'text' | 'password' {
  return visible ? 'text' : 'password';
}

/** Named for the action the button performs next, not for the current state —
 *  that is what a screen reader announces when it reaches the button. */
export function passwordToggleLabel(visible: boolean): string {
  return visible ? PASSWORD_TOGGLE_LABELS_HE.hide : PASSWORD_TOGGLE_LABELS_HE.show;
}

/** Repeats the registered address back, so a mistyped one is caught while the
 *  learner is still on the screen that can fix it. */
export function confirmationNoticeHe(email: string): string {
  const address = normalizeEmail(email);
  if (!address) return 'שלחנו מייל לאישור הכתובת. אחרי האישור אפשר להתחבר.';
  return `שלחנו מייל לאישור הכתובת ${address}. אחרי האישור אפשר להתחבר. לא הכתובת שלך? אפשר להירשם שוב.`;
}
