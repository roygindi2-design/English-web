/**
 * Types for `fetch-wordnet.mjs` (T-198).
 *
 * ⚠️ Hand-written, ⛔ not generated — same reason as `check-text-floor.d.mts` /
 * `check-motion.d.mts`: `tsconfig.json` keeps `allowJs: false`, so the module
 * stays `.mjs` (it also runs standalone via `npm run fetch:wordnet`, plain
 * `node`) and its shape is declared here for `fetch-wordnet.test.ts` to import.
 *
 * ⛔ Hazard is drift. `fetch-wordnet.test.ts` pins this down two ways: the
 * main test blocks exercise real runtime values (a changed BEHAVIOUR fails
 * there), and its last block compares this file's exported names against the
 * module's (a changed SHAPE fails there) — the same pairing `text-floor-gate
 * .test.ts` uses for `check-text-floor.mjs`.
 */

export declare const WORDNET_URL: string;
export declare const EXPECTED_SHA512: string;

export type WordnetPos = 'n' | 'v' | 'a' | 'r' | 's';

export interface ParsedSenseKey {
  lemma: string;
  pos: WordnetPos;
}

export interface ParsedIndexSenseLine {
  senseKey: string;
  lemma: string;
  pos: WordnetPos;
  synsetOffset: string;
  senseNumber: number;
  tagCount: number;
}

export interface ParsedCntlistLine {
  tagCount: number;
  senseKey: string;
  senseNumber: number;
}

export interface SenseIndexRow {
  lemma: string;
  pos: WordnetPos;
  synsetId: string;
  senseNumber: number;
  tagCount: number;
}

export declare function parseSenseKey(senseKey: string): ParsedSenseKey;
export declare function parseIndexSenseLine(line: string): ParsedIndexSenseLine | null;
export declare function parseCntlistLine(line: string): ParsedCntlistLine | null;
export declare function buildSenseIndexRows(
  indexLines: readonly string[],
  cntLines: readonly string[],
): SenseIndexRow[];
export declare function toTsv(rows: readonly SenseIndexRow[]): string;
export declare function verifySha512(buffer: Buffer, expectedHex: string): boolean;
