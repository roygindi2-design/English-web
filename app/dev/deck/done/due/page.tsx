'use client';

import CardDeck from '@/components/CardDeck';

/**
 * Layout fixture for `check:mobile` — the finish state of the DUE deck, with a round behind
 * it (T-276 · D-198). noindex (the `/dev/deck` layout), unlinked, and ⛔ NOT a learning screen
 * (בדיקת פריסה — אינו תוכן לימודי).
 *
 * `/dev/deck/done` renders the finish state with `cards={[]}` and therefore with ZERO grades,
 * which by D-198 ⓓ is exactly the screen it always was. The two sentences T-276 adds are
 * state that only grading produces, and a scripted click would make the harness depend on
 * grading succeeding against a stub. `initialGrades` is the seam that exists for this file
 * alone: a finished round of three, both grades present, so BOTH sentences render — the
 * widest text the branch can produce, which is what has to wrap cleanly at 320px.
 *
 * `deck="due"` and ⛔ not `unknown`: the practice decks get one sentence (D-033), `due` gets
 * two. The one-sentence branch is a strict subset of what is measured here.
 */
export default function DevDeckDoneDuePage() {
  return (
    <CardDeck
      deck="due"
      cards={[]}
      initialGrades={['good', 'again', 'good']}
      // Never called — the deck is already empty. It exists to satisfy the prop type.
      onGraded={() => Promise.resolve()}
    />
  );
}
