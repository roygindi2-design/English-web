-- D-024 — "low confidence" stops meaning "hidden".
--
-- 0002 hid every low-confidence sense from learners. The intent was to protect
-- them from a wrong translation. The effect was worse: a word the generator was
-- merely UNSURE about vanished entirely, so the learner never met it at all.
--
-- For a vocabulary product that trade is backwards. "Not certain which of two
-- near-equivalent Hebrew words is best" is not the same as "wrong". Dropping the
-- word costs a real learning opportunity to avoid a small risk of imprecision.
--
-- New meaning of translation_confidence:
--   high / medium -> shown everywhere, usable in scoring items
--   low           -> STILL SHOWN as a study card, flagged in the UI, and
--                    EXCLUDED from scoring items until a human confirms it
-- A wrong translation is still unacceptable — that is what the gate and the
-- 80-item spot check are for. This column expresses uncertainty, not error.

alter table senses
  add column if not exists needs_human_review boolean not null default false;

comment on column senses.needs_human_review is
  'true when translation_confidence = low at insert time. The card is shown to '
  'the learner with a "not yet verified" marker, but never used to score an item.';

update senses set needs_human_review = true where translation_confidence = 'low';

-- Learners may now read every sense, including low-confidence ones.
drop policy if exists "read approved content" on senses;
create policy "read all senses" on senses
  for select to authenticated using (true);

-- Examples follow the sense: a low-confidence sense still gets its example.
drop policy if exists "read examples" on sense_examples;
create policy "read examples" on sense_examples
  for select to authenticated using (true);

-- Scoring material is the one thing a low-confidence sense does NOT get.
-- An item whose answer we are unsure of would mark a correct learner wrong.
drop policy if exists "read distractors" on sense_distractors;
create policy "read verified distractors" on sense_distractors
  for select to authenticated using (
    exists (select 1 from senses s
            where s.id = sense_id and s.translation_confidence <> 'low'));

drop policy if exists "read items" on sense_items;
create policy "read verified items" on sense_items
  for select to authenticated using (
    exists (select 1 from senses s
            where s.id = sense_id and s.translation_confidence <> 'low'));

create index if not exists senses_needs_review_idx
  on senses (needs_human_review) where needs_human_review;
