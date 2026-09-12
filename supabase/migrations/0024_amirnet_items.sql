-- 0024_amirnet_items.sql — מאגר פריטי אמירנט (T-297 · `41 § 6.5` · D-212).
--
-- Applied through the Supabase MCP connector (`apply_migration`) by the DEV tick that
-- builds T-297, and ⛔ never left for Roy (D-163).
--
-- ⛔ **A NEW TABLE, ⛔ and ⛔ not a tenth extension of `public.sense_items`** — the
-- decision is `D-212`, already taken, and it is ⛔ not re-decided here. Measured C-0531:
-- `sense_items` carries nine columns and ⛔ none of them is a question type (`sc`/`rs`/`rc`),
-- four options, a correct index, a Hebrew explanation or an `rc` passage.
--
-- ⛔ **The columns are `41 § 6.5` word for word**, which is the same signature
-- `AmirnetItemRecord` (`lib/core/amirnetItemGate.ts`) already enforces —
-- `id · type · level · stem · options[4] · correct_index · distractor_reasons[4] ·
--  level_rationale · vocab_band · source`.
-- ⚠️ **TWO COLUMNS BEYOND § 6.5, ⛔ both declared, ⛔ neither invented:**
--   · `passage_en` — the `rc` passage. `41 § 6.2` fixes a word-count range per level and
--     `AmirnetItemRecord.passageEn` already carries it; an `rc` item without its passage is
--     a question about nothing. `sc`/`rs` carry `''`, enforced below.
--   · `explanation_he` — `41 § 7` requires «משוב מיידי עם **הסבר בעברית**» with ⛔ no
--     condition, and `T-297`ⓓ refuses to serve an item without one. ⛔ Without this column
--     ⓓ is unimplementable and the gate would have nothing to refuse on.
--
-- ⛔ **אפס תוכן לימודי מומצא** (`R-010`, extended to amirnet by `RULES § 0.1 ז׳`):
-- `source` is `original` and ⛔ nothing else, exactly as `§ 6.5` states.
-- ⛔ **אפס מפתח זר ל-`word_progress` ולזירה** — an amirnet item is exam material, ⛔ not
-- the learner's vocabulary state (`R-020` · `37 § 13.1`). The boundary is enforced by absence.
-- ⛔ **הלקוח קורא בלבד** — the bank is written by the content agent (`K-006`), ⛔ never by a
-- client action: `grant select` alone, ⛔ no insert · update · delete.
--
-- Down (manual — this file's statements are never re-run automatically by
-- `supabase db push`; apply by hand if this ever needs reverting):
--   drop table if exists public.amirnet_items;
--
-- Idempotent: `create table if not exists`, every constraint named and added separately
-- inside `do $$` (C-0032 — `create table … check` is skipped wholesale when the table exists).

begin;

