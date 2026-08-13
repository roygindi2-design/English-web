import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * אני — the learner tab (D-027 · § 4.2ב: "כל מה שהוא **על הלומד**").
 *
 * A source guard and not a render test: the screen reads the session and the
 * learner's own rows, so it cannot run in this suite's node environment
 * (vitest.config.ts explains why jsdom is not installed). Geometry is measured
 * by `check:mobile` through the `/dev/tabs/me` fixture.
 *
 * ⚠️ C-0075: the markup moved to `components/MeScreen.tsx` so the fixture and
 * the real screen render the SAME component instead of two copies (F-027 cause
 * 2). The guards that describe markup moved with it, to `MeScreen.test.ts` —
 * ⛔ none were dropped. What stays here is what this file still owns: the
 * session gate, the read, and the shape of the value handed to the component.
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

  it('renders the same component the harness fixture renders (F-027 cause 2)', () => {
    expect(CODE).toContain('MeScreen');
    expect(readFileSync('app/dev/tabs/me/page.tsx', 'utf8')).toContain('MeScreen');
  });

  /**
   * The one thing this file decides about the screen, and the reason the prop is
   * `number | null` rather than `number`: a failed read and a learner who has
   * learned nothing look identical once the failure is flattened to `0`, and
   * only one of them is true. `count ?? 0` applies ONLY on the success branch.
   */
  it('hands the component null on a failed read, ⛔ never a zero', () => {
    expect(CODE).toMatch(/error\s*\?\s*null/);
    expect(CODE).toContain('count ?? 0');
  });

  it('carries ⛔ no ActionBar — D-028 forbids two bottom bars on one screen', () => {
    expect(CODE).not.toContain('ActionBar');
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
