# Arrival, radii and the focus ring · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. One task per Dev tick.

**Goal:** Close the three remaining ⬜ M1 tasks that need no PM decision and no content: the harness stops at the tap and never asks where the tap *led* (T-067); the product's most common radius is a value the frozen constitution does not allow (T-068); and a keyboard learner has no focus ring at all (T-069).

**Architecture:** Three independent changes with one shared property — each one replaces an *argued* claim with a *measured* one. Task 1 adds a global `:focus-visible` declaration and a test that fails if it is removed or written in raw hex. Task 2 derives every radius in the product from the signed mapping D-036 and then installs the guard that makes a fourth value impossible. Task 3 gives the mobile harness a per-route arrival table: for each flow screen, one declared destination — a URL, an exact Hebrew sentence, or a named request — asserted after `click()`.

**Tech Stack:** Next.js App Router · TypeScript strict, no `any` · Tailwind with the frozen constitution tokens · vitest (`environment: 'node'`, no jsdom) · Playwright through `npm run check:mobile`.

**Spec:** `plan/35-design-constitution.md` §§ 1 · 3 · 4 · 6 (signed 12/08, **frozen**) · `plan/40-decisions.md` **D-036** (the radius mapping) · `plan/50-tasks.md` T-067 · T-068 · T-069 · `plan/RULES.md` § 0.1.1 ז׳ (the Critic's four binary checks) · F-027 (the dead end T-067 exists for). **Executors read the spec and this plan together.**

**Tasks covered:** `T-069` (task 1) · `T-068` (task 2) · `T-067` (task 3).

---

## Global Constraints

Copied verbatim from the governing documents. Every task's requirements implicitly include this section.

- **Constitution § 3 is frozen and allows exactly three radii:** `rounded-md` (6px) שדות ותגיות · `rounded-lg` (8px) כפתורים · `rounded-2xl` (16px) כרטיסיות ומודאלים. ⛔ A fourth value is never introduced, not even one that looks better. An element that fits no group ⇒ a line in `plan/03-for-roy.md`, ⛔ not a new radius.
- ⛔ **The constitution file is never edited by the Dev agent.** If this plan and `plan/35-design-constitution.md` disagree, the constitution wins and the contradiction is recorded as a finding.
- ⛔ **No raw hex inside `components/` or `app/**/*.tsx`** (constitution § 6). Colour arrives as a token — `var(--brand)` in CSS, a Tailwind token class in markup.
- ⛔ **No layout change, no colour change, no typography change, no copy change** in tasks 1–2. Task 2 rewrites radius utilities and nothing else; task 1 adds one CSS block and nothing else.
- ⛔ **`/lib/core` stays pure**: no React, no `window`, no `document`, no `localStorage`, no `fetch`, no `process.env`. `npm run check:core` enforces it.
- ⛔ **Task 3 touches no component and no screen.** T-067: «אינה נוגעת בשום רכיב — הארנס בלבד». If an assertion cannot be written without a new `data-` attribute, the assertion is rewritten against what the screen already exposes (a role, an `aria-*`, or the Hebrew sentence a learner reads).
- **Mobile-first.** 375px is the design width; 320 / 375 / 414 are the measured widths. Tap targets ≥44×44px, ≥8px apart. Zero horizontal scroll.
- **A test that cannot fail is not a test (F-039 · F-043).** Every guard added here is proved by a mutation: break the thing on purpose, watch the named failure, restore, re-run. The mutation and its exact failure line are written into the tick report.
- **Commits:** `loop(DEV): C-XXXX <summary>`, pushed to `dev`. ⛔ Never `main`. ⛔ Never `[skip ci]`.
- **The verification command, run fresh, in the same message as any success claim:**
  `npm run typecheck && npm run check:core && npm test && npm run build`
  plus `npm run check:mobile` for tasks 2 and 3.

---

## File Structure

| File | Task | Responsibility |
|---|---|---|
| `app/globals.css` | 1 | One `:focus-visible` declaration, built from an existing palette token. |
| `app/globals.test.ts` | 1 | Guards that declaration: token not hex, an offset exists, ⛔ no `outline: none`, ⛔ no bare `:focus`. |
| `scripts/radius-hygiene.test.ts` | 2 | The guard. Walks `components/` + `app/`, strips comments, fails on any radius outside § 3 and names file:token. |
| `components/*.tsx` · `app/**/*.tsx` | 2 | 38 radius utilities rewritten per D-036. ⛔ Nothing else in the diff. |
| `scripts/verify-mobile.mjs` | 3 | `FLOW_ARRIVAL` table + the post-click assertion block + two console allowances. |
| `scripts/verify-mobile.test.ts` | 3 | Parses `FLOW_ARRIVAL` out of the harness source and asserts total coverage of `FLOW_ROUTES`. |

---

## Measurements this plan rests on

Taken with `date -u` = **2026-08-14T23:3xZ**, on `dev` at `9bb4bd3`. ⛔ Not estimated.

```
grep -rn --include=*.tsx --include=*.css -o 'rounded-[a-z0-9-]*' components app | grep -v '\.test\.'
  37 × rounded-xl      ⛔ not one of the three
   1 × rounded-full    ⛔ not one of the three  (app/page.tsx:42)
  15 × rounded-lg      ✅
   3 × rounded-md      ✅
   3 × rounded-2xl     ✅
   1 × rounded-t-2xl   ✅ (D-036 ⓔ — a side-clip is not a fourth value)
⇒ 38 occurrences to rewrite, 22 files.

grep -rn 'focus-visible' components app            ⇒ 0
grep -n  'focus\|outline'  app/globals.css         ⇒ 0
```

⚠️ The counts in the T-068 row of `plan/50-tasks.md` (42 / 46) and in D-036 (39 of 46) were measured at C-0105 and are **stale** — `rounded-lg` has since grown from 4 to 15. The mapping in D-036 is unchanged and still governs; only the arithmetic moved. Update the T-068 row's number in the same commit as task 2.

---

### Task 1: The global focus ring (T-069)

**Files:**
- Modify: `app/globals.css` (append after the `.ltr-inline` rule, before the action-bar padding block)
- Create: `app/globals.test.ts`

**Interfaces:**
- Consumes: `--brand` from the `tokens:light` / `tokens:dark` blocks already in `app/globals.css`, whose source of truth is `COLOR_TOKENS` in `lib/core/palette.ts`. `--brand` is the token whose declared role is *accent mark and link* and whose contrast floor against both surfaces is 3:1 (`CONTRAST_FLOORS`) — the WCAG floor for a non-text UI boundary, which is exactly what a focus ring is.
- Produces: nothing importable. Later tasks rely only on the file still parsing.

- [ ] **Step 1: Write the failing test**

Create `app/globals.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * T-069 · constitution § 1 · § 6 · RULES § 0.1.1 ז׳.
 *
 * `focus-visible` is one of the four binary checks the Critic is allowed to run, and
 * before this rule existed the only thing a keyboard learner had was whatever Chromium
 * draws by default — which disappears the moment any component sets its own outline.
 * The ring is global on purpose: a per-component ring is a ring that is missing on the
 * component nobody remembered.
 */
const CSS = readFileSync('app/globals.css', 'utf8');

/** The declaration block of a selector, comments stripped. */
function ruleFor(selector: string): string {
  const withoutComments = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  const at = withoutComments.indexOf(selector);
  if (at === -1) return '';
  const open = withoutComments.indexOf('{', at);
  const close = withoutComments.indexOf('}', open);
  return open === -1 || close === -1 ? '' : withoutComments.slice(open + 1, close);
}

describe('the global focus ring (T-069)', () => {
  it('declares :focus-visible at all', () => {
    expect(ruleFor(':focus-visible').trim()).not.toBe('');
  });

  it('draws the ring from a palette token, never a raw hex (constitution § 6)', () => {
    const rule = ruleFor(':focus-visible');
    expect(rule).toMatch(/var\(--[a-z-]+\)/);
    expect(rule).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('separates the ring from the control it rings', () => {
    expect(ruleFor(':focus-visible')).toContain('outline-offset');
  });

  it('never removes an outline anywhere in the sheet', () => {
    // `outline: none` is how a focus ring dies quietly: the rule above still exists and
    // still passes every test that only looks for it.
    expect(CSS.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/outline:\s*(none|0)\b/);
  });

  it('rings only keyboard focus — a bare :focus would ring a mouse tap too', () => {
    const withoutComments = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    // `:focus-visible` contains the substring `:focus`, so the bare selector has to be
    // matched as a whole token: `:focus` followed by anything that is not `-`.
    expect(withoutComments).not.toMatch(/:focus(?![-\w])/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run app/globals.test.ts`
Expected: FAIL — the first four tests fail (`:focus-visible` is absent, so `ruleFor` returns `''`); the fifth passes vacuously.

- [ ] **Step 3: Add the declaration**

In `app/globals.css`, immediately after the `.ltr-inline` rule:

```css
/* T-069 · constitution § 1 · § 6 · RULES § 0.1.1 ז׳ — the keyboard learner's only
   position indicator. `--brand` and not `--brand-surface`: CONTRAST_FLOORS holds
   --brand at 3:1 against BOTH surfaces (light and dark), which is the WCAG floor for
   a non-text UI boundary, and a focus ring is a boundary and not text.

   `:focus-visible` and ⛔ never `:focus` — the bare pseudo-class rings a mouse tap as
   well, which is the reason the browsers introduced the -visible variant at all.
   The offset is what keeps the ring off the control's own border: without it the ring
   and a `border-border-strong` edge sit on the same pixels and neither reads. */
:focus-visible {
  outline: 3px solid var(--brand);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Run the test and watch it pass**

Run: `npx vitest run app/globals.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Prove the guard can fail (mutation)**

1. Change `var(--brand)` to `#2a78d6` ⇒ re-run ⇒ expect FAIL on *draws the ring from a palette token*.
2. Restore it. Change `:focus-visible` to `:focus` ⇒ re-run ⇒ expect FAIL on *rings only keyboard focus*.
3. Restore it. Append `button { outline: none; }` ⇒ re-run ⇒ expect FAIL on *never removes an outline*.
4. Restore. Re-run ⇒ 5 pass. Record all three failure lines in the tick report.

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
git add app/globals.css app/globals.test.ts plan/
git commit -m "loop(DEV): C-XXXX T-069 global :focus-visible ring from a token"
```

Expected: all five green. `check:mobile` is included because a 3px outline with a 2px offset grows a control's *painted* box — the 44px tap floor is measured from `getBoundingClientRect()`, which an outline does not change, so the expected result is **no movement in the count**. If the count moves, that is the finding.

---

### Task 2: Every radius derived from D-036, plus the guard (T-068)

**Files:**
- Create: `scripts/radius-hygiene.test.ts`
- Modify (38 occurrences, 22 files — the full list is the table below)

**Interfaces:**
- Consumes: `plan/40-decisions.md` D-036, the signed mapping. ⛔ This task decides nothing; it applies.
- Produces: nothing importable. The guard is a vitest file picked up by `npm test` through the existing `include` glob.

**The mapping, resolved per occurrence.** D-036's rule for doubt is *the element's role, ⛔ not how it looks today*.

| File:line | Element | Group | ⇒ |
|---|---|---|---|
| `components/Flashcard.tsx:127,131,143,173,186,194` | buttons (reveal · grade ×2 · continue) | ⓐ | `rounded-lg` |
| `components/InstallPrompt.tsx:125,134` | install button · dismiss button | ⓐ | `rounded-lg` |
| `components/OnboardingForm.tsx:103` | the radio's clickable label row | ⓑ | `rounded-md` |
| `components/OnboardingForm.tsx:131,157` | `<input>` date · `<input>` score | ⓑ | `rounded-md` |
| `components/OnboardingForm.tsx:197` | submit button | ⓐ | `rounded-lg` |
| `components/AuthForm.tsx:155,160` | `<p role="status">` message bubbles | ⓑ | `rounded-md` |
| `components/AuthForm.tsx:204` | password-toggle button | ⓐ | `rounded-lg` |
| `components/AuthForm.tsx:221` | `<p role="alert">` | ⓑ | `rounded-md` |
| `components/AuthForm.tsx:247` | submit button | ⓐ | `rounded-lg` |
| `components/CardDeck.tsx:107` | link that looks like a button | ⓐ | `rounded-lg` |
| `components/StudiesScreen.tsx:28` | link that looks like a button | ⓐ | `rounded-lg` |
| `components/RegisteredAddress.tsx:26` | block container | ⓒ | `rounded-2xl` |
| `components/LatinField.tsx:33` | the input class constant | ⓑ | `rounded-md` |
| `components/StudyDeckScreen.tsx:212,214` | loading skeleton | ⓒ | `rounded-2xl` |
| `components/StudyDeckScreen.tsx:238,251,260` | link · link · retry button | ⓐ | `rounded-lg` |
| `components/CardsScreen.tsx:170,184` | deck rows — interactive `<a>` / `<button>` | ⓐ | `rounded-lg` |
| `app/loading.tsx:18` | loading skeleton | ⓒ | `rounded-2xl` |
| `app/error.tsx:23` | button | ⓐ | `rounded-lg` |
| `app/global-error.tsx:26` | button | ⓐ | `rounded-lg` |
| `app/not-found.tsx:16` | button | ⓐ | `rounded-lg` |
| `app/page.tsx:42` | `rounded-full` icon badge | ⓓ | `rounded-md` |
| `app/page.tsx:75` | non-interactive `<span>` chip | ⓑ | `rounded-md` |
| `app/page.tsx:90` | primary link button | ⓐ | `rounded-lg` |
| `app/sources/page.tsx:33` | source card | ⓒ | `rounded-2xl` |
| `app/onboarding/page.tsx:54` | sign-out submit button | ⓐ | `rounded-lg` |
| `app/dev/onboarding/page.tsx:40` | sign-out submit button (fixture) | ⓐ | `rounded-lg` |
| `components/TabBar.tsx:212` | sheet, `rounded-t-2xl` | ⓔ | **unchanged** |

- [x] **Step 1: Write the failing guard**

Create `scripts/radius-hygiene.test.ts`:

```ts
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * T-068 · constitution § 3 (signed 12/08, frozen) · D-036 (the mapping).
 *
 * The constitution allows three radii. Before this guard existed the product's most
 * common value was a fourth one — 37 × `rounded-xl` — and nothing anywhere would ever
 * have said so. The value of this task is the guard and not the rewrite: without a test
 * that fails, the fourth value returns in the first commit nobody reads.
 */
const ALLOWED = new Set(['md', 'lg', '2xl']);

/** Tailwind's logical and physical side segments, which are not radius VALUES. */
const SIDES = new Set(['t', 'b', 'l', 'r', 's', 'e', 'tl', 'tr', 'bl', 'br', 'ss', 'se', 'es', 'ee']);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|jsx|css)$/.test(p) && !/\.test\./.test(p)) out.push(p);
  }
  return out;
}

