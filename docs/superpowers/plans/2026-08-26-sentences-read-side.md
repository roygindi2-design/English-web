# 2026-08-26 · `cards` slice B — the `משפטים` READ SIDE, and the number that replaces the lock

**Tasks covered:** `T-165` (the deck — **read side only**, see § 5) · `T-199` (**ⓑ + ⓒ only** — the tile stops saying `🔒 נעול`).
**Decisions:** `D-097` (the release conditions were met and nobody looked) · `D-035` (superseded by D-097) · `D-046` · `D-096` (a disabled tile with no number is not a legal state) · `D-023` (tagged distractors · `near_synonym` excluded from scoring) · `D-024`/`D-013` (low confidence is SHOWN but never scored) · `D-032` · `D-033` (practice writes two counters and nothing else) · `D-034` (`words.cefr_profile_band`, ⛔ never `senses.cefr_level`) · UX plan `§ 4.2ו` · the declared-deviation precedent `§ 4.2כ ד׳`.
**Anchor:** `plan/36-video-spec.md § 5` (the cards home) · `§ 6` (the ring) · `§ 13` item 3.

🎯 **The render this plan targets:** `docs/design/kol-A-02-deck.png`, and the values are
taken from `docs/design/render_video_A.py:254-303` by grep — ⛔ not by eye.
`36 § 14.4` (D-114) makes the render binding **for finish as well as layout**, and
**layer A (contrast · 44px · ⛔ no state in colour alone) is the only carve-out.**

**The layout values this plan actually took, quoted:**

| Element | `render_video_A.py` | Value |
|---|---|---|
| deck tile 1 «סינון מילים» | `:287-290` | `x=24 · y=486 · h=62 · r=18`, title `16.5 Bold` at `y=508`, note `12 Medium` at `y=531` |
| deck tile 2 «חזרה» | `:291-297` | `y=558 · h=62 · r=18`, note `f"{LV_UNKNOWN} מילים שסימנת לא ידעתי"` at `y=603` |
| the fixed footnote | `:298` | `הסימון של מילים מתבצע בכרטיסיות בלבד` at `y=650` |
| **a `משפטים` tile** | — | 🔴 **the render draws none.** See § 5. |

⇒ **Every tile the render draws carries `<count> <noun phrase>` as its second line.**
That single quoted fact is the whole of `T-199ⓑ`: `note: 'נעול'` is the one tile on this
screen whose second line is not a number, and `D-096` already names that an illegal state.

## 0 · The measurement this plan rests on

Run on `work/current`, **2026-08-26T18:52Z**, over `data/generated/batch-*.jsonl` (the
corpus `supabase/seed/0003_scoring_material.sql` is built from):

| What | How | Number |
|---|---|---|
| senses in the corpus | 13 batch files | **713** |
| senses carrying at least one item stem | — | **713** (100%) |
| item stems | — | **2,139** |
| stems missing the `____` blank | — | ✅ **0** |
| stems that leak their own headword (`\bheadword\b` outside the blank) | — | ✅ **0** |
| senses with fewer than 3 usable distractors | — | ✅ **0** |
| distractors by `relation_type` | — | `semantic` 1,426 · `orthographic` 713 · `unrelated` 713 |
| distractors tagged `near_synonym` (D-023 excludes these) | — | **0 today** |
| ⇒ **A1 stems the deck would hold** | band from `supabase/seed/0002_word_cefr_levels.sql` | 🎯 **987, from 329 senses** |
| A2 · B1 · B2 | same | 447 · 357 · 348 |
| the gate, re-run | `docs/gate-recheck.md` | `713 rows · 2,139 stems · **0 rejected**` |

**987 versus `נעול`.** That is the number `T-199ⓑ` asks for, and § 0 is where it comes from.

⚠️ **`near_synonym` is 0 today and the exclusion is still written.** A rule that is only
written when it currently bites is a rule the next content batch removes silently.

**And the screen as it stands** — `components/DeckSelector.tsx:214-221`:

```js
{ key: 'sentences', label: SENTENCES_LABEL_HE, href: null, note: LOCKED_HE, enabled: false, locked: true }
```

`LOCKED_HE = 'נעול'` (`:67`). D-097 measured all three of D-035's release conditions **met**
on 23/08; D-096 measured the same tile illegal on 22/08. Three days later the string is
still `'נעול'`, because **nothing in the build re-reads a release condition** — which is
T-166, and is ⛔ not in this plan.

## 1 · File Structure

