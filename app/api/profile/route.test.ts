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

/**
 * T-003 · § 4.2ד — the institution travels body → checkOnboarding → column.
 *
 * ⚠️ Deviation from the plan, and a deliberate strengthening: the plan asserts
 * against the raw source (`SRC`). These assertions run on `CODE`, the
 * comment-stripped source, for the reason C-0032 recorded — a comment that
 * merely *mentions* `institution: body.institution` would satisfy a raw-text
 * guard while the route reads nothing. The negative assertions gain the most:
 * a `...body` written inside an explanatory comment must not be able to fail a
 * test about what the route actually spreads.
 */
describe('the institution reaches the column (T-003 · § 4.2ד)', () => {
  it('passes the submitted key into checkOnboarding by name', () => {
    expect(CODE).toMatch(/institution:\s*body\.institution/);
  });

  it('writes the validated value and ⛔ never the raw body', () => {
    expect(CODE).toMatch(/institution:\s*check\.answers\.institution/);
    expect(CODE).not.toMatch(/institution:\s*body\.institution[\s\S]{0,200}\.update\(/);
  });

  /**
   * A spread would hand Postgres whatever the caller invented. The route names
   * every key it reads and every column it writes — that is the property, not
   * the specific field.
   */
  it('still spreads nothing from the request body', () => {
    expect(CODE).not.toContain('...body');
    expect(CODE).not.toContain('...payload');
  });

  /**
   * ⚠️ Second deviation from the plan: it slices from the heading to the END of
   * the contract, so the word `institution` appearing anywhere in the five
   * sections that follow — `POST /api/review`, the planned-endpoints table —
   * would satisfy a test whose whole claim is "documented *here*". The slice is
   * bounded by the next `## ` heading instead.
   */
  it('is documented in the same contract the route claims to implement', () => {
    const start = CONTRACT.indexOf('## POST /api/profile');
    expect(start).toBeGreaterThan(-1);
    const rest = CONTRACT.slice(start + 1);
    const end = rest.indexOf('\n## ');
    const section = end === -1 ? rest : rest.slice(0, end);
    expect(section).toContain('institution');
    expect(section).toContain('120');
  });
});
