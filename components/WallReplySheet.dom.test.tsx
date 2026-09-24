// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyLike, ClassWallView, ADD_REPLY_HE, NEW_QUESTION_HE } from '@/components/ClassWall';
import { NOT_SENT_HE, WallReplySheet } from '@/components/WallReplySheet';
import { FIXTURE_WALL, FIXTURE_WALL_NOW } from '@/app/dev/messages/wall-fixture';

afterEach(cleanup);

/** T-474 — renders, ⛔ not a source scan. */
describe('replying to the wall (T-474)', () => {
  it('every post offers «הוסף תגובה מהבלוקים», and it names its post', () => {
    const onReply = vi.fn();
    render(<ClassWallView state={{ kind: 'ready', posts: FIXTURE_WALL }} nowIso={FIXTURE_WALL_NOW} onReply={onReply} />);
    const buttons = screen.getAllByRole('button', { name: ADD_REPLY_HE });
    expect(buttons).toHaveLength(FIXTURE_WALL.length);
    fireEvent.click(buttons[0] as HTMLElement);
    expect(onReply).toHaveBeenCalledWith('wp1');
  });

  it('«שאלה חדשה» exists only when the caller passes it (the opener, D-288)', () => {
    render(<ClassWallView state={{ kind: 'ready', posts: FIXTURE_WALL }} nowIso={FIXTURE_WALL_NOW} />);
    expect(screen.queryByRole('button', { name: NEW_QUESTION_HE })).toBeNull();
    cleanup();
    render(<ClassWallView state={{ kind: 'ready', posts: FIXTURE_WALL }} nowIso={FIXTURE_WALL_NOW} onAsk={() => {}} />);
    expect(screen.getByRole('button', { name: NEW_QUESTION_HE })).toBeTruthy();
  });

  it('a heart is a toggle; on your own reply it is OFF, and says why in words', () => {
    const onLike = vi.fn();
    const { container } = render(<ClassWallView state={{ kind: 'ready', posts: FIXTURE_WALL }} nowIso={FIXTURE_WALL_NOW} onLike={onLike} />);
    const postHeart = container.querySelector('[data-wall-post] > div [data-wall-likes]') as HTMLButtonElement;
    expect(postHeart.tagName).toBe('BUTTON');
    fireEvent.click(postHeart);
    expect(onLike).toHaveBeenCalledWith({ postId: 'wp1' });
    const own = FIXTURE_WALL.flatMap((p) => p.top).find((r) => r.mine);
    if (own) {
      const ownHeart = Array.from(container.querySelectorAll('button[data-wall-likes]')).find((b) => b.textContent?.includes('תוכן שלך')) as HTMLButtonElement;
      expect(ownHeart.disabled).toBe(true);
    }
  });

  it('applyLike flips optimistically, and the server answer wins', () => {
    const once = applyLike(FIXTURE_WALL, { postId: 'wp1' });
    expect(once[0]?.likedByMe).toBe(!FIXTURE_WALL[0]?.likedByMe);
    expect(Math.abs((once[0]?.likes ?? 0) - (FIXTURE_WALL[0]?.likes ?? 0))).toBe(1);
    expect(applyLike(once, { postId: 'wp1' }, { liked: true, likes: 40 })[0]).toMatchObject({ likedByMe: true, likes: 40 });
    const r = applyLike(FIXTURE_WALL, { replyId: 'wr1' });
    expect(r[0]?.top.find((x) => x.id === 'wr1')?.likes).toBe(10);
  });

  it('failure scenario: a failed send keeps the SAME keyboard mounted and says «לא נשלח»', () => {
    const kb = <div data-testid="kb">six picks</div>;
    const { rerender } = render(<WallReplySheet open kind="reply" questionEn="How was your weekend?" onSend={() => {}} onClose={() => {}} keyboard={kb} />);
    const before = screen.getByTestId('kb');
    rerender(<WallReplySheet open hidden kind="reply" questionEn="How was your weekend?" onSend={() => {}} onClose={() => {}} keyboard={kb} />);
    expect(document.querySelector('[data-testid="kb"]')).toBe(before);
    rerender(<WallReplySheet open failed kind="reply" questionEn="How was your weekend?" onSend={() => {}} onClose={() => {}} keyboard={kb} />);
    expect(screen.getByTestId('kb')).toBe(before);
    expect(screen.getByRole('alert').textContent).toBe(NOT_SENT_HE);
  });

  it('the question stays readable in the sheet head (kol-C-12)', () => {
    render(<WallReplySheet open kind="reply" questionEn="How was your weekend?" onSend={() => {}} onClose={() => {}} keyboard={<div />} />);
    expect(screen.getByRole('dialog').textContent).toContain('How was your weekend?');
  });
});
