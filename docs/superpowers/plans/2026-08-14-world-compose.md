# `העולם` — Compose-a-post from a closed bank · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. One task per Dev tick.

**Goal:** Ship the first `העולם` feature end to end — a learner taps words out of a closed bank, publishes one English sentence into a private feed, and the tab unlocks itself from two server-side counts.

**Architecture:** Three layers, in the order the repo already enforces. A pure module (`lib/core/world.ts`) owns every rule that can be decided without I/O — the unlock predicate, tokenisation, the target-word check, the payload check, headword de-duplication, draft rendering. Three route handlers under `app/api/world/` own session, ENV, SQL and HTTP status. Three screens own paint and taps and reach the server only through `lib/api/client.ts`. One migration (`0010`) adds the single column that lets a learner-written row be told apart from a generated one.

**Tech Stack:** Next.js App Router (Server Components + `'use client'` islands) · TypeScript strict, no `any` · Supabase (`@supabase/ssr`, PostgREST, RLS) · Tailwind with the frozen constitution tokens · vitest (`environment: 'node'`, no jsdom) · Playwright through `npm run check:mobile`.

**Spec:** `plan/40-decisions.md` § 4.2ה (the UX plan), plus `D-030` · `D-031` · `R-016` · `D-028` · `plan/35-design-constitution.md`. **Executors read the spec and this plan together** — every screen decision below is quoted from § 4.2ה and none is invented here.

**Tasks covered:** `T-061` (tasks 1–4) · `T-062` (tasks 5–6) · `T-063` (tasks 7–8).

---

## Global Constraints

Copied verbatim from the governing documents. Every task's requirements implicitly include this section.

- ⛔ **No AI content, no generated content, no new content of any kind.** D-030: "אפס תוכן חדש." The bank is rows that already exist in the bank; the post is written by the learner. Nothing in this plan writes to `senses`, `words`, `sense_examples`, or any table the content gate owns.
- ⛔ **No grammatical judgement anywhere.** R-016 · § 4.2ה: "אין שיפוט דקדוקי · אין ציון · אין תיקון · אין 'יפה' ואין 'נכון'." The only server-side rejection is *the target word is missing from the draft*, and its message is guidance: «הוסף את <word> כדי לפרסם».
- ⛔ **Never `senses.cefr_level`** — not read, not written, not sorted by (D-034).
- ⛔ **Never touch** `word_progress.reps`, `easiness`, `interval_days`, `repetition`, `next_review_at`, or the review engine. Publishing a post is not a review.
- ⛔ **`/lib/core` is pure**: no React, no `window`, no `document`, no `localStorage`, no `fetch`, no `process.env`, **no clock**. `npm run check:core` enforces it.
- ⛔ **A UI component never reaches the database.** Screens call `lib/api/client.ts`, which calls `app/api/**`. A Server Component may read `searchParams` and nothing else.
- **Route guard order is fixed** (the C-0032 pattern, identical in `app/api/study/queue/route.ts` and `app/api/practice/route.ts`): `readSupabaseEnv()` → `getUser()` → read query/body. An unauthenticated caller learns nothing about the shape of the endpoint.
- **Error text.** `error.message` from PostgREST goes to `console.error` and ⛔ never into a response body. `42P01` / `PGRST205` ⇒ **503** `schema_missing` with the Hebrew sentence «המאגר עדיין לא הוקם», ⛔ never 500 and ⛔ never an empty screen.
- **Mobile-first.** 375px is the design width; 320 / 375 / 414 are the measured widths. Tap targets ≥44×44px, ≥8px apart. Zero horizontal scroll.
- **Design constitution § 3 is frozen** — radii are `md` / `lg` / `2xl` only. ⛔ Do **not** introduce `rounded-xl` in these files; T-068 exists to remove the 39 that are already there, and adding more makes that task larger. ⛔ No raw hex — colour comes from tokens (constitution § 6). ⛔ No `Inter`, no purple gradient, no vertical centring (F-011 · F-016).
- **Hebrew is the UI language; English is wrapped.** Every English run renders through `<EnWord>` / `<EnText>` (`lang="en"` + `dir="ltr"` + `unicode-bidi: isolate`) — never a bare `<span>`.
- **`docs/api-contract.md` is updated in the same commit as any endpoint change.** Not the next commit.
- **Commits:** `loop(DEV): C-XXXX <summary>`, pushed to `dev`. ⛔ Never `main`. ⛔ Never `[skip ci]`.
- **The verification command, run fresh, in the same message as any success claim:**
  `npm run typecheck && npm run check:core && npm test && npm run build`
  plus `npm run check:mobile` for tasks 5–8.

---

## File Structure

| File | Task | Responsibility |
|---|---|---|
| `supabase/migrations/0010_world_author_kind.sql` | 1 | One column + one check constraint. Nothing else. |
| `lib/supabase/worldAuthorKind.test.ts` | 1 | Guards the SQL text of `0010` (same technique as `worldSchema.test.ts`). |
| `lib/core/world.ts` | 2 | **PURE.** Unlock predicate · tokenisation · target check · payload check · headword dedupe · draft rendering. |
| `lib/core/world.test.ts` | 2 | Real unit tests for the above. |
| `app/api/world/status/route.ts` (+ `route.test.ts`) | 3 | `GET` ⇒ `{ unlocked, functionWords, activeWords }`, computed from two counts. |
| `app/api/world/bank/route.ts` (+ `route.test.ts`) | 4 | `GET` ⇒ `{ functionWords[], activeWords[], target }`. The closed bank + today's target word. |
| `app/api/world/posts/route.ts` (+ `route.test.ts`) | 5 | `GET` ⇒ the learner's feed. `POST` ⇒ one row in `world_posts`, `author_kind='learner'`. |
| `docs/api-contract.md` | 3·4·5 | One section per endpoint, in the same commit as the endpoint. |
| `app/(tabs)/world/page.tsx` | 6 | Server Component shell for `/world`. |
| `components/WorldFeed.tsx` (+ `.test.ts`) | 6 | `'use client'` — the private feed, the «מילים שהפקת» counter, the empty state, the skeleton. |
| `components/TabBar.tsx` (+ `.test.ts`) | 7 | Reads `/api/world/status`; the locked sheet sentence becomes measurable. |
| `app/world/compose/page.tsx` | 8 | Server Component shell for the flow screen (⛔ outside `(tabs)` — D-028). |
| `components/WordBank.tsx` (+ `.test.ts`) | 8 | The two labelled groups + the two punctuation buttons. |
| `components/ComposeDraft.tsx` (+ `.test.ts`) | 8 | The draft, the target line, the publish button, all the compose state. |
| `app/dev/world/page.tsx` + `layout.tsx` | 9 | noindex fixture so `check:mobile` measures the bank and the draft at 320/375/414. |
| `scripts/verify-mobile.mjs` (+ `.test.ts`) | 9 | `/world`, `/world/compose`, `/dev/world` in `ROUTES`; `/world/compose` in `FLOW_ROUTES`. |

**Why `WordBank` and `ComposeDraft` are two files and not one:** the bank is a long, scrolling, stateless list of tappable words; the draft is a short, stateful strip plus the publish rule. They change for different reasons, and a single file would put the publish predicate and the 44px grid in the same 400 lines.

---

### Task 1: The migration — `author_kind`

**Files:**
- Create: `supabase/migrations/0010_world_author_kind.sql`
- Create: `lib/supabase/worldAuthorKind.test.ts`

**Interfaces:**
- Consumes: `supabase/migrations/0007_world_schema.sql` (the `world_posts` table).
- Produces: the column `world_posts.author_kind text not null default 'learner'`, constrained to `('learner','character')`. Task 5 writes it; task 6 reads it.

**Why this column exists, and why it must be in the file as a comment:** `0007` designed `world_posts` for **generated** content — every row carries `generation_run_id` and `needs_human_review` so a bad batch can be revoked (R-014). D-030 now puts rows the *learner* wrote into the same table. ⛔ `character_id is null` is **not** a sufficient signal: `0007` itself documents that "an unattributed post is valid content", so an implicit distinction breaks the first time a character lands. The table is **empty**, so `not null` is safe today and will never be safe again.

- [x] **Step 1: Write the failing guard test**

```ts
// lib/supabase/worldAuthorKind.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guards 0010 against its shipped SQL text — the only guard available without a live
 * project, same technique and same limits as worldSchema.test.ts. Comments are stripped
 * first: a constraint that is commented out is a constraint that does not exist, and a
 * test reading raw text would stay green over it (C-0032).
 */
const SQL = readFileSync('supabase/migrations/0010_world_author_kind.sql', 'utf8')
  .replace(/--[^\n]*/g, '')
  .toLowerCase();

describe('0010 — world_posts.author_kind', () => {
  it('adds the column idempotently, so a re-run is not an error', () => {
    expect(SQL).toMatch(/alter table public\.world_posts\s+add column if not exists author_kind text/);
  });

  it('defaults to learner and forbids null — the table is empty, so this is safe exactly once', () => {
    expect(SQL).toMatch(/author_kind text\s+not null\s+default 'learner'/);
  });

  it('constrains the value to the two kinds that exist', () => {
    expect(SQL).toMatch(/check \(author_kind in \('learner','character'\)\)/);
  });

  it('wraps in one transaction — a half-applied migration is worse than none', () => {
    expect(SQL).toContain('begin;');
    expect(SQL).toContain('commit;');
  });

  it('⛔ loads not one row — this file is schema only', () => {
    expect(SQL).not.toContain('insert into');
  });

  it('⛔ does not touch any table but world_posts', () => {
    const tables = [...SQL.matchAll(/alter table public\.([a-z_]+)/g)].map((m) => m[1]);
    expect([...new Set(tables)]).toEqual(['world_posts']);
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/supabase/worldAuthorKind.test.ts`
Expected: FAIL — `ENOENT: no such file or directory, open 'supabase/migrations/0010_world_author_kind.sql'`.

