# Arena character bias as battle numbers (`37 § 7`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (or
> `superpowers:subagent-driven-development`). Every step is a `- [ ]` and closes only
> after a fresh run whose output goes into the tick report.

**Written:** C-0506 (DEV, 📝 planning tick) · 2026-09-08T14:35Z (`date -u`)
**Built:** —

**Covers:** **T-281** — the character choice stops being a skin: the bias becomes a
number in battle. **המשך של: T-217** (the choice screen, `ArenaCharacterChoice.tsx`,
`ArenaShell.tsx`, `ArenaHome.tsx` — this plan reads what T-217 persisted and feeds it
into the engine) and of **T-176** (`lib/core/battle.ts`, the one owner of battle law —
this plan moves two component constants into it). ⚠️ **One row and ⛔ not two-to-four,
and the reason is measured ⛔ and not preferred:** `docs/plan-open.md` (balance table,
this clone) counts **one** ⬜ row in `ACTIVE_WORKSTREAM: arena` — `T-281`. `T-220` and
`T-234` are 🟣 since C-0505. ⇒ `T-281` is the one row a DEV tick can plan today.

**Goal:** `startBattle` receives the learner's character and the four numbers of the
`37 § 7` table (`LEARNER_HP` · `HIT_DAMAGE` · `CRITICAL_DAMAGE` · `SWING_PENALTY`) come
from **one table at the head of `lib/core/battle.ts`**, keyed by character, with the base
row for `null` / unknown. `ArenaBattle.tsx:137-138` loses its two constants. The
learner-facing screen **does not change**: the bias lines stay words, the HP bar still
draws a percent, and no number appears on the choice screen (`§ 7`: «בלי טבלאות מספרים
בכניסה ראשונה»).

**What it buys the learner, in numbers (D-120, from the row):** from **0 to 5** of the 10
bias lines actually honoured by the battle — קוסם kills 20 enemy HP in **7 fast answers
instead of 10** and deals **2 instead of 1** on a slow answer; לוחם survives **18 swings
instead of 12** and a wrong answer ⛔ **no longer** strengthens the next swing. The
missing number is said out loud: **5 of 10 stay words** (see the table below), and all
five depend on `§ 4` abilities that are ⛔ not built — ⛔ not this slice.

**Architecture:** the three layers the repo already enforces. The **rule** lives in
`lib/core/battle.ts` (pure — ⛔ zero React/DOM/network/clock): the stats table, the
base row, `statsFor`, and a `stats` field on `BattleState` so `cast` reads the damage and
the penalty from the state it was given, ⛔ never from a module constant. The
**component draws and ⛔ does not compute**: `ArenaBattle.tsx` passes the `character`
prop it already receives (T-217) into `startBattle` and stops knowing any HP number.
⛔ **Zero new endpoint, zero migration, zero new screen, zero new route** (D-152 ·
`PATCH /api/arcade/character` exists since C-0502).

**Tech Stack:** Next 16 App Router · React client components · TypeScript (⛔ no `any`) ·
Tailwind · Vitest · Playwright (`npm run check:mobile`).

**Spec:** `plan/37-arena-spec.md` § 7 («ההטיה כמספרים», the numeric table and its four
fences, written C-0503 from D-200) · § 3 (`BATTLE_MS` · `ENEMY_SWING_MS`) · § 4 (mana,
the abilities that are ⛔ not built) · § 5 (damage from speed, penalty on a miss) · § 13.1
(the arena never writes `word_progress`) · **D-200** (the decision) · **D-152** (⛔ no
migration, one jsonb key) · `plan/36-video-spec.md` § 14.4 (how the render binds).

🎯 **The render this slice targets: `docs/design/kol-B-03-battle.png`**, drawn by
`docs/design/render_video_B.py` (`screen_battle`, `render_video_B.py:475` for the HP
text). ⚠️ **This plan changes ⛔ no pixel of it, and that is measured, ⛔ not assumed:**
`render_video_B.py:475` prints `f"{int(st['hp']*100)}/100"` — a **percent** — and
`ArenaBattle.tsx:687` already draws `Math.round(enemyHp / enemyHpMax * 100)`. A learner
with 18 HP and a learner with 12 HP both start at `100/100`; the bias changes **how fast
the bar moves**, ⛔ not what the bar is. **הרנדר מחייב — layout and finish alike**
(`36 § 14.4`), and **שכבה A (Layer A) is the only carve-out**; ⛔ nothing in this slice
touches either, because nothing in it is drawn.

## Global Constraints

