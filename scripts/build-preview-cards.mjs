#!/usr/bin/env node
/**
 * Builds lib/core/previewCards.generated.ts from data/generated/batch-*.jsonl (T-034 · F-012).
 *
 * This is the only impure layer: it reads files and writes one. Parsing
 * (lib/core/batchRecord.ts) and selection (lib/core/previewSelection.ts) are pure
 * and unit tested.
 *
 * TypeScript is imported directly, with no build step and no new dependency — the
 * registerHooks preamble is copied verbatim from scripts/build-ingest-sql.mjs.
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
const { selectPreviewCards } = await import('../lib/core/previewSelection.ts');

const SOURCE_ID = 'generated:ngsl-headwords';
const COUNT = 6;
const OPTION_COUNT = 4;
const OUT = 'lib/core/previewCards.generated.ts';

const dir = 'data/generated';
// ⚠️ Deviation from the plan (T-034, task 2): the plan's regex
// `/^batch-\d{4}-\d{2}-\d{2}\.jsonl$/` only matched the 9 single-part batch files
// that existed on 2026-08-16. Measured today (2026-09-02) in this clone: 23 files
// now match `batch-*.jsonl`, including multi-part days like
// `batch-2026-08-29-2.jsonl` … `batch-2026-08-29-8.jsonl`, which that regex would
// silently skip. Using the same `/^batch-.*\.jsonl$/` pattern already established
// in scripts/build-ingest-sql.mjs, scripts/measure-gate.mjs,
// scripts/build-word-levels-sql.mjs and scripts/build-stories-sql.mjs — confirmed
// by inspection to share the same word-sense schema (unlike messages-*.jsonl /
// stories-*.jsonl / story-questions-*.jsonl, which are a different content type
// entirely and must stay excluded).
const files = readdirSync(dir)
  .filter((f) => /^batch-.*\.jsonl$/.test(f))
  .sort();
const records = files.flatMap((f) => parseBatchFile(readFileSync(join(dir, f), 'utf8')));
const cards = selectPreviewCards(records, { count: COUNT, optionCount: OPTION_COUNT, sourceId: SOURCE_ID });

const body = cards
  .map(
    (c) =>
      `  {\n    headword: ${JSON.stringify(c.headword)},\n    pos: ${JSON.stringify(c.pos)},\n` +
      `    options: [${c.options.map((o) => JSON.stringify(o)).join(', ')}],\n` +
      `    correctIndex: ${c.correctIndex},\n    sourceId: PREVIEW_CARDS_SOURCE_ID,\n  },`,
  )
  .join('\n');

writeFileSync(
  OUT,
  `/**\n * GENERATED FILE — do not edit by hand.\n *\n * Written by scripts/build-preview-cards.mjs from ${files.length} batch files\n` +
    ` * (${records.length} senses). Regenerate with \`npm run build:preview\`;\n` +
    ` * scripts/build-preview-cards.test.ts fails if this file drifts from the script.\n */\n` +
    `import type { PreviewCard } from './landing';\n\n` +
    `export const PREVIEW_CARDS_SOURCE_ID = ${JSON.stringify(SOURCE_ID)};\n\n` +
    `export const GENERATED_PREVIEW_CARDS: readonly PreviewCard[] = [\n${body}\n];\n`,
  'utf8',
);

console.log(`${records.length} senses from ${files.length} files → ${cards.length} preview cards`);
