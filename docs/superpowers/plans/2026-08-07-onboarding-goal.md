# Onboarding: a Time Goal, Not a Score — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder `/onboarding` screen with the real first question — **"how many minutes a day"** — persist the answer, and finally measure the screen itself in `check:mobile` instead of measuring the login screen by accident.

**Architecture:** All the onboarding rules (which options exist, what the default is, what a legal exam date is, what a legal target score is) live in one pure module, `lib/core/onboarding.ts`. The database columns land first, then the API route that validates through that module, then the screen that posts to it, then the layout fixture that lets the harness measure it. Nothing about the answer set is stated twice: the radio options, the SQL `check` constraint and the API validation all read the same exported constant, and a test fails when the SQL and the TypeScript drift apart.

**Tech Stack:** TypeScript (strict, `noUncheckedIndexedAccess`), Next.js 16 App Router, Tailwind with semantic tokens only, Vitest, Postgres/Supabase SQL migrations, Playwright (via `scripts/verify-mobile.mjs`).

## Global Constraints

Copied verbatim from the standing rules — every task below inherits all of them.

- `/lib/core/` is pure: ⛔ no `react` import · ⛔ `window` · ⛔ `document` · ⛔ `localStorage` · ⛔ `sessionStorage` · ⛔ `process.env` · ⛔ `fetch(`. Enforced by `npm run check:core`.
- A UI component never touches the database. Everything goes through `/app/api/` and `lib/api/client.ts`.
- Mobile-First at 375px · tap targets ≥ 44px · RTL with bidi isolation · PWA · TypeScript with no `any`.
- ⛔ No raw `slate-*` Tailwind classes in `app/**` or `components/**` — semantic tokens only (`surface`, `surface-raised`, `ink`, `ink-muted`, `border-subtle`, `border-strong`, `brand`, `brand-surface`, `brand-on`, `success`, `danger`). Scanned by `lib/core/palette.test.ts`.
- ⛔ No vertical centring of a screen's heading. `main h1` must sit ≤ 48px below the header. Measured by `npm run check:mobile`.
- ⛔ No purple gradient · no uniform corner radii · no Inter (RULES § 0.8 · F-011).
- ⛔ Only `components/EnWord.tsx` may write `lang="en"` / `dir="ltr"` / `.ltr-inline`, and `components/LatinField.tsx` is the only Latin **input** (TD-5). Every new English field needs its **own positive assertion** in `components/EnWord.test.ts` — a negative scan cannot see markup that is absent (that is how TD-14 was born).
- ⛔ No new npm dependency in this plan.
- ⛔ No invented learning content. Nothing in this plan writes a translation, an example sentence or a word pair. The Hebrew strings here are interface copy, not learning content.
- ⛔ Never commit with `[skip ci]` (RULES § 0.7).
- `docs/api-contract.md` is updated in the **same commit** as any endpoint change.
- `tsconfig.json` has `noUncheckedIndexedAccess: true`. `array[0]` is `T | undefined`. In test files do **not** reach for `!` — index through a named helper that throws, exactly as `lib/core/coverage.test.ts` and `lib/core/dataSources.test.ts` do. This is the trap that cost C-0023 twenty `TS2532` errors.
- Verification command for every task: `npm run typecheck && npm run check:core && npm test && npm run build`. Task 4 additionally runs `npm run check:mobile`.

## The evidence this plan is built on

Every product decision below traces to a line already in the repo. Nothing here is researched fresh, and nothing is a taste call.

| fact | where it is already written |
|---|---|
| The primary question is **minutes per day**, not target score. Task-based goals moved completion (p=0.017); performance goals did nothing (p=0.452), NBER w23638 | `plan/20-alerts.md` R-012 · `plan/15-syllabus-digest.md` § "כללי עיצוב מבוססי-ראיות" (1.9 E2 · E3) |
| The default must be **modest (5–10 min)**. ~40% of Duolingo churners had picked the "intensive" goal | `plan/20-alerts.md` R-012 · `plan/50-tasks.md` T-029 |
| The **exam date stays** — it is the input to engine 7.1 | `plan/50-tasks.md` T-029 |
| Target score is an **optional field, never shown as a motivator** | `plan/50-tasks.md` T-029 · R-012 |
| The Amiram score scale is **50–150** | `plan/15-syllabus-digest.md` A5 (nite.org.il) |
| `/onboarding` is currently **not measured**: the harness runs without Supabase env, so the route answers `307 → /login?expired=1` and all twelve "ok /onboarding" lines measure the login screen | `plan/30-architecture.md` TD-13 (verified live in C-0013) |

⚠️ **Out of scope, deliberately.** A7 also requires an "at which institution?" question. That belongs to **T-003**, which is `⛔ ממתין לתוכנית UX מה-PM`, and this plan does not touch it. The column is *not* added speculatively either — YAGNI, and a nullable column nobody writes to is indistinguishable from a bug.

## File Structure

| file | responsibility | task |
|---|---|---|
| `lib/core/onboarding.ts` | **new.** The whole answer model: options, default, validation, the days-until-exam arithmetic, and the Hebrew copy. Pure. | 1 |
| `lib/core/onboarding.test.ts` | **new.** The evidence encoded as assertions — including "there is no option above 20". | 1 |
| `supabase/migrations/0004_onboarding_answers.sql` | **new.** Four nullable columns on `profiles` + the `check` constraints. | 2 |
| `lib/supabase/onboarding.test.ts` | **new.** Migration contract, and the SQL↔TypeScript cross-check on the minute options and the score range. | 2 |
| `app/api/profile/route.ts` | **new.** `POST /api/profile` — the only way an answer reaches the database. | 2 |
| `docs/api-contract.md` | **modify.** Document `POST /api/profile` in the same commit. | 2 |
| `components/LatinField.tsx` | **modify.** Widen `name` and `inputMode` so the numeric target-score field goes through the one Latin input (TD-5) instead of around it. | 3 |
| `components/OnboardingForm.tsx` | **new.** `'use client'` — the radio group, the date field, the optional score field, the submit. | 3 |
| `app/onboarding/page.tsx` | **modify.** Replace the placeholder prose with the form; keep the address band and the sign-out control. | 3 |
| `components/EnWord.test.ts` | **modify.** Positive assertion for the one new Latin field. | 3 |
| `app/dev/onboarding/page.tsx` | **new.** Layout fixture — the form with no session, so the harness measures it. | 4 |
| `app/dev/onboarding/layout.tsx` | **new.** `robots: noindex` — a fixture must never be a search result. | 4 |
| `scripts/verify-mobile.mjs` | **modify.** Add `/dev/onboarding` to `ROUTES` and assert the radio group, the default, and the 44px targets. | 4 |
| `plan/30-architecture.md` | **modify.** Close TD-13. | 4 |

## Backlog mapping

| backlog item | tasks | done when |
|---|---|---|
| **T-029** — minutes-per-day is the primary question; exam date stays; target score optional; modest default | 1, 2, 3 | the screen renders the radio group with 5 preselected, and `onboarding.test.ts` fails if the default ever becomes the largest option |
| **T-003 (persistence slice only)** — the answers reach a row | 2 | `POST /api/profile` writes `daily_minutes` / `exam_date` / `target_score` / `onboarded_at` under RLS |
| **TD-13** — `/onboarding` is not measured by `check:mobile` | 4 | `/dev/onboarding` is in `ROUTES` and the harness fails when the radio group is absent or a target is < 44px |

---

### Task 1: The answer model

**Files:**
- Create: `lib/core/onboarding.ts`
- Create: `lib/core/onboarding.test.ts`

