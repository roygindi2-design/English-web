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
/**
 * The one exemption, and it is narrow (T-041). The typed-production card needs an
 * `<input lang="en">`: an input is a control the learner types INTO, not text
 * `<EnWord>` can wrap around. The file is excluded from the negative scan only,
 * and a dedicated test below re-proves the claim by deleting the `<input>` element
 * and re-running the same regex on what is left — so a bare `<span lang="en">`
 * added to this file later still fails.
 */
const FLASHCARD = join('components', 'Flashcard.tsx');
const SOURCES = [...walk('app'), ...walk('components')];
const others = SOURCES.filter((f) => f !== EN_WORD && !f.endsWith('.test.ts'));
const LANG_EN = /(?<![A-Za-z])lang\s*=\s*[{'"\s]*['"]?en(?![A-Za-z])/i;

/**
 * The opening tag of the first `<tag` in `src`, ending at its own `>`.
 *
 * Written as a scan rather than a regex because both obvious regexes are wrong on
 * real JSX, and both were tried: `<input\b[\s\S]*?/>` is lazy to the next `/>`
 * ANYWHERE in the file, so `<input …></input>` swallows every element up to the
 * following `<br />`; `<input\b[^>]*>` stops at the `>` of the `=>` inside
 * `onChange={(e) => …}`, which cuts the tag in half. Brace and quote depth is what
 * actually delimits a JSX opening tag.
 */
function openingTag(src: string, tag: string): string | null {
  const start = src.indexOf(`<${tag}`);
  if (start === -1) return null;
  let braces = 0;
  let quote = '';
  for (let i = start; i < src.length; i += 1) {
    const c = src[i] ?? '';
    if (quote) {
      if (c === quote) quote = '';
    } else if (c === '"' || c === "'" || c === '`') quote = c;
    else if (c === '{') braces += 1;
    else if (c === '}') braces -= 1;
    else if (c === '>' && braces === 0) return src.slice(start, i + 1);
  }
  return null;
}

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
    const offenders = others
      .filter((f) => f !== FLASHCARD)
      .filter((f) => LANG_EN.test(readFileSync(f, 'utf8')));
    expect(offenders, 'these render English without the shared wrapper').toEqual([]);
  });

  it('Flashcard.tsx declares English on its answer input and nowhere else', () => {
    // The exemption above is only as good as this test. Cut the <input> element
    // out and the rest of the file must be as clean as every other file: an
    // exemption that covered the whole file would let markup drift back in
    // exactly where the learner reads the answer.
    const src = readFileSync(FLASHCARD, 'utf8');
    // A review slipped a bare `<span lang="en">` past the first version of this
    // test by closing the input with `</input>` instead of `/>`; the `id={answerId}`
    // assertion pins the deleted region to the answer field itself.
    const input = openingTag(src, 'input');
    expect(input, 'the answer input is missing from Flashcard.tsx').toBeTruthy();
    expect(input, 'the exemption must match the ANSWER input, not any input').toContain(
      'id={answerId}',
    );
    expect(LANG_EN.test(input ?? ''), 'the answer input must declare lang="en"').toBe(true);

    const withoutInput = src.replace(input ?? '', '');
    expect(
      LANG_EN.test(withoutInput),
      'lang="en" outside the answer input — wrap that text in <EnWord> instead',
    ).toBe(false);
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

  it('the English the flashcard renders is wrapped at its call site (TD-14)', () => {
    // C-0014 recorded the rule this enforces: "any new English field in Task 3
    // needs its own line here." T-041 added three, and a review proved the cost of
    // skipping them — replacing the wrapper with a bare <span> left 222 unit tests,
    // the build and 219 mobile checks all green with the headword rendered without
    // lang, dir or unicode-bidi. A negative scan cannot see markup that is absent.
    const src = readFileSync(FLASHCARD, 'utf8');
    expect(src, 'the card face (headword or translation) must render through <EnWord>').toMatch(
      /<EnWord>\s*\{text\}\s*<\/EnWord>/,
    );
    expect(src, 'the example must render through <EnText>, which marks the target').toMatch(
      /<EnText\s+segments=\{card\.back\.exampleSegments\}/,
    );
    expect(src, "the learner's own typed answer is English too").toMatch(
      /<EnWord>\s*\{typed\}\s*<\/EnWord>/,
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

  it('the registered address is English and is wrapped at its call site (TD-14)', () => {
    // Same lesson as the flashcard headword: a bare <span>{email}</span> renders
    // an address with no lang, no dir and no isolation, and every negative scan
    // in this file stays green because there is nothing to scan for.
    const src = readFileSync(join('components', 'RegisteredAddress.tsx'), 'utf8');
    expect(src, 'the registered address is Latin text in a Hebrew sentence').toMatch(
      /<EnWord[^>]*>\s*\{email\}\s*<\/EnWord>/,
    );
  });

  it('the source names and licences on /sources are wrapped at their call site (TD-14)', () => {
    // Latin runs inside a Hebrew RTL table. `CC BY-SA 4.0` rendered bare puts
    // the version number on the wrong side of the cell, and every negative scan
    // in this file stays green because there is no markup to scan for.
    const src = readFileSync(join('app', 'sources', 'page.tsx'), 'utf8');
    for (const field of ['name', 'licence', 'host']) {
      const re = new RegExp(`<EnWord>\\s*\\{source\\.${field}\\}\\s*</EnWord>`);
      expect(src, `source.${field} is Latin text and must render inside <EnWord>`).toMatch(re);
    }
  });
});
