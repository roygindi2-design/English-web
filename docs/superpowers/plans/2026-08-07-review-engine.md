# מנוע החזרות — תוכנית מימוש (T-005 + T-006)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` (או `superpowers:subagent-driven-development`) לביצוע משימה-אחר-משימה. הצעדים מסומנים ב-`- [ ]`.

**Goal:** לבנות את שדרת מנוע החזרות — SM-2 דחוס-מבחן (7.1), עדכון ההתקדמות והטלמטריה של D-010 (T-005), ושער עליית הרמה מבוסס-מנות (7.7 / T-006) — כשלוש שכבות טהורות ב-`/lib/core`, ואחריהן שכבת התמדה אחת שאוכפת בצד השרת.

**Architecture:** שלוש הפונקציות הטהורות אינן מכירות זו את זו דרך גלובלים אלא דרך טיפוסים בלבד: `scheduleReview()` מחזיר `ReviewSchedule`, `applyGrade()` מחזיר `WordProgress`, ו-`checkBatchGate()` צורך את שדה `seen` בלבד. השעון, ה-DB וה-`process.env` נשארים מחוץ ל-`/lib/core` לחלוטין — כל קלט זמן מגיע כמחרוזת ISO או כמספר ימים שהקורא חישב. שכבת ההתמדה (משימה 4) היא **הנקודה היחידה** שמחברת ביניהן, והאכיפה שם ולא בממשק (7.7 "אכיפה: בצד השרת בלבד").

**Tech Stack:** TypeScript ללא `any` · Vitest (‏`lib/**/*.test.ts` כבר ב-`include` של `vitest.config.ts` — **אין צורך לגעת בו**) · Next 16 App Router · Supabase Postgres · `@supabase/ssr`.

## Global Constraints

- ‏`/lib/core` טהור: ⛔ `react` · `window` · `document` · `localStorage` · `sessionStorage` · `process.env` · `fetch(`. אכיפה: `npm run check:core`.
- **השעון נשאר בקצה.** אף פונקציה ב-`/lib/core` אינה קוראת ל-`new Date()` בלי ארגומנט. תאריכים נכנסים כ-`YYYY-MM-DD` ונבדקים ב-`isIsoDate` הקיים; "היום" נגזר תמיד דרך `toIsoDateInZone(instant, LEARNER_TIME_ZONE)` (הלקח של C-0032).
- **נוסחאות SM-2 מחייבות, מהמקור** (`plan/70-engines.md` § 7.1): `EF` מתחיל ב-`2.5` · `I(1)=1` · `I(2)=6` · `I(n)=I(n-1)×EF` · `EF' = EF + (0.1 − (5−q)×(0.08 + (5−q)×0.02))` · רצפה `EF ≥ 1.3` · ‏`q < 3` מאפס את רצף החזרות ל-`I(1)` **ואינו מאפס את `EF`**.
- **פער החזרה האחרונה לפני המבחן:** `gap = clamp(0.10 × ימים_עד_המבחן, 1, 14)`. ⛔ אסור לקבע אותו כקבוע (Cepeda 2008).
- **"מילים קשות מקבלות דחיסה אגרסיבית יותר" אינה ממצא.** מותרת אך ורק כשהיא מסומנת בקוד `// HEURISTIC: unstudied`, ו⛔ אסור להציג אותה ללומד כ"מבוסס מחקר".
- **גודל מנה: 50–100 מילים** (7.7). מנה מחוץ לטווח היא באג של הקורא ולא מנה.
- **מילה ללא רמה (`level_id = NULL`, `origin='unleveled'`) אינה נספרת ב-exposure ואינה משתתפת בשער 7.7** (`plan/15-syllabus-digest.md` § כללי קליטה, סעיף 1).
- **"נחשף" ≠ "שלט"** (7.7). exposure נמדד בקיום חשיפה; שליטה נמדדת במבחן עצמו ואינה קלט לשער.
- ⛔ אפס תלויות חדשות ב-`package.json`.
- ⛔ אין להמציא תוכן לימודי. התוכנית הזו אינה נוגעת במילים, תרגומים או משפטים — רק במספרים ובמצב.
- כל שינוי בנקודות קצה מתועד ב-`docs/api-contract.md` **באותו קומיט**.
- ⛔ בלי `[skip ci]` בהודעות הקומיט (`plan/RULES.md` § 0.7).

## מה קיים כבר ואסור לשכתב

| קובץ | מה לצרוך ממנו |
|---|---|
| `lib/core/flashcard.ts` | `CardGrade = 'again' \| 'good'` · `BINARY_GRADES` · `MasteryState { consecutiveCorrectRecognition }` · `PromotionPolicy { promoteAfterConsecutiveCorrect }` · `directionFor(state, policy)` |
| `lib/core/onboarding.ts` | `isIsoDate(value)` · `daysUntilExam(examDate, today)` · `LEARNER_TIME_ZONE` · `toIsoDateInZone(instant, timeZone)` |
| `lib/core/queue.ts` | `planDailyQueue(input)` · `STEADY_STATE_REVIEW_RATIO` — בלם העומס של T-031. **אל תשכפל אותו כאן.** |
| `supabase/migrations/0003_provenance_telemetry.sql` | טבלת `word_progress`, מפתח ראשי `(user_id, word_id)`, ובה `attempts` · `correct_attempts` · `first_seen_at` · `time_to_first_correct` · `attempts_to_mastery` · `mastered_at` · RLS לבעלים בלבד |

---

### Task 1: `lib/core/scheduler.ts` — SM-2 דחוס-מבחן (7.1)

**Files:**
- Create: `lib/core/scheduler.ts`
- Test: `lib/core/scheduler.test.ts`

**Interfaces:**
- Consumes: `CardGrade` מ-`lib/core/flashcard.ts`.
- Produces:
```ts
export const INITIAL_EASINESS = 2.5;
export const MIN_EASINESS = 1.3;
export const Q_GOOD = 4;
export const Q_AGAIN = 2;
export const DIFFICULT_EASINESS_CEILING = 1.8;
export const DIFFICULT_WORD_COMPRESSION = 0.5;

export interface SchedulerState {
  readonly easiness: number;      // EF
  readonly intervalDays: number;  // I(n-1); 0 = טרם נקבע מרווח
  readonly repetition: number;    // מס' תשובות נכונות רצופות בזרם הנוכחי
}

export interface SchedulingPolicy {
  readonly triageMinUsableDays: number;
}

export interface ScheduleInput {
  readonly state: SchedulerState;
  readonly grade: CardGrade;
  readonly today: string;              // YYYY-MM-DD
  readonly examDate: string | null;    // YYYY-MM-DD או null
  readonly policy: SchedulingPolicy;
}

export interface ReviewSchedule {
  readonly next: SchedulerState;
  readonly nextReviewDate: string;     // YYYY-MM-DD
  readonly triage: boolean;
  readonly examCompressed: boolean;
  readonly mode: 'classic' | 'exam_compressed' | 'triage';
}

export function preExamGapDays(daysUntilExamValue: number): number;
export function updateEasiness(easiness: number, q: number): number;
export function scheduleReview(input: ScheduleInput): ReviewSchedule;
export function addDaysIso(isoDate: string, days: number): string;
```

**החלטות שנקבעות כאן ולא בזמן הכתיבה:**

