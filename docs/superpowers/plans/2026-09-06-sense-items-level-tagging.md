# Sense-Items Level Tagging — T-224 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:test-driven-development` per step, then `superpowers:executing-plans` to drive the whole task. This plan covers exactly **one** task (`T-224`), so the executing agent makes **exactly one commit** for it at the end (`RULES` / `docs/agents/DEV.md` STEP 4.5 — "one commit per task", not one per file), even though it spans many files below. `npm run verify` must be green, freshly run, before that commit.

**Goal:** Close `T-224` / `D-141` — every practice item in `public.sense_items` gets a difficulty `level` (1-4, `41 § 6.2` criteria) and a written `level_rationale`, tagged **at write time**, without retro-tagging the 1,602 items already written before this decision existed and without breaking the ingest pipeline that still has to read 787 legacy `data/generated/batch-*.jsonl` rows written in the old, bare-string `items` shape.

**Architecture:** One nullable pair of columns added to `public.sense_items` (migration only, no backfill). `GeneratedSense.items` moves from `readonly string[]` to `readonly GeneratedItem[]` (`{ stem, level, levelRationale }`), with `level`/`levelRationale` **both `null` together** representing "written before D-141 — declared legal, untagged" and **both set together** representing a fully-tagged item; `gateSense` rejects any item where exactly one of the pair is present (an inconsistent half-state), and rejects a set-but-invalid pair (level outside 1-4, or an empty rationale). The parser (`lib/core/batchRecord.ts`) accepts **both** raw JSONL shapes — a bare string (legacy) normalises to `{ stem, level: null, levelRationale: null }`; an object `{ stem, level, level_rationale }` normalises to the tagged form — so 787 existing rows keep parsing, unchanged, forever. The two downstream consumers (`lib/core/scoringSeed.ts`'s flattener, `scripts/build-ingest-sql.mjs`'s SQL emitter) carry the two new fields through to the `sense_items` insert; `scripts/measure-continuations.mjs` (a separate, read-only measurement script over the same raw JSONL, not part of this type chain) is updated to read `.stem` off an object item instead of silently skipping it.

**Tech Stack:** TypeScript (`lib/core/*.ts`), Node.js (`.mjs` scripts, ESM), Vitest (`.test.ts`), plain SQL migration (`supabase/migrations/`). No new dependencies.

**Spec:** `plan/50-tasks.md` row `T-224` · `plan/40-decisions.md` § D-141 (parts א–ה) · `plan/41-amirnet-spec.md § 6.2` (the four-level criteria table `level_rationale` must name) · `docs/agents/CONTENT.md` § "EVERY PRACTICE SENTENCE CARRIES A LEVEL" · `plan/60-findings.md` row `F-168` (this task is F-168's fix, mis-labelled — see Measured Discrepancies below).

## Global Constraints

- **This is one task, one commit.** Every file below lands together. `npm run verify` runs fresh, once, immediately before that commit.
- Migration files are additive and reversible only by a documented manual down-path (`RULES` / `docs/agents/DEV.md` STEP C — "`supabase db push` is NOT reversible by a commit; write the down path into the same migration file"). No `not null`, no `default` on the two new columns — inventing a level for the 1,602 undated rows is exactly what D-141 § ג forbids.
- `scripts/migration-hygiene.test.ts` requires every migration filename to match `NNNN[a-z]_snake_case.sql` with no gap and no repeated token. Measured live in this clone: the highest existing file is `0020_data_sources_wordnet.sql` → this migration is `0021_sense_items_level.sql`.
- The idempotent-constraint idiom already established in `0004_onboarding_answers.sql` (`do $$ begin if not exists (select 1 from pg_constraint where conname = '…') then alter table … add constraint … check (…); end if; end $$;`) is reused verbatim for consistency — Postgres has no `add constraint if not exists`.
- `lib/core/contentSchema.test.ts` already asserts parity between `POS_VALUES`/`RELATION_TYPES` and migration `0002`'s CHECK constraints, by reading the SQL file's text directly (not a copied literal). The new `ITEM_LEVELS` gets the same treatment against `0021`'s CHECK.
- Every new/changed test file keeps the project's existing style: Hebrew `describe`/`it` labels where the surrounding file already uses Hebrew (`scripts/measure-continuations.test.ts`), English where the surrounding file already uses English (everything under `lib/core/`). Comments and code stay English throughout (`docs/agents/DEV.md` line 1).
- `/lib/core/` stays pure — zero React, window, document, fetch, `process.env` (`docs/agents/DEV.md` STEP 5). This task touches no UI at all; `סקיל` cell for `T-224` is `—`, so no design skill applies.

## Measured discrepancies from the task row and its references (recorded so the next reader doesn't re-derive them)

- **`T-224`'s own "radius נמדד" list is wrong on two counts, checked live in this clone:**
  - `grep -n "AccuracyItem\|measureAccuracy(" -r lib scripts` shows `lib/core/senseAccuracy.ts`'s `items` field (`AccuracyItem[]`, `{ lemma, pos, hebrew }`) is a **completely unrelated concept** — word-sense-disambiguation accuracy items for T-018, not `GeneratedSense.items`. Its one caller (`scripts/measure-sense-accuracy.mjs:113`) calls `measureAccuracy({ items: [], … })` — a hard-coded empty array. **This file needs no change** and is not touched below; the task row's "4 files touch `items`" false-positived on the shared field name.
  - The row's list **omits two files that genuinely are the real blast radius**: `lib/core/batchRecord.ts` (the actual JSONL→`GeneratedSense` parser — this is the one place the string-vs-object backward-compat the row's ⓓ demands actually has to be implemented; nothing else in the codebase parses raw batch rows) and `scripts/build-ingest-sql.mjs` (the SQL emitter — its `sense_items` INSERT only names `sense_id, stem, item_index` today; without adding `level, level_rationale` here, the two new fields would validate at the gate and then be silently dropped on the way into the seed SQL).
