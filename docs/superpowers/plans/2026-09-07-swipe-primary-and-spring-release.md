# Swipe as the Primary Grade Channel + Spring Release — T-259 · T-243 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task, with `superpowers:test-driven-development` inside every task. Steps use checkbox (`- [ ]`) syntax for tracking. **One commit per task** (`docs/agents/DEV.md` STEP 4.5), `npm run verify` green and freshly run before each commit. `[SKILL: apple-design]` is loaded before Task 1 — `T-243`'s `סקיל` cell prints it (`D-162` narrow trigger); the spring values below are quoted from it, ⛔ not chosen by taste.

**Goal:** The learner grades a card by swiping it — right = «ידעתי», left = «לא ידעתי» — the card follows the finger 1:1, previews the grade on its face once the gesture crosses the threshold, and on release continues at the finger's own velocity as a critically-damped spring (`damping 1.0`, `response 0.3`) to the render's exit pose or back to rest; the two grade buttons stop being the visible channel and survive as the accessible equivalent (Layer A).

**Architecture:** Every number stays in `/lib/core/` — a new pure `lib/core/spring.ts` (closed-form critically-damped spring, release velocity from pointer samples, and a CSS `linear()` easing string + settle duration that *is* the spring rendered through a CSS transition), plus four pure additions to `lib/core/swipeGrade.ts` (exit distance, rotation and drop quoted from `docs/design/render_video_A.py`, and a `baseX` so a grab mid-flight starts from the presentation value). Components only draw: `components/Flashcard.tsx` writes the transform, two custom properties (`--kol-release-ms`, `--kol-release-ease`) and three data attributes to its own node through the existing `ref` (T-233 pattern, ⛔ no `style={{}}`), and `components/SpellCard.tsx` sets the same two custom properties on release. `app/globals.css` consumes them under `@supports (animation-timing-function: linear(0, 1))`, with today's 200ms `ease-out` as the fallback. ⛔ No gesture or animation library (`docs/superpowers/plans/2026-09-05-improvement-plan.md § 4.3`, three measured reasons).

**Tech Stack:** TypeScript · React 19 · Next 16 · Tailwind 3.4 · Vitest (`node` environment, source-guard style) · Playwright walk (`scripts/verify-mobile.mjs`). No new dependencies — `pick-ui-library` is ⛔ not triggered (`DEV.md` § 🧰: the mechanism already exists in `package.json`-free code).

**Spec:** `plan/50-tasks.md` rows `T-259` (six items ⓐ–ⓕ + two written contradictions ⓘ ⓘⓘ) and `T-243` (three places, four fences) · `plan/35-design-constitution.md § ב6` (spring paragraph, added 31/08 · `D-158 § ב׳` · `D-159`) · `plan/40-decisions.md` `D-042` (direction, thresholds) · `D-090ⓑ` (1:1 drag) · `D-150` (button order) · `D-190 § 2` (reading ⓐ) · `plan/36-video-spec.md § 5` (invariant «הסימון של מילים מתבצע בכרטיסיות בלבד» — untouched: the swipe lives on the card) · `apple-design` skill § 3 · § 4 · § 5 · § 14.

🎯 **The render:** `docs/design/kol-A-03-card.png`, source `docs/design/render_video_A.py` — `CARD_X, CARD_Y, CARD_W, CARD_H = 30, 168, LW - 60, 372` (`:326`, `LW = 375`) · front word centred at `oy + 128` of a 372px card with the hint at `oy + h - 40` (`:349-356`) · swipe exit `dx = p * (LW + 120)`, `rot = -p * 15` (`:424-425`) · card drops `abs(card_dx) * .06` (`:364`) · badge «ידעתי» pill with the check glyph on the card face from `p > .12` (`:366-372, :426`). **הרנדר מחייב — פריסה וגם בגימור (`36 § 14.4`); שכבה A (נגישות) היא ההחרגה היחידה**, and it is used exactly once here: the two grade buttons the render draws under the card (`answer_buttons`, `:381-392`) become the sr-only accessible channel, because Roy's explicit 06/09 instruction (`T-259ⓕ`) replaces them with the swipe and Layer A still requires a keyboard/screen-reader path.

**Lineage:** `**המשך של: T-233**` (pointer capture + ref-written drag) and `T-157` (1:1 drag) — this plan names `components/Flashcard.tsx`, `lib/core/swipeGrade.ts` and `app/globals.css`, the same files those rows name; it extends them, it is ⛔ not a second mechanism.

## Global Constraints

- **Every learner-facing string is Hebrew, RTL.** New strings in this plan: «החלק ימינה — ידעתי · שמאלה — לא ידעתי» (hint), «ידעתי» / «לא ידעתי» (badge, reusing the button labels). ⛔ No English string reaches a learner.
- **`/lib/core/` is PURE** — `scripts/check-core-purity.mjs` bans `react`, `window.`, `document.`, storage, `process.env`, `fetch(`. `lib/core/spring.ts` and `lib/core/swipeGrade.ts` receive `viewportWidth`, timestamps and samples as arguments; the component measures.
- **Layer A (frozen, `D-102`):** 44px targets · no state in colour alone (badge = text + glyph + colour) · `prefers-reduced-motion` ⇒ **zero** movement (`dragOffset` still returns `x: 0`; `releaseCurve` returns `ms: 0`) — feedback survives as the badge, ⛔ never as motion (`apple-design § 14`) · top-anchored (the card fills its slot; nothing is `justify-center`ed at screen level — `F-011` · `F-016`).
- **Layer B `ב6`:** gesture-released motion = spring `damping 1.0`, `response 0.3–0.4` — this plan fixes `SPRING_RESPONSE_S = 0.3` (§ 0.22 one-liner: the snappy end of the sanctioned range, a card is a component, ⛔ not a full-height surface). Every *timed* transition that remains (badge opacity, card opacity, `linear()` fallback) stays **150–300ms**. Only `transform` and `opacity` are ever animated (`scripts/check-motion.mjs` rule ⓐ).
- **`D-042` thresholds do ⛔ not move:** `SWIPE_EDGE_PX 20` · `SWIPE_MIN_DISTANCE_PX 64` · `SWIPE_MAX_ANGLE_DEG 30`. `resolveSwipe` remains the **only** grade decision; the spring changes the motion, ⛔ never the verdict. Right (`dx > 0`) = «ידעתי» — `D-042` + `D-150`, unchanged.
- **`T-259ⓔ` — the reveal is untouchable:** `<button onClick={reveal} data-reveal>` (`Flashcard.tsx:267-294`) stays a native `<button>`; ⛔ no `<div role="button">`, ⛔ no gesture replaces it. `Flashcard.test.ts` lines 189-249 already guard this and must stay green.
- **`T-259ⓓ` — height is measured against `CardDeck`'s own calc:** `components/CardDeck.tsx:217` `h-[calc(100dvh-10rem)]` is ⛔ not edited. The card grows *inside* that slot (`flex-1` on the face), ⛔ never by adding height above it (that silently breaks `T-086`).
- **⛔ No `style={{}}` in `Flashcard.tsx`** (`Flashcard.test.ts:339`). All node writes go through the existing `sectionRef` (`writeDrag`).
- **`ArenaStage.test.ts:36-40` and `SpellCard.test.ts:23-27` ban `useState`/`useEffect`/`requestAnimationFrame`/`setTimeout`/`Date.now` in those components.** The CSS-`linear()` design exists so the spring needs ⛔ no JS clock in any component. `e.timeStamp` (an event field) is the only time source, and only in `Flashcard.tsx` / `SpellCard.tsx`.
- **Generated files regenerate in the same commit:** `npm run measure:plan` after any register edit (`docs/plan-open.md` + `docs/plan-tables.md`); `npm run generate-map` (if in `package.json`) after any `app/` · `components/` · `lib/` change.
- **`scripts/motion-baseline.md` is ⛔ never extended by DEV.** This plan adds no baseline line; the arena-figure question (Task 6) is a **finding**, ⛔ not a baseline row.

## Measured Discrepancies (this clone, `49464a6`, 2026-09-07T14:36Z — ⛔ not assumed)

1. `T-259ⓑ` says «היום היא זזה 8px (T-157)». **Stale.** `lib/core/swipeGrade.ts:71-75` `dragOffset` returns the raw delta (`x: delta`) and `Flashcard.test.ts:265` (`MUTATION: ⛔ אין תקרה קשיחה`) forbids any cap. The card already tracks 1:1. What ⓑ still asks for and is ⛔ not built: the **release** motion (today `transition: transform 200ms ease-out`, `globals.css:276-289`, exit = `translateX(±32px)`) and an **on-card preview** that the gesture registered.
2. `T-243` quotes `globals.css:155 · :187 · :238`. The three rules now sit at **`:193`** (`[data-arena-card]`), **`:225`** (`[data-arena-stage] [data-arena-figure]`), **`:276`** (`[data-flashcard]`). Same rules, moved by edits above them.
3. `T-243`'s premise «כולם על אלמנט שמשתחרר מאצבע» is **false for the second place**: `components/ArenaStage.tsx` has ⛔ zero pointer handlers (`grep -c onPointer components/ArenaStage.tsx` ⇒ 0); `hit`/`dodge` are **battle-phase state transitions** (`lib/core/battle.ts` `stagePhase`), ⛔ not a gesture release. `35 § ב6`'s spring paragraph names the place by line number, inherited from `C-0371`'s measurement of *transitions on transform*, ⛔ not of gesture releases. ⇒ Task 6 files this as a finding for the PM and leaves the 200ms transition (a legal timed emphasis) in place. ⛔ Not a silent deviation — a measured mis-scoping.
4. `render_video_A.py:381-392` draws **both** the swipe and the two buttons (highlighted during the swipe). `T-259ⓕ` (Roy, 06/09) overrides the buttons' visibility; the badge on the card face (`:366-372`) is what the render shows *on the card*, and it is what this plan builds as the visible feedback.
5. `CardDeck.tsx:285-287` passes `onGrade={(value) => { void grade(...) }}` — the promise is discarded, so `Flashcard` can ⛔ never learn that a grade was not taken (network failure ⇒ `grade` returns early, card stays mounted). The exit spring flies the card off-screen, so a not-taken grade **must** bring it back: Task 4 returns the promise.

---

## File Structure

**Create**
- `lib/core/spring.ts` — critically-damped spring (closed form), settle time, CSS `linear()` easing string, release velocity from pointer samples. PURE.
- `lib/core/spring.test.ts` — the numbers above, measured in a test.

**Modify**
- `lib/core/swipeGrade.ts` — `dragOffset` gains `baseX`; new `swipeExitX`, `swipePose`, `swipeTransform`, three render constants.
- `lib/core/swipeGrade.test.ts` — the additions.
- `components/Flashcard.tsx` — ⓓ layout (face fills the slot, word centred, hint at the bottom) · ⓕ buttons → sr-only accessible channel + Hebrew hint line · badge for both grades · `data-swipe-preview` during drag · spring release with velocity, return when the grade is not taken, grab mid-flight from the presentation value · `onGrade` may return a promise.
- `components/Flashcard.test.ts` — rewrite three `it`s (`:275` canonical channel · `:339` style ban stays · `:355` ref write stays), add six.
- `components/CardDeck.tsx` — `:285-287` return the promise; `:22-43` header comment rewritten (ⓘ — the retired sentence «the two ≥44px buttons … stay the canonical channel» is ⛔ not quoted).
- `components/SpellCard.tsx` — release spring on `translateY` (T-243 place ①) via the same two custom properties; velocity samples in a ref.
- `components/SpellCard.test.ts` — one added `it`.
- `app/globals.css` — `[data-flashcard]` block (`:261-289`) rewritten; `[data-arena-card]` block (`:190-198`) gains the `@supports` rule; new `[data-swipe-badge]` rules. ⛔ All new blocks stay **before** the `/* arena-stage` marker (`:213-217`, `ArenaStage.test.ts` slices from it).
- `scripts/verify-mobile.mjs` — `/dev/card` (`:1640-1685`) and the grade-button block (`:1836-1865`) measure the new channel; `/study` walk (`:2195-2240`) gains the return-on-not-taken and badge checks.
- `plan/40-decisions.md` — one dated amendment line under `D-150` (`:1991-1993`).
- `plan/50-tasks.md` (`T-259`, `T-243` → 🟣) · `plan/60-findings.md` (new finding, Task 6) · `plan/30-architecture.md` (one paragraph: `spring.ts`, the custom-property contract) · `plan/00-control.md` · generated: `docs/plan-open.md` · `docs/plan-tables.md` · `docs/architecture-map.json`.

