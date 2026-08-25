import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { handleContextTap } from './route';

const SRC = readFileSync('app/api/review/context/route.ts', 'utf8');
const BODY = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

/** D-084 · T-149ⓐ · T-187ⓕ — the six names, and the scan fails BY NAME. */
const BANNED = [
  'grade', 'easiness', 'interval_days', 'repetition',
  'next_review_at', 'self_marked_known',
];

describe('D-084 — a tap raises attempts and NOTHING else', () => {
  for (const field of BANNED) {
    it(`⛔ never writes ${field}`, () => {
      expect(BODY).not.toContain(field);
    });
  }

  it('⛔ never touches the decoupled arena table (D-052 · D-053)', () => {
    expect(BODY).not.toContain('arcade_collected_words');
  });

  it('one row per pair, ⛔ not one row per event (W4)', () => {
    expect(BODY).toMatch(/upsert|onConflict/);
  });

  it('the payload type itself has no grade — a field that does not exist cannot be written', () => {
    const wire = readFileSync('lib/core/contextTapRequest.ts', 'utf8');
    expect(wire).not.toContain('grade');
  });
});

/**
 * ⛔ The scan above proves the FILE does not name the six fields. This proves the ROW.
 * A source scan can only ever be a claim about text; the row a stubbed client receives is
 * the behaviour itself, and a word sitting at three consecutive correct answers must come
 * out of a tap exactly where it went in.
 */
function stubClient({
  existing,
  capture,
}: {
  existing: Record<string, unknown> | null;
  capture: (row: Record<string, unknown>) => void;
}) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: existing, error: null }),
          }),
        }),
      }),
      upsert: async (row: Record<string, unknown>) => {
        capture(row);
        return { error: null };
      },
    }),
  };
}

describe('D-084 — the row itself, ⛔ not the source text', () => {
  it('a word at three consecutive correct answers comes out exactly where it went in', async () => {
    const existing = { attempts: 7, repetition: 3, next_review_at: '2026-09-01T00:00:00Z' };
    const written: Record<string, unknown>[] = [];
    const supabase = stubClient({ existing, capture: (row) => written.push(row) });
    const result = await handleContextTap(supabase as never, 'user-1', 'word-1');

    expect(result).toEqual({ ok: true, attempts: 8 });
    expect(written).toHaveLength(1);
    expect(Object.keys(written[0] ?? {}).sort()).toEqual(['attempts', 'user_id', 'word_id']);
    expect(written[0]?.attempts).toBe(8);
    expect(existing.repetition).toBe(3);
    expect(existing.next_review_at).toBe('2026-09-01T00:00:00Z');
  });

  it('a word never met before starts at one attempt, ⛔ not zero', async () => {
    const written: Record<string, unknown>[] = [];
    const supabase = stubClient({ existing: null, capture: (row) => written.push(row) });
    await handleContextTap(supabase as never, 'user-1', 'word-2');
    expect(written[0]?.attempts).toBe(1);
  });
});
