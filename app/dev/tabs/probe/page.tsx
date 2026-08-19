import DeckSelector from '@/components/DeckSelector';
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
 * ⚠️ **Consumer the plan did not name (C-0176, T-081).** `2026-08-17-level-map.md` task 5
 * lists two pages that import the old `<CardsScreen>`; `typecheck` found three. This route is
 * referenced by ⛔ nothing — not `FLOW_ROUTES`, not a test, not a doc — and its body was a
 * byte-for-byte duplicate of `/dev/tabs/cards`. It is pointed at `<DeckSelector>` so it
 * measures the deck block alone rather than duplicating the cards fixture. ⛔ It was NOT
 * deleted: a dead route is a PM/Critic call, ⛔ not a Dev one. Recorded as F-064.
 */
export default function DevTabsCardsPage() {
  return (
    <>
      <DeckSelector />
      <TabBar />
    </>
  );
}
