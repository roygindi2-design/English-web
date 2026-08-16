/**
 * Loading skeleton shaped like the real screen: heading, sentence, button.
 * UX plan T-001 forbids a lone spinner on a white page.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-1 flex-col">
      <span className="sr-only">טוען</span>

      <div className="flex flex-1 flex-col gap-4">
        <div className="h-9 w-4/5 rounded-lg bg-border-subtle" />
        <div className="space-y-2">
          {/* T-073 · constitution § 3: 2xl (16px) is the card and modal radius.
              A text line is not a card, and a skeleton whose shapes are not the
              shapes about to arrive is a promise the screen then breaks. */}
          <div className="h-5 w-full rounded-md bg-border-subtle" />
          <div className="h-5 w-2/3 rounded-md bg-border-subtle" />
        </div>
      </div>

      {/* The button placeholder wears the radius every primary action in the
          product actually ships — `app/error.tsx` · `app/not-found.tsx` ·
          `components/WorldFeed.tsx` are all `rounded-lg`. */}
      <div className="min-h-touch rounded-lg bg-border-subtle py-3" />
    </div>
  );
}
