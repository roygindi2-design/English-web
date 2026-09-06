#!/usr/bin/env node
/**
 * Builds supabase/seed/0001_content_batches.sql from data/generated/batch-*.jsonl (T-042).
 *
 * This is the ONLY impure layer of the ingest: it reads files and writes one. Parsing
 * (lib/core/batchRecord.ts), the AQL plan (lib/core/spotCheck.ts) and the gate
 * (lib/core/contentSchema.ts) are pure and unit tested.
 *
 * ⛔ R-014: EVERY row runs through gateSense() here, a second time, even though the
 *    Content agent already gated it. A row the gate rejects is reported and DROPPED —
 *    never repaired. Repairing content inside an ingest is a Content-agent tick.
 *
 * ⛔ TD-24: the output is a SQL file, not a network write. There is no live Supabase in
 *    the loop environment (T-019), so a service-role writer could not be run or tested
 *    and would be a second untested application path alongside supabase/migrations/,
 *    which Roy applies by hand. The day credentials exist, only the emitter changes.
 *
 * TWO files, not one. 0001 carries words + senses; 0003 carries the scoring material
 *    — sense_examples / sense_items / sense_distractors — which this script withheld
 *    from T-042 (C-0060) until T-072 (C-0146). The two recorded reasons are both
 *    answered: the gate that vetted these sentences was fixed in C-0012 (F-020) and
 *    re-run over every row (docs/gate-recheck.md — 469 read, 0 rejected), and one
 *    stated read rule per content table landed in 0011 (F-051). ⛔ The old estimate
 *    «~2,400 further rows» was never measured; the emitted count is 4,221.
 *
 * TypeScript is imported directly, with no build step and no new dependency — the
 * registerHooks preamble is copied verbatim from scripts/measure-coverage.mjs.
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
const { spotCheckPlan, selectForSpotCheck } = await import('../lib/core/spotCheck.ts');
const { gateSense } = await import('../lib/core/contentSchema.ts');
const { scoringRowsFor, scoringCounts } = await import('../lib/core/scoringSeed.ts');

const DATA = join('data', 'generated');
/**
 * F-048ⓑ · the committed seed is the DEFAULT target, never the only one. A test that
 * runs this generator must not overwrite a git-managed file: every agent's `npm test`
 * was dirtying the working tree, and 157 lines of content SQL could ride into an
 * unrelated commit through `git add -A`. Given a target of its own the test COMPARES
 * instead of clobbering, which turns silent staleness into a failing assertion.
 * ⛔ Not read anywhere but here — the emitted SQL is identical either way.
 */
const OUT_DIR = process.env.SEED_OUT_DIR || join('supabase', 'seed');
const OUT = join(OUT_DIR, '0001_content_batches.sql');
const SCORING_OUT = join(OUT_DIR, '0003_scoring_material.sql');
const ALLOWED_WORDS_FILE = 'allowed-words-2026-08-07.txt';

/** A SQL string literal. Doubling the quote is the whole of the escaping. */
const q = (value) =>
  value === null || value === undefined ? 'null' : `'${String(value).replaceAll("'", "''")}'`;
const num = (value) => (value === null || value === undefined ? 'null' : String(value));
const bool = (value) => (value ? 'true' : 'false');

// --- 1. allowed words -------------------------------------------------------
const allowedWords = new Set(
  readFileSync(join(DATA, ALLOWED_WORDS_FILE), 'utf8')
    .split('\n')
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line !== '' && !line.startsWith('#')),
);

// --- 2. batches, in sorted filename order (readdir order is not stable) ------
const batchFiles = readdirSync(DATA)
  .filter((name) => /^batch-.*\.jsonl$/.test(name))
  .sort();

/** The manifest that declares this batch. 08-12's is named manifest.json. */
function manifestFor(batchFile) {
  const dated = batchFile.replace(/^batch-(.*)\.jsonl$/, 'manifest-$1.json');
  for (const name of [dated, 'manifest.json']) {
    try {
      const parsed = JSON.parse(readFileSync(join(DATA, name), 'utf8'));
      if (parsed.batch_file === batchFile) return parsed;
    } catch {
      // Try the next candidate name.
    }
  }
  // ⛔ model and prompt_version are provenance. An absent manifest is a stop, not a default.
  throw new Error(`no manifest declares batch_file "${batchFile}" — refusing to invent model/prompt_version`);
}

const batches = batchFiles.map((file) => ({
  file,
  manifest: manifestFor(file),
  records: parseBatchFile(readFileSync(join(DATA, file), 'utf8')),
  passing: [],
}));

const rowsRead = batches.reduce((n, b) => n + b.records.length, 0);

// --- 3. the gate, on every row, a second time (R-014) ------------------------
const rejected = [];
for (const batch of batches) {
  batch.records.forEach((record, i) => {
    const result = gateSense(record.sense, { allowedWords });
    if (result.ok) batch.passing.push(record);
    else {
      rejected.push({
        file: batch.file,
        line: i + 1,
        headword: record.sense.headword,
        reasons: result.reasons,
      });
    }
  });
}

