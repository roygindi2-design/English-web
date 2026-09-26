// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANSWER_HINT_EN, ClassWallView, FEED_EMPTY_HE, OPENER_HE, showAllHe } from '@/components/ClassWall';
import { FIXTURE_WALL, FIXTURE_WALL_NOW } from '@/app/dev/messages/wall-fixture';
import { WALL_PICTURE_KEYS, WALL_PICTURE_LABEL_HE } from '@/components/WallPicture';
import { buildWallFeed } from '@/lib/core/wallFeed';

afterEach(cleanup);

/** T-473 — renders, ⛔ not a source scan. */
describe('ClassWall — the post cards of kol-C-10 (T-473)', () => {
  it('failure scenario: a post with 24 replies draws TWO reply cards, ⛔ not 24, and offers the rest', () => {
    const { container } = render(<ClassWallView state={{ kind: 'ready', posts: FIXTURE_WALL }} nowIso={FIXTURE_WALL_NOW} />);
    const first = container.querySelectorAll('[data-wall-post]')[0] as HTMLElement;
    expect(first.querySelectorAll('[data-wall-reply]').length).toBe(2);
    expect(first.textContent).toContain('24 תגובות');
    expect(screen.getByRole('button', { name: showAllHe(24) })).toBeTruthy();
  });

  it('the card, in the render order: author role · time · question · hint · counts', () => {
    const { container } = render(<ClassWallView state={{ kind: 'ready', posts: FIXTURE_WALL }} nowIso={FIXTURE_WALL_NOW} />);
    const first = container.querySelector('[data-wall-post]') as HTMLElement;
    const text = first.textContent ?? '';
    const order = [OPENER_HE, 'היום 08:15', 'How was your weekend?', ANSWER_HINT_EN, '24 תגובות'].map((s) => text.indexOf(s));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(first.querySelector('span[dir="ltr"]')).toBeTruthy();
    // the most-liked reply first: 13 likes (one of them mine) — the words say so, ⛔ not colour alone
    const topLikes = first.querySelector('[data-wall-reply] [data-wall-likes]') as HTMLElement;
    expect(topLikes.textContent).toContain('13');
    expect(topLikes.textContent).toContain('כולל שלך');
  });

  it('«show all» opens IN PLACE: it calls back with the post id, ⛔ it is not a link', () => {
    const onShowAll = vi.fn();
    render(<ClassWallView state={{ kind: 'ready', posts: FIXTURE_WALL }} nowIso={FIXTURE_WALL_NOW} onShowAll={onShowAll} />);
    const btn = screen.getByRole('button', { name: showAllHe(24) });
    expect(btn.tagName).toBe('BUTTON');
    fireEvent.click(btn);
    expect(onShowAll).toHaveBeenCalledWith('wp1');
  });

  it('expanded ⇒ every reply is drawn and the button is gone', () => {
    const all = Array.from({ length: 24 }, (_, i) => ({ id: `a${i}`, bodyEn: 'x', createdAt: FIXTURE_WALL_NOW, likes: 0, likedByMe: false, mine: false, seat: i + 2 }));
    const { container } = render(<ClassWallView state={{ kind: 'ready', posts: FIXTURE_WALL }} nowIso={FIXTURE_WALL_NOW} expanded={{ wp1: all }} />);
    expect(container.querySelectorAll('[data-wall-post]')[0]?.querySelectorAll('[data-wall-reply]').length).toBe(24);
    expect(screen.queryByRole('button', { name: showAllHe(24) })).toBeNull();
  });

  it('empty ⇒ the T-469 line; loading ⇒ a card-shaped skeleton, ⛔ no spinner', () => {
    render(<ClassWallView state={{ kind: 'ready', posts: [] }} nowIso={FIXTURE_WALL_NOW} />);
    expect(screen.getByText(FEED_EMPTY_HE)).toBeTruthy();
    cleanup();
    const { container } = render(<ClassWallView state={{ kind: 'loading' }} nowIso={FIXTURE_WALL_NOW} />);
    expect(container.querySelector('[data-wall-skeleton]')).toBeTruthy();
    expect(container.querySelector('[class*="animate-spin"]')).toBeNull();
  });

  it('T-484: the picture question draws its scene UNDER the question, with a Hebrew name', () => {
    const { container } = render(<ClassWallView state={{ kind: 'ready', posts: FIXTURE_WALL }} nowIso={FIXTURE_WALL_NOW} />);
    const posts = container.querySelectorAll('[data-wall-post]');
    expect(posts[0]?.querySelector('[data-wall-picture]')).toBeNull();
    const second = posts[1] as HTMLElement;
    const pic = second.querySelector('[data-wall-picture="mountains"]') as HTMLElement;
    expect(pic.getAttribute('role')).toBe('img');
    expect(pic.getAttribute('aria-label')).toBe('נוף הרים');
    expect(pic.style.aspectRatio).not.toBe('');
    const q = [...second.querySelectorAll('p')].find((p) => p.textContent?.includes('What can you see'));
    expect(q && (q.compareDocumentPosition(pic) & Node.DOCUMENT_POSITION_FOLLOWING)).toBeTruthy();
  });

  it('failure scenario: pictureKey «volcano» (not in the gallery) ⇒ ⛔ no frame at all', () => {
    const posts = buildWallFeed(
      [{ id: 'p', author_id: 'o', body_en: 'What can you see in this picture?', created_at: FIXTURE_WALL_NOW, picture_key: 'volcano' }],
      [], [], 'me', 'o', new Map(),
    );
    expect(posts[0]?.pictureKey).toBeUndefined();
    const { container } = render(<ClassWallView state={{ kind: 'ready', posts }} nowIso={FIXTURE_WALL_NOW} />);
    expect(container.querySelector('[data-wall-picture]')).toBeNull();
    expect(container.querySelector('[role="img"]')).toBeNull();
  });

  it('every scene in the closed gallery of eight has a drawing and a Hebrew name', () => {
    expect(WALL_PICTURE_KEYS.length).toBe(8);
    for (const key of WALL_PICTURE_KEYS) {
      const posts = buildWallFeed([{ id: key, author_id: 'o', body_en: 'Q?', created_at: FIXTURE_WALL_NOW, picture_key: key }], [], [], 'me', 'o', new Map());
      const { container } = render(<ClassWallView state={{ kind: 'ready', posts }} nowIso={FIXTURE_WALL_NOW} />);
      const pic = container.querySelector(`[data-wall-picture="${key}"]`);
      expect(pic?.querySelector('svg')?.childElementCount).toBeGreaterThan(0);
      expect(WALL_PICTURE_LABEL_HE[key]).toMatch(/[\u0590-\u05FF]/);
      cleanup();
    }
  });
});
