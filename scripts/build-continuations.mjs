#!/usr/bin/env node
/**
 * T-460 · D-283 — builds `data/generated/continuations.json`, the observed prefix
 * tree the block keyboard reads (`lib/core/continuations.ts`).
 *
 *   1 · downloads Tatoeba's English sentences from the ONE permitted host
 *       (`lib/core/dataSources.ts` id `tatoeba`, checked by `checkSourceUrl`) into
 *       `data/tatoeba/` (gitignored — input, ⛔ not product). A cached copy is reused.
 *   2 · keeps sentences of ≤12 words whose every word is in CEFR-J, via the same
 *       lemmatiser the content gates use; level = the sentence's highest word.
 *   3 · keeps A1–A2 (D-283's measured corpus) and cuts the tree at MAX_DEPTH.
 *   4 · prints the measured sizes, and whether every required word of every fixture
 *       simulation is reachable within 4 blocks — ⛔ a miss is a CONTENT finding (T-193).
 *
 * `bzip2 -dc` does the decompression: Node has no bz2, and ⛔ no dependency is added.
 * Deterministic: same corpus, same bytes.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) specifier = new URL(`../${specifier.slice(2)}`, import.meta.url).href;
    if ((specifier.startsWith('.') || specifier.startsWith('file:')) && !/\.[a-z]+$/i.test(specifier)) {
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

const { parseCefrCsv } = await import('../lib/core/cefrLevels.ts');
const { checkSourceUrl } = await import('../lib/core/provenance.ts');
const C = await import('../lib/core/continuations.ts');
const { FIXTURE_SIMULATIONS } = await import('../app/dev/messages/messages-fixture.ts');

const URL_ = 'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2';
const CACHE_DIR = join('data', 'tatoeba');
const CACHE = join(CACHE_DIR, 'eng_sentences.tsv.bz2');
const OUT = join('data', 'generated', 'continuations.json');
/** D-283: A1–A2 is the measured corpus. */
const LEVELS = new Set(['A1', 'A2']);
/**
 * T-460ⓒ: over 1.5MB gzip ⇒ cut to depth 6. Measured 24/09 (C-0791), A1–A2:
 * depth 11 ⇒ 3.35MB · 8 ⇒ 3.24MB · 6 ⇒ 2.88MB · 5 ⇒ 2.48MB · 4 ⇒ 1.87MB · 3 ⇒ 1.12MB gzip.
 * ⇒ even 6 is over the budget; the row's own fallback is taken and the miss is recorded.
 */
const MAX_DEPTH = Number(process.env.CONTINUATIONS_DEPTH ?? 6);
const REQUIRED_DEPTH = 4;
const BUDGET_GZIP = 1.5e6;

const verdict = checkSourceUrl('tatoeba', URL_);
if (!verdict.ok) throw new Error(verdict.reason);

if (!existsSync(CACHE)) {
  mkdirSync(CACHE_DIR, { recursive: true });
  console.log(`↓ ${URL_}`);
  const res = await fetch(URL_);
  if (!res.ok) throw new Error(`build-continuations: ${res.status} from ${URL_}`);
  writeFileSync(CACHE, Buffer.from(await res.arrayBuffer()));
}

const tsv = execFileSync('bzip2', ['-dc', CACHE], { maxBuffer: 1 << 30 }).toString('utf8');
const all = [];
for (const line of tsv.split('\n')) {
  const text = line.split('\t')[2];
  if (text) all.push(text);
}

const lexicon = C.wordLexicon(
  parseCefrCsv(readFileSync(join('data', 'cefrj-vocabulary-profile-1.5.csv'), 'utf8')).entries,
);
const kept = all.filter((s) => {
  const hit = C.sentenceTokens(s, lexicon);
  return hit !== null && LEVELS.has(hit.level);
});

const index = C.buildContinuationIndex(kept, lexicon, {
  maxDepth: MAX_DEPTH,
  source: `Tatoeba eng_sentences (CC BY 2.0 FR) · ${all.length} sentences · CEFR-J ${[...LEVELS].join('–')}`,
});
const json = JSON.stringify(index);
writeFileSync(OUT, `${json}\n`, 'utf8');

const gz = gzipSync(json).length;
console.log(`✓ ${OUT}`);
console.log(`  corpus ${all.length} · kept ${index.sentences} (${[...LEVELS].join('–')}, ≤${C.MAX_SENTENCE_WORDS} words)`);
console.log(`  depth ${MAX_DEPTH} · ${index.words.length} words · ${(json.length / 1e6).toFixed(2)}MB raw · ${(gz / 1e6).toFixed(2)}MB gzip`);
if (gz > BUDGET_GZIP) console.log(`  ⚠️ over the ${BUDGET_GZIP / 1e6}MB gzip budget (T-460ⓒ) — recorded, ⛔ not hidden`);
console.log(`  first blocks at A1: ${C.nextBlocks(index, [], 'A1').count}`);

let misses = 0;
for (const sim of FIXTURE_SIMULATIONS) {
  const level = C.CONTINUATION_LEVELS.includes(sim.level) ? sim.level : 'A2';
  for (const word of sim.requiredWords) {
    if (C.reachableWithin(index, word, REQUIRED_DEPTH, level)) continue;
    misses += 1;
    console.log(`  ⚠️ required «${word}» (${sim.id.slice(0, 8)}, ${level}) is ⛔ not reachable within ${REQUIRED_DEPTH} blocks ⇒ CONTENT (T-193)`);
  }
}
console.log(`  required words unreachable within ${REQUIRED_DEPTH}: ${misses}`);
