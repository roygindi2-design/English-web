-- T-010 · a SOURCED CEFR band on the headword.
--
-- ⛔ This is not senses.cefr_level and must never be merged with it. That column is the
-- Content agent's judgement about ONE SENSE. This one is a lemma-level label from a
-- published profile. Measured 2026-08-12 with the real modules: they differ on 125 of
-- 343 content rows (94 of the 306 distinct (headword, pos) pairs), and both are
-- legitimate — "mean" the lemma is A1, "mean" = to signify is B1.
--
-- Sources (both already in data/, both cleared for commercial use in docs/data-licenses.md):
--   cefr-j-1.5   — CEFR-J Vocabulary Profile 1.5   (Pre-A1..B2)
--   octanove-1.0 — Octanove Vocabulary Profile     (C1..C2), CC BY-SA 4.0
--
-- Re-runnable: both columns are guarded, and the whole file is one transaction.

begin;

alter table public.words
  add column if not exists cefr_profile_band text
    check (cefr_profile_band in ('A1','A2','B1','B2','C1','C2'));

alter table public.words
  add column if not exists cefr_profile_source text
    check (cefr_profile_source in ('cefr-j-1.5','octanove-1.0'));

-- A band with no stated source is an unattributable claim; a source with no band is noise.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'words_cefr_profile_paired'
  ) then
    alter table public.words add constraint words_cefr_profile_paired
      check ((cefr_profile_band is null) = (cefr_profile_source is null));
  end if;
end $$;

comment on column public.words.cefr_profile_band is
  'CEFR band from a published profile, for the LEMMA. Never overwrites senses.cefr_level, '
  'which is per-sense and authored by us. They disagree on ~36% of rows by design.';

comment on column public.words.cefr_profile_source is
  'Which published profile supplied cefr_profile_band. Paired with it by '
  'words_cefr_profile_paired: neither is ever set alone.';

commit;
