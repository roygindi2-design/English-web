import { describe, expect, it } from 'vitest';
import {
  BAND_MIDPOINT_PROBABILITY,
  bestLevelFor,
  CONFIDENCE_LEVELS,
  expectedScore,
  scoreConfidence,
  summarizeCalibration,
  type CalibrationPolicy,
  type ConfidenceLevel,
} from './confidence';

describe('scoreConfidence — the Gardner-Medwin CBM matrix, verbatim from 7.4', () => {
  it('scores the three correct answers +1 / +2 / +3', () => {
    expect(scoreConfidence({ correct: true, level: 'low' })).toBe(1);
    expect(scoreConfidence({ correct: true, level: 'medium' })).toBe(2);
    expect(scoreConfidence({ correct: true, level: 'high' })).toBe(3);
  });

  it('scores the three wrong answers 0 / -2 / -6', () => {
    expect(scoreConfidence({ correct: false, level: 'low' })).toBe(0);
    expect(scoreConfidence({ correct: false, level: 'medium' })).toBe(-2);
    expect(scoreConfidence({ correct: false, level: 'high' })).toBe(-6);
  });

  // R-009 is the whole reason this file exists. A future edit that "restores"
  // -1 here contradicts our own principle "no punishment for not knowing".
  it('NEVER punishes an honest "I do not know": wrong+low is exactly zero', () => {
    expect(scoreConfidence({ correct: false, level: 'low' })).toBe(0);
  });

  it('rejects a level that is not one of the three', () => {
    const bogus = { correct: true, level: 'certain' } as unknown as {
      correct: boolean;
      level: ConfidenceLevel;
    };
    expect(() => scoreConfidence(bogus)).toThrow(RangeError);
  });

  it('offers exactly three levels — two would lose the granularity we built this for', () => {
    expect(CONFIDENCE_LEVELS).toEqual(['low', 'medium', 'high']);
  });
});

describe('the matrix IS a proper scoring rule — derived from the payoffs, not restated', () => {
  // E(level, p) = p * correctDelta + (1 - p) * wrongDelta.
  // low = p ; medium = 4p - 2 ; high = 9p - 6.
  it('computes the three expected-score lines', () => {
    expect(expectedScore('low', 0.5)).toBeCloseTo(0.5, 10);
    expect(expectedScore('medium', 0.5)).toBeCloseTo(0, 10);
    expect(expectedScore('high', 0.5)).toBeCloseTo(-1.5, 10);
  });

  // low = medium  =>  p = 4p - 2  =>  p = 2/3 = 0.6667  -> 7.4's "below 67%"
  // medium = high =>  4p - 2 = 9p - 6  =>  p = 0.8      -> 7.4's "67%-80% / above 80%"
  it('reproduces 7.4 crossover points from the payoffs alone', () => {
    expect(expectedScore('low', 2 / 3)).toBeCloseTo(expectedScore('medium', 2 / 3), 10);
    expect(expectedScore('medium', 0.8)).toBeCloseTo(expectedScore('high', 0.8), 10);
  });

  it('makes honest reporting the score-maximising strategy at every probability', () => {
    expect(bestLevelFor(0.1)).toBe('low');
    expect(bestLevelFor(0.66)).toBe('low');
    expect(bestLevelFor(0.7)).toBe('medium');
    expect(bestLevelFor(0.79)).toBe('medium');
    expect(bestLevelFor(0.81)).toBe('high');
    expect(bestLevelFor(1)).toBe('high');
  });

  it('rejects a probability outside 0..1', () => {
    expect(() => expectedScore('low', 1.5)).toThrow(RangeError);
    expect(() => bestLevelFor(-0.1)).toThrow(RangeError);
  });
});

const POLICY: CalibrationPolicy = {
  levelProbability: BAND_MIDPOINT_PROBABILITY,
  biasTolerance: 0.05,
};

describe('summarizeCalibration — Brier plus the signed bias 7.4 demands', () => {
  it('places each band midpoint between its two crossover points', () => {
    expect(BAND_MIDPOINT_PROBABILITY.low).toBeCloseTo(1 / 3, 10);
    expect(BAND_MIDPOINT_PROBABILITY.medium).toBeCloseTo(11 / 15, 10);
    expect(BAND_MIDPOINT_PROBABILITY.high).toBeCloseTo(0.9, 10);
  });

  it('reports an overconfident learner with the sign pointing the right way', () => {
    // four "high" answers (f = 0.9), two of them correct.
    // brier = ((0.9-1)^2 * 2 + (0.9-0)^2 * 2) / 4 = (0.02 + 1.62) / 4 = 0.41
    // bias  = 0.9 - 0.5 = +0.4
    const summary = summarizeCalibration(
      [
        { correct: true, level: 'high' },
        { correct: true, level: 'high' },
        { correct: false, level: 'high' },
        { correct: false, level: 'high' },
      ],
      POLICY,
    );
    expect(summary.n).toBe(4);
    expect(summary.brier).toBeCloseTo(0.41, 10);
    expect(summary.meanConfidence).toBeCloseTo(0.9, 10);
    expect(summary.accuracy).toBeCloseTo(0.5, 10);
    expect(summary.bias).toBeCloseTo(0.4, 10);
    expect(summary.direction).toBe('overconfident');
  });

  it('reports an underconfident learner with a negative bias', () => {
    // three "low" answers (f = 1/3), all three correct. bias = 1/3 - 1 = -2/3
    const summary = summarizeCalibration(
      [
        { correct: true, level: 'low' },
        { correct: true, level: 'low' },
        { correct: true, level: 'low' },
      ],
      POLICY,
    );
    expect(summary.bias).toBeCloseTo(-2 / 3, 10);
    expect(summary.direction).toBe('underconfident');
  });

  it('calls a learner calibrated when the bias sits inside the tolerance', () => {
    // three "low" answers (f = 1/3), one correct => accuracy 1/3, bias 0.
    // brier = ((1/3 - 1)^2 + 2 * (1/3)^2) / 3 = (4/9 + 2/9) / 3 = 2/9
    const summary = summarizeCalibration(
      [
        { correct: true, level: 'low' },
        { correct: false, level: 'low' },
        { correct: false, level: 'low' },
      ],
      POLICY,
    );
    expect(summary.brier).toBeCloseTo(2 / 9, 10);
    expect(summary.bias).toBeCloseTo(0, 10);
    expect(summary.direction).toBe('calibrated');
  });

  // Brier over zero answers is UNDEFINED, not 0. Returning 0 would read as
  // "perfectly calibrated" on a learner who has answered nothing.
  it('refuses an empty sample instead of returning a flattering zero', () => {
    expect(() => summarizeCalibration([], POLICY)).toThrow(RangeError);
  });

  it('rejects a policy probability outside 0..1', () => {
    const bad: CalibrationPolicy = {
      levelProbability: { low: 1 / 3, medium: 11 / 15, high: 1.4 },
      biasTolerance: 0.05,
    };
    expect(() => summarizeCalibration([{ correct: true, level: 'high' }], bad)).toThrow(RangeError);
  });

  it('rejects a negative tolerance', () => {
    const bad: CalibrationPolicy = {
      levelProbability: BAND_MIDPOINT_PROBABILITY,
      biasTolerance: -1,
    };
    expect(() => summarizeCalibration([{ correct: true, level: 'low' }], bad)).toThrow(RangeError);
  });
});