| File | New / edited | What |
|---|---|---|
| `lib/core/shuffle.ts` | **new** | PURE. `mulberry32` + `shuffle`, lifted verbatim out of `lib/core/arcadeRound.ts:71-90`. ⛔ Behaviour-identical — same seed ⇒ same order. |
| `lib/core/shuffle.test.ts` | **new** | The golden test: the exact permutation `arcadeRound` produced before the lift. |
| `lib/core/arcadeRound.ts` | edited | imports the two helpers instead of holding private copies. ⛔ ⛔ No other change — the arena is not in this workstream. |
| `lib/core/sentenceItem.ts` | **new** | PURE. `T-165ⓑⓔ` — candidate → item: the stem, the English answer, four English options. |
| `lib/core/sentenceItem.test.ts` | **new** | `T-165` truth tests + the three mutations that must fail **by name**. |
| `lib/core/deck.ts` | edited | `T-165ⓐ` — `DeckName` gains `'sentences'`; `FlashcardDeckName` and `parseFlashcardDeckName` are the new narrow gate (§ 3). |
| `lib/core/deck.test.ts` | edited | `parseFlashcardDeckName('sentences') === null` — the compiler-plus-test pair that keeps a cloze item out of `<Flashcard>`. |
| `app/api/study/queue/route.ts` | edited | `T-165ⓑⓓⓔ` — the `sentences` branch: band = `profiles.current_level` vs `words.cefr_profile_band`, `sense_items!inner`, `sense_distractors!inner`. |
| `app/api/study/queue/route.test.ts` | edited | source scans: `senses.cefr_level` and `/api/review` absent from this file **by name**. |
| `app/study/page.tsx` | edited | reads `parseFlashcardDeckName`, so `?deck=sentences` falls back to `due` **until the screen exists** (§ 5). |
| `components/DeckSelector.tsx` | edited | `T-199ⓑⓒ` — the tile's second line becomes the count. ⛔ `href` stays `null` (§ 5). |
| `components/DeckSelector.test.ts` | edited | `'נעול'` as this tile's note fails **by name**; the count query is asserted. |
| `docs/api-contract.md` | edited | `GET /api/study/queue?deck=sentences` — **the same commit as the route** (STEP 5 of the Dev prompt). |

## 2 · Interfaces

```ts
// lib/core/shuffle.ts — PURE
export function mulberry32(seed: number): () => number;
export function shuffle<T>(items: readonly T[], rnd: () => number): T[];

// lib/core/sentenceItem.ts — PURE. ⛔ No React, no window, no clock, no fetch.
export const SENTENCE_OPTION_COUNT = 4;
export const BLANK_TOKEN = '____';

/** D-023 — the relation types that may become an option. `near_synonym` is stored and
 *  ⛔ never scored: Ludewig 2023 found near-synonyms hurt discrimination. */
export const SCORABLE_RELATIONS: readonly string[] = ['semantic', 'orthographic', 'collocational', 'unrelated'];

export interface SentenceCandidate {
  readonly wordId: string;
  /** The English headword. It is the ANSWER (T-165ⓑ), ⛔ not the prompt. */
  readonly headword: string;
  readonly stems: readonly { readonly itemIndex: number; readonly stem: string }[];
  readonly distractors: readonly { readonly text: string; readonly relationType: string }[];
  readonly cefrProfileBand: string | null;
}

export interface SentenceItem {
  readonly wordId: string;
  readonly itemIndex: number;
  readonly stem: string;
  readonly answer: string;
  /** Exactly SENTENCE_OPTION_COUNT, shuffled, ⛔ all English. */
  readonly options: readonly string[];
}

export function usableDistractors(c: SentenceCandidate): readonly string[];
/** `false` ⇒ the row is dropped BEFORE it can become a broken item. */
export function isUsableCandidate(c: SentenceCandidate): boolean;
/** `true` ⇒ the stem contains the answer outside the blank ⇒ ⛔ the item is dropped. */
export function leaksAnswer(stem: string, headword: string): boolean;
export function buildSentenceItems(
  candidates: readonly SentenceCandidate[],
  seed: number,
  limit: number,
): readonly SentenceItem[];

// lib/core/deck.ts
export type DeckName = 'due' | 'unknown' | 'level' | 'sentences';           // T-165ⓐ
export type FlashcardDeckName = Exclude<DeckName, 'sentences'>;
export function parseDeckName(value: string | null): DeckName | null;        // the ROUTE's gate
export function parseFlashcardDeckName(value: string | null): FlashcardDeckName | null; // the SCREEN's gate
```

## 3 · The one design call in this plan, and why it is not taste

`T-165ⓐ` says `DeckName` gains `'sentences'`. Do that alone and
`app/study/page.tsx:34` — whose own comment says *«a third deck lands here without this
file changing»* — hands `'sentences'` straight to `<StudyDeckScreen>` → `<CardDeck>` →
`buildCard`, which builds a **two-button self-grade flashcard** out of a cloze item. A
learner reaching `/study?deck=sentences` would get a broken screen from a URL, which is
the F-027 class.

