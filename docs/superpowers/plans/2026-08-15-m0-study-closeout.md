# M0 close-out — the finish state, the loading skeleton, and the milestone audit · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. One task per Dev tick.

**Goal:** Close the last two open M0 rows and then prove M0 is actually finished. Both rows carry a ⛔ whose stated blocker is **measurably gone** — T-055 has been unblocked since `2026-08-13T15:53:21Z` and T-054 since `2026-08-13T18:48:51Z` — and the milestone has been sitting behind two stale gates for ~35 cycles while `MILESTONE_TICKS` climbed 60 → 87.

**Architecture:** Three tasks, in dependency order. Task 1 turns the `<CardDeck>` completion branch from an admitted placeholder into the finish state § 4.2ו decided, and — because «מסך סיום ולא מסך לבן» is a claim about pixels — adds the `/dev/deck/done` fixture that lets the harness measure it at 320/375/414. Task 2 extracts the loading skeleton that already ships inside `<StudyDeckScreen>` into `components/CardSkeleton.tsx` (the file T-054's own Files column names), replaces a one-string source guard with a real one, and measures it through `/dev/deck/skeleton`. Task 3 writes no product code: it walks every M0 row against the code and reports, so the Critic can decide `MILESTONE_DONE` from evidence instead of from the table's own say-so.

**Tech Stack:** Next.js App Router · TypeScript strict, no `any` · Tailwind with the frozen constitution tokens · vitest (`environment: 'node'`, **no jsdom** — component tests are source guards) · Playwright through `npm run check:mobile`.

**Spec:** `plan/40-decisions.md` **§ 4.2ו** (the UX plan for the decks — questions 2 and 6, and the `מצבי קצה` block) · `plan/35-design-constitution.md` § 5 (motion) · `plan/50-tasks.md` T-054 · T-055 · `plan/60-findings.md` F-032 · `plan/RULES.md` § 0.1.1. **Executors read the spec and this plan together.**

**Tasks covered:** `T-055` (task 1) · `T-054` (task 2) · **M0 audit + F-032 closure** (task 3).

---

## Measurements this plan rests on

Every number below was produced by a command in the planning tick (C-0135, `date -u` 03:36→03:5xZ). ⛔ None is estimated.

| Claim | Command | Result |
|---|---|---|
| T-055's blocker (F-032) died 3½ minutes after it was opened | `git log --format='%h %ad %s' --date=iso -S "F-032" -- plan/60-findings.md` and `git log -1 --date=iso 5a86a28` | F-032 opened in `c4f40df` at **2026-08-13T15:49:54Z**; the PM's § 4.2ו — which contains «בסוף המחזור **מסך סיום** (T-055)» — landed in `5a86a28` at **2026-08-13T15:53:21Z** |
| T-054's blocker («אין endpoint של תור») died the same evening | `git log --diff-filter=A -- app/api/study/queue/route.ts` | `e1fd933`, **2026-08-13T18:48:51Z** — `GET` exists (`app/api/study/queue/route.ts:288`) |
| T-054's *substance* already shipped, unrecorded | `git log -S "data-deck-skeleton" -- components/StudyDeckScreen.tsx` | `4dbc314`, **2026-08-13T23:03:59Z** (C-0102) — the skeleton is live in the `loading` branch |
| The finish state exists but is declared a placeholder | `components/CardDeck.tsx` completion branch | «⛔ NOT the finish screen. T-055 is blocked on F-032» + `components/CardDeck.test.ts:169` asserts the deck **invents no finish screen** |
| The whole T-054 guard is one string | `components/StudyDeckScreen.test.ts:152–155` | `toContain('data-deck-skeleton')` + `not.toContain('animate-spin')` — proves neither «not blank» nor «shaped like a card» |
| The finish state has never been rendered at any width | `grep -n "data-deck-done" scripts/verify-mobile.mjs` | **0 hits.** `/dev/deck` ships two ungraded fixture cards, so `remaining.length === 0` is unreachable there |
| Nothing else in M0 is open to a Dev | status column of `plan/50-tasks.md` | M0 rows are ✅ except T-019 (needs live Supabase credentials — not runnable in the loop) and T-046 (Roy's Netlify token) |

---

## Global Constraints

Copied verbatim from the governing documents. Every task's requirements implicitly include this section.

- ⛔ **Dev implements, and ⛔ never designs.** Every sentence, every action and every destination in task 1 must be traceable to § 4.2ו or to text already on the screen. T-055: «⛔ אין מספרים חדשים ואין הבטחה — **טקסט קיים בלבד**». If something is needed that no decision names, it becomes a line in `plan/03-for-roy.md` or a finding against the PM — ⛔ never a sentence the Dev wrote.
- **What § 4.2ו actually decided, quoted, because task 1 may use nothing else:**
  - q2 — «מונה החפיסה יורד בזמן אמת, ובסוף המחזור **מסך סיום** (T-055)»
  - q6 — «**יוצאים** — מסך הסיום, ומשם **חזרה לבורר**» (the בורר is `/cards`)
  - מצבי קצה — «המילה האחרונה — **מסך סיום ולא מסך לבן**» · «טעינה — **שלד בצורת הכרטיס, ⛔ לא ספינר** (חוקה § 5)»
  - לא בתחולה — «⛔ אין ניקוד/רצפים/גיימיפיקציה (T-032) · ⛔ **אין שינוי ב-`Flashcard.tsx` עצמו** · ⛔ אין תוכן חדש · ⛔ אין מצב כהה»
- ⛔ **`Flashcard.tsx` is not touched by any task in this plan.** § 4.2ו names it in `לא בתחולה`.
- **Constitution § 5 (frozen):** 150–300ms · one easing · `prefers-reduced-motion` always honoured · ⛔ animation never delays content. ⛔ The constitution file is never edited by the Dev; a contradiction is recorded as a finding.
- ⛔ **No raw hex** in `components/` or `app/**/*.tsx` (constitution § 6). Colour arrives as a token.
- **Constitution § 3 — exactly three radii:** `rounded-md` · `rounded-lg` · `rounded-2xl`. `scripts/radius-hygiene.test.ts` enforces it and will fail the build on a fourth.
- ⛔ **`/lib/core` stays pure**: no React, no `window`, no `document`, no `localStorage`, no `fetch`, no `process.env`. `npm run check:core` enforces it.
- **Mobile-first.** 375px is the design width; 320 / 375 / 414 are measured. Tap targets ≥44×44px, ≥8px apart. Zero horizontal scroll. RTL.
- **Fixtures are not learning content.** `/dev/*` pages are noindex, unlinked, and use the same non-words the sibling fixtures use (`Lorem`/`Ipsum`, «טקסט לדוגמה»). ⛔ R-010/R-013 forbid sourced content and the loop forbids invented content.
- **A test that cannot fail is not a test (F-039 · F-043).** Every guard added here is proved by a **mutation that is actually run**: break the thing on purpose, watch the named failure, restore, re-run. The mutation and its exact failure line go into the tick report. ⚠️ Restore with `git stash pop` or by re-editing — ⛔ **never `git checkout -- <file>`**, which deleted an entire tick's work in C-0134.
- **Commits:** `loop(DEV): C-XXXX <summary>`, pushed to `dev`. ⛔ Never `main`. ⛔ Never `[skip ci]`.
- **The verification command, run fresh, in the same message as any success claim:**
  `npm run typecheck && npm run check:core && npm test && npm run build`
  plus `npm run check:mobile` for tasks 1 and 2.

---

## File Structure

| File | Task | Responsibility |
|---|---|---|
| `components/CardDeck.tsx:98–113` | 1 | The completion branch becomes the finish state: deck identity from the strings already on screen, one way out to the בורר. |
| `components/CardDeck.test.ts:169–176` | 1 | The guard flips from «invents no finish screen» to «IS the finish state»: distinct from empty, one primary action, ⛔ still no score/streak/percentage. |
| `app/dev/deck/done/page.tsx` | 1 | **Create.** Renders `<CardDeck>` with an empty `cards` array so `remaining.length === 0` is reachable by the harness. |
| `scripts/verify-mobile.mjs` | 1, 2 | Two new routes in `ROUTES` + a `/dev/deck/done` block and a `/dev/deck/skeleton` block that measure «not blank». |
| `components/CardSkeleton.tsx` | 2 | **Create.** The card-shaped loading placeholder, extracted verbatim from `StudyDeckScreen`'s `loading` branch. Renders nothing else; fetches nothing. |
| `components/CardSkeleton.test.ts` | 2 | **Create.** Source guard: three boxes, `role="status"` sentence, ⛔ no spinner, ⛔ no animation that delays content. |
| `components/StudyDeckScreen.tsx:196–208` | 2 | The inline skeleton markup is replaced by `<CardSkeleton />`. ⛔ No behaviour change. |
| `components/StudyDeckScreen.test.ts:152–155` | 2 | The one-string guard is replaced by a brace-extracted assertion on the `loading` branch. |
| `app/dev/deck/skeleton/page.tsx` | 2 | **Create.** Renders `<CardSkeleton />` alone. |
| `plan/50-tasks.md` · `plan/60-findings.md` · `plan/30-architecture.md` · `plan/00-control.md` | 1, 2, 3 | Row statuses, F-032 closure, the M0 audit table. |

---

## Task 1: The finish state — T-055

**Files:**
- Modify: `components/CardDeck.tsx:98–113` (the `remaining.length === 0` branch)
- Modify: `components/CardDeck.test.ts:169–176` (the test named `ends with a heading and a way out…`)
- Create: `app/dev/deck/done/page.tsx`
- Modify: `scripts/verify-mobile.mjs` (`ROUTES` — add `'/dev/deck/done'`; and a measurement block beside the existing `if (route === '/dev/deck')` at ~line 1023)
- Modify: `plan/50-tasks.md` (T-055 row) · `plan/60-findings.md` (F-032 row)

**Interfaces:**
- Consumes: `CardDeck({ deck, cards, onGraded })` from `components/CardDeck.tsx` — `deck: DeckName` (`'due' | 'unknown'`), `cards: readonly QueueCardInput[]`, `onGraded: (wordId: string, grade: CardGrade) => Promise<void>`. Both types come from `@/lib/core/deck` and `@/lib/core/flashcard`.
- Produces: the DOM contract the harness and task 3 rely on — the finish state carries **`data-deck-done`** on its `<section>`, **`data-deck={deck}`** for identity, and exactly one **`data-primary-action="true"`** whose `href` is `/cards`. ⛔ These three attribute names are fixed here and used verbatim in task 3's audit.

### What changes, and why it is not a design decision

The branch today renders `סיימת` + a link to `/cards`, under a comment that says it is deliberately **not** the finish screen. Three things are wrong with it, and each correction is quoted from a decision:

1. **It drops the deck identity.** The scrolling state renders a header carrying either `מנת היום` or `תרגול — לא משנה את מועד החזרה`; at `remaining.length === 0` that header disappears, so a learner who finished the practice deck and a learner who finished today's dose read the identical screen. § 4.2ו q6 makes the finish state the **exit point of a specific deck**, and D-033's promise («תרגול — לא משנה את מועד החזרה») is required to be true «על הכרטיס שהלומד מסתכל עליו». The fix reuses **the same two strings that are already in this file** — ⛔ no new copy, satisfying T-055's «טקסט קיים בלבד».
2. **It is indistinguishable from empty in the DOM.** F-032 asks exactly «מה מבדיל `done` מ-`empty`». `data-deck-done` already exists on the node; the test does not assert it, and nothing measures it. After this task, `done` (a section with `data-deck-done` and a link to the בורר) and `empty` (`<StudyEmptyState>` + `<ActionBar>` in `StudyDeckScreen`) are two shapes a test can tell apart.
3. **«ולא מסך לבן» has never been measured.** `/dev/deck` ships two ungraded cards, so this branch is unreachable at 320/375/414.

⛔ **Not in this task:** any sentence not already in `components/CardDeck.tsx`; any number; any streak, score, percentage or readiness claim (§ 4.2ו `לא בתחולה` · T-032); any change to `Flashcard.tsx`; any change to `StudyEmptyState.tsx`.

- [x] **Step 1: Write the failing test**

Replace the test at `components/CardDeck.test.ts:169–176` (`ends with a heading and a way out, and ⛔ invents no finish screen (T-055 · F-032)`) with:

```ts
  it('IS the finish state now — deck identity, one way out to the בורר (T-055 · § 4.2ו)', () => {
    // F-032 was opened 2026-08-13T15:49:54Z and the PM's § 4.2ו landed 15:53:21Z — three
    // minutes later. The finish state is decided: «בסוף המחזור מסך סיום», «יוצאים — מסך
    // הסיום, ומשם חזרה לבורר», «המילה האחרונה — מסך סיום ולא מסך לבן».
    const done = braceRegion(CODE, 'if (remaining.length === 0) {');

    // ⓐ Distinguishable from `empty` in the DOM — that is literally F-032's question.
    expect(done).toContain('data-deck-done');
    expect(done).toContain('סיימת');

    // ⓑ Deck identity, built from the two strings this file ALREADY renders in its header.
    //    A learner who finished תרגול and one who finished מנת היום must not read the same
    //    screen, and D-033's promise has to hold on the screen the learner is looking at.
    expect(done).toContain(PRACTICE_LABEL);
    expect(done).toContain('מנת היום');

    // ⓒ Exactly one way out, and it goes to the בורר (§ 4.2ו q6).
    expect(done).toContain('href="/cards"');
    expect(done.match(/data-primary-action/g)?.length, 'exactly one primary action').toBe(1);

    // ⓓ ⛔ Still nothing the PM did not decide. T-055: «אין מספרים חדשים ואין הבטחה».
    for (const invented of ['רצף', 'ניקוד', 'מוכנות', 'כל הכבוד', '%']) {
      expect(done, `"${invented}" is a claim no decision makes`).not.toContain(invented);
    }
    // ⛔ No count either: `data-remaining` belongs to the scrolling header, and a "0 נותרו"
    //    on the finish state would be a new number on a screen that forbids new numbers.
    expect(done).not.toContain('data-remaining');
  });
```

⚠️ `PRACTICE_LABEL` is already defined at the top of `components/CardDeck.test.ts` (it is used by the `unknown`-branch containment test). Do not redeclare it. If `braceRegion`'s first argument does not match the source exactly, the helper's own `expect` reports `expected to find … in CardDeck.tsx` — copy the opening line from `components/CardDeck.tsx` verbatim.

- [x] **Step 2: Run the test and watch it fail**

Run: `npx vitest run components/CardDeck.test.ts -t 'IS the finish state'`
Expected: **FAIL** on ⓑ — the current branch contains neither `מנת היום` nor the practice label. The reported line is the `expect(done).toContain(PRACTICE_LABEL)` assertion.

- [x] **Step 3: Rewrite the completion branch**

In `components/CardDeck.tsx`, replace the whole `if (remaining.length === 0) { … }` block (currently lines 98–113) with:

```tsx
  if (remaining.length === 0) {
    return (
      // The finish state — T-055, § 4.2ו («בסוף המחזור מסך סיום» · «יוצאים — מסך הסיום,
      // ומשם חזרה לבורר» · «המילה האחרונה — מסך סיום ולא מסך לבן»).
      //
      // Two decisions here are quotations, ⛔ not taste:
      //
      // 1. **The deck says which deck it was, using the two strings already in this file.**
      //    The scrolling header carries «מנת היום» or the D-033 practice notice; dropping
      //    both at remaining=0 made the two decks end on one identical screen, and D-033's
      //    promise is required to hold on the screen the learner is looking at. ⛔ No new
      //    sentence is minted: T-055 says «טקסט קיים בלבד», so this reuses the header's own.
      //
      // 2. **One way out, and it goes to the בורר.** § 4.2ו q6 fixes the exit as `/cards`.
      //    ⛔ No count, no streak, no score, no readiness (`לא בתחולה` · T-032) — the finish
      //    state is a closure, and a number here would be a claim no decision makes.
      <section className="flex flex-col gap-4" data-card-deck={deck} data-deck-done>
        <p className="text-base text-ink-muted">
          {deck === 'unknown' ? 'תרגול — לא משנה את מועד החזרה' : 'מנת היום'}
        </p>
        <h1 className="text-3xl font-bold leading-tight text-ink">סיימת</h1>
        <Link
          href="/cards"
          data-primary-action="true"
          className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          חזרה לכרטיסיות
        </Link>
      </section>
    );
  }
```

⚠️ The literal `'תרגול — לא משנה את מועד החזרה'` now appears **twice** in the file. `components/CardDeck.test.ts` contains a containment test asserting the practice label is reachable only from the `unknown` branch — it extracts `{deck === 'unknown' ? …}` by braces, and the new occurrence is inside its own `deck === 'unknown' ? …` ternary, so it stays inside a gated region. **Run the whole file, not just the new test** (step 4) — if that guard goes red, the containment claim it makes is the one to re-read, ⛔ not to relax.

- [x] **Step 4: Run the whole test file**

Run: `npx vitest run components/CardDeck.test.ts`
Expected: **PASS**, every test in the file.

- [x] **Step 5: Prove the new guard can fail — mutation 1 of 2**

Delete the `<p>` identity line from the branch. Run `npx vitest run components/CardDeck.test.ts -t 'IS the finish state'`.
Expected: **FAIL** naming `toContain(PRACTICE_LABEL)`. Restore by re-adding the line (⛔ not `git checkout`).

- [x] **Step 6: Prove the new guard can fail — mutation 2 of 2**

Change the link to `href="/study"`. Run the same command.
Expected: **FAIL** naming `toContain('href="/cards"')`. Restore. Re-run: **PASS**.

- [x] **Step 7: Create the harness fixture**

Create `app/dev/deck/done/page.tsx`:

```tsx
'use client';

import CardDeck from '@/components/CardDeck';

/**
 * Layout fixture for `check:mobile` — the finish state of the deck (T-055 · § 4.2ו).
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * `/dev/deck` ships two ungraded cards, so `remaining.length === 0` is unreachable there and
 * «מסך סיום ולא מסך לבן» has never been rendered at 320/375/414 — it was believed, not
 * measured. An empty `cards` array reaches the branch directly and ⛔ without a scripted
 * click, which would make the harness depend on grading succeeding against a stub.
 *
 * `deck="unknown"` and ⛔ not `due`: the practice deck is the branch that carries the D-033
 * notice, so the wider of the two identity lines is the one whose wrapping gets measured at
 * 320px.
 */
export default function DevDeckDonePage() {
  return (
    <CardDeck
      deck="unknown"
      cards={[]}
      // Never called — the deck is already empty. It exists to satisfy the prop type.
      onGraded={() => Promise.resolve()}
    />
  );
}
```

- [x] **Step 8: Add the route and its measurement to the harness**

In `scripts/verify-mobile.mjs`, add `'/dev/deck/done'` to `ROUTES` immediately after `'/dev/deck'` (line 46), with this comment above it:

```js
  // T-055 · § 4.2ו — «המילה האחרונה — מסך סיום ולא מסך לבן». `/dev/deck` holds two
  // ungraded cards, so the finish branch is unreachable there; this fixture renders it
  // directly. Measured and ⛔ not asserted: "not blank" is a claim about pixels.
  '/dev/deck/done',
```

Then, immediately after the closing brace of the existing `if (route === '/dev/deck') { … }` block, add:

```js
      // T-055 — the finish state. Three properties, and «מסך סיום ולא מסך לבן» is only true
      // when all three hold: the node is there, it actually paints something, and the one
      // way out is a real touch target rather than a link the thumb cannot land on.
      if (route === '/dev/deck/done') {
        const done = await page.evaluate(() => {
          const node = document.querySelector('[data-deck-done]');
          if (!node) return { present: false };
          const box = node.getBoundingClientRect();
          const exits = [...node.querySelectorAll('[data-primary-action="true"]')];
          const exit = exits[0]?.getBoundingClientRect();
          return {
            present: true,
            // Rounded: sub-pixel layout is not a defect (same rule as the deck block above).
            height: Math.round(box.height),
            // The rendered text, ⛔ not the markup: a section full of empty boxes has height
            // and would pass a height-only check while showing the learner nothing.
            text: (node.textContent ?? '').trim().length,
            exits: exits.length,
            exitWidth: exit ? Math.round(exit.width) : 0,
            exitHeight: exit ? Math.round(exit.height) : 0,
          };
        });
        check(done.present, `${at} the finish state is in the DOM`, 'no [data-deck-done]');
        if (done.present) {
          check(
            done.height > 0 && done.text > 0,
            `${at} the finish state is not a blank screen`,
            `height ${done.height}px, ${done.text} chars of text`,
          );
          check(
            done.exits === 1,
            `${at} the finish state offers exactly one way out`,
            `found ${done.exits} [data-primary-action]`,
          );
          check(
            done.exitWidth >= MIN_TAP && done.exitHeight >= MIN_TAP,
            `${at} the way out clears ${MIN_TAP}px`,
            `${done.exitWidth}×${done.exitHeight}`,
          );
        }
      }
```

⚠️ `check`, `at` and `MIN_TAP` already exist in this file — `MIN_TAP` at line 80. ⛔ Do not re-declare any of them.

- [x] **Step 9: Run the harness**

Run: `npm run check:mobile`
Expected: **PASS**, and the total test count **rises by 12** — four checks × three widths — from the C-0134 baseline of 771 to **783**. ⚠️ If the number differs, the deviation is reported in the tick report and investigated with `superpowers:systematic-debugging` ⛔ before any fix is proposed. Record the actual number either way; ⛔ do not report the predicted one.

- [x] **Step 10: Prove the harness check can fail**

In `app/dev/deck/done/page.tsx`, temporarily return `<section data-deck-done />` instead of the `<CardDeck>`. Run `npm run check:mobile`.
Expected: **FAIL ×3** (once per width) on `the finish state is not a blank screen`. Restore the file by re-editing it (⛔ not `git checkout`), and re-run: **PASS**.

- [x] **Step 11: Update the plan files**

- `plan/50-tasks.md`, T-055 row: status ⛔ → ✅, and the status cell states **why the ⛔ was wrong**, with the evidence: «⛔ הוסר C-XXXX — החסם היה F-032, ו-§ 4.2ו נכתבה ב-`5a86a28` ב-2026-08-13T15:53:21Z, **שלוש וחצי דקות אחרי** ש-F-032 נפתחה ב-`c4f40df` ב-15:49:54Z. השורה נשאה חסם מת ~35 מחזורים.»
- `plan/60-findings.md`, F-032 row: status 🔓 → ✅, with the same two commit hashes and timestamps. ⛔ Do not delete the row; the finding was **true when it was written** and that is part of the record.
- `plan/30-architecture.md`: one line recording that `/dev/deck/done` is the second deck fixture and why a fixture — and not a scripted grade-through — reaches the branch.

- [x] **Step 12: Verify and commit**

Run, in one command, and paste the real output into the tick report:

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
```

Then:

```bash
git add components/CardDeck.tsx components/CardDeck.test.ts app/dev/deck/done/page.tsx \
        scripts/verify-mobile.mjs plan/50-tasks.md plan/60-findings.md plan/30-architecture.md plan/00-control.md
git commit -m "loop(DEV): C-XXXX T-055 — מסך הסיום של החפיסה + פיקסצ'ר /dev/deck/done, F-032 נסגרה"
git push origin dev
```

⛔ No `[skip ci]`. ⛔ Never push to `main`.

---

## Task 2: The loading skeleton — T-054

**Files:**
- Create: `components/CardSkeleton.tsx`
- Create: `components/CardSkeleton.test.ts`
- Modify: `components/StudyDeckScreen.tsx:196–208` (the `state.kind === 'loading'` block)
- Modify: `components/StudyDeckScreen.test.ts:152–155`
- Create: `app/dev/deck/skeleton/page.tsx`
- Modify: `scripts/verify-mobile.mjs` (`ROUTES` + one measurement block)
- Modify: `plan/50-tasks.md` (T-054 row)

**Interfaces:**
- Consumes: nothing from task 1. The two tasks are independent and may be executed in either order; task 3 depends on both.
- Produces: `export default function CardSkeleton(): React.JSX.Element` in `components/CardSkeleton.tsx` — takes **no props**, fetches nothing, and renders a `<div data-deck-skeleton>` containing one `role="status"` `sr-only` sentence and three `aria-hidden` boxes. `<StudyDeckScreen>` imports it as `import CardSkeleton from '@/components/CardSkeleton';`.

### What changes, and why this is not a no-op

T-054's substance already shipped in C-0102 — the card-shaped skeleton is live in `StudyDeckScreen`'s `loading` branch and the row's ⛔ («אין endpoint של תור, ולכן ל-`/study` אין מה לטעון») has been false since `e1fd933`. What did **not** ship is any way to know it is still true tomorrow:

- the guard is `expect(CODE).toContain('data-deck-skeleton')` plus `not.toContain('animate-spin')`. Replacing all three boxes with a single 1px line, or with a bare `<div data-deck-skeleton />`, keeps that guard green. It proves neither «בצורת הכרטיס» nor «ולא מסך לבן».
- the state is never rendered at any width. `/study` under `next start` has no Supabase env, so the queue answers 503 and the harness measures `schema_missing` — the same TD-13 trap `/dev/card`, `/dev/deck` and `/dev/tabs/*` were built for.
- T-054's own Files column names **`components/CardSkeleton.tsx`**, a file that does not exist. Extracting it is what makes the state renderable by a fixture at all: `<StudyDeckScreen>` fetches on mount, so a fixture pointed at the screen would flash the skeleton and then land on an error state mid-measurement.

⛔ **Not in this task:** any change to what the learner sees. The markup moves file, verbatim. ⛔ No animation is added — the current skeleton has none, so `prefers-reduced-motion` is honoured by construction, and adding a pulse would be new motion no decision asked for.

- [ ] **Step 1: Write the failing test**

Create `components/CardSkeleton.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<CardSkeleton>` — T-054, constitution § 5, § 4.2ו («טעינה — שלד בצורת הכרטיס, ⛔ לא ספינר»).
 *
 * A source guard, not a render test: the vitest environment is `node` and jsdom is
 * deliberately absent (vitest.config.ts). Geometry — that the shape actually paints at
 * 320/375/414 — is `check:mobile`'s job through the `/dev/deck/skeleton` fixture.
 *
 * ⛔ What this file cannot prove, named so nobody mistakes green here for coverage: that the
 * boxes are the same size as a real card. Nothing in the product asserts that today, and a
 * number copied from `Flashcard.tsx` into this file would drift silently.
 */
const SRC = readFileSync('components/CardSkeleton.tsx', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('<CardSkeleton> — the shape of what is coming (T-054 · חוקה § 5)', () => {
  it('is a SHAPE and ⛔ not a spinner', () => {
    expect(CODE).toContain('data-deck-skeleton');
    for (const spinner of ['animate-spin', 'progressbar', 'טוען…</']) {
      expect(CODE, `${spinner} is a spinner, and § 4.2ו forbids one here`).not.toContain(spinner);
    }
  });

  it('renders three boxes — ⛔ a single bar is not the shape of a card', () => {
    // The one assertion the old one-string guard could not make: a bare
    // `<div data-deck-skeleton />` satisfied `toContain('data-deck-skeleton')`.
    expect(CODE.match(/aria-hidden/g)?.length, 'three aria-hidden boxes').toBe(3);
    // Each box has a height class, so "shape" is a size and not an empty node.
    expect(CODE.match(/className="h-\d+/g)?.length ?? 0).toBeGreaterThanOrEqual(1);
  });

  it('carries the word "loading" for a screen reader, ⛔ not four empty rectangles', () => {
    expect(CODE).toContain('role="status"');
    expect(CODE).toContain('sr-only');
    expect(CODE).toContain('טוען');
  });

  it('⛔ adds no motion — the current skeleton animates nothing (חוקה § 5)', () => {
    // The constitution allows 150–300ms with prefers-reduced-motion honoured. Honouring it
    // by having no animation at all is the cheapest way to be correct; anything added here
    // must come back through a decision, ⛔ not through this file.
    expect(CODE).not.toMatch(/\banimate-\w+/);
    expect(CODE).not.toContain('transition');
  });

  it('fetches nothing — it is renderable with no Supabase env at all', () => {
    for (const io of ['fetch(', 'apiGet', 'useEffect']) {
      expect(CODE, `${io} belongs to the screen above, not to the placeholder`).not.toContain(io);
    }
  });

  it('uses semantic colour tokens only (the palette ratchet, per file)', () => {
    expect(CODE).not.toMatch(/\b(?:bg|text|border)-slate-\d{2,3}\b/);
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run components/CardSkeleton.test.ts`
Expected: **FAIL** at module load — `ENOENT: no such file or directory, open 'components/CardSkeleton.tsx'`.

- [ ] **Step 3: Create the component**

Create `components/CardSkeleton.tsx`, moving the markup out of `StudyDeckScreen`'s `loading` branch **verbatim**:

```tsx
/**
 * The card-shaped loading placeholder — T-054, constitution § 5, § 4.2ו («טעינה — שלד בצורת
 * הכרטיס, ⛔ לא ספינר»).
 *
 * Extracted from `<StudyDeckScreen>`'s `loading` branch, where it shipped in C-0102 and was
 * guarded by a single `toContain('data-deck-skeleton')` — a check a bare `<div>` satisfies.
 * It lives in its own file for one reason that is a measurement and not tidiness: the screen
 * it came from fetches on mount, so a `check:mobile` fixture pointed at the screen would
 * flash this state and then land on an error state mid-measurement (TD-13). A propless,
 * fetchless component can be rendered by a fixture and held there.
 *
 * ⛔ **No animation.** § 5 allows 150–300ms with `prefers-reduced-motion` honoured; having
 * no motion at all honours it by construction, and a pulse added here would be motion no
 * decision asked for. ⛔ It is also not a spinner: a spinner says "something is happening",
 * a skeleton says what is about to arrive and does not shift the layout when it does.
 *
 * `aria-hidden` on the boxes with the sentence in a live region: a screen reader gets the
 * word "loading", ⛔ not three empty rectangles.
 */
const LOADING_HE = 'טוען את הכרטיסיות…';

export default function CardSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3" data-deck-skeleton>
      <p className="sr-only" role="status">
        {LOADING_HE}
      </p>
      <div aria-hidden className="h-40 rounded-2xl bg-surface-raised" />
      <div aria-hidden className="h-6 w-2/3 rounded-lg bg-surface-raised" />
      <div aria-hidden className="h-12 rounded-2xl bg-surface-raised" />
    </div>
  );
}
```

- [ ] **Step 4: Run the test**

Run: `npx vitest run components/CardSkeleton.test.ts`
Expected: **PASS**, 6 tests.

- [ ] **Step 5: Prove the new guard can fail**

Replace the three boxes with a single `<div aria-hidden className="h-1 bg-surface-raised" />`. Run `npx vitest run components/CardSkeleton.test.ts`.
Expected: **FAIL** naming `three aria-hidden boxes` (received 1, expected 3) — the exact mutation the old one-string guard passed. Restore by re-editing (⛔ not `git checkout`), re-run: **PASS**.

- [ ] **Step 6: Use it from the screen**

In `components/StudyDeckScreen.tsx`:
- add `import CardSkeleton from '@/components/CardSkeleton';` beside the other component imports;
- delete the module-level `const LOADING_HE = 'טוען את הכרטיסיות…';` (it moved into the new file — leaving it would be an unused binding and `typecheck` with `noUnusedLocals` will say so);
- replace the whole `{state.kind === 'loading' && ( … )}` block with:

```tsx
      {/* The shape of what is coming, ⛔ not a spinner (constitution § 5). The markup lives
          in its own file so `/dev/deck/skeleton` can hold this state still while the harness
          measures it — this screen fetches on mount and would not stay in it. */}
      {state.kind === 'loading' && <CardSkeleton />}
```

- [ ] **Step 7: Replace the weak guard on the screen**

In `components/StudyDeckScreen.test.ts`, replace the test at lines 152–155 with:

```ts
  /** All five states the plan names, each one reachable in the code. */
  it('delegates loading to <CardSkeleton> — ⛔ never a spinner (T-054 · חוקה § 5)', () => {
    // The shape itself is guarded in components/CardSkeleton.test.ts. What this file owns is
    // the wiring: that the `loading` state renders that component and ⛔ nothing else, so a
    // spinner cannot creep back in beside it.
    expect(CODE).toContain("import CardSkeleton from '@/components/CardSkeleton'");
    const loading = braceRegion(CODE, "{state.kind === 'loading' &&");
    expect(loading).toContain('<CardSkeleton />');
    expect(loading).not.toContain('animate-spin');
    // ⛔ Nothing else in the branch: no second element, no sentence, no retry.
    expect(loading.match(/</g)?.length, 'exactly one element in the loading branch').toBe(1);
  });
```

⚠️ `braceRegion` already exists at `components/StudyDeckScreen.test.ts:50`. ⛔ Do not redefine it. It matches on the literal opening string — copy `{state.kind === 'loading' &&` from the source verbatim.

- [ ] **Step 8: Run both files**

Run: `npx vitest run components/StudyDeckScreen.test.ts components/CardSkeleton.test.ts`
Expected: **PASS**, both files.

- [ ] **Step 9: Create the harness fixture**

Create `app/dev/deck/skeleton/page.tsx`:

```tsx
import CardSkeleton from '@/components/CardSkeleton';

/**
 * Layout fixture for `check:mobile` — the loading state (T-054 · § 4.2ו · חוקה § 5).
 * noindex, unlinked, and ⛔ NOT a learning screen (בדיקת פריסה — אינו תוכן לימודי).
 *
 * `/study` is already in the harness's route list, and that is exactly why this exists:
 * `next start` has no Supabase env, the queue answers 503 by its own contract, and every
 * `ok /study` line has therefore described `schema_missing` — the loading state has never
 * been rendered at 320/375/414 (TD-13, the same trap as `/dev/card` and `/dev/deck`).
 *
 * ⛔ Not a client component and ⛔ no wrapper markup: `<CardSkeleton>` renders no chrome of
 * its own, and a heading added here would be this fixture's geometry rather than the
 * component's.
 */
export default function DevDeckSkeletonPage() {
  return <CardSkeleton />;
}
```

- [ ] **Step 10: Add the route and its measurement**

In `scripts/verify-mobile.mjs`, add to `ROUTES` directly after `'/dev/deck'`:

```js
  // T-054 · חוקה § 5 — «טעינה: שלד בצורת הכרטיס, ⛔ לא ספינר». `/study` renders
  // `schema_missing` here (no Supabase env), so the loading state has never been measured.
  '/dev/deck/skeleton',
```

and, after the `/dev/deck/done` block from task 1 (or after the `/dev/deck` block if task 1 has not run yet):

```js
      // T-054 — the loading state. «שלד בצורת הכרטיס ולא מסך לבן» is a claim about pixels:
      // three boxes that paint, and ⛔ no element that spins.
      if (route === '/dev/deck/skeleton') {
        const skeleton = await page.evaluate(() => {
          const node = document.querySelector('[data-deck-skeleton]');
          if (!node) return { present: false };
          const boxes = [...node.querySelectorAll('[aria-hidden]')].map((box) => {
            const rect = box.getBoundingClientRect();
            return { w: Math.round(rect.width), h: Math.round(rect.height) };
          });
          return {
            present: true,
            boxes: boxes.length,
            // The tallest box stands for the card itself. A skeleton whose boxes all
            // collapse to 0 is a blank screen wearing the right attribute.
            tallest: boxes.reduce((max, box) => Math.max(max, box.h), 0),
            painted: boxes.filter((box) => box.w > 0 && box.h > 0).length,
          };
        });
        check(skeleton.present, `${at} the skeleton is in the DOM`, 'no [data-deck-skeleton]');
        if (skeleton.present) {
          check(
            skeleton.boxes === 3 && skeleton.painted === 3,
            `${at} the skeleton paints three boxes`,
            `${skeleton.boxes} boxes, ${skeleton.painted} with area`,
          );
          check(
            skeleton.tallest >= 100,
            `${at} the skeleton is card-shaped, ⛔ not a bar`,
            `tallest box ${skeleton.tallest}px`,
          );
        }
      }
```

⚠️ `100` is a floor and ⛔ not the card's height: `h-40` is 160px, and asserting 160 would make this check fail the day the design changes a spacing token. What is being measured is «shaped like a card rather than like a progress bar», and a 100px floor separates those two without pinning a design value. ⛔ Do not tighten it to an exact number.

- [ ] **Step 11: Run the harness**

Run: `npm run check:mobile`
Expected: **PASS**, count **+9** over whatever task 1 left (three checks × three widths). Record the actual number; ⛔ do not report the predicted one.

- [ ] **Step 12: Prove the harness check can fail**

In `components/CardSkeleton.tsx`, change `h-40` to `h-1`. Run `npm run check:mobile`.
Expected: **FAIL ×3** on `the skeleton is card-shaped, ⛔ not a bar` — `tallest box 4px`. Restore by re-editing (⛔ not `git checkout`), re-run: **PASS**.

- [ ] **Step 13: Update the plan files**

- `plan/50-tasks.md`, T-054 row: status ⛔ → ✅. The status cell records the two dates: the stated blocker («אין endpoint של תור») died in `e1fd933` at **2026-08-13T18:48:51Z**, and the skeleton itself shipped unrecorded in `4dbc314` (C-0102) at **2026-08-13T23:03:59Z**; this tick extracted it to the `components/CardSkeleton.tsx` the row already named, replaced a one-string guard, and measured it at three widths.
- `plan/30-architecture.md`: one line for `/dev/deck/skeleton` and why the extraction was required to measure the state at all.

- [ ] **Step 14: Verify and commit**

```bash
npm run typecheck && npm run check:core && npm test && npm run build && npm run check:mobile
```

```bash
git add components/CardSkeleton.tsx components/CardSkeleton.test.ts \
        components/StudyDeckScreen.tsx components/StudyDeckScreen.test.ts \
        app/dev/deck/skeleton/page.tsx scripts/verify-mobile.mjs \
        plan/50-tasks.md plan/30-architecture.md plan/00-control.md
git commit -m "loop(DEV): C-XXXX T-054 — CardSkeleton חולץ, שומר אמיתי, ופיקסצ'ר /dev/deck/skeleton"
git push origin dev
```

---

## Task 3: The M0 audit — is the milestone actually done?

**Files:**
- Modify: `plan/50-tasks.md` (an audit block under the table)
- Modify: `plan/00-control.md` (`STATE` note + `NEXT_AGENT=CRITIC`)
- Modify: `plan/03-for-roy.md` (only if the audit finds a row that only Roy can close)

**Interfaces:**
- Consumes: the `data-deck-done` / `data-deck-skeleton` contracts from tasks 1 and 2, and their row updates in `plan/50-tasks.md`.
- Produces: an audit table in `plan/50-tasks.md` with one row per M0 task and, for each, **the command that proves its status**. ⛔ No status is copied from the table it is auditing — that is the failure mode this task exists for.

### Why this is a task and not bookkeeping

Two M0 rows carried a ⛔ whose blocker was already gone — one of them for **35 cycles**, the other since **three and a half minutes** after it was written. Both were believed because the table said so. `MILESTONE_TICKS` went 60 → 87 against a ceiling of 120 partly on ticks that stopped at those gates. ⛔ Declaring M0 done from the same table would repeat the exact error. Every row gets a command.

⛔ **The Dev does not declare `MILESTONE_DONE`.** This task produces the evidence and hands it over; the milestone call and the counter reset are the Critic's.

- [ ] **Step 1: List every M0 row from the file, ⛔ not from memory**

Run:

```bash
awk -F'|' '/^\| T-/ && $3 ~ /M0/ {gsub(/^ +| +$/,"",$2); print $2, substr($6,1,4)}' plan/50-tasks.md
```

Expected: 18 rows. Write the list down before checking anything — the audit is against this list, and a row that is missing from it is itself a finding.

- [ ] **Step 2: Prove each ✅ row against the code**

For every row the table calls ✅, run one command that would fail if the claim were false, and record the command **and** its output. The pattern is `ls`/`grep`/`npx vitest run <the row's own guard>` — for example:

```bash
npx vitest run components/EnWord.test.ts          # T-009
ls lib/supabase/server.ts 2>&1                    # T-024 — expected: No such file
grep -n "check:mobile" package.json               # T-021
grep -n "word_progress" app/api/health/route.ts   # T-053
```

⚠️ A row whose claim no command can check is **not** ✅ — it is a row with no guard, and that is a 🟡 finding against whoever closed it. Record it as such; ⛔ do not quietly accept it.

- [ ] **Step 3: Confirm the two ⛔ rows that remain are Roy's and not the loop's**

- T-019 (RLS against a live Supabase project): confirm no test credentials exist in the environment — `grep -c SUPABASE .env.example` and the absence of any `.env.test`. It is unrunnable **here**, and that is a fact about the loop, ⛔ not a defect.
- T-046 (Netlify token): confirm the repo secret is still absent. Both are already listed in `plan/03-for-roy.md` — verify they are, and add them if not.

- [ ] **Step 4: Confirm the 🟣 rows are genuinely in the Critic's court**

T-001 and T-002 are 🟣 (בביקורת). Run `git log --oneline -5 -- plan/60-findings.md` and confirm no open finding names either. A 🟣 row with an open 🔴/🟠 finding against it is not «in review», it is blocked — and that would be a finding.

- [ ] **Step 5: Write the audit block into `plan/50-tasks.md`**

Directly under the task table, add:

```markdown
### ביקורת M0 — C-XXXX · <the real `date -u` output>

⛔ אף שורה כאן אינה מועתקת מהטבלה שמעליה. לכל שורה יש פקודה, ולצידה הפלט שהתקבל.

| id | הטענה בטבלה | הפקודה שהורצה | הפלט | מסקנה |
|---|---|---|---|---|
| … | … | … | … | ✅ מאומת / 🟡 ללא שומר / ⛔ בידי רוי |

**נמדד:** N שורות M0. K מאומתות מול הקוד · J בידי רוי (T-019 · T-046) · S ללא שומר.
**המלצה ל-Critic:** <MILESTONE_DONE כשיר / אינו כשיר, ולמה>. ⛔ ההכרעה והאיפוס אינם של ה-Dev.
```

- [ ] **Step 6: Open a finding on the stale-gate class, ⛔ not on the two instances**

In `plan/60-findings.md`, open one 🟡 finding: **a ⛔ cell records a blocker but records no way to notice it has lifted.** The failure scenario is the measured one — F-032 was written at `15:49:54Z` and answered at `15:53:21Z`, and the row it blocked stayed ⛔ for ~35 cycles while the counter climbed 60→87. The proposed fix is a rule, not a patch: **every ⛔ cell names the command that decides whether it still holds**, so the next agent can re-run it in seconds instead of trusting the cell.

⚠️ Brake 10 caps **design** findings at 2 per milestone. This is a process finding — the same class as F-032 itself — and ⛔ does not return the stick. Confirm against `plan/RULES.md § 0.1.1 ו׳` before writing it.

- [ ] **Step 7: Verify and commit**

No product code changed in this task, but the suite still runs — the audit is worthless if it is written against a red tree:

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

Set `NEXT_AGENT=CRITIC`, release the lock, bump `MILESTONE_TICKS` by 1, add the journal line, then:

```bash
git add plan/50-tasks.md plan/60-findings.md plan/00-control.md plan/03-for-roy.md
git commit -m "loop(DEV): C-XXXX ביקורת M0 — כל שורה מול פקודה, והמלצה ל-Critic"
git push origin dev
```

---

## Self-Review

**1. Spec coverage.** § 4.2ו q2 (finish screen) → task 1 step 3. q6 (exit to the בורר) → task 1 steps 1ⓒ, 3. `מצבי קצה` «מסך סיום ולא מסך לבן» → task 1 steps 7–10 (measured, not asserted). `מצבי קצה` «שלד בצורת הכרטיס, ⛔ לא ספינר» → task 2 steps 3, 10–12. T-055's «⛔ אין מספרים חדשים ואין הבטחה» → task 1 step 1ⓓ, including the `data-remaining` exclusion. T-054's named file `components/CardSkeleton.tsx` → task 2 step 3. F-032's three questions («מה מבדיל done מ-empty · איזו פעולה אחת · לאן היא מובילה») → task 1 steps 1ⓐ, 1ⓒ, 11. `לא בתחולה` «אין שינוי ב-Flashcard.tsx» → Global Constraints, and no task lists it. **No gap found.**

**2. Placeholder scan.** Every code step carries the literal code. Every run step carries the command and the expected result. Every mutation step names the file, the edit, and the failure line it must produce. No "TBD", no "similar to task N", no "add appropriate error handling". The three `C-XXXX` tokens in commit messages are filled from `plan/00-control.md` at execution time (`git pull` then max+1), which is the loop's own rule and ⛔ not a placeholder.

**3. Type consistency.** `CardSkeleton` is declared `(): React.JSX.Element` with no props in task 2 step 3, imported with exactly that default-export shape in step 6, and rendered `<CardSkeleton />` in both step 6 and the fixture in step 9. `data-deck-skeleton` is the attribute in the component (step 3), in the screen guard (step 7), and in the harness selector (step 10) — one spelling in all three. `data-deck-done` is identical across task 1 steps 1, 3, 8 and task 3's interface block. `CardDeck`'s prop names (`deck` · `cards` · `onGraded`) match `components/CardDeck.tsx` as it stands today, and the `/dev/deck/done` fixture passes all three. `braceRegion`, `withoutComments`, `check`, `at` and `MIN_TAP` are all flagged as **existing** where they are used, with the file and line, so no task redeclares one.

**Known deviation risk, stated up front:** task 1 step 3 puts the string `'תרגול — לא משנה את מועד החזרה'` in the file a second time. `components/CardDeck.test.ts` guards that this label is reachable only from a `deck === 'unknown'` branch by brace containment. The new occurrence sits inside its own `deck === 'unknown' ? … : …` ternary, so the claim still holds — but the guard extracts **the first** matching region, and if it goes red the correct response is to re-read the containment claim and, if needed, extend the extractor to check every occurrence. ⛔ It is never to relax the assertion.
