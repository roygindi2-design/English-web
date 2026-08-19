-- 0014_arcade.sql — שתי הטבלאות של זירת הקרב (T-092 · § 4.2י · D-044).
--
-- מוחל בעורך ה-SQL של Supabase (או `supabase db push`) אחרי 0013. עד שיוחל,
-- `GET /api/arcade/round` ו-`POST /api/arcade/result` עונים 503 מוסבר בעברית
-- ⛔ ולא מסך ריק (§ 4.2י, «הסכמה לא הורצה ⇒ 503 בעברית»).
--
-- ⛔ **הגבול של D-044 נאכף כאן בסכמה, ⛔ ולא רק בקוד:** אין בקובץ הזה ולו מפתח זר
-- אחד ל-`word_progress`, ואין בו ולו טריגר אחד. הזירה ⛔ אינה יכולה לגעת במנוע
-- החזרה המרווחת גם אם קוד עתידי ינסה — אין דרך מהסכמה הזאת לשם.
--
-- אידמפוטנטי: `create table if not exists` לאורך הקובץ, וכל אילוץ מוצהר בנפרד
-- ובשם בתוך `do $$` — `create table … check` מדולג **כולו** כשהטבלה כבר קיימת,
-- ופרויקט שהריץ טיוטה מוקדמת היה נשאר בלי האילוץ בשקט (נמדד C-0032).
--
-- ⚠️ RLS **כן** מוצהרת כאן, ופעם אחת: שתי הטבלאות **חדשות**. האיסור ב-0013 היה על
-- הצהרה **חוזרת** על טבלה קיימת (מדיניות שנייה מ-OR'ד עם הראשונה ולכן יכולה רק
-- להרחיב גישה). טבלה חדשה בלי RLS היא טבלה פתוחה לכל משתמש מזוהה.

begin;

-- ---------------------------------------------------------------------------
-- arcade_progress — שורה אחת ללומד. המצב המתמיד של הזירה, ותו לא.
-- ---------------------------------------------------------------------------
create table if not exists public.arcade_progress (
  user_id        uuid primary key references auth.users (id) on delete cascade,
  arcade_level   int  not null default 1,
  wins           int  not null default 0,
  unlocked_items text[] not null default '{}'::text[],
  avatar_parts   jsonb  not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'arcade_progress_level_check') then
    alter table public.arcade_progress
      add constraint arcade_progress_level_check check (arcade_level >= 1);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'arcade_progress_wins_check') then
    alter table public.arcade_progress
      add constraint arcade_progress_wins_check check (wins >= 0);
  end if;
end $$;

comment on table public.arcade_progress is
  'D-044 · § 4.2י: מצב הזירה של לומד אחד. ⛔ אינו נקרא ואינו נכתב על ידי מנוע
   החזרה המרווחת, ⛔ ואינו משנה את הרמה הלימודית שהלומד בחר לעצמו בפרופיל.';

comment on column public.arcade_progress.unlocked_items is
  'D-046 · § 4.2י: הפריטים שנפתחו בניצחונות. מערך טקסט ⛔ ולא טבלה — פריט הוא
   מזהה קבוע מרשימה סגורה בקוד, ⛔ לא ישות עם מחזור חיים.';

-- ---------------------------------------------------------------------------
-- arcade_runs — שורה אחת לקרב. סיכום, ⛔ לא יומן תשובות.
-- ---------------------------------------------------------------------------
create table if not exists public.arcade_runs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  finished_at    timestamptz not null default now(),
  words_seen     int  not null,
  words_correct  int  not null,
  enemy_defeated boolean not null
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'arcade_runs_counts_check') then
    alter table public.arcade_runs
      add constraint arcade_runs_counts_check
      check (words_seen >= 0 and words_correct >= 0 and words_correct <= words_seen);
  end if;
end $$;

comment on table public.arcade_runs is
  '§ 4.2י: סיכום קרב. ⛔ אין כאן word_id ואין תשובה בודדת — «המילים שהפילו אותך»
   (D-047) הוא תצוגה בזיכרון במסך הסיום, ⛔ ואינו נשמר.';

-- הקריאה היחידה: (הלומד הזה, הקרבות שלו לפי זמן).
create index if not exists arcade_runs_user_finished_idx
  on public.arcade_runs (user_id, finished_at desc);

-- ---------------------------------------------------------------------------
-- RLS — בעלות עצמית, פעם אחת, על שתי טבלאות חדשות.
-- ---------------------------------------------------------------------------
alter table public.arcade_progress enable row level security;
alter table public.arcade_runs     enable row level security;

drop policy if exists "arcade_progress_select_own" on public.arcade_progress;
create policy "arcade_progress_select_own" on public.arcade_progress
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "arcade_progress_insert_own" on public.arcade_progress;
create policy "arcade_progress_insert_own" on public.arcade_progress
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "arcade_progress_update_own" on public.arcade_progress;
create policy "arcade_progress_update_own" on public.arcade_progress
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "arcade_runs_select_own" on public.arcade_runs;
create policy "arcade_runs_select_own" on public.arcade_runs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "arcade_runs_insert_own" on public.arcade_runs;
create policy "arcade_runs_insert_own" on public.arcade_runs
  for insert to authenticated with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- הרשאות מפורשות. Supabase נותנת ALL ל-anon ול-authenticated דרך default
-- privileges, ולכן `grant` לבדו הוא no-op ו-RLS נשאר ההגנה היחידה — ו-RLS ⛔ אינה
-- חוסמת TRUNCATE. revoke קודם, ואז בדיוק הפעלים שהמדיניות למעלה מתירה.
-- ---------------------------------------------------------------------------
revoke all on public.arcade_progress, public.arcade_runs from authenticated, anon;

grant select, insert, update on public.arcade_progress to authenticated;
grant select, insert          on public.arcade_runs     to authenticated;

-- ⛔ arcade_runs אינה מקבלת update: קרב שנגמר נגמר. תיקון של שורה שנכתבה הוא
-- שכתוב היסטוריה, ⛔ ואין לו מקרה שימוש במוצר.
-- ⛔ anon אינו מקבל דבר.

commit;
