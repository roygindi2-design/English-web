# Display Layer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this
> plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. One task per Dev tick.

**Goal:** Give the product a measured visual identity (T-028), a single component that every
piece of English text passes through (T-009), and the flashcard screen the content bank was
built for (T-041) — with the target word marked from `/lib/core`, not from React (TD-11).

**Architecture:** Three layers, bottom-up, each usable on its own. Task 1 defines colour as
*data in `/lib/core`* with the contrast floors enforced by unit test, and wires those values
into CSS custom properties so light/dark swap in one place. Task 2 turns the ad-hoc
`.ltr-inline` span into `<EnWord>`/`<EnText>` and adds a repo-scanning guard so raw `lang="en"`
cannot come back. Task 3 closes TD-11 by returning `exampleSegments` from `buildCard`, then
renders the card against those segments — the React layer never re-derives which word is the
target.

**Tech Stack:** Next.js 16 App Router · React 19 · Tailwind 3.4 (CSS custom properties, no
`dark:` variants) · TypeScript strict · Vitest (node env) · Playwright via
`scripts/verify-mobile.mjs`.

**Covers:** T-028 (Task 1) · T-009 (Task 2) · T-041 + TD-11 (Task 3).
**Findings closed:** F-014 (Task 1) · F-016 — onboarding dead space (Task 1 Step 8) · F-017 —
`landing.ts` escape bug (Task 2 Step 0). *(IDs are the post-`172f26a` numbering: the old duplicate
F-016/F-017 rows were renumbered to F-018/F-019.)*
**Not covered:** F-012 / T-034 — blocked on P-001, no licensed content exists.

---

## Global Constraints

Copied verbatim from `plan/RULES.md` § 0.8, `plan/00-control.md` and the T-041 UI spec in
`docs/superpowers/plans/2026-08-06-content-bank.md`. Every task below inherits all of these.

- ⛔ **No vertically centred layout.** `justify-center` inside a `flex-1` region is the exact
  anti-pattern F-011 measured at 67% empty screen and F-016 found again in `/onboarding`.
- ⛔ **No purple gradient. No uniformly rounded corners on every element. No Inter.**
- ⛔ **No invented learning content.** Not one English↔Hebrew word pair may be authored here.
  The layout fixture in Task 3 uses `Lorem` / `טקסט לדוגמה` precisely because that pair
  teaches nobody anything.
- ⛔ **No copying from מאל"ו (R-010) or AnkiWeb (R-013).**
- `/lib/core/` stays pure: no React, no `window`, no `document`, no `localStorage`, no
  `process.env`, no `fetch`. Enforced by `npm run check:core`.
- A UI component never touches the database. Everything goes through `/app/api/` and
  `lib/api/client.ts`.
- Mobile-first at 375px · every touch target ≥ 44×44px · RTL page with `unicode-bidi: isolate`
  around Latin text · PWA intact · TypeScript with no `any`.
- **Verification command, run fresh in the same message as any success claim:**
  `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
- Commit message format: `loop(DEV): C-XXXX <summary>`. Push to `dev`. Never to `main`.
  Never `[skip ci]` (RULES § 0.7).

### The palette is measured, not chosen

Every hex below was run through the `dataviz` skill's `scripts/validate_palette.js` against
**this product's real surfaces** (`#f8fafc` light, `#0f172a` dark) on 2026-08-06, and every
text pairing through the WCAG 2.1 relative-luminance formula. Recorded results:

- `--brand` light `#2a78d6` — validator: **ALL CHECKS PASS** (lightness band, chroma floor,
  contrast vs surface) at `--mode light --surface #f8fafc`.
- `--brand` dark `#3987e5` — validator: **ALL CHECKS PASS** at `--mode dark --surface #0f172a`.
- `#2a78d6, #0ca30c, #d03b3b` as a *categorical* set **FAILED** CVD separation: worst adjacent
  pair `#d03b3b ↔ #0ca30c` ΔE **4.1** (deutan), 6.2 (tritan) in light; 4.1 / 5.1 in dark.
  **This is the load-bearing measurement for Task 3:** green-vs-red is not distinguishable to a
  deutan reader, so the "ידעתי" / "לא ידעתי" buttons and every correct/incorrect state carry
  **text and an icon**, never colour alone. That is also the `dataviz` non-negotiable for
  status colours.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/core/palette.ts` | **New.** The token table + a pure `contrastRatio()`. Single source of truth for every colour in the product. |
| `lib/core/palette.test.ts` | **New.** Asserts every declared floor holds, and that `app/globals.css` declares exactly these tokens in both modes. |
| `app/globals.css` | **Modify.** Declares the tokens as CSS custom properties, light + `prefers-color-scheme: dark`. |
| `tailwind.config.ts` | **Modify.** Maps semantic colour names onto the custom properties. No `dark:` variants anywhere in the product. |
| `app/layout.tsx` | **Modify.** `bg-surface text-ink`; adaptive `themeColor`. |
| `app/page.tsx` · `app/onboarding/page.tsx` · `components/AuthForm.tsx` | **Modify.** Swap raw `slate-*` for tokens; remove the `flex-1 justify-center` in onboarding (F-016). |
| `components/EnWord.tsx` | **New.** `<EnWord>` (inline word) and `<EnText>` (sentence with marked segments). The only place `lang="en"` is written. |
| `components/EnWord.test.ts` | **New.** Source-scanning guard: no `lang="en"` outside this file. Reads files with `node:fs` — it does **not** render React. |
| `vitest.config.ts` | **Modify.** Add `components/**/*.test.ts` to `include`. |
| `lib/core/contentSchema.ts` | **Modify.** Export `targetForms` and a new `locateTarget`. |
| `lib/core/flashcard.ts` | **Modify.** `CardFace.exampleSegments` — TD-11. |
| `components/Flashcard.tsx` | **New.** Presentational. Driven entirely by a `Card`. |
| `app/study/page.tsx` | **New.** Empty state today; the queue endpoint does not exist yet. |
| `app/dev/card/page.tsx` | **New.** Layout fixture for `check:mobile`. `noindex`. Not learning content. |
| `scripts/verify-mobile.mjs` | **Modify.** New routes + dark-mode pass + card assertions. |

---

### Task 1: Design tokens (T-028, closes F-014 and F-016)

**Files:**
- Create: `lib/core/palette.ts`
- Create: `lib/core/palette.test.ts`
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`
- Modify: `app/layout.tsx`
- Modify: `app/page.tsx` · `app/onboarding/page.tsx` · `components/AuthForm.tsx`
- Modify: `scripts/verify-mobile.mjs`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `export type ThemeMode = 'light' | 'dark'`
  - `export interface ColorToken { readonly cssVar: string; readonly light: string; readonly dark: string }`
  - `export const COLOR_TOKENS: readonly ColorToken[]`
  - `export interface ContrastFloor { readonly fg: string; readonly bg: string; readonly min: number; readonly why: string }`
  - `export const CONTRAST_FLOORS: readonly ContrastFloor[]`
  - `export function contrastRatio(hexA: string, hexB: string): number`
  - `export function tokenValue(cssVar: string, mode: ThemeMode): string`
  - Tailwind colour names available to every later task: `surface`, `surface-raised`, `ink`,
    `ink-muted`, `border-subtle`, `border-strong`, `brand`, `brand-surface`, `brand-on`,
    `success`, `danger`.

