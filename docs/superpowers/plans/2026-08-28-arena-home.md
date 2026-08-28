# Arena home — the screen `/arcade` opens on — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (or
> `superpowers:subagent-driven-development`). Every step is a `- [ ]` and closes only
> after a fresh run whose output goes into the tick report.

**Written:** C-0337 (DEV, 📝 planning tick) · 2026-08-28T00:37Z (`date -u`)

**Covers:** **T-181** — the arena home screen. ⚠️ **One row and ⛔ not two-to-four, and the
reason is measured ⛔ and not preferred:** `docs/plan-open.md` counts **two** ⬜ eligible
rows in `ACTIVE_WORKSTREAM: arena` — `T-181` and `T-153` — and `T-153`'s own register row
ends «**השורה דורשת טיק תכנון (PM)**, ⛔ ולא נלקחת ישירות» (migration + a content
commission + a pure-layer change = three owners). ⇒ `T-153` is ⛔ not DEV's to plan.
`T-217` (character choice) is ⛔ blocked on `03-for-roy` item 49, still 🔴 open with Roy.

**Goal:** `/arcade` stops opening straight into a battle. It opens on the **home screen of
`37-arena-spec § 12`** — title, the character on a pedestal in idle, `רמת זירה N`, the
five-node boss track, four equipment slots, and the three controls `התחל קרב` ·
`עיצוב דמות` · `ארון ציוד` — every figure read from a **live column**, and `התחל קרב`
is what starts the battle that used to start by itself.

**Architecture:** the three layers the repo already enforces. The **rule** lives in
`lib/core/arenaHome.ts` (pure — ⛔ zero React/DOM/network/clock); the **component draws
and ⛔ does not compute**; the **route applies a read plan and ⛔ does not decide**. One
new pure module, one new read-only endpoint, one new screen component, one client shell.

**Tech Stack:** Next 16 App Router · React client components · TypeScript (⛔ no `any`) ·
Tailwind · Vitest · Playwright (`npm run check:mobile`).

**Spec:** `plan/37-arena-spec.md` § 12 (home) · § 9 (boss every 5 wins) · § 13
(invariants) · `plan/38-character-base.md` § 2 (the slot vocabulary) ·
`plan/36-video-spec.md` § 14.4 (how the render binds).

🎯 **The render this screen targets: `docs/design/kol-B-01-home.png`**, drawn by
`docs/design/render_video_B.py:107` (`screen_home`) at `LW, LH = 375, 812`. ⛔ Every
number below was **grepped out of that function**, ⛔ not eyeballed off the PNG.

## Global Constraints

- ⛔ **`36 § 14.4`: הרנדר מחייב — layout **and** finish alike.** «The finish comes from the
  constitution» is ⛔ **not** an answer to a gap. **שכבה A (Layer A) — contrast ≥4.5:1 ·
  44px target · ⛔ no state in colour alone — is the ONLY carve-out**, and a Layer A
  deviation is written into the task row **with the number that was measured**.
- Every learner-facing string is **Hebrew, RTL**. English only inside `<EnWord>`/`<EnText>`.
- `lib/core/` is PURE: ⛔ zero React, `window`, `document`, `localStorage`, `fetch`,
  `process.env`, `Date.now`, `Math.random`.
- A UI component ⛔ never touches the database — everything through `app/api/*` and
  `lib/api/client.ts`.
- `37 § 13.1` — the arena ⛔ never writes `word_progress`. Every endpoint here is **read-only**.
- `37 § 13.5` — the five arena hexes are **scoped**; ⛔ nothing enters `lib/core/palette.ts`.
  ⚠️ `app/arcade/page.test.ts` scans `arcade-tokens.css` **raw** and counts every hex in it
  as an arena token ⇒ ⛔ **do not add a hex to that file in this plan.** Greens and blues
  come from `globals.css` tokens (`text-success`, `--brand`) by name.
- `min-h-[100dvh]`, ⛔ never `h-screen`. Zero horizontal scroll at **320 · 375 · 414**.
- `docs/api-contract.md` is updated in the **same commit** as the endpoint change.
- ⛔ **Zero invented learning content.** Nothing on this screen is learning content; the
  strings are chrome, quoted from `37 § 12` and `38 § 2`.

---

## What the render draws that this slice ⛔ does NOT build, and why

| Render node | Status | Ground |
|---|---|---|
| `שברי ניצוץ` chip (`render_video_B.py:117-124`) | ⛔ **out** | **D-131.** `0014_arcade.sql:24-30` has ⛔ no shard column. |
| `1,240 / 2,000` + the XP bar (`:135-140`) | ⛔ **out** | **D-131.** ⛔ No column, and `37 § 9` names ⛔ no curve ⇒ the number has nowhere to come from. |
| `חרב הניצוץ · מגן אבן · לחש אש · שריון קל` (`:72-73`, `GEAR`) | ⛔ **out as item names** | **D-132.** They are *instances* from a starter kit `38 § 6` says is ⛔ undecided. Slots are labelled by **slot name**. |
| The `ארון ציוד` drawer's eight items (`:74-83`, `DRAWER_ITEMS`) | ⛔ **out as that list** | **D-132**, same ground. The drawer ships showing the learner's **real** `unlocked_items` through `ITEM_LABELS_HE`. |
| Character choice, full-screen (`37 § 7`) | ⛔ **out** | **D-133 § ג׳-ד׳** — it is **T-217**, blocked on `03-for-roy` item 49. |

⚠️ **And that is ⛔ not «the render lost».** `36 § 14.4` binds — every node the render draws
that has a live column behind it is built at the render's own coordinates. The five rows
above are the ones a **PM decision** removed, each named here with its decision id.

---

## File Structure

**Create**

| File | Responsibility |
|---|---|
| `lib/core/arenaHome.ts` | PURE. The boss track from `wins`, the four home slots from `unlocked_items`, the slot vocabulary of `38 § 2`. ⛔ No React, no clock. |
| `lib/core/arenaHome.test.ts` | Vitest. The render's own numbers as the fixture. |
| `app/api/arcade/home/route.ts` | `GET /api/arcade/home` — read-only, three columns of `arcade_progress`. |
| `app/api/arcade/home/route.test.ts` | Source scan (⛔ no writes, ⛔ no `profiles`) + guard order. |
| `components/ArenaHome.tsx` | Draws the screen. ⛔ Computes nothing. |
| `components/ArenaHome.test.ts` | Source scan against the render's numbers and strings. |
| `components/ArenaShell.tsx` | Client. Holds `'home' \| 'battle'` and ⛔ nothing else. |
| `app/dev/arcade/home/page.tsx` | Layout fixture for `check:mobile`, ⛔ not a learning screen. |