- ⛔ **`36 § 14.4`: הרנדר מחייב גם בגימור.** «The finish comes from the constitution» is
  ⛔ **not** an answer to a gap. **שכבה A — contrast ≥4.5:1 · 44px target · ⛔ no state in
  colour alone — is the ONLY carve-out.** This slice draws nothing new; the build tick
  still walks `/dev/arcade` at 375×780 (STEP 6.5) and records that the screen is
  unchanged.
- ⛔ **The four fences of `37 § 7`, each with its own test (Task 1):**
  1. **The bias ⛔ never touches how much English the learner meets.** `BATTLE_MS` ·
     `MANA_MS` · `MANA_CAP` · `CRITICAL_MS` · `ENEMY_SWING_MS` · the `§ 2` word mix · what
     counts as correct — **identical for the three characters, always.** The stats
     record carries **exactly four keys**, and the only per-character reads in the engine
     are those four.
  2. **`LEARNER_HP ≥ 12` for every character.** `BATTLE_MS / ENEMY_SWING_MS = 11` swings at
     `SWING_DAMAGE = 1` ⇒ anything below 12 loses a clean 90-second battle without one
     mistake — a punishment for a choice the learner could not understand.
  3. **`CRITICAL_DAMAGE > HIT_DAMAGE` for every character** — otherwise `§ 5` («הנזק
     נגזר ממהירות התשובה») dies in one character and ⛔ nobody measures it.
  4. **The numbers live in `lib/core/`, ⛔ not in a component.** An unknown or `null`
     character ⇒ **the base row**, ⛔ never a throw.
- ⛔ **The numbers are the `§ 7` table, verbatim** — the test parses the markdown table
  out of `plan/37-arena-spec.md` and compares; ⛔ nothing here is typed from memory.
- `lib/core/` is PURE: ⛔ zero React, `window`, `document`, `localStorage`, `fetch`,
  `process.env`, `Date.now`, `Math.random`. `import type` from `./arenaCharacter` only.
- `37 § 13.1` — the arena ⛔ never writes `word_progress`. This slice writes ⛔ nothing
  anywhere: ⛔ no table, ⛔ no column, ⛔ no endpoint.
- Every learner-facing string is **Hebrew, RTL**. ⚠️ **This slice adds ⛔ zero
  learner-facing strings**, and the test asserts the bias lines are byte-for-byte what
  T-217 shipped. The character keys (`wizard` · `warrior` · `armorer`) are storage
  values, ⛔ never text on screen.
- ⛔ **A fixture that differs from production data in any dimension is a hole, ⛔ not a
  test** (DEV.md STEP 5, 23/08). ⇒ `startBattle` **loses** its two numeric parameters:
  a test can ⛔ no longer start a battle at `20/10` or `3/20`. Every existing assertion in
  `battle.test.ts` was re-read against the base row (12 / 20) below, and every one
  still holds with the same expected value — that re-read is Task 1 Step 3.
- **`RULES § 0.22` — decisions this plan takes alone, each logged in the tick report:**
  ⓐ the stats table lives in `battle.ts` (the row: «ראש `battle.ts`»), ⛔ not in
  `arenaCharacter.ts`, which stays the **words** file — `lib/core/arenaCharacter.ts` is
  ⛔ not modified (module boundary);
  ⓑ `ENEMY_HP = 20` moves into `battle.ts` as one exported constant, ⛔ not into the
  per-character record — fence 1 says the enemy is the same enemy for all three;
  ⓒ the record type is named `CharacterBattleStats` and its keys are the `§ 7` column
  names in camelCase (`learnerHp` · `hitDamage` · `criticalDamage` · `swingPenalty`).

---

## What `T-281` names that this slice ⛔ does NOT build, and why

