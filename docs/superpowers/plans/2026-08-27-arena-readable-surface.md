# Arena slice D — the arena becomes readable on the phone the learner actually has — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (or
> `superpowers:subagent-driven-development`). Every step is a `- [ ]` and closes only
> after a fresh run whose output goes into the tick report.

**Written:** C-0333 (PM, 📝 planning tick) · 2026-08-27T17:04:51Z (`date -u`)

**Covers three task rows:** **T-214** (the arena's own surface and ink · closes F-155 ·
F-156) → **T-182** (animation language, bisected to א1+א2 by D-133) → **T-215** (the
character base, `38 § 3` · `§ 4`).

**Decisions this plan executes:** `D-130` (visual route ⓘ) · `D-133` (T-182 bisection) ·
`D-134` (the contrast gate is per-screen, not per-component). ⛔ Do not re-open them here.

---

## Goal, and the number it moves

Measured in this planning tick with a live browser (`next dev` · Playwright ·
375×780 · `colorScheme` in **both** schemes · `getComputedStyle` on every text node
under `[data-arena-scope]`), ⛔ not estimated:

| scheme | element | file:line | colour on background | **ratio** | Layer A floor |
|---|---|---|---|---|---|
| light | `זמן קרב` (clock label) | `components/ArenaBattle.tsx:529` | `rgb(212,169,74)` on `rgb(248,250,252)` | **2.10:1** | 4.5:1 ❌ |
| light | `הקוסם` (enemy name) | `components/ArenaBattle.tsx:554` | `rgb(245,214,132)` on `rgb(248,250,252)` | **1.35:1** | 4.5:1 ❌ |
| dark | `100/100` (enemy health number) | `components/ArenaBattle.tsx:604-608` | `rgb(15,23,42)` on `rgb(52,50,63)` | **1.42:1** | 4.5:1 ❌ |
| both | spell-card border, unselected | `components/SpellCard.tsx:67` | `--arena-stone` on `--arena-card` | **1.80:1** | 3:1 ❌ |
| both | `<section data-arena-scope>` background | `components/ArenaBattle.tsx:523` | `rgba(0, 0, 0, 0)` | — | — |

**14 text nodes are painted inside the arena at 375×780. Three fail the floor**, and one
of the three — `100/100` — is the element `app/arcade/arcade-tokens.css` names in its own
header as the second channel that keeps enemy health from being carried by colour alone.
In dark scheme that second channel is invisible.

> **What this buys the learner, and how much (D-120):** today a learner whose phone sits
> on the default light scheme opens the arena and cannot read who they are fighting
> (1.35:1) or how long they have (2.10:1); on dark they cannot read how much health the
> enemy has left (1.42:1). After this ships: **14/14 text nodes ≥ 4.5:1 in both schemes,
> and the card boundary ≥ 3:1** — the learner can read the three facts the round is
> played on, on whichever scheme their phone happens to be set to. ⛔ That is 3 unreadable
> facts → 0, ⛔ not "it matches the render".

**Why 2,889 green tests never saw it:** `scripts/verify-mobile.mjs:1820-1851` measures
contrast on `document.body` of `/` **only**. Nothing in the repo has ever measured a
ratio on a screen that paints its own surfaces. Step 5 closes that, and it is the half of
this plan that keeps the other half from regressing.

## Finish — ⛔ the render binds the finish too, and layer A is the only carve-out

`36 § 14.4` was **reversed** on 24/08: the render at `docs/design/kol-B-03-battle.png`
binds not only the layout but the **finish** — colour, surface, weight. ⛔ "The finish
comes from the constitution" is ⛔ no longer an answer to a visual gap; it was the door
every visual gap walked out of. **The one and only carve-out is Layer A** (contrast ·
never colour alone · Hebrew fonts · 44px · reduced-motion · accessibility), and it is a
carve-out **upward**: where the render would land under 4.5:1, Layer A wins and the plan
says so in the number. That is exactly what this plan does — and ⛔ nowhere else does it
depart from the render.

## Architecture — and the one sentence this plan amends

`app/arcade/arcade-tokens.css:10-11` states: *"every other semantic token (background,
border, `--brand`) keeps arriving from `globals.css`"*. That sentence is **why** the
arena has no ink and no background of its own, and D-130 route ⓘ amends it, in the file,
in the same commit — ⛔ an amended invariant is written down, ⛔ never silently broken.

Three layers, unchanged from slices A–C: the **rule** in `lib/core/*` (pure), the
**component draws and ⛔ does not compute**, the **route applies and ⛔ does not decide**.
This slice adds **no** pure module: it is a token layer plus a measurement gate. T-215
adds geometry constants, and those **are** pure and **are** unit-tested.

## File Structure — what is created and what is edited

