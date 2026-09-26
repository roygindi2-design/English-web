import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * T-478 — the story's two paths, against a fake Supabase client that answers like RLS:
 * a class the learner is ⛔ not in reads as ⛔ no row.
 */
const ME = '11111111-1111-4111-8111-111111111111';
const OPENER = '22222222-2222-4222-8222-222222222222';
const OTHER = '66666666-6666-4666-8666-666666666666';
const CLASS_A = '33333333-3333-4333-8333-333333333333';
const CLASS_B = '44444444-4444-4444-8444-444444444444';

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let user: { id: string } | null;
let failOn: string | null;
let rpcCalls: { fn: string; args: Record<string, unknown> }[];
let rpcAnswer: { data: unknown; error: { message: string; code: string } | null };
let limits: number[];

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
    limit: (n: number) => { limit = n; limits.push(n); return b; },
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

const { GET, POST, STORY_LINES_MAX } = await import('./route');
const { nextBlocks, END_BLOCK } = await import('@/lib/core/continuations');
const { continuationsTree } = await import('@/lib/server/continuationsTree');

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

const get = (id: string) => GET(new Request('http://x'), { params: Promise.resolve({ id }) });
const post = (id: string, body: unknown) =>
  POST(new Request('http://x', { method: 'POST', body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });

const line = (id: string, author: string, minute: number) => ({
  id, class_id: CLASS_A, author_id: author, body_en: `Line ${id}.`, created_at: `2026-09-24T10:${String(minute).padStart(2, '0')}:00Z`,
});

beforeEach(() => {
  user = { id: ME };
  failOn = null;
  rpcCalls = [];
  limits = [];
  rpcAnswer = { data: [{ id: 'new', created_at: '2026-09-24T11:00:00Z' }], error: null };
  tables = {
    classes: [{ id: CLASS_A, created_by: OPENER }],
    class_story_lines: [line('a', OPENER, 1), line('b', ME, 2), line('c', OTHER, 3)],
  };
});

describe('GET /api/world/classes/[id]/story (T-478)', () => {
  it('oldest first, seats, and ⛔ no author id', async () => {
    const body = await (await get(CLASS_A)).json();
    expect(body.ok).toBe(true);
    expect(body.lines.map((l: { id: string }) => l.id)).toEqual(['a', 'b', 'c']);
    expect(body.lines.map((l: { seat: number }) => l.seat)).toEqual([1, 2, 3]);
    expect(body.lines[0].byOpener).toBe(true);
    expect(body.lines[1].mine).toBe(true);
    expect(JSON.stringify(body)).not.toContain(OPENER);
    expect(JSON.stringify(body)).not.toContain(OTHER);
  });

  it('myTurn follows the LAST line: someone else’s ⇒ true, mine ⇒ false', async () => {
    expect((await (await get(CLASS_A)).json()).myTurn).toBe(true);
    tables.class_story_lines?.push(line('d', ME, 4));
    expect((await (await get(CLASS_A)).json()).myTurn).toBe(false);
  });

  it('reads the NEWEST lines of a long chain — the turn is decided by the last one', async () => {
    tables.class_story_lines = Array.from({ length: STORY_LINES_MAX + 5 }, (_, i) =>
      ({ ...line(`l${String(i).padStart(3, '0')}`, i % 2 ? ME : OTHER, 0), created_at: new Date(Date.UTC(2026, 8, 24, 0, i)).toISOString() }));
    const body = await (await get(CLASS_A)).json();
    expect(body.lines).toHaveLength(STORY_LINES_MAX);
    expect(body.lines.at(-1).id).toBe(`l${String(STORY_LINES_MAX + 4).padStart(3, '0')}`);
    expect(body.myTurn).toBe(true);
  });

  it('T-520: a seat is the CLASS seat — first on the wall ⇒ `1` here, and the window ⛔ never moves it', async () => {
    tables.class_posts = [{ id: 'p1', class_id: CLASS_A, author_id: OTHER, body_en: 'Q?', created_at: '2026-09-24T09:00:00Z' }];
    expect((await (await get(CLASS_A)).json()).lines.map((l: { seat: number }) => l.seat)).toEqual([2, 3, 1]);
    // the oldest line falls out of the window: OPENER keeps seat 2, ME keeps 3
    tables.class_story_lines = [
      line('a', OPENER, 1),
      ...Array.from({ length: STORY_LINES_MAX }, (_, i) => ({ ...line(`m${String(i).padStart(3, '0')}`, i % 2 ? ME : OTHER, 2), created_at: new Date(Date.UTC(2026, 8, 24, 10, 2, i)).toISOString() })),
    ];
    const body = await (await get(CLASS_A)).json();
    expect(body.lines.some((l: { byOpener: boolean }) => l.byOpener)).toBe(false);
    expect(new Set(body.lines.filter((l: { mine: boolean }) => l.mine).map((l: { seat: number }) => l.seat))).toEqual(new Set([3]));
    expect(new Set(body.lines.filter((l: { mine: boolean }) => !l.mine).map((l: { seat: number }) => l.seat))).toEqual(new Set([1]));
  });

  it('an empty chain ⇒ empty list and it is my turn', async () => {
    tables.class_story_lines = [];
    expect(await (await get(CLASS_A)).json()).toEqual({ ok: true, amOpener: false, lines: [], myTurn: true });
  });

  it('non-member ⇒ 404 ⛔ not 403; no session ⇒ 401; missing table ⇒ 503 by name', async () => {
    expect((await get(CLASS_B)).status).toBe(404);
    expect((await get('nope')).status).toBe(404);
    failOn = 'class_story_lines';
    const r = await get(CLASS_A);
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ ok: false, code: 'classes_unavailable' });
    user = null;
    expect((await get(CLASS_A)).status).toBe(401);
  });
});

