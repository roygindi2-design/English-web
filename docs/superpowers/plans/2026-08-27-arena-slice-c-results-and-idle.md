# Arena slice C — the results screen, and the idle loop — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (or
> `superpowers:subagent-driven-development`). Every step is a `- [ ]` and closes only
> after a fresh run whose output goes into the tick report.

**Written:** C-0330 (DEV, 📝 planning tick) · 2026-08-27T08:41Z (`date -u`)

**Goal:** close **T-180 → T-119 → T-158** in one branch: the learner sees a **measured
summary** of the battle that was just fought, and the two figures on the arena stage stop
being frozen statues. These are the three `arena` rows that carry **no open PM decision**
— § 7 records, with numbers, the four render blocks that do, and why T-181 is ⛔ not in
this slice.

**Architecture:** the three layers the repo already enforces, unchanged since slice A.
The **rule** lives in `lib/core/*` (pure — ⛔ zero React/DOM/network/clock); the
**component draws and ⛔ does not compute**; the **route applies a read plan and ⛔ does
not decide**. Slice C adds exactly one new pure module, `lib/core/arenaSummary.ts`, which
answers one question — *what happened in those 90 seconds?* — reading only
`BattleState.casts`, which slice A already fills with `{wordId, correct, responseMs,
critical}` on every cast (`lib/core/battle.ts:55-60` · `:142-161`). ⛔ It never asks *what
should happen next*: every write stays where it already is, and § 7 says why.

**Tech Stack:** Next 16 (App Router) · React 19 · TypeScript
(`noUncheckedIndexedAccess`, ⛔ no `any`) · Tailwind 3 · vitest 2 — ⛔ **no RTL and no
jsdom**: component tests are **source scans**, the template is
`app/arcade/page.test.ts:1-22` and `components/ArenaStage.test.ts` · playwright for
`check:mobile`.

