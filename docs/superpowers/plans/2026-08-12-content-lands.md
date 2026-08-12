# Content Lands — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the **343 senses that the Content agent has already written and gated** out of `data/generated/*.jsonl`, where no learner can reach them, and land them in the content bank — through the deterministic gate a second time, with a spot-check plan that is honest about what the standard actually covers — and then make the one sense the generator was unsure about **visibly** unverified on the back of the card.

**Loop tasks covered:** **T-042** (Tasks 1–3) · **T-045** (Task 4).

**Why these four are one plan, not two:** T-042 ends by writing `senses.needs_human_review = true`. T-045 is the only thing that makes that column mean anything to a learner. Landing the first without the second ships a card that claims certainty we do not have — which is the exact failure D-024 was written to stop, in the opposite direction.

**Tech Stack:** TypeScript (pure modules under `lib/core/`), Node `.mjs` script for the one impure layer, PostgreSQL emitted as a file and applied by hand, Vitest.

## Global Constraints

- ⛔ **No content is invented, translated, or edited.** Every field written to SQL is copied verbatim from a `data/generated/batch-*.jsonl` row. A row the gate rejects is **reported and dropped**, never repaired by this pipeline (repair is a Content-agent tick).
- ⛔ **`/lib/core/` stays pure** — no `fs`, no `window`, no `process.env`, no `fetch`. `npm run check:core` enforces it. All file reading lives in `scripts/`.
- ⛔ **No new dependency.** The `.mjs` + `registerHooks` type-stripping pattern from `scripts/measure-coverage.mjs` is copied, not replaced.
- ⛔ **No `main`.** Push to `dev` only. No `[skip ci]` in any commit message (RULES § 0.7).
- ⛔ **No design skill is loaded.** Task 4 uses only tokens that already exist in `lib/core/palette.ts`; it introduces no colour, no font and no radius.
- Verification before any completion claim: `npm run typecheck && npm run check:core && npm test && npm run build`.

---

## What is measured, not assumed

Run in this repo on 2026-08-12 (`wc -l`, `python3 -c`, `grep -n`, `sed`):

| fact | measured value |
|---|---|
| batch files in `data/generated/` | 6 — `batch-2026-08-07` … `batch-2026-08-12` |
| rows across all six | **343** (45 · 55 · 60 · 64 · 61 · 58) |
| keys present on every row | all 16, on all 343 rows — zero missing, zero extra |
| `translation_confidence` distribution | **330 `high` · 12 `medium` · 1 `low`** |
| `spot_check` distribution | `true` on all 343 |
| content rows in the database | **0** — the batches have never been inserted |
| `senses.needs_human_review` | exists since `0003_low_confidence_is_visible.sql`, `boolean not null default false`, back-filled from `translation_confidence = 'low'` |
| gate entry point | `gateSense(input: GeneratedSense, opts: GateOptions): GateResult` — `lib/core/contentSchema.ts:282` |
| `GeneratedSense` fields | `headword · pos · translationHe · definitionEn · examples{supportive,neutral} · items · distractors[{word,relationType}]` — **camelCase, and it does not carry `translation_confidence`, `cefr_level` or `sense_index`** |
| F-020 (gate false-accept) | ✅ **closed C-0012** — R-014's "do not release T-042 before it" no longer holds |
| `Card` / `CardFace` | no field expresses verification state (`lib/core/flashcard.ts:50`) |
| study screen | `app/study/page.tsx` is a 28-line empty state; the real component is `components/Flashcard.tsx`, measured at `/dev/card` |
| card back marker anchor | `<div … data-card-back>` — `components/Flashcard.tsx:69` |
| palette tokens available | 11, incl. `--ink-muted` and `--border-subtle`. **No "warning" token exists** |
| suite size at plan time | 574 tests, 39 files |

### Three consequences, stated before any code is written

**ⓐ The jsonl row is not a `GeneratedSense` and must not be cast into one.** It is snake_case, it carries six fields the gate's type does not have (`sense_index`, `cefr_level`, `translation_confidence`, `he_*`, `n_letters`, `n_syllables`, `is_function_word`, `spot_check`), and `distractors[].relation_type` is spelled differently from `relationType`. A `JSON.parse(line) as GeneratedSense` typechecks and is wrong at runtime — the gate would read `undefined` for every distractor relation and quietly stop scoring them. Task 1 exists to make that impossible.

