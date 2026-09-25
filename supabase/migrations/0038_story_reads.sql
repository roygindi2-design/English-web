-- 0038_story_reads.sql — the learner's reading history, server-side (T-493 · `D-293`ⓐ).
-- ⚠️ Applied live as `0040_story_reads` (apply_migration, C-0826); the repo number is the next
-- free one, because `scripts/migration-hygiene.test.ts` forbids a gap in the sequence.
--
-- Until now `GET /api/world/story` built `readStoryIds` from a `?read=` query parameter
-- that ⛔ no caller ever sent ⇒ the skip list of `pickStory` (T-209) was always empty and a
-- story the learner finished came back the next day. A parameter the client controls is
-- ⛔ not a source of truth either, so the history lives here and the GET reads it.
--
-- ⛔ One row per (learner, story): reading a story twice is an upsert, ⛔ not a second row.
-- ⛔ No score, ⛔ no timing column beyond the moment of reading (D-053 untouched).
--
-- Down (manual): `drop table if exists public.story_reads;`

begin;

create table if not exists public.story_reads (
  user_id  uuid not null references auth.users (id) on delete cascade,
  story_id uuid not null references public.stories (id) on delete cascade,
  read_at  timestamptz not null default now(),
  primary key (user_id, story_id)
);

alter table public.story_reads enable row level security;

drop policy if exists story_reads_select_own on public.story_reads;
create policy story_reads_select_own on public.story_reads
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists story_reads_insert_own on public.story_reads;
create policy story_reads_insert_own on public.story_reads
  for insert to authenticated
  with check (user_id = auth.uid());

-- ⛔ No update / delete policy: `on conflict do nothing` needs neither, and a learner
-- ⛔ cannot rewrite or erase another learner's history — nor their own through the API.

revoke all on public.story_reads from anon;
grant select, insert on public.story_reads to authenticated;

commit;