const FILES = [...walk('components'), ...walk('app')].sort();

/**
 * Comments are stripped first. D-036 and the reasoning above both NAME the forbidden
 * values in prose, and a guard that cannot tell a violation from its own explanation
 * fails on the documentation that justifies it.
 */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
}

/** Every `rounded…` utility in a file, as `{ token, value }`. */
function radii(file: string): { token: string; value: string }[] {
  return [...code(file).matchAll(/\brounded(?:-[a-z0-9]+)*/g)].map((m) => {
    const token = m[0];
    const parts = token.split('-').slice(1);
    if (parts.length > 1 && parts[0] !== undefined && SIDES.has(parts[0])) parts.shift();
    return { token, value: parts.join('-') };
  });
}

describe('radius hygiene (T-068 · constitution § 3)', () => {
  it('scans a real set of files (guards the walker, not just the regex)', () => {
    // Without this, a broken glob turns every assertion below into a vacuous pass.
    expect(FILES.length).toBeGreaterThan(20);
    expect(FILES.some((f) => f.endsWith('components/AuthForm.tsx'))).toBe(true);
  });

  it('finds radii at all (guards the regex)', () => {
    expect(FILES.flatMap((f) => radii(f)).length).toBeGreaterThan(20);
  });

  it('uses only the three radii the frozen constitution allows', () => {
    const offenders = FILES.flatMap((file) =>
      radii(file)
        .filter(({ value }) => !ALLOWED.has(value))
        .map(({ token }) => `${file}: ${token}`),
    );
    // The message IS the fix list: constitution § 3 allows md (6px, fields and tags),
    // lg (8px, buttons) and 2xl (16px, cards and modals). D-036 maps a role to a group.
    expect(offenders).toEqual([]);
  });

  it('accepts a side-clipped form of an allowed value (D-036 ⓔ)', () => {
    expect(radii('components/TabBar.tsx').some(({ value }) => value === '2xl')).toBe(true);
  });

  it('⛔ never accepts a bare `rounded` — that is Tailwind’s 4px, a fourth value', () => {
    // Proves the parser's own edge case rather than trusting it: `rounded` alone yields
    // an empty value, which is not in ALLOWED.
    const parsed = [...'<div className="rounded" />'.matchAll(/\brounded(?:-[a-z0-9]+)*/g)];
    expect(parsed).toHaveLength(1);
    expect(ALLOWED.has('')).toBe(false);
  });
});
```

- [x] **Step 2: Run it and read the fix list**

Run: `npx vitest run scripts/radius-hygiene.test.ts`
Expected: FAIL on *uses only the three radii*, with an array of **38** entries — 37 × `rounded-xl` plus `app/page.tsx: rounded-full`. Compare that list against the mapping table above; if a file appears in one and not the other, ⛔ stop and reconcile before editing anything.

- [x] **Step 3: Rewrite the components (batch 1 of 3)**

`components/Flashcard.tsx` · `components/InstallPrompt.tsx` · `components/OnboardingForm.tsx` · `components/AuthForm.tsx` · `components/LatinField.tsx` — per the mapping table. ⛔ Radius utilities only: no other token on any of those lines changes.

Run: `npx vitest run scripts/radius-hygiene.test.ts` — expect the offender list to shrink to 21.

- [x] **Step 4: Rewrite the components (batch 2 of 3)**

`components/CardDeck.tsx` · `components/StudiesScreen.tsx` · `components/RegisteredAddress.tsx` · `components/StudyDeckScreen.tsx` · `components/CardsScreen.tsx`.

Run: `npx vitest run scripts/radius-hygiene.test.ts` — expect the offender list to shrink to 11.

- [x] **Step 5: Rewrite the app routes (batch 3 of 3)**

`app/loading.tsx` · `app/error.tsx` · `app/global-error.tsx` · `app/not-found.tsx` · `app/page.tsx` (three, including the `rounded-full` badge) · `app/sources/page.tsx` · `app/onboarding/page.tsx` · `app/dev/onboarding/page.tsx`.

Run: `npx vitest run scripts/radius-hygiene.test.ts`
Expected: PASS, 5 tests, empty offender list.

- [x] **Step 6: Prove the guard can fail (mutation)**

1. Change one `rounded-lg` back to `rounded-xl` ⇒ re-run ⇒ expect FAIL naming that exact `file: rounded-xl`.
2. Restore. Add `rounded-full` to a different file ⇒ re-run ⇒ expect FAIL naming it.
3. Restore. Put the string `rounded-xl` inside a `//` comment ⇒ re-run ⇒ expect **PASS** (this is the comment-stripping claim, and it has to be proved in the direction that would otherwise be a false failure).
4. Restore. Re-run ⇒ 5 pass. Record all three outcomes in the tick report.

