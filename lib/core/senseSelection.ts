/**
 * Digest § 1.7.1, rules 2/3/4/7 — the ingestion rule, verbatim in behaviour.
 *
 * ⛔ Deviating from § 1.7.1 is fabricated teaching content. Every branch below
 * cites its rule number. Everything is injected, so the rule is provable before
 * the WordNet export lands (T-043).
 *
 * Pure: no React, no window, no fs, no fetch, no env.
 */
import type { Pos } from './contentSchema';
import {
  classifyAmbiguity, sensesFor, type SenseInventory, type SenseRecord,
} from './senseInventory';

export type SelectionRoute =
  | 'fast_single'
  | 'h1_synset'
  | 'two_signal_agree'
  | 'two_signal_disagree'
  | 'no_second_signal'
  | 'no_candidate';

export type SelectionConfidence = 'high' | 'medium' | 'low';

export interface SecondSignal {
  /** Salience rank for a synset; lower is more salient. null = no opinion. */
  rank(lemma: string, pos: Pos, synsetId: string): number | null;
}

export interface H1SynsetIndex {
  hebrewFor(synsetId: string): string | null;
}

export interface Selection {
  readonly synsetId: string | null;
  readonly confidence: SelectionConfidence;
  readonly route: SelectionRoute;
  readonly needsHumanReview: boolean;
  readonly scorable: boolean;
}

/**
 * `chosen` is `SenseRecord | undefined` and not `| null` on purpose:
 * `noUncheckedIndexedAccess` is on, so `senses[0]` is possibly-undefined and
 * the widening is what answers that check. ⛔ A `!` assertion would remove the
 * check instead of answering it.
 */
function finish(
  chosen: SenseRecord | null | undefined, confidence: SelectionConfidence,
  route: SelectionRoute, multiPos: boolean,
): Selection {
  // D-024 outranks rule 5's original wording: a `low` item IS shown, marked.
  // What it is excluded from is scoring.
  const needsHumanReview =
    confidence === 'low' || chosen == null || chosen.tagCount === 0 || multiPos;
  return {
    synsetId: chosen?.synsetId ?? null,
    confidence,
    route,
    needsHumanReview,
    scorable: confidence !== 'low' && chosen != null,
  };
}

export function selectSense(
  inv: SenseInventory, lemma: string, pos: Pos,
  h1: H1SynsetIndex | null, second: SecondSignal,
): Selection {
  const senses = sensesFor(inv, lemma, pos);
  const multiPos = classifyAmbiguity(inv, lemma, pos) === 'multi_pos';

  // ⛔ No cross-POS fallback: rule 1 makes POS part of the key.
  if (senses.length === 0) return finish(null, 'low', 'no_candidate', multiPos);

  // Rule 2 — one synset for this key: full automation, high confidence.
  if (senses.length === 1) return finish(senses[0], 'high', 'fast_single', multiPos);

  // Rule 3 — H1 covers a candidate: synset↔synset, high confidence. Rule 7
  // breaks a multi-cover tie towards the core sense, i.e. the lowest sense
  // number. `senses` is sorted by senseNumber in buildInventory, so `covered`
  // inherits that order and [0] is the core sense, not the caller's first.
  if (h1) {
    const covered = senses.filter((s) => h1.hebrewFor(s.synsetId) !== null);
    if (covered.length > 0) return finish(covered[0], 'high', 'h1_synset', multiPos);
  }

  // Rule 4 — two independent signals. senses[0] is WordNet sense #1 (sorted in
  // buildInventory). The second signal votes by rank; lower is more salient.
  // Strict `<` keeps an equal-rank tie on sense #1: a flat vote is not a vote
  // for a later sense.
  const first = senses[0];
  let best: SenseRecord | null = null;
  let bestRank = Number.POSITIVE_INFINITY;
  for (const s of senses) {
    const r = second.rank(lemma, pos, s.synsetId);
    if (r !== null && r < bestRank) { bestRank = r; best = s; }
  }

  // ⚠️ Dev amendment to the plan (C-0054). The plan returned
  // `two_signal_disagree` here too. That charges a *coverage* gap in the second
  // source to the *accuracy* of rule 4 — the exact conflation F-026 was, where
  // an R-005 gap was scored as an R-006 miss. Confidence, needsHumanReview and
  // scorable are unchanged; only the reported cause differs.
  if (best === null) return finish(first, 'low', 'no_second_signal', multiPos);

  if (best.synsetId === first?.synsetId) {
    return finish(first, 'medium', 'two_signal_agree', multiPos);
  }
  // Disagreement is recorded, not resolved: WordNet sense #1 is kept and the
  // item is marked low so it never becomes a scored item.
  return finish(first, 'low', 'two_signal_disagree', multiPos);
}
