import AmirnetSimulationEntry from '@/components/AmirnetSimulationEntry';

export const metadata = { title: 'סימולציה מלאה · אמירנט' };

/**
 * `/world/amirnet/simulation` — `T-308`ⓐ. The route the third tab points at, and the reason
 * `AMIRNET_BUILT_TABS` can finally carry `'simulation'`: `AmirnetTabs.dom.test.tsx` measures that
 * every BUILT key resolves to a `page.tsx` on disk, so the flip and this file ⛔ cannot separate.
 *
 * ⛔ Zero data access here (the `/world/amirnet/practice` pattern): both the queue and the
 * learner's finished runs are fetched by `AmirnetSimulationEntry` through `/api/amirnet/**`,
 * because a UI component ⛔ never touches the database and a page is a UI component.
 *
 * ⟦T-309 · C-0560⟧ **The `unlockedThrough={1}` placeholder is GONE.** It was a constant standing
 * where a fact about the learner belongs — `0025_amirnet_simulation_runs.sql` now holds the
 * completions, `GET /api/amirnet/simulation/runs` reads them, and `highestUnlocked()`
 * (`lib/core/amirnetLevels.ts`, pure) turns them into a level. ⛔ This file passes ⛔ nothing:
 * a page that fed the unlock in would be the same fixture under a longer name.
 */
export default function WorldAmirnetSimulationPage() {
  return <AmirnetSimulationEntry />;
}
