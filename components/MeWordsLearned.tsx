/**
 * The counted figure on the אני tab — the number of words the learner has
 * LEARNED, or the failure that read produced.
 *
 * ⚠️ **T-301.** This block used to live inside `<MeScreen>`. It moved out for one
 * reason: it is the only part of that tab whose value waits on a Supabase round
 * trip, and a value cannot stream into a client component through a prop. Now
 * `app/(tabs)/me/page.tsx` renders THIS component inside its own `<Suspense>`
 * and hands the boundary to `<MeScreen>` as a slot, so the heading, the primary
 * action and the way out paint while the count is still in flight.
 *
 * ⛔ Nothing about the two states changed, and the guards that describe them moved
 * here with the markup rather than being dropped (`MeWordsLearned.test.ts`) — the
 * same way `<MeScreen>` itself was extracted in C-0075 (F-027 cause 2).
 *
 * `wordsLearned` is `null` when the read failed — ⛔ never `0`. A failed read and
 * a learner who has learned nothing look identical once the failure is flattened
 * to zero, and only one of them is true.
 *
 * ⛔ No `'use client'`: this file has no hook and no handler, so it renders on the
 * server — which is what lets it sit inside a `<Suspense>` boundary and resolve
 * there.
 */
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';

const WORDS_LEARNED_HE = 'מילים שנלמדו';

export default function MeWordsLearned({
  wordsLearned,
}: {
  readonly wordsLearned: number | null;
}): React.JSX.Element {
  if (wordsLearned === null) {
    // § 4.2ב, the error edge case: a Hebrew sentence and a retry.
    // A plain <a> and ⛔ not <Link>: the retry has to reach the server again,
    // and the client router would be free to answer from its cache.
    //
    // T-075: the bordered shape is `WorldFeed`'s, for the same constant in the
    // same state. One action, one form — and an underline is not a 44px target
    // (constitution § 4 · § 6).
    return (
      <div className="flex flex-col gap-2">
        <p className="text-lg leading-relaxed text-ink">{FAILURE_HE.load}</p>
        <a
          href="/me"
          className="inline-flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90"
        >
          {RETRY_HE}
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {/* The number carries its own label in Hebrew — colour and size are never
          the only channel (constitution § 1). */}
      <p className="text-4xl font-bold leading-none">{wordsLearned}</p>
      <p className="text-lg text-ink-muted">{WORDS_LEARNED_HE}</p>
    </div>
  );
}
