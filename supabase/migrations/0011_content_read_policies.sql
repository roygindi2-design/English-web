-- F-051 — one read rule per content table.
--
-- 0003 meant to REPLACE the four read policies 0002 created. It dropped
-- "read approved content", "read distractors" and "read items" — three names no
-- migration has ever created — so the drops were silent no-ops and 0002's policies
-- survived beside the new ones. Since 0003, every content table has carried two live
-- SELECT policies.
--
-- Nothing broke, and that is the danger. Postgres ORs permissive policies, so the
-- effective rule has matched D-024's intent by accident: `using (true)` on senses and
-- sense_examples subsumed the stricter 0002 predicate, and on sense_items /
-- sense_distractors the two predicates are character-for-character the same test.
-- The stated rule and the enforced rule were different documents, and the scoring
-- material lands in exactly these tables next.
--
-- ⛔ This migration is a no-op at runtime, by construction: it drops only the policy
--    that its table's surviving policy already subsumed. It is safe to apply on a
--    database where 0003 ran, and on one where it did not (`if exists`).
-- ⛔ 0003 itself is NOT edited. An applied migration is never re-hashed
--    (scripts/migration-hygiene.test.ts).

begin;

-- D-024: a low-confidence sense is SHOWN and MARKED. "read all senses" (0003) already
-- returned it; content_senses_select only ever narrowed a set that was already whole.
drop policy if exists "content_senses_select" on public.senses;

-- The example follows the sense, same rule, same reason.
drop policy if exists "content_examples_select" on public.sense_examples;

-- D-024 the other way: scoring material tied to a low-confidence sense stays withheld.
-- "read verified items" / "read verified distractors" (0003) enforce precisely the
-- predicate these two carried, so removing them changes no row's visibility.
drop policy if exists "content_items_select" on public.sense_items;
drop policy if exists "content_distractors_select" on public.sense_distractors;

commit;
