import TabBar from '@/components/TabBar';

/**
 * The tab shell — D-027 · § 4.2ב · T-051.
 *
 * The route group is the whole point. § 4.2ב says the tab bar is shown on
 * exactly four screens and D-028 says a screen never carries both bars; a
 * conditional in the root layout would make that a rule someone has to
 * remember, while a route group makes it structural — a flow screen lives
 * outside `(tabs)` and cannot receive the bar at all.
 *
 * The group adds no URL segment: `app/(tabs)/studies/page.tsx` serves
 * `/studies`.
 */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TabBar />
    </>
  );
}
