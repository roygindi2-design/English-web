#!/usr/bin/env node
/**
 * Builds data/generated/amirnet-vocab.csv from the two CEFR profiles already in
 * data/ — T-222 (`plan/41-amirnet-spec.md § 6` · `data/amirnet-vocab-README.md § 2` ·
 * `docs/content-amirnet-vocab-brief.md § 1`).
 *
 * ⛔ Do not confuse this with `data/amirnet-vocab.csv` — a hand-committed snapshot
 *    (operator commit `3c03272`, 28/08) that this tick measured at 6,713 rows with
 *    an EMPTY `is_connector` column. That file stays as-is; this script is the
 *    missing DERIVATION — deterministic, tested, and it also populates
 *    `is_connector` — and its output lands in `data/generated/` on purpose:
 *    `data/*.csv` is `.gitignore`d, `data/generated/` is not (38 files already
 *    tracked there). The two files are allowed to disagree on the count; only
 *    this one is locked to a number by a test.
 *
 * Five steps (README § 2 / brief § 1):
 *   1. Union CEFR-J (A1..B2) and Octanove (C1..C2) by exact headword.
 *   2. On a headword seen at more than one band — keep the LOWEST band, in
 *      A1 < A2 < B1 < B2 < C1 < C2: the point where a learner first meets it.
 *   3. Drop A1 — assumed already known.
 *   4. Drop C2 — past the exam's range.
 *   5. Map the surviving band to a tier: A2⇒1 · B1⇒2 · B2⇒3 · C1⇒4.
 *
 * ⚠️ Merging is CASE-SENSITIVE on the headword string, not case-folded.
 * Measured in this tick: a case-insensitive merge reproduces the README's
 * numbers (1,243 · 2,139 · 2,417 · 914 = 6,713) — but the brief's own
 * from-scratch re-run (§ 1) measured 1,244 · 2,140 · 2,417 · 914 = 6,715, two
 * more, "not explained here and not guessed." Case-sensitive merging is the
 * one choice tried in this tick that reproduces exactly that 6,715/1,244/2,140
 * split — so that is the rule this script implements. ⛔ Do not "fix" this to
 * case-insensitive without re-deriving the target counts in the test file too.
 *
 * `is_connector` is DERIVED from `pos`, never copied — the source column is
 * not reconstructible (see the README § 1, ⓑ note). The rule: true if ANY row
 * for that exact headword, in EITHER source file, at ANY band, tags it
 * conjunction/preposition — not only the row whose band happened to survive
 * the merge. Measured in this tick: this any-row-union rule is the only one
 * of three tried that lands on 42 connectors in Tier 1+2 — a same-surviving-row
 * rule measures 35, and a "copy from every occurrence regardless of tier"
 * rule measures 48 in total (56 across all four tiers).
 *
 * ⚠️ Read as utf-8 with BOM stripped (README § 1, ⓑ note: both source files
 * carry one). Measured in this tick: neither checked-in copy has one today —
 * the strip is a no-op here, kept only as a guard against a re-fetched source.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = 'data';
const OUT_DIR = process.env.AMIRNET_OUT_DIR || join(DATA_DIR, 'generated');
const OUT = join(OUT_DIR, 'amirnet-vocab.csv');

const CEFRJ = { file: 'cefrj-vocabulary-profile-1.5.csv', source: 'CEFR-J v1.5' };
const OCTANOVE = { file: 'octanove-vocabulary-profile-c1c2-1.0.csv', source: 'Octanove v1.0' };

const BAND_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const BAND_RANK = Object.fromEntries(BAND_ORDER.map((b, i) => [b, i]));

const TIER_OF_BAND = { A2: 1, B1: 2, B2: 3, C1: 4 };
const TIER_NAME = { 1: 'ליבה', 2: 'ליבה מורחבת', 3: 'הרחבה אקדמית', 4: 'רמת פטור' };
const AMIRNET_LEVEL = { 1: '1-2', 2: '2-3', 3: '3', 4: '4' };
const CONNECTOR_POS = new Set(['conjunction', 'preposition']);

function stripBom(text) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

/** RFC4180 enough for these files: quoted fields, embedded commas, "" escapes. */
function splitCsvLine(line) {
  const out = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      out.push(field);
      field = '';
    } else {
      field += c;
    }
  }
  out.push(field);
  return out;
}

function readProfile({ file, source }) {
  const text = stripBom(readFileSync(join(DATA_DIR, file), 'utf8'));
  const rows = [];
  let sawHeader = false;
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const cols = splitCsvLine(line);
    const headword = (cols[0] ?? '').trim();
    const pos = (cols[1] ?? '').trim().toLowerCase();
    const band = (cols[2] ?? '').trim().toUpperCase();
    // The header row is identified by its band column failing to parse as a
    // band, the same test parseCefrCsv (lib/core/cefrLevels.ts) uses — a real
    // row whose headword happens to be "headword" still survives.
    if (!sawHeader && headword.toLowerCase() === 'headword' && !(band in BAND_RANK)) {
      sawHeader = true;
      continue;
    }
    if (!(band in BAND_RANK)) continue;
    rows.push({ headword, pos, band, source });
  }
  return rows;
}

function buildVocab(rows) {
  const best = new Map(); // exact headword -> { band, pos, source }
  const connector = new Set(); // exact headwords tagged connector in ANY row

  for (const row of rows) {
    if (CONNECTOR_POS.has(row.pos)) connector.add(row.headword);
    const prev = best.get(row.headword);
    if (!prev || BAND_RANK[row.band] < BAND_RANK[prev.band]) {
      best.set(row.headword, { band: row.band, pos: row.pos, source: row.source });
    }
  }

  const entries = [];
  for (const [headword, { band, pos, source }] of best) {
    if (band === 'A1' || band === 'C2') continue;
    const tier = TIER_OF_BAND[band];
    entries.push({
      headword,
      pos,
      cefr: band,
      tier,
      tier_name: TIER_NAME[tier],
      amirnet_level: AMIRNET_LEVEL[tier],
      is_connector: connector.has(headword) ? 'true' : '',
      source,
    });
  }
  return entries;
}

const CSV_HEADER = [
  'headword',
  'pos',
  'cefr',
  'tier',
  'tier_name',
  'amirnet_level',
  'is_connector',
  'source',
];

function csvEscape(value) {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

function toCsv(entries) {
  const lines = [CSV_HEADER.join(',')];
  for (const e of entries) {
    lines.push(CSV_HEADER.map((k) => csvEscape(e[k])).join(','));
  }
  return lines.join('\n') + '\n';
}

function main() {
  const rows = [...readProfile(CEFRJ), ...readProfile(OCTANOVE)];
  const entries = buildVocab(rows);

  const byTier = new Map();
  let connectors12 = 0;
  for (const e of entries) {
    byTier.set(e.tier, (byTier.get(e.tier) ?? 0) + 1);
    if (e.is_connector === 'true' && (e.tier === 1 || e.tier === 2)) connectors12 += 1;
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT, toCsv(entries), 'utf8');

  console.log(`amirnet-vocab: wrote ${entries.length} rows to ${OUT}`);
  console.log(
    `  tier 1=${byTier.get(1) ?? 0} · 2=${byTier.get(2) ?? 0} · 3=${byTier.get(3) ?? 0} · 4=${byTier.get(4) ?? 0}`,
  );
  console.log(`  connectors (tier 1+2)=${connectors12}`);
}

main();
