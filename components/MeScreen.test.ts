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
   * 🔴 **T-334 — the slot is gone, and what replaced it is a THIRD state.**
   * T-301 handed the counted figure in as a `ReactNode` for one reason: the value
   * came from the server, and a value cannot stream into a client component
   * through a prop. The read is `GET /api/profile` now, so this component fetches
   * it itself — and the `<Suspense>` boundary that used to reserve its space is
   * this component's own in-flight state.
   *
   * ⛔ **The markup of both resolved states still belongs to `<MeWordsLearned>`**
   * (its guards stay in `components/MeWordsLearned.test.ts`) and the reserved box
   * is still `<MeWordsLearnedSkeleton>` — the SAME file `app/(tabs)/me/loading.tsx`
   * renders. ⛔ Two hand-copied skeletons would be two shapes the day one is edited.
   */
  it('renders the counted figure itself and ⛔ redefines neither of its states (T-334)', () => {
    expect(CODE).toContain('<MeWordsLearned');
    // ⛔ No second definition of either resolved state left behind here.
    expect(CODE).not.toContain('FAILURE_HE');
    expect(CODE).not.toContain('מילים שנלמדו');
  });

  /**
   * 🔴 **THE THREE STATES, and folding any two of them is a lie on the screen.**
   * ⓐ in flight ⇒ the reserved box, so the number's arrival moves ⛔ nothing
   *   (`ui-ux-pro-max` `ux-guidelines` Layout › Content Jumping, Severity High);
   * ⓑ `wordsLearned === 0` ⇒ a learner who has ⛔ not learned anything yet;
   * ⓒ `wordsLearned === null` ⇒ the read FAILED.
   * ⛔ ⓑ and ⓒ are two different facts (T-301), and ⓐ is a third — a skeleton that
   * resolved to `null` would tell a learner their data is broken while it is still
   * in flight, and a `0` painted while loading is a number nobody measured.
   */
  it('keeps loading · zero · failed as THREE states, ⛔ never two (T-301 · T-334)', () => {
    expect(CODE).toContain('MeWordsLearnedSkeleton');
    // The tri-state is carried explicitly, ⛔ not smuggled through `null`.
    expect(CODE).toMatch(/status:\s*'loading'/);
    expect(CODE).toMatch(/status:\s*'ready'/);
    // ⛔ And `null` is ⛔ never rewritten to `0` on the way to the figure.
    expect(CODE).not.toMatch(/wordsLearned\s*\?\?\s*0/);
  });

  /**
   * T-334ⓒ — the same skeleton file `app/(tabs)/me/loading.tsx` renders. This guard
   * moved here from `app/(tabs)/me/page.test.ts` (T-301ⓒ) with the boundary it
   * describes: the route no longer owns a `<Suspense>` fallback, this component does.
   */
  it("reserves the number's space with the SAME skeleton loading.tsx uses (T-301ⓒ)", () => {
    expect(CODE).toContain('<MeWordsLearnedSkeleton />');
    expect(readFileSync('app/(tabs)/me/loading.tsx', 'utf8')).toContain('MeWordsLearnedSkeleton');
  });

});

describe('the "המטרה שלך" block (T-003 · § 4.2ד)', () => {
  /**
   * 🔴 **T-334 — the goal is FETCHED now, ⛔ not handed in, and the type did ⛔ not
   * loosen with it.** It was a required prop because a caller could forget it;
   * there is no such caller any more — `app/(tabs)/me/page.tsx` renders
   * `<MeScreen />` bare and this component reads `GET /api/profile`. What has to
   * stay true is that whatever the block renders is still a `LearnerGoal`, i.e.
   * three nullable fields and ⛔ nothing computed from them (4.4.3).
   */
  it('renders a LearnerGoal, ⛔ not a shape of its own invention', () => {
    expect(CODE).toMatch(/LearnerGoal/);
    // The harness override keeps the exact `fixtureLevels` shape (T-210): a
    // fixture, ⛔ never a product path.
    expect(CODE).toMatch(/fixtureGoal\?:\s*LearnerGoal/);
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

describe('T-334 — the goal is read through the API, ⛔ never by the page', () => {
  const page = readFileSync('app/(tabs)/me/page.tsx', 'utf8');
  const fixture = readFileSync('app/dev/tabs/me/page.tsx', 'utf8');

  /**
   * ⛔ **The three-column read did ⛔ not disappear — it moved**, to
   * `GET /api/profile`, and its guards moved with it to
   * `app/api/profile/route.test.ts` ("selects the three goal columns from
   * profiles" · "⛔ never turns a failed profile read into an invented goal").
   * What this file asserts is the half that is visible from here: the page hands
   * over ⛔ nothing, and the component asks for it itself.
   */
  it('the page passes ⛔ no goal — the component fetches it (F-027 cause 2)', () => {
    expect(page).not.toMatch(/goal=\{/);
    expect(page).not.toContain("from('profiles')");
    expect(CODE).toContain("apiGet<");
    expect(CODE).toContain("'/api/profile'");
  });

  /**
   * ⚠️ The fixture is the one caller that still supplies values, and that is the
   * whole point of it: `/dev/tabs/me` measures geometry with ⛔ no Supabase env
   * and ⛔ no live network read (TD-13 · F-027 cause 1).
   */
  it('the fixture supplies a fixed goal and a fixed count, ⛔ not a network read', () => {
    expect(fixture).toMatch(/fixtureGoal=\{/);
    expect(fixture).toMatch(/fixtureWordsLearned=\{/);
    expect(fixture).not.toContain('createRouteClient');
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

  /**
   * 🔴 **T-334 — the fixture must override BOTH fetches, ⛔ not one.** The component
   * makes two calls now (`/api/levels/summary` and `/api/profile`), and a fixture
   * that fixes only the first would have `check:mobile` measuring this screen with
   * a live, failing profile read — i.e. measuring the failure state and calling it
   * the screen. `fixtureGiven` has to gate both.
   */
  it('⛔ neither fetch runs when the fixture is given (TD-13 · F-027 cause 1)', () => {
    const effects = CODE.match(/useEffect\(\(\) => \{[\s\S]*?\n  \}, \[[^\]]*\]\);/g) ?? [];
    expect(effects.length, 'expected one useEffect per fetch').toBeGreaterThanOrEqual(2);
    for (const effect of effects) {
      expect(effect, 'a fetch effect does not bail out on a fixture').toMatch(
        /if \(fixture[A-Za-z]*Given\) return;/,
      );
    }
  });
});
