import { describe, expect, it } from 'vitest';
import { flattenJoinedHeadwords } from '@/lib/supabase/postgrest';

/**
 * Behaviour, ⛔ not a source guard: this file is pure and reachable in the node
 * environment, so it is measured by calling it.
 */
describe('flattenJoinedHeadwords', () => {
  it('flattens the object shape PostgREST returns for a to-one embed', () => {
    expect(flattenJoinedHeadwords([{ words: { headword: 'can' } }])).toEqual([
      { headword: 'can' },
    ]);
  });

  it('flattens the one-element array shape it returns when cardinality is inferred to-many', () => {
    expect(flattenJoinedHeadwords([{ words: [{ headword: 'can' }] }])).toEqual([
      { headword: 'can' },
    ]);
  });

  it('keeps every element of a multi-element embed — ⛔ never just the first', () => {
    expect(
      flattenJoinedHeadwords([{ words: [{ headword: 'can' }, { headword: 'may' }] }]),
    ).toEqual([{ headword: 'can' }, { headword: 'may' }]);
  });

  it('drops a null embed instead of emitting a blank headword', () => {
    expect(flattenJoinedHeadwords([{ words: null }, { words: { headword: 'run' } }])).toEqual([
      { headword: 'run' },
    ]);
  });

  it('preserves duplicates — deduping is uniqueHeadwords’ job and ⛔ not this one', () => {
    // ⚠️ Measured because it is the SEAM F-040 broke: if this function deduped, the two
    // callers would each be doing half of a dedupe and neither would own it.
    expect(
      flattenJoinedHeadwords([{ words: { headword: 'can' } }, { words: { headword: 'can' } }]),
    ).toHaveLength(2);
  });

  it('returns an empty array for no rows, ⛔ never undefined', () => {
    expect(flattenJoinedHeadwords([])).toEqual([]);
  });
});
