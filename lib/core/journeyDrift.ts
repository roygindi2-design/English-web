/**
 * PURE. No React, no DOM, no fetch, no process.env reads, no Playwright.
 *
 * A journey walk (scripts/verify-mobile.mjs) collects, for every destination
 * route it lands on, the set of distinct Hebrew labels the in-app links used
 * to name that destination along the way. This function is the pure half of
 * that measurement: given the collected labels, it reports every destination
 * that more than one name pointed to — a real navigation defect (T-227,
 * plan/docs/superpowers/plans/2026-08-30-journey-walk.md § 1), not a style
 * complaint. `plan/63-surfaces.md` finds the same defect statically; this
 * finds it in the order a learner actually meets it.
 */

/**
 * @param labelsByDestination Route → the distinct Hebrew labels seen pointing at it.
 * @returns One line per destination with more than one label, `"<route> ⇒ «label» · «label»"`.
 */
export function driftingNames(
  labelsByDestination: ReadonlyMap<string, ReadonlySet<string>>,
): readonly string[] {
  const lines: string[] = [];
  for (const [destination, labels] of labelsByDestination) {
    if (labels.size < 2) continue;
    const quoted = Array.from(labels)
      .map((label) => `«${label}»`)
      .join(' · ');
    lines.push(`${destination} ⇒ ${quoted}`);
  }
  return lines;
}