**Modify**

| File | Change |
|---|---|
| `app/arcade/page.tsx` | Renders `<ArenaShell />` instead of `<ArenaBattle />`. ⛔ Stays a Server Component with ⛔ no data access. |
| `app/arcade/page.test.ts` | Assert the page mounts the shell, and that the arena tokens are still imported **here**. |
| `scripts/verify-mobile.mjs` | Block **2c** loops over a route list instead of the hard-coded `/dev/arcade` (D-134 — «per screen»), and `/dev/arcade/home` joins `ROUTES`. |
| `docs/api-contract.md` | New `## GET /api/arcade/home` section. |
| `plan/30-architecture.md` · `plan/50-tasks.md` · `plan/60-findings.md` · `plan/00-control.md` | Close-out. |

---

## Interfaces

```ts
// lib/core/arenaHome.ts  — PURE
import type { CharacterSlot } from '@/lib/core/characterBase';
import { ARCADE_ITEMS } from '@/lib/core/arcadeResult';

type ArcadeItem = (typeof ARCADE_ITEMS)[number];

/** `37 § 9` — «בוס כל 5 ניצחונות», word for word. */
export const BOSS_EVERY = 5;

/**
 * ⛔ Two independent axes and ⛔ not one enum of five: `render_video_B.py:71`
 * (`BOSS_STATES`) draws three combinations — done · current · the boss node — and a
 * flattened enum would have to invent a name for the two it never draws.
 */
export interface BossNode {
  readonly state: 'done' | 'current' | 'pending';
  readonly isBoss: boolean;
}

/** Always exactly `BOSS_EVERY` nodes, index 0 = the first after the last boss. */
export function bossTrack(wins: number): readonly BossNode[];

/** Wins still owed before the boss node. 1..BOSS_EVERY. */
export function winsToBoss(wins: number): number;

/** `38 § 2`, word for word. ⛔ Seven, ⛔ not six — see `characterBase.ts`. */
export const SLOT_LABELS_HE: Readonly<Record<CharacterSlot, string>>;

/** Which item sits in which slot. ⛔ Typed against `ARCADE_ITEMS` ⇒ a sixth item ⛔ does not compile. */
export const ITEM_SLOTS: Readonly<Record<ArcadeItem, CharacterSlot>>;

/** The four of `37 § 12`, in the render's own right-to-left order. */
export const HOME_SLOTS: readonly CharacterSlot[];

export interface HomeSlot {
  readonly slot: CharacterSlot;
  readonly label: string;
  readonly item: ArcadeItem | null;
}

/** ⛔ A name outside `ARCADE_ITEMS` is skipped silently, exactly as `<ArenaAvatar>` skips it. */
export function homeSlots(unlocked: readonly string[]): readonly HomeSlot[];
```

```ts
// app/api/arcade/home/route.ts
/** GET /api/arcade/home — see docs/api-contract.md */
export async function GET(): Promise<Response>;
// 200 { ok: true, arcadeLevel: number, wins: number, unlockedItems: string[] }
// 401 { ok: false, code: 'session_expired' }
// 503 { ok: false, code: 'unavailable' } | { ok: false, code: 'schema_missing', message: string }
```

```ts
// components/ArenaHome.tsx
export interface ArenaHomeState {
  readonly arcadeLevel: number;
  readonly wins: number;
  readonly unlockedItems: readonly string[];
}
export interface ArenaHomeProps {
  /** Handed in by the shell ⇒ the fixture can render the screen with ⛔ no network. */
  readonly initialState?: ArenaHomeState;
  readonly onStart: () => void;
}
export default function ArenaHome(props: ArenaHomeProps): React.JSX.Element;
```

```ts
// components/ArenaShell.tsx
export default function ArenaShell(): React.JSX.Element;
```

---

## The render's numbers, grepped

From `docs/design/render_video_B.py`, `screen_home` (`:107`), at `LW=375 · LH=812`:

| Node | Line | Value |
|---|---|---|
| title `זירת קרב` | `:113` | centre, `y=118`, **24px Bold**, `INK` |
| subtitle `ארקייד · מבודד מהתקדמות הלמידה` | `:114` | centre, `y=143`, **11.5px Regular**, `INK_MUTED` α175 |
| back chevron | `:122` | right edge, apex `x=353`, `y=119`, half-height 7 |
| pedestal | `:132-133` | ellipse centre `(187.5, 372)`, `rx=64`, `ry=17`; second ellipse 6px above |
| hero | `:134` | `(187.5, 296)`, `sc=2.1`, bob `sin(t·1.5)·2.2` ⇒ **±2.2px, period 4.19s** |
| level card | `:136-137` | `x=24 · y=404 · w=327 · h=66 · r=18`, `RAISED` fill, `BORDER_SUB` 1.1 outline |
| `רמת זירה N` | `:138` | right-anchored `x=335`, `y=426`, **15px Bold**, `INK` |
| `נפרדת מרמת האנגלית שלך` | `:143` | right-anchored `x=335`, `y=460`, **10.5px Regular**, `INK_MUTED` α150 |
| boss caption | `:146` | right-anchored `x=351`, `y=490`, **12.5px SemiBold**, `GOLD_LIGHT` |
| boss nodes | `:148-151` | `y=522`, `x = 331 − i·71.75`, `r=13`; the boss node `r=16` |
| slots caption `ציוד` | `:167` | right-anchored `x=351`, `y=566`, **13.5px SemiBold**, `INK` |
| slot boxes | `:169-176` | `w=h=66`, `r=14`, `x = 285 − i·74`, `y=582`; label baseline `y=635`, **9px Medium** |
| `התחל קרב` | `:180-183` | `x=24 · y=664 · w=327 · h=58 · r=18`, gold fill `#926420`, `GOLD_LIGHT` 2px outline, label **17px Black** at `y=693` |
| `ארון ציוד` · `עיצוב דמות` | `:185-191` | two boxes `y=734 · h=42 · r=14`, gap 10, `RAISED` fill, label **12.5px SemiBold** at `y=755` |

