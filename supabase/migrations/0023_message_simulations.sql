-- 0023_message_simulations.sql — הודעות · תיבת הסימולציות (T-190 · 39 § 7 · D-109).
--
-- Applied through the Supabase MCP connector (`apply_migration`) by the DEV tick that
-- builds T-190, and ⛔ never left for Roy (D-163). Verified after apply by a count query.
--
-- ⚠️ The plan names this file `0022_`. `0022_grammar_confidence.sql` landed 2026-09-10
-- (4e0c6b7), after the plan was written, and apply order is filename order
-- (`scripts/migration-hygiene.test.ts`) ⇒ this is `0023_`. Nothing else changed.
--
-- ⛔ **תוכן AI אינו מקור פדגוגי ולעולם מסומן** (§ 7.6): `origin` not null, named check
-- on 'generated' only — exactly the 0018_stories.sql template.
-- ⛔ **ארבע רמות, ⛔ ולא שש** (R-021).
-- ⛔ **אפס מפתח זר לזירה ואפס ל-word_progress** (D-054 · 39 § 3): `הודעות` is declared
-- **מנותקת לחלוטין** in the D-054 table. The boundary is enforced here by absence.
-- ⛔ **הלקוח קורא בלבד את הסימולציות, וכותב אך ורק את שורת המצב שלו** (row ⓒ).
--
-- Down (manual — never re-run automatically; apply by hand if this ever needs reverting):
--   drop table if exists public.message_simulation_state;
--   drop table if exists public.message_simulations;
--
-- Idempotent: `create table if not exists`, every constraint named and separate inside
-- `do $$` (C-0032 — `create table … check` is skipped wholesale when the table exists).

begin;

create table if not exists public.message_simulations (
  id             uuid primary key default gen_random_uuid(),
  sender_en      text not null,
  context        text not null,
  subject_en     text not null,
  body_en        text not null,
  required_words text[] not null,
  cefr_level     text not null,
  origin         text not null,
  created_at     timestamptz not null default now(),
  unique (cefr_level, subject_en)
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'message_simulations_context_check') then
    alter table public.message_simulations
      add constraint message_simulations_context_check
      check (context in ('tourist', 'restaurant', 'teacher', 'hotel'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'message_simulations_level_check') then
    alter table public.message_simulations
      add constraint message_simulations_level_check
      check (cefr_level in ('A1', 'A2', 'B1', 'B2'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'message_simulations_origin_check') then
    alter table public.message_simulations
      add constraint message_simulations_origin_check
      check (origin = 'generated');
  end if;
  -- REQUIRED_WORDS_PER_MESSAGE = 3 (`lib/core/messages.ts`). The number lives in two
  -- places on purpose: the gate rejects before the write, the constraint rejects a row
  -- that bypassed the gate (the 0019 reasoning).
  if not exists (select 1 from pg_constraint where conname = 'message_simulations_required_words_check') then
    alter table public.message_simulations
      add constraint message_simulations_required_words_check
      check (array_length(required_words, 1) = 3);
  end if;
end $$;

comment on table public.message_simulations is
  '39 § 7 · D-109: one seeded simulation — a character writes to the learner. ⛔ No other
   users exist here (39 § 1). ⛔ Not a pedagogical source (§ 7.6) — a context for practice.';
comment on column public.message_simulations.context is
  'The context chip: tourist · restaurant · teacher · hotel — closed set, Hebrew label in
   lib/core/messages.ts CONTEXT_HE. ⛔ Never free text.';
comment on column public.message_simulations.required_words is
  'Exactly three English words the situation calls for (39 § 7 «מילות חובה»). Lit one by
   one while composing; ⛔ this slice never writes answered_at (R-026).';
comment on column public.message_simulations.origin is
  '§ 7.6: generated content is marked ALWAYS. The only allowed value is generated, ⛔ no
   default — a row without a declared origin is not written.';

-- The only read of the list screen: (the learner’s level, newest first).
create index if not exists message_simulations_level_created_idx
  on public.message_simulations (cefr_level, created_at desc);

alter table public.message_simulations enable row level security;

drop policy if exists "message_simulations_select_all" on public.message_simulations;
create policy "message_simulations_select_all" on public.message_simulations
  for select to authenticated using (true);

revoke all on public.message_simulations from authenticated, anon;
grant select on public.message_simulations to authenticated;
-- ⛔ No insert · update · delete: the seed is a file (T-193), ⛔ not a client action.

-- ---------------------------------------------------------------------------
-- message_simulation_state — one row per (learner, simulation): read / answered.
-- ⚠️ Both columns exist (row ⓑ) but this slice writes read_at only — the keyboard that
-- would set answered_at is R-026.
-- ---------------------------------------------------------------------------
create table if not exists public.message_simulation_state (
  user_id       uuid not null references auth.users (id) on delete cascade,
  simulation_id uuid not null references public.message_simulations (id) on delete cascade,
  read_at       timestamptz,
  answered_at   timestamptz,
  primary key (user_id, simulation_id)
);

comment on table public.message_simulation_state is
  'The learner’s own state per simulation. Self-contained auth.uid() = user_id policies —
   the 0007 reasoning: a policy that inherits a parent filter can be voided silently.';

alter table public.message_simulation_state enable row level security;

drop policy if exists "message_simulation_state_select_own" on public.message_simulation_state;
create policy "message_simulation_state_select_own" on public.message_simulation_state
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "message_simulation_state_insert_own" on public.message_simulation_state;
create policy "message_simulation_state_insert_own" on public.message_simulation_state
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "message_simulation_state_update_own" on public.message_simulation_state;
create policy "message_simulation_state_update_own" on public.message_simulation_state
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke all on public.message_simulation_state from authenticated, anon;
grant select, insert, update on public.message_simulation_state to authenticated;
-- ⛔ No delete: a learner un-reading a message is not a product action.

commit;