1. **מיפוי הדירוג הבינארי ל-`q` של SM-2.** ‏`BINARY_GRADES` הוא `['again','good']` (T-040, ציון בינארי), ו-SM-2 מוגדר על `q ∈ 0..5`. ‏`good → Q_GOOD = 4`, ‏`again → Q_AGAIN = 2`. **`4` ולא `5`** כי `5` הוא "היזכרות מושלמת בלי היסוס", וכפתור בינארי אינו יכול לטעון זאת; `4` הוא "תשובה נכונה אחרי היסוס" — בדיוק מה שדירוג עצמי בינארי מצהיר. **`2` ולא `0`** כי עונש ה-`EF` ב-`q=0` הוא ‎−0.80 מול ‎−0.32 ב-`q=2`, ו"לא ידעתי" בחשיפה ראשונה אינו ראיה לקושי מקסימלי; שניהם `< 3` ולכן שניהם מאפסים את הרצף באופן זהה. שני הערכים **קבועים בשם** כדי שמדידה עתידית תזיז אותם במקום אחד.
2. **`triageMinUsableDays` הוא פרמטר מוצר חובה בלי ברירת מחדל** — בדיוק הדפוס של `promoteAfterConsecutiveCorrect` ב-`flashcard.ts` ("no published number fixes this threshold"). אין מחקר שקובע מתי "המבחן קרוב מדי", ולכן הקוד לא ימציא מספר ויציג אותו כאילו נמדד.
3. **טריאז' נגזר ואינו מוכתב:** `usableHorizon = daysUntilExam − preExamGapDays(daysUntilExam)`. אם `usableHorizon < policy.triageMinUsableDays` → `triage: true`, ו-`nextReviewDate` הוא **היום** (`today`) — במצב טריאז' אין לאן לדחות, המילה חוזרת עוד היום. זו גם ההדק ש-7.7 מקשיב לו.
4. **מבחן שעבר (`daysUntilExam <= 0`) אינו טריאז' אלא היעדר מבחן.** התאריך מאחורינו אינו יעד, ולכן המצב חוזר ל-`classic`. ⛔ בלי הכלל הזה, לומד שהמבחן שלו עבר נתקע בטריאז' לנצח וכל מילה חוזרת כל יום.

- [x] **Step 1: כתוב את הבדיקות הנופלות** — `lib/core/scheduler.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  DIFFICULT_EASINESS_CEILING,
  INITIAL_EASINESS,
  MIN_EASINESS,
  Q_AGAIN,
  Q_GOOD,
  addDaysIso,
  preExamGapDays,
  scheduleReview,
  updateEasiness,
  type SchedulerState,
} from '@/lib/core/scheduler';

const FRESH: SchedulerState = { easiness: INITIAL_EASINESS, intervalDays: 0, repetition: 0 };
const POLICY = { triageMinUsableDays: 1 } as const;

describe('updateEasiness — the SM-2 formula verbatim', () => {
  it('nudges EF up on a perfect answer', () => {
    // EF' = 2.5 + (0.1 - 0*(0.08 + 0*0.02)) = 2.6
    expect(updateEasiness(2.5, 5)).toBeCloseTo(2.6, 10);
  });

  it('leaves EF almost flat at q=4', () => {
    // EF' = 2.5 + (0.1 - 1*(0.08 + 1*0.02)) = 2.5
    expect(updateEasiness(2.5, Q_GOOD)).toBeCloseTo(2.5, 10);
  });

  it('penalises a lapse at q=2 by 0.32', () => {
    // EF' = 2.5 + (0.1 - 3*(0.08 + 3*0.02)) = 2.18
    expect(updateEasiness(2.5, Q_AGAIN)).toBeCloseTo(2.18, 10);
  });

  it('never drops EF below the 1.3 floor, however many lapses', () => {
    let ef = INITIAL_EASINESS;
    for (let i = 0; i < 50; i += 1) ef = updateEasiness(ef, 0);
    expect(ef).toBe(MIN_EASINESS);
  });
});

describe('scheduleReview — classic SM-2 with no exam date', () => {
  it('sends the first correct answer to I(1) = 1 day', () => {
    const out = scheduleReview({
      state: FRESH, grade: 'good', today: '2026-09-01', examDate: null, policy: POLICY,
    });
    expect(out.next.intervalDays).toBe(1);
    expect(out.nextReviewDate).toBe('2026-09-02');
    expect(out.mode).toBe('classic');
  });

  it('sends the second correct answer to I(2) = 6 days', () => {
    const out = scheduleReview({
      state: { easiness: 2.5, intervalDays: 1, repetition: 1 },
      grade: 'good', today: '2026-09-02', examDate: null, policy: POLICY,
    });
    expect(out.next.intervalDays).toBe(6);
    expect(out.nextReviewDate).toBe('2026-09-08');
  });

  it('multiplies by EF from the third correct answer on', () => {
    const out = scheduleReview({
      state: { easiness: 2.5, intervalDays: 6, repetition: 2 },
      grade: 'good', today: '2026-09-08', examDate: null, policy: POLICY,
    });
    expect(out.next.intervalDays).toBe(15); // ceil(6 * 2.5)
  });

  it('resets the streak to I(1) on a lapse but KEEPS the earned EF', () => {
    const out = scheduleReview({
      state: { easiness: 2.36, intervalDays: 15, repetition: 3 },
      grade: 'again', today: '2026-09-08', examDate: null, policy: POLICY,
    });
    expect(out.next.intervalDays).toBe(1);
    expect(out.next.repetition).toBe(0);
    // 2.36 + (0.1 - 3*(0.08 + 3*0.02)) = 2.04 — penalised, NOT reset to 2.5
    expect(out.next.easiness).toBeCloseTo(2.04, 10);
  });

  it('treats a past exam date as no exam date at all', () => {
    const out = scheduleReview({
      state: { easiness: 2.5, intervalDays: 6, repetition: 2 },
      grade: 'good', today: '2026-09-10', examDate: '2026-09-01', policy: POLICY,
    });
    expect(out.mode).toBe('classic');
    expect(out.triage).toBe(false);
    expect(out.next.intervalDays).toBe(15);
  });
});

describe('preExamGapDays — Cepeda 2008, derived not fixed', () => {
  it('is 10% of the horizon inside the clamp', () => {
    expect(preExamGapDays(60)).toBe(6);
  });

  it('floors at 1 day', () => {
    expect(preExamGapDays(3)).toBe(1);
  });

  it('ceilings at 14 days', () => {
    expect(preExamGapDays(365)).toBe(14);
  });
});

describe('scheduleReview — exam compression', () => {
  it('caps the interval so the last exposure lands before the pre-exam gap', () => {
    // 30 days out, gap = 3, usable horizon = 27. Classic would ask for ceil(15*2.5)=38.
    const out = scheduleReview({
      state: { easiness: 2.5, intervalDays: 15, repetition: 3 },
      grade: 'good', today: '2026-09-01', examDate: '2026-10-01', policy: POLICY,
    });
    expect(out.next.intervalDays).toBe(27);
    expect(out.nextReviewDate).toBe('2026-09-28');
    expect(out.examCompressed).toBe(true);
    expect(out.mode).toBe('exam_compressed');
  });

  it('does not stretch an interval that already fits under the horizon', () => {
    const out = scheduleReview({
      state: { easiness: 2.5, intervalDays: 1, repetition: 1 },
      grade: 'good', today: '2026-09-01', examDate: '2026-12-01', policy: POLICY,
    });
    expect(out.next.intervalDays).toBe(6);
    expect(out.examCompressed).toBe(false);
  });

  it('compresses a DIFFICULT word harder than an easy one at the same horizon', () => {
    const base = {
      grade: 'good', today: '2026-09-01', examDate: '2026-10-01', policy: POLICY,
    } as const;
    const easy = scheduleReview({
      ...base, state: { easiness: 2.5, intervalDays: 10, repetition: 3 },
    });
    const hard = scheduleReview({
      ...base, state: { easiness: DIFFICULT_EASINESS_CEILING, intervalDays: 10, repetition: 3 },
    });
    expect(hard.next.intervalDays).toBeLessThan(easy.next.intervalDays);
    expect(hard.next.intervalDays).toBe(9); // ceil(min(ceil(10*1.8), 27) * 0.5)
  });

  it('never compresses a difficult word below one whole day', () => {
    const out = scheduleReview({
      state: { easiness: MIN_EASINESS, intervalDays: 1, repetition: 1 },
      grade: 'good', today: '2026-09-01', examDate: '2026-09-04', policy: POLICY,
    });
    expect(out.next.intervalDays).toBeGreaterThanOrEqual(1);
  });
});

describe('scheduleReview — triage', () => {
  it('turns on when no whole usable day is left before the gap', () => {
    // exam tomorrow: daysUntilExam=1, gap=1, usable horizon=0 < 1
    const out = scheduleReview({
      state: { easiness: 2.5, intervalDays: 6, repetition: 2 },
      grade: 'good', today: '2026-09-01', examDate: '2026-09-02', policy: POLICY,
    });
    expect(out.triage).toBe(true);
    expect(out.mode).toBe('triage');
    expect(out.nextReviewDate).toBe('2026-09-01'); // today — nowhere left to defer to
  });

  it('is a product parameter, not a constant: a wider policy triages earlier', () => {
    const input = {
      state: { easiness: 2.5, intervalDays: 6, repetition: 2 },
      grade: 'good', today: '2026-09-01', examDate: '2026-09-20',
    } as const;
    expect(scheduleReview({ ...input, policy: { triageMinUsableDays: 1 } }).triage).toBe(false);
    expect(scheduleReview({ ...input, policy: { triageMinUsableDays: 30 } }).triage).toBe(true);
  });

  it('still advances the SM-2 state in triage — the learner answered', () => {
    const out = scheduleReview({
      state: { easiness: 2.5, intervalDays: 6, repetition: 2 },
      grade: 'good', today: '2026-09-01', examDate: '2026-09-02', policy: POLICY,
    });
    expect(out.next.repetition).toBe(3);
  });
});

describe('input guards', () => {
  it('rejects a today that is not a real calendar day', () => {
    expect(() => scheduleReview({
      state: FRESH, grade: 'good', today: '2026-02-30', examDate: null, policy: POLICY,
    })).toThrow(RangeError);
  });

  it('rejects an exam date that is not a real calendar day', () => {
    expect(() => scheduleReview({
      state: FRESH, grade: 'good', today: '2026-09-01', examDate: '2026-13-01', policy: POLICY,
    })).toThrow(RangeError);
  });

  it('rejects an easiness below the SM-2 floor', () => {
    expect(() => scheduleReview({
      state: { easiness: 1.0, intervalDays: 1, repetition: 1 },
      grade: 'good', today: '2026-09-01', examDate: null, policy: POLICY,
    })).toThrow(RangeError);
  });

  it('rejects a negative triageMinUsableDays', () => {
    expect(() => scheduleReview({
      state: FRESH, grade: 'good', today: '2026-09-01', examDate: null,
      policy: { triageMinUsableDays: -1 },
    })).toThrow(RangeError);
  });
});

describe('addDaysIso', () => {
  it('crosses a month boundary', () => {
    expect(addDaysIso('2026-01-30', 3)).toBe('2026-02-02');
  });

  it('crosses the Israeli DST boundary without losing a day', () => {
    // 2026-03-27 is the clock change; UTC-anchored arithmetic must stay whole.
    expect(addDaysIso('2026-03-26', 2)).toBe('2026-03-28');
  });

  it('is a no-op for 0 days', () => {
    expect(addDaysIso('2026-03-26', 0)).toBe('2026-03-26');
  });
});

describe('the unstudied heuristic is marked as such in the source', () => {
  it('carries the HEURISTIC marker plan/70-engines.md 7.1 requires', async () => {
    const { readFileSync } = await import('node:fs');
    const src = readFileSync('lib/core/scheduler.ts', 'utf8');
    expect(src).toMatch(/\/\/\s*HEURISTIC: unstudied/);
  });
});
```

