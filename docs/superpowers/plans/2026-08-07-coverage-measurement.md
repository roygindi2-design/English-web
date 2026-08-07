# Hebrew Coverage Measurement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the numbers that open R-005 — what percentage of the 2,809 NGSL headwords has a Hebrew translation in H1/H2/H3/H4, per source and combined, plus the exact list of headwords no source covers.

**Architecture:** Three layers, split by what blocks them. `lib/core/lexicon.ts` is the normalisation and gloss-filter policy (T-017) — pure, fully testable today. `lib/core/coverage.ts` is a source-agnostic set intersection (T-013 + T-016) — pure, fully testable today against fixtures. `scripts/measure-coverage.mjs` is the only impure layer: it reads local files under `data/` and prints the report. **TD-17 blocks every external data domain (`403 host_not_allowed`), so no agent can fetch these files.** The code is therefore built and proven against fixtures now, and yields real numbers the moment the files land in `data/` (T-043). The script never fabricates a number: a missing file reports `unavailable`, and a source whose parse-failure rate exceeds 0.5% aborts the run.

**Tech Stack:** TypeScript (strict, no `any`), Vitest, Node ESM for the runner. **No new runtime dependencies.**

## Global Constraints

- `lib/core/` stays pure: no `react`, no `window`/`document`/`localStorage`/`sessionStorage`, no `fetch`, no `process.env`. Enforced by `npm run check:core`. **All file I/O lives in `scripts/`.**
- ⛔ **No agent may download any of these files.** TD-17 measured again at C-0019: `kaikki.org` and `newgeneralservicelist.com` both return `403 host_not_allowed`. ⛔ No mirrors, no archives (R-004).
- ⛔ **Do not translate, do not pick a source, do not fill a gap.** T-013 and T-016 both say it in the task text: *measure and report to the PM.* Choosing the translation source is the PM's decision on the back of these numbers.
- **NGSL v1.2 — 2,809 entries exactly**, from `newgeneralservicelist.com` only (digest, "נעילת מקורות"). A different count is a hard failure, not a warning (T-012 · F-005).
- ⛔ No NITE items (R-010), ⛔ no AnkiWeb decks (R-013), ⛔ no PanLex/MUSE (NC licence).
- Verification before any completion claim: `npm run typecheck && npm run check:core && npm test && npm run build`.
- Commit messages carry no `[skip ci]` (RULES § 0.7). Agents push to `dev` only.

---

## Why T-018 is NOT in this plan

T-023 orders four tasks: T-017 → T-013 → T-016 → T-018. This plan covers the first three.

**T-018 (sense-selection accuracy vs. gold set) is unplannable today.** It says *"מימוש כלל הקליטה של 1.7.1"* — and § 1.7.1 **is not in `plan/15-syllabus-digest.md`**. Dev is forbidden from opening `plan/10-pedagogy.md`. F-006 already recorded this as a partial fix and opened T-020 to the PM; T-020 is still ⬜. Writing T-018 without 1.7.1 would mean inventing the very rule that 10-pedagogy marks *"⛔ סטייה ממנו = תוכן לימודי מומצא"*.

**F-021 is opened against the PM in this tick** for that gap, and for a second one found while writing Task 1 — see below.

---

## The contradiction this plan refuses to resolve by guessing

`plan/15-syllabus-digest.md` and the T-017 task text disagree about what happens to a damaged record:

| record | digest, "כללי קליטה מחייבים" § 2 | T-017 task text |
|---|---|---|
| `GAP` | **not loaded** | (א) not loaded — **agree** |
| leading `!` | **not loaded** | (ב) loaded with `translation_confidence='low'`, never a primary translation |
| pointed text (niqqud) | **not loaded** | (ג) niqqud stripped for the *match* field, pointed form kept in a separate field |

Two of the three conflict. Note that the digest's own § 3 (D-013) says *"רשומה `low` אינה מוצגת ללומד, **גם אם נטענה**"* — which only makes sense if `!` rows **are** loaded. So the digest contradicts itself, and T-017 agrees with the digest's § 3.

**The resolution is not to pick one.** It is to make the policy *data* rather than *logic*: `classifyGloss()` returns flags and never decides, and `measureCoverage()` takes an explicit `CoveragePolicy`. The runner then prints the coverage number **under both readings** — strict (digest § 2) and lenient (T-017 + D-013) — for a few extra milliseconds. Whichever way the PM rules in F-021, the number is already measured and nothing has to be rebuilt.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/core/lexicon.ts` | **Create.** Normalisation (English + Hebrew) and the gloss-filter policy. Pure. T-017. |
| `lib/core/lexicon.test.ts` | **Create.** |
| `lib/core/coverage.ts` | **Create.** Source-agnostic coverage arithmetic. Pure. T-013 + T-016. |
| `lib/core/coverage.test.ts` | **Create.** |
| `lib/core/sources.ts` | **Create.** Text → `SourceEntry[]` parsers for H1/H2/H3/H4, each self-reporting a skip count. Pure. |
| `lib/core/sources.test.ts` | **Create.** |
| `scripts/measure-coverage.mjs` | **Create.** The only impure layer: reads `data/`, writes `docs/coverage-report.md`. |
| `scripts/measure-coverage.test.ts` | **Create.** Guards the wiring, in the style of `scripts/verify-mobile.test.ts`. |
| `data/README.md` | **Create.** The exact filename, format and licence each source file must arrive in. |
| `package.json` | **Modify.** Add `measure:coverage`. ⛔ **Not** added to `verify` — it needs data files that are not in the repo. |
| `vitest.config.ts` | **Modify.** No change needed — `lib/**/*.test.ts` and `scripts/**/*.test.ts` are both already in `include`. Verify, do not edit. |

---

### Task 1: `lib/core/lexicon.ts` — normalisation and the gloss-filter policy (T-017)

**Files:**
- Create: `lib/core/lexicon.ts`
- Test: `lib/core/lexicon.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
```ts
export type TranslationConfidence = 'high' | 'low';
export type GlossFlag = 'bang_prefix' | 'pointed';
export type RawGloss = string & { readonly __rawGloss: unique symbol };
export function asRawGloss(s: string): RawGloss;
export type GlossVerdict =
  | { readonly kind: 'drop'; readonly reason: 'gap_record' | 'empty' }
  | {
      readonly kind: 'keep';
      readonly confidence: TranslationConfidence;
      readonly display: string;
      readonly match: string;
      readonly flags: readonly GlossFlag[];
    };
export function normalizeEnglish(s: string): string;
export function stripNiqqud(s: string): string;
export function hasNiqqud(s: string): boolean;
export function normalizeHebrew(s: string): string;
export function classifyGloss(raw: RawGloss): GlossVerdict;
export function displayableGloss(raw: RawGloss): string | null;
```

**Why `RawGloss` is a branded type and not `string`:** T-017 demands *"בדיקת יחידה שנכשלת אם רשומת `GAP` או `!` הגיעה לשכבת התצוגה"*. A runtime test can only catch a display path that already exists, and none does yet. A brand catches it at **compile time**: a React component handed a `RawGloss` cannot render it, because the only function that turns one into a plain `string` is `displayableGloss()`, which returns `null` for `GAP` and for `!`. This is the same barrier shape as the mandatory `enterKeyHint` prop from C-0019 — a rule the compiler enforces instead of a reviewer.

- [x] **Step 1: Write the failing test**

