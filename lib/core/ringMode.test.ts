import { describe, expect, it } from 'vitest';
import type { RingNodeId } from './worldRing';
import { ringBannerHe, ringLayout, ringStep, startRing, type RingState } from './ringMode';

/**
 * T-501 — the modes of the `kol-E` ring. Every transition and every string below is
 * read from `docs/design/render_video_E.py` (`scene_ring` · `scene_place` ·
 * `scene_after` · `scene_edit` · `draw_ring`), ⛔ not chosen here.
 */

const INST: readonly RingNodeId[] = ['arena', 'msgs', 'stories', 'compose', 'sentences', 'vocab'];
const RING1: readonly RingNodeId[] = ['arena', 'msgs', 'stories', 'amirnet', 'compose', 'sentences', 'vocab'];

const at = (ring: readonly RingNodeId[], mode: RingState['mode'] = { kind: 'browse' }): RingState => ({
  ring,
  mode,
  notice: null,
});

describe('ringStep — browse (scene_ring)', () => {
  it('starts in browse, with no notice', () => {
    expect(startRing(INST)).toEqual({ ring: INST, mode: { kind: 'browse' }, notice: null });
  });

  it('a tap on the hub opens the app centre and changes nothing else', () => {
    const r = ringStep(at(INST), { type: 'hubTap' });
    expect(r.navigate).toBe('centre');
    expect(r.state).toEqual(at(INST));
  });

  it('a long press on an installed app enters edit mode (scene_edit)', () => {
    const r = ringStep(at(RING1), { type: 'longPress', id: 'stories' });
    expect(r.state.mode).toEqual({ kind: 'editing' });
    expect(r.navigate).toBeUndefined();
  });

  it('a long press on an app that is not on the ring is ignored', () => {
    expect(ringStep(at(INST), { type: 'longPress', id: 'amirnet' }).state).toEqual(at(INST));
  });
});

describe('ringStep — placing (scene_centre ⇒ scene_place ⇒ scene_after)', () => {
  it('installing from the centre puts the app under the finger — nothing is inserted yet', () => {
    const r = ringStep(at(INST), { type: 'install', id: 'amirnet' });
    expect(r.state.mode).toEqual({ kind: 'placing', id: 'amirnet' });
    expect(r.state.ring).toEqual(INST);
  });

  it('dropping inserts at the drop slot, returns to browse and says so', () => {
    const placing = ringStep(at(INST), { type: 'install', id: 'amirnet' }).state;
    const r = ringStep(placing, { type: 'drop', id: 'amirnet', slot: 3 });
    expect(r.state.ring).toEqual(RING1);
    expect(r.state.mode).toEqual({ kind: 'browse' });
    expect(r.state.notice).toEqual({ kind: 'added', id: 'amirnet' });
  });

  it('the hub is hidden while placing — a tap on it does nothing', () => {
    const placing = at(INST, { kind: 'placing', id: 'amirnet' });
    expect(ringStep(placing, { type: 'hubTap' })).toEqual({ state: placing });
  });

  it('an app already on the ring, or a full ring, never enters placing', () => {
    expect(ringStep(at(INST), { type: 'install', id: 'arena' }).state).toEqual(at(INST));
    const full: RingNodeId[] = [...RING1, 'leaders', 'friends', 'x0' as unknown as RingNodeId];
    expect(ringStep(at(full), { type: 'install', id: 'amirnet' }).state.mode).toEqual({ kind: 'browse' });
  });

  it('a drop of a different app, or at a slot outside the grown ring, is ignored', () => {
    const placing = at(INST, { kind: 'placing', id: 'amirnet' });
    expect(ringStep(placing, { type: 'drop', id: 'leaders', slot: 1 }).state).toEqual(placing);
    expect(ringStep(placing, { type: 'drop', id: 'amirnet', slot: 7 }).state).toEqual(placing);
  });
});