**Interfaces:**
- Consumes: nothing. This is the root of the plan.
- Produces:
  ```ts
  export type DailyMinutes = 5 | 10 | 20;
  export const DAILY_MINUTES_OPTIONS: readonly DailyMinutes[];   // [5, 10, 20]
  export const DEFAULT_DAILY_MINUTES: DailyMinutes;              // 5
  export const DAILY_MINUTES_LABELS_HE: Readonly<Record<DailyMinutes, string>>;
  export function isDailyMinutes(value: unknown): value is DailyMinutes;

  export const TARGET_SCORE_MIN = 50;      // A5
  export const TARGET_SCORE_MAX = 150;     // A5
  export const MAX_EXAM_HORIZON_DAYS = 1095;

  export type OnboardingRaw = {
    readonly dailyMinutes: unknown;
    readonly examDate: unknown;     // '' means "skipped"
    readonly targetScore: unknown;  // '' means "skipped"
  };

  export type OnboardingAnswers = {
    readonly dailyMinutes: DailyMinutes;
    readonly examDate: string | null;   // 'YYYY-MM-DD'
    readonly targetScore: number | null;
  };

  export type OnboardingFieldErrors = {
    readonly dailyMinutes?: string;
    readonly examDate?: string;
    readonly targetScore?: string;
  };

  export type OnboardingCheck =
    | { readonly ok: true;  readonly answers: OnboardingAnswers }
    | { readonly ok: false; readonly fieldErrors: OnboardingFieldErrors };

  export function isIsoDate(value: string): boolean;
  export function daysUntilExam(examDate: string, today: string): number;
  export function daysUntilExamHe(days: number): string;
  export function checkOnboarding(raw: OnboardingRaw, today: string): OnboardingCheck;

  export const ONBOARDING_TITLE_HE: string;
  export const DAILY_MINUTES_QUESTION_HE: string;
  export const DAILY_MINUTES_HELP_HE: string;
  export const EXAM_DATE_QUESTION_HE: string;
  export const EXAM_DATE_HELP_HE: string;
  export const TARGET_SCORE_QUESTION_HE: string;
  export const TARGET_SCORE_HELP_HE: string;
  export const ONBOARDING_SUBMIT_HE: string;
  ```

**Two decisions this task locks in, and why.**

1. **There is no option above 20 minutes.** E3 is not "offer a modest default among ambitious options" — the measured harm came from learners *choosing* the intensive goal. An option that exists will be chosen by the people most at risk of quitting. If a learner wants more, nothing stops them studying longer; the goal is a floor, not a cap.
2. **`today` is a parameter, never `new Date()`.** A date-dependent function that reads the clock is a test that passes until the day it doesn't, and engine 7.1 will want to ask "how many days were left *at the time*" anyway. The route passes the clock in; `lib/core` stays a function of its arguments.

- [x] **Step 1: Write the failing test**

Create `lib/core/onboarding.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DAILY_MINUTES_LABELS_HE,
  DAILY_MINUTES_OPTIONS,
  DEFAULT_DAILY_MINUTES,
  MAX_EXAM_HORIZON_DAYS,
  TARGET_SCORE_MAX,
  TARGET_SCORE_MIN,
  checkOnboarding,
  daysUntilExam,
  daysUntilExamHe,
  isDailyMinutes,
  isIsoDate,
  type DailyMinutes,
  type OnboardingAnswers,
} from './onboarding';

const TODAY = '2026-08-07';

/**
 * noUncheckedIndexedAccess makes every `check.answers` access on a union a
 * TS2339 wall. A named narrowing helper that throws is the pattern the rest of
 * lib/core uses (coverage.test.ts, dataSources.test.ts) — never `!`.
 */
function answersOf(raw: {
  dailyMinutes: unknown;
  examDate: unknown;
  targetScore: unknown;
}): OnboardingAnswers {
  const check = checkOnboarding(raw, TODAY);
  if (!check.ok) throw new Error(`expected ok, got ${JSON.stringify(check.fieldErrors)}`);
  return check.answers;
}

function errorsOf(raw: {
  dailyMinutes: unknown;
  examDate: unknown;
  targetScore: unknown;
}): Record<string, string | undefined> {
  const check = checkOnboarding(raw, TODAY);
  if (check.ok) throw new Error('expected field errors, got a valid answer set');
  return check.fieldErrors;
}

describe('the daily-minutes goal (R-012 · 1.9 E2/E3)', () => {
  it('offers exactly three options and no "intensive" one', () => {
    // E3: ~40% of churners had picked the intensive goal. An option that exists
    // gets chosen by the people most likely to quit over it, so 20 is the top.
    expect([...DAILY_MINUTES_OPTIONS]).toEqual([5, 10, 20]);
  });

  it('defaults to the SMALLEST option, never the largest', () => {
    expect(DEFAULT_DAILY_MINUTES).toBe(5);
    const largest = [...DAILY_MINUTES_OPTIONS].sort((a, b) => b - a)[0];
    expect(DEFAULT_DAILY_MINUTES).not.toBe(largest);
    expect(DEFAULT_DAILY_MINUTES).toBeLessThanOrEqual(10); // T-029: "5–10 דק'"
  });

  it('labels every option, in Hebrew, with no option left unlabelled', () => {
    for (const option of DAILY_MINUTES_OPTIONS) {
      const label = DAILY_MINUTES_LABELS_HE[option];
      expect(label, `option ${option} has no Hebrew label`).toBeTruthy();
      expect(label).toMatch(/[֐-׿]/);
      expect(label).toContain(String(option));
    }
  });

  it('accepts only the literal option values', () => {
    expect(isDailyMinutes(5)).toBe(true);
    expect(isDailyMinutes(20)).toBe(true);
    // A radio value arrives from the DOM as a string; accepting it here is how
    // a string ends up in a smallint column.
    expect(isDailyMinutes('10')).toBe(false);
    expect(isDailyMinutes(15)).toBe(false);
    expect(isDailyMinutes(0)).toBe(false);
    expect(isDailyMinutes(null)).toBe(false);
    expect(isDailyMinutes(undefined)).toBe(false);
  });

  it('rejects a payload whose goal is not an option', () => {
    expect(errorsOf({ dailyMinutes: 45, examDate: '', targetScore: '' }).dailyMinutes).toMatch(
      /[֐-׿]/,
    );
  });
});

describe('the exam date (stays — it feeds engine 7.1)', () => {
  it('accepts a future ISO date', () => {
    expect(answersOf({ dailyMinutes: 10, examDate: '2026-09-10', targetScore: '' }).examDate).toBe(
      '2026-09-10',
    );
  });

  it('treats an empty date as skipped, not as invalid', () => {
    // "I do not have a date yet" is the common case, and blocking on it would
    // put a wall in front of the only question that matters.
    expect(answersOf({ dailyMinutes: 5, examDate: '', targetScore: '' }).examDate).toBeNull();
  });

  it('accepts an exam that is today', () => {
    expect(answersOf({ dailyMinutes: 5, examDate: TODAY, targetScore: '' }).examDate).toBe(TODAY);
  });

  it('rejects a date that has already passed', () => {
    expect(errorsOf({ dailyMinutes: 5, examDate: '2026-08-06', targetScore: '' }).examDate)
      .toBeTruthy();
  });

  it('rejects a mistyped year instead of scheduling around the year 2062', () => {
    const days = daysUntilExam('2062-09-07', TODAY);
    expect(days).toBeGreaterThan(MAX_EXAM_HORIZON_DAYS);
    expect(errorsOf({ dailyMinutes: 5, examDate: '2062-09-07', targetScore: '' }).examDate)
      .toBeTruthy();
  });

  it('rejects text that is not an ISO date', () => {
    expect(isIsoDate('07/09/2026')).toBe(false);
    expect(isIsoDate('2026-9-10')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-02-30')).toBe(false); // parses, but is not a real day
    expect(isIsoDate('2026-09-10')).toBe(true);
    expect(errorsOf({ dailyMinutes: 5, examDate: '07/09/2026', targetScore: '' }).examDate)
      .toBeTruthy();
  });

  it('counts calendar days across a DST boundary', () => {
    // Israel moves the clock on 2026-03-27. ms/86_400_000 on local Dates gives
    // 2.958… here and floors to 2 — a whole day of the learner's schedule.
    expect(daysUntilExam('2026-03-30', '2026-03-27')).toBe(3);
    expect(daysUntilExam(TODAY, TODAY)).toBe(0);
    expect(daysUntilExam('2026-08-06', TODAY)).toBe(-1);
  });

  it('phrases the countdown in Hebrew without a stray plural', () => {
    expect(daysUntilExamHe(0)).toContain('היום');
    expect(daysUntilExamHe(1)).toContain('מחר');
    expect(daysUntilExamHe(34)).toContain('34');
  });
});

describe('the target score (optional — never a motivator, R-012)', () => {
  it('is genuinely optional', () => {
    expect(answersOf({ dailyMinutes: 5, examDate: '', targetScore: '' }).targetScore).toBeNull();
  });

  it('accepts both ends of the published 50–150 scale (A5)', () => {
    expect(TARGET_SCORE_MIN).toBe(50);
    expect(TARGET_SCORE_MAX).toBe(150);
    expect(answersOf({ dailyMinutes: 5, examDate: '', targetScore: '50' }).targetScore).toBe(50);
    expect(answersOf({ dailyMinutes: 5, examDate: '', targetScore: '150' }).targetScore).toBe(150);
  });

  it('rejects a score outside the scale, and says the scale in the message', () => {
    const message = errorsOf({ dailyMinutes: 5, examDate: '', targetScore: '49' }).targetScore;
    expect(message).toBeTruthy();
    expect(message).toContain('50');
    expect(message).toContain('150');
    expect(errorsOf({ dailyMinutes: 5, examDate: '', targetScore: '151' }).targetScore).toBeTruthy();
  });

  it('rejects a non-integer rather than silently truncating it', () => {
    // Number('100.5') is 100.5 and a smallint column would round it. Rounding a
    // learner's stated goal without telling them is a lie, however small.
    expect(errorsOf({ dailyMinutes: 5, examDate: '', targetScore: '100.5' }).targetScore)
      .toBeTruthy();
    expect(errorsOf({ dailyMinutes: 5, examDate: '', targetScore: 'מאה' }).targetScore).toBeTruthy();
    // Number('') is 0 and Number(' ') is 0 — both would pass a naive isNaN gate
    // and then fail the range check with the wrong message.
    expect(answersOf({ dailyMinutes: 5, examDate: '', targetScore: '  ' }).targetScore).toBeNull();
  });
});

describe('the whole payload', () => {
  it('reports every bad field at once, not the first one', () => {
    const errors = errorsOf({ dailyMinutes: 45, examDate: '07/09/2026', targetScore: '9' });
    expect(errors.dailyMinutes).toBeTruthy();
    expect(errors.examDate).toBeTruthy();
    expect(errors.targetScore).toBeTruthy();
  });

  it('does not mutate or widen the option list it exports', () => {
    expect(Object.isFrozen(DAILY_MINUTES_OPTIONS)).toBe(true);
    const beforeLength: number = DAILY_MINUTES_OPTIONS.length;
    checkOnboarding({ dailyMinutes: 5, examDate: '', targetScore: '' }, TODAY);
    expect(DAILY_MINUTES_OPTIONS.length).toBe(beforeLength);
  });
});
```

