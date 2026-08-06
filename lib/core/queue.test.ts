import { describe, expect, it } from 'vitest';
import { planDailyQueue, STEADY_STATE_REVIEW_RATIO } from './queue';

const base = { dueReviewCount: 0, newCardsPerDay: 20, dailyMinutesGoal: 10, secondsPerCard: 8 };
// capacity = floor(10 * 60 / 8) = 75

describe('planDailyQueue', () => {
  it('day one: no reviews exist, so the learner gets new cards up to their limit', () => {
    const p = planDailyQueue(base);
    expect(p.reviewsToShow).toBe(0);
    expect(p.newCardsToShow).toBe(20);
    expect(p.newCardsPaused).toBe(false);
    expect(p.reason).toBe('normal');
  });

  it('reviews are served before new cards when capacity is tight', () => {
    const p = planDailyQueue({ ...base, dueReviewCount: 70 });
    expect(p.reviewsToShow).toBe(70);
    expect(p.newCardsToShow).toBe(5); // 75 capacity - 70 reviews
    expect(p.deferredReviews).toBe(0);
  });

  it('pauses new cards once the backlog passes the steady-state ratio', () => {
    // 20 new/day implies ~200 reviews/day at steady state. 201 means the learner fell behind.
    const p = planDailyQueue({ ...base, dueReviewCount: 20 * STEADY_STATE_REVIEW_RATIO + 1 });
    expect(p.newCardsPaused).toBe(true);
    expect(p.newCardsToShow).toBe(0);
    expect(p.reason).toBe('backlog_recovery');
  });

  it('does not pause exactly at the steady-state boundary', () => {
    const p = planDailyQueue({ ...base, dueReviewCount: 20 * STEADY_STATE_REVIEW_RATIO });
    expect(p.newCardsPaused).toBe(false);
  });

  it('never shows more cards than the daily goal allows, and defers the rest', () => {
    const p = planDailyQueue({ ...base, dueReviewCount: 800 });
    expect(p.reviewsToShow).toBe(75);
    expect(p.deferredReviews).toBe(725);
    expect(p.newCardsToShow).toBe(0);
  });

  it('a learner who paused new cards is not treated as being in recovery', () => {
    const p = planDailyQueue({ ...base, newCardsPerDay: 0, dueReviewCount: 500 });
    expect(p.newCardsPaused).toBe(false);
    expect(p.newCardsToShow).toBe(0);
    expect(p.reason).toBe('normal');
  });

  it('always offers at least one card, even with an absurdly small goal', () => {
    const p = planDailyQueue({ ...base, dailyMinutesGoal: 0, dueReviewCount: 40 });
    expect(p.reviewsToShow).toBe(1);
    expect(p.deferredReviews).toBe(39);
  });

  // --- Amendment A (code review C-0005): the brake needs a real backlog ---

  it('does not pause when the learner clears the whole queue inside the daily goal', () => {
    // 11 due against 1 new/day is above the 1:10 ratio, but capacity is 75:
    // every card is answered today and 64 slots go unused. Nothing to recover from.
    const p = planDailyQueue({ ...base, newCardsPerDay: 1, dueReviewCount: 11 });
    expect(p.deferredReviews).toBe(0);
    expect(p.newCardsPaused).toBe(false);
    expect(p.newCardsToShow).toBe(1);
    expect(p.reason).toBe('normal');
  });

  it('pauses only when the backlog both exceeds the ratio and outruns the daily goal', () => {
    // Same 1 new/day, but now 300 due against capacity 75 — a week away from the app.
    const p = planDailyQueue({ ...base, newCardsPerDay: 1, dueReviewCount: 300 });
    expect(p.deferredReviews).toBe(225);
    expect(p.newCardsPaused).toBe(true);
    expect(p.reason).toBe('backlog_recovery');
  });

  it('floors capacity instead of handing back a fraction of a card', () => {
    // 10 * 60 / 7 = 85.714…
    const p = planDailyQueue({ ...base, secondsPerCard: 7, dueReviewCount: 1000 });
    expect(p.reviewsToShow).toBe(85);
    expect(p.deferredReviews).toBe(915);
  });

  it.each([
    ['negative dueReviewCount', { dueReviewCount: -1 }],
    ['negative newCardsPerDay', { newCardsPerDay: -1 }],
    ['negative dailyMinutesGoal', { dailyMinutesGoal: -1 }],
    ['zero secondsPerCard', { secondsPerCard: 0 }],
    ['negative secondsPerCard', { secondsPerCard: -8 }],
    ['NaN dueReviewCount', { dueReviewCount: Number.NaN }],
    ['NaN newCardsPerDay', { newCardsPerDay: Number.NaN }],
    ['NaN dailyMinutesGoal', { dailyMinutesGoal: Number.NaN }],
    ['NaN secondsPerCard', { secondsPerCard: Number.NaN }],
    ['Infinite dueReviewCount', { dueReviewCount: Number.POSITIVE_INFINITY }],
    ['Infinite newCardsPerDay', { newCardsPerDay: Number.POSITIVE_INFINITY }],
    ['Infinite dailyMinutesGoal', { dailyMinutesGoal: Number.POSITIVE_INFINITY }],
    ['Infinite secondsPerCard', { secondsPerCard: Number.POSITIVE_INFINITY }],
    ['fractional dueReviewCount', { dueReviewCount: 100.5 }],
    ['fractional newCardsPerDay', { newCardsPerDay: 2.5 }],
  ])('throws RangeError on %s', (_label, patch) => {
    expect(() => planDailyQueue({ ...base, ...patch })).toThrow(RangeError);
  });

  it('accepts a fractional daily goal — minutes are not cards', () => {
    expect(planDailyQueue({ ...base, dailyMinutesGoal: 10.7 }).newCardsToShow).toBe(20);
  });

  it('holds its invariants across a grid of realistic inputs', () => {
    for (const dueReviewCount of [0, 1, 9, 10, 11, 75, 76, 199, 200, 201, 900]) {
      for (const newCardsPerDay of [0, 1, 5, 20, 50]) {
        for (const dailyMinutesGoal of [0, 1, 10, 45]) {
          for (const secondsPerCard of [3, 7, 8, 60]) {
            const p = planDailyQueue({
              dueReviewCount,
              newCardsPerDay,
              dailyMinutesGoal,
              secondsPerCard,
            });
            const capacity = Math.max(1, Math.floor((dailyMinutesGoal * 60) / secondsPerCard));
            const label = `${dueReviewCount}/${newCardsPerDay}/${dailyMinutesGoal}/${secondsPerCard}`;

            // whole cards only
            for (const n of [p.reviewsToShow, p.newCardsToShow, p.deferredReviews]) {
              expect(Number.isInteger(n), `${label} not an integer: ${n}`).toBe(true);
              expect(n, `${label} negative: ${n}`).toBeGreaterThanOrEqual(0);
            }
            // the brake never fires on a day the learner finished
            if (p.newCardsPaused) {
              expect(p.deferredReviews, `${label} paused with no backlog`).toBeGreaterThan(0);
              expect(p.newCardsToShow, `${label} paused but new cards shown`).toBe(0);
            }
            expect(p.reason).toBe(p.newCardsPaused ? 'backlog_recovery' : 'normal');
            // nothing is lost, and the session stays inside the stated goal
            expect(p.reviewsToShow + p.deferredReviews).toBe(dueReviewCount);
            expect(p.reviewsToShow + p.newCardsToShow).toBeLessThanOrEqual(capacity);
            expect(p.newCardsToShow).toBeLessThanOrEqual(newCardsPerDay);
          }
        }
      }
    }
  });
});
