/**
 * 🎚️ `T-515` · `D-300` — how many words one «סינון מילים» round serves, kept on this
 * device under `kol.cards.levelRound`.
 *
 * ⛔ **Not `lib/core`** — it touches `window` (`check:core`). Same shape as
 * `lib/storyTextSize.ts`: both calls are wrapped in `try/catch`, and every failure — a
 * blocked read, a value that is not one of the three — lands on 20, the server's own
 * `DEFAULT_QUEUE_LIMIT`. ⛔ A pacing preference, ⛔ not learning progress: nothing here
 * touches `word_progress`, and every size stays at or under `MAX_QUEUE_LIMIT`.
 */
import { DEFAULT_QUEUE_LIMIT, MAX_QUEUE_LIMIT } from '@/lib/core/deck';

export const LEVEL_ROUND_SIZES = [DEFAULT_QUEUE_LIMIT, 35, MAX_QUEUE_LIMIT] as const;

export type LevelRoundSize = (typeof LEVEL_ROUND_SIZES)[number];

export const LEVEL_ROUND_KEY = 'kol.cards.levelRound';

export function parseLevelRound(raw: unknown): LevelRoundSize {
  return LEVEL_ROUND_SIZES.find((size) => String(size) === raw) ?? DEFAULT_QUEUE_LIMIT;
}

export function readLevelRound(): LevelRoundSize {
  try {
    return parseLevelRound(window.localStorage.getItem(LEVEL_ROUND_KEY));
  } catch {
    return DEFAULT_QUEUE_LIMIT;
  }
}

/** `false` = the write did not land (storage blocked or full). ⛔ Never throws. */
export function writeLevelRound(size: LevelRoundSize): boolean {
  try {
    window.localStorage.setItem(LEVEL_ROUND_KEY, String(size));
    return true;
  } catch {
    return false;
  }
}
