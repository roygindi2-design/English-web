import { AMIRNET_LEVELS, type AmirnetLevel } from './amirnetPractice';

/**
 * `T-309`ⓑ — **the unlock is a fact about the learner, derived, ⛔ and derived in one place.**
 * `41 § 7` «סימולציה»: «ארבע רמות לפי סעיף 4, **רמה נפתחת בהשלמת הקודמת**».
 *
 * ⛔ **A pure function over the completion rows, ⛔ never a query inside a screen** (`T-309`ⓑ).
 * `app/api/amirnet/simulation/runs` reads the rows; this file decides what they mean; the
 * component is handed the answer as a prop and knows ⛔ nothing about how it was reached.
 * ⇒ the rule can be tested without a database, a browser or a session, and it is below.
 *
 * ⛔ **A MAX, ⛔ not a cursor.** The learner's rows arrive in whatever order PostgREST returns
 * them, a level can be run more than once, and a re-run of level 1 after level 3 is ⛔ not a
 * regression — it is a learner practising. ⇒ order and repetition ⛔ cannot change the answer,
 * and both are measured in `amirnetLevels.test.ts`.
 *
 * ⛔ **Level 1 is open to everyone, always** (`T-309`ⓓ) — an empty history is a learner who has
 * ⛔ not started, ⛔ not a learner who is locked out.
 *
 * ⛔ **And there is ⛔ no fifth level** (`41 § 4` names four): finishing level 4 leaves the
 * ceiling where it is. A row carrying a level outside the four is ⛔ not trusted to widen
 * anything — the DB's own `check` refuses to write one, and this is the second place that
 * refuses to read one (the 0019/0023/0024 reasoning: the gate rejects before the write, the
 * pure layer rejects a row that bypassed the gate).
 *
 * ⛔ **⛔ Zero score, ⛔ zero estimate, ⛔ zero ranking** — `41 § 9.2` is Roy's, and «which level
 * is open» is a door, ⛔ not a grade.
 */

/** `41 § 4` names four levels, and ⛔ there is no fifth to unlock into. */
export const MAX_LEVEL: AmirnetLevel = 4;

/** One finished simulation run: which level, and when. ⛔ No score — `41 § 9.2` is Roy's. */
export interface AmirnetSimulationRun {
  readonly level: AmirnetLevel;
  /** Epoch milliseconds. ⛔ Carried in, ⛔ never read from a clock here (`/lib/core/` is pure). */
  readonly completedAtMs: number;
}

const KNOWN_LEVELS: ReadonlySet<number> = new Set<number>(AMIRNET_LEVELS);

/**
 * The highest level the learner may enter, given every run they have finished.
 *
 * 🔴 **The failure scenario this closes** (`T-309`): a learner finishes level 3, closes the app,
 * comes back — and level 4 is locked again, with ⛔ nothing telling them why. That happened
 * because the unlock was a fixture (`unlockedThrough={1}` at the call site) and ⛔ not a fact.
 */
export function highestUnlocked(runs: readonly AmirnetSimulationRun[]): AmirnetLevel {
  let unlocked = 1;
  for (const run of runs) {
    if (!KNOWN_LEVELS.has(run.level)) continue;
    const opens = Math.min(run.level + 1, MAX_LEVEL);
    if (opens > unlocked) unlocked = opens;
  }
  return unlocked as AmirnetLevel;
}
