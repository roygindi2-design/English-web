import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/world/messages/state/route.ts', 'utf8');

describe('T-192ⓔ — PATCH /api/world/messages/state writes the learner’s own read_at only', () => {
  it('guard order: env, then session, then the write', () => {
    expect(SRC.indexOf('readSupabaseEnv')).toBeLessThan(SRC.indexOf('auth.getUser'));
    expect(SRC.indexOf('auth.getUser')).toBeLessThan(SRC.indexOf('.upsert('));
  });

  it('rejects a non-uuid simulationId with 400', () => {
    expect(SRC).toMatch(/status:\s*400/);
    expect(SRC).toMatch(/\[0-9a-f\]\{8\}/i);
  });

  it('⛔ never writes answered_at (R-026) and ⛔ never touches word_progress', () => {
    expect(SRC).not.toMatch(/answered_at/);
    expect(SRC).not.toMatch(/word_progress|arcade_/);
  });

  it('the row is keyed on the session user, ⛔ never on a body field', () => {
    expect(SRC).toMatch(/user_id:\s*user\.id/);
    expect(SRC).not.toMatch(/body\.userId|body\.user_id/);
  });

  it('a second open ⛔ does not move the first read: the existing read_at is returned', () => {
    expect(SRC).toMatch(/maybeSingle\(\)/);
    expect(SRC.indexOf('.select(')).toBeLessThan(SRC.indexOf('.upsert('));
  });

  it('a write is a HARD call — missing env answers 503, ⛔ unlike the soft GET', () => {
    expect(SRC).toMatch(/status:\s*503/);
  });
});
