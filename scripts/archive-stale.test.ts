/**
 * D-170 · שער ההקפאה. ⛔ הבדיקות כאן ⛔ אינן נוגעות ב-git — הן בודקות את
 * ההכרעה הטהורה, שהיא המקום היחיד שבו טעות מקפיאה ממצא חי.
 */
import { describe, expect, it } from 'vitest';
import { shouldFreeze, splitRow, firstGlyph } from './archive-stale.mjs';

const base = {
  id: 'F-999',
  severityCell: ' 🟡 MEDIUM · פגם ',
  statusCell: ' 🔓 פתוח → PM ',
  ageDays: 30,
  days: 14,
  citedElsewhere: false,
};

describe('shouldFreeze', () => {
  it('מקפיא ממצא פתוח, ישן, שאינו חוסם ואינו קריטי', () => {
    expect(shouldFreeze(base).freeze).toBe(true);
  });

  it('⛔ אינו מקפיא ממצא טרי', () => {
    expect(shouldFreeze({ ...base, ageDays: 14 }).freeze).toBe(false);
    expect(shouldFreeze({ ...base, ageDays: 0 }).freeze).toBe(false);
  });

  it('⛔ אינו מקפיא ממצא בלי היסטוריית סטטוס', () => {
    expect(shouldFreeze({ ...base, ageDays: null }).freeze).toBe(false);
  });

  it('⛔ לעולם ⛔ אינו מקפיא 🔴 CRITICAL, גם אחרי שנה', () => {
    const v = shouldFreeze({ ...base, severityCell: ' 🔴 CRITICAL ', ageDays: 365 });
    expect(v.freeze).toBe(false);
    expect(v.why).toContain('CRITICAL');
  });

  it('⛔ אינו מקפיא ממצא שחוסם שורה כתובה', () => {
    expect(shouldFreeze({ ...base, citedElsewhere: true }).freeze).toBe(false);
  });

  it('⛔ אינו מקפיא ממצא שכבר נענה בהכרעה כתובה', () => {
    expect(shouldFreeze({ ...base, statusCell: ' 🔓 פתוח — הוכרע ב-D-149, ממתין ל-QA ' }).freeze).toBe(false);
  });

  it('⛔ אינו נוגע בשורה סגורה, ו⛔ אינו מקפיא פעמיים', () => {
    expect(shouldFreeze({ ...base, statusCell: ' ✅ טופל C-0012 ' }).freeze).toBe(false);
    expect(shouldFreeze({ ...base, statusCell: ' 🚫 ⟨מוקפא 14י · 2026-08-31⟩ — 🔓 פתוח ' }).freeze).toBe(false);
  });
});

describe('splitRow · firstGlyph', () => {
  it('מכבד צינור מוברח, ⛔ ואינו מפצל עליו', () => {
    expect(splitRow('| a | b\\|c | d |')).toEqual([' a ', ' b\\|c ', ' d ']);
  });

  it('הגליף הראשון בתא מכריע, ⛔ ולא «התא מכיל»', () => {
    expect(firstGlyph(' ✅ נסגר — ⛔ אינו רלוונטי ')).toBe('✅');
    expect(firstGlyph(' ⛔ חסום — ⬜ אחר כך ')).toBe('⛔');
    expect(firstGlyph(' 🔓 פתוח ')).toBe(null);
  });
});
