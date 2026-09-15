/**
 * Types for `build-amirnet-vocab-sql.mjs` — the amirnet vocabulary SQL emitter.  ⟦T-323⟧
 *
 * ⚠️ WHY A HAND-WRITTEN DECLARATION AND ⛔ NOT TYPESCRIPT. The same reason
 * `next-cycle-id.d.mts` states: the module is run by `npm run build:amirnet-vocab-sql`
 * with plain `node`, and `tsconfig.json` keeps `allowJs: false` on purpose ⇒ the
 * implementation stays `.mjs` and its shape is declared here.
 *
 * ⛔ The hazard is drift — a declaration that stops matching the module type-checks a
 * lie. Two things hold it down, exactly as for `next-cycle-id`: the suite exercises the
 * real runtime values (a changed BEHAVIOUR fails there, types or no types), and its last
 * block compares this file's exported names against the module's (a changed SHAPE fails
 * there).
 */

/**
 * One row of `data/generated/amirnet-vocab.csv`, in the columns
 * `public.amirnet_vocab` stores. `cefr` is the band the headword SURVIVED the merge at —
 * A1 and C2 were dropped by `41 § 6` steps 3-4 and are ⛔ unwritable (D-232).
 */
export interface VocabRow {
  readonly headword: string;
  readonly pos: string;
  readonly cefr: string;
  readonly tier: number;
  readonly tier_name: string;
  readonly amirnet_level: string;
  readonly is_connector: boolean;
  readonly source: string;
}

/** Rows in, one seed file's text out. ⛔ Throws by name on a row the table would refuse. */
export declare function toVocabSql(rows: readonly VocabRow[]): string;

/** The CSV as the table's columns. ⛔ Nothing is derived here — only read. */
export declare function parseVocabCsv(text: string): VocabRow[];
