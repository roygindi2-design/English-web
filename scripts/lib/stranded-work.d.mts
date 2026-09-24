/**
 * ⛔ הצהרת טיפוסים ל-`stranded-work.mjs` (`T-463`) — אותה סיבה כמו `walk-errors.d.mts`:
 * `scripts/loop-health.mjs` הוא סקריפט `node` ⇒ ⛔ אינו מייבא `.ts`, והבדיקה עוברת `tsc`.
 */
export declare const strandedFiles: (
  git: (...args: string[]) => string | null,
  base: string,
  ref: string,
) => string[] | null;
