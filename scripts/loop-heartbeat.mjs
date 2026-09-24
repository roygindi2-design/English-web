#!/usr/bin/env node
/**
 * T-404 · F-273 · D-263 — a lock holder that is still working says so.
 *
 *   npm run loop:heartbeat -- C-0792 "T-341 — converting 54 test files"
 *   npm run loop:heartbeat -- C-0792 "…" --dry-run      ⇐ prints the line, ⛔ writes nothing
 *
 * 🔬 F-273, measured: PM took the lock at 17:47:08Z and pushed work at 21:09:50Z. In
 * between `scripts/hooks/pre-push` saw AGE_MIN=195 > 90 AND HOLDER_FILES=0, declared
 * LOCK_STALE, and DEV took the lock — lawfully. Two writers on the same registers.
 * ⛔ The window is ⛔ not softened (D-263): an orphaned lock must still age out. What this
 * adds is the one thing a LIVE holder could not do: produce a holder commit without
 * pushing half-built work.
 *
 * The heartbeat is ONE line appended to `plan/archive/control-log.md`, committed under the
 * holder's own prefix (`loop(<LOCK>): …`). That path is ⛔ not `plan/00-control.md`, so
 * the pre-push stale test counts it as a holder file (HOLDER_FILES ≥ 1 ⇒ ⛔ not stale), and
 * it is under `plan/` so the push takes the fast lane. ⛔ No gate is opened, ⛔ no
 * SKIP_VERIFY, ⛔ no threshold moves.
 *
 * ⛔ Refuses: when the lock is empty or not yours (a heartbeat on someone else's lock is a
 * forged sign of life) · when you have unpushed commits (push THEM — that is the heartbeat)
 * · on a missing cycle id or note. ⛔ No dependency: node builtins only, so it runs before
 * `npm install` as well.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const CONTROL = 'plan/00-control.md';
export const LOG = 'plan/archive/control-log.md';

/** Same normalisation as `scripts/hooks/pre-push`: drop `-agent`, upper-case. */
export function lockHolder(control) {
  const m = /^LOCK_HELD_BY:[ \t]*"?([A-Za-z-]*)/m.exec(control);
  return (m?.[1] ?? '').replace(/-agent$/, '').toUpperCase();
}

/** `git config user.name` ⇒ the name the lock carries. Mirrors pre-push's `MINE`. */
export function agentOf(userName) {
  const map = {
    'dev-agent': 'DEV',
    'pm-agent': 'PM',
    'critic-agent': 'QA',
    'content-agent': 'CONTENT',
    'promoter-agent': 'PROMOTER',
    'ops-agent': 'OPS',
  };
  return map[userName] ?? '';
}

/** Returns the commit subject, or throws with the reason it may ⛔ not be written. */
export function heartbeatSubject({ lock, mine, cycle, note, ahead }) {
  if (lock === '') throw new Error('⛔ LOCK_HELD_BY is empty — a heartbeat is for the lock holder only');
  if (mine === '') throw new Error('⛔ git user.name is not a loop agent — cannot say whose heartbeat this is');
  if (lock !== mine) throw new Error(`⛔ the lock is ${lock}'s, not ${mine}'s — a heartbeat on another agent's lock is a forged sign of life`);
  if (!/^C-\d{4,}$/.test(cycle ?? '')) throw new Error(`⛔ cycle id "${cycle ?? ''}" is not C-NNNN`);
  const what = (note ?? '').replace(/\s+/g, ' ').trim();
  if (what === '') throw new Error('⛔ say what is running — the note is the whole point');
  if (ahead > 0) throw new Error(`⛔ ${ahead} unpushed commit(s) — push them instead: pushed work IS the heartbeat`);
  return `loop(${lock}): ${cycle} heartbeat — ${what}`;
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

function main(argv) {
  const dry = argv.includes('--dry-run');
  const [cycle, ...rest] = argv.filter((a) => a !== '--dry-run');
  const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
  let ahead = 0;
  try {
    ahead = Number(git('rev-list', '--count', `origin/${branch}..HEAD`));
  } catch {
    ahead = 0; // ⛔ no upstream ref ⇒ nothing measured as unpushed; the push itself will say.
  }
  const subject = heartbeatSubject({
    lock: lockHolder(readFileSync(CONTROL, 'utf8')),
    mine: agentOf(git('config', 'user.name')),
    cycle,
    note: rest.join(' '),
    ahead,
  });
  const line = `${subject} · ${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`;
  if (dry) {
    console.log(`(dry run) ${line}`);
    return;
  }
  appendFileSync(LOG, `${line}\n`, 'utf8');
  // ⛔ Pathspec commit: whatever else is staged stays staged and ⛔ does not ride along.
  git('commit', '-m', subject, '--', LOG);
  execFileSync('git', ['push', 'origin', branch], { stdio: 'inherit' });
  console.log(`💓 ${line}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