const passing = batches.flatMap((b) => b.passing);

// --- 4. one spot-check plan over the whole lot -------------------------------
// The plan is reported and written into the SQL header. It is NOT a column: `senses`
// has none, and inventing one to hold it would be schema work this task does not own.
const plan = spotCheckPlan(passing.length);
const inspected = selectForSpotCheck(passing, plan);

// --- 5. emit ----------------------------------------------------------------
const lines = [
  '-- supabase/seed/0001_content_batches.sql',
  '-- ⛔ GENERATED by scripts/build-ingest-sql.mjs — do not edit by hand.',
  '--    Regenerate with `npm run build:ingest`. Apply exactly like a migration.',
  '--',
  `-- lot ${plan.lotSize} · inspect ${plan.inspect} · accept up to ${plan.acceptUpTo} · basis: ${plan.basis}`,
  `-- ${plan.rationale}`,
  '--',
  '-- Every row below was re-gated by lib/core/contentSchema.ts (R-014) before emission.',
  '-- Scoring material (sense_examples / sense_items / sense_distractors) is NOT written here.',
  '-- Re-runnable: words upsert on (headword, pos); senses do nothing on (word_id, sense_index).',
  '',
  'begin;',
];

for (const batch of batches) {
  const m = batch.manifest;
  const rejectedHere = batch.records.length - batch.passing.length;
  lines.push('');
  lines.push(`-- ${'-'.repeat(74)}`);
  lines.push(`-- ${batch.file} — ${batch.passing.length} of ${batch.records.length} rows pass the gate`);
  lines.push(`-- ${'-'.repeat(74)}`);
  lines.push('with run as (');
  lines.push('  insert into public.generation_runs (model, prompt_version, requested, accepted, rejected, notes)');
  lines.push(
    `  values (${q(m.model)}, ${q(m.prompt_version)}, ${num(m.requested ?? m.requested_headwords)}, ` +
      `${num(batch.passing.length)}, ${num(rejectedHere)}, ${q(batch.file)})`,
  );
  lines.push('  returning id');
  lines.push('), incoming (headword, pos, n_letters, n_syllables, lexical_class, sense_index,');
  lines.push('            definition_en, translation_he, cefr_level, translation_confidence,');
  lines.push('            he_interference_note, he_one_to_many_group, needs_human_review) as (');
  lines.push('  values');
  lines.push(
    batch.passing
      .map((r) => {
        const s = r.sense;
        return (
          `    (${q(s.headword)}, ${q(s.pos)}, ${num(r.nLetters)}, ${num(r.nSyllables)}, ` +
          // ⛔ NOT a default: `batchRecord.ts:170` makes `is_function_word` a REQUIRED
          // field of the jsonl record, so 'content' here is the content agent's explicit
          // claim. The same literal would ⛔ NOT be legitimate in the backfill migration
          // over `origin <> 'generated'` rows, where nobody ever asserted it.
          `${q(r.isFunctionWord ? 'function' : 'content')}, ${num(r.senseIndex)}, ${q(s.definitionEn)}, ${q(s.translationHe)}, ` +
          `${q(r.cefrLevel)}, ${q(r.confidence)}, ${q(r.heInterferenceNote)}, ${q(r.heOneToManyGroup)}, ` +
          `${bool(r.needsHumanReview)})`
        );
      })
      .join(',\n'),
  );
  lines.push('), w as (');
  lines.push('  insert into public.words (headword, pos, origin, n_letters, n_syllables, lexical_class)');
  lines.push("  select distinct on (headword, pos) headword, pos, 'generated', n_letters, n_syllables, lexical_class");
  lines.push('  from incoming');
  lines.push('  order by headword, pos');
  lines.push('  on conflict (headword, pos) do update set headword = excluded.headword');
  lines.push('  returning id, headword, pos');
  lines.push(')');
  lines.push('insert into public.senses (word_id, sense_index, definition_en, translation_he, cefr_level,');
  lines.push('                           translation_confidence, he_interference_note, he_one_to_many_group,');
  lines.push('                           generation_run_id, needs_human_review)');
  lines.push('select w.id, i.sense_index, i.definition_en, i.translation_he, i.cefr_level,');
  lines.push('       i.translation_confidence, i.he_interference_note, i.he_one_to_many_group,');
  lines.push('       run.id, i.needs_human_review');
  lines.push('from incoming i');
  lines.push('join w on w.headword = i.headword and w.pos = i.pos');
  lines.push('cross join run');
  lines.push('on conflict (word_id, sense_index) do nothing;');
}

lines.push('');
lines.push('commit;');
lines.push('');

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, lines.join('\n'), 'utf8');

// --- 7. scoring material (D-035 second half) --------------------------------
// Withheld since T-042 for two recorded reasons, both now answered: the gate that
// vetted these sentences was fixed in C-0012 (F-020) and re-run in full (docs/gate-
// recheck.md), and 0011 left one stated read rule per table (F-051). ⛔ Only rows that
// PASSED the gate above reach here — `passing`, never `batch.records`.
const scoring = scoringRowsFor(passing);
const counts = scoringCounts(scoring);