Create `lib/core/lexicon.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  asRawGloss,
  classifyGloss,
  displayableGloss,
  hasNiqqud,
  normalizeEnglish,
  normalizeHebrew,
  stripNiqqud,
} from './lexicon';

describe('normalizeEnglish', () => {
  it('lowercases, trims and collapses inner whitespace', () => {
    expect(normalizeEnglish('  Book  ')).toBe('book');
    expect(normalizeEnglish('ice\t cream')).toBe('ice cream');
  });

  it('strips combining diacritics so cafe and café are one key', () => {
    expect(normalizeEnglish('café')).toBe('cafe');
    expect(normalizeEnglish('café')).toBe('cafe');
  });

  it('keeps hyphen and apostrophe — NGSL headwords use them', () => {
    expect(normalizeEnglish("Don't")).toBe("don't");
    expect(normalizeEnglish('Well-Known')).toBe('well-known');
  });
});

describe('stripNiqqud', () => {
  it('removes vowel points but keeps the letters', () => {
    // בַּיִת -> בית
    expect(stripNiqqud('בַּיִת')).toBe(
      'בית',
    );
  });

  it('keeps MAQAF U+05BE — it joins words and is not a point', () => {
    expect(stripNiqqud('בֽ־ג')).toBe('ב־ג');
  });

  it('decomposes presentation forms before stripping', () => {
    // U+FB2A SHIN WITH SHIN DOT must end up as a bare U+05E9.
    expect(stripNiqqud('שׁ')).toBe('ש');
  });

  it('leaves unpointed text byte-identical', () => {
    expect(stripNiqqud('ספר')).toBe('ספר');
  });
});

describe('hasNiqqud', () => {
  it('is true for pointed text and false for plain text', () => {
    expect(hasNiqqud('בַּיִת')).toBe(true);
    expect(hasNiqqud('בית')).toBe(false);
  });

  it('does not treat MAQAF as niqqud', () => {
    expect(hasNiqqud('א־ב')).toBe(false);
  });
});

describe('normalizeHebrew', () => {
  it('strips points and collapses whitespace', () => {
    expect(normalizeHebrew('  בַּיִת  ')).toBe(
      'בית',
    );
  });
});

describe('classifyGloss — R-007 damaged records', () => {
  it('drops a bare GAP record', () => {
    expect(classifyGloss(asRawGloss('GAP'))).toEqual({
      kind: 'drop',
      reason: 'gap_record',
    });
  });

  it('drops GAP with a trailing note, but not a word starting with GAP', () => {
    expect(classifyGloss(asRawGloss('GAP no lexical item'))).toEqual({
      kind: 'drop',
      reason: 'gap_record',
    });
    const gape = classifyGloss(asRawGloss('GAPE'));
    expect(gape.kind).toBe('keep');
  });

  it('drops an empty or whitespace-only gloss', () => {
    expect(classifyGloss(asRawGloss('   ')).kind).toBe('drop');
    expect(classifyGloss(asRawGloss('!')).kind).toBe('drop');
  });

  it('keeps a bang-prefixed record at low confidence with the bang removed', () => {
    const v = classifyGloss(asRawGloss('!גדה'));
    expect(v).toEqual({
      kind: 'keep',
      confidence: 'low',
      display: 'גדה',
      match: 'גדה',
      flags: ['bang_prefix'],
    });
  });

  it('keeps a pointed record: display keeps the points, match does not', () => {
    const v = classifyGloss(asRawGloss('בַּיִת'));
    expect(v).toEqual({
      kind: 'keep',
      confidence: 'high',
      display: 'בַּיִת',
      match: 'בית',
      flags: ['pointed'],
    });
  });

  it('a clean record carries no flags and is high confidence', () => {
    const v = classifyGloss(asRawGloss(' ספר '));
    expect(v).toEqual({
      kind: 'keep',
      confidence: 'high',
      display: 'ספר',
      match: 'ספר',
      flags: [],
    });
  });
});

describe('displayableGloss — D-013 display gate', () => {
  it('returns null for GAP and for a bang record', () => {
    expect(displayableGloss(asRawGloss('GAP'))).toBeNull();
    expect(displayableGloss(asRawGloss('!גדה'))).toBeNull();
  });

  it('returns the display form for a clean record', () => {
    expect(displayableGloss(asRawGloss('ספר'))).toBe(
      'ספר',
    );
  });

  it('returns the POINTED form — the display field keeps its points', () => {
    expect(displayableGloss(asRawGloss('בַּיִת'))).toBe(
      'בַּיִת',
    );
  });
});
```

- [x] **Step 2: Run the test and confirm it fails for the right reason**

Run: `npx vitest run lib/core/lexicon.test.ts`
Expected: FAIL — `Failed to resolve import "./lexicon"`. If it fails with anything else, stop and read the error.

- [x] **Step 3: Write the implementation**

Create `lib/core/lexicon.ts`:

```ts
/**
 * Lexical normalisation and the damaged-record filter (T-017 · R-007 · D-013).
 *
 * Everything here is pure. The policy question "is a `!` record loaded at all?"
 * is deliberately NOT answered in this file — see F-021. classifyGloss reports
 * facts (flags, confidence); the caller decides what to do with them.
 */

export type TranslationConfidence = 'high' | 'low';
export type GlossFlag = 'bang_prefix' | 'pointed';

/**
 * A gloss straight out of a source file, before filtering.
 *
 * The brand is load-bearing: a value of this type cannot be rendered, because
 * the only route to a plain string is displayableGloss(), which returns null
 * for GAP and for `!`. T-017 asks for a test that fails if such a record
 * reaches the display layer; this makes it a compile error instead.
 */
export type RawGloss = string & { readonly __rawGloss: unique symbol };

export function asRawGloss(s: string): RawGloss {
  return s as RawGloss;
}

export type GlossVerdict =
  | { readonly kind: 'drop'; readonly reason: 'gap_record' | 'empty' }
  | {
      readonly kind: 'keep';
      readonly confidence: TranslationConfidence;
      readonly display: string;
      readonly match: string;
      readonly flags: readonly GlossFlag[];
    };

/**
 * Hebrew points and cantillation marks ONLY.
 *
 * The naive range ֑-ׇ is wrong: it swallows U+05BE MAQAF (a joining
 * hyphen, part of the word), U+05C0 PASEQ, U+05C3 SOF PASUQ and U+05C6 NUN
 * HAFUKHA — all real characters, not points. They are excluded by hand below.
 */
const NIQQUD = /[֑-ׇֽֿׁׂׅׄ]/g;

/** Latin combining diacritics, for the English side. */
const LATIN_MARKS = /[̀-ͯ]/g;

const WHITESPACE = /\s+/g;

export function stripNiqqud(s: string): string {
  // NFKD first: U+FB2A (SHIN WITH SHIN DOT) and friends are single code points
  // that a range scan cannot see into. Decomposing turns them into base+mark.
  return s.normalize('NFKD').replace(NIQQUD, '').normalize('NFC');
}

export function hasNiqqud(s: string): boolean {
  // Fresh regex each call: NIQQUD is /g and carries lastIndex across .test().
  return new RegExp(NIQQUD.source).test(s.normalize('NFKD'));
}

export function normalizeHebrew(s: string): string {
  return stripNiqqud(s).replace(WHITESPACE, ' ').trim();
}

export function normalizeEnglish(s: string): string {
  return s
    .normalize('NFKD')
    .replace(LATIN_MARKS, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(WHITESPACE, ' ')
    .trim();
}

/**
 * `GAP` as a standalone token — not a word that merely starts with those
 * letters. "GAPE" is a legitimate gloss; "GAP no lexical item" is not.
 */
const GAP_RECORD = /^GAP(\s|$)/;

export function classifyGloss(raw: RawGloss): GlossVerdict {
  const trimmed = String(raw).trim();
  if (trimmed === '') return { kind: 'drop', reason: 'empty' };
  if (GAP_RECORD.test(trimmed)) return { kind: 'drop', reason: 'gap_record' };

  const flags: GlossFlag[] = [];
  let body = trimmed;
  if (body.startsWith('!')) {
    flags.push('bang_prefix');
    body = body.slice(1).trim();
  }
  if (body === '') return { kind: 'drop', reason: 'empty' };

  if (hasNiqqud(body)) flags.push('pointed');

  return {
    kind: 'keep',
    // Pointing is a spelling property, not a reliability one — it does NOT
    // lower confidence. Only the `!` marker does (T-017 ב).
    confidence: flags.includes('bang_prefix') ? 'low' : 'high',
    display: body,
    match: normalizeHebrew(body),
    flags,
  };
}

/** D-013: a dropped record and a `low` record are both invisible to the learner. */
export function displayableGloss(raw: RawGloss): string | null {
  const v = classifyGloss(raw);
  if (v.kind === 'drop') return null;
  if (v.confidence === 'low') return null;
  return v.display;
}
```

