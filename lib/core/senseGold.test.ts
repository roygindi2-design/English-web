import { describe, expect, it } from 'vitest';
import { buildGoldSet, judge } from './senseGold';

const TSV = [
  'entity\tיֵשׁוּת',
  'bank\tבַּנְק',
  'bank\tגָּדָה',
  'shore\t!חוֹף',
  'nothing\tGAP!',
  'almost\tPSEUDOGAP!',
  'blank\t',
  'broken line without a tab',
].join('\n');

describe('buildGoldSet', () => {
  it('collects every gloss a lemma has, not just the first', () => {
    const g = buildGoldSet(TSV);
    expect(g.byLemma.get('bank')?.accepted.size).toBe(2);
  });

  it('drops GAP records and counts them', () => {
    const g = buildGoldSet(TSV);
    expect(g.byLemma.has('nothing')).toBe(false);
    expect(g.droppedGap).toBe(1);
  });

  it('counts a PSEUDOGAP record apart from GAP and apart from empty', () => {
    // The fixture spells both markers the way the real export does. Folding
    // them together would report 705 gaps where D-025 accounts for 702.
    const g = buildGoldSet(TSV);
    expect(g.byLemma.has('almost')).toBe(false);
    expect(g.droppedPseudoGap).toBe(1);
    expect(g.droppedGap).toBe(1);
    expect(g.droppedEmpty).toBe(1);
  });

  it('keeps a ! record as low rather than dropping it (D-025)', () => {
    const g = buildGoldSet(TSV);
    const shore = g.byLemma.get('shore');
    expect(shore?.accepted.size).toBe(0);
    expect(shore?.low.size).toBe(1);
    expect(g.lowGlosses).toBe(1);
  });

  it('drops an empty Hebrew side and counts it separately from GAP', () => {
    const g = buildGoldSet(TSV);
    expect(g.byLemma.has('blank')).toBe(false);
    expect(g.droppedEmpty).toBe(1);
  });

  it('counts a line without a tab as malformed instead of throwing', () => {
    expect(buildGoldSet(TSV).malformed).toBe(1);
  });

  // --- beyond the plan: the counters and the shapes its tests never look at ---

  it('counts every non-empty line, malformed ones included, and no blank ones', () => {
    // The fixture is 8 data lines. Blank and whitespace-only lines are not lines.
    const g = buildGoldSet(`${TSV}\n\n   \n`);
    expect(g.lines).toBe(8);
  });

  it('treats a three-column line as malformed, not as a two-column line plus junk', () => {
    // A future export gaining a synset column must be *reported*, never silently
    // truncated to the first two fields — that would produce a gold set built
    // from a format nobody verified.
    const g = buildGoldSet('bank\tבנק\tsynset-1');
    expect(g.malformed).toBe(1);
    expect(g.byLemma.size).toBe(0);
  });

  it('normalises the English side of the file, not only the query', () => {
    const g = buildGoldSet('  BANK \tבַּנְק');
    expect([...g.byLemma.keys()]).toEqual(['bank']);
  });

  it('counts a row whose English side is empty as malformed and stores no entry', () => {
    const g = buildGoldSet('\tבנק');
    expect(g.malformed).toBe(1);
    expect(g.byLemma.size).toBe(0);
  });

  it('records the same gloss on both sides when a lemma has it plain and banged', () => {
    const g = buildGoldSet(['bank\tבנק', 'bank\t!בנק'].join('\n'));
    const bank = g.byLemma.get('bank');
    expect(bank?.accepted.size).toBe(1);
    expect(bank?.low.size).toBe(1);
    expect(g.lowGlosses).toBe(1);
  });
});

describe('judge', () => {
  it('matches regardless of niqqud on either side', () => {
    const g = buildGoldSet('bank\tבַּנְק');
    expect(judge(g, 'bank', 'בנק')).toBe('hit');
    expect(judge(g, 'BANK', 'בַּנְק')).toBe('hit');
  });

  it('reports a hit against a ! record as hit_low, not hit', () => {
    const g = buildGoldSet('shore\t!חוֹף');
    expect(judge(g, 'shore', 'חוף')).toBe('hit_low');
  });

  it('separates a wrong answer from an unmeasurable one', () => {
    const g = buildGoldSet('bank\tבַּנְק');
    expect(judge(g, 'bank', 'גדה')).toBe('miss');
    expect(judge(g, 'kettle', 'קומקום')).toBe('no_gold');
  });

  // --- beyond the plan: precedence, the one place the two sets can disagree ---

  it('prefers the accepted record when the same gloss is also present as low', () => {
    // The only shape in which the two branches of judge() can be ordered wrongly
    // without any other test noticing: one gloss, two records, opposite verdicts.
    const g = buildGoldSet(['bank\tבנק', 'bank\t!בנק'].join('\n'));
    expect(judge(g, 'bank', 'בנק')).toBe('hit');
  });

  it('does not report no_gold for a lemma whose only records were dropped', () => {
    // 'nothing' is absent from byLemma because its only gloss was a GAP; that is
    // an unmeasurable lemma, exactly like one the file never mentions.
    const g = buildGoldSet('nothing\tGAP!');
    expect(judge(g, 'nothing', 'כלום')).toBe('no_gold');
    expect(g.byLemma.size).toBe(0);
  });
});
