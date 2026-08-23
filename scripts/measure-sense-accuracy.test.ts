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

  /**
   * The file written and the file printed are one render, not two.
   *
   * ⚠️ Measured on the IDENTIFIER, not on its spelling. The literal
   * `writeFileSync(OUT, markdown` this used to assert broke the moment T-112
   * appended a second section and the written value became `full` (F-112) — a
   * rename is not a regression, but two different values would be. Reading the
   * name out of the source keeps the property and drops the false alarm.
   */
  it('writes exactly what it prints', () => {
    const written = /writeFileSync\(OUT,\s*([A-Za-z_$][\w$]*)/.exec(SRC);
    expect(written).not.toBeNull();
    const name = written?.[1];
    expect(name).toBeTruthy();
    expect(SRC).toContain(`console.log(${name})`);
  });
});

describe('measure-sense-accuracy.mjs — the T-112 cross-validation section', () => {
  it('loads both permitted second sources by name', () => {
    expect(SRC).toContain('h3-kaikki-en.jsonl');
    expect(SRC).toContain('h4-word2word-en-he.tsv');
  });

  it('passes null — never an empty index — when no second source is present', () => {
    expect(SRC).toMatch(/secondEntries\.length === 0 \? null :/);
  });

  it('appends the cross-validation section to the same report, not to a second file', () => {
    expect(SRC.match(/writeFileSync\(/g)).toHaveLength(1);
    expect(SRC).toContain('renderCrossValidationMarkdown');
  });

  it('⛔ names no language model as a validation source (D-055)', () => {
    expect(SRC.toLowerCase()).not.toMatch(/\bllm\b|\bgpt\b|openai|anthropic/);
  });
});
