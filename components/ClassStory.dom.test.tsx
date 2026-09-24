// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ClassStory, { ClassStoryView, STORY_EMPTY_HE, TURN_TAKEN_HE, WAITING_HE, YOUR_TURN_HE } from '@/components/ClassStory';
import { CATEGORY_CHIPS } from '@/lib/core/blockKeyboard';
import { FIXTURE_STORY } from '@/app/dev/messages/story-fixture';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('ClassStory — the chain of `scene_story` (T-479)', () => {
  it('the legend sits ABOVE the chain, all five categories in words', () => {
    const { container } = render(<ClassStoryView state={{ kind: 'ready', lines: FIXTURE_STORY, myTurn: true }} />);
    const legend = container.querySelector('[data-story-legend]') as HTMLElement;
    const firstLine = container.querySelector('[data-story-line]') as HTMLElement;
    expect(legend.compareDocumentPosition(firstLine) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const c of CATEGORY_CHIPS) expect(legend.textContent).toContain(c.he);
  });

  it('oldest first, each sentence in an LTR span, and `התור שלך` is a button when it is my turn', () => {
    const onTurn = vi.fn();
    const { container } = render(<ClassStoryView state={{ kind: 'ready', lines: FIXTURE_STORY, myTurn: true }} onTurn={onTurn} />);
    const lines = [...container.querySelectorAll('[data-story-line]')].map((l) => l.textContent ?? '');
    expect(lines[0]).toContain('One morning a small cat woke up.');
    expect(lines[2]).toContain('The cat walked to a big house.');
    expect(container.querySelector('[data-story-line] span[dir="ltr"]')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: YOUR_TURN_HE }));
    expect(onTurn).toHaveBeenCalled();
  });

  it('⛔ my turn ⇒ the waiting line, and ⛔ no turn button', () => {
    render(<ClassStoryView state={{ kind: 'ready', lines: FIXTURE_STORY, myTurn: false }} />);
    expect(screen.getByText(WAITING_HE)).toBeTruthy();
    expect(screen.queryByRole('button', { name: YOUR_TURN_HE })).toBeNull();
  });

  it('an empty chain says the story starts with you', () => {
    render(<ClassStoryView state={{ kind: 'ready', lines: [], myTurn: true }} />);
    expect(screen.getByText(STORY_EMPTY_HE)).toBeTruthy();
  });
});

describe('ClassStory live — failure scenario: the turn is taken while composing (T-479)', () => {
  const words = ['then', 'a', 'girl', 'opened', 'the', 'door'];
  function stub(post: () => Response) {
    let gets = 0;
    let saved = false;
    const spy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      if (init?.method === 'POST') { const r = post(); saved = r.ok; return r; }
      gets += 1;
      // What the server reads back: after a saved line, it IS the last line and the turn has passed.
      const lines = saved
        ? [...FIXTURE_STORY, { id: 'n', bodyEn: 'Then a girl opened the door.', createdAt: '2026-09-24T08:00:00Z', mine: true, byOpener: false, seat: 4 }]
        : FIXTURE_STORY;
      return new Response(JSON.stringify({ ok: true, lines, myTurn: !saved }), { status: 200 });
    });
    return { spy, gets: () => gets };
  }
  // The draft lives in the keyboard: a fake one whose draft is its own local text.
  const keyboard = (onSend: (w: readonly string[]) => void) => (
    <button type="button" data-fake-draft="six-words" onClick={() => onSend(words)}>send</button>
  );

  it('409 ⇒ the chain reloads, the notice shows, and the SAME sheet (the draft) is still mounted', async () => {
    const s = stub(() => new Response(JSON.stringify({ ok: false, code: 'not_your_turn' }), { status: 409 }));
    const { container } = render(<ClassStory classId="c1" keyboard={keyboard} />);
    fireEvent.click(await screen.findByRole('button', { name: YOUR_TURN_HE }));
    const draft = container.querySelector('[data-fake-draft]');
    fireEvent.click(screen.getByRole('button', { name: 'send' }));
    expect(await screen.findByText(TURN_TAKEN_HE)).toBeTruthy();
    await waitFor(() => expect(s.gets()).toBe(2));
    expect(container.querySelector('[data-fake-draft]')).toBe(draft);
    expect(container.querySelectorAll('[data-story-line]').length).toBe(FIXTURE_STORY.length);
  });

  it('success ⇒ the line is appended optimistically, the sheet closes, and the turn has passed', async () => {
    stub(() => new Response(JSON.stringify({ ok: true, id: 'n', createdAt: null, bodyEn: 'Then a girl opened the door.', myTurn: false }), { status: 200 }));
    const { container } = render(<ClassStory classId="c1" keyboard={keyboard} />);
    fireEvent.click(await screen.findByRole('button', { name: YOUR_TURN_HE }));
    fireEvent.click(screen.getByRole('button', { name: 'send' }));
    await waitFor(() => expect(container.querySelector('[data-wall-sheet]')).toBeNull());
    expect(container.textContent).toContain('Then a girl opened the door.');
    expect(await screen.findByText(WAITING_HE)).toBeTruthy();
    expect(screen.queryByRole('button', { name: YOUR_TURN_HE })).toBeNull();
  });
});
