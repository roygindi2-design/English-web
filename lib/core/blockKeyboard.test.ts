import { describe, expect, it } from 'vitest';
import { END_BLOCK } from './continuations';
import { POS_LABEL_HE, colourOf, countHe, keyboardView } from './blockKeyboard';

describe('colourOf — only the five `39 § 3` categories carry a colour', () => {
  it('maps the five and nothing else', () => {
    expect(colourOf('verb')).toBe('verb');
    expect(colourOf('noun')).toBe('noun');
    expect(colourOf('adjective')).toBe('adjective');
    expect(colourOf('conjunction')).toBe('conjunction');
    expect(colourOf('pronoun')).toBe('pronoun');
    expect(colourOf('determiner')).toBeNull();
    expect(colourOf('preposition')).toBeNull();
    expect(colourOf(null)).toBeNull();
  });
});

describe('POS_LABEL_HE — every block has a written legend, including an uncoloured one', () => {
  it('names each profile pos and the unknown one', () => {
    expect(POS_LABEL_HE.verb).toBe('פועל');
    expect(POS_LABEL_HE.noun).toBe('שם עצם');
    expect(POS_LABEL_HE.adjective).toBe('תואר');
    expect(POS_LABEL_HE.conjunction).toBe('חיבור');
    expect(POS_LABEL_HE.pronoun).toBe('כינוי');
    for (const label of Object.values(POS_LABEL_HE)) expect(label.length).toBeGreaterThan(1);
    expect(POS_LABEL_HE.unknown).toBeTruthy();
  });
});

describe('keyboardView — what the sheet paints, computed once', () => {
  it('the send block is ⛔ not a block: it only enables send', () => {
    const v = keyboardView({ blocks: [{ word: 'go', pos: 'verb' }, END_BLOCK], count: 2 }, 1);
    expect(v.blocks).toEqual([{ word: 'go', pos: 'verb' }]);
    expect(v.canSend).toBe(true);
    expect(v.count).toBe(1);
  });

  it('count is the length of the displayed set', () => {
    const v = keyboardView({ blocks: [{ word: 'a', pos: null }, { word: 'b', pos: 'noun' }], count: 2 }, 2);
    expect(v.count).toBe(v.blocks.length);
    expect(v.canSend).toBe(false);
  });

  it('the hint is «פתיחה» on an empty prefix, else the most frequent coloured category', () => {
    const blocks = [{ word: 'a', pos: 'verb' as const }, { word: 'b', pos: 'verb' as const }, { word: 'c', pos: 'noun' as const }];
    expect(keyboardView({ blocks, count: 3 }, 0).hintHe).toBe('פתיחה');
    expect(keyboardView({ blocks, count: 3 }, 1).hintHe).toBe('פועל');
    expect(keyboardView({ blocks: [{ word: 'the', pos: 'determiner' }], count: 1 }, 1).hintHe).toBeNull();
  });
});

describe('countHe', () => {
  it('says the number, with the singular spelled out', () => {
    expect(countHe(6)).toBe('6 המשכים אפשריים');
    expect(countHe(1)).toBe('המשך אפשרי אחד');
    expect(countHe(0)).toBe('אין המשכים');
  });
});
