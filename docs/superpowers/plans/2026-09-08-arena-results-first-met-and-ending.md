# Arena results: the words met for the first time, and an ending that names the gap (`37 § 10` · `37 § 9` ח4) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (or
> `superpowers:subagent-driven-development`). Every step is a `- [ ]` and closes only
> after a fresh run whose output goes into the tick report.

**Written:** C-0511 (DEV, 📝 planning tick) · 2026-09-08T18:36Z (`date -u`)
**Built:** — (the next DEV build tick)

**Covers:** **T-282** — the end of the battle tells the learner which words it put in
front of them for the first time (the render's blue board, **read-only**) · **T-283** —
an ending that is not a victory names the measured gap («היית N מילים מהבוס») instead
of `הקרב נגמר`, and `survived` is told apart from `outlasted`. Both rows are `M2 · arena`,
both carry `[SKILL: taste-skill]`, both live in the same three files — one plan, two
task commits.
**המשך של: T-180** (`components/ArenaSummary.tsx` · `lib/core/arenaSummary.ts` — the
results screen this plan extends) **and of T-176** (`lib/core/battle.ts`, the one owner of
battle law — this plan adds one field to `BattleCast` and one pure function).
⚠️ **Two rows and ⛔ not three-to-four, measured ⛔ not preferred:** `docs/plan-open.md`
(balance table, this clone) counts **exactly two** ⬜ rows in `ACTIVE_WORKSTREAM: arena` —
`T-282` and `T-283` (C-0510). `T-281` is 🟣 since C-0509.

**Goal:** `summarize` learns which casts were on `unfiltered` words and returns them as
`firstMet`; `<ArenaSummary>` draws the render's blue board under the red one, naming each
of those words inside `<EnWord>`, only when there is at least one. The heading stops
being a boolean: the component receives an `ArenaEnding` (`victory` · `survived` ·
`outlasted` + `wordsFromBoss`), and a non-victory prints the `37 § 9` ח4 sentence with the
number measured in the battle. ⛔ Zero writes, zero `fetch`, zero column names, zero
score/XP/streak/box, zero praise, zero scolding.

**What it buys the learner, in numbers (D-120, from the rows):** `/dev/arcade/summary`
today is **203 characters, 1 real action, 0 new words named**. After T-282 the screen names
**N** words (4 in the fixture, matching the render) that the battle showed for the first
time. After T-283 the three end states that today collapse into **2 strings** (`היריב נוצח`
/ `הקרב נגמר`) become **3 distinct endings**, and the non-victory carries a number instead
of a verdict.

**Architecture:** the three layers the repo already enforces. The **rule** lives in
`lib/core/` (pure — ⛔ zero React/DOM/network/clock): `battle.ts` stamps every cast with
the word's `kind` **at cast time** (the requeued copy is `base`, so `unfiltered` marks
exactly the first meeting — `battle.ts:211-217`) and gains `wordsFromBoss(state)`;
`arenaSummary.ts` gains `firstMet`, `ArenaEnding`, `endingOf`, and two Hebrew formatters
next to `meanSecondsHe`. The **component draws and ⛔ does not compute**
(`ArenaSummary.test.ts` bans `.filter(`/`.reduce(` in it): it receives `summary` and
`ending` as props. `ArenaBattle.tsx` swaps `outcomeAt` for `endingOf` at the one place it
already computes the outcome (`:483-485`) and passes `ending` instead of `enemyDefeated`.
⛔ **Zero new endpoint, zero migration, zero new screen, zero new route, zero new
dependency** (`package.json` untouched ⇒ `pick-ui-library` ⛔ not triggered).

**Tech Stack:** Next 16 App Router · React client components · TypeScript (⛔ no `any`) ·
Tailwind (`tailwind.config.ts` tokens: `brand` · `brand-surface` · `ink` · `ink-muted` ·
`danger`) · Vitest (`environment: node`, source-scanning guards in `components/`) ·
Playwright (`npm run check:mobile`).

**Spec:** `plan/37-arena-spec.md` § 10 (the results screen: `פגשת 4 מילים חדשות` · «המשתמש
לוחץ, לא המשחק») · § 9 ח4 («מסגור הפספוס `היית 2 מילים מהבוס` במקום `הפסדת`») · § 2 (the
three word kinds, `unfiltered` = «לחש לא מזוהה») · § 3 («בתום השעון מנצח אחוז החיים הגבוה»)
· § 5 (damage from speed) · § 13.1 (the arena never writes `word_progress`) ·
`plan/36-video-spec.md` § 12.3 («הזירה **קוראת** … קריאה מותרת, כתיבה אסורה») · § 14.4 (how
the render binds) · **D-202** (the decision; § ג׳ = T-282, § ה׳ = T-283) · `R-016` (no
praise, no scolding) · `F-151` (no XP / box / score — open, all three blocked).

🎯 **The render this slice targets: `docs/design/kol-B-07-results.png`**, drawn by
`docs/design/render_video_B.py` `scene_results` (`:595-648`). ⚠️ **Every layout number
below is grepped from that file, ⛔ not eyeballed on the PNG.** **הרנדר מחייב — layout and
finish alike** (`36 § 14.4` · **מחייב גם בגימור**), and **שכבה A (Layer A — contrast ·
44px · the 12px text floor · ⛔ no state in colour alone) is the ONLY carve-out.** The
measured gaps this plan takes, each with its number, are in **Global Constraints** below.

| What the render draws (`render_video_B.py`) | Line | Built by this plan? |
|---|---|---|
| Heading `ניצחון` 34 Black GOLD_LIGHT at y=128 | `:602` | ✅ exists as `היריב נוצח` (R-016, T-180). T-283 adds the non-victory heading in the **same slot** |
| Sub-line `רמת זירה 7 · +48 XP` 12.5 Medium INK_MUTED at y=160 | `:603` | ⛔ XP (F-151). T-283 uses **this slot** for the ending line (12.5 Medium ink-muted) — same position, same type, different text |
| `תיבת ניצחון` box | `:606-617` | ⛔ F-151 |
| Three stat rows at y=318/370/422 | `:618-624` | ✅ exists |
| Red board y=486 h=66 r=16 DANGER, `3 מילים היו איטיות` 14 Bold, sub-line 11.5 Regular | `:626-631` | ✅ exists |
| **Blue board y=562 h=66 r=16 BRAND fill α38/255 outline α230 w1.5, `פגשת 4 מילים חדשות` 14 Bold INK, sub-line `הוסף לכרטיסיות` 11.5 Regular BRAND_SURFACE, `○` control at x=54** | `:633-640` | **T-282 builds the board and its title.** The sub-line slot carries the **names** (row ⓐ: «בשמה בתוך `<EnWord>`, בדיוק כפי שהלוח האדום כבר עושה»). ⛔ `○` and `הוסף לכרטיסיות` are **item 105** (row ⓔ) |
| CTA `הוסף הכול וחזור לזירה` y=654 h=56 | `:641-643` | ⛔ item 105 — stays `חזרה לזירה` |
| Footer `הזירה לא שינתה דבר בהתקדמות הלמידה` | `:645-646` | ✅ exists |

