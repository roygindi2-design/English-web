# Layer-2 Schema — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the three schema changes that `plan/01-vision.md` § "שכבה 2" marks as *cheap today, impossible retroactively* — track/exam fields on content rows, the two assembly-bank fields, and the world tables — **as empty columns and empty tables only**. Every existing row stays `NULL`. ⛔ No UI, no track-selection logic, no closed lists of function words or age ranges, and not one content row is classified.

**Loop tasks covered:** **T-047** (Task 1), **T-048** (Task 2), **T-049** (Task 3). Task 4 is a hygiene guard on the migration directory itself, justified by a measured defect (two files share the `0003_` prefix) that this plan's own numbering would otherwise inherit.

**Why now, in one sentence PM already wrote:** a migration on an empty table costs zero; the same migration after the content bank is loaded costs a rewrite of every batch. `migrations/` reaches `0005` and the DB has no content rows yet (5 content batches exist as `data/generated/*.jsonl` files, never inserted — measured C-0048). This is the last cheap moment.

**Tech Stack:** PostgreSQL (Supabase), applied by hand in the SQL editor. Vitest for the guards. **No TypeScript module is created and no runtime dependency is added** — there is no consumer yet, and a type with no consumer is a second source of truth waiting to drift.

## Global Constraints

- ⛔ **Schema only.** No `app/`, no `components/`, no `lib/core/`. `docs/api-contract.md` is **not** touched: no endpoint changes.
- ⛔ **Nothing is classified.** Every new column is nullable (one deliberate exception, Task 2 ⓐ, argued there) and every existing row keeps `NULL`. Filling `grade_level` or `lexical_class` is a pedagogical claim and needs a source in `plan/10-pedagogy.md` first — it is explicitly **out of scope** per the T-047/T-048 rows.
- **Idempotent, re-runnable, transactional.** `add column if not exists` / `create table if not exists` throughout, named constraints added inside `do $$ … end $$` guards (the pattern 0003 and 0004 already use, because `add column … check (…)` is skipped *wholesale* when the column exists and would ship the constraint missing). Both files wrap in `begin; … commit;` like 0002 — a half-applied multi-statement migration is worse than none.
- **RLS is not optional.** A table without RLS on Supabase is a public table: the anon key is in the browser. Every new table in Task 3 gets RLS plus owner-scoped policies, mirrored from `0001_profiles.sql`.
- Verification before any completion claim: `npm run typecheck && npm run check:core && npm test && npm run build`.
- Commit messages carry no `[skip ci]` (RULES § 0.7). Push to `dev` only. ⛔ Never `main`.

---

## What is measured, not assumed

Run in this repo on 2026-08-12 (`ls`, `grep -n`, `sed`):

| fact | measured value |
|---|---|
| migration files present | `0001_profiles` · `0002_content_bank` · **`0003_low_confidence_is_visible`** · **`0003_provenance_telemetry`** · `0004_onboarding_answers` · `0005_review_state` |
| files sharing a numeric prefix | **`0003_` × 2** — apply order between them is decided by nothing but alphabetical luck |
| migrations wrapped in `begin;/commit;` | 2 of 6 (`0002`, `0003_provenance`) |
| `public.words` already carries | `is_function_word boolean not null default false` (`0002_content_bank.sql:53`), `track_id`/`source_id`/`origin` (0003) |
| `public.word_progress` primary key | `(user_id, word_id)` — one aggregate row per pair (W4), **not** an event log |
| `public.sense_items` columns | `id · sense_id · stem · blank_token · item_index` — no provenance columns at all today |
| existing per-learner RLS shape | `for select using (auth.uid() = user_id)` + insert/update, **no delete policy** (0001, 0003) |
| content rows in the database | **0** — the 5 batches live only as `data/generated/batch-*.jsonl` |
| suite size at plan time | 548 tests, 36 files |

