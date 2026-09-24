import { describe, expect, it } from 'vitest';
import {
  END_BLOCK, buildContinuationIndex, isSendable, nextBlocks, reachableWithin, sentenceTokens, wordLexicon,
  type ContinuationIndex,
} from './continuations';
import { buildLevelMap, parseCefrCsv } from './cefrLevels';

const CSV = [
  'headword,pos,CEFR',
  'i,pronoun,A1',
  'like,verb,A1',
  'like,preposition,A2',
  'tea,noun,A1',
  'coffee,noun,A1',
  'go,verb,A1',
  'recommend,verb,B1',
  'the,determiner,A1',
  'beach,noun,A1',
  'love,verb,A1',
].join('\n');

const lexicon = wordLexicon(parseCefrCsv(CSV).entries);

function index(sentences: string[], maxDepth = 12): ContinuationIndex {
  return buildContinuationIndex(sentences, lexicon, { maxDepth, source: 'fixture' });
}

describe('sentenceTokens — a sentence is kept only when EVERY word is in the profile', () => {
  it('lower-cases and drops end punctuation', () => {
    expect(sentenceTokens('I like tea.', lexicon)).toEqual({ tokens: ['i', 'like', 'tea'], level: 'A1' });
  });

  it('takes the sentence level from its HIGHEST word', () => {
    expect(sentenceTokens('I recommend the beach!', lexicon)?.level).toBe('B1');
  });

  it('accepts a regular inflection through the shared lemmatiser (loves ⇒ love)', () => {
    expect(sentenceTokens('I loves tea', lexicon)?.tokens).toEqual(['i', 'loves', 'tea']);
  });

  it('rejects an unknown word, a digit, a name and anything that is not plain prose', () => {
    expect(sentenceTokens('I like Tom.', lexicon)).toBeNull();
    expect(sentenceTokens('I like 2 teas.', lexicon)).toBeNull();
    expect(sentenceTokens('I like "tea".', lexicon)).toBeNull();
    expect(sentenceTokens('I like tea-coffee', lexicon)).toBeNull();
    expect(sentenceTokens('', lexicon)).toBeNull();
  });

  it('rejects a sentence over 12 words', () => {
    expect(sentenceTokens(Array(13).fill('tea').join(' '), lexicon)).toBeNull();
    expect(sentenceTokens(Array(12).fill('tea').join(' '), lexicon)).not.toBeNull();
  });
});

describe('wordLexicon — pos from the profile, ⛔ never guessed', () => {
  it('a word with more than one pos gets pos null', () => {
    expect(lexicon.get('like')).toEqual({ band: 'A1', pos: null });
    expect(lexicon.get('tea')).toEqual({ band: 'A1', pos: 'noun' });
  });
});

describe('nextBlocks — only continuations a real sentence took', () => {
  const idx = index(['I like tea.', 'I like coffee.', 'I go.', 'I recommend the beach.']);

  it('the empty prefix offers every observed first word', () => {
    const r = nextBlocks(idx, [], 'B1');
    expect(r.blocks.map((b) => b.word)).toEqual(['I']);
    expect(r.count).toBe(1);
  });

  it('offers exactly the observed next words, with the profile pos', () => {
    const r = nextBlocks(idx, ['i', 'like'], 'A1');
    expect(r.blocks).toEqual([{ word: 'coffee', pos: 'noun' }, { word: 'tea', pos: 'noun' }]);
    expect(r.count).toBe(2);
  });

  it('`<END>` appears exactly where a sentence ended — that is the send block', () => {
    expect(nextBlocks(idx, ['i', 'go'], 'A1').blocks).toEqual([END_BLOCK]);
    expect(nextBlocks(idx, ['i', 'like'], 'A1').blocks).not.toContainEqual(END_BLOCK);
  });

  it('a continuation above the simulation level is hidden', () => {
    expect(nextBlocks(idx, ['i'], 'A1').blocks.map((b) => b.word)).toEqual(['go', 'like']);
    expect(nextBlocks(idx, ['i'], 'B1').blocks.map((b) => b.word)).toEqual(['go', 'like', 'recommend']);
  });

  it('an unseen prefix is count 0 and does not throw', () => {
    expect(nextBlocks(idx, ['i', 'recommend'], 'A2')).toEqual({ blocks: [], count: 0 });
    expect(nextBlocks(idx, ['coffee', 'tea', 'go'], 'B2')).toEqual({ blocks: [], count: 0 });
  });

  it('the prefix is compared case-insensitively (a block reads «I», the key is «i»)', () => {
    expect(nextBlocks(idx, ['I', 'Like'], 'A1').count).toBe(2);
  });

  it('a shared prefix keeps the LOWEST level any sentence through it carries', () => {
    const two = index(['I recommend the beach.', 'I recommend tea.']);
    expect(nextBlocks(two, ['i'], 'A2').count).toBe(0);
    expect(nextBlocks(two, ['i'], 'B1').count).toBe(1);
  });

  it('survives a JSON round trip — the index is a generated file', () => {
    const back = JSON.parse(JSON.stringify(idx)) as ContinuationIndex;
    expect(nextBlocks(back, ['i', 'like'], 'A1')).toEqual(nextBlocks(idx, ['i', 'like'], 'A1'));
  });
});

