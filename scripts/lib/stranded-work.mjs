/**
 * 🧪 T-463 · closes `F-256` — «is this branch's WORK on work/current?», asked of the
 * CONTENT and ⛔ not of the ancestry.
 *
 * 🔬 Measured C-0618: two `claude/*` branches stayed red in check 18 with **0 missing**
 * headwords each, because CONTENT had integrated them by COPYING the files across and
 * regenerating. A copy ⛔ never makes the original commits ancestors ⇒
 * `rev-list work/current..branch` > 0 forever — a false finding every QA tick and a
 * hesitation every PROMOTER tick, on work that was already home.
 *
 * ⇒ a file the branch changed is HOME when the exact blob the branch holds appeared on
 * `base` at any point after the two diverged (`--find-object`) — ⛔ «is identical today»
 * would turn red again the moment `base` edits the file once more.
 *
 * ⛔ Not the work, and therefore ⛔ not asked about: the generated files (HARD INVARIANTS
 * — they are regenerated, never copied) and the bookkeeping paths check 17 already
 * classifies as «no work». ⚠️ A branch-side DELETION is not stranded work either.
 *
 * `git` is the caller's runner — `./scripts/g` in the check, plain `git` in the test —
 * and returns stdout or `null`. ⇒ **`null` from here means «⛔ not measured»**, ⛔ never
 * «clean».
 */
const NOT_THE_WORK = [
  (f) => f === 'plan/00-control.md',
  (f) => f.startsWith('plan/archive/'),
  (f) => /^docs\/plan-[a-z-]+\.md$/.test(f),
  (f) => f === 'docs/architecture-map.json',
  (f) => f === 'docs/gate-recheck.md',
  (f) => f === 'plan/63-surfaces.md',
  (f) => f.startsWith('supabase/seed/'),
  (f) => f.startsWith('data/generated/'),
];

/**
 * @param {(...args: string[]) => string | null} git
 * @param {string} base  the branch the loop reads (`origin/work/current`)
 * @param {string} ref   the platform outcome branch
 * @returns {string[] | null} the files whose branch content never reached `base`
 */
export function strandedFiles(git, base, ref) {
  const mergeBase = git('merge-base', base, ref)?.trim();
  if (!mergeBase) return null;
  const changed = git('diff', '--name-only', '--no-renames', '--diff-filter=AMT', `${mergeBase}`, ref);
  if (changed === null) return null;
  const stranded = [];
  for (const file of changed.split('\n').map((s) => s.trim()).filter(Boolean)) {
    if (NOT_THE_WORK.some((test) => test(file))) continue;
    const blob = git('rev-parse', `${ref}:${file}`)?.trim();
    if (!blob) return null;
    if (git('rev-parse', `${base}:${file}`)?.trim() === blob) continue;
    const seen = git('log', '-1', '--format=%H', `--find-object=${blob}`, `${mergeBase}..${base}`);
    if (seen === null) return null;
    if (seen.trim() === '') stranded.push(file);
  }
  return stranded;
}
