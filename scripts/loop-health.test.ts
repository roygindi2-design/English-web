import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every check runs against a FIXTURE root, not the live repo. That is the whole
 * point: a checker that can only be observed passing has not been tested. Each
 * test below builds a tiny repo that contains exactly one defect and asserts the
 * matching check goes red on it — and that the others stay green, so a check
 * cannot pass by failing everything.
 */
const run = (root: string): { out: string; code: number } => {
  try {
    return {
      out: execFileSync('node', ['scripts/loop-health.mjs'], {
        encoding: 'utf8',
        env: { ...process.env, LOOP_HEALTH_ROOT: root },
      }),
      code: 0,
    };
  } catch (e) {
    const err = e as { stdout?: string; status?: number };
    return { out: err.stdout ?? '', code: err.status ?? -1 };
  }
};

const failed = (out: string, n: string): boolean =>
  new RegExp(`^ FAIL ${n}\\.`, 'm').test(out);

/** A repo where all eight checks pass. Each test then breaks exactly one thing. */
const healthy = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'lh-'));
  mkdirSync(join(root, 'plan'), { recursive: true });
  mkdirSync(join(root, 'docs', 'superpowers', 'plans'), { recursive: true });
  mkdirSync(join(root, 'lib', 'core'), { recursive: true });

  const write = (p: string, body: string) => writeFileSync(join(root, p), body, 'utf8');

  write('lib/core/realGate.ts', 'export const gate = true;\n');
  write('docs/real-brief.md', '# brief\n');
  write(
    'plan/25-content-commissions.md',
    '| id | מה | תדריך | שער | הערה | סטטוס | משימה |\n' +
      '|---|---|---|---|---|---|---|\n' +
      '| K-001 | x | `docs/real-brief.md` | `lib/core/realGate.ts` | — | ⬜ | T-001 |\n',
  );
  write(
    'plan/60-findings.md',
    '| # | חומרה | קובץ | הממצא | תרחיש | תיקון | סטטוס | סבב |\n' +
      '|---|---|---|---|---|---|---|---|\n' +
      '| F-001 | 🔴 | `lib/core/realGate.ts` | x | y | z | ⬜ פתוח | 0 |\n',
  );
  const today = new Date().toISOString().slice(0, 10);
  write(
    'plan/03-for-roy.md',
    '| # | מי | מתי | מה | למה | חוסם |\n|---|---|---|---|---|---|\n' +
      `| 1 | PM (C-0001) | 2026-08-01 | לעשות משהו · נבדק: ${today} | כי | לא |\n`,
  );
  write('plan/00-control.md', 'RELEASE_READY: ""\n');
  write('plan/26-plan-feedback.md', '| C-0001 | `p.md` | `files` | why | ⬜ |\n');
  write('plan/50-tasks.md', '| T-001 | M0 | uses 2026-01-01-real-plan.md | — | ⬜ | 0 | — | — |\n');
  write('docs/superpowers/plans/2026-01-01-real-plan.md', '# plan\n');
  // ⛔ Check 8 runs the real generator, which needs the real registers; a fixture
  // cannot satisfy it, so the fixture root carries the committed snapshots and
  // the generator's own inputs verbatim.
  for (const p of ['docs/plan-tables.md', 'docs/plan-open.md']) {
    cpSync(p, join(root, p));
  }
  return root;
};

const patch = (root: string, file: string, fn: (s: string) => string): void => {
  const p = join(root, file);
  writeFileSync(p, fn(readFileSync(p, 'utf8')), 'utf8');
};

