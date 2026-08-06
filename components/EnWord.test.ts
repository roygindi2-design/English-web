import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * T-009 guard. This file does not render React — the Vitest environment is
 * `node` on purpose (see vitest.config.ts). It scans source text, which is the
 * right shape of test for the claim "every English string in the product goes
 * through one wrapper": a render test proves one call site is correct, a source
 * scan proves no other call site exists.
 *
 * ⚠️ What this file can and cannot prove. A code review of the first version
 * measured the gap, so it is written down rather than assumed:
 *
 *   ✔ proves: nobody hand-writes the three bidi attributes outside EnWord, so
 *     they cannot drift apart (the actual failure mode — one of three missing).
 *   ✔ proves: the English fields of PreviewCard are wrapped at their call site.
 *   ✘ cannot prove: that some *future* English string is wrapped. A bare
 *     `<span>{word}</span>` with no attributes at all is invisible to a text
 *     scan, and telling English from Hebrew in an arbitrary JSX expression
 *     needs a parser plus a language guess. The positive assertion below is
 *     therefore per-field and must be extended when a new English field lands.
 */

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    // .ts as well as .tsx: app/api/** is all .ts, and a route handler or a
    // `metadata` export can emit markup just as easily as a component can.
    else if (/\.(tsx|ts|jsx|mdx)$/.test(p)) out.push(p);
  }
  return out;
}

const EN_WORD = join('components', 'EnWord.tsx');
const SOURCES = [...walk('app'), ...walk('components')];
const others = SOURCES.filter((f) => f !== EN_WORD && !f.endsWith('.test.ts'));

describe('every English string in the product goes through <EnWord> (T-009)', () => {
  it('scans a non-trivial number of files, including EnWord itself', () => {
    // A walk that silently returned [] would make every assertion below pass
    // vacuously — the failure mode that let F-016 survive a file-scoped check.
    expect(SOURCES.length).toBeGreaterThan(10);
    expect(SOURCES).toContain(EN_WORD);
    expect(others.length).toBeGreaterThan(10);
  });

  it('no file other than EnWord.tsx declares a lang of English', () => {
    // Loose enough that lang="en-US" and lang={'en'} count — they are the same
    // defect as lang="en", and a tight /lang=["']en["']/ let both through.
    // Bounded on both sides, because without the boundaries `const slang =
    // "energy"` and `htmlLang = "english"` both matched (verified).
    const offenders = others.filter((f) =>
      /(?<![A-Za-z])lang\s*=\s*[{'"\s]*['"]?en(?![A-Za-z])/i.test(readFileSync(f, 'utf8')),
    );
    expect(offenders, 'these render English without the shared wrapper').toEqual([]);
  });

  it('no file other than EnWord.tsx hand-writes the ltr-inline class', () => {
    const offenders = others.filter((f) => /ltr-inline/.test(readFileSync(f, 'utf8')));
    expect(offenders, 'the isolation class is EnWord’s implementation detail').toEqual([]);
  });

  it('EnWord itself sets lang, dir and the isolation class together', () => {
    const src = readFileSync(EN_WORD, 'utf8');
    expect(src).toContain('lang="en"');
    expect(src).toContain('dir="ltr"');
    expect(src).toContain('ltr-inline');
  });

  it('the isolation class is really declared, and really isolates', () => {
    // Checked against the whole rule body with comments stripped. The previous
    // version read one LINE, which meant (a) reformatting the rule across lines
    // turned the test red on a no-op change, and (b) deleting the rule but
    // leaving a comment mentioning it passed — the exact dead-class-name
    // regression this test exists to catch.
    const css = readFileSync(join('app', 'globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css, '.ltr-inline is missing from app/globals.css').toMatch(
      /\.ltr-inline\s*\{[^}]*unicode-bidi:\s*isolate/,
    );
    expect(css, '.ltr-inline must set direction: ltr').toMatch(
      /\.ltr-inline\s*\{[^}]*direction:\s*ltr/,
    );
    // display:inline-block makes the run atomic against the CONTAINING BLOCK, so
    // a wrapping English sentence cannot share a line with the Hebrew around it.
    // Measured at 375px: 104px vs 52px for the same paragraph. Single words look
    // identical, which is how it would sneak back in.
    const rule = css.match(/\.ltr-inline\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule, 'inline-block wastes a line box whenever Hebrew shares the line').not.toMatch(
      /display:\s*inline-block/,
    );
  });

  it('the English fields of the preview card are wrapped at their call site', () => {
    // PreviewCard documents `headword` and `pos` as English; `options` are the
    // Hebrew answer choices. A review found `pos` rendered bare while the guard
    // above was green — a negative scan cannot see missing markup, so the two
    // known English fields are asserted positively.
    const src = readFileSync(join('app', 'page.tsx'), 'utf8');
    for (const field of ['headword', 'pos']) {
      const re = new RegExp(`<EnWord>\\s*\\{preview\\.${field}\\}\\s*</EnWord>`);
      expect(src, `preview.${field} is English and must render inside <EnWord>`).toMatch(re);
    }
  });
});
