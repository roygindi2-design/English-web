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
let rpcCalls: { fn: string; args: Record<string, unknown> }[];
let rpcAnswer: { data: unknown; error: { message: string; code: string } | null };

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
    rpc: async (fn: string, args: Record<string, unknown>) => { rpcCalls.push({ fn, args }); return rpcAnswer; },
  }),
}));

const { GET: wall, POST: postQuestion } = await import('./route');
const { GET: allReplies, POST: postReply } = await import('./[postId]/replies/route');
const { POST: like, parseTarget } = await import('../../wall/like/route');
const { nextBlocks, END_BLOCK } = await import('@/lib/core/continuations');
const { continuationsTree } = await import('@/lib/server/continuationsTree');

/** A sentence the keyboard CAN compose: follow the first block until the tree says END. */
function keyboardSentence(): string[] {
  const out: string[] = [];
  for (let i = 0; i < 12; i++) {
    const { blocks } = nextBlocks(continuationsTree(), out, 'B2');
    if (blocks.some((b) => b.word === END_BLOCK.word) && out.length > 0) return out;
    const next = blocks.find((b) => b.word !== END_BLOCK.word);
    if (!next) break;
    out.push(next.word);
  }
  throw new Error('no sendable path found');
}
const jsonReq = (body: unknown) => new Request('http://x', { method: 'POST', body: JSON.stringify(body) });

const call = (id: string) => wall(new Request('http://x'), { params: Promise.resolve({ id }) });

beforeEach(() => {
  user = { id: ME };
  failOn = null;
  rpcCalls = [];
  rpcAnswer = { data: [{ id: 'new', created_at: '2026-09-24T10:00:00Z' }], error: null };
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

describe('the wall writes (T-472)', () => {
  const words = keyboardSentence();

  it('failure scenario: free text is refused with 422 not_from_keyboard, and ⛔ nothing reaches the database', async () => {
    for (const body of [{ body_en: 'anything I want' }, { words: ['anything', 'zzqx', 'want'] }, { words: [] }]) {
      const r = await postReply(jsonReq(body), { params: Promise.resolve({ id: CLASS_A, postId: POST }) });
      expect(r.status).toBe(422);
      expect(await r.json()).toEqual({ ok: false, code: 'not_from_keyboard' });
      const q = await postQuestion(jsonReq(body), { params: Promise.resolve({ id: CLASS_A }) });
      expect(q.status).toBe(422);
    }
    expect(rpcCalls).toEqual([]);
  });

  it('a keyboard sentence is stored through add_reply, as a sentence', async () => {
    const r = await postReply(jsonReq({ words }), { params: Promise.resolve({ id: CLASS_A, postId: POST }) });
    expect(r.status).toBe(200);
    expect(rpcCalls[0]?.fn).toBe('add_reply');
    expect(String(rpcCalls[0]?.args.p_body)).toMatch(/^[A-Z].*\.$/);
  });

  it('a reply to a post of another class ⇒ 404 before any write', async () => {
    const r = await postReply(jsonReq({ words }), { params: Promise.resolve({ id: CLASS_B, postId: POST }) });
    expect(r.status).toBe(404);
    expect(rpcCalls).toEqual([]);
  });

  it('a member who did not open the class ⇒ 403 only_class_opener', async () => {
    rpcAnswer = { data: null, error: { message: 'only_class_opener', code: '42501' } };
    const r = await postQuestion(jsonReq({ words }), { params: Promise.resolve({ id: CLASS_A }) });
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ ok: false, code: 'only_class_opener' });
    expect(String(rpcCalls[0]?.args.p_body)).toMatch(/\?$/);
  });

  it('like: one target, the new state and count; own content ⇒ 403', async () => {
    expect(parseTarget({ postId: POST })).toEqual({ p_post_id: POST, p_reply_id: null });
    expect(parseTarget({ postId: POST, replyId: POST })).toBeNull();
    expect(parseTarget({})).toBeNull();
    rpcAnswer = { data: [{ liked: true, likes: 32 }], error: null };
    expect(await (await like(jsonReq({ postId: POST }))).json()).toEqual({ ok: true, liked: true, likes: 32 });
    rpcAnswer = { data: null, error: { message: 'own_content', code: '42501' } };
    const r = await like(jsonReq({ replyId: POST }));
    expect(r.status).toBe(403);
    expect(await r.json()).toEqual({ ok: false, code: 'own_content' });
  });
});

describe('the source', () => {
  const SRC = readFileSync('app/api/world/classes/[id]/wall/route.ts', 'utf8');
  it('reads under RLS with the session client ⛔ never a service key; ⛔ never writes', () => {
    expect(SRC).not.toMatch(/service_role|SERVICE_ROLE/);
    expect(SRC).not.toMatch(/\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
  });
});
