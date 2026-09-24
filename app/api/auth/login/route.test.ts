import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * A source guard, same shape and same limits as app/api/world/status/route.test.ts:
 * the vitest environment is node and there is no Supabase project here, so the
 * behaviour of the handler cannot be reached. What it proves is the part that is
 * otherwise believed rather than measured — the ORDER of the guards, which is the
 * whole security property of F-008ⓑ.
 */
const SRC = readFileSync('app/api/auth/login/route.ts', 'utf8');
const CODE = withoutComments(SRC)
  // ⚠️ Imports are stripped, and this is the assertion that carries the file.
  // Measured C-0160: with the import block left in, `indexOf('checkAuthRateLimit')`
  // finds the IMPORT — which is above every statement by definition — so the order
  // test below passed even after the gate was moved BELOW `supabase.auth.signUp`.
  // The one property F-008ⓑ exists to hold was guarded by nothing.
  .replace(/^import[\s\S]*?;$/gm, '');

describe('POST /api/auth/login — the rate limit gate', () => {
  it('rate-limits BEFORE it asks the provider — an oracle answered late is still an oracle', () => {
    const gate = CODE.indexOf('checkAuthRateLimit(');
    const provider = CODE.indexOf('supabase.auth.');
    expect(gate).toBeGreaterThan(-1);
    expect(provider).toBeGreaterThan(gate);
  });

  it('answers 429 with Retry-After, ⛔ not a bare 429', () => {
    expect(CODE).toMatch(/status:\s*429/);
    expect(CODE).toMatch(/'Retry-After':\s*String\(/);
  });

  it('still rate-limits AFTER the shape guard, so a junk body costs no database call', () => {
    expect(CODE.indexOf('isCredentialPayload')).toBeLessThan(CODE.indexOf('checkAuthRateLimit'));
  });

  it('reuses messageFor(\'rate_limited\') — ⛔ no new copy invented in a route file', () => {
    expect(CODE).toMatch(/rate_limited/);
    expect(CODE).toMatch(/messageFor\(/);
  });

  it('limits on the NORMALISED address, so casing cannot buy a fresh bucket', () => {
    // checkCredentials returns the trimmed+lowercased address as `check.email`.
    // Passing the raw payload to the limiter instead would give ROY@x.com its own
    // budget. ⚠️ The assertion is scoped to the limiter's own argument object:
    // `String(payload.email ?? '')` legitimately appears earlier, as the INPUT to
    // checkCredentials, and an unscoped negative match fails on it (measured C-0160).
    const call = CODE.slice(CODE.indexOf('checkAuthRateLimit('));
    const args = call.slice(0, call.indexOf('Date.now()'));
    expect(args).toMatch(/email:\s*check\.email/);
    expect(args).not.toMatch(/payload\.email/);
  });
});
