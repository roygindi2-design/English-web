import type { AmirnetTypeStat } from '@/lib/core/amirnetPractice';

/**
 * T-291 — the walk fixture at 320/375/414. Asks the server for nothing.
 *
 * ⚠️ THE 23/08 LESSON, and it is why this file carries a comment: a fixture that differs from
 * production data in ANY dimension is a hole, ⛔ not a test. All three types are practised here
 * ON PURPOSE — that is the ⛔ only shape in which the weakness strip may appear at all
 * (`weakestType` refuses to compare when any type is untried), so a fixture with an untried type
 * would walk a screen whose main new element is ⛔ never drawn.
 *   · `sc` 97/124 = 78% — the render's own number (render_video_D.py:41)
 *   · `rs` 33/61  = 54% — the LOWEST ⇒ the weakness strip names it (:42)
 *   · `rc` 30/45  = 67% — the render prints 66 (:43); 30/45 is the nearest whole pair, and the
 *     percentage is DERIVED here, ⛔ never typed, exactly as production derives it.
 * ⛔ The numbers are display statistics, ⛔ not learning content — ⛔ nothing here is an item,
 * a distractor or an explanation (R-010 · RULES § 0.1 ז׳).
 */
export const FIXTURE_STATS: readonly AmirnetTypeStat[] = [
  { type: 'sc', answered: 124, correct: 97 },
  { type: 'rs', answered: 61, correct: 33 },
  { type: 'rc', answered: 45, correct: 30 },
];
