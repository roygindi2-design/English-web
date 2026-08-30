import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  violationsInCss,
  violationsInTsx,
  parseBaseline,
  BASELINE_HEADER_RULE,
  BASELINE_PATH,
} from './check-motion.mjs';

/**
 * T-234 · D-158 · C-0372 — the deterministic motion gate.
 *
 * WHY A GATE AND NOT A SKILL. The four performance rows opened on 30/08 (T-230…T-233)
 * were found by a manual PM run that happened to load `apple-design` and happened to
 * read the right files. A skill catches a violation only when a model loads it and
 * bothers; a gate catches it on every tick, forever, at zero token cost. `grep` over
 * `plan/35-design-constitution.md` for `transform|opacity|compositor|box-shadow`
 * returned ZERO hits in this tick — the constitution never covered this slot at all,
 * and `ב6` regulates DURATION only.
 *
 * TWO RULES, AND DELIBERATELY NOT A THIRD:
 *   ⓐ an `@keyframes` block or a `transition:` declaration touching a property that is
 *     neither `transform` nor `opacity`;
 *   ⓑ an inline percentage width (`style={{ width: `${x}%` }}`) inside a component that
 *     runs a `requestAnimationFrame` loop.
 *
 * 🔴 THE GATE DOES NOT OPEN FROM THE INSIDE (C-0366 rule ⓐ). Adding a line to
 * `scripts/motion-baseline.md` is a PM or Roy action, ⛔ never DEV's. Enforcement here:
 * the header sentence must be present verbatim, every baseline row must cite a finding
 * that exists in `plan/60-findings.md`, and the row count may not exceed MAX_BASELINE
 * below. Growing the baseline therefore takes three separate edits — the baseline, this
 * pinned constant, and the findings register — and every one of them is visible in the
 * diff QA reads.
 */

/** ⛔ Raising this is a PM or Roy action. DEV may only lower it, when a finding closes. */
const MAX_BASELINE = 6;

const REPO_ROOT = process.cwd();

function runGate(root: string): { code: number; out: string } {
  try {
    const out = execFileSync('node', ['scripts/check-motion.mjs', root], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? 1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
}

/** A minimal repo-shaped tree: app/ + components/ + scripts/motion-baseline.md. */
function fixtureRoot(files: Record<string, string>, baselineRows: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'motion-gate-'));
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, body, 'utf8');
  }
  mkdirSync(join(root, 'scripts'), { recursive: true });
  writeFileSync(
    join(root, 'scripts', 'motion-baseline.md'),
    `# baseline\n\n${BASELINE_HEADER_RULE}\n\n${baselineRows.join('\n')}\n`,
    'utf8',
  );
  return root;
}

describe('rule ⓐ — animated properties that are not transform/opacity', () => {
  it('flags a @keyframes block that animates box-shadow', () => {
    const css = `@keyframes pulse {\n  0%, 100% { box-shadow: 0 0 2px red; }\n  50% { box-shadow: 0 0 8px red; }\n}`;
    const found = violationsInCss('a.css', css);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ rule: 'A', key: 'pulse' });
    expect(found[0]?.detail).toContain('box-shadow');
  });

  it('passes a @keyframes block that animates only transform and opacity', () => {
    const css = `@keyframes bob {\n  0%, 100% { transform: translateY(0); opacity: 1; }\n  50% { transform: translateY(-2px); opacity: 0.5; }\n}`;
    expect(violationsInCss('a.css', css)).toHaveLength(0);
  });

  it('flags a transition: declaration on a paint property', () => {
    const found = violationsInCss('a.css', `.x { transition: background-color 200ms ease-out; }`);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ rule: 'A' });
    expect(found[0]?.detail).toContain('background-color');
  });

  it('passes transition: transform, opacity and none', () => {
    expect(
      violationsInCss('a.css', `.x { transition: transform 200ms ease-out, opacity 200ms ease-out; }\n.y { transition: none; }`),
    ).toHaveLength(0);
  });

  it('ignores prefers-reduced-motion longhands, which are a stop and not an animation', () => {
    const css = `@media (prefers-reduced-motion: reduce) {\n  * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }\n}`;
    expect(violationsInCss('a.css', css)).toHaveLength(0);
  });

  it('does not read its own documentation as code', () => {
    const css = `/* box-shadow must never be animated; use transform. */\n.x { transition: transform 200ms ease-out; }`;
    expect(violationsInCss('a.css', css)).toHaveLength(0);
  });
});

