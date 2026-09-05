import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/WorldFeed.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('<WorldFeed>', () => {
  it('is a client component — it holds fetch state', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
  });

  it('reaches the server ONLY through lib/api/client (⛔ no direct supabase import)', () => {
    expect(CODE).toContain("from '@/lib/api/client'");
    expect(CODE).not.toContain('@supabase');
    expect(CODE).not.toContain('createBrowserClient');
  });

  it('renders every English run through the bidi wrapper, ⛔ never a bare span', () => {
    expect(CODE).toMatch(/<EnText|<EnWord/);
  });

  it('has an empty state with exactly one action, ⛔ not a white screen', () => {
    expect(CODE).toContain('כתוב את הפוסט הראשון');
  });

  it('has a skeleton in the shape of the content, ⛔ not a spinner (constitution § 5)', () => {
    expect(CODE).toMatch(/animate-pulse|data-skeleton/);
    expect(CODE).not.toMatch(/spinner|animate-spin/);
  });

  it('shows «—» and ⛔ not 0 when the count is unknown — the <MeScreen> rule', () => {
    expect(CODE).toContain('—');
    // ⚠️ The assertion above is blind on its own: «—» survives in the file while the number
    // beside it is derived from the wrong thing. The counter is «מילים שהפקת», so it is
    // measured at the CALL SITE — the pure counter is called on the post bodies, and the
    // post COUNT is never what the label is printed over (the C-0120 lesson).
    expect(CODE).toContain('producedWordCount(state.posts.map((post) => post.body_en))');
    expect(CODE).not.toMatch(/produced\s*=\s*[^;]*posts\.length/);
  });

  it('⛔ carries no ActionBar — this screen already has the tab bar (D-028)', () => {
    expect(CODE).not.toContain('ActionBar');
  });

  it('⛔ has no vertical centring — F-011 came back once as F-016', () => {
    expect(CODE).not.toMatch(/justify-center[^"']*flex-1|flex-1[^"']*justify-center/);
  });

  it('⛔ uses no radius outside constitution v2 layer B\'s five-value scale (D-102 · T-168)', () => {
    // ⚠️ UPDATED T-168 half B: the frozen v1 list {md, lg, 2xl} predates Roy's product
    // vision (D-102, 23/08) and rejected `full`, which D-102 explicitly allows for the
    // primary button and the chip. `scripts/radius-hygiene.test.ts` is the single source
    // of truth for the five allowed values; this assertion mirrors it rather than a dead
    // v1 list, so a real sixth value is still caught here.
    const radii = [...CODE.matchAll(/rounded-([a-z0-9]+)/g)].map((m) => m[1] ?? '');
    expect([...new Set(radii)].filter((r) => !['md', 'lg', 'xl', '2xl', 'full'].includes(r))).toEqual([]);
  });

  it('⛔ says nothing that grades the learner (R-016)', () => {
    for (const forbidden of ['נכון', 'יפה', 'כל הכבוד', 'שגוי', 'טעות']) {
      expect(CODE, `R-016: "${forbidden}"`).not.toContain(forbidden);
    }
  });
});
