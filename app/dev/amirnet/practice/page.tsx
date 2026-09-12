import AmirnetPracticeMenu from '@/components/AmirnetPracticeMenu';
import { toTypeCards } from '@/lib/core/amirnetPractice';
import { FIXTURE_STATS } from './practice-fixture';

/** T-286 — the practice menu on a fixture, for the STEP 6.5 walk. ⛔ No server call. */
export default function DevAmirnetPracticePage() {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <AmirnetPracticeMenu cards={toTypeCards(FIXTURE_STATS)} />
    </main>
  );
}
