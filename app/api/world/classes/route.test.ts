import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { classFailure, classRow } from '@/lib/server/classFailure';
import { parseName } from './route';

const ROUTES = {
  create: readFileSync('app/api/world/classes/route.ts', 'utf8'),
  join: readFileSync('app/api/world/classes/join/route.ts', 'utf8'),
  mine: readFileSync('app/api/world/classes/mine/route.ts', 'utf8'),
};

describe('T-468 — the class routes', () => {
  it('failure scenario: the table or function is missing (42P01 · PGRST205 · PGRST202) ⇒ 503 classes_unavailable, ⛔ not a 500', async () => {
    for (const code of ['42P01', 'PGRST205', 'PGRST202']) {
      const r = classFailure('test', { message: 'missing', code });
      expect(r.status, code).toBe(503);
      expect(await r.json()).toEqual({ ok: false, code: 'classes_unavailable' });
    }
  });

  it('a code that opens nothing is 404 class_not_found; a bad name 400; anything else 503 by name', async () => {
    expect(classFailure('t', { message: 'class_not_found', code: 'P0002' }).status).toBe(404);
    expect(await classFailure('t', { message: 'x', code: 'P0002' }).json()).toEqual({ ok: false, code: 'class_not_found' });
    expect(classFailure('t', { message: 'invalid_name', code: '22023' }).status).toBe(400);
    expect(classFailure('t', { message: 'x', code: '28000' }).status).toBe(401);
    expect(classFailure('t', { message: 'x', code: 'XX000' }).status).toBe(503);
    expect(classFailure('t', { message: 'x' }).status).not.toBe(500);
  });

  it('every route answers a Supabase error through classFailure — all three', () => {
    for (const [name, src] of Object.entries(ROUTES)) expect(src, name).toMatch(/return classFailure\(/);
  });

  it('⛔ no route reads or writes the tables directly — only the three security-definer functions (39 § 2)', () => {
    expect(ROUTES.create).toMatch(/rpc\('create_class'/);
    expect(ROUTES.join).toMatch(/rpc\('join_class'/);
    expect(ROUTES.mine).toMatch(/rpc\('my_class'/);
    for (const [name, src] of Object.entries(ROUTES)) {
      expect(src, name).not.toMatch(/\.from\('class(es|_members)'\)/);
      expect(src.indexOf('readSupabaseEnv()'), name).toBeLessThan(src.indexOf('auth.getUser'));
      expect(src.indexOf('auth.getUser'), name).toBeLessThan(src.indexOf('.rpc('));
    }
  });

  it('the join route normalises the code the way the database does, before the call', () => {
    expect(ROUTES.join.indexOf('normalizeClassCode(')).toBeLessThan(ROUTES.join.indexOf(".rpc('join_class'"));
    expect(ROUTES.join).toMatch(/isClassCode\(code\)/);
  });

  it('parseName: 1–60 characters after trimming', () => {
    expect(parseName({ name: '  כיתה ז׳3 ' })).toBe('כיתה ז׳3');
    expect(parseName({ name: '   ' })).toBeNull();
    expect(parseName({ name: 'א'.repeat(61) })).toBeNull();
    expect(parseName({})).toBeNull();
  });

  it('classRow: only code · name · members leave; no row ⇒ null', () => {
    expect(classRow([{ code: 'K7Q2MZ', name: 'ז׳3', members: 2, user_id: 'x' }])).toEqual({ code: 'K7Q2MZ', name: 'ז׳3', members: 2 });
    expect(classRow([])).toBeNull();
    expect(classRow(null)).toBeNull();
  });

  it('is documented in the api contract', () => {
    const doc = readFileSync('docs/api-contract.md', 'utf8');
    for (const r of ['POST /api/world/classes', 'POST /api/world/classes/join', 'GET /api/world/classes/mine']) {
      expect(doc, r).toContain(r);
    }
  });
});
