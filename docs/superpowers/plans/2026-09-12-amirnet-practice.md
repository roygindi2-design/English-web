# Amirnet Practice Menu, Question and Dashboard Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking. ⛔ Do NOT use subagent-driven-development here: Tasks 2 and 3 both import the module Task 1 creates and both touch `lib/core/amirnetPractice.ts`'s consumers, so the three tasks are sequential, not independent.

**Goal:** Land the first three learner-facing screens of the `amirnet` department — `T-286` (the practice menu), `T-287` (one practice question with immediate feedback) and `T-291` (the dashboard) — as `41 § 8` items 1 and 2 describe them, on top of the item gate `T-223`/`T-224` already landed.

**Architecture:** One pure core module (`lib/core/amirnetPractice.ts`) holds every decision — the three question types, the four manual levels, how a per-type statistic becomes a card, when a statistic is a lie and must not be shown, and which type is the weak one. Three presentational components draw what that module returns and decide nothing: `AmirnetTabs` (shared by the menu and the dashboard — one tabs component, `T-291`ⓐ), `AmirnetPracticeMenu`, `AmirnetDashboard`, plus `AmirnetQuestion` for the question itself. The one impure edge is `app/api/amirnet/practice/route.ts`, which serves items through the existing `lib/core/amirnetItemGate.ts`.

**Tech Stack:** TypeScript (`lib/core/` is PURE — zero React/DOM/fetch/`process.env`, enforced by `scripts/check-core-purity.mjs`), Next.js App Router, Tailwind with the product tokens in `tailwind.config.ts`, Vitest.

**Spec:** `plan/41-amirnet-spec.md § 7` («האפליקציה» — the three tabs, the menu-before-question rule, ⛔ no adaptivity in practice) · `§ 8` items 1–2 (build order) · `plan/36-video-spec.md § 14.2`/`§ 14.4` (one visual language; the product is light, and a background difference from the render is ⛔ not a gap) · renders `docs/design/kol-D-03-practice-menu.png` · `kol-D-04-practice-question.png` · `kol-D-05-practice-feedback.png` · `kol-D-02-dashboard.png`, all drawn by `docs/design/render_video_D.py` (`head` :21-39, `screen_practice_menu` :102-141, `screen_practice` :143+, `screen_dash` :59-92). Layout values below are grepped from that file, ⛔ not eyeballed from the PNG.

## Global Constraints

