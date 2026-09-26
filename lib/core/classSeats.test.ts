import { describe, expect, it } from 'vitest';
import { classSeats, seatReader } from './classSeats';
import { buildStoryChain } from './storyChain';
import { buildWallFeed } from './wallFeed';

const at = (minute: number) => `2026-09-24T10:${String(minute).padStart(2, '0')}:00Z`;

describe('classSeats (T-520 · D-303)', () => {
  it('first appearance across the whole history, whatever order the rows arrive in', () => {
    const seats = classSeats([
      { author_id: 'noa', created_at: at(9) },
      { author_id: 'op', created_at: at(1) },
      { author_id: 'maya', created_at: at(4) },
      { author_id: 'op', created_at: at(12) },
    ]);
    expect([...seats]).toEqual([['op', 1], ['maya', 2], ['noa', 3]]);
  });

  it('a tie in time is broken by the author id, ⛔ not by arrival order', () => {
    const a = classSeats([{ author_id: 'b', created_at: at(1) }, { author_id: 'a', created_at: at(1) }]);
    const b = classSeats([{ author_id: 'a', created_at: at(1) }, { author_id: 'b', created_at: at(1) }]);
    expect([...a]).toEqual([...b]);
  });

  it('an author missing from the map gets the next free seat, and keeps it', () => {
    const seat = seatReader(classSeats([{ author_id: 'op', created_at: at(1) }]));
    expect(seat('op')).toBe(1);
    expect(seat('late')).toBe(2);
    expect(seat('late')).toBe(2);
    expect(seat('later')).toBe(3);
  });
});

describe('one seat in both tabs (T-520 — the failure scenario of the row)', () => {
  const OP = 'op';
  const MAYA = 'maya';
  const post = { id: 'p1', author_id: OP, body_en: 'How was your weekend?', created_at: at(0) };
  const mayaReply = { id: 'r1', post_id: 'p1', author_id: MAYA, body_en: 'I went to the beach.', created_at: at(2) };
  const story = [
    { id: 's1', author_id: 'dan', body_en: 'One morning a cat woke up.', created_at: at(5) },
    { id: 's2', author_id: MAYA, body_en: 'It was very hungry.', created_at: at(6) },
  ];
  const seats = classSeats([post, mayaReply, ...story]);

  it('the same author ⇒ the same seat on the wall and in the story', () => {
    const [wallPost] = buildWallFeed([post], [mayaReply], [], 'me', OP, seats);
    const { lines } = buildStoryChain(story, 'me', OP, seats);
    expect(wallPost?.top[0]?.seat).toBe(2);
    expect(lines.find((l) => l.id === 's2')?.seat).toBe(2);
  });

  it('an author who appeared FIRST on the wall is `1` in the story too', () => {
    const { lines } = buildStoryChain([{ id: 's9', author_id: OP, body_en: 'The end.', created_at: at(30) }], 'me', OP, seats);
    expect(lines[0]?.seat).toBe(1);
  });

  it('a line that left the story window does ⛔ not move a seat', () => {
    const windowed = story.slice(1);
    const { lines } = buildStoryChain(windowed, 'me', OP, seats);
    expect(lines[0]?.seat).toBe(2);
  });
});
