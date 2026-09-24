// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BlockKeyboardView } from '@/components/BlockKeyboard';
import { keyboardView } from '@/lib/core/blockKeyboard';
import type { Block } from '@/lib/core/continuations';

afterEach(cleanup);

/**
 * T-465 · `39 § 3` — the category row, RENDERED and pressed (⛔ not grepped).
 * Failure scenario from the row: after `I` the learner wants a verb, and the set mixes
 * 460 continuations ⇒ ⛔ no way to ask for «only verbs».
 */
const SET: readonly Block[] = [
  { word: 'go', pos: 'verb' },
  { word: 'am', pos: null },
  { word: 'like', pos: 'verb' },
  { word: 'tea', pos: 'noun' },
  { word: 'the', pos: 'determiner' },
  { word: 'and', pos: 'conjunction' },
];
const view = keyboardView({ blocks: SET, count: SET.length }, 1);

function sheetWords(): string[] {
  const sheet = screen.getByTestId('block-set');
  return within(sheet).getAllByRole('button').map((b) => b.textContent ?? '');
}

describe('BlockKeyboardView — the category row (T-465)', () => {
  it('offers only chips with a non-zero count, in the spec order', () => {
    render(<BlockKeyboardView chosen={[{ word: 'I', pos: 'pronoun' }]} view={view} status="ready" />);
    const row = screen.getByRole('group', { name: 'סינון לפי קטגוריה' });
    expect(within(row).getAllByRole('button').map((b) => b.textContent)).toEqual(['פעלים', 'שמות עצם', 'חיבור']);
  });

  it('a tap narrows the sheet to that pos in its order, the counter follows, a second tap clears', () => {
    render(<BlockKeyboardView chosen={[{ word: 'I', pos: 'pronoun' }]} view={view} status="ready" />);
    expect(screen.getByText('6 המשכים אפשריים')).toBeTruthy();
    const verbs = screen.getByRole('button', { name: 'פעלים' });
    expect(verbs.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(verbs);
    expect(verbs.getAttribute('aria-pressed')).toBe('true');
    expect(sheetWords().map((t) => t.replace('פועל', ''))).toEqual(['go', 'like']);
    expect(screen.getByText('2 המשכים אפשריים')).toBeTruthy();

    fireEvent.click(verbs);
    expect(verbs.getAttribute('aria-pressed')).toBe('false');
    expect(sheetWords()).toHaveLength(6);
  });

  it('`pos: null` stays out of every chip — `am` shows only unfiltered', () => {
    render(<BlockKeyboardView chosen={[]} view={view} status="ready" />);
    for (const name of ['פעלים', 'שמות עצם', 'חיבור']) {
      fireEvent.click(screen.getByRole('button', { name }));
      expect(sheetWords().join(' '), name).not.toContain('am');
      fireEvent.click(screen.getByRole('button', { name }));
    }
  });

  it('a new set (a block was picked) resets the filter', () => {
    const { rerender } = render(<BlockKeyboardView chosen={[]} view={view} status="ready" />);
    fireEvent.click(screen.getByRole('button', { name: 'פעלים' }));
    expect(sheetWords()).toHaveLength(2);
    const next = keyboardView({ blocks: SET.slice(0, 4), count: 4 }, 2);
    rerender(<BlockKeyboardView chosen={[{ word: 'go', pos: 'verb' }]} view={next} status="ready" />);
    expect(sheetWords()).toHaveLength(4);
    expect(screen.getByRole('button', { name: 'פעלים' }).getAttribute('aria-pressed')).toBe('false');
  });

  it('every chip is a ≥44px target and carries its word — ⛔ colour is never the only channel', () => {
    render(<BlockKeyboardView chosen={[]} view={view} status="ready" />);
    const row = screen.getByRole('group', { name: 'סינון לפי קטגוריה' });
    for (const chip of within(row).getAllByRole('button')) {
      expect(chip.className).toMatch(/min-h-touch/);
      expect((chip.textContent ?? '').trim().length).toBeGreaterThan(0);
      expect(chip.getAttribute('data-chip')).toMatch(/^(pronoun|verb|noun|adjective|conjunction)$/);
    }
  });
});