- [ ] **Step 1: Write the failing test**

Create `lib/core/palette.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLOR_TOKENS, CONTRAST_FLOORS, contrastRatio, tokenValue } from './palette';

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#2a78d6', '#2a78d6')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#047857', '#f8fafc')).toBeCloseTo(contrastRatio('#f8fafc', '#047857'), 5);
  });

  it('rejects anything that is not a 6-digit hex', () => {
    expect(() => contrastRatio('#fff', '#000000')).toThrow(RangeError);
    expect(() => contrastRatio('rebeccapurple', '#000000')).toThrow(RangeError);
  });
});

describe('declared contrast floors', () => {
  // The point of this test: a token may be re-tuned, but not below the floor that
  // made it shippable. Eyeballing a colour swap is exactly how F-014 got here.
  it.each(CONTRAST_FLOORS)('$fg on $bg clears $min:1 in both modes — $why', (floor) => {
    for (const mode of ['light', 'dark'] as const) {
      const ratio = contrastRatio(tokenValue(floor.fg, mode), tokenValue(floor.bg, mode));
      expect(
        ratio,
        `${floor.fg} on ${floor.bg} in ${mode} measured ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(floor.min);
    }
  });
});

describe('globals.css stays in sync with the table', () => {
  const css = readFileSync('app/globals.css', 'utf8');
  const block = (marker: string): string => {
    const start = css.indexOf(marker);
    expect(start, `marker ${marker} missing from app/globals.css`).toBeGreaterThan(-1);
    const open = css.indexOf('{', start);
    return css.slice(open, css.indexOf('}', open));
  };

  it('declares every token with the light value', () => {
    const light = block('/* tokens:light */');
    for (const t of COLOR_TOKENS) expect(light).toContain(`${t.cssVar}: ${t.light};`);
  });

  it('declares every token with the dark value under prefers-color-scheme', () => {
    const dark = block('/* tokens:dark */');
    for (const t of COLOR_TOKENS) expect(dark).toContain(`${t.cssVar}: ${t.dark};`);
  });

  it('opts the document into both schemes, so form controls follow', () => {
    expect(css).toMatch(/color-scheme:\s*light dark/);
  });
});

