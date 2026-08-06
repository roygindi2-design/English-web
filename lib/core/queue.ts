/**
 * PURE. No React, no DOM, no clock, no env. Every input is supplied by the caller.
 *
 * Anki's documented steady state: a sustained N new cards/day settles at roughly
 * 10N reviews/day, and the recommended response to a backlog is to stop introducing
 * new cards until it clears. See docs.ankiweb.net/deck-options.html, recorded as
 * E6 in plan/10-pedagogy.md § 1.9.
 *
 * The ratio alone is not enough to declare a backlog: a learner doing 1 new card a day
 * trips 10N at 11 due cards, which a 10-minute session clears with 64 slots to spare.
 * Freezing that learner would be a bug, so the brake also requires that the queue
 * outruns the day's capacity. See the Amendment section of
 * docs/superpowers/plans/2026-08-06-review-queue-brake.md.
 */

export const STEADY_STATE_REVIEW_RATIO = 10;

export interface QueuePlanInput {
  readonly dueReviewCount: number;
  readonly newCardsPerDay: number;
  readonly dailyMinutesGoal: number;
  readonly secondsPerCard: number;
}

export interface QueuePlan {
  readonly reviewsToShow: number;
  readonly newCardsToShow: number;
  readonly deferredReviews: number;
  readonly newCardsPaused: boolean;
  readonly reason: 'normal' | 'backlog_recovery';
}

/** Card counts are whole cards. 100.5 due reviews is a caller bug, not a queue to render. */
function requireCardCount(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a whole number >= 0, got ${value}`);
  }
  return value;
}

/** Durations may be fractional — they are floored into a card count, never shown as one. */
function requireDuration(value: number, label: string, min: number): number {
  if (!Number.isFinite(value) || value < min) {
    throw new RangeError(`${label} must be a finite number >= ${min}, got ${value}`);
  }
  return value;
}

export function planDailyQueue(input: QueuePlanInput): QueuePlan {
  const dueReviewCount = requireCardCount(input.dueReviewCount, 'dueReviewCount');
  const newCardsPerDay = requireCardCount(input.newCardsPerDay, 'newCardsPerDay');
  const dailyMinutesGoal = requireDuration(input.dailyMinutesGoal, 'dailyMinutesGoal', 0);
  const secondsPerCard = requireDuration(input.secondsPerCard, 'secondsPerCard', Number.MIN_VALUE);

  const capacity = Math.max(1, Math.floor((dailyMinutesGoal * 60) / secondsPerCard));
  const steadyStateLoad = newCardsPerDay * STEADY_STATE_REVIEW_RATIO;

  // Two conditions, both required: the queue is heavier than the 1:10 steady state,
  // *and* it is heavier than what today's goal can absorb. See the header comment.
  const newCardsPaused =
    newCardsPerDay > 0 && dueReviewCount > steadyStateLoad && dueReviewCount > capacity;

  const reviewsToShow = Math.min(dueReviewCount, capacity);
  // The `newCardsPaused` branch is arithmetically redundant today — a paused queue always
  // exceeds capacity, so no slots are left anyway. It stays because the halt is the brake's
  // contract, not a side effect of the capacity maths; the grid test pins that contract.
  const newCardsToShow = newCardsPaused
    ? 0
    : Math.min(newCardsPerDay, capacity - reviewsToShow);

  return {
    reviewsToShow,
    newCardsToShow,
    deferredReviews: dueReviewCount - reviewsToShow,
    newCardsPaused,
    reason: newCardsPaused ? 'backlog_recovery' : 'normal',
  };
}
