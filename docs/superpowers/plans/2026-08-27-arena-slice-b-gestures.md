# Arena slice B — the gestures: drag to cast, and the dodge window — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (or
> `superpowers:subagent-driven-development`). Every step is a `- [ ]` and closes only
> after a fresh run whose output goes into the tick report.

**Written:** C-0327 (DEV, 📝 planning tick) · 2026-08-27T04:40Z (`date -u`)

**Goal:** close **T-178 → T-179 → T-212** in one branch: the learner casts by dragging a
spell card **upward**, dodges by swiping the **stage sideways** inside the announced
window, and the arena's word query stops filtering on a join whose reason T-152 deleted.

**Architecture:** the three layers the repo already enforces, and slice A did not bend.
The **rule** lives in `lib/core/*` (pure — ⛔ zero React/DOM/network/clock); the
**component draws and ⛔ does not compute**; the **route applies a read plan and ⛔ does
not decide**. Slice B adds exactly one new pure module, `lib/core/arenaGesture.ts`, which
answers one question — *what gesture was that?* — and ⛔ never *what does it do*: the
consequence is `battle.ts`'s, in the same place the clock already lives. That split is
what lets the 60px threshold, the 30° cone and the six-second telegraph be tested at
their boundaries in **0 ms**, ⛔ and not only in a browser.

**Tech Stack:** Next 16 (App Router) · React 19 · TypeScript
(`noUncheckedIndexedAccess`, ⛔ no `any`) · Tailwind 3 · vitest 2 — ⛔ **no RTL and no
jsdom**: component tests are **source scans**, the template is
`app/arcade/page.test.ts:1-22` and `components/ArenaStage.test.ts` · playwright for
`check:mobile`.

**Spec:** `plan/37-arena-spec.md` § 5 (the attack) · § 6 (the dodge) · § 3 (the clock,
`ENEMY_SWING_MS`) · § 13.1 and § 13.5 (invariants) · `plan/36-video-spec.md` § 8 · § 14 ·
**§ 14.4** · `plan/40-decisions.md` **D-126** (the clock is legal, and `elapsedMs` is an
input) · **D-127** (slice A, and what it deliberately did not touch) · **D-129** (T-212) ·
`plan/35-design-constitution.md` layer A / layer B · `plan/50-tasks.md` rows **T-178** ·
**T-179** · **T-212** · `docs/api-contract.md` § `GET /api/arcade/round`.

**🎯 The render this slice targets:** `docs/design/kol-B-03-battle.png` ·
`docs/design/kol-B-06-dodge.png`, and their source
`docs/design/render_video_B.py` — `spell_card` (:255-284) · `card_pos` (:250-253) ·
`cast_meter` (:327-338) · the dodge label (:575-577) · the beat table `B` (:380-383).
⛔ **Every layout number below was grepped out of that file, ⛔ not eyeballed off the PNG.**

---

## Global Constraints — they apply to all three tasks

- **`36 § 14.4` — the render binds, layout **and finish alike**.** ⛔ «the finish comes
  from the constitution» was **reversed on 24/08 (D-114)** and is ⛔ not an answer to a
  gap. **Layer A of the constitution is the only carve-out, and there is no second one**:
  a contrast floor, a 44px target, or state encoded by colour alone **overrides the
  render** — and the gap goes into the task row **with the number that was measured**.
  § 7 of this plan carries the two such numbers this slice already knows about.
- **TDD.** The test is written first, **run and measured failing** (⛔ not assumed to
  fail), and only then the implementation. The run output goes into the report.
- **`lib/core` is pure.** ⛔ Zero React · window · document · localStorage · fetch ·
  `Date.now` · `setTimeout` · `setInterval` · `requestAnimationFrame`. Gate:
  `npm run check:core`. ‏`elapsedMs` is an **input** on every call (D-126 § ג׳).
- **⛔ A UI component never touches the database.** `<ArenaBattle>` speaks only through
  `lib/api/client.ts`, to `GET /api/arcade/round` and `POST /api/arcade/result`.
- **Invariant `37 § 13.1`:** the arena ⛔ never writes to `word_progress` and ⛔ never
  moves SM-2. ⛔ A comment is not enforcement — the source scans hold it.
- **Invariant `37 § 13.5`:** arena colours live in `app/arcade/arcade-tokens.css` and
  ⛔ **never** enter `lib/core/palette.ts` or `app/globals.css`. `app/arcade/page.test.ts`
  fails by name on each hex.
- **Mobile-first.** 375px is the design width; **320 · 375 · 414** are all measured.
  44px targets, RTL with bidi, `min-h-[100dvh]` and ⛔ never `h-screen`, zero horizontal
  scroll. English reaches a learner **only** inside `<EnWord>`/`<EnText>`.
- **`prefers-reduced-motion` applies in the arena too** (layer A · א7). The global block
  at `app/globals.css:103-108` zeroes durations; anything that moves in JS reads the
  preference **after mount** (⛔ never during render — `matchMedia` does not exist on the
  server and a differing first render is a hydration warning the harness counts as a
  console error). The template is `components/Flashcard.tsx:65-77`.
- **⛔ New CSS blocks go BEFORE the `/* arena-stage` marker in `app/globals.css`**
  (`app/globals.css:151-155`): `components/ArenaStage.test.ts` slices the stage block as
  `CSS.slice(indexOf('/* arena-stage'))` — **to the end of the file** — so a rule appended
  at the bottom is measured as a stage rule and has already failed two tests there.
- **Five radii, and no sixth** (layer B): `md` 6 · `lg` 8 · `xl` 12 · `2xl` 16 ·
  `rounded-full`. The render's card radius is **12** ⇒ `rounded-xl`, ✅ already in the scale.
- **Glow budget** (layer B): max **two** per screen, only on `--brand`/`--brand-surface`,
  ⛔ never on body text. The battle screen spends **zero** today; the card lift in Task 2
  spends **one**, on an arena-scoped token — § 7 records it.
- **⛔ Zero invented learning content.** No task here creates, edits or reorders a word,
  a translation or a distractor.

---

## ⛔ What this slice deliberately does NOT do

| ⛔ Out of scope | Why, in one line |
|---|---|
| **T-182** — the animation language (א1 hit-stop · א2 impact frame · א4 follow-through) | א4 is *cloak, hair and sword lag two frames behind the body*, and `ArenaAvatar` has ⛔ no such layers — `38 § 5` forbids copying the sprites out of `render_video_B.py`, so א4 is ⛔ not buildable until the character base (`38 § 3`) exists. Splitting א1/א2 off from א4 would be a **task change**, ⛔ not an implementer's call ⇒ it stays whole, and whole it is blocked. |
| **T-180** — the results screen | It reads response times that **this slice changes** (a dodged swing adds no cast). Planning it against a moving interface is planning against a guess. It is the natural slice C, together with D-127 § ה׳'s «המילה הזאת לקחה לך 6.2 שניות». |
| **T-153** — tagged Hebrew distractors, and F-147ⓒ's per-element card colour + glyph (`ELEM_COL`) | The card's **element** is a content field that does ⛔ not exist yet. Task 2 builds the card **without** it, in the arena's stone/gold tokens, and the `?` card keeps the written label «לחש לא מזוהה» — ⛔ never a glyph alone (layer A א2). T-212 here is T-153's declared precondition (D-129 § ו׳ step 1). |
| **The four mana abilities** (`הקפאה`·`מגן`·`כפול`·`ריפוי`) and F-147ⓐ's `ability_row` | D-127 § ד׳ excluded them by name; the meter is drawn and computed, the abilities are ⛔ not. |
| **The streak (ק1)** that `37 § 6` says «resets» on a missed dodge | ק1 does ⛔ not exist in `battle.ts`. Task 3 models the **damage** side of § 6 and declares the streak side missing ⇒ it belongs to whichever row builds ק1, ⛔ not to a silent invention here. |
| **The pause button** (F-147ⓓ) | It needs a stoppable battle clock ⇒ **battle mechanic** ⇒ `RULES § 0.16` sends it to the PM. F-147 is already open on it. |

---

## File Structure

| File | Created / edited | Responsible for | Task |
|---|---|---|---|
| `app/api/arcade/round/route.ts` | edited (`ROUND_SELECT`, :21-26) | `sense_distractors!inner` leaves the select | T-212 |
| `app/api/arcade/round/route.test.ts` | edited (:64-67) | the assertion **flips**, ⛔ is not deleted | T-212 |
| `lib/core/arenaGesture.ts` | **created** | *what gesture was that* — the gesture-source rule, the 60px threshold, the 30° cone, the lift offset. ⛔ Pure. ⛔ It ⛔ does not know what a cast does. | T-178 |
| `lib/core/arenaGesture.test.ts` | **created** | the boundaries: 59 vs 60 px, 30° vs 31°, card-down, stage-up, the screen edge, non-finite, reduced motion | T-178 |
| `components/SpellCard.tsx` | **created** | one hand card: draws the render's card, owns the pointer gesture, exposes the tap-select path. ⛔ Draws, ⛔ does not compute. | T-178 |
| `components/SpellCard.test.ts` | **created** | source scan: ⛔ no `setTimeout`, ⛔ no arena hex inline, `<EnWord>` absent (the card face is Hebrew), `aria-pressed` present | T-178 |
| `components/ArenaBattle.tsx` | edited (the hand block :551-573 · the stage block :508-511 · the enemy block :487-506) | wiring: selection state, the fire target, the stage gesture, the telegraph meter | T-178 · T-179 |
| `app/arcade/page.test.ts` | edited | the new screen guards | T-178 · T-179 |
| `app/arcade/arcade-tokens.css` | edited | `--arena-cast` · `--arena-cast-warn` · `--arena-dodge`, arena-scoped | T-179 |
| `app/globals.css` | edited, **before the `/* arena-stage` marker** | the card lift transition and the announce pulse | T-178 · T-179 |
| `lib/core/battle.ts` | edited | `telegraphAt` · `dodge` · `dodgedSwing`, and `tick` honouring an immune swing | T-179 |
| `lib/core/battle.test.ts` | edited | the telegraph boundaries and the immunity | T-179 |
| `app/dev/arcade/page.tsx` | edited if the fixture needs it | the `/dev/arcade` fixture is what `check:mobile` measures | T-178 · T-179 |
| `docs/api-contract.md` | **⛔ untouched** | ⛔ no endpoint shape changes in this slice — `ROUND_SELECT` is an internal read plan, ⛔ not the contract | — |

