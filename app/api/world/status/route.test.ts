import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * A source guard, same shape and same limits as app/api/study/queue/route.test.ts: the
 * vitest environment is node and there is no Supabase project here, so behaviour cannot be
 * reached. What it proves is the part that is otherwise believed rather than measured —
 * the guard order, the dedupe, and that the unlock is COMPUTED.
 */
const SRC = readFileSync('app/api/world/status/route.ts', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('GET /api/world/status', () => {
  it('checks ENV, then the session, and only then queries — the C-0032 order', () => {
    const env = CODE.indexOf('readSupabaseEnv');
    const session = CODE.indexOf('auth.getUser');
    const query = CODE.indexOf(".from('");
    expect(env).toBeGreaterThan(-1);
    expect(session).toBeGreaterThan(env);
    expect(query).toBeGreaterThan(session);
  });

  it('computes `unlocked` from the counts and ⛔ never from a flag or an env var', () => {
    expect(CODE).toContain('isWorldUnlocked');
    expect(CODE).not.toMatch(/unlocked\s*[:=]\s*(true|false)/);
    expect(CODE).not.toContain('WORLD_UNLOCKED');
  });

  it('owns the two thresholds HERE, as policy, and ⛔ does not import them from /lib/core', () => {
    expect(CODE).toMatch(/MIN_FUNCTION_WORDS\s*=\s*100/);
    expect(CODE).toMatch(/MIN_ACTIVE_WORDS\s*=\s*12/);
    expect(CODE).not.toMatch(/import[^;]*MIN_(FUNCTION|ACTIVE)_WORDS/);
  });

  it('counts UNIQUE headwords — words is unique(headword,pos), so rows overstate the bank', () => {
    // ⚠️ Measured, ⛔ not assumed: `toContain('uniqueHeadwords')` alone is BLIND. Replacing
    // the call with `(bank.data ?? []).length` leaves the import untouched and the whole
    // file still "contains" the name, so that assertion stayed green through the mutation
    // (C-0120). The bank count has to be read off the CALL SITE.
    expect(CODE).toMatch(/functionWords:\s*uniqueHeadwords\(/);
    expect(CODE).toMatch(/\.eq\('is_function_word',\s*true\)/);
  });

  it('counts the learner side from is_active_this_week, scoped to the caller', () => {
    expect(CODE).toMatch(/\.eq\('is_active_this_week',\s*true\)/);
    expect(CODE).toMatch(/\.eq\('user_id',\s*user\.id\)/);
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

  it('is dynamic — a cached unlock state is a wrong unlock state', () => {
    expect(CODE).toMatch(/export const dynamic\s*=\s*'force-dynamic'/);
  });
});
