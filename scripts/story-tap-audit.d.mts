/**
 * Types for `story-tap-audit.mjs`.
 *
 * ⚠️ WHY A HAND-WRITTEN DECLARATION AND NOT JUST TYPESCRIPT.
 * The module has exactly one consumer that matters: `scripts/verify-mobile.mjs`,
 * which `npm run check:mobile` runs with plain `node`. A `.ts` module could not be
 * imported there without adding a build step to the harness, and `tsconfig.json`
 * keeps `allowJs: false` on purpose, so the implementation stays `.mjs` and its
 * shape is declared here.
 *
 * ⛔ The obvious hazard is drift: a declaration that stops matching the module
 * type-checks a lie. Two things hold it down — `story-tap-audit.test.ts` exercises
 * the real runtime values (a changed BEHAVIOUR fails there, types or no types),
 * and its last block compares this file's exported names against the module's (a
 * changed SHAPE fails there).
 */

export declare const MIN_LINE_HEIGHT: 34;
export declare const MIN_TAP_PAD_Y: 8;
export declare const MIN_HIT_WIDTH: 32;

/** `36 § 3.1` — words that are never a tap target. A floor, not a definition. */
export declare const FUNCTION_WORD_FLOOR: ReadonlySet<string>;

export interface StoryTapRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One tappable word, as a browser measured it. */
export interface StoryTapTarget {
  text: string;
  /** The Hebrew the popover will show. `36 § 3.1`'s measurable half. */
  translation: unknown;
  rect: StoryTapRect;
  padTop: number;
  padBottom: number;
  padLeft: number;
  padRight: number;
  marginLeft: number;
  marginRight: number;
}

/** One story paragraph, at one viewport width. */
export interface StoryBody {
  route: string;
  width: number;
  lineHeight: number;
  declaresAmbiguityChip: boolean;
  targets: StoryTapTarget[];
}

export interface StoryTapFailure {
  code: string;
  detail: string;
}

export interface StoryTapAudit {
  failures: StoryTapFailure[];
  /** Index pairs whose hit areas a single touch can land in at once. */
  overlaps: Array<[number, number]>;
}

export declare function normalizeWord(text: unknown): string;

export declare function overlappingPairs(
  targets: ReadonlyArray<{ rect: StoryTapRect }>,
): Array<[number, number]>;

export declare function auditStoryBody(body: StoryBody): StoryTapAudit;
