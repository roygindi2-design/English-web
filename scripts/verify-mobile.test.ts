import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * F-007 regression guard. The mobile harness measures every promise this
 * project makes about 375px layout, 44px tap targets and RTL. While it sat
 * outside `npm run verify`, `verify` went green without any of those being
 * checked — so the wiring itself is what has to be defended, not the checks.
 */
describe('check:mobile is part of the verify pipeline (F-007)', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts: Record<string, string>;
  };

  it('exposes check:mobile', () => {
    expect(pkg.scripts['check:mobile']).toBe('node scripts/verify-mobile.mjs');
  });

  it('runs check:mobile as part of verify', () => {
    expect(pkg.scripts.verify).toContain('check:mobile');
  });

  it('runs it after build, since it measures the production output', () => {
    const verify = pkg.scripts.verify ?? '';
    expect(verify.indexOf('check:mobile')).toBeGreaterThan(verify.indexOf('run build'));
  });
});

describe('the harness resolves a browser that exists on disk (F-007)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  it('probes for an installed Chromium instead of trusting playwright’s pinned build', () => {
    expect(source).toContain('resolveChromiumPath');
    expect(source).toContain('PLAYWRIGHT_BROWSERS_PATH');
  });

  it('always passes an explicit executablePath to chromium.launch', () => {
    expect(source).toMatch(/chromium\.launch\(\{\s*\n\s*executablePath,/);
  });

  it('can boot its own server so it needs no operator', () => {
    expect(source).toContain('startServer');
  });
});

describe('the harness guards the landing layout it just fixed (F-011 · T-027)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  const page = readFileSync('app/page.tsx', 'utf8');

  it('measures the dead band above the heading', () => {
    expect(source).toContain('heading anchored to top');
  });

  it('locates the primary action by marker, not by document order', () => {
    expect(source).toContain('main [data-primary-action]');
    expect(page).toContain('data-primary-action');
  });
});

/**
 * C-0034. The scan measured every control's own box, so T-029's goal group —
 * a 20px radio dot centred in a 44px clickable row — reported three failures on
 * a layout that is correct: the browser activates a radio from anywhere in its
 * label, so the row IS the target. The danger in relaxing a barrier is that the
 * relaxation quietly covers more than it was meant to, which is why the
 * narrowing is asserted here and not only the substitution.
 */
describe('the tap-target scan measures the region that activates the control (C-0034)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  // Line comments are stripped before scanning. C-0032 measured this exact
  // hazard on the migration test: over raw text, the comment that EXPLAINS a
  // rule satisfies the assertion meant to prove the rule is implemented.
  const code = source.replace(/^[^\S\n]*\/\/.*$/gm, '');

  it('substitutes the enclosing label for a radio or checkbox', () => {
    expect(code).toContain("el.type === 'radio' || el.type === 'checkbox'");
    expect(code).toContain("el.closest('label')");
  });

  it('never lets a label stand in for a text-entry field', () => {
    const start = code.indexOf('const tapRect');
    const body = code.slice(start, code.indexOf('};', start));
    expect(start).toBeGreaterThan(-1);
    for (const widened of ['text', 'email', 'date', 'number', 'password']) {
      expect(body).not.toContain(`'${widened}'`);
    }
  });

  it('measures the substituted region, not the control, against the 44px floor', () => {
    expect(code).toContain('rect.width < min || rect.height < min');
  });
});