- **`docs/agents/CONTENT.md`'s "EVERY PRACTICE SENTENCE CARRIES A LEVEL" section and `plan/60-findings.md` row `F-168` both say "keep `items` as strings until `T-223` lands."** Measured live: `T-223` is `lib/core/amirnetItemGate.ts` — the AMIRNET exam-item gate (`41 § 6.5`'s own schema, `source: "original"`), already delivered 🟣 in `C-0436`, and **entirely unrelated to `sense_items`**. The task that actually does "migration + `items` becomes an object + the gate" — the exact thing both those references are waiting for — is `T-224`, this plan. This is a stale mis-citation, not a real dependency: `T-223` landing changed nothing about `sense_items.level`. Task steps below fix both citations as part of this same commit (Task 1 Steps 9–10), since this plan is the fix F-168 is actually waiting for.
- **Design call made here, not explicit in the task row or D-141's text (logged per `RULES § 0.22` — "anything touching learning content" is listed as a PM-decision row, so this is flagged for PM/Roy confirmation rather than silently assumed):** D-141 § ג's sentence "an item without `level` in 1-4, or without `level_rationale`, is invalid" is read here as applying to **newly-tagged items going forward**, not retroactively to the 1,602 already-passing, already-declared-legal-null items. The alternative literal reading — the gate unconditionally requires both fields on every item, no exception — would mean the next `npm run build:ingest` run silently **drops all 787 legacy rows' `sense_items` inserts** from the regenerated seed (they'd newly fail the gate that decides what makes it into the SQL), which is exactly the "re-processing a heap that already exists" outcome D-141 § ה explicitly rules out ("what this decision buys is that the practice sentences already being written become usable when the simulation is built — not a heap that needs re-processing"). The design below (`level`/`levelRationale` both `null` together = valid grandfathered state; both set together = valid tagged state; anything else = rejected) is the reading that keeps existing accepted content intact while still fully enforcing the new rule on `level`-bearing items. **This is flagged in the tick report to Roy/PM as a call made under this reading — reversible in one commit if the other reading was intended.**

### ⛔ Not an extension of T-039 / T-042 / T-066

