-- 0034_class_wall.sql — the class wall: posts, replies, likes (T-470 · `39 § 5` · `39 § 2` · D-288).
--
-- `39 § 5`: a feed of posts, each with replies and likes. `39 § 2`: the wall belongs to a
-- CLOSED class ⇒ a row here is readable ONLY by a member of that row's class, exactly the
-- 0032 reasoning. ⛔ No insert/update/delete policy at all: every write goes through one of
-- three `security definer` functions, in the `create_class`/`join_class` shape of 0032:
--
--   post_question(p_class_id, p_body)       ⛔ only `classes.created_by` (D-288: «המורה»
--                                            is a role in the class, ⛔ not an account type)
--   add_reply(p_post_id, p_body)             any member of the post's class
--   toggle_like(p_post_id, p_reply_id)       any member; ⛔ never on your own content
--
-- Failure scenario this closes (T-470): a member of class A runs a direct `select` on
-- `class_posts` and reads a post of class B ⇒ every select policy joins through
-- `class_members` on `auth.uid()`, and 0032 already lets a learner read only their own
-- membership rows.
--
-- `body_en` is 1–120 characters here, in a `check`. That the body CAME FROM THE KEYBOARD
-- (`39 § 1`, «בלי הקלדה חופשית») is checked in the route (T-472), against the same tree
-- the keyboard uses — ⛔ a database cannot see `lib/core/continuations.ts`.
--
-- Errors, by NAME, for `lib/server/classFailure.ts`:
--   28000 not_authenticated · P0002 class_not_found / post_not_found / reply_not_found ·
--   42501 only_class_opener / own_content · 22023 invalid_body / invalid_target
--
-- ⚠️ Known and recorded, ⛔ not solved here (T-472's to close): the three functions are
-- `grant execute … to authenticated`, like 0032's, so a signed-in learner can call
-- `/rest/v1/rpc/add_reply` DIRECTLY with free text and never pass the route's keyboard
-- check. The fence therefore has to move INTO the database or behind the server key —
-- the route alone ⛔ cannot be the gate.
--
-- Applied C-0803 (MCP `apply_migration`) and read back: RLS on all three tables, one
-- `select` policy each, ⛔ no write policy; run as two learners (rolled back): a
-- non-member sees 0 posts and gets `post_not_found`; after joining sees them; a member
-- posting ⇒ `only_class_opener`; liking own reply ⇒ `own_content`; like 1 ⇒ 0; a direct
-- insert ⇒ 42501; 121 characters ⇒ `invalid_body`; the opener ⛔ never sees class B.
--
-- Down (manual — never re-run automatically):
--   drop function if exists public.toggle_like(uuid, uuid);
--   drop function if exists public.add_reply(uuid, text);
--   drop function if exists public.post_question(uuid, text);
--   drop table if exists public.class_likes;
--   drop table if exists public.class_replies;
--   drop table if exists public.class_posts;
--
-- Idempotent: `create … if not exists`, `create or replace`, policies dropped and recreated.

begin;

create table if not exists public.class_posts (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.classes (id) on delete cascade,
  author_id  uuid not null references auth.users (id) on delete cascade,
  body_en    text not null check (char_length(btrim(body_en)) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.class_replies (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.class_posts (id) on delete cascade,
  author_id  uuid not null references auth.users (id) on delete cascade,
  body_en    text not null check (char_length(btrim(body_en)) between 1 and 120),
  created_at timestamptz not null default now()
);

-- A like is on a post OR on a reply — exactly one — and once per learner per target.
create table if not exists public.class_likes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  post_id    uuid references public.class_posts (id) on delete cascade,
  reply_id   uuid references public.class_replies (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint class_likes_one_target check ((post_id is null) <> (reply_id is null))
);

create index if not exists class_posts_class_idx on public.class_posts (class_id, created_at desc);
create index if not exists class_posts_author_idx on public.class_posts (author_id);
create index if not exists class_replies_post_idx on public.class_replies (post_id, created_at);
create index if not exists class_replies_author_idx on public.class_replies (author_id);
create unique index if not exists class_likes_user_post_uq on public.class_likes (user_id, post_id) where post_id is not null;
create unique index if not exists class_likes_user_reply_uq on public.class_likes (user_id, reply_id) where reply_id is not null;
create index if not exists class_likes_post_idx on public.class_likes (post_id) where post_id is not null;
create index if not exists class_likes_reply_idx on public.class_likes (reply_id) where reply_id is not null;

comment on table public.class_posts is
  'T-470 · 39 § 5 — a question on a class wall. ⛔ Readable only by members of its class;
   written only via post_question(), and only by the class opener (D-288).';
comment on table public.class_replies is
  'T-470 — a reply to a wall post. ⛔ Readable only by members of the post''s class;
   written only via add_reply().';
comment on table public.class_likes is
  'T-470 — a like on a post or a reply, one per learner per target. Written only via
   toggle_like(); ⛔ never on your own content.';

alter table public.class_posts enable row level security;
alter table public.class_replies enable row level security;
alter table public.class_likes enable row level security;

drop policy if exists class_posts_select_member on public.class_posts;
create policy class_posts_select_member on public.class_posts
  for select to authenticated
  using (exists (
    select 1 from public.class_members m
    where m.class_id = class_posts.class_id and m.user_id = (select auth.uid())
  ));

drop policy if exists class_replies_select_member on public.class_replies;
create policy class_replies_select_member on public.class_replies
  for select to authenticated
  using (exists (
    select 1 from public.class_posts p
    join public.class_members m on m.class_id = p.class_id
    where p.id = class_replies.post_id and m.user_id = (select auth.uid())
  ));

drop policy if exists class_likes_select_member on public.class_likes;
create policy class_likes_select_member on public.class_likes
  for select to authenticated
  using (exists (
    select 1 from public.class_posts p
    join public.class_members m on m.class_id = p.class_id
    where m.user_id = (select auth.uid())
      and p.id = coalesce(
        class_likes.post_id,
        (select r.post_id from public.class_replies r where r.id = class_likes.reply_id)
      )
  ));

create or replace function public.post_question(p_class_id uuid, p_body text)
returns table (id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_body   text := btrim(coalesce(p_body, ''));
  v_opener uuid;
  v_id     uuid;
  v_at     timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  -- ⛔ A class the caller is not in answers exactly like one that does not exist.
  select c.created_by into v_opener
  from public.classes c
  join public.class_members m on m.class_id = c.id and m.user_id = v_uid
  where c.id = p_class_id;
  if v_opener is null then
    raise exception 'class_not_found' using errcode = 'P0002';
  end if;
  if v_opener <> v_uid then
    raise exception 'only_class_opener' using errcode = '42501';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 120 then
    raise exception 'invalid_body' using errcode = '22023';
  end if;
  insert into public.class_posts as p (class_id, author_id, body_en)
  values (p_class_id, v_uid, v_body)
  returning p.id, p.created_at into v_id, v_at;
  return query select v_id, v_at;
end;
$$;

create or replace function public.add_reply(p_post_id uuid, p_body text)
returns table (id uuid, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_body text := btrim(coalesce(p_body, ''));
  v_id   uuid;
  v_at   timestamptz;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not exists (
    select 1 from public.class_posts p
    join public.class_members m on m.class_id = p.class_id and m.user_id = v_uid
    where p.id = p_post_id
  ) then
    raise exception 'post_not_found' using errcode = 'P0002';
  end if;
  if char_length(v_body) < 1 or char_length(v_body) > 120 then
    raise exception 'invalid_body' using errcode = '22023';
  end if;
  insert into public.class_replies as r (post_id, author_id, body_en)
  values (p_post_id, v_uid, v_body)
  returning r.id, r.created_at into v_id, v_at;
  return query select v_id, v_at;
end;
$$;

-- Flips the caller's like on ONE target and returns the new state and count.
create or replace function public.toggle_like(p_post_id uuid default null, p_reply_id uuid default null)
returns table (liked boolean, likes int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_author uuid;
  v_liked  boolean;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if (p_post_id is null) = (p_reply_id is null) then
    raise exception 'invalid_target' using errcode = '22023';
  end if;

  if p_post_id is not null then
    select p.author_id into v_author
    from public.class_posts p
    join public.class_members m on m.class_id = p.class_id and m.user_id = v_uid
    where p.id = p_post_id;
    if v_author is null then
      raise exception 'post_not_found' using errcode = 'P0002';
    end if;
  else
    select r.author_id into v_author
    from public.class_replies r
    join public.class_posts p on p.id = r.post_id
    join public.class_members m on m.class_id = p.class_id and m.user_id = v_uid
    where r.id = p_reply_id;
    if v_author is null then
      raise exception 'reply_not_found' using errcode = 'P0002';
    end if;
  end if;

  if v_author = v_uid then
    raise exception 'own_content' using errcode = '42501';
  end if;

  delete from public.class_likes l
  where l.user_id = v_uid
    and l.post_id is not distinct from p_post_id
    and l.reply_id is not distinct from p_reply_id;
  if found then
    v_liked := false;
  else
    insert into public.class_likes (user_id, post_id, reply_id) values (v_uid, p_post_id, p_reply_id);
    v_liked := true;
  end if;

  return query
    select v_liked,
           (select count(*)::int from public.class_likes l
            where l.post_id is not distinct from p_post_id
              and l.reply_id is not distinct from p_reply_id);
end;
$$;

revoke all on function public.post_question(uuid, text) from public, anon;
revoke all on function public.add_reply(uuid, text) from public, anon;
revoke all on function public.toggle_like(uuid, uuid) from public, anon;
grant execute on function public.post_question(uuid, text) to authenticated;
grant execute on function public.add_reply(uuid, text) to authenticated;
grant execute on function public.toggle_like(uuid, uuid) to authenticated;

commit;