- [x] **Step 2: הרץ כדי לראות אותן נופלות**

Run: `npx vitest run lib/core/scheduler.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/core/scheduler"`.

- [x] **Step 3: כתוב את המימוש** — `lib/core/scheduler.ts`

```ts
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
```

- [x] **Step 4: הרץ עד ירוק**

Run: `npx vitest run lib/core/scheduler.test.ts`
Expected: PASS, כל הבדיקות.

- [x] **Step 5: הרץ שתי מוטציות והוכח שהבדיקות מודדות**

הרץ אחת בכל פעם, אשר שהיא **נופלת**, והחזר:

1. אפס את ה-`EF` בנפילה: החלף את `const easiness = updateEasiness(input.state.easiness, q);` ב-`const easiness = q < 3 ? INITIAL_EASINESS : updateEasiness(input.state.easiness, q);` — אמורה להפיל את `resets the streak to I(1) on a lapse but KEEPS the earned EF` עם `expected 2.5 to be close to 2.04`.
2. החלף `preExamGapDays` בקבוע `return 3;` — אמורה להפיל את `floors at 1 day` ואת `ceilings at 14 days`.

⛔ אם מוטציה **לא** מפילה בדיקה — הבדיקה דקורטיבית, תקן אותה לפני שממשיכים.

- [x] **Step 6: אימות מלא + קומיט**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/scheduler.ts lib/core/scheduler.test.ts
git commit -m "loop(DEV): engine 7.1 scheduler — SM-2 with derived pre-exam gap"
```

---

### Task 2: `lib/core/progress.ts` — צבירת התקדמות וטלמטריית D-010 (T-005)

**Files:**
- Create: `lib/core/progress.ts`
- Test: `lib/core/progress.test.ts`

**Interfaces:**
- Consumes: `CardGrade` ו-`CardDirection` מ-`lib/core/flashcard.ts`.
- Produces:
```ts
export interface WordProgress {
  readonly attempts: number;
  readonly correctAttempts: number;
  readonly consecutiveCorrectRecognition: number;
  readonly timeToFirstCorrectMs: number | null;
  readonly attemptsToMastery: number | null;
  readonly firstSeenAtMs: number;
  readonly masteredAtMs: number | null;
}

export interface MasteryPolicy {
  readonly masteryConsecutiveCorrect: number;
}

export interface GradeEvent {
  readonly grade: CardGrade;
  readonly direction: CardDirection;
  readonly answeredAtMs: number;   // epoch ms, supplied by the caller
}

export function newWordProgress(firstSeenAtMs: number): WordProgress;
export function applyGrade(
  current: WordProgress,
  event: GradeEvent,
  policy: MasteryPolicy,
): WordProgress;
export function isExposed(progress: WordProgress): boolean;
```

**החלטות שנקבעות כאן:**

1. **שני שדות D-010 בשמם המדויק** (`time_to_first_correct`, `attempts_to_mastery`), ושניהם **nullable לנצח עד שהאירוע קרה** — `0` הוא מדידה ולא "לא ידוע", וזה בדיוק מה שהמיגרציה של C-0029 כבר קובעת.
2. **שניהם נכתבים פעם אחת ולא נדרסים.** ‏`time_to_first_correct` הוא המרחק מהחשיפה הראשונה לתשובה הנכונה **הראשונה**; תשובה נכונה שנייה שדורסת אותו הופכת את המדד למשהו אחר לגמרי.
3. **`consecutiveCorrectRecognition` נספר על כרטיסי `recognition` בלבד** — זו ההגדרה המילולית ב-`MasteryState` של `flashcard.ts`, ובלעדיה `directionFor` היה מקדם מילה לייצור על סמך תשובות ייצור.
4. **`masteryConsecutiveCorrect` הוא פרמטר חובה בלי ברירת מחדל**, מאותה סיבה בדיוק.
5. **`isExposed` הוא `attempts >= 1`** — "נחשף" ≠ "שלט" (7.7). זו הפונקציה היחידה שהשער של משימה 3 יצרוך.

- [x] **Step 1: כתוב את הבדיקות הנופלות** — `lib/core/progress.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  applyGrade,
  isExposed,
  newWordProgress,
  type GradeEvent,
  type WordProgress,
} from '@/lib/core/progress';

