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
      levelId: 'L2',
      batch: batch(50, 5),
      triageActive: true,
      hasExamDate: true,
    });
    expect(out.unlocked).toBe(true);
    expect(out.bypass).toBe('exam_triage');
    expect(out.noticeHe).toBe(TRIAGE_NOTICE_HE);
  });

  it('keeps reporting the TRUE exposure while bypassing', () => {
    const out = checkBatchGate({
      levelId: 'L2',
      batch: batch(50, 5),
      triageActive: true,
      hasExamDate: true,
    });
    expect(out.exposurePct).toBe(10);
    expect(out.missingWordIds).toHaveLength(45);
  });

  it('does NOT bypass on triage alone with no exam date', () => {
    const out = checkBatchGate({
      levelId: 'L2',
      batch: batch(50, 5),
      triageActive: true,
      hasExamDate: false,
    });
    expect(out.unlocked).toBe(false);
    expect(out.bypass).toBe('none');
  });

  it('does NOT bypass on an exam date alone without triage', () => {
    const out = checkBatchGate({
      levelId: 'L2',
      batch: batch(50, 5),
      triageActive: false,
      hasExamDate: true,
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