- [x] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/core/lexicon.test.ts`
Expected: PASS, 17 tests.

- [x] **Step 5: Prove the tests can actually fail — three mutations**

A test that never goes red is decoration. Apply each mutation, run, revert.

1. Change `NIQQUD` to the naive `/[֑-ׇ]/g`.
   Expected: **`keeps MAQAF U+05BE` fails** and `does not treat MAQAF as niqqud` fails.
2. Change `GAP_RECORD` to `/^GAP/`.
   Expected: **`GAPE` fails** — it is reported as a drop.
3. Delete `.normalize('NFKD')` from `stripNiqqud`.
   Expected: **`decomposes presentation forms` fails** — `שׁ` survives unchanged.

Record the actual failure output for each in the commit message. If a mutation does **not** produce a failure, the corresponding test is not measuring anything — fix the test before continuing.

- [x] **Step 6: Run the full gate**

Run: `npm run typecheck && npm run check:core && npm test`
Expected: typecheck clean · `/lib/core purity: OK` · the whole suite green (252 before this task).

- [x] **Step 7: Commit**

```bash
git add lib/core/lexicon.ts lib/core/lexicon.test.ts
git commit -m "loop(DEV): T-017 lexicon normalisation + R-007 damaged-record filter"
```

---

### Task 2: `lib/core/coverage.ts` — the coverage arithmetic (T-013 · T-016)

**Files:**
- Create: `lib/core/coverage.ts`
- Test: `lib/core/coverage.test.ts`

**Interfaces:**
- Consumes: `normalizeEnglish`, `classifyGloss`, `asRawGloss`, `GlossFlag`, `TranslationConfidence` from `./lexicon` (Task 1).
- Produces:
```ts
export interface SourceEntry { readonly en: string; readonly he: string; }
export interface LexicalSource {
  readonly id: string;
  readonly label: string;
  readonly entries: readonly SourceEntry[];
}
export interface CoveragePolicy {
  readonly includeLowConfidence: boolean;
  readonly includePointed: boolean;
}
export const STRICT_POLICY: CoveragePolicy;   // digest § 2 reading
export const LENIENT_POLICY: CoveragePolicy;  // T-017 + D-013 reading
export interface SourceCoverage {
  readonly id: string;
  readonly label: string;
  readonly covered: number;
  readonly total: number;
  readonly percent: number;
  readonly acceptedGlosses: number;
  readonly rejectedGlosses: number;
}
export interface CoverageReport {
  readonly policy: CoveragePolicy;
  readonly headwordCount: number;
  readonly perSource: readonly SourceCoverage[];
  readonly combined: { readonly covered: number; readonly total: number; readonly percent: number };
  readonly uncovered: readonly string[];
}
export function measureCoverage(
  headwords: readonly string[],
  sources: readonly LexicalSource[],
  policy: CoveragePolicy,
): CoverageReport;
```

This one function serves **both** T-013 (H1, H2) and T-016 (H3, H4). The tasks differ only in which sources are in the array, which is why they are one file and not two.

- [x] **Step 1: Write the failing test**

> ⚠️ **תוקן בביצוע C-0022 — הקוד למטה כתוב כאן כפי שתוכנן, אך אינו מתקמפל בריפו הזה.** `tsconfig.json` מפעיל `noUncheckedIndexedAccess`, ולכן `r.perSource[0]` הוא `SourceCoverage | undefined` ו-`tsc --noEmit` נפל על **20 שגיאות TS2532, כולן בקובץ הבדיקה בלבד** (המימוש עבר נקי). התיקון שנבחר אינו `!`: נוספה `source(r, i)` שזורקת שגיאה בעלת שם (`no perSource[i] — report has N source(s)`) במקום להשאיר `cannot read properties of undefined` שלוש שורות אחר כך. שלוש המוטציות של שלב 5 הורצו **שוב** מול הבדיקה המתוקנת והפילו אותה זהה.

Create `lib/core/coverage.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  LENIENT_POLICY,
  STRICT_POLICY,
  measureCoverage,
  type LexicalSource,
} from './coverage';

const SEFER = 'ספר';   // ספר
const BAYIT = 'בית';   // בית
const POINTED_BAYIT = 'בַּיִת';

function src(id: string, entries: Array<[string, string]>): LexicalSource {
  return { id, label: id, entries: entries.map(([en, he]) => ({ en, he })) };
}

