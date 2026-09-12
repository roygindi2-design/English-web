import AmirnetSimulation from '@/components/AmirnetSimulation';
import { servableItems } from '@/lib/core/amirnetQuestion';
import { SIMULATION_FIXTURE_ITEMS } from './simulation-fixture';

/**
 * `T-296` — one simulation chapter on a fixture, for the `STEP 6.5` walk. ⛔ No server call.
 *
 * ⚠️ The fixture goes through `servableItems()` exactly as a served queue would, so the walk
 * measures the same path a learner would take — ⛔ not a shortcut around the gate.
 * ⛔ And this is ⛔ not the product route: `simulation` stays «טרם» in `AMIRNET_BUILT_TABS` until
 * `T-297` lands the item bank, because a tab that navigates to «אין פריטים» is `RULES § 0.31`.
 */
export default function DevAmirnetSimulationPage() {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <AmirnetSimulation items={servableItems(SIMULATION_FIXTURE_ITEMS)} />
    </main>
  );
}
