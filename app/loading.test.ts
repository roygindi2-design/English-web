import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * T-073 — the route-level loading skeleton promises a shape the real screen
 * never delivers.
 *
 * A source guard and ⛔ not a render test: the vitest environment is `node` and
 * jsdom is deliberately absent (vitest.config.ts).
 *
 * The point of a skeleton is that the block a learner stares at for 400ms has
 * the geometry of the thing that replaces it. Constitution § 3 assigns
 * `rounded-2xl` to cards and modals; every primary button in the product
 * (`app/error.tsx` · `app/not-found.tsx` · `components/WorldFeed.tsx`) is
 * `rounded-lg`, and no text line anywhere is a 16px-radius pill. A skeleton
 * that draws one is announcing a different screen than the one arriving.
 */
const SRC = readFileSync('app/loading.tsx', 'utf8');

const CODE = withoutComments(SRC);

describe('the loading skeleton (T-073 · constitution § 3)', () => {
  /**
   * ⚠️ Asserted as "⛔ nowhere in the file" and ⛔ not "not on line 13": a
   * radius the constitution reserves for cards has no placeholder in a file
   * that draws none, and a line-number assertion goes stale the moment anyone
   * adds an import.
   */
  it('⛔ never draws a card radius — this file has no card in it', () => {
    expect(CODE).not.toContain('rounded-2xl');
  });

  /**
   * The two text lines are `h-5`. Their radius has to read as text, which in
   * this product means `rounded-md` — the radius `app/page.tsx` already uses
   * for its own inline text-sized blocks.
   */
  it('draws both text lines at the text radius', () => {
    const textLines = CODE.match(/h-5[^"'`]*rounded-md/g) ?? [];
    expect(textLines.length, 'both h-5 skeleton lines must be rounded-md').toBe(2);
  });

  /**
   * ⚠️ Named by its neighbour and ⛔ not by radius alone: `rounded-lg` appears
   * on the heading block too (`:11`, untouched by T-073), so an assertion that
   * only counted `rounded-lg` would stay green with the button placeholder
   * left at `rounded-2xl`.
   */
  it('draws the button placeholder at the button radius the product actually ships', () => {
    expect(CODE).toMatch(/min-h-touch[^"'`]*rounded-lg/);
  });

  /** ⛔ T-073 is a radius change. The heading block was already correct. */
  it('leaves the heading block at h-9 w-4/5 rounded-lg', () => {
    expect(CODE).toContain('h-9 w-4/5 rounded-lg');
  });

  it('stays a skeleton — ⛔ no spinner, ⛔ no new Hebrew copy beyond "טוען"', () => {
    expect(CODE).toContain('aria-busy="true"');
    expect(CODE.match(/[֐-׿]+/g) ?? []).toEqual(['טוען']);
  });
});
