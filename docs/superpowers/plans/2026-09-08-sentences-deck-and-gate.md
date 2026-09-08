# The «משפטים» Deck on the Existing Card, and the Gate That Opens It — T-066 · T-199ⓐ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task, with `superpowers:test-driven-development` inside every task. Steps use checkbox (`- [ ]`) syntax for tracking. **One commit per task** (`docs/agents/DEV.md` STEP 4.5) — Task A is `T-066`, Task B is `T-199ⓐ`, in that order and ⛔ never the reverse (§ 5). `npm run verify` green and freshly run before each commit. `[SKILL: ui-styling]` is the `סקיל` cell of both rows — load it before Task A step 8 if the session offers it (`docs/skills-registry.md`: plugin `ui-ux-pro-max`); if the session does ⛔ not offer it, write `סקילים: ⛔ אף אחד` in the report and build by the constitution (`DEV.md` STEP 4).

**Goal:** A learner who taps «משפטים» on `/cards` reaches `/study?deck=sentences` and gets the **same card frame** as the word decks, carrying a cloze stem («I have too much ____ this week.»), **three** English options under it, and — the moment an option is tapped — the back: the completed sentence, the Hebrew translation, the neutral example, a written verdict, and «המשך». Grading writes `attempts`/`correct_attempts` and ⛔ nothing else (practice wire, `D-033`). The tile stops being locked: its second line is already the count (`T-199ⓑⓒ`); it now also carries an `href`.

