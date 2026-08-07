import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { LEARNER_TIME_ZONE, toIsoDateInZone } from '@/lib/core/onboarding';
import { applyGrade, newWordProgress, type WordProgress } from '@/lib/core/progress';
import { checkReviewPayload } from '@/lib/core/reviewRequest';
import { INITIAL_EASINESS, scheduleReview, type SchedulerState } from '@/lib/core/scheduler';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

/**
 * HEURISTIC — product parameters, not evidence. They live HERE and not in
 * /lib/core on purpose: no source we hold fixes either number, and a constant
 * exported from the pure layer would be cited later as if the layer had derived
 * it. Both are policy arguments the caller owns (see SchedulingPolicy and
 * MasteryPolicy), and this route is the caller. They move when we have measured
 * data, and nothing in lib/core changes when they do.
 */
const MASTERY_CONSECUTIVE_CORRECT = 3;
const TRIAGE_MIN_USABLE_DAYS = 3;

type ProgressRow = {
  attempts: number | null;
  correct_attempts: number | null;
  consecutive_correct_recognition: number | null;
  time_to_first_correct: number | null;
  attempts_to_mastery: number | null;
  first_seen_at: string | null;
  mastered_at: string | null;
  easiness: number | string | null;
  interval_days: number | null;
  repetition: number | null;
};

const PROGRESS_COLUMNS =
  'attempts, correct_attempts, consecutive_correct_recognition, time_to_first_correct, ' +
  'attempts_to_mastery, first_seen_at, mastered_at, easiness, interval_days, repetition';

function epochMs(value: string | null, fallbackMs: number): number {
  if (typeof value !== 'string') return fallbackMs;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : fallbackMs;
}

/** The stored row as the pure layer's shape. Nullable columns are the DB's way of
 *  saying "unknown"; only the two D-010 fields are allowed to STAY unknown. */
function toWordProgress(row: ProgressRow, firstSeenFallbackMs: number): WordProgress {
  return {
    attempts: row.attempts ?? 0,
    correctAttempts: row.correct_attempts ?? 0,
    consecutiveCorrectRecognition: row.consecutive_correct_recognition ?? 0,
    timeToFirstCorrectMs: row.time_to_first_correct === null ? null : Number(row.time_to_first_correct),
    attemptsToMastery: row.attempts_to_mastery === null ? null : Number(row.attempts_to_mastery),
    firstSeenAtMs: epochMs(row.first_seen_at, firstSeenFallbackMs),
    masteredAtMs: row.mastered_at === null ? null : epochMs(row.mastered_at, firstSeenFallbackMs),
  };
}

/** numeric(4,2) arrives from PostgREST as a string on some driver paths — Number()
 *  it, and fall back to the SM-2 seed rather than letting NaN reach the scheduler,
 *  which would throw on a learner's answer. */
function toSchedulerState(row: ProgressRow): SchedulerState {
  const easiness = Number(row.easiness);
  return {
    easiness: Number.isFinite(easiness) && easiness > 0 ? easiness : INITIAL_EASINESS,
    intervalDays: row.interval_days ?? 0,
    repetition: row.repetition ?? 0,
  };
}

/** POST /api/review — see docs/api-contract.md */
export async function POST(request: Request) {
  const env = readSupabaseEnv();
  if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Session BEFORE the body is read or validated (the C-0032 pattern): an
  // unauthenticated caller learns nothing about which fields we accept.
  if (!user) return NextResponse.json({ ok: false, code: 'session_expired' }, { status: 401 });

  const check = checkReviewPayload(await request.json().catch(() => null));
  if (!check.ok) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 400 });
  const payload = check.payload;

  // The ONLY point in this flow that touches the clock. Everything downstream is a
  // pure function of these two values, and `today` is the learner's calendar day,
  // not the server's — Israel is UTC+2/+3, so for the first hours of a local day
  // the UTC date is still YESTERDAY, and the scheduler would compute the exam
  // horizon one day long (C-0032).
  const nowMs = Date.now();
  const today = toIsoDateInZone(new Date(nowMs), LEARNER_TIME_ZONE);

  const [progressResult, profileResult] = await Promise.all([
    supabase
      .from('word_progress')
      .select(PROGRESS_COLUMNS)
      .eq('user_id', user.id)
      .eq('word_id', payload.wordId)
      .maybeSingle(),
    supabase.from('profiles').select('exam_date').eq('id', user.id).maybeSingle(),
  ]);

  if (progressResult.error || profileResult.error) {
    return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });
  }

  const row = progressResult.data as ProgressRow | null;
  // A word answered for the first time was first seen when this card was shown,
  // which is `elapsedMs` ago — not now. Anchoring first exposure at `nowMs` would
  // make time_to_first_correct exactly 0 for every word learned on first sight,
  // and 0 is a measurement, not "instant".
  const firstSeenAtMs = nowMs - payload.elapsedMs;
  const current = row === null ? newWordProgress(firstSeenAtMs) : toWordProgress(row, firstSeenAtMs);
  const state = row === null ? { easiness: INITIAL_EASINESS, intervalDays: 0, repetition: 0 } : toSchedulerState(row);

  const nextProgress = applyGrade(
    current,
    { grade: payload.grade, direction: payload.direction, answeredAtMs: nowMs },
    { masteryConsecutiveCorrect: MASTERY_CONSECUTIVE_CORRECT },
  );

  const examDate = (profileResult.data?.exam_date as string | null | undefined) ?? null;
  const schedule = scheduleReview({
    state,
    grade: payload.grade,
    today,
    examDate,
    policy: { triageMinUsableDays: TRIAGE_MIN_USABLE_DAYS },
  });

  // nextReviewDate is a calendar day in the learner's zone; the column is
  // timestamptz. Anchor it at the START of that UTC day rather than at `nowMs`,
  // so "due today" means the whole day and not "due again at this exact minute".
  const nextReviewAt = `${schedule.nextReviewDate}T00:00:00.000Z`;
  const nowIso = new Date(nowMs).toISOString();

  const writable = {
    attempts: nextProgress.attempts,
    correct_attempts: nextProgress.correctAttempts,
    consecutive_correct_recognition: nextProgress.consecutiveCorrectRecognition,
    time_to_first_correct: nextProgress.timeToFirstCorrectMs,
    attempts_to_mastery: nextProgress.attemptsToMastery,
    mastered_at: nextProgress.masteredAtMs === null ? null : new Date(nextProgress.masteredAtMs).toISOString(),
    easiness: schedule.next.easiness,
    interval_days: schedule.next.intervalDays,
    repetition: schedule.next.repetition,
    next_review_at: nextReviewAt,
    updated_at: nowIso,
  };

  // update on an existing row, insert on a missing one — NOT upsert (D-016).
  // An upsert would have to restate track_id, and a second place where the
  // default lives is a second place for it to be wrong.
  const { error } =
    row === null
      ? await supabase.from('word_progress').insert({
          user_id: user.id,
          word_id: payload.wordId,
          first_seen_at: new Date(firstSeenAtMs).toISOString(),
          ...writable,
        })
      : await supabase
          .from('word_progress')
          .update(writable)
          .eq('user_id', user.id)
          .eq('word_id', payload.wordId);

  if (error) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });

  // Deliberately NOT the level-gate state: unlocking is a different route with a
  // different read (a whole batch at once), and answering it here would make every
  // single card pay for a query the card does not need.
  return NextResponse.json({
    ok: true,
    next_review_at: nextReviewAt,
    mode: schedule.mode,
    triage: schedule.triage,
  });
}
