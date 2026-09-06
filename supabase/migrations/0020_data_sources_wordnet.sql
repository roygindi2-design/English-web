-- 0020_data_sources_wordnet.sql — adds the `wordnet` row to `public.data_sources`
-- (T-198 · `lib/core/dataSources.ts` id `wordnet`).
--
-- מוחל ב-`supabase db push` אחרי 0019.
--
-- ⛔ **קובץ נפרד, ⛔ ולא עריכה של 0003b.** נמדד בטיק הזה ישירות מול הפרויקט החי
-- (`zsnqeaajnbrnnahdunof`): `data_sources` כבר קיימת עם 7 שורות, ו-0003b
-- ⛔ **אינה** מופיעה ב-`supabase_migrations.schema_migrations` (רק `0019` מופיעה
-- שם) — כלומר 0003b הוחלה בעבר בדרך אחרת (לא `supabase db push`), ועריכה שלה
-- עכשיו ⛔ לא הייתה נוגעת בפרויקט החי כלל, רק בקובץ. תוספת שורה שייכת למיגרציה
-- חדשה, בדיוק כמו כל שינוי סכימה אחר אחרי שקודמותיו כבר נחתו.
--
-- אידמפוטנטי: `on conflict (id) do nothing`, אותו דפוס בדיוק כמו ה-insert המקורי
-- ב-0003b. ⛔ **אין השפעה על שורה קיימת** — זו הוספה בלבד, ואף עמודת `source_id`
-- בטבלאות התוכן (`words` · `senses`) עדיין לא מצביעה על `'wordnet'` (T-198 מפיק
-- קובץ TSV נגזר ל-`data/`, ⛔ לא קליטה ל-DB — קליטת תוכן בפועל היא משימה נפרדת).
--
-- down: `delete from public.data_sources where id = 'wordnet';` — בטוח כל עוד
-- אין FK שמצביע על השורה (הנחה זו שלעיל, מדודה בטיק הזה: אפס שורות מפנות אליה).

insert into public.data_sources (id, name, licence, url) values
  ('wordnet', 'WordNet 3.1 (Princeton University)', 'Princeton WordNet License', 'https://wordnetcode.princeton.edu/')
on conflict (id) do nothing;
