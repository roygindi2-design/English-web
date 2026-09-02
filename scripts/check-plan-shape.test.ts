import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DIR = mkdtempSync(join(tmpdir(), 'plan-shape-'));

/** Runs the gate and returns its stdout plus exit code. ⛔ Exit 1 is a finding, not a crash. */
const run = (file: string, root?: string): { out: string; code: number } => {
  try {
    return {
      out: execFileSync('node', ['scripts/check-plan-shape.mjs', file], {
        encoding: 'utf8',
        env: root === undefined ? process.env : { ...process.env, CHECK_PLAN_ROOT: root },
      }),
      code: 0,
    };
  } catch (e) {
    const err = e as { stdout?: string; status?: number };
    return { out: err.stdout ?? '', code: err.status ?? -1 };
  }
};

/**
 * ⛔ Element ten reads the TASK REGISTER, ⛔ not only the plan file — so it needs a
 * root it can be pointed at. A fixture root with one known row is the only way to
 * prove it fires on overlap and stays quiet without it; measuring it against the
 * live register would make the test depend on 226 rows nobody controls.
 */
const fixtureRoot = (taskRow: string): string => {
  const root = mkdtempSync(join(tmpdir(), 'plan-shape-root-'));
  mkdirSync(join(root, 'plan'), { recursive: true });
  writeFileSync(join(root, 'plan', '50-tasks.md'), taskRow, 'utf8');
  return root;
};

const write = (name: string, body: string): string => {
  const path = join(DIR, name);
  writeFileSync(path, body, 'utf8');
  return path;
};

const COMPLETE = `# Plan — T-999

## File Structure
- \`lib/core/thing.ts\` (new)

## Interfaces
\`\`\`ts
export function thing(a: string): number;
\`\`\`

## Task 1
- [ ] **Step 1: write the failing test** — add to \`lib/core/thing.test.ts\`:
\`\`\`ts
it('does the thing', () => {
  expect(thing('a')).toBe(1);
});
\`\`\`
- [ ] **Step 2: implement** — edit \`lib/core/thing.ts\`.
- [ ] **Step 3: gate** — \`npm run verify\`.
`;

