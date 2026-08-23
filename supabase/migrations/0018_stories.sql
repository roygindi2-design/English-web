-- 0018_stories.sql — טבלת «סיפור» אחת (T-134ⓐ · § 4.2יג · D-073).
--
-- מוחל בעורך ה-SQL של Supabase (או `supabase db push`) אחרי 0017.
--
-- ⛔ **תוכן AI אינו מקור פדגוגי ולעולם מסומן** (§ 7.6): `origin` הוא not null עם
-- `check` בשם מול `'generated'` בלבד. סיפור הוא **הקשר לתרגול**, ⛔ ולא ידע.
--
-- ⛔ **ארבע רמות, ⛔ ולא שש** (R-021): C1 ו-C2 מודדות אפס מילים בבנק, ולכן סיפור
-- ברמה כזאת הוא שורה שאין לה ולו לומד אחד שיכול לקרוא אותה.
--
-- ⛔ **אין כאן ולו מפתח זר אחד לזירה** (D-054): הספרייה 🔗 מצומדת לצד הלימודי,
-- והמילה שהוקשה בסיפור נכתבת ל-`word_progress` דרך מסלול הכרטיסייה — ⛔ ⛔ לא
-- לטבלאות הזירה. הגבול נאכף כאן בהיעדר, ⛔ ולא רק בקוד.
--
-- ⛔ **הלקוח ⛔ אינו כותב**: RLS מרשה `select` בלבד, ו-`grant` נוקב בפועל אחד.
-- קליטה נעשית בקובץ seed שרוי מריץ, בדיוק כמו 0001 ו-0003.
--
-- אידמפוטנטי: `create table if not exists`, וכל אילוץ **בשם ובנפרד** בתוך `do $$` —
-- `create table … check` מדולג **כולו** כשהטבלה כבר קיימת (נמדד C-0032).

begin;

create table if not exists public.stories (
  id         uuid primary key default gen_random_uuid(),
  cefr_level text not null,
  title_en   text not null,
  body_en    text not null,
  origin     text not null,
  created_at timestamptz not null default now(),
  unique (cefr_level, title_en)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'stories_level_check') then
    alter table public.stories
      add constraint stories_level_check
      check (cefr_level in ('A1', 'A2', 'B1', 'B2'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'stories_origin_check') then
    alter table public.stories
      add constraint stories_origin_check
      check (origin = 'generated');
  end if;
end $$;

comment on table public.stories is
  '§ 4.2יג · D-073: סיפור קצר אחד, מיוצר אצלנו. ⛔ אינו מקור פדגוגי (§ 7.6) —
   הוא ההקשר שהכרטיסייה ⛔ אינה מספקת. ⛔ אין כאן שאלה, ציון או תשובה נכונה.';

comment on column public.stories.origin is
  '§ 7.6: תוכן AI מסומן **תמיד**. הערך היחיד המותר הוא generated, ⛔ ואין ערך
   ברירת מחדל — שורה בלי מקור מוצהר ⛔ אינה נכתבת.';

comment on column public.stories.cefr_level is
  'R-021: ארבע רמות בלבד. C1/C2 מודדות אפס מילים בבנק ⇒ סיפור כזה ⛔ אינו קריא
   לאף לומד. ⛔ זו ⛔ אינה senses.cefr_level ו⛔ אינה words.cefr_profile_band.';

-- הקריאה היחידה של המסך: (הרמה של הלומד, הסיפורים בה לפי זמן).
create index if not exists stories_level_created_idx
  on public.stories (cefr_level, created_at desc);

alter table public.stories enable row level security;

drop policy if exists "stories_select_all" on public.stories;
create policy "stories_select_all" on public.stories
  for select to authenticated using (true);

-- Supabase נותנת ALL ל-anon ול-authenticated דרך default privileges, ולכן `grant`
-- לבדו הוא no-op ו-RLS נשארת ההגנה היחידה — ו-RLS ⛔ אינה חוסמת TRUNCATE.
revoke all on public.stories from authenticated, anon;

grant select on public.stories to authenticated;
-- ⛔ אין insert · update · delete: הקליטה היא קובץ seed, ⛔ ולא פעולת לקוח.
-- ⛔ anon אינו מקבל דבר.

commit;
