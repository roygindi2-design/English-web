import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { END_BLOCK, nextBlocks, type ContinuationIndex, type Node } from './continuations';

// The committed tree itself — a fixture that differs from production is a hole (DEV.md, 23/08).
const index = JSON.parse(readFileSync('data/generated/continuations.json', 'utf8')) as ContinuationIndex;

describe('data/generated/continuations.json — T-460 failure scenarios on the real tree', () => {
  it('the empty prefix at A1 offers more than 100 blocks', () => {
    expect(nextBlocks(index, [], 'A1').count).toBeGreaterThan(100);
  });

  it('«I recommend» at A2 is count 0 and does not throw (recommend is B1 in CEFR-J)', () => {
    expect(nextBlocks(index, ['i', 'recommend'], 'A2')).toEqual({ blocks: [], count: 0 });
  });

  it('property: 1,000 observed paths — every prefix inside the cut continues, and each uncut path can be sent', () => {
    let seed = 460;
    const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
    for (let n = 0; n < 1000; n += 1) {
      const prefix: string[] = [];
      let node: Node | number = index.root;
      for (;;) {
        const r = nextBlocks(index, prefix, 'A2');
        // Past the cut the tree says so (`truncated`) instead of offering a guess.
        if (!r.truncated) expect(r.count, prefix.join(' ')).toBeGreaterThanOrEqual(1);
        if (typeof node === 'number' || node.length === 1) break;
        const pick: number = 1 + 3 * Math.floor(rand() * ((node.length - 1) / 3));
        prefix.push(index.words[node[pick] as number] ?? '');
        node = node[pick + 2] ?? 0;
      }
      const last = nextBlocks(index, prefix, 'A2');
      if (!last.truncated) expect(last.blocks).toContainEqual(END_BLOCK);
    }
  });

  it('T-464: the keyboard opens on what people say — `We` among the first 12 blocks (was 168th)', () => {
    const first = nextBlocks(index, [], 'A1').blocks.map((b) => b.word.toLowerCase());
    expect(first.slice(0, 12)).toContain('we');
    expect(first[0]).toBe('i');
    // ⚠️ Measured C-0796: frequency alone puts `yesterday` 110th (was 270th), ⛔ not inside
    // the row's 30 — recorded as a finding, ⛔ not closed by hand-ranking the tree.
    // This line pins the improvement so a regression to word order shows.
    expect(first.indexOf('yesterday')).toBeLessThan(150);
  });

  it('is cut at the depth the row allows and carries A1–A2 only', () => {
    expect(index.maxDepth).toBe(6);
    expect(index.source).toContain('A1–A2');
  });
});
