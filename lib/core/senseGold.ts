/**
 * Hebrew Wordnet as the known answer for T-018.
 *
 * The Hebrew side is filtered by classifyGloss() and by nothing else: D-025
 * (GAP out · `!` in as low · niqqud is not a filter) lives in lexicon.ts, once.
 *
 * ⚠️ Scope note. The export in data/ is two columns, english<TAB>hebrew, with
 * no synset id and no POS — measured 2026-08-12: 17,564 lines, all 2 columns.
 * A gold answer here is therefore "the set of Hebrew glosses this English
 * string carries anywhere in the wordnet", which is a *lemma-level* answer, not
 * the synset-level one digest § 1.7.1 rule 3 describes. Task 5 records the
 * synset-bearing file this becomes exact with, and the report labels the number
 * `lemma-level` so no reader mistakes it for synset accuracy.
 */
import {
  asRawGloss,
  classifyGloss,
  normalizeEnglish,
  normalizeHebrew,
} from './lexicon';

export interface GoldEntry {
  readonly lemma: string;
  readonly accepted: ReadonlySet<string>;
  readonly low: ReadonlySet<string>;
}

export interface GoldSet {
  readonly byLemma: ReadonlyMap<string, GoldEntry>;
  readonly lines: number;
  readonly droppedGap: number;
  /** D-025 names `GAP` only; `PSEUDOGAP!` is counted apart, never summed in. */
  readonly droppedPseudoGap: number;
  readonly droppedEmpty: number;
  readonly lowGlosses: number;
  readonly malformed: number;
}

export type GoldVerdict = 'hit' | 'hit_low' | 'miss' | 'no_gold';

export function buildGoldSet(tsv: string): GoldSet {
  const byLemma = new Map<string, { accepted: Set<string>; low: Set<string> }>();
  let lines = 0;
  let droppedGap = 0;
  let droppedPseudoGap = 0;
  let droppedEmpty = 0;
  let lowGlosses = 0;
  let malformed = 0;

  for (const raw of tsv.split(/\r?\n/)) {
    if (raw.trim() === '') continue;
    lines += 1;

    // Exactly two columns, never "the first two of however many". A third
    // column in a future export is a format change and must be reported as
    // malformed rather than silently discarded.
    const cols = raw.split('\t');
    const rawLemma = cols[0];
    const rawGloss = cols[1];
    if (cols.length !== 2 || rawLemma === undefined || rawGloss === undefined) {
      malformed += 1;
      continue;
    }

    const lemma = normalizeEnglish(rawLemma);
    if (lemma === '') {
      malformed += 1;
      continue;
    }

    const verdict = classifyGloss(asRawGloss(rawGloss));
    if (verdict.kind === 'drop') {
      // Explicit per-reason routing, not an if/else: a reason added to the
      // verdict type later must not land in `droppedEmpty` by default.
      if (verdict.reason === 'gap_record') droppedGap += 1;
      else if (verdict.reason === 'pseudo_gap') droppedPseudoGap += 1;
      else droppedEmpty += 1;
      continue;
    }

    let entry = byLemma.get(lemma);
    if (!entry) {
      entry = { accepted: new Set(), low: new Set() };
      byLemma.set(lemma, entry);
    }
    if (verdict.confidence === 'low') {
      entry.low.add(verdict.match);
      lowGlosses += 1;
    } else {
      entry.accepted.add(verdict.match);
    }
  }

  const out = new Map<string, GoldEntry>();
  for (const [lemma, e] of byLemma) {
    out.set(lemma, { lemma, accepted: e.accepted, low: e.low });
  }
  return {
    byLemma: out,
    lines,
    droppedGap,
    droppedPseudoGap,
    droppedEmpty,
    lowGlosses,
    malformed,
  };
}

/**
 * `miss` and `no_gold` are different facts and must never be summed: a lemma
 * with no gold answer is outside the measurable set, and folding it into the
 * denominator would silently charge R-005's coverage gap to R-006's accuracy.
 *
 * `accepted` is consulted before `low`: the same gloss can appear both plain and
 * `!`-prefixed for one lemma, and a single unmarked record is enough to make the
 * answer certain. Reversing these two lines is the only way to get this wrong.
 */
export function judge(gold: GoldSet, lemma: string, hebrew: string): GoldVerdict {
  const entry = gold.byLemma.get(normalizeEnglish(lemma));
  if (!entry) return 'no_gold';
  const candidate = normalizeHebrew(hebrew);
  if (entry.accepted.has(candidate)) return 'hit';
  if (entry.low.has(candidate)) return 'hit_low';
  return 'miss';
}