const T0 = 1_770_000_000_000;
const POLICY = { masteryConsecutiveCorrect: 3 } as const;

function recognition(grade: 'again' | 'good', atMs: number): GradeEvent {
  return { grade, direction: 'recognition', answeredAtMs: atMs };
}

describe('newWordProgress', () => {
  it('starts unknown, not zero, on both D-010 fields', () => {
    const p = newWordProgress(T0);
    expect(p.attempts).toBe(0);
    expect(p.timeToFirstCorrectMs).toBeNull();
    expect(p.attemptsToMastery).toBeNull();
    expect(p.masteredAtMs).toBeNull();
    expect(p.firstSeenAtMs).toBe(T0);
  });

  it('rejects a non-finite timestamp', () => {
    expect(() => newWordProgress(Number.NaN)).toThrow(RangeError);
  });
});

describe('applyGrade — counters', () => {
  it('counts an attempt even when the answer was wrong', () => {
    const p = applyGrade(newWordProgress(T0), recognition('again', T0 + 4_000), POLICY);
    expect(p.attempts).toBe(1);
    expect(p.correctAttempts).toBe(0);
    expect(p.consecutiveCorrectRecognition).toBe(0);
  });

  it('breaks the recognition streak on a lapse', () => {
    let p = newWordProgress(T0);
    p = applyGrade(p, recognition('good', T0 + 1_000), POLICY);
    p = applyGrade(p, recognition('good', T0 + 2_000), POLICY);
    expect(p.consecutiveCorrectRecognition).toBe(2);
    p = applyGrade(p, recognition('again', T0 + 3_000), POLICY);
    expect(p.consecutiveCorrectRecognition).toBe(0);
    expect(p.attempts).toBe(3);
    expect(p.correctAttempts).toBe(2);
  });

  it('does NOT count a production answer toward the recognition streak', () => {
    const p = applyGrade(
      newWordProgress(T0),
      { grade: 'good', direction: 'production', answeredAtMs: T0 + 1_000 },
      POLICY,
    );
    expect(p.correctAttempts).toBe(1);
    expect(p.consecutiveCorrectRecognition).toBe(0);
  });

  it('rejects an answer timestamp before the first exposure', () => {
    expect(() => applyGrade(newWordProgress(T0), recognition('good', T0 - 1), POLICY)).toThrow(
      RangeError,
    );
  });

  it('rejects a mastery threshold below 1', () => {
    expect(() =>
      applyGrade(newWordProgress(T0), recognition('good', T0 + 1), {
        masteryConsecutiveCorrect: 0,
      }),
    ).toThrow(RangeError);
  });
});

describe('applyGrade — time_to_first_correct (D-010)', () => {
  it('is measured from the first exposure to the FIRST correct answer', () => {
    let p = newWordProgress(T0);
    p = applyGrade(p, recognition('again', T0 + 5_000), POLICY);
    expect(p.timeToFirstCorrectMs).toBeNull();
    p = applyGrade(p, recognition('good', T0 + 12_000), POLICY);
    expect(p.timeToFirstCorrectMs).toBe(12_000);
  });

  it('is never overwritten by a later correct answer', () => {
    let p = newWordProgress(T0);
    p = applyGrade(p, recognition('good', T0 + 12_000), POLICY);
    p = applyGrade(p, recognition('good', T0 + 900_000), POLICY);
    expect(p.timeToFirstCorrectMs).toBe(12_000);
  });
});

describe('applyGrade — attempts_to_mastery (D-010)', () => {
  it('is null until the streak reaches the policy threshold', () => {
    let p: WordProgress = newWordProgress(T0);
    p = applyGrade(p, recognition('good', T0 + 1_000), POLICY);
    p = applyGrade(p, recognition('good', T0 + 2_000), POLICY);
    expect(p.attemptsToMastery).toBeNull();
    expect(p.masteredAtMs).toBeNull();
  });

  it('records the TOTAL attempts at the moment mastery is reached, lapses included', () => {
    let p: WordProgress = newWordProgress(T0);
    p = applyGrade(p, recognition('again', T0 + 1_000), POLICY); // 1
    p = applyGrade(p, recognition('good', T0 + 2_000), POLICY);  // 2
    p = applyGrade(p, recognition('again', T0 + 3_000), POLICY); // 3
    p = applyGrade(p, recognition('good', T0 + 4_000), POLICY);  // 4
    p = applyGrade(p, recognition('good', T0 + 5_000), POLICY);  // 5
    p = applyGrade(p, recognition('good', T0 + 6_000), POLICY);  // 6 -> streak 3
    expect(p.attemptsToMastery).toBe(6);
    expect(p.masteredAtMs).toBe(T0 + 6_000);
  });

  it('is never rewritten after a later lapse and re-mastery', () => {
    let p: WordProgress = newWordProgress(T0);
    for (let i = 1; i <= 3; i += 1) p = applyGrade(p, recognition('good', T0 + i * 1_000), POLICY);
    expect(p.attemptsToMastery).toBe(3);
    p = applyGrade(p, recognition('again', T0 + 10_000), POLICY);
    for (let i = 1; i <= 3; i += 1) {
      p = applyGrade(p, recognition('good', T0 + 20_000 + i * 1_000), POLICY);
    }
    expect(p.attemptsToMastery).toBe(3);
    expect(p.masteredAtMs).toBe(T0 + 3_000);
  });
});

describe('isExposed — "seen" is not "mastered" (7.7)', () => {
  it('is false before any attempt', () => {
    expect(isExposed(newWordProgress(T0))).toBe(false);
  });

  it('is true after a single WRONG answer', () => {
    const p = applyGrade(newWordProgress(T0), recognition('again', T0 + 1_000), POLICY);
    expect(isExposed(p)).toBe(true);
  });
});
```

- [x] **Step 2: הרץ כדי לראות אותן נופלות**

Run: `npx vitest run lib/core/progress.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/core/progress"`.

- [x] **Step 3: כתוב את המימוש** — `lib/core/progress.ts`

```ts
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
```

- [x] **Step 4: הרץ עד ירוק**

Run: `npx vitest run lib/core/progress.test.ts`
Expected: PASS.

- [x] **Step 5: הרץ שתי מוטציות**

1. הפוך את `timeToFirstCorrectMs` לדריסה: `correct ? event.answeredAtMs - current.firstSeenAtMs : current.timeToFirstCorrectMs` — אמורה להפיל את `is never overwritten by a later correct answer` עם `expected 900000 to be 12000`.
2. החלף `attemptsToMastery: reachedMastery ? attempts : ...` ב-`consecutiveCorrectRecognition` — אמורה להפיל את `records the TOTAL attempts at the moment mastery is reached` עם `expected 3 to be 6`.

