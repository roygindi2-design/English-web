import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * Comments are stripped before the scan, the same guard `TabBar.test.ts` carries:
 * this file's own JSDoc names «בקרוב» and «—» in order to forbid them, and a scan
 * over raw text would then be proven green by prose.
 */
const stripComments = (source: string): string =>
  withoutComments(source);

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
    // ⟦T-504ⓐ⟧ the geometry moved from a fixed angle per app (`ringPoint`) to the
    // learner's slot (`slotPoint` + `nodeRadius`, `lib/core/ringEdit.ts`) — still ⛔ computed
    // in core, ⛔ never in JSX.
    expect(src).toContain('slotPoint(');
    expect(src).toContain('nodeRadius(');
    expect(src).not.toContain('Math.cos');
    // ⛔ the shell may ⛔ not hold its own copy of the eight labels
    expect(src).not.toContain('זירת קרב');
    expect(src).not.toContain('אוצר מילים');
  });

  /** T-205ⓔ — one error region, one action, and ⛔ never error + content. */
  it('the empty state is one region with one action, ⛔ and the ring is not drawn beside it', () => {
    expect(src).toContain('data-ring-empty');
    expect(src).toContain("screen.kind === 'empty'");
  });

  /**
   * ⛔ **T-146ⓒ · D-065.** ⚠️ CHANGED C-0315, and the guard got **stronger**, ⛔ not
   * weaker: it used to assert that the shell imports `RETRY_HE` and prints it once.
   * That assertion **froze the defect** — «נסה שוב» printed unconditionally is exactly
   * the retry loop `session_expired` walks into. The label now comes off the screen
   * decision (`lib/core/worldRing.ts`, which imports `RETRY_HE` itself), so the T-056
   * invariant is intact — one wording, one place — and the shell may ⛔ not hold a
   * second copy of it in ANY form.
   */
  it('⛔ the shell ⛔ never prints an action label of its own — it draws the one the model chose', () => {
    expect(src).not.toContain('נסה שוב');
    expect(src).not.toContain('RETRY_HE');
    expect(src).not.toContain('התחברות מחדש');
    expect(src).not.toContain('חזרה ללימודים');
    expect(src).toContain('actionLabelHe');
  });

  /** T-146ⓐ — ⛔ ONE action. ⛔ Not a retry AND an exit; the ring measured «exactly one». */
  it('⛔ the empty state renders exactly one action element', () => {
    const empty = src.slice(src.indexOf('function RingEmpty'), src.indexOf('export function WorldRingView'));
    expect((empty.match(/<a\b/g) ?? []).length + (empty.match(/<Link\b/g) ?? []).length).toBe(1);
    expect(empty).not.toContain('<button');
  });

  /**
   * ⛔ `<a>` and ⛔ not `<Link>`, the same reason `LevelMapScreen` carries: when the
   * session is dead the next request MUST reach the server and be allowed to redirect.
   * The client router may answer `/login` out of its own cache.
   */
  it('the exit is a full document navigation, ⛔ not a client-router push', () => {
    const empty = src.slice(src.indexOf('function RingEmpty'), src.indexOf('export function WorldRingView'));
    expect(empty).toContain('<a');
    expect(empty).not.toContain('<Link');
  });

  /** T-146ⓒ — the screen picks ONE code, by the shared rule, ⛔ not by which fetch landed last. */
  it('the failure code is narrowed and reduced through `lib/core/failureExit`', () => {
    expect(src).toContain('toFailureCode');
    expect(src).toContain('worstFailure');
    expect(src).toContain("from '@/lib/core/failureExit'");
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