| file | T | new? | what changes |
|---|---|---|---|
| `app/arcade/arcade-tokens.css` | 214 | edit | the scope declares `background` + an arena ink pair; header sentence amended; card-edge value added |
| `components/ArenaBattle.tsx` | 214 | edit | 3 elements stop reading `globals` tokens (`:532` `text-ink` · `:605` `text-brand-on` · and the clock label/enemy name inherit) |
| `components/SpellCard.tsx` | 214 | edit | unselected border takes the arena card-edge value |
| `app/arcade/page.test.ts` | 214 | edit | the token-scan test learns the new declarations (it scans this CSS **raw**) |
| `scripts/verify-mobile.mjs` | 214 | edit | **new block 2c** — the per-screen contrast gate |
| `components/ArenaBattle.tsx` | 182 | edit | hit-stop + impact frame, CSS-driven |
| `app/arcade/arcade-tokens.css` | 182 | edit | `--arena-hitstop-ms` · impact-frame keyframes |
| `components/ArenaBattle.test.ts` | 182 | **new** | source scan: reduced-motion path, timings |
| `lib/core/characterBase.ts` | 215 | **new** | `38 § 3` anchor points + `38 § 4` layer order, pure |
| `lib/core/characterBase.test.ts` | 215 | **new** | unit tests on the constants |
| `components/ArenaAvatar.tsx` | 215 | edit | 4 base layers → the `38 § 4` order, incl. hair and main-hand |

⚠️ **Every path above was checked with `test -f` in the planning tick** (§ A1 line 10) —
the nine that exist exist, and the three marked **new** do not.

---

## T-214 — the arena declares its own surface and its own ink

**🎯 The render:** `docs/design/kol-B-03-battle.png` (`render_video_B.py` paints the whole
stage night-blue — which is exactly why route ⓘ is the route that *agrees* with the
anchor, and ⓘⓘ is the route that patches around it).

- [x] **Step 1 — the scope declares a surface.** In `app/arcade/arcade-tokens.css`, inside
      the existing `[data-arena-scope]` block: a `background` taken from `--arena-night`,
      and an **arena ink pair** (a strong ink and a muted ink) that every arena surface
      uses. ⛔ Do **not** touch `globals.css`, and ⛔ do **not** add these to
      `lib/core/palette.ts` — invariant `37 § 13.5`, enforced by `app/arcade/page.test.ts`.
      In the same edit, **amend the header sentence at `:10-11`** to say that the arena
      supplies its own background and ink and takes the rest from `globals.css`.
      ⚠️ `app/arcade/page.test.ts` scans this file **raw** and counts every hex in it as an
      arena token — so it fails until Step 4.

- [x] **Step 2 — the three failing elements stop reading `globals`.** In
      `components/ArenaBattle.tsx`: the clock digits at `:532` (`text-ink`) and the health
      number at `:605` (`text-brand-on`) take the arena ink; the clock label at `:529` and
      the enemy name at `:554` now sit on the declared background instead of on the page.
      ⛔ Do not change `--arena-gold` or `--arena-gold-light` — they are the arena's
      identity and D-130 § ג rules them out of scope.

- [x] **Step 3 — the card boundary.** In `components/SpellCard.tsx:67`, the **unselected**
      border takes a value that measures **≥ 3:1 against the card fill AND ≥ 3:1 against
      the stage background**. ⛔ Do **not** re-tone `--arena-stone`: F-156 measured that it
      draws other borders in the arena, so re-toning it is a screen change. The **selected**
      state is unchanged (`--arena-gold`, 7.29:1).
      ⚠️ **The number that makes this step non-optional:** once the stage is night-blue,
      card fill `rgb(24,33,56)` against stage `#1c2642` = `rgb(28,38,66)` is **≈1.06:1**
      — ⛔ the fill cannot carry the boundary, so the border must.

- [x] **Step 4 — the token-scan test learns the new declarations.** Update
      `app/arcade/page.test.ts` so it asserts the arena background and ink pair are
      declared **in this file** and are **absent from `lib/core/palette.ts`**.
      ⛔ Do not delete the existing five-token assertion — extend it. ⛔ A deleted test
      with no replacement is what felled T-164.

- [x] **Step 5 — the gate that would have caught all four.** Add **block 2c** to
      `scripts/verify-mobile.mjs`, in the existing `check(...)` idiom and directly after
      block 2b (`:1820-1851`). For `/dev/arcade` at 375×780, **in both `colorScheme`
      values**, walk every text node inside `[data-arena-scope]`, resolve each node's
      effective background by climbing ancestors past `rgba(0, 0, 0, 0)`, and:

      ```js
      // fails BY NAME on the first node under the floor — ⛔ not a count
      check(
        worst.ratio >= 4.5,
        `${scheme} · every arena text node clears 4.5:1`,
        `"${worst.text}" is ${worst.ratio}:1 (${worst.color} on ${worst.bg})`,
      );
      check(
        cardEdge >= 3,
        `${scheme} · spell-card border clears 3:1 against its fill`,
        `border ${cardEdge}:1`,
      );
      ```

      ⚠️ **The gate is per-SCREEN and ⛔ not per-component, and that is the whole point**
      (D-134): C-0332 measured the *card*, got 15.61:1, and shipped a screen with three
      other failures still on it.

