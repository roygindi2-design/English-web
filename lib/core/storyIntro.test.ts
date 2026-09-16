import { describe, expect, it } from 'vitest';
import { storyIntro } from '@/lib/core/storyIntro';

describe('T-150 — «כמה מזה אתה כבר יודע», derived at display time', () => {
  const TEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

  it('a story with 10 glossed words and a learner who carries 7 ⇒ {total:10, known:7}', () => {
    expect(storyIntro(TEN, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toEqual({
      total: 10,
      known: 7,
      fresh: 3,
    });
  });

  it('⛔ known is ⛔ NOT total-known — the mutation fails by name', () => {
    // total-known would be 3. If this ever passes with 3, the derivation was inverted.
    expect(storyIntro(TEN, ['a', 'b', 'c', 'd', 'e', 'f', 'g']).known).not.toBe(3);
  });

  it('⛔ a word with no sense is counted in NEITHER number (T-150ⓓ)', () => {
    // «zzz» is known to the learner but carries no gloss ⇒ it is not in the story vocabulary.
    expect(storyIntro(['a', 'b'], ['a', 'zzz'])).toEqual({ total: 2, known: 1, fresh: 1 });
  });

  it('⛔ zero duplication: the same lemma twice is one word', () => {
    expect(storyIntro(['a', 'a', 'b'], ['a'])).toEqual({ total: 2, known: 1, fresh: 1 });
  });

  it('⛔ a learner who carries the same lemma twice does ⛔ not count it twice', () => {
    expect(storyIntro(['a', 'b'], ['a', 'a'])).toEqual({ total: 2, known: 1, fresh: 1 });
  });

  it('an empty story is {0,0}, ⛔ not a crash and ⛔ not NaN', () => {
    expect(storyIntro([], ['a'])).toEqual({ total: 0, known: 0, fresh: 0 });
  });
});

/**
 * T-383 — **`fresh` is the number the render puts on the screen, and it is derived
 * from the SAME set as the other two.** The whole point of deriving it here instead of
 * reading `payload.counts.newWords` is that the wire field counts the story BODY while
 * `glosses` carries the TITLE too (`T-240`) ⇒ the two ⛔ cannot be mixed on one screen.
 */
describe('T-383 — «כמה מילים חדשות הסיפור הזה בא ללמד אותי»', () => {
  const TEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

  it('10 glossed, 7 carried ⇒ fresh is 3 — what the story came to teach', () => {
    expect(storyIntro(TEN, ['a', 'b', 'c', 'd', 'e', 'f', 'g']).fresh).toBe(3);
  });

  it('⛔ fresh is ⛔ NOT known — the inversion fails by name (T-150ⓒ)', () => {
    // If `fresh` ever equals `known` on an asymmetric story, the two were swapped.
    const intro = storyIntro(TEN, ['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    expect(intro.fresh).not.toBe(intro.known);
  });

  it('the three numbers ⛔ cannot disagree: fresh + known === total, always', () => {
    for (const carried of [[], ['a'], ['a', 'b', 'zzz'], TEN]) {
      const intro = storyIntro(TEN, carried);
      expect(intro.fresh + intro.known).toBe(intro.total);
    }
  });

  it('a learner who already carries every word ⇒ fresh is 0, ⛔ and ⛔ never negative', () => {
    expect(storyIntro(['a', 'b'], ['a', 'b', 'zzz'])).toEqual({ total: 2, known: 2, fresh: 0 });
  });

  it('a learner who carries nothing ⇒ fresh is the whole story', () => {
    expect(storyIntro(['a', 'b'], [])).toEqual({ total: 2, known: 0, fresh: 2 });
  });
});