- [x] **Step 7: Check the sibling guards still hold**

Run: `npx vitest run components/ app/`
Expected: PASS. Several component tests assert on class strings (`ActionBar.test.ts`, `LatinField.test.ts`, `WordBank.test.ts`); if one of them pinned `rounded-xl`, it fails here and the **test** is what gets corrected — the constitution is frozen and does not bend to a test that encoded the old value.

- [x] **Step 8: Update the register, verify and commit**

In `plan/50-tasks.md`, correct the stale count in the T-068 row: 38 occurrences in 22 files (37 × `rounded-xl` + 1 × `rounded-full`), measured 2026-08-14, ⛔ not the C-0105 numbers.

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
git add components app scripts/radius-hygiene.test.ts plan/
git commit -m "loop(DEV): C-XXXX T-068 radii mapped to constitution § 3 + guard"
```

Expected: five green. `check:mobile` matters here for one measured reason: a smaller radius on a `min-h-touch` control cannot change its box, so the tap-target count must be **unchanged**. A change means the edit touched more than a radius.

---

### Task 3: The harness asserts arrival, not just a tap (T-067)

**Files:**
- Modify: `scripts/verify-mobile.mjs` — add `FLOW_ARRIVAL` beside `FLOW_ROUTES` (after line 107); add the assertion block immediately **before** the clean-console check at the end of the per-route loop (today line 1063); add one `EXPECTED_CONSOLE` entry for `/dev/onboarding`.
- Modify: `scripts/verify-mobile.test.ts` — append one `describe` block.

**Interfaces:**
- Consumes: `FLOW_ROUTES` (`['/', '/signup', '/login', '/dev/onboarding', '/study', '/world/compose']`), `check(ok, label, onFailure)`, `report(line)`, the per-route `page`, `at`, and the `consoleErrors` array that the clean-console check reads afterwards.
- Produces: `const FLOW_ARRIVAL` — a plain object keyed by route. Every entry has `kind`, `why`, and the one field its kind needs:
  - `{ kind: 'navigates', to: string, marker: string, why: string }`
  - `{ kind: 'announces', text: string, why: string }`
  - `{ kind: 'refetches', request: string, why: string }`

**Why three kinds and not one.** The strong form — "the tap lands on the next screen" — is the only honest assertion for `/`, whose primary action is `<Link href="/signup">`. It is *impossible* for the other five, and the reason is measured, not assumed: the harness runs `next start` with no Supabase env, so `/onboarding` answers 307 (TD-13) and every world/study endpoint answers 503 by its own contract. ⛔ The reaction to that is **not** an exemption — T-067 forbids one — so each of the five declares the destination it *can* reach and the harness measures that:

- `/signup` · `/login` — the tap runs `checkCredentials` client-side and paints a named Hebrew field error. Nothing is exempt: a tap that paints nothing still fails.
- `/dev/onboarding` — the tap reaches `POST /api/profile`, which answers 503 without env, and the form paints `FAILURE_HE.save`.
- `/study` · `/world/compose` — the failure screen's primary action is «נסה שוב», whose whole job is to re-issue one request. The assertion is that the request actually goes out, named by URL.

The one thing every kind asserts in common: **something declared happens.** Silence is the F-027 dead end and fails on every route.

- [ ] **Step 1: Write the failing test**

Append to `scripts/verify-mobile.test.ts`:

```ts
describe('every flow screen declares where its primary action leads (T-067)', () => {
  const code = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  function block(name: string): string {
    return (
      code
        .match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`))?.[1]
        ?.replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^[ \t]*\/\/[^\n]*$/gm, '') ?? ''
    );
  }

  /** The entries of a top-level array literal, comments stripped. */
  function entriesOf(name: string): readonly string[] {
    const body = code.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n?\\];`))?.[1] ?? '';
    const withoutComments = body
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    return [...withoutComments.matchAll(/'([^']*)'/g)].map((m) => m[1] ?? '');
  }

  /** Route keys of the FLOW_ARRIVAL object — the keys only, never a value. */
  function arrivalRoutes(): string[] {
    return [...block('FLOW_ARRIVAL').matchAll(/^\s*'([^']+)':\s*\{/gm)].map((m) => m[1] ?? '');
  }

  it('declares an arrival for EVERY flow route — a new screen cannot arrive unmeasured', () => {
    expect(arrivalRoutes().sort()).toEqual([...entriesOf('FLOW_ROUTES')].sort());
  });

  it('gives each entry one of the three kinds, and a reason', () => {
    const entries = [...block('FLOW_ARRIVAL').matchAll(/'([^']+)':\s*\{([\s\S]*?)\n\s*\},/g)];
    expect(entries.length).toBe(arrivalRoutes().length);
    for (const [, route, body] of entries) {
      expect(`${route} ${body}`).toMatch(/kind:\s*'(navigates|announces|refetches)'/);
      // ⛔ An entry without a reason is an exemption wearing a table's clothes.
      expect(`${route} ${body}`).toMatch(/why:/);
    }
  });

  it('asserts the one screen that CAN reach the next one actually does', () => {
    const landing = block('FLOW_ARRIVAL').match(/'\/':\s*\{([\s\S]*?)\n\s*\},/)?.[1] ?? '';
    expect(landing).toContain("kind: 'navigates'");
    expect(landing).toContain("to: '/signup'");
  });

  it('measures the tap and not the markup — the block clicks', () => {
    expect(code).toMatch(/FLOW_ARRIVAL\[route\]/);
    expect(code).toMatch(/\.click\(/);
  });

  it('runs the arrival block BEFORE the clean-console check, so the tap’s own errors are judged', () => {
    // A tap that fires a request the harness cannot satisfy produces a console error. If
    // the console were read first, that error would be invisible — and an invisible error
    // is how a 500 hides behind a documented 503.
    expect(code.indexOf('FLOW_ARRIVAL[route]')).toBeLessThan(code.indexOf('clean console'));
  });

  it('allows /dev/onboarding exactly the 503 its own tap causes, keyed to that request', () => {
    const allowed = block('EXPECTED_CONSOLE');
    const entry = allowed.match(/'\/dev\/onboarding':\s*\[([\s\S]*?)\],/)?.[1] ?? '';
    const named = entry.replace(/\\/g, '');
    expect(named).toContain('503');
    expect(named).toContain('/api/profile');
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run scripts/verify-mobile.test.ts`
Expected: FAIL — six of the seven new tests fail (`FLOW_ARRIVAL` does not exist, so `block()` returns `''` and `arrivalRoutes()` is `[]`); *measures the tap* may pass by accident on the password-toggle `.click(` already in the file, which is why the `FLOW_ARRIVAL[route]` half of it is there.

- [ ] **Step 3: Add the table**

In `scripts/verify-mobile.mjs`, immediately after the `FLOW_ROUTES` line:

```js
/**
 * T-067 — where the primary action LEADS. `02-inbox` י׳, and the other half of F-027.
 *
 * Two thirds of the connectivity guarantee already exist above: every flow screen holds
 * exactly one marked primary action, it is hit-testable, and it paints inside the first
 * viewport. What was never measured is the tap itself — a button that is beautifully
 * placed and does nothing is the same dead end roy hit on the live site.
 *
 * ⛔ NOT "the page changed". Each route declares ONE destination and it is named:
 *   navigates — the URL becomes `to` and a marker only that screen holds is present.
 *   announces — an exact Hebrew sentence that was ABSENT before the tap is present after.
 *   refetches — the tap re-issues one named request (this is what «נסה שוב» is FOR).
 *
 * The kind is not a preference. `navigates` is the strong form and it is used wherever it
 * is reachable — which, measured and not assumed, is one route: this harness runs
 * `next start` with no Supabase env, so `/onboarding` answers 307 (TD-13) and every study
 * and world endpoint answers 503 by its own contract. ⛔ An entry may not weaken its kind
 * to make a screen pass: a screen whose tap produces NOTHING fails on every kind, which is
 * the whole point.
 */
const FLOW_ARRIVAL = {
  '/': {
    kind: 'navigates',
    to: '/signup',
    marker: 'input[name="email"]',
    why: 'the only flow screen whose primary action is a plain <Link> and needs no session',
  },
  '/signup': {
    kind: 'announces',
    text: 'כתובת האימייל לא נראית תקינה',
    why: 'AUTH_MESSAGES_HE.invalid_email — checkCredentials rejects the empty form client-side, so the tap is measurable without ever reaching Supabase',
  },
  '/login': {
    kind: 'announces',
    text: 'כתובת האימייל לא נראית תקינה',
    why: 'same client-side rejection as /signup; the harness has no account to log in with',
  },
  '/dev/onboarding': {
    kind: 'announces',
    text: 'השמירה נכשלה. נסה שוב.',
    why: 'FAILURE_HE.save — the tap reaches POST /api/profile, which answers 503 without env (route.ts:24), and the form paints one Hebrew sentence',
  },
  '/study': {
    kind: 'refetches',
    request: '/api/study/queue',
    why: 'without env the screen is in its failure state and its primary action is «נסה שוב», whose entire job is to re-issue this one request',
  },
  '/world/compose': {
    kind: 'refetches',
    request: '/api/world/bank',
    why: 'same failure state and same «נסה שוב», one route down',
  },
};
```

- [ ] **Step 4: Add the console allowance the tap creates**

In `EXPECTED_CONSOLE`, add:

```js
  // T-067: the arrival block TAPS the onboarding fixture's submit, which reaches
  // POST /api/profile — and that route answers 503 without Supabase env by its own
  // contract (`app/api/profile/route.ts:24`). Keyed to the one URL and the one status
  // like every entry above: a 401 or a 500 on the same URL still fails the check.
  '/dev/onboarding': [/status of 503[\s\S]*@\S*\/api\/profile/],
```

- [ ] **Step 5: Add the assertion block**

In `scripts/verify-mobile.mjs`, immediately **before** the `if (route !== '/does-not-exist')` clean-console check:

```js
      // T-067 — the third of the three connectivity checks: the tap ARRIVES somewhere.
      // Last in the route block on purpose: `navigates` leaves this URL behind, and every
      // measurement above has to happen on the screen it names.
      const arrival = FLOW_ARRIVAL[route];
      if (arrival) {
        const action = page.locator('main [data-primary-action]');
        if ((await action.count()) === 1) {
          if (arrival.kind === 'navigates') {
            await action.click();
            await page.waitForURL(`**${arrival.to}`, { timeout: 5000 }).catch(() => {});
            const url = new URL(page.url()).pathname;
            check(url === arrival.to, `${at} tap arrives at ${arrival.to}`, `landed on ${url}`);
            // The URL alone is a claim about the router; the marker is a claim about the
            // screen. A route that renders an error boundary has the right URL too.
            const marker = await page.locator(arrival.marker).count();
            check(
              marker > 0,
              `${at} ${arrival.to} really rendered`,
              `no element matching ${arrival.marker}`,
            );
          } else if (arrival.kind === 'announces') {
            const said = () => page.locator('main').innerText();
            const before = await said();
            check(
              !before.includes(arrival.text),
              `${at} the answer is not on screen before the tap`,
              'the assertion below would pass without the tap',
            );
            await action.click();
            await page
              .locator('main', { hasText: arrival.text })
              .waitFor({ timeout: 5000 })
              .catch(() => {});
            const after = await said();
            check(
              after.includes(arrival.text),
              `${at} tap answers with "${arrival.text}"`,
              'the tap produced no visible answer — this is the F-027 dead end',
            );
          } else {
            const seen = page.waitForRequest(
              (r) => r.url().includes(arrival.request),
              { timeout: 5000 },
            );
            await action.click();
            const fired = await seen.then(() => true).catch(() => false);
            check(
              fired,
              `${at} tap re-issues ${arrival.request}`,
              'the retry button issued no request at all',
            );
          }
          report(`${at} arrival: ${arrival.kind} — ${arrival.why}`);
        }
      }
```

- [ ] **Step 6: Run the harness**

```bash
npm run build && npm run check:mobile
```

Expected: green, with 3 widths × 6 routes of new `arrival:` lines and ~21 new checks. If `/signup` fails *the answer is not on screen before the tap*, the copy moved — fix `text` from `AUTH_MESSAGES_HE`, ⛔ never by loosening the assertion to a substring that was already there.

- [ ] **Step 7: Prove the assertions can fail (mutation)**

1. In `app/page.tsx`, change the primary `<Link href="/signup">` to `href="/login"` ⇒ `npm run build && npm run check:mobile` ⇒ expect FAIL ×3 (one per width) on *tap arrives at /signup — landed on /login*. Restore.
2. In `FLOW_ARRIVAL['/dev/onboarding']`, change `text` to a sentence the screen never says ⇒ re-run ⇒ expect FAIL ×3 on *tap answers with…*. Restore.
3. In `components/StudyDeckScreen.tsx`, replace the retry `onClick={() => void load()}` with `onClick={() => {}}` ⇒ re-run ⇒ expect FAIL ×3 on *tap re-issues /api/study/queue*. Restore.
4. Re-run clean. Record all three failure lines verbatim in the tick report.

- [ ] **Step 8: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
git add scripts/ plan/
git commit -m "loop(DEV): C-XXXX T-067 the harness asserts arrival, not just the tap"
```

---

## Self-review

**1. Spec coverage.**

| Spec requirement | Task |
|---|---|
| T-069: one global `:focus-visible`, from a palette token, with an offset, ⛔ no `outline: none`, ⛔ no bare `:focus`, one file | 1 |
| T-068 ⓐ: D-036 applied to every occurrence | 2, steps 3–5 |
| T-068 ⓑ: a source test that fails on any radius outside `md`/`lg`/`2xl` — «הבדיקה היא כל הערך של המשימה» | 2, steps 1 and 6 |
| T-068: ⛔ zero colour / spacing / font / layout change | 2, Global Constraints + step 7 |
| T-067: an assertion per flow screen that the tap reaches a declared target, ⛔ not "the page changed" | 3, steps 3 and 5 |
| T-067: ⛔ no screen exempted | 3 — every route has an entry, the coverage test forbids a gap, and every kind fails on silence |
| T-067: ⛔ touches no component | 3 — the diff is two files under `scripts/` |

**2. Placeholder scan.** No TODO, no "appropriate error handling", no "similar to task N". Every test body and every CSS/JS block is complete and pasteable.

**3. Type consistency.** `FLOW_ARRIVAL` keys equal `FLOW_ROUTES` entries exactly (asserted). Field names `kind` · `to` · `marker` · `text` · `request` · `why` are used identically in the table, the assertion block and the test. `ALLOWED` / `SIDES` / `radii()` / `code()` in `scripts/radius-hygiene.test.ts` are defined before use and referenced by those exact names. `ruleFor()` in `app/globals.test.ts` is defined once and used by four tests.

**4. Known risk, recorded rather than hidden.** Task 3 taps a real submit on `/dev/onboarding` at three widths, so three extra `POST /api/profile` requests hit the local `next start` per run. They answer 503 without touching a database — there is none in this environment — and the allowance is keyed to that exact URL and status. If a future run ever gets Supabase env, that entry must be re-examined in the same tick, because with env the tap would reach a real 401 and the allowance would no longer match.
