'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import Flashcard from '@/components/Flashcard';
import type { DeckName, QueueCardInput } from '@/lib/core/deck';
import { buildCard, type CardGrade } from '@/lib/core/flashcard';
import { describeRound, tallyGrades } from '@/lib/core/roundSummary';

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
 * 2. **Vertical snap here; the horizontal shortcut lives in `Flashcard` (D-042 · T-099).**
 *    The original ban quoted the vision's reason for forbidding drag — «a gesture on the
 *    scroll axis competes with the scroll» — and D-042 measured that reason against this
 *    file and found it does not apply: this container scrolls **vertically**
 *    (`snap-y snap-mandatory`), and the gesture is **horizontal**. The two axes are not the
 *    same axis, so the blanket ban was wider than the evidence that justified it.
 *    ⚠️ **REVISED 07/09 (T-259ⓕ · Roy's explicit instruction, 06/09).** The swipe is the
 *    PRIMARY grade channel; the two ≥44px buttons stay in the DOM as the accessible
 *    equivalent (שכבה א׳ — `sr-only` until focused) and the swipe calls **exactly the
 *    same handler** — ⛔ never a second path with its own logic. The sentence that stood
 *    here until 07/09 named the buttons as the channel and is deliberately ⛔ not quoted:
 *    a dead instruction in a live file is one some agent will still obey (`36 § 14.4`).
 *    Two caveats come from measurement:
 *    ⓐ a **20px** strip at each edge does not respond (iOS Safari back-swipe), ⓑ the
 *    gesture needs ≥**64px** of travel at ≤**30°** off the horizontal.
 *    ⚠️ **The third caveat was REVERSED on 26/08 (D-090ⓑ · T-157), and it is deliberately
 *    ⛔ NOT quoted here** — a dead instruction sitting in a live file is one some agent
 *    will still obey (the `36 § 14.4` precedent). What it forbade was the finger; what was
 *    measured is that its 8-pixel allowance is feedback a learner ⛔ does not feel.
 *    The card now tracks the finger **1:1** during the
 *    drag and settles in one easing on release — ⛔ and that is ⛔ not a relaxation of
 *    constitution § 5, which governs the RELEASE: dragging is **direct manipulation**,
 *    ⛔ not an animation the product plays. ⛔ Zero horizontal SCROLL still survives:
 *    the container below keeps its own overflow, and `translateX` ⛔ does not scroll it.
 *    ⛔ None of that lives here: `<Flashcard>` owns both grade buttons, so it owns the
 *    shortcut to them, and this component still adds no control of its own.
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
  initialGrades = [],
  exit,
}: {
  readonly deck: DeckName;
  readonly cards: readonly QueueCardInput[];
  /** Rejects ⇒ the grade did NOT reach the server ⇒ the card stays. See `grade` below. */
  readonly onGraded: (wordId: string, grade: CardGrade) => Promise<void>;
  /**
   * T-276 ⓔ — a fixture seam, ⛔ not a product input. The round summary below is state
   * that only grading produces, and `/dev/deck/done` cannot click through a stub grade
   * (the harness would then depend on grading succeeding against nothing). Seeding the
   * finished round is what makes the summary's geometry measurable at 320/375/414 at all.
   * Product screens ⛔ never pass it; the default is the empty round the product starts in.
   */
  readonly initialGrades?: readonly CardGrade[];
  /**
   * T-268 — the written way out of the scrolling deck, rendered as the FIRST row of the
   * deck's own header so it lives inside `h-[calc(100dvh-10rem)]` and is absorbed by the
   * `min-h-0 flex-1` scroller. ⛔ Not a row in the screen above: measured C-0490 at
   * 375×780, T-087's `absolute` icon close sat on this header's notice text (icon
   * x=303..347 · y=60..104 vs notice x=140..355 · y=60..80) — the broken card view Roy
   * reported — and a sibling row outside this component pushes the deck under the fold.
   * Optional so the finish-state fixtures need not carry it; the finish state has its own.
   */
  readonly exit?: {
    readonly href: string;
    readonly labelHe: string;
  };
}) {
  const [graded, setGraded] = useState<readonly string[]>([]);
  // T-276 — the round's own grades, in order. `graded` holds WHICH cards left; this holds
  // WHAT the learner marked on them, and it is the only source the finish state counts.
  const [grades, setGrades] = useState<readonly CardGrade[]>(initialGrades);
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
      setGrades((previous) => [...previous, value]);
      setScrollTo(next?.word_id ?? null);
    },
    [cards, graded, onGraded, pending],
  );

  if (remaining.length === 0) {
    // T-276 · D-198 — the two (or one, or zero) sentences about the round. The wording and
    // its three fences live in `lib/core/roundSummary.ts`; `deck` decides D-033 there.
    const summary = describeRound(deck, tallyGrades(grades));
    return (
      // The finish state — T-055, § 4.2ו («בסוף המחזור מסך סיום» · «יוצאים — מסך הסיום,
      // ומשם חזרה לבורר» · «המילה האחרונה — מסך סיום ולא מסך לבן»).
      //
      // Two decisions here are quotations, ⛔ not taste:
      //
      // 1. **The deck says which deck it was, using the two strings already in this file.**
      //    The scrolling header carries «מנת היום» or the D-033 practice notice; dropping
      //    both at remaining=0 made the two decks end on one identical screen, and D-033's
      //    promise is required to hold on the screen the learner is looking at. ⛔ No new
      //    sentence is minted: T-055 says «טקסט קיים בלבד», so this reuses the header's own.
      //
      // 2. **One way out, and it goes to the בורר.** § 4.2ו q6 fixes the exit as `/cards`.
      //    ⛔ No streak, no score, no readiness (`לא בתחולה` · T-032). ⚠️ «no count» was
      //    REVISED 07/09 (D-198 · T-276): the round's own grade counts are now a decision,
      //    and they come from `lib/core/roundSummary.ts` — still ⛔ no number that no
      //    decision makes.
      <section className="flex flex-col gap-4" data-card-deck={deck} data-deck-done>
        {/* T-155 — `level` נושא את **אותה** הבטחה של `unknown`, כי הוא כותב את אותן שתי
            עמודות בדיוק (D-032 · D-033). ⛔ לא «מנת היום»: זו חפיסה שלישית.
            ⛔ **שני תנאים ⛔ ולא שלישייה אחת,** וזה ⛔ אינו סגנון: `CardDeck.test.ts` מודד
            **הכלה** — שכל עותק של התווית יושב בתוך שער — ומחלץ שערים לפי סוגריים
            מאוזנים. ענף `else` של שלישייה ⛔ אינו אזור שאפשר לחלץ, ולכן הטענה הייתה
            נמחקת מהבדיקה במקום להיאכף בה. */}
        {deck === 'due' && <p className="text-base text-ink-muted">מנת היום</p>}
        {deck !== 'due' && (
          <p className="text-base text-ink-muted">תרגול — לא משנה את מועד החזרה</p>
        )}
        <h1 className="text-3xl font-bold leading-tight text-ink">סיימת</h1>
        {/* T-276 · D-198 — what moved in the round. Zero grades ⇒ `summary` is empty and the
            screen is exactly what it was (D-198 ⓓ). Body text, ⛔ no glow, ⛔ no number the
            helper did not produce. `text-base` and ⛔ not smaller: § א9 floor, and this is the
            line a learner reads last. */}
        {summary.length > 0 && (
          <div className="flex flex-col gap-1" data-round-summary>
            {summary.map((line) => (
              <p key={line} className="text-base text-ink-muted">
                {line}
              </p>
            ))}
          </div>
        )}
        <Link
          href="/cards"
          data-primary-action="true"
          className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          חזרה לכרטיסיות
        </Link>
      </section>
    );
  }

  return (
    // ⛔ NOT `h-dvh`, and ⛔ not `flex-1` either. Both were measured by `/dev/deck` at
    // 320/375/414 the first time this component was ever rendered by the harness (C-0104):
    //
    //   `h-dvh`  ⇒ card 1 occupied y=105..832 of a 780px viewport. The deck does NOT own the
    //             viewport — the root layout puts a header above it and the licence footer
    //             below it — so a 100dvh box starting at y=52 carried the two grade buttons
    //             52px below the fold. Answer buttons off screen are the F-027 dead end.
    //   `flex-1` ⇒ card 1 collapsed to its own content, 215px, and card 2 sat visible right
    //             under it. The root column is `min-h-dvh`, i.e. its height is INDEFINITE, so
    //             nothing in this subtree can stretch and no `h-full` below can resolve.
    //
    // A scroll-snap deck needs a definite height, so it states one: the viewport minus the
    // chrome the root layout renders around it — header 52px (py-4 + a text-sm line) + main's
    // pb-8 32px + footer 76px (pt-2 + a 44px touch target + pb-6) = 160px = 10rem. ⚠️ It is a
    // number about ANOTHER file, which is exactly why `/dev/deck` measures the result at all
    // three widths instead of trusting it: change the chrome and the harness goes red.
    <section
      className="flex h-[calc(100dvh-10rem)] flex-col"
      data-card-deck={deck}
    >
      <header className="flex flex-none flex-col gap-1 border-b border-border-subtle bg-surface py-2 text-sm text-ink-muted">
        {/* T-268 — the written exit is the header's own first row, ⛔ never an overlay: the
            top-start corner it used to float over IS this row. `-ms-2` folds the link's tap
            padding back into the gutter so the label aligns with the notice below it.
            ⛔ No `data-primary-action`: `/study` is a FLOW_ROUTE and `check:mobile` counts
            exactly one per screen (F-027). */}
        {exit !== undefined && (
          <Link
            href={exit.href}
            data-deck-exit
            className="-ms-2 flex min-h-touch min-w-touch items-center self-start rounded-lg px-2 text-base text-ink underline active:opacity-90"
          >
            {exit.labelHe}
          </Link>
        )}
        <div className="flex items-center justify-between gap-3">
          {/* T-155 — התווית הקבועה חלה על **כל** חפיסה שדירוגה עובר ב-`/api/practice`,
              ⛔ ולא על `unknown` בלבד: ההבטחה היא על מה שהכפתורים ⛔ אינם עושים, והיא חייבת
              להיות נכונה על הכרטיס שהלומד מסתכל בו (D-033). */}
          {deck === 'due' && <span>מנת היום</span>}
          {deck !== 'due' && (
            <span data-practice-notice>תרגול — לא משנה את מועד החזרה</span>
          )}
          <span data-remaining={remaining.length}>נותרו {remaining.length}</span>
        </div>
      </header>

      {/* The scroll container. `h-dvh` lives on the section above, so one card fills exactly
          what is left under the label — a card taller than the viewport would put the grade
          buttons below the fold on the very screen they exist for. */}
      {/* ⛔ `overflow-x-hidden` מפורש (T-157ⓕ): הכרטיס נגרר עכשיו 1:1, ולכן `translateX`
          של 200 פיקסלים מגיע אל מחוץ למכולה. ⛔ גלילה אופקית היא בדיוק מה ש-`check:mobile`
          מפיל ב-320/375/414, ו-`overflow-y-auto` לבדו ⛔ אינו חוסם את הציר השני. */}
      <div
        className="snap-y snap-mandatory min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        data-deck-scroll
      >
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
              // T-100 — מצב התזמון עובר כמו שהוא. ⛔ הדק ⛔ אינו גוזר ממנו דבר:
              // ההכרעה טהורה ויושבת ב-lib/core/decay.ts.
              review={card.review}
              // T-259 — the PROMISE is handed over, ⛔ not discarded: a grade this deck did not
              // take (network failure ⇒ `grade` returns early) resolves while the card is
              // still mounted, and the card springs back instead of staying off-screen.
              onGrade={(value) => grade(card.word_id, value)}
            />
          </article>
        ))}
      </div>
    </section>
  );
}