## Global Constraints

- ⛔ **`36 § 14.4`: הרנדר מחייב גם בגימור.** «The finish comes from the constitution» is
  ⛔ **not** an answer to a gap. **שכבה A — contrast ≥4.5:1 · 44px target · 12px text
  floor (`scripts/check-text-floor.mjs`) · ⛔ no state in colour alone — is the ONLY
  carve-out.** Three measured gaps, and ⛔ no fourth:
  1. **Blue board names line: 12px, ⛔ not the render's 11.5px** (`:639`). Layer A floor.
     `components/ArenaSummary.tsx` already sits in `scripts/text-floor-baseline.md:43-44`
     for its two existing `11.5px`/`11px` strings (F-162 · T-236) — a **new** `text-[11.5px]`
     would be a new violation and turn `verify` red. Gap = **0.5px**, Layer A.
  2. **Panel radius 16 = `rounded-2xl`** ✅ on the scale. The stat rows' 13px radius is the
     already-declared 1px gap (`ArenaSummary.tsx:26-28`), ⛔ not touched here.
  3. **The `○` selection control and the `הוסף לכרטיסיות` sub-line are ⛔ not drawn** —
     ⛔ not a Layer A gap, a **blocked half** (`03-for-roy` item 105, row ⓔ): «בקרת בחירה
     בלי פעולה היא בקרה שמשקרת». Declared in the component's doc block.
- ⛔ **Read-only, enforced by the existing source scan** (`components/ArenaSummary.test.ts:23-27`):
  ⛔ `apiPost` · ⛔ `fetch(` · ⛔ `word_progress` · ⛔ `arcade_progress` in the component.
  `36 § 12.3` — reading the known list is allowed, writing is forbidden. This plan adds
  ⛔ no network call anywhere.
- ⛔ **The component does not compute** (`ArenaSummary.test.ts:29-32`): ⛔ `.filter(` ·
  ⛔ `.reduce(` in `ArenaSummary.tsx`. Dedupe, counting, and Hebrew number forms live in
  `lib/core/arenaSummary.ts`, next to `meanSecondsHe`.
- ⛔ **`lib/core/` stays pure** — `npm run check:core`. ⛔ No React, DOM, `Date.now`, `fetch`.
- ⛔ **The word `הפסדת` never reaches the screen** (`battle.ts:101-102` · T-283 ⓑ). A new
  source-scan line enforces it.
- ⛔ **Zero score, XP, streak, box** (F-151 · T-283 ⓒ). ⛔ **Zero praise, zero scolding**
  (R-016 · T-283 ⓓ): every new string is a **number or a fact**.
- ⛔ **Zero invented learning content.** The fixture headwords stay the `Lorem<n>`
  placeholders `app/dev/arcade/summary/page.tsx` already uses (R-010 · R-013).
- **Every learner-visible string is Hebrew, RTL; English only inside `<EnWord>`.**
  Second-person past tense (`פגשת` · `היית` · `החזקת`) is the same written form for every
  learner ⇒ ⛔ no gendered string is introduced.
- ⛔ **`docs/api-contract.md` untouched** — no endpoint changes. `POST /api/arcade/result`
  still receives `ArcadeAnswer[]` built from `casts` by **field** (`ArenaBattle.tsx:501-508`),
  so a new field on `BattleCast` never reaches the wire.
- **One commit per task row** (T-282, then T-283), then the close commit. ⛔ Never one
  squashed tick.
