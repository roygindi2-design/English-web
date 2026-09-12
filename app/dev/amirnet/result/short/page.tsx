import AmirnetResult from '@/components/AmirnetResult';
import { RESULT_FIXTURE_SHORT_RUN } from '../result-fixture';

/**
 * `T-298`ⓓ — the SAME screen on a run that stopped after five chapters, and ⛔ not a duplicate
 * of the route above it: that branch is unreachable from a full run, so the written notice and
 * the five-row table would ⛔ never be on screen at 320/375/414. Same reasoning as
 * `/dev/deck/done` against `/dev/deck/done/due` (C-0276).
 */
export default function DevAmirnetResultShortPage() {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <AmirnetResult outcomes={RESULT_FIXTURE_SHORT_RUN} />
    </main>
  );
}
