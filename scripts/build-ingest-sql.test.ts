import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { spotCheckPlan } from '@/lib/core/spotCheck';

const SQL = 'supabase/seed/0001_content_batches.sql';
const DATA = join('data', 'generated');

/**
 * F-048ⓑ · this suite used to run the generator with no output redirection, so every
 * `npm test` — by ANY agent — rewrote the git-managed seed in place. Two harms, both
 * measured 2026-08-15: a pure verification run left the working tree dirty, and
 * because the generator repairs the file on every run, a seed that had fallen behind
 * `data/generated/` produced NO failing test — the gap closed itself silently and
 * could ride into an unrelated commit through `git add -A`. That is exactly how the
 * 66 senses of C-0136 sat outside every `insert` for a full cycle (F-048ⓐ).
 *
 * The generator now writes wherever SEED_OUT_DIR points. This suite points it at a
 * throwaway directory, asserts everything against THAT output, and then asserts the
 * committed file is byte-identical to it. Staleness is a red test from here on.
 */
const OUT_DIR = mkdtempSync(join(tmpdir(), 'seed-ingest-'));
const FRESH = join(OUT_DIR, '0001_content_batches.sql');
const run = (): string =>
  execFileSync('node', ['scripts/build-ingest-sql.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, SEED_OUT_DIR: OUT_DIR },
  });

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

/**
 * F-062ⓑ · `manifest.json` is a MUTABLE "latest batch" pointer: every CONTENT tick
 * overwrites it. Until 2026-08-16 it was also the only manifest that declared
 * `batch-2026-08-13.jsonl`, so C-0164 destroyed that batch's provenance by doing
 * nothing worse than writing its own. The generator then threw at import time and
 * took the whole suite with it — `Test Files 1 failed / Tests no tests`, the exact
 * unnamed-failure mode the F-048ⓑ note above was written about.
 *
 * The claim: every batch file is declared by a manifest of its OWN name, so no
 * batch's provenance depends on a pointer another agent is expected to overwrite.
 * ⛔ `manifest.json` is deliberately NOT accepted as coverage here.
 */
const UNDECLARED = SOURCE.filter((batchFile) => {
  const dated = batchFile.replace(/^batch-(.*)\.jsonl$/, 'manifest-$1.json');
  if (!existsSync(join(DATA, dated))) return true;
  const parsed = JSON.parse(readFileSync(join(DATA, dated), 'utf8')) as { batch_file?: string };
  return parsed.batch_file !== batchFile;
});

describe('build-ingest-sql', () => {
  // ⛔ NOT a bare `run()`: a generator that throws at collect time kills every named
  // assertion below with it (F-062ⓑ, measured). The throw is captured and asserted on
  // by name instead, so the suite reports WHICH input is missing rather than dying.
  let out = '';
  let crash: Error | null = null;
  try {
    out = run();
  } catch (error) {
    crash = error as Error;
  }
  // ⛔ NOT a bare readFileSync: if the generator ignored SEED_OUT_DIR the file is absent,
  // and an ENOENT at collect time kills the whole suite before the named assertion below
  // ever runs — a guard that cannot fire by name is a guard nobody reads. Measured under
  // mutation 2026-08-15: bare read ⇒ "Test Files 1 failed / Tests no tests".
  const sql = existsSync(FRESH) ? readFileSync(FRESH, 'utf8') : '';

  it('runs to completion — a missing input is a named failure, not a dead suite (F-062ⓑ)', () => {
    expect(crash?.message ?? null, 'scripts/build-ingest-sql.mjs threw').toBe(null);
  });

  it('gives every batch file a manifest of its own name — `manifest.json` is overwritten every content tick (F-062ⓑ)', () => {
    expect(
      UNDECLARED,
      'these batch files have no manifest-<date>.json declaring them; their model/prompt_version survive only in the mutable manifest.json',
    ).toEqual([]);
  });

  it('writes only where SEED_OUT_DIR points — `npm test` never dirties the repo (F-048ⓑ)', () => {
    // If the override were dropped, the generator would emit into supabase/seed/ and
    // this path would not exist. That is the whole mutation, and this is what kills it.
    expect(existsSync(FRESH), `${FRESH} — generator ignored SEED_OUT_DIR`).toBe(true);
  });

  it('keeps the committed seed in step with data/generated — a stale seed is content no learner ever sees (F-048ⓐ)', () => {
    // ⛔ NOT a re-run of the generator into the repo. The committed file is read as a
    // BYTE ARRAY and compared to the fresh output; the two disagree exactly when a
    // batch shipped without its seed. Measured 2026-08-15: batch-2026-08-15.jsonl was
    // committed at 0b3ebb4 and left this file 157 lines behind.
    expect(
      readFileSync(SQL).equals(readFileSync(FRESH)),
      `${SQL} is behind data/generated — run \`npm run build:ingest\` and commit it in the same commit as the batch`,
    ).toBe(true);
  });

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
    const first = readFileSync(FRESH);
    run();
    expect(readFileSync(FRESH).equals(first)).toBe(true);
  });

  it('emits batches in sorted filename order, not in readdir order', () => {
    // Byte-identity across two runs does NOT catch this: a stable-but-wrong order is
    // still stable. The order is what makes a diff of this file readable.
    // F-192 / D-196 ⓐ: the filename pattern here is SOURCE's own (`batch-.*\.jsonl`), not
    // digits-only — the generator accepts any suffix (`batch-2026-09-07-connectors.jsonl`),
    // and a test that assumes less than the generator silently under-counts.
    const emitted = [...sql.matchAll(/^-- (batch-.*\.jsonl) —/gm)].map((m) => m[1]);
    expect(emitted).toEqual(SOURCE);
    expect(emitted).toEqual([...emitted].sort());
  });
});

