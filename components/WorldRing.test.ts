import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Comments are stripped before the scan, the same guard `TabBar.test.ts` carries:
 * this file's own JSDoc names «בקרוב» and «—» in order to forbid them, and a scan
 * over raw text would then be proven green by prose.
 */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[^\S\n]*\/\/.*$/gm, '');

const src = stripComments(readFileSync('components/WorldRing.tsx', 'utf8'));
const page = stripComments(readFileSync('app/(tabs)/world/page.tsx', 'utf8'));

describe('the world ring shell (T-205 · T-206 · D-117 · D-118)', () => {
  it('carries the heading and the isolation card verbatim from `36 § 6`', () => {
    expect(src).toContain('העולם');
    expect(src).toContain('מרחב פתוח · לא נספר להתקדמות הלמידה');
    expect(src).toContain('בידוד מלא מהלמידה');
    expect(src).toContain('ניצחון או הפסד לא נוגעים ב-word_progress');
    expect(src).toContain('קול');
  });

  /** D-118 · T-148ⓑ — «—» is ⛔ not a legal state string anywhere on this screen. */
  it('⛔ ⛔ contains no «—» as a state string', () => {
    expect(src).not.toContain("'—'");
    expect(src).not.toContain('"—"');
    expect(src).not.toContain('>—<');
  });

  /** F-011 · F-016 · D-046 — the defect that already came back once. */
  it('⛔ ⛔ contains no «בקרוב»', () => {
    expect(src).not.toContain('בקרוב');
  });

  /** T-206ⓓ — the learner asked for the ring, ⛔ not for the last node. */
  it('⛔ ⛔ never navigates on mount', () => {
    expect(src).not.toContain('router.push');
    expect(src).not.toContain('useRouter');
    expect(src).not.toContain('redirect(');
    expect(src).not.toContain('location.href');
  });

  /** D-044 · D-051 · the isolation card is a claim the code may ⛔ not contradict. */
  it('⛔ reads only — ⛔ zero writes to the server', () => {
    expect(src).toContain('apiGet');
    expect(src).not.toContain('apiPost');
    expect(src).not.toContain('apiPatch');
    expect(src).not.toContain('apiDelete');
  });

  /** D-050 — ⛔ no points, no coin, no streak, no leaderboard. */
  it('⛔ carries no game metric of the D-050 class', () => {
    for (const banned of ['נקוד', 'מטבע', 'רצף יומי', 'ניקוד']) {
      expect(src).not.toContain(banned);
    }
  });

  /** T-206ⓔ — a browser that blocks storage gets a ring without the mark. */
  it('every `localStorage` touch sits inside a try/catch', () => {
    const touches = src.match(/localStorage/g)?.length ?? 0;
    expect(touches).toBeGreaterThanOrEqual(2);
    expect(src.match(/try \{/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    expect(src).toContain('} catch {');
  });

  /**
   * ⛔ THE MUTATION THIS KILLS: dimming a locked node and calling it done.
   * Constitution layer A — colour is ⛔ never the only channel, and the padlock
   * is the second one.
   */
  it('a locked node carries the shared padlock, ⛔ never dimming alone', () => {
    expect(src).toMatch(/import LockIcon from '@\/components\/LockIcon'/);
    expect(src).toContain('<LockIcon />');
    expect(src).toContain('aria-disabled="true"');
  });

  /** § 4.2יט decision 1 — one model, ⛔ and no second derivation in the shell. */
  it('the order, the labels and the geometry all come from `lib/core/worldRing`', () => {
    expect(src).toContain("from '@/lib/core/worldRing'");
    expect(src).toContain('ringScreen(');
    expect(src).toContain('ringPoint(');
    // ⛔ the shell may ⛔ not hold its own copy of the eight labels
    expect(src).not.toContain('זירת קרב');
    expect(src).not.toContain('אוצר מילים');
  });

  /** T-205ⓔ — one error region, one action, and ⛔ never error + content. */
  it('the empty state is one region with one action, ⛔ and the ring is not drawn beside it', () => {
    expect(src).toContain('data-ring-empty');
    // ⛔ the label is IMPORTED, ⛔ never restated — T-056: one failure sentence, one place.
    expect(src).toMatch(/import \{ RETRY_HE \} from '@\/lib\/core\/failure'/);
    expect(src).not.toContain('נסה שוב');
    expect(src.match(/\{RETRY_HE\}/g)?.length).toBe(1);
    expect(src).toContain("screen.kind === 'empty'");
  });

  /** Constitution layer A4 — every node is a 44×44 target. */
  it('every node target clears 44px through the shared token', () => {
    expect(src).toContain('min-h-touch');
    expect(src).toContain('min-w-touch');
  });
});

describe('`/world` is the ring, and ⛔ nothing else (T-205ⓐ)', () => {
  it('renders `<WorldRing>` alone', () => {
    expect(page).toContain('<WorldRing />');
  });

  it('⛔ ⛔ no longer renders the grid, the recall card or the feed', () => {
    expect(page).not.toContain('<AppGrid');
    expect(page).not.toContain('<RecallCard');
    expect(page).not.toContain('<WorldFeed');
  });
});