---

### Task 1: `lib/core/spring.ts` — the spring, in numbers

**Files:**
- Create: `lib/core/spring.ts`
- Create: `lib/core/spring.test.ts`

**Interfaces:**
- Consumes: nothing (pure, no imports).
- Produces:
  ```ts
  export const SPRING_DAMPING_RATIO = 1;            // 35 § ב6 · apple-design § 4 — critically damped
  export const SPRING_RESPONSE_S = 0.3;             // 35 § ב6 range 0.3–0.4; see Global Constraints
  export const SPRING_REST_DISTANCE_PX = 0.5;
  export const SPRING_REST_VELOCITY_PX_S = 10;
  export const SPRING_MAX_SETTLE_MS = 1000;         // guard, never reached at response 0.3 (measured max 429ms)
  export const SPRING_EASING_STOPS = 24;
  export const VELOCITY_WINDOW_MS = 100;
  export const VELOCITY_MAX_SAMPLES = 8;
  export interface SpringState { readonly x: number; readonly v: number }
  export function criticalSpringAt(input: { readonly from: number; readonly velocity: number; readonly target: number; readonly tS: number; readonly responseS?: number }): SpringState
  export function springSettleMs(input: { readonly from: number; readonly velocity: number; readonly target: number; readonly responseS?: number }): number
  export interface ReleaseCurve { readonly ms: number; readonly easing: string }
  export function releaseCurve(input: { readonly from: number; readonly velocity: number; readonly target: number; readonly reducedMotion: boolean; readonly responseS?: number }): ReleaseCurve
  export interface PointerSample { readonly x: number; readonly tMs: number }
  export function pushSample(samples: readonly PointerSample[], sample: PointerSample): readonly PointerSample[]
  export function releaseVelocity(samples: readonly PointerSample[], windowMs?: number): number   // px/s
  ```

- [x] **Step 1: Write the failing tests** — `lib/core/spring.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import {
  criticalSpringAt,
  pushSample,
  releaseCurve,
  releaseVelocity,
  springSettleMs,
  SPRING_EASING_STOPS,
  SPRING_RESPONSE_S,
  VELOCITY_MAX_SAMPLES,
} from './spring';

describe('criticalSpringAt — closed form, damping ratio 1 (35 § ב6 · apple-design § 4)', () => {
  it('starts exactly at `from` with the handed-off velocity (apple-design § 5)', () => {
    const s = criticalSpringAt({ from: 100, velocity: -800, target: 0, tS: 0 });
    expect(s.x).toBe(100);
    expect(s.v).toBe(-800);
  });
  it('arrives at the target', () => {
    expect(criticalSpringAt({ from: 100, velocity: 0, target: 0, tS: 2 }).x).toBeCloseTo(0, 3);
    expect(criticalSpringAt({ from: 100, velocity: 0, target: 495, tS: 2 }).x).toBeCloseTo(495, 3);
  });
  it('never overshoots with zero initial velocity — monotonic, no bounce', () => {
    let previous = 100;
    for (let ms = 1; ms <= 600; ms += 1) {
      const { x } = criticalSpringAt({ from: 100, velocity: 0, target: 0, tS: ms / 1000 });
      expect(x).toBeLessThanOrEqual(previous + 1e-9);
      expect(x).toBeGreaterThanOrEqual(-1e-9);
      previous = x;
    }
  });
  it('carries momentum: velocity AWAY from the target first moves away, then returns', () => {
    let max = 100;
    for (let ms = 1; ms <= 400; ms += 1) {
      max = Math.max(max, criticalSpringAt({ from: 100, velocity: 800, target: 0, tS: ms / 1000 }).x);
    }
    expect(max).toBeGreaterThan(100); // measured 104.8 at response 0.3
    expect(max).toBeLessThan(110);
  });
  it('rejects a non-finite input by holding at the target (no NaN ever reaches a transform)', () => {
    const s = criticalSpringAt({ from: Number.NaN, velocity: 0, target: 0, tS: 0.1 });
    expect(s).toEqual({ x: 0, v: 0 });
  });
});

describe('springSettleMs — the settle time EMERGES, it is not a duration (35 § ב6)', () => {
  it('return 100px→0 at rest velocity settles in 355ms (measured 07/09)', () => {
    expect(springSettleMs({ from: 100, velocity: 0, target: 0 })).toBe(355);
  });
  it('velocity toward the target arrives sooner than a dead release', () => {
    const dead = springSettleMs({ from: 100, velocity: 0, target: 0 });
    const flick = springSettleMs({ from: 100, velocity: -800, target: 0 });
    expect(flick).toBeLessThan(dead);
  });
  it('the render exit (100px → 495px) stays under the 1000ms guard', () => {
    expect(springSettleMs({ from: 100, velocity: 1200, target: 495 })).toBeLessThanOrEqual(450);
  });
  it('response is 0.3 s — the snappy end of the sanctioned 0.3–0.4', () => {
    expect(SPRING_RESPONSE_S).toBe(0.3);
  });
});

describe('releaseCurve — the spring as a CSS linear() easing', () => {
  it('emits `linear(0, …, 1)` with SPRING_EASING_STOPS + 1 stops and a positive duration', () => {
    const curve = releaseCurve({ from: 100, velocity: -800, target: 0, reducedMotion: false });
    const stops = curve.easing.replace(/^linear\(|\)$/g, '').split(',').map((s) => Number(s.trim()));
    expect(stops).toHaveLength(SPRING_EASING_STOPS + 1);
    expect(stops[0]).toBe(0);
    expect(stops[stops.length - 1]).toBe(1);
    expect(stops.every((n) => Number.isFinite(n))).toBe(true);
    expect(curve.ms).toBe(springSettleMs({ from: 100, velocity: -800, target: 0 }));
  });
  it('velocity away from the target is visible in the curve: the first stop dips below 0', () => {
    const curve = releaseCurve({ from: 100, velocity: 800, target: 0, reducedMotion: false });
    const second = Number(curve.easing.replace(/^linear\(|\)$/g, '').split(',')[1]);
    expect(second).toBeLessThan(0);
  });
  it('prefers-reduced-motion ⇒ ms 0, easing `linear` — zero motion, ⛔ not less motion (שכבה A)', () => {
    expect(releaseCurve({ from: 100, velocity: -800, target: 0, reducedMotion: true })).toEqual({
      ms: 0,
      easing: 'linear',
    });
  });
  it('released at rest (|from − target| < 0.5px) ⇒ nothing to animate', () => {
    expect(releaseCurve({ from: 0.2, velocity: 0, target: 0, reducedMotion: false })).toEqual({
      ms: 0,
      easing: 'linear',
    });
  });
});

describe('releaseVelocity — px/s from the last samples (apple-design § 2 · § 5)', () => {
  it('100px over 50ms ⇒ 2000 px/s', () => {
    expect(releaseVelocity([{ x: 0, tMs: 1000 }, { x: 100, tMs: 1050 }])).toBe(2000);
  });
  it('one sample, or none ⇒ 0', () => {
    expect(releaseVelocity([])).toBe(0);
    expect(releaseVelocity([{ x: 5, tMs: 1 }])).toBe(0);
  });
  it('samples older than the window are ignored — a finger that paused then lifted has velocity 0', () => {
    const samples = [{ x: 0, tMs: 0 }, { x: 100, tMs: 60 }, { x: 100, tMs: 400 }];
    expect(releaseVelocity(samples)).toBe(0);
  });
  it('equal timestamps ⇒ 0, never Infinity', () => {
    expect(releaseVelocity([{ x: 0, tMs: 7 }, { x: 40, tMs: 7 }])).toBe(0);
  });
  it('pushSample caps the ring at VELOCITY_MAX_SAMPLES and keeps the newest', () => {
    let ring: readonly { x: number; tMs: number }[] = [];
    for (let i = 0; i < 20; i += 1) ring = pushSample(ring, { x: i, tMs: i });
    expect(ring).toHaveLength(VELOCITY_MAX_SAMPLES);
    expect(ring[ring.length - 1]).toEqual({ x: 19, tMs: 19 });
  });
});
```

- [x] **Step 2: Run to confirm red**

Run: `npx vitest run lib/core/spring.test.ts`
Expected: FAIL — `Cannot find module './spring'`.

- [x] **Step 3: Implement** — `lib/core/spring.ts`

