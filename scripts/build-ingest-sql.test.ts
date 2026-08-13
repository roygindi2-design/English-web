import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { spotCheckPlan } from '@/lib/core/spotCheck';

const SQL = 'supabase/seed/0001_content_batches.sql';
const DATA = join('data', 'generated');

/**
 * The counts are MEASURED from the batch files, ⛔ not restated as literals.
 *
 * C-0079: they used to be literals (343 rows · 6 files · 1 low), and the CONTENT
 * tick of C-0078 added `batch-2026-08-13.jsonl` — 60 senses that this script
 * ingests correctly and that reddened five tests here, on a run where nothing in
 * the pipeline had changed. A guard that fails whenever the *input* legitimately
 * grows is a guard that gets edited every content tick, and one that gets edited
 * routinely stops being read.
 *
 * The claim worth making is "every row in every batch file lands, none is
 * silently dropped" — which is an equality against the source, and is STRICTER
 * than a literal. The literal below is kept only as a FLOOR: content ticks only
 * ever add, so a number under it means a batch file disappeared.
 */
const SOURCE = readdirSync(DATA)
  .filter((f) => /^batch-.*\.jsonl$/.test(f))
  .sort();
const RECORDS = SOURCE.flatMap((f) =>
  readFileSync(join(DATA, f), 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as { translation_confidence?: string }),
);
const SOURCE_LOW = RECORDS.filter((r) => r.translation_confidence === 'low').length;
/** Measured 2026-08-13 (C-0079). A drop below either is a regression. */
const ROWS_FLOOR = 403;
const FILES_FLOOR = 7;

describe('build-ingest-sql', () => {
  const out = execFileSync('node', ['scripts/build-ingest-sql.mjs'], { encoding: 'utf8' });
  const sql = readFileSync(SQL, 'utf8');

  it('lands every row of every batch file — a drop is a regression, not a detail', () => {
    expect(RECORDS.length).toBeGreaterThanOrEqual(ROWS_FLOOR);
    expect(SOURCE.length).toBeGreaterThanOrEqual(FILES_FLOOR);
    expect(out).toMatch(
      new RegExp(`^${RECORDS.length} rows read from ${SOURCE.length} batch files$`, 'm'),
    );
    expect(out).toMatch(/0 rejected by the gate/);
  });

  it('opens and closes exactly one transaction', () => {
    expect(sql.match(/^begin;$/gm)).toHaveLength(1);
    expect(sql.match(/^commit;$/gm)).toHaveLength(1);
  });

  it('marks exactly the low-confidence senses for human review (D-024)', () => {
    // needs_human_review is the LAST column of every values tuple, so a marked row is
    // exactly a row whose tuple closes with `true`.
    const marked = sql.split('\n').filter((line) => /, true\),?$/.test(line));
    // ⛔ NOT `line.includes("'low'")`. C-0078 shipped the headword **low**, whose tuple
    // opens `('low', 'adjective', …` with confidence `'high'` — the old heuristic
    // counted it as a low-confidence sense and the row count disagreed with the marks.
    // The confidence column is the one preceded by `, `; a headword never is.
    const low = sql.split('\n').filter((line) => line.includes(", 'low', "));
    expect(low).toHaveLength(SOURCE_LOW);
    expect(marked).toHaveLength(SOURCE_LOW);
    // …and they are the same rows: the flag follows confidence, not spot_check (every
    // row is spot-checked, so a copy of spot_check would mark all of them).
    expect(marked).toEqual(low);
  });

  it('writes one generation_runs row per batch file, with the manifest model', () => {
    expect(sql.match(/insert into public\.generation_runs/g)).toHaveLength(SOURCE.length);
    expect(sql).toContain("'claude-opus-5'");
  });

  it('escapes a Hebrew apostrophe instead of breaking the statement', () => {
    // A regex counting quotes cannot do this: 18 of the Hebrew interference notes are
    // themselves quoted ('כסף'), so their literal opens with ''' and any lookaround
    // heuristic miscounts. Scan instead, the way the server does. No literal in the
    // emitted file spans a line, so every line must close every literal it opens.
    const unbalanced = sql.split('\n').filter((line) => {
      let inLiteral = false;
      for (let i = 0; i < line.length; i += 1) {
        if (line[i] !== "'") continue;
        if (inLiteral && line[i + 1] === "'") {
          i += 1; // an escaped quote inside the literal
          continue;
        }
        inLiteral = !inLiteral;
      }
      return inLiteral;
    });
    expect(unbalanced).toEqual([]);
    // And the escaping is doing real work: those notes are in there, doubled.
    expect(sql).toContain("'''כסף''");
  });

  it('never emits scoring material in this task', () => {
    expect(sql).not.toMatch(/insert into public\.sense_items/);
    expect(sql).not.toMatch(/insert into public\.sense_distractors/);
    expect(sql).not.toMatch(/insert into public\.sense_examples/);
  });

  it('reports the spot-check plan it used', () => {
    // The plan is asserted against lib/core/spotCheck at the measured lot size, ⛔ not
    // against a literal: a literal here says nothing about whether the script used the
    // pure planner or invented its own sampling.
    const plan = spotCheckPlan(RECORDS.length);
    expect(out).toMatch(
      new RegExp(
        `lot ${plan.lotSize} · inspect ${plan.inspect} · accept up to ${plan.acceptUpTo}`,
      ),
    );
    expect(sql).toContain(`-- lot ${plan.lotSize} · inspect ${plan.inspect} · accept up to ${plan.acceptUpTo}`);
  });

  it('is deterministic — a second run produces a byte-identical file', () => {
    const first = readFileSync(SQL);
    execFileSync('node', ['scripts/build-ingest-sql.mjs']);
    expect(readFileSync(SQL).equals(first)).toBe(true);
  });

  it('emits batches in sorted filename order, not in readdir order', () => {
    // Byte-identity across two runs does NOT catch this: a stable-but-wrong order is
    // still stable. The order is what makes a diff of this file readable.
    const emitted = [...sql.matchAll(/^-- (batch-[\d-]+\.jsonl) —/gm)].map((m) => m[1]);
    expect(emitted).toEqual(SOURCE);
    expect(emitted).toEqual([...emitted].sort());
  });
});