- [x] **Step 2: Run the test and watch it fail for the right reason**

Run: `npx vitest run lib/core/onboarding.test.ts`
Expected: FAIL — `Failed to resolve import "./onboarding"`. Not a type error, not an assertion error: the module does not exist yet.

- [x] **Step 3: Write the module**

Create `lib/core/onboarding.ts`:

```ts
/**
 * The onboarding answer model — pure. No React, no DOM, no network, no env.
 *
 * R-012 (NBER w23638, N≈4,000): task-based goals moved completion by 0.5
 * practice tests (p=0.017); performance goals — "what score do you want" —
 * moved nothing (p=0.452). So the primary question here is minutes per day.
 * The exam date stays because engine 7.1 schedules against it, and the target
 * score survives only as an optional field that is never shown as a motivator.
 *
 * `today` is always a parameter. A module that reads the clock is a test that
 * passes until the day it doesn't, and 7.1 needs "days left *as of when*"
 * anyway.
 */

export type DailyMinutes = 5 | 10 | 20;

/**
 * Three options, top of 20. E3: ~40% of Duolingo's churners had picked the
 * intensive goal — the harm came from choosing it, so the option that would be
 * chosen does not exist. Nothing stops a learner studying longer; this is a
 * floor, not a cap.
 */
export const DAILY_MINUTES_OPTIONS: readonly DailyMinutes[] = Object.freeze([5, 10, 20] as const);

/** T-029: "ברירת מחדל צנועה (5–10 דק')". The smallest, deliberately. */
export const DEFAULT_DAILY_MINUTES: DailyMinutes = 5;

export const DAILY_MINUTES_LABELS_HE: Readonly<Record<DailyMinutes, string>> = Object.freeze({
  5: '5 דקות ביום',
  10: '10 דקות ביום',
  20: '20 דקות ביום',
});

export function isDailyMinutes(value: unknown): value is DailyMinutes {
  return (
    typeof value === 'number' &&
    (DAILY_MINUTES_OPTIONS as readonly number[]).includes(value)
  );
}

/** A5 — the Amiram scale is 50–150, identical to the psychometric English section. */
export const TARGET_SCORE_MIN = 50;
export const TARGET_SCORE_MAX = 150;

/** Three years. Past this, the realistic explanation is a mistyped year. */
export const MAX_EXAM_HORIZON_DAYS = 1095;

export type OnboardingRaw = {
  readonly dailyMinutes: unknown;
  readonly examDate: unknown;
  readonly targetScore: unknown;
};

export type OnboardingAnswers = {
  readonly dailyMinutes: DailyMinutes;
  readonly examDate: string | null;
  readonly targetScore: number | null;
};

export type OnboardingFieldErrors = {
  readonly dailyMinutes?: string;
  readonly examDate?: string;
  readonly targetScore?: string;
};

export type OnboardingCheck =
  | { readonly ok: true; readonly answers: OnboardingAnswers }
  | { readonly ok: false; readonly fieldErrors: OnboardingFieldErrors };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True only for a real calendar day written as YYYY-MM-DD. */
export function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  // Date.UTC rolls 2026-02-30 forward to March 2; comparing the parts back is
  // what turns "parses" into "is a real day".
  const asDate = new Date(Date.UTC(y, m - 1, d));
  return (
    asDate.getUTCFullYear() === y && asDate.getUTCMonth() === m - 1 && asDate.getUTCDate() === d
  );
}

function utcMidnight(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number);
  return Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1);
}

/**
 * Whole calendar days from `today` to `examDate`. Both are anchored to UTC
 * midnight on purpose: local Dates across Israel's 2026-03-27 clock change are
 * 2.958… days apart and floor to 2.
 */
export function daysUntilExam(examDate: string, today: string): number {
  return Math.round((utcMidnight(examDate) - utcMidnight(today)) / 86_400_000);
}

export function daysUntilExamHe(days: number): string {
  if (days <= 0) return 'המבחן היום';
  if (days === 1) return 'המבחן מחר';
  return `נשארו ${days} ימים למבחן`;
}

export const ONBOARDING_TITLE_HE = 'נתחיל מהזמן שלך';
export const DAILY_MINUTES_QUESTION_HE = 'כמה דקות ביום תוכל ללמוד?';
export const DAILY_MINUTES_HELP_HE =
  'אפשר לשנות בכל שלב. עדיף מעט בכל יום מהרבה פעם בשבוע.';
export const EXAM_DATE_QUESTION_HE = 'מתי המבחן?';
export const EXAM_DATE_HELP_HE = 'עוד לא יודע? אפשר להשאיר ריק ולמלא בהמשך.';
export const TARGET_SCORE_QUESTION_HE = 'ציון יעד (לא חובה)';
export const TARGET_SCORE_HELP_HE = `הסולם הוא ${TARGET_SCORE_MIN}–${TARGET_SCORE_MAX}.`;
export const ONBOARDING_SUBMIT_HE = 'שמירה והתחלה';

const MESSAGES_HE = {
  dailyMinutes: 'בחר אחת מהאפשרויות.',
  examDateFormat: 'תאריך לא תקין.',
  examDatePast: 'התאריך הזה כבר עבר.',
  examDateFar: 'התאריך רחוק מדי — בדוק את השנה.',
  targetScoreShape: 'הזן מספר שלם.',
  targetScoreRange: `ציון היעד הוא בין ${TARGET_SCORE_MIN} ל-${TARGET_SCORE_MAX}.`,
} as const;

/**
 * Validates one submitted answer set. Every bad field is reported, not just the
 * first: a form that reveals its problems one at a time is a form people
 * abandon.
 */
export function checkOnboarding(raw: OnboardingRaw, today: string): OnboardingCheck {
  const fieldErrors: {
    dailyMinutes?: string;
    examDate?: string;
    targetScore?: string;
  } = {};

  const minutesRaw = typeof raw.dailyMinutes === 'string' ? Number(raw.dailyMinutes) : raw.dailyMinutes;
  const dailyMinutes = isDailyMinutes(minutesRaw) ? minutesRaw : null;
  if (dailyMinutes === null) fieldErrors.dailyMinutes = MESSAGES_HE.dailyMinutes;

  let examDate: string | null = null;
  const examRaw = typeof raw.examDate === 'string' ? raw.examDate.trim() : '';
  if (examRaw !== '') {
    if (!isIsoDate(examRaw)) {
      fieldErrors.examDate = MESSAGES_HE.examDateFormat;
    } else {
      const days = daysUntilExam(examRaw, today);
      if (days < 0) fieldErrors.examDate = MESSAGES_HE.examDatePast;
      else if (days > MAX_EXAM_HORIZON_DAYS) fieldErrors.examDate = MESSAGES_HE.examDateFar;
      else examDate = examRaw;
    }
  }

  let targetScore: number | null = null;
  const scoreRaw = typeof raw.targetScore === 'string' ? raw.targetScore.trim() : raw.targetScore;
  if (scoreRaw !== '' && scoreRaw !== null && scoreRaw !== undefined) {
    // /^\d+$/ rather than Number.isInteger(Number(x)): Number('') is 0,
    // Number(' ') is 0, and Number('1e2') is 100 — all three would slip a
    // value the learner never typed into a smallint column.
    const text = String(scoreRaw);
    if (!/^\d+$/.test(text)) {
      fieldErrors.targetScore = MESSAGES_HE.targetScoreShape;
    } else {
      const value = Number(text);
      if (value < TARGET_SCORE_MIN || value > TARGET_SCORE_MAX) {
        fieldErrors.targetScore = MESSAGES_HE.targetScoreRange;
      } else {
        targetScore = value;
      }
    }
  }

  if (Object.keys(fieldErrors).length > 0 || dailyMinutes === null) {
    return { ok: false, fieldErrors };
  }
  return { ok: true, answers: { dailyMinutes, examDate, targetScore } };
}
```

