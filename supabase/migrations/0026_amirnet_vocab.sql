-- 0026_amirnet_vocab.sql — אוצר המילים של אמירנט כטבלה (T-270 · `41 § 5` · `41 § 6` · D-232).
--
-- Applied through the Supabase MCP connector (`apply_migration`) by the DEV tick that
-- builds T-270, and ⛔ never left for Roy (D-163), exactly as 0024 records for T-297.
--
-- ⛔ **WHY A TABLE AT ALL.** Measured in this tick, ⛔ not assumed: `data/generated/
-- amirnet-vocab.csv` is 376,409 bytes, and the only consumer in the repo is
-- `scripts/measure-amirnet-coverage.mjs`. T-270's own words: «⛔ ולא נשארות קבצים
-- שסקריפט קורא». A client ⛔ cannot read a file in `data/generated/`.
--
-- ⛔ **ARBA DRAGOT, ⛔ AND NOT SIX — `D-232` (C-0576) decided ⓐ and it is ⛔ not re-opened
-- here.** `41 § 6` steps 3-5 drop A1 («מונח כידוע») and C2 («מעבר לטווח הבחינה») and map the
-- survivors `A2⇒1 · B1⇒2 · B2⇒3 · C1⇒4`. ⇒ `cefr_level` is kept on the row as a SOURCE
-- REFERENCE — the band the headword actually survived at — and ⛔ never as a fifth and sixth
-- tier: `amirnet_vocab_cefr_check` below makes A1 and C2 literally unwritable, so the
-- decision is enforced by the schema and ⛔ not by a reviewer's memory.
--
-- ⛔ **NOT THE LEARNER'S VOCABULARY STATE** (`R-020` · `37 § 13.1`): `41 § 5` calls this the
-- exam's RANGE — «היקף אוצר המילים של הבחינה: 1,500–3,000 מילים. זהו הגבול העליון». ⇒ zero
-- foreign key to `word_progress`, to `words` or to the arena. The boundary is enforced by
-- absence, the same way 0024 enforces it for `amirnet_items`.
--
-- ⛔ **הלקוח קורא בלבד** — the rows are written by the derivation pipeline
-- (`scripts/build-amirnet-vocab.mjs` ⇒ T-323's emitter), ⛔ never by a client action:
-- `grant select` alone, ⛔ no insert · update · delete.
--
-- ⛔ **אפס תוכן לימודי מומצא** (`R-010`): every row is derived from two licensed profiles
-- already in the repo — CEFR-J v1.5 and Octanove v1.0 — and `source` says which one the
-- surviving band came from. ⛔ Nothing here is authored.
--
-- Down (manual — `supabase db push` ⛔ is not reversible by a commit, `RULES § 0.22`, so the
-- way back is written here BEFORE a single statement runs; apply by hand to revert):
--   drop table if exists public.amirnet_vocab;
--
-- Idempotent: `create table if not exists`, every constraint named and added separately
-- inside `do $$` (C-0032 — `create table … check` is skipped wholesale when the table
-- already exists, so a constraint added that way would silently never arrive).

begin;

create table if not exists public.amirnet_vocab (
  headword      text     primary key,
  pos           text     not null,
  cefr_level    text     not null,
  tier          smallint not null,
  tier_name     text     not null,
  amirnet_level text     not null,
  is_connector  boolean  not null default false,
  source        text     not null,
  created_at    timestamptz not null default now()
);

do $$
begin
  -- `41 § 6` step 5 — four tiers, ⛔ not six (D-232).
  if not exists (select 1 from pg_constraint where conname = 'amirnet_vocab_tier_check') then
    alter table public.amirnet_vocab
      add constraint amirnet_vocab_tier_check check (tier between 1 and 4);
  end if;

  -- `41 § 6` steps 3-4 — A1 and C2 were dropped upstream, and this makes that permanent:
  -- a row carrying either cannot be written at all, by any path, including a hand-run SQL.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_vocab_cefr_check') then
    alter table public.amirnet_vocab
      add constraint amirnet_vocab_cefr_check check (cefr_level in ('A2', 'B1', 'B2', 'C1'));
  end if;

  -- The four strings `scripts/build-amirnet-vocab.mjs:61` already emits. A closed set here
  -- too, for the same reason `amirnet_items_type_check` is one: the numbers live in two
  -- places on purpose — the builder refuses before the write, the constraint refuses a row
  -- that bypassed the builder.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_vocab_level_check') then
    alter table public.amirnet_vocab
      add constraint amirnet_vocab_level_check
      check (amirnet_level in ('1-2', '2-3', '3', '4'));
  end if;

  -- The tier name is Hebrew and closed (`scripts/build-amirnet-vocab.mjs:60`). ⛔ Pairing it
  -- to the tier — a row saying `tier = 1` with the name of tier 4 is a data-entry defect,
  -- not a variant.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_vocab_tier_name_pairing') then
    alter table public.amirnet_vocab
      add constraint amirnet_vocab_tier_name_pairing
      check (
        (tier = 1 and tier_name = 'ליבה') or
        (tier = 2 and tier_name = 'ליבה מורחבת') or
        (tier = 3 and tier_name = 'הרחבה אקדמית') or
        (tier = 4 and tier_name = 'רמת פטור')
      );
  end if;

  -- A blank headword is ⛔ not a headword — and the merge key of T-222 is the exact,
  -- case-sensitive string, so a whitespace-padded one is a different row by accident.
  if not exists (select 1 from pg_constraint where conname = 'amirnet_vocab_headword_check') then
    alter table public.amirnet_vocab
      add constraint amirnet_vocab_headword_check
      check (length(headword) > 0 and headword = btrim(headword));
  end if;

  -- `source` names which licensed profile the SURVIVING band came from. A closed set:
  -- there are two source files in `data/`, and an unattributed row is unciteable (R-013).
  if not exists (select 1 from pg_constraint where conname = 'amirnet_vocab_source_check') then
    alter table public.amirnet_vocab
      add constraint amirnet_vocab_source_check
      check (source in ('CEFR-J v1.5', 'Octanove v1.0'));
  end if;
end $$;

comment on table public.amirnet_vocab is
  '41 § 5 · 41 § 6 · T-270 · D-232 — the exam''s vocabulary RANGE, derived from CEFR-J v1.5
   and Octanove v1.0 by scripts/build-amirnet-vocab.mjs. ⛔ Not the learner''s vocabulary
   state: zero foreign key to word_progress, to words or to the arena (R-020 · 37 § 13.1).';
comment on column public.amirnet_vocab.cefr_level is
  'The band the headword SURVIVED the merge at — A2 | B1 | B2 | C1. Kept as a source
   reference (D-232), ⛔ never as a fifth and sixth tier: A1 and C2 were dropped by
   41 § 6 steps 3-4 and amirnet_vocab_cefr_check makes them unwritable.';
comment on column public.amirnet_vocab.tier is
  '41 § 6 step 5 — A2⇒1 · B1⇒2 · B2⇒3 · C1⇒4. Four tiers, ⛔ not six (D-232).';
comment on column public.amirnet_vocab.amirnet_level is
  'The exam level band the tier maps to (1-2 · 2-3 · 3 · 4). ⛔ Not a learner level and
   ⛔ never a score — 41 § 4 owns those.';
comment on column public.amirnet_vocab.is_connector is
  'DERIVED from pos, ⛔ never copied: true when ANY row for this exact headword, in EITHER
   source file, at ANY band, is tagged conjunction/preposition (T-222). The source column
   in the checked-in snapshot is empty and is ⛔ not reconstructible.';
comment on column public.amirnet_vocab.source is
  'Which licensed profile the surviving band came from. ⛔ Zero invented content (R-010).';

-- The two reads this table is for: «what tier is this headword» (the primary key covers it)
-- and «give me tier 1+2», which is what 41 § 6.2 calls the 1,000/2,000 vocabulary of levels
-- 1 and 2 and what measure:amirnet-coverage counts.
create index if not exists amirnet_vocab_tier_idx
  on public.amirnet_vocab (tier, headword);

alter table public.amirnet_vocab enable row level security;

drop policy if exists "amirnet_vocab_select_all" on public.amirnet_vocab;
create policy "amirnet_vocab_select_all" on public.amirnet_vocab
  for select to authenticated using (true);

revoke all on public.amirnet_vocab from authenticated, anon;
grant select on public.amirnet_vocab to authenticated;
-- ⛔ No insert · update · delete: the rows come from the derivation pipeline, ⛔ never from
-- a client action.

commit;
