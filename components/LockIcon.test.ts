import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * T-078 — the shared lock mark.
 *
 * The artwork used to live inside `components/TabBar.tsx`, which is why
 * `components/CardsScreen.tsx` had none and showed the word «נעול» alone. One
 * concept, one component (constitution § 6); a second copy of the path data is
 * the thing this file exists to prevent.
 *
 * A source guard and ⛔ not a render test: environment is `node`, jsdom absent.
 */
const SRC = readFileSync('components/LockIcon.tsx', 'utf8');

const CODE = withoutComments(SRC);

describe('<LockIcon> — the shared lock mark (T-078 · constitution § 6)', () => {
  it('is an inline SVG, ⛔ never a character or an emoji', () => {
    expect(CODE).toContain('<svg');
    for (const glyph of ['🔒', '🔐', '✓', '×']) {
      expect(CODE, `"${glyph}" is a character standing in for an icon`).not.toContain(glyph);
    }
  });

  /**
   * `currentColor` and no `fill`: the mark inherits whatever the text beside it
   * is painted with, so it stays legible in both themes and ⛔ never introduces
   * a hard-coded hex the palette does not know about (constitution § 6).
   */
  it('takes its colour from the text it sits beside', () => {
    expect(CODE).toContain('stroke="currentColor"');
    expect(CODE).toContain('fill="none"');
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  /** Decoration next to a word that already says «נעול» — ⛔ not an extra announcement. */
  it('stays out of the accessibility tree', () => {
    expect(CODE).toContain('aria-hidden="true"');
  });

  /**
   * ⛔ Stays a server-renderable module with no props: it is imported by a
   * client component (`CardsScreen`) and by `TabBar`, and a `'use client'`
   * directive here would pull a bundle boundary around an SVG.
   */
  it('⛔ carries no directive, no state and no props', () => {
    expect(CODE).not.toContain('use client');
    expect(CODE).not.toContain('useState');
    expect(CODE).toMatch(/function LockIcon\(\)/);
  });
});
