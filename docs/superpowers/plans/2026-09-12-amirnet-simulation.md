# Plan — amirnet simulation: one chapter with its own clock, then the result screen

**Cycle:** C-0538 (DEV) · **Workstream:** `amirnet` (read-ahead from `msgs`) · **Milestone:** M2
**Rows covered:** `T-296` (this tick) · `T-298` (blocked on `T-296`, built next)
**REQUIRED SUB-SKILL:** ⛔ none — the two steps below touch the same files in sequence, so
`superpowers:subagent-driven-development` does ⛔ not apply (`RULES § 0.5` needs ≥3 independent items).
**SKILL:** `imagegen-frontend-mobile` (the `[SKILL: …]` cell on both rows) — § 13 safe areas ·
§ 14 navigation · § 15 ⛔ no box-in-box · § 29 ⛔ no small text · § 30 typography · § 31 density.

**Goal:** `41 § 8` item 3 — «מנוע סימולציה עם שעון לכל פרק». One core chapter of the amirnet
simulation runs end to end under **its own** countdown, and when it ends the next chapter starts
with **its full** time and ⛔ not a second more (`41 § 2`, both binding time rules). Then `T-298`
reads what that engine already returned and draws the six-chapter result.

**Lineage:** **המשך של: T-287** — the question and its options were built there
(`components/AmirnetQuestion.tsx`, `lib/core/amirnetQuestion.ts`); here they enter a **timed
chapter wrapper**, and ⛔ nothing in those two files is rewritten. `T-298` is **המשך של: T-296**.

## 🎯 The render, and what it binds

`docs/design/kol-D-06-simulation.png` for `T-296`, `docs/design/kol-D-07-result.png` for `T-298`,
both drawn by `docs/design/render_video_D.py` — `screen_sim` (:255-291) and `scene_result` (:311-345).
Every layout value below was **grepped from those functions**, ⛔ not eyeballed from the PNG.

🔴 **`36 § 14.4`: the render is BINDING — layout, order, strings AND finish alike.** «The finish
comes from the constitution» is ⛔ not an answer to a gap. **שכבה A (the accessibility gates) is the
⛔ only carve-out** — contrast, the 44px target, `prefers-reduced-motion`, and state ⛔ never in
colour alone override the render, and each such gap is declared here with the number measured.
⚠️ **The render is dark; the product is light** (`36 § 14.2`, Roy 11/09) ⇒ the background is
⛔ NOT a gap and is ⛔ not listed as one. Every colour is a `palette.ts` product token.

**Declared שכבה A gaps, with the render's own numbers:**
| what | render | built | why |
|---|---|---|---|
| chapter-type line | 11.5px (`:259`) | `text-sm` (14) | `check:text-floor` |
| question counter | 11px (`:270`) | `text-sm` (14) | `check:text-floor` |
| carry-over notice | 10.5px (`:291`) | `text-sm` (14) | `check:text-floor` |
| clock card | 86×40 (`:262`) | `min-h-touch` 44 | 44px floor — it is ⛔ not a target, but the card holds the screen's only number and the floor is cheaper than an exception |
| option row | h=54 r=14 (`:278`) | `min-h-touch` + `rounded-xl` (12) | 44px floor · 14 has ⛔ no name in the five-value scale (`D-102`) |
| question card | r=18 (`:272`) | `rounded-2xl` (16) | 18 has ⛔ no name in the scale |
| chapter dots | r=5 fill only (`:266-269`) | dot **+** `aria-label` per state | state is ⛔ never colour alone |

🔴 **AND ONE THING THAT IS ⛔ NOT A GAP: the countdown is built AS DRAWN.** `lib/core/amirnetQuestion.ts`
carries a declared deviation — the *practice* clock counts UP, because `R-020` forbids time pressure
outside the arena on unknown material. ⛔ **That reasoning ⛔ does not reach here, and both files
already say so in those words.** `41 § 2` makes a per-chapter countdown a **binding rule of the exam
being simulated** (`שעון נפרד לכל פרק` · `אי אפשר להעביר זמן שנותר לפרק הבא`), and `41 § 7` lists
`שעון הפרק` among what the screen must show. ⇒ countdown, `mm:ss`, falling.