**Architecture:** ⛔ **No new screen, no new route, no new surface component** (`D-169`, Roy's words: «אין צורך במסך חדש»). The cloze item becomes a **third variant of the existing `Card` union** — `input: 'choice'` — built by a new pure `lib/core/sentenceCard.ts`, and `components/Flashcard.tsx` grows one branch that draws the options where the typed direction draws its input. `components/CardDeck.tsx` accepts a `SentenceItem` beside a `QueueCardInput` and keys it by `wordId#itemIndex`. `components/StudyDeckScreen.tsx` reads `items` for `deck=sentences` and routes its grade to `POST /api/practice` with `deck: 'sentences'`. `lib/core/deck.ts` loses the `Exclude<DeckName, 'sentences'>` gate (`T-199ⓐ`, `D-169 § ⚠️`), and `app/api/practice/route.ts` opens a `word_progress` row for a sentences word exactly as `D-142` opened it for `level` — same band query, same «never met» class.

**Tech Stack:** TypeScript · React 19 · Next 16 · Tailwind 3.4 · Vitest (`node` environment, source-guard style) · Playwright walk (`scripts/verify-mobile.mjs`). ⛔ No new dependency — `pick-ui-library` is ⛔ not triggered (`DEV.md § 🧰`): the option list is three native `<button>`s, the pattern `components/RecallCard.tsx:176-194` already draws.

**Spec:** `plan/50-tasks.md` rows `T-066` (item anatomy per `D-156`) and `T-199` (ⓐ — «להסיר את `lib/core/deck.ts:47` ואת ה-`null` ב-`:104-111`, ולהחזיר `href`/`locked` לאריח») · `plan/40-decisions.md` `D-156` (stem with `____` · **three** options, ⛔ not four — Engine 7.5 · `D-012` · Rodriguez 2005 · back = completed stem + `translation_he` + `example_neutral` · `D-024` answer shown at once) · `D-169` (rides on `kol-A-03-card`; layout binding, content free; ⛔ new screen/route/component forbidden) · `D-149` (a fourth **deck**, ⛔ not a second home; the ring node stays `locked_infra` — `nav` work, ⛔ not this plan) · `D-033` · `D-142` (`T-225`, the insert path for never-met band words) · `§ 4.2ו` (archived: «`לא ידעתי` · `משפטים` ⇒ `POST /api/practice` — `attempts`/`correct_attempts` בלבד») · `D-023` (`near_synonym` never an option, already enforced in `lib/core/sentenceItem.ts`).

🎯 **The render:** `docs/design/kol-A-03-card.png`, source `docs/design/render_video_A.py` — the card frame `CARD_X, CARD_Y, CARD_W, CARD_H = 30, 168, LW - 60, 372` (`:326`), radius `26` and `RAISED` fill with `BORDER_SUB` outline (`:347-348`) — already `rounded-2xl border border-border-subtle bg-surface-raised` in `Flashcard.tsx:411,438`; the **back** stacks `headword 24 SemiBold` at `oy+74` · `Hebrew 44 Bold` at `oy+136` · a short divider at `oy+178` · English example `14` at `oy+214` · Hebrew example at `oy+246` (`:357-365`) — already `data-card-back` (`Flashcard.tsx:459-483`); the controls under the card are two `56px`-high buttons in one row, `bw = (LW-60-14)/2` each (`:381-392`), which the choice card replaces by **three** `min-h-touch` option buttons stacked in one column (§ 0.22 below). **הרנדר מחייב — פריסה וגם בגימור (`36 § 14.4`); שכבה A (נגישות · 44px · ⛔ מצב בצבע בלבד) היא ההחרגה היחידה.** Layer A is used exactly once here: the verdict is **text + glyph** (`✓ נכון` / `✕ לא נכון`, the strings `Flashcard.tsx:571-573` already prints), ⛔ never colour alone.

**Lineage:** `**המשך של: T-165**` (the read side — `lib/core/sentenceItem.ts` · `app/api/study/queue/route.ts` · `docs/api-contract.md` · `components/DeckSelector.tsx` · `lib/core/deck.ts` are the files that row names and this plan extends) and `**המשך של: T-225**` (`app/api/practice/route.ts` insert path, `D-142`). This plan names `components/Flashcard.tsx` and `components/CardDeck.tsx` too (rows `T-259` · `T-243` · `T-268` · `T-276`): it adds one branch to each, ⛔ it does not touch the swipe, the spring, the exit or the round summary.

## Global Constraints

- **Every learner-facing string is Hebrew, RTL.** New strings in this plan, all of them: «השלם את המשפט» (prompt) · «בחרת:» (the wrong choice echoed, mirrors «כתבת:») · «משפטים» (heading + `<title>`, the label `DeckSelector.tsx:88` already carries). Reused verbatim: «נכון» · «לא נכון» · «המשך» · «תרגול — לא משנה את מועד החזרה». English reaches the learner only inside `<EnWord>` / `<EnText>`.
- **`/lib/core/` is PURE** — `lib/core/sentenceCard.ts` takes a `SentenceItem` and returns a `Card`; ⛔ no React, no clock, no `Math.random`.
- **Layer A (frozen, `D-102`):** every option ≥44px (`min-h-touch`) · verdict = glyph + word · the options stay in the DOM after the answer with `aria-disabled="true"` (`RecallCard.tsx:182-186` pattern), so a screen reader still finds them and hears they are done · zero horizontal scroll at 320/375/414 · top-anchored — the card fills `CardDeck`'s slot (`h-[calc(100dvh-10rem)]`, `CardDeck.tsx:221`, ⛔ not edited).
- **Layer B:** radius from the five-value scale only (`rounded-2xl` card, `rounded-lg` options, `rounded-full` «המשך») · ⛔ no glow · ⛔ no new colour token.
- **Motion:** ⛔ none added. The choice card never activates the swipe: `swipeActive = revealed && card.input === 'self'` (`Flashcard.tsx:247`) is already false for it. `scripts/check-motion.mjs` stays untouched.
- **The reveal is untouchable (`T-259ⓔ`):** the `self` branch `<button onClick={reveal} data-reveal>` is ⛔ not edited. The choice branch is a **sibling**, ⛔ not a rewrite.
- **`Flashcard.test.ts:339` bans `style={{}}`** — the choice branch uses classes only.
- **⛔ No write in `app/api/study/queue/route.ts`** (`route.test.ts:315-320` scans the branch for `upsert/insert/update/applyPractice`). The grade travels through `/api/practice`.
- **`D-149 § ד׳`:** `lib/core/worldRing.ts` is ⛔ not touched — opening the ring node is `nav`.
- **Generated files regenerate in the same commit:** `npm run generate-map` (after any `app/` · `components/` · `lib/` change) · `npm run build:surfaces` (a new `/dev/card/choice` route enters `plan/63-surfaces.md`) · `npm run measure:plan` after the register edits at close.

## § 0.22 — the reversible calls this plan makes, one line each (Dev's latitude, logged)

1. **`Card` gains a variant instead of a new component** — `D-169` forbids a new component; a third `input` on the existing union is what lets one `<Flashcard>` and one `<CardDeck>` draw it. One commit undoes it.
2. **Options are one column, ⛔ not the render's two-button row** — the render draws two 56px buttons; three options of unequal length in a 2-column grid at 320px measured on `/dev/world/recall` (same pattern, four options) wrap `~11-char` words; one column keeps every label on one line at 320. Module layout, reversible.
3. **`SentenceItem` carries `translationHe` + `exampleNeutral`** — `D-156 ⓒ` fixes the back's content; the fields ride the row the route already joins (`senses.translation_he`, `sense_examples`), ⛔ no new column.
4. **`deck: 'sentences'` opens a `word_progress` row on `/api/practice`** — `D-142`'s own reason («`level` IS the words that have no row yet») is true of `sentences` word for word (same `words.cefr_profile_band = profiles.current_level` query, `route.ts:413-421`). ⚠️ This is the one line here that touches `word_progress`; it applies an existing decision to the deck `§ 4.2ו` and `D-156 ⓑ` already route to practice — flagged in the report so the PM can veto it with one commit.

## 1 · File Structure

| File | New / edited | What |
|---|---|---|
| `lib/core/sentenceItem.ts` | edited | `SENTENCE_OPTION_COUNT = 3` (`D-156`, was 4) · `SentenceCandidate` + `SentenceItem` gain `translationHe: string` and `exampleNeutral: string \| null`. Header comment: «וארבע אפשרויות» → «ושלוש אפשרויות». |
| `lib/core/sentenceItem.test.ts` | edited | Expectations follow the count (`:26-31` «ארבע» → «שלוש»); the `thin` case at `:47-51` becomes **one** distractor (two are enough now); new: `translationHe`/`exampleNeutral` travel through. |
| `lib/core/flashcard.ts` | edited | `Card` union gains `(CardBase & { direction: 'recognition'; input: 'choice'; options; answer; stem })`. ⛔ `buildCard` untouched. `splitAroundTarget` exported (it is what draws the neutral example's target). |
| `lib/core/sentenceCard.ts` | **new** | PURE. `buildSentenceCard(item)` → `Card` (`input: 'choice'`) · `gradeChoice(card, chosen)` · `completeStem(stem, answer)` · `splitStem(stem)`. |
| `lib/core/sentenceCard.test.ts` | **new** | Step 1 tests below. |
| `lib/core/deck.ts` | edited (Task B) | `FlashcardDeckName`, `FLASHCARD_DECK_NAMES`, `parseFlashcardDeckName` **deleted** (`T-199ⓐ`); `PracticePayload.deck: DeckName`; `checkPracticePayload` validates against `DECK_NAMES`. `DeckCard = QueueCardInput \| SentenceItem` + `deckCardKey()` (Task A). |
| `lib/core/deck.test.ts` | edited | `:172` flips (`'sentences'` is accepted); `:297-320` block deleted with the function; new: `deckCardKey`. |
| `app/api/study/queue/route.ts` | edited | `SENTENCES_SELECT` adds `translation_he, sense_examples(kind, text_en)` inside `senses!inner(...)`; `toSentenceCandidate` fills the two fields. ⛔ Nothing else in the branch moves. |
| `app/api/study/queue/route.test.ts` | edited | `:328-332`: the contract now names `/study?deck=sentences` as **open** — `parseFlashcardDeckName` assertion replaced by `D-169`. |
| `app/api/practice/route.ts` | edited (Task B) | `:60` — `if (payload.deck !== 'level' && payload.deck !== 'sentences')`. |
| `app/api/practice/route.test.ts` | edited (Task B) | Source scan: the narrowed 404 names both decks; the four scheduling columns still absent. |
| `components/Flashcard.tsx` | edited | `prompt` for `choice` · the face for `choice` (a `<div>`, ⛔ not the reveal button — the options are the action) · the blank `____` drawn as an inline frame (`RecallCard.tsx:118-122` pattern) · options block · back adds the completed stem + translation + example · verdict + «בחרת:» + «המשך» reuse the typed branch's markup. |
| `components/Flashcard.test.ts` | edited | Source guards for the choice branch (Step 7). |
| `components/CardDeck.tsx` | edited | `cards: readonly DeckCard[]` · key = `deckCardKey(card)` · `'stem' in card ? buildSentenceCard(card) : buildCard(...)` · `onGraded(wordId, …)` unchanged (a sentence item's `wordId`). |
| `components/CardDeck.test.ts` | edited | `:208-210`: key by `deckCardKey`, both builders named. |
| `components/StudyDeckScreen.tsx` | edited | `QueueResponse` gains `items?`; `HEADINGS: Record<DeckName, string>` (adds «משפטים»); `sendGrade` gate becomes the explicit list `unknown \| level \| sentences`. |
| `components/StudyDeckScreen.test.ts` | edited | `UNKNOWN_GATE` (`:74`) follows the new list; new: `items` read for `sentences`. |
| `app/study/page.tsx` | edited (Task B) | `parseDeckName` (the wide gate — the screen now draws every deck); `<title>` «משפטים». |
| `app/study/page.test.ts` | edited (Task B) | `:49-53` inverts: `parseDeckName` present, `parseFlashcardDeckName` absent **by name**. |
| `components/DeckSelector.tsx` | edited (Task B) | The `sentences` entry goes through `toEntry({ href: '/study?deck=sentences', count: counts.sentences, note })`; `locked` dropped; comments `:48-51`, `:248-257` rewritten. |
| `components/DeckSelector.test.ts` | edited (Task B) | `:151-157` inverts (`/study?deck=sentences` present · `href: null` · `locked: true` absent). |
| `app/dev/card/choice/page.tsx` | **new** | Fixture: `buildSentenceCard` on a non-learning stem (`Lorem`), `onGrade` no-op. |
| `scripts/verify-mobile.mjs` | edited | `'/dev/card/choice'` in the route list (`:52-54` block) + a choice block inside `if (route.startsWith('/dev/card'))` (`:1605`). |
| `scripts/verify-mobile.test.ts` | edited | The new route is listed and its checks named. |
| `docs/api-contract.md` | edited | `deck=sentences` section (`:373-424`): three options · the two new item fields · «⛔ נופל למנת היום» sentence replaced by `D-169` · `/api/practice` accepts `deck: 'sentences'` and opens a row (`D-142`). Same commit as the route (Task A) and as the practice change (Task B). |
| `docs/architecture-map.json` · `plan/63-surfaces.md` | regenerated | `npm run generate-map` · `npm run build:surfaces`. |

## 2 · Interfaces

```ts
// lib/core/sentenceItem.ts — PURE
export const SENTENCE_OPTION_COUNT = 3;                       // D-156 · Engine 7.5 · D-012
export interface SentenceCandidate {
  readonly wordId: string;
  readonly headword: string;
  readonly translationHe: string;                              // NEW — senses.translation_he
  readonly exampleNeutral: string | null;                      // NEW — sense_examples kind='neutral'
  readonly stems: readonly { readonly itemIndex: number; readonly stem: string }[];
  readonly distractors: readonly { readonly text: string; readonly relationType: string }[];
  readonly cefrProfileBand: string | null;
}
export interface SentenceItem {
  readonly wordId: string;
  readonly itemIndex: number;
  readonly stem: string;
  readonly answer: string;
  readonly options: readonly string[];                         // exactly 3, shuffled, all English
  readonly translationHe: string;                              // NEW
  readonly exampleNeutral: string | null;                      // NEW
}

// lib/core/flashcard.ts
export type Card =
  | (CardBase & { readonly direction: 'recognition'; readonly input: 'self' })
  | (CardBase & { readonly direction: 'production'; readonly input: 'typed' })
  | (CardBase & {
      readonly direction: 'recognition';
      readonly input: 'choice';
      readonly options: readonly string[];
      readonly answer: string;
      /** The stem split at `____` — the component draws `before`, the frame, `after`. */
      readonly stem: { readonly before: string; readonly after: string };
    });
export function splitAroundTarget(sentence: string | null, headword: string): ExampleSegment[]; // now exported

// lib/core/sentenceCard.ts — PURE
export function splitStem(stem: string): { before: string; after: string };   // throws RangeError without BLANK_TOKEN
export function completeStem(stem: string, answer: string): string;           // first BLANK_TOKEN → answer
export function buildSentenceCard(item: SentenceItem): Card;                  // input:'choice'
//   front: { primary: item.stem (en) … }   back: { primary: completeStem (en), secondary: translationHe,
//   example: exampleNeutral, exampleSegments: splitAroundTarget(exampleNeutral, answer), unverified:false }
export function gradeChoice(card: Card, chosen: string): CardGrade;           // 'good' iff chosen === answer (exact)

// lib/core/deck.ts
export type DeckCard = QueueCardInput | SentenceItem;
export function isSentenceCard(card: DeckCard): card is SentenceItem;         // 'stem' in card
export function deckCardKey(card: DeckCard): string;                          // word_id | `${wordId}#${itemIndex}`
export type FlashcardDeckName = never;  // ⛔ DELETED in Task B, with FLASHCARD_DECK_NAMES + parseFlashcardDeckName
export type PracticePayload = { wordId: string; grade: CardGrade; deck: DeckName };

// components/CardDeck.tsx
readonly cards: readonly DeckCard[];
// components/StudyDeckScreen.tsx
type QueueResponse = | { ok: true; deck: DeckName; total: number; cards?: readonly QueueCardInput[]; items?: readonly SentenceItem[] } | { ok: false; code: string };
```

## 3 · Task A — `T-066` · the cloze item on the existing card (one commit)

- [x] **Step 1 — red, the pure card.** Write `lib/core/sentenceCard.test.ts` first; `npx vitest run lib/core/sentenceCard.test.ts` must fail because the module does not exist.

```ts
import { describe, expect, it } from 'vitest';
import { buildSentenceCard, completeStem, gradeChoice, splitStem } from './sentenceCard';

const item = {
  wordId: '11111111-1111-4111-8111-111111111111',
  itemIndex: 0,
  stem: 'The workers had to ____ the design.',
  answer: 'alter',
  options: ['repair', 'alter', 'later'],
  translationHe: 'לשנות',
  exampleNeutral: 'They may alter the plan.',
};

describe('sentenceCard — D-156 · D-169', () => {
  it('הגזע נחתך בחסר, והגב הוא המשפט המושלם', () => {
    expect(splitStem(item.stem)).toEqual({ before: 'The workers had to ', after: ' the design.' });
    expect(completeStem(item.stem, 'alter')).toBe('The workers had to alter the design.');
    expect(() => splitStem('no blank here')).toThrow(RangeError);
  });

  it('input הוא choice, שלוש אפשרויות, והתשובה ביניהן', () => {
    const card = buildSentenceCard(item);
    expect(card.input).toBe('choice');
    if (card.input !== 'choice') throw new Error('unreachable');
    expect(card.options).toHaveLength(3);
    expect(card.options).toContain('alter');
    expect(card.front.primaryLang).toBe('en');
  });

  it('הגב: משפט מושלם · תרגום · דוגמה ניטרלית — ⛔ שדה חדש אין (D-156 ⓒ)', () => {
    const card = buildSentenceCard(item);
    expect(card.back.primary).toBe('The workers had to alter the design.');
    expect(card.back.secondary).toBe('לשנות');
    expect(card.back.example).toBe('They may alter the plan.');
    expect(card.back.exampleSegments.map((s) => s.text).join('')).toBe('They may alter the plan.');
    expect(card.back.exampleSegments.some((s) => s.isTarget)).toBe(true);
  });

  it('ציון: התשובה המדויקת בלבד היא good — ⛔ לא רישיות שונות, ⛔ לא רווחים', () => {
    const card = buildSentenceCard(item);
    expect(gradeChoice(card, 'alter')).toBe('good');
    expect(gradeChoice(card, 'repair')).toBe('again');
    expect(gradeChoice(card, 'Alter')).toBe('again');
  });

  it('מוטציה: ⛔ אף אפשרות עברית ו⛔ אין translation_he בין האפשרויות (D-087 בהיפוך)', () => {
    const card = buildSentenceCard(item);
    if (card.input !== 'choice') throw new Error('unreachable');
    for (const option of card.options) expect(option).not.toMatch(/[֐-׿]/);
    expect(card.options).not.toContain('לשנות');
  });
});
```

- [x] **Step 2 — three, not four.** In `lib/core/sentenceItem.ts` set `SENTENCE_OPTION_COUNT = 3`, add `translationHe` / `exampleNeutral` to both interfaces and carry them through `buildSentenceItems` (`:128-138`). Update `lib/core/sentenceItem.test.ts` (the `alter` fixture gains the two fields; `thin` at `:47` keeps **one** distractor; the count assertions read `SENTENCE_OPTION_COUNT`). Run `npx vitest run lib/core/sentenceItem.test.ts`.
- [x] **Step 3 — the union.** In `lib/core/flashcard.ts` add the `choice` variant to `Card` (§ 2) and `export` `splitAroundTarget`. Run `npm run typecheck` — it must still pass with ⛔ no other file changed (the variant is additive; `Flashcard.tsx` narrows on `input` and its existing branches keep compiling).
- [x] **Step 4 — green.** Implement `lib/core/sentenceCard.ts` until Step 1 passes; then `npm run check:core`.
- [x] **Step 5 — the deck's key.** In `lib/core/deck.ts` add `DeckCard`, `isSentenceCard`, `deckCardKey`; test in `lib/core/deck.test.ts`: a word card keys by `word_id`, a sentence item by `wordId#itemIndex`, and two stems of one word get **two** keys. `npx vitest run lib/core/deck.test.ts`.
- [x] **Step 6 — the route carries the two fields.** `app/api/study/queue/route.ts`: `SENTENCES_SELECT` → `'id, headword, cefr_profile_band, senses!inner(translation_he, sense_examples(kind, text_en), sense_items!inner(item_index, stem), sense_distractors!inner(distractor, relation_type))'`; `SentenceSenseRow` gains `translation_he` + `sense_examples`; `toSentenceCandidate` takes the **first sense with a non-empty `translation_he`** for the two fields (same rule as `pickSense`, `:206-214`) and returns `null` when none has one — a card with no translation is no card (`D-156 ⓒ`). Add to `route.test.ts`: `SENTENCES_SELECT` contains `translation_he` and `sense_examples`. Update `docs/api-contract.md:373-424` — three options, the two fields in the example JSON, and replace `:378` («נופל ל«מנת היום» עד שהמסך קיים») with «`D-169`: המסך הוא `/study?deck=sentences`, על הכרטיס הקיים». Same commit.
- [x] **Step 7 — red, the component guards.** Add to `components/Flashcard.test.ts` (source-scan style, like its neighbours) and run `npx vitest run components/Flashcard.test.ts` — must fail:

```ts
describe('T-066 — the choice card (D-156 · D-169)', () => {
  it('draws the options as native buttons ≥44px, each inside <EnWord>', () => {
    const region = braceRegion(CODE, "{card.input === 'choice' && !revealed ? (");
    expect(region).toContain('data-option');
    expect(region).toContain('min-h-touch');
    expect(region).toContain('<EnWord>{option}</EnWord>');
  });
  it('a tapped option grades AND reveals in one handler — D-024, no second button before the answer', () => {
    const region = braceRegion(CODE, "{card.input === 'choice' && !revealed ? (");
    expect(region).toContain('setGrade(gradeChoice(card, option))');
    expect(region).toContain('reveal()');
  });
  it('after the answer the options stay in the DOM, aria-disabled — Layer A', () => {
    const region = braceRegion(CODE, "{card.input === 'choice' && revealed ? (");
    expect(region).toContain('aria-disabled="true"');
    expect(region).toContain('data-continue');
  });
  it('the blank is a frame, ⛔ never the answer text before the tap', () => {
    expect(CODE).toContain('data-stem-blank');
    expect(CODE).toMatch(/data-stem-blank[\s\S]{0,200}ZERO_WIDTH_SPACE/);
  });
  it('⛔ the choice card never activates the swipe', () => {
    expect(CODE).toContain("const swipeActive = revealed && card.input === 'self';");
  });
});
```

- [x] **Step 8 — the branch.** In `components/Flashcard.tsx`: `prompt` → `card.input === 'choice' ? 'השלם את המשפט' : …`; in the non-reveal face (`:438`) draw the front as `<EnWord>{stem.before}<span data-stem-blank className=BLANK_CLASS>{revealed ? answer : ZERO_WIDTH_SPACE}</span>{stem.after}</EnWord>` when `card.input === 'choice'` (⛔ the `self`/`typed` front at `:445-449` untouched); the back for `choice` adds `card.back.secondary` (Hebrew, `text-2xl font-semibold`, `data-card-secondary`) between the completed stem and the example. In the actions column (`:513`): `{card.input === 'choice' && !revealed ? (<ul className="flex flex-col gap-3">…three `<button type="button" data-option onClick={() => { setGrade(gradeChoice(card, option)); setChosen(option); reveal(); }} className="min-h-touch rounded-lg border border-border-strong px-4 py-3 text-lg text-ink active:opacity-90"><EnWord>{option}</EnWord></button>`…</ul>) : null}` and `{card.input === 'choice' && revealed ? (…the same list with `aria-disabled="true"` and the chosen one `border-2` + glyph, then the verdict `<p data-verdict>` and «בחרת: <EnWord>{chosen}</EnWord>» when wrong, then `<button data-continue onClick={() => onGrade(grade ?? 'again')}>המשך</button>` — the typed branch's exact classes at `:566-583`, `:598-605`) : null}`. State: `const [chosen, setChosen] = useState<string | null>(null)`, reset in the `shown !== card` block (`:214-220`). Run `npx vitest run components/Flashcard.test.ts` → green; `npm run typecheck`.
- [x] **Step 9 — the deck takes both.** `components/CardDeck.tsx`: `cards: readonly DeckCard[]`; `remaining`/`graded`/`nodes`/`scrollTo` keyed by `deckCardKey(card)`; the `<article key>` and the `Flashcard card={…}` become `isSentenceCard(card) ? buildSentenceCard(card) : buildCard(…)`; `review={isSentenceCard(card) ? undefined : card.review}`; `onGrade={(value) => grade(deckCardKey(card), isSentenceCard(card) ? card.wordId : card.word_id, value)}` — `grade(key, wordId, value)` now takes both. Update `CardDeck.test.ts:208-210` to assert `deckCardKey` in the key and both builders by name. `npx vitest run components/CardDeck.test.ts`.
- [x] **Step 10 — the screen reads `items`.** `components/StudyDeckScreen.tsx`: `QueueResponse` per § 2; `load()` → `const list = body.items ?? body.cards ?? []`; `HEADINGS` record with «משפטים»; `sendGrade` gate → `if (deck === 'unknown' || deck === 'level' || deck === 'sentences') {` (the `deck` variable already travels in the body, `:119`). `onGraded(wordId, grade)`: for `sentences` the card lookup is by `wordId` on `isSentenceCard` entries. Update `StudyDeckScreen.test.ts:74` `UNKNOWN_GATE` to the new string; add: the string `body.items` appears in `load`. `npx vitest run components/StudyDeckScreen.test.ts`.
- [x] **Step 11 — the fixture.** Create `app/dev/card/choice/page.tsx` on the `app/dev/card/page.tsx` pattern: `buildSentenceCard({ wordId: '00000000-0000-4000-8000-000000000000', itemIndex: 0, stem: 'The ____ is only a layout fixture.', answer: 'Lorem', options: ['Ipsum', 'Lorem', 'Dolor'], translationHe: 'טקסט לדוגמה', exampleNeutral: 'The Lorem is only a layout fixture.' })`, `onGrade={() => undefined}`, the same «בדיקת פריסה — אינו תוכן לימודי» line. In `scripts/verify-mobile.mjs` add `'/dev/card/choice'` after `'/dev/card/swap'` (`:54`) and, inside the `/dev/card` block (`:1605`), `if (route === '/dev/card/choice') { … }`: `[data-option]` count === 3 · each ≥44px tall · `[data-card-back]` count 0 · click the **second** option · `[data-card-back]` count 1 · `[data-verdict]` present · `[data-continue]` present · `[data-option][aria-disabled="true"]` count === 3. Mirror in `scripts/verify-mobile.test.ts`. `npm run build:surfaces`.
- [x] **Step 12 — look at it.** `(npx next dev -p 3000 &) && sleep 25`, drive `http://127.0.0.1:3000/dev/card/choice` at **375×780** (and 320, 414): record heading · character count · tappable count · under-44px count · `document.documentElement.scrollWidth` · console errors; compare the card's back stack (completed stem · Hebrew · divider · example) to `render_video_A.py:357-365`. Then `npm run generate-map`, `npm run verify`, commit `loop(DEV): C-XXXX T-066 — the «משפטים» item on the existing card (D-156 · D-169)`.

## 4 · Task B — `T-199ⓐ` · the gate opens (one commit)

- [ ] **Step 13 — red.** Flip the guards first and run them: `lib/core/deck.test.ts:172` → `.ok).toBe(true)` with `payload.deck === 'sentences'`; delete the `describe('parseFlashcardDeckName …')` block (`:297-320`) and add `it('⛔ parseFlashcardDeckName ⛔ אינו קיים עוד — T-199ⓐ · D-169', () => expect(DECK_SOURCE).not.toContain('parseFlashcardDeckName'))` (source scan of `lib/core/deck.ts`); `app/study/page.test.ts:49-53` → `parseDeckName` present, `parseFlashcardDeckName` absent; `components/DeckSelector.test.ts:151-157` → region contains `'/study?deck=sentences'`, ⛔ not `href: null`, ⛔ not `locked: true`, and `CODE` matches `/toEntry\(\{\s*\n\s*key: 'sentences'/`; `app/api/practice/route.test.ts` → the source contains `payload.deck !== 'level' && payload.deck !== 'sentences'`. `npx vitest run lib/core/deck.test.ts app/study/page.test.ts components/DeckSelector.test.ts app/api/practice/route.test.ts` — four red files.
- [ ] **Step 14 — `lib/core/deck.ts`.** Delete `FlashcardDeckName` (`:47`), `FLASHCARD_DECK_NAMES` (`:48`), `parseFlashcardDeckName` (`:103-113`) and the comment block `:32-46` (replace with three lines: «`T-199ⓐ` · `D-169` — one gate, `parseDeckName`; the screen draws every deck the route serves»). `PracticePayload.deck: DeckName` (`:250`, comment `:248` updated); `checkPracticePayload` (`:280-283`) validates against `DECK_NAMES`. `npm run typecheck` → the compiler now lists every consumer: `app/study/page.tsx`, `components/StudyDeckScreen.tsx` (if it imported the narrow type), `app/api/practice/route.ts`. Fix each.
- [ ] **Step 15 — `app/study/page.tsx`.** `parseDeckName` in both `generateMetadata` and the page; `title` → a `Record<DeckName, string>` (`מנת היום` · `סינון מילים` · `לא ידעתי` · `משפטים`); rewrite the `:47-53` comment (the sentence «until the sentences screen exists» is now false — ⛔ do not leave it). `npm run check:titles`.
- [ ] **Step 16 — `/api/practice` opens a row for `sentences`.** `app/api/practice/route.ts:56-62`: the narrowed 404 → `if (payload.deck !== 'level' && payload.deck !== 'sentences')`, comment cites `D-142` and § 0.22 line 4 of this plan. ⛔ The insert body (`:69-80`) is unchanged — same two counters, `next_review_at: null`. `docs/api-contract.md` `/api/practice` section: `deck` accepts `'sentences'`, and a missing row is opened for it as for `level`. `npx vitest run app/api/practice/route.test.ts`.
- [ ] **Step 17 — the tile.** `components/DeckSelector.tsx:258-265` → `toEntry({ key: 'sentences', label: SENTENCES_LABEL_HE, href: '/study?deck=sentences', count: counts.sentences, note: SENTENCES_NOTE_HE(noteFor(counts.sentences)) })` — an empty band is **disabled with its number** (`§ 4.2ו`), ⛔ not locked. Delete comments `:48-51` and `:248-257` (both describe a lock that no longer exists) and write two lines citing `T-199ⓐ` · `D-169`. `LOCKED_HE` (`:78`) stays — «סינון מילים» still uses it (`:324`). `npx vitest run components/DeckSelector.test.ts`.
- [ ] **Step 18 — the walk, on the real route.** `(npx next dev -p 3000 &) && sleep 25`; drive `http://127.0.0.1:3000/dev/tabs/cards` at 375×780: the «משפטים» tile is an `<a href="/study?deck=sentences">` when its count is > 0 and a disabled tile with «— משפטים ברמה שלך» here (no env) · exactly one `[data-primary-action]` · 0 targets under 44px · `scrollWidth === 375`. Then `http://127.0.0.1:3000/study?deck=sentences`: heading «משפטים», the 503 failure state by contract (no env), `<title>` «משפטים».
- [ ] **Step 19 — close.** `npm run generate-map` · `npm run build:surfaces` · `npm run verify` · commit `loop(DEV): C-XXXX T-199ⓐ — the «משפטים» tile opens; parseFlashcardDeckName removed (D-169 · D-142)`. Then the registers: `T-066` and `T-199` → 🟣 with the cycle id (`T-199` row: ⓐ delivered, ⓑⓒ were C-0321) · `npm run measure:plan` · `plan/00-control.md` · one journal line · push `work/current`.

## 5 · Order, and what this plan deliberately does ⛔ NOT do

- **A before B, ⛔ never B alone.** After Task A the screen exists and is reachable from `/dev/card/choice` only — `parseFlashcardDeckName` still nulls the URL. After Task B the tile and the URL open it. Task B without Task A is the F-027 dead end `deck.ts:38-41` was written against.
- ⛔ **The ring node** (`lib/core/worldRing.ts:241`, `locked_infra`) — `D-149 § ד׳`: «מעבר של צומת מכאן ל-`open` הוא משימה» in `nav`. Not here.
- ⛔ **A second stem per word in one round** is allowed as `T-165` built it (`sentenceItem.ts:105-107` flattens before the shuffle); `deckCardKey` exists so two stems of one word are two cards. ⛔ No de-duplication is added — that would be a learning-mechanic call.
- ⛔ **No timing, no score, no streak** (`§ 4.2ו` q3 · `T-032`). The verdict is «נכון»/«לא נכון», the strings the typed direction already prints.
- ⛔ **`RecallCard.tsx` is not reused as a component** — it fetches `/api/world/recall` and owns its own states; only its blank-frame classes are quoted.

## 6 · Self-check

- `npm run check:plan docs/superpowers/plans/2026-09-08-sentences-deck-and-gate.md` ⇒ 10/10 (tasks · files · Interfaces · real tests · ≥3 steps · every step addressed · verify · render · finish declaration · lineage declared).
- Every step names a file or a command.
- The render is named and its values are quoted (frame `:326`, `:347-348`; back stack `:357-365`; buttons `:381-392`), the finish declaration is present, and Layer A is stated as the only carve-out.
- ⛔ Zero migration · ⛔ zero new column · ⛔ zero new route · ⛔ zero new surface component · ⛔ zero dependency.