---

## Interfaces

> **Consumes** (already on the branch, ⛔ do not redefine):
> `lib/core/battle.ts` — `BATTLE_MS` `RAGE_FROM_MS` `ENEMY_SWING_MS` `MANA_MS` `MANA_CAP`
> `CRITICAL_MS` · `BattleState` `BattleCast` `BattleOutcome` `StagePhase` ·
> `startBattle` `manaAt` `isRage` `outcomeAt` `cast` `tick` `stagePhase`.
> `lib/core/swipeGrade.ts` — `SWIPE_EDGE_PX = 20` · `SWIPE_MAX_ANGLE_DEG = 30` ·
> `SWIPE_FEEDBACK_MAX_MS = 200`. ⚠️ **All three were measured, ⛔ not chosen** (that file
> says so at :44-47) ⇒ this slice **imports** them and ⛔ does ⛔ not copy the numbers.
> `lib/core/arenaWords.ts` — `ArenaWord` `ArenaWordKind`.

**Produced by Task 2 — `lib/core/arenaGesture.ts`:**

```ts
/** `37 § 5` — «מחווה שמתחילה על קלף = התקפה, מעלה בלבד; מחווה שמתחילה על הזירה = תזוזת דמות, לצדדים בלבד». */
export type GestureSource = 'card' | 'stage';

/**
 * `37 § 5` — «סף 60px כלפי מעלה». ⚠️ `§ 6` gives ⛔ NO number for the sideways roll,
 * so the arena carries ONE distance rather than two: a second, invented number would be
 * a second rule to keep in sync. ⛔ A `RULES § 0.16` call — one commit reverses it.
 */
export const GESTURE_THRESHOLD_PX = 60;

/** `37 § 5` — the card lifts as it is dragged. The render lifts it 14px at full lift (`spell_card`: `y - pad - lift*14`). */
export const CARD_LIFT_MAX_PX = 14;

export interface GestureInput {
  readonly source: GestureSource;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly viewportWidth: number;
}

/** ⛔ WHAT the gesture was, ⛔ never what it does. The consequence lives in `battle.ts`. */
export type ArenaGesture =
  | { readonly kind: 'cast' }
  | { readonly kind: 'move'; readonly dx: number }
  | null;

export function resolveGesture(input: GestureInput): ArenaGesture;

export interface CardLift {
  readonly y: number;      // ⛔ ≤ 0 — upward only
  readonly lift: number;   // 0..1 — how close to the threshold, for the glow
  readonly settleMs: number;
}

export function cardLift(input: {
  readonly startY: number;
  readonly currentY: number;
  readonly reducedMotion: boolean;
}): CardLift;
```

**Produced by Task 3 — added to `lib/core/battle.ts`:**

```ts
/**
 * `37 § 6` — the telegraph is **6.0 s long and ends in the swing**, and `§ 3` puts the
 * swings 8.0 s apart ⇒ the charge starts 6.0 s before each swing, i.e. 2.0 s after the
 * previous one. ⛔ NOTHING was invented: both numbers are the spec's, and the anchor is
 * the only arrangement that satisfies both at once.
 */
export const TELEGRAPH_MS = 6_000;
export const ANNOUNCE_AT_MS = 5_300;   // `§ 6` — «הכרזה 5.3 ש׳»
export const WINDOW_END_MS = 5_700;    // `§ 6` — «חלון 5.3 עד 5.7 ש׳»

export type TelegraphPhase = 'quiet' | 'charging' | 'window' | 'committed';

export interface Telegraph {
  readonly phase: TelegraphPhase;
  readonly frac: number;        // 0..1 — the meter fill (`cast_meter`)
  readonly swingIndex: number;  // which swing is coming; 1-based, ⛔ never 0
}

export function telegraphAt(elapsedMs: number): Telegraph;

/** ⛔ Returns the state UNCHANGED outside the window — a wasted roll costs nothing (`§ 6` charges tempo, ⛔ not HP). */
export function dodge(state: BattleState, elapsedMs: number): BattleState;
```

`BattleState` gains exactly one field:

```ts
  /** `37 § 6` — the swing the learner rolled out of. ⛔ ONE: immunity belongs to the announced swing. */
  readonly dodgedSwing: number | null;
```

**Produced by Task 2 — `components/SpellCard.tsx`:**

```ts
export interface SpellCardProps {
  readonly label: string;              // Hebrew. ⛔ Never English — the face is a translation.
  readonly unknown: boolean;           // the `?` card (`37 § 2` — «לחש לא מזוהה»)
  readonly selected: boolean;          // the tap path (`§ 5`), and ⛔ never colour alone
  readonly reducedMotion: boolean;
  readonly onSelect: () => void;       // tap = SELECT
  readonly onCast: () => void;         // drag past the threshold = CAST
}
export default function SpellCard(props: SpellCardProps): React.JSX.Element;
```

---

## Task 1: T-212 — `sense_distractors!inner` leaves the arena query

**Why first:** it shares ⛔ no file with Tasks 2–3, so it cannot conflict with them, and it
is D-129 § ו׳ step 1 — T-153's declared precondition. ⚠️ **It changes ⛔ nothing a learner
sees today: 713 of 713 corpus rows carry ≥3 English distractors** (D-129 § א׳) ⇒ `!inner`
is a **no-op right now**. It comes out because T-152 deleted its reason and it is a live
mine under T-153.

**Files:**
- Modify: `app/api/arcade/round/route.ts:14-26` (the doc comment **and** `ROUND_SELECT`)
- Test: `app/api/arcade/round/route.test.ts:64-67`

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new. The route's response shape is **unchanged** ⇒ `docs/api-contract.md` is ⛔ not edited.

- [ ] **Step 1: flip the assertion that holds the current state by name**

In `app/api/arcade/round/route.test.ts`, replace the `it(...)` at :64-67 with:

```ts
  /**
   * T-212 · D-129 — `sense_distractors!inner` is gone. ⛔ The old assertion was ⛔ NOT
   * deleted, it was **flipped**: a test removed without a replacement is exactly what
   * felled T-164.
   */
  it('⛔ `sense_distractors!inner` ⛔ אינו קיים — T-152 מחקה את העילה שלו (D-129)', () => {
    expect(selectBlock).toContain('senses!inner');
    expect(selectBlock).not.toContain('sense_distractors!inner');
  });

  it('הצומת עדיין נקרא — האפשרויות עבריות, אך `sense_distractors` ⛔ אינו יוצא מהשאילתה', () => {
    expect(selectBlock).toContain('sense_distractors(distractor)');
  });
```

- [ ] **Step 2: run it and measure it RED**

Run: `npx vitest run app/api/arcade/round/route.test.ts`
Expected: **FAIL** — `expected '…sense_distractors!inner(distractor)…' not to contain 'sense_distractors!inner'`.
⛔ Do not proceed on an assumed failure; paste the real line into the report.

- [ ] **Step 3: take `!inner` out, and rewrite the comment that argued for it**

In `app/api/arcade/round/route.ts`, `ROUND_SELECT` becomes:

```ts
const ROUND_SELECT =
  'id, headword, cefr_profile_band, ngsl_rank, ' +
  'senses!inner(translation_he, translation_confidence, sense_distractors(distractor))';
```

And the doc comment above it (:18-22) — ⛔ the paragraph that says the node stays «ללא
שינוי בכוונה … ⇒ **F-146**» is now **false** and must go, ⛔ not be left standing:

```ts
/**
 * ⛔ הסינון הוא `words.cefr_profile_band` ולעולם לא `senses.cefr_level` — השתיים חלוקות
 * על 125 מתוך 343 שורות (D-034). ⛔ `!inner` על `senses`: מילה בלי משמעות אינה פריט קרב,
 * ו-outer join היה מכניס אותה ואז מדלג עליה בשקט בשכבה הטהורה.
 *
 * ⚠️ **T-212 · D-129 — `sense_distractors` ⛔ אינו `!inner` עוד.** T-152 העבירה את ארבע
 * האפשרויות לתרגומים עבריים מהרמה, ו-`isEligible` **חדל** לדרוש מסיחים אנגליים ⇒ הצומת
 * סינן על נתון ש⛔ אינו נדרש. **המספר, ⛔ ולא ההערכה:** על 13 קובצי האצווה — 713 שורות,
 * 713 עם תרגום, 713 עם ≥3 מסיחים ⇒ **0 שורות מושפעות היום**. הוא יורד כי ברגע ש-T-153
 * תזמין `distractors_he`, שורה עם תרגום ובלי מסיחים אנגליים הייתה **נעלמת מהזירה בשקט**
 * ו-`describeLevel` היה נועל רמה על נתון שהלומד ⛔ אינו רואה. **סוגר את F-146.**
 */
```

- [ ] **Step 4: run it GREEN, and run the whole route file**

Run: `npx vitest run app/api/arcade/round/route.test.ts`
Expected: **PASS**, all assertions in the file — including
`⛔ הסינון הוא cefr_profile_band ולעולם לא senses.cefr_level` and
`⛔ הנתיב עדיין אינו כותב דבר`, which must ⛔ not have moved.

- [ ] **Step 5: close the rows and commit**

Edit `plan/50-tasks.md` row `T-212`: status cell `⬜` → `🟣 C-0327`. ⛔ **Do not touch the
`אבן דרך` cell** — a dropped `M2 · arena · מבנה` removes the row from the balance table
(`RULES § 0.5ב`). Edit `plan/60-findings.md` row `F-146`: closed by T-212 · C-0327.
Then regenerate and commit **in the same commit** (`RULES § 0.1.1 ח׳`):

```bash
npm run measure:plan
./scripts/g add app/api/arcade/round/route.ts app/api/arcade/round/route.test.ts plan/50-tasks.md plan/60-findings.md docs/plan-tables.md docs/plan-open.md
./scripts/g commit -m "loop(DEV): C-0327 T-212 sense_distractors leaves the arena query - a gate whose reason was deleted"
```

