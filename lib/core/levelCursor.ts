/**
 * `T-413` · `F-277` · `D-266` — **the ONE definition of "where the learner stands in a
 * level", and of which words are still ahead of them.** Pure: ⛔ zero React, DOM, network
 * and env; it holds no client and issues no query. It describes a predicate, and the two
 * routes that need it apply it to their own builder.
 *
 * 🔬 **Why it had to leave `app/api/study/queue/route.ts`, and it is a MEASUREMENT.**
 * `T-411` put the keyset predicate inline in `loadLevelWords`, so the deck continued from
 * the bookmark — but the NUMBER printed over that deck («עוד לא סוננו» on the tile,
 * «נשארו N מילים ברמה» under the grade buttons) was still derived from `word_progress`,
 * i.e. from GRADING. ⇒ **the count and the cards were two populations**, and the tile kept
 * promising 314 words while the deck had already served twenty of them. That is the half
 * of `F-277` `T-411`/`T-412` did ⛔ not close.
 *
 * ⇒ the predicate lives here **once**, and both the page query and the count of what is
 * still ahead go through it. Two callers of one function ⛔ cannot drift; two hand-written
 * filters always do.
 */

/** Where this learner stopped in one band. `lastWordId` is never empty — see `T-411`. */
export interface LevelCursor {
  /** `null` = the learner is inside the unranked tail (`nulls last`). */
  readonly lastNgslRank: number | null;
  readonly lastWordId: string;
}

/**
 * ⚠️ **The key is the PAIR `(ngsl_rank nulls last, id)`, and that is a MEASUREMENT** taken on
 * the live database 2026-09-17 (`F-281`): `select count(*), count(ngsl_rank) from words` ⇒
 * **476 rows, 0 with a rank**. ⇒ a cursor on `ngsl_rank` alone selects ⛔ nothing on the
 * second open, and `id` is the tie-break the ordering already needed.
 *
 * ⛔ **Keyset, ⛔ not `offset` and ⛔ not `not.in`** — `lib/core/deck.ts:196` already measured
 * why a `not.in` URL breaks as the history grows, and an `offset` silently skips words
 * whenever the bank changes underneath the learner.
 */
export type LevelCursorPredicate =
  /** No bookmark ⇒ the whole band is still ahead. */
  | { readonly kind: 'all' }
  /** Already inside the unranked tail ⇒ every ranked row is behind the learner. */
  | { readonly kind: 'unrankedTail'; readonly afterId: string }
  /** Still inside the ranked head ⇒ the whole unranked tail is still ahead. */
  | { readonly kind: 'or'; readonly filter: string };

export function levelCursorPredicate(cursor: LevelCursor | null): LevelCursorPredicate {
  if (cursor === null) return { kind: 'all' };
  if (cursor.lastNgslRank === null) {
    return { kind: 'unrankedTail', afterId: cursor.lastWordId };
  }
  return {
    kind: 'or',
    filter:
      `ngsl_rank.gt.${cursor.lastNgslRank},` +
      `and(ngsl_rank.eq.${cursor.lastNgslRank},id.gt.${cursor.lastWordId}),` +
      `ngsl_rank.is.null`,
  };
}

/**
 * The minimum a PostgREST filter builder has to offer for the predicate to be applied. ⛔ A
 * structural type and ⛔ not an import: this file stays pure, and `lib/core/` carries ⛔ no
 * dependency on `@supabase/*`.
 */
export interface LevelCursorScopable<Q> {
  is(column: string, value: null): Q;
  gt(column: string, value: string): Q;
  or(filters: string): Q;
}

/**
 * ⚠️ **Apply this BEFORE the band filter**, exactly as `loadLevelWords` does: `route.test.ts`
 * (`F-034`) measures "there is an `order` before the `limit`" inside the statement that
 * starts at `.eq('cefr_profile_band', band)`, and a chain split across statements would make
 * that gate read an empty region and pass on nothing.
 */
export function applyLevelCursor<Q extends LevelCursorScopable<Q>>(
  query: Q,
  cursor: LevelCursor | null,
): Q {
  const predicate = levelCursorPredicate(cursor);
  switch (predicate.kind) {
    case 'all':
      return query;
    case 'unrankedTail':
      return query.is('ngsl_rank', null).gt('id', predicate.afterId);
    case 'or':
      return query.or(predicate.filter);
  }
}
