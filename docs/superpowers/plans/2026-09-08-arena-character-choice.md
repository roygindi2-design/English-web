# Arena character choice — first entry (`37 § 7`) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:executing-plans` (or
> `superpowers:subagent-driven-development`). Every step is a `- [x]` and closes only
> after a fresh run whose output goes into the tick report.

**Written:** C-0501 (DEV, 📝 planning tick) · 2026-09-08T06:38Z (`date -u`)
**Built:** C-0502 (DEV, 🔨 build tick) · 2026-09-08 — 37/37 steps, five commits (one per task) + the close. Three test-shape corrections, each logged in the C-0502 report: the spec-substring test strips markdown `**` before matching (Task 1); the two «every string is Hebrew» regexes matched identifiers (`'use client'`, table names) and were replaced by the `ArenaHome.test.ts` text-node measure (Tasks 2 · 4); `app/arcade/page.test.ts` now asserts the three-state shell.

**Covers:** **T-217** — character choice, first entry. **המשך של: T-181** (the home
screen this plan re-wires: `components/ArenaHome.tsx` · `components/ArenaShell.tsx` ·
`app/api/arcade/home/route.ts`) and of **T-215** (the skeleton `components/ArenaAvatar.tsx`
now draws three silhouettes on). ⚠️ **One row and ⛔ not two-to-four, and the reason is
measured ⛔ and not preferred:** `docs/plan-open.md` counts **three** ⬜ rows in
`ACTIVE_WORKSTREAM: arena` — `T-217` · `T-220` · `T-234`. `T-234`'s own row says «⛔ אינה
משימת בנייה: הכרעה» (PM or Roy on `35`). `T-220` ⓐ/ⓓ carries a status cell that still reads
«חסומות ב-F-164» while `D-143` (PM, C-0348) says it **closes** F-164 — that contradiction is
a register drift, filed this tick as a finding, ⛔ not resolved by DEV picking a side.
⇒ `T-217` is the one row a DEV tick can plan today.

**Goal:** before the **first** battle, the learner sees one full screen — `בחירת דמות` —
with the three characters of `37 § 7` (**קוסם** · **לוחם** · **שריונאי**) each drawn as a
**live idle `ArenaAvatar`** (⛔ no PNG — D-133 § ג׳), one description line, and the
bias lines of the `§ 7` table **verbatim** (⛔ no number tables). The choice is **written**
to `arcade_progress.avatar_parts.character` (jsonb key, closed set — D-152, ⛔ no
migration), the home screen's `עיצוב דמות` stops being disabled and reopens the same
screen, and changing the character **never** touches `arcade_level` · `wins` ·
`unlocked_items` (`§ 7`: «בלי לאבד רמה, גביעים, ציוד או שברים»).

**Architecture:** the three layers the repo already enforces. The **rule** lives in
`lib/core/arenaCharacter.ts` (pure — ⛔ zero React/DOM/network/clock): the closed set,
its Hebrew labels, the bias lines, and the parser that turns an unknown `avatar_parts`
blob into `ArenaCharacter | null` without ever throwing. The **component draws and
⛔ does not compute**. The **route applies a write plan and ⛔ does not decide**: one new
`PATCH` that writes exactly one jsonb key by merging into the existing object. One new
pure module, one new endpoint, one new screen component, one new fixture; the shell
gains a third state and ⛔ zero routes.

**Tech Stack:** Next 16 App Router · React client components · TypeScript (⛔ no `any`) ·
Tailwind · Vitest · Playwright (`npm run check:mobile`).

**Spec:** `plan/37-arena-spec.md` § 7 (the screen) · § 12 (`עיצוב דמות` on the home
screen) · § 13 (invariants) · `plan/38-character-base.md` § 1 · § 3 (anchors) · § 4
(layers) · § 5 (⛔ no sprite copying) · § 6 («שריונאי … נבנית על אותו שלד») ·
`plan/36-video-spec.md` § 14.4 (how the render binds) · **D-133 § ג׳-ד׳** · **D-152**.

🎯 **The render this screen targets: `docs/design/kol-B-01-home.png`**, drawn by
`docs/design/render_video_B.py:107` (`screen_home`) at `LW, LH = 375, 812`. ⚠️ **There is
⛔ no `kol-B-08-character.png`, and that is a decision, ⛔ not a gap** — D-133 § ג׳ refused
the render because `37 § 7` demands «שלוש הדמויות **ב-idle חי**», i.e. a **component**.
⇒ this screen takes its **geometry** (pedestal, idle breathing, card box, primary and
secondary controls) from `screen_home`, grepped ⛔ not eyeballed, and its **strings and
structure** from `37 § 7` word for word. Nothing on it is invented: every box below is a
box `screen_home` already draws.

## Global Constraints

- ⛔ **`36 § 14.4`: הרנדר מחייב — layout **and** finish alike.** «The finish comes from the
  constitution» is ⛔ **not** an answer to a gap. **שכבה A (Layer A) — contrast ≥4.5:1 ·
  44px target · ⛔ no state in colour alone — is the ONLY carve-out**, and a Layer A
  deviation is written into the task row **with the number that was measured**.
- Every learner-facing string is **Hebrew, RTL**. English only inside `<EnWord>`/`<EnText>`.
  The character keys (`wizard` · `warrior` · `armorer`) are **storage values**, ⛔ never text
  on screen.
- `lib/core/` is PURE: ⛔ zero React, `window`, `document`, `localStorage`, `fetch`,
  `process.env`, `Date.now`, `Math.random`.
- A UI component ⛔ never touches the database — everything through `app/api/*` and
  `lib/api/client.ts` (`apiGet` · `apiPatch`).
- `37 § 13.1` — the arena ⛔ never writes `word_progress`. The new `PATCH` touches
  **one table, one column** (`arcade_progress.avatar_parts`).
