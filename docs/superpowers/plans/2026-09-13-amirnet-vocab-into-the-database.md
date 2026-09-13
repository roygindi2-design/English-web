# Plan — the amirnet vocabulary stops being a file a script reads, and becomes a table

**Cycle:** C-0579 (DEV) · **Workstream:** `amirnet` (read-ahead from `msgs`) · **Milestone:** M0
**Rows covered:** `T-270` (this tick) · `T-323` (המשך של: T-270) · `T-324` (המשך של: T-270)
**REQUIRED SUB-SKILL:** ⛔ none — the three tasks run in sequence over the same derived
artefact (schema ⇒ emitter ⇒ load), so `superpowers:subagent-driven-development` does ⛔ not
apply (`RULES § 0.5` needs ≥3 **independent** items in different files).
**SKILL:** `T-270` carries `—` in its `סקיל` cell. The one skill loaded here is
`superpowers:test-driven-development` — every step below writes its test first and watches it
fail, because ⓒ of the row is a **measurement**, ⛔ not a declaration.

**המשך של: T-222** — the derivation (`scripts/build-amirnet-vocab.mjs`) is ⛔ not rewritten
here. Its five steps, its case-sensitive merge and its 6,715-row output are the **input** to
this plan, and ⛔ nothing below re-derives them.

**Goal (`plan/05-departments.md`, amirnet ①):** `T-270` — «שתי טבלאות ה-CEFR נכנסות למסד
הנתונים … ⛔ ולא נשארות קבצים שסקריפט קורא». Measured in this clone this tick, ⛔ not assumed:
`mcp__Supabase__list_tables` over `public` returns **23 tables** and ⛔ none of them is
`amirnet_vocab`; `data/generated/amirnet-vocab.csv` is **376,409 bytes** and is read ⛔ only by
`scripts/measure-amirnet-coverage.mjs`. ⇒ every consumer of the exam's vocabulary range is a
file read, and a client ⛔ cannot reach it at all.

**ⓐ is decided and is ⛔ not re-opened here.** `D-232` (C-0576) settled it: the import stays
**four tiers** (`41 § 6`, steps 3-5) and `cefr_level` is kept on the row as a source reference,
exactly as `lib/core/batchRecord.ts:185` already reads it. ⇒ ⛔ no six-level mapping, ⛔ no spec
change. What is left is ⓑ (the migration, with its `down` path in the same file) and ⓒ (coverage
**measured** against `npm run measure:amirnet-coverage`, ⛔ not asserted).

## 🧱 What binds, and what does not

- `41 § 5` — «היקף אוצר המילים של הבחינה: **1,500–3,000 מילים**. זהו הגבול העליון.» ⇒ the tier
  a row carries is exam range, ⛔ not a learner level, and this table has ⛔ no foreign key to
  `word_progress` (`R-020`) — the boundary is enforced by absence, exactly as in
  `supabase/migrations/0024_amirnet_items.sql`.
- `41 § 6` steps 3-5 — A1 dropped, C2 dropped, `A2⇒1 · B1⇒2 · B2⇒3 · C1⇒4`. The four tier names
  (`ליבה` · `ליבה מורחבת` · `הרחבה אקדמית` · `רמת פטור`) already live in
  `scripts/build-amirnet-vocab.mjs:60` and are ⛔ not re-invented in SQL.
- `RULES § 0.22` — `supabase db push` is ⛔ not reversible by a commit ⇒ the `down` path is
  written into the migration file itself before it is applied.
- ⛔ **⛔ Not a UI plan.** ⛔ No screen, ⛔ no component, ⛔ no render — `36 § 14.4` has ⛔ nothing
  to bind here.

## File Structure

```
CREATED
  supabase/migrations/0026_amirnet_vocab.sql        task 1 — the table + its down path
  scripts/build-amirnet-vocab-sql.mjs              task 2 — the emitter
  scripts/build-amirnet-vocab-sql.test.ts          task 2 — its test
  supabase/seed/0007_amirnet_vocab.sql             task 2 — GENERATED, ⛔ never hand-edited

EDITED
  package.json                                      task 2 — `build:amirnet-vocab-sql`
  scripts/measure-amirnet-coverage.mjs              task 3 — the tier counts it prints
  plan/50-tasks.md · plan/30-architecture.md · plan/00-control.md   every task
```

