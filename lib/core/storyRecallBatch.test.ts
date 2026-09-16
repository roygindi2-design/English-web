import { describe, expect, it } from 'vitest';
import { selectStoryRecallBatch } from '@/lib/core/storyRecallBatch';

const GLOSSES = {
  river: { wordId: 'w-river' },
  library: { wordId: 'w-library' },
  letter: { wordId: 'w-letter' },
  bridge: { wordId: 'w-bridge' },
  window: { wordId: 'w-window' },
  garden: { wordId: 'w-garden' },
  morning: { wordId: 'w-morning' },
};

const CAP = 5;

describe('T-208 · D-254ⓐ — ⛔ only what the learner RETRIEVED', () => {
  it('⛔ a word the learner never tapped is ⛔ never a candidate', () => {
    // ⛔ THE POINT: `GLOSSES` carries seven words and the learner tapped one. The other
    // six were on the screen in front of him — presence ⛔ is not retrieval (`D-254`ⓐ).
    const picked = selectStoryRecallBatch(['river'], GLOSSES, [], CAP);
    expect(picked).toEqual([{ lemma: 'river', wordId: 'w-river' }]);
  });

  it('⛔ no taps ⇒ ⛔ empty, ⛔ and ⛔ not a filled-up batch', () => {
    expect(selectStoryRecallBatch([], GLOSSES, [], CAP)).toEqual([]);
  });

  it('a lemma with ⛔ no gloss carries ⛔ no wordId ⇒ ⛔ nothing to write', () => {
    const picked = selectStoryRecallBatch(['zzz', 'river'], GLOSSES, [], CAP);
    expect(picked.map((c) => c.lemma)).toEqual(['river']);
  });
});

describe('T-208 · D-254ⓑ — the ceiling is a PARAMETER, and the remainder is ⛔ never filled', () => {
  it('tapped 2 ⇒ 2 enter, ⛔ and ⛔ not `cap`', () => {
    expect(selectStoryRecallBatch(['river', 'library'], GLOSSES, [], CAP)).toHaveLength(2);
  });

  it('tapped 7 ⇒ the FIRST `cap` in TAP ORDER, ⛔ not by frequency and ⛔ not by level', () => {
    const tapped = ['morning', 'garden', 'window', 'bridge', 'letter', 'library', 'river'];
    const picked = selectStoryRecallBatch(tapped, GLOSSES, [], CAP);
    expect(picked.map((c) => c.lemma)).toEqual(['morning', 'garden', 'window', 'bridge', 'letter']);
  });

  it('⛔ `cap` of zero ⇒ empty — that is the shape of «⛔ nothing to add today»', () => {
    expect(selectStoryRecallBatch(['river'], GLOSSES, [], 0)).toEqual([]);
  });
});

describe('T-208 · D-254ⓒ — the number in the string is a TRUE claim', () => {
  it('the same lemma tapped twice is ONE retrieval of ONE word', () => {
    const picked = selectStoryRecallBatch(['river', 'library', 'river'], GLOSSES, [], CAP);
    expect(picked.map((c) => c.lemma)).toEqual(['river', 'library']);
  });

  it('a word the learner ALREADY added is ⛔ not «added» a second time', () => {
    // ⛔ `D-183`: the popover already told him «נוספה לחזרה» about `river`. Counting it
    // again would make the N in «הוסף N מילים לחזרה» a claim that ⛔ is not true.
    const picked = selectStoryRecallBatch(['river', 'library'], GLOSSES, ['river'], CAP);
    expect(picked.map((c) => c.lemma)).toEqual(['library']);
  });

  it('a duplicate tap of an ALREADY-added word ⛔ does not sneak back in', () => {
    const picked = selectStoryRecallBatch(['river', 'river'], GLOSSES, ['river'], CAP);
    expect(picked).toEqual([]);
  });

  it('every candidate carries the wordId the write needs, ⛔ never the lemma alone', () => {
    const picked = selectStoryRecallBatch(['library', 'letter'], GLOSSES, [], CAP);
    expect(picked).toEqual([
      { lemma: 'library', wordId: 'w-library' },
      { lemma: 'letter', wordId: 'w-letter' },
    ]);
  });
});
