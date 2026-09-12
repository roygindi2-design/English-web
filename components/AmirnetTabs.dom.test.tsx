// @vitest-environment jsdom
import { existsSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import AmirnetTabs, {
  AMIRNET_BUILT_TABS,
  AMIRNET_TAB_HREF,
  AMIRNET_TABS,
  NOT_YET_HE,
  type AmirnetTabKey,
} from '@/components/AmirnetTabs';

afterEach(cleanup);

/**
 * F-224 — measured live by QA (C-0534, `next start`, 375×780) and ⛔ not guessed: every tab was a
 * `<span role="tab">` with ⛔ no `onClick`, ⛔ no `href` and ⛔ no router call, so a tab the product
 * itself declared BUILT (`aria-disabled="false"`) did nothing at all when a learner pressed it —
 * `page.url()` did ⛔ not move. That is the «פעולה שלא עושה כלום» class, `RULES § 0.31`.
 *
 * ⚠️ These assertions are a RENDER, ⛔ not a source scan, and that is the point: the defect was
 * invisible to `AmirnetTabs.test.ts` precisely because the source read perfectly — three tabs, the
 * right strings, the right order, the 44px floor. ⛔ Nothing there could see the missing href.
 */
const BUILT = AMIRNET_BUILT_TABS;

function tabEl(he: string): HTMLElement {
  return screen.getByRole('tab', { name: new RegExp(he) });
}

describe('AmirnetTabs — a built tab NAVIGATES (F-224)', () => {
  it('every built tab is an anchor carrying its mapped href', () => {
    render(<AmirnetTabs active="dashboard" built={BUILT} />);
    for (const t of AMIRNET_TABS.filter((x) => BUILT.includes(x.key))) {
      const el = tabEl(t.he);
      expect(el.tagName, t.he).toBe('A');
      expect(el.getAttribute('href'), t.he).toBe(AMIRNET_TAB_HREF[t.key]);
    }
  });

  it('the tab a learner is already on is still a real link, and says so with aria-current', () => {
    render(<AmirnetTabs active="dashboard" built={BUILT} />);
    const el = tabEl('דשבורד');
    expect(el.getAttribute('href')).toBe(AMIRNET_TAB_HREF.dashboard);
    expect(el.getAttribute('aria-selected')).toBe('true');
    expect(el.getAttribute('aria-current')).toBe('page');
  });

  it('the OTHER built tab is reachable from here — the exact move F-224 measured as dead', () => {
    render(<AmirnetTabs active="dashboard" built={BUILT} />);
    const el = tabEl('תרגול');
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('/world/amirnet/practice');
    expect(el.getAttribute('aria-selected')).toBe('false');
    expect(el.getAttribute('aria-current')).toBeNull();
  });

  it('the THIRD built tab is reachable too — ⟦C-0553 · T-308⟧ `סימולציה` stopped saying «טרם»', () => {
    render(<AmirnetTabs active="dashboard" built={BUILT} />);
    const el = tabEl('סימולציה');
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('/world/amirnet/simulation');
    expect(el.textContent).not.toContain(NOT_YET_HE);
  });

  /**
   * ⚠️ ⛔ The unbuilt BEHAVIOUR is ⛔ not deleted with the last unbuilt tab — it is measured
   * against an explicit list instead. `AMIRNET_BUILT_TABS` now holds all three, and a test that
   * read «whatever is currently missing» would have quietly stopped measuring anything the day
   * it became empty. The next tab this product adds arrives disabled, and this is what says so.
   */
  it('an unbuilt tab is ⛔ NOT a link — it stays present, disabled and «טרם» (D-152 § ב׳)', () => {
    render(<AmirnetTabs active="dashboard" built={['dashboard', 'practice']} />);
    const el = tabEl('סימולציה');
    expect(el.tagName).not.toBe('A');
    expect(el.getAttribute('href')).toBeNull();
    expect(el.getAttribute('aria-disabled')).toBe('true');
    expect(el.textContent).toContain(NOT_YET_HE);
  });

  it('keeps the 44px floor on the tappable itself, ⛔ not on a wrapper (36 § 14.4)', () => {
    render(<AmirnetTabs active="dashboard" built={BUILT} />);
    for (const t of AMIRNET_TABS) {
      expect(tabEl(t.he).className, t.he).toMatch(/min-h-touch/);
    }
  });
});

describe('AMIRNET_TAB_HREF — a built tab ⛔ never points at a route that does not exist', () => {
  it('maps all three tabs, and every BUILT one resolves to a page on disk', () => {
    expect(Object.keys(AMIRNET_TAB_HREF).sort()).toEqual(
      [...AMIRNET_TABS].map((t) => t.key).sort()
    );
    for (const key of BUILT) {
      const href = AMIRNET_TAB_HREF[key as AmirnetTabKey];
      const page = `app/(tabs)${href}/page.tsx`;
      expect(existsSync(page), `${key} ⇒ ${page}`).toBe(true);
    }
  });
});
