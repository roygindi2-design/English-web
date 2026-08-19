import AppGrid from '@/components/AppGrid';
import RecallCard from '@/components/RecallCard';
import WorldFeed from '@/components/WorldFeed';

/**
 * העולם — the fourth tab (D-027 · § 4.2ב · § 4.2ה), and the learner's private feed.
 *
 * The Server Component here is deliberately empty of data access, and that is the whole
 * decision: `<WorldFeed>` reads `GET /api/world/posts`, which already performs the C-0032
 * guard order (ENV → session → query) and already answers `session_expired` as data. A
 * second `getUser()` in this file would be a second session check that can disagree with
 * the first, and its only visible effect would be a redirect that races the fetch.
 *
 * ⚠️ That is a departure from `<StudiesScreen>` and `<MeScreen>`, whose pages DO check the
 * session — those two read Supabase directly in the page, so the check and the read are the
 * same act. This screen reads through the API layer, so the check lives where the read is.
 *
 * Because nothing here needs Supabase env, `/world` renders under `check:mobile` without a
 * 307 — TD-13 does not apply to it, and task 9 measures this route directly rather than
 * through a `/dev` fixture.
 *
 * ⛔ No `<ActionBar>` anywhere below this file: the route is inside `(tabs)`, so it already
 * has the tab bar, and D-028 allows exactly one bar per screen.
 *
 * T-098 · § 4.2יא — `<AppGrid>` sits ABOVE the feed and does NOT replace it. § 4.2יא words
 * the app grid as "a layer on top of what exists", and T-098 explicitly does not touch
 * `/world/compose`; whether the feed stays at all is item 29 in `plan/03-for-roy.md` and is
 * NOT decided here. So this file gains exactly one child and loses none — a removed feed
 * would be a product decision taken in a Dev tick, which is precisely what ⛔ is forbidden.
 *
 * T-105 · § 4.2יב — `<RecallCard>` sits ABOVE the grid, and that order is the decision, not
 * a layout taste: § 4.2יב asks for "something waiting for the learner when they come back
 * tomorrow", and a thing that waits has to be the first thing seen. The card asks
 * `GET /api/world/recall`, which ⛔ writes nothing (D-051), so this screen still performs no
 * write of any kind. Again exactly one child gained and none lost.
 */
export default function WorldPage() {
  return (
    <>
      <RecallCard />
      <AppGrid />
      <WorldFeed />
    </>
  );
}
