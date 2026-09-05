# Loop-Health Triage Hardening (T-255, T-258) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two measured triage-logic defects in the loop's own PM decision machinery: (1) `loop:health` check 14 currently blocks 🩺 IMPROVE mode using every open row in the target workstream, including ordinary rows that predate IMPROVE and have nothing to do with it; (2) nothing currently forces a PM tick into 📐 planning when all five feature workflows are simultaneously empty, so the loop can idle in 🩺/💤 instead of opening a new slice.

**Architecture:** Both fixes are additive, backward-compatible edits to existing, already-tested machinery — no new files, no new subsystems. T-255 adds one tag-filtered counting helper next to the existing `workTypeMix`/`textuallyBlockedOpenTasks` helpers in `scripts/loop-health.mjs` and swaps it into check 14's ceiling condition. T-258 adds one OR-clause to an existing table row in two prose documents and one cross-file test asserting they agree — the same pattern `scripts/rules-citations.test.ts` already uses to stop the "npm run verify has N commands" line from going stale.

**Tech Stack:** Node.js (ESM, no build step) for `scripts/loop-health.mjs`; Vitest for `scripts/loop-health.mjs`'s and `docs/agents/*.md`'s test suites; plain Markdown for the two prose registers.

**Spec:** `docs/superpowers/plans/2026-09-05-improvement-plan.md` § 3.3 (source of both task rows) · `plan/50-tasks.md` rows `T-255` and `T-258` (source of truth for scope and file list — read the full rows with `grep -n '^| T-255 |' plan/50-tasks.md` and `grep -n '^| T-258 |' plan/50-tasks.md` before starting either task) · `plan/RULES.md § 0.6` (the four-triage-state table and the five IMPROVE fences this plan extends).

## Global Constraints

