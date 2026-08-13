/**
 * The empty state of the card queue — the sentence a learner reads when the deck they
 * opened has nothing in it.
 *
 * ⚠️ **Sole caller since C-0103 (T-065 task 7): `<StudyDeckScreen>`.** It was shared with
 * `<CardsScreen>` while `/cards` had no queue behind it; the כרטיסיות tab now reads the
 * two decks and shows a count each, so «אין כרטיסיות» there would have been a claim about
 * the whole product made from no measurement at all. ⛔ Do not re-add a second caller
 * without the same check — the reason this component exists is that two screens must not
 * grow two different explanations of one situation, ⛔ not that every screen shows it.
 *
 * ⛔ The action is deliberately NOT part of this component: a flow screen's way out is an
 * `<ActionBar>` (D-028) and a tab is a final destination that needs no "back"
 * (§ 4.2ב question 6), so the two callers could never have shared one.
 *
 * This is an honest state and not a placeholder: an empty queue is what a learner reaches
 * every time they finish a session, and it exists either way.
 */
export default function StudyEmptyState(): React.JSX.Element {
  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">אין כרטיסיות כרגע</h1>
      <p className="text-lg leading-relaxed text-ink-muted">
        עוד לא נטענו מילים למאגר. ברגע שיהיו — הן יופיעו כאן, עשר דקות ביום.
      </p>
    </>
  );
}
