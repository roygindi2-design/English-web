import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('scripts/measure-sense-accuracy.mjs', 'utf8');

describe('measure-sense-accuracy.mjs', () => {
  it('never fetches anything (TD-17)', () => {
    expect(SRC).not.toMatch(/\bfetch\s*\(|node:https?|axios/);
  });

  it('reads the four data files it documents', () => {
    for (const f of [
      'h1-hebrew-wordnet.tsv',
      'wordnet-sense-index.tsv',
      'h1-hebrew-wordnet-synsets.tsv',
      'cefrj-vocabulary-profile-1.5.csv',
    ]) expect(SRC).toContain(f);
  });

  it('reports a missing input as unavailable rather than as zero', () => {
    expect(SRC).toContain('unavailable');
    expect(SRC).not.toMatch(/accuracy.*=\s*0\b/);
  });

  it('is registered as an npm script', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts['measure:sense']).toBe('node scripts/measure-sense-accuracy.mjs');
  });

  // --- Beyond the plan. ---

  /**
   * The runner synthesises nothing. If it ever builds its own item list, the
   * report stops measuring the selection rule and starts measuring the runner —
   * and it would print a percentage on a day when no sense inventory exists.
   */
  it('measures only an empty item list while the sense inventory is absent', () => {
    expect(SRC).toContain('measureAccuracy({ items: [], inv, gold, levels })');
    expect(SRC).not.toMatch(/items:\s*\[\s*\{/);
  });

  /**
   * A missing H1 is fatal (exit 1) while a missing inventory or CEFR file is
   * not: without the gold answer there is no measurement at all, whereas the
   * other two degrade to `unavailable` cells that still document themselves.
   */
  it('exits non-zero only for the missing gold file', () => {
    expect(SRC).toMatch(/if \(!existsSync\(H1\)\) \{[\s\S]*?process\.exit\(1\)/);
    expect(SRC.match(/process\.exit\(/g)).toHaveLength(1);
  });

  /** The two counters F-026 separated must stay separated in the provenance line. */
  it('reports GAP and PSEUDOGAP as two numbers, never as one', () => {
    expect(SRC).toContain('gold.droppedGap');
    expect(SRC).toContain('gold.droppedPseudoGap');
  });

  /** The file written and the file printed are one render, not two. */
  it('writes exactly what it prints', () => {
    expect(SRC).toContain('writeFileSync(OUT, markdown');
    expect(SRC).toContain('console.log(markdown)');
  });
});