- ⛔ Do not renumber existing `loop:health` checks (1–14 stay exactly where they are; T-255 changes check 14's *logic*, not its id or title number scheme).
- ⛔ Do not add a fifth PM triage mode. T-258 adds one trigger condition to the existing 📐 planning row — the mode itself does not change.
- ⛔ The `שיפור` tag in a task row's `אבן דרך` cell is written by PM/Roy only — DEV never writes it. Task 1 below proves the *counting* logic; it does not add the tag to any real row.
- Every prose edit in `plan/RULES.md` and `docs/agents/PM.md` must keep the existing bullet/table structure intact (this repo has a citation-integrity gate, `npm run check:rules`, that fails on broken structure — do not renumber surrounding sections).
- `npm run verify` (8 commands: `typecheck · check:core · check:motion · check:text-floor · check:rules · test · build · check:mobile`) must pass before either task is considered done.
- TDD: for both tasks, write the failing test first, watch it fail for the right reason, then implement.

## File Structure

No new files. Every file below already exists and is extended in place — none of it is created from scratch:

| File | Responsibility | Touched by |
|---|---|---|
| `scripts/loop-health.mjs` | Read-only advisory report over the plan registers; check `'14'` (IMPROVE ceiling) gets a tag-filtered counting helper | Task 1 |
| `scripts/loop-health.test.ts` | Fixture-based proof that each check fails on the exact defect it exists to catch; two new `it(...)` blocks | Task 1 |
| `plan/RULES.md` | Canonical rules register; § IMPROVE fences (Task 1) and § 0.6 four-mode table (Task 2) are two separate, non-adjacent blocks in the same file | Task 1 · Task 2 |
| `docs/agents/PM.md` | The PM agent's own prompt text; STEP 1.7 gets a new mandatory-planning block alongside its existing IMPROVE fences | Task 2 |
| `scripts/agent-prompts.test.ts` | Contract tests over `docs/agents/*.md`; one new `it(...)` cross-checking `RULES.md` against `PM.md` | Task 2 |

⚠️ **Extend-before-create (`RULES § 0.6ב`) — declared explicitly: this is NOT an extension of `T-167`, `T-213`, or `T-236`.** `scripts/agent-prompts.test.ts`, `scripts/loop-health.mjs` and `scripts/rules-citations.test.ts` are also named in those three already-delivered task rows (all 🟣/✅ in `plan/50-tasks.md`, none open). Those rows shipped and closed unrelated fixes (a regex `u`-flag bug, a plan-orphan check, an amirnet workstream tag) in the same files this plan touches. This plan adds new, independent lines for `T-255`/`T-258` — it does not continue, modify, or revert any line `T-167`/`T-213`/`T-236` added, so it carries no `המשך של:` lineage tag to either of them.

---

### Task 1: `loop:health` check 14 — count only `שיפור`-tagged rows toward the IMPROVE ceiling (T-255)

**Why:** Measured 2026-09-04 (`00-control.md` `IMPROVE_TARGET` note, and `docs/superpowers/plans/2026-09-05-improvement-plan.md` § 1.3): trying to point `IMPROVE_TARGET` at `story` failed check 14 because `story` already carried 3 ordinary open rows against a ceiling of 2 — rows that predate 🩺 IMPROVE and were never meant to count against it. The ceiling exists to bound *what PM writes under IMPROVE*, not *everything already open in a sealed workstream*.

**Files:**
- Modify: `scripts/loop-health.mjs:636-661` (the `IMPROVE_ROW_CEILING` constant and check `'14'`)
- Modify: `scripts/loop-health.test.ts` (add two new `it(...)` blocks near the existing `it('14 · fails when IMPROVE_TARGET points at a workstream the sequence has ⛔ not passed', ...)` at line 528)
- Modify: `plan/RULES.md` (the `#### 🩺 מצב IMPROVE — חמש גדרות, וכולן נמדדות` block, § 0.6)

**Interfaces:**
- Consumes: `rows(text, prefix)`, `read(path)`, `at(...parts)`, `taskCell(line, i)`, `TASK_MILESTONE_INDEX`, `taskOpen(line)` — all already defined earlier in `scripts/loop-health.mjs` (lines 32-35, 148, 211, 233). Do not redefine any of these.
- Produces: `const IMPROVE_ROW_TAG = 'שיפור'` and `const improveTaggedOpenCount = (target) => number` — a new named export-free module-level function, used only inside check 14's callback. No other task in this plan consumes it.

- [x] **Step 1: Write the two failing tests**

  Open `scripts/loop-health.test.ts`. Immediately after the existing test block that starts `it('14 · fails when IMPROVE_TARGET points at a workstream the sequence has ⛔ not passed', () => {` (and its closing `});`, currently ending around line 545), insert:

  ```ts
  it('14 · שורות פתוחות בלי תג שיפור ⛔ אינן נספרות לתקרה — גם אם הן מעל 2', () => {
    // `loop` is a cross-cutting workstream (order: null in balance()), so condition 1
    // (`there.order >= here.order`) never fires against it regardless of the active
    // workstream — this isolates the test to the ceiling condition alone.
    const root = healthy();
    patch(root, 'plan/00-control.md', (s) => s.replace('IMPROVE_TARGET: ""', 'IMPROVE_TARGET: loop'));
    patch(
      root,
      'plan/61-deferred.md',
      (s) => s + '| `loop` | 2026-09-01 | 3 | F-000 | x | C-0001 |\n',
    );
    patch(
      root,
      'plan/50-tasks.md',
      (s) =>
        s +
        '| T-900 | M0 · loop · נוחות | קיימת מלפני IMPROVE, ⛔ ללא תג | — | ⬜ | 0 | — | — |\n' +
        '| T-901 | M0 · loop · נוחות | קיימת מלפני IMPROVE, ⛔ ללא תג | — | ⬜ | 0 | — | — |\n' +
        '| T-902 | M0 · loop · נוחות | קיימת מלפני IMPROVE, ⛔ ללא תג | — | ⬜ | 0 | — | — |\n',
    );
    const r = run(root);
    expect(
      failed(r.out, '14'),
      'שלוש שורות פתוחות ⛔ ללא התג לא היו אמורות להפיל את הבדיקה',
    ).toBe(false);
  });

  it('14 · שורות פתוחות עם תג שיפור נספרות, ומעל התקרה מפילות', () => {
    const root = healthy();
    patch(root, 'plan/00-control.md', (s) => s.replace('IMPROVE_TARGET: ""', 'IMPROVE_TARGET: loop'));
    patch(
      root,
      'plan/61-deferred.md',
      (s) => s + '| `loop` | 2026-09-01 | 3 | F-000 | x | C-0001 |\n',
    );
    patch(
      root,
      'plan/50-tasks.md',
      (s) =>
        s +
        '| T-900 | M0 · loop · נוחות · שיפור | שורת שיפור 1 | — | ⬜ | 0 | — | — |\n' +
        '| T-901 | M0 · loop · נוחות · שיפור | שורת שיפור 2 | — | ⬜ | 0 | — | — |\n' +
        '| T-902 | M0 · loop · נוחות · שיפור | שורת שיפור 3 | — | ⬜ | 0 | — | — |\n',
    );
    const r = run(root);
    expect(failed(r.out, '14'), 'שלוש שורות מתויגות מעל תקרה 2 חייבות להפיל').toBe(true);
    expect(r.out, 'הפירוט מזכיר את התג').toContain(IMPROVE_ROW_TAG_LITERAL);
  });
  ```

  At the top of the test file, alongside the other module-level `const` declarations (near `const failed = ...` / `const warned = ...`), add:

  ```ts
  /** Mirrors `IMPROVE_ROW_TAG` in scripts/loop-health.mjs — kept as a literal here so
   *  the test does not import implementation internals, only observable output. */
  const IMPROVE_ROW_TAG_LITERAL = 'שיפור';
  ```

- [x] **Step 2: Run the tests to verify they fail**

  Run: `npx vitest run scripts/loop-health.test.ts -t "שיפור"`
  Expected: both new tests FAIL. The first fails because today's check 14 counts `there.open` from `balance()` (all 6 real open `loop` rows plus the 3 fixture rows), which is `> 2`, so check 14 already reports FAIL before your fixture rows are even considered — i.e. it fails for the wrong reason today. The second fails to fail — actually still records the same generic count, not the specific "שיפור" wording. Confirm both failure messages reference the assertion you wrote, not a crash.

- [x] **Step 3: Implement the tag-filtered counting helper and swap it into check 14**

  In `scripts/loop-health.mjs`, locate the existing block (currently lines 628-661):

  ```js
  const IMPROVE_ROW_CEILING = 2;
  check(
    '14',
    'IMPROVE_TARGET מצביע על זרימה חתומה ומחזיק ≤2 שורות',
    () => {
      const control = read(at('plan', '00-control.md'));
      const m = /^IMPROVE_TARGET:\s*"?([^"\s#]*)"?/m.exec(control);
      if (m === null) return { ok: false, detail: '⛔ לא נמדד — ⛔ אין IMPROVE_TARGET ב-00-control' };
      const target = (m[1] ?? '').trim();
      if (target === '') return { ok: true, detail: 'ריק — המצב כבוי' };
      const active = activeWorkstream();
      const table = balance();
      const here = sequenceAnchor(table, active).row;
      const there = table.find((w) => w.name === target);
      if (here === undefined || there === undefined) {
        return { ok: false, detail: `⛔ לא נמדד — \`${target}\` או \`${active}\` ⛔ אינם בטבלת המאזן` };
      }
      const items = [];
      if (there.order >= here.order) {
        items.push(`⛔ \`${target}\` ⛔ אינה זרימה שהרצף עבר — זו זרימה פעילה שנייה בדלת האחורית`);
      }
      if (!new RegExp(`^\\|\\s*\`${target}\``, 'm').test(read(at('plan', '61-deferred.md')))) {
        items.push(`⛔ \`${target}\` ⛔ אינה ב-61-deferred ⇒ ⛔ אין ממה לצטט (D-144ⓑ)`);
      }
      if (there.open > IMPROVE_ROW_CEILING) {
        items.push(`⛔ ${there.open} שורות ⬜ ב-\`${target}\` — התקרה ${IMPROVE_ROW_CEILING}`);
      }
      return { ok: items.length === 0, detail: `יעד \`${target}\` · ${there.open} ⬜`, items };
    },
  );
  ```

  Replace it with:

  ```js
  /**
   * ⛔ **CHECK 14's CEILING MUST COUNT `שיפור` ROWS ONLY, ⛔ NOT EVERY OPEN ROW IN THE
   * TARGET WORKSTREAM.**  ⟦T-255 · D-190 § 1.3⟧
   * `there.open` (from `balance()`, i.e. `docs/plan-open.md`) counts every open row in
   * the target's build-order slot — including ordinary feature/infra rows that predate
   * 🩺 IMPROVE and have nothing to do with it. Measured 2026-09-04: pointing
   * `IMPROVE_TARGET` at `story` failed on 3 pre-existing ⬜ rows against a ceiling of 2,
   * blocking the mode from ever turning on. ⇒ this reads `plan/50-tasks.md` directly
   * (same technique as `workTypeMix` below) and counts only rows carrying the
   * `שיפור` tag — the tag PM/Roy write by hand (RULES § IMPROVE fence 6), ⛔ never DEV.
   */
  const IMPROVE_ROW_TAG = 'שיפור';
  const improveTaggedOpenCount = (target) =>
    rows(read(at('plan', '50-tasks.md')), 'T').filter((line) => {
      const tags = taskCell(line, TASK_MILESTONE_INDEX)
        .split('·')
        .map((t) => t.trim());
      return tags.includes(target) && tags.includes(IMPROVE_ROW_TAG) && taskOpen(line);
    }).length;

  const IMPROVE_ROW_CEILING = 2;
  check(
    '14',
    'IMPROVE_TARGET מצביע על זרימה חתומה ומחזיק ≤2 שורות מתויגות שיפור',
    () => {
      const control = read(at('plan', '00-control.md'));
      const m = /^IMPROVE_TARGET:\s*"?([^"\s#]*)"?/m.exec(control);
      if (m === null) return { ok: false, detail: '⛔ לא נמדד — ⛔ אין IMPROVE_TARGET ב-00-control' };
      const target = (m[1] ?? '').trim();
      if (target === '') return { ok: true, detail: 'ריק — המצב כבוי' };
      const active = activeWorkstream();
      const table = balance();
      const here = sequenceAnchor(table, active).row;
      const there = table.find((w) => w.name === target);
      if (here === undefined || there === undefined) {
        return { ok: false, detail: `⛔ לא נמדד — \`${target}\` או \`${active}\` ⛔ אינם בטבלת המאזן` };
      }
      const items = [];
      if (there.order >= here.order) {
        items.push(`⛔ \`${target}\` ⛔ אינה זרימה שהרצף עבר — זו זרימה פעילה שנייה בדלת האחורית`);
      }
      if (!new RegExp(`^\\|\\s*\`${target}\``, 'm').test(read(at('plan', '61-deferred.md')))) {
        items.push(`⛔ \`${target}\` ⛔ אינה ב-61-deferred ⇒ ⛔ אין ממה לצטט (D-144ⓑ)`);
      }
      const tagged = improveTaggedOpenCount(target);
      if (tagged > IMPROVE_ROW_CEILING) {
        items.push(
          `⛔ ${tagged} שורות \`${IMPROVE_ROW_TAG}\` פתוחות ב-\`${target}\` — התקרה ${IMPROVE_ROW_CEILING}`,
        );
      }
      return {
        ok: items.length === 0,
        detail: `יעד \`${target}\` · ${tagged} ⬜ מתויגות ${IMPROVE_ROW_TAG}`,
        items,
      };
    },
  );
  ```

- [x] **Step 4: Run the tests to verify they pass**

  Run: `npx vitest run scripts/loop-health.test.ts -t "שיפור"`
  Expected: both new tests PASS.

  Then run the full file to confirm nothing else regressed: `npx vitest run scripts/loop-health.test.ts`
  Expected: all tests pass, including the pre-existing `'14 · fails when IMPROVE_TARGET points at a workstream the sequence has ⛔ not passed'` test (its scenario never reaches the tag-count branch, since it fails on condition 1 first).

- [x] **Step 5: Update `plan/RULES.md` § IMPROVE to six fences**

  In `plan/RULES.md`, find the heading `#### 🩺 מצב IMPROVE — חמש גדרות, וכולן נמדדות  ⟦D-146⟧` and the fenced block immediately under it:

  ```
  IMPROVE_TARGET ב-plan/00-control.md — ריק = המצב כבוי.
  1. יעד יחיד, בשם.                              ⛔ לא שניים.
  2. רק זרימה עם 3 חותמות כתובות (36 § 13.1).     ⛔ לא הזרימה הפעילה.
  3. ≤ 2 שורות.
  4. כולן `סוג עבודה = נוחות` (§ 0.6ב).
  5. כל שורה מצטטת ממצא או מספר מ-`plan/61-deferred.md`.
  ```

  Replace the heading with `#### 🩺 מצב IMPROVE — שש גדרות, וכולן נמדדות  ⟦D-146 · T-255⟧` and append a sixth line inside the fenced block:

  ```
  6. כל שורה נושאת בתא `אבן דרך` תג נוסף `שיפור`, לצד `M<n> · <זרימה> · נוחות` — נכתב בידי PM/רוי בלבד, ⛔ לעולם לא בידי DEV. ⟦T-255⟧ `loop:health` בדיקה 14 סופרת רק שורות עם התג הזה כלפי התקרה בסעיף 3.
  ```

  ⚠️ **Do not touch `docs/agents/PM.md`'s "FIVE FENCES" block in this task.** `plan/50-tasks.md`'s `T-255` row lists only `scripts/loop-health.mjs · scripts/loop-health.test.ts · plan/RULES.md` as files — `PM.md` is out of this task's declared scope. Note the resulting drift (`PM.md` STEP 1.7 will still say "FIVE FENCES" until a PM tick updates it) in your tick report so QA/PM can reconcile it deliberately.

