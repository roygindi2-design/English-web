import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SQL = 'supabase/seed/0001_content_batches.sql';

describe('build-ingest-sql', () => {
  const out = execFileSync('node', ['scripts/build-ingest-sql.mjs'], { encoding: 'utf8' });
  const sql = readFileSync(SQL, 'utf8');

  it('lands all 343 measured rows — a drop is a regression, not a detail', () => {
    expect(out).toMatch(/343 rows read/);
    expect(out).toMatch(/0 rejected by the gate/);
  });

  it('opens and closes exactly one transaction', () => {
    expect(sql.match(/^begin;$/gm)).toHaveLength(1);
    expect(sql.match(/^commit;$/gm)).toHaveLength(1);
  });

  it('marks exactly the one low-confidence sense for human review (D-024)', () => {
    // needs_human_review is the LAST column of every values tuple, so a marked row is
    // exactly a row whose tuple closes with `true`.
    const marked = sql.split('\n').filter((line) => /, true\),?$/.test(line));
    const low = sql.split('\n').filter((line) => line.includes("'low'"));
    expect(low).toHaveLength(1);
    expect(marked).toHaveLength(1);
    // …and it is the same row: the flag follows confidence, not spot_check (all 343
    // of which are spot-checked, so a copy of spot_check would mark every row).
    expect(marked[0]).toBe(low[0]);
  });

  it('writes one generation_runs row per batch file, with the manifest model', () => {
    expect(sql.match(/insert into public\.generation_runs/g)).toHaveLength(6);
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
    expect(out).toMatch(/inspect 343 .* accept up to 2/);
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
    expect(emitted).toHaveLength(6);
    expect(emitted).toEqual([...emitted].sort());
  });
});
