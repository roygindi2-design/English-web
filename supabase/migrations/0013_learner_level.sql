-- 0013_learner_level.sql — שני השדות של D-038 · § 4.2ז (T-079).
--
-- מוחל בעורך ה-SQL של Supabase (או `supabase db push`) אחרי 0012. עד שיוחל,
-- `GET /api/levels/summary` ו-`POST /api/levels/current` עונים 503 מוסבר בעברית
-- ⛔ ולא אפסים: «0 מילים» כשאין סכמה הוא שקר על תקלה (§ 4.2ו).
--
-- ⛔ אף עמודה של מנוע החזרה המרווחת אינה נוגעת כאן. ארבע עמודות המצב של מנוע 7.1
-- הן המצב שלו בלבד, וסימון עצמי הוא הצהרה של הלומד על עצמו — שתי מערכות נפרדות
-- שנפגשות רק בשכבה הטהורה, שקוראת את שתיהן ואינה כותבת לאף אחת. זו הדרישה שנרשמה
-- כמדד ההצלחה החשוב ביותר של § 4.2ז, ויש עליה בדיקה ב-
-- lib/supabase/learnerLevel.test.ts.
--
-- RLS ומדיניות הבעלות-העצמית מגיעות מ-0001 (profiles) ומ-0003 (word_progress)
-- ו⛔ אינן מוצהרות כאן שוב: מדיניות שנייה על אותה טבלה מ-OR'ד עם הראשונה, ולכן
-- הצהרה חוזרת יכולה רק להרחיב גישה, לעולם לא לצמצם.
--
-- אידמפוטנטי: `add column if not exists` לאורך כל הקובץ, והאילוץ מוצהר בנפרד ובשם
-- בתוך `do $$` — `add column ... check` מדולג **כולו** כשהעמודה כבר קיימת, ופרויקט
-- שהריץ טיוטה מוקדמת היה נשאר בלי האילוץ בשקט (נמדד C-0032).

begin;

-- הרמה שהלומד בחר לעצמו. nullable, ו⛔ בלי default: D-037 קובע שאין סף ואין שער,
-- והלומד עובר בעצמו — כלומר «טרם בחר» הוא מצב אמיתי שהמסך מכבד עם מצב בחירה,
-- ⛔ ולא נפילה שקטה ל-A1 שאיש לא הצהיר עליה.
alter table public.profiles
  add column if not exists current_level text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_current_level_check'
  ) then
    alter table public.profiles
      add constraint profiles_current_level_check
      check (current_level is null or current_level in ('A1','A2','B1','B2','C1','C2'));
  end if;
end $$;

comment on column public.profiles.current_level is
  'D-037 · § 4.2ז: הרמה שהלומד בחר. NULL = טרם בחר, מצב קבוע ולגיטימי. ⛔ אין סף
   מעבר, ⛔ אין נעילה, ⛔ אין הערכת מוכנות (R-017). נכתב אך ורק דרך
   POST /api/levels/current.';

-- ההצהרה של הלומד «אני יודע את המילה הזאת». not null default false: לומד שלא סימן
-- לא סימן, וזו מדידה — ⛔ לא ערך חסר. עמודה נפרדת ו⛔ לא דגל בתוך עמודות המנוע, כי
-- דיווח עצמי ותשובה נכונה במנוע הם שתי טענות שונות על אותה מילה, ו-D-038 מחייב
-- ששתיהן ישרדו: «בדוק את עצמי» פותח את הרשימה כחפיסה, ונפילה מחזירה את המילה.
alter table public.word_progress
  add column if not exists self_marked_known boolean not null default false;

alter table public.word_progress
  add column if not exists self_marked_at timestamptz;

comment on column public.word_progress.self_marked_known is
  'D-038 · D-041: הצהרת הלומד בסריקת הרמה. ⛔ אינו משנה ואינו נקרא על ידי מנוע
   החזרה המרווחת — מנוע 7.1 ממשיך לעבוד על עמודות המצב שלו בלבד.';

-- הקריאה היחידה שתעשה בעמודה היא (הלומד הזה, מה סימן) — סיכום הרמה סורק את שורות
-- ההתקדמות של לומד אחד. האינדקס מ-0003 הוא על user_id בלבד ומספיק לזה; אינדקס נוסף
-- על עמודה בוליאנית בעלת שני ערכים היה עלות כתיבה בלי רווח קריאה מדיד. ⛔ לכן אין כאן
-- אינדקס חדש — וזו החלטה, לא שכחה.

commit;