**The consequence that changes Task 2, stated before any code is written:** `words.is_function_word` **already exists** and already expresses part of what T-048 ⓑ asks `lexical_class` to express. It is `not null default false`, which means it cannot say *"unknown"* — every row that nobody has classified reads as *"this is a content word"*. `lexical_class text null` can say all three things. So the two columns are not duplicates of equal standing: one is strictly more expressive, and the older one is now a **derived** view of it. Task 2 lands `lexical_class`, forbids the two from contradicting each other with a check constraint, and **does not drop `is_function_word`** — dropping a column is destructive and is a PM call, recorded to `plan/03-for-roy.md` in the same tick, not decided here.

---

## What this plan deliberately does NOT do

- **It does not populate anything.** No `update … set lexical_class = …`, no backfill, no default other than `NULL`.
- **It does not mint the closed list of function words** (T-048 says so explicitly) and **does not invent age ranges** (T-047 says so explicitly). `grade_level` therefore gets **no** check constraint: a `check` there would *be* the invented list.
- **It does not drop or rewrite `is_function_word`.** See above.
- **It does not touch `word_progress`'s missing `revoke`/`grant` block.** 0002 revokes default privileges explicitly (RLS does not block `TRUNCATE`); 0003 does not do this for `word_progress`. Task 3 does it for the new world tables, and the gap on `word_progress` is recorded as debt in `plan/30-architecture.md` at execution time — fixing someone else's table is a scope leak.
- **It does not load a single world row.** T-049's row says schema is allowed and loading is not. (Its blocking note names F-020, which closed in C-0012 — but R-014 still forbids releasing generated content before the gate and the AQL sample, so the ban stands on its own feet.)

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/0006_layer2_track_and_bank.sql` | **Create.** T-047 (Task 1) then T-048 (Task 2), appended into the same transaction. PM's own numbering: both task rows name `0006_*.sql`. |
| `lib/supabase/layer2.test.ts` | **Create.** Guards 0006 the only way it can be guarded without a live project — against the shipped SQL text. Same approach and same limits as `rls.test.ts` / `telemetry.test.ts`. |
| `supabase/migrations/0007_world_schema.sql` | **Create.** T-049 — four tables, provenance columns, RLS, explicit grants. |
| `lib/supabase/worldSchema.test.ts` | **Create.** Guards 0007. |
| `scripts/migration-hygiene.test.ts` | **Create.** Task 4 — unique numeric prefix, no gaps, every file readable. |
| `docs/api-contract.md` | **Not touched.** No endpoint changes in this plan. |
| `plan/03-for-roy.md` | **Modify** (Task 2) — one row: `is_function_word` vs `lexical_class`, PM/Roy's call. |

---

## Interfaces

The interface of a migration is its DDL. These are the exact signatures the tests assert against; a step that produces different column names or nullability has not done the task.

```sql
-- ── T-047 · Task 1 ─────────────────────────────────────────────────────────
public.words.exam_type          text NULL
public.words.grade_level        text NULL
public.senses.exam_type         text NULL
public.senses.grade_level       text NULL
public.sense_items.exam_type    text NULL
public.sense_items.grade_level  text NULL
constraint words_exam_type_check  check (exam_type is null or exam_type in ('amiram','psychometric','bagrut'))
constraint senses_exam_type_check      -- same predicate
constraint sense_items_exam_type_check -- same predicate
index words_exam_type_idx on public.words (exam_type) where exam_type is not null

-- ── T-048 · Task 2 ─────────────────────────────────────────────────────────
public.word_progress.is_active_this_week  boolean NOT NULL default false
public.words.lexical_class                text NULL
constraint words_lexical_class_check
  check (lexical_class is null or lexical_class in ('function','content'))
constraint words_lexical_class_agrees
  check (lexical_class is null or is_function_word = (lexical_class = 'function'))

-- ── T-049 · Task 3 ─────────────────────────────────────────────────────────
public.world_characters    (id, user_id, display_name, persona_en,
                            generation_run_id, needs_human_review, created_at)
public.world_posts         (id, user_id, character_id NULL, body_en,
                            generation_run_id, needs_human_review, created_at)
public.world_conversations (id, user_id, character_id, topic_en NULL,
                            generation_run_id, needs_human_review, created_at)
public.world_messages      (id, user_id, conversation_id, author,
                            body_en, generation_run_id, needs_human_review, created_at)