---
## Task 2: T-178 — drag to cast, the gesture-source rule, and the tap path

**The failure scenario the task row says this closes, quoted:** *«בלי כלל מקור המחווה,
גרירה אלכסונית מזיזה את הדמות **וגם** משגרת לחש, והלומד לא מבין מה קרה»* ⇒ the rule is
⛔ not decoration: it is **why** one finger cannot fire two things.

**Files:**
- Create: `lib/core/arenaGesture.ts`
- Create: `lib/core/arenaGesture.test.ts`
- Create: `components/SpellCard.tsx`
- Create: `components/SpellCard.test.ts`
- Modify: `components/ArenaBattle.tsx` — the hand block (:551-573), the enemy block (:487-506)
- Modify: `app/globals.css` — **before** the `/* arena-stage` marker (:157)
- Modify: `app/arcade/page.test.ts`

**Interfaces:**
- Consumes: `SWIPE_EDGE_PX` · `SWIPE_MAX_ANGLE_DEG` · `SWIPE_FEEDBACK_MAX_MS` from
  `lib/core/swipeGrade.ts`; `cast` and `BattleState` from `lib/core/battle.ts`.
- Produces: `resolveGesture` · `cardLift` · `GESTURE_THRESHOLD_PX` · `CARD_LIFT_MAX_PX` ·
  `GestureSource` · `ArenaGesture` · `CardLift` (signatures in **Interfaces** above), and
  `<SpellCard>`. **Task 3 consumes `resolveGesture` with `source: 'stage'`.**

- [ ] **Step 1: write the failing test for the gesture-source rule**

Create `lib/core/arenaGesture.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { GESTURE_THRESHOLD_PX, cardLift, resolveGesture, type GestureInput } from './arenaGesture';

const VW = 375;
const base = { startX: 180, startY: 600, viewportWidth: VW };

describe('37 § 5 — כלל מקור המחווה: קלף = התקפה, מעלה בלבד', () => {
  it('גרירה מעלה מעל הסף על קלף ⇒ הטלה', () => {
    expect(resolveGesture({ ...base, source: 'card', endX: 180, endY: 600 - GESTURE_THRESHOLD_PX }))
      .toEqual({ kind: 'cast' });
  });

  it('⛔ פיקסל אחד מתחת לסף ⛔ אינו הטלה — הגבול נבדק, ⛔ לא מונח', () => {
    expect(resolveGesture({ ...base, source: 'card', endX: 180, endY: 600 - (GESTURE_THRESHOLD_PX - 1) }))
      .toBeNull();
  });

  it('⛔ גרירה מטה על קלף ⛔ אינה דבר — «מעלה בלבד»', () => {
    expect(resolveGesture({ ...base, source: 'card', endX: 180, endY: 600 + 200 })).toBeNull();
  });

  it('⛔ גרירה לצדדים על קלף ⛔ אינה מזיזה את הדמות — זהו בדיוק תרחיש הכשל של T-178', () => {
    expect(resolveGesture({ ...base, source: 'card', endX: 180 + 200, endY: 600 })).toBeNull();
  });

  it('⛔ אלכסון מעבר ל-30° ⛔ אינו הטלה, ובדיוק 30° כן', () => {
    // 30° מהאנך: dx = dy * tan(30°) ≈ 80 * 0.5774 = 46.19
    expect(resolveGesture({ ...base, source: 'card', endX: 180 + 46, endY: 600 - 80 }))
      .toEqual({ kind: 'cast' });
    expect(resolveGesture({ ...base, source: 'card', endX: 180 + 60, endY: 600 - 80 })).toBeNull();
  });
});

describe('37 § 5 — מחווה על הזירה = תזוזה, לצדדים בלבד', () => {
  it('החלקה לצד מעל הסף ⇒ תזוזה, והסימן נישא ו⛔ אינו מפורש', () => {
    expect(resolveGesture({ ...base, source: 'stage', endX: 180 + GESTURE_THRESHOLD_PX, endY: 600 }))
      .toEqual({ kind: 'move', dx: GESTURE_THRESHOLD_PX });
    expect(resolveGesture({ ...base, source: 'stage', endX: 180 - GESTURE_THRESHOLD_PX, endY: 600 }))
      .toEqual({ kind: 'move', dx: -GESTURE_THRESHOLD_PX });
  });

  it('⛔ גרירה מעלה על הזירה ⛔ אינה מטילה לחש — הכיוון ההפוך של אותו כלל', () => {
    expect(resolveGesture({ ...base, source: 'stage', endX: 180, endY: 600 - 200 })).toBeNull();
  });

  it('⛔ מחווה שמתחילה ברצועת הקצה נדחית — D-042ⓐ, ⛔ אותו מספר ⛔ ולא עותק שני', () => {
    expect(resolveGesture({ ...base, source: 'stage', startX: 8, endX: 8 + 200, endY: 600 })).toBeNull();
    expect(resolveGesture({ ...base, source: 'stage', startX: VW - 8, endX: VW - 208, endY: 600 })).toBeNull();
  });
});

describe('⛔ מספר שאינו סופי ⛔ אינו «אפס» ו⛔ אינו «הרבה»', () => {
  // ⛔ טלאי מוקלד ⛔ ולא מפתח מחושב: `{ [key]: NaN }` על מחרוזת מייצר index signature
  // ש-`GestureInput` ⛔ אינו מקבל, ו-`tsc` היה נופל על הבדיקה עצמה.
  it.each<Partial<GestureInput>>([
    { startX: Number.NaN }, { startY: Number.NaN }, { endX: Number.NaN },
    { endY: Number.NaN }, { viewportWidth: Number.NaN },
  ])('⛔ %o ⇒ null', (patch) => {
    expect(resolveGesture({ ...base, source: 'card', endX: 180, endY: 520, ...patch })).toBeNull();
  });
});

describe('cardLift — ההרמה, ⛔ ולא ההכרעה', () => {
  it('מעקב 1:1 כלפי מעלה, ⛔ בלי transition בזמן הגרירה', () => {
    expect(cardLift({ startY: 600, currentY: 570, reducedMotion: false }))
      .toEqual({ y: -30, lift: 0.5, settleMs: 0 });
  });

  it('⛔ אינו יורד מתחת לאפס — «מעלה בלבד» חל גם על הציור', () => {
    expect(cardLift({ startY: 600, currentY: 640, reducedMotion: false }).y).toBe(0);
  });

  it('⛔ נעצר בסף — הרמה ⛔ אינה גדלה בלי גבול', () => {
    expect(cardLift({ startY: 600, currentY: 400, reducedMotion: false }).lift).toBe(1);
  });

  it('⛔ prefers-reduced-motion ⇒ אפס תנועה, ⛔ ולא מספר קטן יותר (שכבה א׳ א7)', () => {
    expect(cardLift({ startY: 600, currentY: 500, reducedMotion: true }))
      .toEqual({ y: 0, lift: 0, settleMs: 0 });
  });
});
```

- [ ] **Step 2: run it and measure it RED**

Run: `npx vitest run lib/core/arenaGesture.test.ts`
Expected: **FAIL** — `Failed to resolve import "./arenaGesture"`.

- [ ] **Step 3: write `lib/core/arenaGesture.ts`**

