# 2026-08-26 · `nav` slice A — the ring opens, and `העולם` stops being a door

**Tasks covered:** `T-204` (the pure model) · `T-205` (the screen) · `T-206` (seal ⓒ) · `T-174` (the five-tab bar).
**Decisions:** `D-117` · `D-118` · `D-119` · UX plan `§ 4.2יט` (PM, C-0311).
**Anchor:** `plan/36-video-spec.md § 4` (the bar) · `§ 6` (the ring) · `§ 13.2` row 2 (the three seals).

🎯 **The render this plan targets:** `docs/design/kol-world-ring.png` — and it is the ONLY
render for this screen. `36 § 14.4` (D-114) makes it binding for **finish as well as layout**.

## 0 · The measurement this plan rests on

Run on `work/current`, `next dev`, 375×780, **2026-08-26T08:40Z**:

| Route | What the tab bar printed | What the screen behind it printed |
|---|---|---|
| `/dev/tabs/studies` | `העולם` · **בקרוב** | — |
| `/dev/tabs/me` | `העולם` · **בקרוב** | — |
| `/world` | `העולם` · **בקרוב** | «הרכבה **פתוח**» · «המילים שאספתי **פתוח**» · «זירה **—**» · «הספרייה **—**» |

Three facts fall out of that table, and none of them is an opinion:

1. **Seal ⓐ fails today.** `36 § 13.2` row 2 asks that the tab *appear on every screen and
   lead to the ring*. It appears on every screen as **«בקרוב»**, and there is no ring.
2. **`/world` is a four-tile grid, ⛔ not the eight-node ring.** The ring does not exist in
   the tree — `grep -rn 'טבעת' app components lib` returns nothing.
3. **`«—»` is live in production code**, three times on one screen. That is `T-148`, open
   since 22/08, and this plan is where it is answered — by construction, ⛔ not by a patch.

⚠️ **And `/dev/world` is ⛔ NOT a ring fixture** — `app/dev/world/page.tsx` renders
`<ComposeDraft>`. The `nav` workstream has **no fixture at all** today. Step 8 creates one.

## 1 · File Structure

| File | New / edited | What |
|---|---|---|
| `lib/core/worldRing.ts` | **new** | PURE. `T-204` — order · labels · four state classes · geometry · `ringScreen` |
| `lib/core/worldRing.test.ts` | **new** | `T-204` truth tests + the three mutations that must fail **by name** |
| `lib/core/lastNode.ts` | **new** | PURE. `T-206ⓐ` — key + `parseLastNode` |
| `lib/core/lastNode.test.ts` | **new** | `T-206` — the hostile-input table |
| `components/WorldRing.tsx` | **new** | `T-205` · `T-206ⓑⓒⓔ` — the client shell: reads, maps to `RingInputs`, draws |
| `components/WorldRing.test.ts` | **new** | source scans: `«—»`, `בקרוב`, auto-navigation fail by name |
| `app/(tabs)/world/page.tsx` | edited | `T-205ⓐ` — renders `<WorldRing>`; `<AppGrid>` · `<RecallCard>` · `<WorldFeed>` dropped from the screen |
| `components/TabBar.tsx` | edited | `T-174` + `T-205`/`D-117` — five tabs, world is a plain `Link`, raised centre |
| `components/TabBar.test.ts` | edited | the `href: null` assertions invert; a new one forbids `בקרוב` in this file |
| `app/(tabs)/settings/page.tsx` | **new** | `T-174` — the fifth tab needs a destination that exists |
| `app/dev/world/ring/page.tsx` | **new** | `T-205ⓕ` — fixture, all three classes on one screen |
| `scripts/verify-mobile.mjs` | edited | `ROUTES` gains `/dev/world/ring`; `TAB_ROUTES` unchanged |
| `components/AppGrid.tsx` | ⛔ **untouched** | ⛔ not deleted, ⛔ not edited — it simply stops being rendered by `/world` |
| `lib/core/worldApps.ts` | ⛔ **untouched** | its tests keep passing; `T-148` is answered in `worldRing.ts`, ⛔ not here |
| `lib/core/worldGate.ts` | ⛔ **untouched** | `worldGateSentenceHe` gains a second caller (the arena node), ⛔ no edit |
| `supabase/migrations/*` | ⛔ **none** | ⛔ **zero migrations in this plan** — D-119 is why |

## 2 · Interfaces

