# Preview Before Signup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fill `PREVIEW_CARDS` — the empty array that `app/page.tsx` has been rendering nothing from since T-027 — with real, gate-verified, attributed flashcards drawn from the 534 senses the Content agent has already written, so a learner can judge the product before handing over an email (F-012).

**Architecture:** A pure selector in `lib/core/` turns parsed `BatchRecord[]` into `PreviewCard[]` under stated eligibility rules; an impure `scripts/` generator reads the jsonl files and emits a data-only TypeScript module; `landing.ts` re-exports that module's array as `PREVIEW_CARDS`. No screen, no component and no copy changes — the card block in `app/page.tsx:74-100` already exists and already renders `{preview ? … : null}`. **The only thing that changes is data**, exactly as `lib/core/landing.ts:60` predicted.

**Tech Stack:** TypeScript (pure modules under `lib/core/`), Node `.mjs` script with the `registerHooks` type-stripping preamble copied verbatim from `scripts/build-ingest-sql.mjs`, Vitest.

**Spec:** `plan/20-alerts.md` (P-001) · `plan/60-findings.md` (F-012, F-060) · `plan/50-tasks.md` (T-034) · `plan/35-design-constitution.md` (frozen — no token, font or radius is touched here)

**Loop tasks covered:** **T-034** (Tasks 1–3). F-012 moves from 🟡 half-addressed to closable by the Critic once Task 3 lands.

⚠️ **Execution gate — read before Task 1.** `T-034` is marked `⛔ חסום ב-P-001` in `plan/50-tasks.md`. **F-060 (opened C-0165) is the measurement that says P-001's stated cause no longer holds.** Do not start Task 1 until the PM has lifted `⛔` on T-034 or the Critic has ruled on F-060. The plan is written now so that the moment the blocker lifts, execution is one tick and not three.

## Global Constraints