- [x] **Step 4: Run the test and verify it passes**

Run: `npx vitest run lib/core/onboarding.test.ts`
Expected: PASS, all cases.

- [x] **Step 5: Prove the two load-bearing tests actually bear load**

Apply each mutation, run the suite, confirm the **named** test fails, then revert.

```bash
# (a) The default becomes the largest option — the exact E3 failure.
sed -i "s/export const DEFAULT_DAILY_MINUTES: DailyMinutes = 5;/export const DEFAULT_DAILY_MINUTES: DailyMinutes = 20;/" lib/core/onboarding.ts
npx vitest run lib/core/onboarding.test.ts   # expect: "defaults to the SMALLEST option, never the largest"
git checkout lib/core/onboarding.ts

# (b) Naive day arithmetic on local Dates — the DST bug.
#     ⚠️ CORRECTED IN C-0031. As written below, this mutation does NOT fail, twice over:
#       1. `new Date('2026-03-27')` is the date-only form, which ECMA-262 parses as UTC.
#          It is already DST-safe. The real hazard is the local-component constructor.
#       2. Even the correct mutation passed, because the container's TZ is UTC and UTC
#          has no DST at all. `vitest.config.ts` now pins `TZ: 'Asia/Jerusalem'`.
#     The mutation that actually bears load — replace the body of daysUntilExam with:
#       const [ey, em, ed] = examDate.split('-').map(Number);
#       const [ty, tm, td] = today.split('-').map(Number);
#       return Math.floor((new Date(ey ?? 0, (em ?? 1) - 1, ed ?? 1).getTime()
#         - new Date(ty ?? 0, (tm ?? 1) - 1, td ?? 1).getTime()) / 86_400_000);
#     then run; expect: "counts calendar days across a DST boundary" → expected 2 to be 3.
```

- [x] **Step 6: Run the full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: typecheck clean · `/lib/core purity: OK` · every test green · `Compiled successfully`.

- [x] **Step 7: Commit**

```bash
git add lib/core/onboarding.ts lib/core/onboarding.test.ts
git commit -m "feat(onboarding): the answer model — minutes/day, exam date, optional score (T-029)"
```

---

### Task 2: The columns and the endpoint

**Files:**
- Create: `supabase/migrations/0004_onboarding_answers.sql`
- Create: `lib/supabase/onboarding.test.ts`
- Create: `app/api/profile/route.ts`
- Modify: `docs/api-contract.md`

**Interfaces:**
- Consumes: `checkOnboarding`, `toIsoDateInZone`, `LEARNER_TIME_ZONE`, `DAILY_MINUTES_OPTIONS`, `TARGET_SCORE_MIN`, `TARGET_SCORE_MAX` from `lib/core/onboarding` (Task 1 + the C-0032 correction); `createRouteClient`, `readSupabaseEnv` from `lib/supabase/auth`.
- Produces:
  ```ts
  // POST /api/profile
  // request:  { dailyMinutes: number, examDate: string, targetScore: string }
  // 200:      { ok: true, next: '/study' }
  // 422:      { ok: false, fieldErrors: OnboardingFieldErrors }
  // 401:      { ok: false, code: 'session_expired' }
  // 503:      { ok: false, code: 'unavailable' }
  ```

**Why the migration is tested at all.** `lib/supabase/*.test.ts` cannot reach a live project — it asserts what we *ship*, exactly like `rls.test.ts` and `telemetry.test.ts`. The specific thing worth asserting here is the **cross-file** one: the SQL `check (daily_minutes in (5,10,20))` and `DAILY_MINUTES_OPTIONS` are the same fact written twice, and the day someone adds a 30-minute option in TypeScript, inserts start failing in production with a constraint violation nobody can trace. The test makes them fail in CI instead.

- [x] **Step 1: Write the failing migration-contract test**

