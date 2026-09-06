#!/usr/bin/env node
/**
 * Builds `data/wordnet-sense-index.tsv` from Princeton's WordNet 3.1 release —
 * T-198 (`plan/50-tasks.md`). Replaces the T-018 precedent of "Roy uploads a
 * file": the dict tarball is freely downloadable and licensed for commercial
 * use with attribution (Princeton WordNet License; recorded once in
 * `lib/core/dataSources.ts`, id `wordnet` — R-004 pattern, one legitimate host).
 *
 * Measured in this tick, live:
 *   · `https://wordnetcode.princeton.edu/wn3.1.dict.tar.gz` ⇒ 200, 16,358,468 bytes.
 *   · Its SHA-512 was cross-checked against the value published in Gentoo's
 *     distfiles Manifest for app-dicts/wordnet (a source this script never
 *     talks to at runtime) — exact match. `EXPECTED_SHA512` below is that
 *     measured value: a download that does not hash to it is refused, not
 *     "trusted because it downloaded" (T-198's own "verifies checksum" ⓐ).
 *   · `dict/index.sense` (207,235 lines) already carries its own `tag_cnt` as
 *     the 4th column. `dict/cntlist` (37,387 lines) is near-duplicate data —
 *     checked directly against a live download: of the 35,307 sense_keys
 *     present in BOTH files, `tag_count` never disagreed (0/35,307). That is
 *     the cross-validation this script performs (`buildSenseIndexRows`): a
 *     shared sense_key with a different tag_count between the two files is
 *     treated as corruption and throws, not "pick one and move on".
 *   · cntlist's THIRD column is a from-frequency *rank*, not index.sense's
 *     dictionary sense_number — measured: 754 of those 35,307 shared keys
 *     disagree on it (e.g. `person%1:03:00::` ⇒ index.sense says 1, cntlist
 *     says 2). `sense_number` in the output therefore always comes from
 *     index.sense alone; cntlist is read only for the tag_count cross-check.
 *
 * `synset_id` is `${synset_offset}-${pos}` (e.g. `02610777-v`), not the bare
 * 8-digit offset: WordNet offsets are only unique WITHIN one part-of-speech's
 * data file, so the bare number collides across pos — this repo's column is
 * meant to be a standalone key (own call, `RULES § 0.22` latitude — logged in
 * the tick's control-log line).
 *
 * Output is gitignored already (`data/*.tsv`, `.gitignore` line 13, checked
 * live this tick with `git check-ignore`) — this script is the source of
 * truth, same pattern as `build-amirnet-vocab.mjs`'s header comment.
 *
 * ⛔ Pure parsing/validation functions are exported and unit-tested with fixture
 * strings in `fetch-wordnet.test.ts` — no network in `npm test`. The impure
 * network + tar extraction below only runs when this file is executed
 * directly (`npm run fetch:wordnet`), guarded by the `import.meta.url` check
 * at the bottom, exactly so `npm run verify` never depends on the network.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const WORDNET_URL = 'https://wordnetcode.princeton.edu/wn3.1.dict.tar.gz';

// Measured in this tick — see the header comment above for how it was cross-checked.
export const EXPECTED_SHA512 =
  '16dca17a87026d8a0b7b4758219cd21a869c3ef3da23ce7875924546f2eacac4c2f376cb271b798b2c458fe8c078fb43d681356e3d9beef40f4bd88d3579394f';

const OUT = join('data', 'wordnet-sense-index.tsv');

const POS_BY_SS_TYPE = Object.freeze({ 1: 'n', 2: 'v', 3: 'a', 4: 'r', 5: 's' });

/** `lemma%ss_type:lex_filenum:lex_id:head_word:head_id` → `{ lemma, pos }` (wndb.5). */
export function parseSenseKey(senseKey) {
  const percentAt = senseKey.indexOf('%');
  const lemma = senseKey.slice(0, percentAt);
  const ssType = Number(senseKey.slice(percentAt + 1, percentAt + 2));
  const pos = POS_BY_SS_TYPE[ssType];
  if (!pos) throw new Error(`unrecognised ss_type "${ssType}" in sense_key "${senseKey}"`);
  return { lemma, pos };
}

