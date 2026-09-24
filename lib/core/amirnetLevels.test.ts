import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MAX_LEVEL, highestUnlocked, type AmirnetSimulationRun } from './amirnetLevels';
import { withoutComments } from '@/lib/testSource';

const CODE = withoutComments(readFileSync('lib/core/amirnetLevels.ts', 'utf8'));

describe('amirnetLevels — T-309ⓑ, the unlock derived from the learner’s own completions', () => {
  it('a learner who finished level 3 keeps level 4 open after a reload — ⛔ and level 1 is always open', () => {
    expect(highestUnlocked([])).toBe(1);
    expect(highestUnlocked([{ level: 3, completedAtMs: 1 }])).toBe(4);
    expect(highestUnlocked([{ level: 1, completedAtMs: 1 }, { level: 3, completedAtMs: 2 }])).toBe(4);
  });

  it('⛔ the order the rows arrive in ⛔ does not change the answer — it is a MAX, ⛔ not a cursor', () => {
    const runs: readonly AmirnetSimulationRun[] = [
      { level: 3, completedAtMs: 900 },
      { level: 1, completedAtMs: 100 },
      { level: 2, completedAtMs: 500 },
    ];
    expect(highestUnlocked(runs)).toBe(4);
    expect(highestUnlocked([...runs].reverse())).toBe(4);
  });

  it('⛔ a completion ⛔ never re-locks what is already open — a later level-1 run keeps 4 open', () => {
    expect(
      highestUnlocked([
        { level: 3, completedAtMs: 1 },
        { level: 1, completedAtMs: 9_999 },
      ]),
    ).toBe(4);
  });

  it('finishing level 4 ⛔ does not invent a fifth level — the ceiling is 41 § 4’s four', () => {
    expect(MAX_LEVEL).toBe(4);
    expect(highestUnlocked([{ level: 4, completedAtMs: 1 }])).toBe(4);
  });

  it('⛔ a row outside 41 § 4’s four levels ⛔ cannot widen the unlock', () => {
    const rogue = [{ level: 9, completedAtMs: 1 }] as unknown as readonly AmirnetSimulationRun[];
    expect(highestUnlocked(rogue)).toBe(1);
  });

  it('lib/core is PURE — ⛔ zero React, ⛔ zero fetch, ⛔ zero supabase, ⛔ zero Date.now', () => {
    for (const banned of [/react/i, /\bfetch\(/, /supabase/i, /Date\.now/, /localStorage/, /process\.env/]) {
      expect(CODE).not.toMatch(banned);
    }
  });
});