⚠️ **Every block below was run through `tsc` with `strict` + `noUncheckedIndexedAccess`
before it was written here — exit 0.** That is the open feedback row `C-0299` in
`plan/26-plan-feedback.md`, answered ⛔ before it recurred.

```ts
// lib/core/worldRing.ts — PURE. ⛔ zero React, DOM, fetch, env, clock.

export type RingNodeId =
  | 'arena' | 'msgs' | 'stories' | 'compose'
  | 'sentences' | 'vocab' | 'leaders' | 'friends';

export type RingNodeState =
  /** has a destination and the condition holds */
  | { readonly kind: 'open'; readonly href: string }
  /** has a destination, condition not met — D-046 APPLIES: `noteHe` MUST carry a digit */
  | { readonly kind: 'locked_count'; readonly noteHe: string }
  /** ⛔ no destination exists — D-046 does ⛔ NOT apply; the inverse is enforced */
  | { readonly kind: 'locked_infra'; readonly noteHe: string }
  /** the read failed. ⛔ Never rendered per-node — see `ringScreen`. */
  | { readonly kind: 'unknown' };

export interface RingNode {
  readonly id: RingNodeId;
  readonly labelHe: string;
  readonly state: RingNodeState;
}

/** `36 § 6`, verbatim and in order. ⛔ NOT a pedagogical order, ⛔ no featured node. */
export const RING_ORDER: readonly RingNodeId[] = [
  'arena', 'msgs', 'stories', 'compose',
  'sentences', 'vocab', 'leaders', 'friends',
];

export const RING_LABEL_HE: Readonly<Record<RingNodeId, string>> = {
  arena: 'זירת קרב',
  msgs: 'הודעות',
  stories: 'סיפורים',
  compose: 'כתיבה חופשית',
  sentences: 'משפטים',
  vocab: 'אוצר מילים',
  leaders: 'מובילים',
  friends: 'חברים',
};

/** `36 § 6` gives r=108. Angles are read off `kol-world-ring.png`, ⛔ not invented:
 *  `זירת קרב` at the top, then clockwise. 0° = right, CCW positive. */
export const RING_RADIUS = 108;
export const RING_ANGLE_DEG: Readonly<Record<RingNodeId, number>> = {
  arena: 90, msgs: 45, stories: 0, compose: -45,
  sentences: -90, vocab: -135, leaders: 180, friends: 135,
};

export interface RingPoint { readonly x: number; readonly y: number }

/** ⛔ The screen does ⛔ NOT compute this — that is what makes the ring testable with no DOM. */
export function ringPoint(id: RingNodeId, radius: number = RING_RADIUS): RingPoint {
  const rad = (RING_ANGLE_DEG[id] * Math.PI) / 180;
  return { x: radius * Math.cos(rad), y: -radius * Math.sin(rad) };
}

export type RingScreen =
  | { readonly kind: 'ring'; readonly nodes: readonly RingNode[] }
  | { readonly kind: 'empty'; readonly messageHe: string; readonly actionHref: string };

/** The four nodes whose state comes off the wire. The other four are ⛔ constants. */
export interface RingInputs {
  readonly arena: RingNodeState;
  readonly stories: RingNodeState;
  readonly compose: RingNodeState;
  readonly vocab: RingNodeState;
}

const INFRA_NOTE_HE: Readonly<Record<'msgs' | 'sentences' | 'leaders' | 'friends', string>> = {
  msgs: 'ההודעות ייפתחו כשתיבת הדואר תיבנה.',
  sentences: 'המשפטים ייפתחו כשמאגר המשפטים ייבנה.',
  leaders: 'המובילים ייפתחו כשחשבונות המשתמשים יחוברו.',
  friends: 'החברים ייפתחו כשחשבונות המשתמשים יחוברו.',
};

const ALL_UNKNOWN_HE = 'לא הצלחנו לטעון את העולם.';

export function ringScreen(inputs: RingInputs | null, retryHref: string): RingScreen {
  if (inputs === null) {
    return { kind: 'empty', messageHe: ALL_UNKNOWN_HE, actionHref: retryHref };
  }
  const live: Readonly<Record<RingNodeId, RingNodeState>> = {
    arena: inputs.arena,
    stories: inputs.stories,
    compose: inputs.compose,
    vocab: inputs.vocab,
    msgs: { kind: 'locked_infra', noteHe: INFRA_NOTE_HE.msgs },
    sentences: { kind: 'locked_infra', noteHe: INFRA_NOTE_HE.sentences },
    leaders: { kind: 'locked_infra', noteHe: INFRA_NOTE_HE.leaders },
    friends: { kind: 'locked_infra', noteHe: INFRA_NOTE_HE.friends },
  };
  const nodes: readonly RingNode[] = RING_ORDER.map((id) => ({
    id, labelHe: RING_LABEL_HE[id], state: live[id],
  }));
  // D-064 as written: ⛔ a disabled tile is not legal when every tile is disabled.
  const anyOpen = nodes.some((n) => n.state.kind === 'open');
  if (!anyOpen) {
    return { kind: 'empty', messageHe: ALL_UNKNOWN_HE, actionHref: retryHref };
  }
  return { kind: 'ring', nodes };
}
```

