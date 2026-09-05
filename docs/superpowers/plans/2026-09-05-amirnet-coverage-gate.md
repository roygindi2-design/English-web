# Amirnet Coverage Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land `T-244` — `npm run measure:amirnet-coverage`, the one script `plan/25-content-commissions.md` (K-007) names as the gate that turns "coverage" from a word CONTENT can claim into a number: how many of the 3,382 Tier‑1+2 amirnet headwords already have at least one sense in the bank, how many of the polysemous ones among those are still shallow (only one sense written), and the delta from the previous run.

**Architecture:** Same pure/impure split as `lib/core/amirnetItemGate.ts` + `scripts/measure-amirnet-gate.mjs` (T-223): (1) a pure module, `lib/core/amirnetCoverage.ts`, that parses the two CSV shapes involved and computes the three counts from in-memory rows — zero `fs`, zero network, so it is trivially unit-testable — and (2) an impure CLI script, `scripts/measure-amirnet-coverage.mjs`, that reads the real files, calls the pure module, prints the three numbers, and writes `docs/amirnet-coverage-report.md`.

**Tech Stack:** TypeScript (`lib/core/`, zero React/DOM/fetch/`process.env` — Core Purity gate, `scripts/check-core-purity.mjs`), Vitest, a plain Node `.mjs` script using the same `registerHooks`/`.ts`-resolution pattern already established in `scripts/measure-gate.mjs` and `scripts/measure-amirnet-gate.mjs` (no new dependency, no new tooling).

**Spec:** `plan/25-content-commissions.md` K-007 (the exact three numbers this script must print, and why) · `data/amirnet-vocab-README.md` (what `data/amirnet-vocab.csv` is and its Tier/CEFR columns) · `plan/50-tasks.md` row `T-244`.

## ⛔ NOT an extension of another task

`plan/50-tasks.md` row `T-244` is the only register row naming `scripts/measure-amirnet-coverage.mjs`; the "overlap" `npm run check:plan` will find against that same row is this plan implementing its own task, not a silent touch of someone else's work. No other open or closed row names `lib/core/amirnetCoverage.ts`, `scripts/measure-amirnet-coverage.mjs`, or `docs/amirnet-coverage-report.md` — checked with `grep -n "amirnetCoverage\|measure-amirnet-coverage\|amirnet-coverage-report" plan/50-tasks.md` (single hit: the `T-244` row itself), live in this clone, 2026-09-05.

## ⚠️ Live measurements this plan relies on (this clone, 2026-09-05, `work/current` @ HEAD)

- `data/amirnet-vocab.csv` and `data/generated/amirnet-vocab.csv` are **tracked and NOT gitignored** — `git check-ignore -v data/amirnet-vocab.csv data/generated/amirnet-vocab.csv` printed nothing (no match) and `git ls-files` lists both. `.gitignore` carries an explicit `!data/amirnet-vocab.csv` negation (added 28/08, per its own comment) specifically to keep this file tracked. **`T-244`'s own row text claims the opposite** ("`data/amirnet-vocab.csv` מוחרג במפורש ב-`.gitignore`") — that claim is stale as of this measurement; the guard clause below is built anyway (defensive — the file's tracked status today does not guarantee it stays populated, and the K-005 history in `plan/25-content-commissions.md` shows this exact file going missing once before), but the script's error message does not repeat the stale "excluded by gitignore" framing.
- `data/amirnet-vocab.csv` header today: `headword,pos,cefr,tier,tier_name,amirnet_level,is_connector,source` (confirmed via `head -1`).
- `data/cefrj-vocabulary-profile-1.5.csv` rows carry the SAME headword more than once with a DIFFERENT `pos` when English is genuinely polysemous — e.g. `set,noun,A2,,,` and `set,verb,A1,,,` are two separate rows (confirmed via `grep -i '^set,'`). This is the only place in the repo that records per-headword, per-sense-of-speech granularity; `data/amirnet-vocab.csv` itself is already deduplicated to one row per headword (`scripts/build-amirnet-vocab.mjs` keeps only the lowest CEFR band per headword) and cannot answer "is this headword polysemous" by itself.
- `data/generated/batch-*.jsonl` rows already carry more than one `sense_index` for the same `headword` today (e.g. `about`, `age`, `answer`, `set` is not yet confirmed but the pattern is general) — confirmed via `grep -o` across all 23 batch files live in this clone. `lib/core/batchRecord.ts`'s `parseBatchFile` already turns a batch file's text into `BatchRecord[]`, each carrying `.sense.headword: string`, `.sense.pos: Pos`, and `.senseIndex: number` — reused here, not reimplemented.

## Global Constraints

