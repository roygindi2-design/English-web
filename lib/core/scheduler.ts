/**
 * PURE. No React, no DOM, no clock, no env. Engine 7.1 of plan/70-engines.md.
 *
 * SM-2 verbatim from Wozniak (supermemo.com/en/archives1990-2015/english/ol/sm2),
 * compressed toward exam_date using the Cepeda et al. (2008) optimal-gap finding:
 * the last exposure should fall 5%-20% of the retention interval before the test,
 * so the gap is DERIVED (10% of the horizon, clamped to 1..14 days) and never fixed.
 */
import { isIsoDate, daysUntilExam } from '@/lib/core/onboarding';
import type { CardGrade } from '@/lib/core/flashcard';

export const INITIAL_EASINESS = 2.5;
export const MIN_EASINESS = 1.3;
export const FIRST_INTERVAL_DAYS = 1;
export const SECOND_INTERVAL_DAYS = 6;

/**
 * SM-2 is defined on q in 0..5; our card exposes two buttons (T-040, binary grading).
 * `good` -> 4 and not 5: 5 means "perfect recall, no hesitation", which a binary
 * self-grade cannot claim. `again` -> 2 and not 0: the EF penalty at q=0 is -0.80
 * against -0.32 at q=2, and one "I didn't know" is not evidence of maximal
 * difficulty. Both are < 3, so both reset the repetition streak identically.
 * Named constants so a future measurement moves them in exactly one place.
 */
export const Q_GOOD = 4;
export const Q_AGAIN = 2;

/**
 * HEURISTIC: unstudied — plan/70-engines.md 7.1 records that "harder words get
 * more aggressive compression" has no study for or against it. It is allowed only
 * while it carries this marker, and it must NEVER be shown to the learner as
 * research-backed. lib/core/scheduler.test.ts asserts the marker is still here.
 */
export const DIFFICULT_EASINESS_CEILING = 1.8;
export const DIFFICULT_WORD_COMPRESSION = 0.5;

const GAP_FRACTION = 0.1;
const GAP_MIN_DAYS = 1;
const GAP_MAX_DAYS = 14;
const MS_PER_DAY = 86_400_000;

export interface SchedulerState {
  readonly easiness: number;
  readonly intervalDays: number;
  readonly repetition: number;
}

export interface SchedulingPolicy {
  /**
   * How many whole usable days must remain before the pre-exam gap for normal
   * spacing to continue. Required, with no default: no published number fixes
   * "the exam is too close", so it is a product parameter the caller owns — not a
   * constant invented here and then cited as if it were evidence. Same reasoning
   * as PromotionPolicy.promoteAfterConsecutiveCorrect in lib/core/flashcard.ts.
   */
  readonly triageMinUsableDays: number;
}

export interface ScheduleInput {
  readonly state: SchedulerState;
  readonly grade: CardGrade;
  readonly today: string;
  readonly examDate: string | null;
  readonly policy: SchedulingPolicy;
}

export interface ReviewSchedule {
  readonly next: SchedulerState;
  readonly nextReviewDate: string;
  readonly triage: boolean;
  readonly examCompressed: boolean;
  readonly mode: 'classic' | 'exam_compressed' | 'triage';
}

function requireIsoDate(value: string, label: string): string {
  if (typeof value !== 'string' || !isIsoDate(value)) {
    throw new RangeError(`${label} must be a real calendar day as YYYY-MM-DD, got ${value}`);
  }
  return value;
}