**ⓑ R-014 documents exactly one row of ISO 2859-1, and 343 is not in it.** The rule reads: *"אצווה של 501–1,200 פריטים ⇐ 80 פריטים לבדיקה, קבלה עד 2 פגמים."* Our lot is **343**. Inventing the sample size for a 281–500 lot means reading a table we do not hold and then citing it as if we had — the same move R-014 itself was written to forbid. So `spotCheckPlan` implements **only** the row we hold, falls back to **100% inspection** below it (refusing to sample is never a claim about a standard), and **throws** above 1,200 rather than extrapolating. The Content agent already reached the same answer independently — `manifest.json` says *"batch is smaller than 80, so every sense is marked spot_check=true"* — so this is agreement, not a new policy.

**ⓒ There is no live Supabase in the loop environment (T-019), so the pipeline emits SQL rather than calling the network.** A network writer cannot be run, cannot be tested, and would be a second, untested application path alongside `supabase/migrations/`, which Roy already applies by hand. The output is one file in `supabase/seed/`, applied exactly like a migration. This is a deliberate trade recorded as **TD-24**, not an oversight: the day a service-role runner exists, it consumes the same pure modules from Tasks 1–2 and only the emitter changes.

---

## File structure

| file | responsibility | pure? |
|---|---|---|
| `lib/core/batchRecord.ts` | one jsonl object → validated `BatchRecord`; the only place snake_case exists | ✅ |
| `lib/core/batchRecord.test.ts` | Task 1 tests | — |
| `lib/core/spotCheck.ts` | lot size → inspection plan; defect count → verdict | ✅ |
| `lib/core/spotCheck.test.ts` | Task 2 tests | — |
| `scripts/build-ingest-sql.mjs` | reads batches + allowed-words, runs the gate, emits SQL | ⛔ impure, by design |
| `scripts/build-ingest-sql.test.ts` | Task 3 tests — runs the script and asserts on its output | — |
| `supabase/seed/0001_content_batches.sql` | generated artefact, committed | — |
| `lib/core/flashcard.ts` | `CardSense.needsHumanReview` → `CardFace.unverified` on the **back only** | ✅ |
| `components/Flashcard.tsx` | renders the "טרם אומת" marker inside `data-card-back` | — |

---

## Task 1: The batch record parser

**Files:**
- Create: `lib/core/batchRecord.ts`
- Create: `lib/core/batchRecord.test.ts`

**Interfaces:**
- Consumes: `GeneratedSense`, `Pos`, `POS_VALUES`, `RelationType`, `RELATION_TYPES` from `lib/core/contentSchema.ts`.
- Produces:

```ts
export const CONFIDENCE_VALUES = ['low', 'medium', 'high'] as const;
export type Confidence = (typeof CONFIDENCE_VALUES)[number];

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export interface BatchRecord {
  readonly sense: GeneratedSense;      // exactly what gateSense() takes
  readonly senseIndex: number;
  readonly cefrLevel: CefrLevel;
  readonly confidence: Confidence;
  /** D-024: low confidence is SHOWN and MARKED, never hidden. */
  readonly needsHumanReview: boolean;
  readonly heInterferenceNote: string | null;
  readonly heOneToManyGroup: string | null;
  readonly spotCheck: boolean;
}

export function parseBatchRecord(raw: unknown): BatchRecord;   // throws RangeError with the offending field named
export function parseBatchFile(text: string): BatchRecord[];   // splits on newlines, skips blank lines, prefixes errors with "line N: "
```

- [ ] **Step 1: Write the failing test**

