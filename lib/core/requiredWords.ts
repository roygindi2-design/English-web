/**
 * מילות חובה — 39 § 7 (T-192ⓒ). Pure: ⛔ no React, DOM, network, env or clock.
 *
 * ⛔ No lemmatiser, and that is a DECLARED limit rather than an oversight: the block
 * keyboard (39 § 3, blocked by R-026) emits whole blocks, so the only tokens this rule
 * will ever see are words the learner picked from a closed set. A match is therefore
 * exact after trim + lower-case, and `visited` ≠ `visit`. When the keyboard lands, PM
 * decides whether that stays true — it is a pedagogical call, ⛔ not a code detail.
 */
export interface RequiredWordChip {
  readonly word: string;
  readonly used: boolean;
}

export interface RequiredWordsProgress {
  readonly chips: readonly RequiredWordChip[];
  readonly used: number;
  readonly total: number;
}

const norm = (s: string): string => s.trim().toLowerCase();

/** The chips, in the order the message declares them — ⛔ never re-sorted by state. */
export function requiredWordsProgress(
  required: readonly string[],
  usedTokens: readonly string[],
): RequiredWordsProgress {
  const used = new Set(usedTokens.map(norm));
  const chips = required.map((word) => ({ word, used: used.has(norm(word)) }));
  let n = 0;
  for (const c of chips) if (c.used) n += 1;
  return { chips, used: n, total: chips.length };
}

/** `3 מתוך 3 מילות חובה` — the spec's closing line (39 § 7). */
export function requiredWordsHe(p: RequiredWordsProgress): string {
  return `${p.used} מתוך ${p.total} מילות חובה`;
}