function requireWholeCount(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a whole number >= 0, got ${value}`);
  }
  return value;
}

/** UTC-anchored, like daysUntilExam: local components across a DST change lose a day. */
export function addDaysIso(isoDate: string, days: number): string {
  requireIsoDate(isoDate, 'isoDate');
  if (!Number.isInteger(days)) {
    throw new RangeError(`days must be a whole number, got ${days}`);
  }
  const [y, m, d] = isoDate.split('-').map(Number);
  const shifted = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, d ?? 1) + days * MS_PER_DAY);
  const mm = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(shifted.getUTCDate()).padStart(2, '0');
  return `${shifted.getUTCFullYear()}-${mm}-${dd}`;
}

/** EF' = EF + (0.1 - (5-q)*(0.08 + (5-q)*0.02)), floored at 1.3. */
export function updateEasiness(easiness: number, q: number): number {
  const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
  return Math.max(MIN_EASINESS, easiness + delta);
}

/** Cepeda 2008: 10% of the horizon, clamped to 1..14 whole days. */
export function preExamGapDays(daysUntilExamValue: number): number {
  const raw = Math.round(GAP_FRACTION * daysUntilExamValue);
  return Math.min(GAP_MAX_DAYS, Math.max(GAP_MIN_DAYS, raw));
}

function classicInterval(state: SchedulerState, easiness: number): number {
  if (state.repetition === 0) return FIRST_INTERVAL_DAYS;
  if (state.repetition === 1) return SECOND_INTERVAL_DAYS;
  return Math.ceil(state.intervalDays * easiness);
}

export function scheduleReview(input: ScheduleInput): ReviewSchedule {
  const today = requireIsoDate(input.today, 'today');
  const examDate = input.examDate === null ? null : requireIsoDate(input.examDate, 'examDate');
  requireWholeCount(input.state.intervalDays, 'state.intervalDays');
  requireWholeCount(input.state.repetition, 'state.repetition');
  if (!Number.isFinite(input.state.easiness) || input.state.easiness < MIN_EASINESS) {
    throw new RangeError(
      `state.easiness must be a finite number >= ${MIN_EASINESS}, got ${input.state.easiness}`,
    );
  }
  if (!Number.isFinite(input.policy.triageMinUsableDays) || input.policy.triageMinUsableDays < 0) {
    throw new RangeError(
      `policy.triageMinUsableDays must be a finite number >= 0, got ${input.policy.triageMinUsableDays}`,
    );
  }

  const q = input.grade === 'good' ? Q_GOOD : Q_AGAIN;
  const easiness = updateEasiness(input.state.easiness, q);
  const lapsed = q < 3;

  // A lapse resets the streak to I(1). EF itself is NOT reset — it is the memory
  // of every earlier answer, and throwing it away punishes the word twice.
  const repetition = lapsed ? 0 : input.state.repetition + 1;
  let intervalDays = lapsed ? FIRST_INTERVAL_DAYS : classicInterval(input.state, easiness);

  // An exam date behind us is not a target. Without this line a learner whose exam
  // has passed is stuck in triage forever and every word comes back daily.
  const horizonDays = examDate === null ? null : daysUntilExam(examDate, today);
  const hasFutureExam = horizonDays !== null && horizonDays > 0;

  let triage = false;
  let examCompressed = false;

  if (hasFutureExam && horizonDays !== null) {
    const usableHorizon = horizonDays - preExamGapDays(horizonDays);
    triage = usableHorizon < input.policy.triageMinUsableDays;

    if (!triage) {
      // HEURISTIC: unstudied — see DIFFICULT_EASINESS_CEILING above.
      const difficult = input.state.easiness <= DIFFICULT_EASINESS_CEILING;
      const capped = Math.min(intervalDays, usableHorizon);
      const compressed = difficult
        ? Math.max(1, Math.ceil(capped * DIFFICULT_WORD_COMPRESSION))
        : capped;
      examCompressed = compressed < intervalDays;
      intervalDays = compressed;
    }
  }

  // In triage there is nowhere left to defer to: the word comes back today.
  const nextReviewDate = triage ? today : addDaysIso(today, intervalDays);
  const mode: ReviewSchedule['mode'] = triage
    ? 'triage'
    : examCompressed
      ? 'exam_compressed'
      : 'classic';

  return {
    next: { easiness, intervalDays, repetition },
    nextReviewDate,
    triage,
    examCompressed,
    mode,
  };
}