describe('rule ⓑ — inline percentage width inside a requestAnimationFrame component', () => {
  const RAF = `frame = window.requestAnimationFrame(step);`;

  it('flags an inline percentage width when the file drives a rAF loop', () => {
    const src = `${RAF}\n<span style={{ width: \`\${pct}%\` }} />`;
    const found = violationsInTsx('C.tsx', src);
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ rule: 'B', key: 'pct' });
  });

  it('passes the same width in a component with no rAF loop', () => {
    const src = `<span style={{ width: \`\${pct}%\` }} />`;
    expect(violationsInTsx('C.tsx', src)).toHaveLength(0);
  });

  it('passes a pixel width inside a rAF component', () => {
    const src = `${RAF}\n<span style={{ width: \`\${px}px\` }} />`;
    expect(violationsInTsx('C.tsx', src)).toHaveLength(0);
  });

  it('does not count a rAF named only in a comment', () => {
    const src = `// there is no requestAnimationFrame here\n<span style={{ width: \`\${pct}%\` }} />`;
    expect(violationsInTsx('C.tsx', src)).toHaveLength(0);
  });
});

describe('the baseline file', () => {
  const raw = readFileSync(BASELINE_PATH, 'utf8');
  const rows = parseBaseline(raw);

  it('carries the ⛔ "PM or Roy only" sentence verbatim at the top', () => {
    expect(raw).toContain(BASELINE_HEADER_RULE);
  });

  it('holds no more rows than the pinned ceiling', () => {
    expect(rows.length).toBeLessThanOrEqual(MAX_BASELINE);
  });

  it('cites, for every row, a finding id that exists in plan/60-findings.md', () => {
    const findings = readFileSync('plan/60-findings.md', 'utf8');
    for (const row of rows) {
      expect(row.finding).toMatch(/^F-\d+$/);
      expect(findings).toContain(`| ${row.finding} |`);
    }
  });

  it('cites, for every row, a task id that exists in plan/50-tasks.md', () => {
    const tasks = readFileSync('plan/50-tasks.md', 'utf8');
    for (const row of rows) {
      expect(row.task).toMatch(/^T-\d+$/);
      expect(tasks).toContain(`| ${row.task} |`);
    }
  });
});

describe('the gate end to end', () => {
  it('exits 0 on this repo, where every violation is in the baseline', () => {
    const { code, out } = runGate(REPO_ROOT);
    expect(out).toMatch(/motion gate: OK/);
    expect(code).toBe(0);
  });

  it('MUTATION — exits non-zero on an injected violation the baseline does not cover', () => {
    const root = fixtureRoot(
      { 'app/mutant.css': `@keyframes flash {\n  from { background-color: red; }\n  to { background-color: blue; }\n}` },
      [],
    );
    try {
      const { code, out } = runGate(root);
      expect(code).not.toBe(0);
      expect(out).toContain('flash');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('MUTATION — exits non-zero on an injected rule ⓑ violation', () => {
    const root = fixtureRoot(
      {
        'components/Mutant.tsx':
          'const f = window.requestAnimationFrame(step);\nexport const M = () => <span style={{ width: `${p}%` }} />;',
      },
      [],
    );
    try {
      const { code, out } = runGate(root);
      expect(code).not.toBe(0);
      expect(out).toContain('Mutant.tsx');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits 0 on a clean tree', () => {
    const root = fixtureRoot({ 'app/clean.css': `.x { transition: opacity 200ms ease-out; }` }, []);
    try {
      expect(runGate(root).code).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses to run when the baseline header sentence has been removed', () => {
    const root = mkdtempSync(join(tmpdir(), 'motion-gate-'));
    try {
      mkdirSync(join(root, 'scripts'), { recursive: true });
      writeFileSync(join(root, 'scripts', 'motion-baseline.md'), '# baseline\n', 'utf8');
      const { code, out } = runGate(root);
      expect(code).not.toBe(0);
      expect(out).toMatch(/header/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails on a baseline row that no longer matches any violation', () => {
    const root = fixtureRoot({ 'app/clean.css': `.x { transition: opacity 200ms ease-out; }` }, [
      '- app/gone.css · A · ghost · F-172 · T-230',
    ]);
    try {
      const { code, out } = runGate(root);
      expect(code).not.toBe(0);
      expect(out).toContain('ghost');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

/**
 * ⛔ The declaration file is hand-written (`check-motion.d.mts`), so it can drift from
 * the module. The block above catches a changed BEHAVIOUR; this one catches a changed
 * SHAPE — the same pairing `story-tap-audit.test.ts` uses.
 */
describe('the hand-written declaration file', () => {
  it('declares exactly the names the module exports', async () => {
    const mod = await import('./check-motion.mjs');
    const declared = [
      ...readFileSync('scripts/check-motion.d.mts', 'utf8').matchAll(
        /export declare (?:const|function)\s+([A-Za-z_$][\w$]*)/g,
      ),
    ].map((m) => m[1]);
    expect([...declared].sort()).toEqual(Object.keys(mod).sort());
  });
});
