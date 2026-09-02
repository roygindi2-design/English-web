import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * T-069 · constitution § 1 · § 6 · RULES § 0.1 ז׳.
 *
 * `focus-visible` is one of the four binary checks the Critic is allowed to run, and
 * before this rule existed the only thing a keyboard learner had was whatever Chromium
 * draws by default — which disappears the moment any component sets its own outline.
 * The ring is global on purpose: a per-component ring is a ring that is missing on the
 * component nobody remembered.
 */
const CSS = readFileSync('app/globals.css', 'utf8');

/** The declaration block of a selector, comments stripped. */
function ruleFor(selector: string): string {
  const withoutComments = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  const at = withoutComments.indexOf(selector);
  if (at === -1) return '';
  const open = withoutComments.indexOf('{', at);
  const close = withoutComments.indexOf('}', open);
  return open === -1 || close === -1 ? '' : withoutComments.slice(open + 1, close);
}

/**
 * Same as `ruleFor`, but brace-depth aware — required for `@keyframes` and `@media`
 * blocks, which nest a `{ … }` per stop/rule inside the outer block that `ruleFor`'s
 * naive `indexOf('}')` would truncate on.
 */
function blockFor(marker: string): string {
  const withoutComments = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  const at = withoutComments.indexOf(marker);
  if (at === -1) return '';
  const open = withoutComments.indexOf('{', at);
  if (open === -1) return '';
  let depth = 0;
  let i = open;
  for (; i < withoutComments.length; i += 1) {
    if (withoutComments[i] === '{') depth += 1;
    else if (withoutComments[i] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  return withoutComments.slice(open + 1, i);
}

describe('the global focus ring (T-069)', () => {
  it('declares :focus-visible at all', () => {
    expect(ruleFor(':focus-visible').trim()).not.toBe('');
  });

  it('draws the ring from a palette token, never a raw hex (constitution § 6)', () => {
    const rule = ruleFor(':focus-visible');
    expect(rule).toMatch(/var\(--[a-z-]+\)/);
    expect(rule).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });

  it('separates the ring from the control it rings', () => {
    expect(ruleFor(':focus-visible')).toContain('outline-offset');
  });

  it('never removes an outline anywhere in the sheet', () => {
    // `outline: none` is how a focus ring dies quietly: the rule above still exists and
    // still passes every test that only looks for it.
    expect(CSS.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/outline:\s*(none|0)\b/);
  });

  it('rings only keyboard focus — a bare :focus would ring a mouse tap too', () => {
    const withoutComments = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
    // `:focus-visible` contains the substring `:focus`, so the bare selector has to be
    // matched as a whole token: `:focus` followed by anything that is not `-`.
    expect(withoutComments).not.toMatch(/:focus(?![-\w])/);
  });
});

/**
 * T-230 · `apple-design` § 11 — "Animate only compositor-friendly properties —
 * `transform` and `opacity`". `box-shadow` is a paint property: animating it directly
 * repaints the tab-world circle and its blur halo on every frame, forever, on all 5 tab
 * routes. The fix moves the pulse off `[data-tab-world]` onto a dedicated
 * `[data-tab-world-glow]` sibling that is itself static in `box-shadow` and animated only
 * via `opacity`/`transform`.
 */
describe('the tab-bar world glow is compositor-only, not paint (T-230)', () => {
  it('never animates [data-tab-world] itself', () => {
    expect(ruleFor('[data-tab-world] {')).not.toMatch(/animation:/);
  });

  it('still paints a static glow on [data-tab-world] — the resting keyframe state', () => {
    const rule = ruleFor('[data-tab-world] {');
    expect(rule).toMatch(/box-shadow:/);
    expect(rule).toMatch(/color-mix\(in srgb, var\(--brand-surface\)/);
  });

  it('moves the pulse to a dedicated, non-interactive glow layer', () => {
    const rule = ruleFor('[data-tab-world-glow] {');
    expect(rule).toMatch(/animation:\s*kol-world-pulse/);
    expect(rule).toContain('pointer-events: none');
  });

  it('gives the glow layer its own static box-shadow — never animated by the keyframe', () => {
    const rule = ruleFor('[data-tab-world-glow] {');
    expect(rule).toMatch(/box-shadow:/);
  });

  it('animates only opacity and transform on kol-world-pulse — never box-shadow', () => {
    const keyframe = blockFor('@keyframes kol-world-pulse');
    expect(keyframe).not.toBe('');
    expect(keyframe).not.toMatch(/box-shadow/);
    expect(keyframe).toMatch(/opacity:/);
    expect(keyframe).toMatch(/transform:\s*scale\(/);
  });

  it('switches the glow layer off under prefers-reduced-motion, not the circle', () => {
    expect(CSS).toContain('[data-tab-world-glow] { animation: none; }');
    expect(CSS).not.toContain('[data-tab-world] { animation: none; }');
  });

  it('no longer claims to be the only infinite loop in the product — arena-idle is one too', () => {
    expect(CSS).not.toMatch(/היחידה במוצר/);
  });
});
