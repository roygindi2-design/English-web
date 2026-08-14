-- 0010_world_author_kind.sql — T-061 ⓐ · D-030
--
-- Apply AFTER 0007_world_schema.sql.
--
-- What: ONE column on world_posts. Nothing else.
--
-- Why: 0007 designed this table for GENERATED content — every row carries
-- generation_run_id and needs_human_review so a bad batch can be revoked (R-014).
-- D-030 now puts rows the LEARNER wrote into the same table, and the two kinds need
-- different treatment forever after: a learner row is never revoked, never sampled by
-- AQL, and never counted as content we published.
--
-- ⛔ `character_id is null` is NOT a sufficient signal. 0007 states in its own comment
--    that "a post that is not attributed to a persona is a legitimate feed item", so an
--    implicit rule breaks the first time an unattributed generated post lands.
--
-- `not null` is safe because the table is EMPTY today (T-049 loaded no rows and forbids
-- loading any). It will never be safe again — this is the one window.
--
-- ⛔ SCHEMA ONLY — this file loads not one row.
-- Idempotent and transactional, like 0006 · 0007 · 0008.

begin;

alter table public.world_posts
  add column if not exists author_kind text not null default 'learner'
    check (author_kind in ('learner','character'));

comment on column public.world_posts.author_kind is
  'Who wrote this row. ''learner'' = composed from the closed bank (D-030): never '
  'revoked, never AQL-sampled, generation_run_id is null. ''character'' = generated '
  'content under R-014.';

commit;
