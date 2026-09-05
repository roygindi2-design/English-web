#!/usr/bin/env node
/**
 * npm run measure:amirnet-coverage — T-244, the gate `plan/25-content-commissions.md`
 * K-007 names as the thing that stops "coverage" from being a word instead of a
 * number. Prints three numbers, from `data/amirnet-vocab.csv` and the bank
 * (`data/generated/batch-*.jsonl`):
 *   1. how many of the 3,382 Tier 1+2 headwords already have >=1 sense in the bank
 *   2. of the polysemous ones among those (per the CEFR source profiles), how many
 *      still carry only one sense — "shallow"
 *   3. the delta of both against the previous run's report
 *
 * ⛔ Read-only over data/ and data/generated/ — the one file it writes is
 * docs/amirnet-coverage-report.md (or AMIRNET_COVERAGE_REPORT_OUT in a test).
 * ⛔ It never decides a level and never writes to the bank (K-007's own text).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

function withTsFormat(resolved) {
  if (resolved && typeof resolved.url === 'string' && resolved.url.endsWith('.ts')) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}

const {
  parseAmirnetVocabCsv,
  parseCefrProfileCsv,
  computeCoverage,
  diffCoverage,
  formatCoverageReport,
  parsePreviousCoverageReport,
} = await import('../lib/core/amirnetCoverage.ts');
const { parseBatchFile } = await import('../lib/core/batchRecord.ts');

const VOCAB_CSV = process.env.AMIRNET_VOCAB_CSV || join('data', 'amirnet-vocab.csv');
const CEFRJ_CSV = process.env.CEFRJ_PROFILE_CSV || join('data', 'cefrj-vocabulary-profile-1.5.csv');
const OCTANOVE_CSV = process.env.OCTANOVE_PROFILE_CSV || join('data', 'octanove-vocabulary-profile-c1c2-1.0.csv');
const BATCH_DIR = process.env.AMIRNET_BATCH_DIR || join('data', 'generated');
const OUT = process.env.AMIRNET_COVERAGE_REPORT_OUT || join('docs', 'amirnet-coverage-report.md');

function requireFile(path) {
  if (!existsSync(path)) {
    console.error(`measure:amirnet-coverage: missing required file: ${path}`);
    console.error('  (this is a hard stop, not "0 coverage" — see plan/25-content-commissions.md K-007)');
    process.exit(1);
  }
  return readFileSync(path, 'utf8');
}

const vocabText = requireFile(VOCAB_CSV);
const cefrjText = requireFile(CEFRJ_CSV);
const octanoveText = requireFile(OCTANOVE_CSV);

const vocabRows = parseAmirnetVocabCsv(vocabText);
const profileRows = [...parseCefrProfileCsv(cefrjText), ...parseCefrProfileCsv(octanoveText)];

const batchFiles = existsSync(BATCH_DIR)
  ? readdirSync(BATCH_DIR).filter((name) => /^batch-.*\.jsonl$/.test(name)).sort()
  : [];

const bankRecords = [];
for (const file of batchFiles) {
  const records = parseBatchFile(readFileSync(join(BATCH_DIR, file), 'utf8'));
  for (const r of records) {
    bankRecords.push({ headword: r.sense.headword, senseIndex: r.senseIndex });
  }
}

const previousReport = existsSync(OUT) ? parsePreviousCoverageReport(readFileSync(OUT, 'utf8')) : null;

const counts = computeCoverage({ vocabRows, profileRows, bankRecords });
const delta = diffCoverage(counts, previousReport);
const measuredAtIso = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

writeFileSync(OUT, formatCoverageReport(counts, delta, measuredAtIso), 'utf8');

function fmtDelta(n) {
  if (n === null) return 'אין דוח קודם';
  if (n === 0) return '±0';
  return n > 0 ? `+${n}` : `${n}`;
}

console.log(`existing: ${counts.existingCount} / ${counts.targetTotal} (Tier 1+2) — delta existing ${fmtDelta(delta.existingDelta)}`);
console.log(`polysemous in Tier 1+2 (per CEFR source profiles): ${counts.polysemousTargetCount}`);
console.log(`shallow: ${counts.polysemousShallowCount} (polysemous headwords with exactly 1 sense in the bank) — delta shallow ${fmtDelta(delta.polysemousShallowDelta)}`);
console.log(`wrote ${OUT}`);
