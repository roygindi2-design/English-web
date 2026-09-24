// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { InboxListView, type MessagesTab } from '@/components/InboxList';

afterEach(cleanup);

/** T-480 · `39 § 4` — the active pill slides; renders, ⛔ not a source scan. */
describe('the tab pill slides between הקיר · סיפור · תיבה (T-480)', () => {
  const at = (tab: MessagesTab) => render(<InboxListView state={{ kind: 'loading' }} tab={tab} />);

  it('ONE pill, and it is the SAME element across tab changes — so the browser can transition it', () => {
    const { container, rerender } = at('inbox');
    const pill = container.querySelectorAll('[data-tab-indicator]');
    expect(pill.length).toBe(1);
    rerender(<InboxListView state={{ kind: 'loading' }} tab="wall" />);
    expect(container.querySelector('[data-tab-indicator]')).toBe(pill[0]);
  });

  it('failure scenario (RTL): הקיר is 0, סיפור one tab LEFT, תיבה two — negative, ⛔ never positive', () => {
    const tx = (tab: MessagesTab) => (at(tab).container.querySelector('[data-tab-indicator]') as HTMLElement).style.transform;
    expect(tx('wall')).toBe('translateX(0%)');
    cleanup();
    expect(tx('story')).toBe('translateX(-100%)');
    cleanup();
    expect(tx('inbox')).toBe('translateX(-200%)');
  });

  it('transform only, a real curve, ≤300ms, and it stops under reduced motion', () => {
    const cls = (at('inbox').container.querySelector('[data-tab-indicator]') as HTMLElement).className;
    expect(cls).toContain('transition-transform');
    expect(cls).not.toMatch(/transition-all|transition-\[/);
    expect(cls).toContain('duration-[250ms]');
    expect(cls).toContain('motion-reduce:transition-none');
    expect(cls).toContain('right-0');
    expect(cls).toContain('w-1/3');
  });

  it('the selected tab is still named by aria-selected and weight — ⛔ never by the pill alone', () => {
    const { getByRole } = at('story');
    const tab = getByRole('tab', { name: 'סיפור' });
    expect(tab.getAttribute('aria-selected')).toBe('true');
    expect(tab.className).toContain('font-bold');
  });
});
