// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BLOCK_PAGE, BlockKeyboardView } from '@/components/BlockKeyboard';
import { keyboardView } from '@/lib/core/blockKeyboard';
import type { Block } from '@/lib/core/continuations';

/**
 * F-330 — the open set was drawn whole: 2,281 buttons in the reply sheet while ~30 fit
 * the box. Failure scenario: a set of 150 blocks puts 150 buttons in the DOM at once.
 */
let fire: (() => void) | null = null;
beforeEach(() => {
  fire = null;
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: (e: { isIntersecting: boolean }[]) => void) { fire = () => cb([{ isIntersecting: true }]); }
    observe() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const SET: readonly Block[] = Array.from({ length: 150 }, (_, i) => ({ word: `w${i}`, pos: 'verb' as const }));
const view = keyboardView({ blocks: SET, count: SET.length }, 1);
const drawn = () => within(screen.getByTestId('block-set')).getAllByRole('button').length;

describe('BlockKeyboardView — the set is drawn a page at a time (F-330)', () => {
  it('draws one page first, most frequent first, and a sentinel below it', () => {
    render(<BlockKeyboardView chosen={[]} view={view} status="ready" />);
    expect(drawn()).toBe(BLOCK_PAGE);
    expect(within(screen.getByTestId('block-set')).getAllByRole('button')[0]?.textContent).toContain('w0');
    expect(document.querySelector('[data-block-sentinel]')).not.toBeNull();
  });
  it('appends the next page when the sentinel is reached, and stops at the end of the set', () => {
    render(<BlockKeyboardView chosen={[]} view={view} status="ready" />);
    act(() => fire?.());
    expect(drawn()).toBe(BLOCK_PAGE * 2);
    act(() => fire?.());
    expect(drawn()).toBe(SET.length);
    expect(document.querySelector('[data-block-sentinel]')).toBeNull();
  });
});
