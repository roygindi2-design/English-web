-- 0007_world_schema.sql — T-049 (שכבה 2 ג׳: העולם)
--
-- Apply AFTER 0006_layer2_track_and_bank.sql.
--
-- What: four empty tables — world_characters · world_posts ·
-- world_conversations · world_messages. Nothing else.
--
-- Why every row carries generation_run_id + needs_human_review: the vision says
-- each item in the world is GENERATED content, so it passes the same
-- deterministic gate and the same AQL sample as a flashcard (R-014). Without a
-- run id a bad batch cannot be revoked — the exact capability 0002 built
-- generation_runs for, and the same reason senses.generation_run_id exists.
--
-- ⛔ SCHEMA ONLY — this file loads NOT ONE ROW, and must never load one.
--    T-049 allows the schema and forbids the content: releasing generated world
--    items before the gate and the AQL sample is precisely the violation R-014
--    exists to prevent. lib/supabase/worldSchema.test.ts fails on any
--    `insert into` appearing in this file.
--
-- ⛔ No API, no UI. There is no consumer for these tables yet, by design.
--
-- Idempotent and transactional: `create table if not exists` +
-- `create index if not exists` + `drop policy if exists` before every policy,
-- and the whole file wraps in begin/commit like 0002 and 0006 — a half-applied
-- multi-statement migration is worse than none.

begin;

-- ---------------------------------------------------------------------------
-- world_characters — the personas the learner talks to.
-- ---------------------------------------------------------------------------
-- ⚠️ user_id is carried on THIS row and on all four tables below, even where a
-- parent id already reaches it. 0002 documents the failure this avoids: its
-- three child tables had to repeat an `exists (select 1 from senses …)`
-- subquery in every policy to inherit the parent's D-013 filter, and a single
-- `using (true)` on any one of them would have voided that filter SILENTLY. A
-- self-contained `auth.uid() = user_id` cannot be broken by a mistake made on
-- the parent table.
create table if not exists public.world_characters (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  display_name       text not null,
  persona_en         text not null,
  generation_run_id  uuid references public.generation_runs (id),
  needs_human_review boolean not null default false,
  created_at         timestamptz not null default now()
);

comment on table public.world_characters is
  'One row per generated persona, scoped to one learner. Generated content: it '
  'carries its generation_run_id so a bad batch can be revoked (R-014).';

-- ---------------------------------------------------------------------------
-- world_posts — the feed. character_id is NULLABLE on purpose: a post that is
-- not attributed to a persona is a legitimate feed item, and NO ACTION (the
-- default) means deleting a character can never silently destroy its posts —
-- the same choice 0002 made for senses.generation_run_id.
-- ---------------------------------------------------------------------------
create table if not exists public.world_posts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  character_id       uuid references public.world_characters (id),
  body_en            text not null,
  generation_run_id  uuid references public.generation_runs (id),
  needs_human_review boolean not null default false,
  created_at         timestamptz not null default now()
);

comment on table public.world_posts is
  'Feed items. character_id is nullable: an unattributed post is valid content.';

-- ---------------------------------------------------------------------------
-- world_conversations — one thread between the learner and one character.
-- ---------------------------------------------------------------------------
create table if not exists public.world_conversations (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  character_id       uuid not null references public.world_characters (id),
  topic_en           text,
  generation_run_id  uuid references public.generation_runs (id),
  needs_human_review boolean not null default false,
  created_at         timestamptz not null default now()
);

comment on table public.world_conversations is
  'One thread per learner-character pair-in-time. topic_en is nullable: a thread '
  'that has not been titled yet is a thread, not an error.';

-- ---------------------------------------------------------------------------
-- world_messages — turns inside one conversation.
-- ---------------------------------------------------------------------------
-- `author` is a closed two-value check, not free text: 'learner' and
-- 'character' are the only two speakers the vision names, and free text would
-- drift learner/Learner/user past every reader — the same argument 0006 made
-- for exam_type. This is transcription of an existing distinction, not an
-- invented taxonomy.
create table if not exists public.world_messages (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,
  conversation_id    uuid not null references public.world_conversations (id) on delete cascade,
  author             text not null check (author in ('learner','character')),
  body_en            text not null,
  generation_run_id  uuid references public.generation_runs (id),
  needs_human_review boolean not null default false,
  created_at         timestamptz not null default now()
);

comment on table public.world_messages is
  'Turns in a thread. user_id is repeated here deliberately so the policy is '
  'self-contained (see the note on world_characters).';

-- ---------------------------------------------------------------------------
-- Indexes — exactly the two orderings the only two reads will use: the feed by
-- recency, and a thread in order. No speculative index: an unused index is
-- write cost with no read benefit.
-- ---------------------------------------------------------------------------
create index if not exists world_posts_user_created_idx
  on public.world_posts (user_id, created_at);

create index if not exists world_messages_conversation_created_idx
  on public.world_messages (conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- RLS. A table without RLS on Supabase is a public table — the anon key ships
-- in the browser (0001's opening note).
-- ---------------------------------------------------------------------------
alter table public.world_characters    enable row level security;
alter table public.world_posts         enable row level security;
alter table public.world_conversations enable row level security;
alter table public.world_messages      enable row level security;

drop policy if exists "world_characters_select_own" on public.world_characters;
create policy "world_characters_select_own" on public.world_characters
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "world_characters_insert_own" on public.world_characters;
create policy "world_characters_insert_own" on public.world_characters
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "world_characters_update_own" on public.world_characters;
create policy "world_characters_update_own" on public.world_characters
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "world_posts_select_own" on public.world_posts;
create policy "world_posts_select_own" on public.world_posts
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "world_posts_insert_own" on public.world_posts;
create policy "world_posts_insert_own" on public.world_posts
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "world_posts_update_own" on public.world_posts;
create policy "world_posts_update_own" on public.world_posts
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "world_conversations_select_own" on public.world_conversations;
create policy "world_conversations_select_own" on public.world_conversations
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "world_conversations_insert_own" on public.world_conversations;
create policy "world_conversations_insert_own" on public.world_conversations
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "world_conversations_update_own" on public.world_conversations;
create policy "world_conversations_update_own" on public.world_conversations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "world_messages_select_own" on public.world_messages;
create policy "world_messages_select_own" on public.world_messages
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "world_messages_insert_own" on public.world_messages;
create policy "world_messages_insert_own" on public.world_messages
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "world_messages_update_own" on public.world_messages;
create policy "world_messages_update_own" on public.world_messages
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ⛔ Deliberately NO delete policy on any of the four — 0001 makes the same
-- choice for profiles, and an absent policy denies by default instead of
-- half-implementing deletion. Revoking a bad generated batch is a server-side
-- operation against generation_run_id, not a learner action.

-- ---------------------------------------------------------------------------
-- Explicit privileges. Supabase grants ALL to anon and authenticated through
-- default privileges, so `grant` alone is a no-op there and RLS is left as the
-- only guard — and RLS does NOT block TRUNCATE. Revoke first, then grant the
-- three verbs the policies above actually allow. (0002's pattern and reason.)
-- ---------------------------------------------------------------------------
revoke all on public.world_characters, public.world_posts,
              public.world_conversations, public.world_messages
       from authenticated, anon;

grant select, insert, update on public.world_characters, public.world_posts,
                                public.world_conversations, public.world_messages
      to authenticated;

-- anon receives nothing. Any anonymous path into the world is a deliberate
-- decision through /app/api/, not a forgotten grant here.

commit;
