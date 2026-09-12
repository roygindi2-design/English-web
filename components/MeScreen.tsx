'use client';

/**
 * The body of the אני tab — progress, the primary continue action, the
 * attribution link, and the way out. T-145 (D-079): ⛔ no session read and no
 * data access of its own beyond the ONE call this file owns — `GET
 * /api/levels/summary` through `apiGet` (lib/api/client.ts), the same route
 * and the same pattern `<StudiesScreen>` and `<LevelMapScreen>` already use.
 *
 * `wordsLearned` is `null` when the read failed — ⛔ never `0`. A failed read
 * and a learner who has learned nothing look identical on screen, and only one
 * of them is true.
 *
 * ⛔ No readiness estimate and ⛔ no predicted score (§ 4.2ב question 4 · 4.4.3)
 * — neither has a measurement behind it. ⛔ No `<ActionBar>`: D-028 forbids two
 * bottom-anchored bars on one screen and this screen carries the tab bar, so
 * the primary action and the sign-out both sit in normal flow.
 *
 * ⚠️ **T-145 (D-079 · § 4.2טז · D-180) — the primary action stopped being
 * «יציאה מהחשבון» (measured C-0398: `data-primary-action="true"` sat on
 * `POST /logout`, so the most prominent thing a learner could do on their own
 * tab was leave).**
 * ⓐ The marker moved OFF the sign-out button — it is ⛔ NOT removed (ⓒ): it
 *   stays in normal flow, this tab's home (F-027 — no screen without a way out).
 * ⓑ The primary action is «המשך למידה», to `/studies`. What track it names is
 *   DERIVED — `primaryStudyTrack` (lib/core/studyTracks.ts), the first track
 *   in `STUDY_TRACKS` order whose metric is not `'empty'`. ⛔ Zero new module,
 *   zero new query: the input is the same `levels[]` `<StudiesScreen>` already
 *   fetches, and today it always resolves to `vocabulary` because that is the
 *   only track with real content (D-176 §ד) — the day that changes, this walk
 *   changes with it, with no edit here.
 * ⓓ Three D-034 counts for the active level (known · in review list · unseen)
 *   render underneath, sourced from the SAME `levels[]` — the active band is
 *   looked up by the `level` the route also returns (D-037: `null` is «not
 *   chosen yet», a real state, ⛔ never defaulted to A1). ⛔ No second
 *   definition of the three counts (§ 4.2ז: `classifyProgress` in
 *   `lib/core/levelSummary.ts` is the only one) — this file only reads fields
 *   `summarizeAllLevels` already computed.
 * ⚠️ D-110 latitude, logged in the tick report: these two blocks render
 *   ABOVE the «המטרה שלך» goal block (learning progress grouped together),
 *   ⛔ not below it — no render or anchor section orders this row, so the
 *   order is Dev's call.
 * ⚠️ D-110 latitude, logged in the tick report: ⓓ's three tiles reuse the
 *   `known`/`inReviewList`/`unseen` numbers `<FilterBar>` already renders on
 *   the cards screen, but ⛔ not the `<FilterBar>` component itself — its
 *   copy ("ידעתי"/"לא ידעתי"/"לא סוננו" · "X / Y סוננו") is a FILTERING frame
 *   for the cards screen (36 § 5), and would misname an action nothing here
 *   performs. This tile uses § 4.2ז's own vocabulary instead — «ידוע» ·
 *   «ברשימת החזרה» · «טרם נראה» — the three names T-145's own task cell
 *   quotes, so the tab's copy matches the spec it was opened against rather
 *   than borrowing another screen's.
 */
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiGet } from '@/lib/api/client';
import type { CefrBand } from '@/lib/core/cefrLevels';
import type { LevelSummary } from '@/lib/core/levelSummary';
import { primaryStudyTrack, trackLabelHe } from '@/lib/core/studyTracks';

const HEADING_HE = 'אני';
const SOURCES_HE = 'מקורות הנתונים והרישיונות';
const SIGN_OUT_HE = 'יציאה מהחשבון';
const GOAL_HEADING_HE = 'המטרה שלך';
const GOAL_SCORE_LABEL_HE = 'ציון יעד';
const GOAL_DATE_LABEL_HE = 'תאריך המבחן';
/** T-145ⓑ · D-079 · D-180. */
const CONTINUE_LEARNING_HE = 'המשך למידה';
/** T-145ⓓ · D-034 · § 4.2ז — see the file header for why this is not `<FilterBar>`'s wording. */
const PROGRESS_HEADING_HE = 'התקדמות ברמה הנוכחית';
const KNOWN_HE = 'ידוע';
const IN_REVIEW_HE = 'ברשימת החזרה';
const UNSEEN_HE = 'טרם נראה';

