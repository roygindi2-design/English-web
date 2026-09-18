-- 0030_is_function_word_derived.sql — F-290 · הסיבה האמיתית לאצוות התקועות.
--
-- 🔬 המדידה: `execute_sql` על אצווה 2026-08-29-2 החזיר
--    «new row for relation "words" violates check constraint
--     words_lexical_class_agrees», והשורה הכושלת היא `besides` —
--    `lexical_class = 'function'` מול `is_function_word = f`.
--
-- ⚠️ ולמה זה קרה: 0006:110 קבע `is_function_word = (lexical_class = 'function')`,
--    0002:53 קבע `not null default false`, ו-T-120ⓒ הפסיק את הצינור מלכתוב את
--    העמודה הפורשת — שער חי (`build-ingest-sql.test.ts:313`) אף אוסר זאת.
--    ⇒ כל insert של מילת תפקוד מקבל `false` כברירת מחדל, סותר את המגבלה, ונופל.
--    ⛔ זו ⛔ אינה תקלה באצווה: **כל אצווה שיש בה מילת תפקוד אחת ⛔ אינה ניתנת
--    לכתיבה מאז T-120ⓒ.** 140 שורות `lexical_class='function'` בייצור כולן
--    מלפני אותו שינוי, ⛔ ואף לא אחת אחריו.
--
-- ⛔ ומה שהקובץ הזה ⛔ אינו עושה: ⛔ אינו מוחק עמודה. 0006:105 קובע ש«מחיקת עמודה
--    הרסנית ואינה סמכות Dev», ו-`0017_drop_is_function_word.sql` ⛔ מעולם לא נכתב
--    (משבצת 0017 הלכה ל-arcade_run_id). ⇒ הפתרון כאן הופך את העמודה למה ש-0006
--    כבר מכריז שהיא — **תצוגה נגזרת של `lexical_class`** — ⛔ ולא מוחק אותה.
--
-- ⛔ ולמה ⛔ לא `drop not null`: זה היה פותר את ה-insert ומשאיר עמודה שחציה אמת.
--    טריגר שומר על שלושת האינוריאנטים בבת אחת: `not null` · המגבלה · **הנכונות**.
--
-- 🔴 הוחל על הייצור דרך `execute_sql` (‏`apply_migration` נדחה במסווג —
--    «Reason: [Production Deploy]», ‏DEV C-0646). הקובץ הוא הרישום, ⛔ לא הביצוע.
begin;

create or replace function public.words_sync_is_function_word()
returns trigger
language plpgsql
as $$
begin
  -- ⛔ NULL ⛔ אינו מתורגם ל-false: שורה בלי סיווג היא «לא ידוע», והעמודה הישנה
  -- ⛔ אינה יכולה לומר זאת. במקרה הזה נשמר מה שכבר כתוב בשורה.
  if new.lexical_class is not null then
    new.is_function_word := (new.lexical_class = 'function');
  end if;
  return new;
end;
$$;

drop trigger if exists words_sync_is_function_word on public.words;
create trigger words_sync_is_function_word
  before insert or update on public.words
  for each row execute function public.words_sync_is_function_word();

comment on function public.words_sync_is_function_word() is
  'F-290. is_function_word (0002:53) פרשה לטובת lexical_class (T-048) אך המגבלה words_lexical_class_agrees (0006:110) נשארה, והצינור הפסיק לכתוב אותה (T-120ⓒ) ⇒ כל מילת תפקוד נחסמה בכניסה. הטריגר גוזר את העמודה הפורשת מן החדשה במקום שהצינור יכתוב אותה.';

commit;
