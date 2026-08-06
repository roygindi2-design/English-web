import { describe, expect, it } from 'vitest';
import {
  AUTH_MESSAGES_HE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_TOGGLE_LABELS_HE,
  checkCredentials,
  confirmationNoticeHe,
  destinationAfterAuth,
  isCredentialPayload,
  isPlausibleEmail,
  mapAuthError,
  normalizeEmail,
  passwordInputType,
  passwordToggleLabel,
  signupOutcome,
} from './auth';

describe('normalizeEmail', () => {
  it('trims and lowercases what a mobile keyboard produces', () => {
    expect(normalizeEmail('  Roy@Example.COM ')).toBe('roy@example.com');
  });
});

describe('isPlausibleEmail', () => {
  it('accepts ordinary addresses', () => {
    for (const e of ['a@b.co', 'roy.gindi+test@gmail.com', 'x@sub.domain.ac.il']) {
      expect(isPlausibleEmail(e)).toBe(true);
    }
  });

  it('rejects what cannot be an address', () => {
    for (const e of ['', 'roy', 'roy@', '@gmail.com', 'roy@gmail', 'roy @gmail.com', 'a@b@c.com']) {
      expect(isPlausibleEmail(e)).toBe(false);
    }
  });
});

describe('checkCredentials — signup', () => {
  it('enforces the 8 character floor and nothing else', () => {
    expect(checkCredentials({ email: 'roy@example.com', password: '12345678' }, 'signup').ok).toBe(true);
    // No composition rule: a long all-lowercase passphrase is fine.
    expect(checkCredentials({ email: 'roy@example.com', password: 'correcthorse' }, 'signup').ok).toBe(true);
  });

  it('reports a short password on the password field only', () => {
    const result = checkCredentials({ email: 'roy@example.com', password: '1234567' }, 'signup');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.password).toBe(AUTH_MESSAGES_HE.weak_password);
    expect(result.fieldErrors.email).toBeUndefined();
  });

  it('normalizes the email it hands back', () => {
    const result = checkCredentials({ email: ' ROY@Example.com ', password: 'abcdefgh' }, 'signup');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.email).toBe('roy@example.com');
  });

  it('states the real minimum in the Hebrew message', () => {
    expect(AUTH_MESSAGES_HE.weak_password).toContain(String(PASSWORD_MIN_LENGTH));
  });
});

describe('checkCredentials — login', () => {
  it('does not apply the length rule to an existing account', () => {
    expect(checkCredentials({ email: 'roy@example.com', password: 'old' }, 'login').ok).toBe(true);
  });

  it('rejects an empty password without hinting at the stored one', () => {
    const result = checkCredentials({ email: 'roy@example.com', password: '' }, 'login');
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.password).toBe(AUTH_MESSAGES_HE.invalid_credentials);
  });
});

describe('mapAuthError', () => {
  it('recognises a taken address', () => {
    expect(mapAuthError({ code: 'user_already_exists' })).toBe('email_taken');
    expect(mapAuthError({ code: 'email_exists' })).toBe('email_taken');
  });

  it('collapses wrong details into one non-enumerating code', () => {
    expect(mapAuthError({ code: 'invalid_credentials', status: 400 })).toBe('invalid_credentials');
    expect(mapAuthError({ code: null, status: 401 })).toBe('invalid_credentials');
  });

  it('recognises throttling', () => {
    expect(mapAuthError({ code: 'over_email_send_rate_limit' })).toBe('rate_limited');
    expect(mapAuthError({ code: null, status: 429 })).toBe('rate_limited');
  });

  it('degrades an unknown provider code to unavailable rather than guessing', () => {
    expect(mapAuthError({ code: 'some_future_code', status: 500 })).toBe('unavailable');
    expect(mapAuthError({})).toBe('unavailable');
  });
});

describe('messages', () => {
  it('never exposes a raw provider code or English to the learner', () => {
    for (const message of Object.values(AUTH_MESSAGES_HE)) {
      expect(message).not.toMatch(/[A-Za-z]/);
      expect(message.length).toBeGreaterThan(4);
    }
  });

  it('does not tell an attacker whether the account exists', () => {
    expect(AUTH_MESSAGES_HE.invalid_credentials).not.toContain('קיים');
    expect(AUTH_MESSAGES_HE.invalid_credentials).not.toContain('נמצא');
  });
});

describe('signup outcome', () => {
  it('routes a live session straight into onboarding', () => {
    expect(signupOutcome(true)).toBe('session_active');
    expect(destinationAfterAuth(signupOutcome(true))).toBe('/onboarding');
  });

  it('routes a pending confirmation to the login screen, not into the product', () => {
    expect(signupOutcome(false)).toBe('awaiting_email_confirmation');
    expect(destinationAfterAuth(signupOutcome(false))).toBe('/login');
  });
});

/**
 * F-004 — `await request.json()` returns `null` for the body `null` without
 * throwing, so the try/catch never fired and `payload.email` crashed the route
 * to HTTP 500 with a stack trace in the log. Cheap log-flooding primitive for
 * an unauthenticated attacker, and a broken response contract for everyone.
 */
describe('F-004: request body shape guard', () => {
  it('rejects the bodies that used to reach a property access', () => {
    for (const body of [null, undefined, [], ['a'], 'null', 7, true]) {
      expect(isCredentialPayload(body)).toBe(false);
    }
  });

  it('accepts a plain object, even one missing the fields', () => {
    expect(isCredentialPayload({})).toBe(true);
    expect(isCredentialPayload({ email: 'roy@example.com', password: 'x'.repeat(8) })).toBe(true);
  });

  it('a rejected body still reads as a credential object once guarded', () => {
    const body: unknown = null;
    // This is exactly the sequence in the route handlers: guard, then read.
    expect(isCredentialPayload(body) ? String(body.email ?? '') : 'guarded').toBe('guarded');
  });
});

/**
 * F-013. Email confirmation is off (Q-001 ⓑ), so a mistyped password is an
 * account that can never be entered again and a mistyped address is an account
 * that can never be recovered. Both need to be visible before submit.
 */
describe('F-013: password visibility', () => {
  it('maps visibility to the input type', () => {
    expect(passwordInputType(false)).toBe('password');
    expect(passwordInputType(true)).toBe('text');
  });

  it('labels the toggle by what it will do next', () => {
    expect(passwordToggleLabel(false)).toBe(PASSWORD_TOGGLE_LABELS_HE.show);
    expect(passwordToggleLabel(true)).toBe(PASSWORD_TOGGLE_LABELS_HE.hide);
    expect(PASSWORD_TOGGLE_LABELS_HE.show).not.toBe(PASSWORD_TOGGLE_LABELS_HE.hide);
  });
});

describe('F-013: confirmationNoticeHe', () => {
  it('names the address the learner actually registered', () => {
    expect(confirmationNoticeHe('Roy@Example.COM')).toContain('roy@example.com');
  });

  it('offers a way out when the address is wrong', () => {
    expect(confirmationNoticeHe('roy@example.com')).toContain('לא הכתובת שלך');
  });

  it('falls back to a generic sentence when no address came back', () => {
    const notice = confirmationNoticeHe('  ');
    expect(notice.length).toBeGreaterThan(0);
    expect(notice).not.toContain('  ');
  });
});
