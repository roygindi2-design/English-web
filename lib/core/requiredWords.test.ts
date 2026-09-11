import { describe, expect, it } from 'vitest';
import { requiredWordsHe, requiredWordsProgress } from './requiredWords';

describe('requiredWordsProgress — exact match, case-insensitive, trimmed', () => {
  it('nothing used ⇒ three unlit chips, 0 מתוך 3', () => {
    const p = requiredWordsProgress(['summer', 'visit', 'recommend'], []);
    expect(p.chips).toEqual([
      { word: 'summer', used: false },
      { word: 'visit', used: false },
      { word: 'recommend', used: false },
    ]);
    expect(p.used).toBe(0);
    expect(p.total).toBe(3);
    expect(requiredWordsHe(p)).toBe('0 מתוך 3 מילות חובה');
  });

  it('the render’s state: recommend used ⇒ 1 מתוך 3', () => {
    const p = requiredWordsProgress(['summer', 'visit', 'recommend'], ['I', 'Recommend']);
    expect(p.chips[2]).toEqual({ word: 'recommend', used: true });
    expect(requiredWordsHe(p)).toBe('1 מתוך 3 מילות חובה');
  });

  it('⛔ no lemmatiser: visited ≠ visit (declared — the keyboard emits exact blocks)', () => {
    expect(requiredWordsProgress(['visit'], ['visited']).used).toBe(0);
  });

  it('a token with surrounding whitespace still counts (trim)', () => {
    expect(requiredWordsProgress(['visit'], ['  visit ']).used).toBe(1);
  });

  it('all three ⇒ 3 מתוך 3 מילות חובה (39 § 7)', () => {
    expect(requiredWordsHe(requiredWordsProgress(['a', 'b', 'c'], ['a', 'b', 'c']))).toBe('3 מתוך 3 מילות חובה');
  });
});