-- every one of the four: user_id uuid not null references auth.users(id) on delete cascade
-- every one of the four: RLS enabled + select/insert/update policies on auth.uid() = user_id
```

**Three signature choices that are behaviour, not style:**

ⓐ **`exam_type` is checked, `grade_level` is not.** The three exam names are transcribed verbatim from `plan/01-vision.md` § שכבה 2 א׳ (אמיר"ם · פסיכומטרי · בגרות) — that is transcription, not invention, and free text would drift `amiram`/`Amiram`/`amiram ` past every reader. Grade level is the part the vision leaves as "כיתות א׳–י״ב" with no schema — writing a check for it *is* the invented age range T-047 forbids.

ⓑ **`is_active_this_week` is `not null default false`, and it is the only non-nullable column in this plan.** Same argument 0003 already made for `consecutive_correct_recognition`: "this word is not in this week's active set" is a **measurement**, not an unknown. A nullable flag would make every reader write `coalesce(is_active_this_week, false)` and one of them eventually would not.

ⓒ **`world_messages.user_id` is carried on the row even though it is reachable through `conversation_id`.** 0002 documents the exact failure this avoids: its child tables (`sense_examples`, `sense_distractors`, `sense_items`) needed an `exists (…)` subquery in every policy to inherit the parent's filter, and a `using (true)` on any one of them would have silently voided it. A self-contained `auth.uid() = user_id` on each world table cannot be voided by a mistake on the parent.

---

## Task 1 — T-047: exam/grade fields on every content row

**Files:** `supabase/migrations/0006_layer2_track_and_bank.sql` (create) · `lib/supabase/layer2.test.ts` (create)

- [ ] Create `supabase/migrations/0006_layer2_track_and_bank.sql` with the header comment (what, why now, and "apply after 0005"), `begin;`, and the six `alter table … add column if not exists` statements exactly as in the Interfaces block.
- [ ] Add the three named `exam_type` check constraints inside a single `do $$ … end $$` block, each guarded by `if not exists (select 1 from pg_constraint where conname = '…')`.
- [ ] Add `create index if not exists words_exam_type_idx on public.words (exam_type) where exam_type is not null;` — partial, so it occupies nothing while every row is `NULL`.
- [ ] Add `comment on column public.words.grade_level` stating in one line that the closed list is deliberately absent and needs a pedagogical source. Close with `commit;`.
- [ ] Create `lib/supabase/layer2.test.ts` with the code below and run `npx vitest run lib/supabase/layer2.test.ts`.

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guards T-047/T-048 where they can be guarded without a live project: the
 * migration text we ship. Same limit as rls.test.ts — this proves what is in
 * the file, not what was applied to a given Supabase project. Applying it is a
 * manual step (plan/03-for-roy.md).
 */
const MIGRATION = readFileSync('supabase/migrations/0006_layer2_track_and_bank.sql', 'utf8');
/** Comments are stripped first: C-0032's lesson — a rule EXPLAINED in a comment
 *  satisfies a positive regex that is supposed to prove the rule is IMPLEMENTED. */
const SQL = MIGRATION.replace(/--[^\n]*/g, '').toLowerCase();

describe('0006 — T-047 track fields', () => {
  it('is wrapped in one transaction', () => {
    expect(SQL).toMatch(/\bbegin\s*;/);
    expect(SQL).toMatch(/\bcommit\s*;/);
  });

  it('puts exam_type and grade_level on all three content tables', () => {
    for (const table of ['words', 'senses', 'sense_items']) {
      for (const column of ['exam_type', 'grade_level']) {
        expect(SQL, `${table}.${column} is missing`).toMatch(
          new RegExp(`alter table public\\.${table}\\s+add column if not exists\\s+${column}\\b`),
        );
      }
    }
  });

  it('adds every new column as nullable — no existing row may be classified', () => {
    // T-047: "הכול נשאר NULL עד שיהיה מקור". A `not null default 'amiram'` here
    // would classify all 2,809 future NGSL rows as Amiram content by accident.
    const adds = SQL.match(/add column if not exists\s+(exam_type|grade_level)[^;]*/g) ?? [];
    expect(adds.length).toBe(6);
    for (const add of adds) expect(add).not.toMatch(/not null|default/);
  });

  it('constrains exam_type to the three names the vision states, and nothing more', () => {
    const checks = SQL.match(/check \(exam_type[^)]*\)[^)]*\)/g) ?? [];
    expect(checks.length).toBe(3);
    for (const c of checks) {
      expect(c).toContain("'amiram'");
      expect(c).toContain("'psychometric'");
      expect(c).toContain("'bagrut'");
      expect(c).toMatch(/exam_type is null or/); // NULL must stay legal
    }
  });

  it('does NOT constrain grade_level — a closed list there is the invented age range', () => {
    expect(SQL).not.toMatch(/check \(\s*grade_level/);
  });

  it('adds constraints under guarded names so re-applying is a no-op', () => {
    for (const name of ['words_exam_type_check', 'senses_exam_type_check', 'sense_items_exam_type_check']) {
      expect(SQL).toContain(`conname = '${name}'`);
      expect(SQL).toContain(`add constraint ${name}`);
    }
  });

  it('indexes exam_type partially, so it costs nothing while every row is null', () => {
    expect(SQL).toMatch(
      /create index if not exists words_exam_type_idx[\s\S]{0,80}where exam_type is not null/,
    );
  });
});
```

