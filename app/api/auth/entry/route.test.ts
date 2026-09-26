import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * T-525 — a source guard, same shape and same limits as the login route's: there is
 * no Supabase project here, so the handler's behaviour cannot be reached. The
 * decision itself is measured in `lib/core/entryRoute.test.ts`; this proves the
 * route DELEGATES to it and never widens what it will judge.
 */
const CODE = withoutComments(readFileSync('app/api/auth/entry/route.ts', 'utf8')).replace(
  /^import[\s\S]*?;$/gm,
  '',
);

describe('GET /api/auth/entry', () => {
  it('delegates the redirect to signedInRedirect — ⛔ no second copy of the rule', () => {
    expect(CODE).toContain('signedInRedirect(');
    expect(CODE).toContain('onboardedFromRow(');
    expect(CODE).not.toMatch(/['"]\/studies['"]|['"]\/onboarding['"]/);
  });

  it('judges only an entry path, and checks that BEFORE it reads the session', () => {
    const guard = CODE.indexOf('isEntryPath(');
    const session = CODE.indexOf('supabase.auth.');
    expect(guard).toBeGreaterThan(-1);
    expect(session).toBeGreaterThan(guard);
  });

  it('keeps the hint honest: set with a session, cleared without one', () => {
    expect(CODE).toMatch(/cookies\.set\(SIGNED_IN_HINT_COOKIE/);
    expect(CODE).toMatch(/cookies\.delete\(SIGNED_IN_HINT_COOKIE/);
  });
});
