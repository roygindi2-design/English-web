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
 */
export default function DevTabsCardsPage() {
  return (
    <>
      <CardsScreen />
      <TabBar />
    </>
  );
}
