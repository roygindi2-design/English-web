import { describe, expect, it } from 'vitest';
import { describeRound, tallyGrades } from '@/lib/core/roundSummary';

/**
 * T-276 · D-198 — the deck finish screen says what moved in the round that just ended.
 *
 * The three fences below are quotations, ⛔ not taste, and each has its own test so that
 * loosening one cannot hide behind another staying green:
 *
 *   D-033      the practice decks (`unknown` · `level`) ⛔ never say a word about a return
 *              date — the header 20px above promises the opposite.
 *   § 4.2יג-ב ⓒ  the copy speaks of what the learner MARKED, ⛔ never of what they know.
 *   D-198 ⓓ    a round with zero grades prints nothing — «0 · 0» would deny «סיימת».
 */
describe('tallyGrades — counts a round from the grades the deck already passes', () => {
  it('counts good and again separately, and the total', () => {
    expect(tallyGrades(['good', 'again', 'good'])).toEqual({ good: 2, again: 1, total: 3 });
  });

  it('an empty round is all zeros', () => {
    expect(tallyGrades([])).toEqual({ good: 0, again: 0, total: 0 });
  });
});

describe('describeRound — the sentences the finish screen may say', () => {
  it('D-198 ⓓ: zero grades ⇒ ⛔ no line at all, on every deck', () => {
    for (const deck of ['due', 'unknown', 'level'] as const) {
      expect(describeRound(deck, tallyGrades([]))).toEqual([]);
    }
  });

  it('counts what the learner marked, in the words of the two buttons', () => {
    const [marked] = describeRound('unknown', tallyGrades(['good', 'again', 'good']));
    expect(marked).toContain('3 כרטיסים');
    expect(marked).toContain('2 «ידעתי»');
    expect(marked).toContain('1 «לא ידעתי»');
  });

  it('a single card is «כרטיס אחד», ⛔ not «1 כרטיסים»', () => {
    const [marked] = describeRound('unknown', tallyGrades(['again']));
    expect(marked).toContain('כרטיס אחד');
    expect(marked).not.toContain('1 כרטיסים');
  });

  it('D-033: a practice deck says ONE thing — the grades — and ⛔ nothing about a return date', () => {
    for (const deck of ['unknown', 'level'] as const) {
      const lines = describeRound(deck, tallyGrades(['good', 'again']));
      expect(lines).toHaveLength(1);
      for (const forbidden of ['מועד', 'חזרה', 'יחזרו', 'יחזור', 'נדחו', 'נדחה', 'בקרוב']) {
        expect(lines.join(' '), `«${forbidden}» on a practice deck denies D-033`).not.toContain(forbidden);
      }
    }
  });

  it('the due deck says TWO things — the grades, and what the grades did to the schedule', () => {
    const lines = describeRound('due', tallyGrades(['good', 'again', 'again']));
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('2');
    expect(lines[1]).toContain('יחזרו אליך בקרוב');
    expect(lines[1]).toContain('נקבע מחדש');
  });

  it('due · only «ידעתי» ⇒ the schedule line has no «יחזרו» fragment', () => {
    const [, moved] = describeRound('due', tallyGrades(['good', 'good']));
    expect(moved).not.toContain('יחזרו');
    expect(moved).toContain('נקבע מחדש');
  });

  it('due · only «לא ידעתי» ⇒ the schedule line has no «נקבע מחדש» fragment', () => {
    const [, moved] = describeRound('due', tallyGrades(['again', 'again']));
    expect(moved).toContain('יחזרו אליך בקרוב');
    expect(moved).not.toContain('נקבע מחדש');
  });

  it('due · a single «לא ידעתי» card agrees in number: «יחזור», ⛔ not «יחזרו»', () => {
    const [, moved] = describeRound('due', tallyGrades(['again', 'good']));
    expect(moved).toContain('כרטיס אחד שסימנת «לא ידעתי» יחזור אליך בקרוב');
    expect(moved).not.toContain('יחזרו');
  });

  it('§ 4.2יג-ב ⓒ: ⛔ never «יודע» — the copy is about what was marked, not what is known', () => {
    for (const deck of ['due', 'unknown', 'level'] as const) {
      const text = describeRound(deck, tallyGrades(['good', 'again'])).join(' ');
      expect(text).not.toMatch(/יודע|יודעת|אתה יודע|את יודעת/);
    }
  });

  it('D-050: ⛔ no score, streak, points or percent', () => {
    const text = describeRound('due', tallyGrades(['good', 'again'])).join(' ');
    for (const banned of ['%', 'נקודות', 'רצף', 'ציון', 'כל הכבוד']) {
      expect(text).not.toContain(banned);
    }
  });

  it('taste-skill § 9.G: the new strings carry no em-dash or en-dash', () => {
    const text = describeRound('due', tallyGrades(['good', 'again'])).join(' ');
    expect(text).not.toMatch(/[—–]/);
  });
});
