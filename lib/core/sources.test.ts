import { describe, expect, it } from 'vitest';
import {
  MAX_SKIP_RATE,
  parseKaikkiJsonl,
  parseNgslCsv,
  parsePairsTsv,
  renderReportMarkdown,
  skipRate,
} from './sources';
import { STRICT_POLICY, LENIENT_POLICY, measureCoverage } from './coverage';

const SEFER = 'ספר';
const BAYIT = 'בית';

describe('parsePairsTsv', () => {
  it('reads two tab-separated columns', () => {
    const r = parsePairsTsv(`book\t${SEFER}\nhouse\t${BAYIT}\n`);
    expect(r.entries).toEqual([
      { en: 'book', he: SEFER },
      { en: 'house', he: BAYIT },
    ]);
    expect(r.skipped).toBe(0);
  });

  it('skips a header line, blank lines and # comments without counting them as data', () => {
    const r = parsePairsTsv(`# source: H1\nen\the\n\nbook\t${SEFER}\n`);
    expect(r.entries).toEqual([{ en: 'book', he: SEFER }]);
    expect(r.skipped).toBe(0);
  });

  it('counts a one-column line as skipped rather than throwing', () => {
    const r = parsePairsTsv(`book\nhouse\t${BAYIT}\n`);
    expect(r.entries).toEqual([{ en: 'house', he: BAYIT }]);
    expect(r.skipped).toBe(1);
    expect(r.lines).toBe(2);
  });

  it('keeps only the first two columns when a source carries extras', () => {
    const r = parsePairsTsv(`book\t${SEFER}\tnoun\t0.91\n`);
    expect(r.entries).toEqual([{ en: 'book', he: SEFER }]);
  });
});

describe('parseKaikkiJsonl', () => {
  it('pulls he translations out of one JSON object per line', () => {
    const line = JSON.stringify({
      word: 'book',
      lang_code: 'en',
      translations: [
        { lang_code: 'he', word: SEFER },
        { lang_code: 'fr', word: 'livre' },
      ],
    });
    const r = parseKaikkiJsonl(line + '\n', 'he');
    expect(r.entries).toEqual([{ en: 'book', he: SEFER }]);
    expect(r.skipped).toBe(0);
  });

  it('accepts the legacy `code` key as well as `lang_code`', () => {
    const line = JSON.stringify({
      word: 'house',
      translations: [{ code: 'he', word: BAYIT }],
    });
    expect(parseKaikkiJsonl(line + '\n', 'he').entries).toEqual([
      { en: 'house', he: BAYIT },
    ]);
  });

  it('emits one entry per translation when a word has several', () => {
    const line = JSON.stringify({
      word: 'home',
      translations: [
        { lang_code: 'he', word: BAYIT },
        { lang_code: 'he', word: SEFER },
      ],
    });
    expect(parseKaikkiJsonl(line + '\n', 'he').entries).toHaveLength(2);
  });

  it('an entry with no he translation is NOT a skip — it is a real absence', () => {
    const line = JSON.stringify({
      word: 'book',
      translations: [{ lang_code: 'fr', word: 'livre' }],
    });
    const r = parseKaikkiJsonl(line + '\n', 'he');
    expect(r.entries).toEqual([]);
    expect(r.skipped).toBe(0);
    expect(r.lines).toBe(1);
  });

  it('unparsable JSON is a skip, and does not abort the whole file', () => {
    const good = JSON.stringify({
      word: 'book',
      translations: [{ lang_code: 'he', word: SEFER }],
    });
    const r = parseKaikkiJsonl(`{not json\n${good}\n`, 'he');
    expect(r.entries).toHaveLength(1);
    expect(r.skipped).toBe(1);
    expect(r.lines).toBe(2);
  });

  it('a line missing the word field is a skip', () => {
    const r = parseKaikkiJsonl(
      JSON.stringify({ translations: [{ lang_code: 'he', word: SEFER }] }) + '\n',
      'he',
    );
    expect(r.skipped).toBe(1);
  });
});

describe('parseNgslCsv', () => {
  it('reads the headword column by name, not by position', () => {
    const csv = 'rank,headword,sfi\n1,the,88.2\n2,be,84.1\n';
    expect(parseNgslCsv(csv).headwords).toEqual(['the', 'be']);
    expect(parseNgslCsv(csv).rows).toBe(2);
  });

  it('tolerates quoted fields and a BOM', () => {
    const csv = '﻿"rank","headword","sfi"\n1,"the",88.2\n';
    expect(parseNgslCsv(csv).headwords).toEqual(['the']);
  });

  it('throws a NAMED error when the headword column is absent', () => {
    expect(() => parseNgslCsv('rank,word,sfi\n1,the,88.2\n')).toThrow(
      /headword column/i,
    );
  });
});

describe('skipRate', () => {
  it('is 0 for an empty file rather than NaN', () => {
    expect(skipRate({ entries: [], lines: 0, skipped: 0 })).toBe(0);
  });

  it('is the skipped fraction of lines', () => {
    expect(skipRate({ entries: [], lines: 200, skipped: 1 })).toBe(0.005);
  });

  it('MAX_SKIP_RATE is 0.5% — a parser that misses more than that is broken', () => {
    expect(MAX_SKIP_RATE).toBe(0.005);
  });
});

describe('renderReportMarkdown', () => {
  const sources = [
    { id: 'H1', label: 'Hebrew Wordnet', entries: [{ en: 'book', he: SEFER }] },
  ];
  const strict = measureCoverage(['book', 'house'], sources, STRICT_POLICY);
  const lenient = measureCoverage(['book', 'house'], sources, LENIENT_POLICY);
  const md = renderReportMarkdown(strict, lenient, '2026-01-01T00:00:00Z');

  it('names both policies so the reader knows two numbers exist', () => {
    expect(md).toContain('STRICT');
    expect(md).toContain('LENIENT');
  });

  it('states the measured percentage', () => {
    expect(md).toContain('50%');
  });

  it('lists the uncovered headwords', () => {
    expect(md).toContain('house');
  });

  it('carries the caveat that this is a measurement, not a source choice', () => {
    expect(md).toMatch(/R-005/);
  });

  it('embeds the timestamp it was handed and never invents one', () => {
    expect(md).toContain('2026-01-01T00:00:00Z');
  });
});
