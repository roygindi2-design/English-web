import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/amirnet/practice/route.ts', 'utf8');

describe('T-297ⓒ — GET /api/amirnet/practice', () => {
  it('keeps the C-0032 guard order: env, then session, then query', () => {
    expect(SRC.indexOf('readSupabaseEnv')).toBeLessThan(SRC.indexOf('auth.getUser'));
    expect(SRC.indexOf('auth.getUser')).toBeLessThan(SRC.indexOf("from('amirnet_items')"));
    expect(SRC).toMatch(/status:\s*401/);
  });

  it('⛔ never answers 503 — a node of the ring reads softly (the T-190ⓓ pattern)', () => {
    expect(SRC).not.toMatch(/status:\s*503/);
    expect(SRC).toMatch(/code:\s*'schema_missing'/);
    expect(SRC).toMatch(/code:\s*'unavailable'/);
    expect(SRC).toMatch(/code:\s*'bad_request'/);
    expect(SRC).toMatch(/code:\s*'no_items'/);
  });

  it('filters by the type AND the level the learner chose — ⛔ never one of the two', () => {
    expect(SRC).toMatch(/\.eq\('type',/);
    expect(SRC).toMatch(/\.eq\('level',/);
  });

  it('the gate is the pure layer’s, ⛔ not inline in the route', () => {
    expect(SRC).toMatch(/toServedItems\(/);
    expect(SRC).toMatch(/servableItems\(/);
  });

  it('⛔ zero adaptivity and ⛔ zero coupling: no word_progress, no arcade, no score', () => {
    for (const banned of [/word_progress/, /arcade/, /\bxp\b/i, /score/i]) {
      expect(SRC).not.toMatch(banned);
    }
  });

  it('⛔ never writes: the bank is read-only from a client (0024 grants select alone)', () => {
    for (const banned of [/\.insert\(/, /\.update\(/, /\.upsert\(/, /\.delete\(/]) {
      expect(SRC).not.toMatch(banned);
    }
  });

  it('the raw PostgREST message goes to the log, ⛔ never into the response body', () => {
    expect(SRC).toMatch(/console\.error/);
    expect(SRC).not.toMatch(/json\([^)]*error\.message/);
  });

  it('bounds the read — ⛔ an unbounded select is how a route pages a bank', () => {
    expect(SRC).toMatch(/\.limit\(/);
  });
});
