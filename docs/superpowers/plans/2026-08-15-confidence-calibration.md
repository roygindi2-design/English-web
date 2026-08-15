# Confidence Calibration Implementation Plan (T-033)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build engine 7.4 — `lib/core/confidence.ts` — as a pure measurement module: the Gardner-Medwin CBM score matrix, a Brier score with a **signed** bias, a machine check that the scheduler already meets 7.4's hypercorrection deadline, and a penalty-distribution report that gates the score from ever reaching a learner before it has been measured.

**Architecture:** One new leaf module in `/lib/core` plus one test file. Nothing else in the repo changes: no migration, no route, no component, no `docs/api-contract.md` section (this task adds **zero** endpoints). Task 3 asserts a property of the **existing** `scheduleReview` rather than adding a capping wrapper — reading `lib/core/scheduler.ts:135-141`, a lapse already resets `intervalDays` to `FIRST_INTERVAL_DAYS = 1`, so a hypercorrection cap would be dead code. A test that locks the property is worth more than code that never fires.

**Tech Stack:** TypeScript (⛔ no `any`, `noUncheckedIndexedAccess` on), vitest.

**Spec:** `plan/70-engines.md` § 7.4 (שורות 54-88) · `plan/20-alerts.md` R-009 (wrong+low = **0**, ⛔ not −1) · `plan/15-syllabus-digest.md` «ביטחון = קלט תזמון, לא ציון מוצג» (1.9 E8 · E9) · «⛔ אין להציג הערכת מוכנות לפני שהיא מכוילת על נתוני אמת» (40-decisions 4.4.3).

## Global Constraints

- `/lib/core` is pure: ⛔ zero React/window/document/localStorage/fetch/`process.env`/`node:fs`. Enforced by `npm run check:core`.
- `noUncheckedIndexedAccess` is on. A `Record<ConfidenceLevel, X>` with the finite literal union as its key type indexes to `X` (safe); an **array** index is `X | undefined` — filter, ⛔ never assert with `!`.
- ⛔ **No UI in this plan.** No screen, no button, no copy, no route. T-033's own title is «להוריד מכותרת הבידול לקלט תזמון» — the score is a timing/measurement input. Screens are the PM's call in `plan/40-decisions.md`.
- ⛔ **No number is invented.** Every constant below is either copied verbatim from § 7.4 or *derived* from it by arithmetic shown in the plan. A number that is neither is a required `policy` parameter the caller owns — the pattern already used by `SchedulingPolicy.triageMinUsableDays` (`lib/core/scheduler.ts:48-57`) and `PromotionPolicy` (`lib/core/flashcard.ts:118`).
- ⛔ Zero learning content. ⛔ Zero edits to `plan/10-pedagogy.md`, `plan/60-findings.md`, `plan/35-design-constitution.md`, `plan/40-decisions.md`.
- Commit messages carry ⛔ no `[skip ci]` (RULES § 0.7). Push to `dev` only.

## Numbers this plan rests on, and where each comes from

| # | Value | Source |
|---|---|---|
| N1 | correct: low **+1** · medium **+2** · high **+3** | § 7.4 matrix, verbatim |
| N2 | wrong: low **0** · medium **−2** · high **−6** | § 7.4 matrix, verbatim (R-009 — **0**, ⛔ not −1) |
| N3 | band edges **2/3** and **0.8** | § 7.4 «נקודות המעבר: מתחת ל-67% ... 67%–80% ... מעל 80%» — and **re-derived** in Task 1 from N1/N2 alone, so the test proves the matrix is the proper scoring rule it claims to be |
| N4 | band midpoints low **1/3** · medium **11/15** · high **0.9** | derived: midpoints of `[0, 2/3]`, `[2/3, 0.8]`, `[0.8, 1]`. `(2/3+0.8)/2 = 11/15` |
| N5 | hypercorrection deadline **< 7 days**, asserted as **≤ 6** whole days | § 7.4 «טעות בביטחון גבוה חייבת לחזור לתור החזרות בתוך פחות משבוע» |
| N6 | `minObservations` for the exposure gate | ⛔ **no published number** ⇒ required `policy` field, no default |

---

