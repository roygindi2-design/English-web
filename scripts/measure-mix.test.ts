import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DATA = join('data', 'generated');

const run = (): string => execFileSync('node', ['scripts/measure-mix.mjs'], { encoding: 'utf8' });

/** MEASURED from the batch files, ⛔ not restated — a content tick only ever adds rows. */
const SOURCE_FILES = readdirSync(DATA).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort();
const SOURCE_ROWS = SOURCE_FILES.reduce(
  (n, f) => n + readFileSync(join(DATA, f), 'utf8').split('\n').filter(Boolean).length,
  0,
);
/**
 * Floors from the checkpoint T-221 itself measured after `batch-2026-08-28`:
 * 787 rows · 216 full mix · 704 at-least-one (89.5%). A content tick only ever adds
 * rows and K-004 only ever moves the mix toward 60.4% (D-138), so every number can
 * fall no lower than its checkpoint.
 */
const ROWS_FLOOR = 787;
const FILES_FLOOR = 14;
const FULL_MIX_FLOOR = 216;
const AT_LEAST_ONE_FLOOR = 704;

describe('scripts/measure-mix.mjs', () => {
  const stdout = run();

  it('reads every row of every batch file, ⛔ dropping none', () => {
    expect(SOURCE_FILES.length).toBeGreaterThanOrEqual(FILES_FLOOR);
    expect(SOURCE_ROWS).toBeGreaterThanOrEqual(ROWS_FLOOR);
    expect(stdout).toContain(`${SOURCE_ROWS} senses read from ${SOURCE_FILES.length} batch files`);
  });

  it('reports the full D-023 mix count at or above the T-221 checkpoint', () => {
    const match = stdout.match(/^(\d+) \/ \d+ = [\d.]+% full D-023 mix/m);
    expect(match).not.toBeNull();
    const fullMix = Number(match?.[1]);
    expect(fullMix).toBeGreaterThanOrEqual(FULL_MIX_FLOOR);
    expect(fullMix).toBeLessThanOrEqual(SOURCE_ROWS);
  });

  it('reports the at-least-one-tagged count at or above the T-221 checkpoint', () => {
    const match = stdout.match(/^(\d+) \/ \d+ = [\d.]+% at least one resolved tagged distractor/m);
    expect(match).not.toBeNull();
    const atLeastOne = Number(match?.[1]);
    expect(atLeastOne).toBeGreaterThanOrEqual(AT_LEAST_ONE_FLOOR);
    expect(atLeastOne).toBeLessThanOrEqual(SOURCE_ROWS);
  });

  it('never gates — the script exits 0 regardless of the counts (ⓑ)', () => {
    expect(() => run()).not.toThrow();
  });
});
