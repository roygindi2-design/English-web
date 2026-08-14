/**
 * PostgREST WIRE SHAPES. ⛔ Not domain logic — this file knows how the transport hands us
 * an embedded row, and nothing about what the row means.
 *
 * It lives in /lib/supabase and ⛔ not in /lib/core on purpose: /lib/core is the pure
 * layer that decides things, and "PostgREST sometimes returns an object and sometimes a
 * one-element array" is a fact about a client library, ⛔ not about English. A copy of
 * this in every route is how the two `words!inner(headword)` readers drifted apart in the
 * first place (F-040).
 */

export type HeadwordRow = { headword: string | null };

/** A row from `word_progress` with `words!inner(headword)` embedded. */
export type JoinedHeadwordRow = { words: HeadwordRow | HeadwordRow[] | null };

/**
 * PostgREST returns an embedded `words!inner(...)` as an object or, depending on the
 * inferred cardinality, as a one-element array. Flatten both shapes and ⛔ never assume.
 * A null embed is dropped: `!inner` should make it impossible, and a row that arrives
 * anyway is ⛔ not a headword.
 */
export function flattenJoinedHeadwords(rows: readonly JoinedHeadwordRow[]): HeadwordRow[] {
  const out: HeadwordRow[] = [];
  for (const row of rows) {
    const joined = row?.words;
    if (Array.isArray(joined)) out.push(...joined);
    else if (joined) out.push(joined);
  }
  return out;
}
