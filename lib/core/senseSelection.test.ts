import { describe, expect, it } from 'vitest';
import { buildInventory, type SenseRecord } from './senseInventory';
import { selectSense, type H1SynsetIndex, type SecondSignal } from './senseSelection';

const rec = (
  lemma: string, pos: SenseRecord['pos'], synsetId: string,
  senseNumber: number, tagCount = 5,
): SenseRecord => ({ lemma, pos, synsetId, senseNumber, tagCount });

const NO_OPINION: SecondSignal = { rank: () => null };
const prefers = (synsetId: string): SecondSignal => ({
  rank: (_l, _p, id) => (id === synsetId ? 0 : 1),
});
/** Opines about exactly one synset and stays silent about every other. */
const onlyKnows = (synsetId: string): SecondSignal => ({
  rank: (_l, _p, id) => (id === synsetId ? 0 : null),
});
const h1With = (ids: readonly string[]): H1SynsetIndex => ({
  hebrewFor: (id) => (ids.includes(id) ? 'גדה' : null),
});

describe('selectSense', () => {
  it('takes the fast path when the (lemma,POS) has one sense', () => {
    const inv = buildInventory([rec('kettle', 'noun', '03612814-n', 1)]);
    const s = selectSense(inv, 'kettle', 'noun', null, NO_OPINION);
    expect(s).toMatchObject({
      synsetId: '03612814-n', confidence: 'high', route: 'fast_single', scorable: true,
    });
  });

  it('uses the H1 synset when it covers a candidate', () => {
    const inv = buildInventory([
      rec('bank', 'noun', '08420278-n', 1),
      rec('bank', 'noun', '09213565-n', 2),
    ]);
    const s = selectSense(inv, 'bank', 'noun', h1With(['09213565-n']), NO_OPINION);
    expect(s).toMatchObject({ synsetId: '09213565-n', confidence: 'high', route: 'h1_synset' });
  });

  it('prefers the lower sense number when H1 covers two candidates (rule 7)', () => {
    const inv = buildInventory([
      rec('bank', 'noun', '08420278-n', 1),
      rec('bank', 'noun', '09213565-n', 2),
    ]);
    const s = selectSense(inv, 'bank', 'noun', h1With(['08420278-n', '09213565-n']), NO_OPINION);
    expect(s.synsetId).toBe('08420278-n');
  });

  it('is medium when WordNet sense #1 and the second signal agree', () => {
    const inv = buildInventory([
      rec('spring', 'noun', '15236475-n', 1),
      rec('spring', 'noun', '09452760-n', 2),
    ]);
    const s = selectSense(inv, 'spring', 'noun', null, prefers('15236475-n'));
    expect(s).toMatchObject({
      synsetId: '15236475-n', confidence: 'medium', route: 'two_signal_agree', scorable: true,
    });
  });

  it('is low and keeps sense #1 when the signals disagree', () => {
    const inv = buildInventory([
      rec('spring', 'noun', '15236475-n', 1),
      rec('spring', 'noun', '09452760-n', 2),
    ]);
    const s = selectSense(inv, 'spring', 'noun', null, prefers('09452760-n'));
    expect(s).toMatchObject({
      synsetId: '15236475-n', confidence: 'low', route: 'two_signal_disagree',
      needsHumanReview: true, scorable: false,
    });
  });

  it('flags an untagged sense for review even on the fast path', () => {
    const inv = buildInventory([rec('kettle', 'noun', '03612814-n', 1, 0)]);
    const s = selectSense(inv, 'kettle', 'noun', null, NO_OPINION);
    expect(s).toMatchObject({ confidence: 'high', needsHumanReview: true, scorable: true });
  });

  it('flags a multi-POS lemma for review', () => {
    const inv = buildInventory([
      rec('run', 'noun', '00558963-n', 1),
      rec('run', 'verb', '01926311-v', 1),
    ]);
    expect(selectSense(inv, 'run', 'noun', null, NO_OPINION).needsHumanReview).toBe(true);
  });

  it('never falls back to another POS for an unknown key', () => {
    const inv = buildInventory([rec('run', 'verb', '01926311-v', 1)]);
    const s = selectSense(inv, 'run', 'noun', null, NO_OPINION);
    expect(s).toMatchObject({ synsetId: null, route: 'no_candidate', scorable: false });
  });

  // ---- Beyond the plan: branches the eight tests above leave unmeasured ----

  it('separates "the second signal had no opinion" from a real disagreement', () => {
    // The plan folded this into two_signal_disagree. That charges a *coverage*
    // gap in the second source to the *accuracy* of the rule — the same
    // conflation F-026 was. Behaviour is identical (low, unscorable); only the
    // reported route differs, so the report can name the real cause.
    const inv = buildInventory([
      rec('spring', 'noun', '15236475-n', 1),
      rec('spring', 'noun', '09452760-n', 2),
    ]);
    const s = selectSense(inv, 'spring', 'noun', null, NO_OPINION);
    expect(s).toMatchObject({
      synsetId: '15236475-n', confidence: 'low', route: 'no_second_signal',
      needsHumanReview: true, scorable: false,
    });
  });

  it('falls through to rule 4 when H1 exists but covers no candidate', () => {
    const inv = buildInventory([
      rec('spring', 'noun', '15236475-n', 1),
      rec('spring', 'noun', '09452760-n', 2),
    ]);
    const s = selectSense(inv, 'spring', 'noun', h1With(['99999999-n']), prefers('15236475-n'));
    expect(s).toMatchObject({ route: 'two_signal_agree', confidence: 'medium' });
  });

  it('rule 2 outranks rule 3 — a single sense stays fast_single even under H1', () => {
    const inv = buildInventory([rec('kettle', 'noun', '03612814-n', 1)]);
    const s = selectSense(inv, 'kettle', 'noun', h1With(['03612814-n']), NO_OPINION);
    expect(s.route).toBe('fast_single');
  });

  it('takes the core sense by sense number, not by input order (rule 7)', () => {
    // Records arrive sense #2 first. buildInventory sorts; this proves the
    // rule 3 tie-break reads that sort rather than the caller's ordering.
    const inv = buildInventory([
      rec('bank', 'noun', '09213565-n', 2),
      rec('bank', 'noun', '08420278-n', 1),
    ]);
    const s = selectSense(inv, 'bank', 'noun', h1With(['08420278-n', '09213565-n']), NO_OPINION);
    expect(s.synsetId).toBe('08420278-n');
  });

  it('breaks an equal-rank tie towards WordNet sense #1', () => {
    const inv = buildInventory([
      rec('spring', 'noun', '15236475-n', 1),
      rec('spring', 'noun', '09452760-n', 2),
    ]);
    const flat: SecondSignal = { rank: () => 0 };
    const s = selectSense(inv, 'spring', 'noun', null, flat);
    expect(s).toMatchObject({ synsetId: '15236475-n', route: 'two_signal_agree' });
  });

  it('lets a signal that opines about one sense alone decide the vote', () => {
    const inv = buildInventory([
      rec('spring', 'noun', '15236475-n', 1),
      rec('spring', 'noun', '09452760-n', 2),
    ]);
    const s = selectSense(inv, 'spring', 'noun', null, onlyKnows('09452760-n'));
    expect(s).toMatchObject({ route: 'two_signal_disagree', synsetId: '15236475-n' });
  });

  it('normalizes the lemma on the lookup side', () => {
    const inv = buildInventory([rec('kettle', 'noun', '03612814-n', 1)]);
    const s = selectSense(inv, '  KETTLE  ', 'noun', null, NO_OPINION);
    expect(s).toMatchObject({ synsetId: '03612814-n', route: 'fast_single' });
  });
});
