/**
 * PURE. No React, no DOM, no clock, no env. The wire shape of POST /api/review.
 *
 * The grade and direction vocabularies are IMPORTED from lib/core/flashcard.ts and
 * never restated: the card offers exactly the grades the API accepts, and a second
 * copy of that list is a second place for the two to drift apart silently.
 *
 * The bound on elapsed_ms is a data-quality guard, not paranoia: a learner who left
 * a card open overnight would otherwise write an eight-hour time_to_first_correct
 * into the one D-010 field the whole telemetry layer exists to hold. Rejected with
 * 400, never silently clamped — a clamped 600000 is indistinguishable from a real one.
 */
import {
  BINARY_GRADES,
  CARD_DIRECTIONS,
  type CardDirection,
  type CardGrade,
} from '@/lib/core/flashcard';

export const MAX_ELAPSED_MS = 600_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ReviewPayload = {
  readonly wordId: string;
  readonly grade: CardGrade;
  readonly direction: CardDirection;
  readonly elapsedMs: number;
};

export type ReviewCheck =
  | { readonly ok: true; readonly payload: ReviewPayload }
  | { readonly ok: false; readonly code: 'unavailable' };

const REJECT: ReviewCheck = { ok: false, code: 'unavailable' };

export function checkReviewPayload(body: unknown): ReviewCheck {
  // F-004's lesson, restated at this boundary: `null`, an array and a bare
  // primitive all survive JSON.parse and would read as `undefined` properties
  // below rather than as the rejection the contract promises.
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return REJECT;
  const raw = body as Record<string, unknown>;

  const wordId = raw.word_id;
  if (typeof wordId !== 'string' || !UUID.test(wordId)) return REJECT;

  const grade = raw.grade;
  if (typeof grade !== 'string' || !BINARY_GRADES.includes(grade as CardGrade)) return REJECT;

  const direction = raw.direction;
  if (typeof direction !== 'string' || !CARD_DIRECTIONS.includes(direction as CardDirection)) {
    return REJECT;
  }

  const elapsedMs = raw.elapsed_ms;
  // Integer, not just finite: milliseconds are whole, and a fractional value is a
  // client that computed a duration some way we did not design for.
  if (!Number.isInteger(elapsedMs)) return REJECT;
  const ms = elapsedMs as number;
  if (ms < 0 || ms > MAX_ELAPSED_MS) return REJECT;

  return {
    ok: true,
    payload: {
      wordId,
      grade: grade as CardGrade,
      direction: direction as CardDirection,
      elapsedMs: ms,
    },
  };
}
