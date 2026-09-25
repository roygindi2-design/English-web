import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/api/world/story/route.ts', 'utf8');

describe('T-185ⓒ — a soft read, ⛔ never a 503 over "no stories"', () => {
  it('answers no_stories with 200 and ok:false', () => {
    expect(SRC).toMatch(/code:\s*'no_stories'/);
    const block = SRC.slice(SRC.indexOf("'no_stories'"));
    expect(block.slice(0, 200)).not.toMatch(/status:\s*503/);
  });

  it('keeps the C-0032 guard order: env, then session, then query', () => {
    expect(SRC.indexOf('readSupabaseEnv')).toBeLessThan(SRC.indexOf('auth.getUser'));
    expect(SRC.indexOf('auth.getUser')).toBeLessThan(SRC.indexOf("from('stories')"));
  });

  it('⛔ filters level on words.cefr_profile_band, ⛔ never senses.cefr_level', () => {
    expect(SRC).toContain('cefr_profile_band');
    expect(SRC).not.toMatch(/senses[^\n]*cefr_level/);
  });

  it('⛔ contains no Math.random — the pick is the pure layer’s job', () => {
    expect(SRC).not.toContain('Math.random');
  });
});

describe('T-493ⓒ — the skip list is story_reads, ⛔ never a query parameter', () => {
  const CODE = SRC.replace(/\/\/[^\n]*/g, '');
  it('reads the learner’s own story_reads', () => {
    expect(CODE).toContain("from('story_reads')");
    expect(CODE).toMatch(/from\('story_reads'\)[\s\S]{0,80}\.eq\('user_id', user\.id\)/);
  });

  it('⛔ no ?read= — a value the client controls is not a source of truth', () => {
    expect(CODE).not.toMatch(/searchParams/);
    expect(CODE).not.toMatch(/get\('read'\)/);
  });
});
