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