- [x] **Step 6: Commit**

  ```bash
  ./scripts/g add scripts/loop-health.mjs scripts/loop-health.test.ts plan/RULES.md
  ./scripts/g commit -m "loop(DEV): C-XXXX T-255 — check 14 counts שיפור-tagged rows only, not every open row in target workstream"
  ```
  (Replace `C-XXXX` with the cycle id computed fresh at commit time per `DEV.md` STEP 7 — do not reuse a number from this plan document.)

---

### Task 2: 📐 planning becomes mandatory when all five feature workflows are simultaneously empty (T-258)

**Why:** Measured in `docs/superpowers/plans/2026-09-05-improvement-plan.md` § 3: on 2026-09-05, `story`/`nav`/`cards`/`arena` all measured ⬜=0 and `studies` measured ⬜=1 (blocked externally) — effectively all five empty — and the PM triage table's existing four conditions let a PM tick land on 🩺 IMPROVE or 💤 quiet instead of 📐 planning a new slice, because nothing in the table said "empty everywhere ⇒ you must plan." `ACTIVE_WORKSTREAM: general` then absorbed all DEV ticks for five days with nobody cutting a new feature slice.

**Files:**
- Modify: `plan/RULES.md` (the four-triage-state table, § 0.6)
- Modify: `docs/agents/PM.md` (STEP 1.7, alongside the existing "FIVE FENCES" 🩺 block)
- Modify: `scripts/agent-prompts.test.ts` (add one new `it(...)` guarding the two prose edits agree)

