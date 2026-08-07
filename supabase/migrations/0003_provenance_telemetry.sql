-- 0003_provenance_telemetry.sql — T-015
--
-- Two things that are cheap today and impossible retroactively:
--   ⓐ provenance on every content row (which track, which source, which origin);
--   ⓑ the two D-010 fields per (learner, word).
--
-- `word_progress` is deliberately ONE ROW PER PAIR and not one row per review
-- event. W4 records the free Supabase tier as a budget risk, and an event log on
-- a spaced-repetition app grows without a ceiling. Everything the level gate
-- (7.7) needs is derivable from the aggregate.
--
-- Idempotent: `if not exists` throughout, so re-applying is safe.

begin;

-- ── the source registry, mirrored from lib/core/dataSources.ts ───────────────
-- Mirrored, not authoritative: the code registry is the source of truth, and
-- lib/supabase/telemetry.test.ts fails if the two id sets ever diverge.
create table if not exists public.data_sources (
  id      text primary key,
  name    text not null,
  licence text not null,
  url     text not null
);

insert into public.data_sources (id, name, licence, url) values
  ('ngsl',             'New General Service List v1.2',        'CC BY-SA 4.0', 'https://www.newgeneralservicelist.com/'),
  ('cefrj',            'CEFR-J Vocabulary Profile',            'CEFR-J',       'https://cefr-j.org/download.html'),
  ('octanove',         'Octanove Vocabulary Profile C1/C2',    'CC BY-SA 4.0', 'https://github.com/openlanguageprofiles/olp-en-cefrj'),
  ('hebrew-wordnet',   'Hebrew Wordnet (University of Haifa)', 'permissive',   'https://cl.haifa.ac.il/projects/mila/'),
  ('wiktionary-en-he', 'English Wiktionary (EN→HE)',           'CC BY-SA 4.0', 'https://en.wiktionary.org/'),
  ('kaikki',           'Kaikki.org / wiktextract',             'CC BY-SA 4.0', 'https://kaikki.org/dictionary/English/'),
  ('word2word',        'word2word',                            'Apache-2.0',   'https://github.com/kakaobrain/word2word')
on conflict (id) do nothing;

-- ── provenance on the content rows ──────────────────────────────────────────
-- One statement per column, not one multi-column `alter`: `add column if not
-- exists` is per-clause anyway, and a column that already exists (words.origin,
-- from 0002) then costs nothing while the migration still ASSERTS all three
-- columns on both tables rather than assuming an earlier file left them there.
-- Same 'amiram' default as profiles.track_id (0001), because two defaults for
-- one key is a join that quietly returns nothing.

alter table public.words add column if not exists track_id text not null default 'amiram';
alter table public.words add column if not exists source_id text references public.data_sources (id);
alter table public.words add column if not exists origin text not null default 'generated';

alter table public.senses add column if not exists track_id text not null default 'amiram';
alter table public.senses add column if not exists source_id text references public.data_sources (id);
alter table public.senses add column if not exists origin text not null default 'generated';

-- `add column … check (…)` is skipped wholesale when the column already exists,
-- so the constraint is added separately or senses.origin would ship unchecked
-- on any project that ran an earlier draft. Named, so re-applying is a no-op.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'senses_origin_check') then
    alter table public.senses
      add constraint senses_origin_check check (origin in ('seed','ngsl','generated'));
  end if;
end $$;

create index if not exists words_track_idx  on public.words  (track_id);
create index if not exists senses_track_idx on public.senses (track_id);

-- ── D-010 telemetry, one aggregate row per (learner, word) ──────────────────
create table if not exists public.word_progress (
  user_id  uuid not null references auth.users (id) on delete cascade,
  word_id  uuid not null references public.words (id) on delete cascade,
  track_id text not null default 'amiram',

  first_seen_at    timestamptz not null default now(),
  attempts         int not null default 0,
  correct_attempts int not null default 0,

  -- D-010, both names verbatim. Nullable on purpose: until the learner answers
  -- correctly once, the value is UNKNOWN, and 0 would be a measurement.
  time_to_first_correct int,  -- milliseconds from first exposure to first correct answer
  attempts_to_mastery   int,  -- attempts counted at the moment mastery was reached

  mastered_at timestamptz,
  updated_at  timestamptz not null default now(),

  primary key (user_id, word_id)
);

create index if not exists word_progress_user_idx on public.word_progress (user_id);

alter table public.word_progress enable row level security;

drop policy if exists "word_progress_select_own" on public.word_progress;
create policy "word_progress_select_own" on public.word_progress
  for select using (auth.uid() = user_id);

drop policy if exists "word_progress_insert_own" on public.word_progress;
create policy "word_progress_insert_own" on public.word_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "word_progress_update_own" on public.word_progress;
create policy "word_progress_update_own" on public.word_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

commit;
