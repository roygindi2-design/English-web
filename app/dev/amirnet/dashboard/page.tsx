import AmirnetDashboard from '@/components/AmirnetDashboard';
import { hasAnyAnswers, toTypeCards, weakestCard } from '@/lib/core/amirnetPractice';
import { FIXTURE_STATS } from './dashboard-fixture';

/** T-291 — the dashboard on a fixture, for the STEP 6.5 walk. ⛔ No server call. */
export default function DevAmirnetDashboardPage() {
  return (
    <main className="mx-auto w-full max-w-md">
      <AmirnetDashboard
        cards={toTypeCards(FIXTURE_STATS)}
        weakness={weakestCard(FIXTURE_STATS)}
        hasAnswers={hasAnyAnswers(FIXTURE_STATS)}
      />
    </main>
  );
}
