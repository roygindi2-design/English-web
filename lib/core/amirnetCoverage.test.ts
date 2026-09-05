import { describe, expect, it } from 'vitest';
import {
  parseAmirnetVocabCsv,
  parseCefrProfileCsv,
  polysemousHeadwords,
  computeCoverage,
  diffCoverage,
  formatCoverageReport,
  parsePreviousCoverageReport,
} from './amirnetCoverage';

const VOCAB_CSV = [
  'headword,pos,cefr,tier,tier_name,amirnet_level,is_connector,source',
  'set,verb,A2,1,ליבה,1-2,,CEFR-J v1.5',
  'about,preposition,A2,1,ליבה,1-2,true,CEFR-J v1.5',
  'abandon,verb,B1,2,ליבה מורחבת,2-3,,CEFR-J v1.5',
  'academic,adjective,B2,3,הרחבה אקדמית,3,,Octanove v1.0',
  'zenith,noun,C1,4,רמת פטור,4,,Octanove v1.0',
].join('\n');

const PROFILE_CSV = [
  'headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold',
  'set,noun,A2,,,',
  'set,verb,A1,,,',
  'about,preposition,A2,,,',
  'about,adverb,B1,,,',
  'abandon,verb,B1,,,',
].join('\n');

describe('parseAmirnetVocabCsv', () => {
  it('parses headword/pos/cefr/tier, coercing tier to a number', () => {
    const rows = parseAmirnetVocabCsv(VOCAB_CSV);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({ headword: 'set', pos: 'verb', cefr: 'A2', tier: 1 });
    expect(rows[3]).toEqual({ headword: 'academic', pos: 'adjective', cefr: 'B2', tier: 3 });
  });

  it('is stable on an empty body (header only)', () => {
    expect(parseAmirnetVocabCsv('headword,pos,cefr,tier,tier_name,amirnet_level,is_connector,source')).toEqual([]);
  });
});

describe('parseCefrProfileCsv', () => {
  it('parses every row, keeping duplicate headwords with different pos', () => {
    const rows = parseCefrProfileCsv(PROFILE_CSV);
    expect(rows).toHaveLength(5);
    expect(rows.filter((r) => r.headword === 'set')).toEqual([
      { headword: 'set', pos: 'noun' },
      { headword: 'set', pos: 'verb' },
    ]);
  });
});

describe('polysemousHeadwords', () => {
  it('flags a headword carrying 2+ distinct pos values, never a headword with exactly one', () => {
    const rows = parseCefrProfileCsv(PROFILE_CSV);
    const poly = polysemousHeadwords(rows);
    expect(poly.has('set')).toBe(true); // noun + verb
    expect(poly.has('about')).toBe(true); // preposition + adverb
    expect(poly.has('abandon')).toBe(false); // verb only
  });
});

describe('computeCoverage', () => {
  const vocabRows = parseAmirnetVocabCsv(VOCAB_CSV);
  const profileRows = parseCefrProfileCsv(PROFILE_CSV);

  it('counts the Tier 1+2 target set, existing coverage, and shallow polysemous headwords', () => {
    // Tier 1+2 headwords here: set, about, abandon (3 total).
    // Bank: "set" has 2 distinct senses (deep), "about" has exactly 1 (shallow,
    // and "about" IS polysemous per the profile), "abandon" is missing entirely
    // (not polysemous anyway, so it cannot count toward the shallow axis).
    const bankRecords = [
      { headword: 'set', senseIndex: 1 },
      { headword: 'set', senseIndex: 2 },
      { headword: 'about', senseIndex: 1 },
    ];
    const counts = computeCoverage({ vocabRows, profileRows, bankRecords });
    expect(counts).toEqual({
      targetTotal: 3,
      existingCount: 2, // set, about — abandon is missing
      polysemousTargetCount: 2, // set, about — abandon is not polysemous
      polysemousShallowCount: 1, // about only: set is polysemous but has 2 senses (deep)
    });
  });

  it('never counts a Tier 3/4 headword toward the target, even if it is in the bank', () => {
    const bankRecords = [{ headword: 'academic', senseIndex: 1 }];
    const counts = computeCoverage({ vocabRows, profileRows, bankRecords });
    expect(counts.targetTotal).toBe(3);
    expect(counts.existingCount).toBe(0);
  });

  it('matches headwords case-sensitively, consistent with build-amirnet-vocab.mjs', () => {
    const bankRecords = [{ headword: 'Set', senseIndex: 1 }];
    const counts = computeCoverage({ vocabRows, profileRows, bankRecords });
    expect(counts.existingCount).toBe(0); // "Set" ≠ "set"
  });
});

describe('report round-trip', () => {
  it('formats a report parsePreviousCoverageReport can read back exactly', () => {
    const counts = {
      targetTotal: 3382,
      existingCount: 512,
      polysemousTargetCount: 900,
      polysemousShallowCount: 340,
    };
    const delta = diffCoverage(counts, null);
    expect(delta).toEqual({ existingDelta: null, polysemousShallowDelta: null });

    const text = formatCoverageReport(counts, delta, '2026-09-05T14:00:00Z');
    const parsed = parsePreviousCoverageReport(text);
    expect(parsed).toEqual({ existingCount: 512, polysemousShallowCount: 340 });
  });

  it('diffCoverage reports signed deltas against a previous report', () => {
    const counts = {
      targetTotal: 3382,
      existingCount: 520,
      polysemousTargetCount: 900,
      polysemousShallowCount: 335,
    };
    const previous = { existingCount: 512, polysemousShallowCount: 340 };
    expect(diffCoverage(counts, previous)).toEqual({
      existingDelta: 8,
      polysemousShallowDelta: -5,
    });
  });

  it('parsePreviousCoverageReport returns null on unreadable/absent content', () => {
    expect(parsePreviousCoverageReport('not a report')).toBeNull();
    expect(parsePreviousCoverageReport('')).toBeNull();
  });
});
