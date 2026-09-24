// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * T-486 · D-291 — the opener picks a picture for a new question. The live `<ClassWall>`,
 * with the API and the keyboard stubbed: the keyboard is `BlockKeyboard`'s own contract
 * (`onSend(words)`), so a button that sends one sentence is the whole of what it does here.
 */
const posts: { url: string; body: Record<string, unknown> }[] = [];
let postAnswer: () => Promise<unknown>;

vi.mock('@/lib/api/client', () => ({
  apiGet: async () => ({ ok: true, amOpener: true, posts: [] }),
  apiPost: async (url: string, body: Record<string, unknown>) => { posts.push({ url, body }); return postAnswer(); },
}));
vi.mock('@/components/BlockKeyboard', () => ({
  default: ({ onSend }: { onSend: (w: readonly string[]) => void }) => (
    <button type="button" data-test-send onClick={() => onSend(['what', 'can', 'you', 'see'])}>send</button>
  ),
}));

const { default: ClassWall, NEW_QUESTION_HE } = await import('@/components/ClassWall');
const { NO_PICTURE_HE, WALL_PICTURE_KEYS, WALL_PICTURE_LABEL_HE, WallPicturePicker } = await import('@/components/WallPicture');

afterEach(cleanup);
beforeEach(() => { posts.length = 0; });

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

describe('the picture picker (T-486)', () => {
  it('nine tiles: «בלי תמונה» first, then the eight scenes; each ≥44px by class; the chosen is pressed AND marked', () => {
    const onChange = vi.fn();
    const { container, rerender } = render(<WallPicturePicker value={undefined} onChange={onChange} />);
    const tiles = [...container.querySelectorAll('[data-wall-picture-tile]')] as HTMLElement[];
    expect(tiles.map((t) => t.dataset.wallPictureTile)).toEqual(['none', ...WALL_PICTURE_KEYS]);
    expect(tiles[0]?.getAttribute('aria-label')).toBe(NO_PICTURE_HE);
    for (const t of tiles) { expect(t.className).toMatch(/min-h-touch/); expect(t.className).toMatch(/min-w-touch/); }
    expect(tiles[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelector('[data-wall-picture]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: WALL_PICTURE_LABEL_HE.beach }));
    expect(onChange).toHaveBeenCalledWith('beach');
    rerender(<WallPicturePicker value="beach" onChange={onChange} />);
    const beach = container.querySelector('[data-wall-picture-tile="beach"]') as HTMLElement;
    expect(beach.getAttribute('aria-pressed')).toBe('true');
    expect(beach.querySelector('svg path[d^="M5 12"]')).toBeTruthy(); // the check mark — ⛔ not the ring alone
    // the preview, at the card's own size, under the row
    expect(container.querySelector('[data-wall-picture="beach"]')).toBeTruthy();
  });

  it('failure scenario: pick «beach», the send falls on the network ⇒ the retry STILL carries beach', async () => {
    let fail = true;
    postAnswer = async () => {
      if (fail) throw new Error('network');
      return { ok: true, id: 'p1', createdAt: '2026-09-24T10:00:00Z', bodyEn: 'What can you see?', pictureKey: 'beach' };
    };
    const { container } = render(<ClassWall classId="33333333-3333-4333-8333-333333333333" />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: NEW_QUESTION_HE }));
    fireEvent.click(screen.getByRole('button', { name: WALL_PICTURE_LABEL_HE.beach }));
    fireEvent.click(container.querySelector('[data-test-send]') as HTMLElement);
    await flush();
    expect(posts[0]?.body).toEqual({ words: ['what', 'can', 'you', 'see'], pictureKey: 'beach' });
    expect(screen.getByRole('alert')).toBeTruthy();
    expect(container.querySelector('[data-wall-picture-tile="beach"]')?.getAttribute('aria-pressed')).toBe('true');
    fail = false;
    fireEvent.click(container.querySelector('[data-test-send]') as HTMLElement);
    await flush();
    expect(posts[1]?.body.pictureKey).toBe('beach');
    expect(container.querySelector('[data-wall-post] [data-wall-picture="beach"]')).toBeTruthy();
    expect(container.querySelector('[data-wall-sheet]')).toBeNull();
  });

  it('no picture chosen ⇒ the body carries ⛔ no pictureKey at all', async () => {
    postAnswer = async () => ({ ok: true, id: 'p2', createdAt: '2026-09-24T10:00:00Z', bodyEn: 'What can you see?', pictureKey: null });
    const { container } = render(<ClassWall classId="33333333-3333-4333-8333-333333333333" />);
    await flush();
    fireEvent.click(screen.getByRole('button', { name: NEW_QUESTION_HE }));
    fireEvent.click(container.querySelector('[data-test-send]') as HTMLElement);
    await flush();
    expect(posts[0]?.body).toEqual({ words: ['what', 'can', 'you', 'see'] });
    expect(container.querySelector('[data-wall-post] [data-wall-picture]')).toBeNull();
  });
});
