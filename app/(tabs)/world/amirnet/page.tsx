import AmirnetDashboard from '@/components/AmirnetDashboard';
import { hasAnyAnswers, toTypeCards, weakestCard, zeroStats } from '@/lib/core/amirnetPractice';

export const metadata = { title: 'סימולציות אמירנט' };

/**
 * `/world/amirnet` — T-291 · 41 § 8 item 2. The department's landing tab is the dashboard.
 *
 * ⛔ Zero data access here, and ⛔ not by choice: `public.sense_items` carries ⛔ no question type,
 * options, `correct_index` or explanation (`F-222`, measured C-0531), so ⛔ nothing in the product
 * writes a practice result yet — `T-297` is blocked on that schema decision. ⇒ every learner has
 * zero answers, `zeroStats()` says exactly that, and the screen prints the written empty state
 * (T-291ⓓ) instead of inventing a number. ⛔ No `—`, ⛔ no `0%`.
 *
 * ⚠️ The ring node `אמירנט` stays `locked_infra` (`lib/core/worldRing.ts:252`) — flipping it is a
 * NAVIGATION decision and PM's alone (`RULES § 0.22`). This route exists; ⛔ nothing links to it yet.
 *
 * Inside `(tabs)` ⇒ the tab bar is the layout's; ⛔ no `<ActionBar>` below (D-028).
 */
export default function WorldAmirnetPage() {
  const stats = zeroStats();
  return (
    <AmirnetDashboard
      cards={toTypeCards(stats)}
      weakness={weakestCard(stats)}
      hasAnswers={hasAnyAnswers(stats)}
    />
  );
}
