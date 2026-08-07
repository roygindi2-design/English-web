import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * F-025 — protocol hygiene on the task register.
 *
 * `plan/50-tasks.md` is the only place a task ID is minted, and three agents
 * address each other by that ID alone ("continued in T-034"). A duplicate ID is
 * not a typo: it silently reroutes an agent to a different task than the one the
 * finding meant, and F-025 shows it survived 33 cycles unnoticed because nothing
 * ever looked. A human reading a 44-row table will not catch the 45th collision
 * either — so the register is checked by a machine.
 */
const TASKS = readFileSync('plan/50-tasks.md', 'utf8');

/** Only the ID cell of a real table row — `| T-034 | M2 | …`. */
const ROW_ID = /^\|\s*(T-\d{3})\s*\|/gm;

function taskIds(): string[] {
  // `m[1]` is `string | undefined` under noUncheckedIndexedAccess even though the
  // group is not optional — filtered, not asserted, so an unmatched shape becomes
  // a missing row (which the length guard below catches) and never `undefined`.
  return [...TASKS.matchAll(ROW_ID)].map((m) => m[1]).filter((id): id is string => id !== undefined);
}

describe('plan/50-tasks.md — the task register', () => {
  it('has rows at all (guards the regex, not just the file)', () => {
    // Without this, a change to the table format turns every assertion below
    // into a vacuous pass over an empty list.
    expect(taskIds().length).toBeGreaterThan(20);
  });

  it('mints every task ID exactly once', () => {
    const ids = taskIds();
    const seen = new Map<string, number>();
    for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1);
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`);
    expect(duplicates, 'two tasks under one ID reroute agents to the wrong row').toEqual([]);
  });

  it('leaves no gap in the ID sequence — a gap means an ID was lost, not freed', () => {
    // A retired task keeps its row and its ID; IDs are never recycled, because a
    // finding written two months ago still points at the old one.
    const numbers = taskIds()
      .map((id) => Number(id.slice(2)))
      .sort((a, b) => a - b);
    const expected = Array.from({ length: numbers.length }, (_, i) => i + 1);
    expect(numbers).toEqual(expected);
  });
});