- [x] **Step 3: Write the migration**

```sql
-- 0010_world_author_kind.sql — T-061 ⓐ · D-030
--
-- Apply AFTER 0007_world_schema.sql.
--
-- What: ONE column on world_posts. Nothing else.
--
-- Why: 0007 designed this table for GENERATED content — every row carries
-- generation_run_id and needs_human_review so a bad batch can be revoked (R-014).
-- D-030 now puts rows the LEARNER wrote into the same table, and the two kinds need
-- different treatment forever after: a learner row is never revoked, never sampled by
-- AQL, and never counted as content we published.
--
-- ⛔ `character_id is null` is NOT a sufficient signal. 0007 states in its own comment
--    that "a post that is not attributed to a persona is a legitimate feed item", so an
--    implicit rule breaks the first time an unattributed generated post lands.
--
-- `not null` is safe because the table is EMPTY today (T-049 loaded no rows and forbids
-- loading any). It will never be safe again — this is the one window.
--
-- ⛔ SCHEMA ONLY — this file loads not one row.
-- Idempotent and transactional, like 0006 · 0007 · 0008.

begin;

alter table public.world_posts
  add column if not exists author_kind text not null default 'learner'
    check (author_kind in ('learner','character'));

comment on column public.world_posts.author_kind is
  'Who wrote this row. ''learner'' = composed from the closed bank (D-030): never '
  'revoked, never AQL-sampled, generation_run_id is null. ''character'' = generated '
  'content under R-014.';

commit;
```

- [x] **Step 4: Run the test and watch it pass**

Run: `npx vitest run lib/supabase/worldAuthorKind.test.ts`
Expected: PASS, 6 tests.

- [x] **Step 5: Mutation-check the guard (do not skip)**

Temporarily change `default 'learner'` to `default 'character'` in the SQL and re-run. Expected: the second test goes RED. Restore the file and re-run to green. A guard that survives its own mutation is decoration.

- [x] **Step 6: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: all four pass; the test count rises by exactly 6.

- [x] **Step 7: Add a line to `plan/03-for-roy.md`**

Roy has to run migrations by hand — `0010` joins the list. One line, beside the existing migration items: «`supabase/migrations/0010_world_author_kind.sql` — עמודה אחת ב-`world_posts`. עד שתורץ, `/world` ו-`/world/compose` יחזירו 503 בעברית ולא ייכשלו.»

- [x] **Step 8: Commit**

```bash
git add supabase/migrations/0010_world_author_kind.sql lib/supabase/worldAuthorKind.test.ts plan/03-for-roy.md
git commit -m "loop(DEV): C-XXXX 0010 world_posts.author_kind + guard"
```

---

### Task 2: The pure layer — `lib/core/world.ts`

**Files:**
- Create: `lib/core/world.ts`
- Create: `lib/core/world.test.ts`

**Interfaces:**
- Consumes: nothing. This module imports **no other module** — it is leaf-pure.
- Produces, exactly these exports (tasks 3–8 use these names and no others):

```ts
export interface WorldCounts { readonly functionWords: number; readonly activeWords: number }
export interface WorldThresholds { readonly minFunctionWords: number; readonly minActiveWords: number }
export function isWorldUnlocked(counts: WorldCounts, thresholds: WorldThresholds): boolean;

export const PUNCTUATION_TOKENS: readonly string[];      // ['.', '?']
export const MAX_DRAFT_TOKENS: number;                   // 200 — a WIRE guard, ⛔ not a product cap
export function isBankToken(value: string): boolean;
export function normaliseToken(value: string): string;
export function draftContainsTarget(tokens: readonly string[], target: string): boolean;
export function renderDraft(tokens: readonly string[]): string;

export function uniqueHeadwords(rows: readonly { readonly headword: string | null }[]): string[];
export function pickTargetWord(activeWords: readonly string[], usedWords: readonly string[]): string | null;

export type PostPayload = { readonly target: string; readonly tokens: readonly string[] };
export type PostCheck =
  | { readonly ok: true; readonly payload: PostPayload }
  | { readonly ok: false; readonly reason: 'malformed' | 'target_missing' };
export function checkPostPayload(body: unknown): PostCheck;
```

**Two decisions this task locks, both stated here so a reviewer can reject them:**

1. **The unlock numbers (100 and 12) are NOT exported from `/lib/core`.** They are policy, and the repo has a rule about that: `PROMOTE_AFTER_CONSECUTIVE_CORRECT`, `NEW_CARDS_PER_DAY` and `SECONDS_PER_CARD` all live in their route with a `HEURISTIC` comment, precisely so a later reader cannot cite the pure layer as if it had *derived* them. D-031 is explicit that 12 "אינו מספר פדגוגי ואינו מתחזה לכזה". So `isWorldUnlocked` takes thresholds as an argument, and task 3's route owns the values.
2. **`MAX_DRAFT_TOKENS` is a wire guard, not the "תקרה מלאכותית" § 4.2ה forbids.** The spec's sentence is about the *screen*: the draft scrolls, no counter is shown, nothing is disabled at a length. 200 tokens is ~20× the median approved sentence (10 words) and exists so a hand-rolled POST cannot hand PostgREST an unbounded string. The UI must **not** display it, count toward it, or mention it.

- [x] **Step 1: Write the failing tests**

