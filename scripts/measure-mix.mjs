#!/usr/bin/env node
/**
 * T-221 · D-138 § ג׳ · closes F-163 — `docs/content-distractors-brief.md` names a
 * second test after delivery ("meanings with a full D-023 mix move from 127 toward
 * 445") and, until this script, no command in the repo ran it — the brief pointed to
 * a SENTENCE, and the number had to be reconstructed with an ad-hoc `python3` run
 * (measured by DEV in C-0342).
 *
 * ⛔ NOT a build gate (ⓑ), exactly like `measure:coverage` — it reports, it does not
 * fail. Pattern of scripts/measure-gate.mjs: read every data/generated/batch-*.jsonl
 * with the one shared batch parser, hand the senses to the pure lib/core counter.
 */
import { readdirSync, readFileSync } from 'node:fs';
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
const { measureMix } = await import('../lib/core/mixReport.ts');

const DATA = join('data', 'generated');

const batchFiles = readdirSync(DATA)
  .filter((name) => /^batch-.*\.jsonl$/.test(name))
  .sort();

const senses = [];
for (const file of batchFiles) {
  const records = parseBatchFile(readFileSync(join(DATA, file), 'utf8'));
  for (const record of records) senses.push(record.sense);
}

const { rowsRead, fullMix, atLeastOneTagged } = measureMix(senses);
const pct = (n) => (rowsRead === 0 ? '0.0%' : `${((n / rowsRead) * 100).toFixed(1)}%`);

console.log(`${rowsRead} senses read from ${batchFiles.length} batch files`);
console.log(
  `${fullMix} / ${rowsRead} = ${pct(fullMix)} full D-023 mix ` +
    '(≥2 semantic + ≥1 orthographic distractor, each resolved to a translation already in the bank)',
);
console.log(
  `${atLeastOneTagged} / ${rowsRead} = ${pct(atLeastOneTagged)} at least one resolved tagged distractor`,
);
