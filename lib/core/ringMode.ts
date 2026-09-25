/**
 * T-501 — the modes of the World ring in the `kol-E` series (goal ① of `nav`,
 * `plan/05-departments.md`), on top of `ringEdit.ts`'s list edits: what a tap, a long
 * press, a drop and a ✕ do in each mode, which slots the nodes take while a node is
 * under the finger, and the banner line under the ring.
 *
 * 🎯 **Every transition and every string is read from `docs/design/render_video_E.py`,
 * ⛔ not chosen:** `scene_ring` (hub tap ⇒ the centre) · `scene_centre`/`scene_place`
 * (install ⇒ the node floats, the hub is hidden, drop ⇒ insert) · `scene_after` (the
 * success banner with the new count) · `scene_edit` (long press ⇒ edit · drag moves ·
 * ✕ removes · the hub reads «סיום» and ends the edit) · `draw_ring` (the floating
 * node's slot is skipped, and `n` counts it).
 *
 * ⛔ Pure: no React, no timers, no storage. How long a press must be held, and where
 * the ring is kept, belong to the screen's row — ⛔ not to this file.
 */
import { MAX_RING_APPS, installApp, moveApp, removeApp, ringCountHe } from './ringEdit';
import { RING_LABEL_HE, type RingNodeId } from './worldRing';

export type RingMode =
  | { readonly kind: 'browse' }
  | { readonly kind: 'placing'; readonly id: RingNodeId }
  | { readonly kind: 'editing' };

export type RingNotice =
  | { readonly kind: 'added'; readonly id: RingNodeId }
  | { readonly kind: 'removed'; readonly id: RingNodeId };

export interface RingState {
  readonly ring: readonly RingNodeId[];
  readonly mode: RingMode;
  /** What the last step did, for the banner — cleared by the next step. */
  readonly notice: RingNotice | null;
}

export type RingEvent =
  | { readonly type: 'hubTap' }
  | { readonly type: 'longPress'; readonly id: RingNodeId }
  | { readonly type: 'install'; readonly id: RingNodeId }
  | { readonly type: 'drop'; readonly id: RingNodeId; readonly slot: number }
  | { readonly type: 'remove'; readonly id: RingNodeId };

export interface RingStepResult {
  readonly state: RingState;
  /** Set only when the step leaves the ring — today, only for the app centre. */
  readonly navigate?: 'centre';
}

export function startRing(ring: readonly RingNodeId[]): RingState {
  return { ring, mode: { kind: 'browse' }, notice: null };
}

const BROWSE: RingMode = { kind: 'browse' };
const EDITING: RingMode = { kind: 'editing' };

/** One event, one next state. An event the mode has no affordance for is ignored. */
export function ringStep(state: RingState, event: RingEvent): RingStepResult {
  const ignore: RingStepResult = { state };
  const next = (ring: readonly RingNodeId[], mode: RingMode, notice: RingNotice | null = null) => ({
    state: { ring, mode, notice },
  });
  const { ring, mode } = state;

  switch (mode.kind) {
    case 'browse':
      switch (event.type) {
        case 'hubTap':
          return { state: { ...state, notice: null }, navigate: 'centre' };
        case 'longPress':
          return ring.includes(event.id) ? next(ring, EDITING) : ignore;
        case 'install':
          return ring.length < MAX_RING_APPS && !ring.includes(event.id)
            ? next(ring, { kind: 'placing', id: event.id })
            : ignore;
        default:
          return ignore;
      }

    case 'placing': {
      if (event.type !== 'drop' || event.id !== mode.id) return ignore;
      const r = installApp(ring, event.id, event.slot);
      return r.ok ? next(r.ring, BROWSE, { kind: 'added', id: event.id }) : ignore;
    }

    case 'editing':
      switch (event.type) {
        case 'hubTap':
          return next(ring, BROWSE);
        case 'drop': {
          const r = moveApp(ring, event.id, event.slot);
          return r.ok ? next(r.ring, EDITING) : ignore;
        }
        case 'remove': {
          const r = removeApp(ring, event.id);
          return r.ok ? next(r.ring, EDITING, { kind: 'removed', id: event.id }) : ignore;
        }
        default:
          return ignore;
      }
  }
}

export interface RingLayout {
  /** The nodes drawn in place, in ring order — the one under the finger is ⛔ not among them. */
  readonly nodes: readonly RingNodeId[];
  /** `slots[i]` is the slot of `nodes[i]` on a ring of `n`. */
  readonly slots: readonly number[];
  readonly n: number;
}

/**
 * Where each resting node sits (`draw_ring`). With a node under the finger over
 * `hoverSlot`, `n` counts that node too and the resting nodes skip its slot — which is
 * what makes the ring «realign» as the finger moves. `dragging` is the installed node
 * being moved in edit mode; while placing, the floating node is ⛔ not on the ring yet.
 */
export function ringLayout(state: RingState, hoverSlot?: number, dragging?: RingNodeId): RingLayout {
  const floating = state.mode.kind === 'placing' || (dragging !== undefined && state.ring.includes(dragging));
  const nodes = dragging === undefined ? state.ring : state.ring.filter((x) => x !== dragging);
  if (!floating || hoverSlot === undefined) {
    return { nodes: state.ring, slots: state.ring.map((_, i) => i), n: state.ring.length };
  }
  const n = nodes.length + 1;
  const slots = nodes.map((_, i) => (i < hoverSlot ? i : i + 1));
  return { nodes, slots, n };
}

export interface RingBanner {
  readonly title: string;
  readonly sub: string;
  /** `brand` = an instruction · `success` = something just happened and it is safe. */
  readonly tone: 'brand' | 'success';
}

/** The banner under the ring, word for word from the render's scenes. */
export function ringBannerHe(state: RingState): RingBanner {
  const { ring, mode, notice } = state;
  if (notice?.kind === 'removed') {
    return { title: 'ההתקדמות נשמרה במלואה', sub: 'התקנה מחדש תחזיר הכול · שום נתון לא נמחק', tone: 'success' };
  }
  if (notice?.kind === 'added') {
    return {
      title: `«${RING_LABEL_HE[notice.id]}» נוספה לטבעת`,
      sub: `${ring.length} מתוך ${MAX_RING_APPS} · הצמתים התיישרו מחדש`,
      tone: 'success',
    };
  }
  switch (mode.kind) {
    case 'placing':
      return {
        title: `גרור את «${RING_LABEL_HE[mode.id]}» למקום בטבעת`,
        sub: 'הטבעת מתיישרת מחדש · ✕ מסיר אפליקציה',
        tone: 'brand',
      };
    case 'editing':
      return { title: 'מצב עריכה · גרירה מחליפה מיקום', sub: '✕ מסיר · הקשה במרכז מסיימת', tone: 'brand' };
    case 'browse':
      return {
        title: ringCountHe(ring.length),
        sub: 'הקש על קול לניהול · לחיצה ארוכה על אפליקציה לעריכה',
        tone: 'brand',
      };
  }
}
