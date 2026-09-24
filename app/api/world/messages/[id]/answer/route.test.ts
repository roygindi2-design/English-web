import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseWords } from './route';

const SRC = readFileSync('app/api/world/messages/[id]/answer/route.ts', 'utf8');

describe('T-462 — POST /api/world/messages/[id]/answer', () => {
  it('guard order: env, then session, then body, then the tree check, then the write', () => {
    expect(SRC.indexOf('readSupabaseEnv()')).toBeLessThan(SRC.indexOf('auth.getUser'));
    expect(SRC.indexOf('auth.getUser')).toBeLessThan(SRC.indexOf('parseWords(await'));
    expect(SRC.indexOf('parseWords(await')).toBeLessThan(SRC.indexOf('isSendable(continuationsTree()'));
    expect(SRC.indexOf('isSendable(continuationsTree()')).toBeLessThan(SRC.indexOf('.upsert('));
  });

  it('writes answered_at on the session user’s row, ⛔ never the reply text', () => {
    expect(SRC).toMatch(/user_id:\s*user\.id/);
    expect(SRC).toMatch(/answered_at: answeredAt/);
    expect(SRC).not.toMatch(/answer_text|reply_text|body_en:/);
    expect(SRC).not.toMatch(/word_progress|arcade_/);
  });

  it('the first answer counts; read_at is kept, else stamped with the answer', () => {
    expect(SRC).toMatch(/if \(prev\?\.answered_at\) return/);
    expect(SRC).toMatch(/read_at: prev\?\.read_at \?\? answeredAt/);
  });

  it('a hard call: 503 on env/write, 400 on a bad body or an unfinished reply', () => {
    expect(SRC).toMatch(/status:\s*503/);
    expect(SRC).toMatch(/'not_sendable' \}, \{ status: 400 \}/);
  });

  it('parseWords accepts plain words only, 1–12 of them', () => {
    expect(parseWords({ words: ['I', 'like', 'tea'] })).toEqual(['I', 'like', 'tea']);
    expect(parseWords({ words: [] })).toBeNull();
    expect(parseWords({ words: ['<b>'] })).toBeNull();
    expect(parseWords({ words: Array(13).fill('tea') })).toBeNull();
    expect(parseWords(null)).toBeNull();
  });

  it('is documented in the api contract', () => {
    expect(readFileSync('docs/api-contract.md', 'utf8')).toContain('POST /api/world/messages/[id]/answer');
  });
});
