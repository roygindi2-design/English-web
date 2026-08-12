-- 0006_layer2_track_and_bank.sql — T-047 + T-048 (שכבה 2 א׳ + ב׳)
--
-- Apply AFTER 0005_review_state.sql.
--
-- What: two nullable track fields on every content row (T-047), and the two
-- assembly-bank fields (T-048). Nothing else.
--
-- Why now: a migration on an empty table costs zero. Measured 2026-08-12 — the
-- database holds ZERO content rows (the five generated batches live only as
-- data/generated/batch-*.jsonl and were never inserted). The same migration
-- after the bank is loaded is a rewrite of every batch. This is the last cheap
-- moment, and that is the entire argument for landing empty columns today.
--
-- ⛔ SCHEMA ONLY. Not one existing row is classified. There is no UPDATE in this
--    file and there must never be one: filling grade_level or lexical_class is a
--    pedagogical claim and needs a source in plan/10-pedagogy.md first.
--    lib/supabase/layer2.test.ts fails if an UPDATE ever appears here.
--
-- Idempotent and transactional: `add column if not exists` throughout, named
-- constraints inside a guarded `do $$ … end $$` (0003/0004's pattern — `add
-- column … check (…)` is skipped WHOLESALE when the column already exists and
-- would ship the constraint missing), and the whole file wraps in begin/commit
-- like 0002, because a half-applied multi-statement migration is worse than none.

begin;

-- ── T-047 · track fields on the three content tables ────────────────────────
-- One statement per column, mirroring 0003's shape and for its reason: `add
-- column if not exists` is per-clause, so asserting each column separately
-- costs nothing and does not assume an earlier file left it there.
--
-- ⛔ Every one of the six is NULLABLE with NO default. A `not null default
--    'amiram'` here would silently classify all 2,809 future NGSL rows as
--    Amiram content — T-047 says the empty field IS the correct result until a
--    source exists. This is deliberately UNLIKE 0003's track_id, which carries
--    `not null default 'amiram'` because D-016 assumed a single track; that
--    assumption is exactly what שכבה 2 א׳ retires.

alter table public.words add column if not exists exam_type text;
alter table public.words add column if not exists grade_level text;

alter table public.senses add column if not exists exam_type text;
alter table public.senses add column if not exists grade_level text;

alter table public.sense_items add column if not exists exam_type text;
alter table public.sense_items add column if not exists grade_level text;

-- ── T-048 · the two assembly-bank fields ────────────────────────────────────
-- ⓐ is_active_this_week sits on the EXISTING aggregate row of 0003, one per
--    (learner, word). ⛔ NOT a new events table: W4 records the free Supabase
--    tier as a budget risk and an event log on an SRS grows without a ceiling.
--    It is the only NOT NULL column in this file, for the same reason 0003 gave
--    consecutive_correct_recognition: "this word is not in this week's active
--    set" is a MEASUREMENT, not an unknown. Nullable would force every reader to
--    write coalesce(…, false) and one of them eventually would not.
alter table public.word_progress
  add column if not exists is_active_this_week boolean not null default false;

-- ⓑ lexical_class separates a function word from a content word.
--    NULLABLE: unknown is the honest state of every row in this database today.
--    ⛔ The closed list of function words is NOT part of T-048 — such a list is a
--    pedagogical claim and needs a grade-א׳/ב׳ source.
alter table public.words add column if not exists lexical_class text;

-- ── named constraints, guarded so re-applying is a no-op ────────────────────
do $$
begin
  -- exam_type: the three names are TRANSCRIBED verbatim from plan/01-vision.md
  -- § שכבה 2 א׳ (אמיר"ם · פסיכומטרי · בגרות). Transcription, not invention.
  -- Free text would drift amiram / Amiram / 'amiram ' past every reader.
  -- NULL stays legal in all three: an unclassified row is the normal state.
  if not exists (select 1 from pg_constraint where conname = 'words_exam_type_check') then
    alter table public.words
      add constraint words_exam_type_check
      check (exam_type is null or exam_type in ('amiram','psychometric','bagrut'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'senses_exam_type_check') then
    alter table public.senses
      add constraint senses_exam_type_check
      check (exam_type is null or exam_type in ('amiram','psychometric','bagrut'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'sense_items_exam_type_check') then
    alter table public.sense_items
      add constraint sense_items_exam_type_check
      check (exam_type is null or exam_type in ('amiram','psychometric','bagrut'));
  end if;

  -- ⛔ There is deliberately NO check on grade_level. The vision leaves it as
  --    "כיתות א׳–י״ב" with no schema; writing a closed list here would BE the
  --    invented age range that T-047 forbids.

  if not exists (select 1 from pg_constraint where conname = 'words_lexical_class_check') then
    alter table public.words
      add constraint words_lexical_class_check
      check (lexical_class is null or lexical_class in ('function','content'));
  end if;

  -- words.is_function_word (0002:53) already encodes half of this fact and, being
  -- `not null default false`, CANNOT say "unknown" — every row nobody classified
  -- reads as "content word". lexical_class can say all three things, so the old
  -- column is now a derived view of the new one. Until the PM decides which
  -- survives (plan/03-for-roy.md), the database refuses to hold two answers at
  -- once. ⛔ is_function_word is NOT dropped here: dropping a column is
  -- destructive and is not Dev's call.
  if not exists (select 1 from pg_constraint where conname = 'words_lexical_class_agrees') then
    alter table public.words
      add constraint words_lexical_class_agrees
      check (lexical_class is null or is_function_word = (lexical_class = 'function'));
  end if;
end $$;

-- Partial: it occupies nothing while every row is NULL, which is every row today.
create index if not exists words_exam_type_idx
  on public.words (exam_type)
  where exam_type is not null;

comment on column public.words.grade_level is
  'כיתה א׳-י״ב. ללא רשימה סגורה במכוון: רשימה כזו היא טענה פדגוגית וטעונה מקור ב-plan/10-pedagogy.md. NULL = לא ידוע.';

comment on column public.words.lexical_class is
  'function | content. NULL = לא ידוע, וזה מצבה של כל שורה היום. הרשימה הסגורה של מילות התפקוד אינה חלק מ-T-048.';

comment on column public.words.is_function_word is
  'הוחלף על ידי lexical_class (T-048). נשמר משום שמחיקת עמודה הרסנית ואינה סמכות Dev; not null default false אינו יכול לומר "לא ידוע". המגבלה words_lexical_class_agrees אוסרת סתירה בין השניים.';

comment on column public.word_progress.is_active_this_week is
  'דגל בנק ההרכבה (T-048 ⓐ). יושב על השורה המצטברת הקיימת פר (לומד, מילה) ואינו טבלת אירועים — W4, שכבה חינמית של Supabase.';

commit;
