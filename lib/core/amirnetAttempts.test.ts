import { describe, expect, it } from 'vitest';
import { toTypeStats } from './amirnetAttempts';
import { AMIRNET_TYPES, hasAnyAnswers, toTypeCards, weakestCard, NEVER_PRACTISED_HE } from './amirnetPractice';

/**
 * T-372ⓓ — the fold between `public.amirnet_practice_attempts` and the dashboard's three cards.
 *
 * ⚠️ The fixture shape is the ROUTE's shape (`type: string`, `correct: boolean`), ⛔ not a
 * pre-narrowed union — «a fixture that differs from production data in ANY dimension is a hole»
 * (DEV.md, 23/08). The unknown-type case below is only reachable because of that.
 */
describe('toTypeStats — T-372', () => {
  it('returns one stat per type, in the render order, even for types with no rows', () => {
    const stats = toTypeStats([{ type: 'sc', correct: true }]);
    expect(stats.map((s) => s.type)).toEqual(AMIRNET_TYPES.map((t) => t.type));
    expect(stats).toHaveLength(3);
  });

  it('counts answered and correct per type', () => {
    const stats = toTypeStats([
      { type: 'sc', correct: true },
      { type: 'sc', correct: false },
      { type: 'sc', correct: true },
      { type: 'rs', correct: false },
    ]);
    expect(stats.find((s) => s.type === 'sc')).toEqual({ type: 'sc', answered: 3, correct: 2 });
    expect(stats.find((s) => s.type === 'rs')).toEqual({ type: 'rs', answered: 1, correct: 0 });
    expect(stats.find((s) => s.type === 'rc')).toEqual({ type: 'rc', answered: 0, correct: 0 });
  });

  it('⛔ drops an unknown type instead of coercing it onto a neighbour', () => {
    const stats = toTypeStats([
      { type: 'xx', correct: true },
      { type: 'sc', correct: true },
    ]);
    expect(stats.reduce((n, s) => n + s.answered, 0)).toBe(1);
    expect(stats.find((s) => s.type === 'sc')?.answered).toBe(1);
  });

  it('no rows ⇒ the T-291ⓓ empty state survives — ⛔ no 0% is invented', () => {
    const stats = toTypeStats([]);
    expect(hasAnyAnswers(stats)).toBe(false);
    expect(weakestCard(stats)).toBeNull();
    for (const card of toTypeCards(stats)) {
      expect(card.successPct).toBeNull();
      expect(card.answeredShortHe).toBe(NEVER_PRACTISED_HE);
    }
  });

  /** 📏 T-372's own finish measure, as a test: five answers in `sc` read back as `5 שאלות`. */
  it('📏 five sc answers ⇒ the card reads `5 שאלות` and a real percentage', () => {
    const rows = [true, true, false, true, false].map((correct) => ({ type: 'sc', correct }));
    const card = toTypeCards(toTypeStats(rows)).find((c) => c.type === 'sc');
    expect(card?.answeredShortHe).toBe('5 שאלות');
    expect(card?.successPct).toBe(60);
  });

  it('⛔ carries no score, estimate or streak field (D-050 · 41 § 9.2)', () => {
    const stats = toTypeStats([{ type: 'sc', correct: true }]);
    for (const stat of stats) {
      expect(Object.keys(stat).sort()).toEqual(['answered', 'correct', 'type']);
    }
  });
});