```ts
// lib/core/batchRecord.test.ts
import { describe, expect, it } from 'vitest';
import { parseBatchFile, parseBatchRecord } from './batchRecord';

const ROW = {
  headword: 'few', pos: 'determiner', sense_index: 1,
  definition_en: 'a small number of people or things, not many',
  translation_he: 'מעטים', cefr_level: 'A1', translation_confidence: 'high',
  examples: { supportive: 'Only a few people are here.', neutral: 'A few students are ready now.' },
  items: ['Only ____ people are at the meeting.'],
  distractors: [{ word: 'much', relation_type: 'semantic' }],
  he_one_to_many_group: null, he_interference_note: 'note',
  n_letters: 3, n_syllables: 1, is_function_word: true, spot_check: true,
};

describe('parseBatchRecord', () => {
  it('renames every snake_case field the gate reads', () => {
    const r = parseBatchRecord(ROW);
    expect(r.sense.translationHe).toBe('מעטים');
    expect(r.sense.definitionEn).toBe('a small number of people or things, not many');
    // The one that a bare cast gets wrong and typechecks anyway:
    expect(r.sense.distractors[0].relationType).toBe('semantic');
    expect(Object.keys(r.sense.distractors[0])).toEqual(['word', 'relationType']);
  });

  it('derives needsHumanReview from confidence — D-024, not a copy of spot_check', () => {
    expect(parseBatchRecord({ ...ROW, translation_confidence: 'low' }).needsHumanReview).toBe(true);
    expect(parseBatchRecord({ ...ROW, translation_confidence: 'medium' }).needsHumanReview).toBe(false);
    expect(parseBatchRecord({ ...ROW, translation_confidence: 'high' }).needsHumanReview).toBe(false);
  });

  it('rejects an unknown pos instead of passing it to the gate', () => {
    expect(() => parseBatchRecord({ ...ROW, pos: 'gerund' })).toThrow(/pos/);
  });

  it('rejects an unknown relation_type', () => {
    expect(() => parseBatchRecord({ ...ROW, distractors: [{ word: 'x', relation_type: 'rhyme' }] })).toThrow(/relation_type/);
  });

  it('rejects an unknown cefr_level and an unknown confidence', () => {
    expect(() => parseBatchRecord({ ...ROW, cefr_level: 'B3' })).toThrow(/cefr_level/);
    expect(() => parseBatchRecord({ ...ROW, translation_confidence: 'unsure' })).toThrow(/translation_confidence/);
  });

  it('rejects a missing required field rather than writing undefined to SQL', () => {
    const { translation_he: _drop, ...missing } = ROW;
    expect(() => parseBatchRecord(missing)).toThrow(/translation_he/);
  });

  it('keeps the two nullable Hebrew fields as null, not as the string "null"', () => {
    const r = parseBatchRecord(ROW);
    expect(r.heOneToManyGroup).toBeNull();
    expect(r.heInterferenceNote).toBe('note');
  });

  it('names the line number when a file has a bad row', () => {
    const text = `${JSON.stringify(ROW)}\n\n${JSON.stringify({ ...ROW, pos: 'gerund' })}\n`;
    expect(() => parseBatchFile(text)).toThrow(/line 3/);
  });

  it('parses every real batch row shape without loss', () => {
    expect(parseBatchFile(`${JSON.stringify(ROW)}\n`)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/core/batchRecord.test.ts`
Expected: FAIL — `Failed to resolve import "./batchRecord"`.

- [ ] **Step 3: Implement `lib/core/batchRecord.ts`**

Requirements, each of which a test above already pins:
- A `field(raw, name)` helper that throws `new RangeError(\`\${name} is missing\`)` — the thrown message **must contain the snake_case field name**, because the operator reading the failure is looking at a jsonl file, not at our camelCase types.
- An `oneOf(value, allowed, name)` helper used for `pos`, `relation_type`, `cefr_level`, `translation_confidence`.
- `needsHumanReview` is computed as `confidence === 'low'` — **not** read from `spot_check`. They are different questions and today they happen to disagree (343 spot-checked, 1 needing review).
- `sense` is built field by field. ⛔ No spread of `raw`: a spread carries `n_letters` and `is_function_word` into the object the gate receives and makes the type a lie.
- Extra keys on the row are ignored, not an error — the Content agent may add telemetry fields, and failing the whole ingest over `n_syllables` would be brittle.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run lib/core/batchRecord.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Mutation check — prove the tests are not decorative**

Run each mutation, confirm the named test fails, then revert:

