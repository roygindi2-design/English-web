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
