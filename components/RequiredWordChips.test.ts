import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CODE = readFileSync('components/RequiredWordChips.tsx', 'utf8');

describe('RequiredWordChips — T-192ⓒ', () => {
  it('a used chip is success + ✓ (two channels); an unused chip is ⛔ never danger', () => {
    expect(CODE).toMatch(/success/);
    expect(CODE).not.toMatch(/danger/);
    expect(CODE).toMatch(/<svg/);
  });

  it('the heading and the counter are rendered from props, ⛔ not computed here', () => {
    expect(CODE).toContain('מילות חובה');
    expect(CODE).toMatch(/labelHe/);
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(/);
  });

  it('words inside <EnWord>; ⛔ no hex; ⛔ no text under 12px', () => {
    expect(CODE).toMatch(/<EnWord>/);
    expect(CODE).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(CODE).not.toMatch(/text-\[(\d|1[01])(\.\d+)?px\]/);
  });

  it('the state of a chip is ⛔ never colour alone — a screen-reader text names it', () => {
    expect(CODE).toMatch(/sr-only/);
  });
});