- ⛔ **No content is invented, translated or edited.** Every Hebrew string emitted is copied verbatim from a `data/generated/batch-*.jsonl` row. A row that does not satisfy every eligibility rule is **dropped**, never repaired, never padded. R-010 (MAL"O) and R-013 (AnkiWeb) are untouched — nothing here reads either.
- ⛔ **`/lib/core/` stays pure** — no `fs`, no `window`, no `document`, no `localStorage`, no `fetch`, no `process.env`. `npm run check:core` enforces it. All file reading lives in `scripts/`. A generated `.ts` file that contains only a literal array is pure and belongs in `lib/core/`.
- ⛔ **No new dependency.** `package.json` is not modified.
- ⛔ **No design skill is loaded, no token invented.** `app/page.tsx` is edited only inside its comment block. Zero className changes. § 3 radii and § 2 type scale are not touched.
- ⛔ **No `main`.** Push to `dev` only. No `[skip ci]` in any commit message (RULES § 0.7).
- ⛔ **No UX decision.** The card anatomy, its position, its heading (`נסה מילה אחת עכשיו`) and its render condition were decided in T-027 and are already in the file. This plan supplies rows and nothing else.
- Verification before any completion claim: `npm run typecheck && npm run check:core && npm test && npm run build`.

---

## What is measured, not assumed

Run in this repo on 2026-08-16 (`node scripts/measure-gate.mjs`, `wc -l`, `python3`, `grep -n`):

| fact | measured value |
|---|---|
| batch files in `data/generated/` | **9** — `batch-2026-08-07` … `batch-2026-08-16` |
| rows across all nine | **534** (45 · 55 · 60 · 64 · 61 · 58 · 60 · 66 · 65) |
| rows carrying `translation_he` | **534 / 534** |
| gate re-check (`npm run measure:gate`) | `534 rows read from 9 batch files` · `1068 example sentences · 1602 item stems re-gated` · **`0 rows rejected`** |
| distinct headwords in the bank | **405** |
| `PREVIEW_CARDS` today | `[]` — `lib/core/landing.ts:69`, with a `TODO:CONTENT-PLACEHOLDER` block above it |
| what the landing screen does with it | `landingPreviewCard()` → `PREVIEW_CARDS[0] ?? null`; `app/page.tsx:36` renders the whole `<section>` only when non-null |
| `PreviewCard` fields | `headword · pos · options[] · correctIndex · sourceId` — `lib/core/landing.ts:45-58`, **unchanged by this plan** |
| batch row → distractor shape | `distractors: [{ word, relation_type }]`, and **`word` is English**, e.g. `walk` → `carry · push · wall · yellow` |
| **distractors that carry a Hebrew row of their own** | histogram over 534 rows: **0 →119 · 1 →150 · 2 →142 · 3 →119 · 4 →4** |
| rows with ≥3 Hebrew-covered distractors | **123** |
| A1 + `high` confidence + `spot_check` rows | **241** |
| …of those, with ≥3 Hebrew-covered distractors | **74** |
| cards this plan needs | **6** (inside the 5–10 F-012 asks for) — margin is 74 ÷ 6 ≈ **12×** |
| parser already in place | `parseBatchFile(text: string): BatchRecord[]` — `lib/core/batchRecord.ts:174`, pure, already tested |
| suite size at plan time | **1,369 tests in 90 files** |

### Four consequences, stated before any code is written

**ⓐ The options must be Hebrew, and the row's own distractors are English.** A card shows an English headword and asks for its meaning; every option must therefore be a Hebrew string. `distractors[].word` is English (`carry`, `wall`, `yellow`). The only licensed Hebrew we hold for those words is `translation_he` on **their own row in the bank**. So a distractor is usable only when its word is itself a headword we have written Hebrew for — which is why the histogram above is the gating measurement of this whole plan, and why **119 of 534 rows can never produce a card**. Task 1 filters; it does not fabricate a fourth option.

**ⓑ 74 eligible rows for 6 cards is the difference between selecting and settling.** Because the margin is 12×, the selector can afford strict rules — A1 only, `high` confidence only, `senseIndex === 1` only, distinct headwords only — instead of loosening them to reach a count. A selector that must relax a rule to fill its quota is a selector that will ship a bad card the day the bank shifts. **Task 1 therefore throws when it cannot fill the count under the strict rules**, rather than returning a short array that silently becomes a one-card landing screen.

**ⓒ `senseIndex === 1` is a correctness rule, not a preference.** 15 of the 45 headwords in the newest batch alone are polysemous (`walk`, `light` ×3, `record`, `matter`…). The landing card shows a bare headword with **no sentence and no context** — `app/page.tsx` renders `headword` and `pos` and nothing else. Asking for sense 3 of `light` with no context has more than one defensible answer, and a learner who picks a *correct* meaning and is told they are wrong has been taught that the product is broken. Only the first sense is safe on a context-free card.

**ⓓ `sourceId`'s doc comment is currently false about the content we hold, and Task 3 fixes the comment, not the content.** `lib/core/landing.ts:52-55` says the field names "which licensed dataset this row came from — NGSL, CEFR-J, Hebrew Wordnet… Never a person, never an agent." The Hebrew in the bank was **written for this project by the Content agent**, with the headword list read from NGSL v1.2 (CC BY-SA 4.0, column 1 only) — `data/generated/manifest.json` records both halves. Writing `sourceId: 'ngsl'` would claim NGSL supplied a Hebrew gloss it never contained. Writing `'hebrew-wordnet'` would be worse. The honest value is a batch-provenance id, and the doc comment must say what it now means. ⚠️ **This is the one line of this plan that changes a stated contract rather than filling it — it is called out in F-060 so the Critic can veto it in review.**

---

## File structure

| file | responsibility | pure? |
|---|---|---|
| `lib/core/previewSelection.ts` | `BatchRecord[]` → `PreviewCard[]` under the eligibility rules. The only place the rules exist. | ✅ |
| `lib/core/previewSelection.test.ts` | Rules proven one at a time, on hand-built records. | ✅ |
| `lib/core/previewCards.generated.ts` | **Generated, never hand-edited.** A literal `PreviewCard[]` and nothing else. | ✅ |
| `scripts/build-preview-cards.mjs` | Reads `data/generated/*.jsonl`, calls the selector, writes the generated module. The only impure layer. | ❌ (by design) |
| `scripts/build-preview-cards.test.ts` | Sync ratchet: the committed generated file equals what the script produces today. | ✅ |
| `lib/core/landing.ts` | `PREVIEW_CARDS` re-exports the generated array; `sourceId` doc corrected. | ✅ |
| `app/page.tsx` | Comment only — the placeholder note stops being true. | — |

---

### Task 1: The selector

**Files:**
- Create: `lib/core/previewSelection.ts`
- Test: `lib/core/previewSelection.test.ts`

**Interfaces:**
- Consumes: `BatchRecord` from `./batchRecord` (fields `sense{headword,pos,translationHe,distractors[{word,relationType}]}`, `senseIndex`, `cefrLevel`, `confidence`, `needsHumanReview`, `spotCheck`); `PreviewCard` from `./landing`.
- Produces:
  ```ts
  export interface PreviewSelectionOptions {
    readonly count: number;
    readonly optionCount: number;
    readonly sourceId: string;
  }
  export function selectPreviewCards(
    records: readonly BatchRecord[],
    opts: PreviewSelectionOptions,
  ): PreviewCard[];
  ```
  Throws `RangeError` when fewer than `count` records satisfy the rules.

**The rules, in the order the selector applies them:**

1. `cefrLevel === 'A1'` — the landing card is shown to someone who has not taken a placement test.
2. `confidence === 'high'` **and** `needsHumanReview === false` — D-024 requires an unverified card to be *marked*, and this card has no marker slot.
3. `spotCheck === true`.
4. `senseIndex === 1` — consequence ⓒ.
5. At least `optionCount - 1` distractors are **Hebrew-covered**: the distractor's `word` is itself a headword in `records`, is not this row's own headword, and its Hebrew differs from this row's `translationHe` (an option equal to the correct answer makes two answers correct).
6. One card per headword.
7. Order is `headword` ascending — no `Math.random`, no date, no insertion order.
8. `correctIndex` rotates: card *i* places its correct answer at `i % optionCount`, so the answer is not always first.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import type { BatchRecord } from './batchRecord';
import { selectPreviewCards } from './previewSelection';

function rec(over: Partial<BatchRecord> & { headword: string; he: string; distractors?: string[] }): BatchRecord {
  return {
    sense: {
      headword: over.headword,
      pos: 'noun',
      translationHe: over.he,
      definitionEn: 'a definition',
      examples: { supportive: 'A supportive line.', neutral: 'A neutral line.' },
      items: ['The ____ is here.'],
      distractors: (over.distractors ?? []).map((word) => ({ word, relationType: 'semantic' as const })),
    },
    senseIndex: over.senseIndex ?? 1,
    cefrLevel: over.cefrLevel ?? 'A1',
    confidence: over.confidence ?? 'high',
    needsHumanReview: over.needsHumanReview ?? false,
    heInterferenceNote: null,
    heOneToManyGroup: null,
    spotCheck: over.spotCheck ?? true,
    nLetters: over.headword.length,
    nSyllables: 1,
    isFunctionWord: false,
  } as BatchRecord;
}

/** Six headwords, each with three peers to borrow Hebrew from. */
function bank(): BatchRecord[] {
  const words = [
    ['apple', 'תפוח'], ['bread', 'לחם'], ['chair', 'כיסא'],
    ['door', 'דלת'], ['egg', 'ביצה'], ['fish', 'דג'],
    ['green', 'ירוק'], ['house', 'בית'], ['queen', 'מלכה'],
  ] as const;
  return words.map(([w, he], i) =>
    rec({ headword: w, he, distractors: words.filter(([o]) => o !== w).map(([o]) => o).slice(i % 3, (i % 3) + 4) }),
  );
}

const OPTS = { count: 6, optionCount: 4, sourceId: 'generated' };

describe('selectPreviewCards', () => {
  it('returns exactly the requested number of cards', () => {
    expect(selectPreviewCards(bank(), OPTS)).toHaveLength(6);
  });

  it('gives every card exactly optionCount options, all distinct', () => {
    for (const card of selectPreviewCards(bank(), OPTS)) {
      expect(card.options).toHaveLength(4);
      expect(new Set(card.options).size).toBe(4);
    }
  });

  it('puts the row own Hebrew at correctIndex', () => {
    const cards = selectPreviewCards(bank(), OPTS);
    const byHead = new Map(bank().map((r) => [r.sense.headword, r.sense.translationHe]));
    for (const card of cards) {
      expect(card.options[card.correctIndex]).toBe(byHead.get(card.headword));
    }
  });

  it('does not always put the answer in the same slot', () => {
    const slots = new Set(selectPreviewCards(bank(), OPTS).map((c) => c.correctIndex));
    expect(slots.size).toBeGreaterThan(1);
  });

  it('is deterministic — same input, identical output', () => {
    expect(selectPreviewCards(bank(), OPTS)).toEqual(selectPreviewCards(bank(), OPTS));
  });

  it('drops a row whose level is not A1', () => {
    const b = bank().map((r) => (r.sense.headword === 'apple' ? { ...r, cefrLevel: 'B2' as const } : r));
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('apple');
  });

  it('drops a row that is not high confidence', () => {
    const b = bank().map((r) => (r.sense.headword === 'bread' ? { ...r, confidence: 'medium' as const } : r));
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('bread');
  });

  it('drops a row flagged for human review even when confidence is high', () => {
    const b = bank().map((r) => (r.sense.headword === 'chair' ? { ...r, needsHumanReview: true } : r));
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('chair');
  });

  it('drops a row that was not spot checked', () => {
    const b = bank().map((r) => (r.sense.headword === 'door' ? { ...r, spotCheck: false } : r));
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('door');
  });

  it('drops a second sense — a context-free card must not be ambiguous', () => {
    const b = bank().map((r) => (r.sense.headword === 'egg' ? { ...r, senseIndex: 2 } : r));
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('egg');
  });

  it('drops a row whose distractors have no Hebrew of their own', () => {
    const b = bank().map((r) =>
      r.sense.headword === 'fish'
        ? rec({ headword: 'fish', he: 'דג', distractors: ['zebra', 'kettle', 'ladder'] })
        : r,
    );
    expect(selectPreviewCards(b, { ...OPTS, count: 5 }).map((c) => c.headword)).not.toContain('fish');
  });

  it('never offers the correct answer twice', () => {
    const b = [...bank(), rec({ headword: 'flat', he: 'בית', distractors: ['house', 'apple', 'bread', 'chair'] })];
    for (const card of selectPreviewCards(b, OPTS)) {
      const correct = card.options[card.correctIndex] as string;
      expect(card.options.filter((o) => o === correct)).toHaveLength(1);
    }
  });

  it('emits each headword at most once', () => {
    const cards = selectPreviewCards(bank(), OPTS);
    expect(new Set(cards.map((c) => c.headword)).size).toBe(cards.length);
  });

  it('carries the source id onto every card', () => {
    for (const card of selectPreviewCards(bank(), OPTS)) {
      expect(card.sourceId).toBe('generated');
    }
  });

  it('throws rather than returning a short array', () => {
    expect(() => selectPreviewCards(bank().slice(0, 2), OPTS)).toThrow(RangeError);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/core/previewSelection.test.ts`
Expected: FAIL — `Failed to resolve import "./previewSelection"`.

- [ ] **Step 3: Implement `lib/core/previewSelection.ts`**

```ts
/**
 * Chooses the flashcards shown before signup (T-034 · F-012).
 *
 * Pure by contract — no React, no DOM, no I/O (lib/core/README.md). The file
 * reading lives in scripts/build-preview-cards.mjs.
 *
 * ⛔ Nothing here writes Hebrew. Every string it emits was copied out of a
 *    data/generated/batch-*.jsonl row that passed gateSense() twice. A record
 *    that fails any rule below is DROPPED — never padded, never repaired.
 */
import type { BatchRecord } from './batchRecord';
import type { PreviewCard } from './landing';

export interface PreviewSelectionOptions {
  readonly count: number;
  readonly optionCount: number;
  readonly sourceId: string;
}

/** Rules 1-4: properties of the row itself, independent of the rest of the bank. */
function isShowable(record: BatchRecord): boolean {
  return (
    record.cefrLevel === 'A1' &&
    record.confidence === 'high' &&
    !record.needsHumanReview &&
    record.spotCheck &&
    record.senseIndex === 1
  );
}

/**
 * Rule 5. A distractor is only usable if we hold licensed Hebrew for it, and the
 * only Hebrew we hold is the one written on that word's own row.
 */
function hebrewDistractors(
  record: BatchRecord,
  hebrewByHeadword: ReadonlyMap<string, string>,
  need: number,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>([record.sense.translationHe]);
  for (const distractor of record.sense.distractors) {
    if (out.length === need) break;
    if (distractor.word === record.sense.headword) continue;
    const hebrew = hebrewByHeadword.get(distractor.word);
    if (hebrew === undefined || seen.has(hebrew)) continue;
    seen.add(hebrew);
    out.push(hebrew);
  }
  return out;
}

export function selectPreviewCards(
  records: readonly BatchRecord[],
  opts: PreviewSelectionOptions,
): PreviewCard[] {
  if (opts.optionCount < 2) throw new RangeError('optionCount must be at least 2');

  const hebrewByHeadword = new Map<string, string>();
  for (const record of records) {
    if (record.senseIndex !== 1) continue;
    if (!hebrewByHeadword.has(record.sense.headword)) {
      hebrewByHeadword.set(record.sense.headword, record.sense.translationHe);
    }
  }

  const ordered = [...records]
    .filter(isShowable)
    .sort((a, b) => (a.sense.headword < b.sense.headword ? -1 : a.sense.headword > b.sense.headword ? 1 : 0));

  const cards: PreviewCard[] = [];
  const usedHeadwords = new Set<string>();

  for (const record of ordered) {
    if (cards.length === opts.count) break;
    if (usedHeadwords.has(record.sense.headword)) continue;

    const wrong = hebrewDistractors(record, hebrewByHeadword, opts.optionCount - 1);
    if (wrong.length < opts.optionCount - 1) continue;

    const correctIndex = cards.length % opts.optionCount;
    const options = [...wrong];
    options.splice(correctIndex, 0, record.sense.translationHe);

    usedHeadwords.add(record.sense.headword);
    cards.push({
      headword: record.sense.headword,
      pos: record.sense.pos,
      options,
      correctIndex,
      sourceId: opts.sourceId,
    });
  }

  if (cards.length < opts.count) {
    throw new RangeError(
      `only ${cards.length} of ${opts.count} preview cards satisfy the rules — ` +
        'the bank must grow or a rule must be argued down in review, not relaxed here',
    );
  }
  return cards;
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `npx vitest run lib/core/previewSelection.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 5: Mutation check — prove the tests are not decorative**

Make each change, run the file, confirm the **named** test fails, then revert:

| # | mutation | test that must fail |
|---|---|---|
| 1 | `record.senseIndex === 1` → `record.senseIndex >= 1` in `isShowable` | *drops a second sense* |
| 2 | `!record.needsHumanReview` → `true` | *drops a row flagged for human review* |
| 3 | `if (seen.has(hebrew)) continue` → drop the `seen.has` clause | *never offers the correct answer twice* |
| 4 | `const correctIndex = cards.length % opts.optionCount` → `= 0` | *does not always put the answer in the same slot* |
| 5 | `if (cards.length < opts.count) throw` → `return cards` | *throws rather than returning a short array* |
| 6 | remove the `.sort(...)` | *is deterministic* — ⚠️ if it still passes, the fixture order already matches sorted order; rename two fixture words so it does not, and keep that fixture. |

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test
git add lib/core/previewSelection.ts lib/core/previewSelection.test.ts
git commit -m "loop(DEV): C-XXXX preview card selector (T-034, task 1)"
```

---

### Task 2: The generator and its sync ratchet

**Files:**
- Create: `scripts/build-preview-cards.mjs`
- Create: `lib/core/previewCards.generated.ts` (written by the script — do not hand-author)
- Test: `scripts/build-preview-cards.test.ts`

**Interfaces:**
- Consumes: `parseBatchFile` (`lib/core/batchRecord.ts:174`), `selectPreviewCards` (Task 1).
- Produces: `lib/core/previewCards.generated.ts`, exporting
  ```ts
  export const GENERATED_PREVIEW_CARDS: readonly PreviewCard[];
  export const PREVIEW_CARDS_SOURCE_ID = 'generated:ngsl-headwords';
  ```
- Adds to `package.json` scripts: `"build:preview": "node scripts/build-preview-cards.mjs"`.

- [ ] **Step 1: Write the failing test**

```ts
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GENERATED_PREVIEW_CARDS, PREVIEW_CARDS_SOURCE_ID } from '../lib/core/previewCards.generated';
import { isAttributedCard } from '../lib/core/landing';

describe('build-preview-cards', () => {
  it('emits six cards', () => {
    expect(GENERATED_PREVIEW_CARDS).toHaveLength(6);
  });

  it('emits only attributed cards', () => {
    for (const card of GENERATED_PREVIEW_CARDS) expect(isAttributedCard(card)).toBe(true);
  });

  it('emits only Hebrew options — a Latin option means an English distractor leaked through', () => {
    for (const card of GENERATED_PREVIEW_CARDS) {
      for (const option of card.options) expect(option).not.toMatch(/[A-Za-z]/);
    }
  });

  it('emits Latin headwords', () => {
    for (const card of GENERATED_PREVIEW_CARDS) expect(card.headword).toMatch(/^[a-z][a-z' -]*$/);
  });

  it('names its provenance', () => {
    expect(PREVIEW_CARDS_SOURCE_ID).toBe('generated:ngsl-headwords');
    for (const card of GENERATED_PREVIEW_CARDS) expect(card.sourceId).toBe(PREVIEW_CARDS_SOURCE_ID);
  });

  it('the committed file is what the script produces today', () => {
    const before = readFileSync('lib/core/previewCards.generated.ts', 'utf8');
    execFileSync('node', ['scripts/build-preview-cards.mjs'], { encoding: 'utf8' });
    expect(readFileSync('lib/core/previewCards.generated.ts', 'utf8')).toBe(before);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run scripts/build-preview-cards.test.ts`
Expected: FAIL — `Failed to resolve import "../lib/core/previewCards.generated"`.

- [ ] **Step 3: Implement `scripts/build-preview-cards.mjs`**

Copy the `registerHooks` preamble **verbatim** from `scripts/build-ingest-sql.mjs:29-45` (including `withTsFormat`), then:

```js
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBatchFile } from '../lib/core/batchRecord.ts';
import { selectPreviewCards } from '../lib/core/previewSelection.ts';

const SOURCE_ID = 'generated:ngsl-headwords';
const COUNT = 6;
const OPTION_COUNT = 4;
const OUT = 'lib/core/previewCards.generated.ts';

const dir = 'data/generated';
const files = readdirSync(dir).filter((f) => /^batch-\d{4}-\d{2}-\d{2}\.jsonl$/.test(f)).sort();
const records = files.flatMap((f) => parseBatchFile(readFileSync(join(dir, f), 'utf8')));
const cards = selectPreviewCards(records, { count: COUNT, optionCount: OPTION_COUNT, sourceId: SOURCE_ID });

const body = cards
  .map(
    (c) =>
      `  {\n    headword: ${JSON.stringify(c.headword)},\n    pos: ${JSON.stringify(c.pos)},\n` +
      `    options: [${c.options.map((o) => JSON.stringify(o)).join(', ')}],\n` +
      `    correctIndex: ${c.correctIndex},\n    sourceId: PREVIEW_CARDS_SOURCE_ID,\n  },`,
  )
  .join('\n');

writeFileSync(
  OUT,
  `/**\n * GENERATED FILE — do not edit by hand.\n *\n * Written by scripts/build-preview-cards.mjs from ${files.length} batch files\n` +
    ` * (${records.length} senses). Regenerate with \`npm run build:preview\`;\n` +
    ` * scripts/build-preview-cards.test.ts fails if this file drifts from the script.\n */\n` +
    `import type { PreviewCard } from './landing';\n\n` +
    `export const PREVIEW_CARDS_SOURCE_ID = ${JSON.stringify(SOURCE_ID)};\n\n` +
    `export const GENERATED_PREVIEW_CARDS: readonly PreviewCard[] = [\n${body}\n];\n`,
  'utf8',
);

console.log(`${records.length} senses from ${files.length} files → ${cards.length} preview cards`);
```

- [ ] **Step 4: Run the script and read its output**

Run: `node scripts/build-preview-cards.mjs`
Expected: `534 senses from 9 files → 6 preview cards`, and `lib/core/previewCards.generated.ts` now exists.
**Read the six cards out loud before continuing.** If any option is a plausible second correct answer for its headword, stop and open a finding — do not edit the generated file.

- [ ] **Step 5: Add the npm script**

In `package.json`, after `"build:levels"`, add: `"build:preview": "node scripts/build-preview-cards.mjs",`

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npx vitest run scripts/build-preview-cards.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 7: Mutation check**

| # | mutation | test that must fail |
|---|---|---|
| 1 | in the generated file, change one Hebrew option to `"apple"` | *emits only Hebrew options* **and** *the committed file is what the script produces today* |
| 2 | in the generated file, delete one card | *emits six cards* **and** *the committed file…* |
| 3 | in the script, `SOURCE_ID` → `'ngsl'` and regenerate | *names its provenance* |
| 4 | in the script, `COUNT` → `4` and regenerate | *emits six cards* |

Revert all four.

- [ ] **Step 8: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test
git add scripts/build-preview-cards.mjs scripts/build-preview-cards.test.ts lib/core/previewCards.generated.ts package.json
git commit -m "loop(DEV): C-XXXX generate preview cards from the content bank (T-034, task 2)"
```

---

### Task 3: Wire it to the screen

**Files:**
- Modify: `lib/core/landing.ts:52-70` (the `sourceId` doc comment, the `TODO:CONTENT-PLACEHOLDER` block, `PREVIEW_CARDS`)
- Modify: `app/page.tsx:20-23` and `:74-78` (comments only)
- Test: `lib/core/landing.test.ts` (extend)

**Interfaces:**
- Consumes: `GENERATED_PREVIEW_CARDS`, `PREVIEW_CARDS_SOURCE_ID` (Task 2).
- Produces: `PREVIEW_CARDS` non-empty; `hasPreviewContent()` returns `true`; `landingPreviewCard()` returns a card.

- [ ] **Step 1: Write the failing test**

Append to `lib/core/landing.test.ts`:

```ts
describe('preview content has landed (F-012)', () => {
  it('has preview content', () => {
    expect(hasPreviewContent()).toBe(true);
  });

  it('returns a card from the landing helper', () => {
    expect(landingPreviewCard()).not.toBeNull();
  });

  it('every shipped card is attributed', () => {
    for (const card of PREVIEW_CARDS) expect(isAttributedCard(card)).toBe(true);
  });

  it('no card option sells the technology (R-011)', () => {
    for (const card of PREVIEW_CARDS) {
      expect(forbiddenTermsIn([card.headword, ...card.options].join(' '))).toEqual([]);
    }
  });

  it('the placeholder marker is gone from the source', async () => {
    const source = await import('node:fs').then((fs) => fs.readFileSync('lib/core/landing.ts', 'utf8'));
    expect(source).not.toContain('TODO:CONTENT-PLACEHOLDER');
  });

  it('the landing page no longer calls the slot empty', async () => {
    const source = await import('node:fs').then((fs) => fs.readFileSync('app/page.tsx', 'utf8'));
    expect(source).not.toContain('TODO:CONTENT-PLACEHOLDER');
    expect(source).not.toContain('the array is empty on purpose');
  });
});
```

Add `PREVIEW_CARDS`, `isAttributedCard`, `forbiddenTermsIn`, `hasPreviewContent`, `landingPreviewCard` to the file's existing import from `./landing` if any are missing.

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/core/landing.test.ts`
Expected: FAIL — `expected false to be true` on *has preview content*.

- [ ] **Step 3: Rewrite the `PREVIEW_CARDS` block in `lib/core/landing.ts`**

Replace the `TODO:CONTENT-PLACEHOLDER` comment and the empty array with:

```ts
/**
 * The cards a learner can try before signing up (F-012 · T-034).
 *
 * Empty from T-027 until 2026-08-16, for the reason the deleted comment gave:
 * no licensed Hebrew existed. That stopped being true on 2026-08-07, when the
 * Content agent began writing senses into data/generated/*.jsonl; by the time
 * this landed the bank held 534 gate-verified senses across 9 batches and the
 * gate re-check rejected none of them (docs/gate-recheck.md).
 *
 * ⛔ The rows are GENERATED, not authored here — see previewCards.generated.ts
 *    and scripts/build-preview-cards.mjs. Editing this array by hand puts
 *    unverified content in front of a learner.
 */
export const PREVIEW_CARDS: readonly PreviewCard[] = GENERATED_PREVIEW_CARDS;
```

and add at the top of the file: `import { GENERATED_PREVIEW_CARDS } from './previewCards.generated';`

- [ ] **Step 4: Correct the `sourceId` doc comment (consequence ⓓ)**

Replace `lib/core/landing.ts:52-55` with:

```ts
  /**
   * Where this row came from, in the form `dataset` or `generated:<headword
   * source>`. The Hebrew in the content bank was written for this project and
   * the headword list was read from NGSL v1.2 (CC BY-SA 4.0, column 1 only) —
   * data/generated/manifest.json records both halves, and calling that 'ngsl'
   * would credit NGSL with a gloss it never contained.
   * ⛔ Never a copied exam item (R-010), never an AnkiWeb deck (R-013).
   */
```

- [ ] **Step 5: Update the two comments in `app/page.tsx`**

At `:20-23`, replace the "only half addressed" paragraph with:

```
 * F-012 (no way to see the product before handing over an email): the slot for
 * a real flashcard exists and, since 2026-08-16, holds gate-verified rows from
 * the content bank — see lib/core/previewCards.generated.ts. The `preview ?`
 * guard stays: it is what keeps this screen renderable if the bank is ever
 * emptied.
```

At `:74-78`, replace the `TODO:CONTENT-PLACEHOLDER` block with:

```
      {/* The taste-before-signup card (T-027 ⓑ/ⓒ · T-034). Content is generated
          — lib/core/previewCards.generated.ts — never hand-written here. */}
```

⛔ Change nothing else in this file. No className, no element, no string a learner reads.

- [ ] **Step 6: Run the tests and confirm they pass**

Run: `npx vitest run lib/core/landing.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 7: Mutation check**

| # | mutation | test that must fail |
|---|---|---|
| 1 | `PREVIEW_CARDS = []` | *has preview content* |
| 2 | put back the string `TODO:CONTENT-PLACEHOLDER` in `landing.ts` | *the placeholder marker is gone from the source* |
| 3 | in the generated file, blank one card's `sourceId` (`sourceId: ''`) | *every shipped card is attributed* |
| 4 | in the generated file, set one `headword` to `"AI"` | *no card option sells the technology* |

Revert all four, then regenerate: `npm run build:preview`.

- [ ] **Step 8: Full verification and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
npm run check:mobile
```

All four must pass, and `check:mobile` must report **no horizontal scroll at 375px** — the card block now renders where it previously did not, and it is the one geometry claim this plan cannot make from source alone.

Then update `plan/50-tasks.md` (T-034 → 🟣), `plan/60-findings.md` (F-012 → 🟣 for the Critic, F-060 → resolved), `plan/20-alerts.md` (P-001 → resolved, with the measured numbers), `plan/30-architecture.md` (the generated-file pattern) and `plan/00-control.md`, then:

```bash
git add -A
git commit -m "loop(DEV): C-XXXX preview cards reach the landing screen (T-034, task 3)"
git push origin dev
```

---

## Self-review

**Spec coverage.** F-012 asks for "5–10 real cards before signup **and** account only to save progress". This plan delivers the first half — the cards. **The second half (local progress kept until signup) is not in this plan and has no task**: `app/page.tsx` renders the card as static markup with no grading handler, and adding one is an interaction decision that belongs to the PM, not to me. ⚠️ **Recorded as a gap in F-060 so it does not silently pass as done** — the Critic must not close F-012 on Task 3 alone.

**Placeholder scan.** No `TBD`, no "add error handling", no "similar to Task N". Every test block is literal code; every mutation names the test it must break.

**Type consistency.** `selectPreviewCards(records, opts)` is called with the same three-field `opts` in Task 1's tests, Task 2's script and nowhere else. `PreviewCard` is imported from `./landing` in all three files and its five fields are never widened. `GENERATED_PREVIEW_CARDS` and `PREVIEW_CARDS_SOURCE_ID` are produced in Task 2 and consumed in Task 3 under exactly those names.

**One risk left standing.** The sync ratchet in Task 2 (`the committed file is what the script produces today`) will fail on the next Content-agent tick, because a new batch changes the input. **That is intended** — it is the alarm that says the preview cards are stale — and the fix is one command, `npm run build:preview`, plus a re-read of the six cards. A Content tick that pushes a batch without regenerating will turn the suite red on the following Dev tick, not in production.