- [x] **Step 6 — mutation check, ⛔ not a green run.** In `app/arcade/arcade-tokens.css`
      revert Step 1's `background` declaration alone, then run
      `node scripts/verify-mobile.mjs`. **It must fail by name on `הקוסם`.** Restore.
      ⛔ A gate that has never failed is a gate nobody has measured.

- [x] **Step 7 — `npm run verify`**, fresh, output into the tick report.

## T-182 — the animation language, bisected: א1 + א2 only

**Bisected by D-133.** `37 § 11` names ten techniques and prioritises **א1 · א2 · א4**.
א4 ("cape, **hair** and **sword** lag 2 frames behind the body") names three layers
`ArenaAvatar` does not have — F-157 measured 4 base layers against `38 § 4`'s eleven. ⇒
**א4 leaves this row and becomes T-216**, which declares `**המשך של: T-182**` and waits
on T-215. ⛔ א1 and א2 need **no** layers, and this is the measured reason the row was
buildable all along.

- [x] **Step 1 — א1, hit-stop.** In `app/arcade/arcade-tokens.css` and
      `components/ArenaBattle.tsx`: 3–4 frames (100–130 ms) of total freeze on impact.
      The duration is a token in `app/arcade/arcade-tokens.css`, ⛔ not a literal in the component,
      so Step 3 can assert it. The freeze is CSS (`animation-play-state`), ⛔ not a timer:
      `36 § 14` and T-041 keep arena motion in CSS.
- [x] **Step 2 — א2, impact frame.** In `components/ArenaBattle.tsx` (keyframes in
      `app/arcade/arcade-tokens.css`): 1–2 frames in which both figures are a pure white
      silhouette. ⛔ **Uses the arena ink from T-214 Step 1** — this is the coupling that
      puts the two rows in one plan.
- [x] **Step 3 — `prefers-reduced-motion` and the test.** Under reduced motion the
      freeze and the silhouette are **removed**, and the round still resolves. New file
      `components/ArenaBattle.test.ts`, a **source scan** on the template of
      `components/ArenaStage.test.ts` (⛔ no RTL, ⛔ no jsdom):

      ```ts
      expect(src).toMatch(/--arena-hitstop-ms/)
      expect(src).not.toMatch(/setTimeout\(\s*[^)]*130/) // the freeze is CSS, ⛔ not a timer
      expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/)
      ```
- [x] **Step 4 — `npm run verify`**, fresh.

## T-215 — the character base (`38 § 3` · `38 § 4`)

**⛔ Anchor-derived, ⛔ not invented** — every number below is copied from
`plan/38-character-base.md § 3`, and the layer order from `§ 4`.

- [ ] **Step 1 — the geometry becomes a pure module.** New `lib/core/characterBase.ts`.
      The anchor points, verbatim from `38 § 3` (head `r=34` at `(0,-62)`; shoulders
      `(∓52,-8)`; body `76×84` at `(0,-18)`; belt `68×14` at `(0,47)`; main hand
      `(66,16)`; off hand `(-70,12)`; boots `(∓20,112)`), and the eleven-layer order from
      `38 § 4`. ⛔ Pure — `npm run check:core` must stay `OK`.

      **Interfaces — this block was compiled with `tsc --strict
      --noUncheckedIndexedAccess` in the planning tick BEFORE it was written here
      (§ A1 line 9). The run printed `TSC_CLEAN`. ⛔ An `Interfaces` block that was
      never run is a guess:**

      ```ts
      export type CharacterSlot =
        | 'head' | 'shoulders' | 'body' | 'belt'
        | 'mainHand' | 'offHand' | 'legs';

      export interface AnchorPoint {
        readonly x: number;
        readonly y: number;
      }

      /** `38 § 4`, in render order. The cape renders twice — back, then front. */
      export const LAYER_ORDER = Object.freeze([
        'capeBack', 'legs', 'boots', 'body', 'chest', 'belt',
        'offHand', 'head', 'headgear', 'shoulders', 'mainHand',
      ] as const);

      export type Layer = (typeof LAYER_ORDER)[number];
      ```