Create `lib/supabase/onboarding.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DAILY_MINUTES_OPTIONS,
  TARGET_SCORE_MAX,
  TARGET_SCORE_MIN,
} from '../core/onboarding';

/**
 * Guards the T-029 columns where they can be guarded without a live project.
 * Same approach and same limits as rls.test.ts and telemetry.test.ts: this
 * proves what we ship, not what was applied. Applying it is a step in
 * docs/SETUP.md.
 */
const SOURCE = readFileSync('supabase/migrations/0004_onboarding_answers.sql', 'utf8');

/**
 * CORRECTED C-0032 — the plan originally scanned the raw file. Every assertion
 * below runs on the STATEMENTS, never on the file text, for two reasons:
 *  a. the migration's own header comment explains why `daily_minutes smallint
 *     not null` is forbidden, and therefore MATCHED the regex forbidding it —
 *     the suite went red on a correct migration (measured C-0032).
 *  b. the mirror image is the dangerous one: on raw text, the positive
 *     `alter table public.profiles ... daily_minutes` assertion is satisfied by
 *     a migration that only MENTIONS the column in a comment and never adds it.
 *     A guard a comment can satisfy guards nothing — that is F-007's shape.
 */
function withoutComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, '');
}

const MIGRATION = withoutComments(SOURCE);
const SQL = MIGRATION.toLowerCase();

describe('the onboarding columns', () => {
  it('adds all four columns to profiles, one statement each', () => {
    // One `alter` per column, the C-0029 lesson: the 120-character window below
    // never reaches the third column of a multi-column alter, so a test that
    // scans for it would pass on a migration that never added it.
    for (const column of ['daily_minutes', 'exam_date', 'target_score', 'onboarded_at']) {
      expect(SQL, `profiles.${column} is missing`).toMatch(
        new RegExp(`alter table public\\.profiles[\\s\\S]{0,120}${column}`),
      );
    }
  });

  it('leaves every answer nullable — a learner who has not answered is not a default', () => {
    // `daily_minutes smallint not null default 5` would make "never asked" and
    // "chose 5 minutes" the same row, and no later query could tell them apart.
    expect(SQL).not.toMatch(/daily_minutes\s+smallint\s+not null/);
    expect(SQL).not.toMatch(/exam_date\s+date\s+not null/);
    expect(SQL).not.toMatch(/target_score\s+smallint\s+not null/);
  });

  it('constrains daily_minutes to exactly the options the code offers', () => {
    const constraint = MIGRATION.match(/daily_minutes\s+in\s*\(([^)]*)\)/i)?.[1];
    expect(constraint, 'no `daily_minutes in (...)` constraint in the migration').toBeTruthy();
    const inSql = (constraint ?? '')
      .split(',')
      .map((n) => Number(n.trim()))
      .sort((a, b) => a - b);
    const inCode = [...DAILY_MINUTES_OPTIONS].sort((a, b) => a - b);
    expect(inSql).toEqual(inCode);
  });

  it('constrains target_score to the published 50-150 scale (A5)', () => {
    expect(SQL).toMatch(
      new RegExp(`target_score\\s+between\\s+${TARGET_SCORE_MIN}\\s+and\\s+${TARGET_SCORE_MAX}`),
    );
  });

  it('adds no new policy — 0001 already scopes profiles to the owner', () => {
    // A second `for update` policy on the same table is permissive-OR'd with
    // the first, so a sloppy one here would widen 0001 rather than narrow it.
    expect(SQL).not.toContain('create policy');
  });

  it('is re-appliable: every statement is guarded', () => {
    const alters = MIGRATION.match(/alter table public\.profiles\s+add column[^;]*/gi) ?? [];
    expect(alters.length).toBeGreaterThanOrEqual(4);
    for (const statement of alters) {
      expect(statement.toLowerCase(), `unguarded: ${statement}`).toContain('if not exists');
    }
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/supabase/onboarding.test.ts`
Expected: FAIL — `ENOENT ... supabase/migrations/0004_onboarding_answers.sql`.

- [x] **Step 3: Write the migration**

Create `supabase/migrations/0004_onboarding_answers.sql`:

```sql
-- T-029 · the onboarding answers on the learner's profile row
--
-- Apply in the Supabase SQL editor (or `supabase db push`) after 0001. RLS and
-- the owner-only policies already come from 0001_profiles.sql and are NOT
-- restated here: a second policy on the same table is OR'd with the first, so
-- restating it can only widen access, never narrow it.
--
-- Every column is nullable on purpose. `daily_minutes smallint not null
-- default 5` would make "never answered" and "chose 5 minutes" the same row,
-- and no later query could separate them again.
--
-- One statement per column, not one multi-column `alter`: `add column if not
-- exists` is per-clause anyway, and this way the migration ASSERTS all four
-- columns instead of assuming an earlier draft left some of them behind.

alter table public.profiles add column if not exists daily_minutes smallint;
alter table public.profiles add column if not exists exam_date     date;
alter table public.profiles add column if not exists target_score  smallint;
alter table public.profiles add column if not exists onboarded_at  timestamptz;

comment on column public.profiles.daily_minutes is
  'R-012: the task-based goal, in minutes. NULL = not asked yet.';
comment on column public.profiles.exam_date is
  'Input to engine 7.1. NULL = the learner has no date yet, which is allowed.';
comment on column public.profiles.target_score is
  'A5 scale 50-150. Optional, and never displayed as a motivator (R-012).';

-- `add column ... check (...)` is skipped wholesale when the column already
-- exists, so the constraints are added separately or they would ship missing on
-- any project that ran an earlier draft. Named, so re-applying is a no-op.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_daily_minutes_check') then
    alter table public.profiles
      add constraint profiles_daily_minutes_check
      check (daily_minutes is null or daily_minutes in (5,10,20));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_target_score_check') then
    alter table public.profiles
      add constraint profiles_target_score_check
      check (target_score is null or target_score between 50 and 150);
  end if;
end $$;
```

- [x] **Step 4: Run the migration test and verify it passes**

Run: `npx vitest run lib/supabase/onboarding.test.ts`
Expected: PASS.

- [x] **Step 5: Write the route**

Create `app/api/profile/route.ts`:

```ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LEARNER_TIME_ZONE, checkOnboarding, toIsoDateInZone } from '@/lib/core/onboarding';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/** POST /api/profile — see docs/api-contract.md */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }
  // F-004's lesson: `null`, an array and a bare primitive all parse fine and
  // would crash the property reads below with a 500 instead of the contract.
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  }
  const body = payload as Record<string, unknown>;

  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Validate AFTER the session check: an unauthenticated caller learns nothing
  // about which fields we accept.
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  // CORRECTED C-0032 — was `new Date().toISOString().slice(0, 10)`. Israel is
  // UTC+2/+3, so for the first two-to-three hours of every local day the UTC
  // date is still YESTERDAY (2026-09-09T21:30Z reads `2026-09-09` while the
  // learner's phone reads `2026-09-10`). A learner filling the form after
  // midnight on exam day could save a date already behind them, and engine 7.1
  // would be handed a negative day count. The clock is still read here, at the
  // edge — `toIsoDateInZone` is a pure function of its arguments.
  const today = toIsoDateInZone(new Date(), LEARNER_TIME_ZONE);
  const check = checkOnboarding(
    {
      dailyMinutes: body.dailyMinutes,
      examDate: body.examDate,
      targetScore: body.targetScore,
    },
    today,
  );
  if (!check.ok) {
    return NextResponse.json({ ok: false, fieldErrors: check.fieldErrors }, { status: 422 });
  }

  // update, not upsert: 0001's on_auth_user_created trigger already created the
  // row, and an upsert here would need to restate track_id — a second place
  // where the default lives is a second place for it to be wrong (D-016).
  const { error } = await supabase
    .from('profiles')
    .update({
      daily_minutes: check.answers.dailyMinutes,
      exam_date: check.answers.examDate,
      target_score: check.answers.targetScore,
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  return NextResponse.json({ ok: true, next: '/study' });
}
```

- [x] **Step 6: Document the endpoint in the same commit**

Append to `docs/api-contract.md`, after the `POST /api/auth/login` section:

