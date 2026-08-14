// lib/core/world.test.ts
import { describe, expect, it } from 'vitest';
import {
  MAX_DRAFT_TOKENS,
  PUNCTUATION_TOKENS,
  checkPostPayload,
  draftContainsTarget,
  isBankToken,
  isWorldUnlocked,
  normaliseToken,
  pickTargetWord,
  producedWordCount,
  renderDraft,
  uniqueHeadwords,
} from './world';

const T = { minFunctionWords: 100, minActiveWords: 12 } as const;

describe('isWorldUnlocked — D-031, both counts, no flag', () => {
  it('opens when both counts are met', () => {
    expect(isWorldUnlocked({ functionWords: 121, activeWords: 12 }, T)).toBe(true);
  });

  it('is closed when the learner side is short by one', () => {
    expect(isWorldUnlocked({ functionWords: 121, activeWords: 11 }, T)).toBe(false);
  });

  it('is closed when the global bank is short by one — an empty bank cannot be composed from', () => {
    expect(isWorldUnlocked({ functionWords: 99, activeWords: 40 }, T)).toBe(false);
  });

  it('treats the threshold itself as met — the condition is >=, not >', () => {
    expect(isWorldUnlocked({ functionWords: 100, activeWords: 12 }, T)).toBe(true);
  });

  it('never opens on a negative or non-finite count', () => {
    expect(isWorldUnlocked({ functionWords: Number.NaN, activeWords: 40 }, T)).toBe(false);
    expect(isWorldUnlocked({ functionWords: 200, activeWords: -1 }, T)).toBe(false);
  });
});

describe('tokens — the closed bank has a shape, and free text does not have it', () => {
  it('accepts a plain English word', () => {
    expect(isBankToken('because')).toBe(true);
  });

  it('accepts the two punctuation buttons and nothing else punctuational', () => {
    expect(PUNCTUATION_TOKENS).toEqual(['.', '?']);
    expect(isBankToken('.')).toBe(true);
    expect(isBankToken('?')).toBe(true);
    expect(isBankToken('!')).toBe(false);
    expect(isBankToken(',')).toBe(false);
  });

  it('accepts the two shapes real headwords carry', () => {
    expect(isBankToken("don't")).toBe(true);
    expect(isBankToken('well-known')).toBe(true);
  });

  it('⛔ rejects anything that is a sentence rather than a word — there is no keyboard', () => {
    expect(isBankToken('i am here')).toBe(false);
    expect(isBankToken('')).toBe(false);
    expect(isBankToken('   ')).toBe(false);
    expect(isBankToken('<script>')).toBe(false);
    expect(isBankToken('שלום')).toBe(false);
    expect(isBankToken('a'.repeat(41))).toBe(false);
  });

  it('normalises for comparison only — case folds, surrounding space goes', () => {
    expect(normaliseToken('  Because ')).toBe('because');
    expect(normaliseToken('WELL-KNOWN')).toBe('well-known');
  });
});

describe('draftContainsTarget — exact token match, ⛔ not substring', () => {
  it('finds the target as a whole token', () => {
    expect(draftContainsTarget(['i', 'like', 'the', 'car'], 'car')).toBe(true);
  });

  it('⛔ does not accept the target hiding inside another word — "car" is not in "card"', () => {
    expect(draftContainsTarget(['i', 'have', 'a', 'card'], 'car')).toBe(false);
  });

  it('ignores case on both sides', () => {
    expect(draftContainsTarget(['Because'], 'because')).toBe(true);
  });

  it('is false for an empty draft and for an empty target', () => {
    expect(draftContainsTarget([], 'car')).toBe(false);
    expect(draftContainsTarget(['car'], '')).toBe(false);
  });
});

describe('renderDraft — mechanical join, ⛔ zero correction', () => {
  it('joins words with one space', () => {
    expect(renderDraft(['i', 'like', 'the', 'car'])).toBe('i like the car');
  });

  it('attaches punctuation to the word before it', () => {
    expect(renderDraft(['i', 'like', 'the', 'car', '.'])).toBe('i like the car.');
    expect(renderDraft(['do', 'you', 'like', 'it', '?'])).toBe('do you like it?');
  });

  it('⛔ does NOT capitalise, because capitalising is correcting (R-016)', () => {
    expect(renderDraft(['i', 'am', 'here'])).toBe('i am here');
  });

  it('⛔ does NOT reorder, dedupe or drop anything', () => {
    expect(renderDraft(['the', 'the', 'car'])).toBe('the the car');
  });

  it('handles leading punctuation without emitting a stray space', () => {
    expect(renderDraft(['.', 'car'])).toBe('. car');
  });
});

