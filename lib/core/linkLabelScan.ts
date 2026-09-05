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
 *
 * T-261 · D-187 — measured on the live tree: 29 of 40 `<Link>` elements give
 * their `href` and/or their label through a module-level constant
 * (`href={CARDS_HREF}` · `{BACK_HE}`), ⛔ not as a quoted literal, and the
 * original regex above required a literal for both. Those 29 were silently
 * invisible — not a false negative anyone saw, a measurement that never ran.
 * ⇒ `resolveLinkElements` now resolves a bare `{IDENTIFIER}` against a
 * `const IDENTIFIER = '...'` declared **in the same source text, before the
 * `<Link>` that uses it** — the nearest earlier declaration of that name
 * wins, so two different files concatenated together (as the caller in
 * `scripts/link-naming.test.ts` does) do not bleed into each other as long
 * as each file declares its own constants before its own `<Link>`s, which
 * every file measured here already does.
 */

const LINK_ELEMENT = /<Link\b([^>]*)>([\s\S]*?)<\/Link>/g;
const HREF_STRING = /href=\{?['"`](\/[\w\-/]*)['"`]\}?/;
const HREF_IDENT = /href=\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}/;
const LABEL_IDENT = /^\{\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*\}$/;
const CONST_DECL =
  /^const\s+([A-Za-z_$][A-Za-z0-9_$]*)(?:\s*:\s*[^=]+)?\s*=\s*(['"`])((?:(?!\2)[\s\S])*)\2\s*;/gm;
const HEB = /[֐-׿]/;

type ConstDecl = { readonly index: number; readonly name: string; readonly value: string };

function constDeclarations(source: string): readonly ConstDecl[] {
  const decls: ConstDecl[] = [];
  for (const m of source.matchAll(CONST_DECL)) {
    decls.push({ index: m.index ?? 0, name: m[1] ?? '', value: m[3] ?? '' });
  }
  return decls;
}

/** The nearest declaration of `name` at or before `beforeIndex` — a same-file, in-order stand-in for module scope. */
function resolveConst(
  decls: readonly ConstDecl[],
  name: string,
  beforeIndex: number,
): string | undefined {
  let value: string | undefined;
  for (const d of decls) {
    if (d.index <= beforeIndex && d.name === name) value = d.value;
  }
  return value;
}

/**
 * @param source Concatenated TSX/TS source text (or a single file's text).
 * @returns One entry per `<Link>` whose destination AND label both resolved
 *   (literal or same-file constant) and whose label carries Hebrew — in
 *   document order, duplicates included. The per-element counterpart to
 *   `extractLinkLabels`, used to measure coverage (`linkElementCount` vs.
 *   this array's length), not to report drift.
 */
export function resolveLinkElements(
  source: string,
): readonly { readonly destination: string; readonly label: string }[] {
  const decls = constDeclarations(source);
  const resolved: { destination: string; label: string }[] = [];
  for (const m of source.matchAll(LINK_ELEMENT)) {
    const at = m.index ?? 0;
    const attrs = m[1] ?? '';
    const body = (m[2] ?? '').trim();

    const hrefLiteral = HREF_STRING.exec(attrs)?.[1];
    const hrefIdent = hrefLiteral === undefined ? HREF_IDENT.exec(attrs)?.[1] : undefined;
    const destination = hrefLiteral ?? (hrefIdent === undefined ? undefined : resolveConst(decls, hrefIdent, at));
    if (destination === undefined) continue;

    const labelIdent = LABEL_IDENT.exec(body)?.[1];
    const label = (labelIdent === undefined ? body : resolveConst(decls, labelIdent, at))?.trim();
    if (!label || !HEB.test(label)) continue;

    resolved.push({ destination, label });
  }
  return resolved;
}

/** @returns How many `<Link` elements open in `source` — the denominator for coverage, regardless of whether they resolve. */
export function linkElementCount(source: string): number {
  return (source.match(/<Link\b/g) ?? []).length;
}

/**
 * @param source Concatenated TSX/TS source text (or a single file's text).
 * @returns Destination route → the distinct Hebrew labels found pointing at it.
 */
export function extractLinkLabels(source: string): Map<string, Set<string>> {
  const labels = new Map<string, Set<string>>();
  for (const { destination, label } of resolveLinkElements(source)) {
    const set = labels.get(destination) ?? new Set<string>();
    set.add(label);
    labels.set(destination, set);
  }
  return labels;
}
