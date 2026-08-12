# Sense-Selection Accuracy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the number that closes R-006 — the measured accuracy of the § 1.7.1 sense-selection rule against Hebrew Wordnet as a known answer, broken down by monosemous / polysemous / multi-POS and by CEFR band, with a release gate at ≥ 90% and the M4 baseline of 65.2 F1 printed next to it.

**Loop tasks covered:** **T-018** (the measurement — Tasks 1, 3, 4, 5 below) and the pure half of **T-010** (CEFR level labels — Task 2; the `words`-table write stays in T-010 and is out of scope here). T-010's data is not an optional extra: § 1.7.1's required output includes *"בפילוח לפי רמת CEFR"*, and that breakdown cannot exist without the level map.

**Architecture:** Four pure modules in `lib/core/` and one impure runner in `scripts/`, exactly the split that `2026-08-07-coverage-measurement.md` established and `npm run check:core` enforces. `senseInventory.ts` holds the English sense inventory and the (lemma, POS) key from rule 1. `cefrLevels.ts` parses the two CEFR CSVs that are already in `data/`. `senseGold.ts` turns the Hebrew Wordnet TSV into the known answer, reusing `classifyGloss()` from T-017 so that D-025 is applied in exactly one place. `senseSelection.ts` implements rules 2–4 and 7 against **injected** inventories, so it is fully testable before any new file lands. `scripts/measure-sense-accuracy.mjs` is the only layer that touches the filesystem.

**Tech Stack:** TypeScript (strict, no `any`), Vitest, Node ESM ≥ 22.18 for the runner (type stripping + the `registerHooks` resolve shim already in `scripts/measure-coverage.mjs`). **No new runtime dependencies.**

## Global Constraints

- `lib/core/` stays pure: no `react`, no `window`/`document`/`localStorage`/`sessionStorage`, no `fetch`, no `process.env`. Enforced by `npm run check:core`. **All file I/O lives in `scripts/`.**
- ⛔ **No agent may download any data file.** TD-17: every external data domain returns `403 host_not_allowed`. ⛔ No mirrors, ⛔ no archives (R-004). Files arrive through the repo (T-043).
- ⛔ **Never invent a translation, a sense, or a POS tag.** A row whose POS is unrecognised is recorded with `pos: null` and counted — it is never guessed into a category.
- ⛔ **A missing file reports `unavailable`, never `0%`.** Those mean opposite things; the coverage runner already holds this line and this one must too.
- **D-025 is the filter policy, and it lives only in `classifyGloss()`:** `GAP` is not loaded · a leading `!` **is** loaded with `confidence='low'` · niqqud is **not** grounds for filtering (it is stripped for the match field and kept for display). No task here re-implements that logic.
- **D-024 outranks digest § 1.7.1 rule 5:** a `low` item **is** shown to the learner as a marked card; it is excluded from **scored** items only. This plan therefore reports `needsHumanReview` + `scorable`, and never a boolean called "displayable".
- **Release gate (digest § 4):** ≥ **90%** accuracy on the core. **Baseline for comparison: 65.2 F1 (M4).** Both numbers are printed in the report; neither is hard-coded anywhere except `lib/core/senseAccuracy.ts`.
- Verification before any completion claim: `npm run typecheck && npm run check:core && npm test && npm run build`.
- Commit messages carry no `[skip ci]` (RULES § 0.7). Push to `dev` only. ⛔ Never `main`.

---

## What is measurable today, and what is not — measured, not assumed

Run in this repo on 2026-08-12 (`awk -F'\t' '{print NF}' | sort | uniq -c`, `cut`, `grep -c`):

| fact | measured value |
|---|---|
| `data/h1-hebrew-wordnet.tsv` lines | **17,564**, and **every one of them has exactly 2 columns** |
| distinct English strings in H1 | **10,611** |
| English strings carrying more than one Hebrew gloss | **3,920** |
| lines whose Hebrew side starts with `!` | **3,301** |
| lines whose Hebrew side is a `GAP` record | **702** |
| `data/cefrj-vocabulary-profile-1.5.csv` | **7,799** rows + header, columns `headword,pos,CEFR,…`, bands A1–B2 — ⚠️ **corrected during Task 2 (C-0051); the plan said 7,798.** The file's last line (`zoom,noun,B2,,,`) carries **no trailing newline**, so `wc -l` reports 7,799 total and a header-subtraction undercounts the data rows by one. The parser counts 7,799, and the four band counters sum to exactly that: A1 1,164 · A2 1,411 · B1 2,446 · B2 2,778. |
| `data/octanove-vocabulary-profile-c1c2-1.0.csv` | 2,136 rows + header, same first three columns, bands C1–C2 |
| Node in the loop environment | v22.22.2 |

**The consequence, stated plainly: the H1 file in the repo has no synset IDs and no POS column.** Digest § 1.7.1 rule 3 asks for a *synset ↔ synset* mapping over 5,448 synsets; a 2-column `english<TAB>hebrew` export cannot express one. Rule 4 additionally needs an English sense inventory — sense numbers and `tag_cnt`/`tagsense_cnt` — and **no such file exists in `data/` at all**.

So the honest scope is:

- **Buildable and provable today, against fixtures:** every module in this plan, all of the arithmetic, the CEFR breakdown, and the gold-set construction (which runs over the real 17,564-line file and yields a real gold-set size).
- **Not computable today:** the accuracy percentage itself, because rule 4 has no second signal and rule 3 has no synset keys. The runner prints `unavailable` for it, names the two missing files, and exits 0. **It does not print a number it cannot justify.**
- **Unblocks it:** two files added to `data/` by Roy — recorded in `plan/03-for-roy.md` in this same tick, with the exact filenames and column layouts from Task 5.

This is the same shape as the coverage plan: build against fixtures now, and the real number appears the day the file lands, with no rewrite.

---

## Known conflict this plan deliberately does not fix

`lib/core/lexicon.ts:110` — `displayableGloss()` returns `null` when `confidence === 'low'`, citing D-013. **D-024 (and D-025, signed by Roy at 23:38Z on 2026-08-11) reversed that:** a `low` gloss *is* shown, as a marked card, and is excluded from scored items only. The same contradiction exists in SQL at `supabase/migrations/0002_content_bank.sql:154-175`, where the RLS policy filters `translation_confidence <> 'low'` — already flagged by the Content agent in C-0042/C-0043 and parked on T-042/T-045.

**No task here touches either.** Both belong to T-045 (`needs_human_review` + the RLS policy + the visual marking), and changing the display rule from inside a measurement plan would be a scope leak. This plan routes around it by never calling `displayableGloss()`: the gold set consumes `classifyGloss()` directly, which reports facts and decides nothing.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/core/senseInventory.ts` | **Create.** The (lemma, POS) key of rule 1, the sense record shape, and the monosemous / polysemous / multi-POS classification. Pure. |
| `lib/core/senseInventory.test.ts` | **Create.** |
| `lib/core/cefrLevels.ts` | **Create.** CSV → `(lemma, POS) → CEFR band`. Quote-aware splitter, POS aliases, lowest-band-wins conflict rule. Pure. T-010 (pure half). |
| `lib/core/cefrLevels.test.ts` | **Create.** |
| `lib/core/senseGold.ts` | **Create.** Hebrew Wordnet TSV → the known answer, filtered through `classifyGloss()`. Pure. |
| `lib/core/senseGold.test.ts` | **Create.** |
| `lib/core/senseSelection.ts` | **Create.** Rules 2, 3, 4, 7 of § 1.7.1. Takes every input by injection. Pure. |
| `lib/core/senseSelection.test.ts` | **Create.** |
| `lib/core/senseAccuracy.ts` | **Create.** Accuracy arithmetic + the three breakdowns + markdown rendering. Pure. |
| `lib/core/senseAccuracy.test.ts` | **Create.** |
| `scripts/measure-sense-accuracy.mjs` | **Create.** The only impure layer: reads `data/`, writes `docs/sense-accuracy-report.md`. |
| `scripts/measure-sense-accuracy.test.ts` | **Create.** Guards the wiring, in the style of `scripts/measure-coverage.test.ts`. |
| `package.json` | **Modify.** Add `"measure:sense": "node scripts/measure-sense-accuracy.mjs"`. |
| `data/README.md` | **Modify.** Two new rows: the sense inventory and the synset-bearing H1 export. |
| `docs/api-contract.md` | **Not touched.** No endpoint changes in this plan. |

---

## Task 1: The sense inventory and the (lemma, POS) key

**Files:**
- Create: `lib/core/senseInventory.ts`
- Test: `lib/core/senseInventory.test.ts`

**Interfaces:**
- Consumes: `normalizeEnglish` from `lib/core/lexicon.ts`; `POS_VALUES`, `type Pos` from `lib/core/contentSchema.ts`.
- Produces:
  ```ts
  export interface SenseRecord {
    readonly lemma: string;      // raw; normalised on the way in
    readonly pos: Pos;
    readonly synsetId: string;   // e.g. '00001740-n'
    readonly senseNumber: number; // 1-based WordNet sense order
    readonly tagCount: number;    // cntlist tag_cnt; 0 when untagged
  }
  export interface SenseInventory {
    readonly bySense: ReadonlyMap<string, readonly SenseRecord[]>; // key = senseKey()
    readonly posByLemma: ReadonlyMap<string, ReadonlySet<Pos>>;
    readonly size: number;
  }
  export type Ambiguity = 'monosemous' | 'polysemous' | 'multi_pos';
  export function senseKey(lemma: string, pos: Pos): string;
  export function buildInventory(records: readonly SenseRecord[]): SenseInventory;
  export function sensesFor(inv: SenseInventory, lemma: string, pos: Pos): readonly SenseRecord[];
  export function classifyAmbiguity(inv: SenseInventory, lemma: string, pos: Pos): Ambiguity | null;
  ```

**Decisions locked here (do not re-litigate downstream):**
- `senseKey` is `` `${normalizeEnglish(lemma)}#${pos}` ``. Rule 1: *"המפתח הוא (lemma, POS) — לעולם לא headword של NGSL לבדו."*
- `classifyAmbiguity` precedence is **multi_pos first**: rule 5 names "מילה רב-POS" as its own risk category, so a lemma living under two POS is `multi_pos` even when each individual POS has one sense. Then `polysemous` when that (lemma, POS) has > 1 sense, else `monosemous`. Returns `null` when the lemma is absent from the inventory — the caller must not treat an unknown word as monosemous.
- Senses are stored sorted by `senseNumber` ascending, so `sensesFor(...)[0]` is WordNet sense #1 and Task 4 never re-sorts.

