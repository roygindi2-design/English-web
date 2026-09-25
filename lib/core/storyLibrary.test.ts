import { describe, expect, it } from 'vitest';
import { STORY_LIBRARY_LEVELS, storyLibrary, storyWordCount, type StoryLibraryStory } from './storyLibrary';

const story = (id: string, level: StoryLibraryStory['level'], createdAt: string, bodyEn = 'One two three.'): StoryLibraryStory => ({
  id,
  level,
  titleEn: `Title ${id}`,
  bodyEn,
  createdAt,
});

const STORIES = [
  story('b', 'A1', '2026-08-21T00:00:02Z'),
  story('a', 'A1', '2026-08-21T00:00:01Z', 'A new student comes to our class today.'),
  story('c', 'A1', '2026-08-21T00:00:03Z'),
  story('d', 'A2', '2026-08-21T00:00:01Z'),
  story('x', 'C1', '2026-08-21T00:00:01Z'),
];

describe('T-510 — storyLibrary', () => {
  it('all four levels, A1→B2, even the empty ones; ⛔ C1 is not listed', () => {
    const out = storyLibrary({ stories: STORIES, readStoryIds: new Set(), todayId: null });
    expect(out.map((l) => l.level)).toEqual(['A1', 'A2', 'B1', 'B2']);
    expect(out.map((l) => l.items.length)).toEqual([3, 1, 0, 0]);
    expect(STORY_LIBRARY_LEVELS).toHaveLength(4);
  });

  it('inside a level the order is `orderStories` (created_at) — the order `pickStory` indexes', () => {
    const out = storyLibrary({ stories: STORIES, readStoryIds: new Set(), todayId: null });
    expect(out[0]!.items.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('⛔ a read story does not disappear — it is `read`', () => {
    const out = storyLibrary({ stories: STORIES, readStoryIds: new Set(['b']), todayId: 'c' });
    expect(out[0]!.items.map((i) => [i.id, i.status])).toEqual([
      ['a', 'new'],
      ['b', 'read'],
      ['c', 'today'],
    ]);
  });

  it('`read` beats `today`', () => {
    const out = storyLibrary({ stories: STORIES, readStoryIds: new Set(['a']), todayId: 'a' });
    expect(out[0]!.items[0]!.status).toBe('read');
  });

  it('carries the title and the word count, ⛔ not the body', () => {
    const out = storyLibrary({ stories: STORIES, readStoryIds: new Set(), todayId: null });
    const first = out[0]!.items[0]!;
    expect(first).toEqual({ id: 'a', titleEn: 'Title a', words: 8, status: 'new' });
    expect(Object.keys(first)).not.toContain('bodyEn');
  });

  it('storyWordCount', () => {
    expect(storyWordCount('')).toBe(0);
    expect(storyWordCount('  one   two\nthree ')).toBe(3);
  });
});
