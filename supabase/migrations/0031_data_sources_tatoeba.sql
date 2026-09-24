-- 0031_data_sources_tatoeba.sql — adds the `tatoeba` row to `public.data_sources`
-- (T-460 · D-283 · `lib/core/dataSources.ts` id `tatoeba`).
--
-- The block keyboard's continuation tree (`data/generated/continuations.json`,
-- `scripts/build-continuations.mjs`) is derived from Tatoeba's English sentences,
-- CC BY 2.0 FR ⇒ the credit belongs on /sources beside every other source.
--
-- ⛔ A new file, ⛔ not an edit to 0003b or 0020 — same reason 0020 gives: a row
-- added after its predecessors landed belongs in a new migration.
-- Idempotent: `on conflict (id) do nothing`, the pattern of 0003b and 0020.
--
-- down: `delete from public.data_sources where id = 'tatoeba';` — safe while no
-- `source_id` column points at the row (none does: the tree is a generated file,
-- ⛔ not ingested content).

insert into public.data_sources (id, name, licence, url) values
  ('tatoeba', 'Tatoeba', 'CC BY 2.0 FR', 'https://tatoeba.org/')
on conflict (id) do nothing;
