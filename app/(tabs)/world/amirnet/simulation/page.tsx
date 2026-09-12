import AmirnetSimulationEntry from '@/components/AmirnetSimulationEntry';

export const metadata = { title: 'סימולציה מלאה · אמירנט' };

/**
 * `/world/amirnet/simulation` — `T-308`ⓐ. The route the third tab points at, and the reason
 * `AMIRNET_BUILT_TABS` can finally carry `'simulation'`: `AmirnetTabs.dom.test.tsx` measures that
 * every BUILT key resolves to a `page.tsx` on disk, so the flip and this file ⛔ cannot separate.
 *
 * ⛔ Zero data access here (the `/world/amirnet/practice` pattern): the queue is fetched by
 * `AmirnetSimulationEntry` through `GET /api/amirnet/simulation`, because a UI component ⛔ never
 * touches the database and a page is a UI component.
 */
export default function WorldAmirnetSimulationPage() {
  return (
    // ⚠️ `unlockedThrough={1}` is a PLACEHOLDER, and it is `T-309`'s whole subject: nothing in
    // this clone remembers which simulation level a learner completed (measured C-0550:
    // `grep -rn "simulation" supabase/migrations/` ⇒ 0). ⛔ Until that row lands, level 1 is the
    // only level open to anyone — which is `41 § 7`'s own starting state, ⛔ not a lock we invented.
    <AmirnetSimulationEntry unlockedThrough={1} />
  );
}
