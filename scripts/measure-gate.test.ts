import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const COMMITTED = join('docs', 'gate-recheck.md');
const DATA = join('data', 'generated');

const OUT_DIR = mkdtempSync(join(tmpdir(), 'gate-report-'));
const FRESH = join(OUT_DIR, 'gate-recheck.md');
const run = (): string =>
  execFileSync('node', ['scripts/measure-gate.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, GATE_REPORT_OUT: FRESH },
  });

/** MEASURED from the batch files, ⛔ not restated — a content tick only ever adds rows. */
const SOURCE_FILES = readdirSync(DATA).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort();
const SOURCE_LINES = SOURCE_FILES.flatMap((f) =>
  readFileSync(join(DATA, f), 'utf8').split('\n').filter(Boolean),
);
const SOURCE_ROWS = SOURCE_LINES.length;
/**
 * T-353 made a word-only row legal (`examples` absent or null) ⇒ "two per row" is ⛔ no
 * longer the count. D-022 still holds for every row that HAS a pair: exactly two. So the
 * expected number is two per row carrying a pair, measured from the source.
 */
const SOURCE_PAIRS = SOURCE_LINES.filter((line) => {
  const examples = (JSON.parse(line) as { examples?: unknown }).examples;
  return examples !== undefined && examples !== null;
}).length;
/** Measured 2026-08-15: 8 files, 469 rows. A drop below either means a file disappeared. */
const ROWS_FLOOR = 469;
const FILES_FLOOR = 8;

describe('scripts/measure-gate.mjs', () => {
  const stdout = run();
  const fresh = readFileSync(FRESH, 'utf8');

  it('reads every row of every batch file, ⛔ dropping none', () => {
    expect(SOURCE_FILES.length).toBeGreaterThanOrEqual(FILES_FLOOR);
    expect(SOURCE_ROWS).toBeGreaterThanOrEqual(ROWS_FLOOR);
    expect(stdout).toContain(`${SOURCE_ROWS} rows read from ${SOURCE_FILES.length} batch files`);
    expect(fresh).toContain(`- ${SOURCE_ROWS} rows read`);
  });

  it('gates two example sentences per row that carries a pair — D-022 · T-353, counted and not assumed', () => {
    expect(fresh).toContain(`- ${SOURCE_PAIRS * 2} example sentences re-gated`);
  });

  it('states a reject count in the report even when it is zero', () => {
    expect(fresh).toMatch(/^- \d+ rows rejected$/m);
  });

  it('leaves the committed report identical to a fresh run — staleness is red', () => {
    expect(readFileSync(COMMITTED, 'utf8')).toBe(fresh);
  });
});
