import MeScreen from '@/components/MeScreen';
import MeWordsLearned from '@/components/MeWordsLearned';
import TabBar from '@/components/TabBar';
import type { LevelSummary } from '@/lib/core/levelSummary';

/**
 * Layout harness for check:mobile. NOT a product screen and NOT linked from
 * anywhere.
 *
 * TD-13 · F-027 cause 1: `/me` reads the session and the learner's own rows, so
 * without Supabase env it answers 307 and the harness would silently measure the
 * login screen instead. This fixture is `app/(tabs)/me/page.tsx` minus the
 * session gate, rendering the same `<MeScreen>` component so the two cannot
 * drift (F-027 cause 2).
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
 */
const SAMPLE_GOAL = {
  institution: 'המכללה האקדמית להנדסה אורט בראודה',
  targetScore: 120,
  examDate: '2026-09-10',
} as const;

export default function DevTabsMePage() {
  return (
    <>
      <MeScreen
        wordsLearnedSlot={<MeWordsLearned wordsLearned={SAMPLE_WORDS_LEARNED} />}
        goal={SAMPLE_GOAL}
        fixtureLevels={FIXTURE_LEVELS}
        fixtureLevel="A1"
      />
      <TabBar />
    </>
  );
}