### Task 1: The CBM matrix, and a test that proves it is a proper scoring rule

**Files:**
- Create: `lib/core/confidence.ts`
- Test: `lib/core/confidence.test.ts`

**Interfaces:**
- Consumes: nothing. This is a leaf module in Task 1.
- Produces:
  - `type ConfidenceLevel = 'low' | 'medium' | 'high'`
  - `const CONFIDENCE_LEVELS: readonly ConfidenceLevel[]`
  - `const CBM_MATRIX: Readonly<Record<ConfidenceLevel, { correct: number; wrong: number }>>`
  - `interface ConfidenceObservation { readonly correct: boolean; readonly level: ConfidenceLevel }`
  - `function scoreConfidence(observation: ConfidenceObservation): number`
  - `function expectedScore(level: ConfidenceLevel, trueProbability: number): number`
  - `function bestLevelFor(trueProbability: number): ConfidenceLevel`

- [ ] **Step 1: Write the failing test**

Create `lib/core/confidence.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  bestLevelFor,
  CONFIDENCE_LEVELS,
  expectedScore,
  scoreConfidence,
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
```

- [ ] **Step 2: Run it and watch it fail for the right reason**

Run: `npx vitest run lib/core/confidence.test.ts`
Expected: FAIL — `Failed to load url ./confidence`. ⛔ Any other failure means the test file itself is wrong; fix it before writing implementation.

- [ ] **Step 3: Write the minimal implementation**

Create `lib/core/confidence.ts`:

```ts
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
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/core/confidence.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Run one mutation and confirm the suite catches it**

Change `low: { correct: 1, wrong: 0 }` to `wrong: -1` (the value R-009 rejected). Re-run.
Expected: **3** failures — the two wrong-answer assertions and `reproduces 7.4 crossover points` (the low/medium crossover moves from 2/3 to 0.6). Restore the file and re-run to green. ⛔ If the crossover test does **not** fail, it is not doing its job — say so in the tick report.

- [ ] **Step 6: Commit**

```bash
git add lib/core/confidence.ts lib/core/confidence.test.ts
git commit -m "loop(DEV): C-XXXX 7.4 CBM matrix as a proper scoring rule (T-033, 1/4)"
```

---

### Task 2: Brier score and the **signed** bias

**Files:**
- Modify: `lib/core/confidence.ts` (append)
- Test: `lib/core/confidence.test.ts` (append)

**Interfaces:**
- Consumes: `ConfidenceLevel`, `ConfidenceObservation`, `CONFIDENCE_LEVELS`, `requireLevel`, `requireProbability` from Task 1.
- Produces:
  - `const BAND_MIDPOINT_PROBABILITY: Readonly<Record<ConfidenceLevel, number>>`
  - `interface CalibrationPolicy { readonly levelProbability: Readonly<Record<ConfidenceLevel, number>>; readonly biasTolerance: number }`
  - `type CalibrationDirection = 'overconfident' | 'underconfident' | 'calibrated'`
  - `interface CalibrationSummary { readonly n: number; readonly brier: number; readonly meanConfidence: number; readonly accuracy: number; readonly bias: number; readonly direction: CalibrationDirection }`
  - `function summarizeCalibration(observations: readonly ConfidenceObservation[], policy: CalibrationPolicy): CalibrationSummary`

- [ ] **Step 1: Write the failing test**

Append to `lib/core/confidence.test.ts`. ⚠️ Add `BAND_MIDPOINT_PROBABILITY`, `summarizeCalibration` and `type CalibrationPolicy` to the **existing** `from './confidence'` import block at the top — ⛔ do not open a second import from the same path.

```ts
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/confidence.test.ts`
Expected: FAIL — no export `BAND_MIDPOINT_PROBABILITY` / `summarizeCalibration is not a function`.

- [ ] **Step 3: Write the minimal implementation**

Append to `lib/core/confidence.ts`:

```ts
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
```

- [ ] **Step 4: Run and confirm green**

Run: `npx vitest run lib/core/confidence.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 5: Run one mutation**

Flip `bias > 0 ? 'overconfident' : 'underconfident'` to the opposite order. Re-run.
Expected: the overconfident and underconfident tests both fail. Restore, re-run green.

