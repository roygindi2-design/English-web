-- 0017_arcade_run_id.sql — מפתח אידמפוטנטיות לסוף הקרב (F-092).
--
-- מוחל בעורך ה-SQL של Supabase (או `supabase db push`) אחרי 0014.
--
-- ⚠️ **למה 0017 ו⛔ לא 0018 (F-093 · סטייה שנמדדה ובוטלה בטיק הביצוע):** התוכנית
-- C-0240 קבעה `0018` כדי לשריין את `0017` ל-`0017_stories.sql` שהובטח לרוי בכתב
-- (`03-for-roy` פריט 42 · T-134). ⛔ **הסטייה אינה ניתנת למימוש:** השער החי
-- `scripts/migration-hygiene.test.ts:74` («leaves no gap in the sequence») נופל על
-- כל דילוג, ⛔ ו-`0017_stories.sql` **טרם נכתב** (T-134 ⬜) ⇒ הפער היה מאדים את
-- העץ לכל סוכן עד שייכתב. ⇒ הקובץ הזה לוקח את `0017` כלשון הממצא המקורי,
-- ומיגרציית הסיפורים תיקח את המספר הפנוי הבא. הפריט לרוי עודכן באותו קומיט —
-- ⛔ אין הוראה שרוי כבר ביצע ושבוטלה: הקובץ ההוא מעולם לא היה קיים.
--
-- ⚠️ **למה `run_id` null-אפשרית ו⛔ לא `not null`:** `0014_arcade.sql` הוחלה
-- בייצור, ולכן `add column … not null` בלי ברירת מחדל **נופל** על כל שורת
-- `arcade_runs` היסטורית. החובה נאכפת בשכבת הנתיב — גוף בלי `runId` מקבל 422
-- (`app/api/arcade/result/route.ts`) — ⛔ ולכן אין כאן פרצה, יש גבול אחר.
--
-- ⛔ **אין כאן שדה לימודי, אין ניקוד ואין מפתח זר לצד הלימודי** (D-050 · D-052).

begin;

alter table public.arcade_runs
  add column if not exists run_id uuid;

alter table public.arcade_runs
  add column if not exists response_snapshot jsonb;

comment on column public.arcade_runs.run_id is
  'F-092 · מפתח אידמפוטנטיות שהלקוח מייצר פעם אחת לקרב. שידור חוזר אחרי נפילת
   רשת נושא את אותו מפתח, והאינדקס הייחודי הופך את הכתיבה השנייה לשגיאת 23505
   שהנתיב תופס. ⛔ אינו מזהה השורה — `id` הוא.';

comment on column public.arcade_runs.response_snapshot is
  'F-092 · גוף התשובה שנשלח ללומד בשידור הראשון. שידור חוזר מקבל **אותו** גוף
   בדיוק, ⛔ ולא חישוב מחדש: `unlocked` ו-`leveledUp` נכונים פעם אחת בלבד.';

-- ⛔ חלקי במכוון: `where run_id is not null` מתיר לשורות 0014 ההיסטוריות,
-- שכולן `null`, לחיות זו לצד זו. אינדקס מלא היה מכריז אותן כפילויות.
create unique index if not exists arcade_runs_run_id_key
  on public.arcade_runs (run_id)
  where run_id is not null;

commit;
