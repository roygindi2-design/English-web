-- T-003 · § 4.2ד — the institution the learner will sit the exam at.
--
-- Apply in the Supabase SQL editor (or `supabase db push`) after 0004. RLS and
-- the owner-only policies come from 0001_profiles.sql and are NOT restated:
-- a second policy on the same table is OR'd with the first, so restating it can
-- only widen access, never narrow it.
--
-- Nullable, and ⛔ never `not null`: § 4.2ד makes the field optional, and a
-- default would make "skipped" and "answered" the same row forever.
--
-- Free text, ⛔ not an enum and ⛔ not a foreign key to an institutions table:
-- A7 (nite.org.il, grade א׳) states the exemption threshold and the level
-- banding are set per institution and that there is NO national list. A list we
-- author would be a pedagogical claim with no source behind it.

alter table public.profiles add column if not exists institution text;

comment on column public.profiles.institution is
  'A7 · T-003: free text, learner-supplied, optional. Read ONLY by the /me
   display — ⛔ no threshold logic, no readiness estimate, no comparison.
   NULL = skipped, which is an expected and permanent state.';

-- `add column ... check (...)` is skipped wholesale when the column already
-- exists, so the constraint is added separately or it ships missing on any
-- project that ran an earlier draft. Named, so re-applying is a no-op.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_institution_length_check') then
    alter table public.profiles
      add constraint profiles_institution_length_check
      check (institution is null or char_length(institution) <= 120);
  end if;
end $$;
