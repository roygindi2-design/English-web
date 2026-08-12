/**
 * T-010, second half. See wordLevel.ts for why a profile band never overwrites
 * the Content agent's own band.
 *
 * ⚠️ Measured in this repo on 2026-08-12T18:40Z with the real modules — the plan's
 * numbers were a crude-normalization floor and are replaced by these:
 *   parseCefrCsv  cefrj rows 7799 · entries 7974 · skipped 0 · unknownPos 31
 *                 octanove rows 2136 · entries 2182 · skipped 0 · unknownPos 2
 *   buildLevelMap byLemmaPos 9948 · byLemma 8843
 *   ROW level (343 batch rows):  exact 336 · lemma_only 7 · miss 0 · disagree 125
 *   PAIR level (306 distinct (headword,pos)): exact 299 · lemma_only 7 · miss 0 · disagree 94
 * The plan's "stop if dis < 100" threshold was written against the ROW-level floor
 * (124 of 342) but its Step-1 command dedupes to PAIRS, so the two are not the same
 * denominator. Against the right denominator the premise holds and got stronger:
 * 125 ≥ 124 disagreeing rows, and miss fell 1 → 0.
 */
import { describe, expect, it } from 'vitest';
import { buildLevelMap, type LevelEntry } from './cefrLevels';
import { assignWordLevels, formatLevelReport } from './wordLevel';

const map = buildLevelMap([
  { lemma: 'mean', pos: 'verb', band: 'A1' },
  { lemma: 'report', pos: 'noun', band: 'A2' },
  { lemma: 'water', pos: 'noun', band: 'A1' },
  { lemma: 'must', pos: null, band: 'A2' }, // lemma-only route
] as LevelEntry[]);

describe('assignWordLevels', () => {
  it('takes the profile band and the route from levelOf, never from ownBand', () => {
    const r = assignWordLevels(map, [{ headword: 'mean', pos: 'verb', ownBand: 'B1' }]);
    expect(r.words[0]).toEqual({
      headword: 'mean',
      pos: 'verb',
      profileBand: 'A1',
      route: 'exact_pos',
      ownBand: 'B1',
      agreement: 'profile_lower',
    });
  });

  it('routes through the lemma when the profile has no POS', () => {
    const r = assignWordLevels(map, [{ headword: 'must', pos: 'verb', ownBand: 'A2' }]);
    expect(r.words[0]?.route).toBe('lemma_only');
    expect(r.words[0]?.agreement).toBe('agree');
  });

  it('emits null — never a guess — for a word no profile covers', () => {
    const r = assignWordLevels(map, [{ headword: 'program', pos: 'noun', ownBand: 'A2' }]);
    expect(r.words[0]).toEqual({
      headword: 'program',
      pos: 'noun',
      profileBand: null,
      route: null,
      ownBand: 'A2',
      agreement: 'no_profile',
    });
    expect(r.unmatched).toBe(1);
  });

  it('records no_own when the Content agent left the level empty', () => {
    const r = assignWordLevels(map, [{ headword: 'water', pos: 'noun', ownBand: null }]);
    expect(r.words[0]?.agreement).toBe('no_own');
    expect(r.disagree).toBe(0);
  });

  it('names the direction of a disagreement', () => {
    const r = assignWordLevels(map, [
      { headword: 'mean', pos: 'verb', ownBand: 'B1' }, // profile easier
      { headword: 'water', pos: 'noun', ownBand: 'A1' }, // equal
      { headword: 'report', pos: 'noun', ownBand: 'A1' }, // profile harder
    ]);
    expect(r.words.map((w) => w.agreement)).toEqual([
      'profile_lower',
      'agree',
      'profile_higher',
    ]);
    expect({ agree: r.agree, disagree: r.disagree }).toEqual({ agree: 1, disagree: 2 });
  });

  it('counts routes and totals over the whole list', () => {
    const r = assignWordLevels(map, [
      { headword: 'mean', pos: 'verb', ownBand: 'B1' },
      { headword: 'must', pos: 'verb', ownBand: 'A2' },
      { headword: 'program', pos: 'noun', ownBand: 'A2' },
    ]);
    expect({
      total: r.total,
      exactPos: r.exactPos,
      lemmaOnly: r.lemmaOnly,
      unmatched: r.unmatched,
    }).toEqual({ total: 3, exactPos: 1, lemmaOnly: 1, unmatched: 1 });
  });

  it('preserves input order — the emitter depends on it for a stable diff', () => {
    const r = assignWordLevels(map, [
      { headword: 'water', pos: 'noun', ownBand: 'A1' },
      { headword: 'mean', pos: 'verb', ownBand: 'B1' },
    ]);
    expect(r.words.map((w) => w.headword)).toEqual(['water', 'mean']);
  });

  /**
   * Added beyond the plan. The plan's own Step 4 warns that a locally re-declared
   * band order silently stops tracking cefrLevels.BAND_ORDER; nothing in the plan's
   * test list would have caught it, because every other case compares bands that a
   * five-element order still ranks correctly. C1/C2 exist only in Octanove, so this
   * is the pair a truncated order gets wrong.
   */
  it('ranks the C-bands, which only the Octanove profile supplies', () => {
    const advanced = buildLevelMap([
      { lemma: 'ubiquitous', pos: 'adjective', band: 'C1' },
      { lemma: 'obfuscate', pos: 'verb', band: 'C2' },
    ] as LevelEntry[]);
    const r = assignWordLevels(advanced, [
      { headword: 'ubiquitous', pos: 'adjective', ownBand: 'C2' }, // profile easier
      { headword: 'obfuscate', pos: 'verb', ownBand: 'C1' }, // profile harder
    ]);
    expect(r.words.map((w) => w.agreement)).toEqual(['profile_lower', 'profile_higher']);
  });
});

describe('formatLevelReport', () => {
  it('prints one line in the build-ingest-sql shape', () => {
    const r = assignWordLevels(map, [
      { headword: 'mean', pos: 'verb', ownBand: 'B1' },
      { headword: 'program', pos: 'noun', ownBand: 'A2' },
    ]);
    expect(formatLevelReport(r)).toBe(
      '2 words · 1 exact_pos · 0 lemma_only · 1 unmatched · 0 agree · 1 disagree',
    );
  });
});
