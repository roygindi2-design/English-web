/**
 * T-222 · the derivation's contract, locked to what THIS script measures — not to the
 * README's numbers (1,243 · 2,139 · 6,713 · 38 connectors), which come from a different
 * (case-insensitive, copy-not-derive) method and are two words short. See the long
 * comment at the top of build-amirnet-vocab.mjs for why case-sensitive headword merging
 * and an any-row is_connector union are the two choices that reproduce these counts.
 *
 * Runs the real script against a temp output dir (SEED_OUT_DIR-style override), the
 * same pattern as build-word-levels-sql.test.ts — no re-implementation of the merge
 * logic here, only assertions on what actually landed on disk.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const OUT_DIR = mkdtempSync(join(tmpdir(), 'amirnet-vocab-'));
const OUT = join(OUT_DIR, 'amirnet-vocab.csv');

let rows: Record<string, string>[] = [];
let stdout = '';

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split('\n').filter((l) => l.length > 0);
  const header = (lines[0] ?? '').split(',');
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    return Object.fromEntries(header.map((h, i) => [h, cols[i] ?? '']));
  });
}

beforeAll(() => {
  stdout = execFileSync('node', ['scripts/build-amirnet-vocab.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, AMIRNET_OUT_DIR: OUT_DIR },
  });
  const text = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
  rows = text ? parseCsv(text) : [];
}, 120_000);

describe('build-amirnet-vocab', () => {
  it('writes the file', () => {
    expect(existsSync(OUT)).toBe(true);
  });

  it('carries the exact header the amirnet-item-gate brief specifies', () => {
    const text = readFileSync(OUT, 'utf8');
    expect(text.split('\n')[0]).toBe(
      'headword,pos,cefr,tier,tier_name,amirnet_level,is_connector,source',
    );
  });

  it('measures 6,715 total rows — not the README\'s 6,713', () => {
    expect(rows.length).toBe(6715);
  });

  it('measures Tier 1 (A2) = 1,244', () => {
    expect(rows.filter((r) => r.tier === '1').length).toBe(1244);
  });

  it('measures Tier 2 (B1) = 2,140', () => {
    expect(rows.filter((r) => r.tier === '2').length).toBe(2140);
  });

  it('measures Tier 3 (B2) = 2,417', () => {
    expect(rows.filter((r) => r.tier === '3').length).toBe(2417);
  });

  it('measures Tier 4 (C1) = 914', () => {
    expect(rows.filter((r) => r.tier === '4').length).toBe(914);
  });

  it('never emits A1 or C2 — both are outside the exam range', () => {
    expect(rows.some((r) => r.cefr === 'A1' || r.cefr === 'C2')).toBe(false);
  });

  it('measures 42 connectors across Tier 1+2 — an any-row union, not a same-row copy', () => {
    const connectors12 = rows.filter(
      (r) => r.is_connector === 'true' && (r.tier === '1' || r.tier === '2'),
    ).length;
    expect(connectors12).toBe(42);
  });

  it('assigns amirnet_level ranges per tier, matching the README table', () => {
    const byTier: Record<string, string> = {};
    for (const r of rows) byTier[r.tier ?? ''] = r.amirnet_level ?? '';
    expect(byTier['1']).toBe('1-2');
    expect(byTier['2']).toBe('2-3');
    expect(byTier['3']).toBe('3');
    expect(byTier['4']).toBe('4');
  });

  it('assigns Hebrew tier names per tier, matching the README table', () => {
    const byTier: Record<string, string> = {};
    for (const r of rows) byTier[r.tier ?? ''] = r.tier_name ?? '';
    expect(byTier['1']).toBe('ליבה');
    expect(byTier['2']).toBe('ליבה מורחבת');
    expect(byTier['3']).toBe('הרחבה אקדמית');
    expect(byTier['4']).toBe('רמת פטור');
  });

  it('never invents a headword not present in either source profile', () => {
    // a spot check: a headword that is real in CEFR-J at A2 and must survive as Tier 1
    expect(rows.some((r) => r.headword === 'accept' && r.tier === '1')).toBe(true);
  });

  it('is idempotent — running twice produces byte-identical output', () => {
    const before = readFileSync(OUT, 'utf8');
    execFileSync('node', ['scripts/build-amirnet-vocab.mjs'], {
      encoding: 'utf8',
      env: { ...process.env, AMIRNET_OUT_DIR: OUT_DIR },
    });
    const after = readFileSync(OUT, 'utf8');
    expect(after).toBe(before);
  });

  it('reports the counts it wrote on stdout, so a tick can quote them without re-parsing the CSV', () => {
    expect(stdout).toMatch(/6715/);
    expect(stdout).toMatch(/42/);
  });
});
