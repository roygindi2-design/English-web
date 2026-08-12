/**
 * The empty state of the card queue — shared by `/study` (flow) and `/cards`
 * (tab), so the two cannot drift into two different explanations of the same
 * situation.
 *
 * ⛔ The action is deliberately NOT part of this component: the two screens do
 * not share one. `/study` is a flow screen whose way out is `חזרה למסך הבית`
 * inside an `<ActionBar>` (D-028), while `/cards` is a tab — § 4.2ב question 6
 * says a tab is a final destination that needs no "back" — and D-028 forbids an
 * action bar on a screen that already carries the tab bar.
 *
 * This is an honest state and not a placeholder: an empty queue is what a
 * learner reaches every time they finish a session, and it exists either way.
 * Today it is also the only state, because there is no licensed content in the
 * bank yet (P-001).
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
