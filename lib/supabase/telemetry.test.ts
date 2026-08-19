import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DATA_SOURCES } from '../core/dataSources';

/**
 * Guards T-015 where it can be guarded without a live project: the migration.
 * Same approach and same limits as lib/supabase/rls.test.ts — this proves what
 * we ship, not what was applied. Applying it is a step in docs/SETUP.md.
 */
const MIGRATION = readFileSync('supabase/migrations/0003b_provenance_telemetry.sql', 'utf8');
const SQL = MIGRATION.toLowerCase();

describe('provenance columns', () => {
  it('puts track_id, source_id and origin on both content tables', () => {
    for (const table of ['words', 'senses']) {
      for (const column of ['track_id', 'source_id', 'origin']) {
        expect(SQL, `${table}.${column} is missing`).toMatch(
          new RegExp(`alter table public\\.${table}[\\s\\S]{0,120}${column}`),
        );
      }
    }
  });

  it('defaults track_id to amiram, exactly as profiles does', () => {
    // 0001_profiles.sql already writes `track_id text not null default 'amiram'`.
    // Two different defaults for the same key is a join that silently returns
    // nothing, and it would not surface until the first multi-track query.
    const defaults = MIGRATION.match(/track_id[\s\S]{0,60}default\s+'([a-z]+)'/gi) ?? [];
    expect(defaults.length).toBeGreaterThanOrEqual(2);
    for (const d of defaults) expect(d).toMatch(/'amiram'/);
  });

  it('constrains origin to the three documented values', () => {
    expect(SQL).toContain("origin in ('seed','ngsl','generated')");
  });

  it('makes source_id a real foreign key, not free text', () => {
    expect(SQL).toMatch(/source_id\s+text\s+references\s+public\.data_sources\s*\(\s*id\s*\)/);
  });
});

describe('the data_sources table mirrors the code registry exactly', () => {
  // The registry is the source of truth; the table exists so a row can point at
  // one. If they drift, `source_id = 'ngsl'` in the DB and `'ngsl'` in the code
  // stop meaning the same thing — and nothing would ever tell us.
  //
  // Deviation from the plan, on purpose: the plan scanned the WHOLE file with
  // /\(\s*'([a-z0-9-]+)'\s*,\s*'/g, which also matches the origin check
  // constraint `('seed','ngsl','generated')` and reports a phantom source
  // called "seed". Scoping the scan to the insert statement is what the test
  // actually means, and it keeps the check-constraint text free to change.
  const INSERT_BLOCK = MIGRATION.match(/insert into public\.data_sources[\s\S]*?;/i)?.[0] ?? '';
  const seeded = [...INSERT_BLOCK.matchAll(/\(\s*'([a-z0-9-]+)'\s*,\s*'/g)].map((m) => m[1]);

  it('has an insert statement at all — an empty scan must not pass vacuously', () => {
    expect(INSERT_BLOCK).not.toBe('');
    expect(seeded.length).toBe(DATA_SOURCES.length);
  });

  it('seeds a row for every id, and no extra ids', () => {
    const inCode = DATA_SOURCES.map((s) => s.id).sort();
    expect([...new Set(seeded)].sort()).toEqual(inCode);
  });
});

describe('word_progress — D-010 telemetry', () => {
  it('carries both D-010 fields under their exact names', () => {
    expect(SQL).toContain('time_to_first_correct');
    expect(SQL).toContain('attempts_to_mastery');
  });

  it('is one aggregate row per (user, word), not a row per review event (W4)', () => {
    // The whole point of the shape. A `create table … reviews (id uuid primary
    // key …)` growing per answer is the free-tier risk W4 names by number.
    expect(SQL).toMatch(/primary key\s*\(\s*user_id\s*,\s*word_id\s*\)/);
    expect(SQL, 'no per-event table may be introduced here').not.toMatch(
      /create table[\s\S]{0,80}(review_events|answer_events|attempts_log)/,
    );
  });

  it('leaves both D-010 fields nullable — unknown is not zero', () => {
    // Line-scoped on purpose: `[^,]*` alone spans statements (an ALTER carries no
    // comma), so the streak column's legitimate NOT NULL two statements below was
    // read as a NOT NULL on time_to_first_correct. The claim is about the column
    // DECLARATION, and a declaration lives on one line.
    expect(SQL).not.toMatch(/time_to_first_correct[^,\n]*not null/);
    expect(SQL).not.toMatch(/attempts_to_mastery[^,\n]*not null/);
  });

  it('enables row level security', () => {
    expect(SQL).toMatch(/alter\s+table\s+public\.word_progress\s+enable\s+row\s+level\s+security/);
  });

  it('scopes every word_progress policy to the row owner', () => {
    const policies = MIGRATION.match(/create policy[\s\S]*?;/gi) ?? [];
    const onProgress = policies.filter((p) => /word_progress/i.test(p));
    expect(onProgress.length).toBeGreaterThanOrEqual(3);
    for (const policy of onProgress) {
      expect(policy).toMatch(/auth\.uid\(\)\s*=\s*user_id/i);
    }
  });

  it('never opens word_progress to everyone', () => {
    expect(SQL).not.toMatch(/using\s*\(\s*true\s*\)/);
    expect(SQL).not.toMatch(/\bto\s+(public|anon)\b/);
  });

  it('covers select, insert and update', () => {
    for (const verb of ['select', 'insert', 'update']) {
      expect(SQL).toContain(`for ${verb}`);
    }
  });
});

/**
 * F-022 / F-023 — the TS↔SQL contract of lib/core/progress.ts.
 * These are schema-shape guards, not behaviour guards: the loop has no live
 * project (TD-4/TD-8), so what we can prove is what we ship.
 */
describe('word_progress matches the WordProgress type it persists', () => {
  it('F-022: time_to_first_correct is bigint — ms overflows int4 after ~25 days', () => {
    // int4 max is 2,147,483,647 ms ≈ 24.85 days. An SRS whose intervals reach
    // weeks WILL produce a larger value, and the upsert would fail whole-row.
    expect(SQL).toMatch(/time_to_first_correct\s+bigint/);
    expect(SQL, 'no int4 declaration may survive').not.toMatch(
      /time_to_first_correct\s+int\b(?!\w)/,
    );
  });

  it('F-022: the widening is re-runnable on a project that already ran 0003', () => {
    // `create table if not exists` is a no-op on an existing table, so the type
    // change has to be its own statement or the fix never reaches that project.
    expect(SQL).toMatch(
      /alter\s+table\s+public\.word_progress\s+alter\s+column\s+time_to_first_correct\s+type\s+bigint/,
    );
  });

  it('F-023: consecutive_correct_recognition has a column — it is not derivable', () => {
    // attempts/correct_attempts cannot reconstruct a streak. Without this column
    // the streak resets to 0 on every reload and directionFor() sends a mastered
    // word back to recognition.
    expect(SQL).toContain('consecutive_correct_recognition');
    expect(SQL).toMatch(
      /add\s+column\s+if\s+not\s+exists\s+consecutive_correct_recognition\s+int\s+not\s+null\s+default\s+0/,
    );
  });

  it('F-023: the streak column is NOT NULL — 0 is a real streak, not unknown', () => {
    // The opposite of the two D-010 fields above, and deliberately so: a learner
    // who never answered correctly has a streak of exactly zero.
    expect(SQL).not.toMatch(/consecutive_correct_recognition[^;]*\bdefault\s+null/);
  });
});
