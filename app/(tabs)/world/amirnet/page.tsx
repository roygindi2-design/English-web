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
 * ⟦T-370 · C-0630 · `D-248`⟧ The ring node `אמירנט` is now `open` onto this route — PM made the
 * navigation call, and this is the department's single entry point. ⛔ The comment that used to sit
 * here («⛔ nothing links to it yet») is gone because it is ⛔ no longer true.
 *
 * ⛔ And the door opening does ⛔ NOT assume the room is stocked: on a database without the `0006`/
 * `0007` seeds (`F-262` open) the learner still lands on a WRITTEN empty state, ⛔ never a dead end —
 * `app/api/amirnet/practice/route.ts:47` answers `schema_missing`, `:86` answers `no_items`, and the
 * dashboard below prints `T-291`ⓓ's empty state rather than inventing a number.
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
