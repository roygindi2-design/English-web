import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * C-0032/C-0034 lesson, re-measured here: over RAW text, the comment that
 * EXPLAINS a rule satisfies the assertion meant to prove the rule is
 * implemented — and, in the negative direction, the comment that FORBIDS a
 * string fails an assertion the code itself passes. Both happened in this file:
 * the header of `ActionBar.tsx` documents why it is not a client component, and
 * writing that sentence is what turned the server-component check red. Comments
 * are stripped before every scan below, so each assertion reads code only.
 *
 * `'use client'` inside a block comment is inert either way — a directive is
 * only a directive as the first statement — so stripping cannot hide a real
 * violation here.
 */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[^\S\n]*\/\/.*$/gm, '');

const bar = stripComments(readFileSync('components/ActionBar.tsx', 'utf8'));
const css = stripComments(readFileSync('app/globals.css', 'utf8'));

describe('the flow-screen action bar (D-028 · F-027)', () => {
  it('anchors to the window, not to the end of the content', () => {
    expect(bar).toMatch(/fixed[^"'`]*bottom-0/);
  });

  it('marks itself, so the harness and the page padding can both find it', () => {
    expect(bar).toContain('data-action-bar');
  });

  it('keeps clear of the home indicator', () => {
    expect(bar).toContain('env(safe-area-inset-bottom)');
  });

  it('separates with a hairline and never with a shadow (constitution § 6)', () => {
    expect(bar).toContain('border-t');
    expect(bar).not.toMatch(/shadow-(sm|md|lg|xl|2xl)/);
  });

  it('pads the scroll container, not <main> — the footer link sits after <main>', () => {
    expect(css).toContain('body:has([data-action-bar])');
    expect(css).toMatch(/body:has\(\[data-action-bar\]\)[^}]*env\(safe-area-inset-bottom\)/);
  });

  it('is a server component: the sign-out form on /onboarding must work without JS', () => {
    expect(bar).not.toContain("'use client'");
  });
});

/**
 * The bar is only a fix if the screens actually use it. A component that exists
 * and is imported nowhere is exactly the shape F-027 had before it was found:
 * correct in isolation, absent from the product.
 */
describe('every flow screen routes its primary action through the bar', () => {
  for (const file of [
    'components/AuthForm.tsx',
    'components/OnboardingForm.tsx',
    'app/study/page.tsx',
    'app/page.tsx',
  ]) {
    it(`${file} wraps its primary action in <ActionBar>`, () => {
      const src = stripComments(readFileSync(file, 'utf8'));
      expect(src).toContain('<ActionBar>');
      const open = src.indexOf('<ActionBar>');
      const close = src.indexOf('</ActionBar>', open);
      expect(close).toBeGreaterThan(open);
      expect(src.slice(open, close)).toContain('data-primary-action');
    });
  }

  it('keeps the onboarding submit attached to its form after leaving it', () => {
    const src = stripComments(readFileSync('components/OnboardingForm.tsx', 'utf8'));
    expect(src).toContain('id="onboarding-form"');
    expect(src).toContain('form="onboarding-form"');
  });
});
