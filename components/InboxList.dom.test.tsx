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

import { inboxCounts, inboxCountsHe, mergeInbox, toInboxRows } from '@/lib/core/messages';
import { FIXTURE_NOW, FIXTURE_SIMULATIONS, FIXTURE_STATES } from '@/app/dev/messages/messages-fixture';
import { readFileSync } from 'node:fs';

/** T-481 · `39 § 7` — each context wears its own hue; renders, plus the token file itself. */
describe('every character in the inbox looks like itself (T-481)', () => {
  const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
  const view = () => render(<InboxListView state={{ kind: 'ready', rows: toInboxRows(items, FIXTURE_NOW, 'Asia/Jerusalem'), countsHe: inboxCountsHe(inboxCounts(items)) }} />);

  it('three characters ⇒ three different context keys, each on its avatar AND its chip', () => {
    const { container } = view();
    const rows = [...container.querySelectorAll('[data-inbox-context]')];
    expect(new Set(rows.map((r) => r.getAttribute('data-inbox-context'))).size).toBe(3);
    for (const r of rows) {
      expect(r.querySelector('[data-ctx-avatar]')).toBeTruthy();
      expect(r.querySelector('[data-ctx-chip]')?.textContent?.length).toBeGreaterThan(0);
    }
  });

  it('⛔ colour alone never says the context: the chip carries the word', () => {
    const { container } = view();
    const words = [...container.querySelectorAll('[data-ctx-chip]')].map((c) => c.textContent);
    expect(words).toEqual(expect.arrayContaining(['תייר', 'מסעדה', 'מורה']));
  });

  it('the tokens: all four contexts in both schemes, ⛔ and none of them in palette.ts', () => {
    const css = readFileSync('components/inbox-context-tokens.css', 'utf8');
    for (const k of ['tourist', 'restaurant', 'teacher', 'hotel']) {
      expect(css.match(new RegExp(`\\[data-inbox-context='${k}'\\]`, 'g'))?.length).toBe(2);
    }
    const palette = readFileSync('lib/core/palette.ts', 'utf8');
    for (const hex of ['#b45309', '#0369a1', '#7e22ce', '#0f766e']) expect(palette).not.toContain(hex);
  });
});
