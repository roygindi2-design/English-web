# Content Bank — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build our own English→Hebrew vocabulary bank — original content we own outright — at ~45 words per scheduled run, with every field a learner-facing feature will ever need already in place.

**Architecture:** A fourth scheduled agent (Content) generates entries, a deterministic gate rejects bad ones before they reach the database, and a pure `/lib/core/` module turns a stored sense into a flashcard. Generation is a batch job; the app never calls an LLM at request time.

**Tech Stack:** Supabase Postgres, TypeScript (strict), Vitest. No new runtime dependencies.

## Global Constraints

- Every source is either **ours** or permissively licensed. ⛔ NITE items (R-010), ⛔ AnkiWeb decks (R-013), ⛔ PanLex/MUSE (NC), ⛔ Brysbaert concreteness norms (CC BY-NC-ND — commercial use blocked).
- ✅ Permitted: **NGSL v1.2, 2,809 entries, CC BY-SA 4.0** as the headword list. Headword *selection* is not protected; the translation and sentences we write are ours.
- `lib/core/` stays pure: no react, no DOM, no fetch, no `process.env`. Enforced by `npm run check:core`.
- Verification before any completion claim: `npm run typecheck && npm run check:core && npm test && npm run build`.
- Commit messages carry no `[skip ci]` (RULES § 0.7). Agents push to `dev` only.

---

## The three decisions this plan locks in

**D-021 — the row is a SENSE, not a word.** Every serious lexical resource we examined
(WordNet, Cambridge, CEFR-J) keys on sense, and a `word` row holding one definition cannot
be extended later without regenerating everything. `set` gets one row per meaning we teach.

**D-022 — two example sentences per sense, not one.** Webb (2008) found informative context
improves *meaning* knowledge; den Broek et al. (2018) found **uninformative** contexts that
force retrieval produce better long-term recall. These are different jobs, so we store both:
`example_supportive` (meaning inferable — used when introducing) and `example_neutral`
(context does not give it away — used when testing). This is the field that would be most
expensive to add later, which is exactly why it goes in now.

**D-023 — distractors are typed, and "very similar" is the wrong target.**
⚠️ **This corrects the original request.** Ludewig et al. (2023) found **near-synonyms hurt
discrimination** — the best distractor is *clearly wrong yet semantically related*. Difficulty
ordering (Language Testing in Asia 3:16, η²=.08): syntagmatic > paradigmatic > unrelated.
So we store four distractors each tagged with `relation_type`, and the app tunes difficulty by
*selecting* among them rather than by regenerating. A near-synonym is stored under
`relation_type='near_synonym'` and is **excluded from scoring items** — it is only useful as a
"which is more precise" exercise later.

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/migrations/0002_content_bank.sql` | **Create.** Schema: `words`, `senses`, `sense_examples`, `sense_distractors`, `sense_items`, `generation_runs`. |
| `lib/core/contentSchema.ts` | **Create.** Types + the deterministic validator. Pure. |
| `lib/core/contentSchema.test.ts` | **Create.** |
| `lib/core/flashcard.ts` | **Create.** Turns a stored sense into a card face. Pure. |
| `lib/core/flashcard.test.ts` | **Create.** |
| `docs/content-generation-prompt.md` | **Create.** The exact prompt the Content agent runs. |

---

### Task 1: The schema

**Files:**
- Create: `supabase/migrations/0002_content_bank.sql`

**Interfaces:**
- Produces: tables `words`, `senses`, `sense_examples`, `sense_distractors`, `sense_items`, `generation_runs`.

- [ ] **Step 1: Write the migration**

```sql
-- Content bank. Every row here is content WE authored or permissively-licensed data.
-- Provenance is not a comment; it is a column. See plan/20-alerts.md R-010, R-013.

create table generation_runs (
  id             uuid primary key default gen_random_uuid(),
  started_at     timestamptz not null default now(),
  model          text not null,
  prompt_version text not null,
  requested      int  not null,
  accepted       int  not null default 0,
  rejected       int  not null default 0,
  notes          text
);
comment on table generation_runs is
  'One row per Content-agent run. Lets a bad batch be found and revoked wholesale.';

