import { describe, expect, it } from 'vitest';
import { buildStoryChain, myTurn } from './storyChain';

const row = (id: string, author: string, minute: number) => ({
  id, author_id: author, body_en: `line ${id}.`, created_at: `2026-09-24T10:${String(minute).padStart(2, '0')}:00Z`,
});

describe('myTurn — D-290: ⛔ two in a row by one author, and nothing else', () => {
  it('an empty chain is anyone’s', () => {
    expect(myTurn([], 'me')).toBe(true);
  });

  it('the last line mine ⇒ ⛔ my turn; anyone else’s ⇒ my turn', () => {
    expect(myTurn([{ authorId: 'a' }, { authorId: 'me' }], 'me')).toBe(false);
    expect(myTurn([{ authorId: 'me' }, { authorId: 'a' }], 'me')).toBe(true);
  });
});

describe('buildStoryChain (T-478)', () => {
  it('oldest first, whatever order the rows arrive in', () => {
    const { lines } = buildStoryChain([row('c', 'b', 3), row('a', 'op', 1), row('b', 'me', 2)], 'me', 'op');
    expect(lines.map((l) => l.id)).toEqual(['a', 'b', 'c']);
  });

  it('seats by first appearance, stable per author; mine and byOpener set', () => {
    const { lines } = buildStoryChain([row('a', 'op', 1), row('b', 'me', 2), row('c', 'op', 3), row('d', 'x', 4)], 'me', 'op');
    expect(lines.map((l) => l.seat)).toEqual([1, 2, 1, 3]);
    expect(lines.map((l) => l.mine)).toEqual([false, true, false, false]);
    expect(lines.map((l) => l.byOpener)).toEqual([true, false, true, false]);
  });

  it('⛔ no author id leaves', () => {
    const out = buildStoryChain([row('a', 'secret-author', 1)], 'me', 'op');
    expect(JSON.stringify(out)).not.toContain('secret-author');
  });

  it('myTurn is computed on the SORTED chain — the latest line decides', () => {
    expect(buildStoryChain([row('b', 'me', 2), row('a', 'x', 1)], 'me', 'op').myTurn).toBe(false);
    expect(buildStoryChain([row('b', 'x', 2), row('a', 'me', 1)], 'me', 'op').myTurn).toBe(true);
  });
});
