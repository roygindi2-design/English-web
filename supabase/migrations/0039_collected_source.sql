-- 0039_collected_source.sql — the collection gets a second channel: a word tapped in a
-- story (T-495 · `D-293`ⓒ · `T-266`ⓐ).
--
-- Until now `arcade_collected_words` was written only by `app/api/arcade/result`. A word the
-- learner had to TAP to understand a story is the story's counterpart of «a word that knocked
-- you down in battle», so it lands here with `source = 'story'`.
--
-- ⛔ Existing rows are the arena's ⇒ the default fills them with 'arena'.
-- ⛔ The FIRST source is kept: the story route inserts with `on conflict do nothing`, and the
--    arena's upsert (`app/api/arcade/result`) ⛔ never writes this column.
-- ⛔ No score, no timing, no review (D-053 · D-052).
--
-- Down (manual): `alter table public.arcade_collected_words drop column if exists source;`

begin;

alter table public.arcade_collected_words
  add column if not exists source text not null default 'arena';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'arcade_collected_source_check') then
    alter table public.arcade_collected_words
      add constraint arcade_collected_source_check check (source in ('arena', 'story'));
  end if;
end $$;

comment on column public.arcade_collected_words.source is
  'T-495 · D-293ⓒ: where the word first entered the collection — arena (a miss in battle) or
   story (a tap on an unknown word). The first source is kept; ⛔ never overwritten.';

commit;
