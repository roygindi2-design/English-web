/**
 * T-300 — the skeleton for העולם, shaped like `<WorldRing>`.
 * The reasoning for the per-tab boundary lives in `app/(tabs)/cards/loading.tsx`.
 *
 * The ring is one large round shape under the heading, so the skeleton is one large
 * round shape under the heading — ⛔ not a stack of text lines, which is what the
 * generic root skeleton drew here until today.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-1 flex-col gap-6">
      <span className="sr-only">טוען</span>
      <div className="h-8 w-2/5 rounded-lg bg-border-subtle" />
      <div className="flex flex-1 items-center justify-center">
        <div className="aspect-square w-4/5 max-w-full rounded-full bg-border-subtle" />
      </div>
    </div>
  );
}
