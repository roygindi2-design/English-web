import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('scripts/measure-level-headroom.mjs', 'utf8');

describe('measure-level-headroom.mjs', () => {
  it('never fetches anything (TD-17)', () => {
    expect(SRC).not.toMatch(/\bfetch\s*\(|node:https?|axios/);
  });

  it('is read-only — it writes exactly one file, and it is under docs/', () => {
    expect(SRC.match(/writeFileSync\(/g)).toHaveLength(1);
    expect(SRC).toContain("join('docs', 'level-headroom-report.md')");
  });

  it('⛔ never emits SQL and never touches the seed directory (D-058 §3)', () => {
    expect(SRC).not.toMatch(/insert into|update public\.|supabase\/seed|SEED_OUT_DIR/i);
  });

  it('reads both CEFR profiles, the allow-list and the batches', () => {
    for (const f of [
      'cefrj-vocabulary-profile-1.5.csv',
      'octanove-vocabulary-profile-c1c2-1.0.csv',
      'allowed-words-2026-08-07.txt',
      'batch-',
    ]) expect(SRC).toContain(f);
  });

  it('reports a missing input as unavailable rather than as zero', () => {
    expect(SRC).toContain('unavailable');
  });

  it('is registered as an npm script', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts['measure:headroom']).toBe('node scripts/measure-level-headroom.mjs');
  });

  it('takes its timestamp at the impure layer, never inside lib/core', () => {
    expect(SRC).toContain('new Date().toISOString()');
  });
});