create table words (
  id              uuid primary key default gen_random_uuid(),
  headword        text not null,
  pos             text not null check (pos in
                    ('noun','verb','adjective','adverb','preposition','conjunction','pronoun','determiner')),
  -- provenance
  origin          text not null check (origin in ('seed','ngsl','generated')),
  source_note     text,
  -- difficulty signals (Nature HSSC 2025: frequency dominates; Hiebert 2019: length and
  -- syllables matter for LEARNERS specifically, which is our whole audience)
  ngsl_rank       int,
  zipf_freq       numeric(4,2),
  n_letters       int  not null,
  n_syllables     int,
  is_function_word boolean not null default false,
  created_at      timestamptz not null default now(),
  unique (headword, pos)
);

create table senses (
  id            uuid primary key default gen_random_uuid(),
  word_id       uuid not null references words(id) on delete cascade,
  sense_index   int  not null,
  definition_en text not null,
  translation_he text not null,
  cefr_level    text check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  -- D-013: a low-confidence translation is never shown to a learner
  translation_confidence text not null default 'medium'
                    check (translation_confidence in ('low','medium','high')),
  -- No published Hebrew->English error list exists (10-pedagogy 1.10). We author these.
  he_interference_note text,
  he_one_to_many_group text,
  generation_run_id uuid references generation_runs(id),
  reviewed_by_human boolean not null default false,
  created_at    timestamptz not null default now(),
  unique (word_id, sense_index)
);
comment on column senses.he_one_to_many_group is
  'One Hebrew word covering several English words, e.g. להזמין = invite/reserve/order. '
  'Learners confuse these systematically; grouping lets us teach the contrast.';

create table sense_examples (
  id        uuid primary key default gen_random_uuid(),
  sense_id  uuid not null references senses(id) on delete cascade,
  -- D-022: two jobs, two sentences. supportive = meaning inferable (introduce);
  -- neutral = context does not give it away (test).
  kind      text not null check (kind in ('supportive','neutral')),
  text_en   text not null,
  text_he   text,
  unique (sense_id, kind)
);

create table sense_distractors (
  id            uuid primary key default gen_random_uuid(),
  sense_id      uuid not null references senses(id) on delete cascade,
  distractor    text not null,
  -- D-023: difficulty is tuned by SELECTING among typed distractors, not by regenerating.
  relation_type text not null check (relation_type in
                  ('semantic','orthographic','collocational','unrelated','near_synonym')),
  unique (sense_id, distractor)
);
comment on column sense_distractors.relation_type is
  'near_synonym is stored but EXCLUDED from scoring items: Ludewig 2023 found '
  'near-synonyms hurt discrimination. Keep for a future "which is more precise" drill.';

create table sense_items (
  id           uuid primary key default gen_random_uuid(),
  sense_id     uuid not null references senses(id) on delete cascade,
  -- Sentence-completion stems, stored WITHOUT options. The dynamic-distractor engine
  -- (7.5) builds options at serve time from sense_distractors, per the learner's level.
  stem         text not null,
  blank_token  text not null default '____',
  item_index   int  not null,
  unique (sense_id, item_index)
);

create index on senses (word_id);
create index on senses (cefr_level);
create index on words (ngsl_rank);

alter table words enable row level security;
alter table senses enable row level security;
alter table sense_examples enable row level security;
alter table sense_distractors enable row level security;
alter table sense_items enable row level security;
alter table generation_runs enable row level security;

-- Content is shared, not per-user: any signed-in learner may read approved content.
create policy "read approved content" on senses for select
  to authenticated using (translation_confidence <> 'low');
create policy "read words" on words for select to authenticated using (true);
create policy "read examples" on sense_examples for select to authenticated using (true);
create policy "read distractors" on sense_distractors for select to authenticated using (true);
create policy "read items" on sense_items for select to authenticated using (true);
-- Writes happen only from the batch job with the service role, which bypasses RLS.
```

- [ ] **Step 2: Verify the SQL parses**

Run: `npx supabase db lint --file supabase/migrations/0002_content_bank.sql` if the CLI is available; otherwise paste into the Supabase SQL editor and confirm it applies without error. Record which you did in the commit message. **Do not claim it applies without having run one of them.**

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0002_content_bank.sql
git commit -m "loop(DEV): C-XXXX T-038 content bank schema — sense-level, typed distractors"
git push origin dev
```