- [ ] **Self-check by mutation, run each and record the failing test name:** ⓐ change one `add column if not exists exam_type` to `… not null default 'amiram'` → *"adds every new column as nullable"* must fail. ⓑ add `check (grade_level in ('1','2'))` → *"does NOT constrain grade_level"* must fail. ⓒ drop `'bagrut'` from one check → *"constrains exam_type to the three names"* must fail. ⓓ move the whole `words_exam_type_check` block into a `--` comment → the constraint test must fail (this is what stripping comments buys). Revert all four.

---

## Task 2 — T-048: the two assembly-bank fields

**Files:** `supabase/migrations/0006_layer2_track_and_bank.sql` (modify — append before `commit;`) · `lib/supabase/layer2.test.ts` (modify) · `plan/03-for-roy.md` (modify)

- [ ] Append to 0006, **inside the existing transaction**, before `commit;`:
  `alter table public.word_progress add column if not exists is_active_this_week boolean not null default false;`
  and `alter table public.words add column if not exists lexical_class text;`
- [ ] Append the two named check constraints (`words_lexical_class_check`, `words_lexical_class_agrees`) to the existing `do $$ … end $$` block, each with its own `if not exists (select 1 from pg_constraint …)` guard.
- [ ] Add `comment on column public.words.lexical_class` and `comment on column public.words.is_function_word` — the first says NULL means *unknown* and the closed list of function words is not part of this task; the second says it is **superseded** by `lexical_class`, kept because dropping a column is destructive and is not Dev's call.
- [ ] Add `comment on column public.word_progress.is_active_this_week` — one line: this is the assembly-bank flag, it stays on the **existing aggregate row** (W4: the free Supabase tier), and it is emphatically not a new events table.
- [ ] Append the block below to `lib/supabase/layer2.test.ts` and run the file.

