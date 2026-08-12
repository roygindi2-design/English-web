import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guards T-047/T-048 where they can be guarded without a live project: the
 * migration text we ship. Same limit as rls.test.ts — this proves what is in
 * the file, not what was applied to a given Supabase project. Applying it is a
 * manual step (plan/03-for-roy.md).
 */
const MIGRATION = readFileSync('supabase/migrations/0006_layer2_track_and_bank.sql', 'utf8');
/** Comments are stripped first: C-0032's lesson — a rule EXPLAINED in a comment
 *  satisfies a positive regex that is supposed to prove the rule is IMPLEMENTED. */
const SQL = MIGRATION.replace(/--[^\n]*/g, '').toLowerCase();

describe('0006 — T-047 track fields', () => {
  it('is wrapped in one transaction', () => {
    expect(SQL).toMatch(/\bbegin\s*;/);
    expect(SQL).toMatch(/\bcommit\s*;/);
  });

  it('puts exam_type and grade_level on all three content tables', () => {
    for (const table of ['words', 'senses', 'sense_items']) {
      for (const column of ['exam_type', 'grade_level']) {
        expect(SQL, `${table}.${column} is missing`).toMatch(
          new RegExp(`alter table public\\.${table}\\s+add column if not exists\\s+${column}\\b`),
        );
      }
    }
  });

  it('adds every new column as nullable — no existing row may be classified', () => {
    // T-047: "הכול נשאר NULL עד שיהיה מקור". A `not null default 'amiram'` here
    // would classify all 2,809 future NGSL rows as Amiram content by accident.
    const adds = SQL.match(/add column if not exists\s+(exam_type|grade_level)[^;]*/g) ?? [];
    expect(adds.length).toBe(6);
    for (const add of adds) expect(add).not.toMatch(/not null|default/);
  });

  it('constrains exam_type to the three names the vision states, and nothing more', () => {
    const checks = SQL.match(/check \(exam_type[^)]*\)[^)]*\)/g) ?? [];
    expect(checks.length).toBe(3);
    for (const c of checks) {
      expect(c).toContain("'amiram'");
      expect(c).toContain("'psychometric'");
      expect(c).toContain("'bagrut'");
      expect(c).toMatch(/exam_type is null or/); // NULL must stay legal
    }
  });

  it('does NOT constrain grade_level — a closed list there is the invented age range', () => {
    expect(SQL).not.toMatch(/check \(\s*grade_level/);
  });

  it('adds constraints under guarded names so re-applying is a no-op', () => {
    for (const name of [
      'words_exam_type_check',
      'senses_exam_type_check',
      'sense_items_exam_type_check',
    ]) {
      expect(SQL).toContain(`conname = '${name}'`);
      expect(SQL).toContain(`add constraint ${name}`);
    }
  });

  it('indexes exam_type partially, so it costs nothing while every row is null', () => {
    expect(SQL).toMatch(
      /create index if not exists words_exam_type_idx[\s\S]{0,80}where exam_type is not null/,
    );
  });
});

describe('0006 — T-048 assembly-bank fields', () => {
  it('puts is_active_this_week on the EXISTING aggregate row, not a new table', () => {
    expect(SQL).toMatch(
      /alter table public\.word_progress\s+add column if not exists\s+is_active_this_week\s+boolean/,
    );
    // W4: an events table on the free tier grows without a ceiling. If a future
    // edit ever creates one here, this test is the thing that says no.
    expect(SQL).not.toMatch(/create table[\s\S]{0,80}active_word/);
  });

  it('makes the weekly flag not-null — "not active" is a measurement, not an unknown', () => {
    expect(SQL).toMatch(/is_active_this_week\s+boolean\s+not null\s+default\s+false/);
  });

  it('adds lexical_class as NULLABLE — unknown is the honest state for every row', () => {
    expect(SQL).toMatch(
      /alter table public\.words\s+add column if not exists\s+lexical_class\s+text\s*;/,
    );
  });

  it('does not classify a single existing row', () => {
    // The whole point of T-048: columns land empty. An UPDATE here would be a
    // pedagogical claim with no source behind it.
    expect(SQL).not.toMatch(/update\s+public\.words/);
    expect(SQL).not.toMatch(/update\s+public\.word_progress/);
  });

  it('forbids lexical_class and is_function_word from contradicting each other', () => {
    // words.is_function_word (0002:53) already encodes half of this fact and
    // cannot say "unknown". Until PM decides which one survives, the database
    // refuses to hold both answers at once.
    expect(SQL).toContain('words_lexical_class_agrees');
    expect(SQL).toMatch(/is_function_word\s*=\s*\(\s*lexical_class\s*=\s*'function'\s*\)/);
  });

  it('keeps NULL legal under both lexical_class constraints', () => {
    const guards = SQL.match(/check \(lexical_class[^;]*/g) ?? [];
    expect(guards.length).toBe(2);
    for (const g of guards) expect(g).toMatch(/lexical_class is null or/);
  });
});