**Interfaces:**
- Consumes: `text(name)` helper (reads `docs/agents/{name}.md`, already defined at the top of `scripts/agent-prompts.test.ts`) and the already-imported `readFileSync` from `node:fs` (used here to read `plan/RULES.md`, which lives outside the `docs/agents/` directory `text()` is scoped to).
- Produces: no new shared symbol — this task only edits prose and adds one test.

- [x] **Step 1: Write the failing test**

  Open `scripts/agent-prompts.test.ts`. Add a new `it(...)` inside the existing `describe('docs/agents/*.md — ...')` block, near the other IMPROVE-related test (`it('🔴 שני צדי מצב IMPROVE כתובים...')`):

  ```ts
  /**
   * 🔴 T-258 — measured `docs/superpowers/plans/2026-09-05-improvement-plan.md` § 3:
   * all five feature workflows measured ⬜=0 at once and no rule forced PM into 📐
   * planning, so the loop idled on 🩺/💤 instead of cutting a new slice for five days.
   * Same pattern as `scripts/rules-citations.test.ts`'s "npm run verify has N commands"
   * guard: the condition is asserted to exist, word-for-word, in BOTH the rules
   * document and the agent prompt that must obey it — a wording drift between them is
   * exactly the defect class `D-190`/`RULES § 0.12` exists against.
   */
  it('🔴 T-258 — תכנון-חובה על חמישיית הזרימות כתוב זהה גם ב-RULES וגם ב-PM.md', () => {
    const rules = readFileSync('plan/RULES.md', 'utf8');
    const pm = text('PM');
    const FIVE_FLOWS = '`story` · `nav` · `cards` · `arena` · `studies`';
    expect(rules, 'RULES § 0.6: תנאי התכנון-חובה מזכיר את חמישיית הזרימות').toContain(FIVE_FLOWS);
    expect(pm, 'PM STEP 1.7: אותה חמישייה, מילה במילה').toContain(FIVE_FLOWS);
    expect(rules, 'RULES: התנאי מדבר על בו-זמנית').toContain('בו-זמנית');
    expect(pm, 'PM: גובר על IMPROVE ועל שקט').toMatch(/OUTRANKS 🩺 IMPROVE/);
  });
  ```