describe('uniqueHeadwords — the bank shows a surface form ONCE (§ 4.2ה)', () => {
  it('collapses the 12 measured headwords that carry both a function and a content sense', () => {
    const rows = [{ headword: 'can' }, { headword: 'can' }, { headword: 'like' }];
    expect(uniqueHeadwords(rows)).toEqual(['can', 'like']);
  });

  it('collapses case and trims, then sorts — two identical requests return the same bank', () => {
    expect(uniqueHeadwords([{ headword: 'Over' }, { headword: 'over ' }, { headword: 'back' }]))
      .toEqual(['back', 'over']);
  });

  it('drops rows with no headword rather than emitting an empty chip', () => {
    expect(uniqueHeadwords([{ headword: null }, { headword: '  ' }, { headword: 'no' }])).toEqual(['no']);
  });
});

describe('pickTargetWord — deterministic, ⛔ no clock and ⛔ no randomness', () => {
  it('prefers an active word the learner has not produced yet', () => {
    expect(pickTargetWord(['car', 'book', 'apple'], ['apple', 'book'])).toBe('car');
  });

  it('is alphabetical among the unused, so two calls in one second agree', () => {
    expect(pickTargetWord(['car', 'book', 'apple'], [])).toBe('apple');
  });

  it('falls back to the first active word once every one has been used — ⛔ never null-with-words', () => {
    expect(pickTargetWord(['car', 'book'], ['car', 'book'])).toBe('book');
  });

  it('is null only when the learner has no active words at all', () => {
    expect(pickTargetWord([], ['car'])).toBeNull();
  });

  it('compares case-insensitively — "Car" used means "car" is used', () => {
    expect(pickTargetWord(['car', 'book'], ['Car'])).toBe('book');
  });
});

describe('checkPostPayload — the server decides, ⛔ not the button', () => {
  it('accepts a well-formed draft that contains its target', () => {
    const result = checkPostPayload({ target: 'car', tokens: ['i', 'like', 'the', 'car', '.'] });
    expect(result).toEqual({ ok: true, payload: { target: 'car', tokens: ['i', 'like', 'the', 'car', '.'] } });
  });

  it('rejects a draft without its target, and says WHICH failure it is', () => {
    expect(checkPostPayload({ target: 'car', tokens: ['i', 'like', 'it'] }))
      .toEqual({ ok: false, reason: 'target_missing' });
  });

  it('rejects a body that is not the shape at all', () => {
    for (const body of [null, undefined, 'car', 42, [], {}, { target: 'car' }, { tokens: ['car'] }]) {
      expect(checkPostPayload(body).ok, JSON.stringify(body) ?? 'undefined').toBe(false);
    }
  });

  it('rejects free text smuggled in as one token — there is no keyboard on that screen', () => {
    expect(checkPostPayload({ target: 'car', tokens: ['buy my car at example.com'] }))
      .toEqual({ ok: false, reason: 'malformed' });
  });

  it('rejects an empty draft', () => {
    expect(checkPostPayload({ target: 'car', tokens: [] })).toEqual({ ok: false, reason: 'malformed' });
  });

  it('rejects a draft past the wire guard, ⛔ which is not a product cap', () => {
    const tokens = Array.from({ length: MAX_DRAFT_TOKENS + 1 }, () => 'car');
    expect(checkPostPayload({ target: 'car', tokens })).toEqual({ ok: false, reason: 'malformed' });
    const atCeiling = Array.from({ length: MAX_DRAFT_TOKENS }, () => 'car');
    expect(checkPostPayload({ target: 'car', tokens: atCeiling }).ok).toBe(true);
  });

  it('checks the shape BEFORE the target, so a malformed body never reports target_missing', () => {
    expect(checkPostPayload({ target: 'car', tokens: ['<script>car</script>'] }))
      .toEqual({ ok: false, reason: 'malformed' });
  });
});

describe('producedWordCount — «מילים שהפקת», ⛔ not posts and ⛔ not words-in-posts', () => {
  it('counts DISTINCT words and ⛔ not the number of posts', () => {
    expect(producedWordCount(['I like my car.', 'I like my car.'])).toBe(4);
  });

  it('counts a word once across two different posts', () => {
    expect(producedWordCount(['I like my car.', 'My car is here.'])).toBe(6);
  });

  it('⛔ never counts punctuation as a produced word', () => {
    expect(producedWordCount(['car.', 'car?', '. ?'])).toBe(1);
  });

  it('is case-insensitive — "Car" and "car" are one produced word', () => {
    expect(producedWordCount(['Car is here.', 'car is HERE.'])).toBe(3);
  });

  it('is 0 for an empty feed — a learner who wrote nothing produced nothing', () => {
    expect(producedWordCount([])).toBe(0);
    expect(producedWordCount(['', '   '])).toBe(0);
  });

  it('is the exact inverse of renderDraft on the tokens that produced the sentence', () => {
    const tokens = ['i', 'like', 'my', 'car', '.'];
    expect(producedWordCount([renderDraft(tokens)])).toBe(4);
  });

  it('⛔ does not split a hyphenated headword into two produced words', () => {
    expect(producedWordCount(['well-known people'])).toBe(2);
  });
});
