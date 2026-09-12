/**
 * T-300 — the skeleton for אני, shaped like `<MeScreen>`.
 * The reasoning for the per-tab boundary lives in `app/(tabs)/cards/loading.tsx`.
 *
 * ⚠️ This tab is the one that actually waits: `page.tsx` is `force-dynamic` and runs
 * `supabase.auth.getUser()` before it renders anything — the F-003 lesson, that one lock
 * on one door is a single point of failure — and then counts `word_progress`. ⛔ Neither
 * is removed and ⛔ neither should be; this boundary is what makes the wait legible
 * instead of blank.
 *
 * ⚠️ **T-301ⓒ:** the counted figure's box is now `<MeWordsLearnedSkeleton>`, because
 * the route streams that figure on its own and needs the identical shape as its
 * `<Suspense>` fallback. One definition, two call sites.
 */
import MeWordsLearnedSkeleton from '@/components/MeWordsLearnedSkeleton';
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-1 flex-col gap-6">
      <span className="sr-only">טוען</span>
      <div className="h-8 w-1/4 rounded-lg bg-border-subtle" />
      {/* T-301ⓒ — the counted figure's reserved box, the SAME file the route's
          own `<Suspense>` fallback renders. ⛔ Not a hand-copied second shape. */}
      <MeWordsLearnedSkeleton />
      <div className="space-y-3">
        <div className="min-h-touch rounded-2xl bg-border-subtle py-5" />
        <div className="min-h-touch rounded-2xl bg-border-subtle py-5" />
      </div>
    </div>
  );
}
