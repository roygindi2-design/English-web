/**
 * PURE. No React, no DOM, no clock, no env.
 *
 * T-276 · D-198 — what the deck's finish screen may say about the round that just ended.
 *
 * The numbers come from `grade` values the deck already passes through `onGraded`
 * (`CardGrade = 'again' | 'good'`, `lib/core/flashcard.ts`) — ⛔ no API, ⛔ no migration,
 * ⛔ no column. This file only counts them and turns the count into Hebrew.
 *
 * Three fences, all quotations (`lib/core/roundSummary.test.ts` holds one test per fence):
 *
 *   D-033        `unknown` · `level` grade through `/api/practice`, which ⛔ never touches
 *                `next_review_at`; the header of that very screen promises so. ⇒ a practice
 *                deck gets ONE line — the grades — and ⛔ not one word about a return date.
 *   § 4.2יג-ב ⓒ  the copy speaks of what the learner MARKED (the two button labels, quoted),
 *                ⛔ never of what they know. «ידעתי» is the button's text, not a verdict.
 *   D-198 ⓓ      zero grades ⇒ ⛔ no line. A screen that announces «0 · 0» denies «סיימת».
 *
 * The `due` schedule line is phrased on what the scheduler is GUARANTEED to do, ⛔ not on
 * what it usually does: `scheduleReview` (`lib/core/scheduler.ts`) rewrites `next_review_at`
 * on every grade — «נקבע מחדש» is always true — and `again` lapses to `FIRST_INTERVAL_DAYS`
 * (1) or, under triage, to today — «בקרוב» is true in both modes. «נדחו» (pushed later) is
 * deliberately ⛔ absent: under triage a `good` card also comes back today, and a sentence
 * that is true only outside triage is the arena's 23/08 failure class.
 */
import type { DeckName } from '@/lib/core/deck';
import type { CardGrade } from '@/lib/core/flashcard';

export interface RoundTally {
  readonly good: number;
  readonly again: number;
  readonly total: number;
}

export function tallyGrades(grades: readonly CardGrade[]): RoundTally {
  let good = 0;
  let again = 0;
  for (const grade of grades) {
    if (grade === 'good') good += 1;
    else again += 1;
  }
  return { good, again, total: good + again };
}

/** «כרטיס אחד» for one, numeral + plural otherwise — the same agreement StoryEndScreen keeps. */
function cards(n: number): string {
  return n === 1 ? 'כרטיס אחד' : `${n} כרטיסים`;
}

/**
 * The lines, in reading order. `[]` for an empty round; one line on a practice deck; two on
 * `due`. Every string is Hebrew, RTL, and quotes the two grade buttons verbatim.
 */
export function describeRound(deck: DeckName, tally: RoundTally): readonly string[] {
  if (tally.total === 0) return [];

  const marked = `דירגת ${cards(tally.total)}: ${tally.good} «ידעתי» · ${tally.again} «לא ידעתי»`;
  if (deck !== 'due') return [marked];

  const moved: string[] = [];
  if (tally.again > 0) {
    const returns = tally.again === 1 ? 'יחזור' : 'יחזרו';
    moved.push(`${cards(tally.again)} שסימנת «לא ידעתי» ${returns} אליך בקרוב`);
  }
  if (tally.good > 0) moved.push(`מועד החזרה של ${cards(tally.good)} שסימנת «ידעתי» נקבע מחדש`);
  return [marked, moved.join(' · ')];
}