**Spec:** `plan/37-arena-spec.md` § 10 (the results screen) · § 5 (what «slow» means) ·
§ 9 (rewards) · § 13.1 · § 13.3 · § 13.5 (invariants) · § 11 (the animation language) ·
`plan/36-video-spec.md` § 8 · § 13 · § 14 · **§ 14.4** ·
`plan/35-design-constitution.md` layer A / layer B **ב5 · ב6 · א7** ·
`plan/40-decisions.md` **D-060** (motion lives on the stage only) · **D-090ⓒ** ·
**D-102** (constitution v2) · **D-114** (§ 14.4 reversed) · **D-126** · **D-127** ·
**D-128** (what killed the design half of the T-119/T-158 blocker) ·
`plan/03-for-roy.md` item 39 (Roy's narrow exception, default off) ·
`plan/50-tasks.md` rows **T-180** · **T-119** · **T-158** · `docs/api-contract.md`.

**🎯 The render this slice targets:** `docs/design/kol-B-07-results.png`, and its source
`docs/design/render_video_B.py` — `scene_results` (**:595-648**). The stage half targets
`docs/design/kol-B-01-home.png` (`screen_home`, **:107-243**) only for the **idle
amplitude**, `bob = math.sin(t * 1.5) * 2.2` (**:124**) and the cape lag
`lag=math.sin(t * 1.5 - .6) * 1.4` (**:132**).
⛔ **Every layout number below was grepped out of that file, ⛔ not eyeballed off the PNG.**

---

## Global Constraints — they apply to all three tasks

- **`36 § 14.4` — the render binds, layout **and finish alike**.** ⛔ «the finish comes
  from the constitution» was **reversed on 24/08 (D-114)** and is ⛔ not an answer to a
  gap. **Layer A of the constitution is the only carve-out, and there is no second one**:
  a contrast floor, a 44px target, or state encoded by colour alone **overrides the
  render** — and the gap goes into the task row **with the number that was measured**.
  § 7 of this plan carries every such number this slice already knows about.
- **TDD.** The test is written first, **run and measured failing** (⛔ not assumed to
  fail), and only then the implementation. The run output goes into the report.
- **`lib/core` is pure.** ⛔ Zero React · window · document · localStorage · fetch ·
  `Date.now` · `setTimeout` · `setInterval` · `requestAnimationFrame`. Gate:
  `npm run check:core`.
- **⛔ A UI component never touches the database.** Nothing in this slice calls
  `lib/api/client.ts` at all: the summary is computed from state the battle already holds.
- **Invariant `37 § 13.1`:** the arena ⛔ never writes to `word_progress` and ⛔ never
  moves SM-2. This slice writes **nothing** — that is the whole reason its write half is
  in § 7 and ⛔ not in a step.
- **Invariant `37 § 13.5`:** arena colours live in `app/arcade/arcade-tokens.css` and
  ⛔ **never** enter `lib/core/palette.ts` or `app/globals.css`. `app/arcade/page.test.ts`
  fails by name on each hex.
- **Mobile-first.** 375px is the design width; **320 · 375 · 414** are all measured.
  44px targets, RTL with bidi, `min-h-[100dvh]` and ⛔ never `h-screen`, zero horizontal
  scroll. English reaches a learner **only** inside `<EnWord>`/`<EnText>`.
- **`prefers-reduced-motion` applies in the arena too** (layer A · א7). Task 2 is the one
  place in this repo where an **infinite** animation is deliberately created, and
  `animation: none` — ⛔ not `animation-duration: 0.01ms` — is what stops it. The template
  and the reasoning are already in `app/globals.css:145-150` (`[data-tab-world]`).
- **⛔ New CSS blocks go BEFORE the `/* arena-stage` marker in `app/globals.css`**
  (`app/globals.css:167-175`): `components/ArenaStage.test.ts:25` slices the stage block
  as `CSS.slice(indexOf('/* arena-stage'))` — **to the end of the file** — so a rule
  appended at the bottom is measured as a stage rule. Task 2 is the exception, and it is
  the exception **on purpose**: its rule belongs inside the stage block.
- **Five radii, and no sixth** (layer B): `md` 6 · `lg` 8 · `xl` 12 · `2xl` 16 ·
  `rounded-full`. § 7 carries the one render radius that is not in the scale.
- **Glow budget** (layer B): max **two** per screen, only on `--brand`/`--brand-surface`,
  ⛔ never on body text. The results screen spends **zero**.
- **⛔ Zero invented learning content.** No task here creates, edits or reorders a word, a
  translation, a distractor or a story. `10-pedagogy.md` is ⛔ off-limits.

---

## File Structure

| File | New / edited | What it holds |
|---|---|---|
| `lib/core/arenaSummary.ts` | **new** | pure. `summarize()` · `meanSecondsHe()` · `SLOW_IS_CORRECT_BUT_NOT_CRITICAL` |
| `lib/core/arenaSummary.test.ts` | **new** | the boundary tests, 0 ms |
| `components/ArenaSummary.tsx` | **new** | draws `kol-B-07-results.png`. ⛔ computes nothing |
| `components/ArenaSummary.test.ts` | **new** | source scan: strings · radii · ⛔ zero hex · ⛔ zero write |
| `app/dev/arcade/summary/page.tsx` | **new** | the fixture the STEP 6.5 walk drives |
| `components/ArenaBattle.tsx` | edited | renders `<ArenaSummary>` above the existing `<ArenaResult>` block |
| `app/globals.css` | edited | one `@keyframes arena-idle` + two rules, **inside** the stage block |
| `components/ArenaStage.tsx` | edited | reads `ARENA_IDLE_LOOP`, emits `data-arena-idle` |
| `components/ArenaStage.test.ts` | edited | the two assertions that forbid the loop **by name** |
| `lib/core/arcadeLadder.ts` | edited | `ARENA_IDLE_LOOP` → `true` (Task 3, one line) |
| `lib/core/arcadeLadder.test.ts` | edited | `:47` asserts `false` — it becomes `true` |
| `plan/50-tasks.md` · `plan/60-findings.md` | edited | statuses, and the § 7 findings |
| `docs/plan-tables.md` · `docs/plan-open.md` | **regenerated** | `npm run measure:plan`, same commit |

⛔ **`app/arcade/results/page.tsx` is ⛔ NOT created, and that is a decision ⛔ not an
omission.** T-180's row names `app/arcade/results/*`, but the summary's only input is
`BattleState`, which lives in `useState` inside `components/ArenaBattle.tsx:197` — a route
transition **destroys it**, and the only ways back are a `sessionStorage` round-trip or a
second server write, and this slice is forbidden both. ⇒ the screen is a **component**,
reachable in the same place the old one already is, plus a `/dev` fixture. This is a
`RULES § 0.16` call in the **✅ DEV decides alone** column («file layout, function names,
module boundaries»), and it gets its one logged line in the tick report.

---

## Interfaces

```ts
// lib/core/arenaSummary.ts — pure. ⛔ zero React, window, fetch, Date.now.
import type { BattleCast } from '@/lib/core/battle';

export interface ArenaSummary {
  /** How many words were cast at. ⛔ Not the size of the round: an unanswered word is not a cast. */
  readonly total: number;
  readonly correct: number;
  /** Rounded to whole ms. ⛔ 0 when `total === 0` — never NaN, never a division by zero. */
  readonly meanResponseMs: number;
  /** The longest run of consecutive `correct` casts. `37 § 10` row 3 («רצף מרבי»). */
  readonly bestStreak: number;
  /** `37 § 5`: correct but over `CRITICAL_MS` — the spec's own «נכונה איטית». */
  readonly slow: readonly BattleCast[];
}

export function summarize(casts: readonly BattleCast[]): ArenaSummary;

/** «1.8 ש׳» — one decimal, Hebrew unit. ⛔ The component formats nothing itself. */
export function meanSecondsHe(meanResponseMs: number): string;
```

```ts
// components/ArenaSummary.tsx — draws, ⛔ computes nothing.
export interface ArenaSummaryProps {
  readonly enemyDefeated: boolean;
  readonly summary: ArenaSummary;
  /** wordId → headword. The English never reaches the learner outside <EnWord>. */
  readonly headwords: Readonly<Record<string, string>>;
  /** «חזור לזירה». ⛔ Not a navigation decision — the caller owns the href. */
  readonly onBack: () => void;
}
```

```ts
// components/ArenaStage.tsx — one added prop, ⛔ and no state.
export interface ArenaStageProps {
  readonly phase: StagePhase;
  readonly items: readonly string[];
  /** ⛔ Defaults to `ARENA_IDLE_LOOP`. The stage stays a pure drawing. */
  readonly idle?: boolean;
}
```

---

## The render, measured — `render_video_B.py:595-648`

| Block | Render (logical px, `LW=375`) | What it becomes |
|---|---|---|
| title | `ניצחון` y=**128**, 34 Black, `GOLD_LIGHT` | `text-[34px] font-black text-arena-gold-light`, `היריב נוצח` / `הקרב נגמר` |
| stat rows | y=**318 · 370 · 422**, x=**24**, w=`LW-48`=**327**, h=**44**, r=**13** | three rows, `gap-2`, `rounded-xl` (see § 7) |
| row label | `(LW-40, y+22)` anchor `rm`, 13 Medium, `INK` | right-aligned Hebrew — RTL start |
| row value | `(40, y+22)` anchor `lm`, 15 Bold, `rtl=False` | left-aligned, inside `<span dir="ltr">` |
| row colours | `SUCCESS` `#4ade80` · `BRAND_SURFACE` `#7dabf8` · `GOLD_LIGHT` `#f5d684` | ⛔ never the only channel — each row carries its Hebrew label |
| slow panel | y=**486**, h=**66**, r=**16**, fill `DANGER`@40, outline `DANGER` 1.6 | `rounded-2xl border border-danger` |
| slow strings | `N מילים היו איטיות` (14 Bold) · `הוסף אותן לחזרה בכרטיסיות` (11.5 Regular) | first string ships; second is § 7 |
| CTA | y=**654**, h=**56**, r=**16**, fill `BRAND_SURFACE`, label 15.5 Bold `BRAND_ON` | 56px ✅ over the 44px floor |
| footer | `הזירה לא שינתה דבר בהתקדמות הלמידה` `(LW/2, 730)`, 11 Regular | ships verbatim — it **is** invariant `37 § 13.1` said out loud |

---

## Task 1 — T-180 · the results screen

- [x] **Step 1.1 — write the failing pure test.** Create `lib/core/arenaSummary.test.ts`
      with the block below, ⛔ and no implementation file yet.

```ts
import { describe, expect, it } from 'vitest';
import { CRITICAL_MS } from '@/lib/core/battle';
import { meanSecondsHe, summarize } from '@/lib/core/arenaSummary';

const cast = (wordId: string, correct: boolean, responseMs: number) => ({
  wordId, correct, responseMs, critical: correct && responseMs < CRITICAL_MS,
});

describe('summarize — 37 § 10', () => {
  it('⛔ אפס הטלות ⛔ אינו NaN', () => {
    const s = summarize([]);
    expect(s.total).toBe(0);
    expect(s.correct).toBe(0);
    expect(s.meanResponseMs).toBe(0);
    expect(s.bestStreak).toBe(0);
    expect(s.slow).toEqual([]);
  });

  it('נכונות ורצף מרבי — הרצף ⛔ אינו הרצף האחרון', () => {
    const s = summarize([
      cast('a', true, 900), cast('b', true, 900), cast('c', true, 900),
      cast('d', false, 900), cast('e', true, 900),
    ]);
    expect(s.correct).toBe(4);
    expect(s.total).toBe(5);
    expect(s.bestStreak).toBe(3);
  });

  it('«איטית» = נכונה שאינה קריטית (§ 5), ⛔ ולא סף שהומצא', () => {
    const s = summarize([
      cast('a', true, CRITICAL_MS - 1),
      cast('b', true, CRITICAL_MS),
      cast('c', false, 9_000),
    ]);
    expect(s.slow.map((c) => c.wordId)).toEqual(['b']);
  });

  it('הממוצע מעוגל, והפורמט הוא «1.8 ש׳»', () => {
    expect(summarize([cast('a', true, 1_750), cast('b', true, 1_850)]).meanResponseMs).toBe(1_800);
    expect(meanSecondsHe(1_800)).toBe('1.8 ש׳');
    expect(meanSecondsHe(0)).toBe('0.0 ש׳');
  });
});
```

- [x] **Step 1.2 — run it and measure red.** `npx vitest run lib/core/arenaSummary.test.ts`
      — the output must name the missing module. ⛔ Paste it into the report; ⛔ an assumed
      red is not a red.
- [x] **Step 1.3 — implement `lib/core/arenaSummary.ts`** to the `Interfaces` block above.
      `bestStreak` is one pass with a running counter; `slow` is
      `casts.filter((c) => c.correct && !c.critical)`; `meanSecondsHe` is
      `(ms / 1000).toFixed(1) + ' ש׳'`. ⛔ No `Date.now`, ⛔ no `Intl`.
- [x] **Step 1.4 — green, and the purity gate.**
      `npx vitest run lib/core/arenaSummary.test.ts && npm run check:core`
- [x] **Step 1.5 — write the failing component scan.** Create
      `components/ArenaSummary.test.ts` on the `components/ArenaStage.test.ts:1-25`
      template (comment-stripped `CODE`, ⛔ not raw `SRC`):

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/ArenaSummary.tsx', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('<ArenaSummary> — 37 § 10 · kol-B-07-results.png', () => {
  it('שלוש שורות הסיכום, בשמן מהרנדר', () => {
    for (const label of ['נכונות', 'זמן תגובה ממוצע', 'רצף מרבי']) {
      expect(CODE).toContain(label);
    }
  });

  it('שורת החותם של האינווריאנט מופיעה מילה במילה (37 § 13.1)', () => {
    expect(CODE).toContain('הזירה לא שינתה דבר בהתקדמות הלמידה');
  });

  it('⛔ הרכיב ⛔ אינו כותב — אפס רשת ואפס שם עמודה', () => {
    for (const banned of [/apiPost/, /fetch\(/, /word_progress/, /arcade_progress/]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('⛔ אינו מחשב — הסיכום מגיע כ-prop', () => {
    expect(CODE).toMatch(/summary/);
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(/);
  });

  it('⛔ אפס hex, ⛔ אפס h-screen, ⛔ אפס רדיוס מחוץ לסולם', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/\bh-screen\b/);
    expect(CODE).toMatch(/min-h-\[100dvh\]/);
    expect(CODE).not.toMatch(/rounded-\[\d/);
  });

  it('אנגלית מגיעה ללומד אך ורק בתוך <EnWord>', () => {
    expect(CODE).toMatch(/<EnWord/);
  });
});
```

- [x] **Step 1.6 — run and measure red.**
      `npx vitest run components/ArenaSummary.test.ts`
- [x] **Step 1.7 — build `components/ArenaSummary.tsx`** to the measured table above.
      Right-aligned Hebrew label + `dir="ltr"` value per row; the slow panel renders
      `<EnWord>` per slow word; the CTA is 56px; the footer string is verbatim.
      ⛔ Do not add the XP sub-line, the chest or the new-words panel — § 7.
- [x] **Step 1.8 — the fixture.** Create `app/dev/arcade/summary/page.tsx` on the
      `app/dev/arcade/result/page.tsx` template, with a 16-cast fixture that produces
      **14/16 · 1.8 ש׳ · רצף 4 · 3 איטיות** — the render's own numbers, so the walk
      compares like with like.
- [x] **Step 1.9 — wire it in.** In `components/ArenaBattle.tsx`, render `<ArenaSummary>`
      above the existing `<ArenaResult>` block at `:463`, fed from
      `summarize(battle.casts)`. ⛔ `<ArenaResult>` is ⛔ not deleted in this slice — it
      carries the unlocked-item panel that § 7 has no replacement for yet.
- [x] **Step 1.10 — green.**
      `npx vitest run components/ArenaSummary.test.ts lib/core/arenaSummary.test.ts`

## Task 2 — T-119 · the idle loop gets a consumer

- [x] **Step 2.1 — rewrite the two assertions that forbid it, and say why in the file.**
      In `components/ArenaStage.test.ts`, the test at `:66-69`
      («פריט 39 — ⛔ אין לולאת המתנה») and the ≤300ms cap at `:59-64` are what stand in the
      way. Replace them with the pair below. ⛔ The old comment is ⛔ not deleted silently:
      it is replaced by a comment naming **D-128** and constitution **ב5**.

```ts
  it('פריט 39 · D-128 — לולאת ההמתנה קיימת, וחיה אך ורק בבמה', () => {
    expect(STAGE_CSS).toMatch(/@keyframes arena-idle/);
    expect(STAGE_CSS).toMatch(/infinite/);
    // ⛔ הלולאה היחידה בבלוק, ⛔ ולא «לולאות»: ב5 מתיר חריגה מדודה, ⛔ לא רשות פתוחה.
    expect([...STAGE_CSS.matchAll(/infinite/g)]).toHaveLength(1);
  });

  it('גדר המשרעת ≤2px נמדדת מה-CSS, ⛔ ולא מהערה', () => {
    const px = [...STAGE_CSS.matchAll(/translateY\((-?\d+(?:\.\d+)?)px\)/g)]
      .map((m) => Math.abs(Number(m[1])));
    expect(px.length, 'חייבת להימדד תזוזה אחת לפחות').toBeGreaterThan(0);
    for (const v of px) expect(v).toBeLessThanOrEqual(2);
  });

  it('חוקה א7 — prefers-reduced-motion עוצר, ⛔ ולא מאיץ', () => {
    expect(STAGE_CSS).toMatch(/prefers-reduced-motion[\s\S]*arena-idle[\s\S]*animation:\s*none/);
  });
```

- [x] **Step 2.2 — run and measure red.**
      `npx vitest run components/ArenaStage.test.ts`
- [x] **Step 2.3 — the CSS, inside the stage block of `app/globals.css`.** ⛔ Not before
      the `/* arena-stage` marker — this rule **is** a stage rule and the slice at
      `components/ArenaStage.test.ts:25` must see it. Amplitude **2px** (the render's
      `bob` is 2.2 at `render_video_B.py:124`, and the fence in constitution **ב5** is
      **≤2**; the 0.2px gap is § 7). One `@keyframes arena-idle`, one
      `[data-arena-idle='on']` rule, one `@media (prefers-reduced-motion: reduce)` with
      `animation: none`.
- [x] **Step 2.4 — the consumer, in `components/ArenaStage.tsx`.** Import
      `ARENA_IDLE_LOOP` from `@/lib/core/arcadeLadder`, add the `idle` prop defaulting to
      it, and emit `data-arena-idle={idle ? 'on' : 'off'}` on the **hero figure only**
      (D-060: the question area ⛔ never moves). ⛔ No `useState`, ⛔ no `useEffect`,
      ⛔ no `requestAnimationFrame` — `ArenaStage.test.ts:41-45` fails by name on all three.
- [x] **Step 2.5 — green, both files.**
      `npx vitest run components/ArenaStage.test.ts lib/core/arcadeLadder.test.ts`

## Task 3 — T-158 · the flag flips on

- [ ] **Step 3.1 — flip the assertion first.** In `lib/core/arcadeLadder.test.ts:47`,
      `expect(ARENA_IDLE_LOOP).toBe(false)` becomes `toBe(true)`, with a comment naming
      **D-090ⓒ** and `plan/03-for-roy.md` item 39. Run
      `npx vitest run lib/core/arcadeLadder.test.ts` and measure red.
- [ ] **Step 3.2 — flip the flag.** `lib/core/arcadeLadder.ts:33` → `true`, and its
      doc-comment records that the consumer landed in T-119 — a flag with no reader was
      the whole reason this row sat blocked.
- [ ] **Step 3.3 — green.** `npx vitest run lib/core/arcadeLadder.test.ts`

## Task 4 — the registers, the gate, and the walk

- [ ] **Step 4.1 — the register rows.** In `plan/50-tasks.md`, set **T-180 · T-119 ·
      T-158** to 🟣 with `C-XXXX`, ⛔ never ✅ (that is QA's, on merge — `F-126`). ⛔ **Do
      ⛔ not touch the `אבן דרך` cell** of any row: `M2 · arena · <סוג>` is what the
      balance table counts (`RULES § 0.5ב`).
- [ ] **Step 4.2 — the findings of § 7** go into `plan/60-findings.md`, each with the
      render line number that was measured, and **T-181** gets `⛔ חסומה` naming them.
- [ ] **Step 4.3 — regenerate, ⛔ never hand-edit.** `npm run measure:plan`, and
      `docs/plan-tables.md` **and** `docs/plan-open.md` go in the **same commit**
      (`RULES § 0.1.1 ח׳` — this has reddened the tree twice).
- [ ] **Step 4.4 — the full gate, last.** `npm run verify` — all five commands, fresh, in
      the message that claims it. ⛔ «passed earlier» is banned. Red and unfixable in this
      tick ⇒ `./scripts/g revert` + a debt line in `plan/30-architecture.md`.
- [ ] **Step 4.5 — the live walk (STEP 6.5 · D-103), on `next start` ⛔ not `next dev`.**
      `npm run build && (npx next start -p 3000 &) && sleep 8`, then drive
      `http://127.0.0.1:3000/dev/arcade/summary` at **375×780** and record: heading ·
      text length · tappable count · **count under 44px** · horizontal scroll · console
      errors — then compare **layout** to `docs/design/kol-B-07-results.png`.
      ⚠️ A stale `.next` gave two false readings on 26/08 (`plan/30-architecture.md`) —
      `rm -rf .next` before the build.
- [ ] **Step 4.6 — the idle loop is measured, ⛔ not admired.** On
      `http://127.0.0.1:3000/dev/arcade`, read the hero figure's
      `getBoundingClientRect().top` over ~2s and record **max − min ≤ 2px**; then re-run
      under emulated `prefers-reduced-motion: reduce` and record it as **0**. The static
      half of the same fence is a command, and it runs too:
      `grep -n "translateY" app/globals.css`.
- [ ] **Step 4.7 — one commit per task, ⛔ not one per tick** (STEP 4.5 of the DEV
      prompt), then push through the wrapper — `git` direct ⛔ cannot reach the remote
      (`RULES § 0.14ג`), and the retry rule is mandatory:
      `./scripts/g push origin work/current` (see `scripts/g`). ⛔ Never `dev`,
      ⛔ never `main`. In the same tick, `plan/00-control.md` takes `CYCLE_ID` ·
      `ACTIVE_TASK_ID` · `NEXT_AGENT=CRITIC` · the released lock, and
      `plan/30-architecture.md` takes one journal line.

---

## § 7 — What this slice deliberately does ⛔ NOT build, with the numbers

⚠️ **Each of these is a gap from the render, and `36 § 14.4` says a gap goes into the task
row with the number that was measured — ⛔ not into a sentence about the constitution.**

| # | The render draws | Measured | Why it is ⛔ not in a step | To |
|---|---|---|---|---|
| ⓐ | `רמת זירה 7 · +48 XP` | `render_video_B.py:604` · `screen_home` `:139-141` (`1,240 / 2,000`) | **XP has no rule and no column.** `37 § 9` lists seven reward components and ⛔ names no XP curve; `supabase/migrations/0014_arcade.sql:24-30` has `arcade_level · wins · unlocked_items · avatar_parts` and ⛔ no XP. Inventing an accrual rate is a **learning mechanic** ⇒ ⛔ PM column of `RULES § 0.16` | **PM** |
| ⓑ | `תיבת ניצחון` chest | `:606-617` | Same root as ⓐ — `37 § 9` says «תיבות אחרי ניצחון, בלי טיימרים» and ⛔ defines no contents. A chest that opens to nothing is worse than no chest | **PM** |
| ⓒ | `פגשת 4 מילים חדשות` | `:631-640` | **No data source.** `app/api/arcade/round/route.ts:60-121` ⛔ never reads `word_progress`, so `ArcadeQuestion` carries no `kind`, and `components/ArenaBattle.tsx:180-188` tags **every** word `base` — by declared design («מחסן ריק ⇒ 100% מילות בסיס»). «New» is ⛔ not computable until `37 § 2`'s warehouse read lands | **PM** |
| ⓓ | `הוסף אותן לחזרה בכרטיסיות` · `הוסף לכרטיסיות` · CTA `הוסף הכול וחזור לזירה` | `:635` · `:639` · `:643` | **The write half.** `components/ArenaResult.tsx:19-20` already records that «הוסף לרשימת החזרה» is out of scope pending `plan/03-for-roy.md` item 31 (D-047), and the path it would use is **`F-140` 🔴**, open on the PM (`app/api/practice/route.ts:54-59` → 404 for a word with no progress row). ⇒ the CTA ships as **`חזור לזירה`** — a UI string that is ⛔ not learning content, so `RULES § 0.16` ✅ DEV column, **one logged line** | **DEV, logged** |
| ⓔ | stat-row radius **13** | `:618-620` | ⛔ **13 is not one of the five radii** (6 · 8 · 12 · 16 — constitution layer B). Nearest in scale is `xl` = **12** ⇒ a measured **1px** deviation, same shape as `F-144`. ⛔ Not eyeballed | **DEV, logged** |
| ⓕ | idle amplitude **2.2px** | `:124` (`bob = math.sin(t*1.5) * 2.2`) | T-119's own row fences the amplitude at **≤2px**, and D-128 wrote that fence into constitution **ב5**. ⇒ the fence wins, **0.2px** measured | **DEV, logged** |

### ⛔ And why **T-181** is ⛔ not in this slice
`T-181` (the arena home screen) is ⬜ and in the active workstream, and it is ⛔ still not
takeable: `kol-B-01-home.png` draws **four** data elements with no source —
`שברי ניצוץ 340` (`:132-136`), the XP bar (`:139-141`, = ⓐ), and **four named equipment
slots** `חרב הניצוץ · מגן אבן · לחש אש · שריון קל` (`:72-73`) against
`ARCADE_ITEMS = helmet · cape · lantern · boots · banner`
(`lib/core/arcadeResult.ts` · `components/ArenaAvatar.tsx:36-42`) — **two disjoint item
vocabularies**. And `37 § 7`'s character selection (קוסם · לוחם · שריונאי) has **⛔ no
render at all** in `docs/design/` (seven `kol-B-*` files, none of them a selection screen)
and no column to persist a choice. ⇒ per the DEV prompt's STANDING ORDERS, ⛔ **do not
invent one** — it is recorded, and the next independent task is taken.

---

## Self-check — ⛔ before the tick is called done

- [ ] `npm run check:plan docs/superpowers/plans/2026-08-27-arena-slice-c-results-and-idle.md`
      prints `shape: N/N`.
- [ ] `npm run verify` was run **in the message that claims it**, and its five lines are in
      the report.
- [ ] `grep -c "infinite" app/globals.css` — the count rose by exactly **1**, and
      `npx vitest run components/ArenaStage.test.ts` is green.
- [ ] `grep -rn "word_progress\|apiPost" components/ArenaSummary.tsx` returns **nothing**
      (invariant `37 § 13.1`).
- [ ] `npm run check:mobile` — **0** targets under 44px, **0** horizontal scroll at
      320 · 375 · 414.
- [ ] Every `- [ ]` above is ticked in this file, in the commit that closed its step —
      `docs/plan-open.md` prints `done/total`, and a plan with zero ticked boxes is
      measured and shown.