- [ ] **Step 6: Commit**

```bash
git add lib/core/confidence.ts lib/core/confidence.test.ts
git commit -m "loop(DEV): C-XXXX Brier + signed calibration bias (T-033, 2/4)"
```

---

### Task 3: Lock the hypercorrection deadline against the **existing** scheduler

**Files:**
- Modify: `lib/core/confidence.ts` (append one constant)
- Test: `lib/core/confidence.test.ts` (append)

**Why no new code:** § 7.4 requires that a high-confidence error return to the queue in under a week. `lib/core/scheduler.ts:135-141` already resets a lapse to `FIRST_INTERVAL_DAYS = 1`, and the exam branch only ever shortens it. So the requirement is met **by construction** — a capping function would never fire. What is missing is the *lock*: nothing today fails if a future edit lets a lapse keep its old interval. This task adds that lock.

**Interfaces:**
- Consumes: `scheduleReview`, `addDaysIso`, `MIN_EASINESS`, `type SchedulerState` from `./scheduler`.
- Produces: `const HYPERCORRECTION_MAX_DAYS = 6`

- [ ] **Step 1: Write the failing test**

Append to `lib/core/confidence.test.ts`. Add `HYPERCORRECTION_MAX_DAYS` to the existing `./confidence` import; the `./scheduler` import below is new and belongs with the other imports at the top of the file.

```ts
import { addDaysIso, MIN_EASINESS, scheduleReview, type SchedulerState } from './scheduler';

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
```

⚠️ `checked` is `4 × 5 × 4 × 5 = 400`. If the executor edits any of the four arrays, that literal must be recomputed in the same edit — a sweep that silently visits fewer states than it claims is worse than no sweep at all.

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/confidence.test.ts`
Expected: FAIL — no export `HYPERCORRECTION_MAX_DAYS`.

- [ ] **Step 3: Add the constant**

Append to `lib/core/confidence.ts`:

```ts
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
```

- [ ] **Step 4: Run and confirm green**

Run: `npx vitest run lib/core/confidence.test.ts`
Expected: PASS, 18 tests. ⛔ If the sweep fails, do **not** weaken the assertion — that is a real 7.4 violation in the scheduler, and it is a finding, not a test to soften.

- [ ] **Step 5: Run one mutation, in the scheduler this time**

In `lib/core/scheduler.ts`, change the lapse line to `let intervalDays = lapsed ? 10 : classicInterval(input.state, easiness);`. Re-run `npx vitest run lib/core/confidence.test.ts lib/core/scheduler.test.ts`.
Expected: the sweep fails. Restore `FIRST_INTERVAL_DAYS`, re-run both files green. Record the exact failure line in the tick report — that is the evidence the lock is live.

- [ ] **Step 6: Commit**

```bash
git add lib/core/confidence.ts lib/core/confidence.test.ts
git commit -m "loop(DEV): C-XXXX lock 7.4 hypercorrection deadline on the scheduler (T-033, 3/4)"
```

---

### Task 4: The penalty distribution, and the gate that keeps the score away from the learner

**Files:**
- Modify: `lib/core/confidence.ts` (append)
- Test: `lib/core/confidence.test.ts` (append)

**Why:** § 7.4 carries a 🔴 fairness risk — Rainsford & Foster 2025 found gender explained **17.2%** of the variance in confidence reporting, women losing points both from under-confidence on correct answers and from over-confidence on wrong ones — and its instruction is explicit: *before* this score touches anything the learner reads as "a level", measure the actual distribution of penalties. This task builds that measurement and the gate that reads it.

**Interfaces:**
- Consumes: everything from Tasks 1-2.
- Produces:
  - `interface LevelPenalty { readonly n: number; readonly penalty: number; readonly forgone: number }`
  - `interface PenaltyDistribution { readonly n: number; readonly totalPenalty: number; readonly totalForgone: number; readonly penaltyPerAnswer: number; readonly overconfidenceShare: number; readonly underconfidenceShare: number; readonly byLevel: Readonly<Record<ConfidenceLevel, LevelPenalty>> }`
  - `function summarizePenalties(observations: readonly ConfidenceObservation[]): PenaltyDistribution`
  - `interface ExposurePolicy { readonly minObservations: number }`
  - `function canExposeConfidenceScore(distribution: PenaltyDistribution, policy: ExposurePolicy): { readonly ok: boolean; readonly reasons: readonly string[] }`

- [ ] **Step 1: Write the failing test**

Append to `lib/core/confidence.test.ts`, again merging the new names into the existing `./confidence` import:

```ts
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
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/confidence.test.ts`
Expected: FAIL — `summarizePenalties is not a function`.

- [ ] **Step 3: Write the minimal implementation**

Append to `lib/core/confidence.ts`:

```ts
export interface LevelPenalty {
  readonly n: number;
  /** Points LOST on wrong answers, as a positive magnitude. */
  readonly penalty: number;
  /** Points FORGONE on correct answers: what a 'high' report would have earned, minus what was earned. */
  readonly forgone: number;
}

