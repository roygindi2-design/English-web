import { readFileSync } from 'node:fs';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import proxy, { isProtectedPath } from './proxy';
import { withoutComments } from '@/lib/testSource';

/**
 * F-003 — the session guard must fail closed.
 *
 * The bug: `if (!env) return response;`. A missing or misspelled
 * NEXT_PUBLIC_SUPABASE_* variable (a Netlify typo, or a Deploy Preview that
 * does not inherit env vars) disabled the guard entirely and served every
 * protected screen to an anonymous request with HTTP 200.
 */

function get(pathname: string) {
  return new NextRequest(new Request(`https://example.com${pathname}`));
}

describe('F-003: proxy with no Supabase configuration', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('redirects a protected screen to /login instead of rendering it', async () => {
    const response = await proxy(get('/onboarding'));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get('location') as string);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('expired')).toBe('1');
  });

  it('redirects nested protected paths too, not just the exact match', async () => {
    const response = await proxy(get('/onboarding/step-2'));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get('location') as string).pathname).toBe('/login');
  });

  it('still lets public screens render, so the site is not dead', async () => {
    for (const path of ['/', '/login', '/signup']) {
      const response = await proxy(get(path));
      expect(response.headers.get('location')).toBeNull();
    }
  });
});

describe('protected path matching', () => {
  it('matches the screen and everything under it', () => {
    expect(isProtectedPath('/onboarding')).toBe(true);
    expect(isProtectedPath('/onboarding/goal')).toBe(true);
  });

  it('does not match a lookalike prefix', () => {
    expect(isProtectedPath('/onboarding-preview')).toBe(false);
    expect(isProtectedPath('/login')).toBe(false);
  });
});

/**
 * T-051, task 3 — the three tab routes join the same guard.
 *
 * `/studies`, `/cards` and `/me` all read the learner's own rows, so an
 * anonymous request must never reach them. The screens carry their own session
 * check as well (the F-003 lesson: one lock on a door is a single point of
 * failure) — this describes the outer lock.
 */
describe('the tab routes are behind the session wall (T-051 · § 4.2ב)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');
  });
  afterEach(() => vi.unstubAllEnvs());

  for (const path of ['/studies', '/cards', '/me']) {
    it(`sends an anonymous request for ${path} to /login`, async () => {
      const response = await proxy(get(path));
      expect(response.status).toBe(307);
      const location = new URL(response.headers.get('location') as string);
      expect(location.pathname).toBe('/login');
      expect(location.searchParams.get('expired')).toBe('1');
    });

    it(`${path} is matched by isProtectedPath`, () => {
      expect(isProtectedPath(path)).toBe(true);
    });
  }

  it('does not protect a lookalike prefix of a tab route', () => {
    // `/cards-demo` is not `/cards`. Prefix matching that ignores the boundary
    // would lock a future public screen by accident.
    expect(isProtectedPath('/cards-demo')).toBe(false);
    expect(isProtectedPath('/me-too')).toBe(false);
  });

  it('leaves the harness fixtures public, or check:mobile measures /login', () => {
    // The F-027 cause-1 lesson, in a test: a session-gated fixture answers 307
    // and the harness silently measures the login screen instead of the screen
    // it names in its own report.
    expect(isProtectedPath('/dev/tabs/studies')).toBe(false);
    expect(isProtectedPath('/dev/tabs/me')).toBe(false);
  });
});

/**
 * T-122 · TD-25 — שומר מקור, ולא בדיקת התנהגות.
 *
 * ⛔ מה שהוא ⛔ אינו מוכיח, ונאמר כאן כדי שאיש לא יטעה בירוק הזה לכיסוי:
 * שהניתוב באמת קורה מול Supabase חי. ההחלטה עצמה נמדדת ב-
 * `lib/core/entryRoute.test.ts`, וזה הקובץ שבו התנהגות נבדקת.
 * מה שהוא כן מוכיח: ש-`proxy.ts` מאציל לפונקציה הטהורה ⛔ ואינו משכפל אותה,
 * ושהיעד הקשיח `/onboarding` נעלם מענף המשתמש המחובר.
 */
describe('T-122: הלומד החוזר ⛔ אינו נזרק לטופס', () => {
  const SRC = readFileSync('proxy.ts', 'utf8');
  const CODE = withoutComments(SRC);

  it('ההחלטה מואצלת ל-lib/core ⛔ ואינה משוכפלת כאן', () => {
    expect(CODE).toContain('signedInRedirect');
    expect(CODE).toContain('onboardedFromRow');
  });

  it('⛔ אין עוד יעד /onboarding קשיח בענף המשתמש המחובר', () => {
    // זו השורה עצמה: `redirectPreservingCookies(request, response, '/onboarding')`.
    expect(CODE).not.toMatch(/redirectPreservingCookies\([^)]*['"]\/onboarding['"]/);
  });

  it('onboarded_at נקרא — הבדיקה שהמסך היה חייב לעשות ומעולם לא עשה', () => {
    expect(CODE).toContain('onboarded_at');
  });

  it('⛔ הקריאה למאגר צרה: היא מותנית בנתיב ⛔ ואינה רצה על כל בקשה', () => {
    const guard = CODE.indexOf('needsOnboardingState');
    const query = CODE.indexOf(".from('profiles')");
    expect(guard).toBeGreaterThan(-1);
    expect(query).toBeGreaterThan(guard);
  });
});