- [ ] **Step 2 — unit tests.** New `lib/core/characterBase.test.ts`. `LAYER_ORDER` has
      **eleven** entries in `38 § 4`'s order; every `CharacterSlot` resolves to an anchor;
      an item whose slot is not in the map is **rejected** — `38 § 3` says in as many
      words that such an item is invalid, ⛔ *not* a reason to change the skeleton.

      ```ts
      expect(LAYER_ORDER).toHaveLength(11)
      expect(LAYER_ORDER.indexOf('capeBack')).toBeLessThan(LAYER_ORDER.indexOf('body'))
      expect(anchorFor('mainHand')).toEqual({ x: 66, y: 16 })
      ```

- [ ] **Step 3 — `ArenaAvatar` draws the `38 § 4` order.** `components/ArenaAvatar.tsx`
      goes from 4 base layers to the eleven, **hair and main-hand weapon among them**.
      ⛔ **`38 § 5` forbids copying `wizard_sprite` / `knight_sprite` / `hero_sprite`
      from `render_video_B.py`** — the shapes are written here, on this skeleton.
      ⛔ Keep the file's existing constraints: zero hex, zero emoji, zero generated asset,
      `currentColor` only.
      ⚠️ `ITEM_LABELS_HE` and `ARCADE_ITEMS` are **unchanged** — D-132 settled that slots
      and item instances are two vocabularies, ⛔ not two rival lists.

- [ ] **Step 4 — mutation check.** Swap two entries of `LAYER_ORDER` in
      `lib/core/characterBase.ts`, run `npx vitest run lib/core/characterBase.test.ts`;
      it must fail **by name**. Restore.

- [ ] **Step 5 — `npm run verify`**, fresh, output into the tick report.

---

## What this plan deliberately does NOT do

- ⛔ **No XP meter and no spark-shard chip** — D-131 took route ⓑ: there is no economy
  rule and no column, and the only number that could be drawn is an invented one.
- ⛔ **No character-selection screen** — T-217, blocked on a migration (`03-for-roy`).
- ⛔ **No א4 follow-through** — T-216, blocked on T-215.
- ⛔ **`--arena-stone` is not re-toned** and `--arena-gold*` is not recoloured.

---

## Execution log — T-214, C-0334 (DEV, 🔨 build tick)

Steps 1–7 closed. ⛔ Two things the plan did not foresee, both **measured** and both
written down instead of absorbed silently:

1. **Declaring the background moved far more than the three named nodes.**
   `render_video_B.py` draws the whole stage on the **dark**-scheme globals values
   (`INK_MUTED` · `BRAND_SURFACE` · `BORDER_SUB`), so once the section became night-blue
   in **both** schemes, every element still reading a `globals` token failed in the
   **light** scheme: `מאנה` 1.97:1 · `0 / 10` 2.23:1 · the drag hint and the isolation
   note 1.97:1 · the mana meter fill 1.90:1 against its own track · and the close icon
   **1.27:1**. ⇒ Step 2 covers **every** arena text node and the two meters, ⛔ not the
   three the table named. Leaving them would have shipped a NEW defect with the fix.
2. **`bg-danger` under the health number.** `--danger` flips with the scheme
   (`#b91c1c` / `#f87171`), so arena ink on it measured **2.70:1** in dark. The fill is
   now the render's own value (`:474`), darkened by Layer A until arena ink clears
   **5.02:1**, on the render's own track (`:471`). ⚠️ An ancestor walk would ⛔ never
   have caught this — the fill is an absolutely-positioned **sibling** — which is why
   block 2c resolves the background with `elementsFromPoint`.

**Gate, proven by failing (⛔ twice, ⛔ not once):**
- remove `background` alone ⇒ `"זמן קרב" is 2.1:1 · "1:30" is 1.02:1 · "הקוסם" is 1.35:1 · "מאנה" is 2.08:1 · "0 / 10" is 1.02:1 · …` — the two numbers C-0333 measured, reproduced **by name**.
- remove the close-icon rule alone ⇒ `close is 1.19:1 (rgb(15, 23, 42) on rgb(28, 38, 66))`.

**`npm run verify`:** typecheck ✅ · `/lib/core purity: OK` · **178 files / 2892 tests** ✅ ·
build ✅ · **1188 mobile checks** ✅.

**13 nodes, ⛔ not 14:** the walk finds 15 text nodes under `[data-arena-scope]`; two are
`sr-only` at 1×1 and are ⛔ never painted. The gate skips them by area, and the count is
reported in the check label so a future change to that number is visible.

⚠️ **Two findings opened, ⛔ not absorbed:** `F-158` (the avatar's own backdrop is
`--surface-raised` ⇒ **1.02:1** on the night blue in dark — it belongs to T-215, which
rewrites that file) · `F-159` (block 2c measures **pressable** icons only, because a
`background-color` probe cannot see an SVG `<rect>` fill and reported a legible figure as
a failure).