describe('scripts/loop-health.mjs', () => {
  it('is green on a healthy fixture — every check except the one a fixture cannot satisfy', () => {
    // ⚠️ This assertion was HOLLOW on its first draft: it read
    // `expect(failed(out)).toBe(failed(out) && false)`, where `failed` was called
    // with one argument, matched `^ FAIL undefined\.`, and was therefore always
    // false on both sides. It passed while measuring nothing. Now it names the
    // checks and asserts each one individually.
    const r = run(healthy());
    expect(r.out).toContain('loop health: 7/8 checks pass');
    for (const n of ['1', '2', '3', '4', '5', '6', '7']) {
      expect(failed(r.out, n), `check ${n} must be green on a healthy fixture`).toBe(false);
    }
    // ⛔ Check 8 runs the real generator against fixture registers, so it cannot
    // pass here. Stated out loud rather than excluded quietly — a checker whose
    // own test hides a failure is the thing this whole file exists against.
    expect(failed(r.out, '8')).toBe(true);
    expect(r.code).toBe(1);
  });

  it('exits 0 only when every check passes — measured against the live repo', () => {
    // The live repo is the one place check 8 can be satisfied. Today checks 1, 3
    // and 6 fail there, so the exit code is 1 and that is the honest state.
    const r = run('.');
    const passes = /loop health: (\d+)\/8/.exec(r.out)?.[1];
    expect(passes).toBeDefined();
    expect(r.code).toBe(Number(passes) === 8 ? 0 : 1);
  });

  it('1 · goes red on a commission whose brief was never written — the live failure of 24/08', () => {
    const root = healthy();
    patch(root, 'plan/25-content-commissions.md', (s) =>
      s.replace('`docs/real-brief.md`', '`docs/never-written-brief.md`'),
    );
    const r = run(root);
    expect(failed(r.out, '1')).toBe(true);
    expect(r.out).toContain('docs/never-written-brief.md');
    expect(r.code).toBe(1);
  });

  /**
   * ⛔ THE BLOCKED-ROW PAIR. A ⛔ row is where a checker is easiest to game: mark
   * the row blocked and the missing brief stops being reported. These two tests
   * are what makes that impossible — blocked buys an exemption from the FILES and
   * pays for it with a NAMED finding or task.
   */
  it('1 · stays green on a ⛔ blocked row that names its finding — blocking is a successful outcome', () => {
    const root = healthy();
    patch(root, 'plan/25-content-commissions.md', (s) =>
      s
        .replace('`docs/real-brief.md`', '⛔ אין — נחסמה')
        .replace('`lib/core/realGate.ts` | — | ⬜ |', '⛔ אין | F-117 | ⛔ |'),
    );
    const r = run(root);
    expect(failed(r.out, '1')).toBe(false);
  });

  it('1 · goes red on a ⛔ blocked row that names nothing — ⛔ אינו מקום לחנות בו עבודה', () => {
    const root = healthy();
    patch(root, 'plan/25-content-commissions.md', (s) =>
      s
        .replace('`docs/real-brief.md`', '⛔ אין — נחסמה')
        .replace('`lib/core/realGate.ts` | — | ⬜ | T-001 |', '⛔ אין | — | ⛔ | — |'),
    );
    const r = run(root);
    expect(failed(r.out, '1')).toBe(true);
    expect(r.out).toContain('⛔ בלי ממצא או משימה');
  });

  /**
   * ⛔ ⛔ IS A PROSE GLYPH IN THIS REPO, AND THAT IS THE TRAP. Every register here
   * writes ⛔ inside its descriptions, so «the row contains ⛔» would mark almost
   * every commission blocked and exempt it from the file check — the checker would
   * go quiet on exactly the rows it exists for. Only the STATE cell counts.
   * ⛔ Without this test the scoping is unpinned: it survives being widened to the
   * whole line, measured.
   */
  it('1 · ⛔ בתיאור ⛔ אינו חסימה — רק תא המצב נחשב', () => {
    const root = healthy();
    patch(root, 'plan/25-content-commissions.md', (s) =>
      s
        .replace('| K-001 | x |', '| K-001 | ⛔ אין להמציא כאן דקדוק |')
        .replace('`docs/real-brief.md`', '`docs/never-written-brief.md`'),
    );
    const r = run(root);
    expect(failed(r.out, '1')).toBe(true);
    expect(r.out).toContain('docs/never-written-brief.md');
  });

  it('1 · stays green when the same row is closed — a closed row may name a deleted file', () => {
    const root = healthy();
    patch(root, 'plan/25-content-commissions.md', (s) =>
      s.replace('`docs/real-brief.md`', '`docs/gone.md`').replace('| ⬜ |', '| ✅ |'),
    );
    expect(failed(run(root).out, '1')).toBe(false);
  });

  it('2 · goes red on a finding pointing at a deleted file', () => {
    const root = healthy();
    patch(root, 'plan/60-findings.md', (s) =>
      s.replace('`lib/core/realGate.ts`', '`lib/core/deleted.ts`'),
    );
    expect(failed(run(root).out, '2')).toBe(true);
  });

  it('3 · goes red on a Roy item with no stamp, and on one stamped over a week ago', () => {
    const noStamp = healthy();
    patch(noStamp, 'plan/03-for-roy.md', (s) => s.replace(/ · נבדק: \d{4}-\d{2}-\d{2}/, ''));
    expect(failed(run(noStamp).out, '3')).toBe(true);

    const old = healthy();
    patch(old, 'plan/03-for-roy.md', (s) => s.replace(/נבדק: \d{4}-\d{2}-\d{2}/, 'נבדק: 2026-01-01'));
    const r = run(old);
    expect(failed(r.out, '3')).toBe(true);
    expect(r.out).toContain('2026-01-01');
  });

  it('4 · goes red when a slice is marked ready and the three taps were not written', () => {
    // ⛔ The only path by which an answer from Roy re-enters the loop. It has been
    // instructed in the QA prompt since the loop began and written zero times.
    const root = healthy();
    patch(root, 'plan/00-control.md', () => 'RELEASE_READY: "abc123 · 24/08 · 12 commits"\n');
    expect(failed(run(root).out, '4')).toBe(true);

    patch(root, 'plan/03-for-roy.md', (s) => `${s}\n**שלוש הקשות:** 1 · 2 · 3\n`);
    expect(failed(run(root).out, '4')).toBe(false);
  });

  it('6 · goes red on a plan file no task row cites', () => {
    const root = healthy();
    writeFileSync(join(root, 'docs/superpowers/plans/2026-02-02-orphan.md'), '# x\n', 'utf8');
    const r = run(root);
    expect(failed(r.out, '6')).toBe(true);
    expect(r.out).toContain('2026-02-02-orphan.md');
  });

  /**
   * ⛔ The widening measured on 24/08: 4 of the 8 «orphans» were cited in
   * `60-findings.md`. A plan a finding cites is **findable**, which is the entire
   * harm the check names. ⛔ Without this test the widening is unpinned and a later
   * hand could quietly narrow it back to `50-tasks.md` alone.
   */
  it('6 · stays green on a plan only a FINDING cites — findable is findable', () => {
    const root = healthy();
    writeFileSync(join(root, 'docs/superpowers/plans/2026-02-02-from-finding.md'), '# x\n', 'utf8');
    patch(root, 'plan/60-findings.md', (s) =>
      s.replace('| x | y | z |', '| x | y | 2026-02-02-from-finding.md |'),
    );
    const r = run(root);
    expect(failed(r.out, '6')).toBe(false);
  });

  it('7 · goes red when the same missing element is reported twice — the PM did not learn', () => {
    const root = healthy();
    patch(root, 'plan/26-plan-feedback.md', (s) => `${s}| C-0002 | \`q.md\` | \`files\` | why | ⬜ |\n`);
    const r = run(root);
    expect(failed(r.out, '7')).toBe(true);
    expect(r.out).toContain('files');
  });

  it('7 · stays green when the repeated row is already closed', () => {
    const root = healthy();
    patch(root, 'plan/26-plan-feedback.md', (s) => `${s}| C-0002 | \`q.md\` | \`files\` | why | ✅ |\n`);
    expect(failed(run(root).out, '7')).toBe(false);
  });

  it('does not mistake a 🔴 finding for a closed one — the surrogate-pair trap', () => {
    // ⛔ THE BUG THIS PINS, found before shipping: `/[✅🚫]/` WITHOUT the `u` flag
    // splits 🚫 into its surrogate halves, so the class matches anything opening
    // with \uD83D — 🔴, 🟣 and 🔵 included. The checker therefore skipped every
    // 🔴 CRITICAL row as "closed", which is the precise inverse of its job.
    const root = healthy();
    patch(root, 'plan/60-findings.md', (s) =>
      s.replace('`lib/core/realGate.ts`', '`lib/core/deleted.ts`').replace('⬜ פתוח', '🔴 פתוח'),
    );
    const r = run(root);
    expect(failed(r.out, '2'), 'a 🔴 row must still be measured').toBe(true);
    expect(r.out).toContain('lib/core/deleted.ts');
  });

  it('writes nothing into the repo it measures', () => {
    // ⛔ A checker with side effects is a checker nobody can run safely.
    const root = healthy();
    const before = readFileSync(join(root, 'plan/50-tasks.md'), 'utf8');
    run(root);
    expect(readFileSync(join(root, 'plan/50-tasks.md'), 'utf8')).toBe(before);
  });
});