```ts
/**
 * T-178 · `37-arena-spec § 5` — **כלל מקור המחווה.** PURE: ⛔ אפס React, DOM, שעון, env.
 *
 * ⛔ **המודול עונה על שאלה אחת — «איזו מחווה זו הייתה» — ו⛔ לעולם לא על «מה היא עושה».**
 * ההשלכה חיה ב-`lib/core/battle.ts`, במקום שבו השעון כבר חי. ⛔ שני מודולים שמכריעים
 * מה קורה בקרב הם בדיוק אותה סטייה, בשני מקומות.
 *
 * ⚠️ **למה הכלל הוא קוד ו⛔ לא הערה:** שורת T-178 מנסחת את תרחיש הכשל שהוא סוגר —
 * «בלי כלל מקור המחווה, גרירה אלכסונית מזיזה את הדמות **וגם** משגרת לחש, והלומד לא
 * מבין מה קרה». ⇒ **ענף אחד, ⛔ ולא שניים:** מחווה שהתחילה על קלף ⛔ אינה יכולה להזיז
 * דמות, ומחווה שהתחילה על הזירה ⛔ אינה יכולה להטיל.
 *
 * ⚠️ **שלושת המספרים המיובאים ⛔ אינם מועתקים** מ-`swipeGrade.ts`: הקובץ ההוא כותב
 * במפורש שהם **נמדדו** (רצועת ה-back-swipe של iOS · הסף שמפריד מחווה מגלילה מעט
 * אלכסונית) ⛔ ולא נבחרו. עותק שני שלהם הוא מספר שיסטה.
 */
import { SWIPE_EDGE_PX, SWIPE_MAX_ANGLE_DEG } from './swipeGrade';

export type GestureSource = 'card' | 'stage';

/**
 * `37 § 5` — «סף **60px** כלפי מעלה». ⚠️ `§ 6` ⛔ אינו נותן מספר לגלגול הצדדי, ולכן
 * הזירה נושאת **מרחק אחד** ⛔ ולא שניים: מספר שני שהומצא כאן הוא כלל שני לתחזק.
 * ⛔ החלטה הפיכה (`RULES § 0.16`) — קומיט אחד מפריד אותם אם המדידה תדרוש.
 */
export const GESTURE_THRESHOLD_PX = 60;

/** `spell_card` ברנדר: `py = (y - pad - lift*14)` ⇒ הקלף עולה **14px** בהרמה מלאה. */
export const CARD_LIFT_MAX_PX = 14;

export interface GestureInput {
  readonly source: GestureSource;
  readonly startX: number;
  readonly startY: number;
  readonly endX: number;
  readonly endY: number;
  readonly viewportWidth: number;
}

export type ArenaGesture =
  | { readonly kind: 'cast' }
  | { readonly kind: 'move'; readonly dx: number }
  | null;

const MAX_ANGLE_RAD = (SWIPE_MAX_ANGLE_DEG * Math.PI) / 180;

export function resolveGesture(input: GestureInput): ArenaGesture {
  const { source, startX, startY, endX, endY, viewportWidth } = input;

  // ⛔ אותו נימוק של `resolveSwipe`: מספר שאינו סופי מחזיר false בשקט בכל השוואה,
  // וההשתקה הזאת היא בדיוק איך שמחווה מומצאת נכנסת.
  for (const value of [startX, startY, endX, endY, viewportWidth]) {
    if (!Number.isFinite(value)) return null;
  }

  const dx = endX - startX;
  const dy = endY - startY;

  if (source === 'card') {
    // «מעלה בלבד» — ⛔ ולא «אנכית»: מטה הוא ⛔ לא מחווה איטית, הוא מחווה אחרת.
    if (dy >= 0) return null;
    if (Math.abs(dy) < GESTURE_THRESHOLD_PX) return null;
    // הסטייה נמדדת **מהאנך** כאן, ⛔ ולא מהאופק: זהו הציר שהמחווה נעה עליו.
    if (Math.atan2(Math.abs(dx), Math.abs(dy)) > MAX_ANGLE_RAD) return null;
    return { kind: 'cast' };
  }

  // D-042ⓐ — רצועת הקצה, על נקודת ההתחלה בלבד: החלקה שמסתיימת בקצה היא מחווה תקינה
  // שחצתה את המסך, וזו שהדפדפן חוטף היא זו שמתחילה שם.
  if (startX <= SWIPE_EDGE_PX) return null;
  if (startX >= viewportWidth - SWIPE_EDGE_PX) return null;
  if (Math.abs(dx) < GESTURE_THRESHOLD_PX) return null;
  if (Math.atan2(Math.abs(dy), Math.abs(dx)) > MAX_ANGLE_RAD) return null;
  // ⛔ הסימן **נישא** ו⛔ אינו מפורש: `§ 5` אומר «לצדדים», ו-`§ 6` אומר «לצד» —
  // ⛔ אף אחד מהם ⛔ אינו מייחד ימין או שמאל, ופירוש שהומצא כאן הוא מכניקה מומצאת.
  return { kind: 'move', dx };
}

export interface CardLift {
  readonly y: number;
  readonly lift: number;
  readonly settleMs: number;
}

/**
 * ⚠️ **תקרת שמונת הפיקסלים של חוקה § 5 ⛔ אינה חלה כאן, מאותו נימוק בדיוק שנרשם
 * ב-`swipeGrade.dragOffset`:** § 5 חלה על **השחרור** — אנימציה שהמוצר מנגן. גרירה היא
 * **מניפולציה ישירה**: היא האצבע. ⇒ `settleMs: 0` בזמן הגרירה, וההשתקעות שייכת לשחרור.
 */
export function cardLift(input: {
  readonly startY: number;
  readonly currentY: number;
  readonly reducedMotion: boolean;
}): CardLift {
  // ⛔ ההעדפה נבדקת **ראשונה** ומחזירה אפס תנועה, ⛔ ולא מספר קטן יותר: שכבה א׳ א7
  // דורשת שהתנועה **תיפסק**. המחווה עצמה עדיין מוכרעת ב-`resolveGesture`, ⇒ לומד
  // שכיבה תנועה עדיין מטיל בגרירה.
  if (input.reducedMotion) return { y: 0, lift: 0, settleMs: 0 };
  const delta = input.currentY - input.startY;
  if (!Number.isFinite(delta)) return { y: 0, lift: 0, settleMs: 0 };
  if (delta >= 0) return { y: 0, lift: 0, settleMs: 0 };
  const travel = Math.min(Math.abs(delta), GESTURE_THRESHOLD_PX);
  return { y: -travel, lift: travel / GESTURE_THRESHOLD_PX, settleMs: 0 };
}
```

- [ ] **Step 4: run it GREEN and prove purity**

```bash
npx vitest run lib/core/arenaGesture.test.ts
npm run check:core
```
Expected: **PASS**, and `check:core` green — `lib/core/arenaGesture.ts` names ⛔ no DOM.

- [ ] **Step 5: commit the pure layer alone**

```bash
./scripts/g add lib/core/arenaGesture.ts lib/core/arenaGesture.test.ts
./scripts/g commit -m "loop(DEV): C-0327 T-178a the gesture-source rule - one finger cannot fire two things"
```

- [ ] **Step 6: write the failing source scan for the card**

Create `components/SpellCard.test.ts` (source scan — ⛔ no jsdom, the template is
`app/arcade/page.test.ts:1-22`):

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const withoutComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
const SRC = readFileSync('components/SpellCard.tsx', 'utf8');
const CODE = withoutComments(SRC);

describe('T-178 · 37 § 5 — הקלף מצייר ו⛔ אינו מחשב', () => {
  it('⛔ אין כאן חוק: הקלף ⛔ אינו יודע מהי תשובה נכונה', () => {
    for (const token of ['translationHe', 'correct', 'cast(', 'battle']) {
      expect(CODE).not.toContain(token);
    }
  });

  it('ההכרעה מגיעה מ-`arenaGesture`, ⛔ ולא מספר בתוך מטפל אירועים', () => {
    expect(CODE).toContain("from '@/lib/core/arenaGesture'");
    expect(CODE).toMatch(/resolveGesture|cardLift/);
    // ⛔ 60 ⛔ אינו נכתב כאן: קבוע שקבור ב-`onPointerUp` נבדק רק בדפדפן.
    expect(CODE).not.toMatch(/\b60\b/);
  });

  it('⛔ אין שעון ברכיב — ההשתקעות היא CSS, ⛔ ולא JS', () => {
    for (const token of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'Date.now']) {
      expect(CODE).not.toContain(token);
    }
  });
});

describe('שכבה א׳ — הבחירה ⛔ אינה מקודדת בצבע בלבד', () => {
  it('`aria-pressed` נושא את מצב הבחירה', () => {
    expect(CODE).toContain('aria-pressed');
  });

  it('יעד המגע הוא לפחות 44px, בטוקן ⛔ ולא במספר', () => {
    expect(CODE).toContain('min-h-touch');
  });

  it('⛔ קלף `?` נושא את התווית העברית **וגם** את הסימן (א2)', () => {
    expect(SRC).toContain('לחש לא מזוהה');
  });
});

