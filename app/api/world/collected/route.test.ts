import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const CODE = withoutComments(readFileSync('app/api/world/collected/route.ts', 'utf8'));
const MIGRATION = readFileSync('supabase/migrations/0039_collected_source.sql', 'utf8');
const ARENA = withoutComments(readFileSync('app/api/arcade/result/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('T-495ⓑ — a tapped story word enters the collection, and nothing else moves', () => {
  it('keeps the C-0032 guard order: env, then session, then the body', () => {
    expect(CODE.indexOf('readSupabaseEnv')).toBeLessThan(CODE.indexOf('auth.getUser'));
    expect(CODE.indexOf('auth.getUser')).toBeLessThan(CODE.indexOf('request.json'));
    expect(CODE.indexOf('request.json')).toBeLessThan(CODE.indexOf("from('arcade_collected_words')"));
  });

  it("writes source='story' with on-conflict-do-nothing — the first source is kept", () => {
    expect(CODE).toContain("source: 'story'");
    expect(CODE).toMatch(/onConflict:\s*'user_id,word_id'/);
    expect(CODE).toContain('ignoreDuplicates: true');
  });

  it('⛔ touches one table only — no word_progress, no review, no counters (D-052 · D-053)', () => {
    expect(CODE.match(/\.from\('/g)).toHaveLength(1);
    expect(CODE).not.toMatch(/word_progress|review|times_missed|times_correct|easiness|next_review_at/);
  });

  it('answers 401 session_expired and 400 bad_request', () => {
    expect(CODE).toMatch(/code:\s*'session_expired'\s*},\s*{\s*status:\s*401/);
    expect(CODE).toContain("'23503'");
    expect(CODE).toMatch(/code:\s*'bad_request'\s*},\s*{\s*status:\s*400/);
  });
});

describe('T-495ⓐ — the column, and the arena ⛔ never overwrites it', () => {
  it("defaults existing rows to 'arena' and allows only arena|story", () => {
    expect(MIGRATION).toMatch(/add column if not exists source text not null default 'arena'/);
    expect(MIGRATION).toMatch(/check \(source in \('arena', 'story'\)\)/);
  });

  it('the arena write never names the source column', () => {
    expect(ARENA).not.toMatch(/\bsource\b/);
  });

  it('the contract documents the endpoint', () => {
    expect(CONTRACT).toContain('## POST /api/world/collected');
  });
});
