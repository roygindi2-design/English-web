import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  POPOVER_GAP,
  POPOVER_GUTTER,
  POPOVER_MAX_WIDTH,
  popoverPlacement,
  popoverWidthFor,
} from './WordPopover';

/**
 * T-290 · `D-209` · closes `F-167`.
 *
 * ⛔ The failure this file exists against: the component is *named* `WordPopover`,
 * so every earlier test, review and citation read "popover ✓" while the markup was
 * `mt-2 w-full` — a flow block under the paragraph. **The name replaced the
 * behaviour.** ⇒ these tests measure geometry and markup, never the name.
 *
 * ✔ proves: the placement maths centres on the tapped word, clamps at both screen
 *   edges, and flips above the word when the space below cannot hold the box.
 * ✔ proves: the rendered element is taken out of flow (`position: 'absolute'`), so
 *   opening it cannot push a single paragraph — the whole point of F-167.
 * ✘ cannot prove: the pixel result in a real browser. Vitest's environment is
 *   `node` and lays nothing out. That measurement is the live walk (`MF-2`, at
 *   320 · 375 · 414), and it is recorded in the delivery line of the row.
 */

const CARD = { containerWidth: 335, containerHeight: 400, popoverHeight: 180 } as const;

describe('popoverWidthFor', () => {
  it('never exceeds the max width on a roomy card', () => {
    expect(popoverWidthFor(600)).toBe(POPOVER_MAX_WIDTH);
  });

  it('leaves a gutter on both sides of a narrow card — 320px is the narrowest MF-2 width', () => {
    // 320px viewport ⇒ the body card is narrower still; it must never be wider than its parent.
    expect(popoverWidthFor(280)).toBe(280 - POPOVER_GUTTER * 2);
  });

  it('never returns a negative width', () => {
    expect(popoverWidthFor(4)).toBe(0);
  });
});

describe('popoverPlacement — the box is anchored to the word, not to the paragraph', () => {
  it('centres on the tapped word when there is room on both sides', () => {
    const width = popoverWidthFor(CARD.containerWidth);
    const { left, placement } = popoverPlacement(
      { top: 40, bottom: 70, centerX: 167 },
      CARD,
    );
    expect(left).toBe(Math.round(167 - width / 2));
    expect(placement).toBe('below');
  });

  it('clamps at the start edge instead of spilling off-screen', () => {
    const { left } = popoverPlacement({ top: 40, bottom: 70, centerX: 10 }, CARD);
    expect(left).toBe(POPOVER_GUTTER);
  });

  it('clamps at the end edge instead of spilling off-screen', () => {
    const width = popoverWidthFor(CARD.containerWidth);
    const { left } = popoverPlacement({ top: 40, bottom: 70, centerX: 330 }, CARD);
    expect(left).toBe(CARD.containerWidth - width - POPOVER_GUTTER);
  });

  it('sits one gap under the word — ⛔ not under the whole paragraph', () => {
    const { top } = popoverPlacement({ top: 40, bottom: 70, centerX: 167 }, CARD);
    expect(top).toBe(70 + POPOVER_GAP);
    // the paragraph is 400 tall; a flow block would have started at 400.
    expect(top).toBeLessThan(CARD.containerHeight);
  });

  it('flips above the word when the space below cannot hold it', () => {
    const { top, placement } = popoverPlacement(
      { top: 300, bottom: 330, centerX: 167 },
      CARD,
    );
    expect(placement).toBe('above');
    expect(top).toBe(300 - POPOVER_GAP - CARD.popoverHeight);
  });

  it('stays below when neither side fits — ⛔ never a negative top', () => {
    const tight = { containerWidth: 335, containerHeight: 120, popoverHeight: 180 } as const;
    const { top, placement } = popoverPlacement({ top: 10, bottom: 40, centerX: 167 }, tight);
    expect(placement).toBe('below');
    expect(top).toBeGreaterThanOrEqual(0);
  });
});

describe('the markup is out of flow — the guard the name defeated', () => {
  const source = readFileSync(new URL('./WordPopover.tsx', import.meta.url), 'utf8');

  it("positions the box absolutely, so opening it moves no text", () => {
    expect(source).toContain("position: 'absolute'");
  });

  it('⛔ no longer carries the full-width flow-block classes', () => {
    expect(source).not.toContain('mt-2 w-full rounded-2xl');
  });

  it('renders nothing at all without an anchor — ⛔ no unanchored fallback block', () => {
    expect(source).toContain('if (anchor === null) return null;');
  });
});
