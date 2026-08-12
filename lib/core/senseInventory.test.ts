import { describe, expect, it } from 'vitest';
import {
  buildInventory, classifyAmbiguity, senseKey, sensesFor,
  type SenseRecord,
} from './senseInventory';

const rec = (
  lemma: string, pos: SenseRecord['pos'], synsetId: string,
  senseNumber: number, tagCount = 0,
): SenseRecord => ({ lemma, pos, synsetId, senseNumber, tagCount });

describe('senseKey', () => {
  it('normalises the lemma and keeps the POS distinct', () => {
    expect(senseKey('  Bank ', 'noun')).toBe('bank#noun');
    expect(senseKey('bank', 'verb')).not.toBe(senseKey('bank', 'noun'));
  });

  it('folds latin diacritics so that café and cafe are one key', () => {
    expect(senseKey('café', 'noun')).toBe(senseKey('cafe', 'noun'));
  });
});

describe('buildInventory', () => {
  it('sorts senses by sense number so index 0 is WordNet sense #1', () => {
    const inv = buildInventory([
      rec('bank', 'noun', '09213565-n', 2, 12),
      rec('bank', 'noun', '08420278-n', 1, 40),
    ]);
    expect(sensesFor(inv, 'bank', 'noun').map((s) => s.senseNumber)).toEqual([1, 2]);
    // Mapped, not indexed: `[0].synsetId` does not compile under
    // noUncheckedIndexedAccess, and the mapped form asserts the whole order.
    expect(sensesFor(inv, 'bank', 'noun').map((s) => s.synsetId))
      .toEqual(['08420278-n', '09213565-n']);
  });

  it('reports size as the number of distinct (lemma, POS) keys, not records', () => {
    const inv = buildInventory([
      rec('bank', 'noun', '08420278-n', 1),
      rec('bank', 'noun', '09213565-n', 2),
      rec('bank', 'verb', '02272549-v', 1),
    ]);
    expect(inv.size).toBe(2);
  });
});

describe('classifyAmbiguity', () => {
  it('is monosemous for one sense under one POS', () => {
    const inv = buildInventory([rec('kettle', 'noun', '03612814-n', 1, 3)]);
    expect(classifyAmbiguity(inv, 'kettle', 'noun')).toBe('monosemous');
  });

  it('is polysemous for two senses under the same POS', () => {
    const inv = buildInventory([
      rec('spring', 'noun', '15236475-n', 1, 9),
      rec('spring', 'noun', '09452760-n', 2, 4),
    ]);
    expect(classifyAmbiguity(inv, 'spring', 'noun')).toBe('polysemous');
  });

  it('is multi_pos even when each POS is individually monosemous', () => {
    const inv = buildInventory([
      rec('run', 'noun', '00558963-n', 1, 5),
      rec('run', 'verb', '01926311-v', 1, 60),
    ]);
    expect(classifyAmbiguity(inv, 'run', 'noun')).toBe('multi_pos');
    expect(classifyAmbiguity(inv, 'run', 'verb')).toBe('multi_pos');
  });

  it('is multi_pos, not polysemous, when the lemma is both', () => {
    // The precedence itself. The plan's "each POS individually monosemous" case
    // cannot measure it: with one sense per POS the sense-count branch is false
    // either way, so both orderings return multi_pos. Only a lemma that is
    // polysemous under its own POS *and* lives under a second POS separates them.
    const inv = buildInventory([
      rec('bank', 'noun', '08420278-n', 1, 40),
      rec('bank', 'noun', '09213565-n', 2, 12),
      rec('bank', 'verb', '02272549-v', 1, 3),
    ]);
    expect(classifyAmbiguity(inv, 'bank', 'noun')).toBe('multi_pos');
  });

  it('returns null for a lemma the inventory has never seen', () => {
    const inv = buildInventory([rec('kettle', 'noun', '03612814-n', 1)]);
    expect(classifyAmbiguity(inv, 'zzzz', 'noun')).toBeNull();
  });
});
