-- 0022 · ביטחון דקדוקי על שאלות ותרגילים  ⟦10/09/2026 · הכרעת רוי · R-014⟧
--
-- 🔬 **מה זה מחליף, ו⛔ למה זה ⛔ אינו הקלה.** ‏`R-014` הוחלפה במלואה: ⛔ אין עוד
-- דגימת בקרה אנושית על שום סוג תוכן. ⇒ התחליף הוא **הצהרת ביטחון של הכותב**, בדיוק
-- כמו `translation_confidence` שכבר קיים על `senses` מאז 0002 — וזו אותה שלישייה
-- ואותו אילוץ, כדי שיהיה **מנגנון אחד** ו⛔ לא שניים שנראים דומה.
--
-- ⛔ **המדידה מאחוריו ⛔ לא השתנתה:** מודל שנשאל לכתוב פריט למשמעות ספציפית מדויק
-- ב-60–76%. ⇒ תוכן שנכתב מלוגיקה דקדוקית — שאלה, מסיח, תרגיל — **נושא את מה שהכותב
-- באמת יודע עליו**, ⛔ ולא הנחה שהוא נכון.
--
-- ⚠️ **מדגם, ⛔ ולא כל פריט.** ברירת המחדל היא `medium`; הסוכן מוריד ל-`low` כשיש
-- חשש, ומעלה ל-`high` כשאימת (`hebrew-content-writer` · חיפוש · חפיסת Anki כאישוש,
-- `R-013`). ⛔ **ברירת מחדל ⛔ אינה טענה על אימות.**

alter table public.story_questions
  add column if not exists grammar_confidence text not null default 'medium';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'story_questions_grammar_confidence_check'
  ) then
    alter table public.story_questions
      add constraint story_questions_grammar_confidence_check
      check (grammar_confidence in ('low','medium','high'));
  end if;
end $$;

-- 🔴 **ביטחון נמוך מוצג ומסומן, ⛔ ולא מוסתר** (D-024) — ולכן ⛔ **אין כאן מדיניות
-- קריאה שמסננת `low`.** זו ההבחנה מול `senses`, שם `low` ⛔ אינו נמסר ללומד: תרגום
-- שגוי **מלמד מילה שגויה**, בעוד שאלה שהכותב ⛔ אינו בטוח בה היא שאלה שאפשר להציג
-- עם סימון. ⇒ הסינון, אם וכאשר, הוא הכרעת מוצר, ⛔ ולא ברירת מחדל של הסכימה.

comment on column public.story_questions.grammar_confidence is
  'R-014 (10/09/2026): ביטחון הכותב בנכונות הדקדוקית. low|medium|high. מדגם, ⛔ לא כל פריט. מחליף את דגימת הבקרה האנושית.';
