import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

/**
 * T-264 / D-193 — guard ⓒ: every product route gets its own `document.title`.
 *
 * Measured 06/09 in this clone: 18 product routes (`page.tsx` outside `app/dev/**`),
 * 3 already carried `export const metadata` (login/signup/sources) and 15 did not —
 * `distinct document.title` across 12 live screens was **1**. This script is the gate
 * that keeps the count at 0 going forward: a NEW route (the 19th) added later without
 * its own title fails the same way these 15 did, instead of silently reproducing the
 * bug (`RULES § 0.22` — the failure this task exists against).
 */
const run = (): { out: string; code: number } => {
  try {
    return {
      out: execFileSync('node', ['scripts/check-page-titles.mjs'], { encoding: 'utf8' }),
      code: 0,
    };
  } catch (e) {
    const err = e as { stdout?: string; status?: number };
    return { out: err.stdout ?? '', code: err.status ?? -1 };
  }
};

describe('scripts/check-page-titles.mjs — every product route owns a title', () => {
  it('passes clean on the real tree — ⛔ zero routes without a title', () => {
    const r = run();
    expect(r.out, r.out).not.toMatch(/⛔/);
    expect(r.code).toBe(0);
  });

  it('⛔ never scans app/dev/** — those are fixtures, ⛔ not product routes', () => {
    const r = run();
    expect(r.out).not.toContain('app/dev/');
  });

  it('reports how many routes it checked, so a silent empty walk cannot pass', () => {
    const r = run();
    // The point is that the walk is ⛔ not empty, ⛔ not that the number never moves: a route
    // added with a title is a PASS, and pinning the exact count turns every such route into a
    // red gate on an unrelated tick. ⇒ a floor, and the two assertions above still carry «every
    // route owns a title». ⟦C-0533 · T-291 — 20 ⇒ 22 with /world/amirnet and its practice menu⟧
    const counted = Number(/checked (\d+) route/.exec(r.out)?.[1]);
    expect(counted, r.out).toBeGreaterThanOrEqual(22);
  });
});
