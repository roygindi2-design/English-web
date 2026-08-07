#!/usr/bin/env node
/**
 * Runs the Hebrew coverage measurement (T-013 · T-016 · R-005).
 *
 * This is the ONLY impure layer: it reads files and writes one. All arithmetic
 * lives in lib/core/{lexicon,coverage,sources}.ts and is unit tested.
 *
 * ⛔ It does not download anything. TD-17 blocks every data domain; the files
 * come through the repo (T-043, see data/README.md).
 *
 * TypeScript is imported directly, with no build step and no new dependency.
 * Node ≥ 22.18 strips types on its own; what it does NOT do is resolve the
 * extensionless specifiers that lib/core/ uses (`from './lexicon'`), so the
 * resolve hook below appends `.ts`. Measured on Node v22.22.2 — `tsx` was
 * considered and rejected as a dependency for a script that runs rarely.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return withTsFormat(nextResolve(`${specifier}.ts`, context));
      } catch {
        // Not a TypeScript sibling — fall through to the default resolver.
      }
    }
    return withTsFormat(nextResolve(specifier, context));
  },
});

/**
 * Without this, Node loads the .ts file, cannot tell from package.json whether
 * it is CJS or ESM, and prints a MODULE_TYPELESS_PACKAGE_JSON warning on every
 * run. Naming the format keeps the report's output readable.
 */
function withTsFormat(resolved) {
  if (resolved && typeof resolved.url === 'string' && resolved.url.endsWith('.ts')) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}

const { measureCoverage, STRICT_POLICY, LENIENT_POLICY } = await import(
  '../lib/core/coverage.ts'
);
const {
  MAX_SKIP_RATE,
  parseKaikkiJsonl,
  parseNgslCsv,
  parsePairsTsv,
  renderReportMarkdown,
  skipRate,
} = await import('../lib/core/sources.ts');

const DATA = 'data';
const OUT = join('docs', 'coverage-report.md');
const NGSL_EXPECTED_ROWS = 2809;

const SOURCES = [
  { id: 'H1', label: 'Hebrew Wordnet', file: 'h1-hebrew-wordnet.tsv', parse: parsePairsTsv },
  { id: 'H2', label: 'Wiktionary EN→HE', file: 'h2-wiktionary-en-he.tsv', parse: parsePairsTsv },
  { id: 'H3', label: 'Kaikki / wiktextract', file: 'h3-kaikki-en.jsonl', parse: (t) => parseKaikkiJsonl(t, 'he') },
  { id: 'H4', label: 'word2word', file: 'h4-word2word-en-he.tsv', parse: parsePairsTsv },
];

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const ngslPath = join(DATA, 'ngsl-1.2.csv');
if (!existsSync(ngslPath)) {
  fail(
    `${ngslPath} is missing, so there is nothing to measure coverage OF.\n` +
      `  This is T-043 — a human action. See data/README.md.\n` +
      `  ⛔ Do not download it: TD-17 blocks the domain and R-004 forbids mirrors.`,
  );
}

const ngsl = parseNgslCsv(readFileSync(ngslPath, 'utf8'));
if (ngsl.rows !== NGSL_EXPECTED_ROWS) {
  fail(
    `${ngslPath} has ${ngsl.rows} rows, expected exactly ${NGSL_EXPECTED_ROWS} (NGSL v1.2).\n` +
      `  The early 2,80x version comes from the domain we do not control (R-004 · F-005).`,
  );
}

const loaded = [];
for (const s of SOURCES) {
  const path = join(DATA, s.file);
  if (!existsSync(path)) {
    console.log(`  ${s.id} ${s.label}: unavailable (${path} not present)`);
    continue;
  }
  const parsed = s.parse(readFileSync(path, 'utf8'));
  const rate = skipRate(parsed);
  if (rate > MAX_SKIP_RATE) {
    fail(
      `${s.id} parser skipped ${parsed.skipped}/${parsed.lines} lines (${(rate * 100).toFixed(2)}%),\n` +
        `  above the ${(MAX_SKIP_RATE * 100).toFixed(1)}% ceiling. The FORMAT does not match data/README.md.\n` +
        `  Refusing to report a coverage number computed from a file we cannot read.`,
    );
  }
  console.log(
    `  ${s.id} ${s.label}: ${parsed.entries.length} glosses, ${parsed.skipped}/${parsed.lines} lines skipped`,
  );
  loaded.push({ id: s.id, label: s.label, entries: parsed.entries });
}

if (loaded.length === 0) {
  fail('No translation source files present. See data/README.md (T-043).');
}

const strict = measureCoverage(ngsl.headwords, loaded, STRICT_POLICY);
const lenient = measureCoverage(ngsl.headwords, loaded, LENIENT_POLICY);

mkdirSync('docs', { recursive: true });
writeFileSync(OUT, renderReportMarkdown(strict, lenient, new Date().toISOString()), 'utf8');

console.log(`\nSTRICT  combined: ${strict.combined.percent}% (${strict.combined.covered}/${strict.combined.total})`);
console.log(`LENIENT combined: ${lenient.combined.percent}% (${lenient.combined.covered}/${lenient.combined.total})`);
console.log(`uncovered (STRICT): ${strict.uncovered.length}`);
console.log(`\nWrote ${OUT}`);