```ts
// lib/core/world.test.ts
import { describe, expect, it } from 'vitest';
import {
  MAX_DRAFT_TOKENS,
  PUNCTUATION_TOKENS,
  checkPostPayload,
  draftContainsTarget,
  isBankToken,
  isWorldUnlocked,
  normaliseToken,
  pickTargetWord,
  renderDraft,
  uniqueHeadwords,
} from './world';

const T = { minFunctionWords: 100, minActiveWords: 12 } as const;

describe('isWorldUnlocked — D-031, both counts, no flag', () => {
  it('opens when both counts are met', () => {
    expect(isWorldUnlocked({ functionWords: 121, activeWords: 12 }, T)).toBe(true);
  });

  it('is closed when the learner side is short by one', () => {
    expect(isWorldUnlocked({ functionWords: 121, activeWords: 11 }, T)).toBe(false);
  });

  it('is closed when the global bank is short by one — an empty bank cannot be composed from', () => {
    expect(isWorldUnlocked({ functionWords: 99, activeWords: 40 }, T)).toBe(false);
  });

  it('treats the threshold itself as met — the condition is >=, not >', () => {
    expect(isWorldUnlocked({ functionWords: 100, activeWords: 12 }, T)).toBe(true);
  });

  it('never opens on a negative or non-finite count', () => {
    expect(isWorldUnlocked({ functionWords: Number.NaN, activeWords: 40 }, T)).toBe(false);
    expect(isWorldUnlocked({ functionWords: 200, activeWords: -1 }, T)).toBe(false);
  });
});

describe('tokens — the closed bank has a shape, and free text does not have it', () => {
  it('accepts a plain English word', () => {
    expect(isBankToken('because')).toBe(true);
  });

  it('accepts the two punctuation buttons and nothing else punctuational', () => {
    expect(PUNCTUATION_TOKENS).toEqual(['.', '?']);
    expect(isBankToken('.')).toBe(true);
    expect(isBankToken('?')).toBe(true);
    expect(isBankToken('!')).toBe(false);
    expect(isBankToken(',')).toBe(false);
  });

  it('accepts the two shapes real headwords carry', () => {
    expect(isBankToken("don't")).toBe(true);
    expect(isBankToken('well-known')).toBe(true);
  });

  it('⛔ rejects anything that is a sentence rather than a word — there is no keyboard', () => {
    expect(isBankToken('i am here')).toBe(false);
    expect(isBankToken('')).toBe(false);
    expect(isBankToken('   ')).toBe(false);
    expect(isBankToken('<script>')).toBe(false);
    expect(isBankToken('שלום')).toBe(false);
    expect(isBankToken('a'.repeat(41))).toBe(false);
  });

  it('normalises for comparison only — case folds, surrounding space goes', () => {
    expect(normaliseToken('  Because ')).toBe('because');
    expect(normaliseToken('WELL-KNOWN')).toBe('well-known');
  });
});

describe('draftContainsTarget — exact token match, ⛔ not substring', () => {
  it('finds the target as a whole token', () => {
    expect(draftContainsTarget(['i', 'like', 'the', 'car'], 'car')).toBe(true);
  });

  it('⛔ does not accept the target hiding inside another word — "car" is not in "card"', () => {
    expect(draftContainsTarget(['i', 'have', 'a', 'card'], 'car')).toBe(false);
  });

  it('ignores case on both sides', () => {
    expect(draftContainsTarget(['Because'], 'because')).toBe(true);
  });

  it('is false for an empty draft and for an empty target', () => {
    expect(draftContainsTarget([], 'car')).toBe(false);
    expect(draftContainsTarget(['car'], '')).toBe(false);
  });
});

describe('renderDraft — mechanical join, ⛔ zero correction', () => {
  it('joins words with one space', () => {
    expect(renderDraft(['i', 'like', 'the', 'car'])).toBe('i like the car');
  });

  it('attaches punctuation to the word before it', () => {
    expect(renderDraft(['i', 'like', 'the', 'car', '.'])).toBe('i like the car.');
    expect(renderDraft(['do', 'you', 'like', 'it', '?'])).toBe('do you like it?');
  });

  it('⛔ does NOT capitalise, because capitalising is correcting (R-016)', () => {
    expect(renderDraft(['i', 'am', 'here'])).toBe('i am here');
  });

  it('⛔ does NOT reorder, dedupe or drop anything', () => {
    expect(renderDraft(['the', 'the', 'car'])).toBe('the the car');
  });

  it('handles leading punctuation without emitting a stray space', () => {
    expect(renderDraft(['.', 'car'])).toBe('. car');
  });
});

describe('uniqueHeadwords — the bank shows a surface form ONCE (§ 4.2ה)', () => {
  it('collapses the 12 measured headwords that carry both a function and a content sense', () => {
    const rows = [{ headword: 'can' }, { headword: 'can' }, { headword: 'like' }];
    expect(uniqueHeadwords(rows)).toEqual(['can', 'like']);
  });

  it('collapses case and trims, then sorts — two identical requests return the same bank', () => {
    expect(uniqueHeadwords([{ headword: 'Over' }, { headword: 'over ' }, { headword: 'back' }]))
      .toEqual(['back', 'over']);
  });

  it('drops rows with no headword rather than emitting an empty chip', () => {
    expect(uniqueHeadwords([{ headword: null }, { headword: '  ' }, { headword: 'no' }])).toEqual(['no']);
  });
});

describe('pickTargetWord — deterministic, ⛔ no clock and ⛔ no randomness', () => {
  it('prefers an active word the learner has not produced yet', () => {
    expect(pickTargetWord(['car', 'book', 'apple'], ['apple', 'book'])).toBe('car');
  });

  it('is alphabetical among the unused, so two calls in one second agree', () => {
    expect(pickTargetWord(['car', 'book', 'apple'], [])).toBe('apple');
  });

  it('falls back to the first active word once every one has been used — ⛔ never null-with-words', () => {
    expect(pickTargetWord(['car', 'book'], ['car', 'book'])).toBe('book');
  });

  it('is null only when the learner has no active words at all', () => {
    expect(pickTargetWord([], ['car'])).toBeNull();
  });

  it('compares case-insensitively — "Car" used means "car" is used', () => {
    expect(pickTargetWord(['car', 'book'], ['Car'])).toBe('book');
  });
});

describe('checkPostPayload — the server decides, ⛔ not the button', () => {
  it('accepts a well-formed draft that contains its target', () => {
    const result = checkPostPayload({ target: 'car', tokens: ['i', 'like', 'the', 'car', '.'] });
    expect(result).toEqual({ ok: true, payload: { target: 'car', tokens: ['i', 'like', 'the', 'car', '.'] } });
  });

  it('rejects a draft without its target, and says WHICH failure it is', () => {
    expect(checkPostPayload({ target: 'car', tokens: ['i', 'like', 'it'] }))
      .toEqual({ ok: false, reason: 'target_missing' });
  });

  it('rejects a body that is not the shape at all', () => {
    for (const body of [null, undefined, 'car', 42, [], {}, { target: 'car' }, { tokens: ['car'] }]) {
      expect(checkPostPayload(body).ok, JSON.stringify(body) ?? 'undefined').toBe(false);
    }
  });

  it('rejects free text smuggled in as one token — there is no keyboard on that screen', () => {
    expect(checkPostPayload({ target: 'car', tokens: ['buy my car at example.com'] }))
      .toEqual({ ok: false, reason: 'malformed' });
  });

  it('rejects an empty draft', () => {
    expect(checkPostPayload({ target: 'car', tokens: [] })).toEqual({ ok: false, reason: 'malformed' });
  });

  it('rejects a draft past the wire guard, ⛔ which is not a product cap', () => {
    const tokens = Array.from({ length: MAX_DRAFT_TOKENS + 1 }, () => 'car');
    expect(checkPostPayload({ target: 'car', tokens })).toEqual({ ok: false, reason: 'malformed' });
    const atCeiling = Array.from({ length: MAX_DRAFT_TOKENS }, () => 'car');
    expect(checkPostPayload({ target: 'car', tokens: atCeiling }).ok).toBe(true);
  });

  it('checks the shape BEFORE the target, so a malformed body never reports target_missing', () => {
    expect(checkPostPayload({ target: 'car', tokens: ['<script>car</script>'] }))
      .toEqual({ ok: false, reason: 'malformed' });
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/world.test.ts`
Expected: FAIL — `Failed to resolve import "./world"`.

- [x] **Step 3: Write `lib/core/world.ts`**

```ts
/**
 * PURE. No React, no DOM, no clock, no env, no I/O. The world layer: it decides when the
 * tab opens, what counts as a bank token, and whether a draft may be published.
 *
 * ⛔ The two unlock numbers (100 · 12) are NOT here. They are policy, and the repo keeps
 * policy in the route that owns it (`PROMOTE_AFTER_CONSECUTIVE_CORRECT`,
 * `NEW_CARDS_PER_DAY`) for one reason: a constant exported from the pure layer gets cited
 * later as if this layer had DERIVED it. D-031 says outright that 12 "אינו מספר פדגוגי
 * ואינו מתחזה לכזה" — it is a product threshold measured off our own approved sentences.
 * So the predicate takes its thresholds as an argument.
 *
 * ⛔ Nothing here judges English. R-016: no grading, no correction, no "nice", no "right".
 * `renderDraft` joins and does not capitalise, because capitalising is correcting.
 */

export interface WorldCounts {
  readonly functionWords: number;
  readonly activeWords: number;
}

export interface WorldThresholds {
  readonly minFunctionWords: number;
  readonly minActiveWords: number;
}

/** D-031. Both conditions are counts. A non-finite or negative count is "we do not know",
 *  and "we do not know" is ⛔ never an open door. */
export function isWorldUnlocked(counts: WorldCounts, thresholds: WorldThresholds): boolean {
  const ok = (value: number, floor: number): boolean =>
    Number.isFinite(value) && value >= floor;
  return (
    ok(counts.functionWords, thresholds.minFunctionWords) &&
    ok(counts.activeWords, thresholds.minActiveWords)
  );
}

/** The only two punctuation marks the screen offers, as fixed buttons — § 4.2ה.
 *  ⛔ Not a keyboard, and ⛔ not extensible without a PM decision. */
export const PUNCTUATION_TOKENS: readonly string[] = ['.', '?'];

/**
 * A wire guard, ⛔ NOT the "תקרה מלאכותית" § 4.2ה forbids. The spec's sentence is about
 * the screen: the draft scrolls, no counter is shown, nothing is disabled at a length.
 * This exists so a hand-rolled POST cannot hand the database an unbounded string. It is
 * ~20× the median approved sentence (10 words), and the UI must never display it.
 */
export const MAX_DRAFT_TOKENS = 200;

const MAX_TOKEN_LENGTH = 40;
/** A single English surface form: letters, and the two marks real headwords carry inside
 *  them. ⛔ No space — a token with a space is a sentence, and this screen has no keyboard. */
const WORD_TOKEN = /^[a-z][a-z'’-]*$/;

export function normaliseToken(value: string): string {
  return value.trim().toLowerCase();
}

export function isBankToken(value: string): boolean {
  if (typeof value !== 'string') return false;
  const token = value.trim();
  if (token.length === 0 || token.length > MAX_TOKEN_LENGTH) return false;
  if (PUNCTUATION_TOKENS.includes(token)) return true;
  return WORD_TOKEN.test(token.toLowerCase());
}

/** Exact token match. ⛔ Never `includes()` on the joined string: "car" would then be
 *  satisfied by "card", which is the same false-accept class as F-020. */
export function draftContainsTarget(tokens: readonly string[], target: string): boolean {
  const wanted = normaliseToken(target);
  if (wanted === '') return false;
  return tokens.some((token) => normaliseToken(token) === wanted);
}

/** Mechanical. Punctuation attaches to the word before it; everything else is joined by one
 *  space. ⛔ No capitalisation, no reordering, no dedupe — all three are corrections. */
export function renderDraft(tokens: readonly string[]): string {
  return tokens
    .reduce<string>((sentence, raw) => {
      const token = raw.trim();
      if (token === '') return sentence;
      if (sentence === '') return token;
      return PUNCTUATION_TOKENS.includes(token) ? `${sentence}${token}` : `${sentence} ${token}`;
    }, '')
    .trim();
}

/**
 * § 4.2ה: "הבנק מציג כל צורת שטח פעם אחת, ולכן השאילתה מקבצת לפי headword ולא לפי sense."
 * Measured C-0092: 12 headwords (`can` · `like` · `back` · `first` · `home` · `little` ·
 * `no` · `off` · `once` · `only` · `over` · `still`) carry both a function and a content
 * sense, so a sense-shaped bank would show each of them twice.
 * Sorted, so two identical requests return the same bank in the same order.
 */
export function uniqueHeadwords(rows: readonly { readonly headword: string | null }[]): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const headword = typeof row.headword === 'string' ? normaliseToken(row.headword) : '';
    if (headword !== '') seen.add(headword);
  }
  return [...seen].sort();
}

/**
 * Today's target word.
 *
 * ⚠️ § 4.2ה fixes that there IS one target, drawn from the learner's active words, and does
 * ⛔ not fix which. This rule is the smallest deterministic one that does not need a clock:
 * the alphabetically first active word the learner has not produced yet, falling back to the
 * alphabetically first overall once they all have been. It is one pure function, so a PM
 * decision replaces it in a single edit.
 */
export function pickTargetWord(
  activeWords: readonly string[],
  usedWords: readonly string[],
): string | null {
  const ordered = [...new Set(activeWords.map(normaliseToken))].filter((w) => w !== '').sort();
  if (ordered.length === 0) return null;
  const used = new Set(usedWords.map(normaliseToken));
  return ordered.find((word) => !used.has(word)) ?? ordered[0] ?? null;
}

export type PostPayload = { readonly target: string; readonly tokens: readonly string[] };
export type PostCheck =
  | { readonly ok: true; readonly payload: PostPayload }
  | { readonly ok: false; readonly reason: 'malformed' | 'target_missing' };

/**
 * The publish rule, decided HERE and enforced by the route — § 4.2ה: "נאכפת בשרת ולא רק
 * ב-UI". Shape is checked before the target, so a malformed body never reports
 * `target_missing`: that message is shown to the learner as guidance, and showing it over a
 * broken request would be a lie about what went wrong.
 */
export function checkPostPayload(body: unknown): PostCheck {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false, reason: 'malformed' };
  }
  const candidate = body as { target?: unknown; tokens?: unknown };
  if (typeof candidate.target !== 'string' || !isBankToken(candidate.target)) {
    return { ok: false, reason: 'malformed' };
  }
  if (!Array.isArray(candidate.tokens)) return { ok: false, reason: 'malformed' };
  const tokens = candidate.tokens;
  if (tokens.length === 0 || tokens.length > MAX_DRAFT_TOKENS) {
    return { ok: false, reason: 'malformed' };
  }
  if (!tokens.every((token): token is string => typeof token === 'string' && isBankToken(token))) {
    return { ok: false, reason: 'malformed' };
  }
  if (!draftContainsTarget(tokens, candidate.target)) {
    return { ok: false, reason: 'target_missing' };
  }
  return { ok: true, payload: { target: normaliseToken(candidate.target), tokens } };
}
```

