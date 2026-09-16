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

/**
 * `T-209` ⓑ — `D-121 § ה`: the next story is chosen **to repeat words, ⛔ not to vary**.
 * 🔬 The measurement that justified this and bounded it lives in
 * `scripts/measure-story-repetition.mjs`; `npm run measure:story-repetition` prints it.
 */
describe('pickStory — the SKIP path repeats words (T-209 ⓑ · D-121 § ה)', () => {
  const P = (n: number, body: string): StoryCandidate => ({
    id: `p-${n}`,
    titleEn: `Story ${n}`,
    bodyEn: body,
    createdAt: `2026-08-${String(10 + n).padStart(2, '0')}T00:00:00Z`,
  });
  // Deterministic order is p-1 · p-2 · p-3. `p-3` shares its whole vocabulary with `p-1`;
  // `p-2` shares ⛔ nothing. The old forward scan returns `p-2` — the NEXT INDEX — which
  // is «to vary», the exact thing `D-121 § ה` rules out.
  const POOL = [P(1, 'market river bridge'), P(2, 'office desk lamp'), P(3, 'market river tower')];
  const startsAtOne = 0; // dayIndex 0 ⇒ start = 0 ⇒ p-1

  it('returns the day’s story untouched while it is unread', () => {
    const picked = pickStory({ stories: POOL, dayIndex: startsAtOne, readStoryIds: new Set() })!;
    expect(picked.story.id).toBe('p-1');
    expect(picked.index).toBe(1);
  });

  it('after the day’s story is read, takes the story that REPEATS its words', () => {
    const picked = pickStory({
      stories: POOL,
      dayIndex: startsAtOne,
      readStoryIds: new Set(['p-1']),
    })!;
    expect(picked.story.id).toBe('p-3');
  });

  it('still reports the position in the ordered pool, ⛔ not the order it was chosen in', () => {
    const picked = pickStory({
      stories: POOL,
      dayIndex: startsAtOne,
      readStoryIds: new Set(['p-1']),
    })!;
    expect(picked.index).toBe(3);
    expect(picked.total).toBe(3);
  });

  it('⛔ falls back to the forward scan when ⛔ no unread story shares a word', () => {
    const picked = pickStory({
      stories: POOL,
      dayIndex: startsAtOne,
      readStoryIds: new Set(['p-1', 'p-3']),
    })!;
    expect(picked.story.id).toBe('p-2');
  });

  it('is the same answer on two calls — ⛔ zero Math.random, still (T-185 ⓐ)', () => {
    const a = pickStory({ stories: POOL, dayIndex: startsAtOne, readStoryIds: new Set(['p-1']) })!;
    const b = pickStory({
      stories: [...POOL].reverse(),
      dayIndex: startsAtOne,
      readStoryIds: new Set(['p-1']),
    })!;
    expect(b.story.id).toBe(a.story.id);
  });
});
