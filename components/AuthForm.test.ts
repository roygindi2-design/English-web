import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { UNREACHABLE_HE } from '@/lib/core/failure';

/**
 * T-274 · D-195 — the `ApiUnreachableError` branch in `AuthForm` was a ternary
 * whose two arms were identical, word for word (measured C-0478,
 * `components/AuthForm.tsx:134-137`). A learner whose network dropped mid-submit
 * read `AUTH_MESSAGES_HE.unavailable` — a sentence that sounds like "what you
 * typed is wrong" — and guessed the fault was theirs.
 *
 * Source-scanning, like every other guard in `components/` (vitest env is
 * `node`; no React render here). The test reads `AuthForm.tsx` read-only and
 * derives the identifiers from it — it ⛔ never restates the Hebrew by hand,
 * so no third copy of the sentence exists to drift (the
 * `components/LevelMapScreen.test.ts:185` pattern).
 */
const CODE = readFileSync('components/AuthForm.tsx', 'utf8');

/** The `cause instanceof ApiUnreachableError ? A : B` expression, split into its
 *  two arms. Whitespace inside the arms is collapsed so a line break between
 *  `?` and `:` does not count as a difference. */
function unreachableArms(): { whenUnreachable: string; otherwise: string } {
  const m = CODE.match(/instanceof ApiUnreachableError\s*\?\s*([\s\S]+?)\s*:\s*([\s\S]+?)\s*\)\s*;/);
  if (!m) throw new Error('AuthForm.tsx no longer branches on ApiUnreachableError');
  const a = m[1] ?? '';
  const b = m[2] ?? '';
  return { whenUnreachable: a.replace(/\s+/g, ' ').trim(), otherwise: b.replace(/\s+/g, ' ').trim() };
}

describe('T-274 · the network-failure branch on /login and /signup says what happened', () => {
  it('the two arms of the ApiUnreachableError condition are ⛔ not the same string', () => {
    const { whenUnreachable, otherwise } = unreachableArms();
    expect(whenUnreachable).not.toBe(otherwise);
  });

  it('the ApiUnreachableError path prints the shared sentence from lib/core/failure', () => {
    expect(typeof UNREACHABLE_HE).toBe('string');
    const { whenUnreachable } = unreachableArms();
    expect(whenUnreachable).toBe('UNREACHABLE_HE');
    // Imported, not declared locally: one sentence, one place (T-056 · T-273).
    expect(CODE).toMatch(/import \{[^}]*\bUNREACHABLE_HE\b[^}]*\} from '@\/lib\/core\/failure'/);
  });

  it('an ordinary failure still prints AUTH_MESSAGES_HE.unavailable — nothing else moved', () => {
    const { otherwise } = unreachableArms();
    expect(otherwise).toBe('AUTH_MESSAGES_HE.unavailable');
    // The non-throwing path (a server answer with no message) keeps its fallback too.
    expect(CODE).toContain('result.message ?? AUTH_MESSAGES_HE.unavailable');
  });

  it('AuthForm ⛔ declares no failure sentence of its own', () => {
    const own = CODE.match(/const \w*_HE = '/g) ?? [];
    expect(own).toEqual([]);
  });

  it('⛔ no second CTA — the submit button is the retry (taste-skill § 4.5, D-195 § 2)', () => {
    const primary = CODE.match(/data-primary-action/g) ?? [];
    expect(primary).toHaveLength(1);
    expect(CODE).not.toMatch(/RETRY_HE/);
  });
});

/**
 * F-190 · measured C-0479 on a live `next dev` log: with the page served from
 * SSR and the JS bundle not yet loaded (403 on the chunks that day, a slow
 * network any other day), tapping «התחברות» performed a NATIVE submit and the
 * server logged `GET /login?email=…&password=…`. HTML's default form method is
 * GET, both inputs carry `name`, and the form had no `method` — so the
 * learner's password landed in the URL bar, browser history, server/CDN logs
 * and the next page's `Referer`. `onSubmit` only exists after hydration.
 */
describe('F-190 · a pre-hydration submit ⛔ never puts the password in the URL', () => {
  /** The opening tag of the auth form, attributes and all. */
  function authFormTag(): string {
    const m = CODE.match(/<form\b[^>]*\bid="auth-form"[^>]*>/);
    if (!m) throw new Error('AuthForm.tsx no longer renders <form id="auth-form">');
    return m[0];
  }

  it('the auth <form> declares method="post" — the native fallback is a POST body, ⛔ not a GET query', () => {
    expect(authFormTag()).toMatch(/\bmethod="post"/i);
  });

  it('the credential inputs still carry `name` — the guard above is what makes that safe', () => {
    // If `name` were dropped instead, a native submit would silently send nothing
    // and the JS path would keep working — a fix that hides the hole, not one
    // that closes it. The guard is on the method; the names stay.
    expect(CODE).toMatch(/name="email"/);
    expect(CODE).toMatch(/name="password"/);
  });
});
