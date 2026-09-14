import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DAILY_MINUTES_OPTIONS,
  TARGET_SCORE_MAX,
  TARGET_SCORE_MIN,
} from '../core/onboarding';

/**
 * Guards the T-029 columns where they can be guarded without a live project.
 * Same approach and same limits as rls.test.ts and telemetry.test.ts: this
 * proves what we ship, not what was applied. Applying it is a step in
 * docs/SETUP.md.
 */
const SOURCE = readFileSync('supabase/migrations/0004_onboarding_answers.sql', 'utf8');

/**
 * Every assertion below runs on the STATEMENTS, never on the raw file.
 *
 * Measured C-0032: the plan's version scanned the raw text, and the header
 * comment — the prose that explains why `daily_minutes smallint not null` is
 * forbidden — matched the regex that forbids it. The suite went red on a
 * correct migration.
 *
 * The mirror image is the dangerous one and is what this helper actually buys:
 * on raw text, `alter table public.profiles ... daily_minutes` is satisfied by
 * a migration that only MENTIONS the column in a comment and never adds it.
 * A migration guard that a comment can satisfy guards nothing (F-007's shape).
 */
function withoutSqlComments(sql: string): string {
  return sql.replace(/--[^\n]*/g, '');
}

const MIGRATION = withoutSqlComments(SOURCE);
const SQL = MIGRATION.toLowerCase();

describe('the onboarding columns', () => {
  it('adds all four columns to profiles, one statement each', () => {
    // One `alter` per column, the C-0029 lesson: the 120-character window below
    // never reaches the third column of a multi-column alter, so a test that
    // scans for it would pass on a migration that never added it.
    for (const column of ['daily_minutes', 'exam_date', 'target_score', 'onboarded_at']) {
      expect(SQL, `profiles.${column} is missing`).toMatch(
        new RegExp(`alter table public\\.profiles[\\s\\S]{0,120}${column}`),
      );
    }
  });

  it('leaves every answer nullable — a learner who has not answered is not a default', () => {
    // `daily_minutes smallint not null default 5` would make "never asked" and
    // "chose 5 minutes" the same row, and no later query could tell them apart.
    expect(SQL).not.toMatch(/daily_minutes\s+smallint\s+not null/);
    expect(SQL).not.toMatch(/exam_date\s+date\s+not null/);
    expect(SQL).not.toMatch(/target_score\s+smallint\s+not null/);
  });

  it('constrains daily_minutes to exactly the options the code offers', () => {
    const constraint = MIGRATION.match(/daily_minutes\s+in\s*\(([^)]*)\)/i)?.[1];
    expect(constraint, 'no `daily_minutes in (...)` constraint in the migration').toBeTruthy();
    const inSql = (constraint ?? '')
      .split(',')
      .map((n) => Number(n.trim()))
      .sort((a, b) => a - b);
    const inCode = [...DAILY_MINUTES_OPTIONS].sort((a, b) => a - b);
    expect(inSql).toEqual(inCode);
  });

  it('constrains target_score to the published 50-150 scale (A5)', () => {
    expect(SQL).toMatch(
      new RegExp(`target_score\\s+between\\s+${TARGET_SCORE_MIN}\\s+and\\s+${TARGET_SCORE_MAX}`),
    );
  });

  it('adds no new policy — 0001 already scopes profiles to the owner', () => {
    // A second `for update` policy on the same table is permissive-OR'd with
    // the first, so a sloppy one here would widen 0001 rather than narrow it.
    expect(SQL).not.toContain('create policy');
  });

  it('is re-appliable: every statement is guarded', () => {
    const alters = MIGRATION.match(/alter table public\.profiles\s+add column[^;]*/gi) ?? [];
    expect(alters.length).toBeGreaterThanOrEqual(4);
    for (const statement of alters) {
      expect(statement.toLowerCase(), `unguarded: ${statement}`).toContain('if not exists');
    }
  });
});
