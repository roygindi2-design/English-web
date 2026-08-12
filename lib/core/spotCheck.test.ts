import { describe, expect, it } from 'vitest';
import { batchVerdict, selectForSpotCheck, spotCheckPlan } from './spotCheck';

describe('spotCheckPlan', () => {
  it('implements the one row R-014 documents: 501-1200 -> inspect 80, accept up to 2', () => {
    for (const lot of [501, 800, 1200]) {
      const p = spotCheckPlan(lot);
      expect(p.inspect).toBe(80);
      expect(p.acceptUpTo).toBe(2);
      expect(p.basis).toBe('iso-2859-1-aql-1.0');
    }
  });

  it('inspects 100% below 501 rather than inventing a sample size', () => {
    const p = spotCheckPlan(343); // our real lot
    expect(p.inspect).toBe(343);
    expect(p.acceptUpTo).toBe(2);
    expect(p.basis).toBe('full');
    expect(p.rationale).toMatch(/501/); // says WHY, naming the boundary we hold
  });

  it('refuses a lot above the documented range instead of extrapolating', () => {
    expect(() => spotCheckPlan(1201)).toThrow(/1,?200/);
  });

  it('refuses an empty or negative lot', () => {
    expect(() => spotCheckPlan(0)).toThrow(/lot/);
    expect(() => spotCheckPlan(-5)).toThrow(/lot/);
  });
});

describe('selectForSpotCheck', () => {
  const items = Array.from({ length: 600 }, (_, i) => i);

  it('picks exactly plan.inspect items', () => {
    expect(selectForSpotCheck(items, spotCheckPlan(600))).toHaveLength(80);
  });

  it('is deterministic — same input, same output, twice', () => {
    const a = selectForSpotCheck(items, spotCheckPlan(600));
    const b = selectForSpotCheck(items, spotCheckPlan(600));
    expect(a).toEqual(b);
  });

  it('spreads across the whole lot instead of taking the first 80', () => {
    const picked = selectForSpotCheck(items, spotCheckPlan(600));
    expect(picked).not.toEqual(items.slice(0, 80));
    expect(Math.max(...picked)).toBeGreaterThan(500);
    expect(Math.min(...picked)).toBeLessThan(20);
    expect(new Set(picked).size).toBe(80); // no duplicates
  });

  it('returns every item when the plan is full inspection', () => {
    const small = Array.from({ length: 343 }, (_, i) => i);
    expect(selectForSpotCheck(small, spotCheckPlan(343))).toEqual(small);
  });

  it('refuses a plan built for a different lot size', () => {
    expect(() => selectForSpotCheck(items, spotCheckPlan(343))).toThrow(/lot/);
  });
});

describe('batchVerdict', () => {
  it('accepts at the boundary and rejects one past it — R-014 says "up to 2"', () => {
    const p = spotCheckPlan(600);
    expect(batchVerdict(2, p)).toBe('accept');
    expect(batchVerdict(3, p)).toBe('reject');
    expect(batchVerdict(0, p)).toBe('accept');
  });

  it('rejects more defects than items inspected as a caller error', () => {
    expect(() => batchVerdict(81, spotCheckPlan(600))).toThrow(/inspected/);
  });
});
