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
