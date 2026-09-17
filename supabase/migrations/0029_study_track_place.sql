-- 0029_study_track_place.sql — «המיקום במסלול נשמר לכניסה הבאה» (T-409 · `36 § 13.2` שורה 5,
-- חותמת ⓒ · D-176).
--
-- Applied through the Supabase MCP connector (`apply_migration`) by the DEV tick that builds
-- T-409, and ⛔ never left for Roy (D-163). Verified after apply by reading the table back.
--
-- 🔴 **What this closes, ⛔ and not a general description.** `36 § 13.2` stamp ⓒ is the one
-- stamp `studies` does not carry: measured in this clone (`C-0697`) — `<StudiesScreen>` opens
-- on `STUDY_TRACKS[0]` unconditionally (`useState(STUDY_TRACKS[0].id)`), and `grep -rn
-- "study_track\|track_place" app/ lib/ components/` returned **zero**. ⇒ a learner who spends a
-- week in `הבנת הנקרא` is handed `אוצר מילים` every single morning, and a module he opened
-- yesterday is somewhere down a list he has to find again. `T-408` gave the way back **from an
-- item** (a `#` anchor that lives in the URL); an anchor ⛔ cannot survive closing the tab.
--
-- ⛔ **A bookmark, ⛔ and ⛔ not progress** — the same separation `0028` already wrote down.
-- ⛔ Zero score, ⛔ zero counter, ⛔ zero "study time". «How far into the track am I» is
-- already DERIVED from `GET /api/levels/summary` (`lib/core/studyTracks.ts`, `trackModules`),
-- ⛔ and is never stored here. ⛔ And ⛔ never a gate: `R-017` forbids locking between levels,
-- and a place-marker that decided what may be opened would be exactly that. It decides only
-- what is shown FIRST.
--
-- ⛔ **One row per (learner, track), ⛔ and ⛔ not one per learner.** The four tracks of
-- `36 § 9` are four places, ⛔ not one field that the last tap overwrites — a learner who
-- checks `דקדוק` for a second must ⛔ not lose where he was in `אוצר מילים`. «Which track do I
-- open on» is then DERIVED as the newest of the rows (`lib/core/studyPlace.ts`,
-- `latestStudyPlace`), ⇒ ⛔ no second column that can disagree with the rows it summarises.
--
-- ⛔ **`module_id` is `text` and NULLABLE, and ⛔ neither half of that is laziness:**
--   ⓐ NULLABLE — `36 § 9` says `דקדוק` · `כתיבה` · `הבנת הנקרא` have ⛔ no modules at all,
--      ⇒ «I was in `הבנת הנקרא`» is a complete place with ⛔ no module in it. A NOT NULL
--      column would have made the three content-less tracks unrecordable.
--   ⓑ `text` and ⛔ no foreign key — a module id is a CEFR band today (`trackModules` builds
--      it as `level.level`) and the track decides what it means tomorrow. ⛔ And a content
--      reload must ⛔ never delete a learner's place, which is the same reasoning `0025`,
--      `0027` and `0028` already wrote for `item_id` / `last_word_id`.
--
-- ⛔ **`track_id` carries a `check`, and it is ⛔ not decoration:** the four ids are the
-- closed vocabulary of `lib/core/studyTracks.ts:StudyTrackId`. The route validates against the
-- same list (`parseStudyTrackId`), ⇒ this is the second wall, ⛔ not the only one.
--
-- Down (manual — this file's statements are never re-run automatically by
-- `supabase db push`; apply by hand if this ever needs reverting):
--   drop table if exists public.study_track_place;
--
-- Idempotent: `create table if not exists`, every policy dropped and recreated by name.

begin;

create table if not exists public.study_track_place (
  user_id    uuid not null references auth.users (id) on delete cascade,
  track_id   text not null check (track_id in ('vocabulary', 'grammar', 'writing', 'reading')),
  module_id  text,
  updated_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

comment on table public.study_track_place is
  'T-409 · 36 § 13.2 שורה 5 (חותמת ⓒ) — where the learner stopped inside a study track, one
   row per (learner, track). ⛔ Not a progress record and ⛔ not a gate (R-017): it decides
   what the לימודים screen opens on, ⛔ never what may be opened.';
comment on column public.study_track_place.module_id is
  '⛔ NULLABLE on purpose: 36 § 9 gives דקדוק · כתיבה · הבנת הנקרא ⛔ no modules, so the track
   alone is a complete place. ⛔ And ⛔ no foreign key — a content reload must ⛔ never delete a
   learner''s place (0025 · 0027 · 0028, same reasoning).';
comment on column public.study_track_place.updated_at is
  'The ONLY ordering key. «Which track do I open on» is derived as the newest row
   (lib/core/studyPlace.ts, latestStudyPlace) ⇒ ⛔ no separate "last track" column that could
   disagree with the rows it summarises.';

alter table public.study_track_place enable row level security;

-- Self-contained `auth.uid() = user_id` policies — the 0007/0023/0025/0027/0028 reasoning: a
-- policy that inherits a parent filter can be voided silently.
drop policy if exists "study_track_place_select_own" on public.study_track_place;
create policy "study_track_place_select_own" on public.study_track_place
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "study_track_place_insert_own" on public.study_track_place;
create policy "study_track_place_insert_own" on public.study_track_place
  for insert to authenticated with check (auth.uid() = user_id);

-- ⛔ `update` IS granted, exactly as in 0028 and in ⛔ none of 0025/0027: an attempt is a fact
-- written once, a bookmark MOVES.
drop policy if exists "study_track_place_update_own" on public.study_track_place;
create policy "study_track_place_update_own" on public.study_track_place
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ⛔ `delete` is granted to the learner and to ⛔ nobody else: it is his own bookmark, and the
-- cascade above is what removes it when the account goes. ⛔ It deletes a place, ⛔ never
-- progress — `word_progress` is a different table.
drop policy if exists "study_track_place_delete_own" on public.study_track_place;
create policy "study_track_place_delete_own" on public.study_track_place
  for delete to authenticated using (auth.uid() = user_id);

revoke all on public.study_track_place from authenticated, anon;
grant select, insert, update, delete on public.study_track_place to authenticated;

commit;