- `37 § 13.5` — the five arena hexes are **scoped**; ⛔ nothing enters `lib/core/palette.ts`.
  ⚠️ `app/arcade/page.test.ts` scans `arcade-tokens.css` **raw** and counts every hex in it
  as an arena token ⇒ ⛔ **do not add a hex to that file in this plan.** ⛔ Zero hex in any
  component (`ArenaHome.test.ts` pattern); every colour is a `var(--arena-*)` token.
- `min-h-[100dvh]`, ⛔ never `h-screen`. Zero horizontal scroll at **320 · 375 · 414**.
- `docs/api-contract.md` is updated in the **same commit** as the endpoint change.
- `prefers-reduced-motion` is Layer A: the idle breathing uses the **same** class pair
  `ArenaHome.tsx:276` already uses — `animate-[arena-idle-bob_4.19s_ease-in-out_infinite]
  motion-reduce:animate-none` — ⛔ no new keyframe, ⛔ no new `@keyframes` block
  (`T-234` froze the motion baseline; `scripts/motion-baseline.md` ⛔ is not touched).
- ⛔ **Zero invented learning content.** Nothing on this screen is learning content; the
  strings are chrome, quoted from `37 § 7` and `37 § 12`.
- `38 § 5` — ⛔ **never copy `wizard_sprite` · `knight_sprite` · `hero_sprite`** out of
  `render_video_B.py`. The three silhouettes are drawn on `characterBase.ts` anchors.