/** One `dict/index.sense` line → its four fields, or null for a blank line. */
export function parseIndexSenseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const [senseKey, synsetOffset, senseNumberStr, tagCountStr] = trimmed.split(/\s+/);
  const { lemma, pos } = parseSenseKey(senseKey);
  return {
    senseKey,
    lemma,
    pos,
    synsetOffset,
    senseNumber: Number(senseNumberStr),
    tagCount: Number(tagCountStr),
  };
}

/** One `dict/cntlist` line → its three fields, or null for a blank line. */
export function parseCntlistLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const [tagCountStr, senseKey, senseNumberStr] = trimmed.split(/\s+/);
  return { tagCount: Number(tagCountStr), senseKey, senseNumber: Number(senseNumberStr) };
}

/**
 * Builds the five-column row set. `indexLines`/`cntLines` are the raw text
 * lines of `dict/index.sense` / `dict/cntlist` (order preserved from
 * index.sense, which ships already sorted by sense_key).
 */
export function buildSenseIndexRows(indexLines, cntLines) {
  const cntBySenseKey = new Map();
  for (const raw of cntLines) {
    const parsed = parseCntlistLine(raw);
    if (parsed) cntBySenseKey.set(parsed.senseKey, parsed);
  }

  const rows = [];
  for (const raw of indexLines) {
    const parsed = parseIndexSenseLine(raw);
    if (!parsed) continue;
    const cross = cntBySenseKey.get(parsed.senseKey);
    if (cross && cross.tagCount !== parsed.tagCount) {
      throw new Error(
        `tag_count mismatch for sense_key "${parsed.senseKey}": ` +
          `index.sense says ${parsed.tagCount}, cntlist says ${cross.tagCount}`,
      );
    }
    rows.push({
      lemma: parsed.lemma,
      pos: parsed.pos,
      synsetId: `${parsed.synsetOffset}-${parsed.pos}`,
      senseNumber: parsed.senseNumber,
      tagCount: parsed.tagCount,
    });
  }
  return rows;
}

export function toTsv(rows) {
  const header = 'lemma\tpos\tsynset_id\tsense_number\ttag_count';
  const body = rows.map((r) => `${r.lemma}\t${r.pos}\t${r.synsetId}\t${r.senseNumber}\t${r.tagCount}`);
  return [header, ...body].join('\n') + '\n';
}

export function verifySha512(buffer, expectedHex) {
  return createHash('sha512').update(buffer).digest('hex') === expectedHex;
}

async function main() {
  const workDir = mkdtempSync(join(tmpdir(), 'fetch-wordnet-'));
  try {
    console.log(`↓ downloading ${WORDNET_URL}`);
    const archivePath = join(workDir, 'wn3.1.dict.tar.gz');
    // Node's global fetch (Node ≥18) — no extra dependency for a script this small.
    const res = await fetch(WORDNET_URL);
    if (!res.ok) throw new Error(`GET ${WORDNET_URL} → HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(archivePath, buffer);

    if (!verifySha512(buffer, EXPECTED_SHA512)) {
      throw new Error(
        `checksum mismatch: downloaded ${WORDNET_URL} does not match the pinned SHA-512. ` +
          'Refusing to build the index from an unverified file (T-198 ⓐ).',
      );
    }
    console.log('✓ SHA-512 verified against the pinned, independently-measured value');

    execFileSync('tar', ['-xzf', archivePath, '-C', workDir, 'dict/index.sense', 'dict/cntlist']);

    const indexLines = readFileSync(join(workDir, 'dict', 'index.sense'), 'utf8').split('\n');
    const cntLines = readFileSync(join(workDir, 'dict', 'cntlist'), 'utf8').split('\n');

    const rows = buildSenseIndexRows(indexLines, cntLines);
    mkdirSync('data', { recursive: true });
    writeFileSync(OUT, toTsv(rows), 'utf8');
    console.log(`✓ wrote ${OUT} — ${rows.length} rows`);
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
