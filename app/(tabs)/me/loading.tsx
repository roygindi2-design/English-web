/**
 * T-300 — the skeleton for אני, shaped like `<MeScreen>`.
 * The reasoning for the per-tab boundary lives in `app/(tabs)/cards/loading.tsx`.
 *
 * ⚠️ This tab is the one that actually waits: `page.tsx` is `force-dynamic` and runs
 * `supabase.auth.getUser()` before it renders anything — the F-003 lesson, that one lock
 * on one door is a single point of failure — and then counts `word_progress`. ⛔ Neither
 * is removed and ⛔ neither should be; this boundary is what makes the wait legible
 * instead of blank.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-1 flex-col gap-6">
      <span className="sr-only">טוען</span>
      <div className="h-8 w-1/4 rounded-lg bg-border-subtle" />
      {/* the counted figure and its label — the part that waits on the query */}
      <div className="flex flex-col gap-2">
        <div className="h-12 w-1/3 rounded-lg bg-border-subtle" />
        <div className="h-5 w-2/3 rounded-md bg-border-subtle" />
      </div>
      <div className="space-y-3">
        <div className="min-h-touch rounded-2xl bg-border-subtle py-5" />
        <div className="min-h-touch rounded-2xl bg-border-subtle py-5" />
      </div>
    </div>
  );
}
