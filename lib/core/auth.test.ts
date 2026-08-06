import { describe, expect, it } from 'vitest';
import {
  AUTH_MESSAGES_HE,
  PASSWORD_MIN_LENGTH,
  checkCredentials,
  destinationAfterAuth,
  isPlausibleEmail,
  mapAuthError,
  normalizeEmail,
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