- [x] **Step 6: אימות מלא + קומיט**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/progress.ts lib/core/progress.test.ts
git commit -m "loop(DEV): T-005 progress aggregate with D-010 telemetry"
```

---

### Task 3: `lib/core/levelGate.ts` — שער עליית רמה מבוסס-מנות (7.7 / T-006)

**Files:**
- Create: `lib/core/levelGate.ts`
- Test: `lib/core/levelGate.test.ts`

**Interfaces:**
- Consumes: אין. השער מקבל את מצב החשיפה כנתון — הוא **אינו** מייבא את `progress.ts` כדי שאפשר יהיה לחשב אותו מקריאת DB אחת מקובצת.
- Produces:
```ts
export const BATCH_MIN_WORDS = 50;
export const BATCH_MAX_WORDS = 100;

export interface BatchWord {
  readonly wordId: string;
  readonly levelId: string;   // ⛔ אין null — מילה unleveled אינה בשער
  readonly seen: boolean;
}

export interface GateInput {
  readonly levelId: string;
  readonly batch: readonly BatchWord[];
  readonly triageActive: boolean;
  readonly hasExamDate: boolean;
}

export interface GateResult {
  readonly unlocked: boolean;
  readonly exposurePct: number;          // 0..100, מעוגל ל-0.1
  readonly missingWordIds: readonly string[];
  readonly bypass: 'none' | 'exam_triage';
  readonly noticeHe: string | null;
}

export const TRIAGE_NOTICE_HE = 'מצב מבחן: מתמקדים במה שיזיז לך את הציון';

export function checkBatchGate(input: GateInput): GateResult;
```

**החלטות שנקבעות כאן:**

1. **העקיפה דורשת את **שני** התנאים** — `hasExamDate && triageActive` — בדיוק כלשון 7.7 ("כאשר קיים exam_date **ומצב הטריאז'** פעיל"). ‏`triageActive` לבדו אינו מספיק, וזו לא כפילות: `scheduleReview` מחזיר `triage: false` כשאין מבחן, אבל קורא שיעביר דגל מחושב-לא-נכון יעקוף את השער לכל הלומדים.
2. **מילה מחוץ למנה אינה קלט.** ‏`levelId` של כל מילה חייב להיות שווה ל-`input.levelId`, אחרת `RangeError`. מנה שמערבת רמות היא באג קריאה, ותוצאת שער על תערובת חסרת משמעות.
3. **גודל המנה נאכף ב-50–100** (7.7). מנה של 3 מילים הייתה פותחת רמה אחרי שלוש חשיפות.
4. **`unlocked` הוא `exposurePct === 100`** ולא `>= 99.5`. ‏`missingWordIds` ריק **אם ורק אם** נעול=לא — שתי הצהרות על אותו דבר, ובדיקה נועלת אותן יחד.
5. **בעקיפה `unlocked: true` אבל `exposurePct` ממשיך לדווח את האמת.** אחוז שמזייף 100 כדי להצדיק פתיחה הוא בדיוק השקר שהופך מדד למראה.

- [ ] **Step 1: כתוב את הבדיקות הנופלות** — `lib/core/levelGate.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  BATCH_MAX_WORDS,
  BATCH_MIN_WORDS,
  TRIAGE_NOTICE_HE,
  checkBatchGate,
  type BatchWord,
} from '@/lib/core/levelGate';

function batch(size: number, seenCount: number, levelId = 'L2'): BatchWord[] {
  return Array.from({ length: size }, (_, i) => ({
    wordId: `w-${i}`,
    levelId,
    seen: i < seenCount,
  }));
}

const OPEN = { triageActive: false, hasExamDate: false } as const;

describe('checkBatchGate — the batch is the unit, not the level (W1)', () => {
  it('unlocks a fully exposed batch', () => {
    const out = checkBatchGate({ levelId: 'L2', batch: batch(50, 50), ...OPEN });
    expect(out.unlocked).toBe(true);
    expect(out.exposurePct).toBe(100);
    expect(out.missingWordIds).toEqual([]);
    expect(out.bypass).toBe('none');
    expect(out.noticeHe).toBeNull();
  });

  it('keeps a batch locked at 98% and names exactly what is missing', () => {
    const out = checkBatchGate({ levelId: 'L2', batch: batch(50, 49), ...OPEN });
    expect(out.unlocked).toBe(false);
    expect(out.exposurePct).toBe(98);
    expect(out.missingWordIds).toEqual(['w-49']);
  });

  it('reports exposure to one decimal place', () => {
    const out = checkBatchGate({ levelId: 'L2', batch: batch(60, 20), ...OPEN });
    expect(out.exposurePct).toBe(33.3);
  });

  it('rejects a batch smaller than the 7.7 floor', () => {
    expect(() =>
      checkBatchGate({ levelId: 'L2', batch: batch(BATCH_MIN_WORDS - 1, 0), ...OPEN }),
    ).toThrow(RangeError);
  });

  it('rejects a batch larger than the 7.7 ceiling', () => {
    expect(() =>
      checkBatchGate({ levelId: 'L2', batch: batch(BATCH_MAX_WORDS + 1, 0), ...OPEN }),
    ).toThrow(RangeError);
  });

  it('rejects a batch that mixes levels', () => {
    const mixed = batch(50, 50);
    const foreign = { wordId: 'w-x', levelId: 'L3', seen: true };
    expect(() =>
      checkBatchGate({ levelId: 'L2', batch: [...mixed.slice(1), foreign], ...OPEN }),
    ).toThrow(RangeError);
  });

  it('rejects a duplicated word id — it would inflate exposure', () => {
    const dup = batch(50, 50);
    expect(() =>
      checkBatchGate({
        levelId: 'L2',
        batch: [...dup.slice(0, 49), { wordId: 'w-0', levelId: 'L2', seen: true }],
        ...OPEN,
      }),
    ).toThrow(RangeError);
  });
});

describe('checkBatchGate — the 7.7 triage bypass', () => {
  it('opens a locked batch when an exam date exists AND triage is active', () => {
    const out = checkBatchGate({
      levelId: 'L2', batch: batch(50, 5), triageActive: true, hasExamDate: true,
    });
    expect(out.unlocked).toBe(true);
    expect(out.bypass).toBe('exam_triage');
    expect(out.noticeHe).toBe(TRIAGE_NOTICE_HE);
  });

  it('keeps reporting the TRUE exposure while bypassing', () => {
    const out = checkBatchGate({
      levelId: 'L2', batch: batch(50, 5), triageActive: true, hasExamDate: true,
    });
    expect(out.exposurePct).toBe(10);
    expect(out.missingWordIds).toHaveLength(45);
  });

  it('does NOT bypass on triage alone with no exam date', () => {
    const out = checkBatchGate({
      levelId: 'L2', batch: batch(50, 5), triageActive: true, hasExamDate: false,
    });
    expect(out.unlocked).toBe(false);
    expect(out.bypass).toBe('none');
  });

  it('does NOT bypass on an exam date alone without triage', () => {
    const out = checkBatchGate({
      levelId: 'L2', batch: batch(50, 5), triageActive: false, hasExamDate: true,
    });
    expect(out.unlocked).toBe(false);
    expect(out.bypass).toBe('none');
  });
});

describe('unlocked and missingWordIds can never disagree', () => {
  it('holds across every exposure count in a 50-word batch', () => {
    for (let seen = 0; seen <= 50; seen += 1) {
      const out = checkBatchGate({ levelId: 'L2', batch: batch(50, seen), ...OPEN });
      expect(out.unlocked).toBe(out.missingWordIds.length === 0);
    }
  });
});
```

- [ ] **Step 2: הרץ כדי לראות אותן נופלות**

Run: `npx vitest run lib/core/levelGate.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/core/levelGate"`.

- [ ] **Step 3: כתוב את המימוש** — `lib/core/levelGate.ts`

