/**
 * T-253 · D-186 — a real script (walks the filesystem), ⛔ NOT `/lib/core`.
 *
 * Extends the live journey walk's name-drift check to a destination the walk
 * never visits together: this test scans every non-test `.ts`/`.tsx` file under
 * `app/` and `components/` for `<Link href="...">label</Link>`, and feeds the
 * result into the SAME pure `driftingNames` comparator `scripts/verify-mobile.mjs`
 * already uses on a live walk (`lib/core/journeyDrift.ts`). One name per
 * destination, checked once, over the whole tree — so a fourth name (or a
 * fourth destination) landing on a route two screens already disagree about
 * fails a real test instead of drifting in silently.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { extractLinkLabels } from '../lib/core/linkLabelScan';
import { driftingNames } from '../lib/core/journeyDrift';

const ROOT = join(__dirname, '..');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

describe('שם יעד אחד לכל יעד — סריקה סטטית על `app/` + `components/` (T-253)', () => {
  it('⛔ אין שני שמות שונים ל-`<Link href>` שמצביע לאותו יעד', () => {
    const files = [...walk(join(ROOT, 'app')), ...walk(join(ROOT, 'components'))].filter(
      (f) => /\.(ts|tsx)$/.test(f) && !/\.(test|spec)\.(ts|tsx)$/.test(f),
    );
    const source = files.map((f) => readFileSync(f, 'utf8')).join('\n');
    const labels = extractLinkLabels(source);

    expect(driftingNames(labels)).toEqual([]);
  });
});
