/**
 * T-300 — the skeleton for כרטיסיות, shaped like `<LevelMapScreen>`.
 *
 * ⛔ **Why this file exists at all, and it was measured ⛔ not felt:** until today
 * `app/loading.tsx` was the ONLY Suspense boundary in the app — `find app -name
 * loading.tsx` returned one file, at the root. ⇒ every tab switch replaced the WHOLE
 * screen, the tab-bar area included, with one generic skeleton, and the product read as
 * «the app is loading» instead of «this section is changing». ⛔ The navigation itself
 * was never at fault: `components/TabBar.tsx` uses `next/link`, so the transition is
 * client-side. What broke is what stayed painted while it happened.
 *
 * ⇒ a boundary INSIDE the `(tabs)` group keeps `TabsLayout` — and therefore `<TabBar>` —
 * mounted, and swaps only the content region.
 *
 * ⚠️ **And the shape is the point, ⛔ not decoration.** `app/loading.tsx` already states
 * the rule in its own words: «a skeleton whose shapes are not the shapes about to arrive
 * is a promise the screen then breaks». This one carries the map's real order — heading,
 * the level card, the progress strip, then the «דרכים לתרגל» block.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-1 flex-col gap-6">
      <span className="sr-only">טוען</span>
      {/* the <h1> LevelMapScreen renders */}
      <div className="h-8 w-2/5 rounded-lg bg-border-subtle" />
      {/* the level card — § 3: 2xl is the card radius */}
      <div className="h-32 w-full rounded-2xl bg-border-subtle" />
      {/* the progress strip */}
      <div className="space-y-2">
        <div className="h-5 w-3/5 rounded-md bg-border-subtle" />
        <div className="h-3 w-full rounded-md bg-border-subtle" />
      </div>
      {/* «דרכים לתרגל» — the deck rows */}
      <div className="space-y-3">
        <div className="h-6 w-1/3 rounded-md bg-border-subtle" />
        <div className="min-h-touch rounded-2xl bg-border-subtle py-6" />
        <div className="min-h-touch rounded-2xl bg-border-subtle py-6" />
      </div>
    </div>
  );
}
