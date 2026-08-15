/**
 * PURE. No React, no DOM, no clock, no env. Engine 7.4 of plan/70-engines.md.
 *
 * The matrix is Gardner-Medwin's Certainty-Based Marking (UCL, in Moodle for 40+
 * years) copied verbatim, INCLUDING wrong+low = 0. R-009 caught a -1 in an earlier
 * draft: "no punishment for not knowing" is our own principle, and -1 broke it.
 *
 * 7.4 also records the limit of the evidence: Hendriks et al. 2019 (n=389) found
 * NO significant effect of this score on summative test results. It is therefore a
 * MEASUREMENT and TIMING input. It is never shown to the learner as a level, a
 * grade, or a readiness estimate (15-syllabus-digest, 1.9 E8/E9).
 */

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export const CONFIDENCE_LEVELS: readonly ConfidenceLevel[] = Object.freeze([
  'low',
  'medium',
  'high',
] as const);

export interface ConfidenceObservation {
  readonly correct: boolean;
  readonly level: ConfidenceLevel;
}

/** 7.4 verbatim. R-009: `wrong.low` is 0, not -1. */
export const CBM_MATRIX: Readonly<Record<ConfidenceLevel, { correct: number; wrong: number }>> =
  Object.freeze({
    low: Object.freeze({ correct: 1, wrong: 0 }),
    medium: Object.freeze({ correct: 2, wrong: -2 }),
    high: Object.freeze({ correct: 3, wrong: -6 }),
  });

function requireLevel(level: ConfidenceLevel): ConfidenceLevel {
  if (!CONFIDENCE_LEVELS.includes(level)) {
    throw new RangeError(`level must be one of ${CONFIDENCE_LEVELS.join('|')}, got ${level}`);
  }
  return level;
}

function requireProbability(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} must be a finite number in 0..1, got ${value}`);
  }
  return value;
}

export function scoreConfidence(observation: ConfidenceObservation): number {
  const cell = CBM_MATRIX[requireLevel(observation.level)];
  return observation.correct ? cell.correct : cell.wrong;
}

/** E(level, p) = p*correct + (1-p)*wrong. This is what makes the matrix "proper". */
export function expectedScore(level: ConfidenceLevel, trueProbability: number): number {
  const cell = CBM_MATRIX[requireLevel(level)];
  const p = requireProbability(trueProbability, 'trueProbability');
  return p * cell.correct + (1 - p) * cell.wrong;
}

/**
 * The level a score-maximising learner reports at probability p. Ties go to the
 * LOWER level, which is why 2/3 reads "low" and 0.8 reads "medium" — 7.4's bands
 * are written "below 67%" and "67%-80%", i.e. closed on the left.
 */
export function bestLevelFor(trueProbability: number): ConfidenceLevel {
  const p = requireProbability(trueProbability, 'trueProbability');
  let best: ConfidenceLevel = 'low';
  let bestValue = expectedScore('low', p);
  for (const level of CONFIDENCE_LEVELS) {
    const value = expectedScore(level, p);
    if (value > bestValue) {
      best = level;
      bestValue = value;
    }
  }
  return best;
}

/**
 * The forecast probability f that a reported level stands for. 7.4 fixes the BAND
 * edges (2/3 and 0.8) and no source fixes a point inside a band, so the midpoint is
 * used and named: low = mid[0, 2/3] = 1/3 · medium = mid[2/3, 0.8] = 11/15 ·
 * high = mid[0.8, 1] = 0.9. It is a CalibrationPolicy field, so a measurement on
 * real answers replaces it in exactly one place without touching this module.
 */
export const BAND_MIDPOINT_PROBABILITY: Readonly<Record<ConfidenceLevel, number>> = Object.freeze({
  low: 1 / 3,
  medium: 11 / 15,
  high: 0.9,
});

export interface CalibrationPolicy {
  readonly levelProbability: Readonly<Record<ConfidenceLevel, number>>;
  /**
   * How far |bias| may drift before a learner is called mis-calibrated. Required,
   * with NO default: no published number fixes it, and a constant invented here
   * would later be cited as if it were evidence. Same reasoning as
   * SchedulingPolicy.triageMinUsableDays.
   */
  readonly biasTolerance: number;
}

export type CalibrationDirection = 'overconfident' | 'underconfident' | 'calibrated';

export interface CalibrationSummary {
  readonly n: number;
  readonly brier: number;
  readonly meanConfidence: number;
  readonly accuracy: number;
  /** mean(confidence) - mean(accuracy). POSITIVE = overconfident. */
  readonly bias: number;
  readonly direction: CalibrationDirection;
}

export function summarizeCalibration(
  observations: readonly ConfidenceObservation[],
  policy: CalibrationPolicy,
): CalibrationSummary {
  if (observations.length === 0) {
    throw new RangeError('summarizeCalibration needs at least one observation');
  }
  if (!Number.isFinite(policy.biasTolerance) || policy.biasTolerance < 0) {
    throw new RangeError(
      `policy.biasTolerance must be a finite number >= 0, got ${policy.biasTolerance}`,
    );
  }
  for (const level of CONFIDENCE_LEVELS) {
    requireProbability(policy.levelProbability[level], `policy.levelProbability.${level}`);
  }

  let squaredError = 0;
  let confidenceSum = 0;
  let correctCount = 0;
  for (const observation of observations) {
    const f = policy.levelProbability[requireLevel(observation.level)];
    const d = observation.correct ? 1 : 0;
    squaredError += (d - f) ** 2;
    confidenceSum += f;
    correctCount += d;
  }

  const n = observations.length;
  const meanConfidence = confidenceSum / n;
  const accuracy = correctCount / n;
  const bias = meanConfidence - accuracy;

  // Brier alone never reveals the DIRECTION of the miss, and the direction is
  // exactly what an over-confidence intervention needs (7.4).
  const direction: CalibrationDirection =
    Math.abs(bias) <= policy.biasTolerance
      ? 'calibrated'
      : bias > 0
        ? 'overconfident'
        : 'underconfident';

  return { n, brier: squaredError / n, meanConfidence, accuracy, bias, direction };
}

/**
 * 7.4: "a high-confidence error must return to the review queue in under a week,
 * otherwise the gain is erased" (Butler, Fazio & Marsh 2011 — the correction rate
 * decays from 86% to 56% across one week). "Under a week" in whole days is 6.
 *
 * There is deliberately NO capping function here. lib/core/scheduler.ts already
 * resets a lapse to FIRST_INTERVAL_DAYS = 1 and the exam branch only shortens it,
 * so a cap would be dead code. This constant exists to be ASSERTED against, and
 * lib/core/confidence.test.ts sweeps the reachable state space to prove it holds.
 */
export const HYPERCORRECTION_MAX_DAYS = 6;