```ts
/**
 * PURE. No React, no DOM, no clock, no env, no I/O.
 *
 * T-243 · T-259ⓑ · 35 § ב6 · D-158 § ב׳ · D-159 · `apple-design` § 4 · § 5.
 *
 * A critically damped spring (damping ratio 1) in Apple's two designer parameters:
 * damping ratio and RESPONSE (seconds) — ⛔ not mass/stiffness, ⛔ not a duration. The
 * settle time is an OUTCOME (`springSettleMs`), which is why 35 § ב6 says a spring cannot
 * be written in the language of «150–300ms».
 *
 * Why closed form, and why a CSS `linear()` string: the components that release a
 * gesture are forbidden a JS clock (`SpellCard.test.ts:23`, `ArenaStage.test.ts:40`), and
 * `Flashcard.tsx` already pays one rAF per frame for the drag alone (T-233). A spring
 * sampled here into `linear(0, …, 1)` plus its settle duration lets the BROWSER run the
 * curve on the compositor, with the velocity of the finger baked into the shape. The
 * component sets two custom properties and touches no clock.
 *
 * Interruptibility (`apple-design` § 3) is handled by the component: a `pointerdown`
 * mid-flight reads the presentation transform and hands `dragOffset` a `baseX`.
 */

export const SPRING_DAMPING_RATIO = 1;
export const SPRING_RESPONSE_S = 0.3;
export const SPRING_REST_DISTANCE_PX = 0.5;
export const SPRING_REST_VELOCITY_PX_S = 10;
export const SPRING_MAX_SETTLE_MS = 1000;
export const SPRING_EASING_STOPS = 24;
export const VELOCITY_WINDOW_MS = 100;
export const VELOCITY_MAX_SAMPLES = 8;

export interface SpringState {
  readonly x: number;
  readonly v: number;
}

/** ω = 2π / response — Apple's «response» is the period of the undamped spring. */
function omega(responseS: number): number {
  return (2 * Math.PI) / responseS;
}

export function criticalSpringAt(input: {
  readonly from: number;
  readonly velocity: number;
  readonly target: number;
  readonly tS: number;
  readonly responseS?: number;
}): SpringState {
  const { from, velocity, target, tS } = input;
  const responseS = input.responseS ?? SPRING_RESPONSE_S;
  for (const value of [from, velocity, target, tS, responseS]) {
    // A non-finite number is neither «zero» nor «a lot»: it would reach a transform as NaN.
    if (!Number.isFinite(value)) return { x: Number.isFinite(target) ? target : 0, v: 0 };
  }
  const w = omega(responseS);
  // ζ = 1 ⇒ x(t) = target + (c1 + c2·t)·e^(−ωt), c1 = x0 − target, c2 = v0 + ω·c1.
  const c1 = from - target;
  const c2 = velocity + w * c1;
  const e = Math.exp(-w * tS);
  return {
    x: target + (c1 + c2 * tS) * e,
    v: (c2 - w * (c1 + c2 * tS)) * e,
  };
}

export function springSettleMs(input: {
  readonly from: number;
  readonly velocity: number;
  readonly target: number;
  readonly responseS?: number;
}): number {
  for (let ms = 0; ms <= SPRING_MAX_SETTLE_MS; ms += 1) {
    const s = criticalSpringAt({ ...input, tS: ms / 1000 });
    if (
      Math.abs(s.x - input.target) < SPRING_REST_DISTANCE_PX &&
      Math.abs(s.v) < SPRING_REST_VELOCITY_PX_S
    ) {
      return ms;
    }
  }
  return SPRING_MAX_SETTLE_MS;
}

export interface ReleaseCurve {
  readonly ms: number;
  readonly easing: string;
}

const AT_REST: ReleaseCurve = { ms: 0, easing: 'linear' };

export function releaseCurve(input: {
  readonly from: number;
  readonly velocity: number;
  readonly target: number;
  readonly reducedMotion: boolean;
  readonly responseS?: number;
}): ReleaseCurve {
  // שכבה A: reduced motion is ZERO motion. The feedback survives as the badge, not here.
  if (input.reducedMotion) return AT_REST;
  const span = input.target - input.from;
  if (!Number.isFinite(span) || Math.abs(span) < SPRING_REST_DISTANCE_PX) return AT_REST;
  const ms = springSettleMs(input);
  if (ms === 0) return AT_REST;
  const stops: string[] = [];
  for (let i = 0; i <= SPRING_EASING_STOPS; i += 1) {
    const tS = (ms / 1000) * (i / SPRING_EASING_STOPS);
    const { x } = criticalSpringAt({ ...input, tS });
    // Progress is normalised to the span: values < 0 (moving away first) and > 1 are legal
    // in `linear()`, and they are exactly what a thrown card looks like.
    const p = i === SPRING_EASING_STOPS ? 1 : (x - input.from) / span;
    stops.push(i === 0 ? '0' : p.toFixed(3));
  }
  return { ms, easing: `linear(${stops.join(', ')})` };
}

export interface PointerSample {
  readonly x: number;
  readonly tMs: number;
}

export function pushSample(
  samples: readonly PointerSample[],
  sample: PointerSample,
): readonly PointerSample[] {
  const next = [...samples, sample];
  return next.length > VELOCITY_MAX_SAMPLES ? next.slice(next.length - VELOCITY_MAX_SAMPLES) : next;
}

/**
 * Velocity at release in px/s: the oldest sample still inside the window against the
 * last one. ⛔ Not the last two alone — two `pointermove`s 4ms apart on a 120Hz screen
 * measure jitter, ⛔ not intent. A finger that stopped and then lifted has velocity 0.
 */
export function releaseVelocity(
  samples: readonly PointerSample[],
  windowMs: number = VELOCITY_WINDOW_MS,
): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  if (last === undefined) return 0;
  const first = samples.find((s) => last.tMs - s.tMs <= windowMs);
  if (first === undefined || first === last) return 0;
  const dt = last.tMs - first.tMs;
  if (!(dt > 0)) return 0;
  const v = ((last.x - first.x) / dt) * 1000;
  return Number.isFinite(v) ? v : 0;
}
```

- [x] **Step 4: Run to confirm green, and the purity gate**

Run: `npx vitest run lib/core/spring.test.ts && npm run check:core`
Expected: all `it`s PASS · `/lib/core purity: OK`.

- [x] **Step 5: Commit (task 1 of 6)**