⚠️ **The level card keeps `h=66` and both baselines exactly**, even though D-131 removed the
two nodes between them. ⛔ Do ⛔ not re-flow the card to close the gap — that would be a
layout change the render ⛔ does not carry, made to hide a PM decision.

### Layer A, measured against those numbers

| Node | Layer A | Call |
|---|---|---|
| slot box **66×66** | 44px ✅ | Display only in this slice; ⛔ not a tap target. |
| `התחל קרב` **327×58** | 44px ✅ | — |
| `ארון ציוד` / `עיצוב דמות` **158.5×42** | ⛔ **42 < 44** | 🔴 **Layer A overrides the render.** Ship at **44px** and record `42 → 44` in the task row. |
| back chevron, 11×14 glyph | ⛔ **hit area** | Wrap in a `min-h-touch min-w-touch` control — the glyph keeps the render's size, the **hit area** does not. |
| boss node state | ⛔ colour alone | Each node carries a **shape** too — check · filled dot · skull — and the caption states the count in words. |
| every text node | ≥4.5:1 | Enforced by the **gate of Task 4**, ⛔ not by inspection. |

---

## Task 1: `lib/core/arenaHome.ts` — the rule

**Files:**
- Create: `lib/core/arenaHome.ts`
- Test: `lib/core/arenaHome.test.ts`

**Interfaces:**
- Consumes: `CharacterSlot` from `lib/core/characterBase.ts`; `ARCADE_ITEMS` from `lib/core/arcadeResult.ts`.
- Produces: `BOSS_EVERY` · `BossNode` · `bossTrack` · `winsToBoss` · `SLOT_LABELS_HE` · `ITEM_SLOTS` · `HOME_SLOTS` · `HomeSlot` · `homeSlots`.

- [ ] **Step 1: Write the failing test**

Create `lib/core/arenaHome.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  BOSS_EVERY,
  HOME_SLOTS,
  ITEM_SLOTS,
  SLOT_LABELS_HE,
  bossTrack,
  homeSlots,
  winsToBoss,
} from './arenaHome';
import { ARCADE_ITEMS } from './arcadeResult';

describe('bossTrack — `37 § 9`, and the render is the fixture', () => {
  it('⛔ מצייר בדיוק את מה ש-`render_video_B.py:71` מצייר עבור 3 ניצחונות', () => {
    // BOSS_STATES = ["done", "done", "done", "current", "boss"]
    expect(bossTrack(3)).toEqual([
      { state: 'done', isBoss: false },
      { state: 'done', isBoss: false },
      { state: 'done', isBoss: false },
      { state: 'current', isBoss: false },
      { state: 'pending', isBoss: true },
    ]);
  });

  it('⛔ הכיתוב של הרנדר נגזר מאותו מספר — «נותרו 2»', () => {
    expect(winsToBoss(3)).toBe(2);
  });

  it('מחזור: 5 ניצחונות מחזירים את המסלול להתחלה, ⛔ ולא לצומת שישית', () => {
    expect(bossTrack(5)).toEqual(bossTrack(0));
    expect(bossTrack(0)[0]).toEqual({ state: 'current', isBoss: false });
    expect(winsToBoss(0)).toBe(BOSS_EVERY);
    expect(winsToBoss(5)).toBe(BOSS_EVERY);
  });

  it('הצומת האחרונה נכבשת: 4 ניצחונות ⇒ צומת הבוס היא הנוכחית ו⛔ נשארת בוס', () => {
    expect(bossTrack(4)[4]).toEqual({ state: 'current', isBoss: true });
    expect(winsToBoss(4)).toBe(1);
  });

  it('⛔ תמיד חמש צמתים, וקלט פגום ⛔ אינו זורק — הזירה אינה כלי אבחון', () => {
    for (const w of [-7, 0, 1, 13, 4321, Number.NaN]) {
      expect(bossTrack(w)).toHaveLength(BOSS_EVERY);
    }
    expect(bossTrack(-7)).toEqual(bossTrack(0));
    expect(bossTrack(Number.NaN)).toEqual(bossTrack(0));
  });
});

describe('המשבצות — `38 § 2`, ⛔ ולא שמות פריטים (D-132)', () => {
  it('⛔ ארבע משבצות, בסדר הימין-לשמאל של הרנדר', () => {
    expect(HOME_SLOTS).toEqual(['mainHand', 'offHand', 'head', 'body']);
  });

  it('⛔ אף שם פריט של הרנדר ⛔ אינו נכנס לקוד (D-132 סעיף 3)', () => {
    const src = readFileSync(new URL('./arenaHome.ts', import.meta.url), 'utf8');
    for (const banned of ['חרב הניצוץ', 'מגן אבן', 'לחש אש', 'שריון קל', 'להב הסער']) {
      expect(src).not.toContain(banned);
    }
  });

  it('לכל פריט חי יש משבצת, ו⛔ אין משבצת שאינה ב-`38 § 2`', () => {
    for (const item of ARCADE_ITEMS) {
      expect(SLOT_LABELS_HE[ITEM_SLOTS[item]]).toBeTypeOf('string');
    }
  });

  it('משבצת ריקה היא `null`, ⛔ ולא מחרוזת מומצאת', () => {
    expect(homeSlots([])).toEqual([
      { slot: 'mainHand', label: 'יד ראשית', item: null },
      { slot: 'offHand', label: 'יד משנית', item: null },
      { slot: 'head', label: 'ראש', item: null },
      { slot: 'body', label: 'גוף', item: null },
    ]);
  });

  it('פריט שנפתח מאכלס את משבצתו; שם זר מדולג בשקט', () => {
    const slots = homeSlots(['helmet', 'banner', 'not-an-item']);
    expect(slots.find((s) => s.slot === 'head')?.item).toBe('helmet');
    expect(slots.find((s) => s.slot === 'mainHand')?.item).toBe('banner');
    expect(slots.find((s) => s.slot === 'offHand')?.item).toBeNull();
  });

  it('⛔ `boots` ⇒ `legs`, שאינה על מסך הבית — ⇒ ⛔ אינה מופיעה בארבע', () => {
    expect(ITEM_SLOTS.boots).toBe('legs');
    expect(HOME_SLOTS).not.toContain('legs');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run lib/core/arenaHome.test.ts`