describe('ringStep — editing (scene_edit)', () => {
  const editing = at(RING1, { kind: 'editing' });

  it('a drag moves the app to the drop slot and stays in edit mode', () => {
    const r = ringStep(editing, { type: 'drop', id: 'stories', slot: 5 });
    expect(r.state.ring).toEqual(['arena', 'msgs', 'amirnet', 'compose', 'sentences', 'stories', 'vocab']);
    expect(r.state.mode).toEqual({ kind: 'editing' });
  });

  it('✕ removes the node, stays in edit mode, and says the progress is kept', () => {
    const r = ringStep(editing, { type: 'remove', id: 'sentences' });
    expect(r.state.ring).not.toContain('sentences');
    expect(r.state.ring).toHaveLength(6);
    expect(r.state.mode).toEqual({ kind: 'editing' });
    expect(r.state.notice).toEqual({ kind: 'removed', id: 'sentences' });
  });

  it('a tap on the hub («סיום») leaves edit mode — it does ⛔ not open the centre', () => {
    const r = ringStep(editing, { type: 'hubTap' });
    expect(r.state.mode).toEqual({ kind: 'browse' });
    expect(r.navigate).toBeUndefined();
  });

  it('✕ outside edit mode is ignored — there is no ✕ to tap', () => {
    expect(ringStep(at(RING1), { type: 'remove', id: 'msgs' }).state).toEqual(at(RING1));
  });

  it('the notice of a previous step is cleared by the next one', () => {
    const removed = ringStep(editing, { type: 'remove', id: 'sentences' }).state;
    expect(ringStep(removed, { type: 'hubTap' }).state.notice).toBeNull();
  });
});

describe('ringLayout — the ring realigns around the finger (draw_ring)', () => {
  it('browse: one slot per node, n = the ring', () => {
    const l = ringLayout(at(INST));
    expect(l.n).toBe(6);
    expect(l.slots).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('placing over slot 3: the others skip it and n counts the floating node', () => {
    const l = ringLayout(at(INST, { kind: 'placing', id: 'amirnet' }), 3);
    expect(l.n).toBe(7);
    expect(l.nodes).toEqual(INST);
    expect(l.slots).toEqual([0, 1, 2, 4, 5, 6]);
  });

  it('editing while dragging `stories`: it leaves its place and the rest close ranks around the gap', () => {
    const l = ringLayout(at(RING1, { kind: 'editing' }), 5, 'stories');
    expect(l.n).toBe(7);
    expect(l.nodes).toEqual(['arena', 'msgs', 'amirnet', 'compose', 'sentences', 'vocab']);
    expect(l.slots).toEqual([0, 1, 2, 3, 4, 6]);
  });
});

describe('ringBannerHe — the line under the ring, word for word from the render', () => {
  it('browse (scene_ring)', () => {
    expect(ringBannerHe(at(['arena', 'msgs', 'stories', 'compose', 'sentences', 'vocab', 'leaders', 'friends']))).toEqual({
      title: '8 מתוך 10 אפליקציות בטבעת',
      sub: 'הקש על קול לניהול · לחיצה ארוכה על אפליקציה לעריכה',
      tone: 'brand',
    });
  });

  it('placing (scene_place) names the app', () => {
    expect(ringBannerHe(at(INST, { kind: 'placing', id: 'amirnet' }))).toEqual({
      title: 'גרור את «אמירנט» למקום בטבעת',
      sub: 'הטבעת מתיישרת מחדש · ✕ מסיר אפליקציה',
      tone: 'brand',
    });
  });

  it('after a drop (scene_after) carries the new count', () => {
    const s: RingState = { ring: RING1, mode: { kind: 'browse' }, notice: { kind: 'added', id: 'amirnet' } };
    expect(ringBannerHe(s)).toEqual({
      title: '«אמירנט» נוספה לטבעת',
      sub: '7 מתוך 10 · הצמתים התיישרו מחדש',
      tone: 'success',
    });
  });

  it('editing (scene_edit)', () => {
    expect(ringBannerHe(at(RING1, { kind: 'editing' }))).toEqual({
      title: 'מצב עריכה · גרירה מחליפה מיקום',
      sub: '✕ מסיר · הקשה במרכז מסיימת',
      tone: 'brand',
    });
  });

  it('after ✕ (scene_edit) — the promise that nothing was deleted', () => {
    const s: RingState = { ring: INST, mode: { kind: 'editing' }, notice: { kind: 'removed', id: 'sentences' } };
    expect(ringBannerHe(s)).toEqual({
      title: 'ההתקדמות נשמרה במלואה',
      sub: 'התקנה מחדש תחזיר הכול · שום נתון לא נמחק',
      tone: 'success',
    });
  });
});