- [x] **Step 2: Run the test to verify it fails**

  Run: `npx vitest run scripts/agent-prompts.test.ts -t "T-258"`
  Expected: FAIL — neither `plan/RULES.md` nor `docs/agents/PM.md` contains the five-flows string yet.

- [x] **Step 3: Add the trigger condition to `plan/RULES.md` § 0.6's four-mode table**

  Find this table in `plan/RULES.md` § 0.6:

  ```
  | מצב | התנאי המפעיל | מה קורא | סוכני משנה |
  |---|---|---|---|
  | 🔬 **מחקר** | יש 🔴 BLOCKER פתוח ב-`20-alerts.md` | `10-pedagogy.md` המלא + `20-alerts.md` | 2–4 |
  | 📐 **תכנון** | אין BLOCKER, ולמשימה הבאה אין תוכנית UX | `15-syllabus-digest.md` + `docs/plan-open.md` + `40-decisions.md` (‏`50-tasks.md` ב-`grep` בלבד) | **0** |
  | 💤 **שקט** | אין BLOCKER, ולמשימה הבאה יש תוכנית UX | כלום נוסף | 0 |
  | 🩺 **IMPROVE** | ‏`ACTIVE_WORKSTREAM` בלי שורה כשירה **או** טיק 17:00Z | `plan/61-deferred.md` + `docs/plan-open.md` | 0 |
  ```

  Replace only the 📐 row with:

  ```
  | 📐 **תכנון** | אין BLOCKER, ולמשימה הבאה אין תוכנית UX **· או** `story` · `nav` · `cards` · `arena` · `studies` מדדו ⬜=0 **בו-זמנית** — ⛔ **חובה, גוברת על 🩺 ועל 💤** (`T-258` · `D-190`) | `15-syllabus-digest.md` + `docs/plan-open.md` + `40-decisions.md` (‏`50-tasks.md` ב-`grep` בלבד) | **0** |
  ```

