-- T-029 · the onboarding answers on the learner's profile row
--
-- Apply in the Supabase SQL editor (or `supabase db push`) after 0001. RLS and
-- the owner-only policies already come from 0001_profiles.sql and are NOT
-- restated here: a second policy on the same table is OR'd with the first, so
-- restating it can only widen access, never narrow it.
--
-- Every column is nullable on purpose. `daily_minutes smallint not null
-- default 5` would make "never answered" and "chose 5 minutes" the same row,
-- and no later query could separate them again.
--
-- One statement per column, not one multi-column `alter`: `add column if not
-- exists` is per-clause anyway, and this way the migration ASSERTS all four
-- columns instead of assuming an earlier draft left some of them behind.

alter table public.profiles add column if not exists daily_minutes smallint;
alter table public.profiles add column if not exists exam_date     date;
alter table public.profiles add column if not exists target_score  smallint;
alter table public.profiles add column if not exists onboarded_at  timestamptz;

comment on column public.profiles.daily_minutes is
  'R-012: the task-based goal, in minutes. NULL = not asked yet.';
comment on column public.profiles.exam_date is
  'Input to engine 7.1. NULL = the learner has no date yet, which is allowed.';
comment on column public.profiles.target_score is
  'A5 scale 50-150. Optional, and never displayed as a motivator (R-012).';
comment on column public.profiles.onboarded_at is
  'When the learner answered. NULL = the onboarding screen was never completed.';

-- `add column ... check (...)` is skipped wholesale when the column already
-- exists, so the constraints are added separately or they would ship missing on
-- any project that ran an earlier draft. Named, so re-applying is a no-op.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_daily_minutes_check') then
    alter table public.profiles
      add constraint profiles_daily_minutes_check
      check (daily_minutes is null or daily_minutes in (5,10,20));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_target_score_check') then
    alter table public.profiles
      add constraint profiles_target_score_check
      check (target_score is null or target_score between 50 and 150);
  end if;
end $$;
