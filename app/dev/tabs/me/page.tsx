import MeScreen from '@/components/MeScreen';
import TabBar from '@/components/TabBar';

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
      <MeScreen wordsLearned={SAMPLE_WORDS_LEARNED} goal={SAMPLE_GOAL} />
      <TabBar />
    </>
  );
}
