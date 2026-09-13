import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/amirnet/simulation/runs/route.ts', 'utf8');

describe('T-309ⓐⓑ — GET/POST /api/amirnet/simulation/runs', () => {
  it('keeps the C-0032 guard order: env, then session, then the table', () => {
    expect(SRC.indexOf('readSupabaseEnv')).toBeLessThan(SRC.indexOf('auth.getUser'));
    expect(SRC.indexOf('auth.getUser')).toBeLessThan(SRC.indexOf("from('amirnet_simulation_runs')"));
    expect(SRC).toMatch(/status:\s*401/);
  });

  it('⛔ never answers 503 — a node of the ring reads softly (the T-190ⓓ pattern)', () => {
    expect(SRC).not.toMatch(/status:\s*503/);
    expect(SRC).toMatch(/code:\s*'schema_missing'/);
    expect(SRC).toMatch(/code:\s*'unavailable'/);
    expect(SRC).toMatch(/code:\s*'bad_request'/);
  });

  it('⛔ the route ⛔ does not decide who may run what — the pure layer is ⛔ not re-implemented here', () => {
    // The rows go back as rows. `highestUnlocked()` lives in `lib/core/amirnetLevels.ts`, and a
    // second copy of the rule inside a route is exactly how two answers start disagreeing.
    for (const banned of [/highestUnlocked/, /unlockedThrough/, /\+\s*1\b/]) {
      expect(SRC).not.toMatch(banned);
    }
  });

  it('the write is scoped to the caller — `user_id` is the session’s, ⛔ never the body’s', () => {
    expect(SRC).toMatch(/user_id:\s*user\.id/);
    expect(SRC).not.toMatch(/body\.user_id|userId.*=.*body/);
  });

  it('a level outside 41 § 4’s four is refused before the write, ⛔ not by the DB alone', () => {
    expect(SRC).toMatch(/LEVELS/);
    expect(SRC).toMatch(/code:\s*'bad_request'/);
    expect(SRC).toMatch(/status:\s*400/);
  });

  it('⛔ never updates and ⛔ never deletes — a finished run is a fact, ⛔ not a draft', () => {
    for (const banned of [/\.update\(/, /\.upsert\(/, /\.delete\(/]) {
      expect(SRC).not.toMatch(banned);
    }
    expect(SRC).toMatch(/\.insert\(/);
  });

  it('⛔ zero score, ⛔ zero coupling: no word_progress, no arcade, no score (41 § 9.2 is Roy’s)', () => {
    for (const banned of [/word_progress/, /arcade/, /\bxp\b/i, /score/i]) {
      expect(SRC).not.toMatch(banned);
    }
  });

  it('the raw PostgREST message goes to the log, ⛔ never into the response body', () => {
    expect(SRC).toMatch(/console\.error/);
    expect(SRC).not.toMatch(/json\([^)]*error\.message/);
  });

  it('the read is bounded', () => {
    expect(SRC).toMatch(/\.limit\(/);
  });
});
