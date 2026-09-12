import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BACK_TO_LEVELS_HE,
  NO_RUN_HE,
  SESSION_EXPIRED_HE,
  UNAVAILABLE_HE,
  failureHe,
} from './AmirnetSimulationEntry';

const CODE = readFileSync('components/AmirnetSimulationEntry.tsx', 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^\s*\/\/.*$/gm, '');

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

  it('the unlock arrives as a prop — ⛔ the entry ⛔ does not decide who may run what (T-309)', () => {
    expect(CODE).toMatch(/unlockedThrough/);
    expect(CODE).not.toMatch(/unlockedThrough\s*=\s*\d/);
  });
});
