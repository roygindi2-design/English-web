/**
 * Chooses the flashcards shown before signup (T-034 · F-012).
 *
 * Pure by contract — no React, no DOM, no I/O (lib/core/README.md). The file
 * reading lives in scripts/build-preview-cards.mjs.
 *
 * ⛔ Nothing here writes Hebrew. Every string it emits was copied out of a
 *    data/generated/batch-*.jsonl row that passed gateSense() twice. A record
 *    that fails any rule below is DROPPED — never padded, never repaired.
 */
import type { BatchRecord } from './batchRecord';
import type { PreviewCard } from './landing';

export interface PreviewSelectionOptions {
  readonly count: number;
  readonly optionCount: number;
  readonly sourceId: string;
}

/** Rules 1-4: properties of the row itself, independent of the rest of the bank. */
function isShowable(record: BatchRecord): boolean {
  return (
    record.cefrLevel === 'A1' &&
    record.confidence === 'high' &&
    !record.needsHumanReview &&
    record.spotCheck &&
    record.senseIndex === 1
  );
}

/**
 * Rule 5. A distractor is only usable if we hold licensed Hebrew for it, and the
 * only Hebrew we hold is the one written on that word's own row.
 */
function hebrewDistractors(
  record: BatchRecord,
  hebrewByHeadword: ReadonlyMap<string, string>,
  need: number,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>([record.sense.translationHe]);
  for (const distractor of record.sense.distractors) {
    if (out.length === need) break;
    if (distractor.word === record.sense.headword) continue;
    const hebrew = hebrewByHeadword.get(distractor.word);
    if (hebrew === undefined || seen.has(hebrew)) continue;
    seen.add(hebrew);
    out.push(hebrew);
  }
  return out;
}

export function selectPreviewCards(
  records: readonly BatchRecord[],
  opts: PreviewSelectionOptions,
): PreviewCard[] {
  if (opts.optionCount < 2) throw new RangeError('optionCount must be at least 2');

  const hebrewByHeadword = new Map<string, string>();
  for (const record of records) {
    if (record.senseIndex !== 1) continue;
    if (!hebrewByHeadword.has(record.sense.headword)) {
      hebrewByHeadword.set(record.sense.headword, record.sense.translationHe);
    }
  }

  const ordered = [...records]
    .filter(isShowable)
    .sort((a, b) => (a.sense.headword < b.sense.headword ? -1 : a.sense.headword > b.sense.headword ? 1 : 0));

  const cards: PreviewCard[] = [];
  const usedHeadwords = new Set<string>();

  for (const record of ordered) {
    if (cards.length === opts.count) break;
    if (usedHeadwords.has(record.sense.headword)) continue;

    const wrong = hebrewDistractors(record, hebrewByHeadword, opts.optionCount - 1);
    if (wrong.length < opts.optionCount - 1) continue;

    const correctIndex = cards.length % opts.optionCount;
    const options = [...wrong];
    options.splice(correctIndex, 0, record.sense.translationHe);

    usedHeadwords.add(record.sense.headword);
    cards.push({
      headword: record.sense.headword,
      pos: record.sense.pos,
      options,
      correctIndex,
      sourceId: opts.sourceId,
    });
  }

  if (cards.length < opts.count) {
    throw new RangeError(
      `only ${cards.length} of ${opts.count} preview cards satisfy the rules — ` +
        'the bank must grow or a rule must be argued down in review, not relaxed here',
    );
  }
  return cards;
}
