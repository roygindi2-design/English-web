import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BACK_TO_LEVELS_HE,
  NO_RUN_HE,
  UNLOCK_UNKNOWN_HE,
  SESSION_EXPIRED_HE,
  UNAVAILABLE_HE,
  failureHe,
} from './AmirnetSimulationEntry';
import { withoutComments } from '@/lib/testSource';

const CODE = withoutComments(readFileSync('components/AmirnetSimulationEntry.tsx', 'utf8'));

describe('AmirnetSimulationEntry — T-308ⓒ, the press that starts the engine', () => {
  it('⛔ «cannot fill a run yet» and «something is broken» are ⛔ not the same sentence', () => {
    expect(failureHe('no_items')).toBe(NO_RUN_HE);
    expect(failureHe('session_expired')).toBe(SESSION_EXPIRED_HE);
    expect(failureHe('unavailable')).toBe(UNAVAILABLE_HE);
    expect(failureHe('schema_missing')).toBe(UNAVAILABLE_HE);
    expect(NO_RUN_HE).not.toBe(UNAVAILABLE_HE);
  });

  it('⛔ the screen ⛔ never assembles the run itself — it asks the route for a queue', () => {
    expect(CODE).toMatch(/apiGet</);
    expect(CODE).toMatch(/\/api\/amirnet\/simulation\?level=/);
    // ⛔ No chapter arithmetic here: `simulationQueue` is pure and lives server-side.
    expect(CODE).not.toMatch(/AMIRNET_CHAPTERS|questionCount|simulationQueue/);
  });

  it('⛔ never touches the database, and ⛔ never calls fetch behind lib/api/client', () => {
    for (const banned of [/supabase/i, /\bfetch\(/, /word_progress/, /score/i]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('⛔ a state is ⛔ never colour alone — every phase is a sentence, announced', () => {
    expect(CODE).toMatch(/role="status"/);
    expect(CODE).toMatch(/LOADING_HE/);
    expect(CODE).toMatch(/failureHe\(/);
  });

  it('⛔ ONE action in the blocked state (taste-skill § 4.5) — ⛔ no «try again» beside it', () => {
    expect(BACK_TO_LEVELS_HE).toBe('חזרה לרמות');
    expect((CODE.match(/<button/g) ?? []).length).toBe(1);
    expect(CODE).toMatch(/min-h-touch/);
  });

  it('⛔ no hex literal, ⛔ no h-screen, ⛔ no motion', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/h-screen/);
    expect(CODE).not.toMatch(/transition-|animate-/);
  });

  /**
   * ⟦REWRITTEN C-0560 · T-309⟧ This test used to say «the unlock arrives as a prop», which was
   * `T-308`'s true shape and is ⛔ no longer anyone's: the page passed a CONSTANT into that prop,
   * so «⛔ the entry does not decide» was bought by nobody deciding at all. The prop is gone; the
   * claim it stood for is measured below, and it is now the stronger one.
   */
  it('⛔ the unlock is ⛔ never a constant — the rows are read, and the RULE is the pure layer’s', () => {
    expect(CODE).toMatch(/unlockedThrough=\{unlocked\}/);
    // ⛔ No literal level anywhere near it: a digit here is the fixture `T-309` closed.
    expect(CODE).not.toMatch(/unlockedThrough\s*=\s*\{?\s*\d/);
    expect(CODE).toMatch(/\/api\/amirnet\/simulation\/runs/);
    // ⛔ And the rule itself is ⛔ not re-implemented here — no «+ 1», no ceiling, no max.
    expect(CODE).toMatch(/highestUnlocked\(/);
    expect(CODE).not.toMatch(/level\s*\+\s*1/);
  });

  it('a finished run is RECORDED — ⛔ the screen ⛔ does not forget it on the way out (T-309)', () => {
    expect(CODE).toMatch(/apiPost\(/);
    expect(CODE).toMatch(/onFinished=/);
    // The completion names the level that actually ran, ⛔ not the one the screen happens to show.
    expect(CODE).toMatch(/recordCompletion\(phase\.level\)/);
  });

  it('⛔ a read that failed is ⛔ never «you unlocked nothing» — it SAYS it could not check', () => {
    expect(UNLOCK_UNKNOWN_HE).toContain('רמה 1');
    expect(UNLOCK_UNKNOWN_HE).not.toBe(UNAVAILABLE_HE);
    expect(CODE).toMatch(/unlockState === 'unknown'/);
    // ⛔ «still checking» is ⛔ not «could not check» — the sentence is ⛔ not shown while asking.
    expect(CODE).toMatch(/'checking'/);
  });
});
