import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GET, parseQuery } from './route';

const q = (s: string) => parseQuery(new URLSearchParams(s));

describe('parseQuery — a bad query is null, ⛔ never a guessed level', () => {
  it('accepts a level and a space-separated prefix', () => {
    expect(q('level=A1&prefix=i+like')).toEqual({ level: 'A1', prefix: ['i', 'like'] });
    expect(q('level=A2')).toEqual({ level: 'A2', prefix: [] });
  });

  it('refuses a missing or unknown level, a non-word, and an over-long prefix', () => {
    expect(q('prefix=i')).toBeNull();
    expect(q('level=C1')).toBeNull();
    expect(q('level=A1&prefix=i+<b>')).toBeNull();
    expect(q(`level=A1&prefix=${Array(13).fill('tea').join('+')}`)).toBeNull();
  });
});

describe('GET — the real tree, read from the generated file', () => {
  it('answers the empty A1 prefix with more than 100 blocks', async () => {
    const res = await GET(new Request('http://x/api/world/messages/continuations?level=A1'));
    const body = (await res.json()) as { ok: boolean; count: number };
    expect(body.ok).toBe(true);
    expect(body.count).toBeGreaterThan(100);
  });

  it('a bad query is 400 bad_request', async () => {
    const res = await GET(new Request('http://x/api/world/messages/continuations?level=Z9'));
    expect(res.status).toBe(400);
  });

  it('is documented in the api contract', () => {
    expect(readFileSync('docs/api-contract.md', 'utf8')).toContain('/api/world/messages/continuations');
  });
});
