-- 0032_classes.sql — a closed class a learner can open, and join by a six-character code
-- (T-467 · `39 § 2` · `39 § 9`-3 · D-287).
--
-- `39 § 2`: the wall is a CLOSED class. ⛔ No search, ⛔ no public list, ⛔ no way to see a
-- class you are not in. ⇒ the two tables carry RLS that shows a learner ONLY their own
-- classes, and ⛔ no insert/update/delete policy at all: a class is created and joined
-- ONLY through `create_class(p_name)` and `join_class(p_code)` (`security definer`), which
-- return one row or raise an error by NAME.
--
-- Failure scenarios this closes (T-467): ⓐ any authenticated user runs
-- `select * from classes` and gets every code ⇒ the select policy is membership-only;
-- ⓑ a learner types `k7q2mz` for `K7Q2MZ` ⇒ `join_class` normalises exactly like
-- `lib/core/classCode.ts` (spaces out, upper case).
--
-- The alphabet is `lib/core/classCode.ts` `CLASS_CODE_ALPHABET` — ⛔ no 0/O, ⛔ no 1/I/L —
-- and `lib/core/classCode.test.ts` fails if the two drift. The draw uses
-- `gen_random_uuid()` bytes (core Postgres, cryptographically random) ⇒ ⛔ no extension.
--
-- ⚠️ Known and recorded, ⛔ not solved here: `join_class` has no rate limit. 31^6 ≈ 887M
-- codes; a guessing attack is a `auth_attempts`-style follow-up (0012), ⛔ not this row.
--
-- Down (manual — never re-run automatically):
--   drop function if exists public.join_class(text);
--   drop function if exists public.create_class(text);
--   drop table if exists public.class_members;
--   drop table if exists public.classes;
--
-- Idempotent: `create … if not exists`, `create or replace`, policies dropped and recreated.

begin;

create table if not exists public.classes (
  id         uuid primary key default gen_random_uuid(),
  code       char(6) not null unique,
  name       text not null check (char_length(btrim(name)) between 1 and 60),
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.class_members (
  class_id  uuid not null references public.classes (id) on delete cascade,
  user_id   uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, user_id)
);

create index if not exists class_members_user_idx on public.class_members (user_id);

comment on table public.classes is
  'T-467 · 39 § 2 — a closed class. ⛔ Visible only to its members; created only via
   create_class(). ⛔ No public list and ⛔ no search, by design.';
comment on table public.class_members is
  'T-467 — who is in which class. A learner reads only their own rows; joined only via
   join_class().';

alter table public.classes enable row level security;
alter table public.class_members enable row level security;

-- ⛔ Membership-only. The subquery reads class_members under ITS policy (own rows only),
-- so there is ⛔ no recursion and ⛔ no way to learn another class's code.
drop policy if exists classes_select_member on public.classes;
create policy classes_select_member on public.classes
  for select to authenticated
  using (exists (
    select 1 from public.class_members m
    where m.class_id = classes.id and m.user_id = auth.uid()
  ));

drop policy if exists class_members_select_own on public.class_members;
create policy class_members_select_own on public.class_members
  for select to authenticated
  using (user_id = auth.uid());

create or replace function public.create_class(p_name text)
returns table (code text, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_name     text := btrim(coalesce(p_name, ''));
  v_alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_bytes    bytea;
  v_code     text;
  v_id       uuid;
  v_try      int := 0;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 60 then
    raise exception 'invalid_name' using errcode = '22023';
  end if;

  loop
    v_try := v_try + 1;
    v_bytes := uuid_send(gen_random_uuid());
    v_code := '';
    for i in 0..5 loop
      v_code := v_code || substr(v_alphabet, 1 + (get_byte(v_bytes, i) % 31), 1);
    end loop;
    begin
      insert into public.classes (code, name, created_by)
      values (v_code, v_name, v_uid)
      returning id into v_id;
      exit;
    exception when unique_violation then
      if v_try >= 5 then
        raise exception 'code_space_exhausted' using errcode = '53000';
      end if;
    end;
  end loop;

  insert into public.class_members (class_id, user_id) values (v_id, v_uid);
  return query select v_code, v_name;
end;
$$;

create or replace function public.join_class(p_code text)
returns table (code text, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_code text := upper(regexp_replace(coalesce(p_code, ''), '\s+', '', 'g'));
  v_id   uuid;
  v_name text;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  select c.id, c.name into v_id, v_name from public.classes c where c.code = v_code;
  if v_id is null then
    raise exception 'class_not_found' using errcode = 'P0002';
  end if;
  insert into public.class_members (class_id, user_id) values (v_id, v_uid)
  on conflict (class_id, user_id) do nothing;
  return query select v_code, v_name;
end;
$$;

revoke all on function public.create_class(text) from public, anon;
revoke all on function public.join_class(text) from public, anon;
grant execute on function public.create_class(text) to authenticated;
grant execute on function public.join_class(text) to authenticated;

commit;
