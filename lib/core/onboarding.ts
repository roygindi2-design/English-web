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
  return typeof value === 'number' && (DAILY_MINUTES_OPTIONS as readonly number[]).includes(value);
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
export const DAILY_MINUTES_HELP_HE = 'אפשר לשנות בכל שלב. עדיף מעט בכל יום מהרבה פעם בשבוע.';
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

  const minutesRaw =
    typeof raw.dailyMinutes === 'string' ? Number(raw.dailyMinutes) : raw.dailyMinutes;
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
