-- 0021_sense_items_level.sql — D-141: every practice item carries a difficulty
-- level (1-4, 41 § 6.2) and a written rationale, tagged at write time.
--
-- ⚠️ ADDS ONLY, never backfills. Measured 28/08 (D-141 § א): 1,602 existing
-- `sense_items` rows carry no level. That null is a legal, DECLARED state —
-- "written before D-141" — not a gap to fill in. A `not null` or a `default`
-- here would invent a level for content nobody actually leveled, which is
-- exactly the retro-tagging cost D-141 § ב rejected in favour of tagging at
-- write time. ⛔ No `not null`. ⛔ No `default`.
--
-- Down (manual — this file's statements are never re-run automatically by
-- `supabase db push`; apply by hand if this ever needs reverting):
--   alter table public.sense_items drop constraint if exists sense_items_level_check;
--   alter table public.sense_items drop constraint if exists sense_items_level_rationale_pairing;
--   alter table public.sense_items drop column if exists level;
--   alter table public.sense_items drop column if exists level_rationale;

begin;

alter table public.sense_items
  add column if not exists level smallint,
  add column if not exists level_rationale text;

comment on column public.sense_items.level is
  'D-141 · 41 § 6.2 — difficulty 1-4, tagged at write time. NULL = written before D-141, a declared legal state, ⛔ never backfilled by inference.';
comment on column public.sense_items.level_rationale is
  'D-141 · names the § 6.2 criterion that set the level ("one connective ⇒ 2"), never a feeling ("felt like a 3"). NULL iff level is NULL.';

-- `add column ... check (...)` is skipped wholesale when the column already
-- exists (same reasoning as 0004_onboarding_answers.sql), so the constraints
-- are added separately, named, so re-applying this file is a no-op.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sense_items_level_check') then
    alter table public.sense_items
      add constraint sense_items_level_check
      check (level is null or level between 1 and 4);
  end if;

  -- The pair is tagged together or not at all — a half-tagged item (a level
  -- with no stated reason, or a reason with no level) is a data-entry defect,
  -- not a valid untagged item. Same standing as a distractor with no reason
  -- (41 § 6.4 rule 5) — enforced at the app gate (contentSchema.ts) too, but
  -- this is the last line of defense for any writer that bypasses it.
  if not exists (select 1 from pg_constraint where conname = 'sense_items_level_rationale_pairing') then
    alter table public.sense_items
      add constraint sense_items_level_rationale_pairing
      check ((level is null) = (level_rationale is null));
  end if;
end $$;

commit;
