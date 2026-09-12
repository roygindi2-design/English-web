# Plan — amirnet simulation: the four levels, the way in, and the unlock that survives a reload

**Cycle:** C-0550 (DEV) · **Workstream:** `amirnet` (read-ahead from `msgs`) · **Milestone:** M2
**Rows covered:** `T-307` (this tick) · `T-308` (המשך של: T-307) · `T-309` (המשך של: T-307, declared large)
**REQUIRED SUB-SKILL:** ⛔ none — the three tasks touch the same two files in sequence
(`components/AmirnetLevels.tsx` then `components/AmirnetTabs.tsx` then the same page), so
`superpowers:subagent-driven-development` does ⛔ not apply (`RULES § 0.5` needs ≥3 **independent** items).
**SKILL:** `ui-styling` (the `[SKILL: …]` cell on `T-307`) — mobile-first utilities, the breakpoint
system, and `Interaction › Disabled States` («Don't: Confuse disabled with normal state»), queried
this tick through `skills/ui-ux-pro-max/ui-ux-pro-max/scripts/search.py`.
⛔ **The shadcn half of that skill is ⛔ out of scope by the registry's own fence** — the product is
Tailwind + its own components + `lib/core/palette.ts`, and bringing shadcn in is an architecture
change, ⛔ not a skill choice.

**Goal:** `41 § 7` «סימולציה» — «ארבע רמות לפי סעיף 4, **רמה נפתחת בהשלמת הקודמת**». The engine
(`T-296`) and the result screen (`T-298`) are on `dev` and a learner ⛔ cannot reach either of them:
measured this tick, `components/AmirnetTabs.tsx:56` carries `AMIRNET_BUILT_TABS = ['dashboard',
'practice']` and `app/(tabs)/world/amirnet/simulation/` does ⛔ not exist. ⇒ this plan builds the
screen that is missing (`T-307`), opens the door to it (`T-308`), and makes the lock state a fact
about the learner instead of a fixture (`T-309`).

**Lineage:** **המשך של: T-296 · T-298** — the engine, its per-chapter clock and the result screen
are ⛔ not rewritten here. This plan adds what sits **before** them.

## 🎯 The render, and what it binds

`docs/design/render_video_D.py` `screen_levels` (:195-235) with its `LEVELS` table (:197-201).
Every layout value below was **grepped from that function** — which is what `36 § 14.4` asks for in
any case («grep them, ⛔ do not eyeball the PNG»).
⚠️ **Measured this tick, ⛔ and it is ⛔ not a licence to invent:** `ls docs/design/kol-D-*` returns
**seven** stills (`01-world` … `07-result`) and there is ⛔ **no exported frame for this screen** —
`screen_levels` is drawn only inside the video (`scene_levels`). ⇒ the **function** is the binding
source here, cited line by line below; ⛔ nothing on this screen is taken from a picture nobody has.

🔴 **`36 § 14.4`: the render is BINDING — layout, order, strings AND finish alike.** **שכבה A (the
accessibility gates) is the ⛔ only carve-out**, and each such gap is declared here with the number
measured. ⚠️ **The render is dark; the product is light** (`36 § 14.2`, Roy 11/09) ⇒ the background
is ⛔ NOT a gap and is ⛔ not listed as one. Every colour is a `palette.ts` product token.

**Declared שכבה A gaps, with the render's own numbers:**
| what | render | built | why |
|---|---|---|---|
| summary sub-line | 10.5px (`:208`) | `text-sm` (14) | `check:text-floor` |
| level description | 11.5px (`:219`) | `text-sm` (14) | `check:text-floor` |
| band chip | 11.5px h=24 (`:222-224`) | `text-sm`, `min-h-touch` ⛔ not applied — it is a **label**, ⛔ not a target | `check:text-floor` · 44px is a floor for what a finger hits |
| locked reason line | 11px (`:227-228`) | `text-sm` (14) | `check:text-floor` |
| level card | r=17 (`:215`) | `rounded-2xl` (16) | 17 has ⛔ no name in the five-value scale (`D-102`) |
| summary card | r=14 (`:204`) | `rounded-xl` (12) | 14 has ⛔ no name in the scale |
| open level card | tappable h=104 (`:215`) | `min-h-touch` **and** the whole card is the target | 44px floor |
| locked card | colour + opacity only (`:216-218`) | opacity **+** the written reason **+** `aria-disabled` | state is ⛔ never colour alone |

🔴 **AND ONE THING THAT IS ⛔ NOT A GAP, ⛔ and ⛔ not an omission either — it is a DECLARED
deviation (`T-307`ⓔ):** the render prints `הושלם · 71` · `הושלם · 104` · `הכי גבוה · 112` on the
three open cards (`:197-200`, `:230`). **Those are score-estimate numbers**, and `41 § 9.2` puts the
score formula with **Roy** (`03-for-roy` item 73). ⇒ the cards carry ⛔ no number, and the progress
bar the render draws under them (`:231-233`) goes with them — a bar whose fill is derived from a
score we ⛔ do not compute would be an invented statistic, which is worse than an absent one.
**What replaces them is ⛔ nothing**: the card says what the level IS, and whether it is open.

## Global Constraints

- **`T-307` is ⛔ presentation only** (`T-307`ⓕ): ⛔ zero `lib/core/**`, ⛔ zero `supabase/**`, ⛔ zero
  `app/api/**`. The unlock state arrives as a **prop**. The component decides ⛔ nothing — it is
  ⛔ not allowed to know how a level gets unlocked, which is exactly what makes `T-309` a rewire and
  ⛔ not a rewrite.
- **The four levels are `41 § 4`'s table, ⛔ verbatim** — band, classification and characteristic.
  ⛔ Not re-worded, ⛔ not re-ordered, ⛔ not abbreviated.
- **⛔ Zero score, ⛔ zero score estimate, ⛔ zero adaptive level choice.** `41 § 9.2` is Roy's.
- **⛔ No second component for a job that has one** (constitution § 6): the tab bar is `AmirnetTabs`,
  the English text is `<EnWord>`, the Hebrew is RTL. ⛔ No new tab bar, ⛔ no new card style.
- `prefers-reduced-motion`: this screen has ⛔ no motion at all (`check:motion`).
- **⛔ The learner is ⛔ not sent to a dead end** (`RULES § 0.31`). `T-308` flips `simulation` into
  `AMIRNET_BUILT_TABS` **in the same commit** that creates `app/(tabs)/world/amirnet/simulation/page.tsx`
  — `AmirnetTabs.dom.test.tsx` already measures that every BUILT key resolves to a `page.tsx` on disk,
  so the two ⛔ cannot separate. ⛔ Until then `simulation` stays «טרם», and that is a statement of
  fact (`D-152 § ב׳`), ⛔ not a stale promise.
- **⛔ Nothing here is invented learning content** (`R-010`): the screen holds ⛔ no question, ⛔ no
  word and ⛔ no translation. Every string on it is interface text from `41 § 4` / `41 § 7` / the render.

## File Structure

```
NEW   components/AmirnetLevels.tsx              draws screen_levels. Decides ⛔ nothing.
NEW   components/AmirnetLevels.test.ts          source-shape guard (strings · tokens · 44px · no colour-only · no score)
NEW   app/dev/amirnet/levels/page.tsx           the STEP 6.5 walk harness — level 3 open, level 4 locked
EDIT  plan/50-tasks.md · plan/30-architecture.md · plan/00-control.md   (T-307 ⇒ 🟣)
— task 2 (T-308), ⛔ not this tick —
NEW   app/(tabs)/world/amirnet/simulation/page.tsx
EDIT  components/AmirnetTabs.tsx · components/AmirnetTabs.test.ts
— task 3 (T-309), ⛔ not this tick —
NEW   supabase/migrations/00xx_amirnet_simulation_runs.sql   (with its own `down` path)
NEW   lib/core/amirnetLevels.ts · lib/core/amirnetLevels.test.ts
EDIT  app/(tabs)/world/amirnet/simulation/page.tsx
```

## Interfaces

```ts
// components/AmirnetLevels.tsx
import type { AmirnetLevel } from '@/lib/core/amirnetPractice';   // type-only — 1 | 2 | 3 | 4

export interface AmirnetLevelRow {
  readonly level: AmirnetLevel;
  readonly nameHe: string;        // `רמה 1 · בסיסי`      — 41 § 4 «סיווג»
  readonly band: string;          // `50–84`              — 41 § 4 «רצועה», LTR digits
  readonly descHe: string;        // `אוצר מילים בסיסי · משפטים קצרים` — 41 § 4 «מאפיין»
}
export const AMIRNET_LEVEL_ROWS: readonly AmirnetLevelRow[];   // exactly 4, from 41 § 4
export const HEADING_HE = 'סימולציה מלאה';
export const KICKER_HE = 'העולם · אמירנט';
export const SUMMARY_HE = '6 פרקים · 23 שאלות · 39 דקות';
export const ADAPTIVE_NOTICE_HE = 'אדפטיבי בין פרקים, כמו במבחן האמיתי';
export const lockedReasonHe: (level: AmirnetLevel) => string;   // `עבור רמה 3 כדי לפתוח`
export const OPEN_LABEL_HE: string;      // the sr-only word that says an open card is open
export const LOCKED_LABEL_HE: string;    // …and that a locked one is locked. ⛔ Never colour alone.

export interface AmirnetLevelsProps {
  /** The highest level the learner has unlocked. Level 1 is ⛔ always open (`T-309`ⓓ). */
  readonly unlockedThrough: AmirnetLevel;
  /** Called ⛔ only for an unlocked level. `T-308` wires it to the engine; ⛔ undefined here. */
  readonly onStart?: (level: AmirnetLevel) => void;
}
```

## Task 1: `T-307` — the four levels, and which one is still locked

**Interfaces:** as declared above. Reuses `AmirnetLevel` (type) from `lib/core/amirnetPractice.ts`
and `AmirnetTabs` / `AMIRNET_BUILT_TABS` unchanged.

**Real test code — written BEFORE the component (`test-driven-development`). These are `T-307`'s own
binding claims, ⛔ not a smoke test:**

```ts
// components/AmirnetLevels.test.ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ADAPTIVE_NOTICE_HE, AMIRNET_LEVEL_ROWS, HEADING_HE, SUMMARY_HE, lockedReasonHe,
} from './AmirnetLevels';

const CODE = readFileSync('components/AmirnetLevels.tsx', 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('AmirnetLevels — T-307, render_video_D.py screen_levels (:195-235)', () => {
  it('the four levels are 41 § 4 exactly — band, classification and characteristic', () => {
    expect(AMIRNET_LEVEL_ROWS).toHaveLength(4);
    expect(AMIRNET_LEVEL_ROWS.map((r) => r.band)).toEqual(['50–84', '85–110', '111–133', '134–150']);
    expect(AMIRNET_LEVEL_ROWS.map((r) => r.nameHe)).toEqual([
      'רמה 1 · בסיסי', 'רמה 2 · מתקדמים א׳', 'רמה 3 · מתקדמים ב׳', 'רמה 4 · פטור',
    ]);
    expect(AMIRNET_LEVEL_ROWS[2].descHe).toBe('אוצר מילים אקדמי · הסקה');
  });

  it('the two summary strings are the render, word for word (:207-209)', () => {
    expect(HEADING_HE).toBe('סימולציה מלאה');
    expect(SUMMARY_HE).toBe('6 פרקים · 23 שאלות · 39 דקות');
    expect(ADAPTIVE_NOTICE_HE).toBe('אדפטיבי בין פרקים, כמו במבחן האמיתי');
  });

  it('a locked level says WHY in words, and names the level that opens it (:227-228)', () => {
    expect(lockedReasonHe(4)).toBe('עבור רמה 3 כדי לפתוח');
    expect(lockedReasonHe(2)).toBe('עבור רמה 1 כדי לפתוח');
  });

  it('⛔ locked is ⛔ not «the same style as enabled» — opacity AND a word AND aria-disabled', () => {
    expect(CODE).toMatch(/aria-disabled/);
    expect(CODE).toMatch(/opacity-/);
    expect(CODE).toMatch(/lockedReasonHe\(/);
    // ⛔ and a locked card is ⛔ not a button at all — ⛔ not a disabled one.
    expect(CODE).toMatch(/unlocked \?/);
  });

  it('⛔ no score, ⛔ no score estimate, ⛔ no progress bar derived from one (41 § 9.2 is Roy\'s)', () => {
    for (const s of ['הושלם', 'הכי גבוה', 'ציון', 'XP', 'streak']) expect(CODE).not.toContain(s);
  });

  it('every tappable carries the 44px floor, and ⛔ no hex literal reaches the screen', () => {
    expect(CODE).toMatch(/min-h-touch/);
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/h-screen/);
  });
});
```

**Steps:**

- [ ] **Step 1:** write `components/AmirnetLevels.test.ts` exactly as above and run
      `npx vitest run components/AmirnetLevels.test.ts` — it MUST fail (⛔ no component yet).
- [ ] **Step 2:** `components/AmirnetLevels.tsx` — the header (kicker · `סימולציה מלאה` · `AmirnetTabs`
      with `active="simulation"`), the summary card (`SUMMARY_HE` bold, `ADAPTIVE_NOTICE_HE` muted),
      and the four level cards in `41 § 4`'s order: name, band chip (`dir="ltr"`), characteristic,
      and for a locked one the lock icon (SVG, ⛔ no emoji) + `lockedReasonHe(level)`. Re-run green.
- [ ] **Step 3:** `app/dev/amirnet/levels/page.tsx` — `unlockedThrough={3}` so the walk and
      `check:mobile` see **both** states on one screen (`T-307`ⓓ).
- [ ] **Step 4:** `npm run generate-map` if `package.json` carries it, then `npm run build` and
      `npx next start -p 3000` (explicit ten-minute window on both), walk
      `http://localhost:3000/dev/amirnet/levels` at 375×780 — record heading, text length, tappable
      count, under-44px, horizontal scroll, console errors — and compare the LAYOUT to
      `docs/design/render_video_D.py` `screen_levels`. Then `npm run preview:stop` (⛔ not `pkill`, TD-26).
- [ ] **Step 5:** `plan/50-tasks.md` `T-307` ⇒ 🟣 C-0550, one `plan/30-architecture.md` entry,
      `npm run measure:plan` + both generated indexes in the same commit, then **`npm run verify`**
      (nine commands, explicit ten-minute window) and push to `work/current`.

**Self-check:** ⛔ no `lib/core` file · ⛔ no API route · ⛔ no migration · ⛔ no score or score
estimate · locked ⛔ never signalled by colour alone · the four levels match `41 § 4` cell for cell ·
every שכבה A gap above carries the render's measured number · `simulation` still reads «טרם» in
`AMIRNET_BUILT_TABS`, because the route it would point at does ⛔ not exist yet.

## Task 2: `T-308` — the tab stops saying «טרם», and the learner walks in

**Interfaces:** consumes `AmirnetLevels` unchanged. Adds ⛔ no prop and ⛔ no export beyond the page.

```ts
// components/AmirnetTabs.test.ts — T-308's own failure scenario
it('every BUILT tab has an href, and ⛔ no href points at a route that does not exist', () => {
  for (const key of AMIRNET_BUILT_TABS) expect(AMIRNET_TAB_HREF[key]).toMatch(/^\/world\/amirnet/);
  expect(AMIRNET_BUILT_TABS).toContain('simulation');
});
```

**Steps:**

- [ ] **Step 1:** `app/(tabs)/world/amirnet/simulation/page.tsx` rendering `<AmirnetLevels>` —
      `unlockedThrough={1}` until `T-309` lands the real state, and that constant carries a comment
      naming `T-309` so it ⛔ cannot be mistaken for a decision.
- [ ] **Step 2:** flip `'simulation'` into `AMIRNET_BUILT_TABS` **in the same commit** and extend
      `components/AmirnetTabs.test.ts` with the consistency check above; `AmirnetTabs.dom.test.tsx`
      already asserts the route exists on disk, so a flip without the page turns it red.
- [ ] **Step 3:** an open level card starts the existing engine; a locked card is ⛔ not a link at all
      (⛔ not a disabled one). Walk `/world/amirnet/simulation`, then `npm run verify` and push.

## Task 3: `T-309` — the unlock is a fact about the learner, ⛔ not a fixture

**Interfaces:** a pure `lib/core/amirnetLevels.ts` — `highestUnlocked(runs): AmirnetLevel` over the
completion records, ⛔ never a query inside the screen. `T-307`'s component is ⛔ unchanged: it keeps
receiving `unlockedThrough` as a prop.

```ts
// lib/core/amirnetLevels.test.ts — T-309's own failure scenario
it('a learner who finished level 3 keeps level 4 open after a reload — ⛔ and level 1 is always open', () => {
  expect(highestUnlocked([])).toBe(1);
  expect(highestUnlocked([{ level: 3, completedAtMs: 1 }])).toBe(4);
  expect(highestUnlocked([{ level: 1, completedAtMs: 1 }, { level: 3, completedAtMs: 2 }])).toBe(4);
});
```

**Steps:**

- [ ] **Step 1:** `supabase/migrations/00xx_amirnet_simulation_runs.sql` — `RLS` in the shape of
      `supabase/migrations/0024_amirnet_items.sql`, a minimal `grant`, and its **`down` path in the
      same file** (`RULES § 0.22` — `supabase db push` is ⛔ not reversible by a commit).
- [ ] **Step 2:** `lib/core/amirnetLevels.ts` + its test, written first and failing first.
- [ ] **Step 3:** the product page reads the records through `app/api/**` and passes
      `unlockedThrough`; `supabase db push`, **verify it succeeded**, walk, `npm run verify`, push.
