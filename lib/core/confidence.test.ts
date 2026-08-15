import { describe, expect, it } from 'vitest';
import {
  BAND_MIDPOINT_PROBABILITY,
  bestLevelFor,
  CONFIDENCE_LEVELS,
  expectedScore,
  scoreConfidence,
  canExposeConfidenceScore,
  HYPERCORRECTION_MAX_DAYS,
  summarizeCalibration,
  summarizePenalties,
  type CalibrationPolicy,
  type ConfidenceLevel,
  type ConfidenceObservation,
} from './confidence';
import { addDaysIso, MIN_EASINESS, scheduleReview, type SchedulerState } from './scheduler';

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

const TODAY = '2026-08-15';

describe('7.4 hypercorrection deadline — a wrong answer returns in under a week', () => {
  it('states the deadline as whole days below seven', () => {
    expect(HYPERCORRECTION_MAX_DAYS).toBe(6);
    expect(HYPERCORRECTION_MAX_DAYS).toBeLessThan(7);
  });

  it('holds for every reachable scheduler state, exam or no exam', () => {
    const easinesses = [MIN_EASINESS, 1.8, 2.5, 3.4];
    const intervals = [0, 1, 6, 30, 365];
    const repetitions = [0, 1, 2, 9];
    const exams = [null, TODAY, '2026-08-16', '2026-09-15', '2027-08-15'];
    const latest = addDaysIso(TODAY, HYPERCORRECTION_MAX_DAYS);

    let checked = 0;
    for (const easiness of easinesses) {
      for (const intervalDays of intervals) {
        for (const repetition of repetitions) {
          for (const examDate of exams) {
            const state: SchedulerState = { easiness, intervalDays, repetition };
            const schedule = scheduleReview({
              state,
              grade: 'again',
              today: TODAY,
              examDate,
              policy: { triageMinUsableDays: 3 },
            });
            // String comparison is exact for YYYY-MM-DD: it is lexicographically ordered.
            expect(schedule.nextReviewDate <= latest).toBe(true);
            checked += 1;
          }
        }
      }
    }
    // 4 easinesses x 5 intervals x 4 repetitions x 5 exam dates.
    expect(checked).toBe(400);
  });

  // The mirror case: this deadline is about ERRORS. A correct answer is free to be
  // pushed far out, and a test that forbade that would be wrong about the spec.
  it('does NOT constrain a correct answer', () => {
    const schedule = scheduleReview({
      state: { easiness: 2.5, intervalDays: 30, repetition: 5 },
      grade: 'good',
      today: TODAY,
      examDate: null,
      policy: { triageMinUsableDays: 3 },
    });
    expect(schedule.nextReviewDate > addDaysIso(TODAY, HYPERCORRECTION_MAX_DAYS)).toBe(true);
  });
});

// One of each cell, plus one more correct answer, so every branch is exercised.
const SAMPLE: readonly ConfidenceObservation[] = [
  { correct: false, level: 'high' }, // -6  => penalty 6
  { correct: false, level: 'medium' }, // -2  => penalty 2
  { correct: false, level: 'low' }, //  0  => penalty 0
  { correct: true, level: 'low' }, // +1  => forgone 3 - 1 = 2
  { correct: true, level: 'medium' }, // +2  => forgone 3 - 2 = 1
  { correct: true, level: 'high' }, // +3  => forgone 0
];

describe('summarizePenalties — the fairness measurement 7.4 demands before exposure', () => {
  it('separates points LOST on errors from points FORGONE by under-confidence', () => {
    const dist = summarizePenalties(SAMPLE);
    expect(dist.n).toBe(6);
    expect(dist.totalPenalty).toBe(8);
    expect(dist.totalForgone).toBe(3);
    expect(dist.penaltyPerAnswer).toBeCloseTo(8 / 6, 10);
  });

  it('breaks both figures down by level, which is where a group gap would show', () => {
    const dist = summarizePenalties(SAMPLE);
    expect(dist.byLevel.high).toEqual({ n: 2, penalty: 6, forgone: 0 });
    expect(dist.byLevel.medium).toEqual({ n: 2, penalty: 2, forgone: 1 });
    expect(dist.byLevel.low).toEqual({ n: 2, penalty: 0, forgone: 2 });
  });

  it('reports the two shares Rainsford & Foster measured separately', () => {
    const dist = summarizePenalties(SAMPLE);
    expect(dist.overconfidenceShare).toBeCloseTo(6 / 8, 10);
    expect(dist.underconfidenceShare).toBeCloseTo(2 / 3, 10);
  });

  it('returns 0 and not NaN for a flawless sample with nothing to divide by', () => {
    const dist = summarizePenalties([
      { correct: true, level: 'high' },
      { correct: true, level: 'high' },
    ]);
    expect(dist.totalPenalty).toBe(0);
    expect(dist.totalForgone).toBe(0);
    expect(dist.overconfidenceShare).toBe(0);
    expect(dist.underconfidenceShare).toBe(0);
  });

  it('refuses an empty sample', () => {
    expect(() => summarizePenalties([])).toThrow(RangeError);
  });
});

describe('canExposeConfidenceScore — closed until the measurement exists', () => {
  it('refuses on a sample too small to measure a group gap', () => {
    const verdict = canExposeConfidenceScore(summarizePenalties(SAMPLE), { minObservations: 200 });
    expect(verdict.ok).toBe(false);
    expect(verdict.reasons).toContain('sample too small: 6 < 200');
  });

  it('opens once the sample is large enough', () => {
    const many: ConfidenceObservation[] = [];
    for (let i = 0; i < 200; i += 1) many.push({ correct: i % 2 === 0, level: 'medium' });
    const verdict = canExposeConfidenceScore(summarizePenalties(many), { minObservations: 200 });
    expect(verdict.ok).toBe(true);
    expect(verdict.reasons).toEqual([]);
  });

  it('rejects a policy with no real threshold', () => {
    expect(() =>
      canExposeConfidenceScore(summarizePenalties(SAMPLE), { minObservations: 0 }),
    ).toThrow(RangeError);
  });
});
