import { describe, expect, it } from 'vitest';
import {
  AMIRNET_LEVELS,
  AMIRNET_TYPES,
  LEVEL_CHIP_HE,
  NEVER_PRACTISED_HE,
  practiceReady,
  toTypeCards,
  weakestType,
} from './amirnetPractice';

describe('amirnetPractice — T-286, 41 § 7', () => {
  it('gives a type with zero answers no percentage at all — 0% would be a lie', () => {
    const card = toTypeCards([{ type: 'sc', answered: 0, correct: 0 }])[0]!;
    expect(card.successPct).toBeNull();
    expect(card.answeredHe).toBe(NEVER_PRACTISED_HE);
    expect(card.answeredHe).not.toContain('0%');
    expect(card.answeredHe).not.toBe('—');
  });

  it('rounds a real percentage and writes the count in Hebrew', () => {
    const card = toTypeCards([{ type: 'rs', answered: 61, correct: 33 }])[0]!;
    expect(card.successPct).toBe(54);
    expect(card.answeredHe).toBe('61 שאלות שנענו');
  });

  it('names no weak type when the two lowest are tied — ⛔ never guesses between them', () => {
    expect(
      weakestType([
        { type: 'sc', answered: 10, correct: 9 },
        { type: 'rs', answered: 10, correct: 5 },
        { type: 'rc', answered: 10, correct: 5 },
      ]),
    ).toBeNull();
  });

  it('names no weak type from a type the learner never tried (the T-291 failure scenario)', () => {
    expect(
      weakestType([
        { type: 'sc', answered: 3, correct: 3 },
        { type: 'rs', answered: 0, correct: 0 },
        { type: 'rc', answered: 0, correct: 0 },
      ]),
    ).toBeNull();
  });

  it('names no weak type while even one type is untried — a comparison needs all three', () => {
    expect(
      weakestType([
        { type: 'sc', answered: 20, correct: 18 },
        { type: 'rs', answered: 20, correct: 4 },
        { type: 'rc', answered: 0, correct: 0 },
      ]),
    ).toBeNull();
  });

  it('names the weak type when one type really is lowest', () => {
    expect(
      weakestType([
        { type: 'sc', answered: 124, correct: 97 },
        { type: 'rs', answered: 61, correct: 33 },
        { type: 'rc', answered: 45, correct: 30 },
      ]),
    ).toBe('rs');
  });

  it('names no weak type at all when nothing was ever answered', () => {
    expect(
      weakestType([
        { type: 'sc', answered: 0, correct: 0 },
        { type: 'rs', answered: 0, correct: 0 },
        { type: 'rc', answered: 0, correct: 0 },
      ]),
    ).toBeNull();
  });

  it('opens no question until BOTH the type and the level are chosen (41 § 7)', () => {
    expect(practiceReady(null, 2)).toBe(false);
    expect(practiceReady('sc', null)).toBe(false);
    expect(practiceReady(null, null)).toBe(false);
    expect(practiceReady('sc', 2)).toBe(true);
  });

  it('carries exactly the three types and the four manual levels', () => {
    expect(AMIRNET_TYPES.map((t) => t.type)).toEqual(['sc', 'rs', 'rc']);
    expect(AMIRNET_TYPES.map((t) => t.nameHe)).toEqual(['השלמת משפטים', 'ניסוח מחדש', 'הבנת הנקרא']);
    expect(AMIRNET_LEVELS).toEqual([1, 2, 3, 4]);
    expect(LEVEL_CHIP_HE(3)).toBe('רמה 3');
  });
});
