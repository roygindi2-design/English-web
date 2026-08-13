import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  clampQueueLimit,
  isUnknownRow,
  parseDeckName,
  selectDeck,
  toQueueCardInput,
  type QueueRow,
} from '@/lib/core/deck';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * HEURISTIC — a product parameter, not evidence. It lives HERE and not in /lib/core for
 * the same reason MASTERY_CONSECUTIVE_CORRECT does in app/api/review/route.ts: no source
 * we hold fixes the number, and a constant exported from the pure layer would later be
 * cited as if that layer had derived it. `directionFor` takes it as a policy argument,
 * and this route is the caller that owns the policy.
 */
const PROMOTE_AFTER_CONSECUTIVE_CORRECT = 3;

/**
 * A hard ceiling on rows read, ⛔ not the learner's `limit`. `limit` decides how many cards
 * travel; this decides how much we are willing to pull before the pure layer orders them.
 * Without it a learner with thousands of progress rows would pay for the whole history on
 * every queue open, to show at most 50 cards.
 */
const MAX_QUEUE_ROWS = 200;

/**
 * One query for the whole deck. `words!inner` is deliberate: a progress row whose word was
 * deleted is not a card, and an outer join would surface it as a row with nothing to show.
 * RLS on `senses` (0002/0003) already drops `translation_confidence = 'low'` server-side —
 * D-013 is enforced there, ⛔ and is not restated here as a second, divergent rule.
 */
const PROGRESS_SELECT =
  'word_id, attempts, correct_attempts, repetition, consecutive_correct_recognition, next_review_at, ' +
  'words!inner(headword, cefr_profile_band, ' +
  'senses(sense_index, translation_he, needs_human_review, sense_examples(kind, text_en)))';

type ExampleRow = { kind: string | null; text_en: string | null };

type SenseRow = {
  sense_index: number | null;
  translation_he: string | null;
  needs_human_review: boolean | null;
  sense_examples: ExampleRow[] | null;
};

type WordRow = {
  headword: string | null;
  cefr_profile_band: string | null;
  senses: SenseRow[] | null;
};

type ProgressJoinRow = {
  word_id: string;
  attempts: number | null;
  correct_attempts: number | null;
  repetition: number | null;
  consecutive_correct_recognition: number | null;
  next_review_at: string | null;
  words: WordRow | WordRow[] | null;
};

/** PostgREST returns an embedded many-to-one as an object on some paths and as a
 *  single-element array on others. Normalising here keeps the shape question out of
 *  the flattening logic below. */
function firstOf(value: WordRow | WordRow[] | null): WordRow | null {
  if (value === null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/** `null` = never scheduled, ⛔ which is not the same as "not due". The pure layer sorts
 *  those to the end of their band rather than treating them as due at epoch 0. */
function epochMs(value: string | null): number | null {
  if (typeof value !== 'string') return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: string | null | undefined): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * D-021 — the row is a SENSE, not a word, so a word with three senses still yields one
 * card. The chosen one is the lowest `sense_index` that a card can actually be built
 * from: `buildCard` throws on empty `translationHe`, and a 500 on a malformed card is a
 * bug, ⛔ not a guard. A sense with no usable translation is skipped, and a word with no
 * usable sense at all drops out of the queue entirely.
 */
function pickSense(word: WordRow): SenseRow | null {
  const usable = (word.senses ?? []).filter((sense) => text(sense.translation_he) !== '');
  if (usable.length === 0) return null;
  const ordered = [...usable].sort(
    (a, b) => (a.sense_index ?? Number.MAX_SAFE_INTEGER) - (b.sense_index ?? Number.MAX_SAFE_INTEGER),
  );
  return ordered[0] ?? null;
}

function exampleOf(sense: SenseRow, kind: 'supportive' | 'neutral'): string {
  const hit = (sense.sense_examples ?? []).find((example) => example.kind === kind);
  return text(hit?.text_en);
}

/** The join shape → the pure layer's shape. `null` means "this row cannot become a card",
 *  and the caller drops it silently: a missing sentence is a degraded card, but a missing
 *  headword or translation is no card at all. */
function toQueueRow(row: ProgressJoinRow): QueueRow | null {
  const word = firstOf(row.words);
  if (word === null) return null;

  const headword = text(word.headword);
  if (headword === '') return null;

  const sense = pickSense(word);
  if (sense === null) return null;

  return {
    wordId: row.word_id,
    headword,
    translationHe: text(sense.translation_he),
    examples: {
      supportive: exampleOf(sense, 'supportive'),
      neutral: exampleOf(sense, 'neutral'),
    },
    needsHumanReview: sense.needs_human_review === true,
    cefrProfileBand: word.cefr_profile_band ?? null,
    nextReviewAtMs: epochMs(row.next_review_at),
    attempts: row.attempts ?? 0,
    repetition: row.repetition ?? 0,
    consecutiveCorrectRecognition: row.consecutive_correct_recognition ?? 0,
  };
}

/** GET /api/study/queue — see docs/api-contract.md */
export async function GET(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Session BEFORE any query parameter is read (the C-0032 pattern): an unauthenticated
  // caller learns nothing about which decks or limits this endpoint accepts.
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const params = new URL(request.url).searchParams;
  const deck = parseDeckName(params.get('deck'));
  // An unknown deck name is a 400, ⛔ never a silent fallback to a deck the learner did
  // not ask for — `sentences` is blocked by D-035 and must read as blocked, not as empty.
  if (deck === null) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  const limit = clampQueueLimit(params.get('limit'));

  let query = supabase
    .from('word_progress')
    .select(PROGRESS_SELECT)
    .eq('user_id', user.id)
    .limit(MAX_QUEUE_ROWS);

  // The ONLY clock reading in this flow, and it applies to one deck. «לא ידעתי» is a
  // count predicate (`attempts > 0 AND repetition = 0`), ⛔ not a date one — filtering it
  // by `next_review_at` would hide exactly the words the learner just failed.
  if (deck === 'due') {
    query = query.lte('next_review_at', new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) {
    // The raw string goes to the server log and ⛔ never into the response body — same
    // requirement as T-053: a PostgREST message names columns and tables.
    console.error('[api/study/queue] query failed:', error.message);
    const code = (error as { code?: string }).code;
    if (code === '42P01' || code === 'PGRST205') {
      return NextResponse.json(
        { ok: false, code: 'schema_missing', message: 'המאגר עדיין לא הוקם' },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  const rows = ((data ?? []) as unknown as ProgressJoinRow[])
    .map(toQueueRow)
    .filter((row): row is QueueRow => row !== null);

  // `total` is counted AFTER the deck predicate and BEFORE the cut, so the tab counter can
  // say "12 waiting" while the screen holds 20 cards at a time.
  const filtered = deck === 'unknown' ? rows.filter(isUnknownRow) : rows;
  const cards = selectDeck(filtered, deck, limit).map((row) =>
    toQueueCardInput(row, PROMOTE_AFTER_CONSECUTIVE_CORRECT),
  );

  // An empty queue is a 200 with zero cards — ⛔ not a 404 and ⛔ not a 503. "You are done
  // for today" is a state of the product, and the screen renders it; an error status here
  // would make the finished learner look like a broken server.
  return NextResponse.json({ ok: true, deck, total: filtered.length, cards });
}
