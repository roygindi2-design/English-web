/**
 * PURE. ⛔ Zero React, DOM, network, clock, env — `npm run check:core` enforces it.
 *
 * `T-209` ⓒ — **the MEASUREMENT half, ⛔ and it is deliberately ⛔ not a picker.**
 * `D-121 § ה` says the next story is chosen **to repeat words, ⛔ not to vary** and
 * `lib/core/storyPick.ts` chooses without ever looking at vocabulary overlap. Before a
 * picker is rewritten, the row asks for the number: **what does reordering the same
 * stories actually buy?** `scripts/measure-story-repetition.mjs` is the caller; this file
 * is the arithmetic, so the number is reproducible and testable.
 *
 * 🔬 **The one thing to understand before reading a number out of here, and it is a
 * property of the arithmetic ⛔ rather than of the stories:** over a COMPLETE pass of a
 * pool, «how many words were met twice or more» is **order-invariant** — the set of
 * stories read is the same set. ⇒ `repetitionProfile` is a **CEILING that reordering
 * ⛔ cannot raise**, and the only quantity an order can move is **how early** the repeats
 * arrive, which is `cumulativeRepeatCurve`. ⛔ Any claim that reordering raises total
 * repetition is arithmetically false, ⛔ not merely unmeasured.
 *
 * ⛔ **⛔ And it makes no pedagogical claim** (`T-209` ⓓ): `10-pedagogy § 1.16` S28 puts
 * frequency at r=0.34 and S29 caps the bank at 4.25% of words reaching 8 encounters. ⇒
 * these are **encounter counts**, ⛔ never a claim about what was learned.
 */
import { FUNCTION_WORD_FLOOR, normalizeWord } from './storyTapTargets';

export interface OverlapCandidate {
  readonly id: string;
  readonly bodyEn: string;
  readonly createdAt: string;
}

export interface RepetitionProfile {
  /** Distinct content words across the whole pool. */
  readonly distinct: number;
  /** Met in exactly one story of the pool. */
  readonly metOnce: number;
  /** Met in two stories or more — **the ceiling**, ⛔ unmovable by reordering. */
  readonly metTwiceOrMore: number;
}

/**
 * The content words of one story body, each counted **once**.
 *
 * ⛔ The floor is `FUNCTION_WORD_FLOOR`, reused ⛔ rather than redefined: it is the same
 * closed list `36 § 3.1` gates a tap target on, so «a word the learner meets» here means
 * the same thing it means on the screen. ⛔ A second list would be a second definition.
 */
export function storyContentWords(bodyEn: string): ReadonlySet<string> {
  const out = new Set<string>();
  for (const raw of String(bodyEn ?? '').split(/\s+/)) {
    const word = normalizeWord(raw);
    if (word === '') continue;
    if (FUNCTION_WORD_FLOOR.has(word)) continue;
    if (!/\p{L}/u.test(word)) continue;
    out.add(word);
  }
  return out;
}

/** How many stories of the pool each content word appears in. */
function storyCounts(stories: readonly OverlapCandidate[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const story of stories) {
    for (const word of storyContentWords(story.bodyEn)) {
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * The pool's ceiling. ⛔ Order-invariant by construction — see the header.
 */
export function repetitionProfile(stories: readonly OverlapCandidate[]): RepetitionProfile {
  const counts = storyCounts(stories);
  let metOnce = 0;
  let metTwiceOrMore = 0;
  for (const n of counts.values()) {
    if (n >= 2) metTwiceOrMore += 1;
    else metOnce += 1;
  }
  return { distinct: counts.size, metOnce, metTwiceOrMore };
}

/**
 * After each story in the given reading order, how many distinct content words have been
 * met in **two or more** of the stories read so far. ⇒ index `k` is «after story `k+1`».
 *
 * ⛔ This is the ⛔ only quantity an order moves, and the last entry always equals
 * `repetitionProfile(...).metTwiceOrMore`.
 */
export function cumulativeRepeatCurve(stories: readonly OverlapCandidate[]): readonly number[] {
  const seen = new Map<string, number>();
  const curve: number[] = [];
  let repeated = 0;
  for (const story of stories) {
    for (const word of storyContentWords(story.bodyEn)) {
      const next = (seen.get(word) ?? 0) + 1;
      seen.set(word, next);
      if (next === 2) repeated += 1;
    }
    curve.push(repeated);
  }
  return curve;
}

/** `createdAt` then `id` — the same deterministic total order `orderStories` uses. */
function deterministic(stories: readonly OverlapCandidate[]): readonly OverlapCandidate[] {
  return [...stories].sort((a, b) =>
    a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : a.createdAt.localeCompare(b.createdAt),
  );
}

/**
 * Greedy order that front-loads overlap: keep the deterministic FIRST story, then at each
 * step take the remaining story with the most content words already seen.
 *
 * ⛔ **The first story is ⛔ deliberately ⛔ not chosen** — `T-185` ⓐ made «two loads return
 * the same story» the whole point of `storyPick.ts`, and `36 § 4.2יג` gives the learner
 * **one story a day**. ⇒ a reorder that moved the head would change today's story, which
 * is a different decision from «which story comes next».
 * ⛔ **Ties break on `createdAt` then `id`**, ⛔ never on iteration order, or two runs of
 * the measurement would disagree and the number would mean nothing.
 */
export function maximiseOverlapOrder(
  stories: readonly OverlapCandidate[],
): readonly OverlapCandidate[] {
  const ordered = deterministic(stories);
  if (ordered.length === 0) return [];

  const vocab = new Map<string, ReadonlySet<string>>();
  for (const s of ordered) vocab.set(s.id, storyContentWords(s.bodyEn));

  const remaining = [...ordered];
  const head = remaining.shift();
  if (head === undefined) return [];
  const out: OverlapCandidate[] = [head];
  const seen = new Set<string>(vocab.get(head.id) ?? []);

  while (remaining.length > 0) {
    let bestAt = 0;
    let bestScore = -1;
    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      if (candidate === undefined) continue;
      let score = 0;
      for (const word of vocab.get(candidate.id) ?? []) if (seen.has(word)) score += 1;
      // ⛔ strict `>` only — `remaining` is already in deterministic order, so the first
      // story with the best score wins and the tie-break needs ⛔ no second comparison.
      if (score > bestScore) {
        bestScore = score;
        bestAt = i;
      }
    }
    const picked = remaining.splice(bestAt, 1)[0];
    if (picked === undefined) break;
    out.push(picked);
    for (const word of vocab.get(picked.id) ?? []) seen.add(word);
  }
  return out;
}
