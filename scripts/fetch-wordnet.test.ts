/**
 * T-198 — unit tests for the pure parsing/validation logic in fetch-wordnet.mjs.
 *
 * ⛔ No network here. `main()` (download + tar extraction) only runs when the
 * script is executed directly (`node scripts/fetch-wordnet.mjs`) — see the
 * `import.meta.url` guard at the bottom of the script — so `npm test` (part of
 * `npm run verify`) never touches the network. These tests exercise the
 * exported pure functions against small fixture strings shaped exactly like
 * real `dict/index.sense` / `dict/cntlist` lines (both captured from a live
 * download in this tick — see the script's header comment for the measured
 * values this fixture is built from).
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { SenseIndexRow } from './fetch-wordnet.d.mts';
import {
  parseSenseKey,
  parseIndexSenseLine,
  parseCntlistLine,
  buildSenseIndexRows,
  verifySha512,
  toTsv,
  EXPECTED_SHA512,
} from './fetch-wordnet.mjs';

describe('parseSenseKey', () => {
  it('splits lemma and pos for all five WordNet ss_type codes', () => {
    expect(parseSenseKey('run%1:04:00::')).toEqual({ lemma: 'run', pos: 'n' });
    expect(parseSenseKey('run%2:38:00::')).toEqual({ lemma: 'run', pos: 'v' });
    expect(parseSenseKey('happy%3:00:00::')).toEqual({ lemma: 'happy', pos: 'a' });
    expect(parseSenseKey('quickly%4:02:00::')).toEqual({ lemma: 'quickly', pos: 'r' });
    // satellite adjective — carries a head_word:head_id tail, still ss_type 5
    expect(parseSenseKey('accelerated%5:00:00:fast:01')).toEqual({
      lemma: 'accelerated',
      pos: 's',
    });
  });

  it('keeps underscores in multi-word lemmas as-is (WordNet already uses them for spaces)', () => {
    expect(parseSenseKey("'s_gravenhage%1:15:00::")).toEqual({
      lemma: "'s_gravenhage",
      pos: 'n',
    });
  });

  it('throws on an unrecognised ss_type rather than silently mis-tagging a pos', () => {
    expect(() => parseSenseKey('word%9:00:00::')).toThrow(/ss_type/);
  });
});

describe('parseIndexSenseLine', () => {
  it('reads sense_key, synset offset, sense number and tag count', () => {
    expect(parseIndexSenseLine("'hood%1:15:00:: 08659519 1 0")).toEqual({
      senseKey: "'hood%1:15:00::",
      lemma: "'hood",
      pos: 'n',
      synsetOffset: '08659519',
      senseNumber: 1,
      tagCount: 0,
    });
  });

  it('reads a real tagged line (be%2:42:03::, measured 10742 in this tick’s live download)', () => {
    expect(parseIndexSenseLine('be%2:42:03:: 02610777 1 10742')).toMatchObject({
      lemma: 'be',
      pos: 'v',
      synsetOffset: '02610777',
      senseNumber: 1,
      tagCount: 10742,
    });
  });

  it('returns null on a blank line instead of throwing, so trailing newlines are harmless', () => {
    expect(parseIndexSenseLine('')).toBeNull();
    expect(parseIndexSenseLine('   ')).toBeNull();
  });
});

describe('parseCntlistLine', () => {
  it('reads tag count, sense key and (cntlist’s own) sense number', () => {
    expect(parseCntlistLine('10742 be%2:42:03:: 1')).toEqual({
      tagCount: 10742,
      senseKey: 'be%2:42:03::',
      senseNumber: 1,
    });
  });

  it('returns null on a blank line', () => {
    expect(parseCntlistLine('')).toBeNull();
  });
});

describe('buildSenseIndexRows', () => {
  // Fixture mirrors what this tick measured against a real, checksum-verified
  // wn3.1.dict.tar.gz: index.sense's own tag_count and cntlist's tag_count never
  // disagree for a sense_key present in both files (35,307 shared keys checked,
  // zero mismatches) — so a mismatch here is treated as data corruption, not a
  // normal variance, and buildSenseIndexRows throws rather than picking one.
  // cntlist's THIRD column, by contrast, is a from-frequency *rank*, not the
  // dictionary sense_number in index.sense (measured: 754 of 35,307 shared keys
  // disagree there) — so it is deliberately never used for `senseNumber` below.
  const indexLines = [
    "'hood%1:15:00:: 08659519 1 0",
    'be%2:42:03:: 02610777 1 10742',
    'person%1:03:00:: 00007846 1 6833',
  ];
  const cntLines = ['10742 be%2:42:03:: 1', '6833 person%1:03:00:: 2'];

  it('builds one row per index.sense line, cross-validated tag_count from cntlist where present', () => {
    const rows = buildSenseIndexRows(indexLines, cntLines);
    expect(rows).toEqual([
      { lemma: "'hood", pos: 'n', synsetId: '08659519-n', senseNumber: 1, tagCount: 0 },
      { lemma: 'be', pos: 'v', synsetId: '02610777-v', senseNumber: 1, tagCount: 10742 },
      { lemma: 'person', pos: 'n', synsetId: '00007846-n', senseNumber: 1, tagCount: 6833 },
    ]);
  });

  it('keeps index.sense’s own sense_number even where cntlist’s rank column disagrees', () => {
    // person%1:03:00:: — index.sense says senseNumber 1, the cntlist fixture line
    // above deliberately says 2 (mirrors the measured real-data disagreement).
    const rows = buildSenseIndexRows(indexLines, cntLines);
    expect(rows.find((r) => r.lemma === 'person')?.senseNumber).toBe(1);
  });

  it('throws when a shared sense_key disagrees on tag_count — that is corruption, not variance', () => {
    const badCnt = ['9999 be%2:42:03:: 1'];
    expect(() => buildSenseIndexRows(indexLines, badCnt)).toThrow(/tag_count/);
  });

  it('is silent (no throw) on a sense_key cntlist omits entirely — measured: 83 such keys exist in real data', () => {
    expect(() => buildSenseIndexRows(indexLines, [])).not.toThrow();
  });
});

describe('toTsv', () => {
  it('writes a five-column header and one tab-separated row per entry', () => {
    const row: SenseIndexRow = {
      lemma: 'be',
      pos: 'v',
      synsetId: '02610777-v',
      senseNumber: 1,
      tagCount: 10742,
    };
    const tsv = toTsv([row]);
    const lines = tsv.split('\n');
    expect(lines[0]).toBe('lemma\tpos\tsynset_id\tsense_number\ttag_count');
    expect(lines[1]).toBe('be\tv\t02610777-v\t1\t10742');
  });
});

describe('verifySha512', () => {
  it('accepts a buffer matching the expected hash', () => {
    const buf = Buffer.from('roundtrip');
    const hash = createHash('sha512').update(buf).digest('hex');
    expect(verifySha512(buf, hash)).toBe(true);
  });

  it('rejects a buffer that does not match', () => {
    expect(verifySha512(Buffer.from('a'), 'not-a-real-hash')).toBe(false);
  });

  it('pins the real download’s checksum, measured independently in this tick', () => {
    // Downloaded wn3.1.dict.tar.gz directly (16,358,468 bytes) and cross-checked
    // its SHA-512 against the value published in Gentoo's distfiles Manifest for
    // app-dicts/wordnet (a source this script never talks to at runtime) — the
    // two matched exactly. This constant is that measured value, not a value
    // this script invented and trusts itself.
    expect(EXPECTED_SHA512).toBe(
      '16dca17a87026d8a0b7b4758219cd21a869c3ef3da23ce7875924546f2eacac4c2f376cb271b798b2c458fe8c078fb43d681356e3d9beef40f4bd88d3579394f',
    );
  });
});

/**
 * ⛔ The declaration file is hand-written (`fetch-wordnet.d.mts`), so it can drift
 * from the module. The blocks above catch a changed BEHAVIOUR; this one catches a
 * changed SHAPE — same pairing `text-floor-gate.test.ts` uses for `check-text-floor.mjs`.
 */
describe('the hand-written declaration file', () => {
  it('declares exactly the names the module exports', async () => {
    const mod = await import('./fetch-wordnet.mjs');
    const declared = [
      ...readFileSync('scripts/fetch-wordnet.d.mts', 'utf8').matchAll(
        /export declare (?:const|function)\s+([A-Za-z_$][\w$]*)/g,
      ),
    ].map((m) => m[1]);
    expect([...declared].sort()).toEqual(Object.keys(mod).sort());
  });
});
