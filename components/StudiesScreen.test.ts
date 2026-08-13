import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The markup of the לימודים tab (§ 4.2ב question 1 — the three-second read:
 * how many days are left, and one button).
 *
 * A source guard and not a render test: the environment is node and jsdom is
 * deliberately not installed (vitest.config.ts). Geometry is `check:mobile`'s
 * job, through the `/dev/tabs/studies` fixture that renders this component.
 */
const SRC = readFileSync('components/StudiesScreen.tsx', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('<StudiesScreen> — the route tab body (T-051 · § 4.2ב)', () => {
  /**
   * The countdown is `daysUntilExamHe(daysUntilExam(...))`, computed at the edge
   * where the clock lives and passed in. A component that computed its own would
   * put a `new Date()` in the render path and make lib/core's purity beside the
   * point — and would let a second, subtly different day count exist.
   */
  it('takes the headline as a prop and ⛔ computes no date of its own', () => {
    expect(CODE).toContain('headline');
    expect(CODE).not.toContain('new Date');
    expect(CODE).not.toContain('daysUntilExam');
  });

  it('offers exactly one action, marked so the harness can find it', () => {
    expect(CODE).toContain('data-primary-action="true"');
    expect(CODE.match(/data-primary-action/g)?.length).toBe(1);
    expect(CODE).toContain('href="/cards"');
  });

  it('⛔ makes no readiness or score claim (4.4.3)', () => {
    for (const forbidden of ['מוכנות', 'ציון חזוי', 'צפוי לקבל', '%']) {
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
    }
  });

  it('carries ⛔ no ActionBar — D-028 forbids two bottom bars on one screen', () => {
    expect(CODE).not.toContain('ActionBar');
  });

  it('anchors its column to the top and never centres it (F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/flex-1[^"'`]*justify-center/);
  });
});
