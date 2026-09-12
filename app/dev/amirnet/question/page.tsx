import AmirnetQuestion from '@/components/AmirnetQuestion';
import { servableItems } from '@/lib/core/amirnetQuestion';
import { FIXTURE_ITEMS } from './question-fixture';

/**
 * T-287 — the practice question on a fixture, for the STEP 6.5 walk. ⛔ No server call.
 *
 * ⚠️ The fixture goes through `servableItems()` exactly as a served queue would, so the walk
 * measures the same path a learner would take — ⛔ not a shortcut around the gate.
 */
export default function DevAmirnetQuestionPage() {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <AmirnetQuestion items={servableItems(FIXTURE_ITEMS)} level={3} />
    </main>
  );
}
