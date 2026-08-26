/**
 * The globe mark — one component, two callers (the same lesson as `LockIcon`, T-078).
 *
 * `docs/design/kol-world-ring.png` draws the SAME glyph twice on one screen: inside the
 * `קול` focus at the centre of the ring, and inside the raised world circle in the tab
 * bar. One concept in two forms is a learner asking whether they are looking at two
 * different things (constitution § 6), and two copies of a path drift the moment one is
 * touched.
 *
 * ⛔ Inline SVG and ⛔ never a character or an emoji (§ 6): a glyph's weight and height
 * come from whichever font resolves it, ⛔ not from the code. `currentColor` with no
 * `fill`, so it inherits the text around it in both themes — ⛔ no hex the palette does
 * not know about.
 *
 * ⛔ No `'use client'`: pure markup with one size prop, so it renders inside a server
 * component and inside a client one without pulling a bundle boundary around an SVG.
 */
export default function GlobeIcon({ className = 'h-6 w-6' }: { readonly className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.4 2.4 3.6 5.3 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.3-3.6-8.5S9.6 5.9 12 3.5z" />
    </svg>
  );
}
