'use client';

/**
 * The body of the אני tab — progress, the primary continue action, the
 * attribution link, and the way out. T-145 (D-079): ⛔ no session read and no
 * data access of its own beyond the TWO calls this file owns — `GET
 * /api/levels/summary` and `GET /api/profile` through `apiGet`
 * (lib/api/client.ts), the same routes and the same pattern `<StudiesScreen>`
 * and `<LevelMapScreen>` already use.
 *
 * 🔴 **T-334 — the second of those two calls arrived this tick, and with it the
 * goal and the counted figure.** Both used to be handed in as props by
 * `app/(tabs)/me/page.tsx`, which read them on the server; that made `/me` the
 * last of the five tabs still rendered per-navigation (`ƒ /me` in `npm run
 * build`, against `○` for the other four). ⛔ The page is a three-line static
 * component now, and the read is this file's.
 *
 * `wordsLearned` is `null` when the read failed — ⛔ never `0`. A failed read
 * and a learner who has learned nothing look identical on screen, and only one
 * of them is true. ⇒ and since the read is CLIENT-side now there is a third
 * state, "in flight", which is ⛔ neither of those two: see `ProfileState`.
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

import MeWordsLearned from '@/components/MeWordsLearned';
import MeWordsLearnedSkeleton from '@/components/MeWordsLearnedSkeleton';
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

/** The body of `GET /api/profile` — see `docs/api-contract.md`. */
type ProfileResponse =
  | { readonly ok: true; readonly goal: LearnerGoal; readonly wordsLearned: number | null }
  | { readonly ok: false; readonly code: string };

/**
 * 🔴 **T-334 — THREE states, and folding any two of them is a lie on the screen.**
 * ⓐ `'loading'` — in flight. The counted figure renders as its reserved box, so its
 *   arrival moves ⛔ nothing (`ui-ux-pro-max` `ux-guidelines` Layout › **Content
 *   Jumping**, Severity **High**);
 * ⓑ `'ready'` with a number — including `0`, a learner who has ⛔ not learned
 *   anything yet;
 * ⓒ `'ready'` with `wordsLearned: null` — the read FAILED, which
 *   `<MeWordsLearned>` answers with a Hebrew sentence and a retry.
 *
 * ⛔ **Why a union and ⛔ not just `number | null`:** ⓐ and ⓒ would then be the same
 * value. A skeleton that resolved to `null` tells a learner their data is broken
 * while it is still in flight; a `0` painted while loading is a number nobody
 * measured. T-301 established that ⓑ and ⓒ are two different facts — ⓐ is a third.
 */
type ProfileState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly goal: LearnerGoal; readonly wordsLearned: number | null };

/**
 * § 4.2ד, the failed-read shape: three `null`s, which renders as **no goal block at
 * all** — the same honest silence the count's own `null` branch uses. ⛔ Nothing is
 * invented to fill it (4.4.3).
 */
const EMPTY_GOAL: LearnerGoal = { institution: null, targetScore: null, examDate: null };

