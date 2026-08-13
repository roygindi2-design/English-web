import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The landing destination after onboarding — T-051 · § 4.2ב flow 1.
 *
 * The endpoint returns `{ ok: true, next }` and `components/OnboardingForm.tsx`
 * navigates to whatever string arrives. That makes `next` the single place the
 * post-onboarding destination is decided, and a one-character edit here moves
 * the learner to a different screen with nothing else in the repo objecting.
 *
 * Both assertions run on the SOURCE, not on a live call: the route needs
 * Supabase env and a real session, and `docs/api-contract.md` is a document.
 * The cross-file assertion is the point — F-029's shape is a live number in a
 * document drifting away from the code that produces it, and the contract is
 * required to be updated in the same commit as the route (RULES, Dev § 5).
 */
const ROUTE = readFileSync('app/api/profile/route.ts', 'utf8');
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(ROUTE);

describe('POST /api/profile — the post-onboarding destination (§ 4.2ב)', () => {
  it('sends the learner to the לימודים tab, not to the flow screen', () => {
    expect(CODE).toMatch(/next:\s*'\/studies'/);
  });

  it('no longer sends anyone to /study, which is a flow screen with no tab bar', () => {
    expect(CODE).not.toMatch(/next:\s*'\/study'/);
  });

  it('is documented with the same string it returns', () => {
    expect(CONTRACT).toContain('"next": "/studies"');
    expect(CONTRACT).not.toContain('"next": "/study"');
  });
});
