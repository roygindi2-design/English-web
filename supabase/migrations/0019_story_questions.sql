-- 0019_story_questions.sql — שאלת ההבנה של הסיפור (T-188 · `36 § 7` · D-108א).
--
-- מוחל ב-`supabase db push` אחרי 0018.
--
-- ⛔ **טבלה משלה, ⛔ ולא עמודות על `stories`** — וזה נימוק, ⛔ לא סידור: סיפור בלי
-- שאלה חייב להישאר **קריא**. עמודה `not null` על `stories` הייתה חוסמת קליטת סיפור,
-- ועמודה nullable הייתה הופכת «יש שאלה» למצב שכל קורא של הטבלה צריך לבדוק.
-- ⚠️ ההערה על `public.stories` («⛔ אין כאן שאלה») נכתבה **לפני** ש-`36 § 7` נסגר;
-- `36 § 1` קובע ש-36 גובר, וההפרדה הזאת היא מה שמשאיר את שתי האמירות נכונות.
--
-- ⛔ **תוכן AI מסומן תמיד** (§ 7.6): `origin` הוא not null עם `check` בשם מול
-- `'generated'` בלבד — בדיוק כמו 0018.
--
-- ⛔ **הלקוח ⛔ אינו כותב**: RLS מרשה `select` בלבד, ו-`grant` נוקב בפועל אחד.
-- קליטה נעשית בקובץ seed (`supabase/seed/0005_story_questions.sql`), כמו 0001 ו-0003.
--
-- ⛔ **אפס ציון ואפס מונה נכונות** (`36 § 7`): ⛔ אין כאן עמודת תשובה של לומד,
-- ⛔ אין `attempts` ו⛔ אין `score`. המשוב חי במסך, ⛔ ואינו נשמר.
--
-- אידמפוטנטי: `create table if not exists`, וכל אילוץ **בשם ובנפרד** בתוך `do $$` —
-- `create table … check` מדולג **כולו** כשהטבלה כבר קיימת (נמדד C-0032).

begin;

create table if not exists public.story_questions (
  id            uuid primary key default gen_random_uuid(),
  story_id      uuid not null references public.stories (id) on delete cascade,
  question_en   text not null,
  answers_he    text[] not null,
  correct_index int not null,
  origin        text not null,
  created_at    timestamptz not null default now(),
  unique (story_id)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'story_questions_origin_check') then
    alter table public.story_questions
      add constraint story_questions_origin_check
      check (origin = 'generated');
  end if;
  -- ANSWERS_PER_QUESTION = 3 (`lib/core/storyQuestionGate.ts`). ⛔ המספר חי בשני
  -- מקומות ובכוונה: השער פוסל לפני הכתיבה, והאילוץ פוסל שורה שעקפה את השער.
  if not exists (select 1 from pg_constraint where conname = 'story_questions_answers_check') then
    alter table public.story_questions
      add constraint story_questions_answers_check
      check (array_length(answers_he, 1) = 3);
  end if;
  -- ⛔ אינדקס מחוץ לתחום הוא שאלה בלי תשובה נכונה — ⛔ ולא «ברירת מחדל 0».
  if not exists (select 1 from pg_constraint where conname = 'story_questions_index_check') then
    alter table public.story_questions
      add constraint story_questions_index_check
      check (correct_index >= 0 and correct_index < array_length(answers_he, 1));
  end if;
end $$;

comment on table public.story_questions is
  '§ 36 § 7 · D-108א: שאלת הבנה אחת לסיפור. השאלה באנגלית, שלוש התשובות בעברית.
   ⛔ אין כאן ציון, ⛔ אין מונה נכונות ו⛔ אין תשובה של לומד — המשוב חי במסך בלבד.';

comment on column public.story_questions.origin is
  '§ 7.6: תוכן AI מסומן **תמיד**. הערך היחיד המותר הוא generated, ⛔ ואין ערך
   ברירת מחדל — שורה בלי מקור מוצהר ⛔ אינה נכתבת.';

comment on column public.story_questions.correct_index is
  'אינדקס מבוסס-אפס לתוך answers_he **כפי שנכתב**. ⛔ סדר התצוגה ⛔ אינו נקבע כאן —
   `lib/core/storyQuestion.ts` מערבב דטרמיניסטית לפי מזהה הסיפור, כדי שהתשובה
   הנכונה ⛔ לא תשב באותו מקום בכל הסיפורים.';

-- הקריאה היחידה של המסך: (הסיפור שנבחר) ⇒ השאלה שלו.
create index if not exists story_questions_story_idx
  on public.story_questions (story_id);

alter table public.story_questions enable row level security;

drop policy if exists "story_questions_select_all" on public.story_questions;
create policy "story_questions_select_all" on public.story_questions
  for select to authenticated using (true);

-- Supabase נותנת ALL ל-anon ול-authenticated דרך default privileges, ולכן `grant`
-- לבדו הוא no-op ו-RLS נשארת ההגנה היחידה — ו-RLS ⛔ אינה חוסמת TRUNCATE.
revoke all on public.story_questions from authenticated, anon;

grant select on public.story_questions to authenticated;
-- ⛔ אין insert · update · delete: הקליטה היא קובץ seed, ⛔ ולא פעולת לקוח.
-- ⛔ anon אינו מקבל דבר.

commit;
