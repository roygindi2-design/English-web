-- 0016_lexical_class_backfill.sql — T-120ⓐ · F-086.
--
-- ⚠️ למה הקובץ הזה קיים בכלל: 0006 הוסיף את lexical_class כ-NULLABLE ומעולם לא
--    מילא אותה, וצינור הקליטה (scripts/build-ingest-sql.mjs) כותב עד היום את
--    is_function_word בלבד. ⇒ .eq('lexical_class','function') מחזיר 0 שורות.
--    בלי הקובץ הזה, T-120 מרוקנת את הבנק של מילות התפקוד בייצור.
--
-- ⛔ מה שהקובץ ⛔ אינו עושה: אינו מוחק עמודה, אינו מוריד מגבלה, ואינו יוצר עמודה.
--    המחיקה היא 0017_drop_is_function_word.sql בלבד, ורק אחרי שהקוד החדש בייצור.
--
-- ⛔ ולמה זה ⛔ אינו case when … then 'function' else 'content':
--    is_function_word הוא not null default false (0002:53), ולכן כל שורה שאיש לא
--    סיווג נקראת "מילת תוכן". תרגום עיוור של false היה הופך ברירת מחדל לטענה —
--    בדיוק הפגם ש-lexical_class נולדה לתקן (0006:102-105).
begin;

-- ⓐ הטענה החיובית. true ⛔ לעולם אינו ברירת מחדל, ולכן הוא ניתן להעברה כמות שהוא.
update public.words
   set lexical_class = 'function'
 where is_function_word
   and lexical_class is null;

-- ⓑ הטענה השלילית, ורק כשהיא מפורשת. origin = 'generated' מסמן שורה שנכנסה דרך
--    צינור הקליטה, ושם lib/core/batchRecord.ts:170 דורש את השדה ⇒ false הוא
--    טענה של סוכן התוכן ⛔ ולא היעדר סיווג. שורות 'seed' ו-'ngsl' נשארות NULL.
--    ⛔ זו ההזדמנות האחרונה לשמר אותן: 0017 מוחק את המקור לתמיד.
update public.words
   set lexical_class = 'content'
 where is_function_word is false
   and origin = 'generated'
   and lexical_class is null;

commit;