```ts
describe('0006 — T-048 assembly-bank fields', () => {
  it('puts is_active_this_week on the EXISTING aggregate row, not a new table', () => {
    expect(SQL).toMatch(
      /alter table public\.word_progress\s+add column if not exists\s+is_active_this_week\s+boolean/,
    );
    // W4: an events table on the free tier grows without a ceiling. If a future
    // edit ever creates one here, this test is the thing that says no.
    expect(SQL).not.toMatch(/create table[\s\S]{0,80}active_word/);
  });

  it('makes the weekly flag not-null — "not active" is a measurement, not an unknown', () => {
    expect(SQL).toMatch(/is_active_this_week\s+boolean\s+not null\s+default\s+false/);
  });

  it('adds lexical_class as NULLABLE — unknown is the honest state for every row', () => {
    expect(SQL).toMatch(/alter table public\.words\s+add column if not exists\s+lexical_class\s+text\s*;/);
  });

  it('does not classify a single existing row', () => {
    // The whole point of T-048: columns land empty. An UPDATE here would be a
    // pedagogical claim with no source behind it.
    expect(SQL).not.toMatch(/update\s+public\.words/);
    expect(SQL).not.toMatch(/update\s+public\.word_progress/);
  });

  it('forbids lexical_class and is_function_word from contradicting each other', () => {
    // words.is_function_word (0002:53) already encodes half of this fact and
    // cannot say "unknown". Until PM decides which one survives, the database
    // refuses to hold both answers at once.
    expect(SQL).toContain('words_lexical_class_agrees');
    expect(SQL).toMatch(/is_function_word\s*=\s*\(\s*lexical_class\s*=\s*'function'\s*\)/);
  });

  it('keeps NULL legal under both lexical_class constraints', () => {
    const guards = SQL.match(/check \(lexical_class[^;]*/g) ?? [];
    expect(guards.length).toBe(2);
    for (const g of guards) expect(g).toMatch(/lexical_class is null or/);
  });
});
```

- [ ] Add one row to the **פתוח** table in `plan/03-for-roy.md`: next free number, requester `DEV (C-00XX)`, today's date from `date -u`, asking PM/Roy to decide whether `is_function_word` is dropped in favour of `lexical_class` or kept as the canonical boolean — with the measured note that `not null default false` cannot express *unknown*. **חוסם? לא.**
- [ ] **Self-check by mutation:** ⓐ make `lexical_class` `not null default 'content'` → *"adds lexical_class as NULLABLE"* must fail. ⓑ delete the `words_lexical_class_agrees` constraint → *"forbids … from contradicting each other"* must fail. ⓒ add `update public.words set lexical_class = 'content' where is_function_word = false;` → *"does not classify a single existing row"* must fail. ⓓ drop `not null` from the weekly flag → *"makes the weekly flag not-null"* must fail. Revert all four.

---

## Task 3 — T-049: the world schema

**Files:** `supabase/migrations/0007_world_schema.sql` (create) · `lib/supabase/worldSchema.test.ts` (create)

