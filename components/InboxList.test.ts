import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const CODE = readFileSync('components/InboxList.tsx', 'utf8');

describe('InboxList — T-191, render kol-C-13-inbox.png', () => {
  it('the binding strings, verbatim (39 § 1 · row ⓔ · D-109)', () => {
    for (const s of ['הודעות · סימולציות', 'תיבת הסימולציות', 'הקיר', 'סיפור', 'תיבה', 'כל התכתובת מול דמויות', 'אין כאן משתמשים אחרים', 'סיפור עוד לא פתוח']) {
      expect(CODE, s).toContain(s);
    }
  });
  it('⛔ never claims a 100% safe space (39 § 1), ⛔ never «בקרוב» (D-046)', () => {
    expect(CODE).not.toMatch(/100%/);
    expect(CODE).not.toMatch(/בטוח לחלוטין|בקרוב/);
  });
  it('⛔ draws only — no filter/reduce/sort, no fetch, no write', () => {
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(|\.sort\(/);
    expect(CODE).not.toMatch(/fetch\(|apiPost|apiPatch|word_progress|arcade_/);
    expect(CODE).toMatch(/apiGet</);
  });
  it('the dot is not the only channel: the counter string is rendered from the state', () => {
    expect(CODE).toMatch(/countsHe/);
    expect(CODE).toMatch(/data-inbox-unread/);
  });
  /**
   * ⓑ of T-289, and the reason the row calls it the most important cell: `sr-only` is the
   * ⛔ ONLY channel a screen-reader user has for the dot, and until now it announced
   * «טרם נענתה» over a state the product measures as «⛔ טרם נקראה» (F-212 · D-207).
   * ⛔ There is no «answered» state to announce yet — it is born with the keyboard (R-026).
   */
  it('the screen-reader label says read/unread, ⛔ never answered (T-289ⓑ · F-212)', () => {
    expect(CODE).toContain('טרם נקראה');
    expect(CODE).toContain('נקראה');
    expect(CODE).not.toContain('נענתה');
  });
  it('English only inside <EnWord>; sender and subject go through it', () => {
    expect((CODE.match(/<EnWord>/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
  it('⛔ no hex, ⛔ no h-screen, ⛔ no bg-brand fill, ⛔ no text under 12px, ⛔ no radius off the scale', () => {
    expect(CODE).not.toMatch(/#[0-9a-f]{3,6}\b/i);
    expect(CODE).not.toMatch(/h-screen/);
    expect(CODE).not.toMatch(/\bbg-brand(?![-\w])/);
    expect(CODE).not.toMatch(/text-\[(\d|1[01])(\.\d+)?px\]/);
    expect(CODE).not.toMatch(/rounded-(sm|3xl|\[)/);
  });
  it('the disabled tabs carry the condition, not just a colour (D-046 · D-096)', () => {
    expect(CODE).toMatch(/aria-disabled/);
  });
  it('a failure screen has an exit (D-065)', () => {
    expect(CODE).toMatch(/failureExit\(/);
  });
});