describe('POST /api/world/classes/[id]/story (T-478)', () => {
  it('a keyboard sentence ⇒ add_story_line with the saved form, and myTurn:false', async () => {
    const words = keyboardSentence();
    const r = await post(CLASS_A, { words });
    const body = await r.json();
    expect(r.status).toBe(200);
    expect(rpcCalls).toHaveLength(1);
    expect(rpcCalls[0]?.fn).toBe('add_story_line');
    expect(rpcCalls[0]?.args.p_class_id).toBe(CLASS_A);
    expect(body).toMatchObject({ ok: true, id: 'new', myTurn: false });
    expect(body.bodyEn).toMatch(/\.$/);
  });

  it('free text or no words ⇒ 422 not_from_keyboard, and ⛔ nothing is called', async () => {
    expect((await post(CLASS_A, { words: ['zzqx', 'blorp'] })).status).toBe(422);
    expect((await post(CLASS_A, { text: 'anything I want' })).status).toBe(422);
    expect(rpcCalls).toHaveLength(0);
  });

  it('the database says not_your_turn ⇒ 409 by name', async () => {
    rpcAnswer = { data: null, error: { message: 'not_your_turn', code: '42501' } };
    const r = await post(CLASS_A, { words: keyboardSentence() });
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({ ok: false, code: 'not_your_turn' });
  });

  it('the database fence says not_from_keyboard ⇒ 422; the function missing ⇒ 503 classes_unavailable', async () => {
    rpcAnswer = { data: null, error: { message: 'not_from_keyboard', code: '22023' } };
    expect((await post(CLASS_A, { words: keyboardSentence() })).status).toBe(422);
    rpcAnswer = { data: null, error: { message: 'Could not find the function', code: 'PGRST202' } };
    const r = await post(CLASS_A, { words: keyboardSentence() });
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ ok: false, code: 'classes_unavailable' });
  });

  it('non-member ⇒ 404 from the function', async () => {
    rpcAnswer = { data: null, error: { message: 'class_not_found', code: 'P0002' } };
    expect((await post(CLASS_A, { words: keyboardSentence() })).status).toBe(404);
  });
});
