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
} from './check-text-floor.mjs';

/**
 * T-236 · `35-design-constitution.md § א9` · D-161 — the deterministic text-floor gate.
 *
 * WHY A GATE. `docs/design/render_video_B.py:175` drew a label at 9px, 25% under the
 * smallest step the product actually ships (`text-xs`, 12px) — and nothing caught it
 * until a manual measurement did, on 28/08. § א9 sets the floor in prose; this gate is
 * what makes «no text under 12px, anywhere, ever» a build failure instead of a memory.
 *
 * TWO RULES:
 *   ⓐ `text-[<n>px]` (a Tailwind arbitrary-value class) with `n < 12`, anywhere in
 *     `app/**`/`components/**`;
 *   ⓑ a raw `font-size` under 12px/0.75rem in `app/globals.css` or
 *     `app/arcade/arcade-tokens.css` — the two sheets § א9 names.
 *
 * 🔴 FROZEN BASELINE, ⛔ NOT A SOFT-UNTIL DATE (`D-177`, `F-180`, 02/09/2026): a
 * soft-window's expiry date silently reddened `npm run verify` for every agent on
 * 02/09 with zero code change, and Roy's decision banned the whole mechanism — no
 * extended date, no new date flag in its place. A frozen baseline never expires; it
 * only shrinks when a row's finding closes, exactly like `scripts/motion-baseline.md`.
 *
 * 🔴 THE GATE DOES NOT OPEN FROM THE INSIDE (same rule as the motion gate, C-0366 ⓐ).
 * Adding a line to `scripts/text-floor-baseline.md` is a PM or Roy action, ⛔ never
 * DEV's. Enforcement here: the header sentence must be present verbatim, every
 * baseline row must cite a finding that exists in `plan/60-findings.md` and a task
 * that exists in `plan/50-tasks.md`, and the row count may not exceed MAX_BASELINE
 * below — three separate edits to grow it, all visible in the diff QA reads.
 */

/** ⛔ Raising this is a PM or Roy action. DEV may only lower it, when a finding closes. */
const MAX_BASELINE = 6;

const REPO_ROOT = process.cwd();

function runGate(root: string): { code: number; out: string } {
  try {
    const out = execFileSync('node', ['scripts/check-text-floor.mjs', root], {
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

/** A minimal repo-shaped tree: app/ + components/ + scripts/text-floor-baseline.md. */
function fixtureRoot(files: Record<string, string>, baselineRows: string[]): string {
  const root = mkdtempSync(join(tmpdir(), 'text-floor-gate-'));
  for (const [rel, body] of Object.entries(files)) {
    const abs = join(root, rel);
    mkdirSync(join(abs, '..'), { recursive: true });
    writeFileSync(abs, body, 'utf8');
  }
  mkdirSync(join(root, 'scripts'), { recursive: true });
  writeFileSync(
    join(root, 'scripts', 'text-floor-baseline.md'),
    `# baseline\n\n${BASELINE_HEADER_RULE}\n\n${baselineRows.join('\n')}\n`,
    'utf8',
  );
  return root;
}

describe('rule ⓐ — Tailwind arbitrary-value text classes under 12px', () => {
  it('flags text-[11px]', () => {
    const found = violationsInTsx('C.tsx', '<p className="text-[11px]">x</p>');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ rule: 'A', key: 'text-[11px]' });
  });

  it('flags a fractional size under 12, text-[11.5px]', () => {
    const found = violationsInTsx('C.tsx', '<p className="text-[11.5px]">x</p>');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ key: 'text-[11.5px]' });
  });

  it('passes text-[12px] — the floor itself is allowed', () => {
    expect(violationsInTsx('C.tsx', '<p className="text-[12px]">x</p>')).toHaveLength(0);
  });

  it('passes a size well above the floor, text-[15.5px]', () => {
    expect(violationsInTsx('C.tsx', '<p className="text-[15.5px]">x</p>')).toHaveLength(0);
  });

  it('passes text-xs and other named Tailwind classes — only arbitrary px values are scanned', () => {
    expect(violationsInTsx('C.tsx', '<p className="text-xs text-sm">x</p>')).toHaveLength(0);
  });

  it('does not read its own documentation as code', () => {
    const src = '// never ship text-[11px], it is under the floor\n<p className="text-xs">x</p>';
    expect(violationsInTsx('C.tsx', src)).toHaveLength(0);
  });

  it('flags every arbitrary class independently on one line', () => {
    const found = violationsInTsx('C.tsx', '<p className="text-[9px] text-[10px]">x</p>');
    expect(found.map((f) => f.key)).toEqual(['text-[9px]', 'text-[10px]']);
  });
});

