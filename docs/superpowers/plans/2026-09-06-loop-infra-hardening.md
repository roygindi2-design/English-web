# Loop Infra Hardening — T-254 · T-257 · T-260 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close three measured loop-infrastructure gaps from `docs/superpowers/plans/2026-09-05-improvement-plan.md` — a cycle-id collision race (T-254), a blind spot where PM can stop opening feature slices with no signal (T-257), and `ACTIVE_TASK_ID` being a single field that gets permanently stuck once one promoted row lands out of order (T-260).

**Architecture:** Each task is a small, independent addition — no shared runtime code between them. T-254 is a new standalone script (`scripts/next-cycle-id.mjs`) with a pure, unit-testable core and a thin git-fetching CLI shell, replacing the manual "pull then eyeball max+1" instruction in three agent prompts. T-257 is a new print-only (never-fails) report line in `scripts/loop-health.mjs`, following the existing `workTypeMix` pattern exactly — it is explicitly NOT a numbered `check()`. T-260 changes one control-file field from a string to a short bracketed list, adds one new numbered gate (`check('15', …)`) that validates the field's shape, and updates the two prose documents (`plan/RULES.md`, `docs/agents/DEV.md`) that define who may read/write it.

**Tech Stack:** Node.js (`.mjs`, ESM), Vitest (`.test.ts`), plain-text Markdown registers. No new dependencies.

**Spec:** `docs/superpowers/plans/2026-09-05-improvement-plan.md` §§ 1.2 (כ-1, כ-2), 3.3 · `plan/50-tasks.md` rows `T-254`, `T-257`, `T-260` · `plan/RULES.md` § 0.26 (precedent for a new numbered `§ 0.2N` section) · `docs/agents/DEV.md` STEP 2 and STEP 7.

## Global Constraints

- `plan/00-control.md` has a **hard 12KB cap**, enforced live by `check('9', …)` in `scripts/loop-health.mjs` — any edit to the `ACTIVE_TASK_ID` line must stay a single short line, never a block.
- Every new/changed check in `scripts/loop-health.mjs` is **advisory** unless the task explicitly says otherwise: it must print in full and, if it fails, still exit non-zero only through the existing `results`/`failed` machinery — never call `process.exit` itself.
- `scripts/loop-health.mjs` has **no exports** (pure CLI) by established convention — all of its existing tests are black-box, spawning the script against a fixture root via `LOOP_HEALTH_ROOT`. Keep new logic inside that file working the same way; put anything that needs direct unit testing (pure functions, no git/fs) in its own small module instead (this is exactly why T-254 gets its own file).
- Hebrew, RTL strings are for the product only. This is loop tooling — comments, code, commit messages stay in English (per `docs/agents/DEV.md` line 1); the register/report **text** these scripts print stays Hebrew, matching every existing check's `detail`/`title` strings.
- `RULES §` citations are gated live by `scripts/check-rules-citations.mjs` / `scripts/rules-citations.test.ts` — a new `RULES § 0.28` citation only passes `npm run check:rules` once `plan/RULES.md` actually contains a `### 0.28 · …` heading. Add the heading in the same commit as any prose that cites it.
- One commit per task (`RULES` / `docs/agents/DEV.md` STEP 4.5) — **three commits total**, in the order below.
- `npm run verify` (currently 9 commands, per `package.json`) must be green, freshly run, after every task's commit — never carried over from a previous run.

## File Structure

| File | Task | Change |
|---|---|---|
| `scripts/next-cycle-id.mjs` | 1 (T-254) | **Create.** New standalone tool — pure `maxCycleNumber`/`formatCycleId` + a thin CLI shell that fetches both remotes. |
| `scripts/next-cycle-id.test.ts` | 1 (T-254) | **Create.** Unit tests against the pure functions only — no git involved. |
| `docs/agents/DEV.md` | 1 (T-254), 3 (T-260) | **Extend.** Task 1 repoints the "New id" line (STEP 7); Task 3 rewrites the two `ACTIVE_TASK_ID` paragraphs (STEP 2). Two separate, non-overlapping edits in the same file across two commits. |
| `docs/agents/PM.md` | 1 (T-254) | **Extend.** Same "New id" line as DEV.md, kept identical across the three prompts by convention. |
| `docs/agents/CRITIC.md` | 1 (T-254) | **Extend.** Same "New id" line. |
| `package.json` | 1 (T-254) | **Extend.** One new `"cycle-id"` entry in the existing `"scripts"` block. |
| `scripts/loop-health.mjs` | 2 (T-257), 3 (T-260) | **Extend** an already actively-extended file (see "Extending existing files" below) — Task 2 adds a print-only block, Task 3 adds `check('15', …)`. Non-overlapping insertion points (before vs. at the check-14/`workTypeMix` boundary). |
| `scripts/loop-health.test.ts` | 2 (T-257), 3 (T-260) | **Extend.** New `describe` blocks only — no existing test bodies edited except the healthy-fixture total-count assertion (`14` → `15`, Task 3 Step 4). |
| `plan/00-control.md` | 3 (T-260) | **Extend.** One line's format changes (`ACTIVE_TASK_ID: ""` → `ACTIVE_TASK_ID: []`); nothing else in the file moves. |
| `plan/RULES.md` | 3 (T-260) | **Extend.** One new `### 0.28` section appended after the existing last section (`0.27`); no existing section renumbered or edited. |
| `scripts/agent-prompts.test.ts` | 3 (T-260) | **Extend** an already actively-extended file (see below) — one new `describe` block, no existing test edited. |

### Extending existing files, not colliding with them