Expected: **FAIL** — `Failed to resolve import "./arenaHome"`.

- [ ] **Step 3: Write `lib/core/arenaHome.ts`**

```ts
import { ARCADE_ITEMS } from '@/lib/core/arcadeResult';
import type { CharacterSlot } from '@/lib/core/characterBase';

type ArcadeItem = (typeof ARCADE_ITEMS)[number];

/** `37 § 9` — «בוס כל 5 ניצחונות», מילה במילה. */
export const BOSS_EVERY = 5;

export interface BossNode {
  readonly state: 'done' | 'current' | 'pending';
  readonly isBoss: boolean;
}

/** ⛔ ניצחונות אינם יכולים להיות שליליים ו⛔ אינם יכולים להיות NaN — הזירה ⛔ אינה כלי אבחון. */
function safeWins(wins: number): number {
  return Number.isFinite(wins) && wins > 0 ? Math.floor(wins) : 0;
}

export function bossTrack(wins: number): readonly BossNode[] {
  const done = safeWins(wins) % BOSS_EVERY;
  return Object.freeze(
    Array.from({ length: BOSS_EVERY }, (_unused, i): BossNode => ({
      state: i < done ? 'done' : i === done ? 'current' : 'pending',
      isBoss: i === BOSS_EVERY - 1,
    })),
  );
}

export function winsToBoss(wins: number): number {
  return BOSS_EVERY - (safeWins(wins) % BOSS_EVERY);
}

/**
 * `38 § 2`, מילה במילה. ⛔ **שבע ⛔ ולא שש** — הכותרת שם אומרת «שש» והטבלה מונה שבע
 * שורות; `lib/core/characterBase.ts` כבר הכריע לטובת הטבלה, וזו אותה רשימה בדיוק.
 */
export const SLOT_LABELS_HE: Readonly<Record<CharacterSlot, string>> = Object.freeze({
  head: 'ראש',
  shoulders: 'כתפיים',
  body: 'גוף',
  belt: 'מותן',
  mainHand: 'יד ראשית',
  offHand: 'יד משנית',
  legs: 'רגליים',
});

/**
 * D-132 — משבצת ופריט הם שני אוצרי מילים. ⛔ `ARCADE_ITEMS` ⛔ לא השתנתה, וכל פריט
 * **מצביע** על משבצתו — בדיוק הדפוס ש-`components/ArenaAvatar.tsx` (`ITEM_LAYERS`)
 * כבר משתמש בו לשכבות. ⛔ הטיפוס אוכף חמישה מפתחות ⇒ פריט שישי ⛔ אינו מהדר.
 */
export const ITEM_SLOTS: Readonly<Record<ArcadeItem, CharacterSlot>> = Object.freeze({
  helmet: 'head',
  cape: 'body',
  lantern: 'offHand',
  boots: 'legs',
  banner: 'mainHand',
});

/**
 * ארבע מתוך שבע. ⚠️ **וזו קריאה של DEV תחת `RULES § 0.16`, מוצהרת ⛔ ולא שקטה:**
 * `37 § 12` אומר «ארבעה סלוטי ציוד» ו-`38 § 2` מונה **שבע** משבצות — ⛔ ואף מסמך עוגן
 * ⛔ אינו אומר **אילו ארבע**. הארבע כאן נקראו מהרנדר: `render_video_B.py:72` מצייר
 * חרב ⇒ `mainHand`, מגן ⇒ `offHand`, שריון ⇒ `body`; הרביעי שם הוא **לחש**, ול-`38 § 2`
 * ⛔ אין משבצת לחש ⇒ במקומו `head`, המשבצת הראשונה בטבלה. הסדר הוא סדר הרנדר,
 * מימין לשמאל. ⇒ נפתח ממצא ל-PM; ⛔ אין כאן המצאת פריט, ⛔ ואין מיגרציה.
 */
export const HOME_SLOTS: readonly CharacterSlot[] = Object.freeze([
  'mainHand',
  'offHand',
  'head',
  'body',
] as const);

export interface HomeSlot {
  readonly slot: CharacterSlot;
  readonly label: string;
  readonly item: ArcadeItem | null;
}

function isArcadeItem(name: string): name is ArcadeItem {
  return (ARCADE_ITEMS as readonly string[]).includes(name);
}

export function homeSlots(unlocked: readonly string[]): readonly HomeSlot[] {
  const held = new Set(unlocked.filter(isArcadeItem));
  return Object.freeze(
    HOME_SLOTS.map((slot): HomeSlot => ({
      slot,
      label: SLOT_LABELS_HE[slot],
      item: ARCADE_ITEMS.find((i) => held.has(i) && ITEM_SLOTS[i] === slot) ?? null,
    })),
  );
}
```

- [ ] **Step 4: Run the test and the purity gate**

Run: `npx vitest run lib/core/arenaHome.test.ts && npm run check:core`
Expected: **PASS**, and `check:core` reports the core still clean.

- [ ] **Step 5: Commit**

```bash
./scripts/g add lib/core/arenaHome.ts lib/core/arenaHome.test.ts
./scripts/g commit -m "loop(DEV): C-XXXX T-181 arena home rule - boss track from wins, four slots from 38 s2"
```

---

## Task 2: `GET /api/arcade/home` — the read plan

**Files:**
- Create: `app/api/arcade/home/route.ts`, `app/api/arcade/home/route.test.ts`
- Modify: `docs/api-contract.md` (new `## GET /api/arcade/home` section, **same commit**)

**Interfaces:**
- Consumes: `createRouteClient` · `readSupabaseEnv` from `lib/supabase/auth`.
- Produces: `GET /api/arcade/home` ⇒ `{ ok: true, arcadeLevel, wins, unlockedItems }`.

- [ ] **Step 1: Write the failing test**

