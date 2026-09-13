import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * 📐 T-285 · D-206 · closes F-198 — **one gutter for the whole product.**
 *
 * ⛔ This file is the gate D-206 measured as MISSING: «tests that assert the gutter
 * itself ⇒ ⛔ zero». `MeScreen.test.ts:108` asserts `px-5` on a **button**, ⛔ not on the
 * screen column, so nothing anywhere stopped a second gutter from being born — and two
 * had been (`app/layout.tsx` at 20px against the render's 24, plus `mx-1` on
 * `DeckSelector` faking the 4px back).
 *
 * 🔬 **What it measures, and why it reads SOURCE and not a rendered tree:** a gutter is a
 * class on the column element. A DOM assertion would need every screen mounted to catch
 * the one screen that added its own; a source scan catches it in the file where it is
 * written, which is where the reviewer is looking anyway.
 *
 * ⛔ **The rule, in one line:** the column gutter lives in `app/layout.tsx` and nowhere
 * else. Any OTHER file that both constrains the column (`max-w-md`) and pads it
 * horizontally (`px-*`) is a second gutter — with exactly two declared exceptions, both
 * of which escape `<main>` and therefore have to carry their own copy of the same number.
 *
 * 🧹 **T-326 moved ONE of the three elements, and this gate follows it rather than
 * dropping it.** The `<footer>` is now `components/SourcesFooter.tsx`, because it has to
 * disappear on a task screen and a server layout cannot read the route. ⇒ `COLUMN_AREAS`
 * below names the file each area is written in, so the gutter is still asserted on all
 * three — and moving an area to a new file without teaching this test about it still
 * fails here, on the `⛔ <footer> not found` line.
 */

const GUTTER = 'px-6';

/** The three areas of the column, and the file each one is written in (T-326). */
const COLUMN_AREAS: ReadonlyArray<readonly [area: string, file: string]> = [
  ['header', 'app/layout.tsx'],
  ['main', 'app/layout.tsx'],
  ['footer', 'components/SourcesFooter.tsx'],
];

/** ⛔ Files that are legitimately OUTSIDE `RootLayout`'s `<main>` and must repeat the number. */
const ESCAPES_MAIN: ReadonlyArray<{ file: string; why: string }> = [
  {
    file: 'components/ActionBar.tsx',
    why: '`fixed inset-x-0` ⇒ it is not inside `<main>`, and its control must line up with the column above it.',
  },
  {
    file: 'app/global-error.tsx',
    why: 'Next renders `global-error` with its OWN `<html>`/`<body>` ⇒ `RootLayout` never runs for it.',
  },
];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

describe('📐 T-285 · D-206 — the product has ONE gutter', () => {
  it('header · main · footer are padded with the SAME value, and it is 24px', () => {
    for (const [area, file] of COLUMN_AREAS) {
      const src = readFileSync(file, 'utf8');
      const tag = new RegExp(`<${area} className="([^"]*)"`).exec(src);
      expect(tag, `⛔ <${area}> not found in ${file}`).not.toBeNull();
      const classes = (tag as RegExpExecArray)[1] as string;
      expect(
        classes.split(/\s+/),
        `⛔ <${area}> must carry the single gutter ${GUTTER} (D-206), not ${classes}`,
      ).toContain(GUTTER);
      // ⛔ and ⛔ no OTHER horizontal padding may sit in that file, or there are two numbers again.
      expect(/\bpx-(?!6\b)\d/.test(src), `⛔ ${file} carries a second px-* value`).toBe(false);
    }
  });

  it('⛔ no second gutter: no other file both constrains `max-w-md` AND pads it horizontally', () => {
    const allowed = new Set(ESCAPES_MAIN.map((e) => e.file));
    const offenders: string[] = [];
    for (const file of [...walk('app'), ...walk('components')]) {
      const rel = file.replace(/\\/g, '/');
      if (rel === 'app/layout.tsx' || allowed.has(rel)) continue;
      for (const [, classes] of readFileSync(file, 'utf8').matchAll(/className="([^"]*)"/g)) {
        const value = classes as string;
        if (value.includes('max-w-md') && /\bpx-\d/.test(value)) {
          offenders.push(`${rel} ⇒ "${value}"`);
        }
      }
    }
    expect(
      offenders,
      '⛔ a second gutter was added. The column is padded ONCE, in `app/layout.tsx` (D-206). ' +
        'A screen that needs more room changes the ONE number, ⛔ it does not add its own.',
    ).toEqual([]);
  });

  it('the two declared escapes repeat the SAME number — a copy that drifts is a second gutter', () => {
    for (const { file, why } of ESCAPES_MAIN) {
      const src = readFileSync(file, 'utf8');
      const withColumn = [...src.matchAll(/className="([^"]*max-w-md[^"]*)"/g)].map(
        (m) => m[1] as string,
      );
      expect(withColumn.length, `⛔ ${file} no longer carries the column — ${why}`).toBeGreaterThan(0);
      for (const classes of withColumn) {
        const px = /\bpx-(\d)/.exec(classes);
        if (px === null) continue;
        expect(`px-${px[1] as string}`, `⛔ ${file} drifted off the single gutter. ${why}`).toBe(
          GUTTER,
        );
      }
    }
  });
});
