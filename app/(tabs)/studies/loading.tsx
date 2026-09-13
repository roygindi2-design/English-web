/**
 * T-300 — the skeleton for לימודים, shaped like `<StudiesScreen>`.
 * The reasoning for the per-tab boundary lives in `app/(tabs)/cards/loading.tsx`.
 *
 * `36 § 9` makes this screen the chooser of the four tracks, so the skeleton is four
 * rows of one height — ⛔ not the generic two text lines.
 *
 * 🔴 **T-328 — the server wait this comment used to describe is GONE.** Until that
 * row the page awaited `supabase.auth.getUser()` before rendering, and the line here
 * said «the wait stays». It does not: `/studies` is now static (`○`), the session gate
 * lives in `proxy.ts` and in `GET /api/levels/summary`, and this boundary now covers
 * only the client navigation — the chunk, and `<StudiesScreen>`'s own fetch.
 * ⛔ The comment is corrected rather than deleted: a skeleton that claims to cover a
 * wait that no longer exists is how the next agent measures the wrong thing.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-1 flex-col gap-6">
      <span className="sr-only">טוען</span>
      <div className="h-8 w-2/5 rounded-lg bg-border-subtle" />
      <div className="space-y-3">
        <div className="min-h-touch rounded-2xl bg-border-subtle py-7" />
        <div className="min-h-touch rounded-2xl bg-border-subtle py-7" />
        <div className="min-h-touch rounded-2xl bg-border-subtle py-7" />
        <div className="min-h-touch rounded-2xl bg-border-subtle py-7" />
      </div>
    </div>
  );
}
