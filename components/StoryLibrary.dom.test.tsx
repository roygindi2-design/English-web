// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StoryLibraryView, summaryHe } from '@/components/StoryLibrary';
import { storyLibraryFixture } from '@/app/dev/story/library/library-fixture';
import { RETRY_HE } from '@/lib/core/failure';

afterEach(cleanup);

/** The SAME fixture `/dev/story/library` renders: the real 12 stories through `storyLibrary`. */
const LEVELS = storyLibraryFixture();

describe('T-511 — «ספריית הסיפורים» (Figma 3342:2)', () => {
  it('the frame’s strings, in its order', () => {
    render(<StoryLibraryView state={{ kind: 'ready', level: 'A1', levels: LEVELS }} />);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('ספריית הסיפורים');
    expect(screen.getByText('העולם · סיפורים')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'חזרה לסיפור של היום' }).getAttribute('href')).toBe('/world/story');
    expect(screen.getByText('סיפור שכבר נקרא נשאר כאן — אפשר לקרוא אותו שוב.')).toBeTruthy();
    expect(document.querySelector('[data-story-library-summary]')!.textContent).toBe(
      '3 סיפורים · 1 נקרא · הקש על סיפור כדי לקרוא',
    );
  });

  it('four level chips, the learner’s level checked on open, and ⛔ not by colour alone', () => {
    render(<StoryLibraryView state={{ kind: 'ready', level: 'A1', levels: LEVELS }} />);
    const radios = screen.getAllByRole('radio');
    expect(radios.map((r) => r.textContent)).toEqual(['A1', 'A2', 'B1', 'B2']);
    for (const r of radios) expect(r.className).toContain('h-11');
    const a1 = radios[0]!;
    expect(a1.getAttribute('aria-checked')).toBe('true');
    expect(a1.className).toContain('border-2');
    expect(a1.className).toContain('font-bold');
  });

  it('a card per story: English title, words, paragraphs, and a status of text + sign', () => {
    render(<StoryLibraryView state={{ kind: 'ready', level: 'A1', levels: LEVELS }} />);
    const cards = Array.from(document.querySelectorAll('[data-story-library-card]'));
    expect(cards).toHaveLength(3);
    expect(cards.map((c) => c.getAttribute('data-story-library-card'))).toEqual(['read', 'today', 'new']);
    expect(cards[0]!.textContent).toContain('✓ נקרא');
    expect(cards[1]!.textContent).toContain('★ הסיפור של היום');
    expect(cards[2]!.textContent).toContain('חדש');
    const a1 = LEVELS[0]!.items[0]!;
    expect(cards[0]!.textContent).toContain(a1.titleEn);
    expect(cards[0]!.textContent).toContain(`${a1.words} מילים · 3 פסקאות`);
    expect(cards[0]!.querySelector('[dir="ltr"]')!.textContent).toBe(a1.titleEn);
  });

  it('a tap opens THAT story by id — including a read one', () => {
    render(<StoryLibraryView state={{ kind: 'ready', level: 'A1', levels: LEVELS }} />);
    const read = document.querySelector('[data-story-library-card="read"]')!;
    expect(read.getAttribute('href')).toBe(`/world/story?id=${LEVELS[0]!.items[0]!.id}`);
  });

  it('switching level swaps the list and the summary', () => {
    render(<StoryLibraryView state={{ kind: 'ready', level: 'A1', levels: LEVELS }} />);
    fireEvent.click(screen.getByRole('radio', { name: 'B2' }));
    expect(screen.getByRole('radio', { name: 'B2' }).getAttribute('aria-checked')).toBe('true');
    const cards = Array.from(document.querySelectorAll('[data-story-library-card]'));
    expect(cards.map((c) => c.getAttribute('data-story-library-card'))).toEqual(['new', 'new', 'new']);
    expect(document.querySelector('[data-story-library-summary]')!.textContent).toBe(
      '3 סיפורים · 0 נקראו · הקש על סיפור כדי לקרוא',
    );
  });

  it('an empty level says so', () => {
    const levels = LEVELS.map((l) => (l.level === 'B1' ? { ...l, items: [] } : l));
    render(<StoryLibraryView state={{ kind: 'ready', level: 'B1', levels }} />);
    expect(document.querySelector('[data-story-library-empty]')!.textContent).toBe('אין עדיין סיפורים ברמה הזו');
  });

  it('no level ⇒ opens on A1', () => {
    render(<StoryLibraryView state={{ kind: 'ready', level: null, levels: LEVELS }} />);
    expect(screen.getByRole('radio', { name: 'A1' }).getAttribute('aria-checked')).toBe('true');
  });

  it('loading ⇒ three card-shaped skeletons, busy, ⛔ no failure text', () => {
    render(<StoryLibraryView state={{ kind: 'loading' }} />);
    expect(document.querySelectorAll('[data-skeleton="story-card"]')).toHaveLength(3);
    expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('session_expired ⇒ a sign-in link, ⛔ not a retry that 401s again', () => {
    render(<StoryLibraryView state={{ kind: 'session_expired' }} />);
    expect(screen.getByRole('link', { name: 'התחברות מחדש' }).getAttribute('href')).toBe('/login');
    expect(screen.queryByRole('button', { name: RETRY_HE })).toBeNull();
  });

  it('summaryHe', () => {
    expect(summaryHe([])).toBe('0 סיפורים · 0 נקראו · הקש על סיפור כדי לקרוא');
  });
});