## Global Constraints

- **⛔ Zero scoring, ⛔ zero score estimate, ⛔ zero adaptive chapter choice** (`T-296`ⓓ). Those are
  `41 § 8` item 4, and `41 § 9.2` puts the score formula with **Roy**. The chapter order is the fixed
  table in `41 § 2`, ⛔ never chosen from an answer.
- **⛔ The clock lives in `lib/core/`, ⛔ never in the component** (`T-296`ⓒ). The component holds ⛔ no
  `setInterval` that computes state: it ticks a display value and asks the core what that time means.
- `/lib/core/` is PURE — ⛔ zero React, window, document, localStorage, fetch, `Date.now()`.
  `scripts/check-core-purity.mjs` is the gate. The caller passes `nowMs` in, exactly as `T-287` does.
- **⛔ No second component for a job that has one** (constitution § 6): the tab bar is `AmirnetTabs`,
  the English text is `<EnWord>`, the Hebrew is RTL. ⛔ No new tabs bar, ⛔ no new option row style.
- `prefers-reduced-motion`: the clock is **text that updates**, ⛔ not an animation (`T-296`ⓔ,
  `check:motion`).
- **⛔ The learner is ⛔ not sent to a dead end.** Measured this tick: `F-222` blocks the item schema
  and `T-297` — the bank and its route — is still ⬜ ⇒ there is ⛔ no source of simulation items.
  ⇒ `AMIRNET_BUILT_TABS` keeps `simulation` at «טרם» and ⛔ no product route is opened in this plan;
  the walk runs at `/dev/amirnet/simulation` on a fixture, exactly as `T-287`'s question screen does
  today. The flip is ⛔ one line in `components/AmirnetTabs.tsx` and it belongs to the tick that lands
  `T-297`. ⛔ A tab that navigates to «אין פריטים» is `RULES § 0.31`, ⛔ not delivery.
- **⛔ Nothing here is invented learning content** (`R-010` · `RULES § 0.1 ז׳`). The fixture item is
  **transcribed** from `render_video_D.py` `SQ` (:249-251) — the render's own reference item, the same
  provenance `app/dev/amirnet/question/question-fixture.ts` already declares. ⛔ ⛔ Not one of
  `41 § 6.3`'s calibration examples, which that section forbids putting in the product.

## File Structure

```
NEW   lib/core/amirnetSimulation.ts          the six chapters, the per-chapter clock, the transitions
NEW   lib/core/amirnetSimulation.test.ts     the two failure scenarios T-296 names, plus the table
NEW   components/AmirnetSimulation.tsx       draws screen_sim. Decides ⛔ nothing.
NEW   components/AmirnetSimulation.test.ts   source-shape guard (strings · tokens · 44px · no colour-only)
NEW   app/dev/amirnet/simulation/page.tsx    the STEP 6.5 walk harness
NEW   app/dev/amirnet/simulation/simulation-fixture.ts   the render's own item, transcribed
EDIT  plan/50-tasks.md · plan/30-architecture.md · plan/00-control.md   (T-296 ⇒ 🟣)
— task 2 (T-298), ⛔ not this tick —
NEW   components/AmirnetResult.tsx · components/AmirnetResult.test.ts
NEW   app/dev/amirnet/result/page.tsx
```

## Interfaces

