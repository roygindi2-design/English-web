/**
 * PURE. No React, no DOM, no clock, no env. Engine 7.7 of plan/70-engines.md.
 *
 * The gate applies to a BATCH of 50-100 words, not to a whole level. W1: the old
 * "100% of every word in the level" rule contradicted 7.1 outright — in triage
 * only at-risk words are shown, so full level exposure is NEVER reached, and the
 * gate locked exactly the learner who most needed to advance.
 *
 * "Seen" is not "mastered": mastery is measured by the test itself and is not an
 * input here. Unleveled words (level_id = NULL, origin='unleveled') never enter a
 * batch at all — plan/15-syllabus-digest.md, ingestion rule 1.
 *
 * Enforcement is server-side (7.7). A UI that hides the button is not a gate.
 */
export const BATCH_MIN_WORDS = 50;
export const BATCH_MAX_WORDS = 100;

export const TRIAGE_NOTICE_HE = 'מצב מבחן: מתמקדים במה שיזיז לך את הציון';

export interface BatchWord {
  readonly wordId: string;
  /** Non-nullable on purpose: an unleveled word cannot be typed into a batch. */
  readonly levelId: string;
  readonly seen: boolean;
}

export interface GateInput {
  readonly levelId: string;
  readonly batch: readonly BatchWord[];
  /** From ReviewSchedule.triage of lib/core/scheduler.ts. */
  readonly triageActive: boolean;
  readonly hasExamDate: boolean;
}

export interface GateResult {
  readonly unlocked: boolean;
  readonly exposurePct: number;
  readonly missingWordIds: readonly string[];
  readonly bypass: 'none' | 'exam_triage';
  readonly noticeHe: string | null;
}

export function checkBatchGate(input: GateInput): GateResult {
  const { batch, levelId } = input;
  if (batch.length < BATCH_MIN_WORDS || batch.length > BATCH_MAX_WORDS) {
    throw new RangeError(
      `batch must hold ${BATCH_MIN_WORDS}-${BATCH_MAX_WORDS} words (7.7), got ${batch.length}`,
    );
  }

  const ids = new Set<string>();
  for (const word of batch) {
    if (word.levelId !== levelId) {
      throw new RangeError(
        `batch mixes levels: word ${word.wordId} is ${word.levelId}, batch is ${levelId}`,
      );
    }
    if (ids.has(word.wordId)) {
      throw new RangeError(`batch repeats word ${word.wordId} — exposure would be inflated`);
    }
    ids.add(word.wordId);
  }

  const missingWordIds = batch.filter((w) => !w.seen).map((w) => w.wordId);
  const seenCount = batch.length - missingWordIds.length;
  const exposurePct = Math.round((seenCount / batch.length) * 1000) / 10;

  // Both conditions, exactly as 7.7 words it. Triage alone must not open the gate:
  // scheduleReview returns triage=false with no exam, but a caller computing the
  // flag wrongly would otherwise unlock every level for every learner.
  const bypass = input.hasExamDate && input.triageActive ? 'exam_triage' : 'none';

  return {
    unlocked: bypass === 'exam_triage' || missingWordIds.length === 0,
    // The percentage keeps telling the truth even while the bypass is open. A
    // metric that fakes 100 to justify the unlock stops being a metric.
    exposurePct,
    missingWordIds,
    bypass,
    noticeHe: bypass === 'exam_triage' ? TRIAGE_NOTICE_HE : null,
  };
}