| # | mutation | test that must fail |
|---|---|---|
| 1 | build `sense.distractors` with `relation_type` instead of `relationType` | *renames every snake_case field the gate reads* |
| 2 | `needsHumanReview: raw.spot_check` | *derives needsHumanReview from confidence* |
| 3 | drop the `oneOf` check on `pos` | *rejects an unknown pos* |
| 4 | `sense: { ...raw, ... }` (spread) | *renames every snake_case field* (key list assertion) |
| 5 | swallow the line index in `parseBatchFile` | *names the line number* |

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/batchRecord.ts lib/core/batchRecord.test.ts
git commit -m "loop(DEV): C-XXXX batch record parser (T-042 a)"
```

---

## Task 2: The spot-check plan

**Files:**
- Create: `lib/core/spotCheck.ts`
- Create: `lib/core/spotCheck.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:

```ts
export type InspectionBasis = 'full' | 'iso-2859-1-aql-1.0';

export interface SpotCheckPlan {
  readonly lotSize: number;
  readonly inspect: number;
  readonly acceptUpTo: number;
  readonly basis: InspectionBasis;
  /** Why this plan, in one sentence, for the manifest and the SQL header. */
  readonly rationale: string;
}

export function spotCheckPlan(lotSize: number): SpotCheckPlan;               // throws RangeError above 1200 or below 1
export function selectForSpotCheck<T>(items: readonly T[], plan: SpotCheckPlan): T[];  // deterministic, evenly spaced
export function batchVerdict(defectsFound: number, plan: SpotCheckPlan): 'accept' | 'reject';
```

- [ ] **Step 1: Write the failing test**

```ts
// lib/core/spotCheck.test.ts
import { describe, expect, it } from 'vitest';
import { batchVerdict, selectForSpotCheck, spotCheckPlan } from './spotCheck';

describe('spotCheckPlan', () => {
  it('implements the one row R-014 documents: 501-1200 -> inspect 80, accept up to 2', () => {
    for (const lot of [501, 800, 1200]) {
      const p = spotCheckPlan(lot);
      expect(p.inspect).toBe(80);
      expect(p.acceptUpTo).toBe(2);
      expect(p.basis).toBe('iso-2859-1-aql-1.0');
    }
  });

  it('inspects 100% below 501 rather than inventing a sample size', () => {
    const p = spotCheckPlan(343);           // our real lot
    expect(p.inspect).toBe(343);
    expect(p.acceptUpTo).toBe(2);
    expect(p.basis).toBe('full');
    expect(p.rationale).toMatch(/501/);     // says WHY, naming the boundary we hold
  });

  it('refuses a lot above the documented range instead of extrapolating', () => {
    expect(() => spotCheckPlan(1201)).toThrow(/1,?200/);
  });

  it('refuses an empty or negative lot', () => {
    expect(() => spotCheckPlan(0)).toThrow(/lot/);
    expect(() => spotCheckPlan(-5)).toThrow(/lot/);
  });
});

describe('selectForSpotCheck', () => {
  const items = Array.from({ length: 600 }, (_, i) => i);

  it('picks exactly plan.inspect items', () => {
    expect(selectForSpotCheck(items, spotCheckPlan(600))).toHaveLength(80);
  });

  it('is deterministic — same input, same output, twice', () => {
    const a = selectForSpotCheck(items, spotCheckPlan(600));
    const b = selectForSpotCheck(items, spotCheckPlan(600));
    expect(a).toEqual(b);
  });

  it('spreads across the whole lot instead of taking the first 80', () => {
    const picked = selectForSpotCheck(items, spotCheckPlan(600));
    expect(picked).not.toEqual(items.slice(0, 80));
    expect(Math.max(...picked)).toBeGreaterThan(500);
    expect(Math.min(...picked)).toBeLessThan(20);
    expect(new Set(picked).size).toBe(80);        // no duplicates
  });

  it('returns every item when the plan is full inspection', () => {
    const small = Array.from({ length: 343 }, (_, i) => i);
    expect(selectForSpotCheck(small, spotCheckPlan(343))).toEqual(small);
  });

  it('refuses a plan built for a different lot size', () => {
    expect(() => selectForSpotCheck(items, spotCheckPlan(343))).toThrow(/lot/);
  });
});

describe('batchVerdict', () => {
  it('accepts at the boundary and rejects one past it — R-014 says "up to 2"', () => {
    const p = spotCheckPlan(600);
    expect(batchVerdict(2, p)).toBe('accept');
    expect(batchVerdict(3, p)).toBe('reject');
    expect(batchVerdict(0, p)).toBe('accept');
  });

  it('rejects more defects than items inspected as a caller error', () => {
    expect(() => batchVerdict(81, spotCheckPlan(600))).toThrow(/inspected/);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/core/spotCheck.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `lib/core/spotCheck.ts`**

- `spotCheckPlan`: `lotSize < 1` → throw; `lotSize <= 500` → `{inspect: lotSize, acceptUpTo: 2, basis: 'full'}`; `lotSize <= 1200` → `{inspect: 80, acceptUpTo: 2, basis: 'iso-2859-1-aql-1.0'}`; else throw naming 1,200.
- `rationale` for `full` must name the 501 boundary and say that no sample-size row is held for smaller lots.
- `selectForSpotCheck`: throw if `items.length !== plan.lotSize`. Even spacing, no RNG: `Math.floor((i * items.length) / plan.inspect)` for `i` in `0..inspect-1`. That formula is duplicate-free for `inspect <= items.length`, which the plan guarantees.
- The file header must state, in one sentence, that only one row of ISO 2859-1 is held and where it came from (R-014), so a later reader does not "complete the table".

- [ ] **Step 4: Run and confirm pass**

Run: `npx vitest run lib/core/spotCheck.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Mutation check**

