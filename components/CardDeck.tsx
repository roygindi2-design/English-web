'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Flashcard from '@/components/Flashcard';
import type { DeckName, QueueCardInput } from '@/lib/core/deck';
import { buildCard, type CardGrade } from '@/lib/core/flashcard';

/**
 * The scrolling deck — T-065 part א׳ (§ 4.2ו), plan `2026-08-13-study-queue.md` task 5.
 *
 * Four decisions here are measurements, not taste:
 *
 * 1. **A graded card is REMOVED, and that is the whole of «no scrolling back».** The spec
 *    forbids returning to a card the learner already marked. The obvious reading — trap the
 *    scroll — costs a scroll handler that fights the browser's own snapping and breaks the
 *    one gesture this screen is built on. Removing the node makes the rule true by
 *    construction: there is nothing above to scroll back to, and no state to drift out of
 *    sync with the queue. Hence ⛔ no `preventDefault`, ⛔ no `overflow-hidden`.
 *
 * 2. **Vertical snap, ⛔ never swipe-to-grade.** T-065 states the reason and it is the same
 *    one the vision gives for banning drag: a horizontal gesture on a vertically scrolling
 *    surface competes with the scroll, and a gesture cannot carry a 44px target or a Hebrew
 *    label. Grading stays on the two buttons `Flashcard` already renders — this component
 *    adds no control of its own and ⛔ does not touch `Flashcard.tsx`.
 *
 * 3. **`behavior: 'auto'`, ⛔ never `'smooth'`.** Smooth scrolling is motion the OS-level
 *    prefers-reduced-motion setting cannot switch off from CSS, because it is requested
 *    imperatively. `auto` respects the user's own scroll behaviour setting.
 *
 * 4. **The `unknown` deck wears a permanent label (D-033).** «תרגול — לא משנה את מועד
 *    החזרה» is a promise about what the buttons do NOT do: `POST /api/practice` moves two
 *    counters and ⛔ never `next_review_at`. A learner who drills a hard word ten times and
 *    then finds it scheduled for next month would be right to think the app lied. The label
 *    is sticky rather than a one-time toast for the same reason: the claim has to be true
 *    on the card the learner is looking at, not on the one they saw first.
 *
 * The layout is anchored to the top and ⛔ never `flex-1 … justify-center` (F-011 · F-016).
 * The component fetches nothing: the screen above it owns the network and the error copy
 * (task 6), which is what keeps this file renderable by the `/dev/deck` harness with no
 * Supabase env at all (task 8).
 */
export default function CardDeck({
  deck,
  cards,
  onGraded,
}: {
  readonly deck: DeckName;
  readonly cards: readonly QueueCardInput[];
  /** Rejects ⇒ the grade did NOT reach the server ⇒ the card stays. See `grade` below. */
  readonly onGraded: (wordId: string, grade: CardGrade) => Promise<void>;
}) {
  const [graded, setGraded] = useState<readonly string[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [scrollTo, setScrollTo] = useState<string | null>(null);
  const nodes = useRef(new Map<string, HTMLElement>());

  const remaining = cards.filter((card) => !graded.includes(card.word_id));

  // Scrolling in an effect and not inside the click handler is load-bearing: at click time
  // the graded card is still in the DOM, so the next card has not yet moved to where it
  // will be. Scrolling then lands on the position it USED to occupy — measured as a deck
  // that appeared to skip a card on every second grade.
  useEffect(() => {
    if (scrollTo === null) return;
    nodes.current.get(scrollTo)?.scrollIntoView({ block: 'start', behavior: 'auto' });
    setScrollTo(null);
  }, [scrollTo]);

  const grade = useCallback(
    async (wordId: string, value: CardGrade) => {
      // One in flight at a time. Without this a double tap sends two grades for one card,
      // and on the `due` deck the second one schedules a word the learner answered once.
      if (pending !== null) return;
      setPending(wordId);
      try {
        await onGraded(wordId, value);
      } catch {
        // The grade never reached the server. The card stays exactly where it is, still
        // gradable — ⛔ a swallowed grade is a lost answer. The message the learner reads
        // belongs to the screen above (task 6), which is the layer that knows whether this
        // was the network or the session.
        return;
      } finally {
        setPending(null);
      }
      // The next card is the one after this one that is still un-graded — ⛔ not "the first
      // remaining", which would yank a learner who scrolled ahead back up the deck.
      const index = cards.findIndex((card) => card.word_id === wordId);
      const next = cards.slice(index + 1).find((card) => !graded.includes(card.word_id));
      setGraded((previous) => [...previous, wordId]);
      setScrollTo(next?.word_id ?? null);
    },
    [cards, graded, onGraded, pending],
  );

  if (remaining.length === 0) {
    return (
      // ⛔ NOT the finish screen. T-055 is blocked on F-032 — the PM has not decided what
      // the end of a session says, and a deck that invented a streak or a score would be
      // answering a design question nobody asked it. A heading and the way out, no more.
      <section className="flex flex-col gap-4" data-card-deck={deck} data-deck-done>
        <h1 className="text-2xl font-bold text-ink">סיימת</h1>
        <Link
          href="/cards"
          data-primary-action="true"
          className="flex min-h-touch items-center justify-center rounded-xl bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          חזרה לכרטיסיות
        </Link>
      </section>
    );
  }

  return (
    <section className="flex h-dvh flex-col" data-card-deck={deck}>
      <header className="flex flex-none items-center justify-between gap-3 border-b border-border-subtle bg-surface py-2 text-sm text-ink-muted">
        {deck === 'unknown' ? (
          <span data-practice-notice>תרגול — לא משנה את מועד החזרה</span>
        ) : (
          <span>מנת היום</span>
        )}
        <span data-remaining={remaining.length}>נותרו {remaining.length}</span>
      </header>

      {/* The scroll container. `h-dvh` lives on the section above, so one card fills exactly
          what is left under the label — a card taller than the viewport would put the grade
          buttons below the fold on the very screen they exist for. */}
      <div className="snap-y snap-mandatory flex-1 overflow-y-auto">
        {remaining.map((card) => (
          <article
            key={card.word_id}
            ref={(node) => {
              if (node) nodes.current.set(card.word_id, node);
              else nodes.current.delete(card.word_id);
            }}
            className="flex h-full snap-start flex-col pt-4"
          >
            <Flashcard
              // The key above is on the article, but `Flashcard` holds `revealed` in its own
              // state and resets it when the `card` prop changes identity. `buildCard` runs
              // per render, so identity changes whenever this list does — which is exactly
              // the reset the learner needs and the reason a keyless list handed card n+1
              // over already revealed.
              card={buildCard(
                {
                  headword: card.sense.headword,
                  translationHe: card.sense.translation_he,
                  examples: card.sense.examples,
                  needsHumanReview: card.sense.needs_human_review,
                },
                card.direction,
                { isFirstEncounter: card.is_first_encounter },
              )}
              onGrade={(value) => {
                void grade(card.word_id, value);
              }}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