```ts
/**
 * PURE. No React, no DOM, no clock, no env. Engine 7.7 of plan/70-engines.md.
 *
 * The gate applies to a BATCH of 50-100 words, not to a whole level. W1: the old
 * "100% of every word in the level" rule contradicted 7.1 outright — in triage
 * only at-risk words are shown, so full level exposure is NEVER reached, and the
 * gate locked exactly the learner who most needed to advance.
 *
 * "Seen" is not "mastered": mastery is measured by the test itself and is not an
 * input here. Unleveled words (level_id = NULL, origin='unleveled') never enter a
 * batch at all — plan/15-syllabus-digest.md, ingestion rule 1.
 *
 * Enforcement is server-side (7.7). A UI that hides the button is not a gate.
 */
export const BATCH_MIN_WORDS = 50;
export const BATCH_MAX_WORDS = 100;

export const TRIAGE_NOTICE_HE = 'מצב מבחן: מתמקדים במה שיזיז לך את הציון';

export interface BatchWord {
  readonly wordId: string;
  /** Non-nullable on purpose: an unleveled word cannot be typed into a batch. */
  readonly levelId: string;
  readonly seen: boolean;
}

export interface GateInput {
  readonly levelId: string;
  readonly batch: readonly BatchWord[];
  /** From ReviewSchedule.triage of lib/core/scheduler.ts. */
  readonly triageActive: boolean;
  readonly hasExamDate: boolean;
}

export interface GateResult {
  readonly unlocked: boolean;
  readonly exposurePct: number;
  readonly missingWordIds: readonly string[];
  readonly bypass: 'none' | 'exam_triage';
  readonly noticeHe: string | null;
}

export function checkBatchGate(input: GateInput): GateResult {
  const { batch, levelId } = input;
  if (batch.length < BATCH_MIN_WORDS || batch.length > BATCH_MAX_WORDS) {
    throw new RangeError(
      `batch must hold ${BATCH_MIN_WORDS}-${BATCH_MAX_WORDS} words (7.7), got ${batch.length}`,
    );
  }

  const ids = new Set<string>();
  for (const word of batch) {
    if (word.levelId !== levelId) {
      throw new RangeError(
        `batch mixes levels: word ${word.wordId} is ${word.levelId}, batch is ${levelId}`,
      );
    }
    if (ids.has(word.wordId)) {
      throw new RangeError(`batch repeats word ${word.wordId} — exposure would be inflated`);
    }
    ids.add(word.wordId);
  }

  const missingWordIds = batch.filter((w) => !w.seen).map((w) => w.wordId);
  const seenCount = batch.length - missingWordIds.length;
  const exposurePct = Math.round((seenCount / batch.length) * 1000) / 10;

  // Both conditions, exactly as 7.7 words it. Triage alone must not open the gate:
  // scheduleReview returns triage=false with no exam, but a caller computing the
  // flag wrongly would otherwise unlock every level for every learner.
  const bypass = input.hasExamDate && input.triageActive ? 'exam_triage' : 'none';

  return {
    unlocked: bypass === 'exam_triage' || missingWordIds.length === 0,
    // The percentage keeps telling the truth even while the bypass is open. A
    // metric that fakes 100 to justify the unlock stops being a metric.
    exposurePct,
    missingWordIds,
    bypass,
    noticeHe: bypass === 'exam_triage' ? TRIAGE_NOTICE_HE : null,
  };
}
```

- [ ] **Step 4: הרץ עד ירוק**

Run: `npx vitest run lib/core/levelGate.test.ts`
Expected: PASS.

- [ ] **Step 5: הרץ שתי מוטציות**

1. החלף את תנאי העקיפה ב-`input.triageActive ? 'exam_triage' : 'none'` — אמורה להפיל את `does NOT bypass on triage alone with no exam date`.
2. החלף `exposurePct` ב-`bypass === 'exam_triage' ? 100 : exposurePct` — אמורה להפיל את `keeps reporting the TRUE exposure while bypassing` עם `expected 100 to be 10`.

- [ ] **Step 6: אימות מלא + קומיט**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/levelGate.ts lib/core/levelGate.test.ts
git commit -m "loop(DEV): T-006 engine 7.7 batch level gate with triage bypass"
```

---

### Task 4: התמדה ואכיפה בצד השרת — `POST /api/review`

**Files:**
- Create: `supabase/migrations/0005_review_state.sql`
- Create: `lib/supabase/reviewState.test.ts`
- Create: `app/api/review/route.ts`
- Create: `lib/core/reviewRequest.ts`
- Create: `lib/core/reviewRequest.test.ts`
- Modify: `docs/api-contract.md` (**באותו קומיט** — חוק גלובלי)

**Interfaces:**
- Consumes: `scheduleReview` · `SchedulerState` מ-Task 1 · `applyGrade` · `newWordProgress` · `WordProgress` מ-Task 2 · `toIsoDateInZone` · `LEARNER_TIME_ZONE` מ-`lib/core/onboarding.ts` · `BINARY_GRADES` · `CARD_DIRECTIONS` מ-`lib/core/flashcard.ts`.
- Produces:
```ts
// lib/core/reviewRequest.ts
export type ReviewPayload = {
  readonly wordId: string;
  readonly grade: CardGrade;
  readonly direction: CardDirection;
  readonly elapsedMs: number;
};
export type ReviewCheck =
  | { readonly ok: true; readonly payload: ReviewPayload }
  | { readonly ok: false; readonly code: 'unavailable' };
export const MAX_ELAPSED_MS = 600_000;
export function checkReviewPayload(body: unknown): ReviewCheck;
```

**החלטות שנקבעות כאן:**

1. **ולידציה **אחרי** בדיקת הסשן** — הדפוס של C-0032 ב-`POST /api/profile`. קורא לא מאומת לא ילמד אילו שדות מתקבלים.
2. **המיגרציה מוסיפה עמודות ל-`word_progress` הקיימת ואינה יוצרת טבלה שנייה.** ‏`easiness numeric(4,2) not null default 2.5` · `interval_days int not null default 0` · `repetition int not null default 0` · `next_review_at timestamptz` · `consecutive_correct_recognition int not null default 0`.
3. **`next_review_at` הוא nullable** — מילה שטרם נענתה אינה "לחזרה עכשיו", ו-`default now()` היה מציף את התור הראשון בכל מילה במאגר.
4. **שתי מגבלות `check` **בשם** בתוך `do $$`** — בדיוק הלקח של C-0032: `add column ... check` **מדולג כולו** כשהעמודה כבר קיימת, ואז המגבלה נשלחת חסרה לכל פרויקט שהריץ טיוטה מוקדמת.
5. **בדיקת המיגרציה מפשיטה הערות שורה לפני הסריקה** — הלקח של C-0032: על טקסט גולמי, ההערה שמסבירה כלל מספקת את הטענה שאמורה להוכיח שהכלל ממומש.
6. **`elapsedMs` נחסם ב-`MAX_ELAPSED_MS = 600_000`.** לומד שהשאיר כרטיס פתוח לילה שלם היה כותב `time_to_first_correct` בן 8 שעות ומזהם את המדד שכל הטלמטריה של D-010 קיימת בשבילו. חסימה ולא קיצוץ שקט: הבקשה נדחית ב-400.
7. **ה-`route` הוא `force-dynamic`** ואינו מיוצא כפונקציה טהורה — הוא הקצה: הוא זה שקורא לשעון (`new Date()`) ולסופאבייס, וכל חשבון עובר דרך שלוש הפונקציות הטהורות.

- [ ] **Step 1: כתוב את בדיקות המיגרציה הנופלות** — `lib/supabase/reviewState.test.ts`

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const RAW = readFileSync('supabase/migrations/0005_review_state.sql', 'utf8');
/** Comments explain the rules; only executable SQL may satisfy an assertion (C-0032). */
const SQL = RAW.split('\n')
  .map((line) => line.replace(/--.*$/, ''))
  .join('\n')
  .toLowerCase();

describe('0005_review_state.sql — SM-2 state on the existing aggregate', () => {
  it('extends word_progress and does not create a second table', () => {
    expect(SQL).toMatch(/alter table\s+(public\.)?word_progress/);
    expect(SQL).not.toMatch(/create table[\s\S]*review/);
  });

  it.each([
    'easiness',
    'interval_days',
    'repetition',
    'next_review_at',
    'consecutive_correct_recognition',
  ])('adds the %s column', (column) => {
    expect(SQL).toMatch(new RegExp(`add column if not exists\\s+${column}\\b`));
  });

  it('leaves next_review_at nullable — an unanswered word is not due', () => {
    expect(SQL).not.toMatch(/next_review_at\s+timestamptz\s+not null/);
  });

  it('seeds easiness at the SM-2 initial value', () => {
    expect(SQL).toMatch(/easiness\s+numeric\(4,\s*2\)\s+not null\s+default\s+2\.5/);
  });

  it('declares both check constraints BY NAME so a re-run cannot skip them', () => {
    expect(SQL).toMatch(/do \$\$/);
    expect(SQL).toMatch(/word_progress_easiness_floor/);
    expect(SQL).toMatch(/word_progress_interval_nonneg/);
  });

  it('is re-runnable without damage', () => {
    expect(SQL).toMatch(/add column if not exists/);
    expect(SQL).not.toMatch(/drop table/);
  });

  it('does not weaken the RLS that 0003 established', () => {
    expect(SQL).not.toMatch(/disable row level security/);
    expect(SQL).not.toMatch(/drop policy/);
  });
});
```

