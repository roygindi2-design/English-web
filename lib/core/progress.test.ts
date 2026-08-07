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
    p = applyGrade(p, recognition('good', T0 + 2_000), POLICY); // 2
    p = applyGrade(p, recognition('again', T0 + 3_000), POLICY); // 3
    p = applyGrade(p, recognition('good', T0 + 4_000), POLICY); // 4
    p = applyGrade(p, recognition('good', T0 + 5_000), POLICY); // 5
    p = applyGrade(p, recognition('good', T0 + 6_000), POLICY); // 6 -> streak 3
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
