// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StoryScreenView, type StoryPayload } from '@/components/StoryScreen';

afterEach(cleanup);

/**
 * ⛔ **הפיקסטורה הזאת ⛔ אינה «כמו» נתוני המוצר — היא הצורה של החוט.** הלקח של 23/08
 * (`DEV.md`): 2,403 בדיקות היו ירוקות כי הפיקסטורה נבדלה מנתוני הייצור בממד אחד.
 * ⇒ `question` כאן הוא שורה 2 של `data/generated/story-questions-2026-08-25.jsonl`,
 * ⛔ ולא שאלה שנכתבה כאן.
 */
const PAYLOAD: StoryPayload = {
  story: { id: 'fixture-story', titleEn: 'The library near the river', bodyEn: 'She found a book.' },
  index: 3,
  total: 12,
  level: 'A1',
  glosses: { book: { translationHe: 'סֵפֶר', posHe: 'שם עצם', wordId: 'fixture-book' } },
  knownLemmas: ['book'],
  counts: { newWords: 5, alreadyKnown: 2 },
  question: {
    questionEn: 'Who wrote the letter that was in the book?',
    answersHe: ['אם', 'אנשים', 'חבר'],
    correctIndex: 2,
  },
};

describe('T-202 — the question is a STATE, and the chrome survives the swap', () => {
  it('phase `reading` shows ⛔ no question', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.queryByText('שאלת הבנה')).toBeNull();
    expect(screen.getByText('סיפור 3 מתוך 12')).toBeTruthy();
  });

  it('one press on the primary action swaps the BODY and ⛔ keeps the chrome', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(screen.getByText('שאלת הבנה')).toBeTruthy();
    // ⛔ THE POINT OF THE TEST: the chrome must still be there after the swap.
    expect(screen.getByText('סיפור 3 מתוך 12')).toBeTruthy();
    expect(screen.getByText('5 מילים חדשות · 2 שכבר ידעת')).toBeTruthy();
  });

  it('⛔ the reading paragraph is gone once the question is up — it is a SWAP, ⛔ not an append', () => {
    const { container } = render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(container.querySelector('[data-story-body]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(container.querySelector('[data-story-body]')).toBeNull();
  });

  it('T-203 — the primary action names what it does, in each phase', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.getByRole('button', { name: 'סיימתי לקרוא' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי לקרוא' }));
    expect(screen.getByRole('link', { name: 'חזרה לעולם' })).toBeTruthy();
  });

  it('⛔ leaving without answering is legal — the exit is live in BOTH phases', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />);
    const exit = screen.getByRole('link', { name: 'חזרה לעולם' });
    expect(exit.hasAttribute('aria-disabled')).toBe(false);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('⛔ a story with ⛔ no question has ⛔ no second phase', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: { ...PAYLOAD, question: null } }} />);
    expect(screen.queryByRole('button', { name: 'סיימתי לקרוא' })).toBeNull();
    expect(screen.getByRole('link', { name: 'חזרה לעולם' })).toBeTruthy();
  });

  it('T-150 — the intro layer states what the learner ALREADY has', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} />);
    expect(screen.getByText(/בסיפור הזה 1 מילים\. 1 מהן אתה כבר מכיר\./)).toBeTruthy();
  });

  it('⛔ the intro layer belongs to the READING phase only', () => {
    render(<StoryScreenView state={{ kind: 'ready', payload: PAYLOAD }} initialPhase="question" />);
    expect(screen.queryByText(/בסיפור הזה 1 מילים\./)).toBeNull();
  });
});