- [x] **Step 4: Run the tests and watch them pass**

Run: `npx vitest run lib/core/world.test.ts`
Expected: PASS.

- [x] **Step 5: Mutation-check two assertions (do not skip)**

(a) Change `draftContainsTarget` to `tokens.join(' ').includes(wanted)`. Expected: the `"car" is not in "card"` test goes RED. Restore.
(b) Change `renderDraft` to capitalise the first character. Expected: the `⛔ does NOT capitalise` test goes RED. Restore. Re-run to green.

- [x] **Step 6: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
Expected: `check:core` prints `/lib/core purity: OK`; the test count rises by the number of cases added.

- [x] **Step 7: Commit**

```bash
git add lib/core/world.ts lib/core/world.test.ts
git commit -m "loop(DEV): C-XXXX lib/core/world — unlock, tokens, publish rule"
```

---

### Task 3: `GET /api/world/status`

**Files:**
- Create: `app/api/world/status/route.ts`
- Create: `app/api/world/status/route.test.ts`
- Modify: `docs/api-contract.md` (new section, **same commit**)

**Interfaces:**
- Consumes: `isWorldUnlocked`, `uniqueHeadwords` from `lib/core/world`; `createRouteClient`, `readSupabaseEnv` from `lib/supabase/auth`.
- Produces: `GET /api/world/status` ⇒ `200 { ok: true, unlocked: boolean, functionWords: number, activeWords: number }`. Task 7 (`TabBar`) is the consumer.

**The one thing that is easy to get wrong:** D-031 ⓐ counts **unique headwords**, and `words` is `unique (headword, pos)` — the same word can hold several rows. Measured C-0092: 121 unique headwords across 139 senses. PostgREST cannot express `count(distinct headword)`, so the route selects the headword column under a ceiling and lets `uniqueHeadwords` do the dedupe. ⛔ A `head: true` exact count would report rows and overstate the bank.

- [x] **Step 1: Write the failing source test**

```ts
// app/api/world/status/route.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * A source guard, same shape and same limits as app/api/study/queue/route.test.ts: the
 * vitest environment is node and there is no Supabase project here, so behaviour cannot be
 * reached. What it proves is the part that is otherwise believed rather than measured —
 * the guard order, the dedupe, and that the unlock is COMPUTED.
 */
const SRC = readFileSync('app/api/world/status/route.ts', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('GET /api/world/status', () => {
  it('checks ENV, then the session, and only then queries — the C-0032 order', () => {
    const env = CODE.indexOf('readSupabaseEnv');
    const session = CODE.indexOf('auth.getUser');
    const query = CODE.indexOf(".from('");
    expect(env).toBeGreaterThan(-1);
    expect(session).toBeGreaterThan(env);
    expect(query).toBeGreaterThan(session);
  });

  it('computes `unlocked` from the counts and ⛔ never from a flag or an env var', () => {
    expect(CODE).toContain('isWorldUnlocked');
    expect(CODE).not.toMatch(/unlocked\s*[:=]\s*(true|false)/);
    expect(CODE).not.toContain('WORLD_UNLOCKED');
  });

  it('owns the two thresholds HERE, as policy, and ⛔ does not import them from /lib/core', () => {
    expect(CODE).toMatch(/MIN_FUNCTION_WORDS\s*=\s*100/);
    expect(CODE).toMatch(/MIN_ACTIVE_WORDS\s*=\s*12/);
    expect(CODE).not.toMatch(/import[^;]*MIN_(FUNCTION|ACTIVE)_WORDS/);
  });

  it('counts UNIQUE headwords — words is unique(headword,pos), so rows overstate the bank', () => {
    // ⚠️ MEASURED in C-0120, ⛔ not assumed: `toContain('uniqueHeadwords')` is BLIND —
    // replacing the call with `(bank.data ?? []).length` leaves the IMPORT line untouched,
    // so the file still "contains" the name and the assertion stayed green through the
    // mutation. Read the count off the CALL SITE. ⛔ Tasks 4-5 must not copy the weak form.
    expect(CODE).toMatch(/functionWords:\s*uniqueHeadwords\(/);
    expect(CODE).toMatch(/\.eq\('is_function_word',\s*true\)/);
  });

  it('counts the learner side from is_active_this_week, scoped to the caller', () => {
    expect(CODE).toMatch(/\.eq\('is_active_this_week',\s*true\)/);
    expect(CODE).toMatch(/\.eq\('user_id',\s*user\.id\)/);
  });

  it('⛔ never reads senses.cefr_level (D-034)', () => {
    expect(CODE).not.toContain('cefr_level');
  });

  it('answers a missing schema with 503 in Hebrew, ⛔ not 500 and ⛔ not an empty screen', () => {
    expect(CODE).toContain('42P01');
    expect(CODE).toContain('PGRST205');
    expect(CODE).toContain('schema_missing');
    expect(CODE).toContain('המאגר עדיין לא הוקם');
  });

  it('⛔ never puts the database message in the response body', () => {
    for (const line of CODE.split('\n')) {
      if (line.includes('error.message')) {
        expect(line, `error.message escapes on: ${line.trim()}`).toContain('console.error');
      }
    }
  });

  it('is dynamic — a cached unlock state is a wrong unlock state', () => {
    expect(CODE).toMatch(/export const dynamic\s*=\s*'force-dynamic'/);
  });
});
```

- [x] **Step 2: Run it and watch it fail**

Run: `npx vitest run app/api/world/status/route.test.ts`
Expected: FAIL — `ENOENT ... app/api/world/status/route.ts`.

- [x] **Step 3: Write the route**

Follow `app/api/study/queue/route.ts` exactly for the guard block. The body:

```ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isWorldUnlocked, uniqueHeadwords } from '@/lib/core/world';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * POLICY, ⛔ not evidence, and it lives here for the same reason
 * PROMOTE_AFTER_CONSECUTIVE_CORRECT does in app/api/study/queue/route.ts: a constant
 * exported from /lib/core is cited later as if the pure layer had derived it. D-031 states
 * outright that 12 is a product threshold measured off our own 403 approved sentences
 * (median length 10 words), ⛔ has no pedagogical source, and ⛔ must never be written into
 * plan/10-pedagogy.md. Changing either number needs no migration.
 */
const MIN_FUNCTION_WORDS = 100;
const MIN_ACTIVE_WORDS = 12;

/** `words` is `unique (headword, pos)`, so one headword can hold several rows and a row
 *  count would OVERSTATE the bank (measured C-0092: 121 headwords across 139 senses).
 *  PostgREST cannot express `count(distinct headword)`, so the dedupe happens in the pure
 *  layer and this is the ceiling on what we are willing to read to do it. */
const MAX_BANK_ROWS = 2000;

export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const bank = await supabase
    .from('words')
    .select('headword')
    .eq('is_function_word', true)
    .order('headword', { ascending: true })
    .limit(MAX_BANK_ROWS);

  if (bank.error) return schemaAwareFailure('bank', bank.error);

  const active = await supabase
    .from('word_progress')
    .select('word_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_active_this_week', true);

  if (active.error) return schemaAwareFailure('active', active.error);

  const counts = {
    functionWords: uniqueHeadwords((bank.data ?? []) as { headword: string | null }[]).length,
    activeWords: active.count ?? 0,
  };

  return NextResponse.json({
    ok: true,
    unlocked: isWorldUnlocked(counts, {
      minFunctionWords: MIN_FUNCTION_WORDS,
      minActiveWords: MIN_ACTIVE_WORDS,
    }),
    ...counts,
  });
}
```

Add the shared failure helper in the same file (it is used by both reads):

