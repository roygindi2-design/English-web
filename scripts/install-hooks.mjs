#!/usr/bin/env node
/**
 * ⛔ INSTALLS `scripts/hooks/*` INTO `.git/hooks/`.  ⟦NEW 06/09 · הכרעה 100⟧
 *
 * WHY AN INSTALLER AND ⛔ NOT `core.hooksPath`: `core.hooksPath` is a **local git
 * config value**, so it lives in `.git/config` of one clone and ⛔ travels with
 * nothing. Every agent tick is a FRESH CLONE — a hook that is not copied in is a
 * hook that ⛔ does not exist for eleven of the twelve DEV ticks a day.
 * ⇒ this runs from npm `prepare` (i.e. on every `npm install`, which every agent
 *   tick already runs) and from `npm run hooks:install` explicitly.
 *
 * ⚠️ IT ⛔ NEVER FAILS THE INSTALL. A hook that cannot be written is a WARNING —
 * `loop:health` check 16 is what turns it into a visible red, ⛔ not a broken
 * `npm install` in the middle of a tick.
 */
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.env.HOOKS_INSTALL_ROOT ?? '.';
const SRC = join(ROOT, 'scripts', 'hooks');
const GIT = join(ROOT, '.git');

/** ⛔ Same list the checker uses. A hook added here without a check is a hook nobody measures. */
export const HOOKS = ['pre-push'];

/** @returns {{installed: string[], skipped: string[], reason: string | null}} */
export const installHooks = (root = ROOT) => {
  const src = join(root, 'scripts', 'hooks');
  const git = join(root, '.git');
  if (!existsSync(git)) return { installed: [], skipped: [...HOOKS], reason: '⛔ אין .git — ⛔ לא ריפו' };
  /** ⛔ A worktree/submodule `.git` is a FILE, ⛔ not a directory. */
  if (!statSync(git).isDirectory()) return { installed: [], skipped: [...HOOKS], reason: '⛔ .git הוא קובץ (worktree)' };
  if (!existsSync(src)) return { installed: [], skipped: [...HOOKS], reason: '⛔ scripts/hooks חסר' };
  const dest = join(git, 'hooks');
  mkdirSync(dest, { recursive: true });
  const installed = [];
  const skipped = [];
  for (const name of readdirSync(src)) {
    if (!HOOKS.includes(name)) { skipped.push(name); continue; }
    copyFileSync(join(src, name), join(dest, name));
    chmodSync(join(dest, name), 0o755);
    installed.push(name);
  }
  return { installed, skipped, reason: null };
};

/**
 * ⛔ THE MEASUREMENT, ⛔ NOT THE INSTALL. `loop:health` check 16 calls this and
 * ⛔ never installs anything — a checker that repairs what it measures can only
 * ever report "ok".
 * @returns {{ok: boolean, missing: string[], stale: string[]}}
 */
export const hookState = (root = ROOT) => {
  const src = join(root, 'scripts', 'hooks');
  const dest = join(root, '.git', 'hooks');
  const missing = [];
  const stale = [];
  for (const name of HOOKS) {
    const a = join(src, name);
    const b = join(dest, name);
    if (!existsSync(a)) { missing.push(`${name} (⛔ חסר במקור scripts/hooks)`); continue; }
    if (!existsSync(b)) { missing.push(name); continue; }
    if (readFileSync(a, 'utf8') !== readFileSync(b, 'utf8')) stale.push(name);
  }
  return { ok: missing.length === 0 && stale.length === 0, missing, stale };
};

const isMain = process.argv[1] !== undefined && process.argv[1].endsWith('install-hooks.mjs');
if (isMain) {
  const { installed, reason } = installHooks(ROOT);
  if (reason !== null) console.log(`⚠️  hooks: ⛔ לא הותקנו — ${reason}`);
  else console.log(`✅ hooks: הותקנו ${installed.length} — ${installed.join(' · ')} ⇒ ${join(GIT, 'hooks')}`);
  if (!existsSync(SRC)) process.exitCode = 0;
}
