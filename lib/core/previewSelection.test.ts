import { describe, expect, it } from 'vitest';
import type { BatchRecord } from './batchRecord';
import { selectPreviewCards } from './previewSelection';

function rec(over: Partial<BatchRecord> & { headword: string; he: string; distractors?: string[] }): BatchRecord {
  return {
    sense: {
      headword: over.headword,
      pos: 'noun',
      translationHe: over.he,
      definitionEn: 'a definition',
      examples: { supportive: 'A supportive line.', neutral: 'A neutral line.' },
      items: ['The ____ is here.'],
      distractors: (over.distractors ?? []).map((word) => ({ word, relationType: 'semantic' as const })),
    },
    senseIndex: over.senseIndex ?? 1,
    cefrLevel: over.cefrLevel ?? 'A1',
    confidence: over.confidence ?? 'high',
    needsHumanReview: over.needsHumanReview ?? false,
    heInterferenceNote: null,
    heOneToManyGroup: null,
    spotCheck: over.spotCheck ?? true,
    nLetters: over.headword.length,
    nSyllables: 1,
    isFunctionWord: false,
  } as BatchRecord;
}

/**
 * Six headwords, each with three peers to borrow Hebrew from.
 *
 * ⚠️ `apple` and `queen` sit at swapped array positions (0 and 8) deliberately —
 * insertion order is NOT alphabetical. Mutation-check #6 (drop `.sort()`) found
 * that a plain alphabetically-ordered fixture list passes with or without the
 * selector's sort, because the raw array order and the sorted order coincide.
 * With this swap, dropping `.sort()` changes which 6 headwords are selected
 * (queen would displace apple), so the mutation is actually caught.
 */
function bank(): BatchRecord[] {
  const words = [
    ['queen', 'מלכה'], ['bread', 'לחם'], ['chair', 'כיסא'],
    ['door', 'דלת'], ['egg', 'ביצה'], ['fish', 'דג'],
    ['green', 'ירוק'], ['house', 'בית'], ['apple', 'תפוח'],
  ] as const;
  return words.map(([w, he], i) =>
    rec({ headword: w, he, distractors: words.filter(([o]) => o !== w).map(([o]) => o).slice(i % 3, (i % 3) + 4) }),
  );
}

const OPTS = { count: 6, optionCount: 4, sourceId: 'generated' };

describe('selectPreviewCards', () => {
  it('returns exactly the requested number of cards', () => {
    expect(selectPreviewCards(bank(), OPTS)).toHaveLength(6);
  });

  it('selects the alphabetically-earliest eligible headwords, not raw array order (rule 7)', () => {
    // bank() has 9 eligible records for a count of 6 — `queen` sits at array
    // position 0 (before `apple`, which sits at position 8) precisely so a
    // selector that reads raw insertion order instead of sorting would pick
    // `queen` over `apple`. This is the assertion mutation-check #6 (drop
    // `.sort()`) needs to actually fail on.
    expect(selectPreviewCards(bank(), OPTS).map((c) => c.headword)).toEqual([
      'apple', 'bread', 'chair', 'door', 'egg', 'fish',
    ]);
  });

  it('gives every card exactly optionCount options, all distinct', () => {
    for (const card of selectPreviewCards(bank(), OPTS)) {
      expect(card.options).toHaveLength(4);
      expect(new Set(card.options).size).toBe(4);
    }
  });

  it('puts the row own Hebrew at correctIndex', () => {
    const cards = selectPreviewCards(bank(), OPTS);
    const byHead = new Map(bank().map((r) => [r.sense.headword, r.sense.translationHe]));
    for (const card of cards) {
      expect(card.options[card.correctIndex]).toBe(byHead.get(card.headword));
    }
  });

  it('does not always put the answer in the same slot', () => {
    const slots = new Set(selectPreviewCards(bank(), OPTS).map((c) => c.correctIndex));
    expect(slots.size).toBeGreaterThan(1);
  });

  it('is deterministic — same input, identical output', () => {
    expect(selectPreviewCards(bank(), OPTS)).toEqual(selectPreviewCards(bank(), OPTS));
  });

  it('drops a row whose level is not A1', () => {
    const b = bank().map((r) => (r.sense.headword === 'apple' ? { ...r, cefrLevel: 'B2' as const } : r));
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('apple');
  });

  it('drops a row that is not high confidence', () => {
    const b = bank().map((r) => (r.sense.headword === 'bread' ? { ...r, confidence: 'medium' as const } : r));
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('bread');
  });

  it('drops a row flagged for human review even when confidence is high', () => {
    const b = bank().map((r) => (r.sense.headword === 'chair' ? { ...r, needsHumanReview: true } : r));
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('chair');
  });

  it('drops a row that was not spot checked', () => {
    const b = bank().map((r) => (r.sense.headword === 'door' ? { ...r, spotCheck: false } : r));
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('door');
  });

  it('drops a second sense — a context-free card must not be ambiguous', () => {
    const b = bank().map((r) => (r.sense.headword === 'egg' ? { ...r, senseIndex: 2 } : r));
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('egg');
  });

  it('drops a row whose distractors have no Hebrew of their own', () => {
    const b = bank().map((r) =>
      r.sense.headword === 'fish'
        ? rec({ headword: 'fish', he: 'דג', distractors: ['zebra', 'kettle', 'ladder'] })
        : r,
    );
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('fish');
  });

  it('never offers the correct answer twice', () => {
    // count:7, not OPTS's 6 — 'flat' sorts after 'fish' and before 'green', so
    // it is only actually selected (and its duplicate-Hebrew distractor set
    // exercised) once the count is large enough to reach it. At count:6 this
    // fixture never ran through selectPreviewCards at all (mutation-check #3
    // found this: removing the `seen.has(hebrew)` dedup left every test green).
    const b = [...bank(), rec({ headword: 'flat', he: 'בית', distractors: ['house', 'apple', 'bread', 'chair'] })];
    for (const card of selectPreviewCards(b, { ...OPTS, count: 7 })) {
      const correct = card.options[card.correctIndex] as string;
      expect(card.options.filter((o) => o === correct)).toHaveLength(1);
    }
  });

  it('emits each headword at most once', () => {
    const cards = selectPreviewCards(bank(), OPTS);
    expect(new Set(cards.map((c) => c.headword)).size).toBe(cards.length);
  });

  it('carries the source id onto every card', () => {
    for (const card of selectPreviewCards(bank(), OPTS)) {
      expect(card.sourceId).toBe('generated');
    }
  });

  it('throws rather than returning a short array', () => {
    expect(() => selectPreviewCards(bank().slice(0, 2), OPTS)).toThrow(RangeError);
  });
});
