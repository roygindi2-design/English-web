import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * T-352 · a source guard, like `MeScreen.test.ts` — the environment is node and
 * jsdom is deliberately not installed. Geometry is `check:mobile`'s, through
 * `/dev/tabs/me`, whose fixture date is in the past and so renders this form.
 */
const CODE = withoutComments(readFileSync('components/MeExamDateUpdate.tsx', 'utf8'));

describe('<MeExamDateUpdate> — the past exam date gets one update path (T-352)', () => {
  it('posts to the EXISTING POST /api/profile — ⛔ no new route', () => {
    expect(CODE).toContain("apiPost<SaveResponse>('/api/profile'");
    expect(CODE).not.toMatch(/\bfetch\(/);
  });

  it('sends the two answers it does not edit back unchanged', () => {
    expect(CODE).toMatch(/dailyMinutes,\s*examDate,\s*targetScore: targetScore === null \? '' : String\(targetScore\)/);
  });

  it('⛔ a failed write is never silent — a Hebrew sentence and a live retry', () => {
    expect(CODE).toContain("const SAVE_FAILED_HE = 'לא הצלחנו לשמור את התאריך. אפשר לנסות שוב.'");
    expect(CODE).toContain('result.fieldErrors?.examDate ?? SAVE_FAILED_HE');
    expect(CODE).toContain('role="alert"');
    // the button is released in `finally`, so a failure leaves it pressable.
    expect(CODE).toMatch(/finally \{\s*setSaving\(false\);/);
  });

  it('the date input refuses a past day and both controls meet 44px', () => {
    expect(CODE).toContain('min={today}');
    expect(CODE.match(/min-h-touch/g)?.length).toBe(2);
  });
});
