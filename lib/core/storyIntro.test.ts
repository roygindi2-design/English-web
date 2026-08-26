import { describe, expect, it } from 'vitest';
import { storyIntro } from '@/lib/core/storyIntro';

describe('T-150 — «כמה מזה אתה כבר יודע», derived at display time', () => {
  const TEN = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

  it('a story with 10 glossed words and a learner who carries 7 ⇒ {total:10, known:7}', () => {
    expect(storyIntro(TEN, ['a', 'b', 'c', 'd', 'e', 'f', 'g'])).toEqual({ total: 10, known: 7 });
  });

  it('⛔ known is ⛔ NOT total-known — the mutation fails by name', () => {
    // total-known would be 3. If this ever passes with 3, the derivation was inverted.
    expect(storyIntro(TEN, ['a', 'b', 'c', 'd', 'e', 'f', 'g']).known).not.toBe(3);
  });

  it('⛔ a word with no sense is counted in NEITHER number (T-150ⓓ)', () => {
    // «zzz» is known to the learner but carries no gloss ⇒ it is not in the story vocabulary.
    expect(storyIntro(['a', 'b'], ['a', 'zzz'])).toEqual({ total: 2, known: 1 });
  });

  it('⛔ zero duplication: the same lemma twice is one word', () => {
    expect(storyIntro(['a', 'a', 'b'], ['a'])).toEqual({ total: 2, known: 1 });
  });

  it('⛔ a learner who carries the same lemma twice does ⛔ not count it twice', () => {
    expect(storyIntro(['a', 'b'], ['a', 'a'])).toEqual({ total: 2, known: 1 });
  });

  it('an empty story is {0,0}, ⛔ not a crash and ⛔ not NaN', () => {
    expect(storyIntro([], ['a'])).toEqual({ total: 0, known: 0 });
  });
});