describe('rule ⓑ — raw font-size under 12px in the two named sheets', () => {
  it('flags font-size: 11px in app/globals.css', () => {
    const found = violationsInCss('app/globals.css', '.x { font-size: 11px; }');
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ rule: 'B', key: 'font-size:11px' });
  });

  it('flags a sub-floor font-size given in rem', () => {
    const found = violationsInCss('app/globals.css', '.x { font-size: 0.7rem; }');
    expect(found).toHaveLength(1);
    expect(found[0]?.detail).toContain('11.2px');
  });

  it('passes 0.75rem — exactly the 12px floor', () => {
    expect(violationsInCss('app/globals.css', '.x { font-size: 0.75rem; }')).toHaveLength(0);
  });

  it('passes a font-size at or above the floor', () => {
    expect(violationsInCss('app/globals.css', '.x { font-size: 14px; }')).toHaveLength(0);
  });

  it('ignores font-size in a CSS file the rule does not name', () => {
    expect(violationsInCss('app/arcade/other.css', '.x { font-size: 9px; }')).toHaveLength(0);
  });

  it('does read app/arcade/arcade-tokens.css, the second named sheet', () => {
    const found = violationsInCss('app/arcade/arcade-tokens.css', '.x { font-size: 9px; }');
    expect(found).toHaveLength(1);
  });

  it('does not read its own documentation as code', () => {
    const css = '/* font-size must never drop below 12px */\n.x { font-size: 14px; }';
    expect(violationsInCss('app/globals.css', css)).toHaveLength(0);
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
    expect(out).toMatch(/text-floor gate: OK/);
    expect(code).toBe(0);
  });

  it('MUTATION — exits non-zero on an injected rule ⓐ violation the baseline does not cover', () => {
    const root = fixtureRoot(
      { 'components/Mutant.tsx': 'export const M = () => <span className="text-[9px]">x</span>;' },
      [],
    );
    try {
      const { code, out } = runGate(root);
      expect(code).not.toBe(0);
      expect(out).toContain('Mutant.tsx');
      expect(out).toContain('text-[9px]');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('MUTATION — exits non-zero on an injected rule ⓑ violation', () => {
    const root = fixtureRoot(
      { 'app/globals.css': '.x { font-size: 9px; }' },
      [],
    );
    try {
      const { code, out } = runGate(root);
      expect(code).not.toBe(0);
      expect(out).toContain('app/globals.css');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('exits 0 on a clean tree', () => {
    const root = fixtureRoot({ 'app/clean.css': '.x { font-size: 14px; }' }, []);
    try {
      expect(runGate(root).code).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('refuses to run when the baseline header sentence has been removed', () => {
    const root = mkdtempSync(join(tmpdir(), 'text-floor-gate-'));
    try {
      mkdirSync(join(root, 'scripts'), { recursive: true });
      writeFileSync(join(root, 'scripts', 'text-floor-baseline.md'), '# baseline\n', 'utf8');
      const { code, out } = runGate(root);
      expect(code).not.toBe(0);
      expect(out).toMatch(/header/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('fails on a baseline row that no longer matches any violation', () => {
    const root = fixtureRoot({ 'app/clean.css': '.x { font-size: 14px; }' }, [
      '- app/gone.tsx · A · text-[9px] · F-162 · T-236',
    ]);
    try {
      const { code, out } = runGate(root);
      expect(code).not.toBe(0);
      expect(out).toContain('gone.tsx');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('excludes .test. files from the scan, the same as the motion gate', () => {
    const root = fixtureRoot(
      { 'components/Mutant.test.ts': 'const banned = "text-[9px]";' },
      [],
    );
    try {
      expect(runGate(root).code).toBe(0);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

/**
 * ⛔ The declaration file is hand-written (`check-text-floor.d.mts`), so it can drift
 * from the module. The block above catches a changed BEHAVIOUR; this one catches a
 * changed SHAPE — the same pairing `motion-gate.test.ts` uses for `check-motion.mjs`.
 */
describe('the hand-written declaration file', () => {
  it('declares exactly the names the module exports', async () => {
    const mod = await import('./check-text-floor.mjs');
    const declared = [
      ...readFileSync('scripts/check-text-floor.d.mts', 'utf8').matchAll(
        /export declare (?:const|function)\s+([A-Za-z_$][\w$]*)/g,
      ),
    ].map((m) => m[1]);
    expect([...declared].sort()).toEqual(Object.keys(mod).sort());
  });
});