| Item | Status | Ground |
|---|---|---|
| **ⓑ a way to change the character from the arena home** | ✅ **already built by T-217 (C-0502), measured in this clone ⛔ not assumed** | `components/ArenaHome.tsx:389-393` — `<button … onClick={() => onDesign(state)}>{DESIGN_HE}</button>` with `DESIGN_HE = 'עיצוב דמות'` (`:91`); `components/ArenaShell.tsx:41-46` — `onDesign` sets `next='home'` and opens `'character'`; `:52-57` — `ArenaCharacterChoice` receives `onBack` when a character exists. **Tests already pin it:** `components/ArenaHome.test.ts:103-107` («`עיצוב דמות` is live … calls onDesign»), `components/ArenaShell.test.ts:13-18`. The row's own measurement («`ArenaHome.tsx:289` draws the character without a path back») was taken at C-0503 on a clone that predated the C-0502 merge, or read the pedestal line alone. ⇒ **Task 0 re-measures and reports; ⛔ zero code.** Filed as **F-205** (register drift). |
| «מאנה מהירה יותר» (קוסם) | ⛔ **out, by spec** | `37 § 7`: «⛔ טרם, ⛔ ולא הבטחה» — `MANA_MS` is fence 1 (identical for all). The line stays a **word** on the choice screen. |
| «חיים נמוכים» (קוסם) | ⛔ **out, by spec** | Blocked by fence 2 (`LEARNER_HP ≥ 12`). קוסם keeps 12 = base. |
| «יכולות מתקררות מהר» · «ירי מטווח» (שריונאי) | ⛔ **out, by spec** | Depend on `§ 4` / `§ 8` abilities that are ⛔ not built (`grep -rn 'הקפאה\|ריפוי\|cooldown' lib components app` ⇒ 0, D-200 § א׳). שריונאי = base, «מאוזן». |
| «מגן מובנה» (לוחם) | ✅ **as `SWING_PENALTY 1 ⇒ 0`**, ⛔ nothing more | That is what the `§ 7` table assigns it. ⛔ No shield ability, ⛔ no mana. |
| A mana ability, a cooldown, a ranged shot | ⛔ **out** | `§ 4` ability rows are a PM slice (K-level), ⛔ not a DEV number. |
| A name for the character | ⛔ **out, by decision** | D-200 § ב׳ — «⛔ אין לדמות שם פרטי. הדמות היא השם.» |
| A migration · an endpoint · a route · a screen | ⛔ **out** | D-152; `PATCH /api/arcade/character` exists (C-0502); navigation is PM's (`RULES § 0.16`). |
| The `GET /api/arcade/round` learning about the character | ⛔ **out** | The battle receives `character` as a prop from the shell (T-217). Fence 1: the round is the same round. |

---

## File Structure

**Create** — ⛔ nothing.

**Modify**
- `lib/core/battle.ts` — `CharacterBattleStats` · `BASE_STATS` · `CHARACTER_STATS` ·
  `ENEMY_HP` · `statsFor` · `BattleState.stats` · `startBattle(words, character)` ·
  `cast` reads `state.stats`. `SWING_PENALTY` · `HIT_DAMAGE` · `CRITICAL_DAMAGE` module
  constants **deleted** (they become the base row).
- `lib/core/battle.test.ts` — every `startBattle(words, n, m)` becomes
  `startBattle(words)` (base) — 21 call sites, all re-read below; one new `describe`
  for T-281 with the four fences and the behaviour of each character.
- `components/ArenaBattle.tsx` — `LEARNER_HP` · `ENEMY_HP` (`:137-138`) **deleted**; the
  three `startBattle(wordsOf(…), LEARNER_HP, ENEMY_HP)` calls (`:224` · `:345` · `:536`)
  become `startBattle(wordsOf(…), character)`.
- `components/ArenaBattle.test.ts` — two source assertions (⛔ no HP constant in the
  component; the three calls pass `character`).
- `plan/50-tasks.md` — `T-281` ⇒ 🟣 at close; `docs/plan-open.md` · `docs/plan-tables.md`
  regenerated in the same commit (`npm run measure:plan`).
- `docs/architecture-map.json` — regenerated (`npm run generate-map`), same commit as
  the code (D-165).

⛔ **Not modified, deliberately:** `lib/core/arenaCharacter.ts` (words only) ·
`components/ArenaCharacterChoice.tsx` · `components/ArenaHome.tsx` ·
`components/ArenaShell.tsx` (ⓑ is built) · `docs/api-contract.md` (⛔ no endpoint change)
· `app/arcade/arcade-tokens.css` (⛔ no hex, `app/arcade/page.test.ts` scans it raw) ·
`scripts/motion-baseline.md` (⛔ no motion).

---

## Interfaces