- `lib/core/` is PURE. `amirnetPractice.ts` takes numbers in and returns numbers and strings out. ⛔ No React, no `fetch`, no `Date.now()` inside it — the caller passes the clock.
- **Every learner-visible string is Hebrew, RTL.** English appears ⛔ only as the type's English name inside `<EnWord>` — `Sentence Completion` · `Restatement` · `Reading` — because the render prints it as a second line under the Hebrew name.
- ⛔ **No adaptivity in practice** (`41 § 7`, verbatim: «הרמה נבחרת ידנית»). The level is a chip the learner presses. ⛔ Nothing re-fits it from an answer.
- ⛔ **No score estimate and no 50–150 dial** anywhere in this plan. The render draws one (`score_dial`, `render_video_D.py:45`) and it is Roy's heuristic (`41 § 9.2`, `plan/03-for-roy.md` item 73). ⛔ Not built here, and the omission is declared in the delivery row.
- ⛔ **No «items per level» count** (`41 § 9.4` — Roy's).
- ⛔ **No score, XP, currency, streak or leaderboard** (`D-050`).
- ⛔ **No invented item, distractor or explanation** (`R-010` extended to amirnet, `RULES § 0.1 ז׳`). An item with no Hebrew explanation is ⛔ not served, and that is ⛔ not grounds to write one in code.
- **State is never colour alone** (constitution, layer A). The type colour on a card is always accompanied by the written type name; correct/incorrect in Task 2 carries an icon **and** a Hebrew label.
- **44×44 minimum on every tap target** — `min-h-touch`/`min-w-touch`. The `MF-2` inline-paragraph exemption does ⛔ not apply to any target in this plan.
- **`0%` on zero answered questions is a lie, ⛔ not a datum** (`T-291`ⓓ, `T-286`ⓔ). A type with no answered question shows a written sentence; `—` is ⛔ not an answer either.
- **The product is light** (`36 § 14.2`, Roy 11/09). Build in the product tokens. All 29 renders measured dark on 11/09 ⇒ a dark render is ⛔ never a reason to build a dark screen, and a background difference is ⛔ not a gap to record. Layout · order · hierarchy · strings · finish remain binding from the render.
- Radii come from the five-value scale only (`md` 6 · `lg` 8 · `xl` 12 · `2xl` 16 · `full`) — `scripts/radius-hygiene.test.ts` fails a sixth.
- **Lineage, declared and ⛔ never inferred (`RULES § 0.6ב`):** Task 2 is **המשך של: T-286** and Task 3 is **המשך של: T-287**, exactly as their rows in `plan/50-tasks.md` already say.
- ⛔ **And this plan is ⛔ NOT an extension of `T-001`/`T-002` (`lib/api/client.ts`) or `T-011` (`app/layout.tsx`).** Those rows own those files; this plan **consumes** them and modifies ⛔ neither. `lib/api/client.ts` is named only because `RULES` forbids a component from touching the database directly, and `app/layout.tsx` only to record that the product's single 24px gutter already lives there and this screen must ⛔ not add a second one (`T-285`ⓓ · `D-206`). ⛔ No file owned by those three rows appears in the File Structure table above.
- ⛔ No horizontal padding of the screen's own (`T-285`ⓓ · `D-206`): `app/layout.tsx`'s `<main>` already carries the product's single 24px gutter.

## File Structure

| File | Responsibility |
|---|---|
| `lib/core/amirnetPractice.ts` | Create. PURE. The three types with their Hebrew and English names, the four levels, `toTypeCards()` (statistic ⇒ card, including the «never practised» state), `weakestType()` (⛔ returns null on a tie and on zero answers), `practiceReady()` (⛔ false until both type and level are chosen). |
| `lib/core/amirnetPractice.test.ts` | Create. Negative control per rule: zero answers ⇒ no percentage; a tie at the bottom ⇒ ⛔ no weak type; one type answered and two not ⇒ ⛔ still no weak type; `practiceReady` false with either half missing. |
| `components/AmirnetTabs.tsx` | Create. The three tabs `דשבורד · תרגול · סימולציה` in RTL order. The two that are not live are **present and `aria-disabled`** with the word «טרם» (`D-152` § ב׳) — ⛔ not hidden. Used by both the menu and the dashboard. |
| `components/AmirnetTabs.test.ts` | Create. Measures that all three render, that exactly one is `aria-selected`, and that a disabled tab carries «טרם». |
| `components/AmirnetPracticeMenu.tsx` | Create. Draws the type cards and the level chips. ⛔ Decides nothing — rows arrive from `toTypeCards()`. |
| `components/AmirnetPracticeMenu.test.ts` | Create. The gate the render binds: three cards, four chips, single-select, and the question ⛔ does not open until both are chosen. |
| `app/(tabs)/world/amirnet/practice/page.tsx` | **Task 2, ⛔ not Task 1 — measured, ⛔ not preference.** `scripts/build-surfaces.mjs` flags a product route ⛔ nothing links to, and the ratchet in `scripts/build-surfaces.test.ts` (D-191 · T-263) lets that count go **down only**. The one thing that could link to it is the `amirnet` ring node, which `lib/core/worldRing.ts:252` holds `locked_infra` behind a written condition — «אמירנט ייפתח כשמנוע התרגול שלו ייבנה» — and **the engine is Task 2**. ⇒ creating the route in Task 1 would either break a frozen gate or unlock a ring node early, and **navigation is PM's, ⛔ never DEV's** (`RULES § 0.22`). The screen itself ships in Task 1 and is walkable at `/dev/amirnet/practice`. |
| `app/dev/amirnet/practice/page.tsx` | Create. The fixture route the STEP 6.5 walk drives at 375×780. |
| `app/dev/amirnet/practice/practice-fixture.ts` | Create. A fixture that differs from production data in ⛔ no dimension (the 23/08 lesson). |
| `components/AmirnetQuestion.tsx` | Task 2. One item, four options, immediate feedback with the Hebrew explanation and the response time. |
| `app/api/amirnet/practice/route.ts` | Task 2. Serves one gated item by `type` + `level` from `public.sense_items`. |
| `components/AmirnetDashboard.tsx` | Task 3. Per-type performance and the weakness strip. |
| `app/(tabs)/world/amirnet/page.tsx` | Task 3. The dashboard route, tab 0. |

---

### Task 1: `T-286` — the practice menu, end to end

**Files:**
- Create: `lib/core/amirnetPractice.ts`, `components/AmirnetTabs.tsx`, `components/AmirnetPracticeMenu.tsx`, `app/dev/amirnet/practice/page.tsx`, `app/dev/amirnet/practice/practice-fixture.ts`
- ⛔ NOT here: `app/(tabs)/world/amirnet/practice/page.tsx` — see the File Structure note. It lands in Task 2, in the same commit as the ring-node decision.
- Test: `lib/core/amirnetPractice.test.ts`, `components/AmirnetTabs.test.ts`, `components/AmirnetPracticeMenu.test.ts`

**Interfaces:**
- Produces (consumed by Tasks 2 and 3):
  ```ts
  export type AmirnetPracticeType = 'sc' | 'rs' | 'rc';
  export type AmirnetLevel = 1 | 2 | 3 | 4;

  export interface AmirnetTypeStat {
    readonly type: AmirnetPracticeType;
    readonly answered: number;   // ⛔ 0 is a legal, declared state — ⛔ not missing data
    readonly correct: number;
  }

  export interface AmirnetTypeCard {
    readonly type: AmirnetPracticeType;
    readonly nameHe: string;
    readonly nameEn: string;
    /** null ⇔ answered === 0. `0%` on zero answers is a lie, ⛔ not a datum. */
    readonly successPct: number | null;
    /** Hebrew, always present: either «N שאלות שנענו» or the never-practised sentence. */
    readonly answeredHe: string;
  }

  export function toTypeCards(stats: readonly AmirnetTypeStat[]): readonly AmirnetTypeCard[];
  export function weakestType(stats: readonly AmirnetTypeStat[]): AmirnetPracticeType | null;
  export function practiceReady(t: AmirnetPracticeType | null, l: AmirnetLevel | null): boolean;
  ```

**Layout values, grepped from `docs/design/render_video_D.py`:**

| What | Render | Built as |
|---|---|---|
| tabs bar | `head` :25-27 — `y=140`, `h=36`, `r=12`, three equal thirds, RTL (`x0 + w - (i+.5)*sw`) | `h-11` (44px — the gate raises 36→44), `rounded-xl` (12), `grid-cols-3` |
| section heading | :104 `בחר סוג שאלות לתרגול`, 13.5px SemiBold, `y=200` | `text-base font-semibold` |
| sub-line | :105 `הרמה נבחרת ידנית · אין כאן אדפטיביות`, 11.5px | `text-xs text-ink-muted` → raised to `text-sm` (`check:text-floor`) |
| type card | :112-113 `h=104`, `r=17`, outline in the type colour | `rounded-2xl` (16 — the five-value scale has no 17), `border` in the type colour |
| card title / En sub | :115-117 15px Bold / 11px Regular | `text-base font-bold` / `text-xs` inside `<EnWord>` |
| percentage / count | :118-120 18px Black / 10.5px | `text-lg font-black` / `text-xs` |
| progress bar | :121-122 `h=7`, `r=3.5`, fill = type colour | `h-2 rounded-full` |
| `תרגל` button | :123-126 `h=24`, `r=12`, tinted fill + type-colour outline | `min-h-touch` (44 — the gate raises 24→44), `rounded-xl` |
| level chips | :129-139 `h=32`, `r=16`, single-select, RTL right-to-left | `min-h-touch`, `rounded-full`, `aria-pressed` |
| card pitch | :127 `y += 114` (104 + 10 gap) | `space-y-3` |

**Declared layer-A gaps (the accessibility gates override the render, `36 § 14.4`):** tabs bar 36→44px · `תרגל` button 24→44px · level chips 32→44px · sub-line 11.5→14px · card count 10.5→12px · card radius 17→16 (the scale has five values and 17 is ⛔ not one). **Declared not-built:** ⛔ nothing else — the menu carries no score dial.

**The failing test, written first (`test-driven-development`) — real code, ⛔ not a description:**

```ts
// lib/core/amirnetPractice.test.ts
import { describe, it, expect } from 'vitest';
import { toTypeCards, weakestType, practiceReady } from './amirnetPractice';

describe('amirnetPractice', () => {
  it('gives a type with zero answers no percentage at all — 0% would be a lie', () => {
    const [card] = toTypeCards([{ type: 'sc', answered: 0, correct: 0 }]);
    expect(card.successPct).toBeNull();
    expect(card.answeredHe).not.toContain('0%');
    expect(card.answeredHe).not.toBe('—');
  });

  it('names no weak type when the two lowest are tied — never guesses between them', () => {
    expect(weakestType([
      { type: 'sc', answered: 10, correct: 9 },
      { type: 'rs', answered: 10, correct: 5 },
      { type: 'rc', answered: 10, correct: 5 },
    ])).toBeNull();
  });

  it('names no weak type from a type the learner never tried', () => {
    expect(weakestType([
      { type: 'sc', answered: 3, correct: 3 },
      { type: 'rs', answered: 0, correct: 0 },
      { type: 'rc', answered: 0, correct: 0 },
    ])).toBeNull();
  });

  it('opens no question until BOTH the type and the level are chosen (41 § 7)', () => {
    expect(practiceReady(null, 2)).toBe(false);
    expect(practiceReady('sc', null)).toBe(false);
    expect(practiceReady('sc', 2)).toBe(true);
  });
});
```

**Step 1: The pure module and its negative control**
- [x] Write `lib/core/amirnetPractice.test.ts` first (`test-driven-development`): zero answers ⇒ `successPct === null` and the never-practised sentence; a two-way tie at the bottom ⇒ `weakestType() === null`; all three at zero ⇒ `null`; `practiceReady(null, 2) === false` and `practiceReady('sc', null) === false`.
- [x] Write `lib/core/amirnetPractice.ts` until those pass. ⛔ No `Date`, no `fetch`, no `process.env`.
- [x] `npm run verify:fast`

**Step 2: The shared tabs component**
- [x] `components/AmirnetTabs.tsx` + test. `role="tablist"`, one `aria-selected`, the other two `aria-disabled` carrying «טרם». ⛔ Not hidden.

**Step 3: The menu**
- [x] `components/AmirnetPracticeMenu.tsx` + test, against the table above. Single-select on both axes; `תרגל` is disabled until a level is chosen and says so in words, ⛔ not by colour.

**Step 4: The walk route and the fixture**
- [x] `app/dev/amirnet/practice/page.tsx` + `practice-fixture.ts`. ⛔ The learner route is Task 2's.

**Step 5: The gate and the walk**
- [x] `npm run verify` (full, nine commands — give it a 600000ms window; it measures ~183s).
- [x] STEP 6.5: `npm run build && npx next start -p 3000`, drive `/dev/amirnet/practice` at 375×780, record heading · text length · tappable count · under-44px · horizontal scroll · console errors, then `npm run preview:stop`.

**Self-check:** three cards and four chips present · a learner with zero answers sees a sentence and ⛔ no `0%` · nothing opens a question before both choices · zero targets under 44px · zero horizontal scroll at 320/375/414 · ⛔ no score dial, ⛔ no XP, ⛔ no adaptivity.

---

### Task 2: `T-287` — one question with immediate feedback

**Files:**
- Create: `components/AmirnetQuestion.tsx`, `app/api/amirnet/practice/route.ts`, `app/dev/amirnet/question/page.tsx`, `app/(tabs)/world/amirnet/practice/page.tsx` (carried over from Task 1 — it becomes reachable only once the engine exists)
- **⛔ And one thing this task may ⛔ NOT do alone:** unlocking the `amirnet` ring node (`lib/core/worldRing.ts:252`) is **navigation ⇒ PM's** (`RULES § 0.22`). Build the route and the engine, then ROUTE the unlock; ⛔ do not flip `locked_infra` from inside a DEV tick.
- Test: `components/AmirnetQuestion.test.ts`, `app/api/amirnet/practice/route.test.ts`

**Interfaces:**
- Consumes `AmirnetPracticeType`/`AmirnetLevel` from Task 1 and `amirnetItemGate()` from `lib/core/amirnetItemGate.ts`.

**Step 1:** Route test first — an item whose `level` is `null` (the 1,602 legacy rows) is ⛔ not served; an item with no Hebrew explanation is ⛔ not served; a gated item round-trips.
**Step 2:** `app/api/amirnet/practice/route.ts`. ⛔ The component ⛔ never touches the database — everything through `lib/api/client.ts`.
**Step 3:** `components/AmirnetQuestion.tsx` — header (type · level · clock · counter), four options, feedback with icon **and** Hebrew label, the correct answer, the Hebrew explanation from the item, and the response time in seconds.
**Step 4:** `הבא` serves another item of the same type and level; the queue running out shows «אין עוד פריטים ברמה הזאת» with a route back to the menu.
**Step 5:** `npm run verify`, then the walk at 375×780.

**Self-check:** ⛔ no invented explanation · correct/incorrect is ⛔ never colour alone · ⛔ no score or XP · a `null`-level item is ⛔ never served.

---

### Task 3: `T-291` — the dashboard

**Files:**
- Create: `components/AmirnetDashboard.tsx`, `app/(tabs)/world/amirnet/page.tsx`, `app/dev/amirnet/dashboard/page.tsx`
- Test: `components/AmirnetDashboard.test.ts`

**Interfaces:** consumes `toTypeCards()` and `weakestType()` from Task 1 unchanged. ⛔ No second tabs component — imports `AmirnetTabs` from Task 1 with `דשבורד` active (`T-291`ⓐ).

**Step 1:** Test first — the weakness strip is absent on zero answers and absent on a bottom tie (`weakestType()` already returns `null` for both; the component must ⛔ not re-derive it).
**Step 2:** `components/AmirnetDashboard.tsx` — the three per-type cards with percentage · `N שאלות` · progress bar, then the weakness strip with «מומלץ להתחיל שם» linking to the practice menu **with that type pre-selected**.
**Step 3:** The empty state — a sentence plus a button to the practice menu. ⛔ `—` is not an answer and `0%` on zero questions is a lie.
**Step 4:** `npm run check:palette` — mandatory, the progress bars are data graphics (`RULES § 0.9`).
**Step 5:** `npm run verify`, then the walk.

**Self-check:** ⛔ no score dial and ⛔ no 50–150 meter (Roy's, `41 § 9.2`) — declared in the delivery row · ⛔ no leaderboard · the failure scenario in `T-291` (a learner with 3 answers seeing `100% · 0% · 0%` and a recommendation for a type never tried) ⛔ cannot occur, because a type with zero answers has ⛔ no percentage and ⛔ cannot be the weak one.