⇒ The type is split. `DeckName` is what the **API** accepts; `FlashcardDeckName` is what
the **screen** accepts, and `Exclude` makes handing a cloze item to `<Flashcard>` a
**compile error** rather than a rule in a comment.

⚠️ Recorded here under `RULES § 0.16` as a reversible call (module boundary / function
names): **one commit undoes it.**

## 4 · Steps

- [ ] **Step 1 — red, the pure layer.** Write `lib/core/sentenceItem.test.ts` first and run `npx vitest run lib/core/sentenceItem.test.ts` — it must fail because the module does not exist.

```ts
import { describe, expect, it } from 'vitest';
import {
  BLANK_TOKEN, SENTENCE_OPTION_COUNT, buildSentenceItems, isUsableCandidate, leaksAnswer,
} from './sentenceItem';

const alter = {
  wordId: '11111111-1111-4111-8111-111111111111',
  headword: 'alter',
  cefrProfileBand: 'A1',
  stems: [{ itemIndex: 0, stem: 'The workers had to ____ the design after the first test.' }],
  distractors: [
    { text: 'repair', relationType: 'semantic' },
    { text: 'measure', relationType: 'semantic' },
    { text: 'later', relationType: 'orthographic' },
    { text: 'window', relationType: 'unrelated' },
  ],
};

describe('sentenceItem', () => {
  it('כל פריט נושא את החסר ו⛔ אינו מדליף את התשובה', () => {
    const [item] = buildSentenceItems([alter], 7, 10);
    expect(item.stem).toContain(BLANK_TOKEN);
    expect(item.stem.toLowerCase()).not.toMatch(/\balter\b/);
    expect(item.answer).toBe('alter');
  });

  it('ארבע אפשרויות, כולן אנגלית, והתשובה ביניהן', () => {
    const [item] = buildSentenceItems([alter], 7, 10);
    expect(item.options).toHaveLength(SENTENCE_OPTION_COUNT);
    expect(item.options).toContain('alter');
    expect(new Set(item.options).size).toBe(SENTENCE_OPTION_COUNT);
    // D-087 בהיפוך: ⛔ אף אפשרות עברית. טווח עברית ב-Unicode.
    for (const option of item.options) expect(option).not.toMatch(/[֐-׿]/);
  });

  it('D-023 — near_synonym ⛔ אינו הופך לאפשרות', () => {
    const shady = { ...alter, distractors: [
      { text: 'change', relationType: 'near_synonym' },
      ...alter.distractors.slice(0, 3),
    ] };
    const [item] = buildSentenceItems([shady], 7, 10);
    expect(item.options).not.toContain('change');
  });

  it('פחות משלושה מסיחים כשירים ⇒ המועמד יורד, ⛔ ולא פריט עם שתי אפשרויות', () => {
    const thin = { ...alter, distractors: alter.distractors.slice(0, 2) };
    expect(isUsableCandidate(thin)).toBe(false);
    expect(buildSentenceItems([thin], 7, 10)).toHaveLength(0);
  });

  it('גזע שמדליף את התשובה יורד, ⛔ ואינו מוצג', () => {
    expect(leaksAnswer('We alter the ____ plan.', 'alter')).toBe(true);
    expect(leaksAnswer('The workers had to ____ it.', 'alter')).toBe(false);
    const leaky = { ...alter, stems: [{ itemIndex: 0, stem: 'We alter the ____ plan.' }] };
    expect(buildSentenceItems([leaky], 7, 10)).toHaveLength(0);
  });

  it('אותו seed ⇒ אותו סדר, ⛔ תמיד', () => {
    expect(buildSentenceItems([alter], 7, 10)[0].options)
      .toEqual(buildSentenceItems([alter], 7, 10)[0].options);
  });
});
```

