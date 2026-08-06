# Review Queue Brake — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop a returning learner from being shown an impossible review queue, and stop new cards from being introduced while a backlog exists.

**Architecture:** One pure function in `lib/core/` decides how many reviews and how many new cards to show today. It takes counts and the learner's daily goal as arguments and returns a plan. It reads no clock, no database and no environment — the caller supplies everything. This is what lets the same function run unchanged inside React Native later.

**Tech Stack:** TypeScript (strict), Vitest. No new dependencies.

## Global Constraints

- `lib/core/` is pure: no `react`, no `window`/`document`/`localStorage`, no `fetch`, no `process.env`. Enforced by `npm run check:core`.
- `noUncheckedIndexedAccess` is on. No `any`. No `@ts-ignore` without a reason comment.
- Every commit message starts `loop(DEV): C-XXXX [skip ci] ` and pushes to `dev` only.
- Verification before any completion claim: `npm run typecheck && npm run check:core && npm test && npm run build`.
- Source of the 1:10 ratio: `docs.ankiweb.net/deck-options.html` — "If you are consistently learning 20 new cards a day, you can expect your daily reviews to be roughly about 200 cards/day." Recorded as E6 in `plan/10-pedagogy.md` § 1.9.
- Source of the halt rule: same page — "it is recommended that you stop introducing new cards until you catch up."

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/core/queue.ts` | **Create.** The pure planning function and its types. Nothing else lives here. |
| `lib/core/queue.test.ts` | **Create.** Unit tests for every rule and edge case below. |

`lib/core/scheduler.ts` (7.1, when it is written) will call `planDailyQueue` — it does not duplicate the logic. No other file changes in this plan.

---

### Task 1: The daily queue planner

**Files:**
- Create: `lib/core/queue.ts`
- Test: `lib/core/queue.test.ts`

**Interfaces:**
- Consumes: nothing. This task has no dependencies on other tasks.
- Produces:
  - `export interface QueuePlanInput { readonly dueReviewCount: number; readonly newCardsPerDay: number; readonly dailyMinutesGoal: number; readonly secondsPerCard: number }`
  - `export interface QueuePlan { readonly reviewsToShow: number; readonly newCardsToShow: number; readonly deferredReviews: number; readonly newCardsPaused: boolean; readonly reason: 'normal' | 'backlog_recovery' }`
  - `export function planDailyQueue(input: QueuePlanInput): QueuePlan`
  - `export const STEADY_STATE_REVIEW_RATIO = 10`

**The rules, in order:**

1. Every numeric input must be a finite number ≥ 0, and `secondsPerCard` must be > 0. Anything else throws `RangeError`. A silently-clamped bad input would produce a wrong queue no one notices.
2. `capacity = max(1, floor(dailyMinutesGoal * 60 / secondsPerCard))` — how many cards fit in the learner's stated daily goal.
3. `steadyStateLoad = newCardsPerDay * STEADY_STATE_REVIEW_RATIO`.
4. `newCardsPaused` is true when `newCardsPerDay > 0` **and** `dueReviewCount > steadyStateLoad`. When `newCardsPerDay === 0` there is nothing to pause, so it is false.
5. Reviews come first, always: `reviewsToShow = min(dueReviewCount, capacity)`.
6. New cards get whatever capacity is left: `newCardsToShow = paused ? 0 : min(newCardsPerDay, capacity - reviewsToShow)`.
7. `deferredReviews = dueReviewCount - reviewsToShow`.
8. `reason` is `'backlog_recovery'` when `newCardsPaused`, otherwise `'normal'`.

- [ ] **Step 1: Write the failing tests**

```ts
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

  it.each([
    ['negative dueReviewCount', { dueReviewCount: -1 }],
    ['negative newCardsPerDay', { newCardsPerDay: -1 }],
    ['negative dailyMinutesGoal', { dailyMinutesGoal: -1 }],
    ['zero secondsPerCard', { secondsPerCard: 0 }],
    ['NaN dueReviewCount', { dueReviewCount: Number.NaN }],
    ['Infinite dueReviewCount', { dueReviewCount: Number.POSITIVE_INFINITY }],
  ])('throws RangeError on %s', (_label, patch) => {
    expect(() => planDailyQueue({ ...base, ...patch })).toThrow(RangeError);
  });
});
```

- [ ] **Step 2: Run the tests and confirm they fail for the right reason**

Run: `npx vitest run lib/core/queue.test.ts`
Expected: FAIL — `Failed to resolve import "./queue"`. If it fails for any other reason, stop and read the error; the test file itself is wrong.

- [ ] **Step 3: Write the minimal implementation**

```ts
/**
 * PURE. No React, no DOM, no clock, no env. Every input is supplied by the caller.
 *
 * Anki's documented steady state: a sustained N new cards/day settles at roughly
 * 10N reviews/day, and the recommended response to a backlog is to stop introducing
 * new cards until it clears. See docs.ankiweb.net/deck-options.html, recorded as
 * E6 in plan/10-pedagogy.md § 1.9.
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

function requireCount(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite number >= 0, got ${value}`);
  }
  return value;
}

export function planDailyQueue(input: QueuePlanInput): QueuePlan {
  const dueReviewCount = requireCount(input.dueReviewCount, 'dueReviewCount');
  const newCardsPerDay = requireCount(input.newCardsPerDay, 'newCardsPerDay');
  const dailyMinutesGoal = requireCount(input.dailyMinutesGoal, 'dailyMinutesGoal');
  if (!Number.isFinite(input.secondsPerCard) || input.secondsPerCard <= 0) {
    throw new RangeError(`secondsPerCard must be a finite number > 0, got ${input.secondsPerCard}`);
  }

  const capacity = Math.max(1, Math.floor((dailyMinutesGoal * 60) / input.secondsPerCard));
  const steadyStateLoad = newCardsPerDay * STEADY_STATE_REVIEW_RATIO;

  const newCardsPaused = newCardsPerDay > 0 && dueReviewCount > steadyStateLoad;

  const reviewsToShow = Math.min(dueReviewCount, capacity);
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
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run lib/core/queue.test.ts`
Expected: PASS, 13 tests.

- [ ] **Step 5: Run the full verification suite**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: exit 0 on all four. `check:core` must print `/lib/core purity: OK` — if it flags `queue.ts`, something impure got in.

- [ ] **Step 6: Commit**

```bash
git add lib/core/queue.ts lib/core/queue.test.ts
git commit -m "loop(DEV): C-XXXX [skip ci] T-031 — review queue brake (pure, 13 tests)"
git push origin dev
```

- [ ] **Step 7: Update the shared memory in the same tick**

- `plan/50-tasks.md` — T-031 → ✅, files column `lib/core/queue.ts`
- `plan/00-control.md` — `CYCLE_ID`, `NEXT_AGENT=CRITIC`, release `LOCK_HELD_BY`, one 2-line handoff row
- `plan/30-architecture.md` — no change needed; this file is already pure by construction

---

## Self-Review

**1. Spec coverage.** T-031 asks for two things: halt new cards on a backlog (rules 3–4, three tests) and keep the daily session bounded (rules 2, 5, 7, two tests). Both covered. The plan does *not* implement SM-2 interval maths — that is 7.1 and a separate task; this function only decides counts.

**2. Placeholder scan.** No TBD, no "add error handling", no "write tests for the above". Every step carries the code it needs.

**3. Type consistency.** `planDailyQueue`, `QueuePlanInput`, `QueuePlan`, `STEADY_STATE_REVIEW_RATIO` are spelled identically in the Interfaces block, the tests, and the implementation. `deferredReviews` — not `backlog` — is the field name everywhere.

**One thing this plan deliberately does not do:** it does not spread the deferred backlog across future days. `deferredReviews` is reported so a screen can say "725 more waiting", and those cards simply stay due. Spreading them is a separate, larger decision (SuperMemo's `Postpone` does this; we could not verify its mechanism). YAGNI until a real learner has a real backlog.
