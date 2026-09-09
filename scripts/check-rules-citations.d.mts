/**
 * ⛔ Types for `check-rules-citations.mjs` — the gate that makes «⛔ no citation broke»
 * a measurement. Same pattern as `check-motion.d.mts`: `allowJs` is false, so a test
 * that imports the gate needs this file or `tsc --noEmit` goes red.
 */
export interface RulesCitation {
  /** The full reference as written, e.g. `0.23ט`. */
  readonly ref: string;
  /** The numeric part alone, e.g. `0.23`. */
  readonly bare: string;
  /** 1-indexed line the citation sits on. */
  readonly line: number;
}

/** Every `### 0.x` / `#### 0.xא` / `#### א׳ ·` / `**א׳ ·**` anchor in `plan/RULES.md`. */
export function anchorsOf(text: string): Set<string>;

/** Every `§ 0.x` citation in one file, minus the deliberate non-citations. */
export function citationsIn(text: string): RulesCitation[];

/** ⛔ Section numbers declared more than once in `plan/RULES.md` — a citation to them is ambiguous. */
export function duplicateAnchors(text: string): string[];

/** ⛔ A lettered citation resolves ⛔ only against its own letter — ⛔ never the parent. */
export function resolves(anchors: Set<string>, citation: RulesCitation): boolean;

/** ⛔ The scan itself. Runs on `node scripts/check-rules-citations.mjs`; exits 1 on a break. */
export function main(): void;