- [x] **Step 1: Write the failing tests**

```ts
// lib/core/senseInventory.test.ts
import { describe, expect, it } from 'vitest';
import {
  buildInventory, classifyAmbiguity, senseKey, sensesFor,
  type SenseRecord,
} from './senseInventory';

const rec = (
  lemma: string, pos: SenseRecord['pos'], synsetId: string,
  senseNumber: number, tagCount = 0,
): SenseRecord => ({ lemma, pos, synsetId, senseNumber, tagCount });

describe('senseKey', () => {
  it('normalises the lemma and keeps the POS distinct', () => {
    expect(senseKey('  Bank ', 'noun')).toBe('bank#noun');
    expect(senseKey('bank', 'verb')).not.toBe(senseKey('bank', 'noun'));
  });

  it('folds latin diacritics so that café and cafe are one key', () => {
    expect(senseKey('café', 'noun')).toBe(senseKey('cafe', 'noun'));
  });
});

describe('buildInventory', () => {
  it('sorts senses by sense number so index 0 is WordNet sense #1', () => {
    const inv = buildInventory([
      rec('bank', 'noun', '09213565-n', 2, 12),
      rec('bank', 'noun', '08420278-n', 1, 40),
    ]);
    expect(sensesFor(inv, 'bank', 'noun').map((s) => s.senseNumber)).toEqual([1, 2]);
    // Mapped, not indexed: `[0].synsetId` does not compile under
    // noUncheckedIndexedAccess, and the mapped form asserts the whole order.
    expect(sensesFor(inv, 'bank', 'noun').map((s) => s.synsetId))
      .toEqual(['08420278-n', '09213565-n']);
  });

  it('reports size as the number of distinct (lemma, POS) keys, not records', () => {
    const inv = buildInventory([
      rec('bank', 'noun', '08420278-n', 1),
      rec('bank', 'noun', '09213565-n', 2),
      rec('bank', 'verb', '02272549-v', 1),
    ]);
    expect(inv.size).toBe(2);
  });
});

describe('classifyAmbiguity', () => {
  it('is monosemous for one sense under one POS', () => {
    const inv = buildInventory([rec('kettle', 'noun', '03612814-n', 1, 3)]);
    expect(classifyAmbiguity(inv, 'kettle', 'noun')).toBe('monosemous');
  });

  it('is polysemous for two senses under the same POS', () => {
    const inv = buildInventory([
      rec('spring', 'noun', '15236475-n', 1, 9),
      rec('spring', 'noun', '09452760-n', 2, 4),
    ]);
    expect(classifyAmbiguity(inv, 'spring', 'noun')).toBe('polysemous');
  });

  it('is multi_pos even when each POS is individually monosemous', () => {
    const inv = buildInventory([
      rec('run', 'noun', '00558963-n', 1, 5),
      rec('run', 'verb', '01926311-v', 1, 60),
    ]);
    expect(classifyAmbiguity(inv, 'run', 'noun')).toBe('multi_pos');
    expect(classifyAmbiguity(inv, 'run', 'verb')).toBe('multi_pos');
  });

  it('returns null for a lemma the inventory has never seen', () => {
    const inv = buildInventory([rec('kettle', 'noun', '03612814-n', 1)]);
    expect(classifyAmbiguity(inv, 'zzzz', 'noun')).toBeNull();
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/core/senseInventory.test.ts`
Expected: FAIL — `Failed to resolve import "./senseInventory"`.

- [x] **Step 3: Write the implementation**

```ts
// lib/core/senseInventory.ts
/**
 * The English sense inventory and the (lemma, POS) key of digest § 1.7.1 rule 1.
 *
 * Pure. Nothing here reads a file: the inventory arrives as records so that the
 * rule is testable before any WordNet export exists in data/ (T-043).
 */
import type { Pos } from './contentSchema';
import { normalizeEnglish } from './lexicon';

export interface SenseRecord {
  readonly lemma: string;
  readonly pos: Pos;
  readonly synsetId: string;
  readonly senseNumber: number;
  readonly tagCount: number;
}

export interface SenseInventory {
  readonly bySense: ReadonlyMap<string, readonly SenseRecord[]>;
  readonly posByLemma: ReadonlyMap<string, ReadonlySet<Pos>>;
  readonly size: number;
}

export type Ambiguity = 'monosemous' | 'polysemous' | 'multi_pos';

/** Rule 1: the key is (lemma, POS). Never the NGSL headword alone. */
export function senseKey(lemma: string, pos: Pos): string {
  return `${normalizeEnglish(lemma)}#${pos}`;
}

export function buildInventory(records: readonly SenseRecord[]): SenseInventory {
  const bySense = new Map<string, SenseRecord[]>();
  const posByLemma = new Map<string, Set<Pos>>();

  for (const r of records) {
    const key = senseKey(r.lemma, r.pos);
    const bucket = bySense.get(key);
    if (bucket) bucket.push(r);
    else bySense.set(key, [r]);

    const lemma = normalizeEnglish(r.lemma);
    const posSet = posByLemma.get(lemma);
    if (posSet) posSet.add(r.pos);
    else posByLemma.set(lemma, new Set([r.pos]));
  }

  // Sorted once, here, so that sensesFor()[0] is WordNet sense #1 everywhere.
  for (const bucket of bySense.values()) {
    bucket.sort((a, b) => a.senseNumber - b.senseNumber);
  }

  return { bySense, posByLemma, size: bySense.size };
}

export function sensesFor(
  inv: SenseInventory, lemma: string, pos: Pos,
): readonly SenseRecord[] {
  return inv.bySense.get(senseKey(lemma, pos)) ?? [];
}

/**
 * Precedence is deliberate: multi_pos outranks polysemous. Rule 5 names
 * "מילה רב-POS" as its own risk class, so a lemma under two POS is multi_pos
 * even when each POS holds exactly one sense.
 */