---

### Task 2: The deterministic gate

**Files:**
- Create: `lib/core/contentSchema.ts`
- Test: `lib/core/contentSchema.test.ts`

**Interfaces:**
- Produces: `export interface GeneratedSense {...}`, `export interface GateResult { ok: boolean; reasons: string[] }`, `export function gateSense(input: GeneratedSense, opts: GateOptions): GateResult`

**Why a gate at all — the measured reason.** LLMs asked to write an example for a *specified*
sense hit only **60–76% accuracy** (GPT-4o, aclanthology 2025.emnlp-main.1720). Hebrew is a
mid-resource language, so expect the lower tier. Cross-model agreement is **not** a usable
gate — models share correlated errors (arXiv 2607.08065). So: cheap deterministic checks
first, human spot-check second.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { gateSense } from './contentSchema';

const ok = {
  headword: 'deliberate',
  pos: 'adjective' as const,
  translationHe: 'מכוון',
  definitionEn: 'done on purpose rather than by accident',
  examples: {
    supportive: 'It was a deliberate choice, not an accident.',
    neutral: 'Her answer was deliberate.',
  },
  items: ['His silence was ____, not shy.', 'She made a ____ effort.', 'It was no accident — it was ____.'],
  distractors: [
    { word: 'accidental', relationType: 'semantic' as const },
    { word: 'delicate', relationType: 'orthographic' as const },
    { word: 'wooden', relationType: 'unrelated' as const },
    { word: 'careless', relationType: 'semantic' as const },
  ],
};
const opts = { allowedWords: new Set(['it','was','a','choice','not','an','accident','her','answer','deliberate','his','silence','shy','she','made','effort','no']) };

