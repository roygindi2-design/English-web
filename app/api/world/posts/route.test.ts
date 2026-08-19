import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/world/posts/route.ts', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/** The balanced-brace region opened by `open`, `open` included — the C-0100 lesson reused:
 *  a character-distance regex convicts correct code the moment an unrelated line moves. */
function braceRegion(source: string, open: string): string {
  const start = source.indexOf(open);
  expect(start, `expected ${open}`).toBeGreaterThan(-1);
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  throw new Error(`unbalanced braces after ${open}`);
}

describe('POST /api/world/posts — the publish rule', () => {
  it('checks ENV, then the session, and only then reads the body', () => {
    const env = CODE.indexOf('readSupabaseEnv');
    const session = CODE.indexOf('auth.getUser');
    const body = CODE.indexOf('request.json');
    expect(session).toBeGreaterThan(env);
    expect(body).toBeGreaterThan(session);
  });

  it('enforces the target word ON THE SERVER (§ 4.2ה) and ⛔ does not trust the button', () => {
    // ⚠️ MEASURED C-0120 · re-confirmed C-0122, ⛔ not assumed: `toContain('checkPostPayload')`
    // is BLIND — the `import` line alone satisfies it, so a mutation that swaps the pure
    // check for a bare truthy test stays green. Read it off the CALL SITE, and off the
    // branch that the call's verdict actually drives.
    expect(CODE).toMatch(/checkPostPayload\(/);
    expect(CODE).toMatch(/reason\s*===\s*'target_missing'/);
    expect(CODE).toContain('target_missing');
  });

  it('answers the missing target with guidance and ⛔ never with a grade', () => {
    expect(CODE).toContain('כדי לפרסם');
    for (const forbidden of ['נכון', 'יפה', 'שגוי', 'טעות', 'ציון']) {
      expect(CODE, `R-016: "${forbidden}" must not appear`).not.toContain(forbidden);
    }
  });

  it('renders the body through the pure layer — ⛔ no join() in the route', () => {
    // Same C-0120 lesson: the call site, ⛔ not the name. And the rendered value is what
    // reaches the column — `body_en: renderDraft(...)`, not a string built beside it.
    expect(CODE).toMatch(/body_en:\s*renderDraft\(/);
    expect(CODE).not.toMatch(/tokens\.join/);
  });

  it('writes author_kind=learner and generation_run_id=null in the SAME object', () => {
    const insert = braceRegion(CODE, '.insert(');
    expect(insert).toContain("author_kind: 'learner'");
    expect(insert).toContain('generation_run_id: null');
    expect(insert).toMatch(/user_id:\s*user\.id/);
  });

  it('⛔ writes to no table but world_posts — not senses, not words, not word_progress', () => {
    const tables = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(tables)].sort()).toEqual(['world_posts']);
  });

  it('⛔ contains none of the scheduling columns — publishing is not a review (D-033)', () => {
    for (const column of ['easiness', 'interval_days', 'repetition', 'next_review_at', 'reps']) {
      expect(CODE, `${column} must be absent from this file`).not.toContain(column);
    }
  });

  it('⛔ never reads or writes senses.cefr_level (D-034)', () => {
    expect(CODE).not.toContain('cefr_level');
  });
});

describe('GET /api/world/posts — the private feed', () => {
  it('scopes to the caller AND to what the caller wrote, and orders newest first', () => {
    const get = braceRegion(CODE, 'export async function GET');
    expect(get).toMatch(/\.eq\('user_id',\s*user\.id\)/);
    // 0007 designed this table for generated rows too, so `user_id` alone is NOT the private
    // feed — the day a character posts, an unfiltered feed shows it as the learner's own
    // sentence. Measured below by mutation, ⛔ not assumed.
    expect(get).toMatch(/\.eq\('author_kind',\s*'learner'\)/);
    expect(get).toMatch(/\.order\('created_at',\s*\{\s*ascending:\s*false/);
  });

  it('answers an empty feed with 200 — "you have not written yet" is a state, not an error', () => {
    const get = braceRegion(CODE, 'export async function GET');
    expect(get).not.toContain('404');
  });

  it('answers `count` — an EXACT table count, ⛔ not the size of this response (T-106)', () => {
    const get = braceRegion(CODE, 'export async function GET');
    // ⚠️ `toContain('count')` alone is BLIND — a type name satisfies it. Read it off the
    // query that produces it: a HEAD read with `count: 'exact'` is the only shape that can
    // answer "ever" without the MAX_FEED_ROWS ceiling silently capping the number.
    expect(get).toMatch(/count:\s*'exact'/);
    expect(get).toMatch(/head:\s*true/);
    // ⛔ And it is scoped exactly like the feed read — both filters, twice. Dropping
    // `author_kind` from the counting query would count a character's post as the
    // learner's own sentence, which is the very thing 0010 exists to prevent.
    expect([...get.matchAll(/\.eq\('author_kind',\s*'learner'\)/g)]).toHaveLength(2);
    expect([...get.matchAll(/\.eq\('user_id',\s*user\.id\)/g)]).toHaveLength(2);
  });

  it('⛔ `total` did NOT change meaning — it is still the size of THIS response', () => {
    const get = braceRegion(CODE, 'export async function GET');
    const body = get.slice(get.lastIndexOf('NextResponse.json('));
    expect(body).toMatch(/total:\s*posts\.length/);
    // The new field is ADDITIVE: both are in the same answer, and ⛔ neither replaces the
    // other. A consumer reading `total` on the day this shipped reads the same number it
    // read the day before.
    expect(body).toMatch(/\bcount\b/);
  });

  it('⛔ never puts the database message in the response body', () => {
    for (const line of CODE.split('\n')) {
      if (line.includes('error.message')) expect(line).toContain('console.error');
    }
  });
});
