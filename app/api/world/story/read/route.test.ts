import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const CODE = withoutComments(readFileSync('app/api/world/story/read/route.ts', 'utf8'));
const MIGRATION = readFileSync('supabase/migrations/0038_story_reads.sql', 'utf8');
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('T-493ⓑ — POST /api/world/story/read writes one row, and nothing else', () => {
  it('keeps the C-0032 guard order: env, then session, then the body', () => {
    expect(CODE.indexOf('readSupabaseEnv')).toBeLessThan(CODE.indexOf('auth.getUser'));
    expect(CODE.indexOf('auth.getUser')).toBeLessThan(CODE.indexOf('request.json'));
    expect(CODE.indexOf('request.json')).toBeLessThan(CODE.indexOf("from('story_reads')"));
  });

  it('a second read is ⛔ not an error — upsert that ignores duplicates', () => {
    expect(CODE).toContain('.upsert(');
    expect(CODE).toMatch(/onConflict:\s*'user_id,story_id'/);
    expect(CODE).toContain('ignoreDuplicates: true');
  });

  it('writes to story_reads ONLY — ⛔ no word_progress, ⛔ no review, ⛔ no score (D-053)', () => {
    expect(CODE.match(/\.from\('/g)).toHaveLength(1);
    expect(CODE).not.toMatch(/word_progress|review|easiness|next_review_at|\bscore\b|\bxp\b/i);
  });

  it('answers 401 session_expired and 400 for an id that is not a story', () => {
    expect(CODE).toMatch(/code:\s*'session_expired'\s*},\s*{\s*status:\s*401/);
    expect(CODE).toContain("'23503'");
    expect(CODE).toMatch(/code:\s*'bad_request'\s*},\s*{\s*status:\s*400/);
  });

  it('the raw PostgREST message goes to the log, ⛔ never to the body', () => {
    expect(CODE).not.toMatch(/NextResponse\.json\([^)]*error\.message/);
  });
});

describe('T-493ⓐ — 0038 is scoped to the learner by RLS', () => {
  it('enables RLS with select/insert of own rows only', () => {
    expect(MIGRATION).toMatch(/enable row level security/);
    expect(MIGRATION).toMatch(/for select to authenticated\s+using \(user_id = auth\.uid\(\)\)/);
    expect(MIGRATION).toMatch(/for insert to authenticated\s+with check \(user_id = auth\.uid\(\)\)/);
    expect(MIGRATION).not.toMatch(/for (update|delete|all)/);
  });

  it('one row per (learner, story)', () => {
    expect(MIGRATION).toMatch(/primary key \(user_id, story_id\)/);
  });

  it('the contract documents the endpoint', () => {
    expect(CONTRACT).toContain('## POST /api/world/story/read');
  });
});