| # | mutation | test that must fail |
|---|---|---|
| 1 | return `inspect: 50` for lots 281–500 (a plausible ISO row we do not hold) | *inspects 100% below 501* |
| 2 | `lotSize > 1200` returns `inspect: 125` instead of throwing | *refuses a lot above the documented range* |
| 3 | `batchVerdict` uses `>= acceptUpTo` | *accepts at the boundary* |
| 4 | `selectForSpotCheck` returns `items.slice(0, plan.inspect)` | *spreads across the whole lot* |
| 5 | drop the `items.length !== plan.lotSize` guard | *refuses a plan built for a different lot size* |

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/spotCheck.ts lib/core/spotCheck.test.ts
git commit -m "loop(DEV): C-XXXX AQL spot-check plan (T-042 b)"
```

---

## Task 3: The ingest SQL builder

**Files:**
- Create: `scripts/build-ingest-sql.mjs`
- Create: `scripts/build-ingest-sql.test.ts`
- Create (generated, committed): `supabase/seed/0001_content_batches.sql`
- Modify: `package.json` — add `"build:ingest": "node scripts/build-ingest-sql.mjs"`

**Interfaces:**
- Consumes: `parseBatchFile` (Task 1) · `spotCheckPlan`, `selectForSpotCheck`, `batchVerdict` (Task 2) · `gateSense` from `lib/core/contentSchema.ts`.
- Produces: a SQL file and a stdout report. No exported TypeScript API.

**Copy the `registerHooks` preamble from `scripts/measure-coverage.mjs` verbatim** — it is what lets a `.mjs` file import `.ts` modules with no build step and no dependency.

**What the script does, in order:**
1. Reads `data/generated/allowed-words-2026-08-07.txt` into a `Set` (one word per line, lower-cased, blanks skipped).
2. Reads every `data/generated/batch-*.jsonl` in **sorted filename order** and parses it with `parseBatchFile`.
3. Runs `gateSense(record.sense, { allowedWords })` on **every** row. Rows that fail are collected with their file, line and `reasons`, **excluded from the SQL**, and printed. If any row fails, the script still writes the SQL for the passing rows but **exits with code 1** so a green run means "all 343 landed".
4. Computes `spotCheckPlan(totalPassing)` once over the whole lot and marks the selected rows.
5. Emits `supabase/seed/0001_content_batches.sql`.

**Shape of the emitted SQL** — one transaction, one `generation_runs` row per batch file, idempotent:

```sql
begin;
-- generated by scripts/build-ingest-sql.mjs — do not edit by hand
-- lot 343 · inspect 343 · accept up to 2 · basis: full
with run as (
  insert into public.generation_runs (model, prompt_version, requested, accepted, rejected, notes)
  values ('claude-opus-5', 'content-agent/2026-08-07', 45, 45, 0, 'batch-2026-08-07.jsonl')
  returning id
), w as (
  insert into public.words (headword, pos) values ('few', 'determiner')
  on conflict (headword, pos) do update set headword = excluded.headword
  returning id
)
insert into public.senses (word_id, sense_index, definition_en, translation_he, cefr_level,
                           translation_confidence, he_interference_note, he_one_to_many_group,
                           generation_run_id, needs_human_review)