describe('measureCoverage', () => {
  it('counts a headword as covered when any accepted gloss matches it', () => {
    const r = measureCoverage(
      ['book', 'house'],
      [src('H1', [['book', SEFER]])],
      STRICT_POLICY,
    );
    expect(r.perSource[0].covered).toBe(1);
    expect(r.perSource[0].total).toBe(2);
    expect(r.perSource[0].percent).toBe(50);
    expect(r.uncovered).toEqual(['house']);
  });

  it('matches through English normalisation on both sides', () => {
    const r = measureCoverage(
      ['  Book '],
      [src('H1', [['BOOK', SEFER]])],
      STRICT_POLICY,
    );
    expect(r.perSource[0].covered).toBe(1);
  });

  it('deduplicates repeated headwords before counting', () => {
    const r = measureCoverage(
      ['book', 'Book', 'book'],
      [src('H1', [['book', SEFER]])],
      STRICT_POLICY,
    );
    expect(r.headwordCount).toBe(1);
    expect(r.perSource[0].percent).toBe(100);
  });

  it('reports the ORIGINAL spelling of an uncovered headword, not the key', () => {
    const r = measureCoverage(['  House '], [src('H1', [])], STRICT_POLICY);
    expect(r.uncovered).toEqual(['  House ']);
  });

  it('sorts uncovered by normalised key so the report is reproducible', () => {
    const r = measureCoverage(
      ['zebra', 'apple', 'Mango'],
      [src('H1', [])],
      STRICT_POLICY,
    );
    expect(r.uncovered).toEqual(['apple', 'Mango', 'zebra']);
  });

  it('a GAP gloss is not coverage — this is where T-017 meets T-013', () => {
    const r = measureCoverage(
      ['book'],
      [src('H1', [['book', 'GAP']])],
      STRICT_POLICY,
    );
    expect(r.perSource[0].covered).toBe(0);
    expect(r.perSource[0].acceptedGlosses).toBe(0);
    expect(r.perSource[0].rejectedGlosses).toBe(1);
    expect(r.uncovered).toEqual(['book']);
  });

  it('STRICT rejects a bang record; LENIENT accepts it as coverage', () => {
    const sources = [src('H1', [['book', '!' + SEFER]])];
    expect(measureCoverage(['book'], sources, STRICT_POLICY).perSource[0].covered).toBe(0);
    expect(measureCoverage(['book'], sources, LENIENT_POLICY).perSource[0].covered).toBe(1);
  });

  it('STRICT rejects a pointed record; LENIENT accepts it', () => {
    const sources = [src('H1', [['house', POINTED_BAYIT]])];
    expect(measureCoverage(['house'], sources, STRICT_POLICY).perSource[0].covered).toBe(0);
    expect(measureCoverage(['house'], sources, LENIENT_POLICY).perSource[0].covered).toBe(1);
  });

  it('combined coverage is the union across sources, not the sum', () => {
    const r = measureCoverage(
      ['book', 'house', 'tree'],
      [
        src('H1', [['book', SEFER], ['house', BAYIT]]),
        src('H2', [['house', BAYIT]]),
      ],
      STRICT_POLICY,
    );
    expect(r.perSource[0].covered).toBe(2);
    expect(r.perSource[1].covered).toBe(1);
    expect(r.combined.covered).toBe(2);
    expect(r.combined.percent).toBe(66.67);
    expect(r.uncovered).toEqual(['tree']);
  });

  it('an entry for a headword that is not in the list is ignored, not counted', () => {
    const r = measureCoverage(
      ['book'],
      [src('H1', [['book', SEFER], ['aardvark', BAYIT]])],
      STRICT_POLICY,
    );
    expect(r.perSource[0].covered).toBe(1);
    expect(r.perSource[0].percent).toBe(100);
    expect(r.perSource[0].acceptedGlosses).toBe(2);
  });

  it('an empty headword list yields 0, never NaN', () => {
    const r = measureCoverage([], [src('H1', [['book', SEFER]])], STRICT_POLICY);
    expect(r.headwordCount).toBe(0);
    expect(r.perSource[0].percent).toBe(0);
    expect(r.combined.percent).toBe(0);
    expect(r.uncovered).toEqual([]);
  });

  it('an empty source yields 0% and does not throw', () => {
    const r = measureCoverage(['book'], [src('H1', [])], STRICT_POLICY);
    expect(r.perSource[0].percent).toBe(0);
    expect(r.combined.percent).toBe(0);
  });

  it('rounds percent to two decimals', () => {
    const r = measureCoverage(
      ['a', 'b', 'c'],
      [src('H1', [['a', SEFER]])],
      STRICT_POLICY,
    );
    expect(r.perSource[0].percent).toBe(33.33);
  });

  it('preserves source order in perSource so the report reads predictably', () => {
    const r = measureCoverage(
      ['book'],
      [src('H3', []), src('H1', []), src('H4', [])],
      STRICT_POLICY,
    );
    expect(r.perSource.map((s) => s.id)).toEqual(['H3', 'H1', 'H4']);
  });
});
```

- [x] **Step 2: Run the test and confirm it fails**

Run: `npx vitest run lib/core/coverage.test.ts`
Expected: FAIL — `Failed to resolve import "./coverage"`.

- [x] **Step 3: Write the implementation**

Create `lib/core/coverage.ts`:

```ts
/**
 * Hebrew coverage measurement (T-013 · T-016 · R-005).
 *
 * Source-agnostic on purpose: T-013 measures H1/H2 and T-016 measures H3/H4
 * with an identical output contract, so they are the same function called with
 * a different array.
 *
 * ⛔ This module MEASURES. It does not choose a source and it does not
 * translate. Choosing is the PM's call on the back of these numbers.
 */

import { asRawGloss, classifyGloss, normalizeEnglish } from './lexicon';

export interface SourceEntry {
  readonly en: string;
  readonly he: string;
}

export interface LexicalSource {
  readonly id: string;
  readonly label: string;
  readonly entries: readonly SourceEntry[];
}

/**
 * The two readings of the damaged-record rule. See F-021: plan/15-syllabus-digest.md
 * § 2 says `!` and pointed records are not loaded at all; T-017 (ב)+(ג) and the
 * digest's own § 3 say they are loaded and gated later. Rather than guess, we
 * measure both and let the PM rule.
 */
export interface CoveragePolicy {
  readonly includeLowConfidence: boolean;
  readonly includePointed: boolean;
}

export const STRICT_POLICY: CoveragePolicy = {
  includeLowConfidence: false,
  includePointed: false,
};

export const LENIENT_POLICY: CoveragePolicy = {
  includeLowConfidence: true,
  includePointed: true,
};

export interface SourceCoverage {
  readonly id: string;
  readonly label: string;
  readonly covered: number;
  readonly total: number;
  readonly percent: number;
  readonly acceptedGlosses: number;
  readonly rejectedGlosses: number;
}

export interface CoverageReport {
  readonly policy: CoveragePolicy;
  readonly headwordCount: number;
  readonly perSource: readonly SourceCoverage[];
  readonly combined: {
    readonly covered: number;
    readonly total: number;
    readonly percent: number;
  };
  readonly uncovered: readonly string[];
}

function pct(part: number, whole: number): number {
  if (whole === 0) return 0;
  return Math.round((part / whole) * 10000) / 100;
}

function accepts(policy: CoveragePolicy, he: string): boolean {
  const v = classifyGloss(asRawGloss(he));
  if (v.kind === 'drop') return false;
  if (!policy.includeLowConfidence && v.confidence === 'low') return false;
  if (!policy.includePointed && v.flags.includes('pointed')) return false;
  return true;
}

export function measureCoverage(
  headwords: readonly string[],
  sources: readonly LexicalSource[],
  policy: CoveragePolicy,
): CoverageReport {
  // Normalised key -> the first original spelling seen. The report has to name
  // headwords the way Roy will read them, not the way we index them.
  const keyed = new Map<string, string>();
  for (const raw of headwords) {
    const key = normalizeEnglish(raw);
    if (key === '') continue;
    if (!keyed.has(key)) keyed.set(key, raw);
  }
  const total = keyed.size;

  const coveredAnywhere = new Set<string>();
  const perSource: SourceCoverage[] = [];

  for (const source of sources) {
    const hit = new Set<string>();
    let accepted = 0;
    let rejected = 0;

    for (const entry of source.entries) {
      if (!accepts(policy, entry.he)) {
        rejected += 1;
        continue;
      }
      accepted += 1;
      const key = normalizeEnglish(entry.en);
      if (keyed.has(key)) {
        hit.add(key);
        coveredAnywhere.add(key);
      }
    }

    perSource.push({
      id: source.id,
      label: source.label,
      covered: hit.size,
      total,
      percent: pct(hit.size, total),
      acceptedGlosses: accepted,
      rejectedGlosses: rejected,
    });
  }

  const uncovered = [...keyed.keys()]
    .filter((key) => !coveredAnywhere.has(key))
    .sort()
    .map((key) => keyed.get(key) as string);

  return {
    policy,
    headwordCount: total,
    perSource,
    combined: {
      covered: coveredAnywhere.size,
      total,
      percent: pct(coveredAnywhere.size, total),
    },
    uncovered,
  };
}
```

- [x] **Step 4: Run the test and confirm it passes**

Run: `npx vitest run lib/core/coverage.test.ts`
Expected: PASS, 14 tests.

- [x] **Step 5: Prove the tests can fail — three mutations**

1. In `accepts`, delete the `if (v.kind === 'drop') return false;` line.
   Expected: **`a GAP gloss is not coverage` fails** — covered becomes 1.
2. Change `coveredAnywhere.size` in `combined` to `perSource.reduce((n, s) => n + s.covered, 0)`.
   Expected: **`combined coverage is the union` fails** — 3 instead of 2.
3. In the `uncovered` map, return `key` instead of `keyed.get(key)`.
   Expected: **`reports the ORIGINAL spelling` fails** — `'house'` instead of `'  House '`.

Record the real output of each. A mutation that stays green means the test is not measuring what it claims.

- [x] **Step 6: Run the full gate**

Run: `npm run typecheck && npm run check:core && npm test`
Expected: typecheck clean · `/lib/core purity: OK` · suite green.

- [x] **Step 7: Commit**

```bash
git add lib/core/coverage.ts lib/core/coverage.test.ts
git commit -m "loop(DEV): T-013/T-016 source-agnostic coverage measurement"
```

---

### Task 3: parsers, the runner, and the data contract (T-013 · T-016 delivery)

**Files:**
- Create: `lib/core/sources.ts`
- Test: `lib/core/sources.test.ts`
- Create: `scripts/measure-coverage.mjs`
- Test: `scripts/measure-coverage.test.ts`
- Create: `data/README.md`
- Modify: `package.json` (add one script)
- Modify: `docs/api-contract.md` (a "not an endpoint" note — see Step 8)

**Interfaces:**
- Consumes: `SourceEntry`, `LexicalSource`, `measureCoverage`, `STRICT_POLICY`, `LENIENT_POLICY`, `CoverageReport` from `./coverage`; `normalizeEnglish` from `./lexicon`.
- Produces:
```ts
export interface ParseResult {
  readonly entries: readonly SourceEntry[];
  readonly lines: number;
  readonly skipped: number;
}
export function parsePairsTsv(text: string): ParseResult;
export function parseKaikkiJsonl(text: string, targetLang: string): ParseResult;
export function parseNgslCsv(text: string): { readonly headwords: readonly string[]; readonly rows: number };
export const MAX_SKIP_RATE: number;
export function skipRate(r: ParseResult): number;
export function renderReportMarkdown(strict: CoverageReport, lenient: CoverageReport, generatedAt: string): string;
```

**The honesty rule this task exists to enforce.** TD-17 means no agent has ever seen these files. A parser written blind against an unseen format fails in exactly one way — it silently yields zero entries and the report announces "0% coverage", which reads like a finding about Hebrew and is actually a finding about our parser. So every parser counts the lines it could not use, and the runner **refuses to print a percentage** for a source whose skip rate exceeds `MAX_SKIP_RATE` (0.5%). A missing file prints `unavailable`, never `0%`.

- [x] **Step 1: Write the failing parser test**

Create `lib/core/sources.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  MAX_SKIP_RATE,
  parseKaikkiJsonl,
  parseNgslCsv,
  parsePairsTsv,
  renderReportMarkdown,
  skipRate,
} from './sources';
import { STRICT_POLICY, LENIENT_POLICY, measureCoverage } from './coverage';