export interface PenaltyDistribution {
  readonly n: number;
  readonly totalPenalty: number;
  readonly totalForgone: number;
  readonly penaltyPerAnswer: number;
  /** Share of all lost points that came from wrong answers reported 'high'. */
  readonly overconfidenceShare: number;
  /** Share of all forgone points that came from correct answers reported 'low'. */
  readonly underconfidenceShare: number;
  readonly byLevel: Readonly<Record<ConfidenceLevel, LevelPenalty>>;
}

const MAX_CORRECT_SCORE = CBM_MATRIX.high.correct;

/**
 * 7.4, fairness: Rainsford & Foster 2025 found gender explained 17.2% of the
 * variance in confidence reporting, and the loss ran through BOTH channels —
 * over-confidence on errors and under-confidence on correct answers. A single
 * "total points" figure hides that, so the two are counted separately and split
 * by level. This function does not know about the learner; grouping by any
 * demographic attribute is the caller's job, on data this module never sees.
 */
export function summarizePenalties(
  observations: readonly ConfidenceObservation[],
): PenaltyDistribution {
  if (observations.length === 0) {
    throw new RangeError('summarizePenalties needs at least one observation');
  }

  const byLevel: Record<ConfidenceLevel, { n: number; penalty: number; forgone: number }> = {
    low: { n: 0, penalty: 0, forgone: 0 },
    medium: { n: 0, penalty: 0, forgone: 0 },
    high: { n: 0, penalty: 0, forgone: 0 },
  };

  for (const observation of observations) {
    const bucket = byLevel[requireLevel(observation.level)];
    const score = scoreConfidence(observation);
    bucket.n += 1;
    if (observation.correct) {
      bucket.forgone += MAX_CORRECT_SCORE - score;
    } else {
      bucket.penalty += -score;
    }
  }

  const totalPenalty = byLevel.low.penalty + byLevel.medium.penalty + byLevel.high.penalty;
  const totalForgone = byLevel.low.forgone + byLevel.medium.forgone + byLevel.high.forgone;

  return {
    n: observations.length,
    totalPenalty,
    totalForgone,
    penaltyPerAnswer: totalPenalty / observations.length,
    // A clean sample divides by zero. 0 is the honest answer: there is no share
    // of nothing. NaN would silently poison every downstream comparison.
    overconfidenceShare: totalPenalty === 0 ? 0 : byLevel.high.penalty / totalPenalty,
    underconfidenceShare: totalForgone === 0 ? 0 : byLevel.low.forgone / totalForgone,
    byLevel: Object.freeze({
      low: Object.freeze({ ...byLevel.low }),
      medium: Object.freeze({ ...byLevel.medium }),
      high: Object.freeze({ ...byLevel.high }),
    }),
  };
}

export interface ExposurePolicy {
  /**
   * How many real answers must be measured before the score may reach a learner.
   * Required, with NO default: 7.4 mandates the measurement and names no number.
   */
  readonly minObservations: number;
}

/**
 * THE GATE. 40-decisions 4.4.3: no readiness estimate is shown before it is
 * calibrated on real data. Hendriks et al. 2019 found no effect of this score on
 * outcomes, so exposing it early would show a learner a number that costs them
 * something and buys them nothing. Any future UI reads this before rendering.
 */
