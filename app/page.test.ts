import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * T-077 — the landing screen used the character `✓` as an icon.
 *
 * Constitution § 6 says «⛔ אמוג'י כאייקון — SVG בלבד», and the reasoning
 * reaches every character-as-icon: the glyph's weight, height and optical
 * centre come from whatever font resolves it, ⛔ not from the code, and a
 * character with no coverage in Heebo/Assistant falls through to a system font
 * inside a fixed `h-6 w-6` box. § 2 is the font-coverage rule this leans on.
 *
 * A source guard and ⛔ not a render test: environment is `node`, jsdom absent.
 */
const SRC = readFileSync('app/page.tsx', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('the landing value list (T-077 · constitution § 6)', () => {
  it('⛔ carries no character used as an icon', () => {
    for (const glyph of ['✓', '✔', '✅', '★', '→', '•']) {
      expect(CODE, `"${glyph}" is a character standing in for an icon`).not.toContain(glyph);
    }
  });

  /**
   * ⚠️ Asserted as a `<svg` **inside the marker span** and ⛔ not as "the file
   * contains an svg somewhere": `app/page.tsx` could grow an unrelated
   * illustration tomorrow and satisfy a file-wide assertion while the list
   * markers went back to being text.
   */
  it('draws the marker as an inline SVG in the marker box', () => {
    const marker = CODE.match(/<span\s+aria-hidden="true"[\s\S]{0,600}?<\/span>/)?.[0] ?? '';
    expect(marker, 'the aria-hidden marker span was not found').not.toBe('');
    expect(marker).toContain('<svg');
    // The TabBar `LockIcon` pattern: colour follows the text, no fill.
    expect(marker).toContain('stroke="currentColor"');
    expect(marker).toContain('fill="none"');
  });

  /**
   * The decorative marker stays out of the accessibility tree — the `<li>`'s
   * own Hebrew text is what a screen reader should read, and «check mark» in
   * front of every line is noise.
   */
  it('keeps the marker out of the accessibility tree', () => {
    expect(CODE).toMatch(/aria-hidden="true"/);
  });

  /** ⛔ T-077 is an icon swap. The box, the palette and the list are untouched. */
  it('leaves the marker box and its tokens alone', () => {
    expect(CODE).toContain('h-6 w-6');
    expect(CODE).toContain('bg-brand-surface');
    expect(CODE).toContain('text-brand-on');
    expect(CODE).toContain('LANDING_VALUE_POINTS');
  });

  it('still offers exactly one primary action, to /signup', () => {
    expect(CODE.match(/data-primary-action/g)?.length).toBe(1);
    expect(CODE).toContain('href="/signup"');
  });
});
