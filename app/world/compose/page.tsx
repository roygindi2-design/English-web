import ComposeDraft from '@/components/ComposeDraft';

/**
 * `/world/compose` — the compose flow. Plan `2026-08-14-world-compose.md` task 8, § 4.2ה.
 *
 * ⛔ **The route sits OUTSIDE the `(tabs)` group, and that is structural rather than
 * stylistic.** § 4.2ה calls this a flow screen; D-028 allows exactly one bar per screen and
 * a flow screen's bar is the `<ActionBar>`. Placing the file here — rather than inside
 * `app/(tabs)/` with a conditional — is what makes "no tab bar on this screen" impossible to
 * break by forgetting a condition: the tab bar lives in the group's layout, and this file is
 * not in the group.
 *
 * A Server Component with ⛔ no data access, for the same reason as `app/(tabs)/world`:
 * `<ComposeDraft>` reads `GET /api/world/bank`, which already performs the C-0032 guard
 * order (ENV → session → query) and already answers `session_expired` as data. A second
 * `getUser()` here would be a second session check that can disagree with the first, and its
 * only visible effect would be a redirect racing the fetch.
 *
 * Because nothing here needs Supabase env, the route renders under `check:mobile` without a
 * 307 — but the SCREEN it renders is empty of tap targets until the bank lands, which is why
 * task 9 measures the components through the `/dev/world` fixture and ⛔ not through this
 * route alone.
 */
export default function ComposePage() {
  return <ComposeDraft />;
}