```ts
// lib/core/lastNode.ts — PURE. ⛔ It does ⛔ NOT touch `window`; the caller passes the string.
import { RING_ORDER, type RingNodeId } from './worldRing';

export const LAST_NODE_KEY = 'kol.world.lastNode';

export function parseLastNode(raw: string | null): RingNodeId | null {
  if (raw === null) return null;
  const hit = RING_ORDER.find((id) => id === raw);
  return hit ?? null;
}
```

⚠️ **Why `parseLastNode` takes a string and ⛔ not `Storage`:** `check:core` forbids DOM in
`lib/core`. The `try/catch` around `localStorage` lives in `components/WorldRing.tsx`
(`T-206ⓔ`), and the **decision** about what a stored value means lives here, where a test
can reach it without a browser.

## 3 · Steps

### Task `T-204` — the model

- [x] **1.** Write `lib/core/worldRing.test.ts` FIRST and watch it fail. Four truth tests:
      `RING_ORDER` is `36 § 6`'s order, exactly eight, no duplicates · `ringPoint('arena')`
      is `{x: 0, y: -108}` within 1e-9 · `ringScreen(null, '/world')` returns `kind:'empty'`
      · a `RingInputs` with all four `unknown` also returns `kind:'empty'`.
- [x] **2.** Add the three tests that must fail **by name**, ⛔ not by count:
      `every locked_infra note has no digit` — `expect(/\d/.test(note)).toBe(false)` for all
      four · `no locked_infra note contains «בקרוב»` · `every locked_count note HAS a digit`
      (this is D-046, and it is the one that keeps `worldApps.test.ts`'s rule alive).
- [x] **3.** Write `lib/core/worldRing.ts` from § 2 above. ⛔ Copy it; it compiles.
- [x] **4.** `npm run check:core` — the module must pass the purity scan.

### Task `T-206` — the memory (⛔ before the screen, so the screen has something to call)

- [ ] **5.** Write `lib/core/lastNode.test.ts`: a table of hostile inputs — `null` · `''` ·
      `'arena"); DROP'` · `'ARENA'` · `'library'` (a node id that ⛔ does not exist) — each
      expecting `null`; and `'arena'` expecting `'arena'`.
- [ ] **6.** Write `lib/core/lastNode.ts` from § 2. `npm run check:core` again.

### Task `T-205` — the screen

- [ ] **7.** `components/WorldRing.tsx` (`'use client'`). It reads the same three endpoints
      `components/AppGrid.tsx` already reads — `GET /api/arcade/round` (line 204),
      `GET /api/arcade/collected` (line 222), `GET /api/world/status` (line 240) — and maps
      them to `RingInputs`. ⛔ **Reuse the existing mappers**: `levelTooSmallNoteHe` and
      `libraryTile` from `lib/core/worldApps.ts`, and `worldGateSentenceHe` from
      `lib/core/worldGate.ts`. ⛔ **Do not write a second copy of any Hebrew note.**
      `apiGet` only — ⛔ zero `apiPost`, ⛔ zero writes, exactly as `AppGrid` guarantees today.
- [ ] **8.** Draw it, against `docs/design/kol-world-ring.png` and ⛔ not against memory:
      heading `העולם` + `מרחב פתוח · לא נספר להתקדמות הלמידה`, top-anchored right (layer A) ·
      the `קול` focus centred, raised, with the glow ≤ the constitution-B3 budget and OFF
      under `prefers-reduced-motion` · eight nodes positioned from `ringPoint` · **the label
      sits outside its circle** · every node is a 44×44 target (layer A4) · locked nodes are
      dimmed **and** carry a padlock — ⛔ the padlock is the non-colour channel, and colour
      alone is ⛔ never the state · the fixed card at the bottom: `בידוד מלא מהלמידה` /
      `ניצחון או הפסד לא נוגעים ב-word_progress`.
- [ ] **9.** In `components/WorldRing.tsx`, `kind:'empty'` renders **one** region with **one** action — `T-146` and `T-148`
      discharged here, and ⛔ nowhere else on the screen.
- [ ] **10.** `T-206ⓑⓒⓓⓔ`, still in `components/WorldRing.tsx`: read `localStorage` inside `try/catch` on
      mount, `parseLastNode` the value, mark that one node «כאן היית» (a shape channel, ⛔ not
      colour), write the id in `try/catch` on tap. ⛔ **No auto-navigation**, ⛔ no counter.
- [ ] **11.** `app/(tabs)/world/page.tsx` becomes `<WorldRing />` and nothing else. ⛔ Delete
      no file. ⛔ Do not touch `/world/compose`, `/world/collected`, `/world/story`.
- [ ] **12.** `components/WorldRing.test.ts` — source scans that fail **by name**: the file
      contains no `'—'` as a state string · no `בקרוב` · no `router.push`/`redirect` at mount.

### Task `T-174` — the bar (seal ⓐ's other half)

- [ ] **13.** `app/(tabs)/settings/page.tsx` FIRST — a tab whose destination 404s is worse
      than four tabs. Minimum honest screen: the heading `הגדרות` and the level-change entry
      point `36 § 4` names. ⛔ No invented settings.
- [ ] **14.** `components/TabBar.tsx`: `TABS` becomes five —
      `לימודים · כרטיסיות · העולם · אני · הגדרות` — logical positions 10/30/**50**/70/90%,
      labels 9.8pt, RTL first-in-DOM is rightmost. **`world` gets `href: '/world'`**
      (`D-117`): delete `href: null`, the `aria-disabled` button, the sheet, the
      `worldStatus` state and the `useEffect` that fetches `/api/world/status`. The world
      entry is a raised r=27 circle on `--brand-surface` with the pulsing glow, at the exact
      geometric centre; targets stay 44×44 (`36 § 4` — `§ 3` does not apply to tabs).
- [ ] **15.** `components/TabBar.test.ts`: invert the lock assertions and add one that fails
      by name — **this file may ⛔ not contain the string `בקרוב`**.

### Closing

- [ ] **16.** `scripts/verify-mobile.mjs`: add `/dev/world/ring` to `ROUTES`. ⛔ Do **not**
      add it to `FLOW_ROUTES` — read the comment at line 207 first; the naive addition breaks
      the `data-tab-bar` assertion. ⛔ Do not add it to `TAB_ROUTES` either: the fixture
      renders the component alone (the `/dev/deck` precedent, C-0104).
- [ ] **17.** `app/dev/world/ring/page.tsx` — the component with a hand-built `RingInputs`
      showing **all three classes at once**: one `open`, one `locked_count`, the rest
      `locked_infra`. ⛔ Component only, ⛔ no heading of its own (C-0104). ⛔ Non-content
      strings, per the `/dev/deck` and `/dev/world` precedent.
- [ ] **18.** `npm run verify` — exit 0, and ⛔ nothing is claimed before it is seen.
- [ ] **19.** Walk it: `npx next dev -p 3000`, then `/world` and `/dev/world/ring` at
      375×780. Record **heading · text length · tappable count · targets under 44px ·
      horizontal scroll · console errors**, and write the numbers into the handoff row.

## 4 · What this plan ⛔ does NOT claim

⛔ **The fixture is ⛔ not a seal.** `36 § 13.1` says a typed address is not arrival and
`/dev/*` is ⛔ never ⓐ. Step 19 walks `/world` **itself**, which is already in `ROUTES`.

⛔ **Seal ⓑ is ⛔ not closed by this plan.** The node states come off three endpoints that
answer 503 with no Supabase env, so in the sandbox the ring renders its **empty state** — and
`D-116` hardening 2 says a failure state drawn for want of env is ⛔ not «working». ⓑ needs
Roy's logged-in walk. That is written, stamped, in `plan/03-for-roy.md`.

✅ **Seals ⓐ and ⓒ ⛔ do become loop-verifiable**, and that is the whole point of `D-117`
and `D-119`: after this plan there is ⛔ no server read anywhere on the path
«any screen → tab → ring», and the memory that satisfies ⓒ is per-device and needs ⛔ no
session and ⛔ no migration.