```ts
// lib/core/amirnetSimulation.ts
export interface AmirnetChapter {
  readonly index: number;            // 0-5
  readonly type: AmirnetPracticeType;
  readonly questionCount: number;
  readonly seconds: number;          // the chapter's OWN budget, 41 § 2
}
export const AMIRNET_CHAPTERS: readonly AmirnetChapter[];      // exactly 6, from 41 § 2
export const CARRY_OVER_NOTICE_HE = 'אי אפשר להעביר זמן שנותר לפרק הבא';
export const SIMULATION_OVER_HE: string;
export const NEXT_QUESTION_HE = 'לשאלה הבאה';
export const CHAPTER_TIME_UP_HE: string;
export const REMAINING_LABEL_HE: string;   // the clock's own sr-only label

export interface AmirnetSimulationState {
  readonly chapterIndex: number;
  readonly questionIndex: number;
  /** The stamp the CURRENT chapter began at. ⛔ Never the stamp the run began at. */
  readonly chapterStartedAtMs: number;
  readonly finished: boolean;
}
export function startSimulation(nowMs: number): AmirnetSimulationState;
export function remainingSeconds(state: AmirnetSimulationState, nowMs: number): number;  // clamped ≥0
export function chapterClock(remaining: number): string;      // `m:ss`, ⛔ never negative
export function isChapterExpired(state: AmirnetSimulationState, nowMs: number): boolean;
export function chapterHeadingHe(chapterIndex: number): string;   // `פרק 1 מתוך 6`
export function chapterDotState(i: number, chapterIndex: number): 'done' | 'current' | 'upcoming';
export function chapterDotLabelHe(state: 'done' | 'current' | 'upcoming', i: number): string;
/** The ONE transition. ⛔ It ⛔ never carries leftover time — it re-stamps from `nowMs`. */
export function advance(state: AmirnetSimulationState, nowMs: number): AmirnetSimulationState;
```

## Task 1: `T-296` — one chapter, end to end, under its own clock  ⟵ THIS TICK

**Interfaces:** as declared above. Reuses `questionCounterHe` from `lib/core/amirnetQuestion.ts`
and `AmirnetPracticeType` / `AMIRNET_TYPES` from `lib/core/amirnetPractice.ts` unchanged.

**Real test code — written BEFORE the module (`test-driven-development`), and these two `it`s are
`T-296`'s own failure scenarios word for word:**

```ts
// lib/core/amirnetSimulation.test.ts
import { describe, expect, it } from 'vitest';
import {
  AMIRNET_CHAPTERS, advance, chapterClock, isChapterExpired, remainingSeconds, startSimulation,
} from './amirnetSimulation';

describe('41 § 2 — אי אפשר להעביר זמן שנותר לפרק הבא', () => {
  it('a chapter that ends with 90 seconds left gives the next chapter its FULL time, ⛔ not full + 90', () => {
    const t0 = 1_000_000;
    let s = startSimulation(t0);                       // chapter 1 — 4 min = 240s
    const atEnd = t0 + (AMIRNET_CHAPTERS[0].seconds - 90) * 1000;
    expect(remainingSeconds(s, atEnd)).toBe(90);
    s = advance({ ...s, questionIndex: AMIRNET_CHAPTERS[0].questionCount - 1 }, atEnd);
    expect(s.chapterIndex).toBe(1);
    expect(remainingSeconds(s, atEnd)).toBe(AMIRNET_CHAPTERS[1].seconds);
    expect(remainingSeconds(s, atEnd)).not.toBe(AMIRNET_CHAPTERS[1].seconds + 90);
  });

  it('the clock reaching 00:00 locks the chapter — ⛔ no answer is accepted after it', () => {
    const t0 = 0;
    const s = startSimulation(t0);
    const atZero = t0 + AMIRNET_CHAPTERS[0].seconds * 1000;
    expect(remainingSeconds(s, atZero)).toBe(0);
    expect(chapterClock(remainingSeconds(s, atZero))).toBe('0:00');
    expect(isChapterExpired(s, atZero)).toBe(true);
    expect(remainingSeconds(s, atZero + 60_000)).toBe(0);   // ⛔ never negative
  });

  it('the six chapters are 41 § 2 exactly — 23 questions, 39 minutes', () => {
    expect(AMIRNET_CHAPTERS).toHaveLength(6);
    expect(AMIRNET_CHAPTERS.reduce((n, c) => n + c.questionCount, 0)).toBe(23);
    expect(AMIRNET_CHAPTERS.reduce((n, c) => n + c.seconds, 0)).toBe(39 * 60);
  });
});
```

**Steps:**