```ts
// lib/core/battle.ts — PURE. Additions and changes only; everything else stays.
import type { ArenaCharacter } from './arenaCharacter';
import { isArenaCharacter } from './arenaCharacter';   // a pure predicate, already in lib/core

/** `37 § 7`, «ההטיה כמספרים» — the four columns of the table, ⛔ and no fifth. */
export interface CharacterBattleStats {
  readonly learnerHp: number;
  readonly hitDamage: number;
  readonly criticalDamage: number;
  readonly swingPenalty: number;
}

/** `37 § 7` row «בסיס». Also the row for `null` and for anything unknown (fence 4). */
export const BASE_STATS: CharacterBattleStats = Object.freeze({
  learnerHp: 12, hitDamage: 1, criticalDamage: 2, swingPenalty: 1,
});

/** `37 § 7`, the three rows under «בסיס», verbatim — the test parses the spec table. */
export const CHARACTER_STATS: Readonly<Record<ArenaCharacter, CharacterBattleStats>> =
  Object.freeze({
    wizard:  Object.freeze({ ...BASE_STATS, hitDamage: 2, criticalDamage: 3 }),
    warrior: Object.freeze({ ...BASE_STATS, learnerHp: 18, criticalDamage: 3, swingPenalty: 0 }),
    armorer: BASE_STATS,
  });

/** Moved from `ArenaBattle.tsx:138`. ⛔ One enemy for all three (fence 1). */
export const ENEMY_HP = 20;

/** Fence 4 — ⛔ never throws: `null`, `undefined`, `'Wizard'`, `7`, `{}` ⇒ `BASE_STATS`. */
export function statsFor(character: unknown): CharacterBattleStats;

export interface BattleState {
  /* …every existing field unchanged… */
  /** T-281 — the row `startBattle` was given. `cast` reads damage and penalty from here. */
  readonly stats: CharacterBattleStats;
}

/** CHANGED: `(words, learnerHpMax, enemyHpMax)` ⇒ `(words, character)`.
 *  learnerHp = learnerHpMax = stats.learnerHp · enemyHp = enemyHpMax = ENEMY_HP. */
export function startBattle(
  words: readonly ArenaWord[],
  character: ArenaCharacter | null = null,
): BattleState;

// cast(): damage = correct ? (critical ? state.stats.criticalDamage : state.stats.hitDamage) + bonus : 0
//         pendingPenalty: correct ? 0 : state.stats.swingPenalty
// tick(): UNCHANGED — `SWING_DAMAGE = 1` stays a module constant (⛔ not a § 7 column).
// manaAt · isRage · outcomeAt · telegraphAt · dodge · stagePhase · returnedSpell: UNCHANGED.
```

```ts
// components/ArenaBattle.tsx — three call sites, one shape
startBattle(wordsOf(initialRound.questions), character)     // :224 and :536
startBattle(wordsOf(body.round.questions), character)       // :345
// `character` is the existing prop (`ArenaBattleProps.character`, T-217). ⛔ No new prop.
// `const LEARNER_HP = 12;` and `const ENEMY_HP = 20;` (:137-138) are deleted with their
// comment block; the percent maths at :687 and its learner twin stay exactly as they are.
```

---

## Re-read of every existing `startBattle` call in `lib/core/battle.test.ts` against the base row (12 / 20)

⛔ **This is the fixture rule, applied before a line is changed.** Each call becomes
`startBattle(words)`; the assertion beside it is listed with the value it now sees.

| Line | Was | Now sees | Assertion | Holds? |
|---|---|---|---|---|
| `:40` `FRESH` | `20, 10` | 12 / 20 | `:68` `learnerHp === FRESH.learnerHp - 11` ⇒ 1 (no clamp in `tick`) | ✅ |
| `:71-78` | FRESH | 12 / 20 | `enemyHp` strictly less, fast < slow | ✅ |
| `:86-94` | FRESH | 12 / 20 | missed swing costs more than clean swing (2 vs 1) | ✅ |
| `:98` · `:115` | `20, 10` | 12 / 20 | `returnedSpell` shape only | ✅ |
| `:119-129` | explicit hp | explicit | `outcomeAt` on hand-set values | ✅ |
| `:137-149` | FRESH | 12 / 20 | reference identity; `learnerHp - 1` | ✅ |
| `:201-233` (dodge) | `12, 20` | 12 / 20 | `toBe(12)` · `toBe(11)` · `pendingPenalty 1` | ✅ **identical numbers** |
| `:250-289` (§ 2) | `3, 20` | 12 / 20 | `20 - enemyHp` arithmetic; `learnerHp` equality between two casts | ✅ (enemy still 20; learner compared to itself) |

⇒ **21 call sites, 0 expected values change.** If a value does change on the run, that is
a defect in this table, ⛔ not a reason to widen `startBattle` back to numbers — write
the row in `plan/26-plan-feedback.md` and fix the test's expectation to the base row.

---

## Task 0: measure ⓑ — ⛔ no code

**Files:** none. Output: three lines in the tick report.

- [ ] **Step 1: prove the path back exists** —
  `grep -n 'onDesign\|DESIGN_HE' components/ArenaHome.tsx` ⇒ expect `:64` (prop),
  `:91` (`'עיצוב דמות'`), `:393` (`onClick={() => onDesign(state)}`).
  `grep -n "setNext('home')\|onBack=" components/ArenaShell.tsx` ⇒ expect `:43` and `:56`.
