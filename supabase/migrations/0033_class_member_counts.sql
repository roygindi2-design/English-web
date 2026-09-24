-- 0033_class_member_counts.sql — the member count the class routes need (T-468 · `39 § 2`).
--
-- `T-468`ⓐ: `POST /api/world/classes/join` returns `{name, members}` and
-- `GET /api/world/classes/mine` returns the learner's class. ⛔ Neither can be read through
-- RLS: `0032` shows a learner ONLY their own `class_members` row (by design — `39 § 2`,
-- ⛔ no list of who else is in a class), so `count(*)` from the route would always say 1.
-- ⇒ the count is computed INSIDE `security definer` functions and only a NUMBER leaves —
-- ⛔ never a user id, ⛔ never another class.
--
-- ⛔ A new file, ⛔ not an edit to 0032: 0032 is applied (C-0796). `join_class` changes its
-- return type ⇒ Postgres needs `drop` + `create`, ⛔ `create or replace` refuses.
--
-- Down (manual):
--   drop function if exists public.my_class();
--   then re-run the `join_class` block of 0032.

begin;

drop function if exists public.join_class(text);

create function public.join_class(p_code text)
returns table (code text, name text, members int)
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
  return query
    select v_code, v_name, (select count(*)::int from public.class_members m where m.class_id = v_id);
end;
$$;

-- The learner's class — the most recently joined one — or ⛔ no row. `39 § 9`-3 builds one
-- class per learner; a second join is kept, and «mine» is the newest.
create or replace function public.my_class()
returns table (code text, name text, members int)
language sql
stable
security definer
set search_path = public
as $$
  select c.code::text, c.name,
         (select count(*)::int from public.class_members x where x.class_id = c.id)
  from public.class_members m
  join public.classes c on c.id = m.class_id
  where m.user_id = auth.uid()
  order by m.joined_at desc
  limit 1;
$$;

revoke all on function public.join_class(text) from public, anon;
revoke all on function public.my_class() from public, anon;
grant execute on function public.join_class(text) to authenticated;
grant execute on function public.my_class() to authenticated;

commit;