- [ ] **Step 1:** write `lib/core/amirnetSimulation.test.ts` exactly as above and run
      `npx vitest run lib/core/amirnetSimulation.test.ts` — it MUST fail (⛔ no module yet).
- [ ] **Step 2:** `lib/core/amirnetSimulation.ts` — `AMIRNET_CHAPTERS` from the `41 § 2` table
      (4·4 / 4·4 / 5·15 / 3·6 / 3·6 / 4·4), `remainingSeconds` clamped at 0, `chapterClock`,
      `isChapterExpired`, `advance` re-stamping `chapterStartedAtMs` from `nowMs`, the Hebrew
      strings and the dot-state helpers. Re-run the test until green.
- [ ] **Step 3:** `components/AmirnetSimulation.tsx` — `screen_sim`'s layout in product tokens:
      header (`פרק n מתוך 6` · type · clock card · six dots · `שאלה q מתוך N`), the question card
      in `<EnWord>`, four option rows, `לשאלה הבאה`, and `CARRY_OVER_NOTICE_HE` as standing text.
      The expired chapter disables the options and says so in Hebrew.
- [ ] **Step 4:** `components/AmirnetSimulation.test.ts` — the source-shape guard: the three
      Hebrew strings present, `min-h-touch` on every tappable, ⛔ no hex literal, ⛔ no `h-screen`,
      the dots carry `aria-label`, and ⛔ no score/XP/leaderboard identifier appears.
- [ ] **Step 5:** `app/dev/amirnet/simulation/simulation-fixture.ts` (the render's `SQ`, transcribed,
      with its provenance in the header) + `app/dev/amirnet/simulation/page.tsx`.
- [ ] **Step 6:** `npm run generate-map` if `package.json` carries it, then
      `npm run build && npx next start -p 3000` and walk `http://localhost:3000/dev/amirnet/simulation`
      at 375×780 — record heading, taps, under-44px, horizontal scroll, console errors, and compare
      the layout to `docs/design/kol-D-06-simulation.png`. Then `npm run preview:stop`.
- [ ] **Step 7:** `plan/50-tasks.md` `T-296` ⇒ 🟣 C-0538, one `plan/30-architecture.md` entry, then
      **`npm run verify`** (nine commands, explicit ten-minute window) and push to `work/current`.

**Self-check:** ⛔ no score · ⛔ no score estimate · ⛔ no adaptivity · ⛔ no `setInterval` computing
state · the countdown is declared as the render's, ⛔ not as a deviation · `simulation` stays «טרם»
until `T-297` lands the bank · every שכבה A gap above carries the render's measured number.

## Task 2: `T-298` — the six-chapter result  ⟵ ⛔ NOT this tick (`T-296` must land first)

**Interfaces:** consumes a `readonly AmirnetChapterOutcome[]` the engine accumulates —
`{ chapterIndex, correct, answered, elapsedSeconds }` — and ⛔ adds no field derived from them.

```ts
// components/AmirnetResult.test.ts — T-298's own failure scenario
it('a run of five chapters renders six rows and ⛔ never a «—» row', () => {
  expect(() => resultRows(FIVE_CHAPTER_RUN)).not.toThrow();
  expect(resultRows(FIVE_CHAPTER_RUN)).toHaveLength(5);
  expect(JSON.stringify(resultRows(FIVE_CHAPTER_RUN))).not.toContain('—');
});
```

**Steps:**

- [ ] **Step 1:** `components/AmirnetResult.test.ts` — the five-chapter run above, failing first.
- [ ] **Step 2:** `components/AmirnetResult.tsx` — per-chapter `נכונות מתוך סה״כ` + real time
      (`41 § 7`), the weakest type linking to `/world/amirnet/practice?type=<sc|rs|rc>` through the
      existing `components/amirnetTypeBar.ts`, and the written short-run empty state (`T-298`ⓓ).
      ⛔ No score estimate and ⛔ no 50–150 meter — `41 § 9.2` is Roy's.
- [ ] **Step 3:** `app/dev/amirnet/result/page.tsx`, walk it, then **`npm run verify`** and push.
