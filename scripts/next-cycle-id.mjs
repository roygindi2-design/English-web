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
 * ALL THREE of `origin/dev`, `origin/work/current` and `origin/main` before
 * computing the next id — never one alone, and never the local clone's own
 * `git log` in isolation.
 *
 * 🔴 **`origin/main` joined on 13/09 (`T-317` · `D-227` · closes `F-231`), and it is
 * a MEASUREMENT:** `C-0284` (24/08), `C-0426` (04/09) and `C-0546` (12/09) are three
 * pairs of ticks that carried the same id. `T-254` already pulled two branches — but
 * PROMOTER pushes to ⛔ neither of them: it promotes to `main`, so its id was ⛔ invisible
 * to the counter. `git log --grep C-0546` then returns two ticks by two agents, and
 * every register cell pointing there becomes ambiguous — in the one channel
 * `loop:health` check 17 reads the loop through.
 *
 * ⚠️ **⛔ The id's SHAPE does ⛔ not change:** `C-\d+` stays, and `C-0546-DEV` was
 * rejected by name in `D-227`.
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

/**
 * ⛔ **שלושת הענפים שמזהה מחזור יכול לנחות עליהם** — והרשימה הזאת היא
 * המקום היחיד שבו היא כתובה. ‏`work/current` ← DEV · CONTENT · `dev` ← QA · `main` ← PROMOTER.
 */
export const CYCLE_ID_BRANCHES = ['origin/dev', 'origin/work/current', 'origin/main'];

/**
 * מחשב את מזהה המחזור הבא מתוך שלושת הענפים יחד.
 *
 * ⚠️ `git` מוזרק פנימה (‏`dependency injection`) ⛔ ולא נקרא מהמודול — זו הדרך
 * היחידה שבה בדיקה יכולה לשתול `C-0600` על `main` בלבד ולהוכיח שהמונה רואה אותו.
 *
 * @param {(...args: string[]) => string} git
 * @returns {string} e.g. `"C-0601"`
 */
export function nextCycleId(git) {
  git('fetch', 'origin', ...CYCLE_ID_BRANCHES.map((b) => b.replace(/^origin\//, '')));
  const logs = [];
  for (const branch of CYCLE_ID_BRANCHES) {
    try {
      logs.push(git('log', branch, '--format=%s', '-500'));
    } catch {
      // ⚠️ ענף אחד שאינו נגיש ⛔ אינו עוצר את המנייה — אבל הוא נאמר בשמו,
      // ⛔ כי מונה שקט שקרא פחות משלושה הוא בדיוק הכשל שהמודול הזה קיים נגדו.
      console.error(`⛔ אזהרה — ${branch} לא נגיש, המנייה ממשיכה בלעדיו`);
    }
  }
  if (logs.length === 0) {
    throw new Error('⛔ לא נמדד — ⛔ אף אחד משלושת הענפים לא נגיש');
  }
  return formatCycleId(maxCycleNumber(logs) + 1);
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const git = (...args) =>
    execFileSync('./scripts/g', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    console.log(nextCycleId(git));
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}