export function classifyAmbiguity(
  inv: SenseInventory, lemma: string, pos: Pos,
): Ambiguity | null {
  const senses = sensesFor(inv, lemma, pos);
  if (senses.length === 0) return null;
  const posSet = inv.posByLemma.get(normalizeEnglish(lemma));
  if (posSet && posSet.size > 1) return 'multi_pos';
  return senses.length > 1 ? 'polysemous' : 'monosemous';
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/core/senseInventory.test.ts`
Expected: PASS, 8 tests.

- [x] **Step 5: Prove the multi_pos precedence test measures something**

⚠️ **Executed C-0050, and the plan's prediction was wrong.** Swapping the two branches so the sense-count check runs first left all 8 tests green. Reason: in `multi_pos even when each POS is individually monosemous` each POS holds exactly one sense, so `senses.length > 1` is false under *both* orderings and control reaches the POS check either way. That test proves multi-POS detection; it cannot prove the **precedence**.

A ninth test was added — `is multi_pos, not polysemous, when the lemma is both` (`bank` with two noun senses plus one verb sense), the only shape where the two orderings diverge. The same mutation now fails with `expected 'polysemous' to be 'multi_pos'`. Mutation B (reversing the sort comparator) fails `sorts senses by sense number…` with `expected [ 2, 1 ] to deeply equal [ 1, 2 ]`. Both restored to green.

- [x] **Step 6: Verify purity and commit**

```bash
npm run check:core && npx tsc --noEmit
git add lib/core/senseInventory.ts lib/core/senseInventory.test.ts
git commit -m "loop(DEV): sense inventory + (lemma,POS) key for 1.7.1 rule 1"
```

---

## Task 2: CEFR level labels (T-010, pure half)

**Files:**
- Create: `lib/core/cefrLevels.ts`
- Test: `lib/core/cefrLevels.test.ts`

**Interfaces:**
- Consumes: `normalizeEnglish` from `lib/core/lexicon.ts`; `POS_VALUES`, `type Pos` from `lib/core/contentSchema.ts`.
- Produces:
  ```ts
  export type CefrBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  export const BAND_ORDER: readonly CefrBand[];
  export const POS_ALIASES: Readonly<Record<string, Pos>>;
  export interface LevelEntry { readonly lemma: string; readonly pos: Pos | null; readonly band: CefrBand }
  export interface LevelParseResult {
    readonly entries: readonly LevelEntry[];
    readonly rows: number;
    readonly skipped: number;
    readonly unknownPos: number;
  }
  export interface LevelMap {
    readonly byLemmaPos: ReadonlyMap<string, CefrBand>;
    readonly byLemma: ReadonlyMap<string, CefrBand>;
  }
  export type LevelHit = { readonly band: CefrBand; readonly route: 'exact_pos' | 'lemma_only' } | null;
  export function splitCsvLine(line: string): string[];
  export function parseCefrCsv(text: string): LevelParseResult;
  export function buildLevelMap(entries: readonly LevelEntry[]): LevelMap;
  export function levelOf(map: LevelMap, lemma: string, pos: Pos): LevelHit;
  ```

**Decisions locked here, each forced by a row that is actually in the files:**
- **Quote-aware splitting is mandatory.** 699 rows of the CEFR-J file contain a quoted field with an embedded comma (`abuse,noun,B2,"News, lifestyles and current affairs",,`). A naive `split(',')` shifts nothing on columns 1–3 today, but it silently breaks the moment a headword or note moves column. Split properly once.
- **`/` in a headword means alternative spellings**, not one string: `a.m./A.M./am/AM` is four lookups. 167 CEFR-J rows carry a `/`. Each variant is registered with the same band.
- **Unknown POS is never guessed.** `POS_ALIASES` covers only the unambiguous grammatical spellings CEFR-J uses for verbs — `be-verb`, `do-verb`, `have-verb`, `modal auxiliary` → `verb`. Everything else outside `POS_VALUES` (`number`, `infinitive-to`, and Octanove's typo `vern` on `remonstrate`, and its empty POS on `batter`) is stored as `pos: null` and counted in `unknownPos`. Those rows are **kept**, reachable through the lemma-only route — dropping them would lose 62 CEFR-J rows and would have pushed the skip rate to 0.79%, above `MAX_SKIP_RATE` (0.5%).
- **Band conflict → the lowest band wins.** If a lemma is both A2 and B2, the learner meets it at A2; the earlier band is the honest label for "when does this word become relevant". `BAND_ORDER` is the single ordering.
- The header line (`headword,pos,CEFR,…`) is dropped by checking that column 3 parses as a band, not by counting lines.

- [x] **Step 1: Write the failing tests**

```ts
// lib/core/cefrLevels.test.ts
import { describe, expect, it } from 'vitest';
import {
  buildLevelMap, levelOf, parseCefrCsv, splitCsvLine,
} from './cefrLevels';

describe('splitCsvLine', () => {
  it('keeps a comma that lives inside quotes in one field', () => {
    expect(splitCsvLine('abuse,noun,B2,"News, lifestyles and current affairs",,'))
      .toEqual(['abuse', 'noun', 'B2', 'News, lifestyles and current affairs', '', '']);
  });

  it('handles a doubled quote as one literal quote', () => {
    expect(splitCsvLine('cast,noun,C1,"a ""plaster"" cast"'))
      .toEqual(['cast', 'noun', 'C1', 'a "plaster" cast']);
  });
});

describe('parseCefrCsv', () => {
  it('drops the header row without counting it as a skip', () => {
    const r = parseCefrCsv('headword,pos,CEFR,notes\ncloak,noun,C1,\n');
    expect(r.rows).toBe(1);
    expect(r.skipped).toBe(0);
    expect(r.entries).toEqual([{ lemma: 'cloak', pos: 'noun', band: 'C1' }]);
  });

  it('expands a slash headword into one entry per spelling', () => {
    const r = parseCefrCsv('a.m./A.M./am/AM,adverb,A1,,,\n');
    expect(r.entries.map((e) => e.lemma)).toEqual(['a.m.', 'a.m.', 'am', 'am']);
    expect(r.entries).toHaveLength(4);
  });

  it('maps be-verb, do-verb, have-verb and modal auxiliary to verb', () => {
    const r = parseCefrCsv(
      'be,be-verb,A1,\ndo,do-verb,A1,\nhave,have-verb,A1,\ncan,modal auxiliary,A1,\n',
    );
    expect(r.entries.map((e) => e.pos)).toEqual(['verb', 'verb', 'verb', 'verb']);
    expect(r.unknownPos).toBe(0);
  });

  it('keeps an unrecognised POS as null instead of guessing it', () => {
    // Real rows: Octanove ships "remonstrate,vern,C2" and "batter,,C1".
    const r = parseCefrCsv('remonstrate,vern,C2,\nbatter,,C1,one who bats\n');
    expect(r.entries.map((e) => e.pos)).toEqual([null, null]);
    expect(r.unknownPos).toBe(2);
    expect(r.skipped).toBe(0);
  });

  it('skips a row whose band is not a CEFR band and counts it', () => {
    const r = parseCefrCsv('cloak,noun,C1,\nbroken,noun,Z9,\n');
    expect(r.entries).toHaveLength(1);
    expect(r.skipped).toBe(1);
  });
});

describe('levelOf', () => {
  it('prefers the exact POS match and says so', () => {
    const map = buildLevelMap([
      { lemma: 'run', pos: 'noun', band: 'B1' },
      { lemma: 'run', pos: 'verb', band: 'A1' },
    ]);
    expect(levelOf(map, 'run', 'noun')).toEqual({ band: 'B1', route: 'exact_pos' });
  });

  it('falls back to the lemma when that POS is unlabelled, and says so', () => {
    const map = buildLevelMap([{ lemma: 'remonstrate', pos: null, band: 'C2' }]);
    expect(levelOf(map, 'remonstrate', 'verb')).toEqual({ band: 'C2', route: 'lemma_only' });
  });

  it('keeps the lowest band when one lemma carries two', () => {
    const map = buildLevelMap([
      { lemma: 'account', pos: 'noun', band: 'B2' },
      { lemma: 'account', pos: 'noun', band: 'A2' },
    ]);
    expect(levelOf(map, 'account', 'noun')).toEqual({ band: 'A2', route: 'exact_pos' });
  });

  it('returns null for a lemma with no label at all', () => {
    expect(levelOf(buildLevelMap([]), 'kettle', 'noun')).toBeNull();
  });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/core/cefrLevels.test.ts`
Expected: FAIL — `Failed to resolve import "./cefrLevels"`.

- [x] **Step 3: Write the implementation**

```ts
// lib/core/cefrLevels.ts
/**
 * CEFR level labels from the two profiles already in data/ (T-010, pure half).
 *
 * CEFR-J 1.5 covers Pre-A1..B2, Octanove 1.0 covers C1..C2, and both ship the
 * same first three columns: headword,pos,CEFR. Pure: the caller reads the file.
 *
 * ⛔ Nothing here guesses a POS. An unrecognised tag becomes null and stays
 * reachable through the lemma-only route — measured cost of dropping instead:
 * 62 CEFR-J rows, a 0.79% skip rate, above MAX_SKIP_RATE.
 */
import { POS_VALUES, type Pos } from './contentSchema';
import { normalizeEnglish } from './lexicon';

export type CefrBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const BAND_ORDER: readonly CefrBand[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const BANDS = new Set<string>(BAND_ORDER);
const POS_SET = new Set<string>(POS_VALUES);

/** Only unambiguous grammatical spellings. ⛔ Do not add a guess here. */
export const POS_ALIASES: Readonly<Record<string, Pos>> = Object.freeze({
  'be-verb': 'verb',
  'do-verb': 'verb',
  'have-verb': 'verb',
  'modal auxiliary': 'verb',
});

export interface LevelEntry {
  readonly lemma: string;
  readonly pos: Pos | null;
  readonly band: CefrBand;
}

export interface LevelParseResult {
  readonly entries: readonly LevelEntry[];
  readonly rows: number;
  readonly skipped: number;
  readonly unknownPos: number;
}

export interface LevelMap {
  readonly byLemmaPos: ReadonlyMap<string, CefrBand>;
  readonly byLemma: ReadonlyMap<string, CefrBand>;
}

export type LevelHit =
  | { readonly band: CefrBand; readonly route: 'exact_pos' | 'lemma_only' }
  | null;

/** RFC4180 enough for these files: quoted fields, embedded commas, "" escapes. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { out.push(field); field = ''; }
    else field += c;
  }
  out.push(field);
  return out;
}

function toPos(raw: string): Pos | null {
  const v = raw.trim().toLowerCase();
  if (POS_SET.has(v)) return v as Pos;
  return POS_ALIASES[v] ?? null;
}

export function parseCefrCsv(text: string): LevelParseResult {
  const entries: LevelEntry[] = [];
  let rows = 0;
  let skipped = 0;
  let unknownPos = 0;

  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const cols = splitCsvLine(line);
    const band = cols[2]?.trim().toUpperCase() ?? '';
    // The header is identified by its band column, not by line number: a file
    // that ships without one must not lose its first real row.
    if (cols[0]?.trim().toLowerCase() === 'headword' && !BANDS.has(band)) continue;
    rows += 1;
    if (!BANDS.has(band)) { skipped += 1; continue; }

    const pos = toPos(cols[1] ?? '');
    if (pos === null) unknownPos += 1;

    for (const variant of (cols[0] ?? '').split('/')) {
      const lemma = normalizeEnglish(variant);
      if (lemma === '') continue;
      entries.push({ lemma, pos, band: band as CefrBand });
    }
  }

  return { entries, rows, skipped, unknownPos };
}

function lower(a: CefrBand, b: CefrBand): CefrBand {
  return BAND_ORDER.indexOf(a) <= BAND_ORDER.indexOf(b) ? a : b;
}

export function buildLevelMap(entries: readonly LevelEntry[]): LevelMap {
  const byLemmaPos = new Map<string, CefrBand>();
  const byLemma = new Map<string, CefrBand>();
  for (const e of entries) {
    if (e.pos !== null) {
      const k = `${e.lemma}#${e.pos}`;
      const prev = byLemmaPos.get(k);
      byLemmaPos.set(k, prev ? lower(prev, e.band) : e.band);
    }
    const prevLemma = byLemma.get(e.lemma);
    byLemma.set(e.lemma, prevLemma ? lower(prevLemma, e.band) : e.band);
  }
  return { byLemmaPos, byLemma };
}

export function levelOf(map: LevelMap, lemma: string, pos: Pos): LevelHit {
  const key = normalizeEnglish(lemma);
  const exact = map.byLemmaPos.get(`${key}#${pos}`);
  if (exact) return { band: exact, route: 'exact_pos' };
  const loose = map.byLemma.get(key);
  if (loose) return { band: loose, route: 'lemma_only' };
  return null;
}
```

- [x] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/core/cefrLevels.test.ts`
Expected: PASS, 11 tests.

- [x] **Step 5: Run the parser over the two real files and record the counts**

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const { parseCefrCsv, buildLevelMap } = await import('./lib/core/cefrLevels.ts');
for (const f of ['data/cefrj-vocabulary-profile-1.5.csv','data/octanove-vocabulary-profile-c1c2-1.0.csv']) {
  const r = parseCefrCsv(readFileSync(f,'utf8'));
  console.log(f, 'rows', r.rows, 'entries', r.entries.length, 'skipped', r.skipped, 'unknownPos', r.unknownPos);
}"
```

Expected: `skipped` is **0** for both files, and `unknownPos` is small (CEFR-J: the `number` / `infinitive-to` rows; Octanove: 2). **If `skipped` is non-zero, stop — the parser is losing real rows, and that is a bug, not a data property.** Paste the real output into the commit message.

⚠️ **The command as written above does not run.** Two corrections, both measured in C-0051, and both of which Task 3/5 will hit again:
- Node cannot resolve `lib/core/`'s extensionless relative imports (`from './contentSchema'`), so the bare `--input-type=module -e` form dies with `ERR_MODULE_NOT_FOUND`. The `registerHooks` resolve shim from `scripts/measure-coverage.mjs` (lines 21–31) is **required**, not optional.
- That shim's `withTsFormat` must set `format: **'module-typescript'**`, not `'module'`. With `'module'` Node skips type stripping and the import dies with `SyntaxError: Unexpected identifier 'Pos'` on `import { POS_VALUES, type Pos }`.

**Real output (C-0051, Node v22.22.2):**

```
data/cefrj-vocabulary-profile-1.5.csv        | rows 7799 | entries 7974 | skipped 0 | unknownPos 31
data/octanove-vocabulary-profile-c1c2-1.0.csv | rows 2136 | entries 2182 | skipped 0 | unknownPos 2
merged: byLemmaPos 9948 | byLemma 8843
band histogram (byLemma): {"A1":1083,"A2":1272,"B1":2174,"B2":2489,"C1":929,"C2":896}
```

`skipped` is **0 on both files** — the parser loses nothing. `unknownPos` 31 = the 30 `number` rows + the single `infinitive-to` row; Octanove's 2 = `remonstrate,vern` and `batter,` (empty). All 33 stay reachable through the lemma-only route, which is the whole reason they are `null` rather than dropped.

- [x] **Step 6: Verify purity and commit**

```bash
npm run check:core && npx tsc --noEmit
git add lib/core/cefrLevels.ts lib/core/cefrLevels.test.ts
git commit -m "loop(DEV): T-010 pure half — CEFR band map from CEFR-J + Octanove"
```

---

## Task 3: The gold set from Hebrew Wordnet

**Files:**
- Create: `lib/core/senseGold.ts`
- Test: `lib/core/senseGold.test.ts`

**Interfaces:**
- Consumes: `asRawGloss`, `classifyGloss`, `normalizeEnglish`, `normalizeHebrew` from `lib/core/lexicon.ts`.
- Produces:
  ```ts
  export interface GoldEntry {
    readonly lemma: string;
    readonly accepted: ReadonlySet<string>; // normalised Hebrew, confidence 'high'
    readonly low: ReadonlySet<string>;      // normalised Hebrew, '!' records
  }
  export interface GoldSet {
    readonly byLemma: ReadonlyMap<string, GoldEntry>;
    readonly lines: number;
    readonly droppedGap: number;
    readonly droppedEmpty: number;
    readonly lowGlosses: number;
    readonly malformed: number;
  }
  export type GoldVerdict = 'hit' | 'hit_low' | 'miss' | 'no_gold';
  export function buildGoldSet(tsv: string): GoldSet;
  export function judge(gold: GoldSet, lemma: string, hebrew: string): GoldVerdict;
  ```

**Decisions locked here:**
- The Hebrew side goes through `classifyGloss()` and nothing else. That is where D-025 lives: `GAP` drops, `!` survives as `low`, niqqud is stripped for `match` and preserved in `display`. **⛔ Do not re-test D-025 semantics here** — `lexicon.test.ts` owns those 19 tests. Test only that this module *routes through* it.
- `judge()` distinguishes `miss` (the lemma has a gold answer and ours is not in it) from `no_gold` (the lemma is absent). **They must never be summed.** A `no_gold` lemma is outside the measurable set — counting it as a miss would understate accuracy by exactly the coverage gap, which is R-005's number, not R-006's.
- `hit_low` is a hit against a `!` record only. It is reported as a separate column, never folded into `hit` silently, because a `!` gold answer is itself flagged as uncertain by the source.
- A line without exactly two tab-separated columns increments `malformed` and is skipped. Measured today: **0 such lines out of 17,564** — so a non-zero count in a future export is a signal, not noise.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/core/senseGold.test.ts
import { describe, expect, it } from 'vitest';
import { buildGoldSet, judge } from './senseGold';

const TSV = [
  'entity\tיֵשׁוּת',
  'bank\tבַּנְק',
  'bank\tגָּדָה',
  'shore\t!חוֹף',
  'nothing\tGAP no lexical item',
  'blank\t',
  'broken line without a tab',
].join('\n');

describe('buildGoldSet', () => {
  it('collects every gloss a lemma has, not just the first', () => {
    const g = buildGoldSet(TSV);
    expect(g.byLemma.get('bank')?.accepted.size).toBe(2);
  });

  it('drops GAP records and counts them', () => {
    const g = buildGoldSet(TSV);
    expect(g.byLemma.has('nothing')).toBe(false);
    expect(g.droppedGap).toBe(1);
  });

  it('keeps a ! record as low rather than dropping it (D-025)', () => {
    const g = buildGoldSet(TSV);
    const shore = g.byLemma.get('shore');
    expect(shore?.accepted.size).toBe(0);
    expect(shore?.low.size).toBe(1);
    expect(g.lowGlosses).toBe(1);
  });

  it('drops an empty Hebrew side and counts it separately from GAP', () => {
    const g = buildGoldSet(TSV);
    expect(g.byLemma.has('blank')).toBe(false);
    expect(g.droppedEmpty).toBe(1);
  });

  it('counts a line without a tab as malformed instead of throwing', () => {
    expect(buildGoldSet(TSV).malformed).toBe(1);
  });
});

describe('judge', () => {
  it('matches regardless of niqqud on either side', () => {
    const g = buildGoldSet('bank\tבַּנְק');
    expect(judge(g, 'bank', 'בנק')).toBe('hit');
    expect(judge(g, 'BANK', 'בַּנְק')).toBe('hit');
  });

  it('reports a hit against a ! record as hit_low, not hit', () => {
    const g = buildGoldSet('shore\t!חוֹף');
    expect(judge(g, 'shore', 'חוף')).toBe('hit_low');
  });

  it('separates a wrong answer from an unmeasurable one', () => {
    const g = buildGoldSet('bank\tבַּנְק');
    expect(judge(g, 'bank', 'גדה')).toBe('miss');
    expect(judge(g, 'kettle', 'קומקום')).toBe('no_gold');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/core/senseGold.test.ts`
Expected: FAIL — `Failed to resolve import "./senseGold"`.

- [ ] **Step 3: Write the implementation**

```ts
// lib/core/senseGold.ts
/**
 * Hebrew Wordnet as the known answer for T-018.
 *
 * The Hebrew side is filtered by classifyGloss() and by nothing else: D-025
 * (GAP out · `!` in as low · niqqud is not a filter) lives in lexicon.ts, once.
 *
 * ⚠️ Scope note. The export in data/ is two columns, english<TAB>hebrew, with
 * no synset id and no POS — measured 2026-08-12: 17,564 lines, all 2 columns.
 * A gold answer here is therefore "the set of Hebrew glosses this English
 * string carries anywhere in the wordnet", which is a *lemma-level* answer, not
 * the synset-level one digest § 1.7.1 rule 3 describes. Task 5 records the
 * synset-bearing file this becomes exact with, and the report labels the number
 * `lemma-level` so no reader mistakes it for synset accuracy.
 */
import {
  asRawGloss, classifyGloss, normalizeEnglish, normalizeHebrew,
} from './lexicon';

export interface GoldEntry {
  readonly lemma: string;
  readonly accepted: ReadonlySet<string>;
  readonly low: ReadonlySet<string>;
}

export interface GoldSet {
  readonly byLemma: ReadonlyMap<string, GoldEntry>;
  readonly lines: number;
  readonly droppedGap: number;
  readonly droppedEmpty: number;
  readonly lowGlosses: number;
  readonly malformed: number;
}

export type GoldVerdict = 'hit' | 'hit_low' | 'miss' | 'no_gold';

export function buildGoldSet(tsv: string): GoldSet {
  const byLemma = new Map<string, { accepted: Set<string>; low: Set<string> }>();
  let lines = 0;
  let droppedGap = 0;
  let droppedEmpty = 0;
  let lowGlosses = 0;
  let malformed = 0;

  for (const raw of tsv.split(/\r?\n/)) {
    if (raw.trim() === '') continue;
    lines += 1;
    const cols = raw.split('\t');
    if (cols.length !== 2) { malformed += 1; continue; }

    const lemma = normalizeEnglish(cols[0]);
    if (lemma === '') { malformed += 1; continue; }

    const verdict = classifyGloss(asRawGloss(cols[1]));
    if (verdict.kind === 'drop') {
      if (verdict.reason === 'gap_record') droppedGap += 1;
      else droppedEmpty += 1;
      continue;
    }

    let entry = byLemma.get(lemma);
    if (!entry) { entry = { accepted: new Set(), low: new Set() }; byLemma.set(lemma, entry); }
    if (verdict.confidence === 'low') { entry.low.add(verdict.match); lowGlosses += 1; }
    else entry.accepted.add(verdict.match);
  }

  const out = new Map<string, GoldEntry>();
  for (const [lemma, e] of byLemma) {
    out.set(lemma, { lemma, accepted: e.accepted, low: e.low });
  }
  return { byLemma: out, lines, droppedGap, droppedEmpty, lowGlosses, malformed };
}

/**
 * `miss` and `no_gold` are different facts and must never be summed: a lemma
 * with no gold answer is outside the measurable set, and folding it into the
 * denominator would silently charge R-005's coverage gap to R-006's accuracy.
 */
export function judge(gold: GoldSet, lemma: string, hebrew: string): GoldVerdict {
  const entry = gold.byLemma.get(normalizeEnglish(lemma));
  if (!entry) return 'no_gold';
  const candidate = normalizeHebrew(hebrew);
  if (entry.accepted.has(candidate)) return 'hit';
  if (entry.low.has(candidate)) return 'hit_low';
  return 'miss';
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/core/senseGold.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Run it over the real 17,564-line file**

```bash
node --input-type=module -e "
import { readFileSync } from 'node:fs';
const { buildGoldSet } = await import('./lib/core/senseGold.ts');
const g = buildGoldSet(readFileSync('data/h1-hebrew-wordnet.tsv','utf8'));
console.log({ lines: g.lines, lemmas: g.byLemma.size, gap: g.droppedGap, empty: g.droppedEmpty, low: g.lowGlosses, malformed: g.malformed });"
```

Expected, from the counts measured on 2026-08-12: `lines` 17564 · `gap` 702 · `low` 3301 · `malformed` 0. `lemmas` will be **below** the 10,611 distinct English strings, because `GAP`-only lemmas disappear. **If `malformed` is not 0, the splitter is wrong — every line in that file has exactly two columns.** Paste the real output into the commit message.

- [ ] **Step 6: Verify purity and commit**

```bash
npm run check:core && npx tsc --noEmit
git add lib/core/senseGold.ts lib/core/senseGold.test.ts
git commit -m "loop(DEV): T-018 gold set from Hebrew Wordnet, D-025 applied via classifyGloss"
```

---

## Task 4: The selection rule — § 1.7.1 rules 2, 3, 4, 7

**Files:**
- Create: `lib/core/senseSelection.ts`
- Test: `lib/core/senseSelection.test.ts`

**Interfaces:**
- Consumes: `SenseInventory`, `SenseRecord`, `sensesFor`, `classifyAmbiguity` from `lib/core/senseInventory.ts`; `type Pos` from `lib/core/contentSchema.ts`.
- Produces:
  ```ts
  export type SelectionRoute =
    | 'fast_single' | 'h1_synset' | 'two_signal_agree' | 'two_signal_disagree' | 'no_candidate';
  export type SelectionConfidence = 'high' | 'medium' | 'low';
  export interface SecondSignal {
    /** Salience rank for a synset; lower is more salient. null = no opinion. */
    rank(lemma: string, pos: Pos, synsetId: string): number | null;
  }
  export interface H1SynsetIndex { hebrewFor(synsetId: string): string | null }
  export interface Selection {
    readonly synsetId: string | null;
    readonly confidence: SelectionConfidence;
    readonly route: SelectionRoute;
    readonly needsHumanReview: boolean;
    readonly scorable: boolean;
  }
  export function selectSense(
    inv: SenseInventory, lemma: string, pos: Pos,
    h1: H1SynsetIndex | null, second: SecondSignal,
  ): Selection;
  ```

**Rules implemented, in the order § 1.7.1 states them:**
1. Rule 2 — single synset for (lemma, POS) → `route: 'fast_single'`, `confidence: 'high'`.
2. Rule 3 — H1 covers one of the candidate synsets → `route: 'h1_synset'`, `confidence: 'high'`. When more than one candidate is covered, take the lowest `senseNumber` among them (rule 7: the *core* meaning, not the first in a list and not the shortest).
3. Rule 4 — two independent signals: WordNet sense #1, and the second signal's best-ranked synset. Agree → `'two_signal_agree'`, `confidence: 'medium'`. Disagree → `'two_signal_disagree'`, `confidence: 'low'`, and the returned synset is **sense #1** (WordNet is the tie-break; the disagreement is recorded, not resolved).
4. Rule 5 as corrected by D-024 — `needsHumanReview` is true when `confidence === 'low'`, or `tagCount === 0` on the chosen sense, or the ambiguity class is `multi_pos`. `scorable` is `confidence !== 'low'`: a `low` item is shown as a marked card but never used as a scored item.
5. An unknown (lemma, POS) → `route: 'no_candidate'`, `synsetId: null`, `confidence: 'low'`, `scorable: false`. ⛔ It never falls back to another POS.

- [ ] **Step 1: Write the failing tests**

```ts
// lib/core/senseSelection.test.ts
import { describe, expect, it } from 'vitest';
import { buildInventory, type SenseRecord } from './senseInventory';
import { selectSense, type H1SynsetIndex, type SecondSignal } from './senseSelection';

const rec = (
  lemma: string, pos: SenseRecord['pos'], synsetId: string,
  senseNumber: number, tagCount = 5,
): SenseRecord => ({ lemma, pos, synsetId, senseNumber, tagCount });

const NO_OPINION: SecondSignal = { rank: () => null };
const prefers = (synsetId: string): SecondSignal => ({
  rank: (_l, _p, id) => (id === synsetId ? 0 : 1),
});
const h1With = (ids: readonly string[]): H1SynsetIndex => ({
  hebrewFor: (id) => (ids.includes(id) ? 'גדה' : null),
});

describe('selectSense', () => {
  it('takes the fast path when the (lemma,POS) has one sense', () => {
    const inv = buildInventory([rec('kettle', 'noun', '03612814-n', 1)]);
    const s = selectSense(inv, 'kettle', 'noun', null, NO_OPINION);
    expect(s).toMatchObject({
      synsetId: '03612814-n', confidence: 'high', route: 'fast_single', scorable: true,
    });
  });

  it('uses the H1 synset when it covers a candidate', () => {
    const inv = buildInventory([
      rec('bank', 'noun', '08420278-n', 1),
      rec('bank', 'noun', '09213565-n', 2),
    ]);
    const s = selectSense(inv, 'bank', 'noun', h1With(['09213565-n']), NO_OPINION);
    expect(s).toMatchObject({ synsetId: '09213565-n', confidence: 'high', route: 'h1_synset' });
  });

  it('prefers the lower sense number when H1 covers two candidates (rule 7)', () => {
    const inv = buildInventory([
      rec('bank', 'noun', '08420278-n', 1),
      rec('bank', 'noun', '09213565-n', 2),
    ]);
    const s = selectSense(inv, 'bank', 'noun', h1With(['08420278-n', '09213565-n']), NO_OPINION);
    expect(s.synsetId).toBe('08420278-n');
  });

  it('is medium when WordNet sense #1 and the second signal agree', () => {
    const inv = buildInventory([
      rec('spring', 'noun', '15236475-n', 1),
      rec('spring', 'noun', '09452760-n', 2),
    ]);
    const s = selectSense(inv, 'spring', 'noun', null, prefers('15236475-n'));
    expect(s).toMatchObject({
      synsetId: '15236475-n', confidence: 'medium', route: 'two_signal_agree', scorable: true,
    });
  });

  it('is low and keeps sense #1 when the signals disagree', () => {
    const inv = buildInventory([
      rec('spring', 'noun', '15236475-n', 1),
      rec('spring', 'noun', '09452760-n', 2),
    ]);
    const s = selectSense(inv, 'spring', 'noun', null, prefers('09452760-n'));
    expect(s).toMatchObject({
      synsetId: '15236475-n', confidence: 'low', route: 'two_signal_disagree',
      needsHumanReview: true, scorable: false,
    });
  });

  it('flags an untagged sense for review even on the fast path', () => {
    const inv = buildInventory([rec('kettle', 'noun', '03612814-n', 1, 0)]);
    const s = selectSense(inv, 'kettle', 'noun', null, NO_OPINION);
    expect(s).toMatchObject({ confidence: 'high', needsHumanReview: true, scorable: true });
  });

  it('flags a multi-POS lemma for review', () => {
    const inv = buildInventory([
      rec('run', 'noun', '00558963-n', 1),
      rec('run', 'verb', '01926311-v', 1),
    ]);
    expect(selectSense(inv, 'run', 'noun', null, NO_OPINION).needsHumanReview).toBe(true);
  });

  it('never falls back to another POS for an unknown key', () => {
    const inv = buildInventory([rec('run', 'verb', '01926311-v', 1)]);
    const s = selectSense(inv, 'run', 'noun', null, NO_OPINION);
    expect(s).toMatchObject({ synsetId: null, route: 'no_candidate', scorable: false });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/core/senseSelection.test.ts`
Expected: FAIL — `Failed to resolve import "./senseSelection"`.

- [ ] **Step 3: Write the implementation**

⚠️ **Measured C-0050 while executing Task 1: `tsconfig.json` sets `noUncheckedIndexedAccess: true`.** The snippet below indexes three times — `senses[0]` (twice) and `covered[0]` — and each yields `SenseRecord | undefined`, which `finish(chosen: SenseRecord | null, …)` rejects. `npm run typecheck` caught exactly this shape in Task 1's test. Widen `finish` to accept `SenseRecord | undefined` (and keep `?? null` on the way out), or narrow with an explicit guard. ⛔ Do not reach for `!` — a non-null assertion is the one fix that removes the check without answering it.

```ts
// lib/core/senseSelection.ts
/**
 * Digest § 1.7.1, rules 2/3/4/7 — the ingestion rule, verbatim in behaviour.
 *
 * ⛔ Deviating from § 1.7.1 is fabricated teaching content. Every branch below
 * cites its rule number. Everything is injected, so the rule is provable before
 * the WordNet export lands (T-043).
 */
import type { Pos } from './contentSchema';
import {
  classifyAmbiguity, sensesFor, type SenseInventory, type SenseRecord,
} from './senseInventory';

export type SelectionRoute =
  | 'fast_single' | 'h1_synset' | 'two_signal_agree' | 'two_signal_disagree' | 'no_candidate';

export type SelectionConfidence = 'high' | 'medium' | 'low';

export interface SecondSignal {
  rank(lemma: string, pos: Pos, synsetId: string): number | null;
}

export interface H1SynsetIndex {
  hebrewFor(synsetId: string): string | null;
}

export interface Selection {
  readonly synsetId: string | null;
  readonly confidence: SelectionConfidence;
  readonly route: SelectionRoute;
  readonly needsHumanReview: boolean;
  readonly scorable: boolean;
}

function finish(
  chosen: SenseRecord | null, confidence: SelectionConfidence,
  route: SelectionRoute, multiPos: boolean,
): Selection {
  // D-024 outranks rule 5's original wording: a `low` item IS shown, marked.
  // What it is excluded from is scoring.
  const needsHumanReview =
    confidence === 'low' || chosen === null || chosen.tagCount === 0 || multiPos;
  return {
    synsetId: chosen?.synsetId ?? null,
    confidence,
    route,
    needsHumanReview,
    scorable: confidence !== 'low' && chosen !== null,
  };
}

export function selectSense(
  inv: SenseInventory, lemma: string, pos: Pos,
  h1: H1SynsetIndex | null, second: SecondSignal,
): Selection {
  const senses = sensesFor(inv, lemma, pos);
  const multiPos = classifyAmbiguity(inv, lemma, pos) === 'multi_pos';

  // ⛔ No cross-POS fallback: rule 1 makes POS part of the key.
  if (senses.length === 0) return finish(null, 'low', 'no_candidate', multiPos);

  // Rule 2 — one synset for this key: full automation, high confidence.
  if (senses.length === 1) return finish(senses[0], 'high', 'fast_single', multiPos);

  // Rule 3 — H1 covers a candidate: synset↔synset, high confidence. Rule 7
  // breaks a multi-cover tie towards the core sense, i.e. the lowest number.
  if (h1) {
    const covered = senses.filter((s) => h1.hebrewFor(s.synsetId) !== null);
    if (covered.length > 0) return finish(covered[0], 'high', 'h1_synset', multiPos);
  }

  // Rule 4 — two independent signals. senses[0] is WordNet sense #1 (sorted in
  // buildInventory). The second signal votes by rank; lower is more salient.
  const first = senses[0];
  let best: SenseRecord | null = null;
  let bestRank = Number.POSITIVE_INFINITY;
  for (const s of senses) {
    const r = second.rank(lemma, pos, s.synsetId);
    if (r !== null && r < bestRank) { bestRank = r; best = s; }
  }

  if (best === null) return finish(first, 'low', 'two_signal_disagree', multiPos);
  if (best.synsetId === first.synsetId) {
    return finish(first, 'medium', 'two_signal_agree', multiPos);
  }
  // Disagreement is recorded, not resolved: WordNet sense #1 is kept and the
  // item is marked low so it never becomes a scored item.
  return finish(first, 'low', 'two_signal_disagree', multiPos);
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/core/senseSelection.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Prove two branches are measured, not assumed**

Mutation A: in the rule 3 branch, change `covered[0]` to `covered[covered.length - 1]`. Re-run. Expected: `prefers the lower sense number when H1 covers two candidates` FAILS.
Mutation B: in `finish`, change `scorable` to `chosen !== null`. Re-run. Expected: `is low and keeps sense #1 when the signals disagree` FAILS.
Restore both and re-run to green. **A mutation that does not turn a test red means that behaviour is currently unmeasured — add the test before moving on.**

- [ ] **Step 6: Verify purity and commit**

```bash
npm run check:core && npx tsc --noEmit
git add lib/core/senseSelection.ts lib/core/senseSelection.test.ts
git commit -m "loop(DEV): T-018 sense selection — 1.7.1 rules 2/3/4/7"
```

---

## Task 5: The accuracy report and the runner

**Files:**
- Create: `lib/core/senseAccuracy.ts`
- Test: `lib/core/senseAccuracy.test.ts`
- Create: `scripts/measure-sense-accuracy.mjs`
- Test: `scripts/measure-sense-accuracy.test.ts`
- Modify: `package.json` (add one script)
- Modify: `data/README.md` (two new rows)

**Interfaces:**
- Consumes: everything produced by Tasks 1–4.
- Produces:
  ```ts
  export const RELEASE_THRESHOLD = 0.9;   // digest § 4
  export const BASELINE_F1 = 65.2;        // M4
  export interface AccuracyCell { readonly evaluated: number; readonly hits: number; readonly hitsLow: number; readonly accuracy: number | null }
  export interface AccuracyInput {
    readonly items: readonly { readonly lemma: string; readonly pos: Pos; readonly hebrew: string }[];
    readonly inv: SenseInventory;
    readonly gold: GoldSet;
    readonly levels: LevelMap;
  }
  export interface AccuracyReport {
    readonly overall: AccuracyCell;
    readonly byAmbiguity: Readonly<Record<Ambiguity, AccuracyCell>>;
    readonly byBand: Readonly<Record<CefrBand | 'unknown', AccuracyCell>>;
    readonly noGold: number;
    readonly meetsThreshold: boolean;
  }
  export function measureAccuracy(input: AccuracyInput): AccuracyReport;
  export function renderAccuracyMarkdown(r: AccuracyReport, provenance: readonly string[]): string;
  ```

**Decisions locked here:**
- `accuracy` is `null` when `evaluated === 0`. It is rendered as `unavailable`, never `0%` — the same rule the coverage report already holds, for the same reason.
- `hits` counts `hit` only. `hitsLow` counts `hit_low` separately. `accuracy = (hits + hitsLow) / evaluated`, and the report prints both the combined figure and `hitsLow` beside it, so a reader can subtract if they want the strict reading.
- `no_gold` items are excluded from every denominator and reported once as `noGold`.
- `meetsThreshold` is `overall.accuracy !== null && overall.accuracy >= RELEASE_THRESHOLD`. A `null` accuracy is **not** a pass.

- [ ] **Step 1: Write the failing tests for the arithmetic**

```ts
// lib/core/senseAccuracy.test.ts
import { describe, expect, it } from 'vitest';
import { buildLevelMap } from './cefrLevels';
import { buildGoldSet } from './senseGold';
import { buildInventory, type SenseRecord } from './senseInventory';
import { BASELINE_F1, measureAccuracy, renderAccuracyMarkdown, RELEASE_THRESHOLD } from './senseAccuracy';

const rec = (
  lemma: string, pos: SenseRecord['pos'], synsetId: string,
  senseNumber: number, tagCount = 5,
): SenseRecord => ({ lemma, pos, synsetId, senseNumber, tagCount });

const inv = buildInventory([
  rec('kettle', 'noun', '03612814-n', 1),
  rec('bank', 'noun', '08420278-n', 1),
  rec('bank', 'noun', '09213565-n', 2),
  rec('run', 'noun', '00558963-n', 1),
  rec('run', 'verb', '01926311-v', 1),
]);
const gold = buildGoldSet(['kettle\tקומקום', 'bank\tבנק', 'run\t!ריצה'].join('\n'));
const levels = buildLevelMap([
  { lemma: 'kettle', pos: 'noun', band: 'B1' },
  { lemma: 'bank', pos: 'noun', band: 'A2' },
]);

describe('measureAccuracy', () => {
  it('scores hits, misses and low hits into the right buckets', () => {
    const r = measureAccuracy({
      inv, gold, levels,
      items: [
        { lemma: 'kettle', pos: 'noun', hebrew: 'קומקום' }, // hit, monosemous, B1
        { lemma: 'bank', pos: 'noun', hebrew: 'גדה' },      // miss, polysemous, A2
        { lemma: 'run', pos: 'noun', hebrew: 'ריצה' },      // hit_low, multi_pos, unknown band
      ],
    });
    expect(r.overall).toEqual({ evaluated: 3, hits: 1, hitsLow: 1, accuracy: 2 / 3 });
    expect(r.byAmbiguity.monosemous.accuracy).toBe(1);
    expect(r.byAmbiguity.polysemous.accuracy).toBe(0);
    expect(r.byAmbiguity.multi_pos.hitsLow).toBe(1);
    expect(r.byBand.B1.evaluated).toBe(1);
    expect(r.byBand.unknown.evaluated).toBe(1);
  });

  it('excludes a lemma with no gold answer from every denominator', () => {
    const r = measureAccuracy({
      inv, gold, levels,
      items: [
        { lemma: 'kettle', pos: 'noun', hebrew: 'קומקום' },
        { lemma: 'zzzz', pos: 'noun', hebrew: 'שטות' },
      ],
    });
    expect(r.overall.evaluated).toBe(1);
    expect(r.noGold).toBe(1);
    expect(r.overall.accuracy).toBe(1);
  });

  it('reports null, not zero, when nothing could be evaluated', () => {
    const r = measureAccuracy({ inv, gold, levels, items: [] });
    expect(r.overall.accuracy).toBeNull();
    expect(r.meetsThreshold).toBe(false);
  });

  it('holds the release gate at 90% and the baseline at 65.2', () => {
    expect(RELEASE_THRESHOLD).toBe(0.9);
    expect(BASELINE_F1).toBe(65.2);
  });
});

describe('renderAccuracyMarkdown', () => {
  it('prints unavailable rather than 0% for an empty bucket', () => {
    const md = renderAccuracyMarkdown(
      measureAccuracy({ inv, gold, levels, items: [] }),
      ['h1-hebrew-wordnet.tsv — 17,564 lines'],
    );
    expect(md).toContain('unavailable');
    expect(md).not.toContain('0.0%');
    expect(md).toContain('h1-hebrew-wordnet.tsv');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/core/senseAccuracy.test.ts`
Expected: FAIL — `Failed to resolve import "./senseAccuracy"`.

- [ ] **Step 3: Write the arithmetic**

```ts
// lib/core/senseAccuracy.ts
/**
 * T-018 — accuracy of the § 1.7.1 selection rule against the Hebrew Wordnet
 * gold set, in the three breakdowns the task asks for.
 *
 * ⛔ An empty bucket reports null, which renders as `unavailable`. 0% and
 * "nothing to measure" are different facts and must never share a rendering.
 */
import type { Pos } from './contentSchema';
import { BAND_ORDER, levelOf, type CefrBand, type LevelMap } from './cefrLevels';
import { judge, type GoldSet } from './senseGold';
import { classifyAmbiguity, type Ambiguity, type SenseInventory } from './senseInventory';

/** Digest § 4: release gate ≥ 90% on the core. */
export const RELEASE_THRESHOLD = 0.9;
/** M4 baseline the number is compared against. */
export const BASELINE_F1 = 65.2;

export interface AccuracyCell {
  readonly evaluated: number;
  readonly hits: number;
  readonly hitsLow: number;
  readonly accuracy: number | null;
}

export interface AccuracyItem {
  readonly lemma: string;
  readonly pos: Pos;
  readonly hebrew: string;
}

export interface AccuracyInput {
  readonly items: readonly AccuracyItem[];
  readonly inv: SenseInventory;
  readonly gold: GoldSet;
  readonly levels: LevelMap;
}

export type BandKey = CefrBand | 'unknown';

export interface AccuracyReport {
  readonly overall: AccuracyCell;
  readonly byAmbiguity: Readonly<Record<Ambiguity, AccuracyCell>>;
  readonly byBand: Readonly<Record<BandKey, AccuracyCell>>;
  readonly noGold: number;
  readonly meetsThreshold: boolean;
}

interface Tally { evaluated: number; hits: number; hitsLow: number }

const blank = (): Tally => ({ evaluated: 0, hits: 0, hitsLow: 0 });

function seal(t: Tally): AccuracyCell {
  return {
    evaluated: t.evaluated,
    hits: t.hits,
    hitsLow: t.hitsLow,
    accuracy: t.evaluated === 0 ? null : (t.hits + t.hitsLow) / t.evaluated,
  };
}

const AMBIGUITIES: readonly Ambiguity[] = ['monosemous', 'polysemous', 'multi_pos'];
const BAND_KEYS: readonly BandKey[] = [...BAND_ORDER, 'unknown'];

export function measureAccuracy(input: AccuracyInput): AccuracyReport {
  const overall = blank();
  const byAmbiguity = new Map<Ambiguity, Tally>(AMBIGUITIES.map((a) => [a, blank()]));
  const byBand = new Map<BandKey, Tally>(BAND_KEYS.map((b) => [b, blank()]));
  let noGold = 0;

  for (const item of input.items) {
    const verdict = judge(input.gold, item.lemma, item.hebrew);
    if (verdict === 'no_gold') { noGold += 1; continue; }

    const ambiguity = classifyAmbiguity(input.inv, item.lemma, item.pos);
    const hit = levelOf(input.levels, item.lemma, item.pos);
    const buckets: Tally[] = [overall, byBand.get(hit?.band ?? 'unknown')!];
    if (ambiguity) buckets.push(byAmbiguity.get(ambiguity)!);

    for (const b of buckets) {
      b.evaluated += 1;
      if (verdict === 'hit') b.hits += 1;
      else if (verdict === 'hit_low') b.hitsLow += 1;
    }
  }

  const sealedOverall = seal(overall);
  return {
    overall: sealedOverall,
    byAmbiguity: Object.freeze(Object.fromEntries(
      AMBIGUITIES.map((a) => [a, seal(byAmbiguity.get(a)!)]),
    )) as Record<Ambiguity, AccuracyCell>,
    byBand: Object.freeze(Object.fromEntries(
      BAND_KEYS.map((b) => [b, seal(byBand.get(b)!)]),
    )) as Record<BandKey, AccuracyCell>,
    noGold,
    meetsThreshold:
      sealedOverall.accuracy !== null && sealedOverall.accuracy >= RELEASE_THRESHOLD,
  };
}

function pct(cell: AccuracyCell): string {
  return cell.accuracy === null ? 'unavailable' : `${(cell.accuracy * 100).toFixed(1)}%`;
}

function row(label: string, cell: AccuracyCell): string {
  return `| ${label} | ${cell.evaluated} | ${cell.hits} | ${cell.hitsLow} | ${pct(cell)} |`;
}

export function renderAccuracyMarkdown(
  r: AccuracyReport, provenance: readonly string[],
): string {
  const lines: string[] = [
    '# Sense-selection accuracy — T-018 · R-006',
    '',
    '> Generated by `npm run measure:sense`. ⛔ Do not edit by hand.',
    '> Gold answer: Hebrew Wordnet, **lemma level** — the export in `data/` carries no synset ids.',
    '',
    `**Release gate:** ≥ ${(RELEASE_THRESHOLD * 100).toFixed(0)}% · **M4 baseline:** ${BASELINE_F1} F1`,
    `**Verdict:** ${r.meetsThreshold ? 'PASS' : 'not met'} · items with no gold answer: ${r.noGold}`,
    '',
    '| bucket | evaluated | hits | hits (low) | accuracy |',
    '|---|---:|---:|---:|---:|',
    row('**overall**', r.overall),
  ];
  for (const a of AMBIGUITIES) lines.push(row(a, r.byAmbiguity[a]));
  for (const b of BAND_KEYS) lines.push(row(b, r.byBand[b]));
  lines.push('', '## Provenance', '');
  for (const p of provenance) lines.push(`- ${p}`);
  lines.push('');
  return lines.join('\n');
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/core/senseAccuracy.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Write the runner**

```js
// scripts/measure-sense-accuracy.mjs
#!/usr/bin/env node
/**
 * Runs the T-018 sense-selection accuracy measurement (R-006).
 *
 * The ONLY impure layer: it reads data/ and writes docs/sense-accuracy-report.md.
 * All arithmetic lives in lib/core/{senseInventory,cefrLevels,senseGold,
 * senseSelection,senseAccuracy}.ts and is unit tested.
 *
 * ⛔ It downloads nothing (TD-17) and it never prints a number it cannot
 * justify: a missing input reports `unavailable`, not 0%.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return withTsFormat(nextResolve(`${specifier}.ts`, context));
      } catch {
        // Not a TypeScript sibling — fall through to the default resolver.
      }
    }
    return withTsFormat(nextResolve(specifier, context));
  },
});

function withTsFormat(resolved) {
  if (resolved && typeof resolved.url === 'string' && resolved.url.endsWith('.ts')) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}

const { buildGoldSet } = await import('../lib/core/senseGold.ts');
const { parseCefrCsv, buildLevelMap } = await import('../lib/core/cefrLevels.ts');
const { buildInventory } = await import('../lib/core/senseInventory.ts');
const { measureAccuracy, renderAccuracyMarkdown } = await import('../lib/core/senseAccuracy.ts');

const DATA = 'data';
const OUT = join('docs', 'sense-accuracy-report.md');

const H1 = join(DATA, 'h1-hebrew-wordnet.tsv');
const INVENTORY = join(DATA, 'wordnet-sense-index.tsv');
const H1_SYNSETS = join(DATA, 'h1-hebrew-wordnet-synsets.tsv');
const LEVEL_FILES = [
  join(DATA, 'cefrj-vocabulary-profile-1.5.csv'),
  join(DATA, 'octanove-vocabulary-profile-c1c2-1.0.csv'),
];

const provenance = [];

if (!existsSync(H1)) {
  console.error(`missing ${H1} — see data/README.md (T-043). Nothing measured.`);
  process.exit(1);
}
const gold = buildGoldSet(readFileSync(H1, 'utf8'));
provenance.push(
  `${H1} — ${gold.lines} lines · ${gold.byLemma.size} lemmas with a gold answer · ` +
  `${gold.droppedGap} GAP dropped · ${gold.lowGlosses} \`!\` kept as low · ` +
  `${gold.malformed} malformed`,
);

const levelEntries = [];
for (const file of LEVEL_FILES) {
  if (!existsSync(file)) { provenance.push(`${file} — unavailable`); continue; }
  const parsed = parseCefrCsv(readFileSync(file, 'utf8'));
  levelEntries.push(...parsed.entries);
  provenance.push(
    `${file} — ${parsed.rows} rows · ${parsed.entries.length} entries · ` +
    `${parsed.skipped} skipped · ${parsed.unknownPos} with an unrecognised POS`,
  );
}
const levels = buildLevelMap(levelEntries);

// The sense inventory is what the accuracy number needs and what does not
// exist yet. Reporting `unavailable` here is the honest output, and it is why
// this script exits 0: the pipeline is proven, the input is missing.
let inventoryRecords = null;
if (existsSync(INVENTORY)) {
  inventoryRecords = readFileSync(INVENTORY, 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '')
    .map((l) => l.split('\t'))
    .filter((c) => c.length >= 5)
    .map(([lemma, pos, synsetId, senseNumber, tagCount]) => ({
      lemma, pos, synsetId,
      senseNumber: Number(senseNumber),
      tagCount: Number(tagCount),
    }));
  provenance.push(`${INVENTORY} — ${inventoryRecords.length} sense records`);
} else {
  provenance.push(`${INVENTORY} — **unavailable** (T-043: WordNet sense index)`);
}
if (!existsSync(H1_SYNSETS)) {
  provenance.push(`${H1_SYNSETS} — **unavailable** (T-043: synset-bearing H1 export)`);
}

const inv = buildInventory(inventoryRecords ?? []);
// ⛔ No items are synthesised. With no inventory there is nothing to select,
// and the report prints `unavailable` in every cell rather than a fake 100%.
const report = measureAccuracy({ items: [], inv, gold, levels });

mkdirSync('docs', { recursive: true });
writeFileSync(OUT, renderAccuracyMarkdown(report, provenance), 'utf8');
console.log(renderAccuracyMarkdown(report, provenance));
console.log(`\nwritten to ${OUT}`);
```

- [ ] **Step 6: Write the wiring test**

```ts
// scripts/measure-sense-accuracy.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('scripts/measure-sense-accuracy.mjs', 'utf8');

describe('measure-sense-accuracy.mjs', () => {
  it('never fetches anything (TD-17)', () => {
    expect(SRC).not.toMatch(/\bfetch\s*\(|node:https?|axios/);
  });

  it('reads the four data files it documents', () => {
    for (const f of [
      'h1-hebrew-wordnet.tsv',
      'wordnet-sense-index.tsv',
      'h1-hebrew-wordnet-synsets.tsv',
      'cefrj-vocabulary-profile-1.5.csv',
    ]) expect(SRC).toContain(f);
  });

  it('reports a missing input as unavailable rather than as zero', () => {
    expect(SRC).toContain('unavailable');
    expect(SRC).not.toMatch(/accuracy.*=\s*0\b/);
  });

  it('is registered as an npm script', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts['measure:sense']).toBe('node scripts/measure-sense-accuracy.mjs');
  });
});
```

- [ ] **Step 7: Add the npm script and the two data/README rows**

In `package.json`, next to `"measure:coverage"`:

```json
    "measure:sense": "node scripts/measure-sense-accuracy.mjs",
```

In `data/README.md`, append to the file table:

```markdown
| `wordnet-sense-index.tsv` | Princeton WordNet 3.1 `index.sense` + `cntlist`, converted locally | WordNet licence (permissive, attribution) | 5 columns, tab separated: `lemma<TAB>pos<TAB>synset_id<TAB>sense_number<TAB>tag_count`. `pos` uses the nine values of `POS_VALUES` in `lib/core/contentSchema.ts`. **Without this file the accuracy number cannot exist** — § 1.7.1 rule 4 needs sense order and tag counts. |
| `h1-hebrew-wordnet-synsets.tsv` | Hebrew Wordnet, Univ. of Haifa — the synset-bearing export | permissive, no share-alike (verified C-0001, H1g) | 3 columns, tab separated: `synset_id<TAB>english<TAB>hebrew`. The 2-column file already in the repo has no synset ids, so rule 3 currently degrades to a lemma-level match. `GAP` and `!` markers preserved verbatim — the filter is ours (T-017). |
```

- [ ] **Step 8: Run the runner and the full verification**

```bash
npm run measure:sense
npm run typecheck && npm run check:core && npm test && npm run build
```

Expected from `measure:sense`: a report whose accuracy cells all read `unavailable`, whose provenance block names `h1-hebrew-wordnet.tsv` with **17,564** lines / **702** GAP / **3,301** low, and both CEFR files with `0 skipped`. **A run that prints a percentage today is a bug** — there is no sense inventory to select from.
Expected from the four commands: all green. Paste the real tail of each into the commit message. ⛔ No completion claim without this output in the same message.

- [ ] **Step 9: Commit**

```bash
git add lib/core/senseAccuracy.ts lib/core/senseAccuracy.test.ts \
        scripts/measure-sense-accuracy.mjs scripts/measure-sense-accuracy.test.ts \
        package.json data/README.md docs/sense-accuracy-report.md
git commit -m "loop(DEV): T-018 accuracy report + runner; measure:sense script"
```

---

## Closing the loop after Task 5

The implementing agent updates, in the same tick as the last commit:

- `plan/50-tasks.md` — T-018 → 🟣 with the evidence line; T-010 marked as "pure half done, `words` write outstanding".
- `plan/30-architecture.md` — the five new modules and the `measure:sense` entry point.
- `plan/00-control.md` — `CYCLE_ID`, `ACTIVE_TASK_ID`, `NEXT_AGENT=CRITIC`, lock released, `MILESTONE_TICKS` + 1, and one handoff-log row.
- `plan/03-for-roy.md` — already carries the request for `wordnet-sense-index.tsv` and `h1-hebrew-wordnet-synsets.tsv` (written 2026-08-12). Do not duplicate it; extend the existing row if the format needs correcting.

⛔ Do not promote to `main`. That is the Critic's call.

---

## Self-review

**1. Spec coverage.** § 1.7.1 rule 1 → Task 1 (`senseKey`). Rule 2 → Task 4 (`fast_single`). Rule 3 → Task 4 (`h1_synset`) + Task 3 (the H1 filter). Rule 4 → Task 4 (`two_signal_*`). Rule 5 as corrected by D-024 → Task 4 (`needsHumanReview` / `scorable`). Rule 7 → Task 4 (the lowest-sense-number tie-break). T-018's three required breakdowns → Task 5 (`byAmbiguity`, `byBand`, `overall`) with Task 2 supplying the bands. Release gate 90% and baseline 65.2 → Task 5 constants.
**Rule 6** — *"משפט הקשר מצורף אך ורק אם הוא מכריע את המשמעות"* — is **deliberately not implemented here.** It governs example sentences, which this measurement does not produce; `lib/core/contentSchema.ts` already gates them (T-039). Recorded so the gap is a decision, not an oversight.

**2. Placeholder scan.** No `TODO`, no "handle errors appropriately", no "tests as in Task N". Every code step carries the code. The one place this plan says "not now" — the synset-level gold set — names the exact file and columns that fix it.

**3. Type consistency.** `Pos` is imported from `contentSchema.ts` in all four modules and never redeclared. `SenseRecord` has the same five fields in Tasks 1, 4 and 5. `GoldVerdict` values (`hit` / `hit_low` / `miss` / `no_gold`) are produced in Task 3 and consumed by the same names in Task 5. `LevelHit.route` is `'exact_pos' | 'lemma_only'` in both Task 2 and its only caller. `Ambiguity` values match between `classifyAmbiguity` and `AccuracyReport.byAmbiguity`.
