import AmirnetDashboard from '@/components/AmirnetDashboard';
import { hasAnyAnswers, toTypeCards, weakestCard, zeroStats } from '@/lib/core/amirnetPractice';

/**
 * T-291ⓓ — the SAME screen with ⛔ nothing answered, for the STEP 6.5 walk.
 * It gets its own route because the empty state is the one a real learner meets first, and a walk
 * that only ever sees the populated screen ⛔ never measures it.
 */
export default function DevAmirnetDashboardEmptyPage() {
  const stats = zeroStats();
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <AmirnetDashboard
        cards={toTypeCards(stats)}
        weakness={weakestCard(stats)}
        hasAnswers={hasAnyAnswers(stats)}
      />
    </main>
  );
}