export default function MeScreen({
  fixtureGoal,
  fixtureWordsLearned,
  fixtureLevels,
  fixtureLevel,
}: {
  /**
   * Harness-only override, exactly `fixtureLevels`' contract below (T-210):
   * ⛔ no product screen passes these — `app/(tabs)/me/page.tsx` renders
   * `<MeScreen />` bare and this component reads `GET /api/profile` itself, and
   * only `/dev/tabs/me` supplies fixed values so geometry is measured without
   * Supabase env or a live network read (TD-13 · F-027 cause 1).
   *
   * ⚠️ **T-334 — this used to be `goal: LearnerGoal`, a REQUIRED prop, and one
   * `wordsLearnedSlot: React.ReactNode`.** The slot existed for exactly one reason
   * (T-301: a value cannot stream into a client component through a prop, so the
   * server handed over a rendered node instead), and that reason is gone with the
   * server read. ⛔ The type did ⛔ not loosen: what the block renders is still a
   * `LearnerGoal` — three nullable fields, ⛔ nothing computed from them.
   */
  readonly fixtureGoal?: LearnerGoal;
  /** Harness-only, as above. `null` is a legitimate fixture: it is the failed-read state. */
  readonly fixtureWordsLearned?: number | null;
  /**
   * Harness-only override, exactly `<StudiesScreen>`'s `fixtureLevels` (T-210).
   */
  readonly fixtureLevels?: readonly LevelSummary[];
  readonly fixtureLevel?: CefrBand | null;
} = {}): React.JSX.Element {
  const fixtureLevelsGiven = fixtureLevels !== undefined;
  const fixtureProfileGiven = fixtureGoal !== undefined;
  const [levels, setLevels] = useState<readonly LevelSummary[] | null>(fixtureLevels ?? null);
  const [activeLevel, setActiveLevel] = useState<CefrBand | null>(fixtureLevel ?? null);
  const [profile, setProfile] = useState<ProfileState>(
    fixtureGoal === undefined
      ? { status: 'loading' }
      : { status: 'ready', goal: fixtureGoal, wordsLearned: fixtureWordsLearned ?? null },
  );

  useEffect(() => {
    if (fixtureLevelsGiven) return;
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
    // `fixtureLevelsGiven` only — a fixture cannot start `true` and become `false` mid-life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureLevelsGiven]);

  /**
   * 🔴 **T-334 — the read that used to sit in `app/(tabs)/me/page.tsx`.** A SECOND
   * effect and ⛔ not a line added to the first: the two endpoints are independent,
   * so they fly in parallel and neither one's failure blanks the other's block.
   *
   * ⛔ Every failure branch lands on `'ready'` with `wordsLearned: null` and an
   * empty goal — ⛔ never back on `'loading'`. A screen parked on a skeleton is a
   * screen that never tells the learner anything went wrong.
   */
  useEffect(() => {
    if (fixtureProfileGiven) return;
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiGet<ProfileResponse>('/api/profile');
        if (cancelled) return;
        setProfile(
          body.ok
            ? { status: 'ready', goal: body.goal, wordsLearned: body.wordsLearned }
            : { status: 'ready', goal: EMPTY_GOAL, wordsLearned: null },
        );
      } catch {
        if (!cancelled) setProfile({ status: 'ready', goal: EMPTY_GOAL, wordsLearned: null });
      }
    })();
    return () => {
      cancelled = true;
    };
    // `fixtureProfileGiven` only — a fixture cannot start `true` and become `false` mid-life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixtureProfileGiven]);

  // ⛔ The block below reads `goal` exactly as it did when it was a prop — § 4.2ד's
  // rule ("מוסד ריק וגם ציון ריק → הבלוק אינו מוצג") is unchanged, and while the
  // read is in flight the three fields are `null`, which is that same rule.
  const goal = profile.status === 'ready' ? profile.goal : EMPTY_GOAL;

  const primaryTrack = levels === null ? null : primaryStudyTrack(levels);
  const activeSummary =
    levels !== null && activeLevel !== null ? (levels.find((l) => l.level === activeLevel) ?? null) : null;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>

      {/* 🔴 **T-334.** The counted figure, read by this component and rendered in one
          of its THREE states — see `ProfileState`. ⛔ The markup of the two resolved
          ones is still `<MeWordsLearned>`'s (the number, and the Hebrew failure
          sentence with a retry), and the reserved box is still
          `<MeWordsLearnedSkeleton>` — the SAME file `app/(tabs)/me/loading.tsx`
          renders. ⛔ This component redefines ⛔ neither of them. */}
      {profile.status === 'loading' ? (
        <MeWordsLearnedSkeleton />
      ) : (
        <MeWordsLearned wordsLearned={profile.wordsLearned} />
      )}

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
