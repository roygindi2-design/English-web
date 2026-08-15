#!/usr/bin/env node
/**
 * D-035 ⓑ — re-gate every generated sentence with the FIXED gate and report the count.
 *
 * The 806 example sentences and 1,209 item stems in data/generated/ were gated by
 * contentSchema.ts BEFORE F-020 was fixed in C-0012, when inflections() invented real
 * unrelated words (card = car + d) and let an out-of-level word through. D-035 makes the
 * re-run a release condition of T-066 and demands the reject count be "known and
 * reported". This script is the report. ⛔ It repairs nothing (R-014).
 *
 * ⛔ Read-only over data/generated/. The one file it writes is docs/gate-recheck.md.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

const { parseBatchFile } = await import('../lib/core/batchRecord.ts');
const { gateSense } = await import('../lib/core/contentSchema.ts');
const { summarizeGate, formatGateReport } = await import('../lib/core/gateReport.ts');

const DATA = join('data', 'generated');
const ALLOWED_WORDS_FILE = 'allowed-words-2026-08-07.txt';
const OUT = process.env.GATE_REPORT_OUT || join('docs', 'gate-recheck.md');

const allowedWords = new Set(
  readFileSync(join(DATA, ALLOWED_WORDS_FILE), 'utf8')
    .split('\n')
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line !== '' && !line.startsWith('#')),
);

const batchFiles = readdirSync(DATA)
  .filter((name) => /^batch-.*\.jsonl$/.test(name))
  .sort();

const outcomes = [];
let sentencesGated = 0;
let itemStemsGated = 0;

for (const file of batchFiles) {
  const records = parseBatchFile(readFileSync(join(DATA, file), 'utf8'));
  records.forEach((record, i) => {
    // Counted from the record itself, ⛔ never as records.length × 2: D-022 fixes two
    // examples per sense, and a count that assumes the rule cannot detect it breaking.
    sentencesGated += Object.keys(record.sense.examples).length;
    itemStemsGated += record.sense.items.length;
    const result = gateSense(record.sense, { allowedWords });
    outcomes.push({
      file,
      line: i + 1,
      headword: record.sense.headword,
      ok: result.ok,
      reasons: result.reasons,
    });
  });
}

const report = summarizeGate(outcomes, { sentencesGated, itemStemsGated });
writeFileSync(OUT, formatGateReport(report), 'utf8');

console.log(`${report.rowsRead} rows read from ${batchFiles.length} batch files`);
console.log(`${report.sentencesGated} example sentences · ${report.itemStemsGated} item stems re-gated`);
console.log(`${report.rowsRejected} rows rejected`);
for (const entry of report.reasonHistogram) console.log(`  ${entry.count} × ${entry.reason}`);
console.log(`wrote ${OUT}`);
