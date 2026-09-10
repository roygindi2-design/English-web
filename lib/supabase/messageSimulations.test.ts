import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guards 0023 the only way it can be guarded without a live project: the shipped SQL
 * text, comments stripped (C-0032 lesson — a constraint commented out is a constraint
 * that does not exist). Same approach and same limits as worldSchema.test.ts.
 *
 * ⚠️ The plan (`2026-09-08-messages-inbox-slice.md`, Task 1) names this file `0022_`.
 * `0022_grammar_confidence.sql` landed on 2026-09-10 (4e0c6b7), after the plan was
 * written, and `scripts/migration-hygiene.test.ts` requires a unique ordering token —
 * so this migration is `0023_`. Nothing else about Task 1 changed.
 */
const MIGRATION = readFileSync('supabase/migrations/0023_message_simulations.sql', 'utf8');
const SQL = MIGRATION.replace(/--[^\n]*/g, '').toLowerCase();

describe('0023 — הודעות: the simulations and the learner state', () => {
  it('creates exactly the two tables the row names, and no others', () => {
    const created = [...SQL.matchAll(/create table if not exists public\.([a-z_]+)/g)].map((m) => m[1]);
    expect(created.sort()).toEqual(['message_simulation_state', 'message_simulations']);
  });

  it('⛔ zero foreign keys to the arena and zero to word_progress (D-054 · row ⓑ)', () => {
    for (const banned of ['word_progress', 'arcade_', 'public.words', 'senses', 'generation_runs']) {
      expect(SQL, `${banned} must not appear`).not.toContain(banned);
    }
  });

  it('origin is not null with a named check on generated only — the 0018 template', () => {
    expect(SQL).toMatch(/origin\s+text\s+not null/);
    expect(SQL).toMatch(/message_simulations_origin_check[\s\S]*?check \(origin = 'generated'\)/);
    expect(SQL).not.toMatch(/origin\s+text[^,]*default/);
  });

  it('four levels only (R-021), named', () => {
    expect(SQL).toMatch(/message_simulations_level_check[\s\S]*?\('a1', 'a2', 'b1', 'b2'\)/);
  });

  it('context is the closed four-value set, by name (row ⓐ)', () => {
    expect(SQL).toMatch(/message_simulations_context_check[\s\S]*?\('tourist', 'restaurant', 'teacher', 'hotel'\)/);
  });

  it('exactly three required words', () => {
    expect(SQL).toMatch(/required_words\s+text\[\]\s+not null/);
    expect(SQL).toMatch(/message_simulations_required_words_check[\s\S]*?array_length\(required_words, 1\) = 3/);
  });

  it('the client reads simulations only — select, never a write (row ⓒ)', () => {
    expect(SQL).toMatch(/alter table public\.message_simulations enable row level security/);
    expect(SQL).toMatch(/revoke all on public\.message_simulations from authenticated, anon/);
    expect(SQL).toMatch(/grant select on public\.message_simulations to authenticated/);
    expect(SQL).not.toMatch(/grant [^;]*(insert|update|delete)[^;]*on public\.message_simulations/);
  });

  it('the state row is the learner’s own, and only that (row ⓒ)', () => {
    expect(SQL).toMatch(/alter table public\.message_simulation_state enable row level security/);
    const policies = SQL.match(/create policy "message_simulation_state_[\s\S]*?;/g) ?? [];
    expect(policies.length).toBe(3);
    for (const p of policies) expect(p).toMatch(/auth\.uid\(\)\s*=\s*user_id/);
    expect(SQL).toMatch(/grant select, insert, update on public\.message_simulation_state to authenticated/);
    expect(SQL).not.toMatch(/\bto\s+(public|anon)\b/);
  });

  it('every drop policy names a policy this file creates (F-051)', () => {
    const drops = [...SQL.matchAll(/drop policy if exists "([^"]+)"/g)].map((m) => m[1]);
    const creates = [...SQL.matchAll(/create policy "([^"]+)"/g)].map((m) => m[1]);
    expect(drops.sort()).toEqual(creates.sort());
  });

  it('states the down path in the header, and wraps in begin/commit', () => {
    expect(MIGRATION).toMatch(/-- Down[\s\S]*drop table if exists public\.message_simulation_state;[\s\S]*drop table if exists public\.message_simulations;/);
    expect(SQL.trim().startsWith('begin;')).toBe(true);
    expect(SQL.trim().endsWith('commit;')).toBe(true);
  });
});
