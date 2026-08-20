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
    expect(CODE).toMatch(/\.eq\('lexical_class',\s*'function'\)/);
  });

  it('counts the learner side from is_active_this_week, scoped to the caller', () => {
    expect(CODE).toMatch(/\.eq\('is_active_this_week',\s*true\)/);
    expect(CODE).toMatch(/\.eq\('user_id',\s*user\.id\)/);
  });

  it('counts DISTINCT active headwords — a row count opens the gate early (F-040)', () => {
    // ⚠️ The unit on both sides of the predicate has to be the same one, and `word_progress`
    // is per-SENSE: a learner holding both senses of `can` has two rows and one headword.
    // `activeWords` used to be `active.count` off a `head: true` read, which is rows — and
    // the direction of that error is always inflation (count ≥ distinct), so the gate opened
    // BEFORE the learner knew MIN_ACTIVE_WORDS distinct words.
    //
    // ⚠️ Read off the CALL SITE, ⛔ not `toContain('uniqueHeadwords')` — F-039: the import
    // survives that mutation and a name-only assertion stays green through it.
    expect(CODE).toMatch(/activeWords:\s*uniqueHeadwords\(/);
    expect(CODE).toContain('words!inner(headword)');
  });

  it('⛔ never counts rows — no exact/head count survives in this file', () => {
    expect(CODE).not.toMatch(/head:\s*true/);
    expect(CODE).not.toMatch(/count:\s*'exact'/);
    expect(CODE).not.toMatch(/\.count\b/);
  });

  it('bounds BOTH reads — an unbounded row read is the price of counting distinctly', () => {
    // Two `.limit(MAX_BANK_ROWS)`, one per read. ⚠️ Truncation here can only UNDERSTATE a
    // learner far above the threshold, ⛔ never open the gate early, so the direction is safe.
    expect(CODE.match(/\.limit\(MAX_BANK_ROWS\)/g) ?? []).toHaveLength(2);
  });

  it('shares one flattener with app/api/world/bank/route.ts and ⛔ does not re-declare it', () => {
    expect(CODE).toContain('flattenJoinedHeadwords');
    expect(CODE).not.toMatch(/function\s+flattenJoined/);
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
