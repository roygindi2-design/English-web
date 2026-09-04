/**
 * PURE. No fs, no React, no DOM, no clock, no env, no I/O.
 *
 * T-253 · D-186 — the static half of the same measurement `journeyDrift.ts`
 * already makes from a live walk. `scripts/verify-mobile.mjs` collects
 * `labelsByDestination` only along the ONE route the walk fixture drives; a
 * destination two OTHER screens name differently — like `/`, named
 * `«חזרה למסך הפתיחה»` in `app/not-found.tsx` and `«חזרה למסך הבית»` in
 * `app/sources/page.tsx` — never crosses that walk and `driftingNames` (the
 * pure comparator both sides feed) reports nothing. This function builds the
 * same shape `driftingNames` already expects, from raw source text instead
 * of a browser walk, so a caller can scan the whole tree once and reuse the
 * existing comparator — an extension of the live control to destination,
 * not a second, parallel check.
 *
 * Same extraction shape as `scripts/build-surfaces.mjs`'s `LINK_WITH_LABEL` —
 * deliberately not re-derived, so the two readings of "what does a `<Link>`
 * call itself" cannot drift from each other.
 */

const LINK_WITH_LABEL =
  /<Link\b[^>]*href=\{?['"`](\/[\w\-/]*)['"`][^>]*>\s*\{?\s*'?"?([^<>{}'"]{2,40}?)'?"?\s*\}?\s*<\/Link>/g;
const HEB = /[֐-׿]/;

/**
 * @param source Concatenated TSX/TS source text (or a single file's text).
 * @returns Destination route → the distinct Hebrew labels found pointing at it.
 */
export function extractLinkLabels(source: string): Map<string, Set<string>> {
  const labels = new Map<string, Set<string>>();
  for (const m of source.matchAll(LINK_WITH_LABEL)) {
    const destination = m[1];
    const label = (m[2] ?? '').trim();
    if (destination === undefined || !HEB.test(label)) continue;
    const set = labels.get(destination) ?? new Set<string>();
    set.add(label);
    labels.set(destination, set);
  }
  return labels;
}
