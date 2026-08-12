# Navigation Shell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Allowed design skill: `ui-styling` only (PM set it in the T-051/T-052 rows). ⛔ `design-taste-frontend` is not allowed here — this is a shell, not a marketing screen (§ 4.2ב, question 5).

**Goal:** Give the product the two pieces of chrome the PM locked in C-0068 — a **sticky primary action** on every flow screen (D-028, the design half of 🔴 F-027) and the **four-tab shell** (D-027, § 4.2ב) — with the harness measuring both, so neither can silently regress.

**Loop tasks covered:** **T-052** (Task 1) · **T-051** (Tasks 2, 3, 4) · **T-058** (Task 5).

**Why these four together:** they are the same 90 lines of layout. The action bar and the tab bar are both bottom-anchored, both fight the same document-padding problem, both are measured by the same harness block, and D-028 forbids them from ever appearing on the same screen — a rule that can only be written once both exist. T-058 is folded in because it is the same `justify-center` anti-pattern (F-011 → F-016) in the last two files that still carry it, and the new screens must not inherit it.

**Sources — read, not invented:** `plan/40-decisions.md` § 4.2ב (T-051), § 4.2ג (T-052), D-027, D-028 · `plan/35-design-constitution.md` (frozen) · `plan/60-findings.md` F-027 · `plan/50-tasks.md` rows T-051/T-052/T-058. ⛔ No new pedagogical claim, no new external source, no new copy beyond labels that § 4.2ב names.

**Tech Stack:** Next.js App Router (route groups), React server components + two small client components, Tailwind semantic tokens, Vitest for source-level guards, `scripts/verify-mobile.mjs` (Chromium at 320/375/414) for everything geometric.

---

## Global Constraints

- ⛔ **Dev decides no screens, buttons, navigation or flows.** Every route, label and lock state below is copied from § 4.2ב/§ 4.2ג. Where those two disagree with each other, the disagreement is recorded in *Measured conflicts* below and the more specific document wins — it is **not** resolved by inventing a third option.
- **Constitution is law:** `min-h-dvh` never `h-screen` · top anchoring never `justify-center` on a page container · tap targets ≥ 44px · colour is never the only channel · radii from the three allowed values · ⛔ no raw hex in components · ⛔ no emoji as icon (SVG only) · ⛔ no heavy shadow/blur.
- ⛔ **No content, no pedagogy, no `/api/*` behaviour change** except the single `next` value in `POST /api/profile` (Task 3) — and `docs/api-contract.md` is updated **in the same commit** as that change.
- **TDD:** every task starts with a test that fails for the stated reason, and the failure output is recorded in the tick report before the fix.
- Verification before any completion claim: `npm run typecheck && npm run check:core && npm test && npm run build`, plus `npm run check:mobile` for every task here — this plan is almost entirely geometry, and the four commands cannot see geometry.
- ⛔ `/lib/core` stays pure. Nothing in this plan writes a `.ts` file under `lib/core` except reading the two helpers that already exist.
- Commits carry no `[skip ci]`. Push to `dev` only. ⛔ Never `main`.

---

## What is measured, not assumed

Run in this repo on 2026-08-12 (`sed`, `grep -n`, `wc -l`):

