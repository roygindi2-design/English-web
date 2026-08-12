import { describe, expect, it } from 'vitest';
import {
  asRawGloss,
  classifyGloss,
  displayableGloss,
  hasNiqqud,
  normalizeEnglish,
  normalizeHebrew,
  stripNiqqud,
} from './lexicon';

describe('normalizeEnglish', () => {
  it('lowercases, trims and collapses inner whitespace', () => {
    expect(normalizeEnglish('  Book  ')).toBe('book');
    expect(normalizeEnglish('ice\t cream')).toBe('ice cream');
  });

  it('strips combining diacritics so cafe and café are one key', () => {
    expect(normalizeEnglish('café')).toBe('cafe');
    expect(normalizeEnglish('café')).toBe('cafe');
  });

  it('keeps hyphen and apostrophe — NGSL headwords use them', () => {
    expect(normalizeEnglish("Don't")).toBe("don't");
    expect(normalizeEnglish('Well-Known')).toBe('well-known');
  });
});

describe('stripNiqqud', () => {
  it('removes vowel points but keeps the letters', () => {
    // בַּיִת -> בית
    expect(stripNiqqud('בַּיִת')).toBe(
      'בית',
    );
  });

  it('keeps MAQAF U+05BE — it joins words and is not a point', () => {
    expect(stripNiqqud('בֽ־ג')).toBe('ב־ג');
  });

  it('decomposes presentation forms before stripping', () => {
    // U+FB2A SHIN WITH SHIN DOT must end up as a bare U+05E9.
    expect(stripNiqqud('שׁ')).toBe('ש');
  });

  it('leaves unpointed text byte-identical', () => {
    expect(stripNiqqud('ספר')).toBe('ספר');
  });
});

describe('hasNiqqud', () => {
  it('is true for pointed text and false for plain text', () => {
    expect(hasNiqqud('בַּיִת')).toBe(true);
    expect(hasNiqqud('בית')).toBe(false);
  });

  it('does not treat MAQAF as niqqud', () => {
    expect(hasNiqqud('א־ב')).toBe(false);
  });
});

describe('normalizeHebrew', () => {
  it('strips points and collapses whitespace', () => {
    expect(normalizeHebrew('  בַּיִת  ')).toBe(
      'בית',
    );
  });
});

describe('classifyGloss — R-007 damaged records', () => {
  it('drops a bare GAP record', () => {
    expect(classifyGloss(asRawGloss('GAP'))).toEqual({
      kind: 'drop',
      reason: 'gap_record',
    });
  });

  it('drops GAP with a trailing note, but not a word starting with GAP', () => {
    expect(classifyGloss(asRawGloss('GAP no lexical item'))).toEqual({
      kind: 'drop',
      reason: 'gap_record',
    });
    const gape = classifyGloss(asRawGloss('GAPE'));
    expect(gape.kind).toBe('keep');
  });

  it('drops GAP! — the spelling the real Hebrew Wordnet export actually uses', () => {
    // Measured on data/h1-hebrew-wordnet.tsv, 2026-08-12 (C-0052): the file
    // contains **702** lines whose Hebrew side is exactly `GAP!` and **zero**
    // lines spelled `GAP` or `GAP <note>`. The synthetic fixture this suite was
    // written against never existed in the data, so D-025's "GAP is not loaded"
    // was passing 702 records through as high-confidence Hebrew glosses.
    expect(classifyGloss(asRawGloss('GAP!'))).toEqual({
      kind: 'drop',
      reason: 'gap_record',
    });
  });

  it('drops PSEUDOGAP! separately from GAP, and still not a word starting with GAP', () => {
    // 3 lines in the same file. Not named by D-025, so it gets its own reason
    // rather than being folded into GAP's 702 — but it carries zero Hebrew
    // characters, so loading it could only ever produce a fabricated gloss.
    expect(classifyGloss(asRawGloss('PSEUDOGAP!'))).toEqual({
      kind: 'drop',
      reason: 'pseudo_gap',
    });
    expect(classifyGloss(asRawGloss('גַּפְרוּר')).kind).toBe('keep');
  });

  it('drops an empty or whitespace-only gloss', () => {
    expect(classifyGloss(asRawGloss('   ')).kind).toBe('drop');
    expect(classifyGloss(asRawGloss('!')).kind).toBe('drop');
  });

  it('keeps a bang-prefixed record at low confidence with the bang removed', () => {
    const v = classifyGloss(asRawGloss('!גדה'));
    expect(v).toEqual({
      kind: 'keep',
      confidence: 'low',
      display: 'גדה',
      match: 'גדה',
      flags: ['bang_prefix'],
    });
  });

  it('keeps a pointed record: display keeps the points, match does not', () => {
    const v = classifyGloss(asRawGloss('בַּיִת'));
    expect(v).toEqual({
      kind: 'keep',
      confidence: 'high',
      display: 'בַּיִת',
      match: 'בית',
      flags: ['pointed'],
    });
  });

  it('a clean record carries no flags and is high confidence', () => {
    const v = classifyGloss(asRawGloss(' ספר '));
    expect(v).toEqual({
      kind: 'keep',
      confidence: 'high',
      display: 'ספר',
      match: 'ספר',
      flags: [],
    });
  });
});

describe('displayableGloss — D-013 display gate', () => {
  it('returns null for GAP and for a bang record', () => {
    expect(displayableGloss(asRawGloss('GAP'))).toBeNull();
    expect(displayableGloss(asRawGloss('!גדה'))).toBeNull();
  });

  it('returns the display form for a clean record', () => {
    expect(displayableGloss(asRawGloss('ספר'))).toBe(
      'ספר',
    );
  });

  it('returns the POINTED form — the display field keeps its points', () => {
    expect(displayableGloss(asRawGloss('בַּיִת'))).toBe(
      'בַּיִת',
    );
  });
});
