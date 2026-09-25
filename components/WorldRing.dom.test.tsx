// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { APP_CENTRE_HREF, LONG_PRESS_MS, LONG_PRESS_SLOP_PX, WorldRingView } from '@/components/WorldRing';
import { nodeRadius, slotPoint } from '@/lib/core/ringEdit';
import { placingFrom } from '@/lib/ringStore';
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

describe('placing a new app (T-505 · kol-E-03)', () => {
  const six: RingNodeId[] = ['arena', 'msgs', 'stories', 'compose', 'sentences', 'vocab'];

  it('hides the focus, floats the node, shows the brand banner word for word', () => {
    const { container } = render(
      <WorldRingView screen={screen} lastNode={null} ring={six} placing="amirnet" />,
    );
    expect(container.querySelector('[data-ring-focus]')).toBeNull();
    expect(container.querySelector('[data-ring-floating="amirnet"]')).not.toBeNull();
    const banner = container.querySelector('[data-ring-banner]');
    expect(banner?.getAttribute('data-ring-banner')).toBe('brand');
    expect(banner?.textContent).toContain('גרור את «אמירנט» למקום בטבעת');
  });

  it('⛔ not drag-only: a tap on the free slot drops there, and a tap on a resting node moves the slot', () => {
    const onPlace = vi.fn();
    const { container } = render(
      <WorldRingView screen={screen} lastNode={null} ring={six} placing="amirnet" onPlace={onPlace} />,
    );
    // the free slot starts at the end
    expect(container.querySelector('[data-ring-gap]')?.getAttribute('data-ring-gap')).toBe('6');
    fireEvent.click(container.querySelector('[data-ring-node-resting="msgs"]') as HTMLElement);
    const gap = container.querySelector('[data-ring-gap]') as HTMLElement;
    expect(gap.getAttribute('data-ring-gap')).toBe('1');
    fireEvent.click(gap);
    expect(onPlace).toHaveBeenCalledWith('amirnet', 1);
  });

  it('⛔ FAILURE SCENARIO: pointercancel (an incoming call) ⇒ back to rest, ⛔ no drop', () => {
    const onPlace = vi.fn();
    const { container } = render(
      <WorldRingView screen={screen} lastNode={null} ring={six} placing="amirnet" onPlace={onPlace} />,
    );
    const node = container.querySelector('[data-ring-floating]') as HTMLElement;
    fireEvent.pointerDown(node, { clientX: 0, clientY: 0, pointerId: 1 });
    fireEvent.pointerCancel(node, { pointerId: 1 });
    expect(onPlace).not.toHaveBeenCalled();
  });

  it('after the drop the banner is the success one («נוספה לטבעת»)', () => {
    const { container } = render(
      <WorldRingView
        screen={screen}
        lastNode={null}
        ring={[...six, 'amirnet']}
        notice={{ kind: 'added', id: 'amirnet' }}
      />,
    );
    const banner = container.querySelector('[data-ring-banner]');
    expect(banner?.getAttribute('data-ring-banner')).toBe('success');
    expect(banner?.textContent).toContain('«אמירנט» נוספה לטבעת');
    expect(banner?.textContent).toContain('7 מתוך 10 · הצמתים התיישרו מחדש');
  });
});

describe('placingFrom — what ?place= starts from (T-505ⓐ)', () => {
  it('the app «התקן» already appended is taken out to be placed', () => {
    expect(placingFrom(['arena', 'vocab', 'amirnet'], 'amirnet')).toEqual({ ring: ['arena', 'vocab'], placing: 'amirnet' });
  });
  it('⛔ FAILURE SCENARIO: a refresh mid-placing starts the same placing ⇒ ⛔ never installed twice', () => {
    const once = placingFrom(['arena', 'amirnet'], 'amirnet');
    const again = placingFrom(['arena', 'amirnet'], 'amirnet');
    expect(again).toEqual(once);
    expect(once.ring.filter((x) => x === 'amirnet')).toHaveLength(0);
  });
  it('⛔ FAILURE SCENARIO: ?place=leaders (locked) or an unknown id ⇒ browse, ring untouched', () => {
    expect(placingFrom(['arena'], 'leaders')).toEqual({ ring: ['arena'], placing: null });
    expect(placingFrom(['arena'], '__proto__')).toEqual({ ring: ['arena'], placing: null });
    expect(placingFrom(['arena'], null)).toEqual({ ring: ['arena'], placing: null });
  });
});

