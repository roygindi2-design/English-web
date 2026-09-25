/**
 * 🔠 T-509 · `D-297`ⓑ — the learner's reading size for a story, kept on this device
 * under `kol.story.textSize.v1`.
 *
 * ⛔ **Not `lib/core`** — it touches `window` (`check:core`). Same shape as
 * `lib/ringStore.ts` (`D-296`): both calls are wrapped in `try/catch`, and every failure
 * lands on the default ⇒ a browser that blocks storage reads at `md`, ⛔ never a broken
 * screen. ⛔ A display preference, ⛔ not learning progress — nothing here touches
 * `word_progress`.
 */

export type StoryTextSize = 'sm' | 'md' | 'lg';

export const STORY_TEXT_SIZES: readonly StoryTextSize[] = ['sm', 'md', 'lg'];

export const DEFAULT_STORY_TEXT_SIZE: StoryTextSize = 'md';

export const STORY_TEXT_SIZE_KEY = 'kol.story.textSize.v1';

export function parseTextSize(raw: unknown): StoryTextSize | null {
  return STORY_TEXT_SIZES.find((s) => s === raw) ?? null;
}

export function readTextSize(): StoryTextSize {
  try {
    return parseTextSize(window.localStorage.getItem(STORY_TEXT_SIZE_KEY)) ?? DEFAULT_STORY_TEXT_SIZE;
  } catch {
    return DEFAULT_STORY_TEXT_SIZE;
  }
}

/** `false` = the write did not land (storage blocked or full). ⛔ Never throws. */
export function writeTextSize(size: StoryTextSize): boolean {
  try {
    window.localStorage.setItem(STORY_TEXT_SIZE_KEY, size);
    return true;
  } catch {
    return false;
  }
}
