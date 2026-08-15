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
