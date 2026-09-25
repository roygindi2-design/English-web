import { beforeEach, describe, expect, it, vi } from 'vitest';

/** T-510 — the library route against a fake Supabase client. */
const ME = '11111111-1111-4111-8111-111111111111';

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

const { GET } = await import('./route');

const story = (id: string, level: string, n: number) => ({
  id,
  cefr_level: level,
  title_en: `Story ${id}`,
  body_en: 'One two three four.',
  created_at: `2026-08-21T00:00:${String(n).padStart(2, '0')}Z`,
});

beforeEach(() => {
  user = { id: ME };
  failOn = null;
  tables = {
    profiles: [{ id: ME, current_level: 'A1' }],
    stories: [story('a1', 'A1', 1), story('a2', 'A1', 2), story('a3', 'A1', 3), story('b1', 'A2', 4), story('c1', 'C1', 5)],
    story_reads: [{ user_id: ME, story_id: 'a2' }, { user_id: 'someone-else', story_id: 'a1' }],
  };
});

describe('T-510 — GET /api/world/story/library', () => {
  it('⛔ no session ⇒ 401 session_expired, ⛔ not 500', async () => {
    user = null;
    const res = await GET();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ ok: false, code: 'session_expired' });
  });

  it('four levels in order; the learner’s read is `read`, another learner’s is ⛔ not', async () => {
    const body = await (await GET()).json();
    expect(body.ok).toBe(true);
    expect(body.level).toBe('A1');
    expect(body.levels.map((l: { level: string }) => l.level)).toEqual(['A1', 'A2', 'B1', 'B2']);
    const a1 = body.levels[0].items;
    expect(a1.map((i: { id: string }) => i.id)).toEqual(['a1', 'a2', 'a3']);
    expect(a1.find((i: { id: string }) => i.id === 'a2').status).toBe('read');
    expect(a1.filter((i: { status: string }) => i.status === 'today')).toHaveLength(1);
    expect(body.totals).toEqual({ stories: 4, read: 1 });
    expect(a1[0]).not.toHaveProperty('bodyEn');
  });

  it('⛔ no level ⇒ still a library, ⛔ nothing is `today`', async () => {
    tables.profiles = [{ id: ME, current_level: null }];
    const body = await (await GET()).json();
    expect(body.ok).toBe(true);
    expect(body.level).toBeNull();
    expect(body.levels.flatMap((l: { items: { status: string }[] }) => l.items).some((i: { status: string }) => i.status === 'today')).toBe(false);
  });

  it('a failed story_reads read is soft — everything unread, ⛔ not 503', async () => {
    failOn = 'story_reads';
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).totals.read).toBe(0);
  });

  it('a missing stories table ⇒ 503 schema_missing', async () => {
    failOn = 'stories';
    const res = await GET();
    expect(res.status).toBe(503);
    expect((await res.json()).code).toBe('schema_missing');
  });
});