describe('supabase/seed/0003_scoring_material.sql', () => {
  const FRESH_SCORING = join(OUT_DIR, '0003_scoring_material.sql');
  const COMMITTED_SCORING = 'supabase/seed/0003_scoring_material.sql';
  const fresh = (): string => {
    run();
    return readFileSync(FRESH_SCORING, 'utf8');
  };

  it('inserts into all three scoring tables', () => {
    const sql = fresh();
    expect(sql).toContain('insert into public.sense_examples');
    expect(sql).toContain('insert into public.sense_items');
    expect(sql).toContain('insert into public.sense_distractors');
  });

  it('D-141: the sense_items insert names level and level_rationale', () => {
    const sql = fresh();
    expect(sql).toContain('insert into public.sense_items (sense_id, stem, item_index, level, level_rationale)');
  });

  it('emits exactly two examples per PASSING sense — D-022, measured against 0001, ⛔ not a literal', () => {
    const sql = fresh();
    // 0001 states "N of M rows pass the gate" per batch. Summing N is the passing count,
    // measured from the sibling output — ⛔ never restated here, where a content tick
    // would redden it for growing.
    const passing = [...readFileSync(FRESH, 'utf8').matchAll(/— (\d+) of \d+ rows pass the gate/g)]
      .reduce((total, m) => total + Number(m[1]), 0);
    expect(passing).toBeGreaterThanOrEqual(ROWS_FLOOR);
    expect(Number(/(\d+) examples/.exec(sql)?.[1] ?? -1)).toBe(passing * 2);
  });

  it('joins on (headword, pos, sense_index) and ⛔ invents no id', () => {
    const sql = fresh();
    expect(sql).toContain('join public.senses s on s.word_id = w.id and s.sense_index = i.sense_index');
    expect(sql).not.toContain('gen_random_uuid()');
  });

  it('is re-runnable — every insert names its unique key in an on-conflict clause', () => {
    const sql = fresh();
    expect(sql).toContain('on conflict (sense_id, kind) do nothing;');
    expect(sql).toContain('on conflict (sense_id, item_index) do nothing;');
    expect(sql).toContain('on conflict (sense_id, distractor) do nothing;');
  });

  it('leaves the committed seed identical to a fresh run — staleness is red (F-048ⓑ)', () => {
    expect(readFileSync(COMMITTED_SCORING, 'utf8')).toBe(fresh());
  });
});

/**
 * T-120ⓒ · the ingest pipeline stops writing the retiring column.
 *
 * ⚠️ The plan for this task listed a FOURTH assertion here — the byte-for-byte
 * identity of the committed seed against a fresh run. It is ⛔ NOT repeated below,
 * because it already exists by name at line 113 of this file ("keeps the committed
 * seed in step with data/generated"), and a second copy of a live gate is a gate
 * nobody maintains (F-064). Measured: reverting the seed reddens the existing one.
 */
describe('T-120ⓒ — הקליטה כותבת lexical_class ⛔ ולא את העמודה הפורשת', () => {
  it('⛔ is_function_word ⛔ אינו מופיע ב-SQL שנוצר', () => {
    expect(readFileSync(FRESH, 'utf8')).not.toContain('is_function_word');
  });

  it('העמודה החדשה נכנסת ל-insert של words', () => {
    expect(readFileSync(FRESH, 'utf8')).toMatch(
      /insert into public\.words \([^)]*lexical_class[^)]*\)/,
    );
  });

  it("הבוליאני מתורגם לשתי המחרוזות בלבד — ⛔ ולא ל-true/false", () => {
    const generated = readFileSync(FRESH, 'utf8');
    const values = [...generated.matchAll(/'(function|content)'/g)].map((m) => m[1]);
    expect(values.length).toBeGreaterThan(0);
    expect([...new Set(values)].sort()).toEqual(expect.arrayContaining(['content']));
  });
});
