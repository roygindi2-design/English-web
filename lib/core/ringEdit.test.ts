import { describe, expect, it } from 'vitest';
import { RING_ORDER, RING_RADIUS, ringPoint, type RingNodeId } from './worldRing';
import {
  DEFAULT_RING,
  MAX_RING_APPS,
  installApp,
  moveApp,
  nodeRadius,
  parseRing,
  removeApp,
  ringCountHe,
  slotAngleDeg,
  slotFromPoint,
  slotPoint,
} from './ringEdit';

/**
 * T-499 — every number below is read from `docs/design/render_video_E.py`
 * (`MAX_APPS`, `pos_of`, `slot_from_angle`, `node_r`, the scenes' list edits),
 * ⛔ not chosen here.
 */

const RING1: readonly RingNodeId[] = [
  'arena',
  'msgs',
  'stories',
  'amirnet',
  'compose',
  'sentences',
  'vocab',
];

describe('ringEdit — geometry (render_video_E.py pos_of · slot_from_angle · node_r)', () => {
  it('the cap is ten apps (MAX_APPS)', () => {
    expect(MAX_RING_APPS).toBe(10);
  });

  it('slot 0 sits on top and the slots advance clockwise, evenly', () => {
    expect(slotAngleDeg(0, 7)).toBe(90);
    expect(slotAngleDeg(1, 4)).toBe(0); // right
    expect(slotAngleDeg(2, 4)).toBe(-90); // bottom
    expect(slotAngleDeg(3, 4)).toBe(-180); // left
  });

  it('with the nine default nodes it reproduces RING_ANGLE_DEG exactly — one geometry, not two', () => {
    RING_ORDER.forEach((id, i) => {
      const a = slotPoint(i, RING_ORDER.length);
      const b = ringPoint(id);
      expect(a.x).toBeCloseTo(b.x, 9);
      expect(a.y).toBeCloseTo(b.y, 9);
    });
  });

  it('slotPoint defaults to RING_RADIUS and uses screen coordinates (y grows downward)', () => {
    const top = slotPoint(0, 5);
    expect(top.x).toBeCloseTo(0, 9);
    expect(top.y).toBeCloseTo(-RING_RADIUS, 9);
    expect(slotPoint(0, 5, 50).y).toBeCloseTo(-50, 9);
  });

  it('slotFromPoint inverts slotPoint for every slot, for every ring size up to the cap', () => {
    for (let n = 1; n <= MAX_RING_APPS; n++) {
      for (let s = 0; s < n; s++) {
        expect(slotFromPoint(slotPoint(s, n), n)).toBe(s);
      }
    }
  });

  it('slotFromPoint snaps to the nearest slot, wrapping past the top', () => {
    // 4 slots: top · right · bottom · left. Just left of top ⇒ still slot 0, not 3.
    expect(slotFromPoint({ x: -5, y: -100 }, 4)).toBe(0);
    expect(slotFromPoint({ x: 100, y: -20 }, 4)).toBe(1);
    expect(slotFromPoint({ x: -100, y: 10 }, 4)).toBe(3);
  });

  it('node radius steps down as the ring fills: 33 ≤6 · 31 ≤8 · 28 above', () => {
    expect(nodeRadius(1)).toBe(33);
    expect(nodeRadius(6)).toBe(33);
    expect(nodeRadius(7)).toBe(31);
    expect(nodeRadius(8)).toBe(31);
    expect(nodeRadius(9)).toBe(28);
    expect(nodeRadius(10)).toBe(28);
  });
});

describe('ringEdit — list edits (scene_place · scene_edit)', () => {
  it('the default ring is today’s ring: the nine nodes of 36 § 6, in order', () => {
    expect(DEFAULT_RING).toEqual(RING_ORDER);
  });

  it('install places the new app at the slot the learner dropped it on (scene_place, INSERT_AT=3)', () => {
    const inst: RingNodeId[] = ['arena', 'msgs', 'stories', 'compose', 'sentences', 'vocab'];
    const r = installApp(inst, 'amirnet', 3);
    expect(r).toEqual({ ok: true, ring: RING1 });
    expect(inst).toHaveLength(6); // ⛔ never mutates its input
  });

  it('install with no slot appends', () => {
    expect(installApp(['arena'], 'msgs')).toEqual({ ok: true, ring: ['arena', 'msgs'] });
  });

  it('install refuses a duplicate and an out-of-range slot', () => {
    expect(installApp(['arena'], 'arena')).toEqual({ ok: false, reason: 'installed' });
    expect(installApp(['arena'], 'msgs', 2)).toEqual({ ok: false, reason: 'bad_slot' });
    expect(installApp(['arena'], 'msgs', -1)).toEqual({ ok: false, reason: 'bad_slot' });
  });

  it('install refuses when the ring already holds MAX_RING_APPS', () => {
    // The cap is a count, not an id set: parseRing never lets a ring exceed it, so
    // the check is exercised on a ten-long list directly.
    const ten = ['arena', 'msgs', 'amirnet', 'stories', 'compose', 'sentences', 'vocab', 'leaders', 'friends', 'x'] as unknown as RingNodeId[];
    expect(installApp(ten, 'y' as unknown as RingNodeId)).toEqual({ ok: false, reason: 'full' });
  });

  it('move takes the app out and puts it at its new slot (scene_edit: סיפורים ⇒ slot 5)', () => {
    const r = moveApp(RING1, 'stories', 5);
    expect(r).toEqual({
      ok: true,
      ring: ['arena', 'msgs', 'amirnet', 'compose', 'sentences', 'stories', 'vocab'],
    });
  });

  it('move to its own slot is a no-op, and a missing app or a bad slot is refused', () => {
    expect(moveApp(RING1, 'arena', 0)).toEqual({ ok: true, ring: RING1 });
    expect(moveApp(RING1, 'leaders', 0)).toEqual({ ok: false, reason: 'not_installed' });
    expect(moveApp(RING1, 'arena', 7)).toEqual({ ok: false, reason: 'bad_slot' });
  });

  it('remove drops only that app and keeps the order of the rest (scene_edit: ✕ on משפטים)', () => {
    expect(removeApp(RING1, 'sentences')).toEqual({
      ok: true,
      ring: ['arena', 'msgs', 'stories', 'amirnet', 'compose', 'vocab'],
    });
    expect(removeApp(RING1, 'friends')).toEqual({ ok: false, reason: 'not_installed' });
  });
});

describe('ringEdit — the counter string and the stored value', () => {
  it('prints the render’s counter, digits and all', () => {
    expect(ringCountHe(6)).toBe('6 מתוך 10 אפליקציות בטבעת');
    expect(ringCountHe(8)).toBe('8 מתוך 10 אפליקציות בטבעת');
  });

  it('parseRing keeps known ids in order, drops unknowns and repeats, and caps the length', () => {
    expect(parseRing(['msgs', 'arena', 'nope', 'msgs', 7])).toEqual(['msgs', 'arena']);
    expect(parseRing([])).toEqual([]);
  });

  it('parseRing answers null for anything that is not a list — the caller falls back to DEFAULT_RING', () => {
    expect(parseRing(null)).toBeNull();
    expect(parseRing('arena')).toBeNull();
    expect(parseRing({ 0: 'arena' })).toBeNull();
  });
});
