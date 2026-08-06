-- T-038 · מאגר התוכן — words · senses · sense_examples · sense_distractors · sense_items · generation_runs
--
-- כל שורה כאן היא תוכן שאנחנו כתבנו, או נתונים ברישיון פרמיסיבי.
-- מקור (provenance) אינו הערה — הוא עמודה. ראה plan/20-alerts.md R-010 · R-013.
--
-- Apply in the Supabase SQL editor (or `supabase db push`) before the first
-- Content-agent run. Written to be re-runnable: every object is guarded, and
-- הכול עטוף בטרנזקציה אחת — `create table if not exists` מדלג על טבלה קיימת
-- בצורה אחרת ואז שורה מאוחרת נופלת. בלי begin/commit הקובץ נשאר חצי-מיושם.

begin;

-- ---------------------------------------------------------------------------
-- generation_runs — שורה לכל ריצה של סוכן התוכן. מאפשרת לפסול אצווה שלמה.
-- ---------------------------------------------------------------------------
create table if not exists public.generation_runs (
  id             uuid primary key default gen_random_uuid(),
  started_at     timestamptz not null default now(),
  model          text not null,
  prompt_version text not null,
  requested      int  not null,
  accepted       int  not null default 0,
  rejected       int  not null default 0,
  notes          text
);

comment on table public.generation_runs is
  'One row per Content-agent run. Revoking a bad batch is a deliberate two-step: '
  'delete its senses first, then the run row. senses.generation_run_id is NO ACTION '
  'on purpose — content must never be destroyed as a side effect of deleting metadata.';

-- ---------------------------------------------------------------------------
-- words — כותרת מילונית אחת לכל (headword, pos)
-- ---------------------------------------------------------------------------
create table if not exists public.words (
  id               uuid primary key default gen_random_uuid(),
  headword         text not null,
  -- 'interjection' נוסף מעבר לשמונה של התוכנית: yes · hello · thanks · sorry
  -- הן ערכי NGSL בתדירות גבוהה שאין להן תג חוקי אחר. ⚠️ טיפוס `Pos` ב-T-039
  -- חייב לכלול אותו גם הוא, אחרת השער יפסול אותן לפני שהן מגיעות לכאן.
  pos              text not null check (pos in
                     ('noun','verb','adjective','adverb','preposition',
                      'conjunction','pronoun','determiner','interjection')),
  -- provenance
  origin           text not null check (origin in ('seed','ngsl','generated')),
  source_note      text,
  -- אותות קושי (Nature HSSC 2025: תדירות דומיננטית; Hiebert 2019: אורך והברות
  -- משפיעים על לומדים דווקא — וזה בדיוק הקהל שלנו)
  ngsl_rank        int,
  zipf_freq        numeric(4,2),
  n_letters        int  not null,
  n_syllables      int,
  is_function_word boolean not null default false,
  created_at       timestamptz not null default now(),
  unique (headword, pos)
);

comment on table public.words is
  'Headword list. NGSL v1.2 (CC BY-SA 4.0) is the permitted source for selection; '
  'every translation and sentence hanging off it is authored by us.';

-- ---------------------------------------------------------------------------
-- senses — D-021: השורה היא משמעות, לא מילה
-- ---------------------------------------------------------------------------
create table if not exists public.senses (
  id             uuid primary key default gen_random_uuid(),
  word_id        uuid not null references public.words (id) on delete cascade,
  sense_index    int  not null,
  definition_en  text not null,
  translation_he text not null,
  cefr_level     text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  -- D-013: תרגום בביטחון נמוך לעולם אינו מוצג ללומד
  translation_confidence text not null default 'medium'
                     check (translation_confidence in ('low','medium','high')),
  -- אין רשימת שגיאות עברית→אנגלית מפורסמת (10-pedagogy 1.10). אנחנו כותבים אותן.
  he_interference_note text,
  he_one_to_many_group text,
  generation_run_id uuid references public.generation_runs (id),
  reviewed_by_human boolean not null default false,
  created_at     timestamptz not null default now(),
  unique (word_id, sense_index)
);

comment on column public.senses.he_one_to_many_group is
  'One Hebrew word covering several English words, e.g. להזמין = invite/reserve/order. '
  'Learners confuse these systematically; grouping lets us teach the contrast.';

-- ---------------------------------------------------------------------------
-- sense_examples — D-022: שני משפטים, שתי עבודות
-- ---------------------------------------------------------------------------
create table if not exists public.sense_examples (
  id       uuid primary key default gen_random_uuid(),
  sense_id uuid not null references public.senses (id) on delete cascade,
  -- supportive = המשמעות ניתנת להסקה (הצגה ראשונה);
  -- neutral    = ההקשר אינו מסגיר אותה (תרגול ובדיקה).
  kind     text not null check (kind in ('supportive','neutral')),
  text_en  text not null,
  text_he  text,
  unique (sense_id, kind)
);

