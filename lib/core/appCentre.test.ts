import { describe, expect, it } from 'vitest';
import { MAX_RING_APPS } from './ringEdit';
import { RING_LABEL_HE, RING_ORDER, type RingNodeId } from './worldRing';
import { APP_CATALOGUE_HE, INSTALL_LOCKED, appCentre } from './appCentre';

/**
 * T-500 — the view model of `docs/design/kol-E-02-centre.png`. The strings and the
 * sets are `render_video_E.py`'s `APPS` · `LOCKED` · `screen_centre`, ⛔ not written here.
 */

const INST: RingNodeId[] = ['arena', 'msgs', 'stories', 'compose', 'sentences', 'vocab'];

describe('appCentre — kol-E-02', () => {
  it('carries the render’s category and description for every ring app', () => {
    for (const id of RING_ORDER) {
      expect(APP_CATALOGUE_HE[id].categoryHe.length).toBeGreaterThan(0);
      expect(APP_CATALOGUE_HE[id].descHe.length).toBeGreaterThan(0);
    }
    expect(APP_CATALOGUE_HE.amirnet).toEqual({ categoryHe: 'תרגול', descHe: 'סימולציות ותרגול לבחינה' });
    expect(APP_CATALOGUE_HE.stories).toEqual({ categoryHe: 'למידה', descHe: 'קריאה עם תרגום בהקשה' });
    expect(APP_CATALOGUE_HE.arena).toEqual({ categoryHe: 'ארקייד', descHe: 'קרב אוצר מילים על זמן' });
  });

  it('install is locked for exactly the two apps that need an account', () => {
    expect([...INSTALL_LOCKED].sort()).toEqual(['friends', 'leaders']);
  });

  it('splits into installed (ring order) and available (36 § 6 order), as in the render', () => {
    const m = appCentre(INST);
    expect(m.installed.map((c) => c.id)).toEqual(INST);
    expect(m.available.map((c) => c.id)).toEqual(['amirnet', 'leaders', 'friends']);
    expect(m.installed.every((c) => c.state === 'installed')).toBe(true);
    expect(m.available.map((c) => c.state)).toEqual(['available', 'locked', 'locked']);
  });

  it('each card carries the ring label as its name — one name per app, not two', () => {
    const m = appCentre(INST);
    for (const c of [...m.installed, ...m.available]) expect(c.nameHe).toBe(RING_LABEL_HE[c.id]);
  });

  it('prints the counter with its digit, and is not full below the cap', () => {
    const m = appCentre(INST);
    expect(m.countHe).toBe('6 מתוך 10 אפליקציות בטבעת');
    expect(m.used).toBe(6);
    expect(m.full).toBe(false);
    expect(m.available.find((c) => c.id === 'amirnet')?.installDisabled).toBe(false);
  });

  it('a full ring disables every install button (render: `disabled=full`)', () => {
    // Nine apps exist and the cap is ten, so today a real ring can never fill — the
    // cap is exercised with ten stand-in ids, which leaves all nine real ones available.
    const ten = Array.from({ length: MAX_RING_APPS }, (_, i) => `x${i}`) as unknown as RingNodeId[];
    const full = appCentre(ten);
    expect(full.full).toBe(true);
    expect(full.available).toHaveLength(RING_ORDER.length);
    expect(full.available.every((c) => c.installDisabled)).toBe(true);
  });

  it('a locked app is never installable, full or not', () => {
    const m = appCentre(INST);
    for (const c of m.available.filter((c) => c.state === 'locked')) expect(c.installDisabled).toBe(true);
  });
});