- `lib/core/` is PURE — zero React, `window`, `document`, `localStorage`, `fetch`, `process.env` (Core Purity gate, `RULES`).
- The script **only measures — it never writes to the bank and never fails on a shortfall** (K-007: "⛔ אינו קובע רמה, ⛔ אינו כותב לבנק, ⛔ אינו נכשל על חוסר — הוא מודד"). Exit code `0` on a successful measurement regardless of how low coverage is; a non-zero exit is reserved for a missing/unreadable input file.
- `data/amirnet-vocab.csv` missing → the script prints one unambiguous line to stderr naming the missing path and exits `1`. It never prints `0` as if the bank were simply empty (K-007's explicit anti-pattern, citing the same failure class as an earlier finding about "a map that never errors").
- Matching between `data/amirnet-vocab.csv` headwords and the bank's headwords is **case-sensitive**, for consistency with `scripts/build-amirnet-vocab.mjs`'s already-shipped, already-measured case-sensitive merge (see that file's own header comment) — this plan does not re-derive that choice, only stays consistent with it.
- `npm run measure:amirnet-coverage` must exist in `package.json` before `T-244` is marked done (same "a gate with no command is a sentence, not a gate" rule `F-163` already established for `T-223`).
- Every number this plan's tasks hard-code as an expectation is a **fixture number this plan invents**, never the live repo counts (3,382 etc.) — the live counts are exactly what a fixture-based test must NOT depend on, so they keep passing as the real corpus grows.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/core/amirnetCoverage.ts` | Create. Pure parsing + counting: `parseAmirnetVocabCsv`, `parseCefrProfileCsv`, `polysemousHeadwords`, `computeCoverage`, `formatCoverageReport`, `parsePreviousCoverageReport`. |
| `lib/core/amirnetCoverage.test.ts` | Create. Unit tests for every exported function above, on small invented fixtures. |
| `scripts/measure-amirnet-coverage.mjs` | Create. Impure CLI driver: reads `data/amirnet-vocab.csv`, the two CEFR profile CSVs, every `data/generated/batch-*.jsonl`, and the previous `docs/amirnet-coverage-report.md` (if any); prints the three K-007 numbers; writes the new report. |
| `scripts/measure-amirnet-coverage.test.ts` | Create. End-to-end test against temp fixture directories (same `mkdtempSync` pattern as `scripts/measure-amirnet-gate.test.ts`), including the missing-vocab-csv guard. |
| `package.json` | Modify. Adds the `measure:amirnet-coverage` script entry, alongside the existing `measure:*` family. |
| `docs/amirnet-coverage-report.md` | Create (generated). Written by running the CLI for real once, in Task 2 Step 8; committed alongside the code that produces it. |

---

## Task 1: Pure module — `lib/core/amirnetCoverage.ts`

**Files:**
- Create: `lib/core/amirnetCoverage.ts`
- Test: `lib/core/amirnetCoverage.test.ts`

**Interfaces:**
- Produces (consumed by Task 2):
  ```ts
  export interface AmirnetVocabRow {
    readonly headword: string;
    readonly pos: string;
    readonly cefr: string;
    readonly tier: 1 | 2 | 3 | 4;
  }

  export interface CefrProfileRow {
    readonly headword: string;
    readonly pos: string;
  }

  export interface BankSenseRecord {
    readonly headword: string;
    readonly senseIndex: number;
  }

  export interface CoverageCounts {
    readonly targetTotal: number; // Tier 1+2 headword count in data/amirnet-vocab.csv
    readonly existingCount: number; // of targetTotal, how many have >=1 record in the bank
    readonly polysemousTargetCount: number; // of targetTotal, how many are polysemous per the CEFR profiles
    readonly polysemousShallowCount: number; // of (polysemous ∩ existing), how many carry exactly 1 distinct senseIndex in the bank
  }

  export interface CoverageDelta {
    readonly existingDelta: number | null; // null = no previous report to diff against
    readonly polysemousShallowDelta: number | null;
  }

  export interface PreviousCoverageReport {
    readonly existingCount: number;
    readonly polysemousShallowCount: number;
  }

  export function parseAmirnetVocabCsv(text: string): AmirnetVocabRow[];
  export function parseCefrProfileCsv(text: string): CefrProfileRow[];
  export function polysemousHeadwords(rows: readonly CefrProfileRow[]): Set<string>;
  export function computeCoverage(args: {
    vocabRows: readonly AmirnetVocabRow[];
    profileRows: readonly CefrProfileRow[];
    bankRecords: readonly BankSenseRecord[];
  }): CoverageCounts;
  export function diffCoverage(
    current: CoverageCounts,
    previous: PreviousCoverageReport | null,
  ): CoverageDelta;
  export function formatCoverageReport(
    counts: CoverageCounts,
    delta: CoverageDelta,
    measuredAtIso: string,
  ): string;
  export function parsePreviousCoverageReport(text: string): PreviousCoverageReport | null;
  ```

- [ ] **Step 1: Write the failing tests**

```ts
// lib/core/amirnetCoverage.test.ts
import { describe, expect, it } from 'vitest';
import {
  parseAmirnetVocabCsv,
  parseCefrProfileCsv,
  polysemousHeadwords,
  computeCoverage,
  diffCoverage,
  formatCoverageReport,
  parsePreviousCoverageReport,
} from './amirnetCoverage';

const VOCAB_CSV = [
  'headword,pos,cefr,tier,tier_name,amirnet_level,is_connector,source',
  'set,verb,A2,1,ליבה,1-2,,CEFR-J v1.5',
  'about,preposition,A2,1,ליבה,1-2,true,CEFR-J v1.5',
  'abandon,verb,B1,2,ליבה מורחבת,2-3,,CEFR-J v1.5',
  'academic,adjective,B2,3,הרחבה אקדמית,3,,Octanove v1.0',
  'zenith,noun,C1,4,רמת פטור,4,,Octanove v1.0',
].join('\n');

const PROFILE_CSV = [
  'headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold',
  'set,noun,A2,,,',
  'set,verb,A1,,,',
  'about,preposition,A2,,,',
  'about,adverb,B1,,,',
  'abandon,verb,B1,,,',
].join('\n');

describe('parseAmirnetVocabCsv', () => {
  it('parses headword/pos/cefr/tier, coercing tier to a number', () => {
    const rows = parseAmirnetVocabCsv(VOCAB_CSV);
    expect(rows).toHaveLength(5);
    expect(rows[0]).toEqual({ headword: 'set', pos: 'verb', cefr: 'A2', tier: 1 });
    expect(rows[3]).toEqual({ headword: 'academic', pos: 'adjective', cefr: 'B2', tier: 3 });
  });

  it('is stable on an empty body (header only)', () => {
    expect(parseAmirnetVocabCsv('headword,pos,cefr,tier,tier_name,amirnet_level,is_connector,source')).toEqual([]);
  });
});

describe('parseCefrProfileCsv', () => {
  it('parses every row, keeping duplicate headwords with different pos', () => {
    const rows = parseCefrProfileCsv(PROFILE_CSV);
    expect(rows).toHaveLength(5);
    expect(rows.filter((r) => r.headword === 'set')).toEqual([
      { headword: 'set', pos: 'noun' },
      { headword: 'set', pos: 'verb' },
    ]);
  });
});

describe('polysemousHeadwords', () => {
  it('flags a headword carrying 2+ distinct pos values, never a headword with exactly one', () => {
    const rows = parseCefrProfileCsv(PROFILE_CSV);
    const poly = polysemousHeadwords(rows);
    expect(poly.has('set')).toBe(true); // noun + verb
    expect(poly.has('about')).toBe(true); // preposition + adverb
    expect(poly.has('abandon')).toBe(false); // verb only
  });
});

describe('computeCoverage', () => {
  const vocabRows = parseAmirnetVocabCsv(VOCAB_CSV);
  const profileRows = parseCefrProfileCsv(PROFILE_CSV);

  it('counts the Tier 1+2 target set, existing coverage, and shallow polysemous headwords', () => {
    // Tier 1+2 headwords here: set, about, abandon (3 total).
    // Bank: "set" has 2 distinct senses (deep), "about" has exactly 1 (shallow,
    // and "about" IS polysemous per the profile), "abandon" is missing entirely
    // (not polysemous anyway, so it cannot count toward the shallow axis).
    const bankRecords = [
      { headword: 'set', senseIndex: 1 },
      { headword: 'set', senseIndex: 2 },
      { headword: 'about', senseIndex: 1 },
    ];
    const counts = computeCoverage({ vocabRows, profileRows, bankRecords });
    expect(counts).toEqual({
      targetTotal: 3,
      existingCount: 2, // set, about — abandon is missing
      polysemousTargetCount: 2, // set, about — abandon is not polysemous
      polysemousShallowCount: 1, // about only: set is polysemous but has 2 senses (deep)
    });
  });

  it('never counts a Tier 3/4 headword toward the target, even if it is in the bank', () => {
    const bankRecords = [{ headword: 'academic', senseIndex: 1 }];
    const counts = computeCoverage({ vocabRows, profileRows, bankRecords });
    expect(counts.targetTotal).toBe(3);
    expect(counts.existingCount).toBe(0);
  });

  it('matches headwords case-sensitively, consistent with build-amirnet-vocab.mjs', () => {
    const bankRecords = [{ headword: 'Set', senseIndex: 1 }];
    const counts = computeCoverage({ vocabRows, profileRows, bankRecords });
    expect(counts.existingCount).toBe(0); // "Set" ≠ "set"
  });
});

describe('report round-trip', () => {
  it('formats a report parsePreviousCoverageReport can read back exactly', () => {
    const counts = {
      targetTotal: 3382,
      existingCount: 512,
      polysemousTargetCount: 900,
      polysemousShallowCount: 340,
    };
    const delta = diffCoverage(counts, null);
    expect(delta).toEqual({ existingDelta: null, polysemousShallowDelta: null });

    const text = formatCoverageReport(counts, delta, '2026-09-05T14:00:00Z');
    const parsed = parsePreviousCoverageReport(text);
    expect(parsed).toEqual({ existingCount: 512, polysemousShallowCount: 340 });
  });

  it('diffCoverage reports signed deltas against a previous report', () => {
    const counts = {
      targetTotal: 3382,
      existingCount: 520,
      polysemousTargetCount: 900,
      polysemousShallowCount: 335,
    };
    const previous = { existingCount: 512, polysemousShallowCount: 340 };
    expect(diffCoverage(counts, previous)).toEqual({
      existingDelta: 8,
      polysemousShallowDelta: -5,
    });
  });

  it('parsePreviousCoverageReport returns null on unreadable/absent content', () => {
    expect(parsePreviousCoverageReport('not a report')).toBeNull();
    expect(parsePreviousCoverageReport('')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/core/amirnetCoverage.test.ts`
Expected: FAIL — `Cannot find module './amirnetCoverage'` (the module does not exist yet).

- [ ] **Step 3: Write the implementation**

```ts
// lib/core/amirnetCoverage.ts
/**
 * Pure module behind `npm run measure:amirnet-coverage` (T-244 · `plan/25-content-
 * commissions.md` K-007 ⓐ+ⓑ). Zero fs, zero network — every file read lives in
 * `scripts/measure-amirnet-coverage.mjs`.
 *
 * Three numbers, and only these three (K-007's own text): how many of the Tier 1+2
 * amirnet headwords already have >=1 sense in the bank ("existing / target"); of the
 * ones that ARE in the bank and ARE genuinely polysemous (per the CEFR source
 * profiles, not per the bank itself — see polysemousHeadwords), how many still carry
 * only one sense ("shallow"); and the delta of both against the previous run.
 *
 * ⛔ This module never decides a level and never writes to the bank — it measures.
 */

export interface AmirnetVocabRow {
  readonly headword: string;
  readonly pos: string;
  readonly cefr: string;
  readonly tier: 1 | 2 | 3 | 4;
}

export interface CefrProfileRow {
  readonly headword: string;
  readonly pos: string;
}

export interface BankSenseRecord {
  readonly headword: string;
  readonly senseIndex: number;
}

export interface CoverageCounts {
  readonly targetTotal: number;
  readonly existingCount: number;
  readonly polysemousTargetCount: number;
  readonly polysemousShallowCount: number;
}

export interface CoverageDelta {
  readonly existingDelta: number | null;
  readonly polysemousShallowDelta: number | null;
}

export interface PreviousCoverageReport {
  readonly existingCount: number;
  readonly polysemousShallowCount: number;
}

/** RFC4180-lite: quoted fields, embedded commas, "" escapes — same rule as
 *  scripts/build-amirnet-vocab.mjs's splitCsvLine, reimplemented here (not
 *  imported) so this module stays fs-free and that already-shipped script
 *  stays untouched. Any future drift between the two should be a deliberate,
 *  separately-reviewed refactor, not a side effect of this task. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      out.push(field);
      field = '';
    } else {
      field += c;
    }
  }
  out.push(field);
  return out;
}

function stripBom(text: string): string {
  return text.length > 0 && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function nonEmptyLines(text: string): string[] {
  return stripBom(text)
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
}

const VALID_TIER = new Set([1, 2, 3, 4]);

export function parseAmirnetVocabCsv(text: string): AmirnetVocabRow[] {
  const lines = nonEmptyLines(text);
  const rows: AmirnetVocabRow[] = [];
  for (const line of lines) {
    const cols = splitCsvLine(line);
    const headword = (cols[0] ?? '').trim();
    if (headword.toLowerCase() === 'headword') continue; // header row
    const pos = (cols[1] ?? '').trim();
    const cefr = (cols[2] ?? '').trim();
    const tierNum = Number((cols[3] ?? '').trim());
    if (headword === '' || !VALID_TIER.has(tierNum)) continue;
    rows.push({ headword, pos, cefr, tier: tierNum as 1 | 2 | 3 | 4 });
  }
  return rows;
}

const BAND_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function parseCefrProfileCsv(text: string): CefrProfileRow[] {
  const lines = nonEmptyLines(text);
  const rows: CefrProfileRow[] = [];
  for (const line of lines) {
    const cols = splitCsvLine(line);
    const headword = (cols[0] ?? '').trim();
    const pos = (cols[1] ?? '').trim().toLowerCase();
    const band = (cols[2] ?? '').trim().toUpperCase();
    if (headword === '') continue;
    if (headword.toLowerCase() === 'headword' && !BAND_ORDER.includes(band)) continue; // header row
    if (!BAND_ORDER.includes(band)) continue;
    rows.push({ headword, pos });
  }
  return rows;
}

/** A headword is polysemous here iff the CEFR source profiles record it under 2+
 *  DISTINCT `pos` values, at any band, in either file combined — e.g. "set" as both
 *  noun and verb. This is the only per-sense-of-speech signal in the repo; the
 *  already-deduplicated `data/amirnet-vocab.csv` cannot answer this question by
 *  itself (see this plan's "Live measurements" section). */
export function polysemousHeadwords(rows: readonly CefrProfileRow[]): Set<string> {
  const posByHeadword = new Map<string, Set<string>>();
  for (const { headword, pos } of rows) {
    const set = posByHeadword.get(headword) ?? new Set<string>();
    set.add(pos);
    posByHeadword.set(headword, set);
  }
  const result = new Set<string>();
  for (const [headword, posSet] of posByHeadword) {
    if (posSet.size >= 2) result.add(headword);
  }
  return result;
}

export function computeCoverage(args: {
  vocabRows: readonly AmirnetVocabRow[];
  profileRows: readonly CefrProfileRow[];
  bankRecords: readonly BankSenseRecord[];
}): CoverageCounts {
  const { vocabRows, profileRows, bankRecords } = args;
  const targetHeadwords = vocabRows.filter((r) => r.tier === 1 || r.tier === 2).map((r) => r.headword);
  const targetSet = new Set(targetHeadwords);

  const senseIndicesByHeadword = new Map<string, Set<number>>();
  for (const { headword, senseIndex } of bankRecords) {
    if (!targetSet.has(headword)) continue; // only the target set matters for these counts
    const set = senseIndicesByHeadword.get(headword) ?? new Set<number>();
    set.add(senseIndex);
    senseIndicesByHeadword.set(headword, set);
  }

  const existingCount = targetHeadwords.filter((h) => senseIndicesByHeadword.has(h)).length;

  const polysemous = polysemousHeadwords(profileRows);
  const polysemousTargetCount = targetHeadwords.filter((h) => polysemous.has(h)).length;

  let polysemousShallowCount = 0;
  for (const h of targetHeadwords) {
    if (!polysemous.has(h)) continue;
    const senseCount = senseIndicesByHeadword.get(h)?.size ?? 0;
    if (senseCount === 1) polysemousShallowCount += 1;
  }

  return {
    targetTotal: targetHeadwords.length,
    existingCount,
    polysemousTargetCount,
    polysemousShallowCount,
  };
}

export function diffCoverage(
  current: CoverageCounts,
  previous: PreviousCoverageReport | null,
): CoverageDelta {
  if (previous === null) return { existingDelta: null, polysemousShallowDelta: null };
  return {
    existingDelta: current.existingCount - previous.existingCount,
    polysemousShallowDelta: current.polysemousShallowCount - previous.polysemousShallowCount,
  };
}

function formatDelta(n: number | null): string {
  if (n === null) return 'אין דוח קודם';
  if (n === 0) return '±0';
  return n > 0 ? `+${n}` : `${n}`;
}

/** ⛔ Generated file — regenerated every run, never hand-edited (HARD INVARIANTS).
 *  The two `<!-- MEASURED ... -->` marker lines are the ONLY contract
 *  `parsePreviousCoverageReport` relies on; the prose around them is free to change. */
export function formatCoverageReport(
  counts: CoverageCounts,
  delta: CoverageDelta,
  measuredAtIso: string,
): string {
  return [
    '# דוח כיסוי אמירנ״ט',
    '',
    '⛔ קובץ נגזר — נכתב מחדש בכל הרצה של `npm run measure:amirnet-coverage`. אל תערוך ביד.',
    '',
    `נמדד: ${measuredAtIso}`,
    '',
    `- קיימות בבנק: **${counts.existingCount} / ${counts.targetTotal}** (Tier 1+2) — דלתא מההרצה הקודמת: ${formatDelta(delta.existingDelta)}`,
    `- כותרות רב-משמעיות ב-Tier 1+2 (לפי מאגרי ה-CEFR): **${counts.polysemousTargetCount}**`,
    `- מהן, נושאות משמעות אחת בלבד בבנק (רדודות): **${counts.polysemousShallowCount}** — דלתא מההרצה הקודמת: ${formatDelta(delta.polysemousShallowDelta)}`,
    '',
    `<!-- MEASURED existingCount=${counts.existingCount} -->`,
    `<!-- MEASURED polysemousShallowCount=${counts.polysemousShallowCount} -->`,
    '',
  ].join('\n');
}

export function parsePreviousCoverageReport(text: string): PreviousCoverageReport | null {
  const existingMatch = /<!-- MEASURED existingCount=(\d+) -->/.exec(text);
  const shallowMatch = /<!-- MEASURED polysemousShallowCount=(\d+) -->/.exec(text);
  if (existingMatch === null || shallowMatch === null) return null;
  return {
    existingCount: Number(existingMatch[1]),
    polysemousShallowCount: Number(shallowMatch[1]),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/core/amirnetCoverage.test.ts`
Expected: PASS, all cases green.

- [ ] **Step 5: Core purity check**

Run: `npm run check:core`
Expected: `OK` — `lib/core/amirnetCoverage.ts` imports nothing but is otherwise plain TypeScript (no `fs`, no `process.env`).

- [ ] **Step 6: Commit**

```bash
./scripts/g add lib/core/amirnetCoverage.ts lib/core/amirnetCoverage.test.ts
./scripts/g commit -m "feat(core): amirnet coverage counting (T-244 task 1/2)"
```

---

## Task 2: CLI driver — `scripts/measure-amirnet-coverage.mjs`

**Files:**
- Create: `scripts/measure-amirnet-coverage.mjs`
- Test: `scripts/measure-amirnet-coverage.test.ts`
- Modify: `package.json` (add `measure:amirnet-coverage` script)
- Create (generated, written by Step 8 below): `docs/amirnet-coverage-report.md`

**Interfaces:**
- Consumes from Task 1: `parseAmirnetVocabCsv`, `parseCefrProfileCsv`, `computeCoverage`, `diffCoverage`, `formatCoverageReport`, `parsePreviousCoverageReport` — exact signatures above.
- Consumes from `lib/core/batchRecord.ts` (already shipped, unmodified): `parseBatchFile(text: string): BatchRecord[]`, where each `BatchRecord` carries `.sense.headword: string` and `.senseIndex: number` (used here as `BankSenseRecord`).
- Env vars (all optional, all default to the real repo paths — this is what lets the test below run against fixture directories without touching the real `data/`):
  - `AMIRNET_VOCAB_CSV` (default `data/amirnet-vocab.csv`)
  - `CEFRJ_PROFILE_CSV` (default `data/cefrj-vocabulary-profile-1.5.csv`)
  - `OCTANOVE_PROFILE_CSV` (default `data/octanove-vocabulary-profile-c1c2-1.0.csv`)
  - `AMIRNET_BATCH_DIR` (default `data/generated`)
  - `AMIRNET_COVERAGE_REPORT_OUT` (default `docs/amirnet-coverage-report.md`) — also the path read back as "the previous report" before being overwritten.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/measure-amirnet-coverage.test.ts
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let root: string;
let vocabCsv: string;
let cefrjCsv: string;
let octanoveCsv: string;
let batchDir: string;
let reportOut: string;

const VOCAB_CSV = [
  'headword,pos,cefr,tier,tier_name,amirnet_level,is_connector,source',
  'set,verb,A2,1,ליבה,1-2,,CEFR-J v1.5',
  'about,preposition,A2,1,ליבה,1-2,true,CEFR-J v1.5',
  'abandon,verb,B1,2,ליבה מורחבת,2-3,,CEFR-J v1.5',
].join('\n');

const PROFILE_CSV = [
  'headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold',
  'set,noun,A2,,,',
  'set,verb,A1,,,',
  'about,preposition,A2,,,',
  'about,adverb,B1,,,',
  'abandon,verb,B1,,,',
].join('\n');

function batchLine(headword: string, senseIndex: number, pos = 'noun') {
  return JSON.stringify({
    headword,
    pos,
    sense_index: senseIndex,
    definition_en: 'x',
    translation_he: 'x',
    cefr_level: 'A2',
    translation_confidence: 'high',
    examples: { supportive: `${headword} one`, neutral: `${headword} two` },
    items: [`____ one`],
    distractors: [
      { word: 'rest', relation_type: 'semantic' },
      { word: 'play', relation_type: 'semantic' },
      { word: 'word', relation_type: 'orthographic' },
      { word: 'window', relation_type: 'unrelated' },
    ],
    he_one_to_many_group: null,
    he_interference_note: null,
    n_letters: headword.length,
    n_syllables: 1,
    is_function_word: false,
    spot_check: false,
  });
}

function run(env: Record<string, string>) {
  return execFileSync('node', ['scripts/measure-amirnet-coverage.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'amirnet-coverage-'));
  vocabCsv = join(root, 'amirnet-vocab.csv');
  cefrjCsv = join(root, 'cefrj.csv');
  octanoveCsv = join(root, 'octanove.csv');
  batchDir = join(root, 'generated');
  reportOut = join(root, 'report.md');
  mkdirSync(batchDir, { recursive: true });
  writeFileSync(vocabCsv, VOCAB_CSV, 'utf8');
  writeFileSync(cefrjCsv, PROFILE_CSV, 'utf8');
  writeFileSync(octanoveCsv, 'headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold', 'utf8');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function envFor() {
  return {
    AMIRNET_VOCAB_CSV: vocabCsv,
    CEFRJ_PROFILE_CSV: cefrjCsv,
    OCTANOVE_PROFILE_CSV: octanoveCsv,
    AMIRNET_BATCH_DIR: batchDir,
    AMIRNET_COVERAGE_REPORT_OUT: reportOut,
  };
}

describe('scripts/measure-amirnet-coverage.mjs', () => {
  it('prints the three K-007 numbers and writes the report, with no previous run', () => {
    writeFileSync(join(batchDir, 'batch-x.jsonl'), `${batchLine('set', 1)}\n${batchLine('set', 2)}\n${batchLine('about', 1)}\n`, 'utf8');

    const stdout = run(envFor());

    expect(stdout).toContain('2 / 3'); // existing: set + about, of 3 target headwords
    expect(stdout).toContain('shallow: 1'); // "about" only — "set" has 2 senses
    expect(stdout).toContain('אין דוח קודם');
    expect(existsSync(reportOut)).toBe(true);
    const report = readFileSync(reportOut, 'utf8');
    expect(report).toContain('MEASURED existingCount=2');
    expect(report).toContain('MEASURED polysemousShallowCount=1');
  });

  it('reports a delta against a previous report on the second run', () => {
    writeFileSync(join(batchDir, 'batch-x.jsonl'), `${batchLine('set', 1)}\n`, 'utf8');
    run(envFor()); // first run: existing=1/3 (set only; about/abandon missing) — this run's
    // own shallow count is not asserted here, only used to seed the report the second run diffs against.

    writeFileSync(join(batchDir, 'batch-y.jsonl'), `${batchLine('about', 1)}\n`, 'utf8');
    const stdout = run(envFor()); // second run: existing=2, delta +1

    expect(stdout).toContain('2 / 3');
    expect(stdout).toMatch(/existing.*\+1|\+1.*existing/i);
  });

  it('exits non-zero with a clear message when the vocab CSV is missing — never prints 0 as if empty', () => {
    rmSync(vocabCsv);
    expect.assertions(3);
    try {
      run(envFor());
    } catch (err: any) {
      expect(err.status).toBe(1);
      const output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
      expect(output).toContain(vocabCsv);
      expect(output).not.toMatch(/\b0 \/ 0\b/);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run scripts/measure-amirnet-coverage.test.ts`
Expected: FAIL — `scripts/measure-amirnet-coverage.mjs` does not exist yet (`ENOENT`).

- [ ] **Step 3: Write the implementation**

```js
#!/usr/bin/env node
/**
 * npm run measure:amirnet-coverage — T-244, the gate `plan/25-content-commissions.md`
 * K-007 names as the thing that stops "coverage" from being a word instead of a
 * number. Prints three numbers, from `data/amirnet-vocab.csv` and the bank
 * (`data/generated/batch-*.jsonl`):
 *   1. how many of the 3,382 Tier 1+2 headwords already have >=1 sense in the bank
 *   2. of the polysemous ones among those (per the CEFR source profiles), how many
 *      still carry only one sense — "shallow"
 *   3. the delta of both against the previous run's report
 *
 * ⛔ Read-only over data/ and data/generated/ — the one file it writes is
 * docs/amirnet-coverage-report.md (or AMIRNET_COVERAGE_REPORT_OUT in a test).
 * ⛔ It never decides a level and never writes to the bank (K-007's own text).
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

const {
  parseAmirnetVocabCsv,
  parseCefrProfileCsv,
  computeCoverage,
  diffCoverage,
  formatCoverageReport,
  parsePreviousCoverageReport,
} = await import('../lib/core/amirnetCoverage.ts');
const { parseBatchFile } = await import('../lib/core/batchRecord.ts');

const VOCAB_CSV = process.env.AMIRNET_VOCAB_CSV || join('data', 'amirnet-vocab.csv');
const CEFRJ_CSV = process.env.CEFRJ_PROFILE_CSV || join('data', 'cefrj-vocabulary-profile-1.5.csv');
const OCTANOVE_CSV = process.env.OCTANOVE_PROFILE_CSV || join('data', 'octanove-vocabulary-profile-c1c2-1.0.csv');
const BATCH_DIR = process.env.AMIRNET_BATCH_DIR || join('data', 'generated');
const OUT = process.env.AMIRNET_COVERAGE_REPORT_OUT || join('docs', 'amirnet-coverage-report.md');

function requireFile(path) {
  if (!existsSync(path)) {
    console.error(`measure:amirnet-coverage: missing required file: ${path}`);
    console.error('  (this is a hard stop, not "0 coverage" — see plan/25-content-commissions.md K-007)');
    process.exit(1);
  }
  return readFileSync(path, 'utf8');
}

const vocabText = requireFile(VOCAB_CSV);
const cefrjText = requireFile(CEFRJ_CSV);
const octanoveText = requireFile(OCTANOVE_CSV);

const vocabRows = parseAmirnetVocabCsv(vocabText);
const profileRows = [...parseCefrProfileCsv(cefrjText), ...parseCefrProfileCsv(octanoveText)];

const batchFiles = existsSync(BATCH_DIR)
  ? readdirSync(BATCH_DIR).filter((name) => /^batch-.*\.jsonl$/.test(name)).sort()
  : [];

const bankRecords = [];
for (const file of batchFiles) {
  const records = parseBatchFile(readFileSync(join(BATCH_DIR, file), 'utf8'));
  for (const r of records) {
    bankRecords.push({ headword: r.sense.headword, senseIndex: r.senseIndex });
  }
}

const previousReport = existsSync(OUT) ? parsePreviousCoverageReport(readFileSync(OUT, 'utf8')) : null;

const counts = computeCoverage({ vocabRows, profileRows, bankRecords });
const delta = diffCoverage(counts, previousReport);
const measuredAtIso = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

writeFileSync(OUT, formatCoverageReport(counts, delta, measuredAtIso), 'utf8');

function fmtDelta(n) {
  if (n === null) return 'אין דוח קודם';
  if (n === 0) return '±0';
  return n > 0 ? `+${n}` : `${n}`;
}

console.log(`existing: ${counts.existingCount} / ${counts.targetTotal} (Tier 1+2) — delta existing ${fmtDelta(delta.existingDelta)}`);
console.log(`polysemous in Tier 1+2 (per CEFR source profiles): ${counts.polysemousTargetCount}`);
console.log(`shallow: ${counts.polysemousShallowCount} (polysemous headwords with exactly 1 sense in the bank) — delta shallow ${fmtDelta(delta.polysemousShallowDelta)}`);
console.log(`wrote ${OUT}`);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run scripts/measure-amirnet-coverage.test.ts`
Expected: PASS, all three cases green.

- [ ] **Step 5: Add the `package.json` script entry**

Edit `package.json`, in the `measure:*` group (alongside `"measure:amirnet-gate": "node scripts/measure-amirnet-gate.mjs",`):

```json
    "measure:amirnet-coverage": "node scripts/measure-amirnet-coverage.mjs",
```

- [ ] **Step 6: Run it once for real, against the live repo, to confirm it behaves against real data**

Run: `npm run measure:amirnet-coverage`
Expected: exits 0, prints the three numbers against the live `data/amirnet-vocab.csv` and `data/generated/batch-*.jsonl`, writes `docs/amirnet-coverage-report.md`. Whatever numbers this prints ARE the first real measurement — record them in the tick's report to Roy as freshly measured, not copied from this plan (this plan's own numbers are all synthetic fixtures, per the Global Constraints section).

- [ ] **Step 7: Full verification gate**

Run: `npm run verify`
Expected: green (includes `typecheck`, `test`, `build`, `check:mobile`, `check:core` per `docs/agents/DEV.md` STEP 6 — five commands).

- [ ] **Step 8: Commit**

```bash
./scripts/g add scripts/measure-amirnet-coverage.mjs scripts/measure-amirnet-coverage.test.ts package.json docs/amirnet-coverage-report.md
./scripts/g commit -m "feat(scripts): measure:amirnet-coverage CLI + first real report (T-244 task 2/2)"
```

---

## Self-check (spec coverage against `plan/25-content-commissions.md` K-007)

- ⓐ "existence" axis — how many of 3,382 Tier 1+2 headwords are in the bank → `computeCoverage().existingCount` / `.targetTotal`, printed by the CLI. ✅ Task 1 + Task 2.
- ⓑ "depth" axis, narrowed exactly to what K-007's own text asks this script for ("כמה כותרות רב-משמעיות נושאות משמעות אחת בלבד", not the full depth axis of "does the bank carry every sense a learner will meet" — K-007 itself marks the FULL depth axis "⛔ לא נמדד בטיק הזה", only this one number is in scope for `T-244`) → `computeCoverage().polysemousShallowCount`. ✅ Task 1 + Task 2.
- Delta from the previous run → `diffCoverage` + the `<!-- MEASURED ... -->` markers round-tripped through `docs/amirnet-coverage-report.md`. ✅ Task 1 + Task 2.
- "Exits with a clear message if the file is missing, never prints 0" (K-007's own guard) → `requireFile` in the CLI, tested in Task 2 Step 1's third case. ✅.
- `npm run measure:amirnet-coverage` exists in `package.json` before the task is marked done → Task 2 Step 5. ✅.