describe('אינווריאנט 37 § 13.5 — ⛔ אין hex בתוך הרכיב', () => {
  it('⛔ אף צבע ⛔ אינו כתוב כאן — הכול טוקן', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('פני הקלף עבריים — ⛔ ולא אנגלית', () => {
  it('⛔ `<EnWord>` ⛔ אינו מופיע: התווית היא תרגום, וה-headword יושב בבאנר', () => {
    expect(CODE).not.toContain('EnWord');
  });
});
```

- [ ] **Step 7: run it and measure it RED**

Run: `npx vitest run components/SpellCard.test.ts`
Expected: **FAIL** — `ENOENT: no such file or directory, open 'components/SpellCard.tsx'`.

- [ ] **Step 8: write `components/SpellCard.tsx`**

⛔ **Take the geometry from the render, ⛔ not from the PNG.** `render_video_B.py`:
`CARD_W, CARD_H2 = 76, 100` · radius `12` (⇒ `rounded-xl`, already in the five-value
scale) · outer border `width=1.8 + lift` in the element colour · an inner hairline
`rr(pad+3, pad+3, W-6, H-6, 9, outline=(255,255,255,28), width=1)` · a diamond marker at
the top centre, half-height 5px, centred at `pad+10` · unknown card: `?` at 30 Black and
«לחש לא מזוהה» at 8.5 Medium · known card: label 14 Bold. ⚠️ **The element colour
(`ELEM_COL`) is T-153 and is out of scope** ⇒ the border is `--arena-gold` when selected
and `--arena-stone` otherwise.

⚠️ **The one layer-A override, with its number:** the render's **76px fixed** card width
does not survive 320px — `4 × 76 + 2 × 16` margins `= 336 > 320`, i.e. **16px of
horizontal scroll**, which layer A forbids outright. ⇒ the width is **fluid**
(`grid-cols-4` on the parent, `w-full` here) and only the **height** takes the render's
100px, as `min-h-[100px]`. Record it in the task row (§ 7).

```tsx
'use client';

import { useRef, useState } from 'react';
import { cardLift, resolveGesture } from '@/lib/core/arenaGesture';

/**
 * T-178 · `37-arena-spec § 5` — **קלף לחש אחד.**
 * 🎯 הרנדר: `docs/design/kol-B-03-battle.png` · `docs/design/render_video_B.py:255-284`
 * (`spell_card`). ⛔ המבנה **וגם הגימור** מחייבים (`36 § 14.4`); שכבה א׳ היא ההחרגה
 * היחידה, והיא מנוצלת **פעם אחת** כאן — הרוחב, ראה למטה.
 *
 * ⛔ **מצייר ו⛔ אינו מחשב.** מהי המחווה — `lib/core/arenaGesture.ts`. מה היא עושה —
 * `lib/core/battle.ts`. הקלף ⛔ אינו יודע מהי תשובה נכונה, ו⛔ אינו נוגע בקרב.
 *
 * ⚠️ **שני מסלולים, ו-`§ 5` קורא לאחד מהם «נוסף» ⛔ ולא «במקום»:**
 *   • **גרירה** מעלה מעל הסף ⇒ `onCast`.
 *   • **הקשה** ⇒ `onSelect` בלבד — הירי הוא הקשה על היריב (`§ 5`, מסלול הנגישות).
 * ⇒ ⚠️ **הקשה בודדת על קלף ⛔ אינה מטילה עוד**, וזה שינוי מדוד מול פרוסה A. הגילוי
 * שהמפרט נותן הוא **יד הרפאים בקרב הראשון בלבד** (`§ 5`), והיא נבנית ב-`ArenaBattle`.
 */
export interface SpellCardProps {
  readonly label: string;
  readonly unknown: boolean;
  readonly selected: boolean;
  readonly reducedMotion: boolean;
  readonly onSelect: () => void;
  readonly onCast: () => void;
}

const UNKNOWN_SPELL_HE = 'לחש לא מזוהה';

export default function SpellCard({
  label, unknown, selected, reducedMotion, onSelect, onCast,
}: SpellCardProps): React.JSX.Element {
  // ⛔ ref ו⛔ לא state: נקודת ההתחלה ⛔ אינה משנה פיקסל על המסך. אותו נימוק בדיוק
  // שנרשם ב-`components/Flashcard.tsx:55-61`.
  const from = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState({ y: 0, lift: 0 });

  return (
    <button
      type="button"
      data-arena-card
      aria-pressed={selected}
      // ⛔ `touch-action: pan-y` — האצבע עדיין גוללת את המסך אנכית, והגרירה שלנו היא
      // ⛔ לא חטיפה של הגלילה. הכיוון שלנו הוא מעלה, ולכן הדפדפן והמחווה חולקים ציר;
      // ⚠️ **הגלילה נבדקת בהליכה החיה** (§ 6) ⛔ ולא מונחת.
      style={{ transform: `translateY(${drag.y}px)`, touchAction: 'pan-y' }}
      data-arena-lift={drag.lift >= 1 ? 'ready' : drag.lift > 0 ? 'dragging' : 'rest'}
      className={[
        // ⛔ `min-h-touch` **וגם** `h-[100px]`, ⛔ ולא שני `min-h-*`: שני מחלקות
        // מאותה תכונה נחתכות לפי סדר ה-CSS ⛔ ולא לפי כוונה. ה-100px הוא הרנדר,
        // ורצפת 44px של שכבה א׳ היא זו ששורדת אם הרנדר יקטן אי-פעם.
        'flex min-h-touch h-[100px] w-full flex-col items-center justify-center gap-1',
        'rounded-xl border-2 px-1 py-4 text-sm font-bold text-ink active:opacity-90',
        'bg-[color:var(--arena-stone-dark)]',
        selected
          ? 'border-[color:var(--arena-gold)]'
          : 'border-[color:var(--arena-stone)]',
      ].join(' ')}
      onPointerDown={(e) => {
        from.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (from.current === null) return;
        const lift = cardLift({ startY: from.current.y, currentY: e.clientY, reducedMotion });
        setDrag({ y: lift.y, lift: lift.lift });
      }}
      onPointerUp={(e) => {
        const start = from.current;
        from.current = null;
        setDrag({ y: 0, lift: 0 });
        if (start === null) return;
        const gesture = resolveGesture({
          source: 'card',
          startX: start.x, startY: start.y,
          endX: e.clientX, endY: e.clientY,
          viewportWidth: window.innerWidth,
        });
        // ⛔ הכרעה אחת: גרירה מוכרת ⇒ הטלה; כל השאר ⇒ הקשה, כלומר **בחירה**.
        if (gesture?.kind === 'cast') onCast();
        else onSelect();
      }}
      onPointerCancel={() => { from.current = null; setDrag({ y: 0, lift: 0 }); }}
    >
      <span>{unknown ? '?' : label}</span>
      {/* ⛔ סימן לבדו הוא קידוד בערוץ אחד ומפר את שכבה א׳ א2 — התווית ⛔ אינה אופציונלית. */}
      {unknown && <span className="text-xs font-normal text-ink-muted">{UNKNOWN_SPELL_HE}</span>}
      {/* ⛔ הבחירה ⛔ אינה צבע בלבד (א2): `aria-pressed` למקריא־מסך, והשורה הזאת לעין. */}
      {selected && <span className="text-xs font-normal text-[color:var(--arena-gold-light)]">נבחר</span>}
    </button>
  );
}
```

- [ ] **Step 9: add the release settle to `app/globals.css`, BEFORE the arena-stage marker**

⚠️ Insert **above** the `/* ⚠️ **המיקום כאן הוא חוק…` comment at :151 — a block appended
at the bottom of the file is measured as a stage rule by `ArenaStage.test.ts`.

```css
/* T-178 · 37 § 5 — **השחרור** של קלף הלחש. ⛔ הגרירה עצמה היא מניפולציה ישירה ו⛔ אין
   לה transition (ההיסט מגיע מ-`cardLift`, ⛔ ולא מכאן); מה שמושתק כאן הוא החזרה למקום.
   חוקה § 5: 150–300ms, easing אחד. `prefers-reduced-motion` (:103) מאפס את המשך. */
[data-arena-card] {
  transition: transform 200ms ease-out;
}
[data-arena-card][data-arena-lift='dragging'] {
  transition: none;
}
/* חוקה שכבה ב3 — הזוהר היחיד שהמסך הזה מוציא, והוא על טוקן הזירה ⛔ ולא על טקסט גוף. */
[data-arena-card][data-arena-lift='ready'] {
  box-shadow: 0 0 12px 0 color-mix(in srgb, var(--arena-gold) 55%, transparent);
}
```

- [ ] **Step 10: wire the hand and the fire target in `components/ArenaBattle.tsx`**

Replace the hand block (:551-573). ⚠️ **Read the preference after mount** — the template
is `components/Flashcard.tsx:65-77`, copy it verbatim into this component:

```tsx
  const [selected, setSelected] = useState<string | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const fire = useCallback((option: string) => {
    setSelected(null);
    setChosenSoFar((prev) => [...prev, option]);
    setBattle((prev) => (prev === null ? prev : cast(prev, option, elapsedMs)));
  }, [elapsedMs]);
```

```tsx
      <ul data-arena-hand className="grid grid-cols-4 gap-2">
        {hand.map((option) => (
          <li key={option}>
            <SpellCard
              label={option}
              unknown={option === '?'}
              selected={selected === option}
              reducedMotion={reducedMotion}
              onSelect={() => setSelected((prev) => (prev === option ? null : option))}
              onCast={() => fire(option)}
            />
          </li>
        ))}
      </ul>
```

And the enemy block (:487-506) gains the **accessibility fire target** — `§ 5`: «הקשה
בוחרת, **הקשה על היריב משגרת**». The HP bar and its `role="img"` stay exactly as they
are; they move **inside** a button:

```tsx
        <button
          type="button"
          data-arena-fire
          disabled={selected === null}
          onClick={() => { if (selected !== null) fire(selected); }}
          className="min-h-touch w-full rounded-lg text-start disabled:opacity-60"
        >
          <span className="sr-only">{selected === null ? FIRE_HINT_HE : `${FIRE_HE} ${selected}`}</span>
          {/* the existing role="img" HP bar, unchanged */}
        </button>
```

with, beside the other Hebrew constants (:120-140):

```tsx
/**
 * `37 § 5` — מסלול הנגישות. ⛔ נוסח ממשק ש⛔ אינו תוכן לימודי ⇒ הכרעת DEV
 * (`RULES § 0.16`), ונרשמה בסיכום הטיק.
 */
const FIRE_HE = 'שגר לחש';
const FIRE_HINT_HE = 'בחר קלף לחש כדי לשגר';
```

- [ ] **Step 11: the ghost hand — the first battle only (`§ 5`)**

`§ 5`: «**גילוי:** בקרב הראשון בלבד יד רפאים שמדגימה את הגרירה». ⛔ Device memory, ⛔ not
learning progress — the pattern is `components/WorldRing.tsx:428-436` and
`components/InstallPrompt.tsx:20-30`: `try/catch` around `localStorage` in the
**component**, ⛔ never in `lib/core` (`check:core` forbids DOM there).

In `components/ArenaBattle.tsx`:

```tsx
/** ⛔ זיכרון מכשיר, ⛔ ולא התקדמות למידה — ⛔ אינו נקודות, ⛔ אינו רצף, ⛔ אינו נוגע ב-`word_progress`. */
export const ARENA_TAUGHT_KEY = 'kol.arena.dragTaught';
const DRAG_HINT_HE = 'גרור קלף כלפי מעלה כדי להטיל · או הקש על קלף ואז על היריב';
```

```tsx
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    // ⛔ `try/catch`: דפדפן שחוסם אחסון ⛔ אינו מפיל את הזירה — הרמז פשוט ⛔ אינו נשמר.
    try { setShowHint(window.localStorage.getItem(ARENA_TAUGHT_KEY) !== '1'); }
    catch { setShowHint(false); }
  }, []);
```

and inside `fire`, once, after the first cast:

```tsx
    setShowHint(false);
    try { window.localStorage.setItem(ARENA_TAUGHT_KEY, '1'); } catch { /* ⛔ אחסון חסום ⛔ אינו שגיאה */ }
```

rendered **above the hand**, ⛔ never over it (Mayer coherence, T-041 — the hand area
must not move):

```tsx
      {showHint && (
        <p data-arena-hint className="text-center text-xs text-ink-muted">{DRAG_HINT_HE}</p>
      )}
```

- [ ] **Step 12: extend `app/arcade/page.test.ts` with the screen guards**

```ts
describe('T-178 · 37 § 5 — שני המסלולים, וההכרעה ⛔ אינה ברכיב', () => {
  it('היד מורכבת מ-`<SpellCard>`, ⛔ ולא מכפתור מקומי', () => {
    expect(CODE).toContain('<SpellCard');
    expect(CODE).toContain("from '@/components/SpellCard'");
  });

  it('⛔ מסלול הנגישות קיים: יעד ירי על היריב', () => {
    expect(CODE).toContain('data-arena-fire');
  });

  it('⛔ הרמז נשמר במכשיר ⛔ ולא בשרת — ⛔ אפס כתיבה ללמידה', () => {
    expect(CODE).toContain('kol.arena.dragTaught');
    for (const token of ['word_progress', 'easiness', 'interval_days', 'next_review_at']) {
      expect(CODE).not.toContain(token);
    }
  });

  it('⛔ ההעדפה נקראת אחרי ההרכבה, ⛔ ולא ברינדור (אזהרת hydration)', () => {
    expect(CODE).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
  });
});
```

- [ ] **Step 13: run the arena tests, then the full gate**

```bash
npx vitest run components/SpellCard.test.ts app/arcade/page.test.ts lib/core/arenaGesture.test.ts
npm run typecheck && npm run check:core
```
Expected: **PASS** on all three files; `tsc` clean with ⛔ no `any`.

- [ ] **Step 14: close the row and commit**

`plan/50-tasks.md` row `T-178`: `⬜` → `🟣 C-0327`, ⛔ **milestone cell untouched**.

```bash
npm run measure:plan
./scripts/g add lib/core/arenaGesture.ts lib/core/arenaGesture.test.ts components/SpellCard.tsx components/SpellCard.test.ts components/ArenaBattle.tsx app/globals.css app/arcade/page.test.ts plan/50-tasks.md docs/plan-tables.md docs/plan-open.md
./scripts/g commit -m "loop(DEV): C-0327 T-178 drag to cast - and the tap path the spec calls additional, not instead"
```

---
## Task 3: T-179 — the dodge window

**The spec's table, quoted whole, because every row is a measurable number:**

| שלב | תזמון | מה קורה |
|---|---|---|
| טעינה | 0 עד 5.3 ש׳ | מד מעל ראש היריב מתמלא |
| הכרזה | 5.3 ש׳ | ידיים מורמות, גוון סגול, המד מהבהב |
| חלון | 5.3 עד 5.7 ש׳ | החלקה לצד = גלגול עם חסינות |
| פגיעה | 6.0 ש׳ | לא התחמקת — נזק, הרצף מתאפס |

**⚠️ The one reconciliation, and it is arithmetic ⛔ not invention:** `§ 3` puts the
enemy's swings **8.0 s apart, at an independent rhythm**, and `§ 6` says the telegraph
**ends in a hit at 6.0 s**. Both hold at once in exactly one arrangement: the telegraph
for swing *n* runs `[n·8000 − 6000, n·8000)`, i.e. the charge starts **2.0 s after the
previous swing**. `tick()` already lands swing *n* at `n · ENEMY_SWING_MS`; ⛔ nothing
about the existing clock changes. **A `RULES § 0.16` call** — one commit reverses the
anchor — and it is logged in the tick summary.

**Files:**
- Modify: `lib/core/battle.ts` (`BattleState` · `startBattle` · `tick`, and three new exports)
- Modify: `lib/core/battle.test.ts`
- Modify: `components/ArenaBattle.tsx` — the enemy block (the meter) and the stage block (:508-511)
- Modify: `app/arcade/arcade-tokens.css`
- Modify: `app/globals.css` — **before** the `/* arena-stage` marker
- Modify: `app/arcade/page.test.ts`

**Interfaces:**
- Consumes: `resolveGesture` from Task 2, with `source: 'stage'`; `ENEMY_SWING_MS` and
  `BattleState` already in `battle.ts`.
- Produces: `TELEGRAPH_MS` · `ANNOUNCE_AT_MS` · `WINDOW_END_MS` · `TelegraphPhase` ·
  `Telegraph` · `telegraphAt` · `dodge`, and `BattleState.dodgedSwing` (signatures in
  **Interfaces** above). **T-180 will read `dodgedSwing` for the results screen.**

- [ ] **Step 1: write the failing telegraph test**

Append to `lib/core/battle.test.ts`. ⚠️ **Merge these six names into the file's
**existing** `from './battle'` import at the top — ⛔ a second `import` statement for the
same module re-declares `startBattle`/`tick`/`cast`/`outcomeAt` and is a **SyntaxError**,
⛔ not a lint nit:

```ts
// ⇒ into the EXISTING import at the top of the file:
//   ANNOUNCE_AT_MS, ENEMY_SWING_MS, TELEGRAPH_MS, WINDOW_END_MS, dodge, telegraphAt

describe('37 § 6 — הטלגרף: 6 שניות שנגמרות במכה, בקצב של § 3', () => {
  it('⛔ שקט עד 2.0 ש׳ — המכה הראשונה ב-8.0 ש׳, והטעינה מתחילה 6.0 לפניה', () => {
    expect(telegraphAt(0)).toEqual({ phase: 'quiet', frac: 0, swingIndex: 1 });
    expect(telegraphAt(1_999).phase).toBe('quiet');
  });

  it('טעינה מ-2.0 ש׳, והמד מתמלא לינארית עד 5.3 ש׳ לתוך הטלגרף', () => {
    expect(telegraphAt(2_000)).toEqual({ phase: 'charging', frac: 0, swingIndex: 1 });
    const half = telegraphAt(2_000 + ANNOUNCE_AT_MS / 2);
    expect(half.phase).toBe('charging');
    expect(half.frac).toBeCloseTo(0.5, 5);
  });

  it('הכרזה בדיוק ב-5.3 ש׳ לתוך הטלגרף — והחלון פתוח עד 5.7', () => {
    expect(telegraphAt(2_000 + ANNOUNCE_AT_MS)).toEqual({ phase: 'window', frac: 1, swingIndex: 1 });
    expect(telegraphAt(2_000 + WINDOW_END_MS - 1).phase).toBe('window');
  });

  it('⛔ ב-5.7 החלון נסגר, ועד 6.0 המכה כבר בלתי-נמנעת', () => {
    expect(telegraphAt(2_000 + WINDOW_END_MS).phase).toBe('committed');
    expect(telegraphAt(2_000 + TELEGRAPH_MS - 1).phase).toBe('committed');
  });

  it('המכה השנייה נושאת `swingIndex: 2`, ⛔ והטלגרף שלה מתחיל 6.0 לפני 16.0 ש׳', () => {
    expect(telegraphAt(2 * ENEMY_SWING_MS - TELEGRAPH_MS).swingIndex).toBe(2);
    expect(telegraphAt(2 * ENEMY_SWING_MS - TELEGRAPH_MS).phase).toBe('charging');
  });

  it('⛔ זמן שלילי ⛔ אינו מצב — הוא שקט, ⛔ ולא חלון פתוח', () => {
    expect(telegraphAt(-1).phase).toBe('quiet');
  });
});

describe('37 § 6 — הגלגול: חסינות למכה **המוכרזת**, ⛔ ולא «פחות נזק»', () => {
  const words = [{ wordId: 'w1', headword: 'ONE', translationHe: 'אחת', kind: 'base' as const }];

  it('⛔ החלקה מחוץ לחלון ⛔ אינה עושה דבר — ⛔ ואינה עולה חיים', () => {
    const s = startBattle(words, 12, 20);
    expect(dodge(s, 3_000)).toEqual(s);
    expect(dodge(s, 2_000 + WINDOW_END_MS)).toEqual(s);
  });

  it('החלקה בתוך החלון מסמנת את המכה, והמכה נוחתת ב⛔ אפס נזק', () => {
    const s = dodge(startBattle(words, 12, 20), 2_000 + ANNOUNCE_AT_MS);
    expect(s.dodgedSwing).toBe(1);
    expect(tick(s, ENEMY_SWING_MS).learnerHp).toBe(12);
  });

  it('⛔ בלי גלגול — המכה פוגעת, וזו ההוכחה שהבדיקה מודדת את הגלגול ⛔ ולא כלום', () => {
    expect(tick(startBattle(words, 12, 20), ENEMY_SWING_MS).learnerHp).toBe(11);
  });

  it('⛔ הגלגול מבטל את המכה **כולה**, כולל עונש התשובה השגויה שהיה תלוי בה', () => {
    const wrong = cast(startBattle(words, 12, 20), 'לא נכון', 500);
    expect(wrong.pendingPenalty).toBe(1);
    const rolled = dodge(wrong, 2_000 + ANNOUNCE_AT_MS);
    const after = tick(rolled, ENEMY_SWING_MS);
    expect(after.learnerHp).toBe(12);
    expect(after.pendingPenalty).toBe(0);
    expect(after.dodgedSwing).toBeNull();
  });

  it('⛔ החסינות שייכת למכה אחת: אם שתי מכות התאחדו בפריים, השנייה עדיין פוגעת', () => {
    const s = dodge(startBattle(words, 12, 20), 2_000 + ANNOUNCE_AT_MS);
    expect(tick(s, 2 * ENEMY_SWING_MS).learnerHp).toBe(11);
  });

  it('⛔ הגלגול ⛔ אינו עוצר את השעון — `outcomeAt` על אותו זמן ⛔ אינו משתנה', () => {
    const s = startBattle(words, 12, 20);
    expect(outcomeAt(dodge(s, 2_000 + ANNOUNCE_AT_MS), 50_000)).toBe(outcomeAt(s, 50_000));
  });
});
```

- [ ] **Step 2: run it and measure it RED**

Run: `npx vitest run lib/core/battle.test.ts`
Expected: **FAIL** — `telegraphAt is not a function` (and `dodge is not a function`).

- [ ] **Step 3: add the telegraph and the roll to `lib/core/battle.ts`**

```ts
/**
 * `37 § 6` — **הטלגרף.** ⚠️ **המספרים הם של המפרט, וההעגנה היא חשבון ⛔ ולא המצאה:**
 * `§ 6` קובע שהוא **6.0 שניות שנגמרות במכה**, ו-`§ 3` קובע שהמכות **8.0 שניות זו מזו**.
 * שתיהן מתקיימות בסידור אחד בלבד — הטעינה של מכה `n` מתחילה ב-`n·8000 − 6000`, כלומר
 * **2.0 שניות אחרי המכה הקודמת**. ⛔ `tick` ⛔ לא השתנה: המכות עדיין נוחתות ב-`n·8000`.
 * ⛔ החלטה הפיכה (`RULES § 0.16`), ונרשמה בסיכום הטיק.
 */
export const TELEGRAPH_MS = 6_000;
/** `§ 6` — «הכרזה 5.3 ש׳»: ידיים מורמות, גוון סגול, המד מהבהב. */
export const ANNOUNCE_AT_MS = 5_300;
/** `§ 6` — «חלון 5.3 עד 5.7 ש׳». ⛔ 400ms, וזה כל הרוחב. */
export const WINDOW_END_MS = 5_700;

export type TelegraphPhase = 'quiet' | 'charging' | 'window' | 'committed';

export interface Telegraph {
  readonly phase: TelegraphPhase;
  readonly frac: number;
  readonly swingIndex: number;
}

/**
 * ⛔ **טהורה ביחס לשעון:** `elapsedMs` הוא קלט, ולכן ארבעת הגבולות נבדקים ב-0ms
 * ⛔ ולא ב-90 שניות. אותו נימוק בדיוק שבגללו `battle.ts` ⛔ אינו מכיר `Date.now`.
 */
export function telegraphAt(elapsedMs: number): Telegraph {
  const t = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  const swingIndex = Math.floor(t / ENEMY_SWING_MS) + 1;
  const into = t - (swingIndex * ENEMY_SWING_MS - TELEGRAPH_MS);
  if (into < 0) return { phase: 'quiet', frac: 0, swingIndex };
  if (into < ANNOUNCE_AT_MS) return { phase: 'charging', frac: into / ANNOUNCE_AT_MS, swingIndex };
  if (into < WINDOW_END_MS) return { phase: 'window', frac: 1, swingIndex };
  return { phase: 'committed', frac: 1, swingIndex };
}

/**
 * `§ 6` — «החלקה לצד = **גלגול עם חסינות**». ⛔ מחוץ לחלון היא ⛔ אינה עושה דבר
 * ו⛔ אינה עולה חיים: `§ 6` מחייב אותה ב**טמפו** ⛔ ולא בנזק, ו⛔ אין כאן טמפו למדוד.
 * ⛔ **והיא ⛔ אינה עוצרת את השעון** — `elapsedMs` ⛔ אינו נגזר מהמצב.
 */
export function dodge(state: BattleState, elapsedMs: number): BattleState {
  const telegraph = telegraphAt(elapsedMs);
  if (telegraph.phase !== 'window') return state;
  if (state.dodgedSwing === telegraph.swingIndex) return state;
  return { ...state, dodgedSwing: telegraph.swingIndex };
}
```

`BattleState` gains the field, and `startBattle` seeds it:

```ts
  /** `37 § 6` — המכה שהלומד התגלגל ממנה. ⛔ אחת: החסינות שייכת למכה ש**הוכרזה**. */
  readonly dodgedSwing: number | null;
```
```ts
    dodgedSwing: null,
```

`tick` honours it — ⛔ replace the damage line, ⛔ do not add a second branch:

```ts
export function tick(state: BattleState, elapsedMs: number): BattleState {
  const due = Math.floor(Math.max(0, elapsedMs) / ENEMY_SWING_MS);
  const applied = Math.floor(Math.max(0, state.lastSwingMs) / ENEMY_SWING_MS);
  const swings = due - applied;
  if (swings <= 0) return { ...state, lastSwingMs: Math.max(state.lastSwingMs, elapsedMs) };

  // `§ 6` — ⛔ החסינות מבטלת **מכה אחת מזוהה**, ⛔ ולא «את הנזק»: אם שתי מכות התאחדו
  // בפריים אחד (חלון שנרדם, מכשיר איטי), השנייה עדיין פוגעת. ⛔ «התגלגלתי פעם אחת
  // ולא נפגעתי שלוש» הוא בדיוק סוג החור ש-2,403 בדיקות ירוקות לא תופסות.
  const immune =
    state.dodgedSwing !== null && state.dodgedSwing > applied && state.dodgedSwing <= due;
  const landed = swings - (immune ? 1 : 0);
  // ⛔ המכה שנמנעה לוקחת איתה את העונש שהיה תלוי בה (`§ 5`) — הוא חל על **המכה הבאה**,
  // וזו ⛔ לא הגיעה.
  const damage = landed === 0 ? 0 : landed * SWING_DAMAGE + state.pendingPenalty;
  return {
    ...state,
    learnerHp: state.learnerHp - damage,
    lastSwingMs: elapsedMs,
    pendingPenalty: 0,
    dodgedSwing: immune ? null : state.dodgedSwing,
  };
}
```

- [ ] **Step 4: run it GREEN, and confirm the clock guard still holds**

```bash
npx vitest run lib/core/battle.test.ts
npm run check:core
```
Expected: **PASS**, and `battle.test.ts`'s existing source scan — ⛔ no `Date.now`,
⛔ no `setTimeout`, ⛔ no `requestAnimationFrame` in `lib/core/battle.ts` — still green.
⚠️ **If it went red, `revert` and file it** (STEP 6 of `docs/agents/DEV.md`): that guard
changed meaning under D-126 and ⛔ must not be softened.

- [ ] **Step 5: commit the pure half alone**

```bash
./scripts/g add lib/core/battle.ts lib/core/battle.test.ts
./scripts/g commit -m "loop(DEV): C-0327 T-179a the telegraph - six seconds that end in a swing, measured at 0ms"
```

- [ ] **Step 6: add the three arena tokens**

In `app/arcade/arcade-tokens.css`, inside `[data-arena-scope]` — ⛔ **never** into
`lib/core/palette.ts` or `app/globals.css` (invariant `37 § 13.5`; `app/arcade/page.test.ts`
fails by name on each hex). The values are the render's, converted:
`cast_meter` outline `(180,120,240)` · fill `(196,130,255)` · announce `(255,120,120)` ·
the dodge label `(150,230,255)`.

```css
  /* T-179 · `37 § 6` — מד ההטלה של היריב ותווית ההתחמקות.
     `render_video_B.py:327-338` (`cast_meter`) ו-:575-577. */
  --arena-cast: #c482ff;
  --arena-cast-edge: #b478f0;
  --arena-cast-warn: #ff7878;
  --arena-dodge: #96e6ff;
```

⚠️ Update the `ARENA_HEXES` list in `app/arcade/page.test.ts:25` — it is the **complete**
list by contract, so four new tokens mean four new entries there **and** four more hexes
that must stay out of `palette.ts`:

```ts
const ARENA_HEXES = ['#d4a94a', '#f5d684', '#4a4858', '#34323f', '#1c2642',
                     '#c482ff', '#b478f0', '#ff7878', '#96e6ff'] as const;
```

- [ ] **Step 7: draw the meter above the enemy in `components/ArenaBattle.tsx`**

⛔ Geometry from `render_video_B.py:327-338`: width **70**, height **9**, radius **4.5**
(⇒ `rounded-full` at that height — ⛔ 4.5 is ⛔ not one of the five radii, and
`rounded-full` on a 9px bar is the same shape), 1px outline, the fill inset 1.5 on each
side. The announce label «מטיל!» sits **12px above** the bar at 11.5 Black.

⚠️ **Layer A, and it overrides the render:** the phase is announced by a **word**, ⛔ never
by hue alone (א2), and it is `aria-live="polite"` so the roll is reachable without sight
of the colour change. Under `prefers-reduced-motion` the pulse stops and «מטיל!» **stays**
— exactly what the T-179 row demands («אייקון+תווית»).

Above the enemy HP bar, inside the same `data-arena-enemy` block:

```tsx
      {telegraph.phase !== 'quiet' && (
        <div className="flex flex-col items-center gap-1" data-arena-cast data-arena-cast-phase={telegraph.phase}>
          {telegraph.phase !== 'charging' && (
            <p className="text-xs font-black text-[color:var(--arena-cast-warn)]" role="status" aria-live="polite">
              {CASTING_HE}
            </p>
          )}
          <div
            role="img"
            aria-label={`${CASTING_METER_HE} ${Math.round(telegraph.frac * 100)} אחוז`}
            className="h-[9px] w-[70px] max-w-full overflow-hidden rounded-full border border-[color:var(--arena-cast-edge)] bg-[color:var(--arena-night)]"
          >
            <span
              aria-hidden
              className={`block h-full ${telegraph.phase === 'charging' ? 'bg-[color:var(--arena-cast)]' : 'bg-[color:var(--arena-cast-warn)]'}`}
              style={{ width: `${telegraph.frac * 100}%` }}
            />
          </div>
        </div>
      )}
```

with, beside the other constants, and `telegraph` derived ⛔ in the component ⛔ but ⛔ not
computed there — it comes straight from the pure layer:

```tsx
/** `37 § 6` — הרנדר מצייר «מטיל!» מעל המד (`cast_meter`), וזה גם ערוץ שאינו צבע (שכבה א׳ א2). */
const CASTING_HE = 'מטיל!';
const CASTING_METER_HE = 'היריב מטיל';
const DODGED_HE = 'התחמקות!';
```
```tsx
  const telegraph = useMemo(() => telegraphAt(elapsedMs), [elapsedMs]);
```

- [ ] **Step 8: make the stage dodgeable**

Replace the stage block (:508-511). ⛔ The gesture goes through `resolveGesture` with
`source: 'stage'` — that is the whole point of the source rule: a drag that began on a
card can ⛔ never reach here, and a swipe that began here can ⛔ never cast.

```tsx
      <div
        data-arena-stage-area
        className="rounded-2xl bg-[color:var(--arena-night)] px-4 py-6"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => { stageFrom.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => {
          const start = stageFrom.current;
          stageFrom.current = null;
          if (start === null) return;
          const gesture = resolveGesture({
            source: 'stage',
            startX: start.x, startY: start.y,
            endX: e.clientX, endY: e.clientY,
            viewportWidth: window.innerWidth,
          });
          // ⛔ `move` ⛔ אינו «התחמקות» — `dodge` בליבה מכריע אם הוא נפל בתוך החלון.
          // ⛔ הרכיב ⛔ אינו יודע מהו חלון, ו⛔ אינו סופר 400 מילישניות.
          if (gesture?.kind === 'move') setBattle((prev) => (prev === null ? prev : dodge(prev, elapsedMs)));
        }}
        onPointerCancel={() => { stageFrom.current = null; }}
      >
        <ArenaStage phase={stagePhase(battle)} items={[]} />
        {battle.dodgedSwing !== null && (
          <p className="mt-2 text-center text-sm font-black text-[color:var(--arena-dodge)]" role="status" aria-live="polite">
            {DODGED_HE}
          </p>
        )}
      </div>
```

with `const stageFrom = useRef<{ x: number; y: number } | null>(null);` beside `originRef`.

- [ ] **Step 9: the announce pulse in `app/globals.css`, BEFORE the arena-stage marker**

```css
/* T-179 · 37 § 6 — ההכרזה מהבהבת. ⚠️ **חוקה ב6 מתירה לתזמון הזה לחרוג מתקרת 300ms**
   כי הוא **מפרט מדיד** (חלון 5.3–5.7) ⛔ ולא קישוט. ⛔ `prefers-reduced-motion` (:103)
   מאפס את המשך — והמילה «מטיל!» **נשארת**, כי היא הערוץ שאינו תנועה ואינו צבע. */
@keyframes arena-announce { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
[data-arena-cast-phase='window'] { animation: arena-announce 400ms ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  [data-arena-cast-phase='window'] { animation: none; }
}
```

- [ ] **Step 10: extend `app/arcade/page.test.ts`**

```ts
describe('T-179 · 37 § 6 — חלון ההתחמקות', () => {
  it('המד מגיע מהליבה — ⛔ הרכיב ⛔ אינו סופר 5.3 ואינו סופר 5.7', () => {
    expect(CODE).toContain('telegraphAt(');
    for (const number of ['5300', '5700', '6000', '5.3', '5.7']) {
      expect(CODE).not.toContain(number);
    }
  });

  it('⛔ ההכרזה ⛔ אינה צבע בלבד — המילה על המסך ו-`aria-live` (שכבה א׳ א2)', () => {
    expect(SRC).toContain('מטיל!');
    expect(CODE).toContain('aria-live');
  });

  it('ההחלקה על הבמה עוברת בכלל מקור המחווה', () => {
    expect(CODE).toContain("source: 'stage'");
    expect(CODE).toContain('dodge(');
  });

  it('⛔ אין hex חדש שדלף ל-globals או ל-palette', () => {
    const palette = readFileSync('lib/core/palette.ts', 'utf8');
    const globals = readFileSync('app/globals.css', 'utf8');
    for (const hex of ARENA_HEXES) {
      expect(palette, `${hex} — אינווריאנט 37 § 13.5`).not.toContain(hex);
      expect(globals, `${hex} — אינווריאנט 37 § 13.5`).not.toContain(hex);
    }
  });
});
```

- [ ] **Step 11: run the arena tests and the palette gate**

```bash
npx vitest run lib/core/battle.test.ts app/arcade/page.test.ts components/ArenaStage.test.ts
npm run check:palette && npm run check:core && npm run typecheck
```
Expected: **PASS** — and `ArenaStage.test.ts` specifically, because the two new
`app/globals.css` blocks were inserted **before** the `/* arena-stage` marker; if it went
red, the blocks are in the wrong place (`app/globals.css:151-155`).

- [ ] **Step 12: close the row and commit**

`plan/50-tasks.md` row `T-179`: `⬜` → `🟣 C-0327`, ⛔ **milestone cell untouched**.

```bash
npm run measure:plan
./scripts/g add lib/core/battle.ts lib/core/battle.test.ts components/ArenaBattle.tsx app/arcade/arcade-tokens.css app/globals.css app/arcade/page.test.ts plan/50-tasks.md docs/plan-tables.md docs/plan-open.md
./scripts/g commit -m "loop(DEV): C-0327 T-179 the dodge window - 400ms that the learner can actually see coming"
```

---

## § 6 · The full gate, and the live walk — ⛔ neither is optional

- [ ] **Step 1: run the whole gate, in this message**

```bash
npm run verify
```
Five commands: `typecheck` · `check:core` · `test` · `build` · `check:mobile`.
⛔ **"Should work" · "looks fine" · "passed earlier" are banned.** The real counts go into
the report — slice A closed on `174 · 2,819 · 1,158`, so the numbers here must be **≥**
those, ⛔ and a drop is a finding, ⛔ not a rounding.
Failed? Fix it in this tick. Still failing? `./scripts/g revert` + a debt entry in
`plan/30-architecture.md`. ⛔ Never push broken code.

- [ ] **Step 2: walk the screen you built — MANDATORY, this is a UI tick (D-103)**

⚠️ **On `next start`, ⛔ NOT `next dev`** — F-147ⓔ measured it: `next dev` in the sandbox
returns **403 on the client chunks**, HMR falls over, the page never hydrates, the clock
is frozen and a tap does nothing ⇒ **a `next dev` walk measures a dead screen and reports
"not built" on working code.**

```bash
npm run build && (npx next start -p 3000 &) && sleep 20
```

Drive `http://127.0.0.1:3000/dev/arcade` at **375×780**, and record every number:

| what | how it is measured | ⛔ what fails |
|---|---|---|
| heading · character count | text content of the screen | a drop from slice A's **167** |
| the clock runs | read `[role=timer]` twice, 3 s apart | two identical strings |
| **the cast by drag** | pointer down on a card, move **−70px** in Y, up | the enemy's `N/100` unchanged |
| **the tap path** | tap a card → `aria-pressed="true"`; tap `[data-arena-fire]` | the fire target disabled after a select |
| **the source rule** | pointer down on a **card**, move **+200px in X**, up | anything at all happening |
| **the telegraph** | at ~2 s, `[data-arena-cast]` exists and `frac` grows | the meter absent, or full from frame 1 |
| **the dodge** | swipe the stage **±70px in X** during `[data-arena-cast-phase=window]` | «התחמקות!» absent, or HP still dropping |
| tappable count · under-44px | every `button`/`a`, `getBoundingClientRect()` | ⛔ any target under 44px |
| horizontal scroll | `documentElement.scrollWidth > clientWidth` at **320 · 375 · 414** | ⛔ any of the three |
| console errors | collect for the whole walk | ⛔ any, hydration warnings included |

**Then compare LAYOUT to `docs/design/kol-B-03-battle.png` and `kol-B-06-dodge.png`**, and
grep `docs/design/render_video_B.py` for anything that differs — ⛔ never eyeball the PNG.
Every remaining gap becomes a row in `plan/60-findings.md` **with the number measured**,
exactly as F-147 did. ⛔ «The finish comes from the constitution» is ⛔ not an answer
(`36 § 14.4`, reversed 24/08 by D-114).

- [ ] **Step 3: close the tick**

Update `plan/30-architecture.md` (the new pure module and where the gesture rule lives) ·
`plan/50-tasks.md` (T-178 · T-179 · T-212 ⇒ **🟣**, ⛔ **never ✅** — QA flips those in bulk
off `git log` when the merge carries them, `F-126`) · `plan/60-findings.md` (F-146 closed;
any new walk gap) · `plan/00-control.md` (`CYCLE_ID`, `ACTIVE_TASK_ID`,
`NEXT_AGENT=CRITIC`, release the LOCK, `arena` tick counter) + one journal line.
Anything needed from Roy carries `⟨נבדק: YYYY-MM-DD⟩` in `plan/03-for-roy.md`.

```bash
npm run measure:plan
npm run loop:health
./scripts/g add plan/ docs/plan-tables.md docs/plan-open.md
./scripts/g commit -m "loop(DEV): C-0327 registers - arena slice B delivered, the gestures"
./scripts/g push origin work/current
```
⛔ **`work/current` only.** ⛔ Never `dev` — that is QA's `merge --ff-only`. ⛔ Never `main`.

---

## § 7 · Declared deviations from the render — the two this plan already knows about

⛔ **Recorded here, with the number, ⛔ and not closed by an argument.** `36 § 14.4`: the
render binds layout **and finish**; **layer A is the only carve-out**, and a real tool
limitation is a **finding**, ⛔ not a silent deviation.

| # | The render | What is built | Which rule, and the number |
|---|---|---|---|
| ⓐ | `spell_card`: card **76px wide, fixed** (`CARD_W = 76`), 16px margins | fluid width via `grid-cols-4`; **only the 100px height is taken** (`min-h-[100px]`) | **Layer A overrides.** `4 × 76 + 2 × 16 = 336 > 320` ⇒ **16px of horizontal scroll at 320px**, which layer A forbids outright. ⛔ Not taste — arithmetic. |
| ⓑ | `spell_card`: each card carries an **element colour and a glyph** (`ELEM_COL`: ice/fire/bolt/unknown) | four uniform cards in `--arena-stone`; the `?` card keeps its written label | **Scope, ⛔ not deviation.** The element is a **content field that does not exist** — it is **T-153**, and F-147ⓒ already carries the row. ⛔ Inventing a mapping here would be invented learning content. |

⚠️ **And one interaction change a learner meets on day one, declared ⛔ not buried:**
a single tap on a card **selected** to cast; after T-178 it **selects**, and the enemy
fires. That is `§ 5` verbatim — «הקשה בוחרת, הקשה על היריב משגרת» — and the discovery it
prescribes is the **first-battle ghost hand**, built in Task 2 Step 11. ⇒ if the live walk
shows a learner stuck after one tap, that is a **finding with a number**, ⛔ not a reason
to quietly restore tap-to-cast.

---

## § 8 · Self-check — run it before the first line of code

- [ ] `npm run check:plan docs/superpowers/plans/2026-08-27-arena-slice-b-gestures.md`
      ⇒ if anything is MISSING, paste the row it prints into `plan/26-plan-feedback.md`
      **and ⛔ keep going** — the feedback ⛔ never blocks execution (`RULES § 0.5ג`).
- [ ] Re-read `plan/37-arena-spec.md` § 5 (`sed -n '45,56p' plan/37-arena-spec.md`). Every one of its bullets has a step: the four cards ✅ (Task 2 Step 10) ·
      the 60px upward threshold ✅ (Task 2 Step 3) · damage from response speed ✅
      (already in `cast`, slice A) · the wrong answer's penalty ✅ (already in `tick`) ·
      the accessibility path ✅ (Task 2 Step 10) · the gesture-source rule ✅ (Task 2
      Step 3) · the first-battle ghost hand ✅ (Task 2 Step 11).
- [ ] Re-read `plan/37-arena-spec.md` § 6 (`sed -n '56,66p' plan/37-arena-spec.md`). Every one of its four table rows has a step: charge ✅ · announce ✅ · window ✅ ·
      hit ✅ (Task 3 Steps 3 and 7). ⛔ **«הרצף מתאפס» is the one that does NOT** — ק1
      does not exist in `battle.ts`, and it is declared out of scope above.
- [ ] `grep -c "TODO\|TBD\|handle edge cases" docs/superpowers/plans/2026-08-27-arena-slice-b-gestures.md` ⇒ **exactly 1** — this line, ⛔ and nothing else. Any second hit is a placeholder that must be written out before a line of code.
- [ ] `grep -c` each name across `lib/core/arenaGesture.ts` · `lib/core/battle.ts` · `components/SpellCard.tsx` · `components/ArenaBattle.tsx` and their tests. Names match across tasks: `resolveGesture` · `cardLift` · `GESTURE_THRESHOLD_PX` ·
      `telegraphAt` · `dodge` · `dodgedSwing` · `data-arena-fire` · `data-arena-cast` —
      each spelled identically in its definition, its test and its consumer.
