// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }));

import AppCentre, { AppCentreView, EMPTY_RING_HE, INSTALL_HE, LOCKED_NOTE_HE, REMOVE_HE } from '@/components/AppCentre';
import { DEFAULT_RING } from '@/lib/core/ringEdit';
import type { RingNodeId } from '@/lib/core/worldRing';
import { RING_KEY, readRing, writeRing } from '@/lib/ringStore';

afterEach(cleanup);
beforeEach(() => {
  push.mockReset();
  window.localStorage.clear();
});

const SIX: RingNodeId[] = ['stories', 'vocab', 'sentences', 'arena', 'msgs', 'compose'];

describe('ringStore (T-503ⓑ · D-296)', () => {
  it('nothing stored ⇒ DEFAULT_RING', () => {
    expect(readRing()).toEqual(DEFAULT_RING);
  });
  it('round-trips under kol.ring.v1', () => {
    expect(writeRing(SIX)).toBe(true);
    expect(window.localStorage.getItem(RING_KEY)).toBe(JSON.stringify(SIX));
    expect(readRing()).toEqual(SIX);
  });
  it('garbage ⇒ DEFAULT_RING, ⛔ no throw', () => {
    window.localStorage.setItem(RING_KEY, '{not json');
    expect(readRing()).toEqual(DEFAULT_RING);
    window.localStorage.setItem(RING_KEY, '"arena"');
    expect(readRing()).toEqual(DEFAULT_RING);
  });
  it('⛔ FAILURE SCENARIO: localStorage throws ⇒ DEFAULT_RING and write reports false', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readRing()).toEqual(DEFAULT_RING);
    expect(writeRing(SIX)).toBe(false);
    get.mockRestore();
    set.mockRestore();
  });
});

describe('AppCentreView (T-503 · Figma 3341:3)', () => {
  it('draws the counter, six installed cards with «הסר», amirnet installable, two locked', () => {
    const { container } = render(<AppCentreView ring={SIX} />);
    expect(screen.getByText('6 מתוך 10 אפליקציות בטבעת')).toBeTruthy();
    expect(container.querySelectorAll('[data-pill="on"]')).toHaveLength(6);
    expect(container.querySelectorAll('[data-pill="off"]')).toHaveLength(4);
    expect(screen.getAllByText(REMOVE_HE)).toHaveLength(6);
    expect(container.querySelector('[data-install="amirnet"]')).not.toBeNull();
    expect(screen.getAllByText(LOCKED_NOTE_HE)).toHaveLength(2);
    // ⛔ a locked app carries no button at all
    expect(container.querySelector('[data-app-card="leaders"] button')).toBeNull();
    expect(container.querySelector('[data-app-card="friends"] button')).toBeNull();
  });

  it('F-332 · kol-E-02: every row carries its own glyph and a category tag — ⛔ not a placeholder square', () => {
    const { container } = render(<AppCentreView ring={SIX} />);
    const cards = container.querySelectorAll('[data-app-card]');
    expect(cards.length).toBe(9);
    for (const card of cards) {
      const id = card.getAttribute('data-app-card');
      // ⛔ FAILURE SCENARIO: the icon slot is an empty bordered box ⇒ it reads as a checkbox
      expect(card.querySelector(`[data-app-icon="${id}"] svg`)).not.toBeNull();
      expect(card.querySelector('[data-app-category]')?.textContent?.length).toBeGreaterThan(0);
    }
    expect(container.querySelector('[data-app-card="amirnet"] [data-app-category]')?.textContent).toBe('תרגול');
  });

  it('⛔ FAILURE SCENARIO: every app installed ⇒ ⛔ no «התקן» to press at all', () => {
    // ⚠️ Measured, ⛔ not assumed: the catalogue holds 9 apps and `MAX_RING_APPS` is 10, and
    // `parseRing` drops duplicates ⇒ a ring can ⛔ never reach «full» today. The guard that
    // matters is therefore «nothing left to install», and it is drawn as ⛔ no button.
    const onInstall = vi.fn();
    const { container } = render(<AppCentreView ring={DEFAULT_RING} onInstall={onInstall} />);
    expect(container.querySelectorAll('[data-install]')).toHaveLength(0);
    expect(screen.getByText('9 מתוך 10 אפליקציות בטבעת')).toBeTruthy();
  });

  it('⛔ FAILURE SCENARIO: every app removed ⇒ a written empty line, ⛔ not a blank section', () => {
    const { container } = render(<AppCentreView ring={[]} />);
    expect(screen.getByText(EMPTY_RING_HE)).toBeTruthy();
    expect(container.querySelectorAll('[data-install]')).toHaveLength(7);
  });

  it('an installable card installs on tap', () => {
    const onInstall = vi.fn();
    const { container } = render(<AppCentreView ring={SIX} onInstall={onInstall} />);
    const amirnet = container.querySelector('[data-install="amirnet"]') as HTMLElement;
    expect(amirnet.getAttribute('aria-disabled')).toBeNull();
    fireEvent.click(amirnet);
    expect(onInstall).toHaveBeenCalledWith('amirnet');
  });
});

describe('AppCentre — live (T-503ⓒ)', () => {
  it('«הסר» removes and writes, ⛔ without a confirm', async () => {
    writeRing(SIX);
    render(<AppCentre />);
    const btn = await screen.findByRole('button', { name: `${REMOVE_HE} את סיפורים` });
    fireEvent.click(btn);
    expect(readRing()).toEqual(SIX.filter((x) => x !== 'stories'));
    expect(screen.getByText('5 מתוך 10 אפליקציות בטבעת')).toBeTruthy();
  });

  it('«התקן» installs, writes and sends the learner to place it', async () => {
    writeRing(SIX);
    render(<AppCentre />);
    fireEvent.click(await screen.findByRole('button', { name: `${INSTALL_HE} את אמירנט` }));
    expect(readRing()).toEqual([...SIX, 'amirnet']);
    expect(push).toHaveBeenCalledWith('/world?place=amirnet');
  });
});
