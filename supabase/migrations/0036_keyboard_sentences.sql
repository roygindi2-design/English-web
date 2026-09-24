-- 0036_keyboard_sentences.sql — the database knows which sentences the block keyboard can
-- send (T-475 · F-327 · D-289 ⓑ).
--
-- 0034's functions are `grant execute … to authenticated`, so the route's keyboard check
-- (`fromKeyboard`) is ⛔ not a gate: `/rest/v1/rpc/add_reply` takes free text directly.
-- The fence moves INTO the database as a closed set of fingerprints — one bigint per
-- sendable sentence — and 0037 checks against it. ⛔ The tree itself never enters the
-- database; only what answers «yes / no».
--
-- The fingerprint is `hashtextextended(keyboard_norm(s), 0)`, and ⛔ nothing outside
-- Postgres computes it. `keyboard_norm` is `keyboardNorm` in `lib/core/continuations.ts`,
-- letter for letter: lower-case · every run of anything but a-z and ' ⇒ one space · trim.
--
-- RLS on, ⛔ no policy: no client reads the table; only `security definer` functions do.
--
-- The rows are loaded by `node scripts/load-keyboard-sentences.mjs --load <sha>` (the
-- database walks the pinned `continuations.json` itself, so the hash is computed in ONE
-- place) and read back by count: Node's count == `select count(*)`.
-- Measured before applying (C-0810): 407,156 distinct sendable sentences — the 554,616 in
-- D-289 is the index's SOURCE sentence count, before duplicates collapse — ≈20 MB with
-- the primary key, against a 15 MB database.
--
-- Down (manual): drop table public.keyboard_sentences;
--   drop function public.keyboard_sentence_hash(text); drop function public.keyboard_norm(text);

begin;

create or replace function public.keyboard_norm(t text)
returns text
language sql
immutable
strict
parallel safe
as $$
  select btrim(regexp_replace(lower(t), '[^a-z'']+', ' ', 'g'))
$$;

create or replace function public.keyboard_sentence_hash(t text)
returns bigint
language sql
immutable
strict
parallel safe
as $$
  select hashtextextended(public.keyboard_norm(t), 0)
$$;

create table if not exists public.keyboard_sentences (
  h bigint primary key
);

alter table public.keyboard_sentences enable row level security;
revoke all on public.keyboard_sentences from anon, authenticated;

commit;
