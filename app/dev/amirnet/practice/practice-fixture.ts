import type { AmirnetTypeStat } from '@/lib/core/amirnetPractice';

/**
 * T-286 — the walk fixture at 320/375/414. Asks the server for nothing.
 *
 * ⚠️ THE 23/08 LESSON, and it is the reason this file has a comment at all: a fixture that
 * differs from production data in ANY dimension is a hole, ⛔ not a test. These are the three
 * production types with the three shapes the screen must survive:
 *   · `sc` — practised, a real percentage;
 *   · `rs` — practised, the LOWEST percentage;
 *   · `rc` — ⛔ never practised: `answered: 0`, which is a legal declared state and the one
 *     that must ⛔ never render as `0%` or as `—`.
 * ⛔ The numbers are display statistics, ⛔ not learning content — ⛔ nothing here is an item,
 * a distractor or an explanation (R-010 · RULES § 0.1 ז׳).
 */
export const FIXTURE_STATS: readonly AmirnetTypeStat[] = [
  { type: 'sc', answered: 124, correct: 97 },
  { type: 'rs', answered: 61, correct: 33 },
  { type: 'rc', answered: 0, correct: 0 },
];
