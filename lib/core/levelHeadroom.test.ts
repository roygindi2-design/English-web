import { describe, expect, it } from 'vitest';
import { BAND_ORDER, type CefrBand } from './cefrLevels';
import { measureHeadroom, type HeadroomInput } from './levelHeadroom';

function input(over: Partial<HeadroomInput> = {}): HeadroomInput {
  return {
    labelled: new Map<string, CefrBand>(),
    allowed: [],
    authored: [],
    ...over,
  };
}

describe('measureHeadroom — D-058 headroom arithmetic', () => {
  it('emits all six bands in BAND_ORDER even when every one of them is empty', () => {
    const r = measureHeadroom(input());
    expect(r.bands.map((b) => b.band)).toEqual([...BAND_ORDER]);
  });

  it('counts a labelled+allowed+unauthored headword as free', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'A1']]),
      allowed: ['run'],
    }));
    const a1 = r.bands.find((b) => b.band === 'A1');
    expect(a1).toMatchObject({ labelled: 1, allowed: 1, authored: 0, free: 1, offLimits: 0 });
  });

  it('moves an authored headword out of free and into authored', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'A1']]),
      allowed: ['run'],
      authored: ['run'],
    }));
    const a1 = r.bands.find((b) => b.band === 'A1');
    expect(a1).toMatchObject({ allowed: 1, authored: 1, free: 0 });
  });

  it('counts a labelled headword outside the allow-list as offLimits and NEVER as free', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['nevertheless', 'C1']]),
      allowed: [],
    }));
    const c1 = r.bands.find((b) => b.band === 'C1');
    expect(c1).toMatchObject({ labelled: 1, allowed: 0, free: 0, offLimits: 1 });
  });

  it('normalises case and marks on every one of the three inputs', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'A1']]),
      allowed: ['  RUN '],
      authored: ['Run'],
    }));
    const a1 = r.bands.find((b) => b.band === 'A1');
    expect(a1).toMatchObject({ allowed: 1, authored: 1, free: 0 });
  });

  it('reports an authored headword with no profile label as authoredUnlabelled', () => {
    const r = measureHeadroom(input({ authored: ['zzzz'] }));
    expect(r.authoredUnlabelled).toBe(1);
    expect(r.totals.authored).toBe(0);
  });

  it('reports an authored+labelled headword outside the allow-list as authoredOffLimits', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'A1']]),
      allowed: [],
      authored: ['run'],
    }));
    expect(r.authoredOffLimits).toBe(1);
    expect(r.totals.authored).toBe(0);
  });

  it('keeps free non-negative and equal to allowed minus authored on every band', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['a', 'A1'], ['b', 'A1'], ['c', 'B2']]),
      allowed: ['a', 'b', 'c'],
      authored: ['a'],
    }));
    for (const b of r.bands) {
      expect(b.free).toBe(b.allowed - b.authored);
      expect(b.free).toBeGreaterThanOrEqual(0);
    }
  });

  it('sums the totals from the bands and from nothing else', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['a', 'A1'], ['b', 'C2']]),
      allowed: ['a'],
    }));
    expect(r.totals).toEqual({ labelled: 2, allowed: 1, authored: 0, free: 1, offLimits: 1 });
  });

  it('ignores a duplicate in the allow-list instead of double-counting it', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'A1']]),
      allowed: ['run', 'RUN', 'run'],
    }));
    expect(r.bands.find((b) => b.band === 'A1')?.allowed).toBe(1);
  });

  it('never counts one lemma in two bands', () => {
    const r = measureHeadroom(input({
      labelled: new Map<string, CefrBand>([['run', 'B1']]),
      allowed: ['run'],
    }));
    expect(r.totals.labelled).toBe(1);
    expect(r.bands.filter((b) => b.labelled > 0)).toHaveLength(1);
  });
});

import { renderHeadroomMarkdown } from './levelHeadroom';

describe('renderHeadroomMarkdown', () => {
  const report = measureHeadroom(input({
    labelled: new Map<string, CefrBand>([['run', 'A1'], ['walk', 'A1'], ['whereas', 'C2']]),
    allowed: ['run', 'walk'],
    authored: ['run'],
  }));
  const md = renderHeadroomMarkdown(report, ['data/x.csv — 3 rows'], '2026-08-21T12:00:00Z');

  it('prints a row for every one of the six bands, including the empty ones', () => {
    for (const band of BAND_ORDER) expect(md).toMatch(new RegExp(`\\|\\s*${band}\\s*\\|`));
  });

  it('carries the injected timestamp and never invents one', () => {
    expect(md).toContain('2026-08-21T12:00:00Z');
  });

  it('prints the provenance lines it was given', () => {
    expect(md).toContain('data/x.csv — 3 rows');
  });

  it('states that the population is the profile and NOT the words table', () => {
    expect(md).toContain('cefr_profile_band');
    expect(md).toMatch(/⛔/);
  });

  it('prints the free number for A1 as allowed minus authored', () => {
    // ⚠️ פגם תוכנית מתוקן (C-0258): נוסח הבדיקה בתוכנית ציפה ל-`| 1 |` בעמודת
    // `free`, בעוד המימוש **באותה תוכנית** פולט `**${b.free}**`. ההדגשה היא
    // הכוונה — «free הוא המספר היחיד שסוכן התוכן רשאי לתכנן לפיו» — ולכן
    // הביטוי הוא שתוקן, ⛔ ולא הרינדור. הכוונה הנמדדת נשמרה: 2 · 2 · 1 · 1 · 0.
    expect(md).toMatch(/\|\s*A1\s*\|\s*2\s*\|\s*2\s*\|\s*1\s*\|\s*\*\*1\*\*\s*\|\s*0\s*\|/);
  });
});
