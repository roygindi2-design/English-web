import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const RUNNER = readFileSync('scripts/measure-coverage.mjs', 'utf8');
const PKG = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>;
};
const DATA_README = readFileSync('data/README.md', 'utf8');

describe('measure-coverage wiring', () => {
  it('is reachable as npm run measure:coverage', () => {
    expect(PKG.scripts['measure:coverage']).toContain('measure-coverage.mjs');
  });

  it('is NOT in verify — it needs data files that are not in the repo', () => {
    expect(PKG.scripts.verify).not.toContain('measure:coverage');
  });

  it('never fetches: TD-17 blocks the domains and R-004 forbids mirrors', () => {
    expect(RUNNER).not.toMatch(/\bfetch\s*\(/);
    expect(RUNNER).not.toMatch(/https?:\/\//);
  });

  it('pins the NGSL row count to 2,809, not 2,801 (F-005)', () => {
    expect(RUNNER).toContain('2809');
    expect(RUNNER).not.toContain('2801');
  });

  it('measures BOTH policies so F-021 cannot block the number', () => {
    expect(RUNNER).toContain('STRICT_POLICY');
    expect(RUNNER).toContain('LENIENT_POLICY');
  });

  it('data/README.md names every file the runner looks for', () => {
    for (const file of [
      'ngsl-1.2.csv',
      'h1-hebrew-wordnet.tsv',
      'h2-wiktionary-en-he.tsv',
      'h3-kaikki-en.jsonl',
      'h4-word2word-en-he.tsv',
    ]) {
      expect(RUNNER, `runner should reference ${file}`).toContain(file);
      expect(DATA_README, `data/README.md should document ${file}`).toContain(file);
    }
  });

  it('the synthetic data files of Step 8 are ignored — only data/README.md is tracked', () => {
    // Comment lines are stripped first: the .gitignore explains WHY the README
    // is exempt, and naming it in prose must not read as ignoring it.
    const patterns = readFileSync('.gitignore', 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l !== '' && !l.startsWith('#'));

    for (const pattern of ['data/*.csv', 'data/*.tsv', 'data/*.jsonl', 'docs/coverage-report.md']) {
      expect(patterns, `.gitignore should carry ${pattern}`).toContain(pattern);
    }
    // A broad `data/` or `data/*` rule would swallow the contract itself.
    for (const swallowing of ['data', 'data/', 'data/*', 'data/**', 'data/README.md']) {
      expect(patterns, `.gitignore must not carry ${swallowing}`).not.toContain(swallowing);
    }
  });
});