```bash
./scripts/g add lib/core/spring.ts lib/core/spring.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-243 — lib/core/spring: critically-damped spring, settle time, linear() easing, release velocity (pure)"
```
(`C-XXXX` = this tick's id from `node scripts/next-cycle-id.mjs`. ⛔ Push only with `verify` — the pre-push hook runs it — after Task 6, or at the end of the tick.)

---

### Task 2: `lib/core/swipeGrade.ts` — the render's exit geometry, and a grab that starts from where the card is

**Files:**
- Modify: `lib/core/swipeGrade.ts:59-77` (`dragOffset`), append after `resolveSwipe`
- Modify: `lib/core/swipeGrade.test.ts` (append)

**Interfaces:**
- Consumes: `CardGrade` from `./flashcard` (already imported).
- Produces:
  ```ts
  export const SWIPE_EXIT_OVERSHOOT_PX = 120;  // render_video_A.py:424 — dx = p * (LW + 120)
  export const SWIPE_EXIT_ROTATE_DEG = 15;     // :425 — rot = -p * 15
  export const SWIPE_EXIT_DROP_RATIO = 0.06;   // :364 — CARD_Y + abs(card_dx) * .06
  export function dragOffset(input: { readonly startX: number; readonly currentX: number; readonly reducedMotion: boolean; readonly baseX?: number }): DragOffset
  export function swipeExitX(grade: CardGrade, viewportWidth: number): number
  export interface SwipePose { readonly x: number; readonly y: number; readonly rotateDeg: number }
  export function swipePose(x: number, viewportWidth: number): SwipePose
  export function swipeTransform(pose: SwipePose): string   // '' at rest
  ```

- [x] **Step 1: Write the failing tests** — append to `lib/core/swipeGrade.test.ts`

```ts
import {
  dragOffset,
  swipeExitX,
  swipePose,
  swipeTransform,
  SWIPE_EXIT_OVERSHOOT_PX,
  SWIPE_EXIT_ROTATE_DEG,
} from './swipeGrade';

describe('T-259 · T-243 — a grab mid-flight starts from the presentation value (apple-design § 3)', () => {
  it('baseX is added to the finger delta', () => {
    expect(dragOffset({ startX: 200, currentX: 230, reducedMotion: false, baseX: 80 }).x).toBe(110);
  });
  it('baseX defaults to 0 — every existing caller is unchanged', () => {
    expect(dragOffset({ startX: 200, currentX: 230, reducedMotion: false }).x).toBe(30);
  });
  it('reduced motion still returns zero, baseX or not (שכבה A)', () => {
    expect(dragOffset({ startX: 200, currentX: 230, reducedMotion: true, baseX: 80 }).x).toBe(0);
  });
});

describe('T-259 — the exit pose is the render (render_video_A.py:364, :424-425)', () => {
  it('«ידעתי» exits to the right by viewport + 120, «לא ידעתי» mirrors it', () => {
    expect(swipeExitX('good', 375)).toBe(375 + SWIPE_EXIT_OVERSHOOT_PX);
    expect(swipeExitX('again', 375)).toBe(-(375 + SWIPE_EXIT_OVERSHOOT_PX));
  });
  it('at rest the pose is zero and the transform is the empty string', () => {
    expect(swipePose(0, 375)).toEqual({ x: 0, y: 0, rotateDeg: 0 });
    expect(swipeTransform(swipePose(0, 375))).toBe('');
  });
  it('at the exit the card has turned −15° and dropped 6% of its travel', () => {
    const pose = swipePose(swipeExitX('good', 375), 375);
    expect(pose.rotateDeg).toBeCloseTo(-SWIPE_EXIT_ROTATE_DEG, 6);
    expect(pose.y).toBeCloseTo(495 * 0.06, 6);
  });
  it('a leftward swipe turns the other way — the mirror of the render, ⛔ not a second rule', () => {
    expect(swipePose(swipeExitX('again', 375), 375).rotateDeg).toBeCloseTo(SWIPE_EXIT_ROTATE_DEG, 6);
  });
  it('the transform names translateX, translateY and rotate in that order', () => {
    expect(swipeTransform({ x: 100, y: 6, rotateDeg: -3 })).toBe('translateX(100px) translateY(6px) rotate(-3deg)');
  });
  it('a non-finite offset is treated as rest', () => {
    expect(swipePose(Number.NaN, 375)).toEqual({ x: 0, y: 0, rotateDeg: 0 });
  });
});
```

- [x] **Step 2: Run to confirm red**

Run: `npx vitest run lib/core/swipeGrade.test.ts`
Expected: FAIL — `swipeExitX is not a function` (and `baseX` ignored ⇒ `110` expected, `30` received).

- [x] **Step 3: Implement** — edit `lib/core/swipeGrade.ts`

Replace the `dragOffset` signature and body (`:63-77`):
```ts
export function dragOffset(input: {
  readonly startX: number;
  readonly currentX: number;
  readonly reducedMotion: boolean;
  /** T-259 · `apple-design` § 3 — the card's presentation offset at `pointerdown`, when the
   *  finger grabs it MID-FLIGHT. Default 0: a grab at rest is the old behaviour exactly. */
  readonly baseX?: number;
}): DragOffset {
  if (input.reducedMotion) return { x: 0, settleMs: 0 };
  const base = input.baseX ?? 0;
  const delta = input.currentX - input.startX + base;
  if (!Number.isFinite(delta)) return { x: 0, settleMs: 0 };
  return { x: delta, settleMs: 0 };
}
```
(Keep every existing comment line inside `dragOffset` — only the signature and the two `delta` lines change. `Flashcard.test.ts:265` forbids `Math.min|max|sign` in this body; the addition is a plain `+`.)

Append after `resolveSwipe`:
```ts
/**
 * T-259 · 36 § 14.4 — the exit pose is the RENDER, quoted, ⛔ not designed:
 *   `render_video_A.py:424`  dx  = p * (LW + 120)        ⇒ the card leaves the viewport by 120px
 *   `render_video_A.py:425`  rot = -p * 15               ⇒ −15° at full travel, rightward
 *   `render_video_A.py:364`  y   = CARD_Y + abs(dx) * .06 ⇒ it drops 6% of its travel
 * A leftward swipe is the mirror. `p` is the fraction of the travel, so the pose during the
 * DRAG is the same function of `x` — the finger draws the same curve the spring finishes.
 */
export const SWIPE_EXIT_OVERSHOOT_PX = 120;
export const SWIPE_EXIT_ROTATE_DEG = 15;
export const SWIPE_EXIT_DROP_RATIO = 0.06;

export function swipeExitX(grade: CardGrade, viewportWidth: number): number {
  const travel = viewportWidth + SWIPE_EXIT_OVERSHOOT_PX;
  return grade === 'good' ? travel : -travel;
}

export interface SwipePose {
  readonly x: number;
  readonly y: number;
  readonly rotateDeg: number;
}

const REST_POSE: SwipePose = { x: 0, y: 0, rotateDeg: 0 };

export function swipePose(x: number, viewportWidth: number): SwipePose {
  if (!Number.isFinite(x) || !Number.isFinite(viewportWidth) || x === 0) return REST_POSE;
  const travel = viewportWidth + SWIPE_EXIT_OVERSHOOT_PX;
  if (!(travel > 0)) return REST_POSE;
  const p = x / travel;
  return { x, y: Math.abs(x) * SWIPE_EXIT_DROP_RATIO, rotateDeg: -SWIPE_EXIT_ROTATE_DEG * p };
}

export function swipeTransform(pose: SwipePose): string {
  if (pose.x === 0 && pose.y === 0 && pose.rotateDeg === 0) return '';
  return `translateX(${pose.x}px) translateY(${pose.y}px) rotate(${pose.rotateDeg}deg)`;
}
```

- [x] **Step 4: Run to confirm green**

Run: `npx vitest run lib/core/swipeGrade.test.ts components/Flashcard.test.ts && npm run check:core`
Expected: PASS (the `MUTATION` test at `Flashcard.test.ts:265` still green — no `Math.min/max/sign` in `dragOffset`).

- [x] **Step 5: Commit (task 2 of 6)**

```bash
./scripts/g add lib/core/swipeGrade.ts lib/core/swipeGrade.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-259 — swipeGrade: exit pose quoted from render_video_A.py, baseX for a grab mid-flight (pure)"
```

---

### Task 3: `Flashcard` — the swipe is the visible channel; the buttons become the accessible one (T-259 ⓓ ⓔ ⓕ ⓘ ⓘⓘ)

⛔ No motion changes in this task — the release still uses today's 200ms transition. This task is the **layout and the channel**; Task 4 is the spring. Splitting them keeps each commit reviewable on its own.

**Files:**
- Modify: `components/Flashcard.tsx:73-104` (`writeDrag` / `queueDrag` gain the preview attribute) · `:220-226` (`onPointerMove` computes the preview) · `:266-345` (both faces: fill the slot, centre the word) · `:423-443` (buttons → sr-only + hint + badges)
- Modify: `components/CardDeck.tsx:22-43` (header comment, contradiction ⓘ)
- Modify: `plan/40-decisions.md:1993` (one amendment line under `D-150`, contradiction ⓘ)
- Modify: `components/Flashcard.test.ts:275-280` (rewrite) + append
- Modify: `scripts/verify-mobile.mjs:1677-1683` · `:1836-1865` · `:2195` (before the edge-zone drive)

**Interfaces:**
- Consumes: `resolveSwipe`, `dragOffset` from `@/lib/core/swipeGrade` (unchanged signatures; `baseX` unused until Task 4).
- Produces (DOM contract, read by CSS in this task and by the walk):
  - `section[data-flashcard][data-swipe-preview="good"|"again"]` — present **only while** the current drag would resolve to that grade (`resolveSwipe` on every `pointermove`, written in the same rAF as the offset).
  - `[data-swipe-badge="good"]` · `[data-swipe-badge="again"]` — two `aria-hidden` pills inside the revealed face; opacity driven by CSS from `data-swipe-preview` / `data-swipe`.
  - `[data-swipe-hint]` — the Hebrew instruction line, rendered exactly when `swipeActive`.
  - `button[data-grade]` ×2 — unchanged handlers, now `sr-only focus:not-sr-only`.

- [x] **Step 1: Write the failing tests** — edit `components/Flashcard.test.ts`

Replace the `it` at `:275-280` (`'D-042 — שני הכפתורים נשארים הערוץ הקנוני'`) with:
```ts
  /**
   * T-259ⓕ (Roy, 06/09) · שכבה א׳ (ⓘⓘ) — the swipe is the PRIMARY channel; the two buttons
   * are ⛔ not deleted, they become the accessible equivalent: in the DOM, focusable,
   * labelled, and visible the moment a keyboard user reaches them (`focus:not-sr-only`).
   * ⛔ `display: none` / `hidden` would remove them from the accessibility tree too.
   */
  it('T-259ⓕ — שני הכפתורים נשארים ב-DOM כערוץ הנגיש: sr-only עד פוקוס, ⛔ לא נמחקו', () => {
    for (const grade of ['good', 'again'] as const) {
      const at = T085_CARD_SRC.indexOf(`data-grade="${grade}"`);
      expect(at, `data-grade="${grade}" חייב להתקיים`).toBeGreaterThan(-1);
      const open = T085_CARD_SRC.lastIndexOf('<button', at);
      const close = T085_CARD_SRC.indexOf('</button>', at);
      const block = T085_CARD_SRC.slice(open, close);
      expect(block).toContain('sr-only');
      expect(block).toContain('focus:not-sr-only');
      expect(block).toContain('focus:min-h-touch');
      expect(block).not.toMatch(/\bhidden\b/);
    }
    expect(T085_CARD_SRC).toContain('לא ידעתי');
    expect(T085_CARD_SRC).toContain('ידעתי');
  });
```

Append inside the same `describe` (`'the card face is the button …'`, before its closing `});`):
```ts
  it('T-259ⓕ — the visible instruction is Hebrew, names BOTH directions, and glyphs are aria-hidden', () => {
    const at = T085_CARD_SRC.indexOf('data-swipe-hint');
    expect(at).toBeGreaterThan(-1);
    const block = T085_CARD_SRC.slice(at, T085_CARD_SRC.indexOf('</p>', at));
    expect(block).toContain('החלק ימינה');
    expect(block).toContain('שמאלה');
    expect(block).toContain('ידעתי');
    expect(block).toContain('לא ידעתי');
    expect(block).toMatch(/aria-hidden="true">✓/);
    expect(block).toMatch(/aria-hidden="true">✕/);
  });

  it('T-259ⓑ — two badges on the card face, text + glyph + colour, ⛔ never colour alone (שכבה א׳)', () => {
    for (const grade of ['good', 'again'] as const) {
      const at = T085_CARD_SRC.indexOf(`data-swipe-badge="${grade}"`);
      expect(at, `badge ${grade}`).toBeGreaterThan(-1);
      const block = T085_CARD_SRC.slice(T085_CARD_SRC.lastIndexOf('<span', at), T085_CARD_SRC.indexOf('</span>', at));
      expect(block).toContain('aria-hidden="true"');
      expect(block).toContain(grade === 'good' ? 'text-success' : 'text-danger');
      expect(block).toContain(grade === 'good' ? '✓' : '✕');
      expect(block).toContain(grade === 'good' ? 'ידעתי' : 'לא ידעתי');
    }
    expect((T085_CARD_SRC.match(/data-swipe-badge=/g) ?? []).length).toBe(2);
  });

  it('T-259ⓑ — the preview is `resolveSwipe`, written in the pointermove path, ⛔ not a second rule', () => {
    const move = T085_CARD_SRC.indexOf('onPointerMove=');
    const cancel = T085_CARD_SRC.indexOf('onPointerCancel=');
    const block = T085_CARD_SRC.slice(move, cancel);
    expect(block).toContain('resolveSwipe(');
    expect(T085_CARD_SRC).toContain('data-swipe-preview');
    // The preview must NEVER call onGrade: it is a look-ahead, not a verdict.
    expect(block).not.toContain('onGrade(');
  });

  it('T-259ⓓ — the face fills the deck slot (flex-1) and the height stays CardDeck’s calc', () => {
    const faces = T085_CARD_SRC.match(/rounded-2xl border border-border-subtle bg-surface-raised[^"]*"/g) ?? [];
    expect(faces.length).toBe(2);
    for (const face of faces) {
      expect(face).toContain('flex-1');
      expect(face).toContain('text-center');
      expect(face).toContain('relative');
    }
    expect(T085_CARD_SRC).not.toContain('h-[calc(');
    expect(readFileSync(join('components', 'CardDeck.tsx'), 'utf8')).toContain('h-[calc(100dvh-10rem)]');
  });

  it('T-259ⓔ — the reveal button is byte-for-byte the native <button> (⛔ not a div, ⛔ not a gesture)', () => {
    expect(T085_CARD_SRC).toMatch(/<button\s+type="button"\s+onClick=\{reveal\}\s+data-reveal/);
    expect(T085_CARD_SRC).not.toContain('role="button"');
  });

  it('T-259ⓘ — CardDeck no longer calls the buttons «the canonical channel»; it names T-259', () => {
    const deck = readFileSync(join('components', 'CardDeck.tsx'), 'utf8');
    expect(deck).not.toContain('canonical channel');
    expect(deck).toContain('T-259');
    const decisions = readFileSync(join('plan', '40-decisions.md'), 'utf8');
    const d150 = decisions.indexOf('### D-150');
    expect(decisions.slice(d150, d150 + 2500)).toContain('T-259ⓕ');
  });
```

- [x] **Step 2: Run to confirm red**

Run: `npx vitest run components/Flashcard.test.ts`
Expected: FAIL on the seven `T-259` cases (`sr-only` missing, `data-swipe-hint` missing, `data-swipe-badge` missing, `data-swipe-preview` missing, `flex-1` missing, `canonical channel` still present).

- [x] **Step 3: Implement the preview write** — `components/Flashcard.tsx:69-104`

Replace `pendingX`/`writeDrag`/`queueDrag` with a pending **pose**:
```ts
  const sectionRef = useRef<HTMLElement | null>(null);
  /** T-259ⓑ — one pending write per frame carries the offset AND the look-ahead verdict. */
  const pending = useRef<{ x: number; preview: CardGrade | null }>({ x: 0, preview: null });
  const frame = useRef<number | null>(null);

  /** Writes the drag to the node. `x === 0` drops `data-dragging` (globals.css restores the
   *  transition) and the preview; the badge follows `data-swipe-preview` in CSS. */
  const writeDrag = (x: number, preview: CardGrade | null) => {
    const node = sectionRef.current;
    if (node === null) return;
    if (x === 0) {
      node.style.transform = '';
      node.removeAttribute('data-dragging');
    } else {
      node.style.transform = `translateX(${x}px)`;
      node.setAttribute('data-dragging', 'true');
    }
    if (preview === null) node.removeAttribute('data-swipe-preview');
    else node.setAttribute('data-swipe-preview', preview);
  };

  const resetDrag = () => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    pending.current = { x: 0, preview: null };
    writeDrag(0, null);
  };

  const queueDrag = (x: number, preview: CardGrade | null) => {
    pending.current = { x, preview };
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      writeDrag(pending.current.x, pending.current.preview);
    });
  };
```
And `onPointerMove` (`:220-226`):
```ts
      onPointerMove={(e) => {
        const from = swipeFrom.current;
        if (from === null) return;
        // T-259ⓑ — the look-ahead is the SAME rule that will grade on release (D-042):
        // the badge lights exactly when lifting now would count. ⛔ It never grades.
        const preview = resolveSwipe({
          startX: from.x,
          startY: from.y,
          endX: e.clientX,
          endY: e.clientY,
          viewportWidth: window.innerWidth,
        });
        queueDrag(dragOffset({ startX: from.x, currentX: e.clientX, reducedMotion }).x, preview);
      }}
```

- [x] **Step 4: Implement the layout (ⓓ) and the badges** — `components/Flashcard.tsx:266-345`

Front face (`<button … data-reveal>`): className becomes
`"rounded-2xl border border-border-subtle bg-surface-raised relative flex w-full flex-1 flex-col p-6 text-center"`
(was `w-full rounded-2xl … text-start`; the three tokens `rounded-2xl border border-border-subtle bg-surface-raised` stay FIRST and contiguous — the `T-259ⓓ` source test anchors on them and reads the classes that follow). Wrap the prompt, the word and the decay line in `<div className="my-auto">…</div>`; the hint `<p … data-reveal-hint>` gets `className="mt-auto pt-6 text-sm text-ink-muted"`. Add above the `<button>` a comment:
```tsx
      {/* T-259ⓓ · render_video_A.py:326,:349-356 — the card is 315×372 on a 375 screen, the
          word sits at 34% of its height (oy+128 of 372) and the hint at the bottom edge
          (oy+h-40). The face is `flex-1` INSIDE CardDeck's `h-[calc(100dvh-10rem)]` slot
          (`CardDeck.tsx:217`) — ⛔ no height of its own, that calc is T-086's and breaks
          silently. Three auto margins (word top/bottom, hint top) put the word at ⅓ —
          the render's 34%. ⛔ Not vertical centring at screen level (F-011 · F-016): the
          section is still top-anchored; only the word inside the card is. */}
```
Revealed face (`<div className="rounded-2xl …">`): className becomes
`"rounded-2xl border border-border-subtle bg-surface-raised relative flex w-full flex-1 flex-col p-6 text-center"`; wrap everything inside it (prompt → back block) in `<div className="my-auto">…</div>`, and add the two badges as the **last** children of the face:
```tsx
          {/* T-259ⓑ · render_video_A.py:366-372 — the badge the render draws ON the card
              from p > .12: a pill at the card's vertical centre, glyph + label. Two are
              always in the DOM; CSS shows the one `data-swipe-preview` / `data-swipe`
              names. `aria-hidden`: the accessible channel is the two buttons below, and
              a screen reader announcing «ידעתי» mid-drag would announce a guess.
              § 0.22: the render fills the pill at 20% of the grade colour; the palette
              carries no alpha slot (`globals.css:111-116`) ⇒ `bg-surface-raised`, opaque,
              which also keeps the label ≥ 4.5:1 over any card content. */}
          <span
            aria-hidden="true"
            data-swipe-badge="good"
            className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto flex w-fit -translate-y-1/2 items-center gap-2 rounded-full border-2 border-success bg-surface-raised px-6 py-3 text-base font-bold text-success"
          >
            ✓ ידעתי
          </span>
          <span
            aria-hidden="true"
            data-swipe-badge="again"
            className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto flex w-fit -translate-y-1/2 items-center gap-2 rounded-full border-2 border-danger bg-surface-raised px-6 py-3 text-base font-bold text-danger"
          >
            ✕ לא ידעתי
          </span>
```

- [x] **Step 5: Implement the channel (ⓕ · ⓘⓘ)** — `components/Flashcard.tsx:423-443`

Replace the `{swipeActive ? (<div className="grid grid-cols-2 gap-3">…) : null}` block with:
```tsx
        {swipeActive ? (
          <>
            {/* T-259ⓕ (Roy, 06/09) — the swipe IS the grade channel. The instruction is
                text: direction ⇢ verdict, both directions, glyph + word (שכבה א׳ — never
                colour alone, and F-102 measured that «right» is ambiguous under RTL
                unless it is written). D-042 · D-150: physical right = «ידעתי». */}
            <p data-swipe-hint className="text-center text-sm text-ink-muted">
              {'החלק ימינה — '}
              <span aria-hidden="true">✓</span>
              {' ידעתי · שמאלה — '}
              <span aria-hidden="true">✕</span>
              {' לא ידעתי'}
            </p>
            {/* ⓘⓘ · שכבה א׳ — a gesture is not reachable by keyboard or screen reader, so the
                two buttons SURVIVE as the accessible equivalent: in the DOM and focusable,
                `sr-only` until a keyboard user reaches them, then visible at ≥44px. Same
                handler as the swipe — ⛔ never a second grading path (D-042).
                ⛔ D-150 · render_video_A.py:385 — «ידעתי» is still the first grid item ⇒
                on the right under RTL. Order unchanged; only visibility changed. */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onGrade('good')}
                data-grade="good"
                className="sr-only focus:not-sr-only focus:min-h-touch focus:px-4 focus:py-3 rounded-lg border-2 border-success text-base font-semibold text-success active:opacity-90"
              >
                <span aria-hidden="true">✓ </span>ידעתי
              </button>
              <button
                type="button"
                onClick={() => onGrade('again')}
                data-grade="again"
                className="sr-only focus:not-sr-only focus:min-h-touch focus:px-4 focus:py-3 rounded-lg border-2 border-danger text-base font-semibold text-danger active:opacity-90"
              >
                <span aria-hidden="true">✕ </span>לא ידעתי
              </button>
            </div>
          </>
        ) : null}
```

- [x] **Step 6: Close contradiction ⓘ in writing** — `components/CardDeck.tsx:22-43` and `plan/40-decisions.md:1993`

In `CardDeck.tsx`, replace the sentence beginning `What survives, and is not negotiable:` through `— ⛔ never a second path with its own logic.` with:
```
 *    ⚠️ **REVISED 07/09 (T-259ⓕ · Roy's explicit instruction, 06/09).** The swipe is the
 *    PRIMARY grade channel; the two ≥44px buttons stay in the DOM as the accessible
 *    equivalent (שכבה א׳ — `sr-only` until focused) and the swipe calls **exactly the
 *    same handler** — ⛔ never a second path with its own logic. The sentence that stood
 *    here until 07/09 named the buttons as the channel and is deliberately ⛔ not quoted:
 *    a dead instruction in a live file is one some agent will still obey (`36 § 14.4`).
```
In `plan/40-decisions.md`, directly after line `1993` (`> [D-150] …`), add:
```
> ✏️ **תוספת 07/09 (DEV, `C-XXXX` · `T-259ⓕ` · הוראה מפורשת של רוי 06/09):** ההחלקה היא ערוץ הסימון **הראשי**; שני הכפתורים נשארים ב-DOM כערוץ הנגיש שווה-הערך (`sr-only` עד פוקוס — שכבה א׳). **סדרם** («ידעתי» ראשונה ⇒ מימין) **וכיוון ההחלקה** (ימין = «ידעתי») ⛔ לא זזו — ההכרעה הזאת עומדת כלשונה; מה שהשתנה הוא **הנראוּת** בלבד. ⛔ אין כאן הכרעת PM חדשה: המקור הכתוב הוא שורת `T-259` ברשם, והשורה הזאת רק מצביעה אליה.
```

- [x] **Step 7: Run the unit gate**

Run: `npx vitest run components/Flashcard.test.ts components/CardDeck.test.ts && npm run typecheck`
Expected: PASS · `tsc` clean.

- [x] **Step 8: Measure the channel in a real engine** — `scripts/verify-mobile.mjs`

ⓐ At `:1677-1683` (`/dev/card`, the `for (const grade of ['again', 'good'])` loop), keep the label check and add after the loop:
```js
          // T-259ⓕ · שכבה א׳ — the two buttons are the ACCESSIBLE channel: in the DOM,
          // invisible at rest (sr-only), and ≥44px the moment a keyboard user focuses one.
          const rest = await page.evaluate(() =>
            [...document.querySelectorAll('[data-grade]')].map((el) => el.getBoundingClientRect().height),
          );
          check(
            rest.length === 2 && rest.every((h) => h <= 1),
            `${at} T-259ⓕ: both grade buttons are sr-only at rest`,
            `heights ${JSON.stringify(rest)}`,
          );
          for (const grade of ['good', 'again']) {
            await page.focus(`[data-grade="${grade}"]`);
            const box = await page.locator(`[data-grade="${grade}"]`).boundingBox();
            check(
              box !== null && box.height >= MIN_TAP && box.width >= MIN_TAP,
              `${at} T-259ⓕ: focused "${grade}" is a ≥${MIN_TAP}px target`,
              `box ${JSON.stringify(box)}`,
            );
          }
          const hint = (await page.locator('[data-swipe-hint]').allInnerTexts()).join('');
          check(
            hint.includes('ידעתי') && hint.includes('לא ידעתי') && hint.includes('ימינה'),
            `${at} T-259ⓕ: the swipe instruction names both directions in Hebrew`,
            `hint was "${hint}"`,
          );
          const badges = await page.evaluate(() =>
            [...document.querySelectorAll('[data-swipe-badge]')].map((el) => getComputedStyle(el).opacity),
          );
          check(
            badges.length === 2 && badges.every((o) => o === '0'),
            `${at} T-259ⓑ: both badges exist and are invisible at rest`,
            `opacities ${JSON.stringify(badges)}`,
          );
```
ⓑ At `:1836-1865` (the `/study` grade-button geometry block): replace the `grades.count === 2` / `grades.small === 0` / gap checks with the same rest-height + focus-box measurement as ⓐ (copy the block, it is the same claim on the real deck), keeping the `await page.locator('[data-reveal]').first().click();` that precedes it.
ⓒ The route-level tap-target scan (`:964-1007`) treats a 1×1px box as undersized, ⛔ not hidden — an `sr-only` control is `width: 1px; height: 1px; clip: rect(0,0,0,0)`. Extend the filter at `:987-989` so a clipped-to-nothing control is hidden (its ≥44px claim is measured **in the focused state** by ⓐ/ⓑ, ⛔ never waived):
```js
            // T-259ⓕ — `sr-only` (Tailwind): 1×1px, clipped to nothing. Hidden, not undersized;
            // its 44px is measured when FOCUSED, in the T-259 blocks, ⛔ never here.
            if (getComputedStyle(el).clip === 'rect(0px, 0px, 0px, 0px)') return false;
```
ⓔ `:1626` (`/dev/card/swap`) clicks `[data-grade="good"]`. A clipped `sr-only` control is not hit-testable at its 1×1 point and Playwright's `.click()` would wait for it forever. Replace it with the keyboard path — which is exactly the accessible channel ⓘⓘ promises, now measured end-to-end:
```js
          // T-259ⓕ · שכבה א׳ — the button is sr-only; grade it the way a keyboard user does.
          await page.focus('[data-grade="good"]');
          await page.keyboard.press('Enter');
```
ⓓ At `:2195`, **before** the edge-zone drive, add the preview drive:
```js
        // T-259ⓑ — the look-ahead: 100px to the right lights the «ידעתי» badge; back
        // under the 64px threshold puts it out; lifting there grades NOTHING (D-042ⓑ).
        {
          const previewCard = page.locator('[data-flashcard]').first();
          if ((await previewCard.locator('[data-reveal]').count()) > 0) {
            await previewCard.locator('[data-reveal]').click();
          }
          await page.evaluate(() => window.scrollTo(0, 0));
          const beforePreview = await remainingNow();
          const pbox = await previewCard.boundingBox();
          const px0 = Math.round(width / 2) - 50;
          const py0 = Math.round(pbox.y + pbox.height / 2);
          await page.mouse.move(px0, py0);
          await page.mouse.down();
          await page.mouse.move(px0 + 100, py0, { steps: 8 });
          await page.waitForFunction(
            () => getComputedStyle(document.querySelector('[data-swipe-badge="good"]')).opacity === '1',
            null,
            { timeout: 1000 },
          ).catch(() => null);
          const lit = await page.evaluate(() => ({
            preview: document.querySelector('[data-flashcard]').getAttribute('data-swipe-preview'),
            badge: getComputedStyle(document.querySelector('[data-swipe-badge="good"]')).opacity,
          }));
          check(lit.preview === 'good' && lit.badge === '1', `${at} T-259ⓑ: 100px right lights «ידעתי» on the card`, JSON.stringify(lit));
          await page.mouse.move(px0 + 10, py0, { steps: 4 });
          await page.waitForFunction(
            () => document.querySelector('[data-flashcard]').getAttribute('data-swipe-preview') === null,
            null,
            { timeout: 1000 },
          ).catch(() => null);
          const out = await page.evaluate(() => document.querySelector('[data-flashcard]').getAttribute('data-swipe-preview'));
          check(out === null, `${at} T-259ⓑ: back under the threshold, the preview is gone`, `preview="${out}"`);
          await page.mouse.up();
          check((await remainingNow()) === beforePreview, `${at} T-259ⓑ: lifting under 64px grades nothing`, `remaining ${beforePreview} → ${await remainingNow()}`);
        }
```

- [x] **Step 9: Run the mobile walk on the three routes**

Run: `npm run build && npm run check:mobile`
Expected: every new `T-259` line prints `ok` at 320 · 375 · 414; zero horizontal scroll; clean console. ⚠️ If a focused button measures under 44px, the fix is `focus:block` on the button — ⛔ not a lower floor.

- [x] **Step 10: Look at the screen (STEP 6.5)** — `(npx next dev -p 3000 &) && sleep 25`, drive `http://127.0.0.1:3000/dev/card` at 375×780: record heading · text length · tappable count · under-44px · horizontal scroll · console errors · word y-position as a fraction of the card height (render: 0.34) · hint at the card's bottom edge. Write the numbers into the tick report.

- [x] **Step 11: Commit (task 3 of 6)**

```bash
npm run generate-map
./scripts/g add components/Flashcard.tsx components/Flashcard.test.ts components/CardDeck.tsx plan/40-decisions.md scripts/verify-mobile.mjs docs/architecture-map.json
./scripts/g commit -m "loop(DEV): C-XXXX T-259 — swipe is the visible grade channel; buttons sr-only accessible equivalent; badge preview; card fills the slot (render kol-A-03)"
```

---

### Task 4: `Flashcard` — release as a spring at the finger's velocity; come back when the grade is not taken; grab mid-flight (T-259 ⓑ · T-243 place ③)

**Files:**
- Modify: `components/Flashcard.tsx` (props `:37-47`, refs, `writeDrag`, all four pointer handlers, the card-change effect `:149-152`)
- Modify: `components/CardDeck.tsx:285-287` (return the promise)
- Modify: `app/globals.css:261-289` (the `[data-flashcard]` block) — new block stays **before** the `/* arena-stage` marker
- Modify: `components/Flashcard.test.ts` (append) · `components/CardDeck.test.ts` (append one `it`)
- Modify: `scripts/verify-mobile.mjs` (`/dev/card` return check · `/study` spring check)

**Interfaces:**
- Consumes: `releaseCurve`, `releaseVelocity`, `pushSample`, `PointerSample` from `@/lib/core/spring`; `swipeExitX`, `swipePose`, `swipeTransform`, `dragOffset({ baseX })` from `@/lib/core/swipeGrade`.
- Produces:
  - `onGrade: (grade: CardGrade) => void | Promise<void>` — a consumer that returns a promise lets the card learn the grade was **not** taken (resolved while the card is still mounted with the same `card`) and spring back.
  - DOM: `section[data-flashcard][data-release]` with inline `--kol-release-ms` / `--kol-release-ease` — set only when `CSS.supports('animation-timing-function', 'linear(0, 1)')`; otherwise the CSS defaults (200ms ease-out) apply.
  - `data-swipe` (existing) still marks a sent grade; `data-swipe-preview` is cleared on release.

- [x] **Step 1: Write the failing tests** — append to `components/Flashcard.test.ts` inside the face `describe`

```ts
  it('T-243 — the release is a spring from lib/core/spring, with the velocity of the finger', () => {
    const up = T085_CARD_SRC.indexOf('onPointerUp=');
    const block = T085_CARD_SRC.slice(up, T085_CARD_SRC.indexOf('{/* פני הכרטיס', up));
    expect(block).toContain('releaseVelocity(');
    expect(block).toContain('releaseCurve(');
    expect(block).toContain('swipeExitX(');
    expect(T085_CARD_SRC).toContain('--kol-release-ms');
    expect(T085_CARD_SRC).toContain('--kol-release-ease');
    // The samples that feed the velocity come from pointermove, stamped by the EVENT.
    const move = T085_CARD_SRC.slice(T085_CARD_SRC.indexOf('onPointerMove='), T085_CARD_SRC.indexOf('onPointerCancel='));
    expect(move).toContain('pushSample(');
    expect(move).toContain('e.timeStamp');
    expect(T085_CARD_SRC).not.toContain('Date.now()');
  });

  it('T-243 · apple-design § 3 — a pointerdown mid-flight starts from the PRESENTATION value', () => {
    const down = T085_CARD_SRC.slice(T085_CARD_SRC.indexOf('onPointerDown='), T085_CARD_SRC.indexOf('onPointerMove='));
    expect(down).toContain('getComputedStyle(');
    expect(down).toContain('DOMMatrixReadOnly(');
    expect(T085_CARD_SRC).toMatch(/dragOffset\(\{[^}]*baseX/);
  });

  it('T-259 — the pose during the drag is the render’s (swipePose), ⛔ not a bare translateX', () => {
    const write = T085_CARD_SRC.slice(T085_CARD_SRC.indexOf('const writeDrag'), T085_CARD_SRC.indexOf('const resetDrag'));
    expect(write).toContain('swipeTransform(swipePose(');
    expect(write).not.toContain('`translateX(');
  });

  it('T-259 — a grade the consumer did not take brings the card back (onGrade may return a promise)', () => {
    expect(T085_CARD_SRC).toMatch(/onGrade:\s*\(grade: CardGrade\) => void \| Promise<void>/);
    const up = T085_CARD_SRC.slice(T085_CARD_SRC.indexOf('onPointerUp='));
    expect(up).toContain('Promise.resolve(onGrade(resolved))');
  });

  it('שכבה א׳ — reduced motion: releaseCurve receives the live preference, ⛔ not a constant', () => {
    expect(T085_CARD_SRC).toMatch(/releaseCurve\(\{[^}]*reducedMotion/);
  });
```

Append to `components/CardDeck.test.ts`:
```ts
  it('T-259 — the deck hands Flashcard the grade promise, so a not-taken grade can spring back', () => {
    expect(SRC).toMatch(/onGrade=\{\(value\) => grade\(card\.word_id, value\)\}/);
    expect(SRC).not.toContain('void grade(');
  });
```
(`CardDeck.test.ts:32` reads the file into `SRC` — use `SRC`, ⛔ not a second `readFileSync`.)

Append to `app/globals.css` guard tests? None exist for this block — the walk measures it (Step 6).

- [x] **Step 2: Run to confirm red**

Run: `npx vitest run components/Flashcard.test.ts components/CardDeck.test.ts`
Expected: FAIL — five new `T-243`/`T-259` cases red.

- [x] **Step 3: Implement the component** — `components/Flashcard.tsx`

Imports:
```ts
import { pushSample, releaseCurve, releaseVelocity, type PointerSample } from '@/lib/core/spring';
import {
  dragOffset,
  resolveSwipe,
  swipeExitX,
  swipePose,
  swipeTransform,
} from '@/lib/core/swipeGrade';
```
Props (`:46`): `readonly onGrade: (grade: CardGrade) => void | Promise<void>;`

Refs, next to `pending` / `frame`:
```ts
  /** T-243 · `apple-design` § 2 — the last pointer samples, stamped by the event, ⛔ no clock. */
  const samples = useRef<readonly PointerSample[]>([]);
  /** T-243 · § 3 — where the card WAS when the finger grabbed it mid-flight. */
  const baseX = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const shownRef = useRef(card);
  shownRef.current = card;
  /** `linear()` easing — Chromium 113+, Safari 17.2+, Firefox 112+. Elsewhere the CSS
   *  defaults (200ms ease-out) stay in force and the two properties are never written. */
  const supportsSpringEasing = () =>
    typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', 'linear(0, 1)');
```
`writeDrag` — the transform line becomes `node.style.transform = swipeTransform(swipePose(x, window.innerWidth));`. Add a helper below `resetDrag`:
```ts
  /** The release: from the card's CURRENT pose to `target`, at the finger's velocity. The
   *  browser runs the curve (`globals.css` `[data-flashcard][data-release]`); this writes
   *  two custom properties and the target pose, ⛔ no JS clock. One forced style flush
   *  (`getBoundingClientRect`) so the transition starts from the pose just written. */
  const release = (node: HTMLElement, fromX: number, target: number, velocity: number) => {
    const curve = releaseCurve({ from: fromX, velocity, target, reducedMotion });
    node.style.transform = swipeTransform(swipePose(fromX, window.innerWidth));
    node.setAttribute('data-dragging', 'true');
    node.getBoundingClientRect();
    node.removeAttribute('data-dragging');
    node.removeAttribute('data-swipe-preview');
    if (supportsSpringEasing()) {
      node.style.setProperty('--kol-release-ms', `${curve.ms}ms`);
      node.style.setProperty('--kol-release-ease', curve.easing);
    }
    node.setAttribute('data-release', 'true');
    node.style.transform = swipeTransform(swipePose(target, window.innerWidth));
  };

  /** The card's on-screen translateX right now — the presentation value, ⛔ the target. */
  const presentationX = (node: HTMLElement): number => {
    const t = getComputedStyle(node).transform;
    if (t === 'none' || t === '') return 0;
    const m = new DOMMatrixReadOnly(t);
    return Number.isFinite(m.m41) ? m.m41 : 0;
  };
```
`resetDrag` additionally clears the release: after `writeDrag(0, null)` add
```ts
    const node = sectionRef.current;
    if (node !== null) {
      node.removeAttribute('data-release');
      node.style.removeProperty('--kol-release-ms');
      node.style.removeProperty('--kol-release-ease');
    }
    samples.current = [];
    baseX.current = 0;
```
Handlers:
```tsx
      onPointerDown={(e) => {
        if (swipe !== null) return; // the grade is sent and the card is leaving — ⛔ not grabbable
        if (!swipeActive) {
          swipeFrom.current = null;
          return;
        }
        const target = e.target instanceof Element ? e.target : null;
        if (target !== null && target.closest('button, input, a') !== null) {
          swipeFrom.current = null;
          return;
        }
        const node = e.currentTarget;
        // T-243 · `apple-design` § 3 — grab MID-FLIGHT: read where the card is on screen,
        // freeze it there (transition off), and let the drag continue from that value.
        // ⛔ Not `resetDrag()`: that would snap the card to 0 under the finger — the jump
        // the skill calls out.
        if (frame.current !== null) {
          cancelAnimationFrame(frame.current);
          frame.current = null;
        }
        baseX.current = presentationX(node);
        node.removeAttribute('data-release');
        writeDrag(baseX.current, null);
        swipeFrom.current = { x: e.clientX, y: e.clientY };
        samples.current = [{ x: e.clientX, tMs: e.timeStamp }];
        node.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const from = swipeFrom.current;
        if (from === null) return;
        samples.current = pushSample(samples.current, { x: e.clientX, tMs: e.timeStamp });
        const preview = resolveSwipe({
          startX: from.x,
          startY: from.y,
          endX: e.clientX,
          endY: e.clientY,
          viewportWidth: window.innerWidth,
        });
        queueDrag(
          dragOffset({ startX: from.x, currentX: e.clientX, reducedMotion, baseX: baseX.current }).x,
          preview,
        );
      }}
      onPointerCancel={(e) => {
        swipeFrom.current = null;
        releaseCapture(e.currentTarget, e.pointerId);
        const node = e.currentTarget;
        if (frame.current !== null) {
          cancelAnimationFrame(frame.current);
          frame.current = null;
        }
        release(node, pending.current.x, 0, 0);
        pending.current = { x: 0, preview: null };
      }}
      onPointerUp={(e) => {
        const from = swipeFrom.current;
        swipeFrom.current = null;
        releaseCapture(e.currentTarget, e.pointerId);
        if (from === null) return;
        const node = e.currentTarget;
        if (frame.current !== null) {
          cancelAnimationFrame(frame.current);
          frame.current = null;
        }
        const fromX = pending.current.x;
        pending.current = { x: 0, preview: null };
        const resolved = resolveSwipe({
          startX: from.x,
          startY: from.y,
          endX: e.clientX,
          endY: e.clientY,
          viewportWidth: window.innerWidth,
        });
        const velocity = releaseVelocity(samples.current);
        samples.current = [];
        baseX.current = 0;
        if (resolved === null) {
          // Under the threshold: back to rest, carrying the finger's velocity (§ 5).
          release(node, fromX, 0, velocity);
          return;
        }
        // Over it: out along the render's exit (swipeExitX), same velocity handoff. The
        // grade leaves NOW (F-101 precedent — ⛔ no setTimeout) and the card flies while
        // the request is in the air.
        release(node, fromX, swipeExitX(resolved, window.innerWidth), velocity);
        setSwipe(resolved);
        const outcome = onGrade(resolved);
        void Promise.resolve(outcome).then(() => {
          // One frame later — React commits the deck's removal on its own scheduler; if
          // this card is STILL here with the SAME `card`, the grade was not taken (CardDeck
          // swallows the network error on purpose) and the card comes back. Measured in
          // `verify-mobile.mjs` on `/dev/card`, whose onGrade is a no-op.
          requestAnimationFrame(() => {
            if (!mounted.current || shownRef.current !== card || sectionRef.current === null) return;
            const current = sectionRef.current;
            release(current, presentationX(current), 0, 0);
            setSwipe(null);
          });
        });
      }}
```
The card-change effect (`:149-152`) stays `resetDrag()` (which now also clears the release).

`components/CardDeck.tsx:285-287`:
```tsx
              onGrade={(value) => grade(card.word_id, value)}
```

- [x] **Step 4: The CSS** — `app/globals.css:261-289`, replace the whole `[data-flashcard]` block

```css
/* T-157 · D-090ⓑ · T-233 · **T-243 · T-259 (07/09)** — the card during and after the finger.
   ⚠️ Rewritten 07/09. The sentence that stood here — a 200ms easing «returns the card to its
   place or takes it out» — described a TIMED transition on a gesture-released element, which
   35 § ב6 (31/08) names as the contradiction: a fixed duration cuts the finger's velocity to
   zero and cannot be grabbed mid-flight. It is deliberately ⛔ not quoted.

   Three states, ⛔ not two:
   ⓐ **dragging** — `[data-dragging]`: inline transform per frame, ⛔ no transition (direct
      manipulation, ⛔ not an animation the product plays).
   ⓑ **released** — `[data-release]`: the SPRING. `lib/core/spring.ts` samples the critically
      damped solution (damping 1.0 · response 0.3) into a `linear()` easing whose shape carries
      the finger's velocity, and the settle time that EMERGES is the duration. The component
      writes both as custom properties; this rule only consumes them. Measured: 355ms for a
      100px return at rest, 421–429ms for the render's exit — ⛔ not «150–300ms», a spring has
      no duration (35 § ב6). Where `linear()` is unsupported the two defaults below stand and
      the release is today's 200ms ease-out.
   ⓒ **sent** — `[data-swipe]`: the grade left; opacity dims (D-090ⓑ) and the badge stays lit.

   ⛔ `prefers-reduced-motion` ⇒ **zero motion**: `dragOffset` returns `x: 0`, `releaseCurve`
   returns `ms: 0`, and the global 0.01ms block above catches anything else. The feedback
   survives as the badge and the dim — state, ⛔ not movement (שכבה א׳ · apple-design § 14).
   ⛔ The badge transition is opacity only; `check:motion` rule ⓐ. */
[data-flashcard] {
  --kol-release-ms: 200ms;
  --kol-release-ease: ease-out;
  transition: opacity 200ms ease-out;
}
[data-flashcard][data-release] {
  transition: transform var(--kol-release-ms) var(--kol-release-ease), opacity 200ms ease-out;
}
[data-flashcard][data-dragging] {
  transition: none;
}
[data-flashcard][data-swipe] {
  opacity: 0.6;
}
/* T-259ⓑ · render_video_A.py:366-372 — the badge on the card face. Lit by the look-ahead
   during the drag (`data-swipe-preview`) and by the sent grade (`data-swipe`). */
[data-swipe-badge] {
  opacity: 0;
  transition: opacity 200ms ease-out;
}
[data-flashcard][data-swipe-preview='good'] [data-swipe-badge='good'],
[data-flashcard][data-swipe='good'] [data-swipe-badge='good'],
[data-flashcard][data-swipe-preview='again'] [data-swipe-badge='again'],
[data-flashcard][data-swipe='again'] [data-swipe-badge='again'] {
  opacity: 1;
}
```
⚠️ `scripts/check-motion.mjs:115-121` splits a `transition:` value on commas — a `var(--x, fallback)` **with a comma** would be read as a second property. That is why the defaults live on the selector, ⛔ not inside `var()`.

- [x] **Step 5: Run the unit gates**

Run: `npx vitest run components/Flashcard.test.ts components/CardDeck.test.ts && npm run typecheck && npm run check:motion && npm run check:core`
Expected: PASS · `check:motion` reports the same baseline count as before (6 lines in `scripts/motion-baseline.md`, ⛔ no new violation).

- [x] **Step 6: Measure the spring in a real engine** — `scripts/verify-mobile.mjs`

ⓐ `/dev/card` (after the Step 8 ⓐ block of Task 3): a full swipe on a no-op consumer flies out and **comes back**, and the release used the spring easing:
```js
          // T-259 · T-243 — this fixture's onGrade is a no-op ⇒ the grade is NOT taken ⇒ the
          // card must come back to rest, and the release must be the spring (linear()).
          const cardEl = page.locator('[data-flashcard]');
          const cbox = await cardEl.boundingBox();
          const cx = Math.round(width / 2) - 50;
          const cy = Math.round(cbox.y + cbox.height / 2);
          await page.mouse.move(cx, cy);
          await page.mouse.down();
          await page.mouse.move(cx + 120, cy, { steps: 10 });
          await page.mouse.up();
          const easing = await page.evaluate(() => getComputedStyle(document.querySelector('[data-flashcard]')).transitionTimingFunction);
          check(easing.startsWith('linear('), `${at} T-243: the release is a linear() spring easing`, `timing-function "${easing.slice(0, 40)}"`);
          const settled = await page
            .waitForFunction(
              () => {
                const t = getComputedStyle(document.querySelector('[data-flashcard]')).transform;
                return t === 'none' || Math.abs(new DOMMatrixReadOnly(t).m41) < 1;
              },
              null,
              { timeout: 2000 },
            )
            .then(() => true)
            .catch(() => false);
          check(settled, `${at} T-259: a grade the consumer did not take brings the card back to rest`, 'still off its slot after 2s');
          check(
            (await page.locator('[data-flashcard][data-swipe]').count()) === 0,
            `${at} T-259: the sent-state is cleared when the grade comes back`,
            'data-swipe still set',
          );
```
ⓑ `/study` (after the T-233 «finger that leaves» drive, `:2240`): the taken grade does **not** come back:
```js
        // T-259 — a TAKEN grade removes the card; it must ⛔ never spring back into the deck.
        await page.waitForTimeout(600);
        check(
          (await remainingNow()) === beforeLeave - 1,
          `${at} T-259: a taken grade stays taken after the spring settles`,
          `remaining is ${await remainingNow()}, expected ${beforeLeave - 1}`,
        );
```
ⓒ Reduced motion, one width (add next to the dark-mode block at `:2247+`, same shape: a `newContext({ reducedMotion: 'reduce', viewport: { width: 375, height: 812 } })`): on `/dev/card`, reveal, drag 100px right, assert the card's computed `transform` is `none` **during** the drag and the badge is lit; release; assert `transform` still `none` and `--kol-release-ms` is `0ms` or unset.

- [x] **Step 7: Run the walk and look at the screen**

Run: `npm run build && npm run check:mobile`
Expected: all new lines `ok` at 320 · 375 · 414; console clean. Then STEP 6.5 at 375×780 on `/dev/card`: swipe right slowly, release under 64px — the card **eases back with no visible seam**; flick — the card leaves, badge lit, and (no-op consumer) returns. Record the numbers.

- [x] **Step 8: Commit (task 4 of 6)**

```bash
npm run generate-map
./scripts/g add components/Flashcard.tsx components/Flashcard.test.ts components/CardDeck.tsx components/CardDeck.test.ts app/globals.css scripts/verify-mobile.mjs docs/architecture-map.json
./scripts/g commit -m "loop(DEV): C-XXXX T-243/T-259 — Flashcard release is a critically-damped spring at the finger's velocity (linear() easing); grab mid-flight from the presentation value; not-taken grade springs back"
```

---

### Task 5: `SpellCard` — the arena card's release is the same spring (T-243 place ①)

**Files:**
- Modify: `components/SpellCard.tsx:3-4` (imports) · `:41-44` (refs/state) · `:54` (style) · `:77-101` (handlers)
- Modify: `components/SpellCard.test.ts` (append one `it`)
- Modify: `app/globals.css:190-198` (`[data-arena-card]`)

**Interfaces:**
- Consumes: `releaseCurve`, `releaseVelocity`, `pushSample`, `PointerSample` from `@/lib/core/spring`; `cardLift`, `resolveGesture` (unchanged).
- Produces: `button[data-arena-card]` carries inline `--kol-release-ms` / `--kol-release-ease` after a release (only when `linear()` is supported); `[data-arena-lift='rest']` is the released state as before.

- [x] **Step 1: Write the failing test** — append to `components/SpellCard.test.ts` inside the first `describe`

```ts
  it('T-243 · 35 § ב6 — the release is a spring from lib/core/spring, ⛔ still no clock here', () => {
    expect(CODE).toContain("from '@/lib/core/spring'");
    expect(CODE).toContain('releaseCurve(');
    expect(CODE).toContain('releaseVelocity(');
    expect(CODE).toContain('pushSample(');
    expect(CODE).toContain('e.timeStamp');
    expect(CODE).toContain('--kol-release-ms');
    expect(CODE).toContain('--kol-release-ease');
    for (const token of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'Date.now']) {
      expect(CODE).not.toContain(token);
    }
  });
