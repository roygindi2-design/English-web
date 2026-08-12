import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guards 0007 the only way it can be guarded without a live Supabase project:
 * against the shipped SQL text. Same approach and same limits as rls.test.ts /
 * telemetry.test.ts / layer2.test.ts — this proves what the file SAYS, not that
 * it has been applied (TD-20 covers that gap for 0006, TD-22 for this one).
 *
 * Comments are stripped before every assertion. Measured lesson C-0032: a
 * constraint commented out is a constraint that does not exist, and a test
 * reading raw text would stay green over it.
 */
const MIGRATION = readFileSync('supabase/migrations/0007_world_schema.sql', 'utf8');
const SQL = MIGRATION.replace(/--[^\n]*/g, '').toLowerCase();

const TABLES = ['world_characters', 'world_posts', 'world_conversations', 'world_messages'];

describe('0007 — the world schema', () => {
  it('creates exactly the four tables the vision names, and no others', () => {
    const created = [...SQL.matchAll(/create table if not exists public\.([a-z_]+)/g)].map((m) => m[1]);
    expect(created.sort()).toEqual([...TABLES].sort());
  });

  it('carries provenance on every world row — each item is generated content', () => {
    // R-014: a world post goes through the same gate and the same AQL sample as
    // a flashcard. Without generation_run_id a bad batch cannot be revoked.
    for (const table of TABLES) {
      const body = SQL.match(new RegExp(`create table if not exists public\\.${table}\\s*\\(([\\s\\S]*?)\\);`))?.[1];
      expect(body, `${table} has no body`).toBeTruthy();
      expect(body, `${table} lacks generation_run_id`).toContain('generation_run_id');
      expect(body, `${table} lacks needs_human_review`).toContain('needs_human_review');
      expect(body, `${table} lacks an owner`).toMatch(/user_id\s+uuid\s+not null\s+references auth\.users/);
    }
  });

  it('enables row level security on all four', () => {
    for (const table of TABLES) {
      expect(SQL).toMatch(new RegExp(`alter table public\\.${table}\\s+enable row level security`));
    }
  });

  it('scopes every policy to the row owner', () => {
    const policies = SQL.match(/create policy[\s\S]*?;/g) ?? [];
    expect(policies.length).toBe(12); // 4 tables x select/insert/update
    for (const p of policies) expect(p).toMatch(/auth\.uid\(\)\s*=\s*user_id/);
  });

  it('never opens a world table to everyone', () => {
    expect(SQL).not.toMatch(/using\s*\(\s*true\s*\)/);
    expect(SQL).not.toMatch(/\bto\s+(public|anon)\b/);
  });

  it('grants no privilege to anon and never grants delete', () => {
    expect(SQL).toMatch(/revoke all[\s\S]{0,200}from authenticated, anon/);
    const grants = SQL.match(/grant [\s\S]*?;/g) ?? [];
    expect(grants.length).toBeGreaterThan(0);
    for (const g of grants) {
      expect(g).not.toContain('delete');
      expect(g).not.toMatch(/\bto\s+anon\b/);
    }
  });

  it('loads nothing — schema only (R-014)', () => {
    expect(SQL).not.toMatch(/\binsert into\b/);
  });

  it('is wrapped in one transaction', () => {
    expect(SQL).toMatch(/\bbegin\s*;/);
    expect(SQL).toMatch(/\bcommit\s*;/);
  });
});
