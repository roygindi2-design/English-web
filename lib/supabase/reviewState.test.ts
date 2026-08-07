import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const RAW = readFileSync('supabase/migrations/0005_review_state.sql', 'utf8');
/** Comments explain the rules; only executable SQL may satisfy an assertion (C-0032). */
const SQL = RAW.split('\n')
  .map((line) => line.replace(/--.*$/, ''))
  .join('\n')
  .toLowerCase();

describe('0005_review_state.sql — SM-2 state on the existing aggregate', () => {
  it('extends word_progress and does not create a second table', () => {
    expect(SQL).toMatch(/alter table\s+(public\.)?word_progress/);
    expect(SQL).not.toMatch(/create table[\s\S]*review/);
  });

  it.each([
    'easiness',
    'interval_days',
    'repetition',
    'next_review_at',
    'consecutive_correct_recognition',
  ])('adds the %s column', (column) => {
    expect(SQL).toMatch(new RegExp(`add column if not exists\\s+${column}\\b`));
  });

  it('leaves next_review_at nullable — an unanswered word is not due', () => {
    expect(SQL).not.toMatch(/next_review_at\s+timestamptz\s+not null/);
  });

  it('seeds easiness at the SM-2 initial value', () => {
    expect(SQL).toMatch(/easiness\s+numeric\(4,\s*2\)\s+not null\s+default\s+2\.5/);
  });

  it('declares both check constraints BY NAME so a re-run cannot skip them', () => {
    expect(SQL).toMatch(/do \$\$/);
    expect(SQL).toMatch(/word_progress_easiness_floor/);
    expect(SQL).toMatch(/word_progress_interval_nonneg/);
  });

  it('is re-runnable without damage', () => {
    expect(SQL).toMatch(/add column if not exists/);
    expect(SQL).not.toMatch(/drop table/);
  });

  it('does not weaken the RLS that 0003 established', () => {
    expect(SQL).not.toMatch(/disable row level security/);
    expect(SQL).not.toMatch(/drop policy/);
  });
});
