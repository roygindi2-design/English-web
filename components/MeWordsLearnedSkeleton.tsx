/**
 * The reserved slot for the אני tab's counted figure while it is in flight.
 *
 * ⚠️ **T-301ⓒ — ONE definition, ⛔ not a second one.** This shape was written for
 * `app/(tabs)/me/loading.tsx` under T-300 (`h-12 w-1/3` over `h-5 w-2/3`, the
 * number over its label). T-301 needs the same shape a second time, as the
 * `<Suspense>` fallback for the count alone — so the markup moved here and BOTH
 * call sites render this file. Two hand-copied skeletons would be two shapes the
 * day one of them is edited.
 *
 * 🔬 Why a reserved box and ⛔ not «nothing until it arrives»: the figure resolving
 * into an empty area would push «המשך למידה» and everything under it down the
 * screen — `ui-ux-pro-max` `ux-guidelines` Layout › **Content Jumping**
 * (Severity **High**): «Reserve appropriate space or keep async states in a
 * stable content-driven container». The box is the exact height the number and
 * its label occupy, so the arrival moves ⛔ nothing.
 */
export default function MeWordsLearnedSkeleton(): React.JSX.Element {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-col gap-2">
      <span className="sr-only">טוען</span>
      <div className="h-12 w-1/3 rounded-lg bg-border-subtle" />
      <div className="h-5 w-2/3 rounded-md bg-border-subtle" />
    </div>
  );
}
