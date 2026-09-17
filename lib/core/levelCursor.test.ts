import { describe, expect, it } from 'vitest';
import { applyLevelCursor, levelCursorPredicate, type LevelCursor } from './levelCursor';

/**
 * `T-413` · `F-277` — the predicate is the ONE thing the deck query and the "how many are
 * left" count must agree on. These tests pin the shape both of them get.
 */
describe('levelCursorPredicate — the keyset, in one place', () => {
  it('⛔ no bookmark ⇒ the whole band is still ahead', () => {
    expect(levelCursorPredicate(null)).toEqual({ kind: 'all' });
  });

  it('inside the unranked tail ⇒ every ranked row is behind the learner', () => {
    const cursor: LevelCursor = { lastNgslRank: null, lastWordId: 'w-42' };
    expect(levelCursorPredicate(cursor)).toEqual({ kind: 'unrankedTail', afterId: 'w-42' });
  });

  it('inside the ranked head ⇒ the unranked tail is still ahead (`nulls last`)', () => {
    const cursor: LevelCursor = { lastNgslRank: 310, lastWordId: 'w-7' };
    const predicate = levelCursorPredicate(cursor);
    expect(predicate.kind).toBe('or');
    if (predicate.kind !== 'or') throw new Error('unreachable');
    // ⛔ The PAIR, ⛔ not the rank alone — `F-281`: 476 rows, 0 with a rank. A cursor on
    // `ngsl_rank` alone selects ⛔ nothing on the second open.
    expect(predicate.filter).toBe(
      'ngsl_rank.gt.310,and(ngsl_rank.eq.310,id.gt.w-7),ngsl_rank.is.null',
    );
  });
});

/** A recorder standing in for the PostgREST builder — `lib/core/` holds ⛔ no client. */
function recorder(): { calls: string[]; query: Record<string, never> } {
  const calls: string[] = [];
  const query = {
    is(column: string, value: null) {
      calls.push(`is:${column}:${String(value)}`);
      return query;
    },
    gt(column: string, value: string) {
      calls.push(`gt:${column}:${value}`);
      return query;
    },
    or(filters: string) {
      calls.push(`or:${filters}`);
      return query;
    },
  };
  return { calls, query: query as unknown as Record<string, never> };
}

describe('applyLevelCursor — the deck and the count get the SAME filter', () => {
  it('⛔ touches nothing when there is no bookmark', () => {
    const { calls, query } = recorder();
    expect(applyLevelCursor(query as never, null)).toBe(query);
    expect(calls).toEqual([]);
  });

  it('the unranked tail becomes `is(ngsl_rank, null)` + `gt(id, …)`', () => {
    const { calls, query } = recorder();
    applyLevelCursor(query as never, { lastNgslRank: null, lastWordId: 'w-42' });
    expect(calls).toEqual(['is:ngsl_rank:null', 'gt:id:w-42']);
  });

  it('the ranked head becomes one `or`', () => {
    const { calls, query } = recorder();
    applyLevelCursor(query as never, { lastNgslRank: 12, lastWordId: 'w-9' });
    expect(calls).toEqual(['or:ngsl_rank.gt.12,and(ngsl_rank.eq.12,id.gt.w-9),ngsl_rank.is.null']);
  });

  it('🔴 `F-277` — the two callers cannot drift, because they call one function', () => {
    const deck = recorder();
    const count = recorder();
    const cursor: LevelCursor = { lastNgslRank: 4, lastWordId: 'w-1' };
    applyLevelCursor(deck.query as never, cursor);
    applyLevelCursor(count.query as never, cursor);
    expect(deck.calls).toEqual(count.calls);
  });
});