describe('edit mode (T-506 · kol-E-05 · D-296ⓑ)', () => {
  const seven: RingNodeId[] = ['arena', 'msgs', 'amirnet', 'stories', 'compose', 'sentences', 'vocab'];

  it('a 500ms hold opens edit mode, and the release that ends it ⛔ does not navigate', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onPick = vi.fn();
    const { container } = render(
      <WorldRingView screen={screen} lastNode={null} ring={seven} onLongPress={onLongPress} onPick={onPick} />,
    );
    const node = container.querySelector('[data-ring-node="stories"]') as HTMLElement;
    fireEvent.pointerDown(node, { clientX: 100, clientY: 100 });
    vi.advanceTimersByTime(LONG_PRESS_MS - 1);
    expect(onLongPress).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onLongPress).toHaveBeenCalledWith('stories');
    fireEvent.pointerUp(node);
    fireEvent.click(node);
    expect(onPick).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('a release before 500ms is a normal tap', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const onPick = vi.fn();
    const { container } = render(
      <WorldRingView screen={screen} lastNode={null} ring={seven} onLongPress={onLongPress} onPick={onPick} />,
    );
    const node = container.querySelector('[data-ring-node="stories"]') as HTMLElement;
    fireEvent.pointerDown(node, { clientX: 100, clientY: 100 });
    vi.advanceTimersByTime(300);
    fireEvent.pointerUp(node);
    fireEvent.click(node);
    vi.advanceTimersByTime(500);
    expect(onLongPress).not.toHaveBeenCalled();
    expect(onPick).toHaveBeenCalledWith('stories');
    vi.useRealTimers();
  });

  it('⛔ FAILURE SCENARIO: a thumb that moves more than 8px is a scroll ⇒ ⛔ no edit mode', () => {
    vi.useFakeTimers();
    const onLongPress = vi.fn();
    const { container } = render(
      <WorldRingView screen={screen} lastNode={null} ring={seven} onLongPress={onLongPress} />,
    );
    const node = container.querySelector('[data-ring-node="stories"]') as HTMLElement;
    fireEvent.pointerDown(node, { clientX: 100, clientY: 100 });
    fireEvent.pointerMove(node, { clientX: 100, clientY: 100 + LONG_PRESS_SLOP_PX + 1 });
    vi.advanceTimersByTime(1000);
    expect(onLongPress).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('the context menu (Shift+F10) opens the same mode — the keyboard\'s door', () => {
    const onLongPress = vi.fn();
    const { container } = render(
      <WorldRingView screen={screen} lastNode={null} ring={seven} onLongPress={onLongPress} />,
    );
    fireEvent.contextMenu(container.querySelector('[data-ring-node="stories"]') as HTMLElement);
    expect(onLongPress).toHaveBeenCalledWith('stories');
  });

  it('editing: a ✕ on every node, the hub reads «סיום», nodes ⛔ do not navigate, the banner is the render\'s', () => {
    const onRemove = vi.fn();
    const onDone = vi.fn();
    const { container } = render(
      <WorldRingView screen={screen} lastNode={null} ring={seven} editing onRemove={onRemove} onDone={onDone} />,
    );
    expect(container.querySelectorAll('[data-ring-remove]')).toHaveLength(7);
    expect(container.querySelectorAll('a[data-ring-node]')).toHaveLength(0);
    const hub = container.querySelector('[data-ring-focus="done"]') as HTMLElement;
    expect(hub.textContent).toContain('סיום');
    expect(container.querySelector('[data-ring-banner]')?.textContent).toContain('מצב עריכה · גרירה מחליפה מיקום');
    fireEvent.click(container.querySelector('[data-ring-remove="msgs"]') as HTMLElement);
    expect(onRemove).toHaveBeenCalledWith('msgs');
    fireEvent.click(hub);
    expect(onDone).toHaveBeenCalled();
  });

  it('after ✕ the banner says nothing was deleted, ⛔ without a confirm dialog', () => {
    const { container } = render(
      <WorldRingView screen={screen} lastNode={null} ring={seven.slice(1)} editing notice={{ kind: 'removed', id: 'arena' }} />,
    );
    const banner = container.querySelector('[data-ring-banner]');
    expect(banner?.getAttribute('data-ring-banner')).toBe('success');
    expect(banner?.textContent).toContain('ההתקדמות נשמרה במלואה');
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('⛔ FAILURE SCENARIO: ✕ on the last node ⇒ an empty ring with the hub only, ⛔ no crash', () => {
    const { container } = render(<WorldRingView screen={screen} lastNode={null} ring={[]} editing />);
    expect(container.querySelector('[data-ring-focus="done"]')).not.toBeNull();
    expect(container.querySelectorAll('[data-ring-node-editing]')).toHaveLength(0);
  });
});