| fact | measured value |
|---|---|
| layout column | `app/layout.tsx:35` — `mx-auto flex min-h-dvh w-full max-w-md flex-col`, then `<header>`, `<main className="flex flex-1 flex-col gap-6 px-5 pb-8">` (`:41`), then `<footer>` (`:47`) with the `/sources` link |
| the footer is **after** `<main>` | yes — `app/layout.tsx:41` vs `:47`. Any bottom-anchored bar covers it, not `<main>`'s last child |
| auth submit button | `components/AuthForm.tsx:237-245` — `type="submit"` **with `form="auth-form"`**, so it already works outside the `<form>` element |
| onboarding submit button | `components/OnboardingForm.tsx:154-161` — `type="submit"` **inside** the `<form>`, no `id` on the form, no `form=` attribute |
| study screen action | `app/study/page.tsx:26-33` — `<Link href="/" data-primary-action="true">חזרה למסך הבית</Link>` |
| harness routes | `scripts/verify-mobile.mjs:25-49` `ROUTES` (15 entries) · `:64` `FLOW_ROUTES = ['/', '/signup', '/login', '/dev/onboarding', '/study']` |
| what the harness does with `firstPaintTop` today | **reports it, asserts nothing** (`:319-325` comment, `:397` report line) — deliberately, because moving the action was a PM call |
| the other bound already asserted | `:307` `check(y >= 780 / 2, ...)` — the action must sit in the lower half on `/`, `/login`, `/signup`, `/dev/onboarding`, `/dev/card*` |
| roy's dead end | `firstPaintTop = 852` on a 780px viewport (F-027) |
| `/onboarding` in the harness | answers **307** without Supabase env (TD-13) — measured through the `/dev/onboarding` fixture, which `scripts/verify-mobile.test.ts:190-210` forces to mirror the real screen element-by-element |
| `justify-center` still on a page container | exactly two: `app/loading.tsx:10` · `app/error.tsx:10` (T-058) |
| `POST /api/profile` success body | `app/api/profile/route.ts:72` → `{ ok: true, next: '/study' }`, consumed by `components/OnboardingForm.tsx:69-70` |
| proxy guarding | `proxy.ts:20-21` — `AUTH_SCREENS = ['/signup','/login']`, `PROTECTED_SCREENS = ['/onboarding']`; a signed-in learner on `/`, `/signup`, `/login` is sent to `/onboarding` |
| profile columns available | `daily_minutes` · `exam_date` · `target_score` · `onboarded_at` (`0004_onboarding_answers.sql:16-19`) |
| pure helpers that already exist | `daysUntilExam(examDate, today)` and `daysUntilExamHe(days)` — `lib/core/onboarding.ts:93,126`. ⛔ Do not write a second one |
| suite at plan time | **692 tests · 46 files** (C-0069) |

### Measured conflicts — recorded, not silently resolved

1. **`/world` is a route in the T-051 row and is not a route in § 4.2ב.** The task row lists "ארבעה מסלולים (`/studies` · `/cards` · `/world` · `/me`)"; § 4.2ב says the world tab is `aria-disabled`, that tapping it "**אינה מנווטת לשום מסך ואינה יוצרת עמוד ריק**", and that it opens a one-sentence sheet instead. **This plan follows § 4.2ב** — the detailed UX plan written for this task beats the one-line summary in the queue — and therefore creates **no `app/world` directory**. A `/world` page would be exactly the "בקרוב" screen § 4.2ב forbids. The Critic should confirm; if the PM meant a real route, that is a new task, not a Dev improvisation.
2. **The bottom padding model.** § 4.2ג says "התוכן מקבל `padding-bottom` בגובה הסרגל" — that is the *fixed* bar model, not `position: sticky`. This plan implements a fixed bar. Task 1 records why the sticky-in-flow alternative was rejected by measurement rather than taste.
3. **The hairline condition.** § 4.2ג asks for a thin separator "כשהתוכן נגלל מתחתיה". A CSS-only implementation of *"only while content is underneath"* does not exist; the JS alternative is an IntersectionObserver sentinel in a client component. This plan ships an **always-on hairline** (`border-t border-border-subtle`, one pixel, token colour) and states it here as a deliberate, visible deviation: the prohibition in that sentence is on a heavy shadow, and an always-on hairline satisfies it without adding an observer to a bar that must work with JavaScript disabled (the sign-out form on `/onboarding` does).

---

## What this plan deliberately does NOT do

- ⛔ **No level test, no queue endpoint, no content.** `/studies` and `/cards` render real empty states with one action each — the pattern `app/study/page.tsx` already establishes — and nothing else. `P-001` is untouched.
- ⛔ **No world screen, no "coming soon" page, no date promise.** One sentence in a sheet, one close button.
- ⛔ **No dark-mode work, no tab transition animation, no change to `<Flashcard>`, no change to onboarding's questions, text or field order** (§ 4.2ב/ג "לא בתחולה").
- ⛔ **No `onboarded_at` gate rewrite in `proxy.ts`.** The proxy stays cheap (no DB read per request); the one redirect that has to learn a new destination is `POST /api/profile`'s `next`, plus the onboarding screen's own already-existing session read (Task 3, step 4).
- ⛔ **No new colour, no new radius, no new font.** The constitution is frozen.

---

## File Structure

