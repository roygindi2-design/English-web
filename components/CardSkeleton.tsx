/**
 * The card-shaped loading placeholder — T-054, constitution § 5, § 4.2ו («טעינה — שלד בצורת
 * הכרטיס, ⛔ לא ספינר»).
 *
 * Extracted from `<StudyDeckScreen>`'s `loading` branch, where it shipped in C-0102 and was
 * guarded by a single `toContain('data-deck-skeleton')` — a check a bare `<div>` satisfies.
 * It lives in its own file for one reason that is a measurement and not tidiness: the screen
 * it came from fetches on mount, so a `check:mobile` fixture pointed at the screen would
 * flash this state and then land on an error state mid-measurement (TD-13). A propless,
 * fetchless component can be rendered by a fixture and held there.
 *
 * ⛔ **No animation.** § 5 allows 150–300ms with `prefers-reduced-motion` honoured; having
 * no motion at all honours it by construction, and a pulse added here would be motion no
 * decision asked for. ⛔ It is also not a spinner: a spinner says "something is happening",
 * a skeleton says what is about to arrive and does not shift the layout when it does.
 *
 * `aria-hidden` on the boxes with the sentence in a live region: a screen reader gets the
 * word "loading", ⛔ not three empty rectangles.
 */
const LOADING_HE = 'טוען את הכרטיסיות…';

export default function CardSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3" data-deck-skeleton>
      <p className="sr-only" role="status">
        {LOADING_HE}
      </p>
      <div aria-hidden className="h-40 rounded-2xl bg-surface-raised" />
      <div aria-hidden className="h-6 w-2/3 rounded-lg bg-surface-raised" />
      <div aria-hidden className="h-12 rounded-2xl bg-surface-raised" />
    </div>
  );
}
