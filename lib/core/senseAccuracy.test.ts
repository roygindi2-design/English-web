import { describe, expect, it } from 'vitest';
import { buildLevelMap } from './cefrLevels';
import { buildGoldSet } from './senseGold';
import { buildInventory, type SenseRecord } from './senseInventory';
import {
  BASELINE_F1,
  measureAccuracy,
  renderAccuracyMarkdown,
  RELEASE_THRESHOLD,
  type AccuracyItem,
} from './senseAccuracy';

const rec = (
  lemma: string, pos: SenseRecord['pos'], synsetId: string,
  senseNumber: number, tagCount = 5,
): SenseRecord => ({ lemma, pos, synsetId, senseNumber, tagCount });

const inv = buildInventory([
  rec('kettle', 'noun', '03612814-n', 1),
  rec('bank', 'noun', '08420278-n', 1),
  rec('bank', 'noun', '09213565-n', 2),
  rec('run', 'noun', '00558963-n', 1),
  rec('run', 'verb', '01926311-v', 1),
]);
const gold = buildGoldSet(['kettle\tקומקום', 'bank\tבנק', 'run\t!ריצה'].join('\n'));
const levels = buildLevelMap([
  { lemma: 'kettle', pos: 'noun', band: 'B1' },
  { lemma: 'bank', pos: 'noun', band: 'A2' },
]);

describe('measureAccuracy', () => {
  it('scores hits, misses and low hits into the right buckets', () => {
    const r = measureAccuracy({
      inv, gold, levels,
      items: [
        { lemma: 'kettle', pos: 'noun', hebrew: 'קומקום' }, // hit, monosemous, B1
        { lemma: 'bank', pos: 'noun', hebrew: 'גדה' },      // miss, polysemous, A2
        { lemma: 'run', pos: 'noun', hebrew: 'ריצה' },      // hit_low, multi_pos, unknown band
      ],
    });
    expect(r.overall).toEqual({ evaluated: 3, hits: 1, hitsLow: 1, accuracy: 2 / 3 });
    expect(r.byAmbiguity.monosemous.accuracy).toBe(1);
    expect(r.byAmbiguity.polysemous.accuracy).toBe(0);
    expect(r.byAmbiguity.multi_pos.hitsLow).toBe(1);
    expect(r.byBand.B1.evaluated).toBe(1);
    expect(r.byBand.unknown.evaluated).toBe(1);
  });

  it('excludes a lemma with no gold answer from every denominator', () => {
    const r = measureAccuracy({
      inv, gold, levels,
      items: [
        { lemma: 'kettle', pos: 'noun', hebrew: 'קומקום' },
        { lemma: 'zzzz', pos: 'noun', hebrew: 'שטות' },
      ],
    });
    expect(r.overall.evaluated).toBe(1);
    expect(r.noGold).toBe(1);
    expect(r.overall.accuracy).toBe(1);
  });

  it('reports null, not zero, when nothing could be evaluated', () => {
    const r = measureAccuracy({ inv, gold, levels, items: [] });
    expect(r.overall.accuracy).toBeNull();
    expect(r.meetsThreshold).toBe(false);
  });

  it('holds the release gate at 90% and the baseline at 65.2', () => {
    expect(RELEASE_THRESHOLD).toBe(0.9);
    expect(BASELINE_F1).toBe(65.2);
  });

  // --- Beyond the plan: branches the four tests above leave unmeasured. ---

  /**
   * An item whose lemma is not in the sense inventory has no ambiguity class at
   * all. It must still be scored — it has a gold answer — but it must not be
   * charged to any ambiguity bucket, or the three buckets would stop summing to
   * a set anyone can reason about. This is the only branch where the ambiguity
   * breakdown and the overall row legitimately disagree.
   */
  it('scores an item that is absent from the sense inventory without an ambiguity bucket', () => {
    const r = measureAccuracy({
      inv, gold, levels,
      // 'bank' is in the gold set and in the level map, but the inventory holds
      // no verb sense for it, so classifyAmbiguity returns null.
      items: [{ lemma: 'bank', pos: 'verb', hebrew: 'בנק' }],
    });
    expect(r.overall).toEqual({ evaluated: 1, hits: 1, hitsLow: 0, accuracy: 1 });
    const ambiguityTotal =
      r.byAmbiguity.monosemous.evaluated
      + r.byAmbiguity.polysemous.evaluated
      + r.byAmbiguity.multi_pos.evaluated;
    expect(ambiguityTotal).toBe(0);
    // The band still comes through: an unclassified word is not an unknown-band word.
    expect(r.byBand.A2.evaluated).toBe(1);
  });

  /**
   * A `no_gold` item must be invisible to the band breakdown too, not only to
   * `overall`. Counting it in one place and not the other is exactly how a
   * coverage gap (R-005) starts being read as an accuracy figure (R-006).
   */
  it('keeps a no-gold item out of the band breakdown as well', () => {
    const r = measureAccuracy({
      inv, gold, levels,
      items: [{ lemma: 'zzzz', pos: 'noun', hebrew: 'שטות' }],
    });
    expect(r.noGold).toBe(1);
    expect(r.byBand.unknown.evaluated).toBe(0);
    expect(r.overall.accuracy).toBeNull();
  });

  /** The level map may know a lemma without knowing its POS; the band still applies. */
  it('takes the band from the lemma-only route when no POS-exact entry exists', () => {
    const looseLevels = buildLevelMap([{ lemma: 'run', pos: null, band: 'C1' }]);
    const r = measureAccuracy({
      inv, gold, levels: looseLevels,
      items: [{ lemma: 'run', pos: 'noun', hebrew: 'ריצה' }],
    });
    expect(r.byBand.C1.evaluated).toBe(1);
    expect(r.byBand.unknown.evaluated).toBe(0);
  });

  /** The gate is `>=`, and 90.0% exactly is a pass. One item either way flips it. */
  it('passes at exactly the threshold and fails just below it', () => {
    const lemmas = Array.from({ length: 10 }, (_, i) => `w${i}`);
    const tenGold = buildGoldSet(lemmas.map((l) => `${l}\tנכון`).join('\n'));
    const items = (hits: number): AccuracyItem[] =>
      lemmas.map((lemma, i) => ({
        lemma, pos: 'noun' as const, hebrew: i < hits ? 'נכון' : 'שגוי',
      }));

    const at = measureAccuracy({ inv, gold: tenGold, levels, items: items(9) });
    expect(at.overall.accuracy).toBe(0.9);
    expect(at.meetsThreshold).toBe(true);

    const below = measureAccuracy({ inv, gold: tenGold, levels, items: items(8) });
    expect(below.overall.accuracy).toBe(0.8);
    expect(below.meetsThreshold).toBe(false);
  });

  /** `hit_low` is inside the accuracy figure and reported apart, both at once. */
  it('counts a low-confidence hit in the accuracy figure while reporting it separately', () => {
    const r = measureAccuracy({
      inv, gold, levels,
      items: [{ lemma: 'run', pos: 'noun', hebrew: 'ריצה' }],
    });
    expect(r.overall).toEqual({ evaluated: 1, hits: 0, hitsLow: 1, accuracy: 1 });
  });
});

