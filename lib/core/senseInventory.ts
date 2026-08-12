/**
 * The English sense inventory and the (lemma, POS) key of digest § 1.7.1 rule 1.
 *
 * Pure. Nothing here reads a file: the inventory arrives as records so that the
 * rule is testable before any WordNet export exists in data/ (T-043).
 */
import type { Pos } from './contentSchema';
import { normalizeEnglish } from './lexicon';

export interface SenseRecord {
  readonly lemma: string;
  readonly pos: Pos;
  readonly synsetId: string;
  readonly senseNumber: number;
  readonly tagCount: number;
}

export interface SenseInventory {
  readonly bySense: ReadonlyMap<string, readonly SenseRecord[]>;
  readonly posByLemma: ReadonlyMap<string, ReadonlySet<Pos>>;
  readonly size: number;
}

export type Ambiguity = 'monosemous' | 'polysemous' | 'multi_pos';

/** Rule 1: the key is (lemma, POS). Never the NGSL headword alone. */
export function senseKey(lemma: string, pos: Pos): string {
  return `${normalizeEnglish(lemma)}#${pos}`;
}

export function buildInventory(records: readonly SenseRecord[]): SenseInventory {
  const bySense = new Map<string, SenseRecord[]>();
  const posByLemma = new Map<string, Set<Pos>>();

  for (const r of records) {
    const key = senseKey(r.lemma, r.pos);
    const bucket = bySense.get(key);
    if (bucket) bucket.push(r);
    else bySense.set(key, [r]);

    const lemma = normalizeEnglish(r.lemma);
    const posSet = posByLemma.get(lemma);
    if (posSet) posSet.add(r.pos);
    else posByLemma.set(lemma, new Set([r.pos]));
  }

  // Sorted once, here, so that sensesFor()[0] is WordNet sense #1 everywhere.
  for (const bucket of bySense.values()) {
    bucket.sort((a, b) => a.senseNumber - b.senseNumber);
  }

  return { bySense, posByLemma, size: bySense.size };
}

export function sensesFor(
  inv: SenseInventory, lemma: string, pos: Pos,
): readonly SenseRecord[] {
  return inv.bySense.get(senseKey(lemma, pos)) ?? [];
}

/**
 * Precedence is deliberate: multi_pos outranks polysemous. Rule 5 names
 * "מילה רב-POS" as its own risk class, so a lemma under two POS is multi_pos
 * even when each POS holds exactly one sense.
 */
export function classifyAmbiguity(
  inv: SenseInventory, lemma: string, pos: Pos,
): Ambiguity | null {
  const senses = sensesFor(inv, lemma, pos);
  if (senses.length === 0) return null;
  const posSet = inv.posByLemma.get(normalizeEnglish(lemma));
  if (posSet && posSet.size > 1) return 'multi_pos';
  return senses.length > 1 ? 'polysemous' : 'monosemous';
}
