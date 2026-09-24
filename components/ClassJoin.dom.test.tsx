// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ClassJoinView,
  CLASSES_CLOSED_HE,
  codeInput,
  COPY_HE,
  FEED_EMPTY_HE,
  JOIN_BY_CODE_HE,
  JOIN_SUBMIT_HE,
  membersHe,
  OPEN_CLASS_HE,
  wallKickerHe,
} from '@/components/ClassJoin';
import { InboxListView } from '@/components/InboxList';

afterEach(cleanup);

/**
 * T-469 — failure scenario: a learner gets a code from the teacher, taps `הקיר`, and
 * ⛔ there is nowhere to type it. These are renders, ⛔ not a source scan.
 */
describe('the הקיר tab opens (T-469)', () => {
  it('הקיר is a live tab that switches; T-479 — סיפור is live too, and the old condition line is gone', () => {
    const onTab = vi.fn();
    render(<InboxListView state={{ kind: 'loading' }} onTab={onTab} />);
    const wall = screen.getByRole('tab', { name: 'הקיר' });
    expect(wall.tagName).toBe('BUTTON');
    expect(wall.getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(wall);
    expect(onTab).toHaveBeenCalledWith('wall');
    const story = screen.getByRole('tab', { name: 'סיפור' });
    expect(story.tagName).toBe('BUTTON');
    expect(story.getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(story);
    expect(onTab).toHaveBeenCalledWith('story');
    expect(screen.queryByText('סיפור עוד לא פתוח')).toBeNull();
  });

  it('T-479 — on the story tab: `סיפור בהמשכים`, the class kicker, and the story body', () => {
    render(<InboxListView state={{ kind: 'loading' }} tab="story" wallKickerHe="הודעות · כיתה ז׳3" story={<p>chain</p>} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('סיפור בהמשכים');
    expect(screen.getByText('הודעות · כיתה ז׳3')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'סיפור' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByText('chain')).toBeTruthy();
  });

  it('on the wall tab: the render heading, the class kicker, and ⛔ no isolation card', () => {
    render(<InboxListView state={{ kind: 'loading' }} tab="wall" wallKickerHe="הודעות · כיתה ז׳3" wall={<p>body</p>} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('הקיר של הכיתה');
    expect(screen.getByText('הודעות · כיתה ז׳3')).toBeTruthy();
    expect(screen.queryByText('אין כאן משתמשים אחרים')).toBeNull();
    expect(screen.getByRole('tab', { name: 'הקיר' }).getAttribute('aria-selected')).toBe('true');
  });

  it('no class ⇒ exactly two actions: join by code, open a class', () => {
    render(<ClassJoinView state={{ kind: 'none' }} />);
    const buttons = screen.getAllByRole('button').map((b) => b.textContent);
    expect(buttons).toEqual([JOIN_BY_CODE_HE, OPEN_CLASS_HE]);
  });

  it('join: six cells; a pasted code with spaces and lower case fills all six and submits normalised', () => {
    const onJoin = vi.fn();
    const { container } = render(<ClassJoinView state={{ kind: 'none' }} onJoin={onJoin} />);
    fireEvent.click(screen.getByRole('button', { name: JOIN_BY_CODE_HE }));
    expect(container.querySelectorAll('[data-code-cell]').length).toBe(6);
    const submit = screen.getByRole('button', { name: JOIN_SUBMIT_HE }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('הקוד שקיבלת'), { target: { value: 'k7q 2mz' } });
    const cells = Array.from(container.querySelectorAll('[data-code-cell]')).map((c) => c.textContent);
    expect(cells).toEqual(['K', '7', 'Q', '2', 'M', 'Z']);
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);
    expect(onJoin).toHaveBeenCalledWith('K7Q2MZ');
  });

  it('codeInput drops what cannot be in a code (0/O/1/I/L) and stops at six', () => {
    expect(codeInput('ab0o1il cdefgh')).toBe('ABCDEF');
    expect(codeInput('  ')).toBe('');
  });

  it('create: a name is required, then onCreate gets it', () => {
    const onCreate = vi.fn();
    render(<ClassJoinView state={{ kind: 'none' }} onCreate={onCreate} />);
    fireEvent.click(screen.getByRole('button', { name: OPEN_CLASS_HE }));
    const submit = screen.getByRole('button', { name: 'פתיחה' }) as HTMLButtonElement;
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('שם הכיתה'), { target: { value: 'כיתה ז׳3' } });
    fireEvent.click(submit);
    expect(onCreate).toHaveBeenCalledWith('כיתה ז׳3');
  });

  it('in a class ⇒ the code big with העתקה, the member count, and the empty-feed line', () => {
    const state = { kind: 'in_class', cls: { code: 'K7Q2MZ', name: 'כיתה ז׳3', members: 3 } } as const;
    render(<ClassJoinView state={state} />);
    expect(screen.getByText('K7Q2MZ')).toBeTruthy();
    expect(screen.getByRole('button', { name: COPY_HE })).toBeTruthy();
    expect(screen.getByText('3 חברים')).toBeTruthy();
    expect(screen.getByText(FEED_EMPTY_HE)).toBeTruthy();
    expect(wallKickerHe(state)).toBe('הודעות · כיתה ז׳3');
    expect(membersHe(1)).toBe('חבר אחד');
  });

  it('503 classes_unavailable ⇒ «הכיתות עוד לא פתוחות», ⛔ not an error and ⛔ no retry', () => {
    render(<ClassJoinView state={{ kind: 'classes_unavailable' }} />);
    expect(screen.getByText(CLASSES_CLOSED_HE)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
