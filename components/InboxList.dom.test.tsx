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

import { INBOX_SKELETON_ROWS } from '@/components/InboxList';

/** T-482 · `STEP 5.6` — a cold inbox shows its shape, ⛔ not a lone «טוען…». */
describe('a cold inbox shows the shape of the inbox (T-482)', () => {
  const loading = () => render(<InboxListView state={{ kind: 'loading' }} />).container;

  it('three skeleton rows, ⛔ and the old 12px «טוען…» line is gone', () => {
    const c = loading();
    expect(c.querySelectorAll('[data-inbox-skeleton-row]').length).toBe(INBOX_SKELETON_ROWS);
    expect(INBOX_SKELETON_ROWS).toBe(3);
    expect(c.textContent).not.toContain('טוען…');
  });

  it('busy for assistive tech: aria-busy plus a spoken «טוען», the placeholders hidden', () => {
    const box = loading().querySelector('[data-inbox-skeleton]') as HTMLElement;
    expect(box.getAttribute('aria-busy')).toBe('true');
    expect(box.querySelector('.sr-only')?.textContent).toBe('טוען');
    for (const ul of box.querySelectorAll('ul')) expect(ul.getAttribute('aria-hidden')).toBe('true');
  });

  it('failure scenario: a skeleton row taller than a real row ⇒ the list jumps. Same shell, same avatar, same line boxes', () => {
    const items = mergeInbox(FIXTURE_SIMULATIONS, FIXTURE_STATES);
    const ready = render(<InboxListView state={{ kind: 'ready', rows: toInboxRows(items, FIXTURE_NOW, 'Asia/Jerusalem'), countsHe: inboxCountsHe(inboxCounts(items)) }} />).container;
    const realRow = ready.querySelector('[data-inbox-context]') as HTMLElement;
    const skelRow = loading().querySelector('[data-inbox-skeleton-row]') as HTMLElement;
    const shell = (el: HTMLElement) => el.className.split(' ').filter((k) => /^(flex|min-h-touch|gap-3|rounded-2xl|border|p-3)$/.test(k)).sort();
    expect(shell(skelRow)).toEqual(shell(realRow));
    const avatarCls = (el: Element) => el.className.split(' ').filter((k) => /^(h-10|w-10|shrink-0|rounded-full)$/.test(k)).sort();
    expect(avatarCls(skelRow.firstElementChild as Element)).toEqual(avatarCls(realRow.querySelector('[data-ctx-avatar]') as Element));
    // the text column: text-sm (h-5) · mt-1 text-sm (h-5) · mt-1 text-xs (h-4)
    const lines = [...(skelRow.children[1] as HTMLElement).children].map((l) => (l as HTMLElement).className.match(/\b(mt-1 )?flex h-[45]\b/)?.[0]);
    expect(lines).toEqual(['flex h-5', 'mt-1 flex h-5', 'mt-1 flex h-4']);
  });

  it('⛔ no spinner and ⛔ no shimmer — it is seen on every cold open', () => {
    const html = loading().innerHTML;
    expect(html).not.toMatch(/animate-(spin|pulse)|progressbar/);
  });
});
