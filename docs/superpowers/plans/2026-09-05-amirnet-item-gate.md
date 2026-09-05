# Amirnet Item Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land `T-223` — the gate that opens content commission K-006 (amirnet practice items) — as a pure, tested module plus the CLI command `npm run measure:amirnet-gate` that F-163 requires before any gate counts as real.

**Architecture:** Three self-contained pieces, in the same pattern as `lib/core/storyQuestionGate.ts` and `lib/core/messageGate.ts`: (1) a pure per-item gate that checks one `sc`/`rs`/`rs` item or one `rc` question against its own passage, (2) a pure chapter gate that checks the five-questions-share-one-passage rule that only makes sense across a group, (3) an impure CLI script that scans `data/generated/amirnet-items-*.jsonl` (a new batch-file naming convention, following the existing `batch-*.jsonl` precedent) and reports pass/fail counts, gracefully reporting zero when CONTENT has not written anything yet — content is still blocked on this very gate landing.

**Tech Stack:** TypeScript (`lib/core/`, zero React/DOM/fetch/env — Core Purity gate, `scripts/check-core-purity.mjs`), Vitest, a plain Node `.mjs` script using the same `registerHooks`/`.ts`-resolution pattern already established in `scripts/measure-gate.mjs` (no dependency, no new tooling).

**Spec:** `plan/41-amirnet-spec.md § 6.4` (distractor rules) · `§ 6.5` (item schema) · `docs/content-amirnet-items-brief.md § 4` (distractor rules, content-agent phrasing) · `§ 6` (exactly what this gate must enforce, and what it explicitly does not) · `data/amirnet-vocab-README.md` (the CEFR tier source `T-222` already built, `data/generated/amirnet-vocab.csv`).

## Global Constraints

- `lib/core/` is PURE — zero React, window, document, localStorage, fetch, `process.env` (`RULES` · Core Purity gate).
- `source` is `"original"` always — no other value is ever valid (`41 § 6.5`).
- The gate enforces only what is deterministic. It explicitly does **not** attempt to judge whether an item is actually at the level it declares, whether it echoes a commercial exam question, or sensitive-topic content in `rc` passages — those stay human/Critic judgment (`docs/content-amirnet-items-brief.md § 6`, points 1–3). Do not add checks for these.
- Every distractor (all 4 option slots, including the correct one) carries a non-empty declared reason — `§ 6.4` rule 5, `§ 6.5`.
- `npm run measure:amirnet-gate` must exist in `package.json` before this task is marked done — F-163: "a gate with no command in the repo is a sentence, not a gate."
- Do **not** use or paraphrase the calibration examples in `plan/41-amirnet-spec.md § 6.3` anywhere, including in tests — the brief forbids product use AND variations of them. All test fixtures in this plan are written fresh.
- ⛔ **NOT an extension** of `T-012`/`T-013`/`T-016` (the Hebrew-coverage measurement work on `lib/core/coverage.ts`/`lib/core/sources.ts`). Nothing in this plan modifies those files or `scripts/measure-coverage.mjs`; both scripts merely share the same `registerHooks` `.ts`-import technique, cited above only as prior art for a plain Node script importing a TypeScript module directly.

## File Structure

| File | Responsibility |
|---|---|
| `lib/core/amirnetItemGate.ts` | Create. Pure per-item gate — the 11 deterministic checks `docs/content-amirnet-items-brief.md § 6` lists for one `sc`/`rs` item or one `rc` question. |
| `lib/core/amirnetItemGate.test.ts` | Create. Full negative control (one broken fixture per `AmirnetGateReason`) plus a passing `sc` and a passing `rc` fixture. |
| `lib/core/amirnetChapterGate.ts` | Create. Pure chapter-level gate — the two rules only a group of 5 `rc` questions can expose (shared passage/level, `correctIndex` spread) — built on top of `amirnetItemGate`. |
| `lib/core/amirnetChapterGate.test.ts` | Create. Negative control for the chapter-only reasons, plus a passing 5-question chapter. |
| `scripts/measure-amirnet-gate.mjs` | Create. The impure CLI driver — scans `data/generated/amirnet-items-*.jsonl`, gates every item/chapter, writes `docs/amirnet-gate-report.md`. Zero files is a clean, non-failing report (content is still blocked on this task landing). |
| `scripts/measure-amirnet-gate.test.ts` | Create. Runs the CLI end-to-end against temp fixture directories: zero files, one passing `sc` item, one broken item, one `rc` chapter. |
| `package.json` | Modify. Adds the `measure:amirnet-gate` script entry (F-163). |
| `docs/amirnet-gate-report.md` | Create (generated). Written by running the CLI for real once in Task 3, Step 6; committed alongside the code that produces it. |

---

### Task 1: Per-item gate — `lib/core/amirnetItemGate.ts`

**Files:**
- Create: `lib/core/amirnetItemGate.ts`
- Test: `lib/core/amirnetItemGate.test.ts`