| File | Responsibility |
|---|---|
| `components/ActionBar.tsx` | **Create.** T-052. Fixed, bottom-anchored, safe-area-aware wrapper for a flow screen's single primary action. Server component — no state, no effects. |
| `components/ActionBar.test.ts` | **Create.** Source guard: fixed + `data-action-bar` + safe area + hairline-not-shadow + the document padding rule. |
| `app/globals.css` | **Modify.** Two `body:has(...)` rules — the document padding for each bar. Nothing else. |
| `components/AuthForm.tsx` | **Modify.** Submit button moves into `<ActionBar>`; it already carries `form="auth-form"`. |
| `components/OnboardingForm.tsx` | **Modify.** `<form id="onboarding-form">`; submit moves into `<ActionBar>` with `form="onboarding-form"`. |
| `app/study/page.tsx` | **Modify.** Existing action moves into `<ActionBar>`. |
| `app/dev/onboarding/page.tsx` | **Modify.** Mirrors the real screen (enforced by an existing test), so it gets the bar too. |
| `components/TabBar.tsx` | **Create.** T-051. Client component (`usePathname` + the world sheet's open/closed state). Four tabs, RTL order locked. |
| `components/TabBar.test.ts` | **Create.** Source guard: four labels in order, `aria-current`, shape-not-colour marker, `aria-disabled` world tab, 44px, `data-tab-bar`. |
| `app/(tabs)/layout.tsx` | **Create.** Renders `{children}` then `<TabBar />`. The route group is what makes "the bar appears on exactly these four screens" structural instead of conditional. |
| `app/(tabs)/studies/page.tsx` | **Create.** לימודים — days-to-exam counter + one action. |
| `app/(tabs)/cards/page.tsx` | **Create.** כרטיסיות — wraps the existing study screen body. |
| `app/(tabs)/me/page.tsx` | **Create.** אני — progress line, sources link, sign-out. |
| `components/StudyEmptyState.tsx` | **Create.** The heading + paragraph shared by `/study` and `/cards`, so the two cannot drift. The **action stays with each route** (they differ, and D-028 forbids a sticky bar on a tab screen). |
| `app/dev/tabs/studies/page.tsx` · `app/dev/tabs/me/page.tsx` | **Create.** Harness fixtures — both real screens read the session and answer 307 without Supabase env (the F-027 cause-1 lesson). |
| `proxy.ts` | **Modify.** `PROTECTED_SCREENS` gains the three tab routes. |
| `app/api/profile/route.ts` | **Modify.** `next: '/study'` → `next: '/studies'` (§ 4.2ב flow 1). |
| `docs/api-contract.md` | **Modify.** Same commit as the line above. |
| `scripts/verify-mobile.mjs` | **Modify.** New assertion on `firstPaintTop`; footer-not-covered check; `TAB_ROUTES` block; the two-bars-never-together check; new routes in `ROUTES`. |
| `scripts/verify-mobile.test.ts` | **Modify.** Guards for each of the above, plus the fixture-mirror pattern extended to the two new fixtures. |
| `app/loading.tsx` · `app/error.tsx` | **Modify.** T-058 — `justify-center` → top anchoring. |
| `lib/core/**` | **Not touched.** |

---

## Interfaces

```ts
// components/ActionBar.tsx — server component, no 'use client'
export default function ActionBar({ children }: { children: React.ReactNode }): React.JSX.Element;
// Renders, and the test locks this shape:
//   <div data-action-bar="true"
//        className="fixed inset-x-0 bottom-0 z-20 border-t border-border-subtle bg-surface">
//     <div className="mx-auto w-full max-w-md px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
//       {children}
//     </div>
//   </div>

// components/TabBar.tsx — 'use client' (usePathname + sheet state)
export type TabId = 'studies' | 'cards' | 'world' | 'me';
export const TABS: readonly { id: TabId; href: string | null; labelHe: string }[];
//   RTL order, rightmost first (D-027): studies · cards · world(href:null) · me
export default function TabBar(): React.JSX.Element;

// components/StudyEmptyState.tsx — server component, presentation only, no action
export default function StudyEmptyState(): React.JSX.Element;
```

```css
/* app/globals.css — the document padding for a bottom-anchored bar.
   It belongs to the scroll container and NOT to <main>: the footer link
   (T-011, present on every screen) is a sibling AFTER <main>, so a spacer
   inside <main> leaves that link under the bar at full scroll. */
body:has([data-action-bar]) { padding-bottom: calc(5rem + env(safe-area-inset-bottom)); }
body:has([data-tab-bar])    { padding-bottom: calc(4.5rem + env(safe-area-inset-bottom)); }
```

---

## Task 1 — T-052 · the sticky action bar (closes the design half of 🔴 F-027)

**Done when:** on `/`, `/signup`, `/login`, `/dev/onboarding` and `/study`, at 320/375/414, the single `data-primary-action` element paints inside the first viewport, the `/sources` link is still reachable, and the harness fails if either stops being true.

- [x] **1.1 (2 min) — Make the harness demand it, and watch it fail.** In `scripts/verify-mobile.mjs`, inside the `FLOW_ROUTES` block: add `viewportHeight: window.innerHeight` to the object returned by `page.evaluate`, then add, next to the existing `reachable` check:

```js
          // F-027, the half that was a PM decision until D-028 settled it: the
          // action must be IN the first viewport, not merely reachable from it.
          // roy measured 852 against 780 on /onboarding and read the product as
          // broken. The lower bound (`y >= 780/2`, thumb reach) is still checked
          // above; this is the upper bound, and a bar that satisfies both can
          // only be bottom-anchored.
          check(
            primary.firstPaintTop < primary.viewportHeight,
            `${at} primary action visible without scrolling`,
            `"${primary.text}" first paints at y=${primary.firstPaintTop} on a ${primary.viewportHeight}px viewport`,
          );
```

  Replace the paragraph at `:319-325` that says this is deliberately not asserted with one line pointing at D-028. Run `npm run build && npm run check:mobile`. **Expected failure, recorded verbatim in the tick report:** `/dev/onboarding` (and any other screen taller than the fold) fails with a real `y=` number. ⛔ If nothing fails, stop — the check is not measuring anything and the rest of this task is unfalsifiable.

- [x] **1.2 (3 min) — `components/ActionBar.tsx`,** exactly the shape in *Interfaces*. Header comment: D-028, why fixed and not sticky (see 1.3), why the hairline is always on (conflict 3 above).

- [x] **1.3 (2 min) — The document padding, in `app/globals.css`,** exactly the two rules in *Interfaces* (add the `[data-tab-bar]` rule now, unused until Task 2 — one place, one concept). Comment records the rejected alternative **with its measurement**: a spacer `<div>` at the end of `<main>` shifts the covered strip onto `<footer>`, which is a sibling after `<main>`, so the `/sources` link — the one link T-011 requires on every screen — ends up under the bar at full scroll.

- [x] **1.4 (2 min) — `components/ActionBar.test.ts`,** the file in *Interfaces*:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const bar = readFileSync('components/ActionBar.tsx', 'utf8');
const css = readFileSync('app/globals.css', 'utf8');

describe('the flow-screen action bar (D-028 · F-027)', () => {
  it('anchors to the window, not to the end of the content', () => {
    expect(bar).toMatch(/fixed[^"'`]*bottom-0/);
  });

  it('marks itself, so the harness and the page padding can both find it', () => {
    expect(bar).toContain('data-action-bar');
  });

  it('keeps clear of the home indicator', () => {
    expect(bar).toContain('env(safe-area-inset-bottom)');
  });

  it('separates with a hairline and never with a shadow (constitution § 6)', () => {
    expect(bar).toContain('border-t');
    expect(bar).not.toMatch(/shadow-(sm|md|lg|xl|2xl)/);
  });

  it('pads the scroll container, not <main> — the footer link sits after <main>', () => {
    expect(css).toContain('body:has([data-action-bar])');
    expect(css).toMatch(/body:has\(\[data-action-bar\]\)[^}]*env\(safe-area-inset-bottom\)/);
  });

  it('is a server component: the sign-out form on /onboarding must work without JS', () => {
    expect(bar).not.toContain("'use client'");
  });
});
```

- [x] **1.5 (3 min) — Wire the four screens.** `components/AuthForm.tsx`: wrap the submit button in `<ActionBar>` (it already carries `form="auth-form"`, so it may leave the `<form>`; the secondary link below it stays where it is). `components/OnboardingForm.tsx`: give the form `id="onboarding-form"`, move the submit into `<ActionBar>` with `form="onboarding-form"`. `app/study/page.tsx`: move the existing `<Link data-primary-action>` into `<ActionBar>`. `app/page.tsx`: wrap the `בואו נתחיל` link (keep the secondary `/login` link outside the bar — one action per bar).
- [x] **1.6 (2 min) — Mirror it into the fixture.** `app/dev/onboarding/page.tsx` renders `<OnboardingForm />`, so the bar arrives for free; verify by reading the file, and add `'ActionBar'` to the mirrored-element list in `scripts/verify-mobile.test.ts:194` **only if** the real screen names it directly. If it does not, leave that list alone — a false mirror assertion is worse than none.
- [x] **1.7 (2 min) — Footer-not-covered check** in the same `FLOW_ROUTES` block:

```js
        const footer = await page.evaluate(() => {
          const bar = document.querySelector('[data-action-bar]');
          if (!bar) return { noBar: true };
          window.scrollTo(0, document.documentElement.scrollHeight);
          const link = document.querySelector('footer a[href="/sources"]');
          if (!link) return { noLink: true };
          const l = link.getBoundingClientRect();
          const b = bar.getBoundingClientRect();
          window.scrollTo(0, 0);
          return { clear: Math.round(l.bottom) <= Math.round(b.top) + 1, linkBottom: Math.round(l.bottom), barTop: Math.round(b.top) };
        });
        if (!footer.noBar && !footer.noLink) {
          check(footer.clear, `${at} action bar does not cover the licence link`, `link bottom ${footer.linkBottom} vs bar top ${footer.barTop}`);
        }
```

- [x] **1.8 (4 min) — Verify + two mutations.** Run all five commands. Then: ⓐ delete the `body:has([data-action-bar])` rule → **1.7 must fail** with real numbers; ⓑ change `fixed` to `static` in `ActionBar` → **1.1's new check must fail** on the tall screen. Restore, re-run, record both failure lines. A mutation that kills nothing means the check is decorative — say so in the report instead of hiding it.

---

## Task 2 — T-051 · the tab bar and the two content tabs

**Done when:** `/studies` and `/cards` exist, carry the four-tab bar, and carry **no** action bar.

- [x] **2.1 (3 min) — `components/TabBar.test.ts` first** (fails: no such file):

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const src = readFileSync('components/TabBar.tsx', 'utf8');

describe('the four-tab shell (D-027 · § 4.2ב)', () => {
  it('carries exactly the four locked labels', () => {
    for (const label of ['לימודים', 'כרטיסיות', 'העולם', 'אני']) expect(src).toContain(label);
  });

  it('keeps the RTL order: studies is first, me is last', () => {
    const order = ['לימודים', 'כרטיסיות', 'העולם', 'אני'].map((l) => src.indexOf(l));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((i) => i > -1)).toBe(true);
  });

  it('has no fifth tab', () => {
    expect(src.match(/labelHe:/g)?.length).toBe(4);
  });

  it('marks the active tab by state and shape, never by colour alone (constitution § 1)', () => {
    expect(src).toContain('aria-current');
    expect(src).toMatch(/aria-current[\s\S]{0,400}(border-t-2|h-1|rounded-full)/);
  });

  it('locks the world tab instead of navigating to an empty screen', () => {
    expect(src).toContain('aria-disabled');
    expect(src).toMatch(/href:\s*null/);
  });

  it('keeps every tap target at the 44px floor', () => {
    expect(src).toContain('min-h-touch');
  });

  it('marks itself for the harness and the document padding', () => {
    expect(src).toContain('data-tab-bar');
  });
});
```

- [x] **2.2 (5 min) — `components/TabBar.tsx`.** `'use client'`. `TABS` exactly as in *Interfaces*. Each tab: `<Link>` for the three real ones, `<button type="button" aria-disabled="true">` for העולם. Active = `pathname === href` → `aria-current="page"` + a 2px top indicator bar **and** a font-weight change (two non-colour channels). Lock icon: inline SVG, ⛔ never an emoji. Tapping העולם opens a bottom sheet: one sentence — `העולם ייפתח כשיהיה בו תוכן.` — and one `סגירה` button. ⛔ No date, no "בקרוב" screen.
- [x] **2.3 (2 min) — `app/(tabs)/layout.tsx`:** `<>{children}<TabBar /></>`. The route group is the structural guarantee that flow screens can never receive it.
- [x] **2.4 (3 min) — `components/StudyEmptyState.tsx` + `app/(tabs)/cards/page.tsx`.** Move the heading and paragraph out of `app/study/page.tsx` into the shared component; both routes render it. `/study` keeps its `חזרה למסך הבית` action inside `<ActionBar>` (flow screen). `/cards` renders `<Link href="/studies" data-primary-action="true">התחלת מנה יומית</Link>` **without** an ActionBar — D-028 forbids two bars, and § 4.2ב question 6 says a tab is a final destination that needs no "back". Record this label choice in the tick report: it reuses the `/studies` action's own label rather than minting new copy.
- [x] **2.5 (4 min) — `app/(tabs)/studies/page.tsx`.** Server component, same session pattern as `app/onboarding/page.tsx` (`readSupabaseEnv` → `createRouteClient` → `getUser`, redirect to `/login?expired=1` when either is missing). Read `exam_date` from `profiles`; render `daysUntilExamHe(daysUntilExam(examDate, todayIso))` when it is set, and the neutral line when it is not (⛔ no invented estimate). One action: `<Link href="/cards" data-primary-action="true">התחלת מנה יומית</Link>`. Top-anchored, ⛔ no `justify-center`.
- [x] **2.6 (2 min) — Verify.** Five commands. `/studies` and `/cards` are not in `ROUTES` yet, so `check:mobile` cannot see them — that is Task 4, and until then ⛔ no claim about their geometry.

---

## Task 3 — T-051 · `/me`, the guard, and the one endpoint value

- [ ] **3.1 (3 min) — `app/(tabs)/me/page.tsx`.** Same session pattern. Contents, exactly what § 4.2ב assigns to אני: one progress line (words learned — `0` today, read from `word_progress`; ⛔ no predicted score, ⛔ no readiness estimate, 4.4.3), the `/sources` link, and the sign-out form moved from `app/onboarding/page.tsx`. The sign-out submit carries `data-primary-action="true"` — it is the only action on the screen — and, per D-028, sits in normal flow, not in an ActionBar.
- [ ] **3.2 (2 min) — `proxy.ts`:** `PROTECTED_SCREENS = ['/onboarding', '/studies', '/cards', '/me']`. `isProtectedPath` already prefix-matches, and `proxy.test.ts` already exercises it — extend that test with one case per new route.
- [ ] **3.3 (2 min) — `app/api/profile/route.ts`:** `next: '/studies'`. Update `docs/api-contract.md` **in the same commit**. Add the assertion to the route's existing test file so the string cannot drift back.
- [ ] **3.4 (2 min) — The landing after onboarding.** `components/OnboardingForm.tsx` already navigates to `result.next`, so 3.3 is the whole change. ⛔ Do not add a second redirect and ⛔ do not touch `proxy.ts`'s `/` → `/onboarding` rule: sending a signed-in learner past onboarding requires reading `onboarded_at` per request, which is a DB call in the proxy and a PM-scale decision. Record it as one line of debt in `plan/30-architecture.md`.
- [ ] **3.5 (2 min) — Verify.** Five commands.

---

## Task 4 — T-051 · make the harness see the shell

- [ ] **4.1 (3 min) — Fixtures.** `app/dev/tabs/studies/page.tsx` and `app/dev/tabs/me/page.tsx`: `noindex`, no `createRouteClient`, rendering the same components as the real screens with a fixed sample exam date. This is the F-027 cause-1 lesson: a session-gated route answers 307 and the harness silently measures `/login` instead.
- [ ] **4.2 (2 min) — Mirror tests** in `scripts/verify-mobile.test.ts`, copied from the `/dev/onboarding` block at `:190-210`: each fixture renders what the real screen renders, and **must not** contain `createRouteClient`.
- [ ] **4.3 (4 min) — `scripts/verify-mobile.mjs`:** add `/cards`, `/dev/tabs/studies`, `/dev/tabs/me` to `ROUTES`; add `const TAB_ROUTES = ['/cards', '/dev/tabs/studies', '/dev/tabs/me'];` beside `FLOW_ROUTES` with a comment naming D-027. In the per-route loop:

```js
      if (TAB_ROUTES.includes(route)) {
        const tabs = await page.evaluate(() => {
          const bar = document.querySelector('[data-tab-bar]');
          if (!bar) return { present: false };
          const items = [...bar.querySelectorAll('a,button')];
          return {
            present: true,
            count: items.length,
            small: items
              .map((el) => el.getBoundingClientRect())
              .filter((r) => r.width < 44 || r.height < 44).length,
            actionBars: document.querySelectorAll('[data-action-bar]').length,
          };
        });
        check(tabs.present, `${at} tab bar is present`, 'no [data-tab-bar] in the document');
        if (tabs.present) {
          check(tabs.count === 4, `${at} exactly four tabs`, `found ${tabs.count}`);
          check(tabs.small === 0, `${at} every tab >= 44px`, `${tabs.small} tabs below the floor`);
          // D-028: a screen never carries both bars.
          check(tabs.actionBars === 0, `${at} no action bar on a tab screen`, `found ${tabs.actionBars}`);
        }
      }

      if (FLOW_ROUTES.includes(route)) {
        const strayTabBar = await page.evaluate(() => document.querySelectorAll('[data-tab-bar]').length);
        check(strayTabBar === 0, `${at} no tab bar on a flow screen`, `found ${strayTabBar}`);
      }
```

- [ ] **4.4 (2 min) — Guard the wiring** in `scripts/verify-mobile.test.ts`: `TAB_ROUTES` exists, contains the three routes, and the source contains `no action bar on a tab screen` — the D-028 rule has to be greppable, because it is the one rule two separate features can break.
- [ ] **4.5 (4 min) — Verify + two mutations.** Five commands. Then: ⓐ render `<TabBar />` from `app/layout.tsx` instead of `app/(tabs)/layout.tsx` → the flow-screen check must fail on `/`, `/signup`, `/login`, `/study`; ⓑ delete one entry from `TABS` → `exactly four tabs` and the unit test both fail. Restore, re-run, record.

---

## Task 5 — T-058 · the last two `justify-center` containers

- [ ] **5.1 (2 min) — Failing guard first,** appended to `scripts/verify-mobile.test.ts`:

```ts
describe('page containers are anchored to the top, never centred (F-011 · F-016)', () => {
  const files = ['app/loading.tsx', 'app/error.tsx', 'app/page.tsx', 'app/study/page.tsx'];
  for (const file of files) {
    it(`${file} does not centre its page container`, () => {
      const src = readFileSync(file, 'utf8');
      // `items-center justify-center` inside a button/link centres a LABEL and is fine;
      // `flex-1 … justify-center` on the page column is the dead-band defect.
      expect(src).not.toMatch(/flex-1[^"'`]*justify-center/);
    });
  }
});
```

- [ ] **5.2 (2 min) — Fix both files:** `flex flex-1 flex-col justify-center gap-4` → `flex flex-1 flex-col gap-4` in `app/loading.tsx:10` and `app/error.tsx:10`.
- [ ] **5.3 (3 min) — Verify.** Five commands, and confirm the harness's existing `heading anchored to top` check still passes on every route (it already covers every screen with an `h1`, T-028).

---

## Self-check before the handoff

Answer each in the tick report with a number or a quoted line — ⛔ not with "yes":

1. What did `check:mobile` print for `primary action visible without scrolling` on `/dev/onboarding` **before** Task 1.2, and what does it print now?
2. What is the `firstPaintTop` of each flow screen's action at 375px now, and is every one of them below `window.innerHeight` and above `390`?
3. Which mutation killed which check, by name, in 1.8 and 4.5? Any mutation that killed nothing — say so.
4. Test count before and after (baseline: 692 / 46 files).
5. Does any screen carry both `[data-action-bar]` and `[data-tab-bar]`? Which check answers that, and did it run?
6. Was `docs/api-contract.md` changed in the same commit as `app/api/profile/route.ts`?
7. Did anything under `lib/core` change? (Expected: no. `check:core` output pasted either way.)
8. Which of the three recorded conflicts did the implementation touch, and did it resolve any of them by inventing a third option? (Expected: no.)
