import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * Comments are stripped before the scan — the same guard `ActionBar.test.ts` carries, and
 * here it is not a precaution but a repair. Measured in C-0163: over RAW text, the mutation
 * that reduces the active-tab marker to colour alone (`border-t-2 border-brand
 * font-semibold` → `text-brand`) left every check GREEN, because the regex matched the word
 * `aria-current` inside this component's own JSDoc and then found `border-t-2` in a constant
 * 300 characters later. With comments stripped the same mutation fails.
 *
 * ⚠️ **And in THIS tick the guard earns its keep twice over:** the JSDoc above the component
 * now explains at length what the lock USED to be, naming `href: null`, `aria-disabled` and
 * the sheet. Every «⛔ the lock is gone» assertion below would be proven false by prose if
 * the comments were still in the string.
 */
const stripComments = (source: string): string =>
  withoutComments(source);

const src = stripComments(readFileSync('components/TabBar.tsx', 'utf8'));
const settings = stripComments(readFileSync('app/(tabs)/settings/page.tsx', 'utf8'));

describe('the five-tab shell (T-174 · `36 § 4`)', () => {
  it('carries exactly the five locked labels', () => {
    for (const label of ['לימודים', 'כרטיסיות', 'העולם', 'אני', 'הגדרות']) {
      expect(src).toContain(label);
    }
  });

  it('keeps the RTL order: studies is first in the DOM, settings is last', () => {
    const order = ["id: 'studies'", "id: 'cards'", "id: 'world'", "id: 'me'", "id: 'settings'"].map(
      (id) => src.indexOf(id),
    );
    expect(order.every((i) => i > -1)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  /**
   * ⛔ THE MUTATION THIS KILLS: dropping back to four tabs. `36 § 4` adds `הגדרות` for one
   * structural reason — a bar of four ⛔ cannot put `העולם` at the exact geometric centre —
   * so the count is the requirement, ⛔ not a preference.
   */
  it('has exactly five tabs, and `העולם` is the middle one', () => {
    expect(src.match(/labelHe:/g)?.length).toBe(5);
    const ids = [...src.matchAll(/id: '(\w+)'/g)].map((m) => m[1]);
    expect(ids).toEqual(['studies', 'cards', 'world', 'me', 'settings']);
    expect(ids[2]).toBe('world');
  });

  it('renders the globe from the shared component, ⛔ never a local copy (T-078)', () => {
    // The globe is the same glyph the ring focus draws — one home, two callers.
    expect(src).toMatch(/import GlobeIcon from '@\/components\/GlobeIcon'/);
    expect(src).not.toMatch(/function GlobeIcon/);
  });

  it('marks the active tab by state and shape, ⛔ never by colour alone (constitution § 1)', () => {
    expect(src).toContain('aria-current');
    expect(src).toMatch(/border-t-2 border-brand font-semibold/);
  });

  it('keeps every tap target at the 44px floor (`36 § 4` — § 3 does ⛔ not apply to tabs)', () => {
    expect(src).toContain('min-h-touch');
    expect(src).toContain('min-w-touch');
  });

  it('marks itself for the harness and the document padding', () => {
    expect(src).toContain('data-tab-bar');
  });

  it('sets the label size `36 § 4` names', () => {
    expect(src).toContain('text-[9.8pt]');
  });
});

/**
 * 🔴 **D-117 — the tab stops being a door.** Every assertion in this block is the INVERSE of
 * one that stood here until 2026-08-26, and that is deliberate: the old shape was measured
 * live at 08:40Z printing the lock label on three different screens while `/world` behind it
 * rendered two open apps. Seal ⓐ of `36 § 13.2` was failing, and the assertions were green.
 *
 * ⚠️ **F-039 still applies:** no check below is a bare `toContain(<name>)`. Each one names
 * the exact construct that must be ABSENT, so a partial revert — the sheet kept, the state
 * kept, the fetch kept — fails by name rather than by count.
 */
describe('🔴 <TabBar> — the world entry is a plain Link on every screen (D-117)', () => {
  it('`world` carries a real href, ⛔ and ⛔ never `href: null`', () => {
    expect(src).toMatch(/\{ id: 'world', href: '\/world'/);
    expect(src).not.toMatch(/href:\s*null/);
  });

  /** F-011 came back once as F-016. It may ⛔ not come back a third time. */
  it('⛔ ⛔ this file does ⛔ NOT contain the string «בקרוב»', () => {
    expect(src).not.toContain('בקרוב');
  });

  it('⛔ ⛔ no sheet, ⛔ no disabled entry, ⛔ no lock mark in the bar', () => {
    expect(src).not.toContain('aria-disabled');
    expect(src).not.toContain('role="dialog"');
    expect(src).not.toContain('LockIcon');
    expect(src).not.toMatch(/setWorldSheetOpen/);
  });

  /**
   * ⛔ THE POINT OF D-119, AND WHAT MAKES SEAL ⓐ LOOP-VERIFIABLE: there is now ⛔ zero
   * server traffic on the path «any screen → tab → ring». A read reintroduced here would
   * hand the seal back to a session the sandbox does not have.
   */
  it('⛔ ⛔ reads nothing from the server — ⛔ no fetch, ⛔ no state, ⛔ no effect', () => {
    expect(src).not.toContain('apiGet');
    expect(src).not.toContain('/api/world/status');
    expect(src).not.toContain('useEffect');
    expect(src).not.toContain('useState');
    expect(src).not.toContain('worldGateSentenceHe');
  });

  it('⛔ ⛔ invents no threshold and ⛔ no count in a Hebrew string', () => {
    expect(src).not.toMatch(/כשיהיו לך \d/);
    expect(src).not.toMatch(/נדרש\w* \d/);
  });

  /** `36 § 4` — the raised circle, and it is a SHAPE channel before it is a colour one. */
  it('the world entry is the raised circle the render draws, on `--brand-surface`', () => {
    expect(src).toContain('data-tab-world');
    expect(src).toContain('bg-brand-surface');
    expect(src).toContain('rounded-full');
    // r=27 ⇒ a 54px circle.
    expect(src).toContain('h-[54px]');
    expect(src).toContain('w-[54px]');
  });
});

/**
 * T-174 — the fifth tab needs a destination that exists. A tab whose route 404s is worse
 * than four tabs, so this block measures the screen and ⛔ not only the bar.
 */
describe('הגדרות — the fifth tab has somewhere to land (T-174 · `36 § 4`)', () => {
  it('renders a heading and the level-change entry `36 § 4` names', () => {
    expect(settings).toContain('הגדרות');
    expect(settings).toContain('שינוי רמה');
  });

  it('sends the level change to the scan route, ⛔ from the shared constant', () => {
    expect(settings).toMatch(/import \{ LEVEL_SCAN_HREF \} from '@\/lib\/core\/worldApps'/);
    expect(settings).toMatch(/href=\{LEVEL_SCAN_HREF\}/);
    expect(settings).not.toContain("'/study/scan'");
  });

  /**
   * ⛔ THE MUTATION THIS KILLS: a settings screen filling itself with plausible rows. Not
   * one of theme / notifications / language is in an anchor document, and a settings screen
   * is exactly where invented product surface hides best (R-010 one feature over).
   */
  it('⛔ ⛔ invents no setting an anchor document does not name', () => {
    for (const invented of ['ערכת נושא', 'התראות', 'שפה', 'מצב כהה', 'יציאה']) {
      expect(settings).not.toContain(invented);
    }
  });

  it('keeps its one action at the 44px floor', () => {
    expect(settings).toContain('min-h-touch');
  });
});