**Interfaces:**
- Produces (consumed by Task 2 and Task 3):
  ```ts
  export type AmirnetItemType = 'sc' | 'rs' | 'rc';

  export interface AmirnetOption {
    readonly textEn: string;
    /** Distractor's error-reason; at correctIndex, why THIS option is correct. Never empty. */
    readonly reason: string;
  }

  export interface AmirnetItemRecord {
    readonly type: AmirnetItemType;
    readonly level: number; // must be 1..4, checked by the gate itself
    /** sc: the sentence with a blank. rs: the source sentence. rc: the question text. */
    readonly stemEn: string;
    /** rc only — the passage the question is grounded in. sc/rs: pass ''. */
    readonly passageEn: string;
    readonly options: readonly AmirnetOption[]; // must be length 4, checked by the gate
    readonly correctIndex: number;
    readonly levelRationale: string;
    readonly source: string; // must be 'original', checked by the gate
  }

  export type AmirnetGateReason =
    | 'wrong_option_count'
    | 'bad_correct_index'
    | 'duplicate_options'
    | 'missing_distractor_reason'
    | 'bad_level'
    | 'missing_level_rationale'
    | 'bad_source'
    | 'all_or_none_option'
    | 'correct_length_outlier'
    | 'vocab_above_tier'
    | 'passage_length_out_of_range';

  export interface AmirnetGateResult {
    readonly ok: boolean;
    readonly reasons: readonly AmirnetGateReason[];
    /** Words that exceeded the item's level tier ceiling — empty when none. */
    readonly aboveTierWords: readonly string[];
  }

  export interface AmirnetGateOptions {
    /** lower-cased CEFR headword -> tier (1-4). Built by the caller from
     * data/generated/amirnet-vocab.csv (T-222). A word absent from this map is
     * NOT flagged — the map only spans A2-C1 (Tier 1-4); A1 is assumed known
     * and proper nouns/function words are outside the CEFR list entirely. */
    readonly vocabTierByWord: ReadonlyMap<string, 1 | 2 | 3 | 4>;
  }

  export const AMIRNET_OPTIONS_PER_ITEM = 4;
  export const RC_PASSAGE_WORD_RANGE: Readonly<Record<1 | 2 | 3 | 4, readonly [number, number]>>;

  export function amirnetItemGate(
    record: AmirnetItemRecord,
    opts: AmirnetGateOptions,
  ): AmirnetGateResult;
  ```

- [ ] **Step 1: Write the failing test file with the full negative control**

