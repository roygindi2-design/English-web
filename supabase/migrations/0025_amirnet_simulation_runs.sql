-- 0025_amirnet_simulation_runs.sql — התמדת השלמת הסימולציה (T-309 · `41 § 7` · D-163).
--
-- Applied through the Supabase MCP connector (`apply_migration`) by the DEV tick that
-- builds T-309, and ⛔ never left for Roy (D-163). Verified after apply by a count query.
--
-- 🔴 **מה זה סוגר, ⛔ ולא תיאור כללי.** נמדד C-0549 ושוב בטיק הזה:
-- `grep -rn "simulation" supabase/migrations/` החזיר **0** ⇒ ⛔ אין בקלון הזה טבלה, עמודה או
-- נתיב שזוכר איזו רמת סימולציה לומד השלים. ‏`T-307` מסר את ארבעת הכרטיסים ואת מצב הנעילה
-- **כמצגת בלבד**, ו-`app/(tabs)/world/amirnet/simulation/page.tsx` העביר `unlockedThrough={1}`
-- כקבוע. ⇒ לומד שסיים רמה 3, סגר את האפליקציה וחזר — מצא את רמה 4 נעולה, בלי שדבר אומר לו למה.
--
-- ⛔ **שורה לכל ריצה, ⛔ ולא «הרמה הגבוהה ביותר» בעמודה אחת.** «מה הלומד עשה» הוא עובדה;
-- «מה נפתח לו» הוא **גזירה** ממנה, והיא חיה ב-`lib/core/amirnetLevels.ts` `highestUnlocked()`
-- — פונקציה טהורה, ⛔ לא שאילתה בתוך המסך (`T-309`ⓑ). ⇒ כלל הפתיחה ניתן לשינוי בלי מיגרציה,
-- ו«כמה ריצות סיימתי ברמה הזאת» (`T-312`) נקרא **מאותן שורות**, ⛔ בלי שאילתה שנייה.
--
-- ⛔ **אפס ציון, אפס אומדן, אפס דירוג** — `41 § 9.2` מוסר את נוסחת הציון לרוי, ועמודת ציון
-- כאן הייתה מזמינה סטטיסטיקה מומצאת. הטבלה אומרת **שהריצה הושלמה**, ⛔ ולא כמה טוב.
-- ⛔ **אפס מפתח זר ל-`word_progress` ולזירה** (`R-020` · `37 § 13.1`) — סימולציית אמירנט היא
-- חומר מבחן, ⛔ ולא מצב אוצר המילים של הלומד. הגבול נאכף כאן ב**היעדר**.
-- ⛔ **אפס `update` ואפס `delete`** — ריצה שהושלמה ⛔ אינה נמחקת ו⛔ אינה משוכתבת; היסטוריה
-- שהלקוח יכול לערוך ⛔ אינה היסטוריה.
--
-- Down (manual — this file's statements are never re-run automatically by
-- `supabase db push`; apply by hand if this ever needs reverting):
--   drop table if exists public.amirnet_simulation_runs;
--
-- Idempotent: `create table if not exists`, every constraint named and added separately
-- inside `do $$` (C-0032 — `create table … check` is skipped wholesale when the table exists).

begin;

create table if not exists public.amirnet_simulation_runs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid     not null references auth.users (id) on delete cascade,
  level        smallint not null,
  completed_at timestamptz not null default now()
);

do $$
begin
  -- ⛔ ארבע רמות, ⛔ ולא שש (`41 § 4`) — אותה גדר בדיוק כמו `amirnet_items_level_check`.
  -- המספר חי בשני מקומות בכוונה: הנתיב דוחה לפני הכתיבה, האילוץ דוחה שורה שעקפה אותו.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_simulation_runs_level_check') then
    alter table public.amirnet_simulation_runs
      add constraint amirnet_simulation_runs_level_check check (level between 1 and 4);
  end if;
end $$;

comment on table public.amirnet_simulation_runs is
  '41 § 7 · T-309 — one row per COMPLETED simulation run. ⛔ Not a score and ⛔ not a ranking
   (41 § 9.2 is Roy''s): the row says the run finished, ⛔ never how well. Which level is open
   is derived from these rows by lib/core/amirnetLevels.ts highestUnlocked(), ⛔ never stored.';
comment on column public.amirnet_simulation_runs.level is
  '41 § 4 — 1-4, the level the learner actually ran. Completing N opens N+1 (41 § 7), and that
   rule lives in the pure layer, ⛔ not in this column.';
comment on column public.amirnet_simulation_runs.completed_at is
  'When the run reached its last chapter. ⛔ A run that was abandoned writes ⛔ no row at all.';

-- The only read the unlock makes: this learner's rows, newest first.
create index if not exists amirnet_simulation_runs_user_completed_idx
  on public.amirnet_simulation_runs (user_id, completed_at desc);

alter table public.amirnet_simulation_runs enable row level security;

-- Self-contained `auth.uid() = user_id` policies — the 0007/0023 reasoning: a policy that
-- inherits a parent filter can be voided silently.
drop policy if exists "amirnet_simulation_runs_select_own" on public.amirnet_simulation_runs;
create policy "amirnet_simulation_runs_select_own" on public.amirnet_simulation_runs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "amirnet_simulation_runs_insert_own" on public.amirnet_simulation_runs;
create policy "amirnet_simulation_runs_insert_own" on public.amirnet_simulation_runs
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.amirnet_simulation_runs from authenticated, anon;
grant select, insert on public.amirnet_simulation_runs to authenticated;
-- ⛔ No update · delete: a finished run is a fact, ⛔ not a draft.

commit;