## Interfaces

```ts
// scripts/build-amirnet-vocab-sql.mjs — the ONE impure layer: reads a CSV, writes a SQL file.
// Parsing stays in lib/core, exactly as build-ingest-sql.mjs splits the two.
type VocabRow = {
  headword: string;      // exact, case-sensitive — the merge key of T-222
  pos: string;           // lower-cased part of speech as the profile spells it
  cefr: 'A2' | 'B1' | 'B2' | 'C1';   // the SURVIVING band, kept as source reference (D-232)
  tier: 1 | 2 | 3 | 4;                // 41 § 6 step 5
  tier_name: string;                  // Hebrew, from TIER_NAME
  amirnet_level: '1-2' | '2-3' | '3' | '4';
  is_connector: boolean;              // derived from pos, never copied (T-222)
  source: string;                     // 'CEFR-J v1.5' | 'Octanove v1.0'
};

// emits `insert into public.amirnet_vocab (...) values (...) on conflict (headword) do nothing;`
function toVocabSql(rows: VocabRow[]): string;
```

```sql
-- supabase/migrations/0026_amirnet_vocab.sql — the signature task 1 applies.
create table if not exists public.amirnet_vocab (
  headword      text     primary key,
  pos           text     not null,
  cefr_level    text     not null,          -- A2 | B1 | B2 | C1 — source reference (D-232)
  tier          smallint not null,          -- 1..4, 41 § 6 step 5
  tier_name     text     not null,
  amirnet_level text     not null,
  is_connector  boolean  not null default false,
  source        text     not null,
  created_at    timestamptz not null default now()
);
```

## Tests

Task 2's test, written first and watched fail (`superpowers:test-driven-development`):

```ts
import { describe, it, expect } from 'vitest';
import { toVocabSql } from './build-amirnet-vocab-sql.mjs';

describe('toVocabSql', () => {
  it('drops A1 and C2 before they ever reach SQL (41 § 6, steps 3-4)', () => {
    const sql = toVocabSql([
      { headword: 'abandon', pos: 'verb', cefr: 'B1', tier: 2, tier_name: 'ליבה מורחבת',
        amirnet_level: '2-3', is_connector: false, source: 'CEFR-J v1.5' },
    ]);
    expect(sql).toContain("('abandon'");
    expect(sql).not.toMatch(/'A1'|'C2'/);
  });

  it("escapes an apostrophe instead of breaking the statement", () => {
    const sql = toVocabSql([
      { headword: "o'clock", pos: 'noun', cefr: 'A2', tier: 1, tier_name: 'ליבה',
        amirnet_level: '1-2', is_connector: false, source: 'CEFR-J v1.5' },
    ]);
    expect(sql).toContain("('o''clock'");
  });

  it('is idempotent on re-apply — a second load changes nothing', () => {
    const sql = toVocabSql([]);
    expect(sql).toContain('on conflict (headword) do nothing');
  });
});
```

## Task 1 — `T-270` · the table exists, and it is reversible on paper before it is applied

- [ ] **Step 1:** write `supabase/migrations/0026_amirnet_vocab.sql` in the shape of
      `supabase/migrations/0024_amirnet_items.sql` — `create table if not exists`, every
      constraint named and added inside `do $$` (C-0032), `comment on` per column citing
      `41 § 6`, and the **`down` path written in the file's header comment** before a single
      statement runs (`RULES § 0.22`).
- [ ] **Step 2:** in the same `supabase/migrations/0026_amirnet_vocab.sql`, the four gates the
      data itself must satisfy, as named constraints:
      `amirnet_vocab_tier_check` (`tier between 1 and 4`) ·
      `amirnet_vocab_cefr_check` (`cefr_level in ('A2','B1','B2','C1')` — ⛔ A1 and C2 cannot
      be written at all) · `amirnet_vocab_level_check` (the four `amirnet_level` strings) ·
      `amirnet_vocab_headword_check` (a blank headword is ⛔ not a headword).
