import StudiesScreen from '@/components/StudiesScreen';
import TabBar from '@/components/TabBar';
import { daysUntilExam, daysUntilExamHe } from '@/lib/core/onboarding';

/**
 * Layout harness for check:mobile. NOT a product screen and NOT linked from
 * anywhere.
 *
 * TD-13 · F-027 cause 1: `/studies` reads the session, so without Supabase env
 * it answers 307 to `/login?expired=1` and every "ok /studies …" line in the
 * harness would really be measuring the login screen — the exact way roy's dead
 * end stayed invisible. This fixture is `app/(tabs)/studies/page.tsx` minus the
 * session gate, and it renders the same `<StudiesScreen>` component, so the two
 * cannot drift (F-027 cause 2).
 *
 * ⚠️ `<TabBar />` is named here because the fixture lives OUTSIDE `app/(tabs)`
 * — which is the whole point of the route group. Without it the fixture would
 * stand 4.5rem shorter than the screen it represents and the tab-bar checks
 * would have nothing to measure.
 *
 * The dates are fixed, not `new Date()`: a fixture whose content depends on the
 * day it runs makes the harness's own numbers unreproducible.
 */
const SAMPLE_TODAY = '2026-08-01';
const SAMPLE_EXAM_DATE = '2026-09-15';

export default function DevTabsStudiesPage() {
  return (
    <>
      <StudiesScreen headline={daysUntilExamHe(daysUntilExam(SAMPLE_EXAM_DATE, SAMPLE_TODAY))} />
      <TabBar />
    </>
  );
}