- **`RULES § 0.22` — decisions this plan takes alone, each logged in the tick report:**
  ⓐ the third shell state is a **module boundary** (⛔ no route — navigation is PM's);
  ⓑ the key names `character` inside `avatar_parts` and the three storage values;
  ⓒ the bias strings are the `§ 7` table cells split at **their own punctuation**, so
  `שריונאי` carries four lines and the other two carry three.

---

## What the spec names that this slice ⛔ does NOT build, and why

| Item | Status | Ground |
|---|---|---|
| A **name** for the character (`§ 4.2י` · F-067 ⓐ · D-152 «מפתח `name`») | ⛔ **out** | `37 § 7` names ⛔ no name list, and ⛔ no register row holds one. A closed list nobody wrote is a list DEV would invent. `avatar_parts.name` stays unwritten; the parser ignores it. ⇒ **finding, PM row**. |
| The biases as **battle numbers** (faster mana · higher spell damage · lower HP · built-in shield · stronger critical · fast cooldowns · ranged shot) | ⛔ **out** | `37 § 7` is **words**; `37 § 4` · `§ 8` and `lib/core/battle.ts` hold ⛔ no per-character constant. A mechanic without a measured number is a **PM row**, ⛔ not a DEV guess (`RULES § 0.16`). ⇒ **finding.** The choice is real — it is **persisted** and it **draws** the hero on home and in battle — and the numeric layer is the follow-up row. |
| Number tables on the screen | ⛔ **out, by spec** | `37 § 7`: «בלי טבלאות מספרים בכניסה ראשונה». |
| A migration `supabase/migrations/00XX_arcade_character.sql` | ⛔ **out, by decision** | **D-152**: `avatar_parts jsonb` exists (`0014_arcade.sql:29`); a key inside it is a **write**, ⛔ not a schema change. ⛔ **STEP C is not entered this tick and not by the build tick either.** |
| A new route (`/arcade/character`) | ⛔ **out** | `RULES § 0.16`: **navigation** is PM's. The screen is the shell's third state, exactly as `'battle'` is (T-181, Task 4). `/dev/arcade/character` is a **layout fixture**, `noindex`, unlinked — the standing exception `/dev/arcade/home` already is. |
| `GET /api/arcade/round` learning about the character | ⛔ **out** | The battle receives `character` as a **prop** from the shell (it already receives `initialRound`). Widening a read endpoint that `ArenaBattle` shares with `/dev/arcade` is a second owner for one value. |

---

## File Structure

**Create**
- `lib/core/arenaCharacter.ts` — the closed set, labels, bias lines, parser (pure).
- `lib/core/arenaCharacter.test.ts`
- `app/api/arcade/character/route.ts` — `PATCH`, one jsonb key.
- `app/api/arcade/character/route.test.ts`
- `components/ArenaCharacterChoice.tsx` — the screen.
- `components/ArenaCharacterChoice.test.ts`
- `app/dev/arcade/character/page.tsx` — fixture, props only, ⛔ no fetch.

**Modify**
- `components/ArenaAvatar.tsx` — optional `character` prop ⇒ one signature layer per
  character on existing anchors; the `aria-label` names the character.
- `components/ArenaAvatar.test.ts`
- `components/ArenaStage.tsx` — passes `character` through to the hero.
- `components/ArenaBattle.tsx` — accepts `character` and hands it to `ArenaStage`.
- `app/api/arcade/home/route.ts` — `HOME_SELECT` gains `avatar_parts`; the body gains
  `character: ArenaCharacter | null`. ⛔ Still read-only.
- `app/api/arcade/home/route.test.ts`
- `components/ArenaHome.tsx` — `עיצוב דמות` enabled (`onDesign`); `DESIGN_SOON_HE`
  deleted; the pedestal avatar draws the chosen character; `ArenaHomeState.character`.
- `components/ArenaHome.test.ts` — the «disabled with a written reason» test **flips**.
- `components/ArenaShell.tsx` — `'home' | 'character' | 'battle'`, first-entry gate.
- `app/dev/arcade/home/page.tsx` — fixture state gains `character`.
- `scripts/verify-mobile.mjs` — `/dev/arcade/character` in the screen list and in
  `ARENA_SCREENS`.
- `docs/api-contract.md` — `GET /api/arcade/home` (new field) + `PATCH /api/arcade/character`.

---

## Interfaces

```ts
// lib/core/arenaCharacter.ts — PURE
export const ARENA_CHARACTERS = Object.freeze(['wizard', 'warrior', 'armorer'] as const);
export type ArenaCharacter = (typeof ARENA_CHARACTERS)[number];

/** `37 § 7`, column «דמות», verbatim. */
export const CHARACTER_LABELS_HE: Readonly<Record<ArenaCharacter, string>>;
//   wizard: 'קוסם' · warrior: 'לוחם' · armorer: 'שריונאי'

/** `37 § 7`, column «הטיה», the cell split at its own punctuation. ⛔ No numbers. */
export const CHARACTER_BIAS_HE: Readonly<Record<ArenaCharacter, readonly string[]>>;
//   wizard:  ['מאנה מהירה יותר', 'נזק לחש גבוה', 'חיים נמוכים']
//   warrior: ['חיים גבוהים', 'מגן מובנה', 'קריטי חזק']
//   armorer: ['חליפת קרב טכנולוגית', 'יכולות מתקררות מהר', 'ירי מטווח', 'מאוזן']

/** `37 § 7`, the second bullet, verbatim — the screen's one description line. */
export const CHARACTER_INTRO_HE =
  'ניתן לשינוי בכל רגע ממסך הבית, בלי לאבד רמה, גביעים, ציוד או שברים';

export function isArenaCharacter(value: unknown): value is ArenaCharacter;

/**
 * `arcade_progress.avatar_parts` is `jsonb default '{}'` — anything may be in it.
 * Returns the character when `parts.character` is one of the three, else `null`.
 * ⛔ Never throws: `null`, a string, an array, a number, `{ character: 'x' }` ⇒ `null`.
 */
export function characterFromParts(parts: unknown): ArenaCharacter | null;

/** The merged object the route writes back — every existing key kept, one key set. */
export function withCharacter(
  parts: unknown,
  character: ArenaCharacter,
): Readonly<Record<string, unknown>>;
```

```ts
// app/api/arcade/character/route.ts
export async function PATCH(request: Request): Promise<NextResponse>;
// body: { character: 'wizard' | 'warrior' | 'armorer' }
// 200: { ok: true, character }
// 422: { ok: false, fieldErrors: { character: 'לא הצלחנו לשמור את הבחירה. נסה שוב.' } }
// 401: { ok: false, code: 'session_expired' } · 503: { ok: false, code: 'unavailable' | 'schema_missing' }
// Write plan: read avatar_parts (maybeSingle) ⇒ withCharacter ⇒
//   .from('arcade_progress').upsert({ user_id, avatar_parts }, { onConflict: 'user_id' })
// ⛔ The upsert carries NO arcade_level / wins / unlocked_items — that is how `§ 7`'s
//   «בלי לאבד רמה, ציוד» holds by construction, and the test asserts it on the source.
```

```ts
// app/api/arcade/home/route.ts — body gains one field, the route stays read-only
interface HomeBody200 {
  ok: true; arcadeLevel: number; wins: number; unlockedItems: readonly string[];
  character: ArenaCharacter | null;   // characterFromParts(data?.avatar_parts)
}
```

```ts
// components/ArenaAvatar.tsx
export interface ArenaAvatarProps {
  readonly items: readonly string[];
  readonly role: 'hero' | 'enemy';
  readonly character?: ArenaCharacter | null;   // NEW · undefined/null ⇒ today's drawing
  readonly className?: string;
}
// With a character: one extra <g data-arena-character={character}> per silhouette,
// placed on LAYER_ORDER layers (`38 § 4`), shapes anchored on `anchorFor(...)`:
//   wizard  — staff on `mainHand` (a vertical from MAIN_HAND.y-78 to +66, a circle r=9 at
//             the top), a robe hem on `legs` (a trapezoid from BODY bottom to BOOT y-6).
//   warrior — a round shield r=26 on `offHand`, a chest plate outline on `chest`
//             (rect BODY_SIZE.width-12 × 40 centred on the body anchor).
//   armorer — a visor bar on `headgear` (rect 44×10 at head centre y-6), a shoulder pad
//             on both `shoulders` (mirror()), and a barrel on `mainHand` (horizontal 48×10).
// aria-label: `${ROLE_LABEL_HE[role]} · ${CHARACTER_LABELS_HE[character]}[, items…]`
```

```ts
// components/ArenaStage.tsx / components/ArenaBattle.tsx — pass-through
export interface ArenaStageProps { /* existing */ readonly character?: ArenaCharacter | null; }
export interface ArenaBattleProps { /* existing */ readonly character?: ArenaCharacter | null; }
```

```ts
// components/ArenaHome.tsx
export interface ArenaHomeState {
  readonly arcadeLevel: number;
  readonly wins: number;
  readonly unlockedItems: readonly string[];
  readonly character: ArenaCharacter | null;   // NEW
}
export interface ArenaHomeProps {
  readonly initialState?: ArenaHomeState;
  readonly onStart: (state: ArenaHomeState) => void;    // CHANGED: carries the state
  readonly onDesign: (state: ArenaHomeState) => void;   // NEW: `עיצוב דמות`
}
```

```ts
// components/ArenaCharacterChoice.tsx
export interface ArenaCharacterChoiceProps {
  /** The stored choice, or null on first entry. Pre-selects the card. */
  readonly initial: ArenaCharacter | null;
  /** Called after PATCH returned 200. The shell decides where to go next. */
  readonly onSaved: (character: ArenaCharacter) => void;
  /** Present only when a character already exists (⛔ no exit on first entry — `§ 7`). */
  readonly onBack?: () => void;
  /** Fixture hook: replaces `apiPatch`. ⛔ Never set by product code. */
  readonly save?: (character: ArenaCharacter) => Promise<void>;
}
// Strings (all Hebrew, all from `37 § 7` / `§ 12` / the repo's existing chrome):
//   TITLE_HE = 'בחירת דמות' · CHARACTER_INTRO_HE (lib) · CONFIRM_HE = 'בחר'
//   BACK_HE = 'חזרה למסך הבית' · SAVING_HE = 'שומר את הבחירה'
//   ERROR_HE = 'לא הצלחנו לשמור את הבחירה. נסה שוב.' · SESSION_HE (same as ArenaHome)
//   SELECTED_HE = 'נבחר' (the state word — ⛔ state never in colour alone)
```

```ts
// components/ArenaShell.tsx
type Screen = 'home' | 'character' | 'battle';
// home.onStart(state)  ⇒ state.character === null ? 'character' (then battle) : 'battle'
// home.onDesign(state) ⇒ 'character' (then home)
// character.onSaved(c) ⇒ the pending destination; `character` kept in shell state and
//                         handed to <ArenaBattle character={…}> / back to home via reload.
```

---

## The render's numbers, grepped (`docs/design/render_video_B.py`, `screen_home`)

| Node | Source line | Value | Used here as |
|---|---|---|---|
| Title | `:113` `c.txt(LW/2, 118, "זירת קרב", 24, "Bold", INK)` | 24px bold, centred, y=118 | `בחירת דמות` — same box |
| Subtitle | `:114` `11.5, "Regular", INK_MUTED+(175,)` | 11.5px ⇒ **12px** (text floor `scripts/check-text-floor.mjs` `FLOOR_PX = 12`, ⛔ not a taste call) | `CHARACTER_INTRO_HE` |
| Pedestal | `:132-134` two ellipses `LW/2±64`, `352-386` / `358-392` | 128×34, offset 6 | under each card's avatar, scaled to the card (`h-10 w-[128px]` svg as `ArenaHome.tsx:280`) |
| Idle | `:128` `bob = sin(t*1.5)*2.2` | ±2.2px · 4.19s | the **existing** `arena-idle-bob` class pair |
| Card | `:136` `rr(24, 404, LW-48, 66, 18, fill=RAISED)` + `BORDER_SUB` 1.1 | x=24 · w=LW-48 · r=18 | `CARD_CLASS` of `ArenaHome.tsx:101` (r ⇒ `rounded-2xl` 16, the scale's nearest — the call T-181 already made and T-228 measured) |
| Card title | `:138` `"רמת זירה 7", 15, "Bold", INK` | 15px bold | the character name |
| Card lines | `:141-142` `10.5, "Regular", INK_MUTED+(150,)` | 10.5 ⇒ **12px** (floor) | the bias lines |
| Primary | `:180-183` `rr(24, 664, LW-48, 58, 18)` · `17, "Black"` | h=58 · r=18 · 17px | `בחר` — `START_CLASS` verbatim |
| Secondary | `:184-191` `bw=(LW-48-10)/2` · h=42 · r=14 · 12.5px | h **44** (Layer A) | `חזרה למסך הבית` — `SECONDARY_CLASS` verbatim |

### Layer A, measured against those numbers

- **Targets:** each character card is one `<button>` of height ≥ **160px** (avatar 160 =
  `h-40`) ⇒ ≥44 by construction. `בחר` = 58. `חזרה` = 44 (`min-h-touch`). ⛔ Nothing under 44.
- **State ⛔ never in colour alone:** the selected card carries `aria-pressed="true"`, the
  word `נבחר` in text, **and** the check glyph (`CheckGlyph` from `ArenaHome.tsx`) —
  three channels; the gold border is the fourth.
- **Contrast:** every text node uses `--arena-ink` / `--arena-ink-dim` on `--arena-card`,
  the pairs `ArenaHome` already measured green under `D-134`'s per-screen gate. The
  build tick re-measures on `/dev/arcade/character` — ⛔ no inheritance of a number.
- **Reduced motion:** the idle class pair carries `motion-reduce:animate-none`.
- **No dead end:** on first entry the screen has one action (`בחר`, enabled once a card is
  selected) — that is `§ 7`'s «מוצג פעם אחת … לפני הקרב הראשון». With a stored character
  it also has `חזרה למסך הבית`. ⛔ A disabled `בחר` before any selection carries a visible
  line `בחר דמות כדי להמשיך` (`aria-describedby`), the `ArenaHome` disabled-with-reason pattern.

---

## Task 1: `lib/core/arenaCharacter.ts` — the rule

**Files:** Create `lib/core/arenaCharacter.ts`, `lib/core/arenaCharacter.test.ts`.

- [x] **Step 1: Write the failing test** — `lib/core/arenaCharacter.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  ARENA_CHARACTERS, CHARACTER_BIAS_HE, CHARACTER_INTRO_HE, CHARACTER_LABELS_HE,
  characterFromParts, isArenaCharacter, withCharacter,
} from './arenaCharacter';

const SPEC = readFileSync(new URL('../../plan/37-arena-spec.md', import.meta.url), 'utf8');

describe('arenaCharacter — `37 § 7`', () => {
  it('three characters, a closed set, in the order of the § 7 table', () => {
    expect([...ARENA_CHARACTERS]).toEqual(['wizard', 'warrior', 'armorer']);
    expect(Object.isFrozen(ARENA_CHARACTERS)).toBe(true);
  });

  it('every label and every bias line is a substring of `37 § 7` — ⛔ nothing invented', () => {
    for (const c of ARENA_CHARACTERS) {
      expect(SPEC).toContain(CHARACTER_LABELS_HE[c]);
      for (const line of CHARACTER_BIAS_HE[c]) expect(SPEC).toContain(line);
    }
    expect(SPEC).toContain(CHARACTER_INTRO_HE);
  });

  it('⛔ no digits in any learner-facing string — «בלי טבלאות מספרים»', () => {
    const all = [CHARACTER_INTRO_HE, ...Object.values(CHARACTER_LABELS_HE), ...Object.values(CHARACTER_BIAS_HE).flat()];
    for (const s of all) expect(s).not.toMatch(/\d/);
  });

  it('isArenaCharacter accepts the three and nothing else', () => {
    expect(isArenaCharacter('wizard')).toBe(true);
    expect(isArenaCharacter('Wizard')).toBe(false);
    expect(isArenaCharacter('')).toBe(false);
    expect(isArenaCharacter(null)).toBe(false);
    expect(isArenaCharacter(['wizard'])).toBe(false);
  });

  it('characterFromParts ⛔ never throws and returns null on anything but a valid key', () => {
    expect(characterFromParts({ character: 'armorer' })).toBe('armorer');
    for (const bad of [null, undefined, 'wizard', 7, [], { character: 'x' }, { name: 'a' }]) {
      expect(characterFromParts(bad)).toBeNull();
    }
  });

  it('withCharacter keeps every existing key and sets exactly one', () => {
    expect(withCharacter({ name: 'kept', character: 'wizard' }, 'warrior'))
      .toEqual({ name: 'kept', character: 'warrior' });
    expect(withCharacter(null, 'wizard')).toEqual({ character: 'wizard' });
    expect(withCharacter('garbage', 'wizard')).toEqual({ character: 'wizard' });
  });
});
```

- [x] **Step 2: Run it and watch it fail** — `npx vitest run lib/core/arenaCharacter.test.ts`
  ⇒ **FAIL** (`Cannot find module './arenaCharacter'`).

- [x] **Step 3: Write `lib/core/arenaCharacter.ts`** — the four exports above plus the two
  functions. `characterFromParts`: `typeof parts === 'object' && parts !== null &&
  !Array.isArray(parts) && isArenaCharacter((parts as Record<string, unknown>).character)`.
  `withCharacter`: spread the object form (or `{}`) and set `character`. ⛔ No import
  beyond the file itself.

- [x] **Step 4: Run it green** — `npx vitest run lib/core/arenaCharacter.test.ts` and
  `npm run check:core` (purity gate on `lib/core/`).

- [x] **Step 5: Commit** — `git commit` through the wrapper: `./scripts/g commit -m "loop(DEV): C-XXXX T-217 lib/core/arenaCharacter - closed set, labels, parser"`
  ⚠️ **One commit per task, ⛔ not per tick** (DEV.md STEP 4.5).

---

## Task 2: `PATCH /api/arcade/character` — the write plan

**Files:** Create `app/api/arcade/character/route.ts`, `app/api/arcade/character/route.test.ts`.
Modify `docs/api-contract.md` (same commit).

- [x] **Step 1: Write the failing test** — `app/api/arcade/character/route.test.ts`, the
  repo's source-scan pattern (`app/api/arcade/collected/route.test.ts`):

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('PATCH /api/arcade/character — T-217 · D-152', () => {
  it('exports PATCH and nothing else — ⛔ no GET, no DELETE', () => {
    expect(CODE).toMatch(/export async function PATCH\(/);
    expect(CODE).not.toMatch(/export async function (GET|POST|DELETE)\(/);
  });

  it('guard order of C-0032: ENV ⇒ session ⇒ query', () => {
    const env = CODE.indexOf('readSupabaseEnv()');
    const user = CODE.indexOf('auth.getUser()');
    const write = CODE.indexOf(".from('arcade_progress')");
    expect(env).toBeGreaterThan(-1);
    expect(user).toBeGreaterThan(env);
    expect(write).toBeGreaterThan(user);
  });

  it('one table, one column: the upsert carries avatar_parts and user_id only', () => {
    expect(CODE).toMatch(/upsert\(\s*\{\s*user_id:[^}]*avatar_parts:[^}]*\}\s*,\s*\{\s*onConflict:\s*'user_id'\s*\}\s*\)/);
    expect(CODE).not.toMatch(/arcade_level\s*:/);
    expect(CODE).not.toMatch(/wins\s*:/);
    expect(CODE).not.toMatch(/unlocked_items\s*:/);
  });

  it('the rule decides validity — ⛔ no inline list of the three keys', () => {
    expect(CODE).toContain('isArenaCharacter(');
    expect(CODE).toContain('withCharacter(');
    expect(CODE).not.toMatch(/\[\s*'wizard'/);
  });

  it('⛔ the arena never writes word_progress (37 § 13.1)', () => {
    expect(CODE).not.toContain('word_progress');
  });

  it('every learner-facing failure string is Hebrew', () => {
    const strings = [...CODE.matchAll(/'([^']{4,})'/g)].map((m) => m[1]);
    const text = strings.filter((s) => /[a-z_]+:|\/|\(|=/.test(s) === false);
    expect(text.filter((s) => /[א-ת]/.test(s) === false && s.trim().length > 3)).toEqual([]);
  });
});
```

- [x] **Step 2: Run it and watch it fail** — `npx vitest run app/api/arcade/character/route.test.ts`.

- [x] **Step 3: Write `app/api/arcade/character/route.ts`** — copy the guard block of
  `app/api/arcade/collected/route.ts:124-136` (env · session · `request.json()` try/catch
  ⇒ 400), then: `parse` ⇒ `isArenaCharacter(payload.character)` else **422**
  `{ ok:false, fieldErrors:{ character:'לא הצלחנו לשמור את הבחירה. נסה שוב.' } }`; read
  `avatar_parts` with `.select('avatar_parts').eq('user_id', user.id).maybeSingle()`;
  `upsert({ user_id: user.id, avatar_parts: withCharacter(data?.avatar_parts, character) },
  { onConflict: 'user_id' })`; errors ⇒ `isSchemaMissing` ⇒ 503 bodies of the sibling
  routes; **200** `{ ok: true, character }`.

- [x] **Step 4: Contract** — `docs/api-contract.md`: add `## PATCH /api/arcade/character`
  after `## PATCH /api/arcade/collected` (request · 200 · 422 · 401/503 · «⛔ אינו נוגע
  ב-`arcade_level`/`wins`/`unlocked_items` — `37 § 7`»), and add the `character` row to
  the `GET /api/arcade/home` field table (Task 3 fills the route; the contract line lands
  here so the two commits each leave the contract true for their own code).

- [x] **Step 5: Run green** — `npx vitest run app/api/arcade/character` · `npm run typecheck`.

- [x] **Step 6: Commit** — `git commit` through the wrapper: `./scripts/g commit -m "loop(DEV): C-XXXX T-217 PATCH /api/arcade/character - one jsonb key, contract"`.

---

## Task 3: `GET /api/arcade/home` learns the character; the avatar draws it

**Files:** Modify `app/api/arcade/home/route.ts`, `app/api/arcade/home/route.test.ts`,
`components/ArenaAvatar.tsx`, `components/ArenaAvatar.test.ts`, `components/ArenaStage.tsx`,
`components/ArenaBattle.tsx`.

- [x] **Step 1: Failing tests** — add to `app/api/arcade/home/route.test.ts`:

```ts
it('T-217 — the read plan selects avatar_parts and the body carries `character` (D-152)', () => {
  expect(SRC).toMatch(/HOME_SELECT = 'arcade_level, wins, unlocked_items, avatar_parts'/);
  expect(SRC).toContain('character: characterFromParts(');
});

it('⛔ still read-only — no insert/update/upsert/delete', () => {
  expect(CODE).not.toMatch(/\.(insert|update|upsert|delete)\(/);
});
```

and to `components/ArenaAvatar.test.ts`:

```ts
it('T-217 — three silhouettes on one skeleton: one signature layer per character, ⛔ no sprite copy', () => {
  expect(SRC).toContain('data-arena-character');
  for (const c of ['wizard', 'warrior', 'armorer']) expect(SRC).toContain(`${c}:`);
  expect(CODE).not.toMatch(/wizard_sprite|knight_sprite|hero_sprite/);
});

it('the signature shapes are anchored — every coordinate comes from characterBase', () => {
  const block = SRC.slice(SRC.indexOf('CHARACTER_LAYERS'), SRC.indexOf('export default function'));
  expect(block).toMatch(/anchorFor\('mainHand'\)|MAIN_HAND/);
  expect(block).toMatch(/anchorFor\('offHand'\)|OFF_HAND/);
  expect(block).not.toMatch(/\bd="M-?\d{2,}/);   // ⛔ no hard-coded absolute path start
});

it('the accessible name says which character it is (⛔ not shape alone)', () => {
  expect(SRC).toContain('CHARACTER_LABELS_HE[character]');
});
```

- [x] **Step 2: Run them red** — `npx vitest run app/api/arcade/home components/ArenaAvatar.test.ts`.

- [x] **Step 3: Route** — `app/api/arcade/home/route.ts`: extend `HOME_SELECT`, import
  `characterFromParts`, add `character: characterFromParts(data?.avatar_parts)` to the
  200 body. `NEW_LEARNER.character = null`.

- [x] **Step 4: Avatar** — `components/ArenaAvatar.tsx`: add `character?: ArenaCharacter | null`;
  a `CHARACTER_LAYERS: Record<ArenaCharacter, readonly { layer: Layer; shape: JSX }[]>` map
  using the anchor constants already in the file (`MAIN_HAND` · `BOOT_L/R` · `BODY_SIZE` ·
  `HEAD_RADIUS`, and `anchorFor('offHand')` / `mirror(anchorFor('shoulders'))`), rendered
  inside the existing `LAYER_ORDER.map` as `<g data-arena-character={character}>` after
  `base` and before `equipped` (`38 § 4`: base under equipment). Extend `label`.

- [x] **Step 5: Stage + battle pass-through** — `components/ArenaStage.tsx` gains
  `character` and forwards it to the hero `<ArenaAvatar>` (`ArenaStage.tsx:46`);
  `components/ArenaBattle.tsx` gains `character` in `ArenaBattleProps` and passes it at
  `ArenaBattle.tsx:833`. ⛔ Nothing else in the battle changes.

- [x] **Step 6: Green** — `npx vitest run app/api/arcade/home components/ArenaAvatar.test.ts components/ArenaStage components/ArenaBattle` · `npm run typecheck`.

- [x] **Step 7: Commit** — `git commit` through the wrapper: `./scripts/g commit -m "loop(DEV): C-XXXX T-217 home body carries character; ArenaAvatar draws three silhouettes"`.

---

## Task 4: `components/ArenaCharacterChoice.tsx` — the screen

**Files:** Create `components/ArenaCharacterChoice.tsx`, `components/ArenaCharacterChoice.test.ts`,
`app/dev/arcade/character/page.tsx`. Modify `scripts/verify-mobile.mjs`.

- [x] **Step 1: Failing test** — `components/ArenaCharacterChoice.test.ts` (the
  `ArenaHome.test.ts` pattern — `SRC` raw for strings, `CODE` stripped for bans):

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./ArenaCharacterChoice.tsx', import.meta.url), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('ArenaCharacterChoice — `37 § 7` on the geometry of `docs/design/kol-B-01-home.png`', () => {
  it('title, the one description line, and the confirm — Hebrew, from the spec', () => {
    expect(SRC).toContain('בחירת דמות');
    expect(SRC).toContain('CHARACTER_INTRO_HE');
    expect(SRC).toContain("'בחר'");
  });

  it('the three cards come from the rule, ⛔ not from a list in the component', () => {
    expect(SRC).toContain('ARENA_CHARACTERS.map(');
    expect(SRC).toContain('CHARACTER_BIAS_HE[');
    expect(CODE).not.toContain("'קוסם'");
  });

  it('three live idles — the existing keyframe, and `motion-reduce:animate-none` (Layer A)', () => {
    expect((SRC.match(/arena-idle-bob_4\.19s/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(SRC).toContain('motion-reduce:animate-none');
    expect(CODE).not.toMatch(/@keyframes/);
  });

  it('selection is ⛔ never colour alone: aria-pressed + the word + the glyph', () => {
    expect(SRC).toContain('aria-pressed');
    expect(SRC).toContain("'נבחר'");
    expect(SRC).toContain('CheckGlyph');
  });

  it('⛔ no exit on first entry, `חזרה למסך הבית` only with a stored character', () => {
    expect(SRC).toContain('onBack !== undefined &&');
    expect(SRC).toContain('חזרה למסך הבית');
  });

  it('a disabled confirm carries a visible written reason (the ArenaHome pattern)', () => {
    expect(SRC).toContain('aria-describedby');
    expect(SRC).toContain('בחר דמות כדי להמשיך');
  });

  it('one endpoint, and it is the PATCH of T-217', () => {
    const paths = [...CODE.matchAll(/'(\/api\/[^']+)'/g)].map((m) => m[1]);
    expect(new Set(paths)).toEqual(new Set(['/api/arcade/character']));
    expect(CODE).toContain('apiPatch');
    expect(CODE).not.toContain('fetch(');
  });

  it('⛔ zero hex · ⛔ zero emoji · ⛔ no h-screen', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(CODE).not.toContain('h-screen');
    expect(SRC).toContain('min-h-[100dvh]');
  });

  it('every learner-facing string is Hebrew', () => {
    const strings = [...CODE.matchAll(/'([^']{4,})'/g)].map((m) => m[1]);
    const text = strings.filter((s) => /[=;()?/\-\[\]:]/.test(s) === false);
    expect(text.filter((s) => /[א-ת]/.test(s) === false && s.trim().length > 3)).toEqual([]);
  });
});
```

- [x] **Step 2: Run it red** — `npx vitest run components/ArenaCharacterChoice.test.ts`.

- [x] **Step 3: Write `components/ArenaCharacterChoice.tsx`** — `'use client'`; imports
  from `@/lib/core/arenaCharacter`, `apiPatch` from `@/lib/api/client`, `ArenaAvatar`;
  `CARD_CLASS` · `START_CLASS` · `SECONDARY_CLASS` **copied verbatim** from
  `ArenaHome.tsx:101-116` (⚠️ ⛔ do not export them from `ArenaHome` — a screen importing
  another screen's class strings couples two screens; the render's numbers are the shared
  source, and the comment says so). Layout, top to bottom, `min-h-[100dvh]` · `px-6`:
  header (`h1` 24px bold `בחירת דמות` · `p` 12px `CHARACTER_INTRO_HE`) · `<ul>` of three
  `<li><button type="button" aria-pressed …>` cards, each a `flex-row-reverse` of
  `[avatar + pedestal]` and `[name 15px bold · bias lines 12px]`, the selected one
  `border-2 border-[color:var(--arena-gold)]` + `CheckGlyph` + `נבחר` · `mt-auto` block:
  `בחר` (`START_CLASS`, `disabled` until a card is selected, `aria-describedby`) · the
  reason line · `חזרה למסך הבית` when `onBack !== undefined`. State machine: `idle` ·
  `saving` · `error` · `session_expired` (the `ArenaHome` set) — `save ?? apiPatch`.

- [x] **Step 4: Fixture** — `app/dev/arcade/character/page.tsx`, the
  `app/dev/arcade/home/page.tsx` shape: `initial={null}` · `onSaved={() => {}}` ·
  `save={async () => {}}` (⛔ no network from a fixture). A second fixture state is ⛔ not
  needed: the walk measures first entry, the harder case (no exit).

- [x] **Step 5: Per-screen gate** — `scripts/verify-mobile.mjs`: add `'/dev/arcade/character'`
  after `'/dev/arcade/home'` (`:182`) with the same two-line reason, and to `ARENA_SCREENS`
  (`:252`) so the arena contrast pairs are measured on it.

- [x] **Step 6: Green + look at it (D-103)** — `npx vitest run components/ArenaCharacterChoice.test.ts`,
  then `(npx next dev -p 3000 &) && sleep 25` and walk `http://127.0.0.1:3000/dev/arcade/character`
  at **375×780** and at 320 / 414: record heading · text length · tappable count ·
  under-44px (must be 0) · horizontal scroll (must be 0) · console errors. Then
  `npm run check:mobile`.

- [x] **Step 7: Commit** — `git commit` through the wrapper: `./scripts/g commit -m "loop(DEV): C-XXXX T-217 ArenaCharacterChoice screen + fixture + mobile gate"`.

---

## Task 5: the home screen opens it, the shell gates the first battle

**Files:** Modify `components/ArenaHome.tsx`, `components/ArenaHome.test.ts`,
`components/ArenaShell.tsx`, `app/dev/arcade/home/page.tsx`. Create `components/ArenaShell.test.ts`.

- [x] **Step 1: Flip the failing test** — in `components/ArenaHome.test.ts` replace the
  «`עיצוב דמות` נושאת סיבה» test with:

```ts
it('T-217 — `עיצוב דמות` is live: ⛔ no `disabled`, ⛔ no «תיפתח בקרוב», and it calls onDesign', () => {
  expect(SRC).not.toContain('בחירת דמות תיפתח בקרוב');
  expect(SRC).not.toContain('arena-design-soon');
  expect(SRC).toContain('onDesign(');
});

it('the pedestal avatar draws the stored character', () => {
  expect(SRC).toMatch(/<ArenaAvatar role="hero" items=\{state\.unlockedItems\} character=\{state\.character\}/);
});
```

and create `components/ArenaShell.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./ArenaShell.tsx', import.meta.url), 'utf8');

describe('ArenaShell — `37 § 7`: once, full screen, before the first battle', () => {
  it('three states and ⛔ no route', () => {
    expect(SRC).toContain("'home' | 'character' | 'battle'");
    expect(SRC).not.toContain('useRouter');
    expect(SRC).not.toContain('next/link');
  });

  it('a learner with no character is sent to the choice before the battle, ⛔ not into it', () => {
    expect(SRC).toMatch(/character === null \? 'character' : 'battle'/);
  });

  it('the battle receives the character as a prop', () => {
    expect(SRC).toMatch(/<ArenaBattle character=\{/);
  });
});
```

- [x] **Step 2: Run them red** — `npx vitest run components/ArenaHome.test.ts components/ArenaShell.test.ts`.

- [x] **Step 3: Home** — `components/ArenaHome.tsx`: `ArenaHomeState.character`; `HomeBody`
  gains `character: ArenaCharacter | null`; `load()` copies it; `onStart(state)` and the new
  `onDesign(state)`; delete `DESIGN_SOON_HE`, the `disabled`, `aria-describedby` and the
  `<p id="arena-design-soon">`; pass `character={state.character}` to the pedestal avatar.
  ⚠️ **`SECONDARY_CLASS` keeps `disabled:opacity-100`** — harmless, and removing a token
  is a second diff for no reason.

- [x] **Step 4: Shell** — `components/ArenaShell.tsx`: `screen` · `character` · `next`
  state; `onStart={(s) => { setCharacter(s.character); setNext('battle'); setScreen(s.character === null ? 'character' : 'battle'); }}`;
  `onDesign={(s) => { setCharacter(s.character); setNext('home'); setScreen('character'); }}`;
  `<ArenaCharacterChoice initial={character} onSaved={(c) => { setCharacter(c); setScreen(next); }} onBack={character === null ? undefined : () => setScreen('home')} />`;
  `<ArenaBattle character={character} />`. ⚠️ Returning to `'home'` remounts `ArenaHome`
  ⇒ it re-fetches `/api/arcade/home` ⇒ the pedestal shows the new character from the
  **server**, ⛔ not from a client copy — one source of truth.

- [x] **Step 5: Fixture** — `app/dev/arcade/home/page.tsx`: `character: 'warrior'` in
  `initialState`, `onDesign={() => {}}`.

- [x] **Step 6: Green** — `npx vitest run components/ArenaHome.test.ts components/ArenaShell.test.ts app/arcade` ·
  `npm run typecheck` · the D-103 walk on `/dev/arcade/home` (the `עיצוב דמות` tap now
  counts as live: tappable count **+1** against C-0499's baseline).

- [x] **Step 7: Commit** — `git commit` through the wrapper: `./scripts/g commit -m "loop(DEV): C-XXXX T-217 home opens the choice; shell gates the first battle"`.

---

## Task 6: close — registers, map, the full gate

- [x] **Step 1:** `grep -q '"generate-map"' package.json && npm run generate-map` — the
  tree under `app/` · `components/` · `lib/` changed ⇒ `docs/architecture-map.json` in the
  **same** commit as the last code commit (DEV.md STEP 7). ⛔ Never hand-edit it.
- [x] **Step 2:** `plan/50-tasks.md` — `T-217` ⇒ **🟣 C-XXXX** (⛔ not ✅ — F-126) with the
  two measured gaps named (name list · bias numbers ⇒ the two findings of C-0501); tick the
  boxes of this file; `plan/30-architecture.md` one section; `plan/00-control.md`
  (`CYCLE_ID` · `NEXT_AGENT=CRITIC` · release the lock) + one journal line.
- [x] **Step 3:** `npm run measure:plan` — `docs/plan-open.md` + `docs/plan-tables.md` in the
  **same** commit (`RULES § 0.1 ח׳`).
- [x] **Step 4:** `npm run verify` — **five** commands including `check:mobile`. Paste the
  exact tail into the tick report. Red ⇒ fix in the tick; still red ⇒ `./scripts/g revert`
  + a debt line in `plan/30-architecture.md`. ⛔ Never push red.
- [x] **Step 5:** `git push` through the wrapper — `./scripts/g push origin work/current` — the pre-push hook (`scripts/hooks/pre-push`) re-runs `verify`
  and writes the attestation note. ⛔ No `SKIP_VERIFY`.

---

## Self-check

- ✔ Every string a learner sees is Hebrew and is a substring of `37 § 7` / `§ 12` or of
  chrome the repo already ships (`נבחר` · `חזרה למסך הבית` · the failure sentences).
- ✔ ⛔ No number table, ⛔ no digit in any bias line (Task 1 test).
- ✔ The write touches `avatar_parts` alone; `arcade_level` · `wins` · `unlocked_items`
  are ⛔ absent from the upsert (Task 2 test).
- ✔ Three **live** idles, the existing keyframe, `motion-reduce:animate-none`.
- ✔ Selected state in four channels; ⛔ nothing under 44px; ⛔ no horizontal scroll at
  320 / 375 / 414 — **measured** on `/dev/arcade/character`, numbers in the report.
- ✔ First entry has no exit; a stored character adds `חזרה למסך הבית`.
- ✔ ⛔ No route added · ⛔ no migration · ⛔ no hex · ⛔ no sprite copied from
  `render_video_B.py` · ⛔ `word_progress` untouched.
- ✔ `docs/api-contract.md` changed in the same commits as the two routes.
- ✔ `docs/architecture-map.json` regenerated in the last code commit.
- ✔ `npm run check:plan docs/superpowers/plans/2026-09-08-arena-character-choice.md` was
  run at planning time and its output pasted into `plan/26-plan-feedback.md` if any element
  was missing.