const SEFER = 'ספר';
const BAYIT = 'בית';

describe('parsePairsTsv', () => {
  it('reads two tab-separated columns', () => {
    const r = parsePairsTsv(`book\t${SEFER}\nhouse\t${BAYIT}\n`);
    expect(r.entries).toEqual([
      { en: 'book', he: SEFER },
      { en: 'house', he: BAYIT },
    ]);
    expect(r.skipped).toBe(0);
  });

  it('skips a header line, blank lines and # comments without counting them as data', () => {
    const r = parsePairsTsv(`# source: H1\nen\the\n\nbook\t${SEFER}\n`);
    expect(r.entries).toEqual([{ en: 'book', he: SEFER }]);
    expect(r.skipped).toBe(0);
  });

  it('counts a one-column line as skipped rather than throwing', () => {
    const r = parsePairsTsv(`book\nhouse\t${BAYIT}\n`);
    expect(r.entries).toEqual([{ en: 'house', he: BAYIT }]);
    expect(r.skipped).toBe(1);
    expect(r.lines).toBe(2);
  });

  it('keeps only the first two columns when a source carries extras', () => {
    const r = parsePairsTsv(`book\t${SEFER}\tnoun\t0.91\n`);
    expect(r.entries).toEqual([{ en: 'book', he: SEFER }]);
  });
});

describe('parseKaikkiJsonl', () => {
  it('pulls he translations out of one JSON object per line', () => {
    const line = JSON.stringify({
      word: 'book',
      lang_code: 'en',
      translations: [
        { lang_code: 'he', word: SEFER },
        { lang_code: 'fr', word: 'livre' },
      ],
    });
    const r = parseKaikkiJsonl(line + '\n', 'he');
    expect(r.entries).toEqual([{ en: 'book', he: SEFER }]);
    expect(r.skipped).toBe(0);
  });

  it('accepts the legacy `code` key as well as `lang_code`', () => {
    const line = JSON.stringify({
      word: 'house',
      translations: [{ code: 'he', word: BAYIT }],
    });
    expect(parseKaikkiJsonl(line + '\n', 'he').entries).toEqual([
      { en: 'house', he: BAYIT },
    ]);
  });

  it('emits one entry per translation when a word has several', () => {
    const line = JSON.stringify({
      word: 'home',
      translations: [
        { lang_code: 'he', word: BAYIT },
        { lang_code: 'he', word: SEFER },
      ],
    });
    expect(parseKaikkiJsonl(line + '\n', 'he').entries).toHaveLength(2);
  });

  it('an entry with no he translation is NOT a skip — it is a real absence', () => {
    const line = JSON.stringify({
      word: 'book',
      translations: [{ lang_code: 'fr', word: 'livre' }],
    });
    const r = parseKaikkiJsonl(line + '\n', 'he');
    expect(r.entries).toEqual([]);
    expect(r.skipped).toBe(0);
    expect(r.lines).toBe(1);
  });

  it('unparsable JSON is a skip, and does not abort the whole file', () => {
    const good = JSON.stringify({
      word: 'book',
      translations: [{ lang_code: 'he', word: SEFER }],
    });
    const r = parseKaikkiJsonl(`{not json\n${good}\n`, 'he');
    expect(r.entries).toHaveLength(1);
    expect(r.skipped).toBe(1);
    expect(r.lines).toBe(2);
  });

  it('a line missing the word field is a skip', () => {
    const r = parseKaikkiJsonl(
      JSON.stringify({ translations: [{ lang_code: 'he', word: SEFER }] }) + '\n',
      'he',
    );
    expect(r.skipped).toBe(1);
  });
});

describe('parseNgslCsv', () => {
  it('reads the headword column by name, not by position', () => {
    const csv = 'rank,headword,sfi\n1,the,88.2\n2,be,84.1\n';
    expect(parseNgslCsv(csv).headwords).toEqual(['the', 'be']);
    expect(parseNgslCsv(csv).rows).toBe(2);
  });

  it('tolerates quoted fields and a BOM', () => {
    const csv = '﻿"rank","headword","sfi"\n1,"the",88.2\n';
    expect(parseNgslCsv(csv).headwords).toEqual(['the']);
  });

  it('throws a NAMED error when the headword column is absent', () => {
    expect(() => parseNgslCsv('rank,word,sfi\n1,the,88.2\n')).toThrow(
      /headword column/i,
    );
  });
});

describe('skipRate', () => {
  it('is 0 for an empty file rather than NaN', () => {
    expect(skipRate({ entries: [], lines: 0, skipped: 0 })).toBe(0);
  });

  it('is the skipped fraction of lines', () => {
    expect(skipRate({ entries: [], lines: 200, skipped: 1 })).toBe(0.005);
  });

  it('MAX_SKIP_RATE is 0.5% — a parser that misses more than that is broken', () => {
    expect(MAX_SKIP_RATE).toBe(0.005);
  });
});

describe('renderReportMarkdown', () => {
  const sources = [
    { id: 'H1', label: 'Hebrew Wordnet', entries: [{ en: 'book', he: SEFER }] },
  ];
  const strict = measureCoverage(['book', 'house'], sources, STRICT_POLICY);
  const lenient = measureCoverage(['book', 'house'], sources, LENIENT_POLICY);
  const md = renderReportMarkdown(strict, lenient, '2026-01-01T00:00:00Z');

  it('names both policies so the reader knows two numbers exist', () => {
    expect(md).toContain('STRICT');
    expect(md).toContain('LENIENT');
  });

  it('states the measured percentage', () => {
    expect(md).toContain('50%');
  });

  it('lists the uncovered headwords', () => {
    expect(md).toContain('house');
  });

  it('carries the caveat that this is a measurement, not a source choice', () => {
    expect(md).toMatch(/R-005/);
  });

  it('embeds the timestamp it was handed and never invents one', () => {
    expect(md).toContain('2026-01-01T00:00:00Z');
  });
});
```

- [x] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/core/sources.test.ts`
Expected: FAIL — `Failed to resolve import "./sources"`.

