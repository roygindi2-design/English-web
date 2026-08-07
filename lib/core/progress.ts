/**
 * PURE. No React, no DOM, no clock, no env. Every timestamp is supplied by the caller.
 *
 * The aggregate half of T-005. One row per (user, word) — never one row per review
 * event; supabase/migrations/0003_provenance_telemetry.sql records W4 (the free
 * Supabase tier) as the reason, and everything gate 7.7 needs is derivable here.
 *
 * D-010 field names are verbatim: time_to_first_correct, attempts_to_mastery.
 */
import type { CardDirection, CardGrade } from '@/lib/core/flashcard';

export interface WordProgress {
  readonly attempts: number;
  readonly correctAttempts: number;
  /** Consecutive `good` grades on RECOGNITION cards — the input MasteryState wants. */
  readonly consecutiveCorrectRecognition: number;
  /** D-010. null = the learner has never answered correctly. 0 would be a measurement. */
  readonly timeToFirstCorrectMs: number | null;
  /** D-010. null = mastery not reached yet. Written once, never rewritten. */
  readonly attemptsToMastery: number | null;
  readonly firstSeenAtMs: number;
  readonly masteredAtMs: number | null;
}

export interface MasteryPolicy {
  /**
   * Consecutive correct recognitions that count as mastery for telemetry.
   * Required, with no default — same reasoning as
   * PromotionPolicy.promoteAfterConsecutiveCorrect in lib/core/flashcard.ts.
   */
  readonly masteryConsecutiveCorrect: number;
}

export interface GradeEvent {
  readonly grade: CardGrade;
  readonly direction: CardDirection;
  readonly answeredAtMs: number;
}

function requireEpochMs(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite epoch ms >= 0, got ${value}`);
  }
  return value;
}

export function newWordProgress(firstSeenAtMs: number): WordProgress {
  requireEpochMs(firstSeenAtMs, 'firstSeenAtMs');
  return {
    attempts: 0,
    correctAttempts: 0,
    consecutiveCorrectRecognition: 0,
    timeToFirstCorrectMs: null,
    attemptsToMastery: null,
    firstSeenAtMs,
    masteredAtMs: null,
  };
}

export function applyGrade(
  current: WordProgress,
  event: GradeEvent,
  policy: MasteryPolicy,
): WordProgress {
  requireEpochMs(event.answeredAtMs, 'event.answeredAtMs');
  if (event.answeredAtMs < current.firstSeenAtMs) {
    throw new RangeError(
      `event.answeredAtMs (${event.answeredAtMs}) precedes firstSeenAtMs (${current.firstSeenAtMs})`,
    );
  }
  if (!Number.isInteger(policy.masteryConsecutiveCorrect) || policy.masteryConsecutiveCorrect < 1) {
    throw new RangeError(
      `policy.masteryConsecutiveCorrect must be a whole number >= 1, got ${policy.masteryConsecutiveCorrect}`,
    );
  }

  const correct = event.grade === 'good';
  const attempts = current.attempts + 1;
  const correctAttempts = current.correctAttempts + (correct ? 1 : 0);

  const consecutiveCorrectRecognition =
    event.direction === 'recognition'
      ? correct
        ? current.consecutiveCorrectRecognition + 1
        : 0
      : current.consecutiveCorrectRecognition;

  // Written once. A second correct answer overwriting this turns "time to first
  // correct" into "time to latest correct" — a different measurement wearing the
  // same D-010 name.
  const timeToFirstCorrectMs =
    current.timeToFirstCorrectMs === null && correct
      ? event.answeredAtMs - current.firstSeenAtMs
      : current.timeToFirstCorrectMs;

  const reachedMastery =
    current.attemptsToMastery === null &&
    consecutiveCorrectRecognition >= policy.masteryConsecutiveCorrect;

  return {
    attempts,
    correctAttempts,
    consecutiveCorrectRecognition,
    timeToFirstCorrectMs,
    // D-010 says "attempts counted at the moment mastery was reached" — total
    // attempts, lapses included. Counting only the winning streak would report 3
    // for a word that took 30 tries.
    attemptsToMastery: reachedMastery ? attempts : current.attemptsToMastery,
    firstSeenAtMs: current.firstSeenAtMs,
    masteredAtMs: reachedMastery ? event.answeredAtMs : current.masteredAtMs,
  };
}

/** 7.7: "seen" is not "mastered". One answer — right or wrong — is exposure. */
export function isExposed(progress: WordProgress): boolean {
  return progress.attempts >= 1;
}