```markdown
---

## POST /api/profile

שמירת תשובות ה-Onboarding על שורת הפרופיל של הלומד (T-029).
דורש סשן חי — הבדיקה נעשית **לפני** ולידציה של הגוף, כדי שקורא לא מאומת לא ילמד
אילו שדות מתקבלים.

**גוף הבקשה:**

```json
{ "dailyMinutes": 5, "examDate": "2026-09-10", "targetScore": "" }
```

`examDate` ו-`targetScore` ריקים (`""`) פירושם "דילג" ונשמרים כ-`NULL`.
`dailyMinutes` חייב להיות אחד מ-`5 | 10 | 20` (‏`DAILY_MINUTES_OPTIONS`).

**200 — נשמר:**

```json
{ "ok": true, "next": "/study" }
```

**422 — שדה לא תקין.** כל השדות הפגומים מדווחים יחד, לא הראשון בלבד:

```json
{ "ok": false, "fieldErrors": { "examDate": "התאריך הזה כבר עבר." } }
```

**401 — אין סשן:** `{ "ok": false, "code": "session_expired" }`
**503 — סביבה לא מוגדרת או כתיבה נכשלה:** `{ "ok": false, "code": "unavailable" }`
```

- [x] **Step 7: Prove the cross-file test bears load**

```bash
# Add a fourth option in TypeScript only — the drift the test exists for.
sed -i "s/Object.freeze(\[5, 10, 20\] as const)/Object.freeze([5, 10, 20, 30] as const)/" lib/core/onboarding.ts
npx vitest run lib/supabase/onboarding.test.ts   # expect: "constrains daily_minutes to exactly the options the code offers"
git checkout lib/core/onboarding.ts
```

(The `DailyMinutes` union will also need `| 30` for this to typecheck; revert both. If `git checkout` restores the file wholesale, nothing else is needed.)

- [x] **Step 8: Run the full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: all four green.

- [x] **Step 9: Commit**

```bash
git add supabase/migrations/0004_onboarding_answers.sql lib/supabase/onboarding.test.ts \
        app/api/profile/route.ts docs/api-contract.md
git commit -m "feat(onboarding): profiles columns + POST /api/profile (T-029, T-003 slice)"
```

---

### Task 3: The screen

**Files:**
- Modify: `components/LatinField.tsx` (the `LatinFieldProps` interface, lines 19–31)
- Create: `components/OnboardingForm.tsx`
- Modify: `app/onboarding/page.tsx`
- Modify: `components/EnWord.test.ts`

**Interfaces:**
- Consumes: everything Task 1 exports; `POST /api/profile` from Task 2; `apiPost` and `ApiUnreachableError` from `lib/api/client`; `RegisteredAddress` from `components/RegisteredAddress`.
- Produces:
  ```ts
  // components/LatinField.tsx — widened, nothing removed
  readonly name: 'email' | 'password' | 'target_score';
  readonly inputMode?: 'email' | 'numeric';

  // components/OnboardingForm.tsx
  export default function OnboardingForm(): React.ReactElement;   // 'use client', no props
  ```

**Why the target-score field goes through `LatinField`.** TD-5 was closed by making `LatinField` the *single* Latin input; a bare `<input dir="ltr">` here reopens it, and the compiler will not notice, because `enterKeyHint` is only required by `LatinFieldProps`. Widening two union members is a smaller change than a second field that has to remember four attributes on its own.

**Why the exam date is a native `<input type="date">` and not a Latin field.** A date input is a control with its own locale-aware UI, not a Latin text run — `dir="ltr"` on it fights the browser's own layout, and `inputMode` does nothing. It stays plain, with `min` set so the mobile picker cannot even offer a past day.

- [x] **Step 1: Widen `LatinField`**

In `components/LatinField.tsx`, change exactly two lines inside `LatinFieldProps`:

```ts
  readonly name: 'email' | 'password' | 'target_score';
```
```ts
  readonly inputMode?: 'email' | 'numeric';
```

Nothing else in the file changes: `enterKeyHint` stays required, `dir="ltr"`, `autoCapitalize="none"` and the class list are already correct for digits.

- [x] **Step 2: Write the failing EnWord assertion**

TD-14: a negative scan cannot see markup that is absent, so the new Latin field needs a *positive* assertion. Add to `components/EnWord.test.ts`:

```ts
it('routes the onboarding target-score input through LatinField, not a bare input', () => {
  // TD-5: LatinField is the ONLY Latin input. A bare <input dir="ltr"> here
  // would compile, render, and pass every other test in the suite while
  // quietly dropping enterKeyHint and autoCapitalize on a numeric keyboard.
  const source = readFileSync('components/OnboardingForm.tsx', 'utf8');
  expect(source).toContain('<LatinField');
  expect(source).toContain("name=\"target_score\"");
  expect(source).toContain('inputMode="numeric"');
  // The screen must not hand-roll a second Latin input beside it.
  expect(source).not.toMatch(/<input[^>]*dir="ltr"/);
});
```

If `readFileSync` is not already imported at the top of `components/EnWord.test.ts`, add `import { readFileSync } from 'node:fs';` — `lib/core/dataSources.test.ts` uses the same import for the same reason.

- [x] **Step 3: Run it and watch it fail**

Run: `npx vitest run components/EnWord.test.ts`
Expected: FAIL — `ENOENT ... components/OnboardingForm.tsx`.

- [x] **Step 4: Write the form**