Create `lib/core/amirnetItemGate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  AMIRNET_OPTIONS_PER_ITEM,
  amirnetItemGate,
  type AmirnetItemRecord,
} from './amirnetItemGate';

/**
 * Tier map fixture. Deliberately invented words, ⛔ not drawn from
 * plan/41-amirnet-spec.md § 6.3 (forbidden — brief § 1 point 2).
 * tier 1 = A2, 2 = B1, 3 = B2, 4 = C1 (data/amirnet-vocab-README.md § 3).
 */
const TIERS = new Map<string, 1 | 2 | 3 | 4>([
  ['museum', 1], ['closed', 1], ['visit', 1], ['garden', 1],
  ['despite', 2], ['training', 2], ['knee', 2],
  ['ambiguous', 3], ['committee', 3], ['endorsed', 3],
  ['circumstantial', 4], ['conclusive', 4], ['suspended', 4],
]);

const opt = (textEn: string, reason: string) => ({ textEn, reason });

const scItem = (over: Partial<AmirnetItemRecord> = {}): AmirnetItemRecord => ({
  type: 'sc',
  level: 1,
  stemEn: 'The garden was ______ after the storm.',
  passageEn: '',
  options: [
    opt('closed', 'correct — matches "after the storm" cause/effect'),
    opt('open', 'plausible surface reading, contradicts the cause given'),
    opt('crowded', 'unrelated to storm damage'),
    opt('painted', 'unrelated to storm damage'),
  ],
  correctIndex: 0,
  levelRationale: 'one blank, common vocabulary, no contrast connector',
  source: 'original',
  ...over,
});

const rcQuestion = (over: Partial<AmirnetItemRecord> = {}): AmirnetItemRecord => ({
  type: 'rc',
  level: 3,
  stemEn: 'What did the committee decide to do with the report?',
  // 188 words — measured in this plan with `str.split(/\s+/).length`, inside
  // the level-3 range [180, 230] (`41 § 6.2`). ⛔ Any edit here must re-measure.
  passageEn:
    'The committee spent three months preparing its final report on the ' +
    'proposed merger between the two regional transport companies. Members ' +
    'disagreed sharply on almost every point under discussion, and the ' +
    'disagreements grew more public as the deadline approached, with several ' +
    'members giving interviews that hinted at the internal disputes long ' +
    'before the report was due. In the end the committee\'s final report was ' +
    'deliberately ambiguous, allowing both sides of the dispute to claim ' +
    'afterward that their position had been endorsed by the group as a ' +
    'whole. Critics called the decision a failure of leadership, arguing ' +
    'that a clear recommendation, even an unpopular one, would have served ' +
    'the public better than a document that satisfied no one fully. ' +
    'Supporters described it as the only realistic way to keep the group ' +
    'from splitting apart entirely over a single disputed clause about ' +
    'ticket pricing. Neither side has changed its account of the meeting ' +
    'since the report was published two months ago, and no further ' +
    'statement is expected before the board\'s review in the spring, which ' +
    'several members now say they expect to be delayed regardless of what ' +
    'the report ultimately recommends.',
  options: [
    opt('It kept the wording ambiguous on purpose.', 'correct — matches paragraph 3'),
    opt('It rejected the merger outright.', 'plausible but not stated in the passage'),
    opt('It postponed its decision indefinitely.', 'confuses with the board review mentioned later'),
    opt('It endorsed one side publicly.', 'contradicts "allowing both sides to claim"'),
  ],
  correctIndex: 0,
  levelRationale: 'academic topic, 180-230 words, main-idea inference question',
  source: 'original',
  ...over,
});

const run = (item: AmirnetItemRecord) => amirnetItemGate(item, { vocabTierByWord: TIERS });

describe('amirnetItemGate', () => {
  it('passes a well-formed sc item', () => {
    expect(run(scItem())).toEqual({ ok: true, reasons: [], aboveTierWords: [] });
  });

  it('passes a well-formed rc question', () => {
    expect(run(rcQuestion())).toEqual({ ok: true, reasons: [], aboveTierWords: [] });
  });

  it('rejects the wrong option count', () => {
    const result = run(scItem({ options: scItem().options.slice(0, 3) }));
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('wrong_option_count');
  });

  it('rejects a correctIndex out of range', () => {
    const result = run(scItem({ correctIndex: 4 }));
    expect(result.reasons).toContain('bad_correct_index');
  });

  it('rejects a correctIndex that is not an integer', () => {
    const result = run(scItem({ correctIndex: 1.5 }));
    expect(result.reasons).toContain('bad_correct_index');
  });

  it('rejects duplicate options', () => {
    const item = scItem();
    const options = [...item.options];
    options[1] = options[0]!;
    const result = run(scItem({ options }));
    expect(result.reasons).toContain('duplicate_options');
  });

  it('rejects a missing distractor reason', () => {
    const item = scItem();
    const options = [...item.options];
    options[2] = opt(options[2]!.textEn, '   ');
    const result = run(scItem({ options }));
    expect(result.reasons).toContain('missing_distractor_reason');
  });

  it('rejects a level outside 1..4', () => {
    expect(run(scItem({ level: 5 })).reasons).toContain('bad_level');
    expect(run(scItem({ level: 0 })).reasons).toContain('bad_level');
    expect(run(scItem({ level: 2.5 })).reasons).toContain('bad_level');
  });

  it('rejects an empty level_rationale', () => {
    expect(run(scItem({ levelRationale: '  ' })).reasons).toContain('missing_level_rationale');
  });

  it('rejects a source other than "original"', () => {
    expect(run(scItem({ source: 'commercial_bank' })).reasons).toContain('bad_source');
  });

  it('rejects "all of the above" as an option, case-insensitively', () => {
    const item = scItem();
    const options = [...item.options];
    options[3] = opt('All Of The Above', 'n/a');
    expect(run(scItem({ options })).reasons).toContain('all_or_none_option');
  });

  it('rejects "none of the above" as an option', () => {
    const item = scItem();
    const options = [...item.options];
    options[1] = opt('none of the above', 'n/a');
    expect(run(scItem({ options })).reasons).toContain('all_or_none_option');
  });

  it('rejects a correct answer that is the longest option by a wide margin', () => {
    const result = run(
      scItem({
        options: [
          opt(
            'closed for extensive structural repairs following storm damage',
            'correct, but written far longer than the distractors — a giveaway',
          ),
          opt('open', 'short distractor'),
          opt('crowded', 'short distractor'),
          opt('painted', 'short distractor'),
        ],
        correctIndex: 0,
      }),
    );
    expect(result.reasons).toContain('correct_length_outlier');
  });

  it('rejects a headword above the item level\'s tier ceiling, and names it', () => {
    // "circumstantial" is tier 4 in the fixture map; item is level 1.
    const result = run(
      scItem({ stemEn: 'The evidence was entirely circumstantial after the storm.' }),
    );
    expect(result.reasons).toContain('vocab_above_tier');
    expect(result.aboveTierWords).toContain('circumstantial');
  });

  it('allows a tier-4 word when the item is level 4', () => {
    const result = run(
      scItem({
        level: 4,
        stemEn: 'The evidence was entirely circumstantial after the storm.',
        levelRationale: 'two dependent blanks, top of the vocabulary range',
      }),
    );
    expect(result.reasons).not.toContain('vocab_above_tier');
  });

  it('rejects an rc passage shorter than the level range', () => {
    const result = run(rcQuestion({ passageEn: 'Too short for level 3.' }));
    expect(result.reasons).toContain('passage_length_out_of_range');
  });

  it('rejects an rc passage longer than the level range', () => {
    const longPassage = Array(260).fill('word').join(' ');
    const result = run(rcQuestion({ passageEn: longPassage }));
    expect(result.reasons).toContain('passage_length_out_of_range');
  });

  it('ignores passage length for sc/rs — passageEn is always empty there', () => {
    expect(run(scItem()).reasons).not.toContain('passage_length_out_of_range');
  });

  it(`AMIRNET_OPTIONS_PER_ITEM is ${4}`, () => {
    expect(AMIRNET_OPTIONS_PER_ITEM).toBe(4);
  });
});
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `npx vitest run lib/core/amirnetItemGate.test.ts`
Expected: FAIL — `Cannot find module './amirnetItemGate'` (the module does not exist yet).

- [ ] **Step 3: Write the implementation**

Create `lib/core/amirnetItemGate.ts`:

```ts
/**
 * שער פריטי אמירנט — T-223, פותח את הזמנת התוכן K-006 (`plan/41-amirnet-spec.md § 6`).
 *
 * ⛔ טהור, על תבנית `storyQuestionGate`/`messageGate`: אפס React · DOM · רשת · שעון · env.
 *
 * ⚠️ **מה שהשער הזה ⛔ אינו בודק, במפורש (`docs/content-amirnet-items-brief.md § 6`):**
 *   · שהפריט **באמת** ברמה שהוא מצהיר — קריטריון מבני, לא מדיד.
 *   · שהפריט ⛔ אינו הד של שאלה קיימת ממאגר מסחרי — זו הצהרת הכותב, לא בדיקת קוד.
 *   · נושא רגיש בקטעי `rc` — עין אנושית בלבד.
 * אלה נשארים שיפוט של ה-Critic ו/או סוכן התוכן, ⛔ ולא נטענים כאן כמכוסים.
 *
 * ⚠️ **סף אורך התשובה הנכונה הוא החלטת DEV הפיכה (RULES § 0.22), ⛔ לא מספר מהמפרט:**
 * `41 § 6.4` כלל 3 אומר "אורך דומה, לא הארוכה ביותר באופן שיטתי" ⛔ ובלי סף מספרי.
 * `1.4` (40% ארוכה מהחציון) נבחר כאן כערך שמרני וסביר לכתיבת פריטים; שינוי בעתיד
 * דורש עדכון של שורה אחת ותיעוד ב-`50-tasks.md`/`60-findings.md`, ⛔ לא הכרעת רוי מחדש.
 */

export type AmirnetItemType = 'sc' | 'rs' | 'rc';

export interface AmirnetOption {
  /** Distractor's error-reason; at correctIndex, why THIS option is correct. Never empty. */
  readonly textEn: string;
  readonly reason: string;
}

