import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COLOR_TOKENS, CONTRAST_FLOORS, contrastRatio, tokenValue } from './palette';

describe('contrastRatio', () => {
  it('is 21 for black on white and 1 for a colour on itself', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
    expect(contrastRatio('#2a78d6', '#2a78d6')).toBeCloseTo(1, 5);
  });

  it('is symmetric', () => {
    expect(contrastRatio('#047857', '#f8fafc')).toBeCloseTo(contrastRatio('#f8fafc', '#047857'), 5);
  });

  it('rejects anything that is not a 6-digit hex', () => {
    expect(() => contrastRatio('#fff', '#000000')).toThrow(RangeError);
    expect(() => contrastRatio('rebeccapurple', '#000000')).toThrow(RangeError);
  });
});

describe('declared contrast floors', () => {
  // The point of this test: a token may be re-tuned, but not below the floor that
  // made it shippable. Eyeballing a colour swap is exactly how F-014 got here.
  it.each(CONTRAST_FLOORS)('$fg on $bg clears $min:1 in both modes — $why', (floor) => {
    for (const mode of ['light', 'dark'] as const) {
      const ratio = contrastRatio(tokenValue(floor.fg, mode), tokenValue(floor.bg, mode));
      expect(
        ratio,
        `${floor.fg} on ${floor.bg} in ${mode} measured ${ratio.toFixed(2)}:1`,
      ).toBeGreaterThanOrEqual(floor.min);
    }
  });
});

describe('globals.css stays in sync with the table', () => {
  const css = readFileSync('app/globals.css', 'utf8');
  const block = (marker: string): string => {
    const start = css.indexOf(marker);
    expect(start, `marker ${marker} missing from app/globals.css`).toBeGreaterThan(-1);
    const open = css.indexOf('{', start);
    return css.slice(open, css.indexOf('}', open));
  };

  it('declares every token with the light value', () => {
    const light = block('/* tokens:light */');
    for (const t of COLOR_TOKENS) expect(light).toContain(`${t.cssVar}: ${t.light};`);
  });

  it('declares every token with the dark value under prefers-color-scheme', () => {
    const dark = block('/* tokens:dark */');
    for (const t of COLOR_TOKENS) expect(dark).toContain(`${t.cssVar}: ${t.dark};`);
  });

  it('opts the document into both schemes, so form controls follow', () => {
    expect(css).toMatch(/color-scheme:\s*light dark/);
  });
});

describe('no raw slate left in the screens the product ships', () => {
  // Tokens are worthless if half the app bypasses them. This is the ratchet.
  //
  // The plan listed four files by hand. That is the same mistake that let the
  // F-011 dead band survive in /onboarding and in AuthForm: a guard scoped to
  // the files someone remembered. Walking the tree instead means a NEW screen
  // is covered on the day it is written, without anyone updating this list.
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return walk(full);
      return entry.name.endsWith('.tsx') ? [full] : [];
    });
  const FILES = [...walk('app'), ...walk('components')].sort();

  it('finds the screens at all, so an empty sweep cannot pass silently', () => {
    expect(FILES.length).toBeGreaterThanOrEqual(10);
  });

  it.each(FILES)('%s uses semantic colour names only', (file) => {
    const src = readFileSync(file, 'utf8');
    const raw = src.match(/\b(?:bg|text|border|ring|placeholder|from|to|via)-slate-\d{2,3}\b/g);
    expect(raw ?? [], `raw palette classes left in ${file}`).toEqual([]);
  });
});

/**
 * F-036 — the blind spot that let a 4.42:1 button pass CI green.
 *
 * CONTRAST_FLOORS pins `--brand-on on --brand-surface` (6.70:1), which is the pair the
 * primary button is SUPPOSED to use. It never pinned `--brand-on on --brand` (4.42:1),
 * because that pair is not supposed to exist — and so the one screen that did use it
 * (OnboardingForm's submit button, the screen every new learner passes) was measured by
 * nothing. A floor for a pair we forbid would be the wrong fix; the right one is to forbid
 * the pair in the markup, where the defect actually lived.
 *
 * `--brand` is the MARK colour: it carries a 3:1 non-text floor and is legal as an icon,
 * a border or a line. ⛔ It is never a fill behind text.
 */
describe('F-036 — the mark colour is never a text fill', () => {
  const walkTsx = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = `${dir}/${entry.name}`;
      if (entry.isDirectory()) return walkTsx(full);
      return entry.name.endsWith('.tsx') ? [full] : [];
    });
  const SCREENS = [...walkTsx('app'), ...walkTsx('components')].sort();

  it('finds the screens at all, so an empty sweep cannot pass silently', () => {
    expect(SCREENS.length).toBeGreaterThanOrEqual(10);
  });

  it.each(SCREENS)('%s never fills with bg-brand (4.42:1) — bg-brand-surface is the fill', (file) => {
    const src = readFileSync(file, 'utf8');
    // `bg-brand` exactly: `bg-brand-surface` and `bg-brand-soft` are different tokens and
    // are not what this guard is about.
    const bare = src.match(/\bbg-brand(?![-\w])/g);
    expect(bare ?? [], `bg-brand is a 4.42:1 fill; use bg-brand-surface in ${file}`).toEqual([]);
  });
});