-- ---------------------------------------------------------------------------
-- sense_distractors — D-023: מסיחים מתויגים; הקושי נקבע בבחירה, לא בייצור מחדש
-- ---------------------------------------------------------------------------
create table if not exists public.sense_distractors (
  id            uuid primary key default gen_random_uuid(),
  sense_id      uuid not null references public.senses (id) on delete cascade,
  distractor    text not null,
  relation_type text not null check (relation_type in
                  ('semantic','orthographic','collocational','unrelated','near_synonym')),
  unique (sense_id, distractor)
);

comment on column public.sense_distractors.relation_type is
  'near_synonym is stored but EXCLUDED from scoring items: Ludewig 2023 found '
  'near-synonyms hurt discrimination. Keep for a future "which is more precise" drill.';

-- ---------------------------------------------------------------------------
-- sense_items — גזעי השלמת משפט, בלי אופציות. מנוע 7.5 בונה אותן בזמן הגשה.
-- ---------------------------------------------------------------------------
create table if not exists public.sense_items (
  id          uuid primary key default gen_random_uuid(),
  sense_id    uuid not null references public.senses (id) on delete cascade,
  stem        text not null,
  blank_token text not null default '____',
  item_index  int  not null,
  unique (sense_id, item_index)
);

-- אין אינדקס נפרד על senses(word_id): המפתח הייחודי (word_id, sense_index) כבר
-- מוביל ב-word_id והמתכנן בוחר בו. אינדקס נוסף = הגברת כתיבה בלבד.
create index if not exists senses_cefr_level_idx  on public.senses (cefr_level);
create index if not exists words_ngsl_rank_idx    on public.words (ngsl_rank);

-- ---------------------------------------------------------------------------
-- RLS. טבלה בלי RLS ב-Supabase היא טבלה ציבורית — מפתח ה-anon יושב בדפדפן.
-- התוכן משותף ולא פר-משתמש, ולכן קריאה מותרת לכל לומד מחובר. כתיבה מגיעה
-- אך ורק מעבודת האצווה עם ה-service role, שעוקף RLS.
-- ---------------------------------------------------------------------------
alter table public.words             enable row level security;
alter table public.senses            enable row level security;
alter table public.sense_examples    enable row level security;
alter table public.sense_distractors enable row level security;
alter table public.sense_items       enable row level security;
alter table public.generation_runs   enable row level security;

drop policy if exists "content_words_select" on public.words;
create policy "content_words_select" on public.words
  for select to authenticated using (true);

-- תרגום בביטחון נמוך אינו נקרא כלל מצד הלקוח (D-013)
drop policy if exists "content_senses_select" on public.senses;
create policy "content_senses_select" on public.senses
  for select to authenticated using (translation_confidence <> 'low');

-- ⚠️ שלוש טבלאות הבת חייבות לרשת את סינון D-013. מדיניות `using (true)` עליהן
-- מבטלת את הסינון של senses: `sense_examples.text_he` הוא בדיוק המשפט שמכיל את
-- התרגום בביטחון הנמוך, והלקוח היה מושך אותו ישירות בלי לדעת שהוא מוסתר.
drop policy if exists "content_examples_select" on public.sense_examples;
create policy "content_examples_select" on public.sense_examples
  for select to authenticated using (
    exists (select 1 from public.senses s
            where s.id = sense_id and s.translation_confidence <> 'low'));

drop policy if exists "content_distractors_select" on public.sense_distractors;
create policy "content_distractors_select" on public.sense_distractors
  for select to authenticated using (
    exists (select 1 from public.senses s
            where s.id = sense_id and s.translation_confidence <> 'low'));

drop policy if exists "content_items_select" on public.sense_items;
create policy "content_items_select" on public.sense_items
  for select to authenticated using (
    exists (select 1 from public.senses s
            where s.id = sense_id and s.translation_confidence <> 'low'));

-- generation_runs היא מטא-דאטה תפעולית: אין מדיניות קריאה, ולכן RLS דוחה
-- כל גישה מהדפדפן. בכוונה — הלומד לא צריך לדעת איזה מודל כתב את הכרטיסייה.

-- ---------------------------------------------------------------------------
-- הרשאות מפורשות. Supabase נותנת ALL ל-anon ול-authenticated דרך
-- default privileges, ולכן `grant` לבדו הוא no-op שם ו-RLS נשאר ההגנה היחידה —
-- ו-RLS **אינו** חוסם TRUNCATE. לכן שוללים קודם, ומעניקים select בלבד.
-- ---------------------------------------------------------------------------
revoke all on public.words, public.senses, public.sense_examples,
              public.sense_distractors, public.sense_items,
              public.generation_runs from authenticated, anon;

grant select on public.words, public.senses, public.sense_examples,
                public.sense_distractors, public.sense_items to authenticated;

-- anon אינו מקבל דבר. מסלול "נסה בלי חשבון" (T-034) ייקרא דרך /app/api/ בצד
-- השרת ולא במפתח ה-anon מהדפדפן — אם ישתנה, זו החלטה מפורשת ולא שכחה.

commit;
