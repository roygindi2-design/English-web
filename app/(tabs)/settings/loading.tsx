/**
 * T-300 — the skeleton for הגדרות.
 * The reasoning for the per-tab boundary lives in `app/(tabs)/cards/loading.tsx`.
 *
 * The real screen is `flex flex-col gap-6` of sections, each an `<h2>` over a short
 * stack of rows, so the skeleton is two such sections — the shape that arrives.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-1 flex-col gap-6">
      <span className="sr-only">טוען</span>
      <div className="h-8 w-1/3 rounded-lg bg-border-subtle" />
      <div className="flex flex-col gap-3">
        <div className="h-6 w-2/5 rounded-md bg-border-subtle" />
        <div className="min-h-touch rounded-lg bg-border-subtle py-3" />
        <div className="min-h-touch rounded-lg bg-border-subtle py-3" />
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-6 w-1/3 rounded-md bg-border-subtle" />
        <div className="min-h-touch rounded-lg bg-border-subtle py-3" />
      </div>
    </div>
  );
}
