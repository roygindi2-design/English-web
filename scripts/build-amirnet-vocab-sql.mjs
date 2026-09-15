#!/usr/bin/env node
/**
 * Builds supabase/seed/0007_amirnet_vocab.sql from data/generated/amirnet-vocab.csv
 * (T-323 · `המשך של: T-270` · `plan/41-amirnet-spec.md § 6` · D-232).
 *
 * ⛔ This is the ONLY impure layer: it reads one file and writes one file, exactly the
 *    split `scripts/build-ingest-sql.mjs` draws. The DERIVATION is ⛔ not repeated here —
 *    `scripts/build-amirnet-vocab.mjs` (T-222) owns the union, the lowest-band merge, the
 *    A1/C2 drops and the tier mapping, and its 6,715-row CSV is this script's INPUT.
 *    ⇒ a disagreement between the two is a bug in the derivation, ⛔ never something this
 *    file repairs.
 *
 * ⛔ **WHY THIS EXISTS.** Measured at T-323: `data/generated/amirnet-vocab.csv` is 376,409
 *    bytes and `grep -rl amirnet-vocab scripts/` returns exactly one consumer —
 *    `scripts/measure-amirnet-coverage.mjs`. The table `0026_amirnet_vocab.sql` created
 *    therefore stands EMPTY until something emits its rows. T-270's own words:
 *    «⛔ ולא נשארות קבצים שסקריפט קורא». A client ⛔ cannot read `data/generated/`.
 *
 * ⛔ **THE GATES ARE REPEATED HERE ON PURPOSE, ⛔ AND THAT IS ⛔ NOT DUPLICATION.**
 *    `0026_amirnet_vocab.sql` carries `amirnet_vocab_cefr_check`,
 *    `amirnet_vocab_tier_name_pairing`, `amirnet_vocab_level_check` and
 *    `amirnet_vocab_headword_check`. Emitting a row the table would refuse only moves the
 *    refusal to load time, six thousand rows in, where it reads as a transaction failure
 *    instead of as the named defect it is. ⇒ this script REFUSES first, by name, exactly
 *    as `scripts/build-amirnet-items.mjs` refuses an item with no `vocab_band`.
 *
 * ⛔ **⛔ Zero invented content (R-010):** every row comes from CEFR-J v1.5 or Octanove
 *    v1.0, both licensed and both already in `data/`. `source` says which.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const CSV = process.env.AMIRNET_VOCAB_CSV || join('data', 'generated', 'amirnet-vocab.csv');

/**
 * F-048ⓑ · the committed seed is the DEFAULT target, ⛔ never the only one. A test that
 * runs this generator must ⛔ not overwrite a git-managed file — given a target of its own
 * the suite COMPARES instead of clobbering, which turns silent staleness into a failing
 * assertion. ⛔ Read nowhere but here; the emitted SQL is identical either way.
 */
const OUT_DIR = process.env.SEED_OUT_DIR || join('supabase', 'seed');
const OUT = join(OUT_DIR, '0007_amirnet_vocab.sql');

/** `41 § 6` step 5 — four tiers, ⛔ not six (D-232). The table pairs them; so do we. */
const TIER_NAME = { 1: 'ליבה', 2: 'ליבה מורחבת', 3: 'הרחבה אקדמית', 4: 'רמת פטור' };
const AMIRNET_LEVEL = { 1: '1-2', 2: '2-3', 3: '3', 4: '4' };
const CEFR_BANDS = new Set(['A2', 'B1', 'B2', 'C1']);
const SOURCES = new Set(['CEFR-J v1.5', 'Octanove v1.0']);

/** A SQL string literal. Doubling the quote is the whole of the escaping. */
const q = (value) => `'${String(value).replaceAll("'", "''")}'`;
const bool = (value) => (value ? 'true' : 'false');

/** RFC4180 enough for this file — the same rules `scripts/build-amirnet-vocab.mjs` uses. */
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

/**
 * Every gate `0026_amirnet_vocab.sql` states, checked BEFORE the row becomes a statement.
 * ⛔ Throws by name — a row the table would refuse is a defect in the derivation, and the
 * derivation's name is what a reader needs, ⛔ not a Postgres constraint violation.
 */
function refuseUnwritable(row, where) {
  const at = `${where} "${row.headword}"`;
  if (typeof row.headword !== 'string' || row.headword.length === 0 || row.headword !== row.headword.trim()) {
    throw new Error(`${at} — a blank or padded headword is ⛔ not a headword (amirnet_vocab_headword_check)`);
  }
  if (!CEFR_BANDS.has(row.cefr)) {
    // `41 § 6` steps 3-4 dropped A1 and C2 upstream. One arriving here means the
    // derivation changed, ⛔ not that this emitter should widen.
    throw new Error(`${at} — band ${row.cefr} is unwritable: A1 and C2 were dropped by 41 § 6 steps 3-4 (amirnet_vocab_cefr_check)`);
  }
  if (TIER_NAME[row.tier] === undefined) {
    throw new Error(`${at} — tier ${row.tier} is outside 1..4 (amirnet_vocab_tier_check)`);
  }
  if (row.tier_name !== TIER_NAME[row.tier]) {
    throw new Error(`${at} — tier ${row.tier} is named "${TIER_NAME[row.tier]}", ⛔ not "${row.tier_name}" (amirnet_vocab_tier_name_pairing)`);
  }
  if (row.amirnet_level !== AMIRNET_LEVEL[row.tier]) {
    throw new Error(`${at} — tier ${row.tier} maps to level ${AMIRNET_LEVEL[row.tier]}, ⛔ not ${row.amirnet_level} (amirnet_vocab_level_check)`);
  }
  if (!SOURCES.has(row.source)) {
    throw new Error(`${at} — "${row.source}" is ⛔ not one of the two licensed profiles (amirnet_vocab_source_check · R-013)`);
  }
}