- [x] **Step 3: Write `lib/core/sources.ts`**

```ts
/**
 * Text -> entries. Pure: these functions take the CONTENTS of a file, never a
 * path. All file reading lives in scripts/measure-coverage.mjs.
 *
 * Every parser reports `skipped`. No agent in this loop has seen the real
 * source files (TD-17 blocks every data domain), so a parser that quietly
 * yields nothing would produce a "0% coverage" headline that is a bug report
 * about us, not a fact about Hebrew. The runner refuses to print a percentage
 * above MAX_SKIP_RATE.
 */

import type { CoverageReport, SourceEntry } from './coverage';

export interface ParseResult {
  readonly entries: readonly SourceEntry[];
  readonly lines: number;
  readonly skipped: number;
}

/** A parser that misses more than 0.5% of its input is broken, not lossy. */
export const MAX_SKIP_RATE = 0.005;

export function skipRate(r: ParseResult): number {
  if (r.lines === 0) return 0;
  return r.skipped / r.lines;
}

function dataLines(text: string): string[] {
  return text
    .replace(/^﻿/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '' && !l.trimStart().startsWith('#'));
}

const TSV_HEADER = /^(en|english|source|word|headword)\t/i;

export function parsePairsTsv(text: string): ParseResult {
  const entries: SourceEntry[] = [];
  let lines = 0;
  let skipped = 0;

  for (const line of dataLines(text)) {
    if (TSV_HEADER.test(line)) continue;
    lines += 1;
    const cols = line.split('\t');
    const en = (cols[0] ?? '').trim();
    const he = (cols[1] ?? '').trim();
    if (en === '' || he === '') {
      skipped += 1;
      continue;
    }
    entries.push({ en, he });
  }

  return { entries, lines, skipped };
}

interface KaikkiTranslation {
  lang_code?: unknown;
  code?: unknown;
  word?: unknown;
}

export function parseKaikkiJsonl(text: string, targetLang: string): ParseResult {
  const entries: SourceEntry[] = [];
  let lines = 0;
  let skipped = 0;

  for (const line of dataLines(text)) {
    lines += 1;
    let doc: unknown;
    try {
      doc = JSON.parse(line);
    } catch {
      skipped += 1;
      continue;
    }
    if (typeof doc !== 'object' || doc === null) {
      skipped += 1;
      continue;
    }
    const record = doc as { word?: unknown; translations?: unknown };
    const en = typeof record.word === 'string' ? record.word.trim() : '';
    if (en === '') {
      skipped += 1;
      continue;
    }
    // A word with no Hebrew translation is a genuine absence, not a parse
    // failure — it is exactly what we are here to count.
    if (!Array.isArray(record.translations)) continue;

    for (const t of record.translations as KaikkiTranslation[]) {
      if (typeof t !== 'object' || t === null) continue;
      const lang = typeof t.lang_code === 'string' ? t.lang_code : t.code;
      if (lang !== targetLang) continue;
      const he = typeof t.word === 'string' ? t.word.trim() : '';
      if (he === '') continue;
      entries.push({ en, he });
    }
  }

  return { entries, lines, skipped };
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') {
        quoted = false;
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
  return out.map((f) => f.trim());
}

export function parseNgslCsv(text: string): {
  readonly headwords: readonly string[];
  readonly rows: number;
} {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) throw new Error('NGSL file is empty');

  const header = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  const col = header.indexOf('headword');
  if (col === -1) {
    throw new Error(
      `NGSL file has no headword column — found [${header.join(', ')}]. See data/README.md`,
    );
  }

  const headwords: string[] = [];
  for (const line of lines.slice(1)) {
    const value = (splitCsvLine(line)[col] ?? '').trim();
    if (value !== '') headwords.push(value);
  }
  return { headwords, rows: headwords.length };
}

function policyRows(report: CoverageReport): string {
  const rows = report.perSource.map(
    (s) =>
      `| ${s.id} | ${s.label} | ${s.covered} / ${s.total} | **${s.percent}%** | ${s.acceptedGlosses} | ${s.rejectedGlosses} |`,
  );
  rows.push(
    `| — | **משולב (איחוד)** | ${report.combined.covered} / ${report.combined.total} | **${report.combined.percent}%** | — | — |`,
  );
  return rows.join('\n');
}

export function renderReportMarkdown(
  strict: CoverageReport,
  lenient: CoverageReport,
  generatedAt: string,
): string {
  return `# מדידת כיסוי עברית — R-005

> נוצר אוטומטית על ידי \`npm run measure:coverage\` בתאריך ${generatedAt}.
> ⛔ **זו מדידה בלבד (T-013 · T-016).** אין כאן בחירת מקור ואין כאן תרגום —
> ההכרעה על מקור התרגום היא של ה-PM על בסיס המספרים האלה. R-005.
> שני המספרים מוצגים כי \`plan/15-syllabus-digest.md\` § 2 ו-T-017 סותרים זה את זה — ראה F-021.

## STRICT — לפי התמצית § 2 (רשומת \`!\` ורשומה מנוקדת אינן נטענות)

| מקור | שם | מכוסות | אחוז | גלוסות שהתקבלו | גלוסות שנדחו |
|---|---|---|---|---|---|
${policyRows(strict)}

## LENIENT — לפי T-017 (ב)+(ג) ו-D-013 (נטענות, ומסוננות בתצוגה)

| מקור | שם | מכוסות | אחוז | גלוסות שהתקבלו | גלוסות שנדחו |
|---|---|---|---|---|---|
${policyRows(lenient)}

## מילים שאף מקור אינו מכסה (STRICT) — ${strict.uncovered.length}

${strict.uncovered.length === 0 ? '_אין._' : strict.uncovered.map((w) => `- ${w}`).join('\n')}
`;
}
```

- [x] **Step 4: Run the parser test and confirm it passes**

Run: `npx vitest run lib/core/sources.test.ts`
Expected: PASS, 20 tests.

- [x] **Step 5: Write `data/README.md` — the contract for the files Roy has to add**

```markdown
# data/ — source files that agents cannot fetch

TD-17: every external data domain returns `403 host_not_allowed` from the loop
environment. Measured C-0016, measured again C-0019. **No agent may work around
this** — ⛔ no mirrors, ⛔ no archives (R-004). The files below arrive through the
repo, by Roy. This is T-043.

`npm run measure:coverage` reports `unavailable` for any file that is absent.
It never reports `0%` for a missing file — those mean opposite things.

| file | source | licence | format |
|---|---|---|---|
| `ngsl-1.2.csv` | `newgeneralservicelist.com` **only** — R-004 | CC BY-SA 4.0 | CSV with a column literally named `headword`. **Must contain exactly 2,809 rows** (T-012 · F-005). |
| `h1-hebrew-wordnet.tsv` | Hebrew Wordnet, Univ. of Haifa | permissive, no share-alike (verified C-0001, H1g) | 2 columns, tab separated: `english<TAB>hebrew`. One line per gloss. `GAP` and `!` markers preserved verbatim — the filter is ours (T-017), not the exporter's. |
| `h2-wiktionary-en-he.tsv` | English Wiktionary EN→HE | CC BY-SA | same 2-column TSV as above. |
| `h3-kaikki-en.jsonl` | kaikki.org / wiktextract | CC BY-SA | JSON Lines. One object per line with `word` and `translations: [{ lang_code, word }]`. |
| `h4-word2word-en-he.tsv` | word2word | Apache-2.0 | same 2-column TSV as above. |

## Converting a source to the 2-column TSV

Out of scope for this plan on purpose. H1 and H4 do not ship in this shape, and
**no agent has ever seen the real distribution** — writing a converter blind is
how you get a parser bug that reads as a fact about Hebrew. Whoever converts
records the exact command they ran in this file, next to the row above.