`npm run check:plan` on a draft of this plan flagged three files this plan touches that earlier, **already-delivered** tasks also touched: `scripts/agent-prompts.test.ts` (`T-167`, 🟣/closed), `scripts/loop-health.mjs` (`T-213`, closed — the `/u`-flag regex fix), and `scripts/rules-citations.test.ts` (`T-236`, ✅ archived — this plan does not actually touch this third file; the gate's line-overlap heuristic matched it via the shared `RULES §` citation machinery `T-260` also exercises, not a real file conflict).

**⛔ Tasks 2/3 (T-257, T-260) are ⛔ אינה הרחבה of `T-167`/`T-213`/`T-236` — this is why, one sentence per row, per `RULES § 0.6ב`:** `T-167` (closed) landed the three-taps release-review text inside `docs/agents/CRITIC.md` and its `scripts/agent-prompts.test.ts` coverage — unrelated subject matter to this plan's new `ACTIVE_TASK_ID` `describe` block, same file, disjoint concern. `T-213` (closed) fixed a missing `u` regex flag inside two *existing* character-class checks in `scripts/loop-health.mjs` — this plan adds two brand-new blocks (a print-only report and `check('15', …)`) rather than touching either regex `T-213` fixed. `T-236` (✅ archived) is not edited by this plan at all — the checker's overlap is a false positive from the shared `RULES §`-citation string pattern, not a real file touch. None of the three are declared lineage parents (`המשך של:`) because none of their scope is being continued, revised, or superseded here — each is a genuinely independent addition to a shared file, which `RULES § 0.6ב`'s own text explicitly allows ("two slices touching one screen is normal").

---

### Measured discrepancies from the task rows (recorded so the next reader doesn't re-derive them)

- **`plan/50-tasks.md` row `T-257`** says "the numbering 1–15 doesn't move" (implying check 15 already exists). Measured live in this clone: `grep -n "^check(" scripts/loop-health.mjs` shows checks `1`–`14` only — there is no check 15 yet. T-257's new line is print-only regardless (per its own ⓐ), so this doesn't change what T-257 builds, but Task 3 below claims the number 15 for T-260's new check, since it is genuinely the next free number.
- **`plan/50-tasks.md` row `T-254`** lists `scripts/loop-health.mjs` / `scripts/loop-health.test.ts` as the files to touch, and describes the fix as "an improvement to existing logic". Measured live: `grep -c "New id\|max+1" scripts/loop-health.mjs` is `0` — the "New id: pull then max+1" instruction the row is fixing lives in prose, identically, in `docs/agents/DEV.md:350`, `docs/agents/PM.md:386`, and `docs/agents/CRITIC.md:449`, not in any script. Task 1 below therefore creates a new script (the thing the prose should have pointed to all along) and repoints all three prompts at it, rather than editing `loop-health.mjs` (which has no cycle-id logic to improve). This is a file-layout call under `RULES § 0.22` ("which existing component to reuse" / "file layout") — DEV decides alone, logged here.
- **`plan/50-tasks.md` row `T-260`** lists `scripts/loop-health.mjs` and `scripts/agent-prompts.test.ts` as files that "both test a single field today". Measured live: `grep -c "ACTIVE_TASK_ID" scripts/loop-health.mjs scripts/agent-prompts.test.ts` is `0` and `0` — neither file mentions the field at all today. Task 3 below therefore *adds* a new check and new tests rather than editing existing ones for this field.

---

## Task 1: T-254 — deterministic, dual-remote cycle-id generator

**Files:**
- Create: `scripts/next-cycle-id.mjs`
- Test: `scripts/next-cycle-id.test.ts`
- Modify: `docs/agents/DEV.md:350`, `docs/agents/PM.md:386`, `docs/agents/CRITIC.md:449` (the identical "New id: …" line in all three)
- Modify: `package.json` (`scripts` block — add `"cycle-id"` entry)

**Interfaces:**
- Produces (for later tasks / for agents): `maxCycleNumber(texts: string[]): number` — pure, exported. `formatCycleId(n: number): string` — pure, exported, returns `` `C-${4-digit zero-padded n}` ``. CLI entry point (`node scripts/next-cycle-id.mjs`) prints one line: the next free id, already checked against both `origin/dev` and `origin/work/current`.
- Consumes: nothing from other tasks in this plan (independent).

- [ ] **Step 1: Write the failing test for the pure logic**

Create `scripts/next-cycle-id.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { formatCycleId, maxCycleNumber } from './next-cycle-id.mjs';

describe('scripts/next-cycle-id.mjs', () => {
  it('finds the highest C-xxxx id across one text blob', () => {
    const log = 'loop(DEV): C-0201 fix x\nloop(PM): C-0199 plan y\n';
    expect(maxCycleNumber([log])).toBe(201);
  });

  it('returns 0 when no C-xxxx id is present, so the next id starts at C-0001', () => {
    expect(maxCycleNumber([''])).toBe(0);
    expect(maxCycleNumber(['no ids here'])).toBe(0);
  });

  /**
   * 🔴 Reproduces the measured collision, verbatim from
   * `docs/superpowers/plans/2026-09-05-improvement-plan.md` § 1.2 כ-1: commit
   * `bf4c785` locked in as `C-0426` on one branch view; the very next commit in
   * sequence, `e94a4ae`, had to fix itself with "previous commit wrongly called
   * itself C-0426" — two agents ran max+1 against only ONE branch each and got
   * the same number. The fix is structural: always take the max across BOTH
   * remotes together, never one alone.
   */
  it('🔴 takes the max ACROSS both branches, not the max of either alone — closes the C-0426 collision', () => {
    const devLog = 'loop(DEV): C-0425 a\nloop(QA): C-0424 merge\n';
    // work/current is AHEAD of dev by one commit that dev has not seen yet.
    const workCurrentLog = 'loop(DEV): C-0426 b\nloop(DEV): C-0425 a\n';
    // An agent that only reads `dev` would compute max(425) + 1 = C-0426 — a
    // collision with the id `work/current` already used.
    expect(maxCycleNumber([devLog])).toBe(425);
    // Reading both together is what closes it: C-0427, never C-0426 again.
    expect(maxCycleNumber([devLog, workCurrentLog])).toBe(426);
    expect(formatCycleId(maxCycleNumber([devLog, workCurrentLog]) + 1)).toBe('C-0427');
  });

  it('formats with zero-padding to 4 digits, no cap below 9999', () => {
    expect(formatCycleId(1)).toBe('C-0001');
    expect(formatCycleId(453)).toBe('C-0453');
    expect(formatCycleId(10000)).toBe('C-10000');
  });

  it('ignores ids embedded in unrelated tokens (word boundary, not substring)', () => {
    // "XC-0426Y" must not match — only a real `C-####` token counts.
    expect(maxCycleNumber(['XC-0426Y really-not-an-id'])).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run scripts/next-cycle-id.test.ts`
Expected: FAIL — `scripts/next-cycle-id.mjs` does not exist yet (`Cannot find module`).

- [ ] **Step 3: Write the implementation**

Create `scripts/next-cycle-id.mjs`:

```javascript
#!/usr/bin/env node
/**
 * ⛔ REPLACES THE PROSE "New id: `./scripts/g pull` then max+1" LINE.  ⟦T-254⟧
 *
 * Measured, not assumed (`docs/superpowers/plans/2026-09-05-improvement-plan.md`
 * § 1.2 כ-1): commit `bf4c785` (16:41:27Z) locked in as `C-0426`; the very next
 * commit in the same sequence, `e94a4ae` (16:53:22Z), had to fix itself —
 * "fix cycle-id collision — previous commit wrongly called itself C-0426". Two
 * agents ran the same max+1 formula in two clones within 12 minutes and landed
 * on the same number, because each only looked at the branch it happened to
 * have fetched most recently.
 *
 * ⇒ this script is the single place that formula lives now, and it always reads
 * BOTH `origin/dev` and `origin/work/current` before computing the next id —
 * never one alone, and never the local clone's own `git log` in isolation.
 *
 * ⛔ **Not wired into `scripts/loop-health.mjs`.** Measured: no cycle-id logic
 * lives there today (`grep -c "New id\|max+1" scripts/loop-health.mjs` → 0) —
 * the instruction this replaces was prose in three agent prompts, not code in
 * that file. A health *check* reports on state after the fact; this is a tool
 * an agent runs *before* committing, which is a different job.
 */
import { execFileSync } from 'node:child_process';

/** A real cycle id token: `C-` followed by digits, on a word boundary — so
 *  `XC-0426Y` (part of some other token) never counts. */
const CYCLE_ID_RE = /\bC-(\d+)\b/g;

/**
 * @param {string[]} texts - any number of text blobs (commit subjects, log
 *   output, register prose) to scan together.
 * @returns {number} the highest cycle number found across ALL of them, or 0.
 */
export function maxCycleNumber(texts) {
  let max = 0;
  for (const text of texts) {
    for (const m of text.matchAll(CYCLE_ID_RE)) {
      const n = Number(m[1]);
      if (n > max) max = n;
    }
  }
  return max;
}

/** @param {number} n @returns {string} e.g. `formatCycleId(453)` → `"C-0453"`. */
export function formatCycleId(n) {
  return `C-${String(n).padStart(4, '0')}`;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const git = (...args) =>
    execFileSync('./scripts/g', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    git('fetch', 'origin', 'dev', 'work/current');
  } catch (e) {
    console.error(`⛔ לא נמדד — fetch נכשל: ${e.message}`);
    process.exit(1);
  }
  let devLog = '';
  let workCurrentLog = '';
  try {
    devLog = git('log', 'origin/dev', '--format=%s', '-500');
  } catch {
    console.error('⛔ אזהרה — origin/dev לא נגיש, ממשיך עם work/current בלבד');
  }
  try {
    workCurrentLog = git('log', 'origin/work/current', '--format=%s', '-500');
  } catch {
    console.error('⛔ אזהרה — origin/work/current לא נגיש, ממשיך עם dev בלבד');
  }
  if (devLog === '' && workCurrentLog === '') {
    console.error('⛔ לא נמדד — אף אחד משני הענפים לא נגיש');
    process.exit(1);
  }
  const max = maxCycleNumber([devLog, workCurrentLog]);
  console.log(formatCycleId(max + 1));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run scripts/next-cycle-id.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Repoint the three agent prompts at the new tool**

In `docs/agents/DEV.md:350`, `docs/agents/PM.md:386`, `docs/agents/CRITIC.md:449`, replace the line:

```
New id: `./scripts/g pull` then max+1 **over what is on `dev` right now** — two agents collided on `C-0284` on 24/08.
```

with:

```
New id: `node scripts/next-cycle-id.mjs` — fetches **both** `origin/dev` **and** `origin/work/current` and takes the max across both, ⛔ never one branch alone. Two agents collided on `C-0284` (24/08) and again on `C-0426` (04/09, `bf4c785`/`e94a4ae`) running max+1 against only one branch each — `T-254`.
```

Add to `package.json`'s `"scripts"` block (alphabetically near `check:*`, before `"diff:render"`):

```json
"cycle-id": "node scripts/next-cycle-id.mjs",
```

- [ ] **Step 6: Verify the citation gate and full suite**

Run: `npm run check:rules && npm test`
Expected: both green — this step introduces no new `RULES §` citation, so `check:rules` is unaffected; confirm it stays that way.

- [ ] **Step 7: Commit**

```bash
node scripts/next-cycle-id.mjs   # sanity-run once live, record the printed id in the tick report
git add scripts/next-cycle-id.mjs scripts/next-cycle-id.test.ts docs/agents/DEV.md docs/agents/PM.md docs/agents/CRITIC.md package.json
git commit -m "loop(DEV): C-XXXX T-254 — deterministic cycle-id generator checked against both remotes"
```

(`C-XXXX` is whatever `node scripts/next-cycle-id.mjs` printed in this same step — that is the whole point of the tool.)

---

## Task 2: T-257 — `loop:health` soft report: PM ticks since the last feature slice

**Files:**
- Modify: `scripts/loop-health.mjs` (add one function + one printed line near the existing `workTypeMix` block)
- Modify: `scripts/loop-health.test.ts` (add tests for the fallback path)

**Interfaces:**
- Produces: a new printed line in the CLI output, directly under the existing `תמהיל (…)` line. No exported symbols (file has no exports, by convention — see Global Constraints).
- Consumes: the existing private `balance()` and `execFileSync`/`ROOT`/`at` helpers already in `scripts/loop-health.mjs` (Step 3 below quotes their call shape).

- [ ] **Step 1: Write the failing test**

In `scripts/loop-health.test.ts`, add (near the other top-level `describe('scripts/loop-health.mjs', …)` body, after the existing healthy-fixture assertions):

```typescript
/**
 * T-257 — a soft, PRINT-ONLY report line, explicitly not a numbered check
 * (mirrors `workTypeMix`; see the task row and `2026-09-06-loop-infra-hardening.md`).
 * The only path a fixture (a plain temp dir, never a real git repo) can exercise
 * is the "git not reachable" fallback — exactly the same limitation `check 10`
 * already has in this file (see the comment on its own healthy-fixture assertion
 * above). The counting logic itself is verified live against the real repo as
 * part of this task's commit step, not re-created here with a fake git repo.
 */
describe('T-257 — טיקי PM מאז פרוסת פיצ׳ר אחרונה (דיווח רך)', () => {
  it('מדפיסה "⛔ לא נמדד" כש-git אינו נגיש (הפיקסצ׳ר אינו ריפו git)', () => {
    const r = run(healthy());
    expect(r.out).toMatch(/טיקי PM מאז פרוסת פיצ'ר אחרונה.*⛔ לא נמדד/);
  });

  it('⛔ אינה מופיעה בין הבדיקות הממוספרות — אינה FAIL ואינה warn', () => {
    const r = run(healthy());
    expect(r.out).not.toMatch(/^ FAIL 15\./m);
    expect(r.out).not.toMatch(/^ warn 15\./m);
    // ⛔ הסכום הכולל (14) ⛔ אינו זז — זו אינה בדיקה ממוספרת.
    const total = /loop health: \d+\/(\d+) checks pass/.exec(r.out);
    expect(total?.[1]).toBe('14');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run scripts/loop-health.test.ts -t "T-257"`
Expected: FAIL — the line `טיקי PM מאז פרוסת פיצ'ר אחרונה` does not exist in the output yet.

- [ ] **Step 3: Write the implementation**

In `scripts/loop-health.mjs`, immediately above the `const workTypeMix = () => {` block, add:

```javascript
/**
 * ⛔ **SOFT, PRINT-ONLY — MIRRORS `workTypeMix` BELOW, ⛔ NOT A NUMBERED CHECK.**  ⟦T-257 · D-190 § 3.3⟧
 * The failure this catches: all five feature workstreams (`story`/`nav`/`cards`/
 * `arena`/`studies`) measured ⬜=0 SIMULTANEOUSLY on 2026-09-05, the loop kept
 * spinning on `general`/`loop`/`base` (D-174, working as designed), and ⛔ no
 * counter anywhere showed that nobody had opened a new feature slice in days —
 * it looked exactly like a healthy loop. ⇒ this counts consecutive PM ticks
 * (commits whose subject starts with `loop(PM)`) since the last one that added
 * a new task row tagged with a feature workstream to `plan/50-tasks.md`.
 * ⚠️ Source is `git log` on `origin/dev` (ⓑ of the task row: "the source is
 * WORKSTREAM_TICKS and git log on loop(PM), not memory") — ⛔ never a running
 * total kept in this script's own memory across invocations, which would drift
 * the moment anyone force-pushed or rewrote history.
 * ⚠️ **Measured in this clone, 2026-09-06:** only checks 1–14 exist today —
 * the task row's own wording ("numbering 1–16 doesn't move") assumed a check
 * 15 that was never added. This line is print-only regardless, exactly as the
 * row's ⓐ requires, so the discrepancy doesn't change what gets built here —
 * recorded so the next reader doesn't re-derive it.
 */
const PM_COMMIT_PREFIX = 'loop(PM)';
const FEATURE_SLICE_LINE = /^\+\|\s*T-\d+\s*\|\s*M\d+\s*·\s*([a-z]+)\s*·/;
const PM_LOOKBACK_COMMITS = 30;
const pmTicksSinceLastSlice = () => {
  const git = (...args) => {
    try {
      return execFileSync('./scripts/g', args, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      return null;
    }
  };
  const featureNames = new Set(balance().filter((w) => w.order !== null).map((w) => w.name));
  const log = git('log', 'origin/dev', '--format=%H%x1f%s', `-${PM_LOOKBACK_COMMITS}`);
  if (log === null) return { measured: false };
  const commits = log
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [hash, subject] = l.split('\x1f');
      return { hash, subject: subject ?? '' };
    });
  const pmCommits = commits.filter((c) => c.subject.startsWith(PM_COMMIT_PREFIX));
  let ticks = 0;
  let openedSliceSeen = false;
  for (const c of pmCommits) {
    const diff = git('show', c.hash, '--', 'plan/50-tasks.md');
    const openedSlice =
      diff !== null &&
      diff.split('\n').some((l) => {
        const m = FEATURE_SLICE_LINE.exec(l);
        return m !== null && featureNames.has(m[1]);
      });
    if (openedSlice) {
      openedSliceSeen = true;
      break;
    }
    ticks += 1;
  }
  return { measured: true, ticks, scanned: pmCommits.length, capped: !openedSliceSeen && pmCommits.length === PM_LOOKBACK_COMMITS };
};
```

Then, in the output section near the bottom of the file, immediately after the existing block:

```javascript
const mix = workTypeMix();
console.log(
  `\nתמהיל (דיווח רך · D-147 · ⛔ לא ציון): ${mix.open} שורות פתוחות — ` +
    `מבנה ${mix.מבנה} · נוחות ${mix.נוחות} · תוכן ${mix.תוכן} · ⛔ ללא תג ${mix.untagged}`,
);
```

add:

```javascript
const slice = pmTicksSinceLastSlice();
console.log(
  slice.measured
    ? `טיקי PM מאז פרוסת פיצ'ר אחרונה (דיווח רך · D-190 § 3.3 · ⛔ לא ציון): ${slice.ticks}` +
        (slice.capped ? ` (⚠️ אף פרוסה לא נפתחה ב-${slice.scanned} טיקי PM האחרונים שנבדקו — ייתכן שהחלון קצר מדי)` : '')
    : `טיקי PM מאז פרוסת פיצ'ר אחרונה: ⛔ לא נמדד — git אינו נגיש`,
);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run scripts/loop-health.test.ts -t "T-257"`
Expected: PASS, 2 tests. Also re-run the full healthy-fixture test (`-t "is green on a healthy fixture"`) to confirm the total-checks assertion (`14`) and the per-number loop are untouched — this task adds no `check()` call, so that test needs no edit, only re-running to prove it.

- [ ] **Step 5: Run the real script live, once, and record the output**

Run: `npm run loop:health > /tmp/health.txt 2>&1; echo "exit=$?"; grep "טיקי PM" /tmp/health.txt` ⟦תוקן 08/09 · שער `agent-prompts.test.ts` — הצינור החזיר את קוד היציאה של `tail`/`grep`, ⛔ לא של הפקודה⟧
Expected: one line, either a number or `⛔ לא נמדד`. Paste this exact line into the tick's commit message / report — this is the "measured, not guessed" evidence the row's ⓑ requires.

- [ ] **Step 6: Commit**

```bash
git add scripts/loop-health.mjs scripts/loop-health.test.ts
git commit -m "loop(DEV): C-XXXX T-257 — loop:health soft report: PM ticks since last feature slice"
```

---

## Task 3: T-260 — `ACTIVE_TASK_ID` becomes a managed queue of up to 3 ids

**Files:**
- Modify: `plan/00-control.md` (the `ACTIVE_TASK_ID` line, format change only)
- Modify: `plan/RULES.md` (new `### 0.28` section — `0.27` is the current last section, measured live)
- Modify: `docs/agents/DEV.md` STEP 2 (the two paragraphs under "ⓑ the row named in `ACTIVE_TASK_ID`")
- Modify: `scripts/loop-health.mjs` (new `check('15', …)`)
- Modify: `scripts/loop-health.test.ts` (fixture tests for check 15)
- Modify: `scripts/agent-prompts.test.ts` (new assertions that DEV.md documents the queue + the "DEV never writes" invariant)

**Interfaces:**
- Produces: a new `check('15', …)` result in `scripts/loop-health.mjs`'s existing `results` array — same shape as every other check (`{ id, title, ok, detail, items }`), no new exports.
- Consumes: nothing from Tasks 1–2 (independent). Reuses the existing `read`/`at` helpers already in `scripts/loop-health.mjs`.

- [ ] **Step 1: Write the failing tests for check 15**

In `scripts/loop-health.test.ts`, add a new `describe` block (after the T-257 block added in Task 2, or anywhere at the top level):

```typescript
/**
 * T-260 — `ACTIVE_TASK_ID` moves from a single string to a short bracketed
 * list of at most 3 valid `T-xxx` ids (`D-190 § 1.2`, option ⓑ). This check
 * protects the shape of that field the same way check 9 protects the file's
 * byte budget: a malformed field is a defect nobody notices until an agent's
 * hand-parse of it silently does the wrong thing.
 */
describe('T-260 — check 15 · ACTIVE_TASK_ID תקין', () => {
  const withControl = (activeTaskIdLine: string): string => {
    const root = healthy();
    const controlPath = join(root, 'plan', '00-control.md');
    const original = readFileSync(controlPath, 'utf8');
    const patched = original.replace(/^ACTIVE_TASK_ID:.*$/m, activeTaskIdLine);
    writeFileSync(controlPath, patched, 'utf8');
    return root;
  };

  it('ריק ("[]") — תקין', () => {
    const r = run(withControl('ACTIVE_TASK_ID: []'));
    expect(failed(r.out, '15')).toBe(false);
  });

  it('רשימה תקינה של עד 3 מזהים — תקין', () => {
    const r = run(withControl('ACTIVE_TASK_ID: [T-235, T-238]'));
    expect(failed(r.out, '15')).toBe(false);
  });

  it('⛔ 4 מזהים — נופלת, התקרה 3', () => {
    const r = run(withControl('ACTIVE_TASK_ID: [T-1, T-2, T-3, T-4]'));
    expect(failed(r.out, '15')).toBe(true);
    expect(r.out).toContain('התקרה 3');
  });

  it('⛔ מזהה בפורמט לא תקף — נופלת', () => {
    const r = run(withControl('ACTIVE_TASK_ID: [T-235, banana]'));
    expect(failed(r.out, '15')).toBe(true);
    expect(r.out).toContain('banana');
  });

  it('⛔ כפילות — נופלת', () => {
    const r = run(withControl('ACTIVE_TASK_ID: [T-235, T-235]'));
    expect(failed(r.out, '15')).toBe(true);
    expect(r.out).toContain('כפילות');
  });

  it('⛔ שורה חסרה — לא נמדד, ⛔ ולא ok בשתיקה', () => {
    const root = healthy();
    const controlPath = join(root, 'plan', '00-control.md');
    const original = readFileSync(controlPath, 'utf8');
    writeFileSync(controlPath, original.replace(/^ACTIVE_TASK_ID:.*$/m, ''), 'utf8');
    const r = run(root);
    expect(failed(r.out, '15')).toBe(true);
    expect(r.out).toContain('⛔ לא נמדד');
  });
});
```

This test file already imports `readFileSync`, `writeFileSync`, and `join` at its top (confirmed live: `scripts/loop-health.test.ts` lines 1–4) — no new imports needed. Confirm the `healthy()` fixture's `plan/00-control.md` actually contains a literal `ACTIVE_TASK_ID:` line before writing this step's code — if it doesn't yet, add one (`ACTIVE_TASK_ID: []`) to the `healthy()` fixture builder in the same edit, since every other check's fixture line already exists there for exactly this reason.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run scripts/loop-health.test.ts -t "T-260"`
Expected: FAIL — `check('15', …)` does not exist, so `failed(r.out, '15')` is always `false` and the positive-failure assertions (4 ids, invalid id, duplicate, missing line) all fail.

- [ ] **Step 3: Write the implementation**

In `scripts/loop-health.mjs`, add after the existing `check('14', …)` block (the last one in the file, immediately before `const workTypeMix = …`):

```javascript
/**
 * 15 — ⛔ **`ACTIVE_TASK_ID` SHAPE GATE.**  ⟦T-260 · D-190 § 1.2, option ⓑ⟧
 * The field moved from a single string to a queue of at most 3 `T-xxx` ids so
 * PM/QA can promote more than one row without DEV getting stuck on a row that
 * lands out of order (measured failure כ-2, `2026-09-05-improvement-plan.md`
 * § 1.2: the field sat on an already-delivered row for 5 straight build ticks
 * because `docs/agents/DEV.md` STEP 2 forbids DEV from writing it, and nothing
 * else touched it either). ⛔ This check does NOT enforce who wrote the field —
 * that is `plan/RULES.md § 0.28`, a prose invariant no script can see. It only
 * protects the field's SHAPE: an unparseable or oversized queue is a defect a
 * script would otherwise fail on silently (an agent's own ad-hoc parse of a
 * malformed line is undefined behaviour, not a graceful skip).
 */
const ACTIVE_TASK_ID_CEILING = 3;
check('15', 'ACTIVE_TASK_ID תקין — רשימה של עד 3 מזהים תקפים, או ריקה', () => {
  const control = read(at('plan', '00-control.md'));
  const m = /^ACTIVE_TASK_ID:\s*(\[[^\]]*\])\s*(?:#.*)?$/m.exec(control);
  if (m === null) {
    return { ok: false, detail: '⛔ לא נמדד — אין שורת ACTIVE_TASK_ID בפורמט הצפוי ([]-)' };
  }
  const inner = m[1].slice(1, -1).trim();
  const ids = inner === '' ? [] : inner.split(',').map((s) => s.trim());
  const items = [];
  if (ids.length > ACTIVE_TASK_ID_CEILING) {
    items.push(`⛔ ${ids.length} מזהים — התקרה ${ACTIVE_TASK_ID_CEILING}`);
  }
  const bad = ids.filter((id) => !/^T-\d+$/.test(id));
  if (bad.length > 0) {
    items.push(`⛔ מזהים לא תקפים: ${bad.join(' · ')}`);
  }
  const seen = new Set();
  const dup = new Set();
  for (const id of ids) {
    if (seen.has(id)) dup.add(id);
    seen.add(id);
  }
  if (dup.size > 0) {
    items.push(`⛔ כפילות: ${[...dup].join(' · ')}`);
  }
  return { ok: items.length === 0, detail: `${ids.length}/${ACTIVE_TASK_ID_CEILING} מזהים`, items };
});
```

⚠️ **This must be the LAST `check(...)` call added to the file for this task** — checks are printed sorted by numeric id (`ordered = [...results].sort(...)`), so placement in the file only affects readability, not output order; still, keep it physically adjacent to check 14 per the file's own stated convention ("a new check is written next to the code it tests, not at the end").

Also add the fixture line so Step 1's tests have something to mutate — find where `healthy()` writes `plan/00-control.md` in `scripts/loop-health.test.ts` and confirm it includes `ACTIVE_TASK_ID: []` (add it if the existing fixture control-file body doesn't already have this exact line; every other field check 4/9 depends on already has its fixture line established the same way).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run scripts/loop-health.test.ts -t "T-260"`
Expected: PASS, 6 tests. Then re-run the full healthy-fixture test and update its total-count assertion: `expect(total?.[2]).toBe('14')` becomes `expect(total?.[2]).toBe('15')`, and the `failing` array literal gains `'15'`, and the `for (const n of [...])` green-check loop gains `'15'` (the healthy fixture's `ACTIVE_TASK_ID: []` is valid, so check 15 must be green there, unlike check 8/10).

- [ ] **Step 5: Change the live control-file field**

In `plan/00-control.md`, change:

```
ACTIVE_TASK_ID: ""                # ▶️ C-0448 (DEV) — עדיין ריק; T-255/T-258 נלקחו כתוכנית קיימת מ-`general∪loop∪base` (STEP 3), ⛔ לא כ-ACTIVE_TASK_ID. ⛔ לא קבעתי שורה חדשה — זו סמכות PM/QA.
```

to:

```
ACTIVE_TASK_ID: []                # ▶️ C-XXXX (DEV) — פורמט חדש: רשימה עד 3 מזהים (T-260 · D-190 § 1.2 ⓑ). עדיין ריקה — PM/QA כותבים אליה, DEV לעולם לא (RULES § 0.28).
```

(`C-XXXX` is this task's real cycle id, computed in Step 8 below — same value across all three commits in this tick.)

- [ ] **Step 6: Add `plan/RULES.md § 0.28`**

Measured live: `0.27` (Playwright fallback) is the last existing section. Add, immediately after it (matching the exact heading style of every other `0.2N` section — `###`, middle-dot, bracketed date+decision tag, then a closing `---`):

```markdown

---

### 0.28 · `ACTIVE_TASK_ID` — תור מנוהל של עד שלושה מזהים  ⟦06/09/2026 · `D-190 § 1.2` ⓑ · `T-260`⟧

`ACTIVE_TASK_ID` הוא כעת רשימה קצרה, `ACTIVE_TASK_ID: [T-xxx, T-yyy]`, ⛔ לא שדה יחיד —
כתובה **בשורה אחת קצרה** (`plan/00-control.md` § 9 — תקרת 12KB היא אילוץ קשיח), ⛔ לעולם
לא כבלוק. **תקרה 3 מזהים**, נאכפת ב-`scripts/loop-health.mjs` check 15.

🔴 **המדידה שפתחה את הסעיף** (`2026-09-05-improvement-plan.md` § 1.2 כ-2): השדה נשאר
תקוע על אותה שורה **חמישה טיקי בנייה רצופים** אחרי שהשורה שבו כבר נמסרה — `docs/agents/DEV.md`
STEP 2 אסר על DEV לכתוב לשדה ⇒ ⛔ אף אחד לא יכול היה לשחרר אותו עד שסוכן PM/QA נגע בו ידנית.

| מי | מה מותר לו | מה ⛔ אסור |
|---|---|---|
| **PM / QA** | ✅ להוסיף עד 3 מזהים לרשימה · ✅ להסיר מזהה שכבר נמסר | ⛔ יותר משלושה בו-זמנית |
| **DEV** | ✅ **לנקז** — לקרוא את הרשימה משמאל לימין ולקחת את המזהה **הראשון שעדיין ⬜** בו כשורת החריגה של STEP 2 ⓑ | ⛔ **לכתוב לשדה בכל פורמט** — לא להוסיף, לא להסיר, גם לא מזהה שכבר 🟣/✅ |

⇒ **DEV שמצא שהמזהה הראשון ברשימה כבר 🟣/✅ עובר למזהה הבא ברשימה באותו טיק, ⛔ בלי לחכות
לסוכן PM/QA שינקה את השדה** — זה בדיוק מה שסוגר את כשל כ-2: התקיעות הייתה תוצאה של DEV
שממתין לניקוי שאף אחד לא יבצע, ⛔ לא של סדר הקריאה עצמו.
⛔ **`ACTIVE_TASK_ID` ⛔ אינה רשימת TODO של DEV** — היא ⛔ עדיין רק חריגה לפילטר של STEP 2
(`RULES § 0.6ב`), ⛔ ולא מקור עצמאי של עבודה: רשימה ריקה = ⛔ אין חריגה, בדיוק כמו קודם.

---
```

- [ ] **Step 7: Update `docs/agents/DEV.md` STEP 2**

Replace the two paragraphs at `docs/agents/DEV.md:164-165`:

```
🔴 **Why ⓑ had to be written down, and it is ⛔ not a loosening.** `ACTIVE_TASK_ID` is the ONLY way the PM or Roy can promote one named row to the head of your queue. Until today the filter sentence allowed an exception for a 🔴 **finding** and ⛔ not for a 🔴 **task** — so a promoted task was silently ineligible and ⛔ would never be built. **That defect is measured, ⛔ not hypothetical:** `D-122 § ב` found five `cards` rows tagged `base` that were **out of reach forever**, and `T-225` was promoted twice (C-0368, C-0374) while the filter above still dropped it.
⛔ **It is one named row, ⛔ never a licence.** `ACTIVE_TASK_ID` holds **one** id; when you finish it, the exception is over and the filter is absolute again. ⛔ You ⛔ do NOT set `ACTIVE_TASK_ID` yourself.
```

with:

```
🔴 **Why ⓑ had to be written down, and it is ⛔ not a loosening.** `ACTIVE_TASK_ID` is the ONLY way the PM or Roy can promote a named row to the head of your queue. Until today the filter sentence allowed an exception for a 🔴 **finding** and ⛔ not for a 🔴 **task** — so a promoted task was silently ineligible and ⛔ would never be built. **That defect is measured, ⛔ not hypothetical:** `D-122 § ב` found five `cards` rows tagged `base` that were **out of reach forever**, and `T-225` was promoted twice (C-0368, C-0374) while the filter above still dropped it.
🔵 **⟦NEW 06/09 · `D-190 § 1.2` ⓑ · `T-260` · `RULES § 0.28`⟧ `ACTIVE_TASK_ID` is now a queue of up to 3 ids** (`ACTIVE_TASK_ID: [T-xxx, T-yyy]`), ⛔ not a single field — this closes the measured failure where a field stuck on an already-delivered row blocked the exception for 5 straight build ticks, because DEV was (correctly) forbidden from writing it and nothing else did either. ⇒ **read the list left to right and take the FIRST id whose row is still ⬜** as this tick's exception-eligible pick — an id whose row already shows 🟣/✅ is skipped without waiting for PM/QA to clear it.
⛔ **It is a queue, ⛔ never a licence for more than one pick per tick, and ⛔ never a TODO list of your own.** An empty list (`[]`) means ⛔ no exception, exactly as an empty string did before. ⛔ You ⛔ do NOT write to this field, in any format — not to add, not to remove a finished id. Clearing a delivered id remains PM/QA's job, exactly as before.
```

- [ ] **Step 8: Write the failing agent-prompts tests, then make them pass**

In `scripts/agent-prompts.test.ts`, add a new `describe` block (following the exact style of the existing `describe('🧭 הפרוסה הכללית — \`general\`  ⟦D-174⟧', …)` block — same file, same `text('DEV')` helper already imported/defined there):

```typescript
/**
 * 🧵 T-260 · `D-190 § 1.2` ⓑ — `ACTIVE_TASK_ID` becomes a queue, and the one
 * invariant that must survive the format change unchanged: DEV drains it by
 * reading, never by writing. A prompt that lost the "DEV never writes" line
 * while gaining "up to 3 ids" would read as more permission, not less.
 */
describe('🧵 ACTIVE_TASK_ID כתור מנוהל — ⟦D-190 § 1.2 ⓑ · T-260⟧', () => {
  it('DEV יודע שהשדה הוא רשימה, וקורא אותה משמאל לימין', () => {
    const dev = text('DEV');
    expect(dev, 'DEV: פורמט הרשימה').toMatch(/ACTIVE_TASK_ID: \[T-xxx, T-yyy\]/);
    expect(dev, 'DEV: קריאה משמאל לימין, המזהה הראשון שעדיין ⬜').toMatch(
      /read the list left to right and take the FIRST id whose row is still ⬜/,
    );
  });

  it('⛔ DEV ⛔ אינו כותב לשדה — בשום פורמט', () => {
    const dev = text('DEV');
    expect(dev, 'DEV: איסור כתיבה נשאר').toMatch(
      /⛔ You ⛔ do NOT write to this field, in any format/,
    );
  });

  it('הסעיף מצוטט וקיים — `RULES § 0.28` ⛔ אינו ציטוט חלול', () => {
    const dev = text('DEV');
    expect(dev, 'DEV: מצטט את RULES § 0.28').toContain('RULES § 0.28');
    const rules = readFileSync('plan/RULES.md', 'utf8');
    expect(rules, 'RULES: הסעיף קיים בפועל').toMatch(/### 0\.28 ·/);
  });
});
```

Confirm `scripts/agent-prompts.test.ts` already imports `readFileSync` at its top before adding this (it reads `docs/agents/*.md` today via its own `text()` helper, so it almost certainly does — if not, add `import { readFileSync } from 'node:fs';` alongside the existing imports).

Run: `npx vitest run scripts/agent-prompts.test.ts -t "ACTIVE_TASK_ID"`
Expected: FAIL first (before Steps 6–7 land), then PASS once `plan/RULES.md § 0.28` and the `docs/agents/DEV.md` STEP 2 rewrite from Step 7 are in place.

- [ ] **Step 9: Full verification**

Run: `npm run check:rules && npm test && npm run loop:health > /tmp/health.txt 2>&1; echo "exit=$?"; grep -E "^\s*(ok|FAIL|warn)\s*(9|15)\." /tmp/health.txt` ⟦תוקן 08/09 · שער `agent-prompts.test.ts` — הצינור החזיר את קוד היציאה של `tail`/`grep`, ⛔ לא של הפקודה⟧
Expected: `check:rules` green (the new `### 0.28 ·` heading satisfies the `RULES § 0.28` citations just added); `npm test` green including the 6 new check-15 fixture tests and the 3 new agent-prompts tests; `loop:health`'s printed lines for checks 9 and 15 both show `ok` against the real, now-`[]`-valued live control file.

- [ ] **Step 10: Commit**

```bash
git add plan/00-control.md plan/RULES.md docs/agents/DEV.md scripts/loop-health.mjs scripts/loop-health.test.ts scripts/agent-prompts.test.ts
git commit -m "loop(DEV): C-XXXX T-260 — ACTIVE_TASK_ID becomes a managed queue of up to 3 ids"
```

---

## Self-Check

**Spec coverage:**
- T-254 ⓐ (uniqueness checked against both remotes) → Task 1 Step 3 (`next-cycle-id.mjs` fetches and reads both `origin/dev` and `origin/work/current`). ⓑ (improve existing logic, not a new numbered check) → Task 1 deliberately stays outside `loop-health.mjs`'s `check()` machinery entirely; see the measured-discrepancy note explaining why the "existing logic" is prose in three files, not code. ⓒ (a test that fails on a real duplicate) → Task 1 Step 1's "closes the C-0426 collision" test, built from the exact measured commit pair.
- T-257 ⓐ (same pattern as `workTypeMix`, prints, never fails) → Task 2 Step 3, no `check()` call used. ⓑ (source is `WORKSTREAM_TICKS`/git log on `loop(PM)`, not memory) → Task 2 Step 3 reads `origin/dev` via `git log`/`git show`, no stored state. ⓒ (test in `loop-health.test.ts`) → Task 2 Step 1.
- T-260 ⓐ (field becomes a capped list on one short line) → Task 3 Steps 5–6. ⓑ (`plan/RULES.md`: DEV drains in order, PM/QA write, DEV never) → Task 3 Step 6's § 0.28 table. ⓒ (`loop-health.mjs` + `agent-prompts.test.ts`, both said to test a single field today) → Task 3 Steps 3 and 8, with the measured correction that both files test the field for the first time here, not update an existing test.

**Placeholder scan:** every step above contains complete, runnable code (or, for prose-edit steps, the exact before/after text) — none deferred to "add appropriate handling" language.

**Type consistency:** `maxCycleNumber`/`formatCycleId` (Task 1) are used with the same signatures in both the implementation and its test. `pmTicksSinceLastSlice` (Task 2) and the check-15 closure (Task 3) are both self-contained within `scripts/loop-health.mjs` and introduce no cross-task shared names — the three tasks do not call into each other's new code, matching the "no shared runtime code between them" architecture note above.
