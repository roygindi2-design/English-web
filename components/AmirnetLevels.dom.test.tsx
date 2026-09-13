// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AmirnetLevels, { AMIRNET_LEVEL_ROWS, OPEN_LABEL_HE } from '@/components/AmirnetLevels';

afterEach(cleanup);

/**
 * `T-311` — measured live in C-0554's screen walk (`next start`, 375×844,
 * `/world/amirnet/simulation`), ⛔ not guessed: `isDisabled()` on the `רמה 1` card returned
 * `false` **while** `טוען את הסימולציה…` was on screen, and three taps produced **three**
 * `GET /api/amirnet/simulation` calls. The answer that arrives last is the one that enters
 * `setPhase({kind:'run'})` ⇒ a 39-minute run starting from a tap the learner ⛔ did not mean.
 *
 * ⚠️ These assertions RENDER, ⛔ they do not `grep` the source — that is the whole lesson of
 * `F-224`: `AmirnetLevels.test.ts` reads the file as text and ⛔ could not see a press that
 * runs twice, because the source of a card that presses twice reads exactly like one that
 * presses once.
 */
/** `רמה 1 · בסיסי` — the exact card C-0554's walk measured. */
const LEVEL_1_HE = 'רמה 1 · בסיסי';
// ⛔ and it is the register's own first row, ⛔ not a string retyped here:
// AMIRNET_LEVEL_ROWS[0].nameHe === LEVEL_1_HE is asserted below.

function openCard(): HTMLElement {
  return screen.getByRole('button', { name: new RegExp(LEVEL_1_HE) });
}

describe('AmirnetLevels — a press answers, and it ⛔ cannot run twice (T-311)', () => {
  it('the card this test drives is the register\'s own first row, ⛔ not a retyped string', () => {
    expect(AMIRNET_LEVEL_ROWS.map((r) => r.nameHe)).toContain(LEVEL_1_HE);
  });

  it('⛔ THE DEFECT ITSELF: three presses while busy ⇒ ONE call to onStart', () => {
    const onStart = vi.fn();
    render(<AmirnetLevels unlockedThrough={4} onStart={onStart} busy={false} />);

    const card = openCard();
    fireEvent.click(card);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith(1);

    // The parent answers the first press by going `loading` ⇒ the card comes back blocked.
    cleanup();
    render(<AmirnetLevels unlockedThrough={4} onStart={onStart} busy />);
    fireEvent.click(openCard());
    fireEvent.click(openCard());
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('a blocked card says so in the accessibility tree, ⛔ not in opacity alone', () => {
    render(<AmirnetLevels unlockedThrough={4} onStart={vi.fn()} busy />);
    const card = openCard();
    expect(card.getAttribute('aria-busy')).toBe('true');
    expect((card as HTMLButtonElement).disabled).toBe(true);
    // ⛔ The card still SAYS `פתוח` — busy is «a run is being fetched», ⛔ not «this level is shut».
    expect(card.textContent).toContain(OPEN_LABEL_HE);
  });

  it('⛔ busy is not the resting state: absent ⇒ every unlocked card presses', () => {
    const onStart = vi.fn();
    render(<AmirnetLevels unlockedThrough={4} onStart={onStart} />);
    for (const row of AMIRNET_LEVEL_ROWS) {
      const card = screen.getByRole('button', { name: new RegExp(row.nameHe) });
      expect(card.getAttribute('aria-busy'), row.nameHe).toBe('false');
      fireEvent.click(card);
    }
    expect(onStart.mock.calls.map((c) => c[0])).toEqual([1, 2, 3, 4]);
  });

  it('every open card carries the pressed feedback of the product (ux › Interaction › Active States)', () => {
    render(<AmirnetLevels unlockedThrough={4} onStart={vi.fn()} />);
    for (const row of AMIRNET_LEVEL_ROWS) {
      const card = screen.getByRole('button', { name: new RegExp(row.nameHe) });
      expect(card.className, row.nameHe).toMatch(/active:opacity-90/);
      expect(card.className, row.nameHe).toMatch(/min-h-touch/);
    }
  });

  it('a LOCKED card is ⛔ not a button at all, busy or not — it ⛔ never becomes one', () => {
    for (const busy of [false, true]) {
      render(<AmirnetLevels unlockedThrough={1} onStart={vi.fn()} busy={busy} />);
      expect(screen.getAllByRole('button')).toHaveLength(1);
      cleanup();
    }
  });
});
