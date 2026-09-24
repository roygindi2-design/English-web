-- 0039 — a wall question may carry a picture (T-485 · D-291 · `39 § 5`).
--
-- «ואופציונלית תמונה שהמורה שואל עליה» (`39 § 5`) ⇒ a KEY into a closed gallery of eight
-- drawn scenes (`lib/core/wallFeed.ts` `WALL_PICTURE_KEYS`, drawn by
-- `components/WallPicture.tsx`). ⛔ No upload, ⛔ no URL, ⛔ no storage bucket (D-291).
--
-- ⚠️ The number: 0037/0038 are reserved for T-476/T-477 (blocked on for-roy 144) ⇒ 0039.
-- ⚠️ The row wrote `class_wall_posts`; the table 0034 created is `class_posts` — this
--    migration uses the real name.
--
--   class_posts.picture_key text null, check (in the eight keys)
--   set_post_picture(p_post_id, p_key)   ⛔ only the opener of THAT post's class;
--                                        p_key null ⇒ clears the picture
--
-- A SEPARATE function, ⛔ not a new `post_question` signature: T-476 redefines
-- `post_question` in 0037, and two migrations rewriting one function is a merge hazard.
--
-- Failure scenario this closes: a member who is ⛔ not the opener calls
-- `/rest/v1/rpc/set_post_picture` on the teacher's post ⇒ `42501 only_class_opener`, and
-- the picture the whole class sees stays the teacher's. A key outside the gallery ⇒ 23514.
--
-- Errors, by NAME, for `lib/server/classFailure.ts`:
--   28000 not_authenticated · P0002 post_not_found · 42501 only_class_opener · 23514 (check)
--
-- Down (manual — never re-run automatically):
--   drop function if exists public.set_post_picture(uuid, text);
--   alter table public.class_posts drop constraint if exists class_posts_picture_key_check;
--   alter table public.class_posts drop column if exists picture_key;
--
-- Idempotent: `add column if not exists`, the constraint dropped and recreated,
-- `create or replace`.

begin;

alter table public.class_posts add column if not exists picture_key text null;

alter table public.class_posts drop constraint if exists class_posts_picture_key_check;
alter table public.class_posts add constraint class_posts_picture_key_check
  check (picture_key is null or picture_key in ('mountains','beach','classroom','market','park','kitchen','city','rain'));

create or replace function public.set_post_picture(p_post_id uuid, p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_opener uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  -- ⛔ A post in a class the caller is not in answers exactly like one that does not exist.
  select c.created_by into v_opener
  from public.class_posts p
  join public.classes c on c.id = p.class_id
  join public.class_members m on m.class_id = c.id and m.user_id = v_uid
  where p.id = p_post_id;
  if v_opener is null then
    raise exception 'post_not_found' using errcode = 'P0002';
  end if;
  if v_opener <> v_uid then
    raise exception 'only_class_opener' using errcode = '42501';
  end if;
  update public.class_posts set picture_key = p_key where id = p_post_id;
end;
$$;

revoke all on function public.set_post_picture(uuid, text) from public, anon;
grant execute on function public.set_post_picture(uuid, text) to authenticated;

commit;