/**
 * The three onboarding answers § 4.2ד puts on this tab, exactly as stored —
 * ⛔ nothing is computed from them (4.4.3). Every field is nullable because
 * every one of them is optional in the form, and `null` reads "not answered"
 * and never "zero".
 */
export type LearnerGoal = {
  readonly institution: string | null;
  readonly targetScore: number | null;
  readonly examDate: string | null;
};

type LevelsResponse =
  | { readonly ok: true; readonly level: CefrBand | null; readonly levels?: readonly LevelSummary[] }
  | { readonly ok: false; readonly code: string };

export default function MeScreen({
  wordsLearnedSlot,
  goal,
  fixtureLevels,
  fixtureLevel,
}: {
  // T-301. The counted figure, already rendered — `<MeWordsLearned>` on its own,
  // or a `<Suspense>` wrapping it. ⛔ A node and ⛔ not a number: the count is the
  // one value on this tab that waits on the network, and a value cannot stream
  // into a client component through a prop. `app/(tabs)/me/page.tsx` owns the read
  // and the boundary; `/dev/tabs/me` passes the component with a fixed sample, so
  // the two still render the SAME markup (F-027 cause 2).
  // ⚠️ `//` and ⛔ not a `/** */` block, and the reason is measured ⛔ not stylistic:
  // every source guard in this repo strips comments with
  // `/\{\s*\/\*[\s\S]*?\*\/\s*\}/`, and a JSDoc block as the FIRST token inside
  // `}: {` lets that pattern anchor on the brace and swallow the props to the next
  // `*/ }` — measured here: 12,943 chars ⇒ 4,374, taking `goal: LearnerGoal`,
  // `apiGet<` and `primaryStudyTrack(` out of the string the guards assert on.
  // The stripper is the defect (row opened this tick); this comment style is what
  // keeps THIS file's guards honest until it is fixed.
  readonly wordsLearnedSlot: React.ReactNode;
  goal: LearnerGoal;
  /**
   * Harness-only override, exactly `<StudiesScreen>`'s `fixtureLevels` (T-210):
   * ⛔ no product screen passes these — `app/(tabs)/me/page.tsx` renders
   * `<MeScreen>` bare, and only `/dev/tabs/me` supplies fixed values so
   * geometry is measured without Supabase env or a live network read.
   */
  readonly fixtureLevels?: readonly LevelSummary[];
  readonly fixtureLevel?: CefrBand | null;
}): React.JSX.Element {
  const fixtureGiven = fixtureLevels !== undefined;
  const [levels, setLevels] = useState<readonly LevelSummary[] | null>(fixtureLevels ?? null);
  const [activeLevel, setActiveLevel] = useState<CefrBand | null>(fixtureLevel ?? null);

  useEffect(() => {
    if (fixtureGiven) return;
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiGet<LevelsResponse>('/api/levels/summary');
        if (cancelled) return;
        if (body.ok) {
          setLevels(body.levels ?? []);
          setActiveLevel(body.level);
        } else {
          setLevels(null);
          setActiveLevel(null);
        }
      } catch {
        if (!cancelled) {
          setLevels(null);
          setActiveLevel(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // `fixtureGiven` only — a fixture cannot start `true` and become `false` mid-life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureGiven]);

  const primaryTrack = levels === null ? null : primaryStudyTrack(levels);
  const activeSummary =
    levels !== null && activeLevel !== null ? (levels.find((l) => l.level === activeLevel) ?? null) : null;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>

      {/* T-301. The counted figure, handed in as a slot so its Supabase round
          trip can resolve inside its own `<Suspense>` instead of holding this
          whole column back. The markup of both its states is
          `<MeWordsLearned>`; the reserved box it resolves into is
          `<MeWordsLearnedSkeleton>`. ⛔ This component decides ⛔ nothing about
          the number any more — including the `null` failure branch, which moved
          out WITH its guards. */}
      {wordsLearnedSlot}

      {/* T-145ⓑ. The learner's one way forward from their own tab — see the
          file header for why the track name is derived and why this block
          sits here, above the goal block (D-110 latitude, logged). */}
      <Link
        href="/studies"
        data-primary-action="true"
        className="flex w-full min-h-touch flex-col items-start justify-center gap-0.5 rounded-full bg-brand-surface px-5 py-3 text-brand-on active:opacity-90"
      >
        <span className="text-lg font-semibold">{CONTINUE_LEARNING_HE}</span>
        {primaryTrack !== null && <span className="text-sm text-brand-on/80">{trackLabelHe(primaryTrack)}</span>}
      </Link>

      {/* T-145ⓓ. ⛔ Rendered only once a real active level is known — `null`
          (no level chosen, D-037, or the read failed/is still loading) shows
          nothing here rather than three invented zeros (same rule
          `wordsLearned` already follows above). */}
      {activeSummary !== null && (
        <section className="flex flex-col gap-2" data-progress-block>
          <h2 className="text-lg font-semibold text-ink">{PROGRESS_HEADING_HE}</h2>
          <ul className="grid list-none grid-cols-3 gap-2.5 p-0">
            <li>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-border-subtle bg-surface-raised px-2 py-3">
                <span className="text-2xl font-bold leading-none">{activeSummary.known}</span>
                <span className="text-xs text-ink-muted">{KNOWN_HE}</span>
              </div>
            </li>
            <li>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-border-subtle bg-surface-raised px-2 py-3">
                <span className="text-2xl font-bold leading-none">{activeSummary.inReviewList}</span>
                <span className="text-xs text-ink-muted">{IN_REVIEW_HE}</span>
              </div>
            </li>
            <li>
              <div className="flex flex-col items-center gap-1 rounded-2xl border border-border-subtle bg-surface-raised px-2 py-3">
                <span className="text-2xl font-bold leading-none">{activeSummary.unseen}</span>
                <span className="text-xs text-ink-muted">{UNSEEN_HE}</span>
              </div>
            </li>
          </ul>
        </section>
      )}

      {/* § 4.2ד. ⛔ Hidden when institution AND score are both empty — a heading
          over an empty area is F-011 under another name. The exam date alone
          does NOT open it: that is the rule as written, and the countdown
          already has a home in <StudiesScreen>. Recorded as measured conflict 2
          in the plan rather than widened here on Dev's authority.
          ⛔ Nothing computes anything from these three values (4.4.3). */}
      {(goal.institution !== null || goal.targetScore !== null) && (
        <section className="flex flex-col gap-1" data-goal-block>
          <h2 className="text-lg font-semibold text-ink">{GOAL_HEADING_HE}</h2>
          {goal.institution !== null && (
            // `truncate` and ⛔ not a wrap: a long institution name is one line
            // with overflow, so the block's height cannot depend on the length
            // of something the learner typed.
            <p className="truncate text-lg text-ink" title={goal.institution}>
              {goal.institution}
            </p>
          )}
          {goal.targetScore !== null && (
            <p className="text-lg text-ink-muted">
              {GOAL_SCORE_LABEL_HE}: {goal.targetScore}
            </p>
          )}
          {goal.examDate !== null && (
            <p className="text-lg text-ink-muted">
              {GOAL_DATE_LABEL_HE}: {goal.examDate}
            </p>
          )}
        </section>
      )}

      {/* D-007 · T-011. The attribution link also sits in the global footer, on
          every screen, because the obligation attaches to the product; here it
          is a destination the learner can be told to go to, which is what
          § 4.2ב assigns to this tab. Same label, ⛔ not a second wording. */}
      <Link
        href="/sources"
        className="inline-flex min-h-touch items-center text-lg text-ink underline"
      >
        {SOURCES_HE}
      </Link>

      {/* A plain form, so signing out works with JavaScript disabled and cannot
          be triggered by a stray image request the way a GET logout can.
          ⚠️ The same form deliberately stays on `/onboarding` as well: a learner
          who has not finished that form is redirected there from `/` by
          `proxy.ts`, and `/onboarding` lives outside `app/(tabs)` and so has no
          tab bar — removing it there would leave exactly the dead end 🔴 F-027
          was opened for. This tab is the sign-out's home, not its only place.
          ⚠️ T-145ⓐⓒ: ⛔ no `data-primary-action` here any more — «המשך למידה»
          above carries it now — the form itself and its position are
          unchanged: signing out stays a secondary action in normal flow. */}
      <form action="/logout" method="post">
        <button
          type="submit"
          className="flex w-full min-h-touch items-center justify-center rounded-lg border border-border-strong bg-surface-raised px-5 py-3 text-lg font-semibold text-ink active:opacity-90"
        >
          {SIGN_OUT_HE}
        </button>
      </form>
    </section>
  );
}
