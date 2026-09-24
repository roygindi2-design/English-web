import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { handleContextTap } from './route';
import { withoutComments } from '@/lib/testSource';

const SRC = readFileSync('app/api/review/context/route.ts', 'utf8');
const BODY = withoutComments(SRC);

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

/**
 * T-238 — root cause: `word_progress`'s real primary key (as created in
 * `0003b_provenance_telemetry.sql`, never altered since — grepped across every
 * migration in this clone) is `(user_id, word_id)`. PostgREST's `upsert` rejects an
 * `onConflict` target that does not name an existing unique/exclusion constraint
 * with error 42P10 — so an `onConflict` naming a third column that is not part of
 * any constraint fails on EVERY call, in production, and the route's own
 * `failureFor()` turns that into a swallowed `{ ok: false }` the client never reads
 * (`components/StoryScreen.tsx` does `.catch(() => {})` on a discarded promise).
 * This is why a word tapped in a story never reaches `word_progress` for the
 * learner. Fixed at the source (`CONFLICT_KEY`), and guarded here so it cannot
 * silently drift from the real schema again.
 */
describe('T-238 — the upsert target matches the real primary key, not an aspirational one', () => {
  it('onConflict names exactly the columns of the live word_progress primary key', () => {
    const migration = readFileSync('supabase/migrations/0003b_provenance_telemetry.sql', 'utf8');
    const tableBody = migration.match(
      /create table if not exists public\.word_progress \(([\s\S]*?)\n\);/,
    )?.[1];
    if (tableBody === undefined) throw new Error('word_progress table definition not found');

    const pkList = tableBody.match(/primary key \(([^)]+)\)/)?.[1];
    if (pkList === undefined) throw new Error('primary key clause not found on word_progress');
    const pkColumns = pkList
      .split(',')
      .map((c) => c.trim())
      .sort();

    const conflictList = SRC.match(/CONFLICT_KEY\s*=\s*'([^']+)'/)?.[1];
    if (conflictList === undefined) throw new Error('CONFLICT_KEY not found in route source');
    const conflictColumns = conflictList
      .split(',')
      .map((c) => c.trim())
      .sort();

    expect(conflictColumns).toEqual(pkColumns);
  });

  it('the actual upsert call receives that same onConflict value', async () => {
    let seenOnConflict: string | undefined;
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: async () => ({ data: null, error: null }),
            }),
          }),
        }),
        upsert: async (_row: Record<string, unknown>, options: { onConflict: string }) => {
          seenOnConflict = options.onConflict;
          return { error: null };
        },
      }),
    };
    await handleContextTap(supabase as never, 'user-1', 'word-3');
    expect(seenOnConflict).toBe('user_id,word_id');
  });
});

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
