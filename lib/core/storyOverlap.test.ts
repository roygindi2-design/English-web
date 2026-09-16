import { describe, expect, it } from 'vitest';
import {
  cumulativeRepeatCurve,
  maximiseOverlapOrder,
  repetitionProfile,
  storyContentWords,
  type OverlapCandidate,
} from './storyOverlap';

const S = (n: number, body: string): OverlapCandidate => ({
  id: `id-${n}`,
  bodyEn: body,
  createdAt: `2026-08-${String(10 + n).padStart(2, '0')}T00:00:00Z`,
});

describe('storyContentWords — the FLOOR the product already tappable-gates on', () => {
  it('drops the function words `36 § 3.1` names and keeps the content words', () => {
    const words = storyContentWords('The student walks to the office.');
    expect([...words].sort()).toEqual(['office', 'student', 'walks']);
  });

  it('is case- and punctuation-insensitive, so `River.` and `river` are one word', () => {
    const words = storyContentWords('River. river RIVER!');
    expect([...words]).toEqual(['river']);
  });

  it('counts a word once per story, ⛔ however often it repeats inside it', () => {
    expect(storyContentWords('market market market').size).toBe(1);
  });
});

describe('repetitionProfile — the CEILING, and it is order-invariant', () => {
  const pool = [
    S(1, 'market river'),
    S(2, 'market office'),
    S(3, 'river office'),
  ];

  it('counts the distinct content words of the whole pool and how many recur', () => {
    const p = repetitionProfile(pool);
    expect(p.distinct).toBe(3);
    expect(p.metTwiceOrMore).toBe(3);
    expect(p.metOnce).toBe(0);
  });

  it('⛔ does NOT move when the pool is permuted — reordering ⛔ cannot raise it', () => {
    const a = repetitionProfile(pool);
    const b = repetitionProfile([pool[2]!, pool[0]!, pool[1]!]);
    expect(b).toEqual(a);
  });
});

describe('cumulativeRepeatCurve — the one thing an order CAN move', () => {
  it('reports, after each story, how many words have been met twice or more', () => {
    const curve = cumulativeRepeatCurve([
      S(1, 'market river'),
      S(2, 'market river'),
      S(3, 'office'),
    ]);
    expect(curve).toEqual([0, 2, 2]);
  });

  it('is LOWER for an order that front-loads unrelated stories', () => {
    const near = cumulativeRepeatCurve([
      S(1, 'market river'),
      S(2, 'market river'),
      S(3, 'office desk'),
    ]);
    const far = cumulativeRepeatCurve([
      S(1, 'market river'),
      S(3, 'office desk'),
      S(2, 'market river'),
    ]);
    expect(near[1]).toBe(2);
    expect(far[1]).toBe(0);
    expect(near[2]).toBe(far[2]);
  });
});

describe('maximiseOverlapOrder — deterministic, and ⛔ never worse at any step', () => {
  const pool = [
    S(1, 'market river'),
    S(2, 'office desk'),
    S(3, 'market river'),
  ];

  it('returns the same order for two calls on a permuted input', () => {
    const a = maximiseOverlapOrder(pool).map((s) => s.id);
    const b = maximiseOverlapOrder([...pool].reverse()).map((s) => s.id);
    expect(a).toEqual(b);
  });

  it('keeps the deterministic FIRST story, so today’s story ⛔ does not change', () => {
    expect(maximiseOverlapOrder(pool)[0]!.id).toBe('id-1');
  });

  it('pulls the overlapping story forward — the curve rises no later', () => {
    const maximised = cumulativeRepeatCurve(maximiseOverlapOrder(pool));
    const asWritten = cumulativeRepeatCurve(pool);
    expect(maximised[1]).toBe(2);
    expect(asWritten[1]).toBe(0);
    for (let k = 0; k < maximised.length; k += 1) {
      expect(maximised[k]!).toBeGreaterThanOrEqual(asWritten[k]!);
    }
  });

  it('returns every story exactly once, ⛔ dropping none', () => {
    expect(maximiseOverlapOrder(pool).map((s) => s.id).sort()).toEqual(['id-1', 'id-2', 'id-3']);
  });

  it('handles an empty pool without throwing', () => {
    expect(maximiseOverlapOrder([])).toEqual([]);
  });
});