Create `components/OnboardingForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import LatinField from '@/components/LatinField';
import { ApiUnreachableError, apiPost } from '@/lib/api/client';
// CORRECTED C-0033 — the plan's import list omitted `LEARNER_TIME_ZONE` and
// `toIsoDateInZone`, which the body two blocks below calls. As written the file
// did not compile. Both are added here.
import {
  DAILY_MINUTES_HELP_HE,
  DAILY_MINUTES_LABELS_HE,
  DAILY_MINUTES_OPTIONS,
  DAILY_MINUTES_QUESTION_HE,
  DEFAULT_DAILY_MINUTES,
  EXAM_DATE_HELP_HE,
  EXAM_DATE_QUESTION_HE,
  LEARNER_TIME_ZONE,
  ONBOARDING_SUBMIT_HE,
  TARGET_SCORE_HELP_HE,
  TARGET_SCORE_QUESTION_HE,
  toIsoDateInZone,
  type DailyMinutes,
  type OnboardingFieldErrors,
} from '@/lib/core/onboarding';

type SaveResponse = {
  readonly ok?: boolean;
  readonly next?: string;
  readonly fieldErrors?: OnboardingFieldErrors;
  readonly code?: string;
};

/**
 * T-029 — the first real question of the product.
 *
 * The order on screen is the order of the evidence: minutes per day is the
 * heading-level question (R-012), the exam date follows because 7.1 needs it,
 * and the target score is last, labelled "לא חובה", with no encouragement
 * attached to it. Nothing here shows a projected score or a readiness estimate
 * (40-decisions 4.4.3).
 *
 * Radios, not a slider or a segmented control: a radio is reachable by
 * keyboard, announced as a group by a screen reader, and each option is a real
 * 44px row without any measurement of ours.
 */
export default function OnboardingForm() {
  const [dailyMinutes, setDailyMinutes] = useState<DailyMinutes>(DEFAULT_DAILY_MINUTES);
  const [examDate, setExamDate] = useState('');
  const [targetScore, setTargetScore] = useState('');
  const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // The date picker must not offer a day the server will reject. CORRECTED
  // C-0032: with the UTC slice this comment was false for the first hours of
  // every local day — the picker floor sat a day BEHIND the server's floor and
  // offered exactly the day the route rejects. Same helper as the route.
  const todayIso = toIsoDateInZone(new Date(), LEARNER_TIME_ZONE);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setFieldErrors({});
    setFormError('');
    try {
      const result = await apiPost<SaveResponse>('/api/profile', {
        dailyMinutes,
        examDate,
        targetScore,
      });
      if (result.ok && result.next) {
        window.location.assign(result.next);
        return;
      }
      if (result.fieldErrors) setFieldErrors(result.fieldErrors);
      else setFormError('השמירה נכשלה. נסה שוב.');
    } catch (error) {
      setFormError(
        error instanceof ApiUnreachableError
          ? 'אין חיבור לרשת. התשובות לא נשמרו.'
          : 'השמירה נכשלה. נסה שוב.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6" data-onboarding-form>
      <fieldset className="flex flex-col gap-2 border-0 p-0" data-daily-minutes>
        <legend className="text-lg font-semibold text-ink">{DAILY_MINUTES_QUESTION_HE}</legend>
        <p className="text-base text-ink-muted">{DAILY_MINUTES_HELP_HE}</p>
        <div className="flex flex-col gap-2">
          {DAILY_MINUTES_OPTIONS.map((option) => (
            <label
              key={option}
              className="flex min-h-touch cursor-pointer items-center gap-3 rounded-xl border border-border-strong bg-surface-raised px-4 py-3 text-lg text-ink"
            >
              <input
                type="radio"
                name="daily_minutes"
                value={option}
                checked={dailyMinutes === option}
                onChange={() => setDailyMinutes(option)}
                className="h-5 w-5 accent-brand"
              />
              <span>{DAILY_MINUTES_LABELS_HE[option]}</span>
            </label>
          ))}
        </div>
        {fieldErrors.dailyMinutes && (
          <p className="text-base text-danger">{fieldErrors.dailyMinutes}</p>
        )}
      </fieldset>

      <label className="flex flex-col gap-1.5">
        <span className="text-lg font-semibold text-ink">{EXAM_DATE_QUESTION_HE}</span>
        <span className="text-base text-ink-muted">{EXAM_DATE_HELP_HE}</span>
        <input
          type="date"
          name="exam_date"
          value={examDate}
          min={todayIso}
          onChange={(event) => setExamDate(event.target.value)}
          className="min-h-touch w-full rounded-xl border border-border-strong bg-surface-raised px-4 py-3 text-lg text-ink outline-none focus:border-brand"
        />
        {fieldErrors.examDate && <span className="text-base text-danger">{fieldErrors.examDate}</span>}
      </label>

      <LatinField
        name="target_score"
        label={TARGET_SCORE_QUESTION_HE}
        type="text"
        value={targetScore}
        onChange={setTargetScore}
        autoComplete="off"
        enterKeyHint="go"
        inputMode="numeric"
        invalid={Boolean(fieldErrors.targetScore)}
        // CORRECTED C-0033 — the plan rendered the VALIDATION ERROR in
        // `text-ink-muted`, the same colour as the help text it replaces. The
        // learner would see "הזן מספר שלם." styled exactly like "הסולם הוא
        // 50–150." and have no signal that anything was rejected, while
        // `aria-invalid` (set by `invalid`) told a screen reader that it was.
        // Colour is not the only channel — the string itself changes too.
        footer={
          <span
            className={fieldErrors.targetScore ? 'text-base text-danger' : 'text-base text-ink-muted'}
          >
            {fieldErrors.targetScore ?? TARGET_SCORE_HELP_HE}
          </span>
        }
      />

      {formError && <p className="text-base text-danger">{formError}</p>}

      <button
        type="submit"
        disabled={saving}
        className="flex w-full min-h-touch items-center justify-center rounded-xl bg-brand px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90 disabled:opacity-60"
      >
        {saving ? 'שומר…' : ONBOARDING_SUBMIT_HE}
      </button>
    </form>
  );
}
```

⚠️ Before writing this, open `components/LatinField.tsx` and confirm the `footer` prop renders its node **below** the input and that `invalid` drives the border colour. If the current signature differs, match the file — the plan's job is the shape, the file is the authority.

- [x] **Step 5: Wire it into the screen**

In `app/onboarding/page.tsx`, replace the placeholder `<div className="flex flex-col gap-4">…</div>` block with:

```tsx
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight">{ONBOARDING_TITLE_HE}</h1>
        {user.email && <RegisteredAddress email={user.email} />}
        <OnboardingForm />
      </div>
```

Add the two imports (`OnboardingForm` from `@/components/OnboardingForm`, `ONBOARDING_TITLE_HE` from `@/lib/core/onboarding`) and delete the placeholder `<p>` that promised "השלב הזה עוד בבנייה" — it is no longer true, and stale copy is the cheapest lie a product tells. The header comment at the top of the file must be updated too: the paragraph describing this as a placeholder for T-003 becomes a note that T-029 landed the goal question and that the institution question is still T-003.

The sign-out `<form>` stays exactly where it is, below.

- [x] **Step 6: Run the tests**

Run: `npx vitest run components/EnWord.test.ts && npm test`
Expected: PASS. `lib/core/palette.test.ts` also passes — every class used above is a semantic token.

- [x] **Step 7: Prove the TD-5 assertion bears load**

```bash
# Swap LatinField for the bare input it exists to prevent.
# In components/OnboardingForm.tsx replace the <LatinField ... /> block with:
#   <input type="text" name="target_score" dir="ltr" inputMode="numeric"
#          value={targetScore} onChange={(e) => setTargetScore(e.target.value)} />
npx vitest run components/EnWord.test.ts   # expect: "routes the onboarding target-score input through LatinField"
git checkout components/OnboardingForm.tsx
```

- [x] **Step 8: Run the full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: all four green.

- [x] **Step 9: Commit**

```bash
git add components/LatinField.tsx components/OnboardingForm.tsx \
        components/EnWord.test.ts app/onboarding/page.tsx
git commit -m "feat(onboarding): the minutes-per-day screen (T-029)"
```

---

### Task 4: Measure the screen — closing TD-13

**Files:**
- Create: `app/dev/onboarding/page.tsx`
- Create: `app/dev/onboarding/layout.tsx`
- Modify: `scripts/verify-mobile.mjs` (the `ROUTES` array at line 25, and a new route-specific block beside the `/dev/identity` one at ~line 346)
- Modify: `plan/30-architecture.md` (the TD-13 row)

**Interfaces:**
- Consumes: `OnboardingForm` from Task 3.
- Produces: a route, `/dev/onboarding`, that renders the form with no session and no Supabase env — the only way the harness can see it.

**Why a fixture and not a fix.** TD-13's root cause is that the harness runs without Supabase env, so `readSupabaseEnv()` returns `null` and `/onboarding` answers `307 → /login?expired=1`. The alternative — standing up a real test project with real env vars in CI — is a much larger change that buys the same measurement. `/dev/identity` already established the pattern for exactly this reason, and reusing it means one convention rather than two.

**What this does and does not close.** It measures the **form**: the radio group, the default selection, tap targets, heading anchoring, no horizontal scroll, clean console, both colour schemes. It does **not** measure the session-guarded shell around it (the address band is already measured on `/dev/identity`). TD-13's row is updated to say precisely that rather than being deleted.

- [x] **Step 1: Create the fixture**

Create `app/dev/onboarding/layout.tsx`:

```tsx
import type { Metadata } from 'next';

/** A layout fixture must never be a search result. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DevOnboardingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Create `app/dev/onboarding/page.tsx`:

```tsx
import OnboardingForm from '@/components/OnboardingForm';
import { ONBOARDING_TITLE_HE } from '@/lib/core/onboarding';

/**
 * Layout harness for check:mobile. NOT a product screen and NOT linked from
 * anywhere.
 *
 * TD-13: the harness runs without Supabase env, so `/onboarding` answers 307 to
 * `/login?expired=1` and every line reporting "ok /onboarding ..." is really
 * measuring the login screen. The T-029 form would therefore ship unmeasured —
 * the exact F-007 pattern.
 *
 * Submitting from here reaches POST /api/profile with no session and gets a
 * documented 401; the harness never submits, and the route is noindex.
 */
export default function DevOnboardingPage() {
  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">{ONBOARDING_TITLE_HE}</h1>
      <p className="text-sm text-ink-muted">בדיקת פריסה — אינו מסך מוצר</p>
      <OnboardingForm />
    </>
  );
}
```

- [x] **Step 2: Add the route to the harness**

In `scripts/verify-mobile.mjs`, extend `ROUTES` immediately after `'/dev/identity',`:

```js
  // T-029 layout fixture, same reasoning as /dev/identity: /onboarding redirects
  // without Supabase env (TD-13), so the goal form would otherwise be measured
  // on the login screen — every "ok /onboarding" line in this harness is really
  // the login screen, verified live in C-0013.
  '/dev/onboarding',
