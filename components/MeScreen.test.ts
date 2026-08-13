import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The markup of the אני tab (§ 4.2ב). These guards were written for
 * `app/(tabs)/me/page.tsx` in C-0073 and moved here in C-0075 with the markup
 * they describe — ⛔ none were dropped, and one was added (the null branch).
 *
 * A source guard and not a render test: the environment is node and jsdom is
 * deliberately not installed (vitest.config.ts). Geometry is `check:mobile`'s
 * job, through the `/dev/tabs/me` fixture that renders this same component.
 */
const SRC = readFileSync('components/MeScreen.tsx', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('<MeScreen> — the learner tab body (T-051 · § 4.2ב)', () => {
  it('shows a count and ⛔ never a readiness estimate or a predicted score (4.4.3)', () => {
    for (const forbidden of ['מוכנות', 'ציון חזוי', 'צפוי לקבל', '%']) {
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
    }
  });

  it('carries the sign-out form, in plain HTML so it works without JavaScript', () => {
    expect(CODE).toMatch(/<form[^>]*action="\/logout"[^>]*method="post"/);
  });

  it("marks the sign-out as the screen's single primary action", () => {
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

  /**
   * The failure branch is the reason this component takes `number | null` and
   * not `number`. A learner staring at `0` after a failed read is being told
   * something false about their own work, in the one place the product claims
   * to report it.
   */
  it('shows a Hebrew sentence and a retry when the read failed, ⛔ not a silent zero', () => {
    expect(CODE).toMatch(/wordsLearned === null/);
    expect(CODE).toContain('לא הצלחנו לטעון את ההתקדמות כרגע.');
    expect(CODE).toContain('נסה שוב');
    // A plain <a>, so the retry reaches the server instead of the router cache.
    expect(CODE).toMatch(/<a href="\/me"/);
  });
});

describe('the "המטרה שלך" block (T-003 · § 4.2ד)', () => {
  it('takes the goal as a required prop, so a caller cannot forget it', () => {
    expect(CODE).toMatch(/goal:\s*LearnerGoal/);
    expect(CODE).not.toMatch(/goal\?:/);
  });

  /**
   * § 4.2ד, the empty edge case: "מוסד ריק וגם ציון ריק → הבלוק אינו מוצג".
   * A heading over an empty area is F-011 with a different name.
   *
   * ⚠️ The plan's assertion here was `/goal\.institution[\s\S]{0,40}goal\.targetScore/`
   * plus `toContain('!== null')`. Measured, not assumed: mutating `||` to `&&`
   * — the exact mutation the plan's own step 7 predicts this test will catch —
   * leaves BOTH assertions true, because ` !== null && ` is the same 13
   * characters as ` !== null || `. The composition itself is the thing under
   * test, so the composition is what the pattern names.
   */
  it('hides itself only when institution and score are BOTH empty', () => {
    expect(CODE).toMatch(/goal\.institution\s*!==\s*null\s*\|\|\s*goal\.targetScore\s*!==\s*null/);
  });

  it('shows a long institution on one line with overflow, ⛔ not wrapped to three', () => {
    expect(CODE).toMatch(/truncate|text-ellipsis/);
  });

  it('⛔ never states a threshold, a readiness estimate or a predicted score', () => {
    for (const forbidden of ['פטור', 'סף', 'מוכנות', 'ציון חזוי', 'נשאר לך', 'נקודות מ']) {
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
    }
  });

  it('names the block in Hebrew', () => {
    expect(CODE).toContain('המטרה שלך');
  });
});

describe('the /me route reads the goal it renders (F-027 cause 2)', () => {
  const page = readFileSync('app/(tabs)/me/page.tsx', 'utf8');
  const fixture = readFileSync('app/dev/tabs/me/page.tsx', 'utf8');

  /**
   * ⚠️ The plan asserts `page.toContain(column)` for each of the three names.
   * Measured: with the whole `.from('profiles')` read deleted and only the goal
   * object left behind, `profile?.institution ?? null` still contains the word
   * `institution`, so all three assertions pass over a screen that reads
   * nothing. The columns are asserted inside the `select()` argument, which a
   * deleted read cannot supply.
   */
  it('selects the three goal columns from profiles', () => {
    expect(page).toContain("from('profiles')");
    const selectArg = page.match(/from\('profiles'\)[\s\S]{0,200}?\.select\(([^)]*)\)/)?.[1] ?? '';
    for (const column of ['institution', 'target_score', 'exam_date']) {
      expect(selectArg, `${column} is not in the select() the screen sends`).toContain(column);
    }
  });

  it('passes a goal to the component, and so does the fixture', () => {
    expect(page).toMatch(/goal=\{/);
    expect(fixture).toMatch(/goal=\{/);
  });

  it('⛔ never turns a failed profile read into an invented goal', () => {
    expect(page).toMatch(/institution:\s*(profile|null)/);
  });
});
