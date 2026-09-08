import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./ArenaShell.tsx', import.meta.url), 'utf8');

describe('ArenaShell — `37 § 7`: once, full screen, before the first battle', () => {
  it('three states and ⛔ no route', () => {
    expect(SRC).toContain("'home' | 'character' | 'battle'");
    expect(SRC).not.toContain('useRouter');
    expect(SRC).not.toContain('next/link');
  });

  it('a learner with no character is sent to the choice before the battle, ⛔ not into it', () => {
    expect(SRC).toMatch(/character === null \? 'character' : 'battle'/);
  });

  it('the battle receives the character as a prop', () => {
    expect(SRC).toMatch(/<ArenaBattle character=\{/);
  });
});
