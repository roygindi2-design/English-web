import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { NGSL_ROWS, type NgslRow, parseNgslCsv, toNgslSql } from './build-ngsl-sql.mjs';

/**
 * `T-007` — NGSL v1.2 stops being a CSV nothing reads and becomes the frequency backbone
 * `words.ngsl_rank` was created for in `0002_content_bank.sql` (and has held 0 of 1,559
 * values on the live database, measured C-0829).
 *
 * Same two halves as `build-amirnet-vocab-sql.test.ts`: the PURE half pins the gates on
 * hand-built rows; the END-TO-END half runs the generator into a throwaway directory and
 * asserts the committed seed is byte-identical (`F-048ⓑ` — `npm test` ⛔ never dirties a
 * git-managed file, and a stale seed is a red test).
 */
const SEED = 'supabase/seed/0008_ngsl_frequency.sql';
const OUT_DIR = mkdtempSync(join(tmpdir(), 'seed-ngsl-'));

const fullRows = (): NgslRow[] =>
  Array.from({ length: NGSL_ROWS }, (_, i) => ({ rank: i + 1, headword: `w${i + 1}`, sfi: 50 }));

describe('parseNgslCsv', () => {
  it('reads the four columns by NAME, ⛔ not by position', () => {
    const rows = parseNgslCsv('sfi,headword,rank,u_per_million\n87.85,the,1,60910\n');
    expect(rows).toEqual([{ rank: 1, headword: 'the', sfi: 87.85 }]);
  });
});

describe('toNgslSql', () => {
  it('⛔ REFUSES a list that is not exactly 2,809 rows (T-012 · F-005)', () => {
    expect(() => toNgslSql(fullRows().slice(0, 2801))).toThrow(/2,?809/);
  });

  it('⛔ REFUSES a rank sequence with a gap or out of order', () => {
    const rows = fullRows();
    rows[10] = { rank: 12, headword: 'w11', sfi: 50 };
    expect(() => toNgslSql(rows)).toThrow(/rank/);
  });

  it('⛔ REFUSES a duplicate headword — the table has it unique', () => {
    const rows = fullRows();
    rows[5] = { rank: 6, headword: 'w1', sfi: 50 };
    expect(() => toNgslSql(rows)).toThrow(/w1/);
  });

  it('⛔ REFUSES an SFI outside the table check', () => {
    const rows = fullRows();
    rows[0] = { rank: 1, headword: 'w1', sfi: Number.NaN };
    expect(() => toNgslSql(rows)).toThrow(/sfi/i);
  });

  it('escapes an apostrophe instead of breaking the statement', () => {
    const rows = fullRows();
    rows[0] = { rank: 1, headword: "o'clock", sfi: 50 };
    expect(toNgslSql(rows)).toContain("'o''clock'");
  });

  it('is re-runnable, and backfills words.ngsl_rank case-insensitively', () => {
    const sql = toNgslSql(fullRows());
    expect(sql).toContain('on conflict (rank) do nothing');
    expect(sql).toMatch(/update public\.words[\s\S]*lower\(w\.headword\) = lower\(n\.headword\)/);
  });

  it('re-anchors an existing level bookmark to its word\'s new rank (F-281)', () => {
    // A cursor written while every rank was NULL says «inside the unranked tail». Left
    // alone after the backfill, that predicate would skip every ranked word in the band.
    expect(toNgslSql(fullRows())).toMatch(/update public\.study_level_cursor/);
  });
});

describe('the committed seed', () => {
  it('is exactly what the generator emits from data/ngsl-1.2.csv', () => {
    const stdout = execFileSync('node', ['scripts/build-ngsl-sql.mjs'], {
      encoding: 'utf8',
      env: { ...process.env, SEED_OUT_DIR: OUT_DIR },
    });
    expect(stdout).toContain('2809 rows');
    const fresh = readFileSync(join(OUT_DIR, '0008_ngsl_frequency.sql'), 'utf8');
    expect(readFileSync(SEED, 'utf8')).toBe(fresh);
  });
});