describe('no raw slate left in the screens the product ships', () => {
  // Tokens are worthless if half the app bypasses them. This is the ratchet.
  const FILES = [
    'app/layout.tsx',
    'app/page.tsx',
    'app/onboarding/page.tsx',
    'components/AuthForm.tsx',
  ];
  it.each(FILES)('%s uses semantic colour names only', (file) => {
    const src = readFileSync(file, 'utf8');
    const raw = src.match(/\b(?:bg|text|border|ring|placeholder|from|to|via)-slate-\d{2,3}\b/g);
    expect(raw ?? [], `raw palette classes left in ${file}`).toEqual([]);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run lib/core/palette.test.ts`
Expected: FAIL — `Failed to resolve import "./palette"`.

- [ ] **Step 3: Write `lib/core/palette.ts`**

```ts
/**
 * PURE. The single source of truth for every colour in the product (T-028, F-014).
 *
 * Why this lives in /lib/core and not only in CSS: a colour is a claim about
 * legibility, and a claim we do not measure is a claim we do not have. The table
 * below is paired with CONTRAST_FLOORS, which the unit test enforces, so a future
 * "let's lighten the brand a bit" cannot silently drop text under 4.5:1.
 *
 * Provenance of the values (recorded 2026-08-06):
 * - --brand light #2a78d6 and dark #3987e5 each pass the dataviz validator
 *   (scripts/validate_palette.js) against this product's own surfaces:
 *   `--mode light --surface #f8fafc` and `--mode dark --surface #0f172a`.
 * - --brand-surface is a SECOND, darker step, and it exists for one measured
 *   reason: white on #2a78d6 is 4.42:1, under the 4.5:1 body-text floor. The
 *   button fill therefore is not the mark colour. White on #1d4ed8 is 6.70:1.
 * - --success / --danger are status colours. As a categorical pair they FAIL the
 *   validator's CVD check (deutan ΔE 4.1), which is not a defect to fix by
 *   re-stepping but the reason status is never encoded by colour alone anywhere
 *   in this product: icon + label always. See Task 3.
 */

export type ThemeMode = 'light' | 'dark';

export interface ColorToken {
  readonly cssVar: string;
  readonly light: string;
  readonly dark: string;
  readonly role: string;
}

export const COLOR_TOKENS: readonly ColorToken[] = Object.freeze([
  { cssVar: '--surface', light: '#f8fafc', dark: '#0f172a', role: 'page background' },
  { cssVar: '--surface-raised', light: '#ffffff', dark: '#1e293b', role: 'card background' },
  { cssVar: '--ink', light: '#0f172a', dark: '#f8fafc', role: 'body text' },
  { cssVar: '--ink-muted', light: '#475569', dark: '#cbd5e1', role: 'secondary text' },
  { cssVar: '--border-subtle', light: '#e2e8f0', dark: '#334155', role: 'decorative separator' },
  { cssVar: '--border-strong', light: '#64748b', dark: '#94a3b8', role: 'the only boundary of a control' },
  { cssVar: '--brand', light: '#2a78d6', dark: '#3987e5', role: 'accent mark and link' },
  { cssVar: '--brand-surface', light: '#1d4ed8', dark: '#7dabf8', role: 'primary button fill' },
  { cssVar: '--brand-on', light: '#ffffff', dark: '#0f172a', role: 'text on brand-surface' },
  { cssVar: '--success', light: '#047857', dark: '#4ade80', role: 'correct — with icon + label' },
  { cssVar: '--danger', light: '#b91c1c', dark: '#f87171', role: 'incorrect — with icon + label' },
] as const);

export interface ContrastFloor {
  readonly fg: string;
  readonly bg: string;
  readonly min: number;
  readonly why: string;
}

/** WCAG 2.1: 4.5:1 body text, 3:1 large text and non-text UI boundaries. */
export const CONTRAST_FLOORS: readonly ContrastFloor[] = Object.freeze([
  { fg: '--ink', bg: '--surface', min: 4.5, why: 'body text on the page' },
  { fg: '--ink', bg: '--surface-raised', min: 4.5, why: 'body text on a card' },
  { fg: '--ink-muted', bg: '--surface', min: 4.5, why: 'secondary text is still text' },
  { fg: '--ink-muted', bg: '--surface-raised', min: 4.5, why: 'secondary text on a card' },
  { fg: '--brand', bg: '--surface', min: 3, why: 'accent marks are non-text UI' },
  { fg: '--brand', bg: '--surface-raised', min: 3, why: 'accent marks on a card' },
  { fg: '--brand-on', bg: '--brand-surface', min: 4.5, why: 'the label inside the primary button' },
  { fg: '--border-strong', bg: '--surface', min: 3, why: 'an input outline is the control boundary' },
  { fg: '--border-strong', bg: '--surface-raised', min: 3, why: 'an input outline on a card' },
  { fg: '--success', bg: '--surface', min: 4.5, why: 'correct-state text' },
  { fg: '--success', bg: '--surface-raised', min: 4.5, why: 'correct-state text on a card' },
  { fg: '--danger', bg: '--surface', min: 4.5, why: 'incorrect-state text' },
  { fg: '--danger', bg: '--surface-raised', min: 4.5, why: 'incorrect-state text on a card' },
] as const);

const HEX = /^#[0-9a-fA-F]{6}$/;

function channel(hex: string, offset: number): number {
  const v = parseInt(hex.slice(offset, offset + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

/** WCAG 2.1 relative luminance. Six-digit hex only — a shorthand would parse wrong, not throw. */
function luminance(hex: string): number {
  if (!HEX.test(hex)) throw new RangeError(`expected a 6-digit hex colour, got "${hex}"`);
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const a = luminance(hexA);
  const b = luminance(hexB);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function tokenValue(cssVar: string, mode: ThemeMode): string {
  const token = COLOR_TOKENS.find((t) => t.cssVar === cssVar);
  if (!token) throw new RangeError(`unknown colour token: ${cssVar}`);
  return mode === 'light' ? token.light : token.dark;
}
```

- [ ] **Step 4: Run the test — the floors pass, the CSS assertions still fail**

Run: `npx vitest run lib/core/palette.test.ts`
Expected: the `contrastRatio` and `CONTRAST_FLOORS` blocks PASS; `globals.css stays in sync`
and `no raw slate` FAIL. That order is the point — the numbers are right before the wiring is.

- [ ] **Step 5: Write the tokens into `app/globals.css`**

Replace the whole file with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* tokens:light — the source of truth is lib/core/palette.ts; palette.test.ts
   fails if these two blocks drift from COLOR_TOKENS. */
:root {
  color-scheme: light dark;
  --surface: #f8fafc;
  --surface-raised: #ffffff;
  --ink: #0f172a;
  --ink-muted: #475569;
  --border-subtle: #e2e8f0;
  --border-strong: #64748b;
  --brand: #2a78d6;
  --brand-surface: #1d4ed8;
  --brand-on: #ffffff;
  --success: #047857;
  --danger: #b91c1c;
}

@media (prefers-color-scheme: dark) {
  /* tokens:dark */
  :root {
    --surface: #0f172a;
    --surface-raised: #1e293b;
    --ink: #f8fafc;
    --ink-muted: #cbd5e1;
    --border-subtle: #334155;
    --border-strong: #94a3b8;
    --brand: #3987e5;
    --brand-surface: #7dabf8;
    --brand-on: #0f172a;
    --success: #4ade80;
    --danger: #f87171;
  }
}

html, body { max-width: 100vw; overflow-x: hidden; }

body {
  -webkit-text-size-adjust: 100%;
  overscroll-behavior-y: none;
}

/* Latin text inside Hebrew paragraphs must not break RTL flow. Written by
   components/EnWord.tsx only — see its guard test. */
.ltr-inline { unicode-bidi: isolate; direction: ltr; display: inline-block; }

/* T-041: the reveal is an affordance, never a delay. Any motion is opt-out. */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 6: Map the tokens in `tailwind.config.ts`**

```ts
import type { Config } from 'tailwindcss';

/**
 * Semantic names only. There are deliberately no `dark:` variants in this
 * product: the custom properties swap under prefers-color-scheme, so a screen
 * written once is correct in both modes and cannot be half-converted.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        ink: 'var(--ink)',
        'ink-muted': 'var(--ink-muted)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        brand: 'var(--brand)',
        'brand-surface': 'var(--brand-surface)',
        'brand-on': 'var(--brand-on)',
        success: 'var(--success)',
        danger: 'var(--danger)',
      },
      fontFamily: { sans: ['system-ui', 'Segoe UI', 'Arial', 'sans-serif'] },
      minHeight: { touch: '44px' },
      minWidth: { touch: '44px' },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 7: Convert `app/layout.tsx`**

Two edits, nothing else:

```tsx
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // The browser chrome follows the mode too, otherwise a dark page sits under a light bar.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};
```

```tsx
      <body className="bg-surface text-ink antialiased">
```

and in the header, `text-slate-500` → `text-ink-muted`.

- [ ] **Step 8: Convert the three remaining screens, and kill the onboarding dead band (F-016)**

In `app/page.tsx`: `text-slate-600` → `text-ink-muted`, `text-slate-700` → `text-ink`,
`bg-slate-900 text-white` (the ✓ bullet) → `bg-brand-surface text-brand-on`,
`border-slate-200 bg-white` → `border-border-subtle bg-surface-raised`,
`text-slate-500` → `text-ink-muted`, and the primary link
`bg-slate-900 … text-white active:bg-slate-700` → `bg-brand-surface … text-brand-on active:opacity-90`.

In `components/AuthForm.tsx`: same substitution, and every input border becomes
`border-border-strong` — an input's outline *is* its boundary, which is the reason
`--border-strong` exists as a separate token.

In `app/onboarding/page.tsx:34`, delete `flex-1 justify-center` from the heading wrapper and
leave `flex flex-col gap-4`. This is F-016 — the same anti-pattern F-011 measured on the home
screen, never carried across to the sibling file.

- [ ] **Step 9: Add the dark-mode measurement to `scripts/verify-mobile.mjs`**

A declared dark mode that never renders is F-007 in a new costume. After the existing
per-route loop closes, add:

```js
  // Dark mode is a claim about pixels, so measure pixels. One route, one width:
  // the tokens are global, so if `/` flips, every screen flips.
  {
    const darkCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      colorScheme: 'dark',
    });
    const darkPage = await darkCtx.newPage();
    await darkPage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const dark = await darkPage.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, fg: s.color };
    });
    await darkCtx.close();

    const lightCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      colorScheme: 'light',
    });
    const lightPage = await lightCtx.newPage();
    await lightPage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const light = await lightPage.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, fg: s.color };
    });
    await lightCtx.close();

    check(dark.bg !== light.bg, 'dark mode changes the page background', `both are ${dark.bg}`);
    check(dark.fg !== light.fg, 'dark mode changes the body text colour', `both are ${dark.fg}`);
    check(dark.bg === 'rgb(15, 23, 42)', 'dark surface is the --surface token', `got ${dark.bg}`);
  }
```

- [ ] **Step 10: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
Expected: all green, including the three new dark-mode checks and the palette suite. Paste the
tail of the output into the tick report — a claim without fresh output is not a claim.

- [ ] **Step 11: Commit**

```bash
git add lib/core/palette.ts lib/core/palette.test.ts app/globals.css tailwind.config.ts \
        app/layout.tsx app/page.tsx app/onboarding/page.tsx components/AuthForm.tsx \
        scripts/verify-mobile.mjs
git commit -m "loop(DEV): C-XXXX T-028 design tokens — measured palette, dark mode, F-016"
git push origin dev
```

---

### Task 2: `<EnWord>` — one door for English text (T-009)

**Files:**
- Create: `components/EnWord.tsx`
- Create: `components/EnWord.test.ts`
- Modify: `vitest.config.ts`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: the Tailwind colour names from Task 1.
- Produces:
  - `export interface EnWordProps { readonly children: React.ReactNode; readonly className?: string }`
  - `export default function EnWord(props: EnWordProps): JSX.Element`
  - `export interface EnTextSegment { readonly text: string; readonly isTarget: boolean }`
  - `export function EnText(props: { readonly segments: readonly EnTextSegment[]; readonly className?: string }): JSX.Element`
  - Task 3 renders every English string through exactly these two.

- [ ] **Step 0: Close F-017 — `term.replace('.', …)` escapes only the first dot**

This is a one-character fix in a file this task already touches, so it rides along rather than
burning a tick of its own. In `lib/core/landing.ts:100`, `forbiddenTermsIn` builds its regex
with `term.replace('.', '\\.')` — `String.prototype.replace` with a string pattern replaces one
occurrence, so `'A.I.'` keeps its second dot as a regex wildcard.

First add the failing test to `lib/core/landing.test.ts`:

```ts
it('does not flag a term that merely matches the unescaped wildcard (F-017)', () => {
  // Verified in the finding: the old regex matched "the A.Ix thing" and blocked
  // valid copy at build time.
  expect(forbiddenTermsIn('the A.Ix thing')).toEqual([]);
  expect(forbiddenTermsIn('שיווק עם A.I. בכותרת')).toContain('A.I.');
});
```

Run `npx vitest run lib/core/landing.test.ts` — expect FAIL on the first assertion. Then change
`replace` to `replaceAll` and re-run — expect PASS. Fold this into the Task 2 commit.

- [ ] **Step 1: Extend the Vitest include**

In `vitest.config.ts`:

```ts
    // components/ holds source-scanning guards only (T-009). The environment is
    // node, so a React render test does not belong here — add jsdom first if that
    // ever changes.
    include: ['lib/**/*.test.ts', 'proxy.test.ts', 'scripts/**/*.test.ts', 'components/**/*.test.ts'],
```

- [ ] **Step 2: Write the failing guard test**

Create `components/EnWord.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.tsx$/.test(p)) out.push(p);
  }
  return out;
}

const SOURCES = [...walk('app'), ...walk('components')];

describe('every English string in the product goes through <EnWord> (T-009)', () => {
  it('no file other than EnWord.tsx writes lang="en"', () => {
    const offenders = SOURCES.filter(
      (f) => f !== join('components', 'EnWord.tsx') && /lang=["']en["']/.test(readFileSync(f, 'utf8')),
    );
    expect(offenders, 'these render English without the shared wrapper').toEqual([]);
  });

  it('no file other than EnWord.tsx hand-writes the ltr-inline class', () => {
    const offenders = SOURCES.filter(
      (f) => f !== join('components', 'EnWord.tsx') && /ltr-inline/.test(readFileSync(f, 'utf8')),
    );
    expect(offenders, 'the isolation class is EnWord’s implementation detail').toEqual([]);
  });

  it('EnWord itself sets lang, dir and the isolation class together', () => {
    const src = readFileSync(join('components', 'EnWord.tsx'), 'utf8');
    expect(src).toContain('lang="en"');
    expect(src).toContain('dir="ltr"');
    expect(src).toContain('ltr-inline');
  });
});
```

- [ ] **Step 3: Run it and confirm it fails**

Run: `npx vitest run components/EnWord.test.ts`
Expected: FAIL — `ENOENT … components/EnWord.tsx`, and `app/page.tsx` listed as an offender on
both scans (it hand-writes `className="ltr-inline" lang="en"` today).

- [ ] **Step 4: Write `components/EnWord.tsx`**

```tsx
/**
 * The single wrapper for English inside this RTL product (T-009).
 *
 * Three attributes have to travel together or the result is subtly wrong, and
 * "subtly wrong bidi" is the class of bug nobody files: `lang="en"` so screen
 * readers switch voice and hyphenation is right, `dir="ltr"` so the run is laid
 * out left-to-right, and `unicode-bidi: isolate` (the .ltr-inline class) so a
 * trailing "?" or "," does not jump to the wrong end of the Hebrew sentence.
 * Scattering these by hand is how one of them goes missing — hence the guard
 * test beside this file.
 *
 * Not a client component: it has no state and no handlers.
 */

export interface EnWordProps {
  readonly children: React.ReactNode;
  readonly className?: string;
}

export default function EnWord({ children, className }: EnWordProps) {
  return (
    <span lang="en" dir="ltr" className={['ltr-inline', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

export interface EnTextSegment {
  readonly text: string;
  readonly isTarget: boolean;
}

/**
 * An English sentence with the target word marked. The segments are computed in
 * /lib/core (buildCard) and merely painted here — TD-11: which word is the target
 * is a pedagogical decision, and re-deriving it in React would put that decision
 * in two places, where the second one is wrong the first time a word inflects.
 *
 * The mark is weight plus an underline, not colour alone.
 */
export function EnText({
  segments,
  className,
}: {
  readonly segments: readonly EnTextSegment[];
  readonly className?: string;
}) {
  return (
    <span lang="en" dir="ltr" className={['ltr-inline', className].filter(Boolean).join(' ')}>
      {segments.map((segment, i) =>
        segment.isTarget ? (
          <strong key={i} className="font-bold text-brand underline decoration-2 underline-offset-4">
            {segment.text}
          </strong>
        ) : (
          <span key={i}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
```

- [ ] **Step 5: Route `app/page.tsx` through it**

Replace the hand-written span in the preview block:

```tsx
import EnWord from '@/components/EnWord';
// …
          <p className="mt-1 text-2xl font-bold">
            <EnWord>{preview.headword}</EnWord>
          </p>
```

- [ ] **Step 6: Run the guard test and confirm it passes**

Run: `npx vitest run components/EnWord.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 7: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
Expected: all green. `check:mobile`'s existing RTL assertions on `/` must still pass — they are
what proves the wrapper did not break the page direction.

- [ ] **Step 8: Commit**

```bash
git add components/EnWord.tsx components/EnWord.test.ts vitest.config.ts app/page.tsx
git commit -m "loop(DEV): C-XXXX T-009 EnWord — one wrapper for English, guarded by a source scan"
git push origin dev
```

---

### Task 3: The flashcard screen (T-041) and TD-11

**Files:**
- Modify: `lib/core/contentSchema.ts`
- Modify: `lib/core/contentSchema.test.ts`
- Modify: `lib/core/flashcard.ts`
- Modify: `lib/core/flashcard.test.ts`
- Create: `components/Flashcard.tsx`
- Create: `app/study/page.tsx`
- Create: `app/dev/card/page.tsx`
- Modify: `scripts/verify-mobile.mjs`

**Interfaces:**
- Consumes: `EnWord`, `EnText`, `EnTextSegment` (Task 2); the Tailwind colour names (Task 1);
  `Card`, `CardFace`, `buildCard`, `gradeTypedAnswer`, `BINARY_GRADES` (already in
  `lib/core/flashcard.ts` from T-040).
- Produces:
  - `export interface TextSpan { readonly start: number; readonly end: number }`
  - `export function targetForms(headword: string): Set<string>[]` *(was private)*
  - `export function locateTarget(sentence: string, headword: string): TextSpan | null`
  - `export interface ExampleSegment { readonly text: string; readonly isTarget: boolean }`
  - `CardFace.exampleSegments: readonly ExampleSegment[]`

> **TD-11 is why this task exists in this order.** `contentSchema.ts` and `flashcard.ts` were
> both under Critic review when TD-11 was filed, and its recorded resolution is "T-041, before
> the first line of JSX". This task is that moment. Do the core change first, in its own
> commit, before touching a component.

#### 3a — Return the target span from core

- [ ] **Step 1: Write the failing tests for `locateTarget`**

Append to `lib/core/contentSchema.test.ts`:

```ts
import { locateTarget, targetForms } from './contentSchema';

describe('locateTarget (TD-11)', () => {
  const at = (sentence: string, headword: string) => {
    const span = locateTarget(sentence, headword);
    return span ? sentence.slice(span.start, span.end) : null;
  };

  it('finds the exact headword', () => {
    expect(at('The bank was closed.', 'bank')).toBe('bank');
  });

  it('finds a regular inflection, not the lemma', () => {
    expect(at('She deliberated for hours.', 'deliberate')).toBe('deliberated');
    expect(at('He is running late.', 'run')).toBe('running');
  });

  it('is case-insensitive but returns the surface form as written', () => {
    expect(at('Bank on it.', 'bank')).toBe('Bank');
  });

  it('spans a separable phrasal verb from first token to last', () => {
    expect(at('Please give it up now.', 'give up')).toBe('give it up');
  });

  it('does not match a word that merely starts the same — the T-039 prefix bug', () => {
    expect(at('That is not true.', 'note')).toBeNull();
    expect(at('The behaviour was odd.', 'be')).toBeNull();
  });

  it('returns null for an irregular form, which the gate rejects anyway', () => {
    expect(at('He went home.', 'go')).toBeNull();
  });

  it('returns null when the word is absent', () => {
    expect(at('Nothing here.', 'bank')).toBeNull();
  });

  it('exposes the same forms the gate uses, so the two can never disagree', () => {
    expect(targetForms('run')[0]?.has('running')).toBe(true);
  });
});
```

- [ ] **Step 2: Run and confirm they fail**

Run: `npx vitest run lib/core/contentSchema.test.ts -t locateTarget`
Expected: FAIL — `locateTarget is not exported by ./contentSchema`.

- [ ] **Step 3: Implement in `lib/core/contentSchema.ts`**

Change `function targetForms` to `export function targetForms`, then add below it:

```ts
export interface TextSpan {
  readonly start: number;
  readonly end: number;
}

/** Tokens with their offsets. Mirrors `tokens()` exactly; only the spans are extra. */
function tokensWithSpans(s: string): { raw: string; start: number; end: number }[] {
  const out: { raw: string; start: number; end: number }[] = [];
  const re = /[A-Za-z']+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    out.push({ raw: m[0].toLowerCase(), start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/**
 * Where the target word sits inside a sentence — TD-11.
 *
 * The walk is deliberately identical to `containsHeadword`, including its one
 * subtlety: a mismatch does NOT reset progress, because phrasal verbs separate
 * ("give it up"). Two walks that disagree would mean the gate accepts a sentence
 * the card then cannot mark, so they share `targetForms` and the same loop shape.
 * If you change one, change both, and the tests here and there will tell you.
 */
export function locateTarget(sentence: string, headword: string): TextSpan | null {
  const forms = targetForms(headword);
  const first = forms[0];
  if (!first) return null;
  let next = 0;
  let start = -1;
  for (const t of tokensWithSpans(sentence)) {
    const w = normalise(t.raw);
    const expected = forms[next];
    if (expected?.has(w)) {
      if (next === 0) start = t.start;
      next += 1;
      if (next === forms.length) return { start, end: t.end };
    } else if (next > 0 && first.has(w)) {
      next = 1;
      start = t.start;
    }
  }
  return null;
}
```

- [ ] **Step 4: Run and confirm they pass**

Run: `npx vitest run lib/core/contentSchema.test.ts`
Expected: PASS — the 32 existing tests plus the 8 new ones.

- [ ] **Step 5: Write the failing tests for `exampleSegments`**

Append to `lib/core/flashcard.test.ts`:

```ts
describe('exampleSegments (TD-11)', () => {
  const sense = {
    headword: 'deliberate',
    translationHe: 'לשקול בכובד ראש',
    examples: { supportive: 'They deliberated all night.', neutral: 'We must deliberate first.' },
  };

  it('splits the example around the inflected target', () => {
    const card = buildCard(sense, 'recognition', { isFirstEncounter: true });
    expect(card.back.exampleSegments).toEqual([
      { text: 'They ', isTarget: false },
      { text: 'deliberated', isTarget: true },
      { text: ' all night.', isTarget: false },
    ]);
  });

  it('always reassembles into exactly the example string', () => {
    const card = buildCard(sense, 'production', { isFirstEncounter: false });
    expect(card.back.exampleSegments.map((s) => s.text).join('')).toBe(card.back.example);
  });

  it('marks exactly one segment', () => {
    const card = buildCard(sense, 'recognition', { isFirstEncounter: false });
    expect(card.back.exampleSegments.filter((s) => s.isTarget)).toHaveLength(1);
  });

  it('falls back to one unmarked segment when the word cannot be located', () => {
    const irregular = { ...sense, headword: 'go', examples: { supportive: 'He went home.', neutral: '' } };
    const card = buildCard(irregular, 'recognition', { isFirstEncounter: true });
    expect(card.back.exampleSegments).toEqual([{ text: 'He went home.', isTarget: false }]);
  });

  it('is empty on a face with no example, and on the front', () => {
    const card = buildCard(sense, 'recognition', { isFirstEncounter: true });
    expect(card.front.exampleSegments).toEqual([]);
    const bare = { ...sense, examples: { supportive: '', neutral: '' } };
    expect(buildCard(bare, 'recognition', { isFirstEncounter: true }).back.exampleSegments).toEqual([]);
  });
});
```

- [ ] **Step 6: Run and confirm they fail**

Run: `npx vitest run lib/core/flashcard.test.ts -t exampleSegments`
Expected: FAIL — `exampleSegments` is undefined on `CardFace`.

- [ ] **Step 7: Implement in `lib/core/flashcard.ts`**

Change the import line to `import { locateTarget, type GeneratedSense } from './contentSchema';`
then:

```ts
export interface ExampleSegment {
  readonly text: string;
  readonly isTarget: boolean;
}
```

Add to `CardFace`:

```ts
  /**
   * The example split around the target word — TD-11. Always joins back to
   * `example` exactly, so the UI can render segments without ever owning the
   * question of which word is the target. Empty when there is no example.
   */
  readonly exampleSegments: readonly ExampleSegment[];
```

Add the splitter and thread it through `face()`:

```ts
/** One marked segment at most. An unlocatable word yields one unmarked segment, never a throw:
 *  a card that renders without the highlight is a degraded card; a crash is no card. */
function splitAroundTarget(sentence: string | null, headword: string): ExampleSegment[] {
  if (sentence === null) return [];
  const span = locateTarget(sentence, headword);
  if (!span) return [{ text: sentence, isTarget: false }];
  const out: ExampleSegment[] = [];
  if (span.start > 0) out.push({ text: sentence.slice(0, span.start), isTarget: false });
  out.push({ text: sentence.slice(span.start, span.end), isTarget: true });
  if (span.end < sentence.length) out.push({ text: sentence.slice(span.end), isTarget: false });
  return out;
}

function face(
  primary: string,
  primaryLang: FaceLang,
  example: string | null,
  exampleSegments: readonly ExampleSegment[],
): CardFace {
  return { primary, primaryLang, secondary: null, example, exampleLang: 'en', exampleSegments };
}
```

In `buildCard`, replace the face construction:

```ts
  const segments = splitAroundTarget(example, headword);
  const en = face(headword, 'en', null, []);
  const he = face(translationHe, 'he', null, []);

  return direction === 'recognition'
    ? {
        direction,
        front: en,
        back: { ...he, example, exampleSegments: segments },
        input: 'self',
        grades: BINARY_GRADES,
      }
    : {
        direction,
        front: he,
        back: { ...en, example, exampleSegments: segments },
        input: 'typed',
        grades: BINARY_GRADES,
      };
```

- [ ] **Step 8: Run the core suites and commit 3a on its own**

Run: `npm run typecheck && npm run check:core && npm test`
Expected: PASS — every existing flashcard and contentSchema test still green.

```bash
git add lib/core/contentSchema.ts lib/core/contentSchema.test.ts \
        lib/core/flashcard.ts lib/core/flashcard.test.ts
git commit -m "loop(DEV): C-XXXX TD-11 — locateTarget in core, exampleSegments on every card face"
```

#### 3b — The screen

- [ ] **Step 9: Write `components/Flashcard.tsx`**

```tsx
'use client';

import { useId, useState } from 'react';
import EnWord, { EnText } from '@/components/EnWord';
import { gradeTypedAnswer, type Card, type CardGrade } from '@/lib/core/flashcard';

/**
 * The card, per the UI spec in docs/superpowers/plans/2026-08-06-content-bank.md.
 *
 * Two rules here are measurements, not preferences:
 *
 * 1. The reveal is state, not animation. `revealed` puts the answer in the DOM
 *    immediately; any transition is decoration on top and is disabled entirely
 *    under prefers-reduced-motion (globals.css). No study shows a flip helps
 *    learning, and Mayer's coherence principle says decorative motion costs.
 * 2. Correct/incorrect is never colour alone. Measured 2026-08-06 with the
 *    dataviz validator: --success vs --danger separate by only ΔE 4.1 for a
 *    deutan reader. Every grade control therefore carries its own Hebrew label
 *    and a glyph; colour is the third channel, not the first.
 *
 * Layout is anchored to the top, never vertically centred (F-011, F-016).
 */
export default function Flashcard({
  card,
  onGrade,
}: {
  readonly card: Card;
  readonly onGrade: (grade: CardGrade) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState('');
  const answerId = useId();

  const primary = (text: string, lang: 'en' | 'he') =>
    lang === 'en' ? <EnWord>{text}</EnWord> : <span>{text}</span>;

  const reveal = () => setRevealed(true);

  return (
    <section className="flex flex-col gap-6" data-flashcard={card.direction}>
      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-6">
        <p className="text-sm text-ink-muted">{card.direction === 'recognition' ? 'מה הפירוש?' : 'איך אומרים באנגלית?'}</p>
        <p className="mt-2 text-4xl font-bold leading-tight" data-card-front>
          {primary(card.front.primary, card.front.primaryLang)}
        </p>

        {revealed ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-border-subtle pt-5" data-card-back>
            <p className="text-2xl font-semibold" data-card-answer>
              {primary(card.back.primary, card.back.primaryLang)}
            </p>
            {card.back.exampleSegments.length > 0 ? (
              <p className="text-base leading-relaxed text-ink-muted">
                <EnText segments={card.back.exampleSegments} />
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Actions live in the lower half for thumb reach (MF-5). */}
      <div className="mt-auto flex flex-col gap-3">
        {!revealed && card.input === 'typed' ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              reveal();
              onGrade(gradeTypedAnswer(card, typed));
            }}
          >
            <label htmlFor={answerId} className="text-sm text-ink-muted">
              כתוב את המילה באנגלית
            </label>
            <input
              id={answerId}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              dir="ltr"
              lang="en"
              inputMode="text"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              className="min-h-touch rounded-xl border border-border-strong bg-surface-raised px-4 text-lg text-ink"
            />
            <button
              type="submit"
              className="min-h-touch rounded-xl bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
            >
              בדיקה
            </button>
          </form>
        ) : null}

        {!revealed && card.input === 'self' ? (
          <button
            type="button"
            onClick={reveal}
            data-reveal
            className="min-h-touch rounded-xl bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            הצג תשובה
          </button>
        ) : null}

        {revealed && card.input === 'self' ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onGrade('again')}
              data-grade="again"
              className="min-h-touch rounded-xl border-2 border-danger px-4 py-3 text-base font-semibold text-danger active:opacity-90"
            >
              <span aria-hidden="true">✕ </span>לא ידעתי
            </button>
            <button
              type="button"
              onClick={() => onGrade('good')}
              data-grade="good"
              className="min-h-touch rounded-xl border-2 border-success px-4 py-3 text-base font-semibold text-success active:opacity-90"
            >
              <span aria-hidden="true">✓ </span>ידעתי
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
```

> **The input carries `lang="en"`, so the Task 2 guard test will fail on this file.** That is
> correct and expected: an `<input>` is not text `<EnWord>` can wrap. Add exactly one exemption
> to `components/EnWord.test.ts` — `components/Flashcard.tsx` in the `lang="en"` scan only, with
> the reason in a comment. Do **not** widen the `ltr-inline` scan; that one stays absolute.

- [ ] **Step 10: Write `app/study/page.tsx`**

```tsx
import Link from 'next/link';

/**
 * The study screen — T-041.
 *
 * There is no review queue endpoint yet and no licensed content in the bank
 * (P-001), so today this screen honestly renders its empty state. That is not a
 * placeholder: an empty queue is a real state a learner reaches every time they
 * finish a session, and it needs to exist either way. When the queue endpoint
 * lands it fetches through lib/api/client.ts and renders <Flashcard> — the
 * component is complete and measured at /dev/card.
 */
export default function StudyPage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold leading-tight">אין כרטיסיות כרגע</h1>
      <p className="text-lg leading-relaxed text-ink-muted">
        עוד לא נטענו מילים למאגר. ברגע שיהיו — הן יופיעו כאן, עשר דקות ביום.
      </p>
      <Link
        href="/"
        className="mt-2 flex min-h-touch items-center justify-center rounded-xl border border-border-strong px-5 py-3 text-base text-ink active:opacity-90"
      >
        חזרה למסך הבית
      </Link>
    </section>
  );
}
```

- [ ] **Step 11: Write `app/dev/card/page.tsx` — the layout fixture**

```tsx
'use client';

import type { Metadata } from 'next';
import Flashcard from '@/components/Flashcard';
import { buildCard } from '@/lib/core/flashcard';

/**
 * Layout harness for check:mobile. NOT a learning screen and NOT linked from
 * anywhere in the product.
 *
 * The strings below are deliberately NOT a word pair: "Lorem" has no Hebrew
 * meaning and "טקסט לדוגמה" means "sample text". Nobody can learn anything from
 * this card, which is exactly the point — R-010/R-013 forbid sourced content and
 * the loop forbids invented content, so the fixture teaches nothing at all.
 */
const FIXTURE = buildCard(
  {
    headword: 'Lorem',
    translationHe: 'טקסט לדוגמה',
    examples: { supportive: 'The Lorem is only a layout fixture.', neutral: '' },
  },
  'recognition',
  { isFirstEncounter: true },
);

export default function DevCardPage() {
  return (
    <>
      <p className="text-sm text-ink-muted">בדיקת פריסה — אינו תוכן לימודי</p>
      <Flashcard card={FIXTURE} onGrade={() => undefined} />
    </>
  );
}
```

Add to `app/dev/card/layout.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function DevCardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

(Remove the unused `Metadata` import from `page.tsx` — metadata cannot be exported from a
client component, which is why it lives in the layout.)

- [ ] **Step 12: Extend `scripts/verify-mobile.mjs`**

Add `'/study'` and `'/dev/card'` to `ROUTES`, so both inherit every existing width, overflow,
RTL, tap-target and console-error check. Then add inside the per-route loop:

```js
      // T-041: the card is anchored, the reveal is instant, and the grade
      // controls never rely on colour (measured deutan ΔE 4.1 — see palette.ts).
      if (route === '/dev/card') {
        const before = await page.locator('[data-card-back]').count();
        check(before === 0, `${at} answer hidden before reveal`, 'the back was in the DOM already');

        const gap = await page.evaluate(() => {
          const header = document.querySelector('header');
          const front = document.querySelector('[data-card-front]');
          if (!header || !front) return Number.NaN;
          return front.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
        });
        check(gap >= 0 && gap <= 120, `${at} card anchored to top`, `dead band of ${Math.round(gap)}px`);

        await page.locator('[data-reveal]').click();
        const back = await page.locator('[data-card-back]').count();
        check(back === 1, `${at} reveal shows the answer`, 'still hidden after clicking');

        const marked = await page.locator('[data-card-back] strong').innerText();
        check(marked.trim() === 'Lorem', `${at} target word marked in the example`, `marked "${marked}"`);

        for (const grade of ['again', 'good']) {
          const label = await page.locator(`[data-grade="${grade}"]`).innerText();
          check(
            label.replace(/[✓✕\s]/g, '').length > 0,
            `${at} grade "${grade}" carries a text label, not colour alone`,
            `label was "${label}"`,
          );
        }
      }
```

- [ ] **Step 13: Full verification**

Run: `npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile`
Expected: all green. `check:mobile` now covers 8 routes × 3 widths plus the card assertions and
the dark-mode pass from Task 1. Record the final counts in the tick report.

- [ ] **Step 14: Update `docs/api-contract.md`**

No endpoint changed in this task, so add one line under the review-queue section noting that
`/study` renders an empty state until a queue endpoint exists. If you find yourself adding an
endpoint, it belongs in the same commit as the contract change — that rule has no exceptions.

- [ ] **Step 15: Commit**

```bash
git add components/Flashcard.tsx components/EnWord.test.ts app/study/page.tsx \
        app/dev/card/page.tsx app/dev/card/layout.tsx scripts/verify-mobile.mjs \
        docs/api-contract.md
git commit -m "loop(DEV): C-XXXX T-041 flashcard screen — anchored card, instant reveal, labelled grades"
git push origin dev
```

---

## Self-Review

**1. Spec coverage.**

| Requirement | Where |
|---|---|
| T-028: one brand colour + success/error in config | Task 1 Steps 3, 6 |
| T-028: textual logo | **Gap accepted.** The header already carries "אנגלית · מסלול אמיר״ם" as a textual mark; a drawn logo is a `canvas-design` asset task, not a token task. Flagged to the PM rather than invented here. |
| T-028: `prefers-color-scheme: dark` | Task 1 Steps 5, 9 (measured, not declared) |
| T-009: single `<EnWord>` all English passes through | Task 2, enforced by source scan |
| T-041: front bare, example on back, marked target | Task 3 Steps 9, 12 |
| T-041: production card is typed and auto-graded | Task 3 Step 9 (`gradeTypedAnswer`) |
| T-041: reveal never delayed, motion opt-out | Task 1 Step 5 (`prefers-reduced-motion`), Task 3 Step 9 (state, not animation) |
| T-041 precondition TD-11 | Task 3a, its own commit |
| F-011 / F-016 anti-pattern | Task 1 Step 8 + the `card anchored to top` check |
| F-017 `term.replace('.', …)` escapes one dot | Task 2 Step 0 |
| F-014 | Task 1 |

**2. Placeholder scan.** No TBD, no "add error handling", no "tests as above". Every step
carries the code it needs. The two judgement calls are named as judgement calls: the logo gap,
and the single `lang="en"` exemption for the answer input.

**3. Type consistency.** `ThemeMode`, `ColorToken`, `ContrastFloor`, `contrastRatio`,
`tokenValue`, `TextSpan`, `targetForms`, `locateTarget`, `ExampleSegment`, `exampleSegments`,
`EnTextSegment` are spelled identically in every interface block, test and implementation
above. `EnTextSegment` (Task 2) and `ExampleSegment` (Task 3) are structurally identical by
design — `EnText` accepts anything with `{ text, isTarget }`, so core does not import from
`components/` and the purity check stays clean.

**What this plan deliberately does not do.** It ships no learning content and no review queue.
`/study` is honest about being empty because P-001 is real: there is no licensed English↔Hebrew
source yet, and the fixture at `/dev/card` is a ruler, not a lesson.