- [ ] **Step 2 — lift the shuffle.** Create `lib/core/shuffle.ts` with `mulberry32` and `shuffle` copied **verbatim** from `lib/core/arcadeRound.ts:71-90`; make `lib/core/arcadeRound.ts` import them; run `npx vitest run lib/core/arcadeRound.test.ts` — it must stay green with **zero** edits to its expectations. Record the pre-lift permutation in `lib/core/shuffle.test.ts` as a golden.
- [ ] **Step 3 — green.** Implement `lib/core/sentenceItem.ts` until Step 1 passes; then `npm run check:core` (the module must be pure).
- [ ] **Step 4 — the name.** In `lib/core/deck.ts` add `'sentences'` to `DeckName`/`DECK_NAMES`, add `FlashcardDeckName` and `parseFlashcardDeckName`; point `app/study/page.tsx:2,34` at the narrow parser; extend `lib/core/deck.test.ts`. Run `npm run typecheck`.
- [ ] **Step 5 — the route.** Add the `sentences` branch to `app/api/study/queue/route.ts`, above the `word_progress` query, in the shape `deck=level` already uses (`route.ts:378-415`): `SENTENCES_SELECT = 'id, headword, cefr_profile_band, senses!inner(translation_confidence, sense_items!inner(item_index, stem), sense_distractors!inner(distractor, relation_type))'`, `.eq('cefr_profile_band', profile.level)`, `total` counted **before** the cut. `no_level` ⇒ 409 · `42P01`/`PGRST205` ⇒ `schema_missing` 503 — ⛔ the same three codes, ⛔ not new ones.
- [ ] **Step 6 — the contract, same commit.** Add `?deck=sentences` to `docs/api-contract.md` beside the other three decks, stating that `total` is counted before `limit` — that is the only reason `<DeckSelector>` may read a count with `limit=1`.
- [ ] **Step 7 — D-013, pinned rather than restated.** In `app/api/study/queue/route.test.ts` scan this route's source: `senses.cefr_level` absent **by name** (D-034) and `/api/review` absent **by name** (T-165ⓒ). ⛔ The low-confidence exclusion is ⛔ NOT re-implemented here — `supabase/migrations/0003a_low_confidence_is_visible.sql:45-49` enforces it in RLS, and a second copy is a second rule that can drift.
- [ ] **Step 8 — the tile's number.** In `components/DeckSelector.tsx` add `SENTENCES_QUERY = '/api/study/queue?deck=sentences&limit=1'` to the `Promise.all` at `:169`, and replace `note: LOCKED_HE` with `SENTENCES_NOTE_HE = (n: string) => \`${n} משפטים ברמה שלך\`` — the `<count> <noun phrase>` shape the render draws for **every** tile. ⛔ `href` stays `null` and `locked` stays `true`: see § 5.
- [ ] **Step 9 — the tile's test.** In `components/DeckSelector.test.ts` assert the third read is issued, that `'נעול'` no longer appears as this tile's note (fails **by name**), and that `«—»` still travels when the read fails — ⛔ `«—»` is not `0`.
- [ ] **Step 10 — the walk.** `(npx next dev -p 3000 &) && sleep 25`, then drive `http://127.0.0.1:3000/dev/tabs/cards` at **375×780** and record: heading · character count · tappable count · targets under 44px · horizontal scroll · console errors. Compare the four tiles' second lines to `render_video_A.py:290,296`.
- [ ] **Step 11 — the full gate.** `npm run verify` (typecheck · check:core · tests · build · check:mobile). ⚠️ ⛔ No claim of success without the output of this run in the same message.

## 5 · What this plan deliberately does ⛔ NOT do, and who owns each

⛔ **These are ⛔ not deferrals of convenience. Each is a decision `RULES § 0.16` sends to
the PM, and executing it here would be Dev minting it.**

1. ⛔ **The `משפטים` SCREEN.** `docs/design/` holds no cards-sentences render (`kol-A-*` is
   placement · deck · card · learning · story · question · me). `§ 4.2ו` fixes the route,
   the order and the write path and ⛔ **not what is written on the card** — that is
   **F-052**, still open against the PM. The Dev standing order is explicit: *a UI task
   with no UX plan and no anchor-spec section ⇒ ⛔ do not invent one.* ⇒ **F-143.**
2. ⛔ **`T-199ⓐ` — the tile becoming navigable.** `36 § 5` fixes **two** decks and the
   render draws two; the third (`מנת היום`) exists only because `§ 4.2כ ד׳` **declared**
   the deviation in writing. A fourth has no such declaration, and meanwhile `36 § 6` and
   the delivered ring (`lib/core/worldRing.ts:78,138`) carry `sentences` as a
   `locked_infra` node reading «המשפטים ייפתחו כשמאגר המשפטים ייבנה» — a note D-097 has
   already measured **satisfied**. Two homes, one feature. ⇒ **F-142.**
3. ⛔ **Grading.** A sentences deck is level-band words, so most of them have no
   `word_progress` row, and `app/api/practice/route.ts:59` answers **404** to exactly
   those — **F-140** in a second deck. ⛔ Wiring a write here before that PM decision
   lands would be minting the mechanic F-140 was opened to protect. ⇒ recorded in
   **F-143**.
4. ⛔ **`T-166`** (release conditions measured automatically) — `loop`, ⛔ not `cards`.

## 6 · Self-check

- `npm run check:plan docs/superpowers/plans/2026-08-26-sentences-read-side.md` ⇒ **9/9**.
- Every step names a file or a command.
- The render is named **and** its values are quoted (§ 0 table), the finish declaration is
  present, and **layer A** is stated as the only carve-out.
- ⛔ Zero migration · ⛔ zero new column · ⛔ zero new route — `sense_items` and
  `sense_distractors` have existed since `supabase/migrations/0002_content_bank.sql:104,121`.