create table if not exists public.amirnet_items (
  id                 uuid primary key default gen_random_uuid(),
  type               text     not null,
  level              smallint not null,
  stem_en            text     not null,
  passage_en         text     not null default '',
  options_en         text[]   not null,
  correct_index      smallint not null,
  distractor_reasons text[]   not null,
  explanation_he     text     not null,
  level_rationale    text     not null,
  vocab_band         smallint not null,
  source             text     not null,
  created_at         timestamptz not null default now(),
  unique (type, level, stem_en)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'amirnet_items_type_check') then
    alter table public.amirnet_items
      add constraint amirnet_items_type_check check (type in ('sc', 'rs', 'rc'));
  end if;

  -- ⛔ ארבע רמות, ⛔ ולא שש (`41 § 6.2`). `sense_items.level` is nullable because 1,602
  -- rows predate D-141; this table has ⛔ no such history, so the level is `not null` and
  -- an untagged item simply cannot be written.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_items_level_check') then
    alter table public.amirnet_items
      add constraint amirnet_items_level_check check (level between 1 and 4);
  end if;

  -- `41 § 6.4` — four options, and a reason per option. The numbers live in two places on
  -- purpose: `amirnetItemGate()` rejects before the write, the constraint rejects a row
  -- that bypassed the gate (the 0019/0023 reasoning).
  if not exists (select 1 from pg_constraint where conname = 'amirnet_items_options_check') then
    alter table public.amirnet_items
      add constraint amirnet_items_options_check check (array_length(options_en, 1) = 4);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'amirnet_items_reasons_check') then
    alter table public.amirnet_items
      add constraint amirnet_items_reasons_check check (array_length(distractor_reasons, 1) = 4);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'amirnet_items_correct_index_check') then
    alter table public.amirnet_items
      add constraint amirnet_items_correct_index_check check (correct_index between 0 and 3);
  end if;

  -- `41 § 6.5`: vocab_band is 1000 | 2000 | 3000, a closed set.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_items_vocab_band_check') then
    alter table public.amirnet_items
      add constraint amirnet_items_vocab_band_check check (vocab_band in (1000, 2000, 3000));
  end if;

  -- `41 § 6.5`: «`source` הוא `original` תמיד. ⛔ אין ערך אחר.»
  if not exists (select 1 from pg_constraint where conname = 'amirnet_items_source_check') then
    alter table public.amirnet_items
      add constraint amirnet_items_source_check check (source = 'original');
  end if;

  -- The passage belongs to `rc` and to nothing else — an `sc` item with a passage is a
  -- data-entry defect, and an `rc` item without one is a question about nothing.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_items_passage_pairing') then
    alter table public.amirnet_items
      add constraint amirnet_items_passage_pairing
      check ((type = 'rc') = (length(btrim(passage_en)) > 0));
  end if;

  -- ⛔ אפס פריט בלי הסבר בעברית — the last line of defence behind `isServable()` ⓑ.
  -- A whitespace-only explanation is not an explanation.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_items_explanation_check') then
    alter table public.amirnet_items
      add constraint amirnet_items_explanation_check check (length(btrim(explanation_he)) > 0);
  end if;
end $$;

comment on table public.amirnet_items is
  '41 § 6.5 · D-212 — the amirnet item bank. ⛔ A separate table from sense_items, which
   carries none of these columns. ⛔ Not the learner''s vocabulary state: zero foreign key
   to word_progress or to the arena (R-020 · 37 § 13.1).';
comment on column public.amirnet_items.type is
  'Closed set sc · rs · rc (41 § 6.1). Hebrew labels live in lib/core/amirnetPractice.ts.';
comment on column public.amirnet_items.level is
  '41 § 6.2 — 1-4, chosen at write time with a written reason in level_rationale. ⛔ Never
   inferred, ⛔ never backfilled.';
comment on column public.amirnet_items.passage_en is
  'rc only — the passage the question is grounded in, word count per 41 § 6.2. sc/rs carry
   '''', enforced by amirnet_items_passage_pairing.';
comment on column public.amirnet_items.distractor_reasons is
  '41 § 6.4 rule 5 — why a reasonable learner might pick this option. At correct_index: why
   THIS option is the correct one. ⛔ A distractor with no stated reason is an invalid item.';
comment on column public.amirnet_items.explanation_he is
  '41 § 7 — the Hebrew explanation shown on BOTH outcomes. ⛔ Never generated at read time:
   an item without one is ⛔ not served (T-297ⓓ · lib/core/amirnetQuestion.ts isServable).';
comment on column public.amirnet_items.source is
  '41 § 6.5 — «original» always. ⛔ No item is ever copied from a commercial bank (R-010).';

-- The only read the practice route makes: one type, one level, newest first.
create index if not exists amirnet_items_type_level_idx
  on public.amirnet_items (type, level, created_at desc);

alter table public.amirnet_items enable row level security;

drop policy if exists "amirnet_items_select_all" on public.amirnet_items;
create policy "amirnet_items_select_all" on public.amirnet_items
  for select to authenticated using (true);

revoke all on public.amirnet_items from authenticated, anon;
grant select on public.amirnet_items to authenticated;
-- ⛔ No insert · update · delete: the bank is written by the content commission K-006,
-- ⛔ never by a client action.

commit;
