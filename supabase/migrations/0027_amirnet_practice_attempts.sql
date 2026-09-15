-- 0027_amirnet_practice_attempts.sql — תשובת התרגול הממוקד נכתבת (T-372ⓐ · `41 § 8` · D-163).
--
-- Applied through the Supabase MCP connector (`apply_migration`) by the DEV tick that builds
-- T-372, and ⛔ never left for Roy (D-163). Verified after apply by reading the table back.
--
-- 🔴 **מה זה סוגר, ⛔ ולא תיאור כללי.** נמדד C-0633: `grep` על `app/api/amirnet/` החזיר **שני**
-- נתיבים, `practice` (קריאה בלבד) ו-`simulation`, וה-`insert` היחיד בכל המחלקה היה
-- `app/api/amirnet/simulation/runs/route.ts:104` אל `amirnet_simulation_runs`. ⇒ **תשובה בתרגול
-- הממוקד ⛔ לא נכתבה לשום מקום**, ו-`app/(tabs)/world/amirnet/page.tsx:21` קרא `zeroStats()`
-- כקבוע ⇒ הכותרת «ביצועים לפי סוג שאלה» דיווחה לנצח על נתון ש⛔ לא נאסף.
-- ⛔ **וזה ⛔ אינו `F-222`:** `F-222` חסמה את **סכמת הפריט**, ו-`T-297` ✅ פתחה אותה
-- (`0024_amirnet_items.sql`). מה שחסר היה הצד השני — **תוצאת הלומד**.
--
-- ⛔ **שורה לכל תשובה, ⛔ ולא «אחוז ההצלחה» בעמודה אחת.** «מה הלומד ענה» הוא עובדה; «כמה טוב
-- הוא בסוג הזה» הוא **גזירה** ממנה, והיא חיה ב-`lib/core/amirnetAttempts.ts` `toTypeStats()`
-- ומשם ב-`toTypeCards()` — פונקציות טהורות עם בדיקה משלהן, ⛔ לא שאילתת `avg` בתוך המסך.
-- ⇒ כלל התצוגה ניתן לשינוי בלי מיגרציה, ו«כמה ענית בסוג הזה» נקרא **מאותן שורות**.
--
-- ⛔ **אפס מפתח זר ל-`amirnet_items`, ⛔ וזו החלטה ⛔ ולא השמטה.** `item_id` נשמר כעובדה על מה
-- שהלומד ראה; `on delete cascade` היה **מוחק את ההיסטוריה שלו** ברגע שמאגר הפריטים נטען מחדש
-- (`T-324`/`0026` עדיין פתוחה), ו-`on delete set null` היה הופך עמודה `not null` לנקבובית.
-- ⇒ אותו היגיון בדיוק כמו `0025`: היסטוריה ש**תוכן** יכול למחוק ⛔ אינה היסטוריה.
-- ⛔ **אפס מפתח זר ל-`word_progress` ולזירה** (`R-020` · `37 § 13.1`) — תרגול אמירנט הוא חומר
-- מבחן, ⛔ ולא מצב אוצר המילים של הלומד. הגבול נאכף כאן ב**היעדר**.
-- ⛔ **אפס ציון, אפס אומדן, אפס דירוג** (`D-050`; נוסחת הציון היא של רוי, `41 § 9.2`) —
-- ⛔ ואפס עמודת זמן־תגובה: `41 § 7` נותן ללומד את זמן התגובה **על המסך**, ו-`R-020` אוסר ניקוד
-- לפי זמן מחוץ לזירה ⇒ עמודה כזאת הייתה מזמינה בדיוק את הניקוד שהיא אוסרת.
-- ⛔ **אפס `update` ואפס `delete`** — תשובה שניתנה ⛔ אינה נמחקת ו⛔ אינה משוכתבת.
--
-- Down (manual — this file's statements are never re-run automatically by
-- `supabase db push`; apply by hand if this ever needs reverting):
--   drop table if exists public.amirnet_practice_attempts;
--
-- Idempotent: `create table if not exists`, every constraint named and added separately
-- inside `do $$` (C-0032 — `create table … check` is skipped wholesale when the table exists).

begin;

create table if not exists public.amirnet_practice_attempts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid     not null references auth.users (id) on delete cascade,
  item_id    uuid     not null,
  type       text     not null,
  level      smallint not null,
  correct    boolean  not null,
  created_at timestamptz not null default now()
);

do $$
begin
  -- ⛔ שלושת סוגי השאלה, ⛔ ולא רשימה פתוחה — אותה גדר בדיוק כמו `amirnet_items_type_check`.
  -- המספר חי בשני מקומות בכוונה: הנתיב דוחה לפני הכתיבה, האילוץ דוחה שורה שעקפה אותו.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_practice_attempts_type_check') then
    alter table public.amirnet_practice_attempts
      add constraint amirnet_practice_attempts_type_check check (type in ('sc', 'rs', 'rc'));
  end if;

  -- ⛔ ארבע רמות, ⛔ ולא שש (`41 § 6.2`) — כמו `amirnet_items_level_check` ו-`0025`.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_practice_attempts_level_check') then
    alter table public.amirnet_practice_attempts
      add constraint amirnet_practice_attempts_level_check check (level between 1 and 4);
  end if;
end $$;

comment on table public.amirnet_practice_attempts is
  '41 § 8 · T-372 — one row per ANSWERED practice question. ⛔ Not a score and ⛔ not a ranking
   (41 § 9.2 is Roy''s): the row says what was answered and whether it was right, ⛔ never how
   good the learner is. The per-type percentage is derived from these rows by
   lib/core/amirnetAttempts.ts toTypeStats(), ⛔ never stored.';
comment on column public.amirnet_practice_attempts.item_id is
  'The amirnet_items row the learner answered. ⛔ Deliberately NOT a foreign key: a content
   reload (0026 · T-324) must ⛔ never delete a learner''s answer history.';
comment on column public.amirnet_practice_attempts.type is
  '41 § 6.2 — sc · rs · rc. Denormalised from the item on purpose: the dashboard groups by type,
   and a join to the bank to paint three cards is a join the bank''s own churn can break.';
comment on column public.amirnet_practice_attempts.correct is
  'Whether the chosen option was the item''s correct_index. ⛔ No partial credit and ⛔ no weight —
   feedbackFor() (lib/core/amirnetQuestion.ts) already decided, and it decides once.';

-- The only read the dashboard makes: this learner's rows.
create index if not exists amirnet_practice_attempts_user_idx
  on public.amirnet_practice_attempts (user_id, created_at desc);

alter table public.amirnet_practice_attempts enable row level security;

-- Self-contained `auth.uid() = user_id` policies — the 0007/0023/0025 reasoning: a policy that
-- inherits a parent filter can be voided silently.
drop policy if exists "amirnet_practice_attempts_select_own" on public.amirnet_practice_attempts;
create policy "amirnet_practice_attempts_select_own" on public.amirnet_practice_attempts
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "amirnet_practice_attempts_insert_own" on public.amirnet_practice_attempts;
create policy "amirnet_practice_attempts_insert_own" on public.amirnet_practice_attempts
  for insert to authenticated with check (auth.uid() = user_id);

revoke all on public.amirnet_practice_attempts from authenticated, anon;
grant select, insert on public.amirnet_practice_attempts to authenticated;
-- ⛔ No update · delete: an answer that was given is a fact, ⛔ not a draft.

commit;