const scoringLines = [
  '-- supabase/seed/0003_scoring_material.sql',
  '-- ⛔ GENERATED by scripts/build-ingest-sql.mjs — do not edit by hand.',
  '--    Regenerate with `npm run build:ingest`. Apply AFTER 0001_content_batches.sql.',
  '--',
  `-- ${counts.examples} examples · ${counts.items} item stems · ${counts.distractors} distractors`,
  '-- Every row belongs to a sense that passed lib/core/contentSchema.ts (R-014).',
  '-- Re-runnable: every insert is `on conflict do nothing` on the table unique key.',
  '--',
  '-- ⛔ near_synonym distractors are STORED and excluded when an item is served (D-023).',
  '-- ⛔ Scoring material on a low-confidence sense is withheld by RLS, not by omission',
  '--    (0003a_low_confidence_is_visible.sql). The row exists; the learner cannot read it.',
  '',
  'begin;',
  '',
];

/** (headword, pos, sense_index) is what `senses` is unique on — the join key, not an id. */
const identity = (row) => `${q(row.headword)}, ${q(row.pos)}, ${num(row.senseIndex)}`;

if (counts.examples > 0) {
  scoringLines.push('with incoming (headword, pos, sense_index, kind, text_en) as (');
  scoringLines.push('  values');
  scoringLines.push(
    scoring.examples.map((r) => `    (${identity(r)}, ${q(r.kind)}, ${q(r.textEn)})`).join(',\n'),
  );
  scoringLines.push(')');
  scoringLines.push('insert into public.sense_examples (sense_id, kind, text_en)');
  scoringLines.push('select s.id, i.kind, i.text_en');
  scoringLines.push('from incoming i');
  scoringLines.push('join public.words w on w.headword = i.headword and w.pos = i.pos');
  scoringLines.push('join public.senses s on s.word_id = w.id and s.sense_index = i.sense_index');
  scoringLines.push('on conflict (sense_id, kind) do nothing;');
  scoringLines.push('');
}

if (counts.items > 0) {
  scoringLines.push('with incoming (headword, pos, sense_index, item_index, stem, level, level_rationale) as (');
  scoringLines.push('  values');
  scoringLines.push(
    scoring.items
      .map((r) => `    (${identity(r)}, ${num(r.itemIndex)}, ${q(r.stem)}, ${num(r.level)}, ${q(r.levelRationale)})`)
      .join(',\n'),
  );
  scoringLines.push(')');
  scoringLines.push('insert into public.sense_items (sense_id, stem, item_index, level, level_rationale)');
  scoringLines.push('select s.id, i.stem, i.item_index, i.level, i.level_rationale');
  scoringLines.push('from incoming i');
  scoringLines.push('join public.words w on w.headword = i.headword and w.pos = i.pos');
  scoringLines.push('join public.senses s on s.word_id = w.id and s.sense_index = i.sense_index');
  scoringLines.push('on conflict (sense_id, item_index) do nothing;');
  scoringLines.push('');
}

if (counts.distractors > 0) {
  scoringLines.push('with incoming (headword, pos, sense_index, distractor, relation_type) as (');
  scoringLines.push('  values');
  scoringLines.push(
    scoring.distractors
      .map((r) => `    (${identity(r)}, ${q(r.distractor)}, ${q(r.relationType)})`)
      .join(',\n'),
  );
  scoringLines.push(')');
  scoringLines.push('insert into public.sense_distractors (sense_id, distractor, relation_type)');
  scoringLines.push('select s.id, i.distractor, i.relation_type');
  scoringLines.push('from incoming i');
  scoringLines.push('join public.words w on w.headword = i.headword and w.pos = i.pos');
  scoringLines.push('join public.senses s on s.word_id = w.id and s.sense_index = i.sense_index');
  scoringLines.push('on conflict (sense_id, distractor) do nothing;');
  scoringLines.push('');
}

scoringLines.push('commit;');
scoringLines.push('');

writeFileSync(SCORING_OUT, scoringLines.join('\n'), 'utf8');

// --- 6. report --------------------------------------------------------------
console.log(`${rowsRead} rows read from ${batchFiles.length} batch files`);
console.log(`${rejected.length} rejected by the gate`);
console.log(`lot ${plan.lotSize} · inspect ${plan.inspect} · accept up to ${plan.acceptUpTo} · basis ${plan.basis}`);
console.log(`${inspected.length} rows selected for human inspection`);
console.log(`wrote ${OUT}`);
console.log(
  `wrote ${SCORING_OUT} — ${counts.examples} examples · ${counts.items} items · ${counts.distractors} distractors`,
);

if (rejected.length > 0) {
  console.error('');
  console.error('⛔ rejected rows are EXCLUDED from the SQL and are NOT repaired here:');
  for (const r of rejected) {
    console.error(`   ${r.file}:${r.line} "${r.headword}" — ${r.reasons.join(' · ')}`);
  }
  process.exit(1);
}