- [x] **Step 4: Add the same condition to `docs/agents/PM.md` STEP 1.7**

  In `docs/agents/PM.md`, find STEP 1.7's opening block:

  ```
  ## 🩺 STEP 1.7 — IMPROVE MODE, AND WHEN YOU ENTER IT  ⟦NEW 30/08 · D-146 · RULES § 0.6⟧

  **You have FOUR triage modes now, ⛔ not three.** Order: 🔬 research → 📐 planning → **🩺 IMPROVE** → 💤 quiet. ⇒ ⛔ **You ⛔ do NOT exit quiet while `plan/61-deferred.md` has something in it.**

  **Enter 🩺 when EITHER holds:**
  ```

  Insert a new block immediately after that paragraph and before `**Enter 🩺 when EITHER holds:**`:

  ```
  🔴 **`📐` PLANNING IS MANDATORY — ⛔ before you ever reach 🩺 or 💤 — when:**
  ```
  `story` · `nav` · `cards` · `arena` · `studies` ALL measure ⬜=0 AT THE SAME TIME
     ⇐ there is no slice left to work on ANYWHERE in `36 § 13` — cutting a new one
        is the only real next step, not an improvement row and not a quiet exit.
  ```
  ⚠️ **This condition OUTRANKS 🩺 IMPROVE and OUTRANKS 💤 quiet in the mode order above.**
  ⛔ Do not enter 🩺 or 💤 while it holds. Measured `docs/superpowers/plans/2026-09-05-improvement-plan.md § 3`: all five workflows sat empty and PM kept choosing 🩺/💤/decisions instead of opening a new slice — `ACTIVE_WORKSTREAM: general` absorbed every DEV tick for five days because nobody cut one. (`T-258` · `D-190`)

  ```