describe('renderAccuracyMarkdown', () => {
  it('prints unavailable rather than 0% for an empty bucket', () => {
    const md = renderAccuracyMarkdown(
      measureAccuracy({ inv, gold, levels, items: [] }),
      ['h1-hebrew-wordnet.tsv — 17,564 lines'],
    );
    expect(md).toContain('unavailable');
    expect(md).not.toContain('0.0%');
    expect(md).toContain('h1-hebrew-wordnet.tsv');
  });

  /**
   * The counterpart of the test above, and the reason `accuracy` is nullable at
   * all: a bucket that was measured and got everything wrong prints 0.0%, and a
   * bucket that could not be measured prints `unavailable`. If either rendering
   * ever covers the other case, the report stops being readable as evidence.
   */
  it('prints 0.0% for a bucket that was measured and scored nothing', () => {
    const md = renderAccuracyMarkdown(
      measureAccuracy({
        inv, gold, levels,
        items: [{ lemma: 'bank', pos: 'noun', hebrew: 'גדה' }],
      }),
      [],
    );
    expect(md).toContain('| **overall** | 1 | 0 | 0 | 0.0% |');
    // The buckets that received nothing still say so, in the same table.
    expect(md).toContain('| multi_pos | 0 | 0 | 0 | unavailable |');
  });

  it('renders every ambiguity class and every band, including the empty ones', () => {
    const md = renderAccuracyMarkdown(measureAccuracy({ inv, gold, levels, items: [] }), []);
    for (const label of ['monosemous', 'polysemous', 'multi_pos',
      'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'unknown']) {
      expect(md).toContain(`| ${label} | 0 | 0 | 0 | unavailable |`);
    }
  });

  it('labels the number lemma-level and lists the provenance lines it was given', () => {
    const md = renderAccuracyMarkdown(
      measureAccuracy({ inv, gold, levels, items: [] }),
      ['first source — 3 rows', 'second source — unavailable'],
    );
    expect(md).toContain('lemma level');
    expect(md).toContain('- first source — 3 rows');
    expect(md).toContain('- second source — unavailable');
    expect(md).toContain('not met');
  });
});
