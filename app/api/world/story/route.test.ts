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
