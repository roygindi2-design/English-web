import { describe, expect, it } from 'vitest';
import type { BatchRecord } from './batchRecord';
import { gateSense } from './contentSchema';
import { scoringCounts, scoringRowsFor } from './scoringSeed';

/** A record shaped exactly like a parsed jsonl row, ⛔ not read from data/generated/. */
function record(overrides: Partial<BatchRecord['sense']> = {}, senseIndex = 1): BatchRecord {
  return {
    sense: {
      headword: 'always',
      pos: 'adverb',
      translationHe: 'תמיד',
      definitionEn: 'at every time',
      examples: { supportive: 'He always walks to work.', neutral: 'She always says that.' },
      items: ['The train ____ leaves at nine.', 'She ____ helps her friends.'],
      distractors: [
        { word: 'quite', relationType: 'semantic' },
        { word: 'alone', relationType: 'orthographic' },
      ],
      ...overrides,
    },
    senseIndex,
    cefrLevel: 'A1',
    confidence: 'high',
    needsHumanReview: false,
    heInterferenceNote: null,
    heOneToManyGroup: null,
    spotCheck: false,
    nLetters: 6,
    nSyllables: 2,
    isFunctionWord: false,
  };
}

describe('scoringRowsFor', () => {
  it('emits both D-022 example kinds, each carrying the identity of its sense', () => {
    const rows = scoringRowsFor([record()]);
    expect(rows.examples).toEqual([
      { headword: 'always', pos: 'adverb', senseIndex: 1, kind: 'supportive', textEn: 'He always walks to work.' },
      { headword: 'always', pos: 'adverb', senseIndex: 1, kind: 'neutral', textEn: 'She always says that.' },
    ]);
  });

  it('numbers item stems by array position — sense_items.item_index is unique per sense', () => {
    const rows = scoringRowsFor([record()]);
    expect(rows.items.map((row) => [row.itemIndex, row.stem])).toEqual([
      [0, 'The train ____ leaves at nine.'],
      [1, 'She ____ helps her friends.'],
    ]);
  });

  it('keeps near_synonym distractors — D-023 STORES them and excludes them at serve time', () => {
    const rows = scoringRowsFor([
      record({ distractors: [{ word: 'ever', relationType: 'near_synonym' }] }),
    ]);
    expect(rows.distractors).toEqual([
      { headword: 'always', pos: 'adverb', senseIndex: 1, distractor: 'ever', relationType: 'near_synonym' },
    ]);
  });

  it('collapses a distractor repeated in a different case — unique (sense_id, distractor)', () => {
    const rows = scoringRowsFor([
      record({
        distractors: [
          { word: 'Quite', relationType: 'semantic' },
          { word: 'quite', relationType: 'orthographic' },
        ],
      }),
    ]);
    expect(rows.distractors).toHaveLength(1);
    expect(rows.distractors[0]?.distractor).toBe('Quite');
  });

  it('keeps the same distractor on two DIFFERENT senses — the key is per sense, not global', () => {
    const rows = scoringRowsFor([record({}, 1), record({}, 2)]);
    expect(rows.distractors.filter((row) => row.distractor === 'quite')).toHaveLength(2);
  });

  it('returns three empty arrays for no records, ⛔ not undefined', () => {
    expect(scoringRowsFor([])).toEqual({ examples: [], items: [], distractors: [] });
  });
});

describe('scoringCounts', () => {
  it('counts each table separately, so the SQL header states what it inserts', () => {
    expect(scoringCounts(scoringRowsFor([record()]))).toEqual({
      examples: 2,
      items: 2,
      distractors: 2,
    });
  });
});

/**
 * Mutation 9(b) of the plan — swapping `scoringRowsFor(passing)` for
 * `scoringRowsFor(batches.flatMap((b) => b.records))` in scripts/build-ingest-sql.mjs —
 * left scripts/build-ingest-sql.test.ts GREEN, measured C-0146. The reason is not that
 * the distinction is unimportant: it is that TODAY `0 rejected by the gate` over all 469
 * rows of all 8 batch files, so the two arrays hold the same records, AND the generator
 * exits 1 whenever a row is rejected — so no state exists in which that suite could run
 * with a rejected row present. The claim "rejected rows never reach the seed" is
 * therefore untestable from there, and is asserted here instead, on hand-written records.
 *
 * What is being pinned: scoringRowsFor is a FLATTENER, ⛔ not a gate. It emits rows for
 * whatever it is handed, and exclusion is entirely the caller's filtering. Both halves
 * are asserted, because only the pair rules out a vacuous filter.
 */
describe('the gate is the caller’s job — R-014', () => {
  const ALLOWED = new Set(
    'he she the a to at on always walks work says that train leaves nine helps her friends quite alone often never'.split(
      ' ',
    ),
  );
  const passes = (r: BatchRecord): boolean => gateSense(r.sense, { allowedWords: ALLOWED }).ok;

  /** Measured: gate ok=true, reasons []. */
  const GOOD = record({
    items: [
      'The train ____ leaves at nine.',
      'She ____ helps her friends.',
      'He ____ walks to work.',
    ],
    distractors: [
      { word: 'quite', relationType: 'semantic' },
      { word: 'alone', relationType: 'orthographic' },
      { word: 'often', relationType: 'collocational' },
      { word: 'never', relationType: 'unrelated' },
    ],
  });
  /** Measured: gate ok=false — "example supportive: headword missing" and three more. */
  const REJECTED = record({ headword: 'yacht', pos: 'noun', definitionEn: 'a boat' }, 2);

  it('flattens a gate-REJECTED record just the same — it does no gating of its own', () => {
    expect(passes(REJECTED)).toBe(false);
    const rows = scoringRowsFor([GOOD, REJECTED]);
    expect(rows.examples.filter((row) => row.headword === 'yacht')).toHaveLength(2);
  });

  it('excludes it only once the CALLER filters — and ⛔ does not empty the batch doing so', () => {
    expect(passes(GOOD)).toBe(true);
    const rows = scoringRowsFor([GOOD, REJECTED].filter(passes));
    expect(rows.examples.filter((row) => row.headword === 'yacht')).toHaveLength(0);
    expect(rows.examples.filter((row) => row.headword === 'always')).toHaveLength(2);
  });
});