Create `app/api/arcade/home/route.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');

describe('GET /api/arcade/home — `37 § 13.1`: קריאה, ⛔ ואפס כתיבה', () => {
  it('⛔ אין בקובץ ולו פעולת כתיבה אחת', () => {
    for (const write of ['.insert(', '.update(', '.upsert(', '.delete(', '.rpc(']) {
      expect(SRC).not.toContain(write);
    }
  });

  it('⛔ ⛔ אינו נוגע ב-`word_progress` ו⛔ אינו קורא `profiles` (D-052)', () => {
    expect(SRC).not.toContain('word_progress');
    expect(SRC).not.toContain('profiles');
  });

  it('קורא `arcade_progress` ובדיוק שלוש עמודות — ⛔ ולא `select(\'*\')`', () => {
    expect(SRC).toContain('arcade_progress');
    expect(SRC).toContain('arcade_level, wins, unlocked_items');
    expect(SRC).not.toContain("select('*')");
  });

  it('סדר השומרים של C-0032: ENV ⇒ סשן ⇒ שאילתה', () => {
    const env = SRC.indexOf('readSupabaseEnv');
    const session = SRC.indexOf('auth.getUser');
    const query = SRC.indexOf("from('arcade_progress')");
    expect(env).toBeGreaterThan(-1);
    expect(env).toBeLessThan(session);
    expect(session).toBeLessThan(query);
  });

  it('שורה חסרה ⛔ אינה 503 — לומד חדש מקבל את ברירות המחדל של `0014_arcade.sql`', () => {
    expect(SRC).toContain('arcadeLevel: 1');
    expect(SRC).toContain('wins: 0');
  });

  it('⛔ הנתיב דינמי — אחרת Next היה משרת שורה של לומד אחר מהמטמון', () => {
    expect(SRC).toContain("export const dynamic = 'force-dynamic'");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run app/api/arcade/home/route.test.ts`
Expected: **FAIL** — `ENOENT ... app/api/arcade/home/route.ts`.

- [ ] **Step 3: Write `app/api/arcade/home/route.ts`**

Copy the guard order and the three failure bodies **verbatim** from
`app/api/arcade/collected/route.ts:29-45` (`isSchemaMissing` · `schemaMissing` ·
`unavailable` · `sessionExpired`) — ⛔ do not invent a fourth shape.

```ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * `GET /api/arcade/home` — T-181 · `37 § 12`. **המצב המתמיד של מסך הבית, ⛔ ותו לא.**
 *
 * ⛔ `37 § 13.1`: הזירה ⛔ אינה כותבת ל-`word_progress` — הקובץ הזה ⛔ אינו כותב **כלל**.
 * ⛔ `D-052`: `profiles` ⛔ אינה נקראת. שלוש עמודות, מטבלה אחת.
 *
 * ⚠️ **שורה חסרה ⛔ אינה כישלון:** `0014_arcade.sql` נותן `arcade_level default 1` ו-`wins
 * default 0`, ולומד שטרם קרב ⛔ אין לו שורה. ⇒ אותן ברירות מחדל בדיוק מוחזרות כאן,
 * ⛔ ולא 503 — מסך בית ריק הוא **עובדה נכונה** על לומד חדש.
 */
const HOME_SELECT = 'arcade_level, wins, unlocked_items';

function isSchemaMissing(code: string | undefined): boolean {
  return code === '42P01' || code === 'PGRST205' || code === '42703' || code === 'PGRST204';
}
function schemaMissing() {
  return NextResponse.json(
    { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
    { status: 503 },
  );
}
function unavailable() {
  return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
}
function sessionExpired() {
  return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });
}

export async function GET() {
  const env = readSupabaseEnv();
  if (!env) return unavailable();

  const supabase = createRouteClient(env, await cookies());
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return sessionExpired();

  const { data, error } = await supabase
    .from('arcade_progress')
    .select(HOME_SELECT)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return isSchemaMissing(error.code) ? schemaMissing() : unavailable();

  return NextResponse.json({
    ok: true,
    arcadeLevel: data?.arcade_level ?? 1,
    wins: data?.wins ?? 0,
    unlockedItems: data?.unlocked_items ?? [],
  });
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run app/api/arcade/home/route.test.ts`
Expected: **PASS** (6 tests).

- [ ] **Step 5: Write the contract section — the SAME commit**

Append to `docs/api-contract.md`, immediately after the `## GET /api/arcade/round`
section, in the shape the neighbouring sections already use:

```markdown
## GET /api/arcade/home

**מצב מסך הבית של הזירה — קריאה בלבד** (T-181 · `37 § 12`). דורש סשן חי; סדר
השומרים הוא ENV ⇒ סשן ⇒ שאילתה (דפוס C-0032). ⛔ אין פרמטרים.

⛔ **הנתיב אינו כותב דבר** — אין בו `.insert(` · `.update(` · `.upsert(` · `.delete(`,
ו⛔ הוא אינו נוגע ב-`word_progress` (‏`37 § 13.1`) ו⛔ אינו קורא `profiles` (D-052).
הטבלה היחידה שהוא קורא היא `arcade_progress`, ובדיוק בשלוש עמודות.

**200:**

```json
{ "ok": true, "arcadeLevel": 7, "wins": 3, "unlockedItems": ["helmet"] }
```

| השדה | ההגדרה |
|---|---|
| `arcadeLevel` | `arcade_progress.arcade_level`. ⛔ **אינה רמת האנגלית של הלומד** (D-052 · D-061), והמסך אומר זאת במילים |
| `wins` | `arcade_progress.wins`. ‏`lib/core/arenaHome.ts` גוזר ממנה את מסלול הבוס — `37 § 9`, «בוס כל 5 ניצחונות» |
| `unlockedItems` | `arcade_progress.unlocked_items`. שם שאינו ב-`ARCADE_ITEMS` **מדולג בשקט** |

⚠️ **לומד בלי שורה ⛔ אינו כישלון:** מוחזרות ברירות המחדל של `0014_arcade.sql` —
`arcadeLevel: 1` · `wins: 0` · `unlockedItems: []` — ⛔ ולא 503. מסך בית ריק הוא
**עובדה נכונה** על לומד שטרם קרב.

**כשלים:** `401 session_expired` · `503 schema_missing` · `503 unavailable` — אותם
שלושה גופים בדיוק של `GET /api/arcade/collected`.
```

- [ ] **Step 6: Commit**

```bash
./scripts/g add app/api/arcade/home docs/api-contract.md
./scripts/g commit -m "loop(DEV): C-XXXX T-181 GET /api/arcade/home - read-only arena home state, contract in the same commit"
```

---

## Task 3: `components/ArenaHome.tsx` — the screen

**Files:**
- Create: `components/ArenaHome.tsx`, `components/ArenaHome.test.ts`
- Reads: `docs/design/render_video_B.py:107-191` (the numbers table above)

**Interfaces:**
- Consumes: `bossTrack` · `winsToBoss` · `homeSlots` · `BOSS_EVERY` (Task 1);
  `GET /api/arcade/home` (Task 2) through `apiGet` from `lib/api/client.ts`;
  `<ArenaAvatar>` from `components/ArenaAvatar.tsx` (`items` · `role='hero'`);
  `ITEM_LABELS_HE` from the same file — ⛔ **the only Hebrew item names in the repo**.
- Produces: `ArenaHomeProps` · `ArenaHomeState` · default export `ArenaHome`.

**Structure — ⛔ the component draws and ⛔ does not compute.** It calls `bossTrack(wins)`
and `homeSlots(unlocked)` and renders what comes back. ⛔ No `%`, no `Math.floor`, no
`5` in this file.

- [ ] **Step 1: Write the failing test**

Create `components/ArenaHome.test.ts`. It is a **source scan**, the pattern
`components/ArenaBattle.test.ts` already uses:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./ArenaHome.tsx', import.meta.url), 'utf8');

describe('ArenaHome — `37 § 12` ומול `docs/design/kol-B-01-home.png`', () => {
  it('הכותרת ותת-הכותרת, מילה במילה מ-`37 § 12`', () => {
    expect(SRC).toContain('זירת קרב');
    expect(SRC).toContain('ארקייד · מבודד מהתקדמות הלמידה');
  });

  it('התווית שמפרידה בין רמת הזירה לרמת האנגלית — ⛔ המשפט שהמסך קיים בשבילו', () => {
    expect(SRC).toContain('נפרדת מרמת האנגלית שלך');
    expect(SRC).toContain('רמת זירה');
  });

  it('שלוש הפעולות של `37 § 12`', () => {
    expect(SRC).toContain('התחל קרב');
    expect(SRC).toContain('עיצוב דמות');
    expect(SRC).toContain('ארון ציוד');
  });

  it('⛔ D-131 — ⛔ אין מד XP ו⛔ אין שבב שברים', () => {
    for (const banned of ['שברי ניצוץ', '2,000', 'xp', 'XP']) {
      expect(SRC).not.toContain(banned);
    }
  });

  it('⛔ D-132 — ⛔ אף שם פריט של הרנדר', () => {
    for (const banned of ['חרב הניצוץ', 'מגן אבן', 'לחש אש', 'שריון קל']) {
      expect(SRC).not.toContain(banned);
    }
  });

  it('⛔ הרכיב מצייר ו⛔ אינו מחשב — חשבון מסלול הבוס חי בליבה', () => {
    expect(SRC).toContain('bossTrack');
    expect(SRC).toContain('winsToBoss');
    expect(SRC).toContain('homeSlots');
    expect(SRC).not.toMatch(/%\s*5|Math\.floor/);
  });

  it('שכבה א׳ — 44px על שתי הפעולות המשניות, אף שהרנדר מצייר 42', () => {
    expect(SRC).toContain('min-h-touch');
    expect(SRC).not.toContain('h-[42px]');
  });

  it('שכבה א׳ — מצב צומת ⛔ אינו מקודד בצבע בלבד', () => {
    // צורה לכל מצב: וי · נקודה מלאה · גולגולת, ושם נגיש בעברית לכל צומת.
    expect(SRC).toContain('aria-label');
    expect(SRC).toContain('נוצח');
    expect(SRC).toContain('קרב הבוס');
  });

  it('הזירה מציירת משטח משלה — ⛔ אחרת הטקסט יושב על רקע העמוד (F-155)', () => {
    expect(SRC).toContain('data-arena-scope');
    expect(SRC).toContain('min-h-[100dvh]');
    expect(SRC).not.toContain('h-screen');
  });

  it('⛔ RTL, ו⛔ אין מחרוזת אנגלית שהלומד רואה', () => {
    const strings = SRC.match(/>[^<>{}]*[A-Za-z][^<>{}]*</g) ?? [];
    expect(strings.filter((s) => /[א-ת]/.test(s) === false && s.trim().length > 3)).toEqual([]);
  });

  it('`prefers-reduced-motion` — נשימת ה-idle נעצרת (שכבה א׳)', () => {
    expect(SRC).toContain('motion-reduce:animate-none');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/ArenaHome.test.ts`
Expected: **FAIL** — `ENOENT ... components/ArenaHome.tsx`.

- [ ] **Step 3: Build the component**

Build it top-down in the render's own order, taking every coordinate from the numbers
table above. The load path mirrors `components/ArenaBattle.tsx:192-260` exactly: `useState`
seeded from `initialState`, one `useEffect` that calls
`apiGet<{ ok: boolean; arcadeLevel: number; wins: number; unlockedItems: string[] }>('/api/arcade/home')`
and ⛔ never runs when `initialState` was handed in. Failure text comes from
`FAILURE_HE` / `RETRY_HE` in `lib/core/failure.ts` — ⛔ do not write a new sentence.

Six blocks, in this order:

1. **Header.** `<h1>זירת קרב</h1>` 24px bold, `text-[color:var(--arena-ink)]`; the
   subtitle 11.5px `--arena-ink-dim`. The back control is a `<Link href="/">` wrapping the
   chevron, `min-h-touch min-w-touch` — **the glyph keeps the render's 11×14, the hit area
   ⛔ does not.**
2. **Pedestal + idle.** The two ellipses at `(187.5, 372)` `rx=64`, and `<ArenaAvatar
   role="hero" items={unlockedItems} />` above them. The bob is **CSS only** —
   `animation: arena-idle-bob 4.19s ease-in-out infinite` translating **±2.2px**, both
   numbers from `:134`, and `motion-reduce:animate-none`. ⚠️ The keyframes go in
   `app/arcade/arcade-tokens.css` **as a keyframe block with ⛔ no hex in it** — the raw
   hex scan of `app/arcade/page.test.ts` counts every hex in that file.
3. **Level card.** `w=327 h=66 r=18` at `y=404`, `רמת זירה {arcadeLevel}` right-anchored
   at the `y=426` baseline, `נפרדת מרמת האנגלית שלך` at `y=460`. ⛔ **The 66px height and
   both baselines are the render's** — the gap D-131 left is ⛔ not closed.
4. **Boss track.** Caption `נותרו {winsToBoss(wins)} ניצחונות עד קרב הבוס`, and
   `winsToBoss(wins) === 1` ⇒ `נותר ניצחון אחד עד קרב הבוס` — ⛔ Hebrew does not take
   «נותרו 1». Then `bossTrack(wins).map(...)` over five nodes at `y=522`,
   `x = 331 − i·71.75`, `r=13` (`r=16` when `isBoss`). Each node carries a **shape** —
   check · filled dot · skull — and an `aria-label`: `נוצח` · `הקרב הבא` · `טרם` ·
   `קרב הבוס`. ⛔ Colour is never the only channel.
5. **Slots.** Caption `ציוד`; `homeSlots(unlockedItems).map(...)` into four `66×66 r=14`
   boxes at `x = 285 − i·74`, `y=582`. A filled slot draws the item glyph and
   `ITEM_LABELS_HE[item]`; an empty one draws the lock and the **slot** label. The label
   is the render's **9px** — ⚠️ and that is recorded as a finding, ⛔ not silently raised.
6. **Controls.** `התחל קרב` `327×58 r=18` calling `props.onStart`. Below it two
   `min-h-touch` buttons: `ארון ציוד` opens the sheet (the four slots again, with
   `פריטים מקרבות בלבד` from `:167`), and `עיצוב דמות` is `disabled` carrying
   `aria-describedby` on the visible line `בחירת דמות תיפתח בקרוב` — ⛔ **a disabled
   control with no written reason is a dead end**, and `37 § 7` is **T-217**.

- [ ] **Step 4: Run the test and the type gate**

Run: `npx vitest run components/ArenaHome.test.ts && npx tsc --noEmit`
Expected: **PASS**, ⛔ zero `any`.

- [ ] **Step 5: Commit**

```bash
./scripts/g add components/ArenaHome.tsx components/ArenaHome.test.ts app/arcade/arcade-tokens.css
./scripts/g commit -m "loop(DEV): C-XXXX T-181 arena home screen - 37 s12 at the render's own coordinates"
```

---

## Task 4: the shell, the fixture, and the per-screen gate

**Files:**
- Create: `components/ArenaShell.tsx`, `app/dev/arcade/home/page.tsx`
- Modify: `app/arcade/page.tsx`, `app/arcade/page.test.ts`, `scripts/verify-mobile.mjs`

**Interfaces:**
- Consumes: `ArenaHome` (Task 3), `ArenaBattle` from `components/ArenaBattle.tsx`.
- Produces: default export `ArenaShell`, mounted by `app/arcade/page.tsx`.

⚠️ **⛔ No new route, and that is deliberate.** `RULES § 0.16` sends **navigation — a tab,
a ring node, a route** back to the PM. A `'home' | 'battle'` state inside one client
component adds ⛔ zero routes and ⛔ zero entries to any route table ⇒ it stays a **module
boundary**, which is DEV's call. `/dev/arcade/home` is a **layout fixture**, `noindex` and
unlinked — the same standing exception `/dev/arcade` already is.

- [ ] **Step 1: Write the failing test**

Add to `app/arcade/page.test.ts`:

```ts
it('‏`/arcade` נפתח על מסך הבית, ⛔ ולא בתוך קרב (T-181 · `37 § 12`)', () => {
  const src = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  expect(src).toContain('ArenaShell');
  expect(src).not.toContain('ArenaBattle');
});

it('⛔ הטוקנים של הזירה עדיין נטענים כאן ו⛔ לא ב-`globals.css` (`37 § 13.5`)', () => {
  const src = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  expect(src).toContain("./arcade-tokens.css");
});

it('⛔ העמוד נשאר Server Component ⛔ בלי גישה לנתונים', () => {
  const src = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
  expect(src).not.toContain("'use client'");
  expect(src).not.toContain('supabase');
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run app/arcade/page.test.ts`
Expected: **FAIL** — `expected '…ArenaBattle…' to contain 'ArenaShell'`.

- [ ] **Step 3: Write the shell and repoint the page**

`components/ArenaShell.tsx`:

```tsx
'use client';

import { useState } from 'react';
import ArenaBattle from '@/components/ArenaBattle';
import ArenaHome from '@/components/ArenaHome';

/**
 * T-181 — **המעטפת, ו⛔ שום דבר מלבדה.** מחזיקה `'home' | 'battle'` ⛔ ותו לא.
 *
 * ⛔ **⛔ אין כאן נתיב חדש, וזו הסיבה שזו קריאה של DEV ⛔ ולא של PM** (`RULES § 0.16`):
 * ניווט — לשונית, צומת בטבעת, ראוט — חוזר ל-PM. מצב פנימי ברכיב אחד מוסיף **אפס** ראוטים.
 *
 * ⚠️ המעטפת ⛔ אינה מבקשת נתונים ו⛔ אינה מציירת — `<ArenaHome>` טוען את מצבו,
 * ו-`<ArenaBattle>` את שלו. שני מסכים, שני שומרים, ⛔ ואפס מצב משותף.
 */
export default function ArenaShell(): React.JSX.Element {
  const [screen, setScreen] = useState<'home' | 'battle'>('home');
  return screen === 'home'
    ? <ArenaHome onStart={() => setScreen('battle')} />
    : <ArenaBattle />;
}
```

`app/arcade/page.tsx` — swap the import and the body, ⛔ **keep the whole doc comment**
and append one line recording T-181:

```tsx
import ArenaShell from '@/components/ArenaShell';
import './arcade-tokens.css';
// … the existing comment block, unchanged, plus:
// ⚠️ **T-181 — `/arcade` נפתח על מסך הבית של `37 § 12`, ⛔ ולא בתוך קרב.** `<ArenaShell>`
// מחזיק `'home' | 'battle'`; ⛔ אין ראוט חדש ⇒ ⛔ אין שינוי ניווט (`RULES § 0.16`).
export default function ArcadePage() {
  return <ArenaShell />;
}
```

`app/dev/arcade/home/page.tsx` — the fixture. ⛔ Renders the component and **nothing
else** (C-0104: a line of chrome the real route lacks pushes the screen down and the
harness then measures the fixture):

```tsx
import ArenaHome from '@/components/ArenaHome';
import '../../../arcade/arcade-tokens.css';

/**
 * Layout fixture for `check:mobile` — T-181. noindex, unlinked, ⛔ **not a learning
 * screen**. `/arcade` renders it too, but `next start` runs with ⛔ no Supabase env, so
 * `GET /api/arcade/home` answers 503 by its own contract and every line the harness
 * prints there describes the FAILURE state. Same reasoning as `/dev/arcade` (T-095).
 *
 * ⛔ The numbers are chosen for **shape**, ⛔ not for meaning: `wins: 3` is the exact
 * value `render_video_B.py:71` draws (`done · done · done · current · boss`), so the
 * fixture and the render show the same five nodes.
 */
export default function DevArenaHomePage() {
  return (
    <ArenaHome
      initialState={{ arcadeLevel: 7, wins: 3, unlockedItems: ['helmet', 'banner'] }}
      onStart={() => {}}
    />
  );
}
```

- [ ] **Step 4: Parameterise the contrast gate over both arena screens**

In `scripts/verify-mobile.mjs`: add `'/dev/arcade/home'` to `ROUTES` (beside
`'/dev/arcade'`, line ~157), then wrap block **2c** (line ~1853) in a route loop —
`for (const route of ['/dev/arcade', '/dev/arcade/home'])` — replacing the hard-coded
`` `${BASE}/dev/arcade` `` at line ~1871 and the label `` const at = `${scheme} /dev/arcade` ``
at line ~1991 with `route`. ⛔ **Nothing inside the `page.evaluate` changes.**

⚠️ **D-134, word for word: the gate is per SCREEN, ⛔ not per component.** A home screen
painting its own dark surfaces is exactly the shape that hid three failures on the battle
screen until T-214 measured it.

- [ ] **Step 5: Prove the gate can fail — ⛔ a gate that never failed is a gate nobody measured**

Temporarily set the slot caption's colour to `--arena-stone-dark` in
`components/ArenaHome.tsx`, run the harness, and confirm it fails **by name** on the
string `ציוד` with a ratio under 4.5. Then revert that one line.

Run: `npm run check:mobile`
Expected: **FAIL**, naming `ציוד` and its measured ratio. Revert ⇒ **PASS**.

- [ ] **Step 6: Walk the screen — `36 § 6.5`, mandatory on a UI tick**

```bash
(npx next dev -p 3000 &) && sleep 25
```
Drive `http://127.0.0.1:3000/dev/arcade/home` at **375×780** and record, in the tick
report: heading · text length · tappable count · **anything under 44px** · horizontal
scroll at **320 · 375 · 414** · console errors. Then **compare LAYOUT to
`docs/design/kol-B-01-home.png`** — title, pedestal, card, five nodes, four slots, three
controls, in that vertical order.

⚠️ `F-132` is open: Next 16 refuses cross-origin dev assets on `127.0.0.1`. If
`/_next/static/*` 404s, use `http://localhost:3000` and say so in the report.

- [ ] **Step 7: The full gate**

Run: `npm run verify`
Expected: **PASS** — all five commands, `check:mobile` included. ⛔ A failure is fixed in
this tick or the work is reverted; ⛔ never pushed red.

- [ ] **Step 8: Commit**

```bash
./scripts/g add components/ArenaShell.tsx app/arcade/page.tsx app/arcade/page.test.ts \
  app/dev/arcade/home scripts/verify-mobile.mjs
./scripts/g commit -m "loop(DEV): C-XXXX T-181 /arcade opens on the home screen; per-screen contrast gate covers both arena screens"
```

---

## Self-check

| `37 § 12` names | Where it is built |
|---|---|
| `זירת קרב` / `ארקייד · מבודד מהתקדמות הלמידה` | Task 3, block 1 |
| `שברי ניצוץ` chip | ⛔ **D-131** — out, with the column measured |
| character on a pedestal in idle | Task 3, block 2 (`<ArenaAvatar>` + CSS bob, `motion-reduce`) |
| `רמת זירה` + `נפרדת מרמת האנגלית שלך` | Task 3, block 3, from `arcade_progress.arcade_level` |
| the XP meter | ⛔ **D-131** — out, `37 § 9` names no curve |
| five-node boss track | Tasks 1 + 3, from `wins` and `37 § 9` |
| four equipment slots | Tasks 1 + 3, labelled by **slot** (D-132) |
| `התחל קרב` · `עיצוב דמות` · `ארון ציוד` | Task 3, block 6 (`עיצוב דמות` disabled, reason written — T-217) |
| ⛔ arena level absent from `אני` (`36 § 10`) | ⛔ Nothing in this plan touches `components/MeScreen.tsx` |
| `37 § 13.1` — ⛔ no `word_progress` write | Task 2, enforced by source scan |
| `37 § 13.5` — arena palette stays scoped | Task 3 step 3 note + `app/arcade/page.test.ts` raw hex scan |

**Findings this plan opens** (filed in the planning tick, ⛔ not left in the plan):

- **F-161 🟡** — `37 § 12` says «four equipment slots», `38 § 2` lists **seven**, and ⛔ no
  anchor document says **which four**. DEV chose `mainHand · offHand · head · body` off the
  render's own glyphs and logged it; the choice is strings only and one commit wide.
- **F-162 ⚪** — `render_video_B.py:175` draws the slot label at **9px**. Layer A covers
  contrast · 44px · colour-only and ⛔ says nothing about type size, so `36 § 14.4` binds
  and the plan ships 9px. ⇒ PM to decide whether the constitution grows a type floor.
