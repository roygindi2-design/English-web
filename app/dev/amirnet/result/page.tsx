import AmirnetResult from '@/components/AmirnetResult';
import { RESULT_FIXTURE_RUN } from './result-fixture';

/**
 * `T-298` — the six-chapter result screen on the render's own run, for the `STEP 6.5` walk.
 * ⛔ No server call, ⛔ no database, ⛔ and ⛔ not the product route: `simulation` stays «טרם»
 * in `AMIRNET_BUILT_TABS` until `T-297` lands the item bank, exactly as `T-296` declared.
 */
export default function DevAmirnetResultPage() {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <AmirnetResult outcomes={RESULT_FIXTURE_RUN} />
    </main>
  );
}
