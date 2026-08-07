-- 0005_review_state.sql — SM-2 state for engine 7.1, on the EXISTING aggregate.
--
-- Apply in the Supabase SQL editor (or `supabase db push`) after 0003. Like 0004,
-- this file only ALTERs: RLS and the owner-only policies come from 0003 and are
-- NOT restated here — a second policy on the same table is OR'd with the first,
-- so restating it can only widen access, never narrow it.
--
-- word_progress stays ONE ROW PER (user, word). 0003 records W4 (the free Supabase
-- tier) as the reason there is no per-review event log, and nothing here changes it.
-- These five columns are the scheduler's state for that pair, not a review log.
--
-- next_review_at is deliberately NULLABLE: a word the learner has never answered is
-- not "due now", and `default now()` would flood the very first queue with the whole
-- dictionary.
--
-- Idempotent: `add column if not exists` throughout. The CHECK constraints are declared
-- separately BY NAME inside `do $$`, because `add column ... check` is skipped WHOLE
-- when the column already exists — a project that ran an early draft would then be
-- missing the constraint silently (measured C-0032).
--
-- One statement per column, not one multi-column `alter`, for the same reason 0004
-- gives: this way the migration ASSERTS every column instead of assuming an earlier
-- draft left some of them behind.

alter table public.word_progress
  add column if not exists easiness numeric(4,2) not null default 2.5;

alter table public.word_progress
  add column if not exists interval_days int not null default 0;

alter table public.word_progress
  add column if not exists repetition int not null default 0;

alter table public.word_progress
  add column if not exists next_review_at timestamptz;

-- C-0039 already added this column to 0003 when it closed F-023, so here it is a
-- no-op for anyone who ran 0003 after that fix. It stays as a width guard: a project
-- that ran the ORIGINAL 0003 (which lacked the column) and then 0005 must still end
-- up with the streak column, or directionFor() would send a promoted word back to
-- recognition on every reload.
alter table public.word_progress
  add column if not exists consecutive_correct_recognition int not null default 0;

do $$
begin
  -- MIN_EASINESS in lib/core/scheduler.ts. The floor is SM-2's, and the database
  -- restates it because a bug in any future writer must not be able to park a word
  -- below it permanently — the pure scheduler clamps, but only what it is given.
  if not exists (
    select 1 from pg_constraint where conname = 'word_progress_easiness_floor'
  ) then
    alter table public.word_progress
      add constraint word_progress_easiness_floor check (easiness >= 1.3);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'word_progress_interval_nonneg'
  ) then
    alter table public.word_progress
      add constraint word_progress_interval_nonneg
      check (interval_days >= 0 and repetition >= 0 and consecutive_correct_recognition >= 0);
  end if;
end $$;

-- The due-queue read is always (this learner, due before now). The user_id index
-- from 0003 alone makes that a filter over every word the learner has ever seen.
create index if not exists word_progress_due_idx
  on public.word_progress (user_id, next_review_at);
