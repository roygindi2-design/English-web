/**
 * T-503ⓑ · D-296 — where the learner's World ring is kept: this device, under
 * `kol.ring.v1`.
 *
 * ⛔ **Not `lib/core`** — it touches `window` (`check:core`). The decision of what a
 * stored value MEANS lives in `lib/core/ringEdit.ts` (`parseRing`); this file only
 * moves bytes in and out, and every failure lands on `DEFAULT_RING`.
 * ⚠️ Both calls are wrapped in `try/catch`, exactly like `LAST_NODE_KEY` (T-206ⓔ): a
 * browser that blocks storage gets today's ring, ⛔ never a broken screen.
 * ⛔ The ring is a display preference, ⛔ not learning progress — nothing here touches
 * `word_progress` (D-296ⓐ). If the ring ever has to follow the learner between devices,
 * this is the one file that changes.
 */
import { DEFAULT_RING, parseRing } from '@/lib/core/ringEdit';
import type { RingNodeId } from '@/lib/core/worldRing';

export const RING_KEY = 'kol.ring.v1';

export function readRing(): readonly RingNodeId[] {
  try {
    const raw = window.localStorage.getItem(RING_KEY);
    if (raw === null) return DEFAULT_RING;
    return parseRing(JSON.parse(raw)) ?? DEFAULT_RING;
  } catch {
    return DEFAULT_RING;
  }
}

/** `false` = the write did not land (storage blocked or full). ⛔ Never throws. */
export function writeRing(ring: readonly RingNodeId[]): boolean {
  try {
    window.localStorage.setItem(RING_KEY, JSON.stringify(ring));
    return true;
  } catch {
    return false;
  }
}