## Licence attribution

Every source here carries an attribution obligation. `T-011` builds
`/docs/data-licenses.md` and the in-product `/sources` page from this table.
```

- [x] **Step 6: Write the runner `scripts/measure-coverage.mjs`**

```js
#!/usr/bin/env node
/**
 * Runs the Hebrew coverage measurement (T-013 · T-016 · R-005).
 *
 * This is the ONLY impure layer: it reads files and writes one. All arithmetic
 * lives in lib/core/{lexicon,coverage,sources}.ts and is unit tested.
 *
 * ⛔ It does not download anything. TD-17 blocks every data domain; the files
 * come through the repo (T-043, see data/README.md).
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
require_('tsx/cjs'); // see Step 7 note

const { measureCoverage, STRICT_POLICY, LENIENT_POLICY } = require_('../lib/core/coverage.ts');
const {
  MAX_SKIP_RATE,
  parseKaikkiJsonl,
  parseNgslCsv,
  parsePairsTsv,
  renderReportMarkdown,
  skipRate,
} = require_('../lib/core/sources.ts');

const DATA = 'data';
const OUT = join('docs', 'coverage-report.md');
const NGSL_EXPECTED_ROWS = 2809;

const SOURCES = [
  { id: 'H1', label: 'Hebrew Wordnet', file: 'h1-hebrew-wordnet.tsv', parse: parsePairsTsv },
  { id: 'H2', label: 'Wiktionary EN→HE', file: 'h2-wiktionary-en-he.tsv', parse: parsePairsTsv },
  { id: 'H3', label: 'Kaikki / wiktextract', file: 'h3-kaikki-en.jsonl', parse: (t) => parseKaikkiJsonl(t, 'he') },
  { id: 'H4', label: 'word2word', file: 'h4-word2word-en-he.tsv', parse: parsePairsTsv },
];

function fail(message) {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

const ngslPath = join(DATA, 'ngsl-1.2.csv');
if (!existsSync(ngslPath)) {
  fail(
    `${ngslPath} is missing, so there is nothing to measure coverage OF.\n` +
      `  This is T-043 — a human action. See data/README.md.\n` +
      `  ⛔ Do not download it: TD-17 blocks the domain and R-004 forbids mirrors.`,
  );
}

const ngsl = parseNgslCsv(readFileSync(ngslPath, 'utf8'));
if (ngsl.rows !== NGSL_EXPECTED_ROWS) {
  fail(
    `${ngslPath} has ${ngsl.rows} rows, expected exactly ${NGSL_EXPECTED_ROWS} (NGSL v1.2).\n` +
      `  2,801 is the early version from the domain we do not control (R-004 · F-005).`,
  );
}

const loaded = [];
for (const s of SOURCES) {
  const path = join(DATA, s.file);
  if (!existsSync(path)) {
    console.log(`  ${s.id} ${s.label}: unavailable (${path} not present)`);
    continue;
  }
  const parsed = s.parse(readFileSync(path, 'utf8'));
  const rate = skipRate(parsed);
  if (rate > MAX_SKIP_RATE) {
    fail(
      `${s.id} parser skipped ${parsed.skipped}/${parsed.lines} lines (${(rate * 100).toFixed(2)}%),\n` +
        `  above the ${(MAX_SKIP_RATE * 100).toFixed(1)}% ceiling. The FORMAT does not match data/README.md.\n` +
        `  Refusing to report a coverage number computed from a file we cannot read.`,
    );
  }
  console.log(
    `  ${s.id} ${s.label}: ${parsed.entries.length} glosses, ${parsed.skipped}/${parsed.lines} lines skipped`,
  );
  loaded.push({ id: s.id, label: s.label, entries: parsed.entries });
}

if (loaded.length === 0) {
  fail('No translation source files present. See data/README.md (T-043).');
}

const strict = measureCoverage(ngsl.headwords, loaded, STRICT_POLICY);
const lenient = measureCoverage(ngsl.headwords, loaded, LENIENT_POLICY);

mkdirSync('docs', { recursive: true });
writeFileSync(OUT, renderReportMarkdown(strict, lenient, new Date().toISOString()), 'utf8');

console.log(`\nSTRICT  combined: ${strict.combined.percent}% (${strict.combined.covered}/${strict.combined.total})`);
console.log(`LENIENT combined: ${lenient.combined.percent}% (${lenient.combined.covered}/${lenient.combined.total})`);
console.log(`uncovered (STRICT): ${strict.uncovered.length}`);
console.log(`\nWrote ${OUT}`);
```

> ⚠️ **שונה בביצוע C-0024 — `tsx` לא הותקן.** נמדד: Node v22.22.2 מפשיט טיפוסים מעצמו, אבל **אינו פותר מפרט חסר-סיומת** — `import ... from './lexicon'` בתוך `coverage.ts` נפל ב-`ERR_MODULE_NOT_FOUND`. לכן במקום `createRequire('tsx/cjs')` נרשם וו-רזולוציה יחיד (`registerHooks` מ-`node:module`, Node ≥ 22.15) שמוסיף `.ts` למפרט יחסי חסר-סיומת, ומצהיר `format: 'module-typescript'` כדי לחסום את אזהרת `MODULE_TYPELESS_PACKAGE_JSON` שהייתה מזהמת כל ריצה. **אפס תלויות חדשות.** דרישת ה-Node מתועדת ב-`data/README.md`.

**Note on `require_('tsx/cjs')`:** the runner needs to import TypeScript from a
`.mjs` file. `tsx` is **not** currently a dependency. If `npm ls tsx` shows it
absent, install it as a **devDependency** (`npm i -D tsx`) in this task and say
so in the commit message. If a `--experimental-strip-types` path works on the
Node version in the environment (`node --version`), prefer it and delete the
`createRequire` block — fewer dependencies is better. **Verify which one works
by running it**; do not assume.

- [x] **Step 7: Write the wiring guard `scripts/measure-coverage.test.ts`**

Same shape as `scripts/verify-mobile.test.ts`: it guards the wiring, not the arithmetic.

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const RUNNER = readFileSync('scripts/measure-coverage.mjs', 'utf8');
const PKG = JSON.parse(readFileSync('package.json', 'utf8')) as {
  scripts: Record<string, string>;
};
const DATA_README = readFileSync('data/README.md', 'utf8');

describe('measure-coverage wiring', () => {
  it('is reachable as npm run measure:coverage', () => {
    expect(PKG.scripts['measure:coverage']).toContain('measure-coverage.mjs');
  });

  it('is NOT in verify — it needs data files that are not in the repo', () => {
    expect(PKG.scripts.verify).not.toContain('measure:coverage');
  });

  it('never fetches: TD-17 blocks the domains and R-004 forbids mirrors', () => {
    expect(RUNNER).not.toMatch(/\bfetch\s*\(/);
    expect(RUNNER).not.toMatch(/https?:\/\//);
  });

  it('pins the NGSL row count to 2,809, not 2,801 (F-005)', () => {
    expect(RUNNER).toContain('2809');
    expect(RUNNER).not.toContain('2801');
  });

  it('measures BOTH policies so F-021 cannot block the number', () => {
    expect(RUNNER).toContain('STRICT_POLICY');
    expect(RUNNER).toContain('LENIENT_POLICY');
  });

  it('data/README.md names every file the runner looks for', () => {
    for (const file of [
      'ngsl-1.2.csv',
      'h1-hebrew-wordnet.tsv',
      'h2-wiktionary-en-he.tsv',
      'h3-kaikki-en.jsonl',
      'h4-word2word-en-he.tsv',
    ]) {
      expect(RUNNER, `runner should reference ${file}`).toContain(file);
      expect(DATA_README, `data/README.md should document ${file}`).toContain(file);
    }
  });
});
```

Add to `package.json` scripts, immediately after `check:mobile`:

```json
"measure:coverage": "node scripts/measure-coverage.mjs",
```

⛔ **Do not add it to `verify`.** `verify` must pass on a clean checkout, and these files are not in the repo.

- [x] **Step 8: Run it against a synthetic `data/` and confirm it behaves**

The point is to prove the runner's failure paths are real before any real data exists.

```bash
mkdir -p /tmp/covfix
# a) missing NGSL -> named error mentioning T-043
node scripts/measure-coverage.mjs ; echo "exit=$?"
```
Expected: exit 1, message names `data/ngsl-1.2.csv` and T-043.

```bash
# b) wrong row count -> named error mentioning F-005
mkdir -p data && printf 'rank,headword,sfi\n1,the,88.2\n' > data/ngsl-1.2.csv
node scripts/measure-coverage.mjs ; echo "exit=$?"
```
Expected: exit 1, `has 1 rows, expected exactly 2809`.

```bash
# c) correct count, one source -> a real report
node -e "let s='rank,headword,sfi\n';for(let i=1;i<=2809;i++)s+=i+',w'+i+',1\n';require('fs').writeFileSync('data/ngsl-1.2.csv',s)"
printf 'w1\tספר\nw2\tGAP\nw3\t!בית\n' > data/h1-hebrew-wordnet.tsv
node scripts/measure-coverage.mjs ; echo "exit=$?"
```
Expected: exit 0. STRICT combined 1/2809, LENIENT combined 2/2809, `docs/coverage-report.md` written with both tables.

```bash
# d) a file the parser cannot read -> refuses to print a number
printf 'w1\nw2\nw3\n' > data/h2-wiktionary-en-he.tsv
node scripts/measure-coverage.mjs ; echo "exit=$?"
```
Expected: exit 1, `H2 parser skipped 3/3 lines (100.00%)`. **This is the whole point of the task** — a broken parser must not be reported as 0% coverage.

```bash
# clean up: these are synthetic and must NOT be committed
rm -rf data/ngsl-1.2.csv data/h1-hebrew-wordnet.tsv data/h2-wiktionary-en-he.tsv docs/coverage-report.md
```

Add to `.gitignore` (create the entry if the file exists, otherwise create it):

```
data/*.csv
data/*.tsv
data/*.jsonl
docs/coverage-report.md
```

⚠️ **`data/README.md` must stay tracked** — verify with `git status` that it is still staged after adding the ignore rules.

Append to `docs/api-contract.md`, under a new heading at the end:

```markdown
## Not an endpoint: `npm run measure:coverage`

A local batch script (`scripts/measure-coverage.mjs`), never reachable over HTTP
and never called at request time. It reads `data/` and writes
`docs/coverage-report.md`. Documented here so a future reader looking for where
coverage numbers come from does not go hunting for a route.
```

- [x] **Step 9: Run the full gate**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: typecheck clean · `/lib/core purity: OK` · suite green · build succeeds.

⚠️ `check:core` is the one most likely to bite here: `lib/core/sources.ts` must contain **no** `readFileSync`, no path handling, no `fetch`. If it flags anything, the I/O has leaked into core — move it into the runner, do not weaken the checker.

- [x] **Step 10: Commit**

```bash
git add lib/core/sources.ts lib/core/sources.test.ts \
        scripts/measure-coverage.mjs scripts/measure-coverage.test.ts \
        data/README.md package.json .gitignore docs/api-contract.md
git commit -m "loop(DEV): T-013/T-016 source parsers + coverage runner (data pending T-043)"
```

---

## Closing the sequence

After Task 3, in the same tick as the last commit:

- [x] `plan/50-tasks.md`: T-017 → ✅ (fully delivered — the filter exists and is enforced by type). T-013 and T-016 → 🟣 **with an explicit caveat**: *"קוד המדידה נבנה ונבדק; המספר עצמו ממתין ל-T-043"*. ⛔ Do **not** mark them ✅ — the task text asks for a number and there is no number yet.
- [x] `plan/50-tasks.md` T-043: extend the file list to the four translation sources as well as the three level sources. Today it names only NGSL/CEFR-J/Octanove, so even if Roy acts on it exactly as written, the coverage measurement still cannot run.
- [x] `plan/60-findings.md`: **F-021 was already opened in the planning tick (C-0020)** — do not open it a second time. Mark it טופל only if the PM has answered by then.
- [x] `plan/30-architecture.md`: record that `lib/core/{lexicon,coverage,sources}.ts` is the measurement layer and that `scripts/` owns all file I/O for it.
- [x] `plan/00-control.md`: bump `CYCLE_ID`, set `ACTIVE_TASK_ID`, `NEXT_AGENT=CRITIC`, release the lock, add the handoff row.

### F-021 — to be opened against the PM

**Severity:** 🟠 HIGH · **File:** `plan/15-syllabus-digest.md` §§ 110–116 · **Opened by:** DEV

Two gaps, both blocking:

1. **§ 1.7.1 is absent from the digest.** T-018 (*"מימוש כלל הקליטה של 1.7.1"*) cannot be planned or executed. Dev is forbidden from reading `plan/10-pedagogy.md`, and 10-pedagogy marks 1.7.1 *"⛔ סטייה ממנו = תוכן לימודי מומצא"* — so guessing it is the one thing worse than not doing it. **T-018 stays ⬜ and unplanned until T-020 lands.** This is the fourth task on the T-023 critical path, and it is the one that closes R-006.
2. **The digest contradicts itself and contradicts T-017.** § 2 says `!` records and pointed records *"אינם נטענים"*; § 3 (D-013) says a `low` record *"אינה מוצגת ללומד, גם אם נטענה"* — which presupposes it was loaded; T-017 (ב)+(ג) also says loaded-and-gated. Two of three sources agree against § 2.

**How this plan handles it without guessing:** the policy is data, not logic. `measureCoverage()` takes a `CoveragePolicy` and the runner prints the coverage number under **both** readings. Whichever way the PM rules, no code changes and no measurement is repeated. **The ruling is still needed** — it decides what the ingestion pipeline (T-035/T-037) actually stores.

---

## Self-review

**Spec coverage.** T-017 → Task 1, all four sub-rules: (א) GAP dropped, (ב) `!` → low confidence, (ג) niqqud stripped for `match` and kept in `display`, (ד) `translation_confidence` on every row via `GlossVerdict.confidence`. The demanded "test that fails if a GAP or `!` record reaches the display layer" is `displayableGloss` plus the `RawGloss` brand — a compile-time barrier, since no display consumer exists yet to test at runtime. T-013 → Tasks 2+3 for H1/H2. T-016 → Tasks 2+3 for H3/H4; identical output contract, as the task text requires. T-018 → **explicitly out of scope**, with F-021 raised. All three required outputs (per-source %, combined %, uncovered list) are in `CoverageReport` and in `renderReportMarkdown`.

**Placeholder scan.** No `TODO`, no "appropriate error handling", no "tests like task N". Every test body and every implementation body is written out. The two knowingly-deferred items are named and justified rather than hand-waved: the H1/H4 format conversion (Step 5, `data/README.md`) and the `tsx`-vs-`--experimental-strip-types` choice (Step 6), which is deferred **to a measurement** — "verify which one works by running it" — not to judgement.

**Type consistency.** `SourceEntry` is defined once in `coverage.ts` and imported by `sources.ts` (`import type`, so no cycle at runtime). `RawGloss`/`asRawGloss`/`classifyGloss`/`displayableGloss` are named identically in Task 1's interface block, its implementation, and Task 2's `accepts()`. `ParseResult` has the same three fields in the interface block, the implementation, and every `skipRate` test. `MAX_SKIP_RATE` is `0.005` in the implementation, in the test that pins it, and in the runner's ceiling message.
