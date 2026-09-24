import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * A source guard, same shape and same limits as app/api/world/status/route.test.ts: the
 * vitest environment is node and there is no Supabase project here, so behaviour cannot be
 * reached. What it proves is the part that is otherwise believed rather than measured —
 * the guard order, the dedupe, the deterministic target, and that a failed `usedWords` read
 * does ⛔ not fail the request.
 */
const SRC = readFileSync('app/api/world/bank/route.ts', 'utf8');
const CODE = withoutComments(SRC);

describe('GET /api/world/bank', () => {
  it('checks ENV, then the session, and only then queries — the C-0032 order', () => {
    const env = CODE.indexOf('readSupabaseEnv');
    const session = CODE.indexOf('auth.getUser');
    const query = CODE.indexOf(".from('");
    expect(env).toBeGreaterThan(-1);
    expect(session).toBeGreaterThan(env);
    expect(query).toBeGreaterThan(session);
  });

  it('groups BOTH bank groups by headword and ⛔ not by sense (§ 4.2ה — 12 measured duplicates)', () => {
    // ⚠️ MEASURED C-0120, ⛔ not assumed: `toContain('uniqueHeadwords')` is BLIND — the
    // `import` line alone satisfies it, so a mutation that drops the call stays green.
    // Read the dedupe off the CALL SITES, one per group.
    expect(CODE).toMatch(/functionWords:\s*uniqueHeadwords\(/);
    expect(CODE).toMatch(/activeWords\s*=\s*uniqueHeadwords\(/);
    expect(CODE).toMatch(/\.eq\('lexical_class',\s*'function'\)/);
  });

  it('reads the learner group from is_active_this_week, ⛔ not the whole vocabulary', () => {
    expect(CODE).toMatch(/\.eq\('is_active_this_week',\s*true\)/);
    expect(CODE).toMatch(/\.eq\('user_id',\s*user\.id\)/);
  });

  it('joins the learner group with words!inner — an orphan progress row is ⛔ not a blank chip', () => {
    expect(CODE).toContain('words!inner(headword)');
  });

  it('picks the target in the pure layer — deterministic, ⛔ no Math.random and ⛔ no clock', () => {
    expect(CODE).toMatch(/target:\s*pickTargetWord\(/);
    expect(CODE).not.toContain('Math.random');
    expect(CODE).not.toContain('Date.now');
    expect(CODE).not.toContain('new Date');
  });

  it('reads only the learner\'s OWN posts for usedWords, and only learner-written ones', () => {
    expect(CODE).toMatch(/\.from\('world_posts'\)/);
    expect(CODE).toMatch(/\.eq\('author_kind',\s*'learner'\)/);
  });

  it('⛔ does NOT fail the request when the usedWords read fails — a 503 over an optimisation blanks a screen', () => {
    // The two REQUIRED reads return early on error; the third must not. Measured by
    // counting the early returns: exactly two `schemaAwareFailure` returns exist.
    const failures = CODE.match(/return\s+schemaAwareFailure\(/g) ?? [];
    expect(failures).toHaveLength(2);
    expect(CODE).toMatch(/used\.error\s*\?\s*\[\]/);
  });

  it('⛔ never reads senses.cefr_level (D-034)', () => {
    expect(CODE).not.toContain('cefr_level');
  });

  it('answers a missing schema with 503 in Hebrew, ⛔ not 500 and ⛔ not an empty screen', () => {
    expect(CODE).toContain('42P01');
    expect(CODE).toContain('PGRST205');
    expect(CODE).toContain('schema_missing');
    expect(CODE).toContain('המאגר עדיין לא הוקם');
  });

  it('⛔ never puts the database message in the response body', () => {
    for (const line of CODE.split('\n')) {
      if (line.includes('error.message')) {
        expect(line, `error.message escapes on: ${line.trim()}`).toContain('console.error');
      }
    }
  });

  it('is dynamic — a cached bank is a wrong bank the day a word goes active', () => {
    expect(CODE).toMatch(/export const dynamic\s*=\s*'force-dynamic'/);
  });
});