- [ ] **Step 2: prove the tests already pin it** —
  `npx vitest run components/ArenaHome.test.ts components/ArenaShell.test.ts` ⇒ green,
  and the test names `T-217 — \`עיצוב דמות\` is live` and `the battle receives the
  character as a prop` appear in the output.
- [ ] **Step 3: report** — `grep -c 'onDesign' components/ArenaHome.tsx` ⇒ **3** goes into
  the report as one line: «ⓑ נמדדה בנויה (T-217, C-0502) — `components/ArenaHome.tsx:393`
  · `components/ArenaShell.tsx:43`; ⛔ אפס קוד». ⛔ Do not touch either file.

---

## Task 1: `lib/core/battle.ts` — the table, the row, the state

**Files:** Modify `lib/core/battle.ts`, `lib/core/battle.test.ts`.

- [ ] **Step 1: Write the failing tests** — append to `lib/core/battle.test.ts` (imports:
  add `BASE_STATS`, `CHARACTER_STATS`, `ENEMY_HP`, `statsFor` from `./battle`, and
  `ARENA_CHARACTERS`, `CHARACTER_BIAS_HE` from `./arenaCharacter`):

```ts
/**
 * T-281 · `37 § 7` «ההטיה כמספרים» · D-200. ⛔ The numbers are read out of the spec's own
 * markdown table, ⛔ never typed here twice: a second copy is a second owner.
 */
const SPEC_37 = readFileSync('plan/37-arena-spec.md', 'utf8').replace(/\*\*/g, '');

/** The numeric § 7 rows: label cell, then four integer cells. The words table above it
 *  has the same labels but ⛔ no integer cells, so it never matches. */
function specRow(label: string): readonly number[] {
  const row = SPEC_37.split('\n').find((l) => {
    const cells = l.split('|').map((c) => c.trim());
    return cells[1]?.startsWith(label) === true && cells.slice(2, 6).every((c) => /^\d+$/.test(c));
  });
  expect(row, `שורת ${label} בטבלת § 7`).toBeDefined();
  return (row as string).split('|').map((c) => c.trim()).slice(2, 6).map(Number);
}
const asRow = (s: { learnerHp: number; hitDamage: number; criticalDamage: number; swingPenalty: number }) =>
  [s.learnerHp, s.hitDamage, s.criticalDamage, s.swingPenalty];

describe('T-281 · 37 § 7 — ההטיה כמספרים', () => {
  it('הבסיס ושלוש הדמויות הם טבלת § 7, מילה במילה — ⛔ אפס מספר מומצא', () => {
    expect(asRow(BASE_STATS)).toEqual(specRow('בסיס'));
    expect(asRow(CHARACTER_STATS.wizard)).toEqual(specRow('קוסם'));
    expect(asRow(CHARACTER_STATS.warrior)).toEqual(specRow('לוחם'));
    expect(asRow(CHARACTER_STATS.armorer)).toEqual(specRow('שריונאי'));
  });

  it('גדר 4 — דמות לא מוכרת או null ⇒ הבסיס, ⛔ ולא זריקה', () => {
    for (const bad of [null, undefined, 'Wizard', '', 7, {}, ['wizard']]) {
      expect(statsFor(bad)).toBe(BASE_STATS);
    }
    for (const c of ARENA_CHARACTERS) expect(statsFor(c)).toBe(CHARACTER_STATS[c]);
    expect(startBattle([word(1)]).stats).toBe(BASE_STATS);
    expect(startBattle([word(1)], null).stats).toBe(BASE_STATS);
  });

  it('גדר 1 — ארבעה מפתחות בדיוק, ⛔ ואף אחד מהם אינו שעון, מאנה, תמהיל או «מה נכון»', () => {
    const keys = ['criticalDamage', 'hitDamage', 'learnerHp', 'swingPenalty'];
    expect(Object.keys(BASE_STATS).sort()).toEqual(keys);
    for (const c of ARENA_CHARACTERS) expect(Object.keys(CHARACTER_STATS[c]).sort()).toEqual(keys);
    // The engine reads the row through `state.stats.<key>` only — measured on the source.
    const code = readFileSync('lib/core/battle.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    const reads = [...code.matchAll(/stats\.(\w+)/g)].map((m) => m[1]);
    expect(reads.length).toBeGreaterThan(0);
    for (const r of reads) expect(keys).toContain(r);
    // and the clock, the mana and the enemy are module constants, ⛔ not row fields
    for (const c of ARENA_CHARACTERS) {
      expect(manaAt(10_000, 0)).toBe(manaAt(10_000, 0));          // no character parameter exists
      expect(startBattle([word(1)], c).enemyHpMax).toBe(ENEMY_HP);
      expect(startBattle([word(1)], c).words).toEqual([word(1)]);   // the mix is the mix
    }
  });

  it('גדר 2 — LEARNER_HP ≥ 12 לכל דמות: 11 מכות נקיות ⛔ אינן מפסידות קרב', () => {
    const swings = Math.floor(BATTLE_MS / ENEMY_SWING_MS);
    expect(swings).toBe(11);
    for (const c of ARENA_CHARACTERS) {
      expect(CHARACTER_STATS[c].learnerHp).toBeGreaterThanOrEqual(swings + 1);
      let s = startBattle([word(1)], c);
      for (let ms = 0; ms <= BATTLE_MS; ms += 1000) s = tick(s, ms);
      expect(s.learnerHp).toBeGreaterThan(0);
    }
  });

  it('גדר 3 — CRITICAL_DAMAGE > HIT_DAMAGE לכל דמות', () => {
    expect(BASE_STATS.criticalDamage).toBeGreaterThan(BASE_STATS.hitDamage);
    for (const c of ARENA_CHARACTERS) {
      expect(CHARACTER_STATS[c].criticalDamage).toBeGreaterThan(CHARACTER_STATS[c].hitDamage);
    }
  });

  it('קוסם — «נזק לחש גבוה»: 2 באיטית, 3 בקריטית; 7 קריטיות מפילות 20', () => {
    const w = startBattle([word(1), word(2)], 'wizard');
    const slow = cast({ ...w, shownAtMs: 0 }, 'אפשרות 1', 5_000);
    const fast = cast({ ...w, shownAtMs: 0 }, 'אפשרות 1', 1_000);
    expect(ENEMY_HP - slow.enemyHp).toBe(2);
    expect(ENEMY_HP - fast.enemyHp).toBe(3);
    expect(Math.ceil(ENEMY_HP / CHARACTER_STATS.wizard.criticalDamage)).toBe(7);
    expect(w.learnerHp).toBe(BASE_STATS.learnerHp);              // «חיים נמוכים» stays a word (fence 2)
  });

  it('לוחם — «חיים גבוהים» 18, «קריטי חזק» 3, «מגן מובנה» = ⛔ אין עונש על טעות', () => {
    const w = startBattle([word(1), word(2)], 'warrior');
    expect(w.learnerHp).toBe(18);
    expect(w.learnerHpMax).toBe(18);
    const fast = cast({ ...w, shownAtMs: 0 }, 'אפשרות 1', 1_000);
    expect(ENEMY_HP - fast.enemyHp).toBe(3);
    const missed = cast({ ...w, shownAtMs: 0 }, 'לא-נכון', 2_000);
    expect(missed.pendingPenalty).toBe(0);
    expect(tick(missed, ENEMY_SWING_MS).learnerHp).toBe(18 - 1);  // one swing, ⛔ not two
    const baseMissed = cast({ ...startBattle([word(1), word(2)]), shownAtMs: 0 }, 'לא-נכון', 2_000);
    expect(tick(baseMissed, ENEMY_SWING_MS).learnerHp).toBe(12 - 2);
  });

  it('שריונאי — «מאוזן»: הבסיס בדיוק, ⛔ ולא עותק שווה', () => {
    expect(CHARACTER_STATS.armorer).toBe(BASE_STATS);
    const a = startBattle([word(1)], 'armorer');
    const b = startBattle([word(1)]);
    expect({ ...a, stats: undefined }).toEqual({ ...b, stats: undefined });
  });

  it('ⓓ — שורות ה«⛔ טרם» נשארות מילים על המסך, ⛔ ואין להן מנגנון', () => {
    for (const line of ['מאנה מהירה יותר', 'חיים נמוכים']) expect(CHARACTER_BIAS_HE.wizard).toContain(line);
    for (const line of ['יכולות מתקררות מהר', 'ירי מטווח']) expect(CHARACTER_BIAS_HE.armorer).toContain(line);
    const code = readFileSync('lib/core/battle.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    for (const banned of [/cooldown/i, /shield/i, /heal/i, /freeze/i, /ranged/i, /manaMs\b/]) {
      expect(code, `${banned} — § 4 ⛔ אינו בנוי`).not.toMatch(banned);
    }
  });

  it('⛔ אפס מספר על מסך הבחירה — הטבלה היא מפרט, ⛔ לא תוכן', () => {
    for (const c of ARENA_CHARACTERS) for (const s of CHARACTER_BIAS_HE[c]) expect(s).not.toMatch(/\d/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail** — `npx vitest run lib/core/battle.test.ts` ⇒
  **FAIL** on the new `describe` (`statsFor` / `BASE_STATS` undefined) **and** a
  TypeScript complaint on every `startBattle(words, n, m)` once the signature changes —
  which is the next step, ⛔ not this one. Paste the failing names into the report.

- [ ] **Step 3: Retire the numeric parameters in every existing call** — in
  `lib/core/battle.test.ts`, replace `startBattle(<words>, 20, 10)`, `(…, 12, 20)` and
  `(…, 3, 20)` with `startBattle(<words>)` at all **21** sites (`grep -c 'startBattle('
  lib/core/battle.test.ts` before and after ⇒ same count, zero digits after the words
  argument: `grep -n 'startBattle(.*, [0-9]' lib/core/battle.test.ts` ⇒ **0 lines**).
  ⛔ Do not touch any `expect` — the re-read table above says none needs to move.
  Update the fixture comment at `:22-31` (it explains why `learnerHpMax` was 20): replace
  it with one sentence — the fixture is now the production base row, by construction.

- [ ] **Step 4: Write `lib/core/battle.ts`** — the `Interfaces` block, exactly:
  ⓐ `import type { ArenaCharacter }` + `import { isArenaCharacter }` from
  `./arenaCharacter`; ⓑ delete the three constants `SWING_PENALTY` · `HIT_DAMAGE` ·
  `CRITICAL_DAMAGE` and their comments (keep `SWING_DAMAGE`); ⓒ add
  `CharacterBattleStats` · `BASE_STATS` · `CHARACTER_STATS` · `ENEMY_HP` · `statsFor` at the
  head, under the `§ 3-5` constants, with a doc comment that cites `37 § 7` and D-200;
  ⓓ `BattleState.stats`; ⓔ `startBattle(words, character = null)`; ⓕ in `cast`:
  `state.stats.criticalDamage` · `state.stats.hitDamage` · `state.stats.swingPenalty`.
  ⛔ `tick` untouched. ⛔ No `Date.now`, no `Math.random`.

- [ ] **Step 5: Run it green** — `npx vitest run lib/core/battle.test.ts lib/core/arenaCharacter.test.ts`
  ⇒ all green, and `npm run check:core` (purity gate) ⇒ exit 0. `npm run typecheck` will
  still be **red** on `components/ArenaBattle.tsx` (three calls with the old arity) —
  that is Task 2, and the two tasks land in **two commits** that are only green
  together; commit Task 1 now anyway (one commit per task), and ⛔ do not push between
  them (the hook runs `verify` on the tree, and the tree is green only after Task 2).

- [ ] **Step 6: Commit** — `./scripts/g add lib/core/battle.ts lib/core/battle.test.ts &&
  ./scripts/g commit -m "loop(DEV): C-XXXX T-281a battle.ts - character stats table from 37 § 7, startBattle(words, character)"`

---

## Task 2: `components/ArenaBattle.tsx` — the component stops knowing a number

**Files:** Modify `components/ArenaBattle.tsx`, `components/ArenaBattle.test.ts`.

- [ ] **Step 1: Write the failing tests** — append to `components/ArenaBattle.test.ts`
  (it already has `CODE`, the comment-stripped source):

```ts
describe('T-281 · 37 § 7 גדר 4 — המספרים חיים ב-lib/core, ⛔ לא ברכיב', () => {
  it('⛔ אין ברכיב קבוע חיים — LEARNER_HP ו-ENEMY_HP נמחקו', () => {
    expect(CODE).not.toMatch(/\bconst (LEARNER_HP|ENEMY_HP)\b/);
    expect(CODE).not.toMatch(/startBattle\([^)]*\b(12|20)\b/);
  });

  it('שלוש הקריאות ל-startBattle מוסרות את הדמות, ⛔ ולא מספרים', () => {
    const calls = CODE.match(/startBattle\(wordsOf\([^)]*\),\s*character\)/g) ?? [];
    expect(calls).toHaveLength(3);
    expect(CODE).not.toMatch(/startBattle\(wordsOf\([^)]*\)\)/);   // ⛔ never the default row by omission
  });

  it('גדר 1 — המילים ⛔ אינן תלויות בדמות: wordsOf ⛔ אינה מקבלת אותה', () => {
    expect(CODE).not.toMatch(/wordsOf\([^)]*character/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail** — `npx vitest run components/ArenaBattle.test.ts`
  ⇒ **FAIL** (`const LEARNER_HP` still present; 0 calls match).

- [ ] **Step 3: Edit `components/ArenaBattle.tsx`** — delete `:127-138` (the HP comment
  block and the two constants); change `:224` · `:345` · `:536` to
  `startBattle(wordsOf(…), character)`. ⚠️ `:224` is inside the `useState` initialiser
  and `character` is a destructured prop of the same function ⇒ in scope. ⛔ Nothing else
  in the file moves; the percent maths at `:687` and its learner twin read
  `learnerHpMax` / `enemyHpMax` from the state, exactly as before.

- [ ] **Step 4: Run it green** — `npx vitest run components/ArenaBattle.test.ts
  components/ArenaShell.test.ts app/arcade/page.test.ts` ⇒ green;
  `npm run typecheck` ⇒ exit 0 (the whole tree compiles again).

- [ ] **Step 5: Look at the screen (STEP 6.5)** — `npm run build && (npx next start -p 3001 &)
  && sleep 8`, then Playwright at 375×780 on `http://127.0.0.1:3001/dev/arcade`
  (⛔ `next dev` — F-204: it 403s every chunk in CCR). Record heading · tappable count ·
  under-44px · horizontal scroll · console errors — and that the HP text still reads
  `100/100` at start (percent, `render_video_B.py:475`). ⛔ Nothing drawn changed; the
  numbers in the report are the proof.

- [ ] **Step 6: Commit** — `./scripts/g add components/ArenaBattle.tsx components/ArenaBattle.test.ts &&
  ./scripts/g commit -m "loop(DEV): C-XXXX T-281b ArenaBattle - LEARNER_HP/ENEMY_HP leave the component, startBattle gets the character"`

---

## Task 3: close — the registers and the gate

**Files:** Modify `plan/50-tasks.md` (`T-281` ⇒ 🟣), `plan/00-control.md`,
`plan/30-architecture.md` (one paragraph under the arena: «the stats row is state,
the enemy is a constant»), regenerate `docs/plan-open.md` · `docs/plan-tables.md` ·
`docs/architecture-map.json`.

- [ ] **Step 1: The map** — `grep -q '"generate-map"' package.json && npm run generate-map`
  ⇒ `docs/architecture-map.json` regenerated (D-165, same commit as the code).
- [ ] **Step 2: The registers** — `T-281` status cell ⇒ `🟣 **C-XXXX (DEV) — ⓐⓒⓓ נבנו, ⓑ
  נמדדה בנויה (T-217)…**` with the numbers from Task 1 Step 5 and Task 2 Step 5; then
  `npm run measure:plan` (both `docs/plan-*.md` in the same commit, `RULES § 0.1 ח׳`).
  Tick every `- [ ]` in this file that closed.
- [ ] **Step 3: The gate** — `npm run verify` (five commands, `check:mobile` included).
  Paste the exact tail into the report. Red ⇒ fix in this tick; still red ⇒
  `./scripts/g revert` both task commits + a debt line in `30-architecture.md`.
- [ ] **Step 4: Commit and push** — release the lock in `plan/00-control.md` (`LOCK_HELD_BY: ""`,
  `NEXT_AGENT: CRITIC`, `LAST_HANDOFF_AT` from `date -u`), then
  `./scripts/g commit -m "loop(DEV): C-XXXX close — T-281 🟣, registers, map"
  && ./scripts/g push origin work/current` (the pre-push hook re-runs `npm run verify`
  and writes the attestation note — check 16).

---

## Self-check (before the build tick calls this plan done)

- [ ] `grep -c 'startBattle(' lib/core/battle.test.ts` unchanged from before Task 1; `grep -n 'startBattle(.*, [0-9]' lib/core/battle.test.ts` ⇒ 0.
- [ ] `grep -n 'LEARNER_HP\|ENEMY_HP' components/ArenaBattle.tsx` ⇒ 0 lines.
- [ ] `grep -n 'character' lib/core/battle.ts` ⇒ > 0 lines (the row's own C-0503 measurement, inverted).
- [ ] `grep -rn 'cooldown\|shield\|heal' lib/core/battle.ts` ⇒ 0 (ⓓ: nothing invented for the five word-only lines).
- [ ] `lib/core/arenaCharacter.ts` — `git diff --stat` shows it **untouched**.
- [ ] `docs/api-contract.md` — untouched (⛔ no endpoint changed).
- [ ] `app/arcade/arcade-tokens.css` — untouched (⛔ no hex).
- [ ] The report names: `[SKILL: taste-skill]` (`skills/taste-skill/SKILL.md`) loaded per the row tag, and which of its rules applied (this slice adds no learner-visible string and no motion ⇒ its copy audit and em-dash ban were checked against the four existing bias lines, unchanged).
