import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FAILURE_HE,
  FAILURE_TITLE_HE,
  RETRY_HE,
  SESSION_EXPIRED_HE,
  UNREACHABLE_HE,
} from '@/lib/core/failure';
import { withoutComments } from '@/lib/testSource';

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
  return withoutComments(src);
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

/**
 * `T-384`ⓑ · closes `F-138`ⓑ — the expired-session sentence, collapsed to one place.
 *
 * 🔬 **Measured `C-0647`, and the number had GROWN since `F-138`ⓑ was filed:** this exact
 * sentence was declared locally in **three** files — `app/(tabs)/settings/page.tsx:60`,
 * `components/LevelScan.tsx:41`, `components/LevelMapScreen.tsx:60`. Three declarations is
 * three places to drift, which is the whole of `T-056`'s argument, and `SCHEMA_MISSING_HE`
 * had already been collapsed for the same reason in `C-0477`.
 */
describe('SESSION_EXPIRED_HE (T-384ⓑ · F-138ⓑ)', () => {
  it('is Hebrew, ends in a full stop, ⛔ carries no English and no error code', () => {
    expect(SESSION_EXPIRED_HE).toMatch(/^[֐-׿]/);
    expect(SESSION_EXPIRED_HE).not.toMatch(/[A-Za-z0-9]/);
    expect(SESSION_EXPIRED_HE).toMatch(/\.$/);
  });

  it('⛔ is not a load failure reused — an expired session is a different event', () => {
    expect(Object.values(FAILURE_HE)).not.toContain(SESSION_EXPIRED_HE);
  });

  /**
   * 🔴 **This is the assertion that closes `F-138`ⓑ**, and it is measured across the whole
   * of `app/` + `components/` rather than against the three files that happened to carry it.
   */
  it('⛔ no screen restates it as a literal — ⛔ zero local declarations', () => {
    const offenders = SCREENS.filter((file) =>
      markupOnly(readFileSync(file, 'utf8')).includes(SESSION_EXPIRED_HE),
    );
    expect(offenders, 'restate SESSION_EXPIRED_HE instead of importing it').toEqual([]);
  });

  /**
   * ⛔ **And the two Amirnet wordings are ⛔ deliberately NOT swept in** (`T-384`ⓑ, verbatim).
   * They name what the learner was about to do — «כדי להתחיל סימולציה» · «כדי לראות את
   * הביצועים שלך» — which is information this sentence does not carry. A different sentence
   * for a different screen is `T-056`'s own rule, ⛔ not a violation of it, and collapsing
   * them would be a row in `amirnet`, ⛔ not here.
   */
  it('⛔ the two Amirnet sentences stay their own — ⛔ this guard does not reach them', () => {
    for (const file of ['components/AmirnetSimulationEntry.tsx', 'components/AmirnetDashboardLive.tsx']) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).toContain('SESSION_EXPIRED_HE =');
      expect(src, file).not.toContain(SESSION_EXPIRED_HE);
    }
  });
});
