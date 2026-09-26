import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';

/**
 * T-522 — a read that did not arrive, said in words, with the retry under it. Shared by the
 * four messages screens (`InboxList` · `ClassWall` · `ClassStory` · `ClassJoin`), which until
 * C-0874 drew `נסה שוב` ALONE: the learner knew something failed, ⛔ not what, and ⛔ not
 * whether their messages were gone.
 * The sentence is `FAILURE_HE.load` — the product's existing «a read the screen needed did not
 * arrive», ⛔ no new string (T-056: one sentence per event). `aria-live="polite"` so a screen
 * reader hears it when the state flips. ⛔ Not for `session_expired` / `schema_missing`: those
 * have their own exits and their own words.
 */
export default function LoadFailure({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div data-load-failure className="mt-4 flex flex-col items-start gap-3">
      <p aria-live="polite" className="text-base leading-relaxed text-ink">{FAILURE_HE.load}</p>
      <button type="button" onClick={onRetry} className="min-h-touch rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{RETRY_HE}</button>
    </div>
  );
}