export interface AmirnetItemRecord {
  readonly type: AmirnetItemType;
  readonly level: number;
  /** sc: the sentence with a blank. rs: the source sentence. rc: the question text. */
  readonly stemEn: string;
  /** rc only — the passage the question is grounded in. sc/rs: pass ''. */
  readonly passageEn: string;
  readonly options: readonly AmirnetOption[];
  readonly correctIndex: number;
  readonly levelRationale: string;
  readonly source: string;
}

export type AmirnetGateReason =
  | 'wrong_option_count'
  | 'bad_correct_index'
  | 'duplicate_options'
  | 'missing_distractor_reason'
  | 'bad_level'
  | 'missing_level_rationale'
  | 'bad_source'
  | 'all_or_none_option'
  | 'correct_length_outlier'
  | 'vocab_above_tier'
  | 'passage_length_out_of_range';

export interface AmirnetGateResult {
  readonly ok: boolean;
  readonly reasons: readonly AmirnetGateReason[];
  readonly aboveTierWords: readonly string[];
}

export interface AmirnetGateOptions {
  /** lower-cased CEFR headword -> tier (1-4). Absence is NOT flagged — see header. */
  readonly vocabTierByWord: ReadonlyMap<string, 1 | 2 | 3 | 4>;
}

export const AMIRNET_OPTIONS_PER_ITEM = 4;

/** `41 § 6.2` word-count ranges by level, `rc` only. */
export const RC_PASSAGE_WORD_RANGE: Readonly<Record<1 | 2 | 3 | 4, readonly [number, number]>> = {
  1: [90, 120],
  2: [130, 170],
  3: [180, 230],
  4: [240, 300],
};

/** See header note: reasoned default, ⛔ not a measured constant. */
const CORRECT_LENGTH_RATIO_CEILING = 1.4;

