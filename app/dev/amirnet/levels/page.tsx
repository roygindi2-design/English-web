import AmirnetLevels from '@/components/AmirnetLevels';

/**
 * T-307 — the simulation entry screen on a fixture, for the STEP 6.5 walk. ⛔ No server call.
 *
 * ⛔ `unlockedThrough={3}` is ⛔ not a guess about a learner: it is the ONE value that puts BOTH
 * states on a single screen (T-307ⓓ) — three open cards and a locked fourth — so the walk and
 * `check:mobile` measure the locked card instead of assuming it. The real value is `T-309`'s.
 */
export default function DevAmirnetLevelsPage() {
  return (
    <main className="mx-auto w-full max-w-md">
      <AmirnetLevels unlockedThrough={3} />
    </main>
  );
}