select w.id, 1, '…', '…', 'A1', 'high', '…', null, run.id, false from w, run
on conflict (word_id, sense_index) do nothing;
commit;
```

- Every literal is escaped by doubling `'`. A dedicated test pins this.
- `model` and `prompt_version` come from the matching `manifest-*.json` (and `manifest.json` for 08-12), **not** invented.
- ⛔ The script writes **no** `sense_items` or `sense_distractors` rows in this task. `0003_low_confidence_is_visible.sql` blocks learners from reading scoring material tied to a `low` sense, and `words` has a `unique (headword, pos)` assumption this task must confirm before relying on it — if the constraint is absent, emit `on conflict do nothing` on a `select`-guarded insert instead and record it. Items and distractors are their own task, after a Critic pass on this one.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/build-ingest-sql.test.ts
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SQL = 'supabase/seed/0001_content_batches.sql';

describe('build-ingest-sql', () => {
  const out = execFileSync('node', ['scripts/build-ingest-sql.mjs'], { encoding: 'utf8' });
  const sql = readFileSync(SQL, 'utf8');

  it('lands all 343 measured rows — a drop is a regression, not a detail', () => {
    expect(out).toMatch(/343 rows? read/);
    expect(out).toMatch(/0 rejected by the gate/);
  });

  it('opens and closes exactly one transaction', () => {
    expect(sql.match(/^begin;$/gm)).toHaveLength(1);
    expect(sql.match(/^commit;$/gm)).toHaveLength(1);
  });

  it('marks exactly the one low-confidence sense for human review (D-024)', () => {
    expect(sql.match(/, true\)?\s*(from|;)/g) ?? []).toHaveLength(1);
    expect((sql.match(/'low'/g) ?? []).length).toBe(1);
  });

  it('writes one generation_runs row per batch file, with the manifest model', () => {
    expect(sql.match(/insert into public\.generation_runs/g)).toHaveLength(6);
    expect(sql).toContain("'claude-opus-5'");
  });

  it('escapes a Hebrew apostrophe instead of breaking the statement', () => {
    // every quoted literal has an even number of quote characters around it
    for (const line of sql.split('\n')) {
      expect((line.match(/(?<!')'(?!')/g) ?? []).length % 2).toBe(0);
    }
  });

  it('never emits scoring material in this task', () => {
    expect(sql).not.toMatch(/insert into public\.sense_items/);
    expect(sql).not.toMatch(/insert into public\.sense_distractors/);
  });

  it('reports the spot-check plan it used', () => {
    expect(out).toMatch(/inspect 343 .* accept up to 2/);
  });

  it('is deterministic — a second run produces a byte-identical file', () => {
    const first = readFileSync(SQL);
    execFileSync('node', ['scripts/build-ingest-sql.mjs']);
    expect(readFileSync(SQL).equals(first)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run scripts/build-ingest-sql.test.ts`
Expected: FAIL — `Cannot find module '.../scripts/build-ingest-sql.mjs'`.

- [ ] **Step 3: Implement the script**

- [ ] **Step 4: Run it, read the report, and confirm the gate accepts all 343**

Run: `node scripts/build-ingest-sql.mjs`
Expected: `343 rows read · 0 rejected by the gate · lot 343 · inspect 343 · accept up to 2 · basis full`, exit code 0.
⚠️ **If any row is rejected, stop and report it — do not edit the content to make the gate pass.** A rejected row is a finding against the Content agent's batch, recorded in `plan/60-findings.md`, and the task ships with that row excluded and named.

- [ ] **Step 5: Run the tests**

Run: `npx vitest run scripts/build-ingest-sql.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 6: Mutation check**

| # | mutation | test that must fail |
|---|---|---|
| 1 | skip the last batch file | *lands all 343 measured rows* |
| 2 | drop the `''` escaping | *escapes a Hebrew apostrophe* |
| 3 | emit one `generation_runs` row for the whole lot | *writes one generation_runs row per batch file* |
| 4 | set `needs_human_review` from `spot_check` | *marks exactly the one low-confidence sense* |
| 5 | add a `sense_items` insert | *never emits scoring material in this task* |
| 6 | sort batch files by `readdir` order instead of sorted | *is deterministic* |

- [ ] **Step 7: Record the debt and commit**

Add **TD-24** to `plan/30-architecture.md`: *the seed SQL has not been applied to a live project (same shape as TD-20/TD-22); and the ingest path is a generated file rather than a service-role writer, because T-019 leaves the loop with no Supabase credentials.*

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add scripts/build-ingest-sql.mjs scripts/build-ingest-sql.test.ts supabase/seed/0001_content_batches.sql package.json plan/30-architecture.md
git commit -m "loop(DEV): C-XXXX ingest SQL builder, 343 senses gated (T-042 c)"
```

---

## Task 4: "טרם אומת" reaches the card back

**Files:**
- Modify: `lib/core/flashcard.ts` — `CardSense`, `CardFace`, `face()`, `buildCard()`
- Modify: `lib/core/flashcard.test.ts`
- Modify: `components/Flashcard.tsx:69` — inside the `data-card-back` block
- Modify: `app/dev/card/page.tsx` — one unverified fixture so `check:mobile` can measure it

**Interfaces:**
- Consumes: `BatchRecord.needsHumanReview` (Task 1) — the same boolean the SQL writes.
- Produces:

```ts
export type CardSense = Pick<GeneratedSense, 'headword' | 'translationHe' | 'examples'> & {
  /** senses.needs_human_review — D-024. Required, with no default: see Step 3. */
  readonly needsHumanReview: boolean;
};

export interface CardFace {
  // … existing fields unchanged …
  /** True only on the back of a card built from an unverified sense. */
  readonly unverified: boolean;
}
```

**The decision this task makes, and why it is behaviour and not styling:** `needsHumanReview` could be read straight off the sense inside `Flashcard.tsx`. It must not be. TD-11 is the recorded lesson — the target-word highlight was reimplemented in React and drifted from core. The same failure here is worse: the marker would appear on the **front** of a production card, where the front is the Hebrew prompt, telling the learner the question is unreliable before they have answered. Putting `unverified` on `CardFace` makes "back only" a property of the model that a test can pin, in both directions.

- [ ] **Step 1: Write the failing tests**

```ts
// appended to lib/core/flashcard.test.ts
const UNVERIFIED = { ...SENSE, needsHumanReview: true };   // SENSE = the file's existing fixture + needsHumanReview: false

it('marks the back, and only the back, of an unverified recognition card', () => {
  const card = buildCard(UNVERIFIED, 'recognition', { isFirstEncounter: true });
  expect(card.back.unverified).toBe(true);
  expect(card.front.unverified).toBe(false);
});

it('marks the back, and only the back, of an unverified production card', () => {
  // The front here is the Hebrew prompt — marking it would tell the learner the
  // QUESTION is unreliable before they answer.
  const card = buildCard(UNVERIFIED, 'production', { isFirstEncounter: false });
  expect(card.back.unverified).toBe(true);
  expect(card.front.unverified).toBe(false);
});

it('leaves both faces unmarked for a verified sense', () => {
  const card = buildCard({ ...SENSE, needsHumanReview: false }, 'recognition', { isFirstEncounter: true });
  expect(card.back.unverified).toBe(false);
  expect(card.front.unverified).toBe(false);
});
```

```ts
// components/Flashcard.test.ts — a new file, following the pattern of EnWord.test.ts
it('renders the marker inside the back block, never outside it', () => {
  // Assert on the rendered markup: the string 'טרם אומת' appears exactly once,
  // and its index falls between the index of `data-card-back` and the closing
  // of that div. A marker rendered next to the front would place it earlier.
});

it('renders no marker for a verified card', () => {
  expect(html).not.toContain('טרם אומת');
});

it('carries a text label, never colour alone', () => {
  // The rule T-041 already established: colour is never the only channel.
  expect(html).toMatch(/טרם אומת/);
});
```

- [ ] **Step 2: Run and confirm they fail**

Run: `npx vitest run lib/core/flashcard.test.ts components/Flashcard.test.ts`
Expected: FAIL — `unverified` is not a property of `CardFace`; the marker string is absent.

- [ ] **Step 3: Make `needsHumanReview` required on `CardSense`, and fix every existing call site**

⚠️ This breaks existing callers on purpose. An optional field defaulting to `false` means a sense that nobody classified renders as *verified* — the exact shape of the `is_function_word` defect the layer-2 plan measured, and the inverse of D-024. Every existing fixture in `flashcard.test.ts`, `contentSchema.test.ts` and `app/dev/card/page.tsx` gets an explicit `needsHumanReview: false`.

- [ ] **Step 4: Add `unverified` to `CardFace` and set it in `buildCard`**

`face()` takes a new final parameter. In `buildCard`, both `en` and `he` are built with `false`, and the **back** face is spread with `unverified: sense.needsHumanReview` — the same single place that already spreads `example` and `exampleSegments` onto the back.

- [ ] **Step 5: Render the marker in `components/Flashcard.tsx`**

Inside the existing `data-card-back` div, after the answer paragraph:

```tsx
{card.back.unverified ? (
  <p
    className="flex items-center gap-2 text-sm text-ink-muted"
    data-card-unverified
  >
    <span aria-hidden="true">◇</span>
    טרם אומת — התרגום ממתין לאישור אנושי
  </p>
) : null}
```

⛔ No new colour, no new token, no `--warning`: the palette has 11 tokens and none of them means "warning". `text-ink-muted` is the discreet register T-045 asks for, the symbol is a second channel so colour is never alone, and `aria-hidden` keeps the screen reader on the sentence rather than on a decorative glyph.

- [ ] **Step 6: Run everything and confirm pass**

Run: `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
Expected: all pass; suite grows by 6 tests; `check:mobile` reports no horizontal scroll at 375px with the marker present.

- [ ] **Step 7: Mutation check**

| # | mutation | test that must fail |
|---|---|---|
| 1 | set `unverified` on both faces | *marks the back, and only the back* (×2) |
| 2 | make `needsHumanReview` optional with `= false` | typecheck still passes → **the test that must fail is the mutation itself**; instead delete `needsHumanReview` from one fixture and confirm `npm run typecheck` fails |
| 3 | move the marker outside the `data-card-back` div | *renders the marker inside the back block* |
| 4 | replace the text with a coloured dot only | *carries a text label, never colour alone* |

- [ ] **Step 8: Update the plan files and commit**

`plan/50-tasks.md`: T-045 → ✅ with the two halves named (schema already in `0003`, UI here). `plan/30-architecture.md`: a 3.1.x entry for the `unverified` face field.

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/flashcard.ts lib/core/flashcard.test.ts components/Flashcard.tsx components/Flashcard.test.ts app/dev/card/page.tsx plan/50-tasks.md plan/30-architecture.md
git commit -m "loop(DEV): C-XXXX unverified marker on the card back (T-045)"
```

---

## Self-review against the source rows

| requirement | where it is met |
|---|---|
| T-042 "reads the Content agent's output" | Task 1 + Task 3 step 2 |
| T-042 "runs the gate" | Task 3 step 3 — every row, no exception |
| T-042 "writes to DB with `generation_run_id`" | Task 3, one run row per batch file |
| T-042 "marks items for human sampling per AQL 1.0" | Task 2 + Task 3 step 4 |
| T-042 "a batch with >2 defects is rejected whole" | Task 2, `batchVerdict` |
| T-045 "`needs_human_review` on `senses`" | already shipped in `0003_low_confidence_is_visible.sql` — verified, not redone |
| T-045 "RLS letting the learner read `low`" | already shipped in the same file |
| T-045 "discreet visual marker on the back of the card" | Task 4 |
| T-045 "scoring items stay blocked for `low`" | already enforced by the `0003` policies; Task 3 emits no scoring rows at all |
| D-024 "shown, marked, excluded from scoring" | Task 1 (`needsHumanReview`), Task 4 (marked), Task 3 (no scoring rows) |
| R-014 "no generated item enters the DB without the gate" | Task 3 step 3 |

**Known gap, stated rather than hidden:** `sense_examples`, `sense_items` and `sense_distractors` are **not** written by this plan. The 343 rows carry two examples, ~3 items and ~4 distractors each — roughly 2,400 more rows and a second lot for spot-check purposes. That is its own task with its own review, and bundling it here would put the largest untested SQL emission in the repo behind a single Critic pass. Recommend the PM open **T-050** for it, blocked on a clean Critic review of Task 3.
