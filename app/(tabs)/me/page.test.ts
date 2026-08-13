import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * אני — the learner tab (D-027 · § 4.2ב: "כל מה שהוא **על הלומד**").
 *
 * A source guard and not a render test: the screen reads the session and the
 * learner's own rows, so it cannot run in this suite's node environment
 * (vitest.config.ts explains why jsdom is not installed). Geometry is measured
 * by `check:mobile` through the `/dev/tabs/me` fixture — task 4 of the
 * navigation-shell plan, ⛔ not this one.
 */
const SRC = readFileSync('app/(tabs)/me/page.tsx', 'utf8');
const ONBOARDING = readFileSync('app/onboarding/page.tsx', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('the אני tab (T-051 · § 4.2ב)', () => {
  it('checks the session itself and does not rely on proxy.ts alone (F-003)', () => {
    expect(CODE).toContain('createRouteClient');
    expect(CODE).toMatch(/redirect\('\/login\?expired=1'\)/);
  });

  it('reads the progress number from word_progress and does not compute one', () => {
    expect(CODE).toContain('word_progress');
    // Mastery is the definition of "learned" (D-010 · lib/core/progress.ts);
    // counting every row would report a word seen once as a word learned.
    expect(CODE).toContain('mastered_at');
  });

  it('shows a count and ⛔ never a readiness estimate or a predicted score (4.4.3)', () => {
    for (const forbidden of ['מוכנות', 'ציון חזוי', 'צפוי לקבל', '%']) {
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
    }
  });

  it('carries the sign-out form, in plain HTML so it works without JavaScript', () => {
    expect(CODE).toMatch(/<form[^>]*action="\/logout"[^>]*method="post"/);
  });

  it('marks the sign-out as the screen\'s single primary action', () => {
    expect(CODE).toContain('data-primary-action="true"');
    expect(CODE.match(/data-primary-action/g)?.length).toBe(1);
  });

  it('carries ⛔ no ActionBar — D-028 forbids two bottom bars on one screen', () => {
    expect(CODE).not.toContain('ActionBar');
  });

  it('links to the sources page, the attribution home § 4.2ב assigns to this tab', () => {
    expect(CODE).toContain('/sources');
  });

  it('anchors its column to the top and never centres it (F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/flex-1[^"'`]*justify-center/);
  });

  it('leaves /onboarding a way out, so an unfinished learner is not trapped', () => {
    // A deliberate deviation from step 3.1 of the plan, which said "moved".
    // Measured: `proxy.ts` sends every signed-in learner from `/` to
    // `/onboarding`, and `/onboarding` lives outside `app/(tabs)` and therefore
    // has no tab bar — so a learner who does not finish the form cannot reach
    // `/me` at all. Deleting the sign-out there re-creates the dead end 🔴 F-027
    // was opened for. The tab is the sign-out's HOME, not its only instance.
    expect(ONBOARDING).toMatch(/action="\/logout"/);
  });
});