describe('maxDepth — a cut tree never offers send where no sentence ended', () => {
  const idx = index(['I like tea.', 'I like the beach.'], 2);

  it('below the cut the tree is intact', () => {
    expect(nextBlocks(idx, ['i', 'like'], 'A1').count).toBe(2);
  });

  it('at the cut it records truncation instead of inventing an end', () => {
    expect(nextBlocks(idx, ['i', 'like', 'the'], 'A1')).toEqual({ blocks: [], count: 0, truncated: true });
    expect(nextBlocks(idx, ['i', 'like', 'tea'], 'A1').blocks).toEqual([END_BLOCK]);
  });
});

describe('property — every prefix of a real sentence continues', () => {
  it('count ≥ 1 on every prefix of every indexed sentence', () => {
    const sentences = ['I like tea.', 'I like coffee.', 'I go.', 'I love the beach.', 'I love tea.'];
    const idx = index(sentences);
    for (const s of sentences) {
      const { tokens } = sentenceTokens(s, lexicon)!;
      for (let i = 0; i <= tokens.length; i += 1) {
        expect(nextBlocks(idx, tokens.slice(0, i), 'A1').count).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

describe('buildLevelMap parity — the lexicon is the same lemma set the gates use', () => {
  it('every lexicon lemma is in the level map', () => {
    const map = buildLevelMap(parseCefrCsv(CSV).entries);
    for (const lemma of lexicon.keys()) expect(map.byLemma.has(lemma)).toBe(true);
  });
});

describe('reachableWithin — can a required word be typed at all?', () => {
  const idx = index(['I like tea.', 'I recommend the beach.', 'I go.']);

  it('finds a word at the depth it first occurs', () => {
    expect(reachableWithin(idx, 'tea', 3, 'A1')).toBe(true);
    expect(reachableWithin(idx, 'tea', 2, 'A1')).toBe(false);
  });

  it('respects the simulation level on the whole path', () => {
    expect(reachableWithin(idx, 'beach', 4, 'A1')).toBe(false);
    expect(reachableWithin(idx, 'beach', 4, 'B1')).toBe(true);
  });

  it('an absent word is simply unreachable', () => {
    expect(reachableWithin(idx, 'coffee', 4, 'B2')).toBe(false);
  });
});

describe('isSendable — T-462: a reply is sent only where an observed sentence ended', () => {
  const idx = index(['I like tea.', 'I go.', 'I recommend the beach.']);

  it('true exactly at an observed end, at the level', () => {
    expect(isSendable(idx, ['I', 'like', 'tea'], 'A1')).toBe(true);
    expect(isSendable(idx, ['i', 'like'], 'A1')).toBe(false);
    expect(isSendable(idx, ['i', 'recommend', 'the', 'beach'], 'A1')).toBe(false);
    expect(isSendable(idx, ['i', 'recommend', 'the', 'beach'], 'B1')).toBe(true);
  });

  it('an empty reply is never sendable', () => {
    expect(isSendable(idx, [], 'B2')).toBe(false);
  });
});
