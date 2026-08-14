import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guards 0010 against its shipped SQL text — the only guard available without a live
 * project, same technique and same limits as worldSchema.test.ts. Comments are stripped
 * first: a constraint that is commented out is a constraint that does not exist, and a
 * test reading raw text would stay green over it (C-0032).
 */
const SQL = readFileSync('supabase/migrations/0010_world_author_kind.sql', 'utf8')
  .replace(/--[^\n]*/g, '')
  .toLowerCase();

describe('0010 — world_posts.author_kind', () => {
  it('adds the column idempotently, so a re-run is not an error', () => {
    expect(SQL).toMatch(/alter table public\.world_posts\s+add column if not exists author_kind text/);
  });

  it('defaults to learner and forbids null — the table is empty, so this is safe exactly once', () => {
    expect(SQL).toMatch(/author_kind text\s+not null\s+default 'learner'/);
  });

  it('constrains the value to the two kinds that exist', () => {
    expect(SQL).toMatch(/check \(author_kind in \('learner','character'\)\)/);
  });

  it('wraps in one transaction — a half-applied migration is worse than none', () => {
    expect(SQL).toContain('begin;');
    expect(SQL).toContain('commit;');
  });

  it('⛔ loads not one row — this file is schema only', () => {
    expect(SQL).not.toContain('insert into');
  });

  it('⛔ does not touch any table but world_posts', () => {
    const tables = [...SQL.matchAll(/alter table public\.([a-z_]+)/g)].map((m) => m[1]);
    expect([...new Set(tables)]).toEqual(['world_posts']);
  });
});