- [ ] **Step 3:** RLS in `supabase/migrations/0026_amirnet_vocab.sql`, in the shape
      `supabase/migrations/0024_amirnet_items.sql` already uses — `enable row level security`, a
      `select to authenticated using (true)` policy, `revoke all`, `grant select` and
      ⛔ nothing else: the table is written by this pipeline, ⛔ never by a client action.
- [ ] **Step 4:** apply it through the Supabase MCP connector (`apply_migration`, project
      `English-web`), exactly as `supabase/migrations/0024_amirnet_items.sql` records for
      `T-297`, and **verify it landed** by listing the table back — ⛔ not by believing the
      call returned.
- [ ] **Step 5:** `npm run verify` (⛔ give it a 600000ms window — it measures 183s), then
      `plan/50-tasks.md` `T-270` ⇒ 🟣 C-0579, one `plan/30-architecture.md` entry naming the
      new table, and one commit for this task alone.

## Task 2 — `T-323` · the 6,715 rows become SQL, deterministically and under a test

- [ ] **Step 1:** write `scripts/build-amirnet-vocab-sql.test.ts` exactly as above and run
      `npm test -- build-amirnet-vocab-sql` — it MUST fail on the missing module first.
- [ ] **Step 2:** `scripts/build-amirnet-vocab-sql.mjs` — read `data/generated/amirnet-vocab.csv`
      with the same `splitCsvLine` rules `scripts/build-amirnet-vocab.mjs` uses, emit
      `supabase/seed/0007_amirnet_vocab.sql`, honour `SEED_OUT_DIR` so the test COMPARES
      instead of clobbering the git-managed file (`F-048`ⓑ, the rule
      `scripts/build-ingest-sql.mjs:66` already states).
- [ ] **Step 3:** `package.json` — `"build:amirnet-vocab-sql"` pointing at
      `scripts/build-amirnet-vocab-sql.mjs`, and `supabase/seed/0007_amirnet_vocab.sql`'s own
      header says it is generated (HARD INVARIANTS: `supabase/seed/**` is ⛔ never hand-edited).
- [ ] **Step 4:** `npm run verify`, then `T-323` ⇒ 🟣 and its own commit.

## Task 3 — `T-324` · the row count is a MEASUREMENT, ⛔ not a sentence

- [ ] **Step 1:** load `supabase/seed/0007_amirnet_vocab.sql` into the live project through the
      Supabase MCP connector in batches, then read the count back with one
      `select tier, count(*) from public.amirnet_vocab group by tier order by tier`.
- [ ] **Step 2:** `scripts/measure-amirnet-coverage.mjs` — print the per-tier totals it already
      computes next to the loaded totals, so a divergence between the file and the table is a
      number on screen and ⛔ not something a later tick has to discover.
- [ ] **Step 3:** `npm run measure:amirnet-coverage` and quote its exact output in the report
      (ⓒ of the row: «מדידת כיסוי … ⛔ ולא הצהרה»), then `npm run verify` and `T-324` ⇒ 🟣.

## Self-check — ⛔ what would make this plan wrong

1. **A six-level mapping sneaking back in.** `D-232` decided four. If any step below writes
   `A1` or `C2` into the table, `amirnet_vocab_cefr_check` refuses it — the gate is in the
   schema, ⛔ not in a reviewer's memory.
2. **A migration applied with no way back.** Step 1.1 writes the `down` path into the file
   BEFORE step 1.4 applies it. ⛔ Reversed order ⇒ `RULES § 0.22` is broken and the tick ends.
3. **The file and the table drifting.** Task 3 step 2 exists for exactly this; without it
   «the vocabulary is in the database» is a claim ⛔ nobody can check.
4. **Touching `word_progress`.** ⛔ Zero foreign keys out of this table (`R-020` · `37 § 13.1`).
   The exam's vocabulary range is ⛔ not the learner's vocabulary state.
