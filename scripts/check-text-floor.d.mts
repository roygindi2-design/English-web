/**
 * Types for `check-text-floor.mjs` — the text-floor gate.
 *
 * ⚠️ WHY A HAND-WRITTEN DECLARATION AND ⛔ NOT TYPESCRIPT. Same reason as
 * `check-motion.d.mts` / `story-tap-audit.d.mts`: the module is run by
 * `npm run check:text-floor` with plain `node`, and `tsconfig.json` keeps
 * `allowJs: false` on purpose ⇒ the implementation stays `.mjs` and its shape is
 * declared here.
 *
 * ⛔ The hazard is drift — a declaration that stops matching the module type-checks a
 * lie. Two things hold it down: `text-floor-gate.test.ts` exercises the real runtime
 * values (a changed BEHAVIOUR fails there, types or no types), and its last block
 * compares this file's exported names against the module's (a changed SHAPE fails
 * there).
 */

/** ⛔ The one sentence `scripts/text-floor-baseline.md` may never lose. */
export declare const BASELINE_HEADER_RULE: string;

/** Repo-relative path of the frozen baseline. */
export declare const BASELINE_PATH: string;

/** ⓐ = a sub-12px Tailwind arbitrary class · ⓑ = a sub-12px `font-size` declaration. */
export type TextFloorRule = 'A' | 'B';

export interface TextFloorViolation {
  /** Repo-relative path. */
  file: string;
  rule: TextFloorRule;
  /** `text-[<n>px]`, or `font-size:<n><unit>`. */
  key: string;
  /** Informational only — ⛔ never part of the baseline key. */
  line: number;
  detail: string;
}

export interface BaselineRow {
  file: string;
  rule: string;
  key: string;
  /** `F-nnn`, and it must exist in `plan/60-findings.md`. */
  finding: string;
  /** `T-nnn`, and it must exist in `plan/50-tasks.md`. */
  task: string;
  /** `<file> · <rule> · <key>` — what a violation is matched against. */
  id: string;
}

export declare function cssCode(source: string): string;
export declare function tsxCode(source: string): string;
export declare function violationsInCss(file: string, source: string): TextFloorViolation[];
export declare function violationsInTsx(file: string, source: string): TextFloorViolation[];
export declare function scanRepo(root?: string): TextFloorViolation[];
export declare function parseBaseline(text: string): BaselineRow[];
