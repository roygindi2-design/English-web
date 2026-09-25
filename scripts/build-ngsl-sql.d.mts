/**
 * Types for `build-ngsl-sql.mjs` — the NGSL v1.2 frequency seed emitter.  ⟦T-007⟧
 *
 * Hand-written for the reason `build-amirnet-vocab-sql.d.mts` states: the module runs under
 * plain `node` and `tsconfig.json` keeps `allowJs: false`. The suite exercises the runtime
 * values, so a changed behaviour fails there, types or no types.
 */

/** One NGSL lemma, in the columns `public.ngsl_frequency` stores. */
export interface NgslRow {
  readonly rank: number;
  readonly headword: string;
  readonly sfi: number;
}

/** v1.2 is exactly 2,809 lemmas (T-012 · F-005). */
export declare const NGSL_ROWS: number;

/** Rows in, one seed file's text out. ⛔ Throws by name on a list the table would refuse. */
export declare function toNgslSql(rows: readonly NgslRow[]): string;

/** The CSV's rank · headword · sfi columns, read by name. */
export declare function parseNgslCsv(text: string): NgslRow[];