export function canExposeConfidenceScore(
  distribution: PenaltyDistribution,
  policy: ExposurePolicy,
): { readonly ok: boolean; readonly reasons: readonly string[] } {
  if (!Number.isInteger(policy.minObservations) || policy.minObservations < 1) {
    throw new RangeError(
      `policy.minObservations must be a whole number >= 1, got ${policy.minObservations}`,
    );
  }
  const reasons: string[] = [];
  if (distribution.n < policy.minObservations) {
    reasons.push(`sample too small: ${distribution.n} < ${policy.minObservations}`);
  }
  return { ok: reasons.length === 0, reasons: Object.freeze(reasons) };
}
```

- [ ] **Step 4: Run and confirm green**

Run: `npx vitest run lib/core/confidence.test.ts`
Expected: PASS, 26 tests.

- [ ] **Step 5: Run one mutation**

Change `overconfidenceShare: totalPenalty === 0 ? 0 : ...` to always divide. Re-run.
Expected: `returns 0 and not NaN for a flawless sample` fails with `NaN`. Restore, re-run green.

- [ ] **Step 6: Run the full verification chain**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```
Expected: `tsc` silent · `check:core` prints `OK` · vitest green with the file count up by 1 and the test count up by 26 from the C-0152 baseline of **1,259 in 80 files** · `next build` exits 0.
⛔ Do not claim any of these pass without the output in the same message.

- [ ] **Step 7: Commit and close the task**

Update `plan/50-tasks.md` T-033 → 🟣, `plan/30-architecture.md`, `plan/00-control.md` (CYCLE_ID, `NEXT_AGENT=CRITIC`, release the lock, `MILESTONE_TICKS` +1) and the 0.1 log line.

```bash
git add lib/core/confidence.ts lib/core/confidence.test.ts plan/ docs/
git commit -m "loop(DEV): C-XXXX penalty distribution + exposure gate, T-033 done (4/4)"
git push origin dev
```

---

## Self-Review

**1. Spec coverage — § 7.4, line by line:**

| 7.4 requirement | Task |
|---|---|
| the six-cell matrix, wrong+low = 0 | 1 |
| three confidence levels, not two | 1 |
| crossover points 67% / 80% | 1 (derived, ⛔ not restated) |
| "measure calibration — the gap between mean confidence and actual accuracy" | 2 |
| Brier `BS = Σ(dⱼ−fⱼ)²/N` **plus** a signed bias | 2 |
| a high-confidence error returns in < 1 week | 3 |
| measure the penalty distribution before this affects what the learner sees | 4 |
| the score is measurement/feedback, ⛔ never sold as a proven improvement engine | 4 (`canExposeConfidenceScore`) + the module docblock |
| "an over-confident user gets a dedicated UX intervention" | ⛔ **out of scope, deliberately.** UX is the PM's decision (`40-decisions.md`). This plan produces the `direction` field such an intervention would read; it does ⛔ not decide a screen. |

**2. Placeholder scan:** no "TBD", no "add appropriate error handling", no "tests as in Task N". Every test block is runnable code; every expected number is computed in a comment directly above it.

**3. Type consistency:** `ConfidenceLevel`, `ConfidenceObservation`, `CBM_MATRIX`, `requireLevel`, `requireProbability` are defined in Task 1 and used under the same names in Tasks 2 and 4. `CalibrationPolicy.levelProbability` (Task 2) is the only consumer of `BAND_MIDPOINT_PROBABILITY`. `PenaltyDistribution` (Task 4) is the only input to `canExposeConfidenceScore`. `scheduleReview` / `SchedulerState` / `addDaysIso` / `MIN_EASINESS` in Task 3 match the exports of `lib/core/scheduler.ts` on `dev` at the time of writing.

**4. One risk named up front:** Task 3's sweep asserts a property of code this plan does not own. It is expected to pass on the first run (a lapse resets to 1 day). If it fails, ⛔ the assertion is not to be softened — that is a 7.4 violation in `scheduler.ts`, it belongs in `plan/60-findings.md` as a new finding, and T-033 continues on Task 4.
