import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/amirnet/practice/result/route.ts', 'utf8');

describe('T-372ⓑ — GET/POST /api/amirnet/practice/result', () => {
  it('keeps the C-0032 guard order: env, then session, then the table', () => {
    expect(SRC.indexOf('readSupabaseEnv')).toBeLessThan(SRC.indexOf('auth.getUser'));
    expect(SRC.indexOf('auth.getUser')).toBeLessThan(
      SRC.indexOf("from('amirnet_practice_attempts')"),
    );
    expect(SRC).toMatch(/status:\s*401/);
  });

  it('⛔ never answers 503 — a node of the ring reads softly (the T-190ⓓ pattern)', () => {
    expect(SRC).not.toMatch(/status:\s*503/);
    expect(SRC).toMatch(/code:\s*'schema_missing'/);
    expect(SRC).toMatch(/code:\s*'unavailable'/);
    expect(SRC).toMatch(/code:\s*'bad_request'/);
  });

  it('⛔ the route ⛔ does not do the arithmetic — the pure fold is ⛔ not re-implemented here', () => {
    // The rows go back as three stats from `toTypeStats()`. A `reduce` written here would be the
    // same sum in a layer that ⛔ cannot be tested without a database.
    expect(SRC).toMatch(/toTypeStats/);
    for (const banned of [/\.reduce\(/, /successPct/, /Math\.round/]) {
      expect(SRC).not.toMatch(banned);
    }
  });

  it('the write is scoped to the caller — `user_id` is the session’s, ⛔ never the body’s', () => {
    expect(SRC).toMatch(/user_id:\s*user\.id/);
    expect(SRC).not.toMatch(/body\.user_id|userId.*=.*body/);
  });

  it('every one of the four body fields is checked before the write, ⛔ none defaulted', () => {
    expect(SRC).toMatch(/typeof itemId !== 'string'/);
    expect(SRC).toMatch(/TYPES\.has\(type\)/);
    expect(SRC).toMatch(/LEVELS\.has\(level\)/);
    expect(SRC).toMatch(/typeof correct !== 'boolean'/);
    expect(SRC).toMatch(/status:\s*400/);
    // ⛔ No `??` filling in a missing half — that is a result about an unanswered question.
    expect(SRC).not.toMatch(/(itemId|type|level|correct)\s*\?\?/);
  });

  it('⛔ never updates and ⛔ never deletes — an answer that was given is a fact', () => {
    for (const banned of [/\.update\(/, /\.upsert\(/, /\.delete\(/]) {
      expect(SRC).not.toMatch(banned);
    }
    expect(SRC).toMatch(/\.insert\(/);
  });

  it('⛔ zero score, ⛔ zero coupling: no word_progress, no arcade, no score (41 § 9.2 is Roy’s)', () => {
    for (const banned of [/word_progress/, /arcade/, /\bxp\b/i, /score/i, /streak/i]) {
      expect(SRC).not.toMatch(banned);
    }
  });

  it('⛔ zero adaptivity — nothing read here chooses a level or an item (41 § 7)', () => {
    for (const banned of [/nextLevel/, /recommend/i, /adaptive/i]) {
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
