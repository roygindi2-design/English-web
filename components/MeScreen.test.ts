import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

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

/**
 * C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing.
 *
 * 🧪 **T-302 — imported now, ⛔ not written here.** The copy that used to sit on this line
 * carried `/\{\s*\/\*[\s\S]*?\*\/\s*\}/`, whose `\s*` let its `{` match a declaration
 * brace and run to the next `*\/}` — measured in `C-0543` as **12,943 chars ⇒ 4,374** on
 * this very component, `goal: LearnerGoal` · `apiGet<` · `primaryStudyTrack(` inside the
 * hole. ⇒ every `not.toContain` below was a negative assertion on a truncated string,
 * which is green whether the forbidden thing is there or not.
 *
 * ⚠️ `lib/testSource.ts` is the fixed expression and `lib/testSource.test.ts` is what
 * fails if the `\s*` comes back. ⛔ The other 27 local copies are `T-284`, ⛔ not this row.
 */

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

  /**
   * T-145ⓐⓒ · D-079: the sign-out stopped being the primary action 26/08 — it
   * measured `data-primary-action="true"` on `POST /logout`, which made
   * "leave" the most prominent thing a learner could do on their own tab.
   * ⛔ It is NOT removed (ⓒ) — it stays in normal flow, still this tab's home
   * (F-027: no screen without a way out) — it just carries no marker any more.
   */
  it('⛔ no longer marks the sign-out as the primary action (D-079 · T-145ⓐ)', () => {
    const form = CODE.match(/<form action="\/logout"[\s\S]*?<\/form>/)?.[0];
    expect(form, 'the /logout form was not found').toBeDefined();
    expect(form).not.toContain('data-primary-action');
  });

  it('carries exactly one [data-primary-action] (F-027 · check:mobile)', () => {
    expect(CODE.match(/data-primary-action="true"/g)?.length).toBe(1);
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
   * T-301. The counted figure and its failure branch moved to
   * `<MeWordsLearned>` so the route can stream it inside its own `<Suspense>`.
   * ⛔ The guards moved WITH it — `components/MeWordsLearned.test.ts` — exactly as
   * they moved out of `page.tsx` in C-0075. What this file still owns is the fact
   * that the slot is RENDERED here, and that this component decides ⛔ nothing
   * about the number: a slot quietly dropped would leave the tab with no count at
   * all and every other guard here would still pass.
   */
  it('renders the counted figure as a slot and ⛔ decides nothing about it (T-301)', () => {
    expect(CODE).toContain('{wordsLearnedSlot}');
    expect(CODE).toMatch(/readonly wordsLearnedSlot:\s*React\.ReactNode/);
    // ⛔ No second definition of either state left behind here.
    expect(CODE).not.toContain('wordsLearned === null');
    expect(CODE).not.toContain('FAILURE_HE');
    expect(CODE).not.toContain('מילים שנלמדו');
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

describe('T-145 — «אני» מקבלת פעולה אמיתית (D-079 · § 4.2טז)', () => {
  it("is a client component — needed to fetch GET /api/levels/summary itself, the <StudiesScreen> pattern", () => {
    expect(SRC.trimStart().startsWith("'use client';")).toBe(true);
  });

  it('reads progress through apiGet, ⛔ never a bare fetch (lib/api/client.ts is the only HTTP layer)', () => {
    expect(CODE).toMatch(/import \{ apiGet \} from '@\/lib\/api\/client'/);
    expect(CODE).toContain("apiGet<");
    expect(CODE).not.toMatch(/[^.]fetch\(/);
  });

  it('ⓑ the primary action leads to /studies, labelled «המשך למידה»', () => {
    expect(CODE).toContain('המשך למידה');
    expect(CODE).toMatch(/href="\/studies"[^>]*data-primary-action="true"|data-primary-action="true"[^>]*href="\/studies"/);
  });

  it('ⓑ the track named on the button is DERIVED — primaryStudyTrack, ⛔ never a hard-coded "אוצר מילים"', () => {
    expect(CODE).toMatch(/import \{[^}]*primaryStudyTrack[^}]*\} from '@\/lib\/core\/studyTracks'/);
    expect(CODE).toContain('primaryStudyTrack(');
    // The literal label string belongs to trackLabelHe/STUDY_TRACKS (studyTracks.ts) alone.
    expect(CODE).not.toMatch(/['"`]אוצר מילים['"`]/);
  });

  it('ⓓ shows the three D-034 counts for the active level — known · in-review · unseen, ⛔ never invented zeros', () => {
    expect(CODE).toContain('ידוע');
    expect(CODE).toContain('ברשימת החזרה');
    expect(CODE).toContain('טרם נראה');
    // `.known` / `.inReviewList` / `.unseen` are levelSummary.ts's own field names —
    // ⛔ no second count anywhere in this file (§ 4.2ז: "אין הגדרה שנייה").
    expect(CODE).toMatch(/\.known\b/);
    expect(CODE).toMatch(/\.inReviewList\b/);
    expect(CODE).toMatch(/\.unseen\b/);
  });

  it('ⓓ the three counts render only once a real level is known, ⛔ never a silent zero while loading/unreachable', () => {
    // The active-level summary is looked up from `levels` — a `null`-guarded
    // lookup, never a bare access that would throw or default to zero.
    expect(CODE).toMatch(/activeSummary\s*!==\s*null/);
  });

  it('the fixture provides a fixed level and levels array, ⛔ not a network-dependent one (T-210/T-246 pattern)', () => {
    const fixture = readFileSync('app/dev/tabs/me/page.tsx', 'utf8');
    expect(fixture).toMatch(/fixtureLevels=/);
    expect(fixture).toMatch(/fixtureLevel=/);
  });
});
