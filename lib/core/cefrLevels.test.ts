import { describe, expect, it } from 'vitest';
import {
  buildLevelMap, levelOf, parseCefrCsv, splitCsvLine,
} from './cefrLevels';

describe('splitCsvLine', () => {
  it('keeps a comma that lives inside quotes in one field', () => {
    expect(splitCsvLine('abuse,noun,B2,"News, lifestyles and current affairs",,'))
      .toEqual(['abuse', 'noun', 'B2', 'News, lifestyles and current affairs', '', '']);
  });

  it('handles a doubled quote as one literal quote', () => {
    expect(splitCsvLine('cast,noun,C1,"a ""plaster"" cast"'))
      .toEqual(['cast', 'noun', 'C1', 'a "plaster" cast']);
  });
});

describe('parseCefrCsv', () => {
  it('drops the header row without counting it as a skip', () => {
    const r = parseCefrCsv('headword,pos,CEFR,notes\ncloak,noun,C1,\n');
    expect(r.rows).toBe(1);
    expect(r.skipped).toBe(0);
    expect(r.entries).toEqual([{ lemma: 'cloak', pos: 'noun', band: 'C1' }]);
  });

  it('expands a slash headword into one entry per spelling', () => {
    const r = parseCefrCsv('a.m./A.M./am/AM,adverb,A1,,,\n');
    expect(r.entries.map((e) => e.lemma)).toEqual(['a.m.', 'a.m.', 'am', 'am']);
    expect(r.entries).toHaveLength(4);
  });

  it('maps be-verb, do-verb, have-verb and modal auxiliary to verb', () => {
    const r = parseCefrCsv(
      'be,be-verb,A1,\ndo,do-verb,A1,\nhave,have-verb,A1,\ncan,modal auxiliary,A1,\n',
    );
    expect(r.entries.map((e) => e.pos)).toEqual(['verb', 'verb', 'verb', 'verb']);
    expect(r.unknownPos).toBe(0);
  });

  it('keeps an unrecognised POS as null instead of guessing it', () => {
    // Real rows: Octanove ships "remonstrate,vern,C2" and "batter,,C1".
    const r = parseCefrCsv('remonstrate,vern,C2,\nbatter,,C1,one who bats\n');
    expect(r.entries.map((e) => e.pos)).toEqual([null, null]);
    expect(r.unknownPos).toBe(2);
    expect(r.skipped).toBe(0);
  });

  it('skips a row whose band is not a CEFR band and counts it', () => {
    const r = parseCefrCsv('cloak,noun,C1,\nbroken,noun,Z9,\n');
    expect(r.entries).toHaveLength(1);
    expect(r.skipped).toBe(1);
  });

  it('counts a slash row once in rows and once in unknownPos, not once per spelling', () => {
    // Without this, a 4-spelling row with an unknown POS would inflate both
    // counters fourfold and the measured skip/unknown rates would be fiction.
    const r = parseCefrCsv('half/half a/a half,number,A2,\n');
    expect(r.rows).toBe(1);
    expect(r.unknownPos).toBe(1);
    expect(r.entries).toHaveLength(3);
  });

  it('keeps a real row whose headword is the literal string "headword"', () => {
    // The header is identified by its band column, not by line number or by
    // column 1 alone: a data row named "headword" must survive.
    const r = parseCefrCsv('headword,noun,B2,\n');
    expect(r.rows).toBe(1);
    expect(r.entries).toEqual([{ lemma: 'headword', pos: 'noun', band: 'B2' }]);
  });
});

describe('levelOf', () => {
  it('prefers the exact POS match and says so', () => {
    const map = buildLevelMap([
      { lemma: 'run', pos: 'noun', band: 'B1' },
      { lemma: 'run', pos: 'verb', band: 'A1' },
    ]);
    expect(levelOf(map, 'run', 'noun')).toEqual({ band: 'B1', route: 'exact_pos' });
  });

  it('falls back to the lemma when that POS is unlabelled, and says so', () => {
    const map = buildLevelMap([{ lemma: 'remonstrate', pos: null, band: 'C2' }]);
    expect(levelOf(map, 'remonstrate', 'verb')).toEqual({ band: 'C2', route: 'lemma_only' });
  });

  it('keeps the lowest band when one lemma carries two', () => {
    const map = buildLevelMap([
      { lemma: 'account', pos: 'noun', band: 'B2' },
      { lemma: 'account', pos: 'noun', band: 'A2' },
    ]);
    expect(levelOf(map, 'account', 'noun')).toEqual({ band: 'A2', route: 'exact_pos' });
  });

  it('keeps the lowest band regardless of the order the two rows arrive in', () => {
    // Guards the comparison itself: a `lower()` that always returned its second
    // argument would still pass the ascending case above.
    const map = buildLevelMap([
      { lemma: 'account', pos: 'noun', band: 'A2' },
      { lemma: 'account', pos: 'noun', band: 'B2' },
    ]);
    expect(levelOf(map, 'account', 'noun')).toEqual({ band: 'A2', route: 'exact_pos' });
  });

  it('does not let an A1 lemma-only row mask a C1 exact-POS row', () => {
    // The two maps are independent: the exact route must win even when the
    // loose route holds a lower band for the same lemma.
    const map = buildLevelMap([
      { lemma: 'cast', pos: null, band: 'A1' },
      { lemma: 'cast', pos: 'noun', band: 'C1' },
    ]);
    expect(levelOf(map, 'cast', 'noun')).toEqual({ band: 'C1', route: 'exact_pos' });
    expect(levelOf(map, 'cast', 'verb')).toEqual({ band: 'A1', route: 'lemma_only' });
  });

  it('normalises the looked-up lemma the same way the parser did', () => {
    const map = buildLevelMap(parseCefrCsv('Cloak,noun,C1,\n').entries);
    expect(levelOf(map, '  CLOAK ', 'noun')).toEqual({ band: 'C1', route: 'exact_pos' });
  });

  it('returns null for a lemma with no label at all', () => {
    expect(levelOf(buildLevelMap([]), 'kettle', 'noun')).toBeNull();
  });
});