describe('gateSense', () => {
  it('accepts a well-formed sense', () => {
    expect(gateSense(ok, opts).ok).toBe(true);
  });

  it('rejects an example that does not contain the headword', () => {
    const r = gateSense({ ...ok, examples: { ...ok.examples, neutral: 'Her answer was quick.' } }, opts);
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('neutral');
  });

  it('accepts an inflected form of the headword', () => {
    const r = gateSense({ ...ok, examples: { ...ok.examples, neutral: 'She deliberated for hours.' } }, opts);
    expect(r.ok).toBe(true);
  });

  it('rejects a stem that has no blank', () => {
    const r = gateSense({ ...ok, items: ['His silence was loud.', ...ok.items.slice(1)] }, opts);
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('blank');
  });

  it('rejects a stem that leaks the answer', () => {
    const r = gateSense({ ...ok, items: ['A deliberate act is ____.', ...ok.items.slice(1)] }, opts);
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('leaks');
  });

  it('rejects fewer than 3 items or 4 distractors', () => {
    expect(gateSense({ ...ok, items: ok.items.slice(0, 2) }, opts).ok).toBe(false);
    expect(gateSense({ ...ok, distractors: ok.distractors.slice(0, 3) }, opts).ok).toBe(false);
  });

  it('rejects a distractor equal to the headword', () => {
    const d = [...ok.distractors]; d[0] = { word: 'deliberate', relationType: 'semantic' };
    expect(gateSense({ ...ok, distractors: d }, opts).ok).toBe(false);
  });

  it('rejects a Hebrew translation that contains Latin letters', () => {
    expect(gateSense({ ...ok, translationHe: 'מכוון deliberate' }, opts).ok).toBe(false);
  });

  it('rejects a Hebrew translation carrying nikud', () => {
    // R-007: nikud breaks matching. 99.9% of Hebrew Wordnet lemmas carry it.
    expect(gateSense({ ...ok, translationHe: 'מְכֻוָּן' }, opts).ok).toBe(false);
  });

  it('rejects level drift — a sentence using words outside the allowed list', () => {
    const r = gateSense({ ...ok, examples: { ...ok.examples, neutral: 'Her answer was deliberate notwithstanding.' } }, opts);
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('level');
  });

  it('rejects an over-long example', () => {
    const long = 'It was a ' + 'very '.repeat(20) + 'deliberate choice.';
    expect(gateSense({ ...ok, examples: { ...ok.examples, supportive: long } }, opts).ok).toBe(false);
  });

  it('collects every reason, not just the first', () => {
    const r = gateSense({ ...ok, translationHe: 'abc', items: [] }, opts);
    expect(r.reasons.length).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run lib/core/contentSchema.test.ts`
Expected: FAIL — `Failed to resolve import "./contentSchema"`.

- [ ] **Step 3: Write the implementation**

```ts
/** PURE. No React, no DOM, no fetch, no process.env. */

export type Pos = 'noun'|'verb'|'adjective'|'adverb'|'preposition'|'conjunction'|'pronoun'|'determiner';
export type RelationType = 'semantic'|'orthographic'|'collocational'|'unrelated'|'near_synonym';

export interface GeneratedSense {
  readonly headword: string;
  readonly pos: Pos;
  readonly translationHe: string;
  readonly definitionEn: string;
  readonly examples: { readonly supportive: string; readonly neutral: string };
  readonly items: readonly string[];
  readonly distractors: readonly { readonly word: string; readonly relationType: RelationType }[];
}

export interface GateOptions {
  /** Every non-target token in an example must appear here — this is the level-drift check. */
  readonly allowedWords: ReadonlySet<string>;
  readonly maxExampleWords?: number;
}

export interface GateResult { readonly ok: boolean; readonly reasons: readonly string[] }

const NIKUD = /[֑-ׇ]/;
const HEBREW = /[א-ת]/;
const LATIN = /[A-Za-z]/;

const words = (s: string) => s.toLowerCase().match(/[a-z']+/g) ?? [];

/** Matches the headword or a regular inflection of it. Deliberately loose: the goal is to
 *  catch "the sentence forgot the word", not to be a morphological analyser. */
function containsHeadword(sentence: string, headword: string): boolean {
  const stem = headword.toLowerCase().replace(/e$/, '');
  return words(sentence).some((w) => w === headword.toLowerCase() || w.startsWith(stem));
}

export function gateSense(input: GeneratedSense, opts: GateOptions): GateResult {
  const reasons: string[] = [];
  const maxWords = opts.maxExampleWords ?? 14;
  const head = input.headword.toLowerCase();

  // --- Hebrew translation ---
  if (!HEBREW.test(input.translationHe)) reasons.push('translation: no Hebrew letters');
  if (LATIN.test(input.translationHe)) reasons.push('translation: contains Latin letters');
  if (NIKUD.test(input.translationHe)) reasons.push('translation: contains nikud (R-007)');

  // --- examples ---
  for (const kind of ['supportive', 'neutral'] as const) {
    const text = input.examples[kind];
    if (!containsHeadword(text, head)) reasons.push(`example ${kind}: headword missing`);
    if (words(text).length > maxWords) reasons.push(`example ${kind}: over ${maxWords} words`);
    for (const w of words(text)) {
      if (w === head || w.startsWith(head.replace(/e$/, ''))) continue;
      if (!opts.allowedWords.has(w)) { reasons.push(`example ${kind}: level drift on "${w}"`); break; }
    }
  }

  // --- items ---
  if (input.items.length < 3) reasons.push('items: fewer than 3');
  input.items.forEach((stem, i) => {
    if (!stem.includes('____')) reasons.push(`item ${i}: no blank`);
    if (containsHeadword(stem.replace('____', ' '), head)) reasons.push(`item ${i}: leaks the answer`);
  });

  // --- distractors ---
  if (input.distractors.length < 4) reasons.push('distractors: fewer than 4');
  const seen = new Set<string>();
  for (const d of input.distractors) {
    const w = d.word.toLowerCase();
    if (w === head) reasons.push('distractors: one equals the headword');
    if (seen.has(w)) reasons.push(`distractors: duplicate "${w}"`);
    seen.add(w);
  }

  return { ok: reasons.length === 0, reasons };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run lib/core/contentSchema.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Full verification, then commit**

Run: `npm run typecheck && npm run check:core && npm test && npm run build`
```bash
git add lib/core/contentSchema.ts lib/core/contentSchema.test.ts
git commit -m "loop(DEV): C-XXXX T-039 deterministic content gate (12 tests)"
git push origin dev
```

---

### Task 3: The flashcard

**Files:**
- Create: `lib/core/flashcard.ts`
- Test: `lib/core/flashcard.test.ts`

**Interfaces:**
- Consumes: `GeneratedSense` shape from Task 2 (the stored form).
- Produces: `export type CardDirection = 'recognition' | 'production'`, `export function buildCard(sense, direction): CardFaces`

**The evidence this encodes:**
- Direction is **proficiency-dependent** (Terai, Yamashita & Pasich 2021, *SSLA* 43:5): lower proficiency gains more from L2→L1 **recognition**; higher proficiency from L1→L2 **production**. So: start in recognition, promote per word once stable.
- **Front = the bare word.** SuperMemo's minimum information principle. The example sentence
  goes on the **back**, as disambiguation and feedback — Webb (2007) found a single context
  added little over a bare pair for form-meaning gain.
- **Binary grading.** Anki's own FSRS FAQ: *"FSRS may even be more accurate if you only use
  Again and Good."* Four buttons buy little and cost friction on mobile.
- **The neutral example goes on the back of a testing card; the supportive one on an
  introduction card** — that is the whole reason both are stored (D-022).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildCard } from './flashcard';

const sense = {
  headword: 'deliberate', pos: 'adjective' as const,
  translationHe: 'מכוון', definitionEn: 'done on purpose',
  examples: { supportive: 'It was a deliberate choice, not an accident.', neutral: 'Her answer was deliberate.' },
  items: [], distractors: [],
};

describe('buildCard', () => {
  it('recognition shows the English word alone on the front', () => {
    const c = buildCard(sense, 'recognition', { isFirstEncounter: false });
    expect(c.front.primary).toBe('deliberate');
    expect(c.front.secondary).toBeNull();       // minimum information principle
    expect(c.back.primary).toBe('מכוון');
  });

  it('production shows the Hebrew alone on the front', () => {
    const c = buildCard(sense, 'production', { isFirstEncounter: false });
    expect(c.front.primary).toBe('מכוון');
    expect(c.back.primary).toBe('deliberate');
  });

  it('the example is always on the back, never the front', () => {
    for (const d of ['recognition','production'] as const) {
      const c = buildCard(sense, d, { isFirstEncounter: false });
      expect(c.front.example).toBeNull();
      expect(c.back.example).not.toBeNull();
    }
  });

  it('a first encounter gets the supportive sentence; later reviews get the neutral one', () => {
    expect(buildCard(sense, 'recognition', { isFirstEncounter: true }).back.example)
      .toBe('It was a deliberate choice, not an accident.');
    expect(buildCard(sense, 'recognition', { isFirstEncounter: false }).back.example)
      .toBe('Her answer was deliberate.');
  });

  it('production is typed, recognition is self-graded', () => {
    expect(buildCard(sense, 'production', { isFirstEncounter: false }).input).toBe('typed');
    expect(buildCard(sense, 'recognition', { isFirstEncounter: false }).input).toBe('self');
  });

  it('grading is binary in both directions', () => {
    expect(buildCard(sense, 'recognition', { isFirstEncounter: false }).grades)
      .toEqual(['again', 'good']);
  });

  it('falls back to the supportive example when neutral is missing', () => {
    const s = { ...sense, examples: { supportive: sense.examples.supportive, neutral: '' } };
    expect(buildCard(s, 'recognition', { isFirstEncounter: false }).back.example)
      .toBe(sense.examples.supportive);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run lib/core/flashcard.test.ts` → FAIL, cannot resolve `./flashcard`.

- [ ] **Step 3: Implement**

```ts
/** PURE. Turns a stored sense into the two faces of one card. */

export type CardDirection = 'recognition' | 'production';

export interface CardFace {
  readonly primary: string;
  readonly secondary: string | null;
  readonly example: string | null;
}

export interface Card {
  readonly direction: CardDirection;
  readonly front: CardFace;
  readonly back: CardFace;
  /** production is typed and auto-graded — it removes the self-rating noise that
   *  Dunlosky & Rawson (2012) showed causes premature dropping of items. */
  readonly input: 'typed' | 'self';
  readonly grades: readonly ['again', 'good'];
}

interface SenseLike {
  readonly headword: string;
  readonly translationHe: string;
  readonly examples: { readonly supportive: string; readonly neutral: string };
}

export function buildCard(
  sense: SenseLike,
  direction: CardDirection,
  ctx: { readonly isFirstEncounter: boolean },
): Card {
  const example =
    (ctx.isFirstEncounter ? sense.examples.supportive : sense.examples.neutral) ||
    sense.examples.supportive ||
    null;

  const en: CardFace = { primary: sense.headword, secondary: null, example: null };
  const he: CardFace = { primary: sense.translationHe, secondary: null, example: null };

  return direction === 'recognition'
    ? { direction, front: en, back: { ...he, example }, input: 'self', grades: ['again','good'] }
    : { direction, front: he, back: { ...en, example }, input: 'typed', grades: ['again','good'] };
}
```

- [ ] **Step 4: Run the tests** → PASS, 7 tests.

- [ ] **Step 5: Full verification, then commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
git add lib/core/flashcard.ts lib/core/flashcard.test.ts
git commit -m "loop(DEV): C-XXXX T-040 flashcard model — bare front, example on back, binary grading"
git push origin dev
```

---

## How the card looks and behaves — the UI spec for T-041

This is the spec the UI task implements. It is not optional styling.

**The flip.** ⚠️ **No study was found showing a flip animation helps learning.** The nearest
evidence — Mayer's coherence principle — says decorative motion adds extraneous processing.
So: the flip is permitted as *affordance*, not decoration. **≤200 ms, and it must never delay
the reveal** — the answer is in the DOM the instant the learner asks for it. Respect
`prefers-reduced-motion` and skip the animation entirely when set.

**Front.** The word alone, large, centred horizontally but **anchored in the upper third** —
not vertically centred (F-011: `justify-center` left 67% of a screen empty). English words
carry `dir="ltr"` inside the RTL page with `unicode-bidi: isolate`. One button: **"הצג תשובה"**,
full width, in the lower third for thumb reach, `min-height: 48px`.

**Back.** Translation first and largest. Beneath it, the example sentence with the target word
**visually marked** — this is the disambiguation the whole two-sentence design exists for.
Then two buttons side by side: **"לא ידעתי"** and **"ידעתי"**. Binary, per Anki's FSRS FAQ.

**Production cards** replace the reveal button with a text input, `dir="ltr"`,
`autocapitalize="none"`, `autocorrect="off"`, `spellcheck="false"`, `enterKeyHint="go"`.
Grading is automatic on submit — the learner never rates themselves.

**Forbidden on this screen** (RULES § 0.8, and F-011/F-016 are the measured precedent):
⛔ vertically centred layout · ⛔ purple gradient · ⛔ uniform rounded corners on every element ·
⛔ Inter · ⛔ a progress ring or counter that competes with the word for attention.

**Every touch target ≥ 44×44 px. No horizontal scroll at 375 px. Verified by `npm run check:mobile`, not by eye.**

---

## Self-Review

**1. Spec coverage.** The request asked for level, Hebrew translation, a short simple sentence,
three sentence-completion stems without answers, and four similar words. All present:
`senses.cefr_level`, `senses.translation_he`, `sense_examples`, `sense_items` (stems only —
options are built at serve time by engine 7.5), `sense_distractors` (four, typed).

**2. Placeholder scan.** No TBD, no "add validation", no "write tests for the above". Every
step carries its own code.

**3. Type consistency.** `GeneratedSense`, `GateOptions`, `GateResult`, `gateSense`,
`buildCard`, `CardDirection` are spelled identically in the interface blocks, the tests and the
implementations. `translationHe` in TypeScript maps to `translation_he` in SQL — the only
naming boundary, and it is crossed in exactly one place (the ingestion job).

**What this plan deliberately does not do.** It does not generate any content. It builds the
container and the gate. Generation is the Content agent's job, and it cannot run until the
gate exists — otherwise we would be inserting unverified rows and discovering the problem at
scale, which is exactly the R-006 mistake in a new costume.
