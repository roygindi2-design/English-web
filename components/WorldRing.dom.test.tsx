// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { APP_CENTRE_HREF, WorldRingView } from '@/components/WorldRing';
import { nodeRadius, slotPoint } from '@/lib/core/ringEdit';
import { ringScreen, type RingInputs, type RingNodeId } from '@/lib/core/worldRing';

afterEach(cleanup);

const INPUTS: RingInputs = {
  arena: { kind: 'open', href: '/arcade' },
  stories: { kind: 'open', href: '/world/story' },
  compose: { kind: 'open', href: '/world/compose' },
  vocab: { kind: 'open', href: '/world/collected' },
};
const screen = ringScreen(INPUTS, '/world', 'unavailable');

const nodeIds = (c: HTMLElement): string[] =>
  [...c.querySelectorAll('[data-ring-node],[data-ring-node-blocked]')].map(
    (el) => el.getAttribute('data-ring-node') ?? el.getAttribute('data-ring-node-blocked') ?? '',
  );

describe('the World ring is the learner\'s ring (T-504)', () => {
  it('draws exactly the stored ring, in the stored order', () => {
    const ring: RingNodeId[] = ['vocab', 'arena', 'stories'];
    const { container } = render(<WorldRingView screen={screen} lastNode={null} ring={ring} />);
    expect(nodeIds(container)).toEqual(ring);
  });

  it('⛔ FAILURE SCENARIO: removed 3 of 9 ⇒ 6 nodes on /world, ⛔ not 9', () => {
    const ring: RingNodeId[] = ['arena', 'msgs', 'amirnet', 'stories', 'compose', 'sentences'];
    const { container } = render(<WorldRingView screen={screen} lastNode={null} ring={ring} />);
    expect(nodeIds(container)).toHaveLength(6);
    expect(container.querySelector('[data-ring-banner]')?.textContent).toContain('6 מתוך 10 אפליקציות בטבעת');
  });

  it('⛔ FAILURE SCENARIO: n=4 ⇒ ⛔ no two nodes overlap (centres > 2 × nodeRadius apart)', () => {
    const n = 4;
    for (let a = 0; a < n; a++) {
      for (let b = a + 1; b < n; b++) {
        const p = slotPoint(a, n);
        const q = slotPoint(b, n);
        expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(2 * nodeRadius(n));
      }
    }
    // and the full ring too — the tightest spacing the ring can reach
    const p = slotPoint(0, 10);
    const q = slotPoint(1, 10);
    expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(2 * nodeRadius(10));
  });

  it('the focus «קול» is a link to the app centre, with a name', () => {
    const { container } = render(<WorldRingView screen={screen} lastNode={null} />);
    const focus = container.querySelector('[data-ring-focus]') as HTMLAnchorElement;
    expect(focus.tagName).toBe('A');
    expect(focus.getAttribute('href')).toBe(APP_CENTRE_HREF);
    expect(focus.getAttribute('aria-label')).toBe('מרכז האפליקציות');
  });

  it('the browse banner is the render\'s, word for word', () => {
    const { container } = render(<WorldRingView screen={screen} lastNode={null} />);
    const banner = container.querySelector('[data-ring-banner]');
    expect(banner?.getAttribute('data-ring-banner')).toBe('brand');
    expect(banner?.textContent).toContain('9 מתוך 10 אפליקציות בטבעת');
    expect(banner?.textContent).toContain('הקש על קול לניהול · לחיצה ארוכה על אפליקציה לעריכה');
  });
});
