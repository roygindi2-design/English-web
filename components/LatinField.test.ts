import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * TD-5 guard, in the same shape as the T-009 guard in EnWord.test.ts: the claim
 * is "every Latin text input in this product is configured in one file", and a
 * render test proves one call site is right while a source scan proves no other
 * call site exists.
 */
function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|ts)$/.test(p) && !/\.test\.tsx?$/.test(p)) out.push(p);
  }
  return out;
}

const LATIN_FIELD = join('components', 'LatinField.tsx');
/** The typed-production answer box (T-041). It is a card control, not a
 *  credential field, and EnWord.test.ts already holds it to its own rules. */
const FLASHCARD = join('components', 'Flashcard.tsx');
const SOURCES = [...walk('app'), ...walk('components')];

describe('every Latin text input goes through <LatinField> (TD-5)', () => {
  it('scans a non-trivial number of files, including LatinField itself', () => {
    expect(SOURCES.length).toBeGreaterThan(10);
    expect(SOURCES).toContain(LATIN_FIELD);
  });

  it('no file other than LatinField.tsx puts dir="ltr" on an input', () => {
    const offenders = SOURCES.filter((f) => f !== LATIN_FIELD && f !== FLASHCARD).filter((f) => {
      const src = readFileSync(f, 'utf8');
      // Every `<input` opening tag in the file, then: does any of them declare dir?
      return src
        .split('<input')
        .slice(1)
        .some((tail) => /dir\s*=\s*[{'"\s]*['"]?ltr/i.test(tail.slice(0, tail.indexOf('>') + 1)));
    });
    expect(offenders, 'configure the field through <LatinField> instead').toEqual([]);
  });

  it('LatinField declares direction and keyboard together, and requires the hint', () => {
    const src = readFileSync(LATIN_FIELD, 'utf8');
    expect(src).toMatch(/dir="ltr"/);
    expect(src).toMatch(/enterKeyHint=\{enterKeyHint\}/);
    expect(src, 'enterKeyHint must not be optional — that is what closes TD-5').not.toMatch(
      /enterKeyHint\?\s*:/,
    );
  });

  it('AuthForm asks for the two keyboards F-015 specifies', () => {
    const src = readFileSync(join('components', 'AuthForm.tsx'), 'utf8');
    expect(src).toMatch(/name="email"[\s\S]{0,400}enterKeyHint="next"/);
    expect(src).toMatch(/name="password"[\s\S]{0,400}enterKeyHint="go"/);
  });
});
