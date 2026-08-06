/**
 * The single wrapper for English inside this RTL product (T-009).
 *
 * Three attributes have to travel together or the result is subtly wrong, and
 * "subtly wrong bidi" is the class of bug nobody files: `lang="en"` so screen
 * readers switch voice and hyphenation is right, `dir="ltr"` so the run is laid
 * out left-to-right, and `unicode-bidi: isolate` (the .ltr-inline class) so a
 * trailing "?" or "," does not jump to the wrong end of the Hebrew sentence.
 * Scattering these by hand is how one of them goes missing — hence the guard
 * test beside this file.
 *
 * Not a client component: it has no state and no handlers.
 */

export interface EnWordProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export default function EnWord({ children, className }: EnWordProps) {
  return (
    <span lang="en" dir="ltr" className={['ltr-inline', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

export interface EnTextSegment {
  /**
   * The segment's text, **including its own surrounding whitespace.** `EnText`
   * concatenates segments verbatim and inserts nothing between them, because the
   * producer (`buildCard`, Task 3) derives them from character offsets into the
   * real example sentence and only offsets can survive an inflected form.
   *
   * ⚠️ Invariant the producer owes this component:
   * `segments.map((s) => s.text).join('') === theOriginalSentence`
   *
   * A producer that word-splits (`sentence.split(' ')`) or trims will render
   * "HeranswerwasdeliberateXX" on the learner's card. Assert the round-trip in
   * `flashcard.test.ts` when `exampleSegments` lands — TD-11.
   */
  readonly text: string;
  readonly isTarget: boolean;
}

/**
 * An English sentence with the target word marked. The segments are computed in
 * /lib/core (buildCard) and merely painted here — TD-11: which word is the target
 * is a pedagogical decision, and re-deriving it in React would put that decision
 * in two places, where the second one is wrong the first time a word inflects.
 *
 * The mark is weight plus an underline, and deliberately **not** colour. Two
 * separate reasons, both measured:
 *   ⓐ the plan recorded ΔE 4.1 between the brand and status hues for a deutan
 *      reader, so colour may never carry meaning on its own in this product;
 *   ⓑ `text-brand` would have been an outright WCAG 1.4.3 AA failure here.
 *      Measured with the repo's own `contrastRatio`: `--brand` is 4.42:1 on
 *      `--surface-raised` light, 4.22:1 on `--surface` light and 4.02:1 on
 *      `--surface-raised` dark — all under the 4.5:1 body-text floor, while the
 *      unmarked English around it sits at 7.58:1. Colouring the target word
 *      would have made the single most important word on the card the least
 *      legible text in the paragraph. `--brand` is held to 3:1 in palette.ts
 *      *because it is accent UI, not text* — this is that distinction being
 *      honoured rather than quietly broken.
 */
export function EnText({
  segments,
  className,
}: {
  readonly segments: readonly EnTextSegment[];
  readonly className?: string;
}) {
  return (
    <span lang="en" dir="ltr" className={['ltr-inline', className].filter(Boolean).join(' ')}>
      {segments.map((segment, i) =>
        segment.isTarget ? (
          <strong key={i} className="font-bold underline decoration-2 underline-offset-4">
            {segment.text}
          </strong>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
