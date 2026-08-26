import WorldRing from '@/components/WorldRing';

/**
 * העולם — the ring (T-205 · D-117 · `36 § 6`).
 *
 * ⛔ **Three children were dropped from this screen and ⛔ not one file was deleted.**
 * `<AppGrid>`, `<RecallCard>` and `<WorldFeed>` all still exist in the tree, still have
 * their tests, and are still reachable from their own fixtures. `36 § 6` defines this
 * screen completely — heading · ring · isolation card — and `36 § 14.4` (D-114) makes
 * `docs/design/kol-world-ring.png` binding for what sits where, so a feed under the ring
 * is not a layout preference this file gets to keep. Item 29 in `plan/03-for-roy.md`
 * («does the feed stay») is answered BY THE ANCHOR, ⛔ not by an agent's taste.
 *
 * ⚠️ **And the loss is recorded rather than hidden** (§ 4.2יט decision 5): `<RecallCard>`
 * was «the thing waiting tomorrow» (§ 4.2יב), and the ring ⛔ does not replace it. That
 * hole is what the `קול` focus proposal in D-119 exists to fill, and it is blocked on real
 * data exactly as seal ⓑ is. ⛔ Deleting the component would have thrown away a screen
 * nobody would notice was gone until the replacement shipped.
 *
 * The Server Component stays empty of data access for the same reason it always was: the
 * reads happen inside `<WorldRing>` through `/app/api/*`, which already performs the
 * C-0032 guard order (ENV → session → query) and already answers `session_expired` as
 * data. A second `getUser()` here would be a second session check that can disagree with
 * the first, and its only visible effect would be a redirect that races the fetch.
 *
 * Because nothing here needs Supabase env, `/world` renders under `check:mobile` without a
 * 307 — TD-13 does not apply to it, and the harness measures this route directly.
 *
 * ⛔ No `<ActionBar>` anywhere below this file: the route is inside `(tabs)`, so it already
 * has the tab bar, and D-028 allows exactly one bar per screen.
 */
export default function WorldPage() {
  return <WorldRing />;
}