```

- [x] **Step 2: Run to confirm red**

Run: `npx vitest run components/SpellCard.test.ts`
Expected: FAIL — `releaseCurve(` not found.

- [x] **Step 3: Implement** — `components/SpellCard.tsx`

Imports:
```ts
import { useRef, useState, type CSSProperties } from 'react';
import { cardLift, resolveGesture } from '@/lib/core/arenaGesture';
import { pushSample, releaseCurve, releaseVelocity, type PointerSample } from '@/lib/core/spring';
```
State and refs (`:41-44`):
```ts
  const from = useRef<{ x: number; y: number } | null>(null);
  const samples = useRef<readonly PointerSample[]>([]);
  const [drag, setDrag] = useState<{ y: number; lift: number; releaseMs: number | null; releaseEase: string }>({
    y: 0,
    lift: 0,
    releaseMs: null,
    releaseEase: 'ease-out',
  });
  const supportsSpringEasing =
    typeof CSS !== 'undefined' && CSS.supports('animation-timing-function', 'linear(0, 1)');
  /* T-243 · 35 § ב6 — the release is the spring (`lib/core/spring.ts`), rendered by the
     browser through the two custom properties `globals.css` `[data-arena-card]` consumes.
     ⛔ No clock here (`SpellCard.test.ts:23`): the curve is a STRING, the duration a NUMBER,
     both computed once at `pointerup`. Unsupported `linear()` ⇒ the properties are not
     written and the CSS defaults (200ms ease-out) stand. */
  const style: CSSProperties & Record<'--kol-release-ms' | '--kol-release-ease', string | undefined> = {
    transform: `translateY(${drag.y}px)`,
    touchAction: 'pan-y',
    '--kol-release-ms': supportsSpringEasing && drag.releaseMs !== null ? `${drag.releaseMs}ms` : undefined,
    '--kol-release-ease': supportsSpringEasing && drag.releaseMs !== null ? drag.releaseEase : undefined,
  };
```
`:54` → `style={style}`.
Handlers:
```tsx
      onPointerDown={(e) => {
        from.current = { x: e.clientX, y: e.clientY };
        samples.current = [{ x: e.clientY, tMs: e.timeStamp }];
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (from.current === null) return;
        samples.current = pushSample(samples.current, { x: e.clientY, tMs: e.timeStamp });
        const lift = cardLift({ startY: from.current.y, currentY: e.clientY, reducedMotion });
        setDrag((d) => ({ ...d, y: lift.y, lift: lift.lift, releaseMs: null }));
      }}
      onPointerUp={(e) => {
        const start = from.current;
        from.current = null;
        const curve = releaseCurve({
          from: drag.y,
          velocity: releaseVelocity(samples.current),
          target: 0,
          reducedMotion,
        });
        samples.current = [];
        setDrag({ y: 0, lift: 0, releaseMs: curve.ms, releaseEase: curve.easing });
        if (start === null) return;
        const gesture = resolveGesture({
          source: 'card',
          startX: start.x, startY: start.y,
          endX: e.clientX, endY: e.clientY,
          viewportWidth: window.innerWidth,
        });
        if (gesture?.kind === 'cast') onCast();
        else onSelect();
      }}
      onPointerCancel={() => {
        from.current = null;
        samples.current = [];
        setDrag({ y: 0, lift: 0, releaseMs: null, releaseEase: 'ease-out' });
      }}
```
(The samples' `x` field carries **clientY** on purpose — the arena card moves on Y; `releaseVelocity` is axis-agnostic. Say so in a one-line comment at the `pushSample` call.)

`app/globals.css:190-198`:
```css
/* T-178 · 37 § 5 · **T-243 (07/09)** — the spell card's RELEASE is the spring, same contract
   as `[data-flashcard]` below: `lib/core/spring.ts` writes `--kol-release-ms` / `--kol-release-ease`
   at pointerup, this rule consumes them, the defaults are the pre-07/09 200ms ease-out for
   engines without `linear()`. The drag itself has no transition (`[data-arena-lift='dragging']`).
   `prefers-reduced-motion` (:103) zeroes the duration; `cardLift` already returns y 0. */
[data-arena-card] {
  --kol-release-ms: 200ms;
  --kol-release-ease: ease-out;
  transition: transform var(--kol-release-ms) var(--kol-release-ease);
}
[data-arena-card][data-arena-lift='dragging'] {
  transition: none;
}
```
(Keep the `[data-arena-lift='ready']` glow rule exactly as it is.)

- [x] **Step 4: Run the gates**

Run: `npx vitest run components/SpellCard.test.ts components/ArenaStage.test.ts && npm run typecheck && npm run check:motion`
Expected: PASS · `ArenaStage.test.ts`'s slice from `/* arena-stage` is unchanged (the edited block is above the marker).

- [x] **Step 5: Walk `/arcade` (STEP 6.5)** — `(npx next dev -p 3000 &) && sleep 25`, drive `http://127.0.0.1:3000/arcade` at 375×780: drag a spell card up 40px and release under the 60px threshold — it springs back; flick past it — it casts. Record: computed `transitionTimingFunction` on `[data-arena-card]` after release starts with `linear(`; `--kol-release-ms` between 100 and 500. ⛔ Zero change to `37 § 6` timings.

- [x] **Step 6: Commit (task 5 of 6)**

```bash
npm run generate-map
./scripts/g add components/SpellCard.tsx components/SpellCard.test.ts app/globals.css docs/architecture-map.json
./scripts/g commit -m "loop(DEV): C-XXXX T-243 — SpellCard release is the same critically-damped spring (custom-property contract with globals.css)"
```

---

### Task 6: Registers, the arena-figure finding (T-243 place ②), and the full gate

**Files:**
- Modify: `plan/60-findings.md` (append one row) · `plan/50-tasks.md` (`T-259`, `T-243` status cells → 🟣) · `plan/30-architecture.md` (one paragraph) · `plan/00-control.md` (handoff line, `LOCK_HELD_BY: ""`, `NEXT_AGENT: CRITIC`)
- Generated: `docs/plan-open.md` · `docs/plan-tables.md` (`npm run measure:plan`) · `docs/architecture-map.json`

- [ ] **Step 1: Confirm the finding is on file** — `F-193` was filed by the planning tick (`C-0492`, 07/09) with the measurement in Measured Discrepancies § 3. Run `grep -n '^| F-193 |' plan/60-findings.md` and confirm the row exists and still reads «⬜ פתוח → PM». ⛔ Do not file it twice; if the PM has since amended `35 § ב6` / `T-243` to two places, say so in the tick report and skip nothing else.

- [ ] **Step 2: Close the two rows** — `plan/50-tasks.md`

`T-259` status cell (`grep -n '^| T-259 |' plan/50-tasks.md`): `⬜` → `🟣 **C-XXXX — נבנה · ירוק · ⛔ עדיין לא על `dev`.** ⓐ ליטוש המודול הטהור (`spring.ts` · `swipeGrade.ts`) · ⓑ שחרור-קפיץ במהירות האצבע + תג על הכרטיס (הרנדר `:366-372`) — ⚠️ «8px» בשורה היה ישן: הגרירה כבר 1:1 מ-T-157 · ⓒ `resolveSwipe` הוא ההכרעה היחידה, הכפתורים והמחווה קוראים לאותו `onGrade` (בדיקת מקור) · ⓓ הפנים `flex-1` בתוך ה-calc של `CardDeck`, ⛔ לא מעליו · ⓔ `data-reveal` ⛔ לא נגע (בדיקת מקור) · ⓕ הכפתורים `sr-only` עד פוקוס, ההחלקה ראשית, שורת הוראה עברית · ⓘ `CardDeck.tsx` + תוספת תחת `D-150` · ⓘⓘ הערוץ הנגיש = שני הכפתורים בפוקוס (נמדד ≥44px ב-`check:mobile`). תוכנית: `docs/superpowers/plans/2026-09-07-swipe-primary-and-spring-release.md`` — keeping the milestone cell `M2 · cards · נוחות` untouched.

`T-243` status cell: `⬜` → `🟣 **C-XXXX — נבנה · ירוק · ⛔ עדיין לא על `dev`.** ① `[data-arena-card]` ו-③ `[data-flashcard]`: קפיץ `damping 1.0 · response 0.3` (`lib/core/spring.ts`), מהירות מ-`pointerup`, מרונדר כ-`linear()` דרך CSS — ⛔ אפס שעון ברכיב. ② ⛔ לא נבנה במכוון — `F-193`: הדמות ⛔ אינה משתחררת ממחווה. גדרות: reduced-motion ⇒ `ms 0` + `x 0` · `37 § 6` ⛔ לא נגע · מעברי משך שנותרו 200ms. נמדד: השתקעות 355ms (חזרה 100px) · 421–429ms (יציאת הרנדר)`` — milestone cell `M0 · cards · נוחות · שכבה ב׳` untouched.

- [ ] **Step 3: Architecture paragraph** — `plan/30-architecture.md`, under the section that describes `lib/core/swipeGrade.ts` (`grep -n 'swipeGrade' plan/30-architecture.md`), append:

```
**07/09 · C-XXXX · T-243/T-259 — `lib/core/spring.ts` והחוזה של שני המאפיינים.** הקפיץ (ζ=1, response 0.3) הוא פונקציה סגורה ב-`/lib/core`; הרכיב ⛔ אינו מריץ שעון. `releaseCurve` דוגם את הפתרון ל-`linear(0, …, 1)` + משך השתקעות, והרכיב כותב אותם כ-`--kol-release-ms` / `--kol-release-ease` על הצומת; `globals.css` צורך אותם ב-`[data-flashcard][data-release]` וב-`[data-arena-card]`, עם ברירת מחדל 200ms ease-out למנועים בלי `linear()`. ⛔ `var()` עם פסיק בתוך `transition:` שובר את `check-motion.mjs:115` ⇒ ברירות המחדל על הסלקטור. תפיסה באמצע טיסה: `getComputedStyle().transform` ⇒ `baseX` ל-`dragOffset`. ציון שלא נלקח (הצרכן פתר את ה-promise והכרטיס עדיין מורכב) ⇒ הכרטיס חוזר — `CardDeck` מחזיר עכשיו את ה-promise של `grade`.
```

- [ ] **Step 4: Regenerate, verify, close** — the full gate, freshly run

```bash
npm run measure:plan
grep -q '"generate-map"' package.json && npm run generate-map || echo '⛔ generate-map not in package.json yet (T-235) — skipped, not failed'
npm run check:plan docs/superpowers/plans/2026-09-07-swipe-primary-and-spring-release.md
npm run verify
```
Expected: `verify` **exit 0** — paste the five tail lines (tests · build · `check:mobile` count) into the tick report. Then `plan/00-control.md`: one handoff row (`C-XXXX · DEV → CRITIC`), `LOCK_HELD_BY: ""`, `NEXT_AGENT: CRITIC`, `ACTIVE_TASK_ID` untouched, `WORKSTREAM_TICKS` `cards` +1 (a tick that ends in a commit).

- [ ] **Step 5: Commit and push (task 6 of 6)** — the pre-push hook runs `verify` again and writes the attestation note

```bash
./scripts/g add plan/60-findings.md plan/50-tasks.md plan/30-architecture.md plan/00-control.md docs/plan-open.md docs/plan-tables.md docs/architecture-map.json
./scripts/g commit -m "loop(DEV): C-XXXX T-259 T-243 🟣 — registers, F-193 (arena figure is not a gesture release), handoff to CRITIC"
./scripts/g push origin work/current
```

---

## Self-Check (run by the executor before the last commit)

1. **Spec coverage** — `T-259`: ⓐ Task 1+2 · ⓑ Task 3 (badge) + Task 4 (spring) · ⓒ `Flashcard.test.ts` «המחווה קוראת ל-onGrade» (existing) + Task 3 `T-259ⓑ preview never grades` · ⓓ Task 3 Step 4 · ⓔ Task 3 test `T-259ⓔ` · ⓕ Task 3 Step 5 · ⓘ Task 3 Step 6 · ⓘⓘ Task 3 Step 5 (sr-only buttons) + walk Step 8. `T-243`: ① Task 5 · ② Task 6 finding · ③ Task 4 · fences: reduced-motion (`releaseCurve` + `dragOffset`), `37 § 6` untouched (no arena timing edited), remaining timed transitions 200ms.
2. **Placeholder scan** — `C-XXXX` is the only placeholder and it is the cycle id, resolved by `node scripts/next-cycle-id.mjs` at execution.
3. **Type consistency** — `releaseCurve({ from, velocity, target, reducedMotion })` (Tasks 1 · 4 · 5) · `swipeTransform(swipePose(x, viewportWidth))` (Tasks 2 · 4) · `dragOffset({ …, baseX })` (Tasks 2 · 4) · `onGrade: (grade: CardGrade) => void | Promise<void>` (Task 4, consumed by `CardDeck` Task 4) · `PointerSample { x, tMs }` (Tasks 1 · 4 · 5).
4. **Hebrew to the learner, English everywhere else** — new learner strings: the hint, the two badge labels. Comments, code, commits: English (register cells: Hebrew, as the registers are).
5. **§ 0.22 one-liners the executor must carry into the tick report:** response 0.3 (not 0.4) · badge fill opaque `bg-surface-raised` instead of the render's 20% tint (no alpha slot in the palette) · card `opacity: 0.6` on the sent state kept from D-090ⓑ although the render does not fade.
