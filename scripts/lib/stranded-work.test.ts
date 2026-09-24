import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { strandedFiles } from './stranded-work.mjs';

/**
 * 🧪 T-463 · `F-256` — check 18 asks about CONTENT, ⛔ not about ancestry.
 *
 * 🔬 The false positive, measured C-0618: CONTENT integrated two `claude/*` branches by
 * COPYING their files onto `work/current` and regenerating. A copy ⛔ never makes the
 * original commits ancestors ⇒ `rev-list work/current..branch` stays > 0 forever, and
 * check 18 stayed red on work that was already home.
 *
 * ⇒ these run against a real throwaway git repo, ⛔ not a mock: the question is what
 * git answers, and a mock would only answer what the test author believed.
 */
function repo() {
  const dir = mkdtempSync(join(tmpdir(), 'stranded-'));
  const git = (...args: string[]): string | null => {
    try {
      return execFileSync('git', args, {
        cwd: dir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      return null;
    }
  };
  const write = (path: string, text: string) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  };
  const commit = (msg: string) => {
    git('add', '-A');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', msg);
  };
  git('init', '-q', '-b', 'work');
  write('lib/a.ts', 'export const a = 1;\n');
  commit('base');
  return { git, write, commit };
}

describe('🧪 T-463 — strandedFiles: is the branch’s CONTENT on work/current?', () => {
  it('🔴 a branch with one source file work/current ⛔ does not have ⇒ that file', () => {
    const r = repo();
    r.git('checkout', '-q', '-b', 'claude/x');
    r.write('data/words.csv', 'headword\nrun\n');
    r.commit('content');
    r.git('checkout', '-q', 'work');
    expect(strandedFiles(r.git, 'work', 'claude/x')).toEqual(['data/words.csv']);
  });

  it('✅ the same branch after a COPY-merge ⇒ nothing stranded, though it is ⛔ not an ancestor', () => {
    const r = repo();
    r.git('checkout', '-q', '-b', 'claude/x');
    r.write('data/words.csv', 'headword\nrun\n');
    r.commit('content');
    r.git('checkout', '-q', 'work');
    r.write('data/words.csv', 'headword\nrun\n');
    r.commit('copy the file across');
    // ⇐ the ancestry question still says «stranded» — that is the defect.
    expect(Number(r.git('rev-list', '--count', 'work..claude/x')?.trim())).toBe(1);
    expect(strandedFiles(r.git, 'work', 'claude/x')).toEqual([]);
  });

  it('✅ copied, and edited on work/current afterwards ⇒ still home', () => {
    const r = repo();
    r.git('checkout', '-q', '-b', 'claude/x');
    r.write('data/words.csv', 'headword\nrun\n');
    r.commit('content');
    r.git('checkout', '-q', 'work');
    r.write('data/words.csv', 'headword\nrun\n');
    r.commit('copy');
    r.write('data/words.csv', 'headword\nrun\nwalk\n');
    r.commit('a later edit');
    expect(strandedFiles(r.git, 'work', 'claude/x')).toEqual([]);
  });

  it('⛔ derived and bookkeeping files are ⛔ not the work — regenerated, never copied', () => {
    const r = repo();
    r.git('checkout', '-q', '-b', 'claude/x');
    r.write('docs/plan-open.md', 'generated\n');
    r.write('docs/architecture-map.json', '{}\n');
    r.write('plan/00-control.md', 'LOCK_HELD_BY: ""\n');
    r.write('plan/archive/control-log.md', 'loop(DEV): idle\n');
    r.commit('bookkeeping only');
    r.git('checkout', '-q', 'work');
    expect(strandedFiles(r.git, 'work', 'claude/x')).toEqual([]);
  });

  it('an ordinary ancestor branch ⇒ nothing, as before', () => {
    const r = repo();
    r.git('checkout', '-q', '-b', 'claude/x');
    r.write('lib/b.ts', 'export const b = 2;\n');
    r.commit('b');
    r.git('checkout', '-q', 'work');
    r.git('merge', '-q', '--ff-only', 'claude/x');
    expect(strandedFiles(r.git, 'work', 'claude/x')).toEqual([]);
  });

  it('⛔ git failing is ⛔ «clean» — it returns null, and the check reports «not measured»', () => {
    const r = repo();
    expect(strandedFiles(r.git, 'work', 'claude/does-not-exist')).toBeNull();
  });
});
