import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guards `0012_auth_attempts.sql` — the durable counter behind F-008ⓑ — the only
 * way a migration can be guarded without a live project: against the shipped SQL
 * text. Same approach and same limits as `worldSchema.test.ts` / `rls.test.ts` /
 * `telemetry.test.ts`: this proves what the file SAYS, ⛔ not that it has been
 * applied. TD in `plan/30-architecture.md` covers that gap.
 *
 * ⚠️ The plan (`docs/superpowers/plans/2026-08-15-auth-rate-limit.md`, Task 2)
 * put this file at `supabase/migrations/0012_auth_attempts.test.ts`. Measured in
 * C-0160: `vitest.config.ts` `include` has no `supabase/**` glob, so a test there
 * is silently NOT COLLECTED and `npm test` stays green over nothing — exactly the
 * trap that config file documents twice. It lives here instead, with the other
 * migration guards.
 *
 * Comments are stripped before every assertion: a constraint commented out is a
 * constraint that does not exist, and raw-text matching would stay green over it.
 */
const SQL = readFileSync('supabase/migrations/0012_auth_attempts.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0012_auth_attempts', () => {
  it('is re-runnable — an applied migration must be a no-op, ⛔ not an error', () => {
    expect(BODY).toMatch(/create table if not exists public\.auth_attempts/i);
    expect(BODY).toMatch(/create or replace function public\.consume_auth_attempt/i);
  });

  it('turns RLS ON and grants anon NOTHING — the RPC is the only door', () => {
    expect(BODY).toMatch(/alter table public\.auth_attempts enable row level security/i);
    // ⚠️ Measured, ⛔ not assumed: a `create policy … for select … to anon` would still let a
    // caller read every bucket in the table, so ANY anon policy on this table is the defect.
    expect(BODY).not.toMatch(/create policy[\s\S]{0,400}?on public\.auth_attempts/i);
  });

  it('is SECURITY DEFINER with a pinned search_path — an unpinned one is hijackable', () => {
    expect(BODY).toMatch(/security definer/i);
    expect(BODY).toMatch(/set search_path\s*=\s*(public|pg_catalog)/i);
  });

  it('grants EXECUTE on the function to anon, or the anon routes cannot call it', () => {
    expect(BODY).toMatch(/grant execute on function public\.consume_auth_attempt[^;]*to anon/i);
  });

  it('increments atomically in ONE statement — read-then-write races under load', () => {
    // Two lambdas hitting the same bucket in the same millisecond must not both read 1.
    expect(BODY).toMatch(/on conflict[\s\S]{0,200}do update[\s\S]{0,200}set[\s\S]{0,200}hits\s*=/i);
    expect(BODY).not.toMatch(/select\s+hits[\s\S]{0,200}?;\s*[\s\S]{0,200}?update public\.auth_attempts/i);
  });

  it('stores a bucket KEY and ⛔ never a raw email or a raw IP', () => {
    expect(BODY).not.toMatch(/\bemail\b/i);
    expect(BODY).not.toMatch(/\bip_address\b|\binet\b/i);
  });

  it('can be swept — an unbounded counter table grows forever', () => {
    expect(BODY).toMatch(/create index if not exists[\s\S]{0,120}window_started_at/i);
  });

  it('aligns its window to the epoch exactly as lib/core/rateLimit.ts does', () => {
    // ⚠️ The two formulas are the same rule written twice, in two languages. If
    // the SQL floors differently the adapter compares a DB window start against a
    // TS one and never matches, so every counter reads as stale and the limiter
    // silently allows everything. This pins the SQL half.
    expect(BODY).toMatch(/floor\s*\([\s\S]{0,80}p_window_seconds\s*\*\s*1000\s*\)/i);
  });
});
