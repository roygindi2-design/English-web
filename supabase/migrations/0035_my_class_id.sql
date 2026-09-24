-- 0035_my_class_id.sql — `my_class()` also returns the class id (T-473 · `39 § 5`).
--
-- The wall routes are `/api/world/classes/[id]/wall` (T-471), and until now ⛔ nothing gave
-- the client that id: `my_class()` (0033) returned code · name · members only. The id is
-- ⛔ not a secret from a member — `classes_select_member` (0032) already lets them read it —
-- but a route reading the table directly is what `app/api/world/classes/route.test.ts`
-- forbids, so it travels out of the same `security definer` function.
--
-- ⛔ A new file, ⛔ not an edit to 0033 (applied). The return type changes ⇒ drop + create.
--
-- Down (manual): re-run the `my_class` block of 0033 after `drop function public.my_class();`.

begin;

drop function if exists public.my_class();

create function public.my_class()
returns table (id uuid, code text, name text, members int)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.code::text, c.name,
         (select count(*)::int from public.class_members x where x.class_id = c.id)
  from public.class_members m
  join public.classes c on c.id = m.class_id
  where m.user_id = auth.uid()
  order by m.joined_at desc
  limit 1;
$$;

revoke all on function public.my_class() from public, anon;
grant execute on function public.my_class() to authenticated;

commit;