- [ ] Create `supabase/migrations/0007_world_schema.sql`: header comment (four tables, every row is generated content and therefore carries `generation_run_id` + `needs_human_review`, ⛔ **no rows are loaded by this file**, R-014), then `begin;`.
- [ ] Write the four `create table if not exists` statements exactly as in the Interfaces block. `world_messages.author` gets `check (author in ('learner','character'))`. Every table: `user_id uuid not null references auth.users (id) on delete cascade`, `generation_run_id uuid references public.generation_runs (id)`, `needs_human_review boolean not null default false`, `created_at timestamptz not null default now()`.
- [ ] Add the read indexes the only two queries will use: `world_posts (user_id, created_at)` and `world_messages (conversation_id, created_at)`, both `if not exists`.
- [ ] Enable RLS on all four, then write `select` / `insert` / `update` policies per table, each `auth.uid() = user_id`, each preceded by `drop policy if exists`. ⛔ **No delete policy** — 0001 makes the same deliberate choice, and an absent policy denies by default instead of half-implementing deletion.
- [ ] Add the explicit privilege block (0002's pattern, and its reason: Supabase default privileges make `grant` a no-op, and RLS does **not** block `TRUNCATE`): `revoke all on <four tables> from authenticated, anon;` then `grant select, insert, update on <four tables> to authenticated;`. `anon` gets nothing. Close with `commit;`.
- [ ] Create `lib/supabase/worldSchema.test.ts` with the code below and run it.

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const MIGRATION = readFileSync('supabase/migrations/0007_world_schema.sql', 'utf8');
const SQL = MIGRATION.replace(/--[^\n]*/g, '').toLowerCase();

const TABLES = ['world_characters', 'world_posts', 'world_conversations', 'world_messages'];

describe('0007 — the world schema', () => {
  it('creates exactly the four tables the vision names, and no others', () => {
    const created = [...SQL.matchAll(/create table if not exists public\.([a-z_]+)/g)].map((m) => m[1]);
    expect(created.sort()).toEqual([...TABLES].sort());
  });

  it('carries provenance on every world row — each item is generated content', () => {
    // R-014: a world post goes through the same gate and the same AQL sample as
    // a flashcard. Without generation_run_id a bad batch cannot be revoked.
    for (const table of TABLES) {
      const body = SQL.match(new RegExp(`create table if not exists public\\.${table}\\s*\\(([\\s\\S]*?)\\);`))?.[1];
      expect(body, `${table} has no body`).toBeTruthy();
      expect(body, `${table} lacks generation_run_id`).toContain('generation_run_id');
      expect(body, `${table} lacks needs_human_review`).toContain('needs_human_review');
      expect(body, `${table} lacks an owner`).toMatch(/user_id\s+uuid\s+not null\s+references auth\.users/);
    }
  });

  it('enables row level security on all four', () => {
    for (const table of TABLES) {
      expect(SQL).toMatch(new RegExp(`alter table public\\.${table} enable row level security`));
    }
  });

  it('scopes every policy to the row owner', () => {
    const policies = SQL.match(/create policy[\s\S]*?;/g) ?? [];
    expect(policies.length).toBe(12); // 4 tables x select/insert/update
    for (const p of policies) expect(p).toMatch(/auth\.uid\(\)\s*=\s*user_id/);
  });

  it('never opens a world table to everyone', () => {
    expect(SQL).not.toMatch(/using\s*\(\s*true\s*\)/);
    expect(SQL).not.toMatch(/\bto\s+(public|anon)\b/);
  });

  it('grants no privilege to anon and never grants delete', () => {
    expect(SQL).toMatch(/revoke all[\s\S]{0,200}from authenticated, anon/);
    const grants = SQL.match(/grant [\s\S]*?;/g) ?? [];
    expect(grants.length).toBeGreaterThan(0);
    for (const g of grants) {
      expect(g).not.toContain('delete');
      expect(g).not.toMatch(/\bto\s+anon\b/);
    }
  });

  it('loads nothing — schema only (R-014)', () => {
    expect(SQL).not.toMatch(/\binsert into\b/);
  });

  it('is wrapped in one transaction', () => {
    expect(SQL).toMatch(/\bbegin\s*;/);
    expect(SQL).toMatch(/\bcommit\s*;/);
  });
});
```

- [ ] **Self-check by mutation:** ⓐ change one policy to `using (true)` → *"never opens a world table"* **and** *"scopes every policy to the row owner"* must both fail. ⓑ remove `generation_run_id` from `world_messages` → *"carries provenance on every world row"* must fail naming that table. ⓒ add a fifth `create table` → *"exactly the four tables"* must fail. ⓓ add `grant delete … to authenticated` → *"never grants delete"* must fail. ⓔ add a single seed `insert into public.world_characters …` → *"loads nothing"* must fail. Revert all five.

---

## Task 4 — the migration directory cannot have two `0003`s

**Files:** `scripts/migration-hygiene.test.ts` (create)

Justification, measured not assumed: `0003_low_confidence_is_visible.sql` and `0003_provenance_telemetry.sql` share a prefix. Nothing in the repo states which applies first, and `0003_low_confidence` alters `senses.needs_human_review` while `0003_provenance` alters `senses.origin` — today they happen to be independent, so this is a **latent** defect, not a live one. This plan adds `0006` and `0007`; the guard is what stops the next pair from colliding silently, and it is the same shape as `scripts/plan-hygiene.test.ts` (F-025), which exists because a duplicate **task** ID survived 33 cycles unnoticed.

- [ ] Create `scripts/migration-hygiene.test.ts`:

```ts
import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The apply order of supabase/migrations/ is its filename order, and nothing
 * else records it. Two files under one number is not a typo — it is an
 * undefined order between two DDL scripts, and 0003_ has been in exactly that
 * state since C-0029. Same reasoning as scripts/plan-hygiene.test.ts (F-025):
 * a human reading a directory will not catch the next collision either.
 */
const FILES = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort();

/**
 * The one collision that already shipped. Both files only ALTER `senses`, which
 * 0002 creates, and they touch different columns (needs_human_review vs origin),
 * so their order does not matter TODAY — that is why this is an exemption and
 * not a rename. ⛔ Nothing may be added to this list: a rename is a filename
 * change that `supabase db push` records in its own table, and re-hashing an
 * already-applied migration is a bigger risk than one documented pair.
 */
const GRANDFATHERED = new Set(['0003_low_confidence_is_visible.sql', '0003_provenance_telemetry.sql']);

function prefixes(files: string[]): number[] {
  return files.map((f) => Number(f.slice(0, 4)));
}

describe('supabase/migrations — apply order', () => {
  it('has files at all (guards the glob, not just the rule)', () => {
    // Without this every assertion below passes vacuously over an empty list.
    expect(FILES.length).toBeGreaterThanOrEqual(6);
  });

  it('names every file NNNN_snake_case.sql', () => {
    for (const f of FILES) expect(f, `${f} is misnamed`).toMatch(/^\d{4}_[a-z0-9_]+\.sql$/);
  });

  it('uses each number at most once, outside the one grandfathered pair', () => {
    const seen = new Map<number, number>();
    for (const n of prefixes(FILES.filter((f) => !GRANDFATHERED.has(f)))) {
      seen.set(n, (seen.get(n) ?? 0) + 1);
    }
    const dupes = [...seen.entries()].filter(([, c]) => c > 1).map(([n, c]) => `${n}×${c}`);
    expect(dupes, 'two DDL scripts under one number have no defined order').toEqual([]);
  });

  it('keeps the exemption honest — every grandfathered name still exists', () => {
    // An exemption for a file that was since renamed is a hole nobody sees.
    for (const f of GRANDFATHERED) expect(FILES, `${f} is exempted but absent`).toContain(f);
  });

  it('leaves no gap in the sequence', () => {
    const nums = [...new Set(prefixes(FILES))].sort((a, b) => a - b);
    expect(nums[0]).toBe(1);
    expect(nums).toEqual(nums.map((_, i) => i + 1));
  });
});
```

- [ ] Run it — all five must be green, **including on the pre-existing `0003_` pair**, because that pair is exempted by name and not by luck.
- [ ] **Self-check by mutation:** ⓐ `cp supabase/migrations/0005_review_state.sql supabase/migrations/0005_duplicate.sql` → *"uses each number at most once"* must fail with `5×2`; delete the copy. ⓑ empty the `GRANDFATHERED` set → the same test must fail with `3×2`, which is the proof the exemption is doing real work and the assertion is not vacuous; restore it. ⓒ add a fake name to `GRANDFATHERED` → *"keeps the exemption honest"* must fail; restore it. ⓓ temporarily rename `0004_…` to `0009_…` → *"leaves no gap"* must fail; restore it.
- [ ] Record the grandfathered pair in `plan/30-architecture.md` as debt in one line, so the exemption has a paper trail outside the test file.

---

## Verification — run all four, paste the real output

- [ ] `npm run typecheck`
- [ ] `npm run check:core` — must print `/lib/core purity: OK`. (Nothing here touches `lib/core`, so a change in this line means something leaked.)
- [ ] `npm test` — expect **548 + ~25** tests across **36 + 3** files.
- [ ] `npm run build` — must end `Compiled successfully`.
- [ ] ⛔ No claim of completion before all four have run **in the same message** as the claim (RULES § 0.6, `verification-before-completion`).

## Closing the tick

- [ ] `plan/30-architecture.md` — one new subsection: the layer-2 columns, the `is_function_word`/`lexical_class` overlap and why both survive for now, and the `word_progress` privilege gap named above as debt.
- [ ] `plan/50-tasks.md` — T-047 ✅, T-048 ✅ (with the open PM question named), T-049 ✅ *schema only*.
- [ ] `plan/00-control.md` — `CYCLE_ID`, `ACTIVE_TASK_ID`, `NEXT_AGENT=CRITIC`, release the lock, `MILESTONE_TICKS` +1, one journal row.
- [ ] `docs/api-contract.md` — **not** touched. Say so in the handoff, so the Critic does not go looking.
