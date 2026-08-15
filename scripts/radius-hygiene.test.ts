import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * T-068 · constitution § 3 (signed 12/08, frozen) · D-036 (the mapping).
 *
 * The constitution allows three radii. Before this guard existed the product's most
 * common value was a fourth one — 37 × `rounded-xl` — and nothing anywhere would ever
 * have said so. The value of this task is the guard and not the rewrite: without a test
 * that fails, the fourth value returns in the first commit nobody reads.
 */
const ALLOWED = new Set(['md', 'lg', '2xl']);

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

describe('radius hygiene (T-068 · constitution § 3)', () => {
  it('scans a real set of files (guards the walker, not just the regex)', () => {
    // Without this, a broken glob turns every assertion below into a vacuous pass.
    expect(FILES.length).toBeGreaterThan(20);
    expect(FILES.some((f) => f.endsWith('components/AuthForm.tsx'))).toBe(true);
  });

  it('finds radii at all (guards the regex)', () => {
    expect(FILES.flatMap((f) => radii(f)).length).toBeGreaterThan(20);
  });

  it('uses only the three radii the frozen constitution allows', () => {
    const offenders = FILES.flatMap((file) =>
      radii(file)
        .filter(({ value }) => !ALLOWED.has(value))
        .map(({ token }) => `${file}: ${token}`),
    );
    // The message IS the fix list: constitution § 3 allows md (6px, fields and tags),
    // lg (8px, buttons) and 2xl (16px, cards and modals). D-036 maps a role to a group.
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
