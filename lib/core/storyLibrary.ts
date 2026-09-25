/**
 * 📚 **T-510 · `D-297`ⓒ — the story library: every story the learner can open, by level,
 * with «read / today / new».**
 *
 * Pure: the route hands in the rows it read (`stories` + the learner's `story_reads`) and
 * the id `pickStory` chose for today; this decides order and status and ⛔ nothing else.
 *
 * ⛔ **The order inside a level is `orderStories` — the SAME order `pickStory` indexes** —
 * so «סיפור 3 מתוך 12» on the reading screen and the third card in the list are the same
 * story. ⛔ **A read story ⛔ does ⛔ not disappear**: it stays in its place with `read`, and
 * `read` beats `today` (the day's story, once read, is a read story).
 */
import type { CefrBand } from './cefrLevels';
import { storyParagraphs } from './storyParagraphs';
import { orderStories, type StoryCandidate } from './storyPick';
import { buildStorySegments } from './storyTapTargets';

/** The four levels the story bank is written for (`0018_stories.sql`), in order. */
export const STORY_LIBRARY_LEVELS: readonly CefrBand[] = ['A1', 'A2', 'B1', 'B2'];

export type StoryLibraryStatus = 'read' | 'today' | 'new';

export interface StoryLibraryStory extends StoryCandidate {
  readonly level: CefrBand;
}

export interface StoryLibraryItem {
  readonly id: string;
  readonly titleEn: string;
  readonly words: number;
  /** How many paragraphs the reading screen will draw (`T-508`) — «3 פסקאות» on the card. */
  readonly paragraphs: number;
  readonly status: StoryLibraryStatus;
}

export interface StoryLibraryLevel {
  readonly level: CefrBand;
  readonly items: readonly StoryLibraryItem[];
}

export interface StoryLibraryInput {
  readonly stories: readonly StoryLibraryStory[];
  readonly readStoryIds: ReadonlySet<string>;
  /** The story `GET /api/world/story` would open today, or `null`. */
  readonly todayId: string | null;
}

/** Whitespace-separated words — the count the card prints as «N מילים». */
export function storyWordCount(bodyEn: string): number {
  const trimmed = bodyEn.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
}

const NO_GLOSSES = new Map();
const NO_KNOWN = new Set<string>();

/** The paragraph count the reading screen draws, from the SAME split it uses. */
export function storyParagraphCount(bodyEn: string): number {
  return storyParagraphs(buildStorySegments(bodyEn, NO_GLOSSES, NO_KNOWN)).length;
}

/**
 * Every level of `STORY_LIBRARY_LEVELS` is present, in order, even when it has ⛔ no
 * stories — «אין עדיין סיפורים ברמה הזו» is a state the screen draws, ⛔ not a missing
 * chip. A story whose level is outside the four is ⛔ not listed.
 */
export function storyLibrary({
  stories,
  readStoryIds,
  todayId,
}: StoryLibraryInput): readonly StoryLibraryLevel[] {
  return STORY_LIBRARY_LEVELS.map((level) => ({
    level,
    items: orderStories(stories.filter((s) => s.level === level)).map((s) => ({
      id: s.id,
      titleEn: s.titleEn,
      words: storyWordCount(s.bodyEn),
      paragraphs: storyParagraphCount(s.bodyEn),
      status: readStoryIds.has(s.id) ? 'read' : s.id === todayId ? 'today' : 'new',
    })),
  }));
}
