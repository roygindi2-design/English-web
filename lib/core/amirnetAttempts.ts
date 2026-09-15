/**
 * PURE. The learner's own practice history, folded into the three numbers the dashboard draws
 * (T-372 · 41 § 8 item 2). **המשך של: T-291** — that row built the dashboard's empty state and
 * said, in writing, that every learner has zero answers. This module is what makes that stop
 * being true.
 *
 * ⛔ Zero React, window, document, localStorage, fetch, process.env — `scripts/check-core-purity.mjs`.
 * ⛔ No clock: an attempt's time is the row's own `created_at`, and ⛔ nothing here reads it.
 *
 * 🔴 **Why a module and ⛔ not a `reduce` inside the route.** `toTypeCards()` already turns a
 * `AmirnetTypeStat[]` into the cards, and `weakestCard()` already refuses to guess between them
 * (`lib/core/amirnetPractice.ts`). What was missing between the table and those two functions was
 * exactly one fold — and a fold written inside a route is a fold with ⛔ no test, in the one layer
 * that ⛔ cannot be run without a database.
 *
 * ⛔ **It counts, ⛔ and it derives nothing else.** ⛔ No score, XP, currency, streak, ranking or
 * estimate (`D-050`; the score heuristic is Roy's, `41 § 9.2`). ⛔ No adaptivity — ⛔ nothing here
 * is read to choose a level or an item (`41 § 7`: «הרמה נבחרת ידנית»).
 * ⛔ **And ⛔ no row of this table reaches `word_progress` or the arena** (`R-020` · `37 § 13.1`):
 * an amirnet attempt is exam practice, ⛔ not the learner's vocabulary state.
 */

import { AMIRNET_TYPES, type AmirnetPracticeType, type AmirnetTypeStat } from './amirnetPractice';

/** One row of `public.amirnet_practice_attempts`, as the route hands it over. */
export interface AmirnetAttemptRow {
  readonly type: string;
  readonly correct: boolean;
}

function isKnownType(type: string): type is AmirnetPracticeType {
  return AMIRNET_TYPES.some((t) => t.type === type);
}

/**
 * One stat per type, in the render's own order (`AMIRNET_TYPES`), ⛔ never in the order the rows
 * happened to arrive in.
 *
 * ⛔ **A type with ⛔ no rows answers `answered: 0`, ⛔ and is ⛔ never dropped.** That zero is the
 * input `toTypeCards()` turns into `NEVER_PRACTISED_HE` and `weakestType()` reads as «⛔ absent,
 * ⛔ not low» — a missing entry would instead make the dashboard draw two cards where the render
 * draws three (`render_video_D.py:41-43`).
 *
 * ⛔ **An unknown `type` is DROPPED, ⛔ never coerced onto one of the three.** A row that reached
 * the table past its own `check` constraint is a row nobody can explain; counting it under a
 * neighbouring type would make the neighbour's percentage a lie. Same refusal as
 * `servableItems()` — reject, ⛔ never repair.
 */
export function toTypeStats(rows: readonly AmirnetAttemptRow[]): readonly AmirnetTypeStat[] {
  return AMIRNET_TYPES.map((t) => {
    const mine = rows.filter((r) => isKnownType(r.type) && r.type === t.type);
    return {
      type: t.type,
      answered: mine.length,
      correct: mine.filter((r) => r.correct).length,
    };
  });
}
