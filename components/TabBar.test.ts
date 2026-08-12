import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Comments are stripped before the scan — the same guard `ActionBar.test.ts`
 * carries, and here it is not a precaution but a repair. Measured in this tick:
 * over RAW text, the mutation that reduces the active-tab marker to colour
 * alone (`border-t-2 border-brand font-semibold` → `text-brand`) left all seven
 * checks GREEN, because the regex matched the word `aria-current` inside this
 * component's own JSDoc and then found `border-t-2` in a constant 300 characters
 * later. The rule the check exists to enforce — constitution § 1, colour is
 * never the only channel — was being proven by prose. With comments stripped
 * the same mutation fails.
 */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[^\S\n]*\/\/.*$/gm, '');

const src = stripComments(readFileSync('components/TabBar.tsx', 'utf8'));

describe('the four-tab shell (D-027 · § 4.2ב)', () => {
  it('carries exactly the four locked labels', () => {
    for (const label of ['לימודים', 'כרטיסיות', 'העולם', 'אני']) expect(src).toContain(label);
  });

  it('keeps the RTL order: studies is first, me is last', () => {
    const order = ['לימודים', 'כרטיסיות', 'העולם', 'אני'].map((l) => src.indexOf(l));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(order.every((i) => i > -1)).toBe(true);
  });

  it('has no fifth tab', () => {
    expect(src.match(/labelHe:/g)?.length).toBe(4);
  });

  it('marks the active tab by state and shape, never by colour alone (constitution § 1)', () => {
    expect(src).toContain('aria-current');
    expect(src).toMatch(/aria-current[\s\S]{0,400}(border-t-2|h-1|rounded-full)/);
  });

  it('locks the world tab instead of navigating to an empty screen', () => {
    expect(src).toContain('aria-disabled');
    expect(src).toMatch(/href:\s*null/);
  });

  it('keeps every tap target at the 44px floor', () => {
    expect(src).toContain('min-h-touch');
  });

  it('marks itself for the harness and the document padding', () => {
    expect(src).toContain('data-tab-bar');
  });
});
