import { describe, expect, it } from 'vitest';
import {
  AMIRNET_LEVELS,
  AMIRNET_TYPES,
  LEVEL_CHIP_HE,
  NEVER_PRACTISED_HE,
  STATS_UNKNOWN_HE,
  hasAnyAnswers,
  practiceReady,
  toTypeCards,
  unknownStatsCards,
  weakestCard,
  weakestType,
  zeroStats,
  type AmirnetTypeStat,
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

describe('T-291 — the dashboard is the first READER of these numbers', () => {
  const full: readonly AmirnetTypeStat[] = [
    { type: 'sc', answered: 124, correct: 97 },
    { type: 'rs', answered: 61, correct: 33 },
    { type: 'rc', answered: 45, correct: 30 },
  ];

  it('`answeredShortHe` is the dashboard wording, ⛔ and a DIFFERENT string from the menu\'s', () => {
    const sc = toTypeCards(full)[0]!;
    expect(sc.answeredShortHe).toBe('124 שאלות'); // render_video_D.py:76
    expect(sc.answeredHe).toBe('124 שאלות שנענו'); // :121 — the menu
    expect(sc.answeredShortHe).not.toBe(sc.answeredHe);
  });

  it('a never-practised type says so in BOTH wordings — ⛔ never «0 שאלות», which reads as data', () => {
    const card = toTypeCards([{ type: 'rc', answered: 0, correct: 0 }])[0]!;
    expect(card.answeredShortHe).toBe(NEVER_PRACTISED_HE);
    expect(card.answeredShortHe).not.toContain('0');
  });

  it('`hasAnyAnswers` counts ANSWERS and ⛔ not cards — three cards at zero is the day-one learner', () => {
    expect(hasAnyAnswers(zeroStats())).toBe(false);
    expect(zeroStats()).toHaveLength(3);
    expect(hasAnyAnswers([{ type: 'sc', answered: 1, correct: 0 }])).toBe(true);
  });

  it('`zeroStats` carries all three types, each at zero — ⛔ and invents ⛔ no statistic', () => {
    expect(zeroStats().map((s) => s.type)).toEqual(['sc', 'rs', 'rc']);
    for (const s of zeroStats()) expect([s.answered, s.correct]).toEqual([0, 0]);
  });

  it('the strip is the render\'s two lines, already written (render_video_D.py:85-88)', () => {
    const w = weakestCard(full);
    expect(w?.type).toBe('rs');
    expect(w?.successPct).toBe(54);
    expect(w?.titleHe).toBe('החולשה שלך: ניסוח מחדש');
    expect(w?.adviceHe).toBe('54% הצלחה · מומלץ להתחיל שם');
  });

  it('⛔ no strip on the three refusals to guess — and each for its OWN reason (ⓒ)', () => {
    // ⓐ nothing answered at all
    expect(weakestCard(zeroStats())).toBeNull();
    // ⓑ a type never tried — «weakest» is a COMPARISON, and an absent score is ⛔ not a low one.
    //   This is T-291's own failure scenario: 3 answers ⇒ `100% · 0% · 0%` ⇒ sent to a type
    //   the learner ⛔ never opened.
    expect(
      weakestCard([
        { type: 'sc', answered: 3, correct: 3 },
        { type: 'rs', answered: 0, correct: 0 },
        { type: 'rc', answered: 0, correct: 0 },
      ]),
    ).toBeNull();
    // ⓒ two types tied at the bottom
    expect(
      weakestCard([
        { type: 'sc', answered: 10, correct: 9 },
        { type: 'rs', answered: 10, correct: 5 },
        { type: 'rc', answered: 20, correct: 10 },
      ]),
    ).toBeNull();
  });

  it('the strip and the cards can ⛔ never disagree — both are derived from one `toTypeCards`', () => {
    const w = weakestCard(full);
    const card = toTypeCards(full).find((c) => c.type === w?.type);
    expect(w?.successPct).toBe(card?.successPct);
    expect(w?.nameHe).toBe(card?.nameHe);
    expect(w?.adviceHe).toContain(`${card?.successPct}%`);
  });
});

/**
 * `T-376` — the menu opens even when the performance read failed, and it ⛔ never says the
 * learner practised nothing. Until this row ⛔ nothing wrote a practice attempt from a
 * production path, so `zeroStats()` on the menu was true by construction; the door this row
 * opens is what makes «עדיין לא תרגלת» a claim the product can get wrong.
 */
describe('unknownStatsCards — ⛔ «we could not read» is ⛔ not «you answered nothing» (T-376)', () => {
  it('draws all three types, in the render order, with ⛔ no percentage', () => {
    const cards = unknownStatsCards();
    expect(cards.map((c) => c.type)).toEqual(AMIRNET_TYPES.map((t) => t.type));
    for (const card of cards) {
      expect(card.successPct).toBeNull();
    }
  });

  it('🔴 ⛔ never prints the never-practised sentence — that is the zero it did ⛔ not measure', () => {
    for (const card of unknownStatsCards()) {
      expect(card.answeredHe).not.toBe(NEVER_PRACTISED_HE);
      expect(card.answeredShortHe).not.toBe(NEVER_PRACTISED_HE);
      expect(card.answeredHe).toBe(STATS_UNKNOWN_HE);
      expect(card.answeredShortHe).toBe(STATS_UNKNOWN_HE);
    }
  });

  it('⛔ is ⛔ not `toTypeCards(zeroStats())` wearing another name', () => {
    const zeroed = toTypeCards(zeroStats());
    const unknown = unknownStatsCards();
    expect(unknown).not.toEqual(zeroed);
    // the names are the register's, ⛔ never retyped here
    expect(unknown.map((c) => c.nameHe)).toEqual(AMIRNET_TYPES.map((t) => t.nameHe));
  });

  it('the sentence is Hebrew, and ⛔ carries no digit a learner could read as a count', () => {
    expect(STATS_UNKNOWN_HE).toMatch(/[֐-׿]/);
    expect(STATS_UNKNOWN_HE).not.toMatch(/[A-Za-z0-9]/);
  });
});
