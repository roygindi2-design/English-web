import { describe, expect, it } from 'vitest';
import { LAST_NODE_KEY, parseLastNode } from './lastNode';
import { RING_ORDER } from './worldRing';

describe('lastNode — the ring remembers where you were (T-206 · D-119)', () => {
  it('the key is namespaced, so it cannot collide with another app on the origin', () => {
    expect(LAST_NODE_KEY).toBe('kol.world.lastNode');
  });

  /**
   * The value comes out of `localStorage`, which is the ONE store on this screen
   * a hostile page shares an origin with. Anything that is not one of the eight
   * ids is `null` — never a crash, and never passed through.
   */
  it.each([
    ['null', null],
    ['empty string', ''],
    ['whitespace', '   '],
    ['sql-ish', 'arena"); DROP'],
    ['wrong case', 'ARENA'],
    ['a node that does not exist', 'library'],
    ['an old grid id', 'collected'],
    ['a json blob', '{"id":"arena"}'],
    ['prototype pollution', '__proto__'],
    ['constructor', 'constructor'],
    ['toString', 'toString'],
    ['a lone replacement char', '�'],
  ])('%s to null', (_name, raw) => {
    expect(parseLastNode(raw)).toBeNull();
  });

  it('every one of the eight ids round-trips, and only those eight', () => {
    for (const id of RING_ORDER) expect(parseLastNode(id)).toBe(id);
  });

  it('a hostile string never crashes the parse', () => {
    expect(() => parseLastNode(' ￿')).not.toThrow();
    expect(parseLastNode(' ￿')).toBeNull();
  });
});