describe('scripts/check-plan-shape.mjs', () => {
  it('passes a plan that carries every element, and exits 0', () => {
    const r = run(write('complete.md', COMPLETE));
    expect(r.out).toContain('shape: 8/8');
    expect(r.code).toBe(0);
  });

  it('names the missing element and exits 1 — the exit code is what a script can act on', () => {
    const r = run(write('no-interfaces.md', COMPLETE.replace(/## Interfaces[\s\S]*?```\n\n/, '')));
    expect(r.out).toMatch(/^MISS  interfaces/m);
    expect(r.code).toBe(1);
  });

  it('measures a step by its whole block, not its heading line', () => {
    // ⚠️ The bug this pins, measured on the real register: reading only the heading
    // reported 19 of 28 steps "unaddressed" on a plan that addresses every one — the
    // command lives in the fenced block UNDER the heading. A gate that cries wolf on a
    // good plan is a gate every agent learns to ignore.
    const plan = write(
      'body.md',
      COMPLETE.replace(
        '- [ ] **Step 2: implement** — edit `lib/core/thing.ts`.',
        '- [ ] **Step 2: run and confirm red**\n```bash\nnpm run test\n```',
      ),
    );
    const r = run(plan);
    expect(r.out).toMatch(/^  ok  addressed/m);
  });

  it('asks a UI plan for the render and the finish clause, and a non-UI plan for neither', () => {
    // The two extra elements exist only where `36 § 14.4` applies. Demanding them of a
    // pure-logic plan would train the PM to paste a render name that means nothing.
    expect(run(write('logic.md', COMPLETE)).out).toContain('shape: 8/8');
    const ui = run(write('ui.md', `${COMPLETE}\nEdit \`components/Thing.tsx\`.\n`));
    expect(ui.out).toMatch(/^MISS  render/m);
    expect(ui.out).toMatch(/^MISS  finish/m);
  });

  it('rejects a DESCRIBED test — a sentence about a test is not a test', () => {
    // ⚠️ Mutation-found: with the `tests` probe stubbed to true, every other assertion
    // still passed. This is the one that says no. The distinction is the whole reason
    // the element exists: `test-driven-development` needs a failing test to run, and a
    // plan that says "add a test that checks the level gate" hands Dev a blank page.
    const described = write(
      'described.md',
      COMPLETE.replace(
        /```ts\nit\('does the thing[\s\S]*?```/,
        'Add a test that checks `thing` returns 1 for the string "a".',
      ),
    );
    const r = run(described);
    expect(r.out).toMatch(/^MISS  tests/m);
    expect(r.code).toBe(1);
  });

  it('prints a row ready to paste into plan/26-plan-feedback.md', () => {
    // ⛔ The point of the whole gate: the complaint arrives as a table row with an
    // address, ⛔ not as "the plan was unclear", which the PM cannot improve against.
    const r = run(write('gap.md', COMPLETE.replace('## File Structure\n- `lib/core/thing.ts` (new)\n', '')));
    expect(r.out).toContain('plan/26-plan-feedback.md');
    expect(r.out).toMatch(/^\| ‏<C-XXXX> \| `gap\.md` \| `files`/m);
  });

  it('is wired into package.json as check:plan', () => {
    const pkg = JSON.parse(execFileSync('cat', ['package.json'], { encoding: 'utf8' })) as {
      scripts: Record<string, string>;
    };
    expect(pkg.scripts['check:plan']).toBe('node scripts/check-plan-shape.mjs');
  });

  it('runs over every committed plan without crashing', () => {
    // A gate that throws on one of the 46 real plans is a gate nobody can run.
    const plans = readdirSync(join('docs', 'superpowers', 'plans')).filter((n) => n.endsWith('.md'));
    expect(plans.length).toBeGreaterThan(40);
    for (const name of plans) {
      const r = run(join('docs', 'superpowers', 'plans', name));
      expect(r.code, name).toBeGreaterThanOrEqual(0);
      expect(r.out, name).toMatch(/^shape: \d+\/\d+ elements present$/m);
    }
  });

  /**
   * 🔟 **ELEMENT TEN — «extend before you create», and it is PERMANENT (`D-177`).**
   * ⛔ Its soft window closed 2026-09-02 (`F-180`) — it is now an element like any
   * other: a plan that fails it MISSes, the `shape: X/Y` total drops, and the exit
   * code goes non-zero.
   */
  const OVERLAP_ROW =
    '| T-001 | M0 · loop · מבנה | touches `lib/core/thing.ts` | — | ⬜ | 0 | `lib/core/thing.ts` | — |\n';

  it('10 · flags a plan whose file is already named by a task row — and DOES fail the gate', () => {
    const r = run(write('overlap.md', COMPLETE), fixtureRoot(OVERLAP_ROW));
    expect(r.out).toMatch(/^MISS  extend/m);
    expect(r.out).toContain('T-001');
    expect(r.out).toContain('shape: 7/8');
    expect(r.code).toBe(1);
  });

  it('10 · a declared lineage answers it — `המשך של: T-001`', () => {
    const declared = `${COMPLETE}\n**המשך של: T-001**\n`;
    const r = run(write('declared.md', declared), fixtureRoot(OVERLAP_ROW));
    expect(r.out).toMatch(/^  ok  extend/m);
    expect(r.out).toContain('shape: 8/8');
    expect(r.code).toBe(0);
  });

  it('10 · an explicit «⛔ אינה הרחבה» answers it too — the plan is ⛔ never forced to lie', () => {
    const argued = `${COMPLETE}\n⛔ אינה הרחבה: T-001 נגעה בקובץ כדי לקרוא ממנו, וזו כתיבה חדשה.\n`;
    const r = run(write('argued.md', argued), fixtureRoot(OVERLAP_ROW));
    expect(r.out).toMatch(/^  ok  extend/m);
    expect(r.code).toBe(0);
  });

  it('10 · ⛔ no overlap ⇒ ⛔ nothing to answer', () => {
    const empty = '| T-002 | M0 · loop · מבנה | unrelated | — | ⬜ | 0 | `lib/core/other.ts` | — |\n';
    const r = run(write('no-overlap.md', COMPLETE), fixtureRoot(empty));
    expect(r.out).toMatch(/^  ok  extend/m);
    expect(r.out).toContain('⛔ אין חפיפה');
    expect(r.out).toContain('shape: 8/8');
    expect(r.code).toBe(0);
  });

});
