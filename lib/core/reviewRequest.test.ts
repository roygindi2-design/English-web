import { describe, expect, it } from 'vitest';
import { MAX_ELAPSED_MS, checkReviewPayload } from '@/lib/core/reviewRequest';

const VALID = {
  word_id: '11111111-2222-3333-4444-555555555555',
  grade: 'good',
  direction: 'recognition',
  elapsed_ms: 4200,
};

describe('checkReviewPayload', () => {
  it('accepts a well-formed body', () => {
    const out = checkReviewPayload(VALID);
    expect(out).toEqual({
      ok: true,
      payload: {
        wordId: VALID.word_id,
        grade: 'good',
        direction: 'recognition',
        elapsedMs: 4200,
      },
    });
  });

  it.each([null, undefined, 'good', 42, [], true])('rejects the non-object body %p', (body) => {
    expect(checkReviewPayload(body)).toEqual({ ok: false, code: 'unavailable' });
  });

  it('rejects a grade outside BINARY_GRADES', () => {
    expect(checkReviewPayload({ ...VALID, grade: 'hard' }).ok).toBe(false);
  });

  it('rejects a direction outside CARD_DIRECTIONS', () => {
    expect(checkReviewPayload({ ...VALID, direction: 'listening' }).ok).toBe(false);
  });

  it('rejects a word_id that is not a uuid', () => {
    expect(checkReviewPayload({ ...VALID, word_id: 'not-a-uuid' }).ok).toBe(false);
  });

  it('rejects a negative elapsed_ms', () => {
    expect(checkReviewPayload({ ...VALID, elapsed_ms: -1 }).ok).toBe(false);
  });

  it('rejects a fractional elapsed_ms', () => {
    expect(checkReviewPayload({ ...VALID, elapsed_ms: 12.5 }).ok).toBe(false);
  });

  it('rejects an abandoned card rather than recording an 8-hour answer', () => {
    expect(checkReviewPayload({ ...VALID, elapsed_ms: MAX_ELAPSED_MS + 1 }).ok).toBe(false);
    expect(checkReviewPayload({ ...VALID, elapsed_ms: MAX_ELAPSED_MS }).ok).toBe(true);
  });
});
