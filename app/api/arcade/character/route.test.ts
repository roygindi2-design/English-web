import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./route.ts', import.meta.url), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('PATCH /api/arcade/character — T-217 · D-152', () => {
  it('exports PATCH and nothing else — ⛔ no GET, no DELETE', () => {
    expect(CODE).toMatch(/export async function PATCH\(/);
    expect(CODE).not.toMatch(/export async function (GET|POST|DELETE)\(/);
  });

  it('guard order of C-0032: ENV ⇒ session ⇒ query', () => {
    const env = CODE.indexOf('readSupabaseEnv()');
    const user = CODE.indexOf('auth.getUser()');
    const write = CODE.indexOf(".from('arcade_progress')");
    expect(env).toBeGreaterThan(-1);
    expect(user).toBeGreaterThan(env);
    expect(write).toBeGreaterThan(user);
  });

  it('one table, one column: the upsert carries avatar_parts and user_id only', () => {
    expect(CODE).toMatch(
      /upsert\(\s*\{\s*user_id:[^}]*avatar_parts:[^}]*\}\s*,\s*\{\s*onConflict:\s*'user_id'\s*\}\s*\)/,
    );
    expect(CODE).not.toMatch(/arcade_level\s*:/);
    expect(CODE).not.toMatch(/wins\s*:/);
    expect(CODE).not.toMatch(/unlocked_items\s*:/);
  });

  it('the rule decides validity — ⛔ no inline list of the three keys', () => {
    expect(CODE).toContain('isArenaCharacter(');
    expect(CODE).toContain('withCharacter(');
    expect(CODE).not.toMatch(/\[\s*'wizard'/);
  });

  it('⛔ the arena never writes word_progress (37 § 13.1)', () => {
    expect(CODE).not.toContain('word_progress');
  });

  /**
   * ⚠️ The plan's regex counted every identifier string (`'arcade_progress'`,
   * `'user_id'`, error codes) as learner-facing text. What a learner can see is the
   * `fieldErrors` value and any `message:` — those are measured, ⛔ not the identifiers.
   */
  it('every learner-facing failure string is Hebrew', () => {
    const visible = [...CODE.matchAll(/(?:fieldErrors:\s*\{\s*\w+:|message:)\s*'([^']+)'/g)].map((m) => m[1]);
    expect(visible.length).toBeGreaterThan(0);
    for (const s of visible) expect(s).toMatch(/[א-ת]/);
  });
});