/**
 * The pure half: rows in, one SQL file's text out. ⛔ No file system, ⛔ no clock, ⛔ no
 * randomness ⇒ the same rows always produce the same bytes, which is what lets the test
 * compare a fresh build to the committed seed.
 */
export function toVocabSql(rows) {
  rows.forEach((row, i) => refuseUnwritable(row, `row ${i + 1}`));

  const byTier = [1, 2, 3, 4].map((tier) => ({
    tier,
    name: TIER_NAME[tier],
    count: rows.filter((r) => r.tier === tier).length,
  }));

  const lines = [
    '-- supabase/seed/0007_amirnet_vocab.sql',
    '-- ⛔ GENERATED by scripts/build-amirnet-vocab-sql.mjs — do not edit by hand.',
    '--    Regenerate with `npm run build:amirnet-vocab-sql`. Apply after 0026_amirnet_vocab.sql.',
    '--',
    `-- ${rows.length} rows · ${byTier.map((t) => `tier ${t.tier} ${t.name} ${t.count}`).join(' · ')}`,
    '--',
    '-- Derived by scripts/build-amirnet-vocab.mjs (T-222) from CEFR-J v1.5 and Octanove v1.0,',
    '-- both licensed and both in data/. ⛔ Zero authored content (R-010).',
    '-- `41 § 6` steps 3-4 dropped A1 and C2 upstream; amirnet_vocab_cefr_check makes that',
    '-- permanent. Four tiers, ⛔ not six (D-232).',
    '--',
    '-- ⛔ NOT the learner\'s vocabulary state (R-020 · 37 § 13.1) — this is the exam\'s RANGE.',
    '-- Re-runnable: `on conflict (headword) do nothing`, so a second load changes nothing.',
    '',
    'begin;',
    '',
    'insert into public.amirnet_vocab',
    '  (headword, pos, cefr_level, tier, tier_name, amirnet_level, is_connector, source)',
  ];

  if (rows.length > 0) {
    lines.push('values');
    lines.push(
      rows
        .map(
          (r) =>
            `    (${q(r.headword)}, ${q(r.pos)}, ${q(r.cefr)}, ${r.tier}, ${q(r.tier_name)}, ` +
            `${q(r.amirnet_level)}, ${bool(r.is_connector)}, ${q(r.source)})`,
        )
        .join(',\n'),
    );
  } else {
    // ⛔ An empty input is a legitimate state — and `values` with ⛔ no tuple is ⛔ not
    // valid SQL. `select … where false` inserts nothing and still PARSES, so an empty
    // seed stays a file Postgres accepts rather than one it rejects at load time.
    lines.push('select null::text, null::text, null::text, null::smallint,');
    lines.push('       null::text, null::text, null::boolean, null::text');
    lines.push('where false');
  }

  lines.push('on conflict (headword) do nothing;');
  lines.push('');
  lines.push('commit;');
  lines.push('');

  return lines.join('\n');
}

/** The CSV as the table's columns. ⛔ Nothing is derived here — only read. */
export function parseVocabCsv(text) {
  const rows = [];
  let header = null;
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const cols = splitCsvLine(line);
    if (header === null) {
      header = cols.map((c) => c.trim());
      continue;
    }
    const cell = (name) => (cols[header.indexOf(name)] ?? '').trim();
    rows.push({
      headword: cell('headword'),
      pos: cell('pos'),
      cefr: cell('cefr'),
      tier: Number(cell('tier')),
      tier_name: cell('tier_name'),
      amirnet_level: cell('amirnet_level'),
      // ⛔ The CSV writes an EMPTY cell for false, ⛔ not the string "false" — a naive
      // Boolean(cell) would be right by accident and wrong the day the column changes.
      is_connector: cell('is_connector') === 'true',
      source: cell('source'),
    });
  }
  return rows;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const rows = parseVocabCsv(readFileSync(CSV, 'utf8'));
  const sql = toVocabSql(rows);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT, sql, 'utf8');

  const connectors = rows.filter((r) => r.is_connector).length;
  console.log(`${rows.length} rows read from ${CSV}`);
  for (const tier of [1, 2, 3, 4]) {
    const n = rows.filter((r) => r.tier === tier).length;
    console.log(`  tier ${tier} ${TIER_NAME[tier]} — ${n}`);
  }
  console.log(`${connectors} connectors (derived from pos, ⛔ never copied — T-222)`);
  console.log(`wrote ${OUT}`);
}
