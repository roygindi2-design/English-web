import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * T-068 · T-168 · constitution v2 layer B § ב2 · D-036 (the mapping) · D-102.
 *
 * The guard exists because before it, the product's most common radius was an
 * undeclared fourth value and nothing anywhere would ever have said so. That reason
 * still holds: without a test that fails, an undeclared value returns in the first
 * commit nobody reads.
 *
 * ⚠️ UPDATED 2026-08-23 (T-168). The old list was {md, lg, 2xl}, taken from
 * constitution v1 § 3, which was written 12/08 — two weeks before Roy's product
 * vision existed — and marked frozen. D-102 replaced it: layer B is derived from
 * plan/36-video-spec.md and the approved renders in docs/design/, and it declares a
 * FIVE-value scale. `rounded-full` in particular is now explicitly allowed for a
 * primary button, a chip, a progress bar and the world tab — every one of which is a
 * pill in the renders Roy signed off.
 *
 * ⛔ What did NOT change, and is the whole point of keeping this file: a single
 * uniform radius on every element stays banned. The scale is GRADED. Adding a sixth
 * value is still a finding — edit the constitution first, then this list.
 */
const ALLOWED = new Set(['md', 'lg', 'xl', '2xl', 'full']);

/** Tailwind's logical and physical side segments, which are not radius VALUES. */
const SIDES = new Set(['t', 'b', 'l', 'r', 's', 'e', 'tl', 'tr', 'bl', 'br', 'ss', 'se', 'es', 'ee']);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|jsx|css)$/.test(p) && !/\.test\./.test(p)) out.push(p);
  }
  return out;
}

const FILES = [...walk('components'), ...walk('app')].sort();

/**
 * Comments are stripped first. D-036 and the reasoning above both NAME the forbidden
 * values in prose, and a guard that cannot tell a violation from its own explanation
 * fails on the documentation that justifies it.
 */
function code(file: string): string {
  return readFileSync(file, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
}

/** Every `rounded…` utility in a file, as `{ token, value }`. */
function radii(file: string): { token: string; value: string }[] {
  return [...code(file).matchAll(/\brounded(?:-[a-z0-9]+)*/g)].map((m) => {
    const token = m[0];
    const parts = token.split('-').slice(1);
    if (parts.length > 1 && parts[0] !== undefined && SIDES.has(parts[0])) parts.shift();
    return { token, value: parts.join('-') };
  });
}

describe('radius hygiene (T-068 · T-168 · constitution v2 layer B § ב2)', () => {
  it('scans a real set of files (guards the walker, not just the regex)', () => {
    // Without this, a broken glob turns every assertion below into a vacuous pass.
    expect(FILES.length).toBeGreaterThan(20);
    expect(FILES.some((f) => f.endsWith('components/AuthForm.tsx'))).toBe(true);
  });

  it('finds radii at all (guards the regex)', () => {
    expect(FILES.flatMap((f) => radii(f)).length).toBeGreaterThan(20);
  });

  it('uses only the five radii constitution v2 layer B allows', () => {
    const offenders = FILES.flatMap((file) =>
      radii(file)
        .filter(({ value }) => !ALLOWED.has(value))
        .map(({ token }) => `${file}: ${token}`),
    );
    // The message IS the fix list. Layer B § ב2 allows md (6px, fields and tags),
    // lg (8px, buttons), xl (12px, secondary controls and counter tiles),
    // 2xl (16px, the card default — the most common value in the renders) and
    // full (pill: primary button, chip, progress bar, the world tab).
    // D-036 maps a role to a group. ⛔ A sixth value is a finding, not a fix.
    expect(offenders).toEqual([]);
  });

  it('accepts a side-clipped form of an allowed value (D-036 ⓔ)', () => {
    expect(radii('components/TabBar.tsx').some(({ value }) => value === '2xl')).toBe(true);
  });

  it('⛔ never accepts a bare `rounded` — that is Tailwind’s 4px, a fourth value', () => {
    // Proves the parser's own edge case rather than trusting it: `rounded` alone yields
    // an empty value, which is not in ALLOWED.
    const parsed = [...'<div className="rounded" />'.matchAll(/\brounded(?:-[a-z0-9]+)*/g)];
    expect(parsed).toHaveLength(1);
    expect(ALLOWED.has('')).toBe(false);
  });
});
