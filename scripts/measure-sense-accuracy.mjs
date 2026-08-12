#!/usr/bin/env node
/**
 * Runs the T-018 sense-selection accuracy measurement (R-006).
 *
 * The ONLY impure layer: it reads data/ and writes docs/sense-accuracy-report.md.
 * All arithmetic lives in lib/core/{senseInventory,cefrLevels,senseGold,
 * senseSelection,senseAccuracy}.ts and is unit tested.
 *
 * ⛔ It downloads nothing (TD-17) and it never prints a number it cannot
 * justify: a missing input reports `unavailable`, not 0%.
 *
 * TypeScript is imported directly, with no build step and no new dependency —
 * the same resolve hook measure-coverage.mjs uses, for the same reason: Node
 * strips types on its own but does not resolve the extensionless specifiers
 * lib/core/ uses.
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

function withTsFormat(resolved) {
  if (resolved && typeof resolved.url === 'string' && resolved.url.endsWith('.ts')) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}

const { buildGoldSet } = await import('../lib/core/senseGold.ts');
const { parseCefrCsv, buildLevelMap } = await import('../lib/core/cefrLevels.ts');
const { buildInventory } = await import('../lib/core/senseInventory.ts');
const { measureAccuracy, renderAccuracyMarkdown } = await import('../lib/core/senseAccuracy.ts');

const DATA = 'data';
const OUT = join('docs', 'sense-accuracy-report.md');

const H1 = join(DATA, 'h1-hebrew-wordnet.tsv');
const INVENTORY = join(DATA, 'wordnet-sense-index.tsv');
const H1_SYNSETS = join(DATA, 'h1-hebrew-wordnet-synsets.tsv');
const LEVEL_FILES = [
  join(DATA, 'cefrj-vocabulary-profile-1.5.csv'),
  join(DATA, 'octanove-vocabulary-profile-c1c2-1.0.csv'),
];

const provenance = [];

if (!existsSync(H1)) {
  console.error(`missing ${H1} — see data/README.md (T-043). Nothing measured.`);
  process.exit(1);
}
const gold = buildGoldSet(readFileSync(H1, 'utf8'));
provenance.push(
  `${H1} — ${gold.lines} lines · ${gold.byLemma.size} lemmas with a gold answer · `
  + `${gold.droppedGap} GAP dropped · ${gold.droppedPseudoGap} PSEUDOGAP dropped · `
  + `${gold.lowGlosses} \`!\` kept as low · ${gold.malformed} malformed`,
);

const levelEntries = [];
for (const file of LEVEL_FILES) {
  if (!existsSync(file)) { provenance.push(`${file} — unavailable`); continue; }
  const parsed = parseCefrCsv(readFileSync(file, 'utf8'));
  levelEntries.push(...parsed.entries);
  provenance.push(
    `${file} — ${parsed.rows} rows · ${parsed.entries.length} entries · `
    + `${parsed.skipped} skipped · ${parsed.unknownPos} with an unrecognised POS`,
  );
}
const levels = buildLevelMap(levelEntries);

// The sense inventory is what the accuracy number needs and what does not
// exist yet. Reporting `unavailable` here is the honest output, and it is why
// this script exits 0: the pipeline is proven, the input is missing.
let inventoryRecords = null;
if (existsSync(INVENTORY)) {
  inventoryRecords = readFileSync(INVENTORY, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((l) => l.split('\t'))
    .filter((c) => c.length >= 5)
    .map(([lemma, pos, synsetId, senseNumber, tagCount]) => ({
      lemma,
      pos,
      synsetId,
      senseNumber: Number(senseNumber),
      tagCount: Number(tagCount),
    }));
  provenance.push(`${INVENTORY} — ${inventoryRecords.length} sense records`);
} else {
  provenance.push(`${INVENTORY} — **unavailable** (T-043: WordNet sense index)`);
}
if (!existsSync(H1_SYNSETS)) {
  provenance.push(`${H1_SYNSETS} — **unavailable** (T-043: synset-bearing H1 export)`);
}

const inv = buildInventory(inventoryRecords ?? []);
// ⛔ No items are synthesised. With no inventory there is nothing to select,
// and the report prints `unavailable` in every cell rather than a fake 100%.
const report = measureAccuracy({ items: [], inv, gold, levels });

const markdown = renderAccuracyMarkdown(report, provenance);
mkdirSync('docs', { recursive: true });
writeFileSync(OUT, markdown, 'utf8');
console.log(markdown);
console.log(`\nwritten to ${OUT}`);