- [ ] **Step 2: הרץ — היא נופלת על קובץ חסר**

Run: `npx vitest run lib/supabase/reviewState.test.ts`
Expected: FAIL — `ENOENT ... 0005_review_state.sql`.

- [ ] **Step 3: כתוב את המיגרציה** — `supabase/migrations/0005_review_state.sql`

```sql
-- 0005_review_state.sql — SM-2 state for engine 7.1, on the EXISTING aggregate.
--
-- word_progress stays ONE ROW PER (user, word). 0003 records W4 (the free Supabase
-- tier) as the reason there is no per-review event log, and nothing here changes it.
--
-- next_review_at is deliberately NULLABLE: a word the learner has never answered is
-- not "due now", and `default now()` would flood the very first queue with the whole
-- dictionary.
--
-- Idempotent: `add column if not exists` throughout. The CHECK constraints are declared
-- separately BY NAME inside `do $$`, because `add column ... check` is skipped WHOLE
-- when the column already exists — a project that ran an early draft would then be
-- missing the constraint silently (measured C-0032).

alter table public.word_progress
  add column if not exists easiness numeric(4,2) not null default 2.5;

alter table public.word_progress
  add column if not exists interval_days int not null default 0;

alter table public.word_progress
  add column if not exists repetition int not null default 0;

alter table public.word_progress
  add column if not exists next_review_at timestamptz;

alter table public.word_progress
  add column if not exists consecutive_correct_recognition int not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'word_progress_easiness_floor'
  ) then
    alter table public.word_progress
      add constraint word_progress_easiness_floor check (easiness >= 1.3);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'word_progress_interval_nonneg'
  ) then
    alter table public.word_progress
      add constraint word_progress_interval_nonneg
      check (interval_days >= 0 and repetition >= 0 and consecutive_correct_recognition >= 0);
  end if;
end $$;

create index if not exists word_progress_due_idx
  on public.word_progress (user_id, next_review_at);
```

- [ ] **Step 4: הרץ עד ירוק**

Run: `npx vitest run lib/supabase/reviewState.test.ts`
Expected: PASS.

- [ ] **Step 5: כתוב את בדיקות הוולידציה הנופלות** — `lib/core/reviewRequest.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { MAX_ELAPSED_MS, checkReviewPayload } from '@/lib/core/reviewRequest';

const VALID = {
  word_id: '11111111-2222-3333-4444-555555555555',
  grade: 'good',
  direction: 'recognition',
  elapsed_ms: 4200,
};

describe('checkReviewPayload', () => {
  it('accepts a well-formed body', () => {
    const out = checkReviewPayload(VALID);
    expect(out).toEqual({
      ok: true,
      payload: {
        wordId: VALID.word_id,
        grade: 'good',
        direction: 'recognition',
        elapsedMs: 4200,
      },
    });
  });

  it.each([null, undefined, 'good', 42, [], true])('rejects the non-object body %p', (body) => {
    expect(checkReviewPayload(body)).toEqual({ ok: false, code: 'unavailable' });
  });

  it('rejects a grade outside BINARY_GRADES', () => {
    expect(checkReviewPayload({ ...VALID, grade: 'hard' }).ok).toBe(false);
  });

  it('rejects a direction outside CARD_DIRECTIONS', () => {
    expect(checkReviewPayload({ ...VALID, direction: 'listening' }).ok).toBe(false);
  });

  it('rejects a word_id that is not a uuid', () => {
    expect(checkReviewPayload({ ...VALID, word_id: 'not-a-uuid' }).ok).toBe(false);
  });

  it('rejects a negative elapsed_ms', () => {
    expect(checkReviewPayload({ ...VALID, elapsed_ms: -1 }).ok).toBe(false);
  });

  it('rejects a fractional elapsed_ms', () => {
    expect(checkReviewPayload({ ...VALID, elapsed_ms: 12.5 }).ok).toBe(false);
  });

  it('rejects an abandoned card rather than recording an 8-hour answer', () => {
    expect(checkReviewPayload({ ...VALID, elapsed_ms: MAX_ELAPSED_MS + 1 }).ok).toBe(false);
    expect(checkReviewPayload({ ...VALID, elapsed_ms: MAX_ELAPSED_MS }).ok).toBe(true);
  });
});
```

- [ ] **Step 6: הרץ — נופלת על ייבוא חסר**

Run: `npx vitest run lib/core/reviewRequest.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/core/reviewRequest"`.

- [ ] **Step 7: כתוב את הוולידציה** — `lib/core/reviewRequest.ts`

```ts
/**
 * PURE. No React, no DOM, no clock, no env. The wire shape of POST /api/review.
 *
 * The bound on elapsed_ms is a data-quality guard, not paranoia: a learner who left
 * a card open overnight would otherwise write an eight-hour time_to_first_correct
 * into the one D-010 field the whole telemetry layer exists to hold. Rejected with
 * 400, never silently clamped — a clamped 600000 is indistinguishable from a real one.
 */
import { BINARY_GRADES, CARD_DIRECTIONS, type CardDirection, type CardGrade } from '@/lib/core/flashcard';

export const MAX_ELAPSED_MS = 600_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReviewPayload = {
  readonly wordId: string;
  readonly grade: CardGrade;
  readonly direction: CardDirection;
  readonly elapsedMs: number;
};

export type ReviewCheck =
  | { readonly ok: true; readonly payload: ReviewPayload }
  | { readonly ok: false; readonly code: 'unavailable' };

const REJECT: ReviewCheck = { ok: false, code: 'unavailable' };

export function checkReviewPayload(body: unknown): ReviewCheck {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return REJECT;
  const raw = body as Record<string, unknown>;

  const wordId = raw.word_id;
  if (typeof wordId !== 'string' || !UUID.test(wordId)) return REJECT;

  const grade = raw.grade;
  if (typeof grade !== 'string' || !BINARY_GRADES.includes(grade as CardGrade)) return REJECT;

  const direction = raw.direction;
  if (typeof direction !== 'string' || !CARD_DIRECTIONS.includes(direction as CardDirection)) {
    return REJECT;
  }

  const elapsedMs = raw.elapsed_ms;
  if (!Number.isInteger(elapsedMs)) return REJECT;
  const ms = elapsedMs as number;
  if (ms < 0 || ms > MAX_ELAPSED_MS) return REJECT;

  return {
    ok: true,
    payload: {
      wordId,
      grade: grade as CardGrade,
      direction: direction as CardDirection,
      elapsedMs: ms,
    },
  };
}
```