- [x] **Step 5: Run the test to verify it passes**

  Run: `npx vitest run scripts/agent-prompts.test.ts -t "T-258"`
  Expected: PASS.

  Then run the full file: `npx vitest run scripts/agent-prompts.test.ts`
  Expected: all tests pass (no other assertion reads the 📐 row or STEP 1.7's opening paragraph in a way this edit could break — confirm by reading the diff of `scripts/agent-prompts.test.ts` test failures, if any, before concluding).

- [x] **Step 6: Run `npm run check:rules`**

  Run: `npm run check:rules`
  Expected: exit 0 — the edit added a bracketed `T-258`/`D-190` reference, not a `RULES § x.y` citation, so no new citation needs an anchor; and no anchor heading text was renumbered or removed.

- [x] **Step 7: Commit**

  ```bash
  ./scripts/g add plan/RULES.md docs/agents/PM.md scripts/agent-prompts.test.ts
  ./scripts/g commit -m "loop(DEV): C-XXXX T-258 — 📐 planning mandatory when all five feature workflows measure ⬜=0"
  ```
  (Replace `C-XXXX` with the cycle id computed fresh at commit time.)

---

## Self-Check (run after both tasks)

1. **Spec coverage:** T-255's four sub-items (ⓐ tag definition in RULES, ⓑ `loop-health.mjs` re-count, ⓒ RULES § IMPROVE fence 6, ⓓ a proving test) are covered by Task 1 Steps 1–6. T-258's three sub-items (ⓐ RULES table condition, ⓑ same condition in PM.md STEP 1.7, ⓒ a guarding test) are covered by Task 2 Steps 1–7.
2. **Placeholder scan:** no `TODO`/`TBD`/"handle appropriately" in any step above — every step has literal code or literal Markdown to paste.
3. **Type/name consistency:** `IMPROVE_ROW_TAG` (Task 1) and `IMPROVE_ROW_TAG_LITERAL` (test-side copy) are deliberately two different names — the test does not import the implementation constant, matching how the rest of `scripts/loop-health.test.ts` treats `loop-health.mjs` as a black box invoked via `run()`. `FIVE_FLOWS` string is written identically (same backtick-and-middle-dot formatting) in the Task 2 test, the `RULES.md` edit, and the `PM.md` edit — verify this literally, character for character, when implementing, since the test does an exact substring match.
4. **Full verification:** after both commits, run `npm run verify` once, fresh, in the same message where you claim it passes (`superpowers:verification-before-completion`). Paste its literal exit status and pass counts into the tick report — do not say "should pass."

## Execution Handoff

Two execution options:

**1. Subagent-Driven (recommended)** - dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - execute tasks in this session using `executing-plans`, batch execution with checkpoints

This plan was authored by the scheduled DEV agent itself (planning tick, no code touched) and will be executed by that same DEV agent's next build tick(s) via `superpowers:executing-plans` — Task 1 and Task 2 are independent of each other and may be executed in either order or by two subagents per `superpowers:subagent-driven-development`, since they touch disjoint files except for `plan/RULES.md`, where each task edits a different, non-adjacent block (§ IMPROVE fences vs. the four-mode table).
