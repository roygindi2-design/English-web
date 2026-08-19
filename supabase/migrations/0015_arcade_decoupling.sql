-- 0015_arcade_decoupling.sql — «המילים שאספתי» (T-107 · D-052 · D-053 · D-062).
--
-- מוחל בעורך ה-SQL של Supabase (או `supabase db push`) אחרי 0014.
--
-- ⚠️ **מה שהקובץ הזה ⛔ אינו עושה, ולמה:** T-107 ביקשה עמודה `arcade_progress.game_level`.
-- `0014_arcade.sql` כבר מצהיר `arcade_level int not null default 1`, וזהו בדיוק אותו ציר —
-- שתי עמודות באותה משמעות הן מקור אמת שני (הלקח של D-034). ⇒ ⛔ אין כאן עמודה חדשה,
-- ו-`arcade_level` היא **רמת המשחק** לכל דבר. הפער נרשם כ-F-073 → PM.
--
-- ⛔ **הבידוד של D-052 נאכף כאן בסכמה:** אין בקובץ מפתח זר למנוע החזרה המרווחת, אין
-- טריגר, ואין אזכור של שדה לימודי כלשהו. הזירה אינה יכולה לגעת במנוע הזה גם אם קוד
-- עתידי ינסה — אין דרך מהסכמה הזאת לשם.
--
-- אידמפוטנטי: `create table if not exists`, וכל אילוץ בנפרד ובשם בתוך `do $$` —
-- `create table … check` מדולג **כולו** כשהטבלה כבר קיימת (נמדד C-0032).

begin;

-- ---------------------------------------------------------------------------
-- arcade_collected_words — שורה אחת ל(לומד, מילה). רשימה, ⛔ לא מנוע.
-- ---------------------------------------------------------------------------
create table if not exists public.arcade_collected_words (
  user_id           uuid not null references auth.users (id) on delete cascade,
  word_id           uuid not null references public.words (id) on delete cascade,
  first_seen_at     timestamptz not null default now(),
  times_missed      int not null default 0,
  times_correct     int not null default 0,
  hidden_by_learner boolean not null default false,
  primary key (user_id, word_id)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'arcade_collected_missed_check') then
    alter table public.arcade_collected_words
      add constraint arcade_collected_missed_check check (times_missed >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'arcade_collected_correct_check') then
    alter table public.arcade_collected_words
      add constraint arcade_collected_correct_check check (times_correct >= 0);
  end if;
end $$;

comment on table public.arcade_collected_words is
  'D-053: המילים שהלומד פגש בקרבות. ⛔ אין כאן SM-2, אין תזמון ואין רמת CEFR —
   «חזרה» היא לומד שפותח ומדפדף. ⛔ מילה כאן אינה נעלמת מהכרטיסיות ואינה מופיעה בהן.';

comment on column public.arcade_collected_words.times_correct is
  'D-062: «מילה ידועה» בתוך הזירה = ‏times_correct >= 3. ⛔ ההגדרה הזאת קיימת כאן
   ולא בצד הלימודי, כי D-052 אוסר על הזירה לקרוא את הסימון העצמי ואת מונה החזרות.';

-- הקריאה היחידה של T-110: (הלומד הזה, מה שלא הסתיר, החדש למעלה).
create index if not exists arcade_collected_user_seen_idx
  on public.arcade_collected_words (user_id, first_seen_at desc)
  where hidden_by_learner = false;

-- ---------------------------------------------------------------------------
-- RLS — בעלות עצמית. טבלה חדשה בלי RLS היא טבלה פתוחה לכל משתמש מזוהה.
-- ---------------------------------------------------------------------------
alter table public.arcade_collected_words enable row level security;

drop policy if exists "arcade_collected_select_own" on public.arcade_collected_words;
create policy "arcade_collected_select_own" on public.arcade_collected_words
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "arcade_collected_insert_own" on public.arcade_collected_words;
create policy "arcade_collected_insert_own" on public.arcade_collected_words
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "arcade_collected_update_own" on public.arcade_collected_words;
create policy "arcade_collected_update_own" on public.arcade_collected_words
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- הרשאות מפורשות. revoke קודם — grant לבדו הוא no-op מול default privileges,
-- ו-RLS ⛔ אינה חוסמת TRUNCATE.
-- ---------------------------------------------------------------------------
revoke all on public.arcade_collected_words from authenticated, anon;

grant select, insert, update on public.arcade_collected_words to authenticated;

-- ⛔ אין delete: «הסתרה» היא דגל (D-053), ⛔ ולא מחיקת שורה. מונה שנמחק אינו חוזר.
-- ⛔ anon אינו מקבל דבר.

commit;
