import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/world/messages/route.ts', 'utf8');

describe('T-190ⓓ — GET /api/world/messages is a soft read', () => {
  it('⛔ never answers 503 — every read failure is 200 ok:false', () => {
    expect(SRC).not.toMatch(/status:\s*503/);
    expect(SRC).toMatch(/code:\s*'schema_missing'/);
    expect(SRC).toMatch(/code:\s*'unavailable'/);
    expect(SRC).toMatch(/code:\s*'no_simulations'/);
  });
  it('keeps the C-0032 guard order: env, then session, then query', () => {
    expect(SRC.indexOf('readSupabaseEnv')).toBeLessThan(SRC.indexOf('auth.getUser'));
    expect(SRC.indexOf('auth.getUser')).toBeLessThan(SRC.indexOf("from('message_simulations')"));
    expect(SRC).toMatch(/status:\s*401/);
  });
  it('reads the learner’s own state rows only, by user_id', () => {
    expect(SRC).toMatch(/from\('message_simulation_state'\)[\s\S]*?\.eq\('user_id', user\.id\)/);
  });
  it('⛔ zero coupling: no word_progress, no arcade, no Math.random', () => {
    for (const banned of [/word_progress/, /arcade/, /Math\.random/]) expect(SRC).not.toMatch(banned);
  });
  it('the mapping is the pure layer’s, ⛔ not inline', () => {
    expect(SRC).toMatch(/toSimulations\(/);
    expect(SRC).toMatch(/mergeInbox\(/);
    expect(SRC).toMatch(/inboxCounts\(/);
  });
});
