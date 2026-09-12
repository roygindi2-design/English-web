/**
 * T-300 — the skeleton for לימודים, shaped like `<StudiesScreen>`.
 * The reasoning for the per-tab boundary lives in `app/(tabs)/cards/loading.tsx`.
 *
 * `36 § 9` makes this screen the chooser of the four tracks, so the skeleton is four
 * rows of one height — ⛔ not the generic two text lines.
 *
 * ⚠️ Like אני, this page waits on `supabase.auth.getUser()` before rendering (F-003).
 * The wait stays; what this file changes is that the shell stays painted through it.
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