- **`[SKILL: taste-skill]`** (`skills/taste-skill/SKILL.md`) is loaded **before** Task 1
  Step 1 of the build tick — ⛔ not after. What applies from it here: **§ 4.9 COPY
  SELF-AUDIT** (re-read every new visible string before ship; plain functional sentences,
  ⛔ no cute copy) · **§ 9.D** (⛔ no fake-perfect numbers — every number on this screen is
  measured in the battle) · **§ 9.B** (hierarchy by weight and colour, ⛔ not by scale —
  the sub-line is 12.5 Medium muted under a 34 Black heading, exactly the render's ratio).
  ⛔ Its font, serif, and landing-page sections do not apply: the constitution and the
  render outrank the skill (`docs/skills-registry.md`, fence 1).

## What the two rows name that this plan ⛔ does NOT build, and why

| Not built | Why | Where it lives |
|---|---|---|
| CTA `הוסף הכול וחזור לזירה` · `×` on the red board · `○` on the blue board | Row ⓔ: contradiction between `36 § 12.1`, `37 § 10` and the render — **Roy's call**, ⛔ not DEV's | `03-for-roy` item 105 |
| `רמת זירה · XP` · `תיבת ניצחון` | F-151 open, no XP rule, no column | `F-151` |
| `<ArenaResult>`'s second `h1` (`היריב נוצח` / `הקרב נגמר`) under the summary | Not in either row's file list; the duplicate heading is a **finding** D-202 § ו׳ already routed to CRITIC | CRITIC |
| Server-side `enemyDefeated` (`lib/core/arcadeResult.ts:41`) vs client `victory` disagreeing | T-283 ⓔ moves the heading to the **client** `BattleOutcome`; the API boolean stays what `<ArenaResult>` uses. If the two ever differ, that is a finding for CRITIC, ⛔ not a resolution for this slice | one line in the build report |

## File Structure

| File | Task | What changes |
|---|---|---|
| `lib/core/battle.ts` | 1 · 3 | `BattleCast.kind: ArenaWordKind` (stamped in `cast`, `:227`) · `wordsFromBoss(state)` |
| `lib/core/battle.test.ts` | 1 · 3 | one `it` for the stamp (incl. the requeued copy = `base`) · four `it` for `wordsFromBoss` |
| `lib/core/arenaSummary.ts` | 2 · 4 | `ArenaSummary.firstMet` · `firstMetHe(n)` · `ArenaEndingKind` · `ArenaEnding` · `endingOf(state, elapsedMs)` · `wordsFromBossHe(n)` |
| `lib/core/arenaSummary.test.ts` | 2 · 4 | the `cast` helper gains `kind` (default `'known'`) · `firstMet` · `endingOf` · both formatters |
| `components/ArenaSummary.tsx` | 2 · 4 | the blue board (`data-arena-first-met`) · `ending` prop replaces `enemyDefeated` · heading + ending line · doc block updated |
| `components/ArenaSummary.test.ts` | 2 · 4 | source scan: `פגשת` present · `data-arena-first-met` present · `enemyDefeated` absent · `הפסדת` absent · `הקרב נגמר` absent |
| `app/dev/arcade/summary/page.tsx` | 2 · 4 | fixture casts carry `kind` (4 × `unfiltered` ⇒ the render's «4») · `ending` prop |
| `components/ArenaBattle.tsx` | 4 | `:483-485` `endingOf` instead of `outcomeAt` · `:636-641` `ending={ending}` |
| `docs/architecture-map.json` | 5 | regenerated (`npm run generate-map`) |
| `plan/50-tasks.md` · `plan/00-control.md` · `plan/30-architecture.md` · `docs/plan-*.md` | 5 | registers |

⛔ **Untouched, and the self-check greps it:** `lib/core/arenaWords.ts` · `lib/core/arcadeResult.ts`
· `components/ArenaResult.tsx` · `app/arcade/arcade-tokens.css` · `docs/api-contract.md` ·
`package.json` · `app/api/**`.

## Interfaces

```ts
// lib/core/battle.ts  (Task 1)
import type { ArenaWord, ArenaWordKind } from './arenaWords';   // ← `ArenaWordKind` is new here

export interface BattleCast {
  readonly wordId: string;
  readonly correct: boolean;
  readonly responseMs: number;
  readonly critical: boolean;
  /**
   * T-282 · `37 § 2` — the kind of the word AT CAST TIME. `cast` requeues a missed
   * `unfiltered` spell as `base` (`:216-217`), so `unfiltered` here marks exactly the
   * first meeting, once per word. ⛔ Read by `summarize`; ⛔ never sent to the API
   * (`ArenaBattle.tsx:501-508` builds `ArcadeAnswer` by field).
   */
  readonly kind: ArenaWordKind;
}

// lib/core/battle.ts  (Task 3)
/**
 * T-283 · `37 § 9` ח4 — how many more CORRECT casts, at any speed, would have emptied the
 * enemy's bar: `ceil(enemyHp / hitDamage)`. `0` once the enemy is down.
 * ⛔ `hitDamage`, ⛔ not `criticalDamage` (RULES § 0.22 call, logged in the build report):
 * «היית N מילים מהבוס» must stay true WITHOUT a condition on speed — N slow correct
 * answers always finish the enemy, N fast ones is a promise about tempo the learner
 * cannot verify. Never divides by zero: `§ 7` fence 3 keeps `hitDamage ≥ 1`, and the
 * `Math.max` guards an unknown row anyway.
 */
export function wordsFromBoss(state: BattleState): number;

// lib/core/arenaSummary.ts  (Task 2)
export interface ArenaSummary {
  readonly total: number;
  readonly correct: number;
  readonly meanResponseMs: number;
  readonly bestStreak: number;
  readonly slow: readonly BattleCast[];
  /** T-282 · `37 § 10` — casts on `unfiltered` words, first cast per `wordId`, right or wrong. */
  readonly firstMet: readonly BattleCast[];
}
/** «פגשת 4 מילים חדשות» (render `:637`) · «פגשת מילה אחת חדשה» for 1. ⛔ Never called with 0 — the board is not drawn. */
export function firstMetHe(n: number): string;

// lib/core/arenaSummary.ts  (Task 4)
import { outcomeAt, wordsFromBoss, type BattleCast, type BattleOutcome, type BattleState } from './battle';

export type ArenaEndingKind = Exclude<BattleOutcome, 'running'>;   // 'victory' | 'survived' | 'outlasted'
export interface ArenaEnding {
  readonly kind: ArenaEndingKind;
  /** `wordsFromBoss(state)` at the end. `0` on `victory`. */
  readonly wordsFromBoss: number;
}
/** `null` while `outcomeAt` says `running` — the screen never draws a summary for a running battle. */
export function endingOf(state: BattleState, elapsedMs: number): ArenaEnding | null;
/** «היית 2 מילים מהבוס» (`37 § 9` ח4, verbatim shape) · «היית מילה אחת מהבוס» for 1. */
export function wordsFromBossHe(n: number): string;

// components/ArenaSummary.tsx  (Tasks 2 · 4)
export interface ArenaSummaryProps {
  readonly ending: ArenaEnding;                          // ← replaces `enemyDefeated: boolean`
  readonly summary: ArenaSummaryData;
  readonly headwords: Readonly<Record<string, string>>;
  readonly onBack: () => void;
}
// DOM hooks (for the walk and for any later DOM test):
//   [data-arena-first-met]  the blue board, present only when summary.firstMet.length > 0
//   [data-arena-ending]     the 12.5px line under the heading, present only when ending.kind !== 'victory'
```

**The three endings, every string, before any code (taste-skill § 4.9 copy audit):**

| `ending.kind` | `h1` (34 Black, gold-light, `:602`) | `[data-arena-ending]` (12.5 Medium ink-muted, `:603` slot) |
|---|---|---|
| `victory` | `היריב נוצח` (unchanged) | — (not rendered) |
| `outlasted` | `wordsFromBossHe(n)` → `היית N מילים מהבוס` | `החזקת מעמד עד סוף השעון` |
| `survived` | `wordsFromBossHe(n)` → `היית N מילים מהבוס` | `היריב החזיק מעמד` |

Why these two facts and ⛔ not others, measured against `outcomeAt` (`battle.ts:187-194`):
`outlasted` ⇔ clock ran out **and** the learner is alive with the higher share ⇒ «החזקת
מעמד עד סוף השעון» is true in every `outlasted` state. `survived` ⇔ learner HP ≤ 0 **or**
clock ran out with share ≤ enemy's ⇒ `enemyHp > 0` in every such state ⇒ «היריב החזיק
מעמד» is true in every `survived` state, including the tie. ⛔ Neither is praise, neither
is a verdict (R-016); neither carries a gendered form.

---

## Task 1: `lib/core/battle.ts` — every cast carries the word's kind (T-282 ⓑ)

**Files:**
- Modify: `lib/core/battle.ts:24` (import) · `:106-111` (`BattleCast`) · `:227` (the cast literal)
- Test: `lib/core/battle.test.ts` (append one `it` to the existing `describe` that holds
  `'⛔ \`casts[i]\` עדיין תואם ל-\`words[i]\` אחרי חזרה'`, `:286`)

**Interfaces:**
- Consumes: `ArenaWordKind` from `lib/core/arenaWords.ts:23`.
- Produces: `BattleCast.kind` — read by Task 2's `summarize`.

- [ ] **Step 1: Write the failing test** — append to `lib/core/battle.test.ts`, inside the
  `describe` that contains the `:286` test (it already has `word(n)` with `kind: 'base'`):

```ts
  it('T-282 — כל הטלה נושאת את סוג המילה ברגע ההטלה; העותק שחזר לזנב הוא `base`', () => {
    const words: readonly ArenaWord[] = [
      { ...word(1), kind: 'known' },
      { ...word(2), kind: 'unfiltered' },
    ];
    let s = startBattle(words);
    s = cast(s, 'אפשרות 1', 500);       // known, correct
    s = cast(s, 'לא נכון', 1_000);      // unfiltered, wrong ⇒ requeued as base at the tail
    s = cast(s, 'אפשרות 2', 1_500);     // the tail copy
    expect(s.casts.map((c) => c.kind)).toEqual(['known', 'unfiltered', 'base']);
    expect(s.casts.map((c) => c.wordId)).toEqual(['w1', 'w2', 'w2']);
  });
```

- [ ] **Step 2: Run it red** — `npx vitest run lib/core/battle.test.ts -t "T-282"`
  Expected: FAIL — `toEqual` receives `[undefined, undefined, undefined]` (and `tsc` in
  `verify` would reject `c.kind` — both are the same missing field).

- [ ] **Step 3: Implement** — in `lib/core/battle.ts`:
  - `:24` → `import type { ArenaWord, ArenaWordKind } from './arenaWords';`
  - `BattleCast` (`:106-111`) → add the `kind` field with the doc comment from
    **Interfaces** above.
  - `:227` → `casts: [...state.casts, { wordId: word.wordId, correct, responseMs, critical, kind: word.kind }],`

- [ ] **Step 4: Run it green, and the whole file** — `npx vitest run lib/core/battle.test.ts`
  Expected: every test passes, including the source scan (`kind` is not a banned token)
  and `'⛔ \`casts[i]\` עדיין תואם ל-\`words[i]\` אחרי חזרה'`. Then `npx tsc --noEmit`
  ⇒ **two** expected errors, and only two: `lib/core/arenaSummary.test.ts:5` and
  `app/dev/arcade/summary/page.tsx:32` build a `BattleCast` without `kind` — Task 2 fixes
  both. ⛔ Do not commit yet: a commit that breaks `tsc` is a red gate on the branch.

---

## Task 2: `lib/core/arenaSummary.ts` + `components/ArenaSummary.tsx` — the blue board (T-282 ⓐ ⓒ ⓓ)

**Files:**
- Modify: `lib/core/arenaSummary.ts:16-26` (`ArenaSummary`) · `:28-55` (`summarize`) · append `firstMetHe`
- Modify: `components/ArenaSummary.tsx:19-24` (doc block) · `:31-38` (props — unchanged in
  this task) · `:45` (strings) · after `:109` (the board)
- Modify: `app/dev/arcade/summary/page.tsx:32-63` (fixture)
- Test: `lib/core/arenaSummary.test.ts` · `components/ArenaSummary.test.ts`

**Interfaces:**
- Consumes: `BattleCast.kind` (Task 1).
- Produces: `ArenaSummary.firstMet`, `firstMetHe(n)` — read by the component in this task.

- [ ] **Step 1: Write the failing core tests** — in `lib/core/arenaSummary.test.ts`, replace
  the `cast` helper (`:5-7`) and add one `describe`:

```ts
import type { ArenaWordKind } from '@/lib/core/arenaWords';
import { firstMetHe, meanSecondsHe, summarize } from '@/lib/core/arenaSummary';

const cast = (wordId: string, correct: boolean, responseMs: number, kind: ArenaWordKind = 'known') => ({
  wordId, correct, responseMs, critical: correct && responseMs < CRITICAL_MS, kind,
});

describe('firstMet — T-282 · 37 § 10 · קריאה בלבד', () => {
  it('הטלות על מילים `unfiltered`, פעם אחת למילה, נכונות ושגויות כאחד', () => {
    const s = summarize([
      cast('a', true, 900),                       // known
      cast('b', false, 900, 'unfiltered'),        // met, wrong
      cast('c', true, 900, 'unfiltered'),         // met, right
      cast('b', true, 900, 'base'),               // the requeued copy — ⛔ not a second meeting
      cast('d', true, 900, 'base'),
    ]);
    expect(s.firstMet.map((c) => c.wordId)).toEqual(['b', 'c']);
  });

  it('⛔ מילה אחת ⛔ נספרת פעמיים גם אם הוטלה פעמיים כ-`unfiltered`', () => {
    const s = summarize([cast('b', false, 900, 'unfiltered'), cast('b', true, 900, 'unfiltered')]);
    expect(s.firstMet.map((c) => c.wordId)).toEqual(['b']);
  });

  it('⛔ אפס הטלות ⇒ רשימה ריקה, ⛔ לא undefined', () => {
    expect(summarize([]).firstMet).toEqual([]);
  });

  it('«פגשת 4 מילים חדשות» מהרנדר, ו«מילה אחת» ליחיד', () => {
    expect(firstMetHe(4)).toBe('פגשת 4 מילים חדשות');
    expect(firstMetHe(1)).toBe('פגשת מילה אחת חדשה');
  });
});
```

- [ ] **Step 2: Run red** — `npx vitest run lib/core/arenaSummary.test.ts`
  Expected: FAIL — `firstMet` undefined, `firstMetHe` not exported.

- [ ] **Step 3: Implement the core** — `lib/core/arenaSummary.ts`:

```ts
export interface ArenaSummary {
  // … the five existing fields, unchanged …
  /**
   * T-282 · `37 § 10` («פגשת 4 מילים חדשות») · `36 § 12.3` — the casts on `unfiltered`
   * words, first cast per `wordId`, right or wrong: a word the battle put in front of
   * the learner for the first time. ⛔ Read-only: this is what the screen NAMES, ⛔ not
   * what it writes anywhere. The requeued copy of a missed spell is `base` (`battle.ts:216`),
   * so it never counts twice; the `seen` set is the guard for any other duplicate.
   */
  readonly firstMet: readonly BattleCast[];
}

export function summarize(casts: readonly BattleCast[]): ArenaSummary {
  let correct = 0;
  let totalMs = 0;
  let bestStreak = 0;
  let run = 0;
  const slow: BattleCast[] = [];
  const firstMet: BattleCast[] = [];
  const seen = new Set<string>();

  for (const c of casts) {
    totalMs += c.responseMs;
    if (c.kind === 'unfiltered' && !seen.has(c.wordId)) {
      seen.add(c.wordId);
      firstMet.push(c);
    }
    if (c.correct) {
      correct += 1;
      run += 1;
      if (run > bestStreak) bestStreak = run;
      if (!c.critical) slow.push(c);
    } else {
      run = 0;
    }
  }

  const total = casts.length;
  return {
    total,
    correct,
    meanResponseMs: total === 0 ? 0 : Math.round(totalMs / total),
    bestStreak,
    slow,
    firstMet,
  };
}

/** «פגשת 4 מילים חדשות» — the render's own title (`render_video_B.py:637`). ⛔ The component ⛔ does not build the string. */
export function firstMetHe(n: number): string {
  return n === 1 ? 'פגשת מילה אחת חדשה' : `פגשת ${n} מילים חדשות`;
}
```

- [ ] **Step 4: Run green** — `npx vitest run lib/core/arenaSummary.test.ts`
  Expected: PASS, 8 tests (4 existing + 4 new).

- [ ] **Step 5: Write the failing component scan** — `components/ArenaSummary.test.ts`, add one `it`
  inside the existing `describe`:

```ts
  it('T-282 — הלוח הכחול: כותרת הרנדר, hook למדידה, ו⛔ אפס חישוב ברכיב', () => {
    expect(CODE).toMatch(/data-arena-first-met/);
    expect(CODE).toMatch(/firstMetHe\(/);
    expect(CODE).toMatch(/summary\.firstMet\.length > 0 &&/);
    // 12px, ⛔ not the render's 11.5 — Layer A floor (scripts/check-text-floor.mjs). A new
    // 11.5 would be a new baseline violation.
    expect((CODE.match(/text-\[11\.5px\]/g) ?? []).length).toBe(1);
  });
```

- [ ] **Step 6: Run red** — `npx vitest run components/ArenaSummary.test.ts -t "T-282"`
  Expected: FAIL on `data-arena-first-met`.

- [ ] **Step 7: Implement the board** — `components/ArenaSummary.tsx`:
  - `:4` → `import { firstMetHe, meanSecondsHe, type ArenaSummary as ArenaSummaryData } from '@/lib/core/arenaSummary';`
  - Doc block `:19-24`: replace the four-deviation sentence with the five-line version below.
  - After the red board's closing `)}` (`:109`), add:

```tsx
      {/* T-282 · הלוח הכחול — y=562 · h=66 · r=16 · BRAND (`render_video_B.py:633-640`).
          ⛔ קריאה בלבד (`36 § 12.3`): הלוח **נוקב** במילים שהקרב הראה לראשונה, ו⛔ אינו
          עושה בהן דבר. ⛔ מוצג אך ורק כש-N>0 — אותו כלל של הלוח האדום. שורת השמות יושבת
          במשבצת של `הוסף לכרטיסיות` (`:639`) כי חצי הכתיבה חסום (`03-for-roy` 105), ובגודל
          12px ⛔ ולא 11.5 — רצפת שכבה א׳ (`scripts/check-text-floor.mjs`). ⛔ אין `○`. */}
      {summary.firstMet.length > 0 && (
        <div data-arena-first-met className={`${PANEL_CLASS} border border-brand bg-brand/15`}>
          <p className="text-end text-[14px] font-bold text-ink">
            {firstMetHe(summary.firstMet.length)}
          </p>
          <p className="text-end text-[12px] leading-relaxed text-ink">
            {summary.firstMet.map((c, i) => (
              <span key={c.wordId}>
                {i > 0 && ' · '}
                <EnWord>{headwords[c.wordId] ?? c.wordId}</EnWord>
              </span>
            ))}
          </p>
        </div>
      )}
```

  Doc-block replacement for `:19-24`:

```
 * ⛔ **הבלוקים שהרנדר מצייר ו⛔ אינם כאן, וכל אחד סטייה מוצהרת ⛔ ולא שכחה** — § 7 של
 * `docs/superpowers/plans/2026-08-27-arena-slice-c-results-and-idle.md` נושא את המספרים:
 * ⓐ `רמת זירה 7 · +48 XP` (`:604`) — ⛔ אין כלל XP ו⛔ אין עמודה (F-151) · ⓑ `תיבת ניצחון`
 * (`:606-617`) — אותו שורש · ⓒ **הלוח הכחול `פגשת 4 מילים חדשות` (`:631-640`) — נבנה
 * ב-T-282 כקריאה בלבד**; ⛔ מה שעדיין אינו כאן הוא בקרת ה-`○` והשורה `הוסף לכרטיסיות`,
 * שתיהן חצי הכתיבה של `03-for-roy` פריט 105 · ⓓ ה-CTA `הוסף הכול וחזור לזירה` (`:643`) —
 * אותו פריט 105, ולכן ה-CTA נשלח כ-`חזרה לזירה` (מחרוזת ממשק, ⛔ לא תוכן לימודי).
```

- [ ] **Step 8: The fixture** — `app/dev/arcade/summary/page.tsx`:
  - `:5` → `import { CRITICAL_MS, type BattleCast } from '@/lib/core/battle';` stays; add
    `import type { ArenaWordKind } from '@/lib/core/arenaWords';`
  - `:32-37` →

```ts
const cast = (n: number, correct: boolean, responseMs: number, kind: ArenaWordKind = 'known'): BattleCast => ({
  wordId: `w${n}`,
  correct,
  responseMs,
  critical: correct && responseMs < CRITICAL_MS,
  kind,
});
```

  - Mark **four** casts `'unfiltered'` so the board prints the render's own «4»
    (`render_video_B.py:637`): `cast(3, true, 1_200, 'unfiltered')` ·
    `cast(7, true, 1_200, 'unfiltered')` · `cast(11, true, 1_200, 'unfiltered')` ·
    `cast(15, true, 1_200, 'unfiltered')`. ⛔ Not the slow ones (2 · 8 · 14) — a word on both
    boards is a real state, but the fixture should show each board's own words so the walk
    counts them apart.
  - `HEADWORDS` → add `w3: 'Lorem3', w7: 'Lorem7', w11: 'Lorem11', w15: 'Lorem15'`.
  - Update the fixture comment (`:39`) to say «4 × unfiltered ⇒ הלוח הכחול מציג 4».

- [ ] **Step 9: Run green, typecheck, both scans** —
  `npx vitest run lib/core/arenaSummary.test.ts components/ArenaSummary.test.ts lib/core/battle.test.ts && npx tsc --noEmit`
  Expected: all green, `tsc` **0 errors** (the two Task 1 errors are gone).

- [ ] **Step 10: Commit T-282** —
  `./scripts/g add lib/core/battle.ts lib/core/battle.test.ts lib/core/arenaSummary.ts lib/core/arenaSummary.test.ts components/ArenaSummary.tsx components/ArenaSummary.test.ts app/dev/arcade/summary/page.tsx && ./scripts/g commit -m "loop(DEV): C-XXXX T-282 arena results name the words met for the first time (read-only blue board, 37 § 10)"`

---

## Task 3: `lib/core/battle.ts` — `wordsFromBoss` (T-283 ⓐ, the number)

**Files:**
- Modify: `lib/core/battle.ts` — append after `outcomeAt` (`:194`)
- Test: `lib/core/battle.test.ts` — new `describe`

**Interfaces:**
- Consumes: `BattleState.enemyHp` · `BattleState.stats.hitDamage` (T-281).
- Produces: `wordsFromBoss(state): number` — read by Task 4's `endingOf`.

- [ ] **Step 1: Write the failing tests** — append to `lib/core/battle.test.ts` (add
  `wordsFromBoss` to the import list from `./battle`):

```ts
describe('wordsFromBoss — T-283 · 37 § 9 ח4', () => {
  it('שורת הבסיס: 20 חיים ÷ פגיעה 1 = 20 מילים; אחרי קריטי (2) — 18', () => {
    expect(wordsFromBoss(FRESH)).toBe(ENEMY_HP);
    const afterCritical = cast(FRESH, 'אפשרות 1', 500);
    expect(wordsFromBoss(afterCritical)).toBe(ENEMY_HP - BASE_STATS.criticalDamage);
  });

  it('קוסם (פגיעה 2): 20 חיים = 10 מילים — המספר נגזר מ-`state.stats`, ⛔ לא מקבוע', () => {
    const wizard = startBattle([word(1), word(2)], 'wizard');
    expect(wordsFromBoss(wizard)).toBe(Math.ceil(ENEMY_HP / CHARACTER_STATS.wizard.hitDamage));
  });

  it('עיגול כלפי מעלה: 3 חיים ÷ פגיעה 2 = 2 מילים, ⛔ לא 1.5', () => {
    const s = { ...startBattle([word(1)], 'wizard'), enemyHp: 3 };
    expect(wordsFromBoss(s)).toBe(2);
  });

  it('היריב נוצח ⇒ 0, ⛔ לעולם לא שלילי', () => {
    expect(wordsFromBoss({ ...FRESH, enemyHp: 0 })).toBe(0);
    expect(wordsFromBoss({ ...FRESH, enemyHp: -3 })).toBe(0);
  });

  it('⛔ אין חלוקה באפס גם על שורה שבורה', () => {
    const s = { ...FRESH, stats: { ...BASE_STATS, hitDamage: 0 } };
    expect(wordsFromBoss(s)).toBe(ENEMY_HP);
  });
});
```

- [ ] **Step 2: Run red** — `npx vitest run lib/core/battle.test.ts -t "wordsFromBoss"`
  Expected: FAIL — `wordsFromBoss` is not exported.

- [ ] **Step 3: Implement** — `lib/core/battle.ts`, after `outcomeAt`:

```ts
/**
 * T-283 · `37 § 9` ח4 — «היית 2 מילים מהבוס». How many more CORRECT casts, at any speed,
 * would have emptied the enemy's bar: `ceil(enemyHp / hitDamage)`. `0` once the enemy is
 * down. ⛔ `hitDamage`, ⛔ not `criticalDamage` (RULES § 0.22 call, logged in the build
 * report): the sentence must stay true WITHOUT a condition on speed — N slow correct
 * answers always finish the enemy; N fast ones is a promise about tempo. ⛔ Never divides
 * by zero: `§ 7` fence 3 keeps `hitDamage ≥ 1`, and `Math.max` guards an unknown row.
 */
export function wordsFromBoss(state: BattleState): number {
  if (state.enemyHp <= 0) return 0;
  return Math.ceil(state.enemyHp / Math.max(1, state.stats.hitDamage));
}
```

- [ ] **Step 4: Run green** — `npx vitest run lib/core/battle.test.ts`
  Expected: PASS, whole file (the source scan does not ban `boss`).

---

## Task 4: the ending — `endingOf`, the heading, `ArenaBattle` wiring (T-283 ⓐ ⓑ ⓓ ⓔ)

**Files:**
- Modify: `lib/core/arenaSummary.ts` (imports `:14` · append the ending block)
- Modify: `components/ArenaSummary.tsx:31-38` (props) · `:40-41` (strings) · `:65-68` (heading)
- Modify: `components/ArenaBattle.tsx:16` (import) · `:483-485` · `:636-641`
- Modify: `app/dev/arcade/summary/page.tsx:65-74` (fixture prop)
- Test: `lib/core/arenaSummary.test.ts` · `components/ArenaSummary.test.ts`

**Interfaces:**
- Consumes: `outcomeAt` (`battle.ts:187`) · `wordsFromBoss` (Task 3).
- Produces: `ArenaEndingKind` · `ArenaEnding` · `endingOf` · `wordsFromBossHe` — read by
  `ArenaSummary.tsx` and `ArenaBattle.tsx`.

- [ ] **Step 1: Write the failing core tests** — `lib/core/arenaSummary.test.ts`, add
  imports `import { BATTLE_MS, CRITICAL_MS, ENEMY_HP, startBattle, type BattleState } from '@/lib/core/battle';`
  and `endingOf, wordsFromBossHe` from `@/lib/core/arenaSummary`, then:

```ts
describe('endingOf — T-283 · 37 § 9 ח4 · 37 § 3', () => {
  const fresh = (): BattleState =>
    startBattle([{ wordId: 'w1', headword: 'Lorem1', translationHe: 'אפשרות 1', kind: 'base' }]);

  it('קרב רץ ⇒ null — ⛔ אין סיכום לקרב שלא נגמר', () => {
    expect(endingOf(fresh(), 0)).toBeNull();
    expect(endingOf(fresh(), BATTLE_MS - 1)).toBeNull();
  });

  it('היריב ב-0 ⇒ victory, ו-wordsFromBoss = 0', () => {
    expect(endingOf({ ...fresh(), enemyHp: 0 }, 10_000)).toEqual({ kind: 'victory', wordsFromBoss: 0 });
  });

  it('הלומד ב-0 ⇒ survived, והפער הוא חיי היריב שנותרו', () => {
    expect(endingOf({ ...fresh(), learnerHp: 0, enemyHp: 7 }, 10_000)).toEqual({ kind: 'survived', wordsFromBoss: 7 });
  });

  it('השעון נגמר, אחוז חיים גבוה יותר ⇒ outlasted, והפער עדיין נקוב', () => {
    const s = { ...fresh(), learnerHp: 10, enemyHp: 15 };     // 10/12 > 15/20
    expect(endingOf(s, BATTLE_MS)).toEqual({ kind: 'outlasted', wordsFromBoss: 15 });
  });

  it('השעון נגמר, תיקו באחוזים ⇒ survived (§ 3: «מנצח אחוז החיים הגבוה», ⛔ לא השווה)', () => {
    const s = { ...fresh(), learnerHp: 6, enemyHp: 10 };       // 6/12 = 10/20
    expect(endingOf(s, BATTLE_MS)?.kind).toBe('survived');
  });

  it('«היית 2 מילים מהבוס» — נוסח § 9 ח4 מילה במילה, ו«מילה אחת» ליחיד', () => {
    expect(wordsFromBossHe(2)).toBe('היית 2 מילים מהבוס');
    expect(wordsFromBossHe(ENEMY_HP)).toBe(`היית ${ENEMY_HP} מילים מהבוס`);
    expect(wordsFromBossHe(1)).toBe('היית מילה אחת מהבוס');
  });
});
```

- [ ] **Step 2: Run red** — `npx vitest run lib/core/arenaSummary.test.ts -t "endingOf"`
  Expected: FAIL — `endingOf` not exported.

- [ ] **Step 3: Implement the core** — `lib/core/arenaSummary.ts`:
  - `:14` → `import { outcomeAt, wordsFromBoss, type BattleCast, type BattleOutcome, type BattleState } from './battle';`
    (⚠️ a **value** import now, not `import type` — `arenaSummary.ts` already lives in
    `lib/core` and `battle.ts` is pure, so `check:core` stays green.)
  - Append:

```ts
/**
 * T-283 · `37 § 9` ח4 · D-202 § ה׳ — **the ending is three states, ⛔ not a boolean.**
 * `battle.ts:104` already knows `victory` · `survived` · `outlasted`; until T-283 the screen
 * folded the last two into `הקרב נגמר`. ⛔ `running` is not an ending: `endingOf` returns
 * `null` and the screen never draws a summary for it.
 */
export type ArenaEndingKind = Exclude<BattleOutcome, 'running'>;

export interface ArenaEnding {
  readonly kind: ArenaEndingKind;
  /** `wordsFromBoss(state)` at the end — the number the heading names. `0` on `victory`. */
  readonly wordsFromBoss: number;
}

export function endingOf(state: BattleState, elapsedMs: number): ArenaEnding | null {
  const outcome = outcomeAt(state, elapsedMs);
  if (outcome === 'running') return null;
  return { kind: outcome, wordsFromBoss: wordsFromBoss(state) };
}

/** `37 § 9` ח4, verbatim shape: «היית 2 מילים מהבוס». ⛔ The word «הפסדת» exists nowhere in this file. */
export function wordsFromBossHe(n: number): string {
  return n === 1 ? 'היית מילה אחת מהבוס' : `היית ${n} מילים מהבוס`;
}
```

- [ ] **Step 4: Run green** — `npx vitest run lib/core/arenaSummary.test.ts && npm run check:core`
  Expected: PASS (14 tests) · `check:core` green.

- [ ] **Step 5: Write the failing component scan** — `components/ArenaSummary.test.ts`, one `it`:

```ts
  it('T-283 — שלושה סיומים, ⛔ לא בוליאני; ⛔ «הפסדת» ו⛔ «הקרב נגמר» אינם על המסך', () => {
    expect(CODE).not.toMatch(/enemyDefeated/);
    expect(CODE).not.toMatch(/הפסדת/);
    expect(CODE).not.toMatch(/הקרב נגמר/);
    expect(CODE).toMatch(/ending\.kind === 'victory'/);
    expect(CODE).toMatch(/wordsFromBossHe\(/);
    expect(CODE).toMatch(/data-arena-ending/);
    expect(CODE).toContain('החזקת מעמד עד סוף השעון');
    expect(CODE).toContain('היריב החזיק מעמד');
  });
```

- [ ] **Step 6: Run red** — `npx vitest run components/ArenaSummary.test.ts -t "T-283"`
  Expected: FAIL on `enemyDefeated` still present.

- [ ] **Step 7: Implement the heading** — `components/ArenaSummary.tsx`:
  - `:4` → `import { firstMetHe, meanSecondsHe, wordsFromBossHe, type ArenaEnding, type ArenaSummary as ArenaSummaryData } from '@/lib/core/arenaSummary';`
  - Props (`:31-38`): replace `readonly enemyDefeated: boolean;` with
    `/** T-283 — three endings, ⛔ not a boolean. Computed by \`endingOf\` in \`lib/core\`. */ readonly ending: ArenaEnding;`
    and the destructuring `enemyDefeated,` → `ending,`.
  - Strings (`:40-41`):

```ts
const WON_HE = 'היריב נוצח';
// T-283 · `37 § 9` ח4 · R-016 — two FACTS, ⛔ not verdicts, each true in every state of its
// kind (`battle.ts:187-194`): `outlasted` ⇔ alive at the clock with the higher share;
// `survived` ⇔ the enemy still has HP. ⛔ `הפסדת` is not a word this file knows.
const OUTLASTED_HE = 'החזקת מעמד עד סוף השעון';
const SURVIVED_HE = 'היריב החזיק מעמד';
```

  - Heading (`:65-68`) → the render's two slots, y=128 (34 Black) and y=160 (12.5 Medium
    INK_MUTED, `render_video_B.py:602-603`): 32px centre-to-centre ⇒ `gap-0.5` under a
    `leading-tight` 34px line.

```tsx
      {/* ‏y=128 · 34 Black · GOLD_LIGHT (`:602`) + ‏y=160 · 12.5 Medium · INK_MUTED (`:603`).
          ⛔ אין שבח ואין נזיפה (R-016): ניצחון = עובדה על היריב; כל סיום אחר = **מספר**
          (`37 § 9` ח4) ועובדה אחת על איך נגמר. ⛔ המילה «הפסדת» ⛔ אינה כאן. */}
      <header className="flex flex-col items-center gap-0.5">
        <h1 className="text-center text-[34px] font-black leading-tight text-[color:var(--arena-gold-light)]">
          {ending.kind === 'victory' ? WON_HE : wordsFromBossHe(ending.wordsFromBoss)}
        </h1>
        {ending.kind !== 'victory' && (
          <p data-arena-ending className="text-center text-[12.5px] font-medium text-ink-muted">
            {ending.kind === 'outlasted' ? OUTLASTED_HE : SURVIVED_HE}
          </p>
        )}
      </header>
```

- [ ] **Step 8: Wire `ArenaBattle.tsx`** —
  - `:16` → `import { endingOf, summarize } from '@/lib/core/arenaSummary';`
  - `:483-485` →

```ts
  const ending =
    battle === null ? null : endingOf(battle, timeUp ? BATTLE_MS : elapsedRef.current);
  const finished = ending !== null;
```

    Keep the T-231 ⓓ comment above it. `outcomeAt` leaves the import list at `:24` only
    if nothing else in the file uses it — `grep -n 'outcomeAt' components/ArenaBattle.tsx`
    must print **0** lines after the edit, else leave the import.
  - `:619` `if (finished) {` → `if (ending !== null) {` (same truth, and TypeScript narrows
    `ending` for the prop below).
  - `:636-641` → `<ArenaSummary ending={ending} summary={summarize(battle.casts)} headwords={Object.fromEntries(headwords)} onBack={again} />`.
    `<ArenaResult enemyDefeated={outcome.enemyDefeated} …>` **stays** — not this row.

- [ ] **Step 9: The fixture** — `app/dev/arcade/summary/page.tsx:65-74` →
  `<ArenaSummary ending={{ kind: 'victory', wordsFromBoss: 0 }} summary={summarize(FIXTURE)} headwords={HEADWORDS} onBack={() => {}} />`
  (the render draws `ניצחון`, and the fixture keeps matching the render).
  Add `import type { ArenaEnding } from '@/lib/core/arenaSummary';` only if you type the
  literal separately; the inline literal needs no import.

- [ ] **Step 10: Run green, typecheck** —
  `npx vitest run lib/core components/ArenaSummary.test.ts components/ArenaBattle.test.ts components/ArenaBattle.dom.test.tsx && npx tsc --noEmit`
  Expected: all green, 0 type errors, `grep -rn 'enemyDefeated' components/ArenaSummary.tsx app/dev/arcade/summary/page.tsx` ⇒ 0 lines.

- [ ] **Step 11: Commit T-283** —
  `./scripts/g add lib/core/battle.ts lib/core/battle.test.ts lib/core/arenaSummary.ts lib/core/arenaSummary.test.ts components/ArenaSummary.tsx components/ArenaSummary.test.ts components/ArenaBattle.tsx app/dev/arcade/summary/page.tsx && ./scripts/g commit -m "loop(DEV): C-XXXX T-283 arena ending names the gap (37 § 9 ח4) — three endings, not a boolean"`

---

## Task 5: the walk, the map, the registers, the gate (STEP 6.5 · STEP 7)

**Files:** Modify `plan/50-tasks.md` (`T-282` · `T-283` ⇒ 🟣), `plan/00-control.md`,
`plan/30-architecture.md` (one paragraph under the arena: «`BattleCast` carries the kind at
cast time; the ending is three states computed in core»), regenerate `docs/plan-open.md` ·
`docs/plan-tables.md` · `docs/architecture-map.json`.

- [ ] **Step 1: The walk (D-103)** — `(npx next dev -p 3000 &) && sleep 25`, then a Playwright
  script at **375×780** on `http://127.0.0.1:3000/dev/arcade/summary`. Record: `h1` text ·
  total characters · tappable count · elements under 44px · horizontal scroll · console
  errors · `[data-arena-first-met]` present with **4** `<EnWord>` · `[data-arena-slow]`
  present with 3 · `[data-arena-ending]` **absent** (fixture is `victory`). Baseline from
  C-0510: **203 chars · 2 tappable · 0 < 44px · 0 h-scroll**. Expected after: chars **> 203**
  (the board adds ≈ 45), tappable **unchanged at 2**, 0 · 0.
  ⚠️ The fixture is `victory` (it matches the render), so the walk ⛔ cannot show the
  non-victory heading; those strings are covered by Task 4 Step 1 (core) and Step 5
  (source scan). The walk records `[data-arena-ending]` **absent**, and the report says
  so in one line — ⛔ do not swap the fixture to a loss to "see it": the fixture is what
  `check:mobile` measures against the render.

- [ ] **Step 2: The map** — `grep -q '"generate-map"' package.json && npm run generate-map || echo '⛔ generate-map not in package.json yet (T-235) — skipped, not failed'`
  ⇒ `docs/architecture-map.json` regenerated (D-165, same commit as the code).

- [ ] **Step 3: The registers** — `T-282` and `T-283` status cells ⇒ `🟣 **C-XXXX (DEV) — …**`
  with the numbers from Task 2 Step 9, Task 4 Step 10 and the walk; then
  `npm run measure:plan` (both `docs/plan-*.md` in the same commit, `RULES § 0.1 ח׳`).
  Tick every `- [ ]` in this file that closed. Log the one `RULES § 0.22` call:
  «`wordsFromBoss` divides by `hitDamage`, ⛔ not `criticalDamage`».

- [ ] **Step 4: The gate** — `npm run verify` (five commands, `check:mobile` included).
  Paste the exact tail into the report. Red ⇒ fix in this tick; still red ⇒
  `./scripts/g revert` both task commits + a debt line in `30-architecture.md`.

- [ ] **Step 5: Commit and push** — release the lock in `plan/00-control.md` (`LOCK_HELD_BY: ""`,
  `NEXT_AGENT: CRITIC`, `LAST_HANDOFF_AT` from `date -u`), then
  `./scripts/g commit -m "loop(DEV): C-XXXX close — T-282 · T-283 🟣, registers, map" && ./scripts/g push origin work/current`
  (the pre-push hook re-runs `npm run verify` and writes the attestation note — check 16).

---

## Self-check (before the build tick calls this plan done)

- [ ] `grep -n 'kind' lib/core/battle.ts | grep -c 'casts:'` ⇒ 1 (the stamp is in the cast literal).
- [ ] `grep -rn 'enemyDefeated' components/ArenaSummary.tsx app/dev/arcade/summary/page.tsx` ⇒ 0 lines.
- [ ] `grep -rn 'הפסדת\|הקרב נגמר' components/ArenaSummary.tsx lib/core/arenaSummary.ts` ⇒ 0 lines.
- [ ] `grep -c 'text-\[11.5px\]' components/ArenaSummary.tsx` ⇒ 1 (unchanged — the new board is 12px).
- [ ] `grep -rn 'apiPost\|fetch(\|word_progress' components/ArenaSummary.tsx lib/core/arenaSummary.ts` ⇒ 0.
- [ ] `grep -rn 'xp\|score\|streak' components/ArenaSummary.tsx` ⇒ only the existing `bestStreak` row (`רצף מרבי`, T-180) — ⛔ nothing new (F-151).
- [ ] `./scripts/g diff --stat origin/dev -- lib/core/arenaWords.ts lib/core/arcadeResult.ts components/ArenaResult.tsx app/arcade/arcade-tokens.css docs/api-contract.md package.json` ⇒ empty.
- [ ] `npm run check:text-floor` green with `scripts/text-floor-baseline.md` **unchanged**.
- [ ] The report names: `[SKILL: taste-skill]` (`skills/taste-skill/SKILL.md`) loaded before Task 1, and the § 4.9 copy audit result for the **five** new strings in `lib/core/arenaSummary.ts` and `components/ArenaSummary.tsx` (`פגשת N מילים חדשות` · `פגשת מילה אחת חדשה` · `היית N מילים מהבוס` · `החזקת מעמד עד סוף השעון` · `היריב החזיק מעמד`).
- [ ] The report carries the one `RULES § 0.22` line: `wordsFromBoss` in `lib/core/battle.ts` divides by `hitDamage`, not `criticalDamage`.
