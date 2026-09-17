-- 0028_study_level_cursor.sql — «סינון מילים» remembers where the learner stopped (T-411 · F-277 · D-266).
--
-- Applied through the Supabase MCP connector (`apply_migration`) by the DEV tick that builds
-- T-411, and ⛔ never left for Roy (D-163). Verified after apply by reading the table back.
--
-- 🔴 **What this closes, ⛔ and not a general description.** `F-277` is Roy's own product
-- report of 17/09 — «אני מסנן כל פעם את אותן עשרים מילים במקום להתחיל מאיפה שסיימתי». Measured
-- in code (`C-0682`, re-measured `C-0686`): `loadLevelWords` is `.eq(band).order(...).limit(200)`,
-- `selectDeck(rows,'level',limit)` excludes nothing, and `grep` for `cursor` · `offset` ·
-- `last_seen` · `seen_at` across the whole path returned **zero**. ⇒ a learner who BROWSES and
-- never GRADES sees the same first page forever, because the only place the product records
-- "met" is `word_progress`, which is written on GRADING alone (`review` · `practice` ·
-- `levels/scan`).
--
-- ⛔ **A place-marker, ⛔ and ⛔ not a filter on `word_progress`** (`D-032` · `D-033`): «סינון
-- מילים» is defined by the LEVEL, so a word already known is still in the level. This table
-- says where the learner STOPPED, ⛔ never what they know. ⛔ And ⛔ not `not.in` in the query
-- either — `lib/core/deck.ts:196` already measured why the URL breaks with the history.
--
-- 🔬 **Why the key is a PAIR and ⛔ not `ngsl_rank` alone, and it is a MEASUREMENT taken on the
-- live database on 2026-09-17, ⛔ not a preference:**
--     select count(*), count(ngsl_rank) from words;   ⇒  476 rows, **0** with a rank.
-- Every band is 100% NULL (A1 315 · A2 116 · B1 37 · B2 8). ⇒ a cursor that stored the last
-- `ngsl_rank` — which is what `T-411`ⓐ asks for in words — would be **structurally dead on
-- arrival**: `ngsl_rank > null` selects nothing, and the learner would get an empty deck on
-- the second open instead of the same twenty words. ⇒ the cursor carries the ordering key the
-- deck ACTUALLY orders by, which is `(ngsl_rank nulls last, id)`, and `last_ngsl_rank` stays
-- NULLABLE so it keeps working unchanged on the day the NGSL ingest (`T-007`) fills the column.
-- ⇒ recorded as `F-278` and under `RULES § 0.22`.
--
-- ⛔ **One row per (learner, band), ⛔ and ⛔ not one per learner** — `?band=` is a parameter of
-- the deck since `T-408`, so a learner who filters B1 and then A1 has two places, ⛔ not one that
-- overwrites the other. ⛔ And ⛔ no foreign key to `words`: a content reload must ⛔ never delete
-- a learner's place. `last_word_id` is kept as a FACT about what was served (the same reasoning
-- `0025`/`0027` already wrote down for `item_id`).
--
-- ⛔ **Zero score, zero count, zero timestamp of "study time"** — this is a bookmark. «How far
-- into the level am I» is DERIVED from it in `lib/core/levelSummary.ts` (T-413), ⛔ never stored.
--
-- Down (manual — this file's statements are never re-run automatically by
-- `supabase db push`; apply by hand if this ever needs reverting):
--   drop table if exists public.study_level_cursor;
--
-- Idempotent: `create table if not exists`, every policy dropped and recreated by name.

begin;

create table if not exists public.study_level_cursor (
  user_id        uuid not null references auth.users (id) on delete cascade,
  band           text not null,
  last_ngsl_rank integer,
  last_word_id   uuid not null,
  updated_at     timestamptz not null default now(),
  primary key (user_id, band)
);

comment on table public.study_level_cursor is
  'T-411 · F-277 · D-266 — where the learner stopped in «סינון מילים», per band. ⛔ Not a
   progress record and ⛔ not a filter on word_progress (D-032/D-033): the deck is defined by
   the LEVEL, and this says only which page of it was last SERVED.';
comment on column public.study_level_cursor.last_ngsl_rank is
  'The ngsl_rank of the last word served, ⛔ nullable ON PURPOSE. Measured 2026-09-17 on the
   live database: 0 of 476 words carry a rank, so a non-null cursor column would make the deck
   return nothing on the second open. The deck orders by (ngsl_rank nulls last, id) and the
   cursor is that same pair — it starts working the day T-007 fills the column, unchanged.';
comment on column public.study_level_cursor.last_word_id is
  'The tie-break half of the ordering key. ⛔ Deliberately NOT a foreign key to words: a content
   reload must ⛔ never delete a learner''s place in the level (0025 · 0027, same reasoning).';

alter table public.study_level_cursor enable row level security;

-- Self-contained `auth.uid() = user_id` policies — the 0007/0023/0025/0027 reasoning: a policy
-- that inherits a parent filter can be voided silently.
drop policy if exists "study_level_cursor_select_own" on public.study_level_cursor;
create policy "study_level_cursor_select_own" on public.study_level_cursor
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "study_level_cursor_insert_own" on public.study_level_cursor;
create policy "study_level_cursor_insert_own" on public.study_level_cursor
  for insert to authenticated with check (auth.uid() = user_id);

-- ⛔ `update` IS granted here and in ⛔ none of 0025/0027, and the difference is the point: an
-- attempt is a fact that is written once, a bookmark MOVES. The policy still confines it to the
-- learner's own row, on both sides of the write.
drop policy if exists "study_level_cursor_update_own" on public.study_level_cursor;
create policy "study_level_cursor_update_own" on public.study_level_cursor
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ⛔ `delete` is granted because the ONE action the end-of-level screen offers (T-412) is
-- «start this level again», and that is exactly the removal of this row. ⛔ It deletes a
-- bookmark, ⛔ never a learner's progress — `word_progress` is a different table.
drop policy if exists "study_level_cursor_delete_own" on public.study_level_cursor;
create policy "study_level_cursor_delete_own" on public.study_level_cursor
  for delete to authenticated using (auth.uid() = user_id);

revoke all on public.study_level_cursor from authenticated, anon;
grant select, insert, update, delete on public.study_level_cursor to authenticated;

commit;
