import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FAILURE_HE, FAILURE_TITLE_HE, RETRY_HE, UNREACHABLE_HE } from '@/lib/core/failure';

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.tsx$/.test(full)) out.push(full);
  }
  return out;
}

const SCREENS = [...walk('app'), ...walk('components')];

/**
 * Comments are prose, not markup — same reason and same narrow stripping as
 * `scripts/verify-mobile.test.ts`: a file is allowed to document the wording it
 * was fixed for, and convicting it for that is how a guard starts deleting
 * documentation to please itself.
 */
function markupOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

/**
 * ⚠️ Measured, ⛔ not assumed. The scan the plan specified was
 * `src.includes("'נסה שוב'") || src.includes('>נסה שוב<')`, and it was run
 * against this repo before the rewrite: it named `components/MeScreen.tsx`
 * only. `app/error.tsx` and `app/global-error.tsx` both print the label as a
 * JSX text node — `>\n        נסה שוב\n      <` — so the newline and the indent
 * walk straight past `>נסה שוב<`, and the plan's own Step 6 mutation ("re-add
 * the literal to app/error.tsx, expect FAIL naming app/error.tsx") passed
 * green. A guard that misses two of the three files it exists to catch is not a
 * guard. The label may not appear in a screen's markup in any form; the only
 * legitimate way to print it is the imported constant.
 */
function restatesRetryLabel(source: string): boolean {
  return markupOnly(source).includes(RETRY_HE);
}

describe('the failure copy is one sentence, in one place (T-056 · constitution § 2)', () => {
  it('is Hebrew, ends in a full stop, and ⛔ carries no error code', () => {
    for (const [key, text] of Object.entries(FAILURE_HE)) {
      expect(text, key).toMatch(/^[֐-׿]/);
      expect(text, key).not.toMatch(/[A-Za-z]/);
      expect(text, key).toMatch(/\.$/);
    }
    expect(RETRY_HE).toBe('נסה שוב');
  });

  it('⛔ no screen restates the retry label as a literal', () => {
    const offenders = SCREENS.filter((file) => restatesRetryLabel(readFileSync(file, 'utf8')));
    expect(offenders, `restate RETRY_HE instead of importing it`).toEqual([]);
  });

  it('catches the label as JSX text, ⛔ not only inside quotes', () => {
    // The exact shape `app/error.tsx` carried before this task, indentation included.
    expect(restatesRetryLabel('      >\n        נסה שוב\n      </button>')).toBe(true);
    expect(restatesRetryLabel(`const RETRY_HE = '${RETRY_HE}';`)).toBe(true);
    // …and the shape it carries after: the constant, imported and interpolated.
    expect(restatesRetryLabel('<button>{RETRY_HE}</button>')).toBe(false);
    // A comment that quotes the wording is documentation, ⛔ not a second wording.
    expect(restatesRetryLabel(`/* the button used to say ${RETRY_HE} inline */`)).toBe(false);
  });

  it('⛔ no screen restates a failure sentence as a literal', () => {
    const sentences = Object.values(FAILURE_HE);
    const offenders = SCREENS.filter((file) => {
      const src = readFileSync(file, 'utf8');
      return sentences.some((s) => src.includes(s));
    });
    expect(offenders).toEqual([]);
  });

  it('⛔ no screen renders a raw error object at the learner', () => {
    for (const file of SCREENS) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/\{\s*error\.(message|digest|stack)\s*\}/);
      expect(src, file).not.toMatch(/\{\s*String\(error\)\s*\}/);
    }
  });

  it('gives the two boundary screens their own titles, ⛔ not one generic one', () => {
    expect(FAILURE_TITLE_HE.route).not.toBe(FAILURE_TITLE_HE.app);
  });
});

/**
 * T-274 · D-195 § 1 — the sentence for "the request never left the device" on
 * an auth attempt. It must name the cause (the network) and say what a retry
 * does; and it is ⛔ not `FAILURE_HE.offline`, whose second sentence («הנתונים
 * לא נשמרו») is false for a login, where nothing was ever going to be saved.
 */
describe('UNREACHABLE_HE (T-274)', () => {
  it('is Hebrew, ends in a full stop, ⛔ carries no English and no error code', () => {
    expect(UNREACHABLE_HE).toMatch(/^[֐-׿]/);
    expect(UNREACHABLE_HE).not.toMatch(/[A-Za-z0-9]/);
    expect(UNREACHABLE_HE).toMatch(/\.$/);
  });

  it('names the network as the cause, and ⛔ is not the offline sentence reused', () => {
    expect(UNREACHABLE_HE).toMatch(/רשת|חיבור/);
    expect(UNREACHABLE_HE).not.toBe(FAILURE_HE.offline);
    expect(UNREACHABLE_HE).not.toContain('לא נשמרו');
  });

  it('⛔ no screen restates it as a literal', () => {
    const offenders = SCREENS.filter((file) => readFileSync(file, 'utf8').includes(UNREACHABLE_HE));
    expect(offenders).toEqual([]);
  });
});