```ts
function schemaAwareFailure(where: string, error: { message: string; code?: string }) {
  // The raw string goes to the log and ⛔ never into the body — a PostgREST message names
  // columns and tables.
  console.error(`[api/world/status] ${where} read failed:`, error.message);
  if (error.code === '42P01' || error.code === 'PGRST205') {
    return NextResponse.json(
      { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}
```

- [x] **Step 4: Run the test and watch it pass**

Run: `npx vitest run app/api/world/status/route.test.ts`
Expected: PASS, 9 tests.

- [x] **Step 5: Mutation-check the unlock guard**

Replace `isWorldUnlocked(...)` with `unlocked: true`. Expected: the second test goes RED. Restore, re-run green.

✅ **Measured C-0120.** Mutation ⓐ (`unlocked: true`) killed exactly the named test — `expected … not to match /unlocked\s*[:=]\s*(true|false)/`. Mutation ⓑ (`uniqueHeadwords(...)` ⇒ `(bank.data ?? []).length`) **SURVIVED 9/9 green** against the assertion as written in this plan, because the import line still carried the name; the assertion was strengthened to the call site above and the same mutation then went RED. ⛔ The route was restored byte-for-byte and re-run green both times.

- [x] **Step 6: Write the contract section — same commit**

Add `## GET /api/world/status` to `docs/api-contract.md`, after `## GET /api/study/queue`, matching the existing sections' shape: request (no parameters), the 200 body with all four fields, and every failure — 401 `session_expired`, 503 `schema_missing` (with the Hebrew sentence), 503 `unavailable`. State plainly that `unlocked` is **computed from the two counts on every call** and is ⛔ not cached, ⛔ not a flag, and ⛔ not a date.