const BANNED_OPTION_PHRASES = new Set(['all of the above', 'none of the above']);
const TOKEN = /[a-z']+/g;

const tokensOf = (text: string): string[] => text.toLowerCase().match(TOKEN) ?? [];

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export function amirnetItemGate(
  record: AmirnetItemRecord,
  opts: AmirnetGateOptions,
): AmirnetGateResult {
  const reasons: AmirnetGateReason[] = [];
  const options = record.options;

  if (options.length !== AMIRNET_OPTIONS_PER_ITEM) reasons.push('wrong_option_count');

  const correctIndexValid =
    Number.isInteger(record.correctIndex) &&
    record.correctIndex >= 0 &&
    record.correctIndex < options.length;
  if (!correctIndexValid) reasons.push('bad_correct_index');

  const trimmedTexts = options.map((o) => o.textEn.trim());
  if (new Set(trimmedTexts).size !== trimmedTexts.length) reasons.push('duplicate_options');

  if (options.some((o) => o.reason.trim() === '')) reasons.push('missing_distractor_reason');

  const levelValid = Number.isInteger(record.level) && record.level >= 1 && record.level <= 4;
  if (!levelValid) reasons.push('bad_level');

  if (record.levelRationale.trim() === '') reasons.push('missing_level_rationale');

  if (record.source !== 'original') reasons.push('bad_source');

  if (trimmedTexts.some((t) => BANNED_OPTION_PHRASES.has(t.toLowerCase()))) {
    reasons.push('all_or_none_option');
  }

  // ── correct answer must not be a length outlier vs. the distractor median ──
  if (correctIndexValid && options.length > 1) {
    const correctLen = trimmedTexts[record.correctIndex]!.length;
    const distractorLens = trimmedTexts.filter((_, i) => i !== record.correctIndex).map((t) => t.length);
    const medianDistractorLen = median(distractorLens);
    if (medianDistractorLen > 0 && correctLen / medianDistractorLen > CORRECT_LENGTH_RATIO_CEILING) {
      reasons.push('correct_length_outlier');
    }
  }

  // ── vocabulary ceiling: no content word above the item's level tier ──
  const aboveTierWords = new Set<string>();
  if (levelValid) {
    const textsToScan = [record.stemEn, record.passageEn, ...options.map((o) => o.textEn)];
    for (const text of textsToScan) {
      for (const token of tokensOf(text)) {
        const tier = opts.vocabTierByWord.get(token);
        if (tier !== undefined && tier > record.level) aboveTierWords.add(token);
      }
    }
  }
  if (aboveTierWords.size > 0) reasons.push('vocab_above_tier');

  // ── rc passage length, by level. sc/rs pass '' and are never checked. ──
  if (record.type === 'rc' && levelValid) {
    const wordCount = record.passageEn.split(/\s+/).filter((w) => w.length > 0).length;
    const [min, max] = RC_PASSAGE_WORD_RANGE[record.level as 1 | 2 | 3 | 4];
    if (wordCount < min || wordCount > max) reasons.push('passage_length_out_of_range');
  }

  return {
    ok: reasons.length === 0,
    reasons,
    aboveTierWords: [...aboveTierWords].sort(),
  };
}
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `npx vitest run lib/core/amirnetItemGate.test.ts`
Expected: PASS, all cases green.

- [ ] **Step 5: Run core-purity and typecheck guards**

Run: `npm run check:core && npm run typecheck`
Expected: both exit 0 — `amirnetItemGate.ts` must show zero React/DOM/env/fetch usage and zero `any`.

- [ ] **Step 6: Commit**

```bash
./scripts/g add lib/core/amirnetItemGate.ts lib/core/amirnetItemGate.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-223a pure amirnet item gate"
```

---

### Task 2: Chapter-level gate — `lib/core/amirnetChapterGate.ts`

**Files:**
- Create: `lib/core/amirnetChapterGate.ts`
- Test: `lib/core/amirnetChapterGate.test.ts`

**Interfaces:**
- Consumes: `AmirnetItemRecord`, `AmirnetGateOptions`, `amirnetItemGate` from Task 1 (`./amirnetItemGate`).
- Produces (consumed by Task 3):
  ```ts
  export const RC_QUESTIONS_PER_CHAPTER = 5;

  export type AmirnetChapterGateReason =
    | 'wrong_question_count'
    | 'passage_mismatch'
    | 'level_mismatch'
    | 'not_all_rc'
    | 'correct_index_not_spread'
    | `item_${number}_failed`; // one entry per failing question index, e.g. "item_2_failed"

  export interface AmirnetChapterGateResult {
    readonly ok: boolean;
    readonly reasons: readonly AmirnetChapterGateReason[];
    /** Per-question results, same order as the input — for reporting which one failed and why. */
    readonly perQuestion: readonly ReturnType<
      typeof import('./amirnetItemGate').amirnetItemGate
    >[];
  }

  export function amirnetChapterGate(
    questions: readonly import('./amirnetItemGate').AmirnetItemRecord[],
    opts: import('./amirnetItemGate').AmirnetGateOptions,
  ): AmirnetChapterGateResult;
  ```

- [ ] **Step 1: Write the failing test**

Create `lib/core/amirnetChapterGate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { amirnetChapterGate, RC_QUESTIONS_PER_CHAPTER } from './amirnetChapterGate';
import type { AmirnetItemRecord } from './amirnetItemGate';

const TIERS = new Map<string, 1 | 2 | 3 | 4>([
  ['committee', 3], ['report', 3], ['ambiguous', 3], ['endorsed', 3], ['merger', 3],
]);

// 188 words — measured with `str.split(/\s+/).length`, inside the level-3
// range [180, 230] (`41 § 6.2`). ⛔ Any edit here must re-measure. Kept
// word-for-word identical to lib/core/amirnetItemGate.test.ts's rcQuestion()
// fixture so a reader comparing the two files sees the same passage.
const PASSAGE =
  'The committee spent three months preparing its final report on the ' +
  'proposed merger between the two regional transport companies. Members ' +
  'disagreed sharply on almost every point under discussion, and the ' +
  'disagreements grew more public as the deadline approached, with several ' +
  'members giving interviews that hinted at the internal disputes long ' +
  'before the report was due. In the end the committee\'s final report was ' +
  'deliberately ambiguous, allowing both sides of the dispute to claim ' +
  'afterward that their position had been endorsed by the group as a ' +
  'whole. Critics called the decision a failure of leadership, arguing ' +
  'that a clear recommendation, even an unpopular one, would have served ' +
  'the public better than a document that satisfied no one fully. ' +
  'Supporters described it as the only realistic way to keep the group ' +
  'from splitting apart entirely over a single disputed clause about ' +
  'ticket pricing. Neither side has changed its account of the meeting ' +
  'since the report was published two months ago, and no further ' +
  'statement is expected before the board\'s review in the spring, which ' +
  'several members now say they expect to be delayed regardless of what ' +
  'the report ultimately recommends.';

const opt = (textEn: string, reason: string) => ({ textEn, reason });

const question = (
  n: number,
  correctIndex: number,
  stemEn = `Question ${n} about the passage?`,
): AmirnetItemRecord => ({
  type: 'rc',
  level: 3,
  stemEn,
  passageEn: PASSAGE,
  options: [
    opt('correct answer text', 'correct — matches the passage'),
    opt('distractor one', 'plausible but unstated'),
    opt('distractor two', 'confuses a later detail'),
    opt('distractor three', 'contradicts the passage'),
  ].map((o, i) => (i === correctIndex ? o : opt(o.textEn + ` ${n}`, o.reason))),
  correctIndex,
  levelRationale: 'academic topic, 180-230 words',
  source: 'original',
});

/** Five questions, correctIndex spread across 0..3 so no single index dominates. */
const validChapter = (): AmirnetItemRecord[] => [
  question(1, 0),
  question(2, 1),
  question(3, 2),
  question(4, 3),
  question(5, 1),
];

const run = (qs: AmirnetItemRecord[]) => amirnetChapterGate(qs, { vocabTierByWord: TIERS });

describe('amirnetChapterGate', () => {
  it('passes a well-formed 5-question chapter', () => {
    const result = run(validChapter());
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it(`requires exactly ${RC_QUESTIONS_PER_CHAPTER} questions`, () => {
    expect(run(validChapter().slice(0, 4)).reasons).toContain('wrong_question_count');
  });

  it('rejects a chapter whose questions do not share one passage', () => {
    const qs = validChapter();
    qs[2] = { ...qs[2]!, passageEn: qs[2]!.passageEn + ' Extra sentence added.' };
    expect(run(qs).reasons).toContain('passage_mismatch');
  });

  it('rejects a chapter with mixed levels', () => {
    const qs = validChapter();
    qs[3] = { ...qs[3]!, level: 2 };
    expect(run(qs).reasons).toContain('level_mismatch');
  });

  it('rejects a non-rc question inside a chapter', () => {
    const qs = validChapter();
    qs[1] = { ...qs[1]!, type: 'sc' };
    expect(run(qs).reasons).toContain('not_all_rc');
  });

  it('rejects a chapter where every correct answer sits at the same index', () => {
    const qs = [question(1, 0), question(2, 0), question(3, 0), question(4, 0), question(5, 0)];
    expect(run(qs).reasons).toContain('correct_index_not_spread');
  });

  it('surfaces a per-item failure with its index', () => {
    const qs = validChapter();
    qs[2] = { ...qs[2]!, levelRationale: '' };
    const result = run(qs);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('item_2_failed');
    expect(result.perQuestion[2]!.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run lib/core/amirnetChapterGate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `lib/core/amirnetChapterGate.ts`:

```ts
/**
 * שער הפרק — הצד שרק קבוצת שאלות חושפת: T-223, `41 § 6.2` (הבנת הנקרא).
 *
 * ⛔ טהור, כמו `amirnetItemGate` שעליו הוא בנוי. כל שאלה נבדקת קודם בשער הפריט
 * (options · vocab · אורך קטע וכו') ואז מתווספות שתי בדיקות שרק חמש שאלות ביחד
 * חושפות: שכולן חולקות אותו קטע וזהות רמה, ושפיזור התשובה הנכונה אינו קבוע.
 */
import {
  amirnetItemGate,
  type AmirnetGateOptions,
  type AmirnetItemRecord,
} from './amirnetItemGate';

export const RC_QUESTIONS_PER_CHAPTER = 5;

export type AmirnetChapterGateReason =
  | 'wrong_question_count'
  | 'passage_mismatch'
  | 'level_mismatch'
  | 'not_all_rc'
  | 'correct_index_not_spread'
  | `item_${number}_failed`;

export interface AmirnetChapterGateResult {
  readonly ok: boolean;
  readonly reasons: readonly AmirnetChapterGateReason[];
  readonly perQuestion: readonly ReturnType<typeof amirnetItemGate>[];
}

export function amirnetChapterGate(
  questions: readonly AmirnetItemRecord[],
  opts: AmirnetGateOptions,
): AmirnetChapterGateResult {
  const reasons: AmirnetChapterGateReason[] = [];

  if (questions.length !== RC_QUESTIONS_PER_CHAPTER) reasons.push('wrong_question_count');

  if (questions.some((q) => q.type !== 'rc')) reasons.push('not_all_rc');

  const firstPassage = questions[0]?.passageEn ?? '';
  if (questions.some((q) => q.passageEn !== firstPassage)) reasons.push('passage_mismatch');

  const firstLevel = questions[0]?.level;
  if (questions.some((q) => q.level !== firstLevel)) reasons.push('level_mismatch');

  // ⛔ Every question landing on the same correctIndex is the collection-level
  // giveaway pattern (a learner who always picks "C" would score suspiciously
  // well). A tie across at most 4 of 5 is fine; only all-identical is flagged —
  // five questions is too small a sample to police an exact distribution.
  const correctIndices = questions.map((q) => q.correctIndex);
  if (correctIndices.length > 0 && new Set(correctIndices).size === 1) {
    reasons.push('correct_index_not_spread');
  }

  const perQuestion = questions.map((q) => amirnetItemGate(q, opts));
  perQuestion.forEach((result, i) => {
    if (!result.ok) reasons.push(`item_${i}_failed`);
  });

  return { ok: reasons.length === 0, reasons, perQuestion };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run lib/core/amirnetChapterGate.test.ts`
Expected: PASS, all cases green.

- [ ] **Step 5: Run core-purity and typecheck guards**

Run: `npm run check:core && npm run typecheck`
Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
./scripts/g add lib/core/amirnetChapterGate.ts lib/core/amirnetChapterGate.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-223b amirnet chapter gate"
```

---

### Task 3: CLI command — `npm run measure:amirnet-gate`

**Files:**
- Create: `scripts/measure-amirnet-gate.mjs`
- Test: `scripts/measure-amirnet-gate.test.ts`
- Modify: `package.json` (add the `measure:amirnet-gate` script entry)

**Interfaces:**
- Consumes: `amirnetItemGate`/`AmirnetGateOptions` from `lib/core/amirnetItemGate.ts`, `amirnetChapterGate` from `lib/core/amirnetChapterGate.ts` (both via the `registerHooks` `.ts`-import pattern already used in `scripts/measure-gate.mjs`); `data/generated/amirnet-vocab.csv` (T-222, columns `headword,pos,cefr,tier,tier_name,amirnet_level,is_connector,source`).
- Produces: reads every `data/generated/amirnet-items-*.jsonl` file (new naming convention — none exist yet; CONTENT starts writing them once this task lands and K-006 unblocks). Each line is JSON: either a single `sc`/`rs` item shaped like `AmirnetItemRecord`, or an `rc` chapter shaped `{ passageEn, level, questions: AmirnetItemRecord[] }` with 5 entries (`questions` omits `passageEn`/`level` per-question — the script fills those from the chapter wrapper before calling the gate, since the schema stores it once per chapter, not once per question). Prints a summary and writes `docs/amirnet-gate-report.md`.

- [ ] **Step 1: Write the failing test**

Create `scripts/measure-amirnet-gate.test.ts`:

```ts
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const OUT_DIR = mkdtempSync(join(tmpdir(), 'amirnet-gate-report-'));
const FRESH = join(OUT_DIR, 'amirnet-gate-report.md');
const ITEMS_DIR = mkdtempSync(join(tmpdir(), 'amirnet-items-'));

afterEach(() => {
  rmSync(ITEMS_DIR, { recursive: true, force: true });
  mkdirSync(ITEMS_DIR, { recursive: true });
});

// ⚠️ Points AMIRNET_VOCAB_CSV at a path that never exists, so loadVocabTiers()
// always returns an empty map here: the real data/generated/amirnet-vocab.csv
// carries thousands of real English words at real tiers, and the fixtures
// below reuse ordinary words (`report`, `committee`, `merger`...) that could
// silently land above the fixture's level in a future re-derivation of that
// file (T-222 is allowed to change its numbers). vocab_above_tier itself is
// exercised in isolation by lib/core/amirnetItemGate.test.ts against a fixed,
// tiny tier map — this file only proves the CLI wiring, not the gate logic.
const NO_VOCAB_CSV = join(ITEMS_DIR, 'no-such-vocab.csv');

const run = (): string =>
  execFileSync('node', ['scripts/measure-amirnet-gate.mjs'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      AMIRNET_GATE_REPORT_OUT: FRESH,
      AMIRNET_ITEMS_DIR: ITEMS_DIR,
      AMIRNET_VOCAB_CSV: NO_VOCAB_CSV,
    },
  });

describe('scripts/measure-amirnet-gate.mjs', () => {
  it('reports zero files cleanly — content is still blocked on K-006', () => {
    const stdout = run();
    expect(stdout).toContain('0 amirnet item files found');
    expect(stdout).not.toMatch(/error|exception/i);
    const fresh = readFileSync(FRESH, 'utf8');
    expect(fresh).toContain('0 files');
  });

  it('gates a well-formed sc item file and reports it green', () => {
    const item = {
      type: 'sc',
      level: 1,
      stemEn: 'The store was ______ so we came back later.',
      passageEn: '',
      options: [
        { textEn: 'closed', reason: 'correct — matches "came back later"' },
        { textEn: 'open', reason: 'contradicts the reason given' },
        { textEn: 'noisy', reason: 'unrelated' },
        { textEn: 'painted', reason: 'unrelated' },
      ],
      correctIndex: 0,
      levelRationale: 'one blank, common vocabulary',
      source: 'original',
    };
    writeFileSync(join(ITEMS_DIR, 'amirnet-items-sc-2026-09-05.jsonl'), `${JSON.stringify(item)}\n`, 'utf8');
    const stdout = run();
    expect(stdout).toContain('1 amirnet item files found');
    expect(stdout).toContain('1 items gated');
    expect(stdout).toContain('0 items rejected');
  });

  it('gates a broken item and reports the rejection, non-zero-exiting nothing (report-only, R-014)', () => {
    const item = {
      type: 'sc',
      level: 1,
      stemEn: 'The store was ______ so we came back later.',
      passageEn: '',
      options: [{ textEn: 'closed', reason: 'correct' }],
      correctIndex: 0,
      levelRationale: 'one blank',
      source: 'original',
    };
    writeFileSync(join(ITEMS_DIR, 'amirnet-items-sc-broken.jsonl'), `${JSON.stringify(item)}\n`, 'utf8');
    const stdout = run();
    expect(stdout).toContain('1 items rejected');
    expect(stdout).toContain('wrong_option_count');
  });

  it('gates an rc chapter file (the questions[] wrapper shape), 5 questions at once', () => {
    // 188 words — same fixture passage as lib/core/amirnetChapterGate.test.ts.
    const passageEn =
      'The committee spent three months preparing its final report on the ' +
      'proposed merger between the two regional transport companies. Members ' +
      'disagreed sharply on almost every point under discussion, and the ' +
      'disagreements grew more public as the deadline approached, with several ' +
      'members giving interviews that hinted at the internal disputes long ' +
      'before the report was due. In the end the committee\'s final report was ' +
      'deliberately ambiguous, allowing both sides of the dispute to claim ' +
      'afterward that their position had been endorsed by the group as a ' +
      'whole. Critics called the decision a failure of leadership, arguing ' +
      'that a clear recommendation, even an unpopular one, would have served ' +
      'the public better than a document that satisfied no one fully. ' +
      'Supporters described it as the only realistic way to keep the group ' +
      'from splitting apart entirely over a single disputed clause about ' +
      'ticket pricing. Neither side has changed its account of the meeting ' +
      'since the report was published two months ago, and no further ' +
      'statement is expected before the board\'s review in the spring, which ' +
      'several members now say they expect to be delayed regardless of what ' +
      'the report ultimately recommends.';
    const q = (n, correctIndex) => ({
      stemEn: `Question ${n} about the passage?`,
      options: [
        { textEn: 'correct answer text', reason: 'correct — matches the passage' },
        { textEn: 'distractor one', reason: 'plausible but unstated' },
        { textEn: 'distractor two', reason: 'confuses a later detail' },
        { textEn: 'distractor three', reason: 'contradicts the passage' },
      ].map((o, i) => (i === correctIndex ? o : { textEn: `${o.textEn} ${n}`, reason: o.reason })),
      correctIndex,
      levelRationale: 'academic topic, 180-230 words',
      source: 'original',
    });
    const chapter = {
      type: 'rc',
      level: 3,
      passageEn,
      questions: [q(1, 0), q(2, 1), q(3, 2), q(4, 3), q(5, 1)],
    };
    writeFileSync(join(ITEMS_DIR, 'amirnet-items-rc-2026-09-05.jsonl'), `${JSON.stringify(chapter)}\n`, 'utf8');
    const stdout = run();
    expect(stdout).toContain('1 amirnet item files found');
    expect(stdout).toContain('5 items gated');
    expect(stdout).toContain('0 items rejected');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run scripts/measure-amirnet-gate.test.ts`
Expected: FAIL — `scripts/measure-amirnet-gate.mjs` does not exist (`ENOENT`/module not found on `execFileSync`).

- [ ] **Step 3: Write the implementation**

Create `scripts/measure-amirnet-gate.mjs`:

```js
#!/usr/bin/env node
/**
 * Runs the amirnet item gate over every data/generated/amirnet-items-*.jsonl
 * file and reports pass/fail counts — the CLI command F-163 requires before a
 * gate counts as real (T-223, closes K-006's blocker).
 *
 * ⛔ Report-only (R-014): a rejected item is regenerated by CONTENT, never
 * hand-fixed, so this script never mutates its inputs and never fails the
 * build on a rejection — only on a structurally unreadable input file.
 *
 * Zero files is the expected state until CONTENT starts writing under K-006 —
 * that is reported as information, not an error.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
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

const { amirnetItemGate } = await import('../lib/core/amirnetItemGate.ts');
const { amirnetChapterGate } = await import('../lib/core/amirnetChapterGate.ts');

const ITEMS_DIR = process.env.AMIRNET_ITEMS_DIR || join('data', 'generated');
const VOCAB_PATH = process.env.AMIRNET_VOCAB_CSV || join('data', 'generated', 'amirnet-vocab.csv');
const OUT = process.env.AMIRNET_GATE_REPORT_OUT || join('docs', 'amirnet-gate-report.md');

function loadVocabTiers(path) {
  const map = new Map();
  if (!existsSync(path)) return map; // T-222's output; absence degrades to "no ceiling enforced"
  const lines = readFileSync(path, 'utf8').split('\n').slice(1); // drop header
  for (const line of lines) {
    if (line.trim() === '') continue;
    const [headword, , , tier] = line.split(',');
    const t = Number(tier);
    if (headword && t >= 1 && t <= 4) map.set(headword.toLowerCase(), t);
  }
  return map;
}

const vocabTierByWord = loadVocabTiers(VOCAB_PATH);

const files = existsSync(ITEMS_DIR)
  ? readdirSync(ITEMS_DIR).filter((f) => /^amirnet-items-.*\.jsonl$/.test(f)).sort()
  : [];

let itemsGated = 0;
let itemsRejected = 0;
const rejectionLines = [];

for (const file of files) {
  const lines = readFileSync(join(ITEMS_DIR, file), 'utf8').split('\n').filter((l) => l.trim() !== '');
  lines.forEach((line, i) => {
    const record = JSON.parse(line);
    if (record.type === 'rc' && Array.isArray(record.questions)) {
      const questions = record.questions.map((q) => ({
        ...q,
        type: 'rc',
        level: record.level,
        passageEn: record.passageEn,
      }));
      const result = amirnetChapterGate(questions, { vocabTierByWord });
      itemsGated += questions.length;
      if (!result.ok) {
        itemsRejected += result.perQuestion.filter((r) => !r.ok).length;
        rejectionLines.push(`${file}:${i + 1} chapter — ${result.reasons.join(', ')}`);
      }
    } else {
      const result = amirnetItemGate(record, { vocabTierByWord });
      itemsGated += 1;
      if (!result.ok) {
        itemsRejected += 1;
        rejectionLines.push(`${file}:${i + 1} — ${result.reasons.join(', ')}`);
      }
    }
  });
}

const report = [
  '# Amirnet item gate report',
  '',
  `- ${files.length} files`,
  `- ${itemsGated} items gated`,
  `- ${itemsRejected} items rejected`,
  '',
  ...(rejectionLines.length > 0 ? ['## Rejections', '', ...rejectionLines.map((l) => `- ${l}`)] : []),
].join('\n');

mkdirSync(join(OUT, '..'), { recursive: true });
writeFileSync(OUT, `${report}\n`, 'utf8');

console.log(`${files.length} amirnet item files found`);
console.log(`${itemsGated} items gated`);
console.log(`${itemsRejected} items rejected`);
if (rejectionLines.length > 0) {
  console.log('rejections:');
  for (const line of rejectionLines) console.log(`  ${line}`);
}
console.log(`wrote ${OUT}`);
```

⚠️ `mkdirSync(join(OUT, '..'), { recursive: true })` — `OUT` defaults to `docs/amirnet-gate-report.md`, so this creates `docs/` if absent (it already exists in this repo, so this is a no-op in the real run; it only matters for the test's temp-dir `OUT`, which is one directory level — verify in Step 4 that the temp path used by the test IS itself a directory that already exists, since the test's `FRESH` path's parent (`OUT_DIR`) is created by `mkdtempSync` already, so `mkdirSync(join(OUT,'..'))` there is also a no-op).

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run scripts/measure-amirnet-gate.test.ts`
Expected: PASS, all three cases green.

- [ ] **Step 5: Wire the npm script**

Modify `package.json` — add this line inside `"scripts"`, alongside the other `measure:*` entries (after `"measure:continuations"`, before `"measure:plan"`):

```json
    "measure:amirnet-gate": "node scripts/measure-amirnet-gate.mjs",
```

- [ ] **Step 6: Run it for real once, against zero content, to prove the command exists and behaves**

Run: `npm run measure:amirnet-gate`
Expected: exit 0, prints `0 amirnet item files found` (or more, if a prior tick already added fixtures under `data/generated/amirnet-items-*.jsonl` — unlikely at this point since K-006 was blocked until this very task), writes `docs/amirnet-gate-report.md`.

- [ ] **Step 7: Run the full verify gate**

Run: `npm run verify`
Expected: exit 0 (`typecheck` · `check:core` · `check:motion` · `check:text-floor` · `check:rules` · `test` · `build` · `check:mobile`, per `package.json`'s `verify` script).

- [ ] **Step 8: Commit**

```bash
./scripts/g add scripts/measure-amirnet-gate.mjs scripts/measure-amirnet-gate.test.ts package.json docs/amirnet-gate-report.md
./scripts/g commit -m "loop(DEV): C-XXXX T-223c measure:amirnet-gate CLI, closes T-223 (F-163)"
```

---

## Self-Check

**Spec coverage** — every deterministic check `docs/content-amirnet-items-brief.md § 6` lists as enforced by this gate has a task and a test: 4 options (Task 1, `wrong_option_count`) · `correct_index` in range (Task 1, `bad_correct_index`) · 4 non-empty `distractor_reasons` (Task 1, `missing_distractor_reason`) · `level ∈ 1..4` (Task 1, `bad_level`) · non-empty `level_rationale` (Task 1, `missing_level_rationale`) · `source === "original"` (Task 1, `bad_source`) · no all/none-of-the-above (Task 1, `all_or_none_option`) · correct-answer length vs. distractor median (Task 1, `correct_length_outlier`) · no headword above the level's tier (Task 1, `vocab_above_tier`) · `rc` passage length in the level's range (Task 1, `passage_length_out_of_range`) · exactly 5 questions per chapter (Task 2, `wrong_question_count`) · no duplicate options (Task 1, `duplicate_options`) · `correctIndex` spread across the chapter (Task 2, `correct_index_not_spread`). The three items the brief explicitly says are NOT gated (true level, commercial echo, sensitive `rc` topics) are named in both this plan's Global Constraints and the module's own header comment, and no task attempts them.

**Placeholder scan** — no "TBD"/"handle edge cases" steps; every code block is complete and runnable as written; the one open judgment call (the `1.4` length-ratio threshold) is a real chosen number with a comment explaining it is a DEV discretionary default, not a placeholder.

**Type consistency** — `AmirnetItemRecord`, `AmirnetOption`, `AmirnetGateOptions` are defined once in Task 1 and imported (not redefined) in Tasks 2 and 3. `amirnetItemGate`'s signature in Task 2/3's Interfaces blocks matches Task 1's implementation exactly (same parameter names, same return shape).
