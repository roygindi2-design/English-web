import { describe, expect, it } from 'vitest';
import {
  LENIENT_POLICY,
  STRICT_POLICY,
  measureCoverage,
  type CoverageReport,
  type LexicalSource,
  type SourceCoverage,
} from './coverage';

const SEFER = 'ספר';
const BAYIT = 'בית';
const POINTED_BAYIT = 'בַּיִת';

function src(id: string, entries: Array<[string, string]>): LexicalSource {
  return { id, label: id, entries: entries.map(([en, he]) => ({ en, he })) };
}

/**
 * tsconfig has `noUncheckedIndexedAccess`, so `r.perSource[0]` is typed
 * `SourceCoverage | undefined`. A `!` would silence the compiler and turn a
 * missing source into "cannot read properties of undefined" three lines later;
 * this names the failure at the point it happens.
 */
function source(r: CoverageReport, i: number): SourceCoverage {
  const s = r.perSource[i];
  if (s === undefined) {
    throw new Error(`no perSource[${i}] — report has ${r.perSource.length} source(s)`);
  }
  return s;
}

describe('measureCoverage', () => {
  it('counts a headword as covered when any accepted gloss matches it', () => {
    const r = measureCoverage(
      ['book', 'house'],
      [src('H1', [['book', SEFER]])],
      STRICT_POLICY,
    );
    expect(source(r, 0).covered).toBe(1);
    expect(source(r, 0).total).toBe(2);
    expect(source(r, 0).percent).toBe(50);
    expect(r.uncovered).toEqual(['house']);
  });

  it('matches through English normalisation on both sides', () => {
    const r = measureCoverage(
      ['  Book '],
      [src('H1', [['BOOK', SEFER]])],
      STRICT_POLICY,
    );
    expect(source(r, 0).covered).toBe(1);
  });

  it('deduplicates repeated headwords before counting', () => {
    const r = measureCoverage(
      ['book', 'Book', 'book'],
      [src('H1', [['book', SEFER]])],
      STRICT_POLICY,
    );
    expect(r.headwordCount).toBe(1);
    expect(source(r, 0).percent).toBe(100);
  });

  it('reports the ORIGINAL spelling of an uncovered headword, not the key', () => {
    const r = measureCoverage(['  House '], [src('H1', [])], STRICT_POLICY);
    expect(r.uncovered).toEqual(['  House ']);
  });

  it('sorts uncovered by normalised key so the report is reproducible', () => {
    const r = measureCoverage(
      ['zebra', 'apple', 'Mango'],
      [src('H1', [])],
      STRICT_POLICY,
    );
    expect(r.uncovered).toEqual(['apple', 'Mango', 'zebra']);
  });

  it('a GAP gloss is not coverage — this is where T-017 meets T-013', () => {
    const r = measureCoverage(
      ['book'],
      [src('H1', [['book', 'GAP']])],
      STRICT_POLICY,
    );
    expect(source(r, 0).covered).toBe(0);
    expect(source(r, 0).acceptedGlosses).toBe(0);
    expect(source(r, 0).rejectedGlosses).toBe(1);
    expect(r.uncovered).toEqual(['book']);
  });

  it('STRICT rejects a bang record; LENIENT accepts it as coverage', () => {
    const sources = [src('H1', [['book', '!' + SEFER]])];
    expect(source(measureCoverage(['book'], sources, STRICT_POLICY), 0).covered).toBe(0);
    expect(source(measureCoverage(['book'], sources, LENIENT_POLICY), 0).covered).toBe(1);
  });

  it('STRICT rejects a pointed record; LENIENT accepts it', () => {
    const sources = [src('H1', [['house', POINTED_BAYIT]])];
    expect(source(measureCoverage(['house'], sources, STRICT_POLICY), 0).covered).toBe(0);
    expect(source(measureCoverage(['house'], sources, LENIENT_POLICY), 0).covered).toBe(1);
  });

  it('combined coverage is the union across sources, not the sum', () => {
    const r = measureCoverage(
      ['book', 'house', 'tree'],
      [
        src('H1', [['book', SEFER], ['house', BAYIT]]),
        src('H2', [['house', BAYIT]]),
      ],
      STRICT_POLICY,
    );
    expect(source(r, 0).covered).toBe(2);
    expect(source(r, 1).covered).toBe(1);
    expect(r.combined.covered).toBe(2);
    expect(r.combined.percent).toBe(66.67);
    expect(r.uncovered).toEqual(['tree']);
  });

  it('an entry for a headword that is not in the list is ignored, not counted', () => {
    const r = measureCoverage(
      ['book'],
      [src('H1', [['book', SEFER], ['aardvark', BAYIT]])],
      STRICT_POLICY,
    );
    expect(source(r, 0).covered).toBe(1);
    expect(source(r, 0).percent).toBe(100);
    expect(source(r, 0).acceptedGlosses).toBe(2);
  });

  it('an empty headword list yields 0, never NaN', () => {
    const r = measureCoverage([], [src('H1', [['book', SEFER]])], STRICT_POLICY);
    expect(r.headwordCount).toBe(0);
    expect(source(r, 0).percent).toBe(0);
    expect(r.combined.percent).toBe(0);
    expect(r.uncovered).toEqual([]);
  });

  it('an empty source yields 0% and does not throw', () => {
    const r = measureCoverage(['book'], [src('H1', [])], STRICT_POLICY);
    expect(source(r, 0).percent).toBe(0);
    expect(r.combined.percent).toBe(0);
  });

  it('rounds percent to two decimals', () => {
    const r = measureCoverage(
      ['a', 'b', 'c'],
      [src('H1', [['a', SEFER]])],
      STRICT_POLICY,
    );
    expect(source(r, 0).percent).toBe(33.33);
  });

  it('preserves source order in perSource so the report reads predictably', () => {
    const r = measureCoverage(
      ['book'],
      [src('H3', []), src('H1', []), src('H4', [])],
      STRICT_POLICY,
    );
    expect(r.perSource.map((s) => s.id)).toEqual(['H3', 'H1', 'H4']);
  });
});
