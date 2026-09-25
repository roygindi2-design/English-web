import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * T-510ⓒ — `GET /api/world/story?id=<uuid>` against a fake Supabase client.
 * The row's failure scenario: tapping a READ story in the library must open THAT story,
 * ⛔ not the day's pick.
 */
const ME = '11111111-1111-4111-8111-111111111111';
const A1_1 = 'aaaaaaaa-0000-4000-8000-000000000001';
const A1_2 = 'aaaaaaaa-0000-4000-8000-000000000002';
const A2_1 = 'bbbbbbbb-0000-4000-8000-000000000001';

type Row = Record<string, unknown>;
let tables: Record<string, Row[]>;
let user: { id: string } | null;

function builder(table: string) {
  let rows = [...(tables[table] ?? [])];
  let single = false;
  let limit = Infinity;
  const b = {
    select: () => b,
    eq: (col: string, v: unknown) => { rows = rows.filter((r) => r[col] === v); return b; },
    in: (col: string, vs: unknown[]) => { rows = rows.filter((r) => vs.includes(r[col])); return b; },
    order: () => b,
    limit: (n: number) => { limit = n; return b; },
    maybeSingle: () => { single = true; return b; },
    then: (res: (v: unknown) => void) => {
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
const call = (qs = '') => GET(new Request(`http://x/api/world/story${qs}`));

const story = (id: string, level: string, n: number, title: string) => ({
  id,
  cefr_level: level,
  title_en: title,
  body_en: 'The river is near the library.',
  created_at: `2026-08-21T00:00:0${n}Z`,
});

beforeEach(() => {
  user = { id: ME };
  tables = {
    profiles: [{ id: ME, current_level: 'A1' }],
    stories: [story(A1_1, 'A1', 1, 'First'), story(A1_2, 'A1', 2, 'Second'), story(A2_1, 'A2', 3, 'Up')],
    story_reads: [{ user_id: ME, story_id: A1_1 }, { user_id: ME, story_id: A1_2 }],
    words: [],
    word_progress: [],
    story_questions: [],
  };
});

describe('T-510ⓒ — ?id= opens THAT story', () => {
  it('a read story opens itself, ⛔ not the day’s pick', async () => {
    for (const id of [A1_1, A1_2]) {
      const body = await (await call(`?id=${id}`)).json();
      expect(body.ok).toBe(true);
      expect(body.story.id).toBe(id);
      expect(body.level).toBe('A1');
    }
    const second = await (await call(`?id=${A1_2}`)).json();
    expect([second.index, second.total]).toEqual([2, 2]);
  });

  it('a story from another level opens, at ITS level', async () => {
    const body = await (await call(`?id=${A2_1}`)).json();
    expect(body.story.id).toBe(A2_1);
    expect(body.level).toBe('A2');
    expect([body.index, body.total]).toEqual([1, 1]);
  });

  it('a malformed or unknown id falls back to the day’s pick, ⛔ not 404', async () => {
    for (const qs of ['?id=not-a-uuid', '?id=cccccccc-0000-4000-8000-000000000009', '']) {
      const res = await call(qs);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.level).toBe('A1');
      expect([A1_1, A1_2]).toContain(body.story.id);
    }
  });

  it('⛔ no session ⇒ 401 session_expired, whatever the id', async () => {
    user = null;
    const res = await call(`?id=${A1_1}`);
    expect(res.status).toBe(401);
    expect((await res.json()).code).toBe('session_expired');
  });
});