- [ ] **Step 8: הרץ עד ירוק**

Run: `npx vitest run lib/core/reviewRequest.test.ts`
Expected: PASS.

- [ ] **Step 9: כתוב את ה-route** — `app/api/review/route.ts`

השתמש ב-`app/api/profile/route.ts` כתבנית מדויקת לקריאת הסשן, לצורת התשובה ולסדר (סשן → ולידציה → כתיבה). **קרא אותו לפני שאתה כותב** ואל תמציא צורת תשובה חדשה. הגוף:

```ts
export const dynamic = 'force-dynamic';
```

הזרימה, בסדר הזה בדיוק:

1. קרא את הסשן כמו ב-`app/api/profile/route.ts`. אין משתמש → אותו כשל בדיוק שהקובץ ההוא מחזיר. ⛔ אין לקרוא את הגוף לפני זה.
2. `const check = checkReviewPayload(await request.json().catch(() => null));` — כשל → 400 עם `{ ok: false, code: 'unavailable' }`.
3. `const nowMs = Date.now();` ו-`const today = toIsoDateInZone(new Date(nowMs), LEARNER_TIME_ZONE);` — **זו הנקודה היחידה בזרימה שנוגעת בשעון.**
4. קרא את שורת `word_progress` של `(user.id, payload.wordId)` ואת `exam_date` מ-`profiles`. שורה חסרה → `newWordProgress(nowMs - payload.elapsedMs)`.
5. `applyGrade(current, { grade, direction, answeredAtMs: nowMs }, { masteryConsecutiveCorrect: MASTERY_CONSECUTIVE_CORRECT })` — הקבוע מוגדר **בקובץ ה-route** עם הערה שהוא פרמטר מוצר שממתין למדידה, ולא ב-`/lib/core`.
6. `scheduleReview({ state, grade, today, examDate, policy: { triageMinUsableDays: TRIAGE_MIN_USABLE_DAYS } })` — אותו דבר לגבי הקבוע.
7. `update` (⛔ לא `upsert`, D-016) על השורה אם קיימת, `insert` אם לא. כתוב את חמש העמודות החדשות ואת שדות הטלמטריה של D-010 יחד.
8. החזר `{ ok: true, next_review_at, mode, triage }` — ⛔ **בלי** `missing_word_ids` ובלי מצב שער: זה נתיב אחר.

- [ ] **Step 10: עדכן את `docs/api-contract.md` באותו קומיט**

הוסף סעיף `POST /api/review` בפורמט הקיים בקובץ: הגוף המתקבל (‏`word_id` · `grade` · `direction` · `elapsed_ms` עם התקרה), קודי התשובה (200 · 400 `unavailable` · אותו קוד סשן שה-`profile` מחזיר), והשורה המפורשת שהאכיפה היא בצד השרת (7.7).

- [ ] **Step 11: אימות מלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
```

- [ ] **Step 12: הרץ את מוטציית הסחיפה**

הוסף `'hard'` ל-`BINARY_GRADES` ב-`lib/core/flashcard.ts` **בלי** לגעת ב-`reviewRequest.ts` — `rejects a grade outside BINARY_GRADES` אמורה ליפול. החזר. זהו המחסום שמונע סחיפה בין אוצר הדירוגים של הכרטיס לבין מה שה-API מקבל.

- [ ] **Step 13: קומיט**

```bash
git add supabase/migrations/0005_review_state.sql lib/supabase/reviewState.test.ts \
        lib/core/reviewRequest.ts lib/core/reviewRequest.test.ts \
        app/api/review/route.ts docs/api-contract.md
git commit -m "loop(DEV): T-005 review persistence + server-side 7.7 enforcement"
```

---

## סגירה אחרי משימה 4

- [ ] `plan/50-tasks.md`: T-005 ו-T-006 → 🟣 עם הראיות בפועל (מספרי בדיקות לפני/אחרי, פלט `build`).
- [ ] `plan/30-architecture.md`: שלוש שורות חוב חדשות — ‏`triageMinUsableDays` · `masteryConsecutiveCorrect` · `MASTERY_CONSECUTIVE_CORRECT` הם שלושה מספרים שאין להם מקור, ו-`0005_review_state.sql` טרם הורץ בפרויקט Supabase חי (אותו מעמד כמו TD-8).
- [ ] `plan/00-control.md`: `CYCLE_ID` · `NEXT_AGENT=CRITIC` · שחרור הנעילה · שורת יומן.

## בדיקה עצמית של התוכנית

**כיסוי מול המפרט:**

| דרישה | איפה |
|---|---|
| 7.1 — נוסחאות SM-2 מהמקור | משימה 1, `updateEasiness` + `classicInterval` + 4 בדיקות נוסחה |
| 7.1 — `gap` נגזר ולא קבוע | משימה 1, `preExamGapDays` + 3 בדיקות clamp |
| 7.1 — "מילים קשות" מסומן `HEURISTIC` | משימה 1, docblock + בדיקה סורקת-מקור |
| 7.1 — מצב טריאז' | משימה 1, `triage` + 3 בדיקות |
| T-005 — ידעתי/לא ידעתי | משימה 2, `applyGrade` על `CardGrade` הקיים |
| T-005 — מעקב חשיפה | משימה 2, `isExposed` · משימה 4, `attempts` בשורה |
| D-010 — `time_to_first_correct` | משימה 2, 2 בדיקות (כולל אי-דריסה) |
| D-010 — `attempts_to_mastery` | משימה 2, 3 בדיקות |
| 7.7 — מנה 50–100 | משימה 3, `BATCH_MIN/MAX_WORDS` + 2 בדיקות |
| 7.7 — `{unlocked, exposure_pct, missing_word_ids}` | משימה 3, `GateResult` |
| 7.7 — עקיפת טריאז' + ההודעה בעברית | משימה 3, `TRIAGE_NOTICE_HE` + 4 בדיקות |
| 7.7 — אכיפה בצד השרת | משימה 4, `POST /api/review` |
| מילה unleveled אינה בשער | משימה 3, `levelId: string` לא-nullable + בדיקת תערובת |

**מה התוכנית הזו **אינה** מכסה, במפורש:**
- ⛔ **אין מסך.** אין רכיב React, אין `check:mobile`, אין `/dev/*`. ‏`components/Flashcard.tsx` כבר קיים (T-041) ומחכה לחיווט — זה טיק אחר, ובלי תוכן (P-001) הוא ממילא אינו ניתן להרצה מקצה לקצה.
- ⛔ **אין קריאת תור.** ‏`planDailyQueue` (T-031) קיים; חיבורו לשאילתת ה-`next_review_at` הוא ה-`GET /api/study` שאינו כאן.
- ⛔ **`0005_review_state.sql` לא ירוץ מול Supabase חי בלופ** — אותה מגבלה של TD-4/TD-8, נרשמת כחוב ולא נטענת כמאומתת.
- ⛔ **`gapAnalysis` (7.2) · `velocity` (7.3) · `confidence` (7.4) · `distractors` (7.5) אינם כאן.** T-033 קובעת שהימורי הביטחון יורדים מכותרת הבידול, ושלושת האחרים אינם על המסלול.
