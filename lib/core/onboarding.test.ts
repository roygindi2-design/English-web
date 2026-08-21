import { readFileSync } from 'node:fs';
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
  LEARNER_TIME_ZONE,
  toIsoDateInZone,
  type OnboardingAnswers,
  type OnboardingRaw,
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
    expect(
      errorsOf({ dailyMinutes: 5, examDate: '2026-08-06', targetScore: '' }).examDate,
    ).toBeTruthy();
  });

  it('rejects a mistyped year instead of scheduling around the year 2062', () => {
    const days = daysUntilExam('2062-09-07', TODAY);
    expect(days).toBeGreaterThan(MAX_EXAM_HORIZON_DAYS);
    expect(
      errorsOf({ dailyMinutes: 5, examDate: '2062-09-07', targetScore: '' }).examDate,
    ).toBeTruthy();
  });

  it('rejects text that is not an ISO date', () => {
    expect(isIsoDate('07/09/2026')).toBe(false);
    expect(isIsoDate('2026-9-10')).toBe(false);
    expect(isIsoDate('2026-13-01')).toBe(false);
    expect(isIsoDate('2026-02-30')).toBe(false); // parses, but is not a real day
    expect(isIsoDate('2026-09-10')).toBe(true);
    expect(
      errorsOf({ dailyMinutes: 5, examDate: '07/09/2026', targetScore: '' }).examDate,
    ).toBeTruthy();
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
    expect(
      errorsOf({ dailyMinutes: 5, examDate: '', targetScore: '100.5' }).targetScore,
    ).toBeTruthy();
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

describe("the learner's calendar date", () => {
  it('reads the Israeli day, not the UTC day, in the hours they differ', () => {
    // 2026-09-09T21:30Z is 2026-09-10T00:30 in Jerusalem (UTC+3). The UTC slice
    // the plan originally specified returns the day BEFORE, which would let a
    // learner save an exam date already behind them on the morning of the exam.
    const justAfterLocalMidnight = new Date('2026-09-09T21:30:00Z');
    expect(justAfterLocalMidnight.toISOString().slice(0, 10)).toBe('2026-09-09');
    expect(toIsoDateInZone(justAfterLocalMidnight, LEARNER_TIME_ZONE)).toBe('2026-09-10');
  });

  it('agrees with the UTC slice during the rest of the day', () => {
    expect(toIsoDateInZone(new Date('2026-09-10T09:00:00Z'), LEARNER_TIME_ZONE)).toBe('2026-09-10');
  });

  it('emits a date isIsoDate accepts, in winter and in summer alike', () => {
    // Israel is UTC+2 in winter and UTC+3 under DST; both must round-trip into
    // checkOnboarding, which only ever accepts YYYY-MM-DD.
    for (const instant of ['2026-01-15T12:00:00Z', '2026-07-15T12:00:00Z']) {
      const iso = toIsoDateInZone(new Date(instant), LEARNER_TIME_ZONE);
      expect(isIsoDate(iso), `${instant} -> ${iso}`).toBe(true);
    }
  });

  it('is a pure function of its arguments — same instant, same answer', () => {
    const instant = new Date('2026-03-27T23:30:00Z');
    expect(toIsoDateInZone(instant, LEARNER_TIME_ZONE)).toBe(
      toIsoDateInZone(instant, LEARNER_TIME_ZONE),
    );
  });
});

/**
 * D-056 · T-111 — רוי הסיר את שאלת המוסד: «לא צריך את זה, שחרר את זה, מיותר».
 *
 * ⚠️ **וזה ⛔ אינו «מחקנו קוד ואין מה לבדוק».** הכשל שהרַצֶ׳ט הזה קיים בשבילו הוא
 * הכשל של F-010: פיצ׳ר שהוסר, וסוכן שמחזיר אותו חצי-שנה אחר כך כי «הטיפוס עדיין
 * מקבל את השדה, אז כנראה מותר». ⇒ שלוש הטענות כאן נופלות **בשם** ביום שמישהו
 * יחזיר את השדה לשכבה הטהורה, ובאותו יום הוא ייאלץ לקרוא את D-056.
 *
 * ⛔ **ומה שהרַצֶ׳ט הזה במפורש ⛔ אינו אוסר:** את **העמודה** `profiles.institution`
 * (‏D-056: «⛔ אינה נמחקת») ואת **התצוגה** ב-`components/MeScreen.tsx` (שורת המשימה:
 * «בלוק «המטרה שלך» ⛔ נשאר»). הסריקה כאן היא על `lib/core/onboarding.ts` בלבד.
 */
describe('the institution question is gone from the pure layer (D-056 · T-111)', () => {
  const CORE = readFileSync('lib/core/onboarding.ts', 'utf8');
  /** ⚠️ ⛔ בלי הלבנת הערות — הטענה כאן היא שהמילה ⛔ אינה בקובץ **כלל**, כולל בהערה
   *  שמסבירה «למה השדה היה כאן». הערה כזאת היא בדיוק הזרע שמצמיח את הפיצ׳ר בחזרה. */

  it('⛔ never mentions the institution again — not in code and not in a comment', () => {
    expect(CORE).not.toMatch(/institution/i);
  });

  it('⛔ exports none of the three strings the question needed', () => {
    for (const gone of ['INSTITUTION_MAX_LENGTH', 'INSTITUTION_QUESTION_HE', 'INSTITUTION_HELP_HE']) {
      expect(CORE).not.toContain(gone);
    }
  });

  it('accepts a body that still carries the old key, and ⛔ answers nothing about it', () => {
    // ⚠️ המדידה שמונעת רגרסיה בייצור: לומד שעמוד ישן שלו נשאר פתוח בדפדפן ישלח
    // עדיין `institution`. הבקשה חייבת להצליח — ⛔ ולא 422 — והשדה נופל לרצפה.
    const result = checkOnboarding(
      { dailyMinutes: 5, examDate: '', targetScore: '', institution: 'אוניברסיטת חיפה' } as OnboardingRaw,
      '2026-08-21',
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.answers).sort()).toEqual(['dailyMinutes', 'examDate', 'targetScore']);
  });
});

describe('the 0009 column survives its question (D-056)', () => {
  /**
   * ⚠️ **`INSTITUTION_MAX_LENGTH` נמחק ב-T-111, והמספר כאן גולמי בכוונה.**
   * העמודה והאילוץ **נשארים במסד** (D-056: «⛔ אינה נמחקת»), ולכן אילוץ שאיש
   * אינו בודק הוא אילוץ שהמיגרציה הבאה תשבור בשקט. ⛔ החלופה — להשאיר קבוע חי
   * ב-`lib/core` "רק בשביל הבדיקה" — היא בדיוק הפגם של F-010: קוד שאיש אינו
   * קורא, שיושב בעץ כדרך מוכנה להחזיר את הפיצ׳ר בייבוא אחד.
   */
  it('still guards the 0009 constraint, ⛔ even though nothing writes the column now', () => {
    const sql = readFileSync('supabase/migrations/0009_onboarding_institution.sql', 'utf8');
    expect(sql).toContain('char_length(institution) <= 120');
    expect(sql).not.toMatch(/institution\s+text\s+not\s+null/i);
  });
});
