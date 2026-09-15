import AmirnetDashboardLive from '@/components/AmirnetDashboardLive';

export const metadata = { title: 'סימולציות אמירנט' };

/**
 * `/world/amirnet` — T-291 · 41 § 8 item 2. The department's landing tab is the dashboard.
 *
 * 🔴 **⟦T-372ⓓ · C-0633⟧ `zeroStats()` IS GONE, and that is the whole row.** Until this tick this
 * file called it — a CONSTANT — and the heading «ביצועים לפי סוג שאלה» therefore reported, for
 * every learner and forever, a number the product ⛔ never collected. ⛔ It was ⛔ not a placeholder
 * anyone would notice: zero answers is a legal state, so the screen looked correct while measuring
 * nothing. `0027_amirnet_practice_attempts.sql` now holds the answers,
 * `GET /api/amirnet/practice/result` sums them, and `AmirnetDashboardLive` asks.
 * ⚠️ The comment that used to stand here — «⛔ Zero data access, and ⛔ not by choice … `F-222`,
 * `T-297` is blocked» — is gone because it is ⛔ no longer true: `T-297` ✅ opened the item schema
 * (`0024`), and the missing half was the learner's RESULT, ⛔ not the item.
 *
 * ⛔ **Zero data access ⛔ here, and that part has ⛔ not changed:** a page is a UI component, and a
 * UI component ⛔ never touches the database (RULES). The fetch lives in the client component, the
 * same shape `/world/amirnet/simulation` uses (`T-309`).
 *
 * ⟦T-370 · C-0630 · `D-248`⟧ The ring node `אמירנט` is `open` onto this route — PM made the
 * navigation call, and this is the department's single entry point.
 *
 * ⛔ And the door opening does ⛔ NOT assume the room is stocked: on a database without the seeds
 * the learner still lands on a WRITTEN sentence, ⛔ never a dead end — the dashboard prints
 * `T-291`ⓓ's empty state at zero answers, and `SCHEMA_MISSING_HE` when the read says the bank is
 * ⛔ not installed. ⛔ Neither of them is an invented number.
 *
 * Inside `(tabs)` ⇒ the tab bar is the layout's; ⛔ no `<ActionBar>` below (D-028).
 */
export default function WorldAmirnetPage() {
  return <AmirnetDashboardLive />;
}
