/**
 * The lock mark — one component, two callers (T-078).
 *
 * It lived inside `components/TabBar.tsx` until C-0163, which is the whole
 * reason `components/CardsScreen.tsx` had none and announced its locked deck
 * with the bare word «נעול». One concept in two forms is a learner asking
 * whether they are looking at two different things (constitution § 6), and a
 * word in muted grey as the only signal is the § 1 failure by another route.
 *
 * ⛔ Inline SVG and never a character or an emoji (§ 6): a glyph's weight and
 * height come from whichever font resolves it, not from the code.
 * `currentColor` with no `fill` so it inherits the text beside it in both
 * themes — ⛔ no hex the palette does not know about.
 *
 * ⛔ No `'use client'`: it is pure markup with no props and no state, so it
 * renders inside a server component and inside a client one without pulling a
 * bundle boundary around an SVG.
 */
export default function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
      <path d="M5.75 7V5a2.25 2.25 0 0 1 4.5 0v2" />
    </svg>
  );
}
