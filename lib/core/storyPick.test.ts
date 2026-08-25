import { describe, expect, it } from 'vitest';
import { dayIndexFromIsoDate, orderStories, pickStory, type StoryCandidate } from './storyPick';

const S = (n: number): StoryCandidate => ({
  id: `id-${n}`,
  titleEn: `Story ${n}`,
  bodyEn: `body ${n}`,
  createdAt: `2026-08-${String(10 + n).padStart(2, '0')}T00:00:00Z`,
});
const TWELVE = [S(11), S(1), S(7), S(3), S(9), S(5), S(12), S(2), S(8), S(4), S(10), S(6)];

describe('orderStories — ⛔ deterministic, ⛔ not insertion order', () => {
  it('orders by createdAt then id, and is stable across two calls', () => {
    const a = orderStories(TWELVE).map((s) => s.id);
    const b = orderStories([...TWELVE].reverse()).map((s) => s.id);
    expect(a).toEqual(b);
    expect(a[0]).toBe('id-1');
  });
});

describe('dayIndexFromIsoDate', () => {
  it('advances by exactly one per calendar day', () => {
    expect(dayIndexFromIsoDate('2026-08-26') - dayIndexFromIsoDate('2026-08-25')).toBe(1);
  });
  it('is the same number for the same date, always', () => {
    expect(dayIndexFromIsoDate('2026-08-25')).toBe(dayIndexFromIsoDate('2026-08-25'));
  });
});

describe('pickStory — the failure scenario T-185 closes', () => {
  const day = dayIndexFromIsoDate('2026-08-25');

  it('two loads of the same state return the SAME story', () => {
    const a = pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: new Set() });
    const b = pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: new Set() });
    expect(a?.story.id).toBe(b?.story.id);
  });

  it('tomorrow is a different story', () => {
    const a = pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: new Set() });
    const b = pickStory({ stories: TWELVE, dayIndex: day + 1, readStoryIds: new Set() });
    expect(a?.story.id).not.toBe(b?.story.id);
  });

  it('reports a 1-based position in the ordered list and the real total', () => {
    const picked = pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: new Set() });
    const ordered = orderStories(TWELVE).map((s) => s.id);
    expect(picked?.total).toBe(12);
    expect(picked?.index).toBe(ordered.indexOf(picked!.story.id) + 1);
    expect(picked?.index).toBeGreaterThanOrEqual(1);
  });

  it('skips stories already read this session', () => {
    const first = pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: new Set() })!;
    const second = pickStory({
      stories: TWELVE,
      dayIndex: day,
      readStoryIds: new Set([first.story.id]),
    })!;
    expect(second.story.id).not.toBe(first.story.id);
  });

  it('⛔ never blocks reading: every story read ⇒ still returns one', () => {
    const all = new Set(TWELVE.map((s) => s.id));
    expect(pickStory({ stories: TWELVE, dayIndex: day, readStoryIds: all })).not.toBeNull();
  });

  it('an empty level is null, ⛔ not a throw', () => {
    expect(pickStory({ stories: [], dayIndex: day, readStoryIds: new Set() })).toBeNull();
  });
});
