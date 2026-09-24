import type { BatchRecord } from './batchRecord';
import type { ItemLevel, RelationType } from './contentSchema';

/**
 * The rows that scripts/build-ingest-sql.mjs has withheld since T-042 — sense_examples,
 * sense_items and sense_distractors — flattened out of the batch records that PASSED the
 * gate, and keyed the only way a seed file can key them: by (headword, pos, sense_index),
 * which is what `senses` is unique on. ⛔ No id is invented here; the SQL joins.
 *
 * Pure. The caller decides which records are passing (R-014 re-gates them first).
 */

export interface ExampleRow {
  readonly headword: string;
  readonly pos: string;
  readonly senseIndex: number;
  readonly kind: 'supportive' | 'neutral';
  readonly textEn: string;
}

export interface ItemRow {
  readonly headword: string;
  readonly pos: string;
  readonly senseIndex: number;
  readonly itemIndex: number;
  readonly stem: string;
  readonly level: ItemLevel | null;
  readonly levelRationale: string | null;
}

export interface DistractorRow {
  readonly headword: string;
  readonly pos: string;
  readonly senseIndex: number;
  readonly distractor: string;
  readonly relationType: RelationType;
}

export interface ScoringRows {
  readonly examples: readonly ExampleRow[];
  readonly items: readonly ItemRow[];
  readonly distractors: readonly DistractorRow[];
}

export interface ScoringCounts {
  readonly examples: number;
  readonly items: number;
  readonly distractors: number;
}

const EXAMPLE_KINDS = ['supportive', 'neutral'] as const;

export function scoringRowsFor(records: readonly BatchRecord[]): ScoringRows {
  const examples: ExampleRow[] = [];
  const items: ItemRow[] = [];
  const distractors: DistractorRow[] = [];

  for (const record of records) {
    const { headword, pos } = record.sense;
    const senseIndex = record.senseIndex;
    const identity = { headword, pos, senseIndex };

    // T-353: a word-only row has ⛔ no example pair ⇒ ⛔ no `sense_examples` row, never a blank one.
    const pair = record.sense.examples;
    if (pair !== null) {
      for (const kind of EXAMPLE_KINDS) examples.push({ ...identity, kind, textEn: pair[kind] });
    }

    record.sense.items.forEach((item, itemIndex) => {
      items.push({ ...identity, itemIndex, stem: item.stem, level: item.level, levelRationale: item.levelRationale });
    });

    /**
     * `unique (sense_id, distractor)` is case-SENSITIVE in Postgres, so "Quite" and
     * "quite" would both insert and the learner could be shown the same distractor
     * twice in one item. Deduping here rather than leaning on `on conflict` is the
     * difference between a rule and an accident: first spelling wins, deterministically.
     */
    const seen = new Set<string>();
    for (const distractor of record.sense.distractors) {
      const fold = distractor.word.toLowerCase();
      if (seen.has(fold)) continue;
      seen.add(fold);
      distractors.push({
        ...identity,
        distractor: distractor.word,
        relationType: distractor.relationType,
      });
    }
  }

  return { examples, items, distractors };
}

export function scoringCounts(rows: ScoringRows): ScoringCounts {
  return {
    examples: rows.examples.length,
    items: rows.items.length,
    distractors: rows.distractors.length,
  };
}
