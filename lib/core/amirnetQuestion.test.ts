import { describe, expect, it } from 'vitest';
import {
  CORRECT_HE,
  INCORRECT_HE,
  NO_MORE_ITEMS_HE,
  elapsedClock,
  feedbackFor,
  isServable,
  nextIndex,
  questionCounterHe,
  secondsHe,
  servableItems,
  type AmirnetServedItem,
} from './amirnetQuestion';

const ITEM: AmirnetServedItem = {
  id: 'i1',
  type: 'rs',
  level: 3,
  stemEn: "The scientist's findings were so ______ that they overturned decades of accepted theory.",
  passageEn: '',
  optionsEn: ['controversial', 'ordinary', 'delayed', 'affordable'],
  correctIndex: 0,
  explanationHe: 'controversial = שנוי במחלוקת. מילות ההמשך overturned decades מחייבות ניגוד חזק.',
};

describe('amirnetQuestion — T-287, renders kol-D-04 · kol-D-05', () => {
  it('counts the clock UP and ⛔ never down — a countdown is time pressure on unknown material (R-020 · D-049)', () => {
    expect(elapsedClock(0)).toBe('0:00');
    expect(elapsedClock(8_000)).toBe('0:08');
    expect(elapsedClock(605_000)).toBe('10:05');
    // The second reading is LATER, so it must be LARGER. A countdown fails exactly here.
    expect(Number(elapsedClock(20_000).split(':')[1])).toBeGreaterThan(
      Number(elapsedClock(5_000).split(':')[1]),
    );
  });

  it('⛔ never serves an item whose level is outside 1–4 — the 1,602 legacy null rows included', () => {
    expect(isServable({ ...ITEM, level: null as never })).toBe(false);
    expect(isServable({ ...ITEM, level: 0 as never })).toBe(false);
    expect(isServable({ ...ITEM, level: 5 as never })).toBe(false);
    expect(isServable(ITEM)).toBe(true);
  });

  it('⛔ never serves an item with no Hebrew explanation, and ⛔ never writes one for it (R-010)', () => {
    expect(isServable({ ...ITEM, explanationHe: '' })).toBe(false);
    expect(isServable({ ...ITEM, explanationHe: '   ' })).toBe(false);
    expect(servableItems([{ ...ITEM, explanationHe: '' }, ITEM])).toEqual([ITEM]);
  });

  it('⛔ never serves an item whose correctIndex points outside its own options', () => {
    expect(isServable({ ...ITEM, correctIndex: 4 })).toBe(false);
    expect(isServable({ ...ITEM, correctIndex: -1 })).toBe(false);
  });

  it('states the verdict IN WORDS, so correctness is ⛔ never colour alone (constitution, layer A)', () => {
    expect(feedbackFor(ITEM, 0, 8_000).verdictHe).toBe(CORRECT_HE);
    expect(feedbackFor(ITEM, 2, 8_000).verdictHe).toBe(INCORRECT_HE);
    expect(CORRECT_HE).toBe('נכון');
    expect(INCORRECT_HE).toBe('לא נכון');
  });

  it('gives a WRONG answer the item’s own explanation — ⛔ not a different one and ⛔ not silence', () => {
    const wrong = feedbackFor(ITEM, 2, 3_000);
    expect(wrong.correct).toBe(false);
    expect(wrong.explanationHe).toBe(ITEM.explanationHe);
    expect(wrong.correctIndex).toBe(0);
  });

  it('reports response time as a FACT and ⛔ never as a score, multiplier or bonus (R-020)', () => {
    const fb = feedbackFor(ITEM, 0, 8_400);
    expect(fb.seconds).toBe(8);
    expect(fb.secondsHe).toBe('8 שניות');
    expect(Object.keys(fb)).not.toContain('points');
    expect(Object.keys(fb)).not.toContain('multiplier');
    expect(Object.keys(fb)).not.toContain('xp');
  });

  it('says «שנייה אחת» for one second — ⛔ not «1 שניות»', () => {
    expect(secondsHe(1)).toBe('שנייה אחת');
    expect(secondsHe(0)).toBe('פחות משנייה');
    expect(secondsHe(2)).toBe('2 שניות');
  });

  it('counts the question inside the queue, one-based, exactly as the render prints it', () => {
    expect(questionCounterHe(0, 10)).toBe('שאלה 1 מתוך 10');
    expect(questionCounterHe(3, 10)).toBe('שאלה 4 מתוך 10');
  });

  it('ends the queue instead of wrapping round to the first item again', () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBeNull();
    expect(NO_MORE_ITEMS_HE).toBe('אין עוד פריטים ברמה הזאת');
  });

  it('⛔ holds no clock of its own — the caller passes elapsed time in (lib/core is PURE)', () => {
    const src = String(feedbackFor);
    expect(src).not.toMatch(/Date\.now|setInterval|new Date/);
  });
});