`npm run check:plan` on a draft of this plan flagged three already-delivered task rows that name files this plan also touches: `T-039` (`lib/core/contentSchema.test.ts` — the original gate test file), `T-042` (`lib/core/batchRecord.ts` — the original snake_case→camelCase parser), `T-066` (`lib/core/contentSchema.ts` — mentioned in a different task's blocker text, unrelated content). **⛔ This is NOT an extension of any of the three**, one sentence each per `RULES § 0.6ב`: `T-039` built the gate itself years before D-141 existed — this plan adds a new, independent rule (level/rationale pairing) to a function `T-039` already finished, the same way `T-223`'s AMIRNET gate is a sibling addition, not a rewrite. `T-042` built the original snake_case-to-camelCase parser (`headword`, `translation_he`, `distractors[].relation_type`, …) — this plan adds one more field-normalisation rule (`items[i]` as string-or-object) to that same file using the exact same helper functions (`text`, `field`), not replacing anything `T-042` wrote. `T-066` is the sentence-bank task ("חפיסת המשפטים") — its row merely happens to reference `contentSchema.ts` in passing (as the gate every content task runs through); it builds no code in this file and defines no lineage this plan continues.

## File Structure

| File | Change |
|---|---|
| `supabase/migrations/0021_sense_items_level.sql` | **Create.** Adds `level smallint`, `level_rationale text` to `public.sense_items`, both nullable, no default. Two CHECK constraints (range, and the null-pairing). Down path documented in a comment. |
| `lib/core/contentSchema.ts` | **Extend.** New `ITEM_LEVELS`/`ItemLevel`/`GeneratedItem`. `GeneratedSense.items` retyped. `gateSense`'s items loop rewritten for the object shape + the new level/rationale rule. |
| `lib/core/contentSchema.test.ts` | **Extend.** `untagged()` helper; every existing bare-string `items` fixture converted via `.map(untagged)`; new tests for the level/rationale rule; new migration-parity test for `0021`. |
| `lib/core/batchRecord.ts` | **Extend.** `items()` accepts both a bare string and a `{ stem, level, level_rationale }` object per array element; return type becomes `readonly GeneratedItem[]`. |
| `lib/core/batchRecord.test.ts` | **Extend.** New tests: parses a tagged object item; still parses the legacy bare-string `ROW.items` unchanged; rejects a malformed tagged item (non-integer `level`, non-string `level_rationale`). |
| `lib/core/scoringSeed.ts` | **Extend.** `ItemRow` gains `level`/`levelRationale`; `scoringRowsFor`'s items loop carries them through. |
| `lib/core/scoringSeed.test.ts` | **Extend.** `record()` helper's `items` fixture converted to tagged shape via the same `untagged()` pattern; expected-output assertions gain the two new fields. |
| `scripts/build-ingest-sql.mjs` | **Extend.** The `sense_items` `incoming` CTE and INSERT gain `level, level_rationale` columns. |
| `scripts/build-ingest-sql.test.ts` | **Extend.** New assertion that the emitted `insert into public.sense_items` names the two new columns. |
| `scripts/measure-continuations.mjs` | **Extend.** The `items` loop reads `.stem` off an object element (in addition to a bare string), so it stops silently under-counting once tagged batches exist. |
| `scripts/measure-continuations.test.ts` | **Extend.** New deterministic fixture test proving an object-shaped item's `stem` is now counted as a sentence. |
| `docs/agents/CONTENT.md` | **Extend.** STEP 5's example JSON updated to the tagged `items` shape; the "NOT YET… until `T-223` lands" paragraph rewritten to say `T-224` has landed. |
| `plan/60-findings.md` | **Extend.** `F-168` row's status cell updated: closed by this task, citation `T-223`→`T-224` corrected. |
| `supabase/seed/0003_scoring_material.sql` | **Regenerate** (`npm run build:ingest`) — gains `level, level_rationale` in its `sense_items` insert. Committed alongside the code, per the "leaves the committed seed identical to a fresh run" gate in `build-ingest-sql.test.ts`. |
| `supabase/seed/0001_content_batches.sql` | **Verify unchanged** by the same `npm run build:ingest` run — the grandfather design means zero rows newly pass or fail the gate. A diff here is a red flag, not an expected change (see Step 8). |
| `docs/gate-recheck.md` | **Regenerate** (`npm run measure:gate`) — verify pass/fail counts are unchanged for the same reason. |

---

## Task 1: T-224 — `sense_items.level` + `level_rationale`, tagged at write time, additive migration

**Files:** all of the above.

**Interfaces:**
- Produces: `ITEM_LEVELS: readonly [1,2,3,4]`, `type ItemLevel = 1|2|3|4`, `interface GeneratedItem { stem: string; level: ItemLevel | null; levelRationale: string | null }` — all exported from `lib/core/contentSchema.ts`. `GeneratedSense.items: readonly GeneratedItem[]` (breaking change to the existing exported type, consumed by `batchRecord.ts`, `scoringSeed.ts`, `mixReport.ts`, `flashcard.ts` — the latter two verified below to need no code change since neither touches `.items`).
- Consumes: nothing from elsewhere in this plan (single task).

- [ ] **Step 1: Migration — write the failing hygiene assertion, then the file**

Run first to confirm the next free number: `ls supabase/migrations | sort | tail -3` → expect `0020_data_sources_wordnet.sql` last, confirming `0021` is free (already measured above; re-confirm live before writing, in case another tick landed one first).

Create `supabase/migrations/0021_sense_items_level.sql`:

```sql
-- 0021_sense_items_level.sql — D-141: every practice item carries a difficulty
-- level (1-4, 41 § 6.2) and a written rationale, tagged at write time.
--
-- ⚠️ ADDS ONLY, never backfills. Measured 28/08 (D-141 § א): 1,602 existing
-- `sense_items` rows carry no level. That null is a legal, DECLARED state —
-- "written before D-141" — not a gap to fill in. A `not null` or a `default`
-- here would invent a level for content nobody actually leveled, which is
-- exactly the retro-tagging cost D-141 § ב rejected in favour of tagging at
-- write time. ⛔ No `not null`. ⛔ No `default`.
--
-- Down (manual — this file's statements are never re-run automatically by
-- `supabase db push`; apply by hand if this ever needs reverting):
--   alter table public.sense_items drop constraint if exists sense_items_level_check;
--   alter table public.sense_items drop constraint if exists sense_items_level_rationale_pairing;
--   alter table public.sense_items drop column if exists level;
--   alter table public.sense_items drop column if exists level_rationale;

begin;

alter table public.sense_items
  add column if not exists level smallint,
  add column if not exists level_rationale text;

comment on column public.sense_items.level is
  'D-141 · 41 § 6.2 — difficulty 1-4, tagged at write time. NULL = written before D-141, a declared legal state, ⛔ never backfilled by inference.';
comment on column public.sense_items.level_rationale is
  'D-141 · names the § 6.2 criterion that set the level ("one connective ⇒ 2"), never a feeling ("felt like a 3"). NULL iff level is NULL.';

-- `add column ... check (...)` is skipped wholesale when the column already
-- exists (same reasoning as 0004_onboarding_answers.sql), so the constraints
-- are added separately, named, so re-applying this file is a no-op.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sense_items_level_check') then
    alter table public.sense_items
      add constraint sense_items_level_check
      check (level is null or level between 1 and 4);
  end if;

  -- The pair is tagged together or not at all — a half-tagged item (a level
  -- with no stated reason, or a reason with no level) is a data-entry defect,
  -- not a valid untagged item. Same standing as a distractor with no reason
  -- (41 § 6.4 rule 5) — enforced at the app gate (contentSchema.ts) too, but
  -- this is the last line of defense for any writer that bypasses it.
  if not exists (select 1 from pg_constraint where conname = 'sense_items_level_rationale_pairing') then
    alter table public.sense_items
      add constraint sense_items_level_rationale_pairing
      check ((level is null) = (level_rationale is null));
  end if;
end $$;

commit;
```

- [ ] **Step 2: Run the migration hygiene suite**

Run: `npx vitest run scripts/migration-hygiene.test.ts`
Expected: PASS — the new file matches `NNNN[a-z]_snake_case.sql`, uses a fresh ordering token, leaves no gap, and creates/drops no RLS policy (the policy-replacement describe block is untouched by this file).

- [ ] **Step 3: `contentSchema.ts` — write the failing tests first**

In `lib/core/contentSchema.test.ts`, add near the top (after the existing imports, before `const ok = {…}`):

```typescript
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  gateSense,
  ITEM_LEVELS,
  locateTarget,
  POS_VALUES,
  RELATION_TYPES,
  targetForms,
  type GeneratedItem,
} from './contentSchema';

/** D-141: an item written before the level/rationale rule existed. Both null, together. */
const untagged = (stem: string): GeneratedItem => ({ stem, level: null, levelRationale: null });

/** D-141: a fully-tagged item, for tests that need one specific level. */
const tagged = (stem: string, level: 1 | 2 | 3 | 4, levelRationale: string): GeneratedItem => ({
  stem,
  level,
  levelRationale,
});
```

(`readFileSync`/`describe`/`expect`/`it` are already imported at the top of the file today — do not duplicate; add only the new named imports `ITEM_LEVELS` and the type `GeneratedItem` to the existing `from './contentSchema'` import statement, and add the two helpers above the `ok` fixture.)

Change every existing bare-string `items` array literal in this file to the tagged/untagged object form via `untagged`. There are, measured live in this clone (`grep -n "items:" lib/core/contentSchema.test.ts`), **fourteen** occurrences. The mechanical rule for every one of them:

```typescript
// before:
items: ['His silence was ____, not shy.', 'She made a ____ effort.', 'It was no accident — it was ____.'],
// after:
items: ['His silence was ____, not shy.', 'She made a ____ effort.', 'It was no accident — it was ____.'].map(untagged),
```

i.e. append `.map(untagged)` to every existing `items: [ … ]` array-of-strings literal, including the ones built with `.slice(...)`/spread inside a test body (e.g. line ~71's `items: ok.items.slice(0, 2)` needs **no change** — `ok.items` is already `GeneratedItem[]` after the fixture conversion, so `.slice()` on it stays valid; only literal `[' … ', ' … ']` arrays of bare strings need `.map(untagged)` appended). Apply this to the `ok` fixture (line 21) and every other `items: [...]` literal in the file (lines ~59, 65, 147, 158, 169, 179, 237, 239, 244, 277, and the `items: []` empty-array cases at lines ~21/107 need no `.map()` — an empty array is already valid in both shapes).

Then add, after the existing `'items: fewer than 3'` test (the `it('collects every reason, not just the first', …)` block) and before the migration-parity test:

```typescript
describe('D-141 — item level + level_rationale', () => {
  it('accepts a fully-tagged item — level 1-4 with a non-empty rationale', () => {
    const r = gateSense({ ...ok, items: [tagged('His silence was ____.', 3, 'concession without a connective ⇒ 3')] }, opts);
    expect(r.reasons.join()).not.toContain('level');
  });

  it('accepts an untagged item — level and level_rationale both null (D-141 § ג, written before the rule)', () => {
    const r = gateSense(ok, opts);
    expect(r.reasons.join()).not.toContain('level');
  });

  it('rejects a level outside 1-4', () => {
    const r = gateSense({ ...ok, items: [tagged('His silence was ____.', 5 as never, 'x')] }, opts);
    expect(r.reasons.join()).toContain('level "5" is not one of 1|2|3|4');
  });

  it('rejects a set level with an empty level_rationale', () => {
    const r = gateSense({ ...ok, items: [{ stem: 'His silence was ____.', level: 2, levelRationale: '' }] }, opts);
    expect(r.reasons.join()).toContain('level_rationale is empty');
  });

  it('rejects a level_rationale with no level — a half-tagged item is not a valid untagged one', () => {
    const r = gateSense({ ...ok, items: [{ stem: 'His silence was ____.', level: null, levelRationale: 'x' }] }, opts);
    expect(r.reasons.join()).toContain('level and level_rationale must both be present or both be absent');
  });

  it('rejects a level with no level_rationale, the other half of the same rule', () => {
    const r = gateSense({ ...ok, items: [{ stem: 'His silence was ____.', level: 2, levelRationale: null }] }, opts);
    expect(r.reasons.join()).toContain('level and level_rationale must both be present or both be absent');
  });

  it('stays in lock-step with the CHECK constraint of migration 0021', () => {
    const sql = readFileSync(new URL('../../supabase/migrations/0021_sense_items_level.sql', import.meta.url), 'utf8');
    const m = /level between (\d+) and (\d+)/.exec(sql);
    expect(m).not.toBeNull();
    expect([Number(m?.[1]), Number(m?.[2])]).toEqual([Math.min(...ITEM_LEVELS), Math.max(...ITEM_LEVELS)]);
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `npx vitest run lib/core/contentSchema.test.ts`
Expected: FAIL — `ITEM_LEVELS`/`GeneratedItem` don't exist yet (TS/import error), and every converted fixture line references `untagged`/`tagged` which don't exist yet either. This is the expected RED before Step 5.

- [ ] **Step 5: `contentSchema.ts` — implementation**

In `lib/core/contentSchema.ts`, after the existing `RELATION_TYPES`/`RelationType` block (around line 31), add:

```typescript
/** D-141 · 41 § 6.2 — difficulty 1-4. Mirrors migration 0021's CHECK (asserted in the test). */
export const ITEM_LEVELS = [1, 2, 3, 4] as const;
export type ItemLevel = (typeof ITEM_LEVELS)[number];
```

Replace the `GeneratedSense` interface's `items` field and add the new interface immediately above it:

```typescript
/**
 * D-141 — a practice-sentence stem, tagged with a difficulty level at write time.
 * `level`/`levelRationale` are BOTH null together (written before D-141 — a
 * declared legal, ungraded state) or BOTH set together (a real 1-4 level with
 * its § 6.2 criterion named) — never one without the other; see `gateSense`.
 */
export interface GeneratedItem {
  readonly stem: string;
  readonly level: ItemLevel | null;
  readonly levelRationale: string | null;
}

export interface GeneratedSense {
  readonly headword: string;
  readonly pos: Pos;
  readonly translationHe: string;
  readonly definitionEn: string;
  readonly examples: { readonly supportive: string; readonly neutral: string };
  readonly items: readonly GeneratedItem[];
  readonly distractors: readonly { readonly word: string; readonly relationType: RelationType }[];
}
```

Replace the `// --- items ---` block inside `gateSense` (lines 319-329 today):

```typescript
  // --- items ---
  if (input.items.length < 3) reasons.push('items: fewer than 3');
  input.items.forEach((item, i) => {
    const stem = item.stem;
    const blanks = stem.split(BLANK).length - 1;
    if (blanks === 0) reasons.push(`item ${i}: no blank`);
    else if (blanks > 1) reasons.push(`item ${i}: more than one blank`);
    const body = stem.replaceAll(BLANK, ' ');
    if (containsHeadword(body, forms)) reasons.push(`item ${i}: leaks the answer`);
    if (tokens(body).length < minStemWords) reasons.push(`item ${i}: fewer than ${minStemWords} words`);
    checkSentence(`item ${i}`, body, maxWords);

    // D-141: level and level_rationale are tagged together or not at all.
    const hasLevel = item.level !== null;
    const hasRationale = item.levelRationale !== null && item.levelRationale.trim() !== '';
    if (hasLevel !== hasRationale) {
      reasons.push(`item ${i}: level and level_rationale must both be present or both be absent (D-141)`);
    } else if (hasLevel) {
      if (!(ITEM_LEVELS as readonly number[]).includes(item.level as number)) {
        reasons.push(`item ${i}: level "${item.level}" is not one of ${ITEM_LEVELS.join('|')}`);
      }
    }
  });
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run lib/core/contentSchema.test.ts`
Expected: PASS, every test including the fourteen converted fixtures and the six new D-141 tests.

- [ ] **Step 7: `batchRecord.ts` — write the failing tests first**

In `lib/core/batchRecord.test.ts`, add (after the existing `ROW` constant, before `describe('parseBatchRecord', …)`):

```typescript
/** D-141: a batch row using the tagged item shape, alongside a legacy bare-string one. */
const TAGGED_ROW = {
  ...ROW,
  items: [
    'Only ____ people are at the meeting.',
    { stem: 'Very ____ students finished early.', level: 2, level_rationale: 'one connective-free comparative ⇒ 2' },
  ],
};
```

Add, inside the existing `describe('parseBatchRecord', …)` block:

```typescript
  it('D-141: normalises a legacy bare-string item to { stem, level: null, levelRationale: null }', () => {
    const r = parseBatchRecord(ROW);
    expect(r.sense.items).toEqual([{ stem: 'Only ____ people are at the meeting.', level: null, levelRationale: null }]);
  });

  it('D-141: parses a tagged object item, camelCasing level_rationale', () => {
    const r = parseBatchRecord(TAGGED_ROW);
    expect(r.sense.items).toEqual([
      { stem: 'Only ____ people are at the meeting.', level: null, levelRationale: null },
      { stem: 'Very ____ students finished early.', level: 2, levelRationale: 'one connective-free comparative ⇒ 2' },
    ]);
  });

  it('D-141: rejects a tagged item whose level is not an integer', () => {
    const bad = { ...ROW, items: [{ stem: 'x ____ y', level: 'two', level_rationale: 'r' }] };
    expect(() => parseBatchRecord(bad)).toThrow(/items\[0\]\.level/);
  });

  it('D-141: rejects a tagged item whose level_rationale is not a string', () => {
    const bad = { ...ROW, items: [{ stem: 'x ____ y', level: 2, level_rationale: 7 }] };
    expect(() => parseBatchRecord(bad)).toThrow(/items\[0\]\.level_rationale/);
  });

  it('D-141: rejects an item that is neither a string nor an object', () => {
    expect(() => parseBatchRecord({ ...ROW, items: [42] })).toThrow(/items\[0\]/);
  });
```

- [ ] **Step 8: Run the tests to verify they fail**

Run: `npx vitest run lib/core/batchRecord.test.ts`
Expected: FAIL — `parseBatchRecord(ROW).sense.items` is still `['Only ____ people are at the meeting.']` (bare strings), not the normalised object form.

- [ ] **Step 9: `batchRecord.ts` — implementation**

In `lib/core/batchRecord.ts`, add `type GeneratedItem` to the existing `contentSchema` import, and replace the `items()` function:

```typescript
import {
  POS_VALUES,
  RELATION_TYPES,
  type GeneratedItem,
  type GeneratedSense,
  type Pos,
  type RelationType,
} from './contentSchema';
```

```typescript
/**
 * D-141: an array element is either a legacy bare string (written before the
 * level/rationale rule existed — normalised to a declared-null, grandfathered
 * item) or a tagged object. Both shapes must keep parsing forever: 787 rows in
 * data/generated/batch-*.jsonl today use the bare-string shape, and re-running
 * `npm run build:ingest` over them must never throw or drop them.
 */
function items(raw: Row): readonly GeneratedItem[] {
  const value = field(raw, 'items');
  if (!Array.isArray(value)) throw new RangeError('items is not an array');
  return value.map((entry, i) => {
    if (typeof entry === 'string') return { stem: entry, level: null, levelRationale: null };
    if (typeof entry !== 'object' || entry === null) {
      throw new RangeError(`items[${i}] is not a string or an object`);
    }
    const obj = entry as Row;
    const stem = text(obj, 'stem');
    const rawLevel = obj.level;
    if (rawLevel !== undefined && rawLevel !== null && (typeof rawLevel !== 'number' || !Number.isInteger(rawLevel))) {
      throw new RangeError(`items[${i}].level is not an integer`);
    }
    const rawRationale = obj.level_rationale;
    if (rawRationale !== undefined && rawRationale !== null && typeof rawRationale !== 'string') {
      throw new RangeError(`items[${i}].level_rationale is not a string`);
    }
    return {
      stem,
      level: (rawLevel ?? null) as GeneratedItem['level'],
      levelRationale: rawRationale ?? null,
    };
  });
}
```

(`text()` is the existing helper a few lines above, already used by `examples()` — reused here for `stem`, unchanged signature. The range check on `level` — is it actually 1-4 — stays in `gateSense`, not here, matching the file's existing division of labour: this module validates JSON *shape*, `contentSchema.ts` validates *content*.)

- [ ] **Step 10: Run the tests to verify they pass**

Run: `npx vitest run lib/core/batchRecord.test.ts`
Expected: PASS, all existing tests plus the five new D-141 ones.

- [ ] **Step 11: `scoringSeed.ts` — write the failing test first**

In `lib/core/scoringSeed.test.ts`, add the `untagged` helper (same definition as Step 3) near the top, convert `record()`'s `items` fixture:

```typescript
items: ['The train ____ leaves at nine.', 'She ____ helps her friends.'].map(untagged),
```

and every other bare-string `items` literal in this file (measured live: also lines ~118 and ~277-equivalent — the `GOOD` fixture inside `describe('the gate is the caller's job — R-014', …)`). Update the "numbers item stems by array position" test's expectation:

```typescript
  it('numbers item stems by array position — sense_items.item_index is unique per sense', () => {
    const rows = scoringRowsFor([record()]);
    expect(rows.items).toEqual([
      { headword: 'always', pos: 'adverb', senseIndex: 1, itemIndex: 0, stem: 'The train ____ leaves at nine.', level: null, levelRationale: null },
      { headword: 'always', pos: 'adverb', senseIndex: 1, itemIndex: 1, stem: 'She ____ helps her friends.', level: null, levelRationale: null },
    ]);
  });
```

Add one new test proving a tagged item's level/rationale survive the flatten:

```typescript
  it('D-141: carries level and levelRationale through unchanged', () => {
    const rows = scoringRowsFor([record({ items: [{ stem: 'It ____ rains here.', level: 3, levelRationale: 'concession ⇒ 3' }] })]);
    expect(rows.items).toEqual([
      { headword: 'always', pos: 'adverb', senseIndex: 1, itemIndex: 0, stem: 'It ____ rains here.', level: 3, levelRationale: 'concession ⇒ 3' },
    ]);
  });
```

- [ ] **Step 12: Run the tests to verify they fail**

Run: `npx vitest run lib/core/scoringSeed.test.ts`
Expected: FAIL — `ItemRow` has no `level`/`levelRationale` fields yet, and `scoringRowsFor` still destructures items as bare strings.

- [ ] **Step 13: `scoringSeed.ts` — implementation**

In `lib/core/scoringSeed.ts`, add `type ItemLevel` to the existing `contentSchema` import, extend `ItemRow`, and rewrite the items loop:

```typescript
import type { BatchRecord } from './batchRecord';
import type { ItemLevel, RelationType } from './contentSchema';
```

```typescript
export interface ItemRow {
  readonly headword: string;
  readonly pos: string;
  readonly senseIndex: number;
  readonly itemIndex: number;
  readonly stem: string;
  readonly level: ItemLevel | null;
  readonly levelRationale: string | null;
}
```

```typescript
    record.sense.items.forEach((item, itemIndex) => {
      items.push({ ...identity, itemIndex, stem: item.stem, level: item.level, levelRationale: item.levelRationale });
    });
```

- [ ] **Step 14: Run the tests to verify they pass**

Run: `npx vitest run lib/core/scoringSeed.test.ts`
Expected: PASS.

- [ ] **Step 15: `build-ingest-sql.mjs` — write the failing test first**

In `scripts/build-ingest-sql.test.ts`, inside the existing `describe('supabase/seed/0003_scoring_material.sql', …)` block, add:

```typescript
  it('D-141: the sense_items insert names level and level_rationale', () => {
    const sql = fresh();
    expect(sql).toContain('insert into public.sense_items (sense_id, stem, item_index, level, level_rationale)');
  });
```

- [ ] **Step 16: Run the test to verify it fails**

Run: `npx vitest run scripts/build-ingest-sql.test.ts -t "level and level_rationale"`
Expected: FAIL — today's insert names only `(sense_id, stem, item_index)`.

- [ ] **Step 17: `build-ingest-sql.mjs` — implementation**

In `scripts/build-ingest-sql.mjs`, replace the `if (counts.items > 0) { … }` block (lines 262-276 today):

```javascript
if (counts.items > 0) {
  scoringLines.push('with incoming (headword, pos, sense_index, item_index, stem, level, level_rationale) as (');
  scoringLines.push('  values');
  scoringLines.push(
    scoring.items
      .map((r) => `    (${identity(r)}, ${num(r.itemIndex)}, ${q(r.stem)}, ${num(r.level)}, ${q(r.levelRationale)})`)
      .join(',\n'),
  );
  scoringLines.push(')');
  scoringLines.push('insert into public.sense_items (sense_id, stem, item_index, level, level_rationale)');
  scoringLines.push('select s.id, i.stem, i.item_index, i.level, i.level_rationale');
  scoringLines.push('from incoming i');
  scoringLines.push('join public.words w on w.headword = i.headword and w.pos = i.pos');
  scoringLines.push('join public.senses s on s.word_id = w.id and s.sense_index = i.sense_index');
  scoringLines.push('on conflict (sense_id, item_index) do nothing;');
  scoringLines.push('');
}
```

(`num()`/`q()` already null-safe — both existing helpers emit SQL `null` for `null`/`undefined`, confirmed live: `const q = (value) => value === null || value === undefined ? 'null' : …` and the analogous `num`.)

- [ ] **Step 18: Run the test to verify it passes**

Run: `npx vitest run scripts/build-ingest-sql.test.ts`
Expected: PASS, including the pre-existing "leaves the committed seed identical to a fresh run" test — which will FAIL until Step 25 regenerates and commits the seed file; re-run this specific suite again after Step 25 to confirm.

- [ ] **Step 19: `measure-continuations.mjs` — write the failing test first**

In `scripts/measure-continuations.test.ts`, add (after the existing "no batch files" test, inside the same top-level `describe`... actually this one needs its own top-level block since it uses a fresh temp dir like the two edge-case tests above it):

```typescript
  it('D-141: counts a tagged object item\'s stem as a sentence, not just a bare-string item', () => {
    const dir = mkdtempSync(join(tmpdir(), 'continuations-items-'));
    writeFileSync(
      join(dir, 'batch-2026-01-01.jsonl'),
      `${JSON.stringify({
        headword: 'test',
        pos: 'verb',
        examples: { supportive: 'They test the machine.', neutral: 'She will test it soon.' },
        items: [
          'They ____ the machine every day.',
          { stem: 'She will ____ it again tomorrow.', level: 2, level_rationale: 'x' },
        ],
      })}\n`,
    );
    const out = run(dir);
    expect(out).toContain('1 קבצי אצווה · 1 שורות משמעות · 4 משפטים');
  });
```

- [ ] **Step 20: Run the test to verify it fails**

Run: `npx vitest run scripts/measure-continuations.test.ts -t "D-141"`
Expected: FAIL — today's script reports `3 משפטים` (2 examples + 1 bare-string item; the tagged object item is silently skipped by `typeof s === 'string'`).

- [ ] **Step 21: `measure-continuations.mjs` — implementation**

In `scripts/measure-continuations.mjs`, replace lines 86-88:

```javascript
    if (Array.isArray(record.items)) {
      for (const s of record.items) {
        if (typeof s === 'string') sentences.push(s);
        else if (s && typeof s === 'object' && typeof s.stem === 'string') sentences.push(s.stem);
      }
    }
```

- [ ] **Step 22: Run the test to verify it passes**

Run: `npx vitest run scripts/measure-continuations.test.ts`
Expected: PASS, all tests including the new D-141 one. Also re-run without `-t` to confirm the real-corpus tests (rows/sentences counts against the live `data/generated/` files) still pass unchanged — they read real files, none of which contain tagged items yet, so their counts are untouched by this step.

- [ ] **Step 23: `docs/agents/CONTENT.md` — fix the stale example and citation**

Replace the STEP 5 example JSON's `items` line (today: `"items":["His silence was ____, not shy.","She made a ____ effort.","It was no accident — it was ____."],`) with:

```
 "items":[{"stem":"His silence was ____, not shy.","level":3,"level_rationale":"concession without a connective ⇒ 3"},
          {"stem":"She made a ____ effort.","level":1,"level_rationale":"short sentence, one blank, common vocabulary ⇒ 1"},
          {"stem":"It was no accident — it was ____.","level":2,"level_rationale":"one implicit contrast, no connective word ⇒ 2"}],
```

Replace the "🔴 NOT YET — and this line was wrong before, see F-168" paragraph (today ends "`Keep items as strings until T-223 lands.`… `you will not need this paragraph`") with:

```
🔴 **THIS HAS NOW LANDED (`T-224`, closes `F-168`).** An earlier version of this
paragraph named `T-223` as the landing task — measured live: `T-223` is
`lib/core/amirnetItemGate.ts`, the unrelated AMIRNET exam-item gate, and landed
without touching `sense_items` at all. The real fix was always `T-224`, this
paragraph's own subject. ⇒ **Write every item as
`{"stem": …, "level": 1-4, "level_rationale": "…"}`** — the schema, the gate
(`lib/core/contentSchema.ts`), and the migration (`0021_sense_items_level.sql`)
all exist now. A plain string is still accepted (it normalises to a declared
"written before D-141" untagged item) but is no longer what you should write.
⚠️ ⛔ **A prompt line never overrides a machine-enforced gate.** If the two
disagree, obey the gate and report the contradiction.
```

- [ ] **Step 24: `plan/60-findings.md` — close F-168**

Read the current status cell (last column) of the `F-168` row: `⬜ פתוח → DEV (T-223 · חוסם את D-14…)`. Replace it with (matching the register's existing status-cell conventions for a closed row — a real `C-XXXX` cycle id computed at commit time, same as every prior closed row in this file):

```
🟣 **C-XXXX (DEV) — נסגר על ידי `T-224`, ⛔ לא `T-223` (מיהוי שגוי מקורי, ראה docs/superpowers/plans/2026-09-06-sense-items-level-tagging.md).** מיגרציה `0021_sense_items_level.sql` מוסיפה `level`/`level_rationale` (nullable, ⛔ אין ברירת מחדל) · `contentSchema.ts` אוכפת את הזוג (D-141 § ג) · `batchRecord.ts` מקבל שתי הצורות (תאימות ל-787 השורות הקיימות) · `scoringSeed.ts`/`build-ingest-sql.mjs`/`measure-continuations.mjs` מעבירים את השדות עד הסוף. `npm run verify` ירוק טרי.
```

(`C-XXXX` is this task's real cycle id, computed in Step 26 — same value used in the commit message.)

- [ ] **Step 25: Regenerate the two derived pipelines this task's code changed**

Run: `npm run build:ingest`
Expected: `supabase/seed/0003_scoring_material.sql` changes (gains the two new columns in its `sense_items` insert, values `null, null` for every one of today's 787 real rows since none are tagged yet). `supabase/seed/0001_content_batches.sql` must come out **byte-identical** to the committed copy — `git diff --stat supabase/seed/0001_content_batches.sql` prints nothing. If it does print a diff, STOP: that means some real row is being newly rejected by the gate, which contradicts this plan's entire design (see Measured Discrepancies above) and needs investigation before continuing, not silent acceptance.

Run: `npm run measure:gate`
Expected: `docs/gate-recheck.md` regenerates with the same pass/fail counts as before this task (same reasoning — the grandfather design changes zero real rows' gate outcome). `git diff --stat docs/gate-recheck.md` should show only a refreshed timestamp/line, never a changed accept/reject count; if a count changed, stop for the same reason as above.

- [ ] **Step 26: Full verification**

Run: `npm run verify`
Expected: green end to end — `typecheck` (confirms `mixReport.ts`/`flashcard.ts` genuinely need no change, since neither references `.items`), `check:core`, `check:motion`, `check:text-floor`, `check:rules`, `check:titles`, `test` (every suite touched above, plus the full existing suite untouched), `build`, `check:mobile`.

Also run: `node scripts/next-cycle-id.mjs` (per `docs/agents/DEV.md` STEP 7) — record the printed `C-XXXX` and use it for both Step 24's findings-row edit above and the commit message below (same id in both places, computed once).

- [ ] **Step 27: Commit**

```bash
git add supabase/migrations/0021_sense_items_level.sql \
        lib/core/contentSchema.ts lib/core/contentSchema.test.ts \
        lib/core/batchRecord.ts lib/core/batchRecord.test.ts \
        lib/core/scoringSeed.ts lib/core/scoringSeed.test.ts \
        scripts/build-ingest-sql.mjs scripts/build-ingest-sql.test.ts \
        scripts/measure-continuations.mjs scripts/measure-continuations.test.ts \
        docs/agents/CONTENT.md plan/60-findings.md \
        supabase/seed/0003_scoring_material.sql docs/gate-recheck.md
git commit -m "loop(DEV): C-XXXX T-224 — sense_items.level + level_rationale, tagged at write time (D-141), closes F-168"
```

Then, per `docs/agents/DEV.md` STEP 7: `supabase db push` this migration (STEP C — connect once with the scheduled task's credentials, apply, **verify it succeeded** against the live project before marking the row 🟣), update `plan/50-tasks.md`'s `T-224` status cell to 🟣 with this cycle id, `npm run generate-map` if `package.json` carries that script, and the usual `00-control.md` handoff (`NEXT_AGENT=CRITIC`, release the lock, one journal line).

---

## Self-Check

**Spec coverage:**
- D-141 § ג ⓐ (migration adds `level`/`level_rationale`, nullable, no backfill) → Step 1.
- D-141 § ג ⓑ (`items` stops being `string[]`, becomes an object) → Step 5 (`GeneratedSense.items: readonly GeneratedItem[]`).
- D-141 § ג ⓒ (gate rejects an item with no valid level or no rationale) → Step 5's rewritten items loop + Step 3's six new tests — refined by this plan's own logged design call (grandfathered null/null pair) rather than an unconditional rejection, for the reason in Measured Discrepancies.
- Task row ⓓ (loader accepts both shapes, `npm run build:ingest` does not fail on the whole repo) → Steps 7-10 (`batchRecord.ts`), proven against the exact legacy `ROW` fixture already in the test file, plus Step 25's live regeneration check that zero real rows change gate outcome.
- Task row ⓔ (writing precedes loading — CONTENT.md already told the agent to write the fields) → Step 23 flips CONTENT.md from "not yet" to "now", matching that the schema/gate/migration all exist after this commit.
- Task row's blast-radius note, corrected (senseAccuracy.ts excluded, batchRecord.ts + build-ingest-sql.mjs included) → File Structure table + Measured Discrepancies.
- `F-168` (open finding, mis-citing `T-223`) → Step 24 closes it with the corrected citation.

**Placeholder scan:** every step above contains complete, runnable code or exact before/after text — none deferred to "add appropriate handling" language.

**Type consistency:** `GeneratedItem`/`ItemLevel`/`ITEM_LEVELS` (contentSchema.ts, Step 5) are imported with identical names and shapes into `batchRecord.ts` (Step 9) and `scoringSeed.ts` (Step 13); `ItemRow` (scoringSeed.ts) is consumed with the same field names by `build-ingest-sql.mjs` (Step 17, `r.level`/`r.levelRationale`). No task introduces a second, incompatible name for the same concept.
