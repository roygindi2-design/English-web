/**
 * Types for `next-cycle-id.mjs` — the dual-remote cycle-id generator.  ⟦T-254⟧
 *
 * ⚠️ WHY A HAND-WRITTEN DECLARATION AND ⛔ NOT TYPESCRIPT. Same reason as
 * `check-motion.d.mts` / `story-tap-audit.d.mts`: the module is run by
 * `npm run cycle-id` with plain `node`, and `tsconfig.json` keeps `allowJs: false`
 * on purpose ⇒ the implementation stays `.mjs` and its shape is declared here.
 *
 * ⛔ The hazard is drift — a declaration that stops matching the module type-checks
 * a lie. Two things hold it down: `next-cycle-id.test.ts` exercises the real
 * runtime values (a changed BEHAVIOUR fails there, types or no types), and its
 * last block compares this file's exported names against the module's (a changed
 * SHAPE fails there).
 */

export declare const CYCLE_ID_BRANCHES: string[];
export declare function maxCycleNumber(texts: string[]): number;
export declare function nextCycleId(git: (...args: string[]) => string): string;
export declare function formatCycleId(n: number): string;
