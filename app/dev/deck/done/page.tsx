'use client';

import CardDeck from '@/components/CardDeck';

/**
 * Layout fixture for `check:mobile` — the finish state of the deck (T-055 · § 4.2ו).
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * `/dev/deck` ships two ungraded cards, so `remaining.length === 0` is unreachable there and
 * «מסך סיום ולא מסך לבן» has never been rendered at 320/375/414 — it was believed, not
 * measured. An empty `cards` array reaches the branch directly and ⛔ without a scripted
 * click, which would make the harness depend on grading succeeding against a stub.
 *
 * `deck="unknown"` and ⛔ not `due`: the practice deck is the branch that carries the D-033
 * notice, so the wider of the two identity lines is the one whose wrapping gets measured at
 * 320px.
 */
export default function DevDeckDonePage() {
  return (
    <CardDeck
      deck="unknown"
      cards={[]}
      // Never called — the deck is already empty. It exists to satisfy the prop type.
      onGraded={() => Promise.resolve()}
    />
  );
}
