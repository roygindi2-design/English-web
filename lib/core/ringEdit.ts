/**
 * T-499 — the model under the `kol-E` series (`נוחות` goal ① of `nav`,
 * `plan/05-departments.md`): which apps sit on the World ring, in which order,
 * and where a node lands when the learner drops it.
 *
 * 🎯 **Every number here is read from `docs/design/render_video_E.py`, ⛔ not chosen:**
 * `MAX_APPS = 10` · `pos_of` (slot 0 on top, clockwise, even spacing) ·
 * `slot_from_angle` (nearest slot, wrapping) · `node_r` (33/31/28) · and the list
 * edits of `scene_place` (insert at the drop slot) and `scene_edit` (move · ✕ remove).
 *
 * ⛔ Pure: no React, no storage, no fetch. Where the ring is kept (a device, a row)
 * is a decision for the screen's row, ⛔ not for this file — `parseRing` only makes
 * whatever comes back from that store safe to draw.
 * ⛔ Removing an app removes a node, ⛔ never data (`scene_edit`: «שום נתון לא נמחק»).
 */
import { RING_LABEL_HE, RING_ORDER, RING_RADIUS, type RingNodeId, type RingPoint } from './worldRing';

export const MAX_RING_APPS = 10;

/** Today's ring — the nine nodes of `36 § 6`, in order. Nothing installed yet means this. */
export const DEFAULT_RING: readonly RingNodeId[] = RING_ORDER;

/**
 * Angle of `slot` on a ring of `n`, in degrees, with `worldRing.ts`'s convention
 * (0° = right, counter-clockwise positive). Slot 0 is on top and the slots advance
 * clockwise — for n = 9 this is `RING_ANGLE_DEG` exactly.
 */
export function slotAngleDeg(slot: number, n: number): number {
  return 90 - (slot * 360) / n;
}

/** Screen-space point (y grows downward), relative to the ring's centre. */
export function slotPoint(slot: number, n: number, radius: number = RING_RADIUS): RingPoint {
  const rad = (slotAngleDeg(slot, n) * Math.PI) / 180;
  return { x: radius * Math.cos(rad), y: -radius * Math.sin(rad) };
}

/** The slot nearest to a point under the finger (screen space, relative to centre). */
export function slotFromPoint(p: RingPoint, n: number): number {
  const deg = (Math.atan2(-p.y, p.x) * 180) / Math.PI;
  const fromTop = (((90 - deg) % 360) + 360) % 360;
  return Math.round(fromTop / (360 / n)) % n;
}

/** Node radius in render pixels — the nodes shrink as the ring fills. */
export function nodeRadius(n: number): 33 | 31 | 28 {
  return n <= 6 ? 33 : n <= 8 ? 31 : 28;
}

export type RingEditResult =
  | { readonly ok: true; readonly ring: readonly RingNodeId[] }
  | { readonly ok: false; readonly reason: 'full' | 'installed' | 'not_installed' | 'bad_slot' };

const validSlot = (slot: number, size: number) => Number.isInteger(slot) && slot >= 0 && slot < size;

/** Install `id` at `slot` of the grown ring (default: the end). */
export function installApp(
  ring: readonly RingNodeId[],
  id: RingNodeId,
  slot: number = ring.length,
): RingEditResult {
  if (ring.length >= MAX_RING_APPS) return { ok: false, reason: 'full' };
  if (ring.includes(id)) return { ok: false, reason: 'installed' };
  if (!validSlot(slot, ring.length + 1)) return { ok: false, reason: 'bad_slot' };
  return { ok: true, ring: [...ring.slice(0, slot), id, ...ring.slice(slot)] };
}

/** Take `id` out and put it at `slot` of the same-sized ring. */
export function moveApp(ring: readonly RingNodeId[], id: RingNodeId, slot: number): RingEditResult {
  if (!ring.includes(id)) return { ok: false, reason: 'not_installed' };
  if (!validSlot(slot, ring.length)) return { ok: false, reason: 'bad_slot' };
  const rest = ring.filter((x) => x !== id);
  return { ok: true, ring: [...rest.slice(0, slot), id, ...rest.slice(slot)] };
}

/** Drop `id` from the ring; the others keep their order. */
export function removeApp(ring: readonly RingNodeId[], id: RingNodeId): RingEditResult {
  if (!ring.includes(id)) return { ok: false, reason: 'not_installed' };
  return { ok: true, ring: ring.filter((x) => x !== id) };
}

/** The counter line of `kol-E-02` / the ring banner — the digit is the point (D-046). */
export function ringCountHe(used: number): string {
  return `${used} מתוך ${MAX_RING_APPS} אפליקציות בטבעת`;
}

const isRingNodeId = (x: unknown): x is RingNodeId =>
  typeof x === 'string' && Object.prototype.hasOwnProperty.call(RING_LABEL_HE, x);

/**
 * Make a stored ring safe to draw: known ids only, first occurrence wins, at most
 * `MAX_RING_APPS`. ⛔ Not a list ⇒ `null`, and the caller falls back to `DEFAULT_RING`.
 */
export function parseRing(raw: unknown): RingNodeId[] | null {
  if (!Array.isArray(raw)) return null;
  const out: RingNodeId[] = [];
  for (const x of raw) {
    if (isRingNodeId(x) && !out.includes(x)) out.push(x);
    if (out.length === MAX_RING_APPS) break;
  }
  return out;
}
