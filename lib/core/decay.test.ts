import { describe, expect, it } from 'vitest';
import {
  blendOver,
  DECAY_LABEL,
  DECAY_OPACITY,
  decayLevel,
  parseReviewAt,
  type DecayLevel,
} from './decay';
import { contrastRatio, tokenValue } from './palette';

const DAY = 86_400_000;
const NOW = 1_755_000_000_000;

describe('decayLevel — D-043, ⛔ אפס שדה חדש', () => {
  it('מילה שטרם תוזמנה ⛔ אינה דועכת', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: null, intervalDays: 0 })).toBe('none');
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: null, intervalDays: 7 })).toBe('none');
  });

  it('interval_days=0 ⇒ ⛔ אינה «ידועה» ⇒ ⛔ אינה דועכת', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 30 * DAY, intervalDays: 0 })).toBe('none');
  });

  it('מועד שטרם הגיע ⇒ none', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW + DAY, intervalDays: 7 })).toBe('none');
  });

  it('בדיוק במועד ⇒ none — «מעבר לזמן» ⛔ אינו «בזמן»', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW, intervalDays: 7 })).toBe('none');
  });

  it('פיגור קטן מחצי מרווח ⇒ due', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 2 * DAY, intervalDays: 7 })).toBe('due');
  });

  it('חצי מרווח בדיוק ⇒ late', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 3.5 * DAY, intervalDays: 7 })).toBe('late');
  });

  it('מרווח מלא ומעלה ⇒ stale', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 7 * DAY, intervalDays: 7 })).toBe('stale');
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 90 * DAY, intervalDays: 7 })).toBe('stale');
  });

  it('הדרגה יחסית למרווח ⛔ ולא מוחלטת — יומיים פיגור על מרווח 1 הם stale', () => {
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 2 * DAY, intervalDays: 1 })).toBe('stale');
    expect(decayLevel({ nowMs: NOW, nextReviewAtMs: NOW - 2 * DAY, intervalDays: 30 })).toBe('due');
  });

  it('קלט לא סופי ⇒ none ⛔ ולא NaN', () => {
    expect(decayLevel({ nowMs: Number.NaN, nextReviewAtMs: NOW, intervalDays: 7 })).toBe('none');
  });
});

describe('parseReviewAt', () => {
  it('ISO ⇒ אותם מילישניות', () => {
    expect(parseReviewAt('2026-08-21T07:00:00.000Z')).toBe(Date.parse('2026-08-21T07:00:00.000Z'));
  });

  it('null ו-מחרוזת פגומה ⇒ null ⛔ ולא NaN', () => {
    expect(parseReviewAt(null)).toBeNull();
    expect(parseReviewAt('שלום')).toBeNull();
    expect(parseReviewAt('')).toBeNull();
  });
});

describe('D-043 · חוקה § 1 — צבע ⛔ אינו הערוץ היחיד', () => {
  it('לכל דרגה שאינה none יש תווית עברית אחת ויחידה', () => {
    expect(DECAY_LABEL).toBe('הגיע זמן לחזור');
  });
});

/**
 * עובדה ד׳ של התוכנית, כקוד: האטימות חלה על `--ink` בלבד, ובכל דרגה היא
 * **חייבת** לשרוד את רצפת 4.5:1 בשני המצבים. ⛔ הטענה ⛔ אינה מוצהרת — היא מחושבת.
 */
describe('the decay opacity never breaks the 4.5:1 floor', () => {
  const LEVELS: readonly DecayLevel[] = ['none', 'due', 'late', 'stale'];

  for (const mode of ['light', 'dark'] as const) {
    for (const level of LEVELS) {
      it(`--ink at ${level} on --surface-raised (${mode}) stays ≥ 4.5:1`, () => {
        const bg = tokenValue('--surface-raised', mode);
        const faded = blendOver(tokenValue('--ink', mode), bg, DECAY_OPACITY[level]);
        expect(contrastRatio(faded, bg)).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('⛔ ומוכיח שהרצפה אמיתית: --ink-muted באטימות stale ⛔ אינו שורד', () => {
    // הבדיקה שמנמקת למה הדעיכה ⛔ אינה חלה על השורה המשנית ו⛔ לא על המכולה.
    const bg = tokenValue('--surface-raised', 'light');
    const faded = blendOver(tokenValue('--ink-muted', 'light'), bg, DECAY_OPACITY.stale);
    expect(contrastRatio(faded, bg)).toBeLessThan(4.5);
  });
});

describe('blendOver', () => {
  it('אלפא 1 ⇒ הצבע עצמו · אלפא 0 ⇒ הרקע', () => {
    expect(blendOver('#0f172a', '#ffffff', 1)).toBe('#0f172a');
    expect(blendOver('#0f172a', '#ffffff', 0)).toBe('#ffffff');
  });

  it('דוחה hex מקוצר, כמו luminance', () => {
    expect(() => blendOver('#fff', '#000000', 0.5)).toThrow(RangeError);
  });
});
