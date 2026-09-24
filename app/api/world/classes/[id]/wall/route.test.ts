import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * T-471 — the wall's two read paths, run against a fake Supabase client that answers
 * like RLS does: a class the learner is ⛔ not in reads as ⛔ no row.
 */
const ME = '11111111-1111-4111-8111-111111111111';
const OPENER = '22222222-2222-4222-8222-222222222222';
const CLASS_A = '33333333-3333-4333-8333-333333333333';
const CLASS_B = '44444444-4444-4444-8444-444444444444';
const POST = '55555555-5555-4555-8555-555555555555';

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let user: { id: string } | null;
let failOn: string | null;

function builder(table: string) {
  let rows = [...(tables[table] ?? [])];
  let single = false;
  let limit = Infinity;
  const b = {
    select: () => b,
    eq: (col: string, v: unknown) => { rows = rows.filter((r) => r[col] === v); return b; },
    in: (col: string, vs: unknown[]) => { rows = rows.filter((r) => vs.includes(r[col])); return b; },
    order: (col: string, o: { ascending: boolean }) => {
      rows.sort((x, y) => (String(x[col]) < String(y[col]) ? -1 : 1) * (o.ascending ? 1 : -1));
      return b;
    },
    limit: (n: number) => { limit = n; return b; },
    maybeSingle: () => { single = true; return b; },
    then: (res: (v: unknown) => void) => {
      if (failOn === table) return res({ data: null, error: { message: 'relation does not exist', code: '42P01' } });
      const out = rows.slice(0, limit);
      return res({ data: single ? out[0] ?? null : out, error: null });
    },
  };
  return b;
}

vi.mock('next/headers', () => ({ cookies: async () => ({}) }));
vi.mock('@/lib/supabase/auth', () => ({
  readSupabaseEnv: () => ({ url: 'x', anonKey: 'y' }),
  createRouteClient: () => ({
    auth: { getUser: async () => ({ data: { user } }) },
    from: (t: string) => builder(t),
  }),
}));

const { GET: wall } = await import('./route');
const { GET: allReplies } = await import('./[postId]/replies/route');

const call = (id: string) => wall(new Request('http://x'), { params: Promise.resolve({ id }) });

beforeEach(() => {
  user = { id: ME };
  failOn = null;
  // RLS, simulated: the learner is in class A only ⇒ only A's rows are visible at all.
  tables = {
    classes: [{ id: CLASS_A, created_by: OPENER }],
    class_posts: [{ id: POST, class_id: CLASS_A, author_id: OPENER, body_en: 'How was your weekend?', created_at: '2026-09-24T05:15:00Z' }],
    class_replies: Array.from({ length: 24 }, (_, i) => ({
      id: `r${String(i).padStart(2, '0')}`, post_id: POST, author_id: i === 0 ? ME : `u${i}`, body_en: `reply ${i}`, created_at: `2026-09-24T06:${String(i).padStart(2, '0')}:00Z`,
    })),
    class_likes: [
      ...Array.from({ length: 12 }, (_, i) => ({ user_id: `l${i}`, post_id: null, reply_id: 'r07' })),
      ...Array.from({ length: 9 }, (_, i) => ({ user_id: `l${i}`, post_id: null, reply_id: 'r03' })),
      { user_id: ME, post_id: POST, reply_id: null },
    ],
  };
});

describe('GET /api/world/classes/[id]/wall (T-471)', () => {
  it('the feed: counts, likedByMe, byOpener — and the TWO top replies, ⛔ not 24', async () => {
    const body = await (await call(CLASS_A)).json();
    expect(body.ok).toBe(true);
    expect(body.posts).toHaveLength(1);
    const [p] = body.posts;
    expect(p).toMatchObject({ id: POST, likes: 1, likedByMe: true, byOpener: true, mine: false, replyCount: 24 });
    expect(p.top.map((r: { id: string }) => r.id)).toEqual(['r07', 'r03']);
    expect(JSON.stringify(body)).not.toContain(OPENER);
  });

  it('a class the learner is ⛔ not in ⇒ 404, ⛔ not 403; a malformed id too', async () => {
    const r = await call(CLASS_B);
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ ok: false, code: 'class_not_found' });
    expect((await call('not-a-uuid')).status).toBe(404);
  });

  it('no session ⇒ 401; a missing schema ⇒ 503 classes_unavailable', async () => {
    user = null;
    expect((await call(CLASS_A)).status).toBe(401);
    user = { id: ME };
    failOn = 'class_posts';
    const r = await call(CLASS_A);
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ ok: false, code: 'classes_unavailable' });
  });

  it('an empty wall is an empty list, ⛔ not an error', async () => {
    tables.class_posts = [];
    expect(await (await call(CLASS_A)).json()).toEqual({ ok: true, posts: [] });
  });
});

describe('GET …/wall/[postId]/replies (T-471)', () => {
  const get = (id: string, postId: string) => allReplies(new Request('http://x'), { params: Promise.resolve({ id, postId }) });

  it('every reply, most liked first', async () => {
    const body = await (await get(CLASS_A, POST)).json();
    expect(body.replies).toHaveLength(24);
    expect(body.replies.slice(0, 2).map((r: { id: string }) => r.id)).toEqual(['r07', 'r03']);
    expect(body.replies.find((r: { id: string }) => r.id === 'r00').mine).toBe(true);
  });

  it('a post asked for under ANOTHER class id ⇒ 404 post_not_found', async () => {
    const r = await get(CLASS_B, POST);
    expect(r.status).toBe(404);
    expect(await r.json()).toEqual({ ok: false, code: 'post_not_found' });
  });
});

describe('the source', () => {
  const SRC = readFileSync('app/api/world/classes/[id]/wall/route.ts', 'utf8');
  it('reads under RLS with the session client ⛔ never a service key; ⛔ never writes', () => {
    expect(SRC).not.toMatch(/service_role|SERVICE_ROLE/);
    expect(SRC).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
  });
});
