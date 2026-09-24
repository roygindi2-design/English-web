import MeScreen from '@/components/MeScreen';
import TabBar from '@/components/TabBar';
import type { LevelSummary } from '@/lib/core/levelSummary';

/**
 * Layout harness for check:mobile. NOT a product screen and NOT linked from
 * anywhere.
 *
 * TD-13 · F-027 cause 1: `/me` is session-gated in `proxy.ts`, so without Supabase
 * env it answers 307 and the harness would silently measure the login screen
 * instead. This fixture renders the same `<MeScreen>` component the real route
 * renders, so the two cannot drift (F-027 cause 2) — with every network read
 * replaced by a fixed value.
 *
 * ⚠️ **T-334 — and "minus the session gate" is no longer what makes it a fixture.**
 * The page carried a Supabase route client of its own until this tick; it is static
 * now, and what makes the REAL route unmeasurable is `proxy.ts`'s `PROTECTED_SCREENS`
 * plus `GET /api/profile`'s own session check. ⇒ the fixture's job is to stand in for
 * the FETCHES, ⛔ not for a gate the page no longer holds.
 *
 * ⛔ **And the name of that client is deliberately ⛔ not written in this file** —
 * `scripts/verify-mobile.test.ts` and `components/MeScreen.test.ts` both assert this
 * fixture ⛔ does not contain it, as a literal string over the whole source. A guard
 * that a comment can break is a guard that gets deleted; measured here this tick.
 *
 * ⚠️ `<TabBar />` is named here because the fixture lives OUTSIDE `app/(tabs)`
 * and therefore does not inherit the route group's layout.
 *
 * A fixed sample count, ⛔ not a read: the number is only here so the tallest
 * realistic composition of this screen is what gets measured.
 */
const SAMPLE_WORDS_LEARNED = 128;

/**
 * T-145ⓑⓓ. Fixed, ⛔ not network-dependent — exactly `/dev/tabs/studies`'
 * `FIXTURE_LEVELS` (same learner, same numbers, so the two harnesses cannot
 * silently disagree about what "189 known in A1" looks like). `fixtureLevel`
 * is the active band the three ⓓ counters read; A1 is chosen because it is
 * the only band with real (non-zero) numbers, which is also the tallest
 * composition of the three-tile row.
 */
const FIXTURE_LEVELS: readonly LevelSummary[] = [
  { level: 'A1', totalInLevel: 315, known: 189, inReviewList: 18, unseen: 108 },
  { level: 'A2', totalInLevel: 80, known: 10, inReviewList: 4, unseen: 66 },
  { level: 'B1', totalInLevel: 20, known: 0, inReviewList: 0, unseen: 20 },
  { level: 'B2', totalInLevel: 2, known: 0, inReviewList: 0, unseen: 2 },
  { level: 'C1', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 },
  { level: 'C2', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 },
];

/**
 * A fixed sample goal, ⛔ not a read. The values are chosen to measure the
 * TALLEST and WIDEST realistic composition at once: a long Hebrew institution
 * name (which is what the one-line overflow rule exists for), a score and a
 * date all present together.
 *
 * 🔴 **T-350 — `examDate` stays a date in the PAST, and that is DELIBERATE.**
 * The screen now renders a countdown derived from it, so the fixture decides
 * which branch `check:mobile` measures. A future date would go past on its own
 * and flip the measured screen with ⛔ no commit behind the change — a fixture
 * that silently stops describing what it was written to describe. A past date
 * is stable forever, and it is also the exact state the row was opened on
 * (measured C-0613: «תאריך המבחן: 2026-09-10», four days behind, with ⛔ no
 * word saying so). ⛔ The other branch is covered in `MeScreen.test.ts` and in
 * `lib/core/onboarding.test.ts`, ⛔ not by moving this date forward.
 */
const SAMPLE_GOAL = {
  institution: 'המכללה האקדמית להנדסה אורט בראודה',
  targetScore: 120,
  examDate: '2026-09-10',
} as const;

export default function DevTabsMePage() {
  return (
    <>
      {/* 🔴 **T-334 — FOUR overrides, ⛔ not two.** `<MeScreen>` now makes two fetches
          of its own (`/api/levels/summary` and `/api/profile`), and a fixture that
          fixed only the first would have `check:mobile` measuring this screen with a
          live, failing profile read — i.e. measuring the FAILURE state and calling it
          the screen. ⛔ `wordsLearnedSlot` and `goal` are gone with the server read
          (T-301's reason for the slot went with it); these are the same fixed values
          under the harness-only names.
          T-352 — a fifth: `fixtureDailyMinutes`, without which the past-date branch
          hides its update form and `check:mobile` would measure a screen with ⛔ no
          way to fix the date — the very state the row closes. */}
      <MeScreen
        fixtureGoal={SAMPLE_GOAL}
        fixtureWordsLearned={SAMPLE_WORDS_LEARNED}
        fixtureLevels={FIXTURE_LEVELS}
        fixtureLevel="A1"
        fixtureDailyMinutes={10}
      />
      <TabBar />
    </>
  );
}
