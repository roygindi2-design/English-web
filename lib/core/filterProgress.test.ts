import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { counterCells, filterProgress } from '@/lib/core/filterProgress';

describe('filterProgress — הפס של 36 § 5 (T-210 · D-123)', () => {
  it('מחלק את הפס בדיוק כפי ש-36 § 5 מצייר אותו', () => {
    const bar = filterProgress({ totalInLevel: 400, known: 61, inReviewList: 25, unseen: 314 });
    expect(bar.labelHe).toBe('86 / 400 סוננו');
    expect(bar.knownPct + bar.unknownPct + bar.restPct).toBeCloseTo(100, 10);
  });

  it('רמה בלי מילים היא 0%, ⛔ ולא NaN', () => {
    const bar = filterProgress({ totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 });
    expect(bar.knownPct).toBe(0);
    expect(bar.unknownPct).toBe(0);
    expect(bar.restPct).toBe(0);
    expect(bar.labelHe).toBe('0 / 0 סוננו');
  });

  it('⛔ אינו מצייר פס רחב מהמסילה — הוא זורק', () => {
    expect(() => filterProgress({ totalInLevel: 10, known: 8, inReviewList: 5, unseen: 0 })).toThrow(
      RangeError,
    );
  });

  it('⛔ סך שאינו מספר שלם אי-שלילי הוא חריגה, ⛔ ולא ניחוש', () => {
    expect(() => filterProgress({ totalInLevel: -1, known: 0, inReviewList: 0, unseen: 0 })).toThrow(
      RangeError,
    );
    expect(() =>
      filterProgress({ totalInLevel: 1.5, known: 0, inReviewList: 0, unseen: 0 }),
    ).toThrow(RangeError);
  });
});

describe('counterCells — שלושת המונים (T-210 · 36 § 5 · 36 § 12.7)', () => {
  it('סיכום חסר נקרא «—», ⛔ ולעולם לא 0', () => {
    expect(counterCells(null).map((c) => c.value)).toEqual([null, null, null]);
  });

  it('המונים נושאים את תוויות 36 § 5, בסדר RTL', () => {
    const cells = counterCells({ totalInLevel: 400, known: 61, inReviewList: 25, unseen: 314 });
    expect(cells.map((c) => c.labelHe)).toEqual(['ידעתי', 'לא ידעתי', 'לא סוננו']);
    expect(cells.map((c) => c.value)).toEqual([61, 25, 314]);
  });

  it('⛔ הסדר מוצהר במודול, ⛔ ולא בסדר האלמנטים ב-JSX', () => {
    const src = readFileSync('lib/core/filterProgress.ts', 'utf8');
    const start = src.indexOf('export function counterCells');
    expect(start).toBeGreaterThan(-1);
    const body = src.slice(start);
    expect(body.indexOf("'ידעתי'")).toBeLessThan(body.indexOf("'לא ידעתי'"));
    expect(body.indexOf("'לא ידעתי'")).toBeLessThan(body.indexOf("'לא סוננו'"));
  });
});
