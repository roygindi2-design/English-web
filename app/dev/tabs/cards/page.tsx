import CardsScreen from '@/components/CardsScreen';
import TabBar from '@/components/TabBar';

/**
 * Layout harness for check:mobile. NOT a product screen and NOT linked from
 * anywhere.
 *
 * ⚠️ This fixture was NOT in the plan — step 4.3 named `/cards` itself as a
 * directly measurable tab route. Measured in C-0075 against the production
 * build: `/cards` answers **307 → /login?expired=1**, because C-0073 added it to
 * `PROTECTED_SCREENS` in `proxy.ts` after the plan was written. The harness was
 * therefore about to report three "ok /cards" lines for the login screen — F-027
 * cause 1 exactly. The new `tab bar is present` check is what caught it.
 *
 * `<TabBar />` is named here because the fixture lives outside `app/(tabs)`.
 *
 * ⚠️ Since C-0103 (T-065 task 7) `<CardsScreen>` reads both decks from
 * `GET /api/study/queue`. This fixture has no session and the harness has no Supabase env,
 * so both requests answer 503 by the route's own contract and the screen lands in its
 * «—» state — which IS the failure state the task names, and therefore the right thing to
 * measure. The two 503 lines are allowed in `EXPECTED_CONSOLE` (scripts/verify-mobile.mjs)
 * by exact URL and status, ⛔ not by exempting the route.
 */
export default function DevTabsCardsPage() {
  return (
    <>
      <CardsScreen />
      <TabBar />
    </>
  );
}