```

- [x] **Step 3: Add the route-specific assertions**

In `scripts/verify-mobile.mjs`, beside the existing `if (route === '/dev/identity')` block, add:

```js
      // T-029 / TD-13: the goal question is the one screen where the DEFAULT is
      // the product decision (R-012 · E3), so it is measured, not asserted.
      if (route === '/dev/onboarding') {
        const group = page.locator('[data-daily-minutes]');
        const present = (await group.count()) === 1;
        check(present, `${at} daily-minutes group present`, 'no [data-daily-minutes]');
        if (present) {
          const radios = group.locator('input[type="radio"]');
          const count = await radios.count();
          check(count === 3, `${at} three goal options`, `found ${count}`);

          const checkedValue = await page.evaluate(() => {
            const el = document.querySelector(
              '[data-daily-minutes] input[type="radio"]:checked',
            );
            return el instanceof HTMLInputElement ? el.value : null;
          });
          check(
            checkedValue === '5',
            `${at} the modest goal is preselected`,
            `preselected value was ${checkedValue === null ? 'nothing' : `"${checkedValue}"`}`,
          );

          // The clickable row, not the 20px radio dot, is the tap target — so
          // measure the label the learner actually hits.
          const rows = group.locator('label');
          const rowCount = await rows.count();
          for (let i = 0; i < rowCount; i += 1) {
            const box = await rows.nth(i).boundingBox();
            check(
              box !== null && box.height >= MIN_TAP,
              `${at} goal option ${i + 1} is >= ${MIN_TAP}px tall`,
              box === null ? 'no box' : `height ${Math.round(box.height)}px`,
            );
          }
        }

        const scoreLabel = await page.evaluate(() => {
          const input = document.querySelector('input[name="target_score"]');
          if (!(input instanceof HTMLInputElement)) return null;
          return { dir: input.getAttribute('dir'), inputMode: input.getAttribute('inputmode') };
        });
        check(
          scoreLabel !== null && scoreLabel.dir === 'ltr' && scoreLabel.inputMode === 'numeric',
          `${at} the optional score field is a Latin numeric input`,
          scoreLabel === null
            ? 'no input[name="target_score"]'
            : `dir=${scoreLabel.dir} inputmode=${scoreLabel.inputMode}`,
        );
      }
```

- [x] **Step 4: Run the harness**

```bash
npm run build && (npm run start & sleep 5) && npm run check:mobile
```
Expected: `/dev/onboarding` reports `ok` at 320, 375 and 414 px in both colour schemes, and the total check count rises above the current `351`. Record the exact new number — it goes in the handoff line.


> **C-0034 — הפגם שהמדידה חשפה, ולא בטופס אלא בהארנס.** צעד 4 נפל שלוש פעמים: `all tap targets >= 44px — too small: input"" 20x20` בכל רוחב. הסריקה הגנרית מדדה את הפקד עצמו, אך אזור ההפעלה של `input[type=radio]` הוא ה-`<label>` העוטף — הדפדפן עושה זאת, לא אנחנו — כלומר נקודה בת 20px בתוך שורה בת 44px היא יעד של 44px. הכיוון הנפסל היה לנפח את הרדיו. `tapRect()` מציב את התווית **רק** ל-`radio`/`checkbox`. אומת שהסריקה עדיין נושאת עומס: כיווץ שורת האפשרות → `input"" (its label) 335x22`.

- [x] **Step 5: Prove the harness bears load**

```bash
# Make the default the intensive option — the exact regression this exists for.
sed -i "s/export const DEFAULT_DAILY_MINUTES: DailyMinutes = 5;/export const DEFAULT_DAILY_MINUTES: DailyMinutes = 20;/" lib/core/onboarding.ts
npm run build && npm run check:mobile   # expect: "the modest goal is preselected — preselected value was \"20\""
git checkout lib/core/onboarding.ts
```

Two independent guards must fire on this one mutation: the unit test from Task 1 **and** this pixel check. If only one fires, say so in the handoff.

- [x] **Step 6: Close TD-13 in the architecture file**

Rewrite the TD-13 row in `plan/30-architecture.md` to state exactly what is now measured and what is not:

> ✅ **נסגר C-XXXX.** `/dev/onboarding` נוסף ל-`ROUTES` ומודד את טופס T-029 בשלושה רוחבים ובשני מצבי צבע: קיום קבוצת הרדיו · **ברירת המחדל 5 נמדדת בפיקסלים** · שלוש שורות ≥44px · שדה הציון כקלט לטיני מספרי. מוטציה של ברירת המחדל ל-20 הפילה גם את בדיקת היחידה וגם את `check:mobile`. ⚠️ **מה שעדיין אינו נמדד:** המעטפת מוגנת-הסשן של `/onboarding` עצמו — ההארנס עדיין רץ בלי משתני סביבה של Supabase. רצועת הכתובת מכוסה ב-`/dev/identity`.

- [x] **Step 7: Run the full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
Expected: all five green. Paste the real output lines into the handoff — a claim without a fresh run is not a claim (RULES § 0.6).

- [x] **Step 8: Commit**

```bash
git add app/dev/onboarding scripts/verify-mobile.mjs plan/30-architecture.md
git commit -m "test(onboarding): measure the goal form in check:mobile — closes TD-13"
```

---

## Self-Review

**1. Spec coverage.**

| requirement | task |
|---|---|
| Minutes-per-day is the primary question (R-012) | 1 (`DAILY_MINUTES_*`), 3 (it is the first thing under the `h1`) |
| Modest default, 5–10 min | 1 (`DEFAULT_DAILY_MINUTES = 5`, asserted twice), 4 (measured in pixels) |
| No "intensive" option (E3) | 1 (`DAILY_MINUTES_OPTIONS` is exactly `[5,10,20]`, asserted) |
| Exam date stays — input to 7.1 | 1 (`daysUntilExam`), 2 (`exam_date` column), 3 (the date field) |
| Target score optional, never a motivator | 1 (nullable, no encouragement copy), 3 (last field, labelled "לא חובה") |
| Score scale 50–150 (A5) | 1 (constants + message), 2 (SQL `check`) |
| Answers persist | 2 (migration + `POST /api/profile`) |
| TD-13 — `/onboarding` measured | 4 |
| Institution question (A7) | **not in this plan** — it is T-003, `⛔ ממתין לתוכנית UX מה-PM` |

**2. Placeholder scan.** No "TBD", no "add appropriate error handling", no "tests as in Task N". Every test body and every implementation body is written out. Two steps deliberately say *check the file before writing* (Task 3 Step 4 on `LatinField`'s `footer`, Task 4 Step 4 on the check count) — those are instructions to verify against the repo, not gaps.

**3. Type consistency.** `DailyMinutes`, `OnboardingAnswers`, `OnboardingFieldErrors`, `OnboardingCheck`, `checkOnboarding(raw, today)`, `daysUntilExam(examDate, today)` are spelled identically in Tasks 1, 2 and 3. The API body keys (`dailyMinutes`, `examDate`, `targetScore`) match `OnboardingRaw` exactly and are documented with those names in `docs/api-contract.md`. The DOM hooks are used in exactly two places each: `data-daily-minutes` and `input[name="target_score"]` in Task 3, read in Task 4.

**4. Known trap.** Task 1's `checkOnboarding` narrows `dailyMinutes` to `DailyMinutes` through `isDailyMinutes`; under `noUncheckedIndexedAccess` the test file must narrow the `OnboardingCheck` union through the `answersOf` / `errorsOf` helpers rather than `!`. That is the C-0023 lesson and it is why both helpers exist.