- [x] **Step 7: Full verification and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add app/api/world/status docs/api-contract.md
git commit -m "loop(DEV): C-XXXX GET /api/world/status + contract"
```

---

### Task 4: `GET /api/world/bank`

**Files:**
- Create: `app/api/world/bank/route.ts`
- Create: `app/api/world/bank/route.test.ts`
- Modify: `docs/api-contract.md` (**same commit**)

**Interfaces:**
- Consumes: `uniqueHeadwords`, `pickTargetWord` from `lib/core/world`.
- Produces: `GET /api/world/bank` ⇒ `200 { ok: true, functionWords: string[], activeWords: string[], target: string | null }`. Task 8 (`/world/compose`) is the only consumer.

**⚠️ Reported deviation, to be repeated in the tick's handoff line:** this endpoint is **not** in T-061's file list. It is required anyway, and by a rule the task list does not get to waive — a UI component may never reach the database, so `/world/compose` cannot obtain the bank without a route. It is added here rather than inside T-063 so that all three world endpoints and their contract sections land together.

- [x] **Step 1: Write the failing source test**

```ts
// app/api/world/bank/route.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/world/bank/route.ts', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('GET /api/world/bank', () => {
  it('checks ENV, then the session, and only then queries', () => {
    const env = CODE.indexOf('readSupabaseEnv');
    const session = CODE.indexOf('auth.getUser');
    const query = CODE.indexOf(".from('");
    expect(session).toBeGreaterThan(env);
    expect(query).toBeGreaterThan(session);
  });

  it('groups BOTH bank groups by headword and ⛔ not by sense (§ 4.2ה — 12 measured duplicates)', () => {
    // ⚠️ MEASURED C-0120 and re-confirmed C-0122, ⛔ not assumed: `toContain('uniqueHeadwords')`
    // is BLIND — the `import` line alone satisfies it. Read the dedupe off the CALL SITES,
    // one per group. ⛔ Task 5 must not copy the weak form either.
    expect(CODE).toMatch(/functionWords:\s*uniqueHeadwords\(/);
    expect(CODE).toMatch(/activeWords\s*=\s*uniqueHeadwords\(/);
    expect(CODE).toMatch(/\.eq\('is_function_word',\s*true\)/);
  });

  it('reads the learner group from is_active_this_week, ⛔ not the whole vocabulary', () => {
    expect(CODE).toMatch(/\.eq\('is_active_this_week',\s*true\)/);
    expect(CODE).toMatch(/\.eq\('user_id',\s*user\.id\)/);
  });

  it('picks the target in the pure layer — deterministic, ⛔ no Math.random and ⛔ no clock', () => {
    expect(CODE).toMatch(/target:\s*pickTargetWord\(/);
    expect(CODE).not.toContain('Math.random');
    expect(CODE).not.toContain('Date.now');
    expect(CODE).not.toContain('new Date');
  });

  it('⛔ never reads senses.cefr_level (D-034)', () => {
    expect(CODE).not.toContain('cefr_level');
  });

  it('answers a missing schema with 503 in Hebrew', () => {
    expect(CODE).toContain('schema_missing');
    expect(CODE).toContain('המאגר עדיין לא הוקם');
  });

  it('⛔ never puts the database message in the response body', () => {
    for (const line of CODE.split('\n')) {
      if (line.includes('error.message')) expect(line).toContain('console.error');
    }
  });
});
```

- [x] **Step 2: Run it and watch it fail** — `npx vitest run app/api/world/bank/route.test.ts`, ENOENT.

- [x] **Step 3: Write the route**

Same guard block as task 3. Three reads, then the pure layer:

1. `words` where `is_function_word = true`, `select('headword')`, ordered, `limit(MAX_BANK_ROWS)` ⇒ `uniqueHeadwords(...)` ⇒ `functionWords`.
2. `word_progress` where `user_id = user.id` and `is_active_this_week = true`, `select('words!inner(headword)')` ⇒ flatten ⇒ `uniqueHeadwords(...)` ⇒ `activeWords`.
   `words!inner` is deliberate, and for the same reason `app/api/study/queue/route.ts` gives: a progress row whose word was deleted is not a bank chip, and an outer join surfaces it as a chip with nothing written on it.
3. `world_posts` where `user_id = user.id` and `author_kind = 'learner'`, `select('body_en')`, `limit(MAX_USED_ROWS)` ⇒ split each body on whitespace ⇒ `usedWords`.
   ⚠️ If this third read fails, ⛔ do **not** fail the request: `usedWords` becomes `[]` and `pickTargetWord` falls back to the alphabetically first active word. A learner who cannot be given the *ideal* target still gets a working screen; a 503 here would blank a screen over an optimisation.

Then `target: pickTargetWord(activeWords, usedWords)`.

- [x] **Step 4: Run the test and watch it pass** — **11 tests green** (7 planned + 4 added at execution: the `words!inner` join, the non-fatal third read, `force-dynamic`, and scoping `world_posts` to `author_kind = 'learner'`).

- [x] **Step 5: Mutation-check the dedupe** — replace `uniqueHeadwords(rows)` with `rows.map((r) => r.headword)`. Expected: the second test goes RED. Restore.

✅ **Measured C-0122 — four mutations, four named failures, ⛔ none survived.** ⓐ `functionWords` dedupe ⇒ `.map((r) => r.headword)` killed *groups BOTH bank groups by headword*. ⓑ the same drop on `activeWords` killed the same test — which is why the assertion names **both** call sites: with a single assertion ⓑ would have survived. ⓒ making the third (`world_posts`) read fatal — `return schemaAwareFailure('used', …)` — killed *⛔ does NOT fail the request when the usedWords read fails*, so the "a 503 blanks a screen over an optimisation" rule is **measured** and not merely written here. ⓓ `words!inner(headword)` ⇒ `words(headword)` killed the orphan-chip test. The route was restored **byte-for-byte** (`diff` against a pre-mutation copy, clean) and re-run green 11/11 after each.

- [x] **Step 6: Contract section, same commit** — `## GET /api/world/bank`, including the sentence that `target` is `null` **only** when the learner has no active words, and that the selection rule is deterministic and stated in `lib/core/world.ts`.

- [x] **Step 7: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add app/api/world/bank docs/api-contract.md
git commit -m "loop(DEV): C-XXXX GET /api/world/bank + contract"
```

---

### Task 5: `GET`/`POST /api/world/posts`

**Files:**
- Create: `app/api/world/posts/route.ts`
- Create: `app/api/world/posts/route.test.ts`
- Modify: `docs/api-contract.md` (**same commit**)

**Interfaces:**
- Consumes: `checkPostPayload`, `renderDraft` from `lib/core/world`.
- Produces:
  - `GET` ⇒ `200 { ok: true, posts: { id: string; body_en: string; created_at: string }[], total: number }`, newest first.
  - `POST` body `{ target: string, tokens: string[] }` ⇒ `201 { ok: true, post: {...}, usedWord: string }` · `400 { ok:false, code:'target_missing', message:'הוסף את <word> כדי לפרסם' }` · `400 { ok:false, code:'unavailable' }` for a malformed body.

**The publish contract, restated so the implementer cannot miss it:** the row is `{ user_id, body_en: renderDraft(tokens), author_kind: 'learner', generation_run_id: null, character_id: null, needs_human_review: false }`. ⛔ Nothing else is written, anywhere, by this route. The response label is factual — «השתמשת ב-<word>» — and ⛔ never «נכון» or «יפה» (R-016).

- [ ] **Step 1: Write the failing source test**

```ts
// app/api/world/posts/route.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/world/posts/route.ts', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/** The balanced-brace region opened by `open`, `open` included — the C-0100 lesson reused:
 *  a character-distance regex convicts correct code the moment an unrelated line moves. */
function braceRegion(source: string, open: string): string {
  const start = source.indexOf(open);
  expect(start, `expected ${open}`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces after ${open}`);
}

describe('POST /api/world/posts — the publish rule', () => {
  it('checks ENV, then the session, and only then reads the body', () => {
    const env = CODE.indexOf('readSupabaseEnv');
    const session = CODE.indexOf('auth.getUser');
    const body = CODE.indexOf('request.json');
    expect(session).toBeGreaterThan(env);
    expect(body).toBeGreaterThan(session);
  });

  it('enforces the target word ON THE SERVER (§ 4.2ה) and ⛔ does not trust the button', () => {
    expect(CODE).toContain('checkPostPayload');
    expect(CODE).toContain('target_missing');
  });

  it('answers the missing target with guidance and ⛔ never with a grade', () => {
    expect(CODE).toContain('כדי לפרסם');
    for (const forbidden of ['נכון', 'יפה', 'שגוי', 'טעות', 'ציון']) {
      expect(CODE, `R-016: "${forbidden}" must not appear`).not.toContain(forbidden);
    }
  });

  it('renders the body through the pure layer — ⛔ no join() in the route', () => {
    expect(CODE).toContain('renderDraft');
    expect(CODE).not.toMatch(/tokens\.join/);
  });

  it('writes author_kind=learner and generation_run_id=null in the SAME object', () => {
    const insert = braceRegion(CODE, '.insert(');
    expect(insert).toContain("author_kind: 'learner'");
    expect(insert).toContain('generation_run_id: null');
    expect(insert).toMatch(/user_id:\s*user\.id/);
  });

  it('⛔ writes to no table but world_posts — not senses, not words, not word_progress', () => {
    const tables = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(tables)].sort()).toEqual(['world_posts']);
  });

  it('⛔ contains none of the scheduling columns — publishing is not a review (D-033)', () => {
    for (const column of ['easiness', 'interval_days', 'repetition', 'next_review_at', 'reps']) {
      expect(CODE, `${column} must be absent from this file`).not.toContain(column);
    }
  });

  it('⛔ never reads or writes senses.cefr_level (D-034)', () => {
    expect(CODE).not.toContain('cefr_level');
  });
});

describe('GET /api/world/posts — the private feed', () => {
  it('scopes to the caller and orders newest first', () => {
    const get = braceRegion(CODE, 'export async function GET');
    expect(get).toMatch(/\.eq\('user_id',\s*user\.id\)/);
    expect(get).toMatch(/\.order\('created_at',\s*\{\s*ascending:\s*false/);
  });

  it('answers an empty feed with 200 — "you have not written yet" is a state, not an error', () => {
    const get = braceRegion(CODE, 'export async function GET');
    expect(get).not.toContain('404');
  });

  it('⛔ never puts the database message in the response body', () => {
    for (const line of CODE.split('\n')) {
      if (line.includes('error.message')) expect(line).toContain('console.error');
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail** — ENOENT.

- [ ] **Step 3: Write the route.** Guard block identical to tasks 3–4. `POST` inserts the object above with `.select('id, body_en, created_at').single()` and answers `201`. `GET` selects `id, body_en, created_at` from `world_posts` where `user_id` and `author_kind='learner'`, ordered `created_at` descending, `limit(MAX_FEED_ROWS = 100)`, and returns `{ ok: true, posts, total: posts.length }`.

- [ ] **Step 4: Run the test and watch it pass** — 11 tests green.

- [ ] **Step 5: Mutation-check twice.** (a) Remove `author_kind: 'learner'` from the insert ⇒ the fifth test RED. (b) Replace `checkPostPayload` with a bare truthy check ⇒ the second test RED. Restore both; re-run green.

- [ ] **Step 6: Contract section, same commit** — `## GET /api/world/posts` and `## POST /api/world/posts`, with the exact request body, the 201 body, and all four failure codes. State that `POST` **writes exactly one row in one table** and name the columns it sets.

- [ ] **Step 7: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add app/api/world/posts docs/api-contract.md
git commit -m "loop(DEV): C-XXXX world posts route — feed + publish + contract"
```

> **T-061 closes here.** Update `plan/50-tasks.md` (T-061 ✅ with the deviation named), `plan/30-architecture.md` (the three endpoints + any new TD), and `plan/00-control.md`.

---

### Task 6: `/world` — the private feed

**Files:**
- Create: `app/(tabs)/world/page.tsx`
- Create: `components/WorldFeed.tsx`
- Create: `components/WorldFeed.test.ts`

**Interfaces:**
- Consumes: `GET /api/world/posts` through `apiGet` from `lib/api/client`; `<EnText>` / `<EnWord>` from `components/EnWord`.
- Produces: the route `/world` inside the `(tabs)` group, so it receives the tab bar and ⛔ can never receive an `<ActionBar>` (D-028).

**Five states, and the reason each is fixed by § 4.2ה:** loading ⇒ a **skeleton in the shape of the content**, ⛔ never a spinner on white (constitution § 5) · empty ⇒ one action, «כתוב את הפוסט הראשון», ⛔ never a white screen · loaded ⇒ posts newest-first through `<EnText>` plus the counter «מילים שהפקת», which is a **separate** counter from «מילים שנלמדו» on `/studies` · failed ⇒ Hebrew + «נסה שוב», ⛔ no English error text and ⛔ no raw code · session expired ⇒ `/login`.

**The counter, precisely:** «מילים שהפקת» is the number of **distinct target words the learner has published**, ⛔ not the number of posts and ⛔ not the number of words in them. Derive it in the client from `posts.length`? No — that would be the post count. Derive it from the distinct tokens across `posts[].body_en` intersected with nothing: the honest, cheap version is **the count of distinct non-punctuation tokens across the learner's posts**, computed with `uniqueHeadwords`-style normalisation. ⚠️ If that proves to need server work, the fallback is to show the post count under the label «פוסטים שכתבת» and record the gap — ⛔ do **not** print a number under a label it does not measure (the `<MeScreen>` rule: «—» is honest, a wrong number never is).

- [ ] **Step 1: Write the failing source test**

```ts
// components/WorldFeed.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/WorldFeed.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('<WorldFeed>', () => {
  it('is a client component — it holds fetch state', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
  });

  it('reaches the server ONLY through lib/api/client (⛔ no direct supabase import)', () => {
    expect(CODE).toContain("from '@/lib/api/client'");
    expect(CODE).not.toContain('@supabase');
    expect(CODE).not.toContain('createBrowserClient');
  });

  it('renders every English run through the bidi wrapper, ⛔ never a bare span', () => {
    expect(CODE).toMatch(/<EnText|<EnWord/);
  });

  it('has an empty state with exactly one action, ⛔ not a white screen', () => {
    expect(CODE).toContain('כתוב את הפוסט הראשון');
  });

  it('has a skeleton in the shape of the content, ⛔ not a spinner (constitution § 5)', () => {
    expect(CODE).toMatch(/animate-pulse|data-skeleton/);
    expect(CODE).not.toMatch(/spinner|animate-spin/);
  });

  it('shows «—» and ⛔ not 0 when the count is unknown — the <MeScreen> rule', () => {
    expect(CODE).toContain('—');
  });

  it('⛔ carries no ActionBar — this screen already has the tab bar (D-028)', () => {
    expect(CODE).not.toContain('ActionBar');
  });

  it('⛔ has no vertical centring — F-011 came back once as F-016', () => {
    expect(CODE).not.toMatch(/justify-center[^"']*flex-1|flex-1[^"']*justify-center/);
  });

  it('⛔ uses no radius outside the frozen constitution § 3', () => {
    const radii = [...CODE.matchAll(/rounded-([a-z0-9]+)/g)].map((m) => m[1]);
    expect([...new Set(radii)].filter((r) => !['md', 'lg', '2xl'].includes(r))).toEqual([]);
  });

  it('⛔ says nothing that grades the learner (R-016)', () => {
    for (const forbidden of ['נכון', 'יפה', 'כל הכבוד', 'שגוי', 'טעות']) {
      expect(CODE, `R-016: "${forbidden}"`).not.toContain(forbidden);
    }
  });
});
```

- [ ] **Step 2: Run it and watch it fail** — ENOENT.

- [ ] **Step 3: Write `components/WorldFeed.tsx`** — five states, tokens only, `min-h-touch` on the one action.

- [ ] **Step 4: Write `app/(tabs)/world/page.tsx`** — a Server Component that renders the heading and `<WorldFeed />`. ⛔ No data access, no `searchParams` beyond what it renders.

- [ ] **Step 5: Run the test and watch it pass** — 10 tests green.

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add "app/(tabs)/world" components/WorldFeed.tsx components/WorldFeed.test.ts
git commit -m "loop(DEV): C-XXXX /world — the private feed"
```

---

### Task 7: The tab unlocks itself

**Files:**
- Modify: `components/TabBar.tsx`
- Modify: `components/TabBar.test.ts`

**Interfaces:**
- Consumes: `GET /api/world/status` through `apiGet`.
- Produces: no new export. `TABS` keeps its four entries and its RTL order; only the world entry's behaviour becomes state-dependent.

**⚠️ The existing test that locks today's behaviour is UPDATED, ⛔ not deleted.** Both states get a test: locked (the current sheet, now with a measurable sentence) and unlocked (a real link to `/world`).

**The sheet sentence becomes measurable** — § 4.2ה, verbatim: «העולם ייפתח כשיהיו לך 12 מילים פעילות. יש לך <n>.» ⛔ No date · ⛔ no bare «בקרוב» as the sentence · ⛔ no "request access" button. While the count is still loading, the sentence shows the current text and ⛔ never «יש לך 0» — 0 and "not yet known" are different facts, and only one of them is true.

- [x] **Step 1: Extend `components/TabBar.test.ts` with the failing cases**

```ts
describe('<TabBar> — the world tab, D-031', () => {
  it('still renders four tabs in the locked RTL order', () => {
    expect(CODE).toContain("id: 'studies'");
    expect(CODE).toContain("id: 'cards'");
    expect(CODE).toContain("id: 'world'");
    expect(CODE).toContain("id: 'me'");
  });

  it('reads the unlock state from the server and ⛔ not from a constant', () => {
    expect(CODE).toContain('/api/world/status');
    expect(CODE).not.toMatch(/unlocked\s*=\s*(true|false)\s*;/);
  });

  it('keeps aria-disabled + sheet while locked (§ 4.2ב) and ⛔ adds no "coming soon" screen', () => {
    expect(CODE).toContain('aria-disabled');
    // ⚠️ CORRECTED C-0127 — F-041. `not.toContain('disabled=')` is UNSATISFIABLE: the
    // `aria-disabled=` the line above requires contains that substring, so the assertion is
    // red for correct code and green for no code at all. What § 4.2ב forbids is the BARE
    // attribute (it would swallow the tap that opens the sheet). ⛔ Do not restore the old
    // line in tasks 8–9.
    expect(CODE).not.toMatch(/(?<!aria-)disabled=/);
  });

  it('states the measurable sentence, with the count interpolated', () => {
    expect(CODE).toContain('העולם ייפתח כשיהיו לך 12 מילים פעילות');
    expect(CODE).toMatch(/יש לך \$\{|\{.*activeWords/);
  });

  it('⛔ shows no date and no bare "בקרוב" as the sheet sentence', () => {
    expect(CODE).not.toMatch(/בקרוב\.|תאריך/);
  });

  it('navigates to /world once unlocked', () => {
    expect(CODE).toContain("'/world'");
  });

  it('⛔ never shows «יש לך 0» before the count is known', () => {
    expect(CODE).toMatch(/null|undefined/);
  });
});
```

- [x] **Step 2: Run and watch the new cases fail** — `npx vitest run components/TabBar.test.ts`, the new block RED, the old block still green.

- [x] **Step 3: Implement.** `TabBar` already carries `'use client'` and `useState`. Add one `useEffect` that calls `apiGet('/api/world/status')`, holds `{ unlocked, activeWords } | null`, and branches. A failed call ⇒ **stay locked** — an unlock we could not confirm is not an unlock.

- [x] **Step 4: Run the whole file and watch it pass.**

- [x] **Step 5: Mutation-check** — hard-code `unlocked = true`. Expected: the second test RED. Restore.

- [x] **Step 6: Verify (mobile too) and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
git add components/TabBar.tsx components/TabBar.test.ts
git commit -m "loop(DEV): C-XXXX the world tab unlocks from the server"
```

> **T-062 closes here.** Update `plan/50-tasks.md`, `plan/30-architecture.md`, `plan/00-control.md`.

---

### Task 8: `/world/compose` — the bank and the draft

**Files:**
- Create: `app/world/compose/page.tsx`
- Create: `components/WordBank.tsx` (+ `components/WordBank.test.ts`)
- Create: `components/ComposeDraft.tsx` (+ `components/ComposeDraft.test.ts`)

**Interfaces:**
- Consumes: `GET /api/world/bank` and `POST /api/world/posts` through `lib/api/client`; `renderDraft`, `PUNCTUATION_TOKENS`, `draftContainsTarget` from `lib/core/world`; `<ActionBar>`; `<EnWord>` / `<EnText>`.
- Produces:
  ```ts
  // components/WordBank.tsx
  export interface WordBankGroup { readonly labelHe: string; readonly words: readonly string[] }
  export default function WordBank(props: {
    readonly groups: readonly WordBankGroup[];
    readonly onPick: (token: string) => void;
  }): React.JSX.Element;

  // components/ComposeDraft.tsx
  // ⚠️ CORRECTED C-0128 (F-042). The signature this block used to declare —
  // `{ target, functionWords, activeWords }` as REQUIRED props — has no possible caller:
  // step 5 below says this component holds the bank data and the publish call, and step 6
  // says `app/world/compose/page.tsx` is a Server Component with ⛔ no data access. A page
  // that reads nothing cannot fill those props. The component reads the bank itself; the ONE
  // optional prop below exists for the `/dev/world` fixture in task 9 — see there.
  export default function ComposeDraft(props?: {
    /** ⛔ Fixture-only (task 9). When present the component starts READY on this bank and
     *  performs no fetch, so `check:mobile` measures the real chips and the real action bar
     *  instead of the 503 state the env-less harness would otherwise render (C-0104). */
    readonly initialBank?: {
      readonly target: string | null;
      readonly functionWords: readonly string[];
      readonly activeWords: readonly string[];
    };
  }): React.JSX.Element;
  ```

  ⚠️ **Task 8 as built (C-0128) takes no props at all, and that is not an omission.**
  `initialBank` is task 9's to add together with its test — a prop with no consumer and no
  test is a prop that drifts.

**⛔ The path is `app/world/compose`, OUTSIDE the `(tabs)` group.** This is structural, not stylistic: § 4.2ה calls it a flow screen, D-028 forbids a tab bar and an action bar on one screen, and the route group is what makes that unbreakable by forgetting a conditional.

**Everything on this screen that is already decided, and ⛔ is not the implementer's to change:** two labelled groups, «מילות קישור» and «המילים שלך», labelled in Hebrew text and ⛔ never by colour alone (constitution § 1) · tap a bank word ⇒ append to the end of the draft · tap a draft word ⇒ remove it · ⛔ **no drag** · ⛔ **no free-text field and no keyboard anywhere on the screen** · punctuation is exactly two fixed buttons, `.` and `?` · the target line reads «היום: ____» at the top · «פרסם» is disabled until the target is in the draft and its message is guidance: «הוסף את <word> כדי לפרסם» · after publishing the label is factual, «השתמשת ב-<word>», and ⛔ never «נכון» or «יפה» · «ביטול» returns without saving · a published post returns to `/world`.

- [ ] **Step 1: Write the failing source tests**

```ts
// components/ComposeDraft.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/ComposeDraft.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('<ComposeDraft>', () => {
  it('is a client component', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
  });

  it('⛔ has NO text input and NO keyboard anywhere — the bank is closed (§ 4.2ה)', () => {
    expect(CODE).not.toMatch(/<input|<textarea|contentEditable/);
  });

  it('⛔ has no drag handlers — a drag on the scroll axis breaks scrolling and 44px targets', () => {
    for (const handler of ['onDragStart', 'onDrop', 'draggable', 'onTouchMove']) {
      expect(CODE, `${handler} is forbidden`).not.toContain(handler);
    }
  });

  it('offers exactly the two punctuation buttons, from the pure layer', () => {
    expect(CODE).toContain('PUNCTUATION_TOKENS');
    expect(CODE).not.toContain("'!'");
    expect(CODE).not.toContain("','");
  });

  it('renders the draft through the pure renderer, ⛔ not an ad-hoc join', () => {
    expect(CODE).toContain('renderDraft');
  });

  it('disables publish until the target is present, using the pure predicate', () => {
    expect(CODE).toContain('draftContainsTarget');
  });

  it('states the block as guidance and ⛔ never as a grade (R-016)', () => {
    expect(CODE).toContain('כדי לפרסם');
    for (const forbidden of ['נכון', 'יפה', 'שגוי', 'טעות', 'ציון', 'כל הכבוד']) {
      expect(CODE, `R-016: "${forbidden}"`).not.toContain(forbidden);
    }
  });

  it('labels the result factually', () => {
    expect(CODE).toContain('השתמשת ב');
  });

  it('carries the ActionBar (flow screen, D-028) and ⛔ never a TabBar', () => {
    expect(CODE).toContain('ActionBar');
    expect(CODE).not.toContain('TabBar');
  });

  it('reaches the server only through lib/api/client', () => {
    expect(CODE).toContain("from '@/lib/api/client'");
    expect(CODE).not.toContain('@supabase');
  });

  it('⛔ uses no radius outside the frozen constitution § 3', () => {
    const radii = [...CODE.matchAll(/rounded-([a-z0-9]+)/g)].map((m) => m[1]);
    expect([...new Set(radii)].filter((r) => !['md', 'lg', '2xl'].includes(r))).toEqual([]);
  });

  it('⛔ shows no draft-length counter — § 4.2ה forbids an artificial ceiling', () => {
    expect(CODE).not.toContain('MAX_DRAFT_TOKENS');
  });
});
```

```ts
// components/WordBank.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/WordBank.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('<WordBank>', () => {
  it('labels each group with Hebrew TEXT, ⛔ not colour alone (constitution § 1)', () => {
    expect(CODE).toContain('labelHe');
    expect(CODE).toMatch(/<h[23]|role="heading"/);
  });

  it('every bank word is a real button with a 44px floor', () => {
    expect(CODE).toContain('min-h-touch');
    expect(CODE).toContain('type="button"');
  });

  it('wraps every English word in the bidi wrapper', () => {
    expect(CODE).toContain('EnWord');
  });

  it('⛔ has no input and no drag', () => {
    expect(CODE).not.toMatch(/<input|<textarea|draggable/);
  });

  it('⛔ uses no radius outside the frozen constitution § 3', () => {
    const radii = [...CODE.matchAll(/rounded-([a-z0-9]+)/g)].map((m) => m[1]);
    expect([...new Set(radii)].filter((r) => !['md', 'lg', '2xl'].includes(r))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run both and watch them fail** — ENOENT for each.

- [ ] **Step 3: Write `components/WordBank.tsx`** — presentational, no fetch, no state.

- [ ] **Step 4: Run `WordBank.test.ts` and watch it pass** — 5 tests green.

- [ ] **Step 5: Write `components/ComposeDraft.tsx`** — holds `tokens: string[]`, the bank data, the publish call, and the four screen states (loading skeleton · ready · publishing · failed). The draft is a list of removable chips; the sticky `<ActionBar>` holds «פרסם» and «ביטול».

- [ ] **Step 6: Write `app/world/compose/page.tsx`** — Server Component shell that renders `<ComposeDraft />`. ⛔ No data access.

- [ ] **Step 7: Run `ComposeDraft.test.ts` and watch it pass** — 12 tests green.

- [ ] **Step 8: Mutation-check two assertions** — (a) add a `<input />` to the draft ⇒ the "no keyboard" test RED. (b) replace `draftContainsTarget(...)` with `tokens.length > 0` ⇒ the publish-gate test RED. Restore both.

- [ ] **Step 9: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add app/world components/WordBank.tsx components/WordBank.test.ts components/ComposeDraft.tsx components/ComposeDraft.test.ts
git commit -m "loop(DEV): C-XXXX /world/compose — the closed bank and the draft"
```

---

### Task 9: Measure it — `check:mobile` fixture and routes

**Files:**
- Create: `app/dev/world/page.tsx`, `app/dev/world/layout.tsx`
- Modify: `scripts/verify-mobile.mjs`
- Modify: `scripts/verify-mobile.test.ts`

**Interfaces:**
- Consumes: `<WordBank>` and `<ComposeDraft>` from task 8.
- Produces: `/dev/world` in `ROUTES`; `/world` and `/world/compose` in `ROUTES`; `/world/compose` in `FLOW_ROUTES`.

**Why the fixture is mandatory and not optional polish — this is the C-0104 lesson, one feature over.** The harness runs `next start` with **no Supabase env**, so `/world` and `/world/compose` answer 503 by their own contract and every `ok /world` line the harness prints describes the **failure** state. Without a fixture that renders the bank and the draft with fixed props, ⛔ the 44px grid, the horizontal-scroll check and the fold check will never once have run against the real components. C-0104 measured exactly this and the deck failed **twice** on defects in already-reviewed code.

- [x] **Step 1: Write the failing harness tests**

```ts
// added to scripts/verify-mobile.test.ts
describe('world screens are measured, not assumed', () => {
  it('lists the two world routes and the fixture', () => {
    expect(SRC).toContain("'/world'");
    expect(SRC).toContain("'/world/compose'");
    expect(SRC).toContain("'/dev/world'");
  });

  it('treats /world/compose as a FLOW screen — one primary action, above the fold', () => {
    const flow = SRC.match(/const FLOW_ROUTES = \[([^\]]*)\]/)?.[1] ?? '';
    expect(flow).toContain("'/world/compose'");
  });

  it('⛔ grants no console exemption to the world routes beyond the documented 503', () => {
    const block = SRC.match(/const EXPECTED_CONSOLE = \[([\s\S]*?)\];/)?.[1] ?? '';
    if (block.includes('/world')) expect(block).toContain('503');
  });
});
```

- [x] **Step 2: Run and watch them fail** — `npx vitest run scripts/verify-mobile.test.ts`.

- [x] **Step 3: Write the fixture** — `app/dev/world/layout.tsx` with `robots: { index: false, follow: false }` (copy `app/dev/deck/layout.tsx`), and `app/dev/world/page.tsx` rendering `<ComposeDraft initialBank={{ target: 'car', functionWords: [...12 fixed], activeWords: [...12 fixed] }} />`. ⚠️ **CORRECTED C-0128 (F-042):** the three separate props this step used to pass do not exist on the component and never could (see the `Interfaces` block of task 8), so this line would not have compiled. Adding the optional `initialBank` prop — one prop, one branch: present ⇒ start in the READY state and ⛔ do not fetch — is part of THIS task, with a test in `ComposeDraft.test.ts` that measures the branch (`useEffect` does not call `apiGet` when the prop is supplied), because a fixture that renders anything other than the real component measures the fixture (C-0104). ⛔ **No explanatory line above the component** — C-0104: a note pushes the component down and the harness then measures the fixture instead of the component.

- [x] **Step 4: Add the three routes** to `ROUTES` / `FLOW_ROUTES` with a comment naming the reason (the 503 contract) — ⛔ not "for coverage".

- [x] **Step 5: Run the harness** — `npm run check:mobile`. Expected: green at 320 / 375 / 414. **A red run here is the point of the task: fix the component, ⛔ never the fixture and ⛔ never by exempting the route.**

- [x] **Step 6: Mutation-check the measurement.** ⚠️ **CORRECTED C-0129 (F-043):** the mutation this step used to name — remove `min-h-touch` from one bank chip — stays **GREEN**, measured live. The chip's height is fixed twice over: `py-2` (16px) plus the `text-lg` line box (28px) is **exactly 44px**, so the class is a belt on top of braces and removing it changes no measured pixel. The mutation that does bite: `px-3 py-2 text-lg` ⇒ `px-3 py-0 text-sm` in `components/WordBank.tsx`. Expected, and measured: RED at 320/375/414 naming all 24 fixture chips (`button"Lorem" 70x22 … button"Consequat" 101x22`), and ⛔ NO failure on `/world/compose` — which is the measurement proving the fixture is the only place the bank is ever on screen. Restore and verify with `cmp`.

- [x] **Step 7: Full verification and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
git add app/dev/world scripts/verify-mobile.mjs scripts/verify-mobile.test.ts
git commit -m "loop(DEV): C-XXXX /dev/world fixture — the bank measured at 320/375/414"
```

> **T-063 closes here.** Update `plan/50-tasks.md`, `plan/30-architecture.md`, `plan/00-control.md`, and hand to CRITIC.

---

## Self-Review

**Spec coverage — every line of § 4.2ה mapped to a task:**

| § 4.2ה requirement | Task |
|---|---|
| `/world` feed, newest first, `EnText` | 6 |
| `/world/compose` as a **flow** screen with `ActionBar` | 8 |
| ⛔ no third screen, ⛔ no modal, ⛔ no sub-tabs | 6 · 8 (asserted by absence) |
| Bank group ⓐ — `is_function_word = true` | 4 |
| Bank group ⓑ — `is_active_this_week = true` | 4 |
| Hebrew group labels, ⛔ not colour alone | 8 |
| Grouped by `headword`, ⛔ not by sense (12 measured duplicates) | 2 (`uniqueHeadwords`) · 4 |
| Tap adds / tap removes · ⛔ no drag | 8 |
| ⛔ no free-text field, ⛔ no keyboard | 8 (asserted by absence) |
| Two fixed punctuation buttons | 2 (`PUNCTUATION_TOKENS`) · 8 |
| Target word shown as «היום: ____» | 4 (`pickTargetWord`) · 8 |
| Publish rule enforced **on the server** | 2 (`checkPostPayload`) · 5 |
| ⛔ no grammatical judgement, guidance not reproach (R-016) | 2 · 5 · 6 · 8 |
| `author_kind='learner'`, `generation_run_id=null` | 1 · 5 |
| ⛔ does not touch `senses` / `words` / `word_progress.reps` | 5 (asserted by absence) |
| `GET /api/world/status` computed from counts | 3 |
| `TabBar` measurable sheet sentence | 7 |
| Counter «מילים שהפקת», separate from «מילים שנלמדו» | 6 |
| Empty state with one action · skeleton · Hebrew error | 6 · 8 |
| `check:mobile` on both screens, three widths | 9 |
| Unit test 1: publish without the target is rejected on the server | 2 · 5 |
| Unit test 2: `unlocked` computed, not a flag | 2 · 3 |
| Unit test 3: the bank returns no duplicate headword | 2 · 4 |
| Unit test 4: a learner post carries `generation_run_id = null` | 5 |

**Gaps named rather than hidden:**

1. **`GET /api/world/bank` is not in T-061's file list.** Required by the "a UI component never reaches the database" rule. Reported as a deviation in task 4 and in the tick's handoff line.
2. **The target-word selection rule is unstated in § 4.2ה.** Task 2 implements the smallest deterministic rule and says so in the module doc. It is one pure function; a PM decision replaces it in one edit.
3. **A crafted `POST` can publish a shape-valid token that is not in the bank.** The server checks *shape* and the *target*, ⛔ not bank membership — that would be a query per token. The blast radius is the learner's own private feed (RLS `auth.uid() = user_id`, `0007`). **Record as `TD-31` in `plan/30-architecture.md` during task 5**, ⛔ do not leave it as an unwritten assumption.
4. **The «מילים שהפקת» counter is derived client-side from post bodies.** Named in task 6, with an explicit fallback: if it cannot be computed honestly, show the post count under a label that says *posts*, ⛔ never a wrong number under the right label.

**Type consistency:** `WorldCounts` · `WorldThresholds` · `PostPayload` · `PostCheck` · `WordBankGroup` are defined once (tasks 2 and 8) and referenced by those exact names in tasks 3–8. `isWorldUnlocked` · `uniqueHeadwords` · `pickTargetWord` · `checkPostPayload` · `renderDraft` · `draftContainsTarget` · `PUNCTUATION_TOKENS` · `MAX_DRAFT_TOKENS` are the only cross-task symbols, and each appears with the same signature everywhere it is used.
