import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DATA_SOURCES,
  dataSource,
  licencesMarkdown,
  type DataSource,
  type SourceId,
} from './dataSources';

/**
 * noUncheckedIndexedAccess makes `DATA_SOURCES[0]` a `DataSource | undefined`.
 * Named accessor instead of `!`, so a missing row fails with its own message
 * rather than a TS2532 wall (the C-0023 lesson).
 */
function bySourceId(id: SourceId): DataSource {
  const found = DATA_SOURCES.find((s) => s.id === id);
  if (!found) throw new Error(`registry has no source "${id}"`);
  return found;
}

describe('the data source registry', () => {
  it('lists every source the coverage measurement reads, and nothing else', () => {
    // Exactly the seven rows of data/README.md plus the two level-label files.
    // A row added here without a licence row in docs/ is how attribution rots.
    expect([...DATA_SOURCES].map((s) => s.id).sort()).toEqual([
      'cefrj',
      'hebrew-wordnet',
      'kaikki',
      'ngsl',
      'octanove',
      'wiktionary-en-he',
      'word2word',
      'wordnet',
    ]);
  });

  it('never lists a source that was rejected on its licence (1.6.3)', () => {
    // PanLex and MUSE are NC. A future agent adding them "because they have
    // Hebrew" is the exact failure this line exists to stop.
    const names = DATA_SOURCES.map((s) => `${s.id} ${s.name}`.toLowerCase()).join(' ');
    expect(names).not.toContain('panlex');
    expect(names).not.toContain('muse');
  });

  it('gives every source a licence, a credit line and a canonical https url', () => {
    for (const source of DATA_SOURCES) {
      expect(source.licence.length, `${source.id} has no licence`).toBeGreaterThan(0);
      expect(source.attributionHe.length, `${source.id} has no credit line`).toBeGreaterThan(4);
      expect(source.url.startsWith('https://'), `${source.id} url is not https`).toBe(true);
      expect(new URL(source.url).hostname.endsWith(source.host)).toBe(true);
    }
  });

  it('marks share-alike exactly on the CC BY-SA sources', () => {
    // Getting this wrong is a licence breach, not a typo: a share-alike source
    // obliges us to relicense what we derive from it.
    for (const source of DATA_SOURCES) {
      expect(source.shareAlike, `${source.id}`).toBe(source.licence.includes('BY-SA'));
    }
  });

  it('pins NGSL to its own domain — R-004', () => {
    expect(bySourceId('ngsl').host).toBe('newgeneralservicelist.com');
    expect(bySourceId('ngsl').name).toContain('1.2');
  });

  it('pins WordNet to Princeton’s own host and marks it not share-alike (T-198)', () => {
    // scripts/fetch-wordnet.mjs is the only reader allowed to download from this
    // host (R-004 pattern) — checksum-verified against a value measured independently
    // off a Gentoo distfiles mirror in this tick, not merely computed and trusted.
    const wn = bySourceId('wordnet');
    expect(wn.host).toBe('wordnetcode.princeton.edu');
    expect(wn.shareAlike).toBe(false);
    expect(wn.commercialUse).toBe('allowed-with-citation');
    expect(wn.name).toContain('3.1');
  });

  it('throws by name on an unknown id rather than returning undefined', () => {
    expect(() => dataSource('panlex' as SourceId)).toThrow(/panlex/);
  });

  it('renders a markdown row for every source', () => {
    const md = licencesMarkdown();
    for (const source of DATA_SOURCES) {
      expect(md, `${source.id} missing from the licence document`).toContain(source.name);
      expect(md).toContain(source.licence);
      expect(md).toContain(source.url);
    }
  });

  it('the committed docs/data-licenses.md is what the registry renders', () => {
    // The document on disk is a build artefact that we commit. Without this
    // line it silently becomes a hand-edited copy that disagrees with the code
    // the product actually runs — which is the same class of bug as F-021.
    const onDisk = readFileSync('docs/data-licenses.md', 'utf8');
    expect(onDisk, 'run `node scripts/write-data-licenses.mjs` and commit the result').toBe(
      licencesMarkdown(),
    );
  });
});
