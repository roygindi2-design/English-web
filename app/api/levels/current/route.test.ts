import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/** POST /api/levels/current — T-081 · D-037. בדיקות מקור, כמו שאר נתיבי ה-API. */

const CODE = withoutComments(readFileSync('app/api/levels/current/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('סדר ההגנות', () => {
  it('גוף שאינו אובייקט ⇒ 400, ⛔ לא 500', () => {
    expect(CODE).toContain('Array.isArray(payload)');
    expect(CODE).toContain('status: 400');
  });

  it('session נבדק לפני שהרמה מאומתת — קורא לא מזוהה אינו לומד אילו ערכים מתקבלים', () => {
    expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf('parseLevel('));
  });

  it('רמה לא חוקית ⇒ 422 עם שדה בעברית, ⛔ ולא כתיבה', () => {
    expect(CODE).toContain('status: 422');
    expect(CODE).toContain('fieldErrors');
  });
});

describe('⛔ הכתיבה נוגעת בשתי עמודות בלבד (§ 4.2ז מדד ⓑ)', () => {
  const updateArg = CODE.slice(CODE.indexOf('.update('), CODE.indexOf('.eq(', CODE.indexOf('.update(')));

  it('current_level ו-updated_at, ותו לא', () => {
    expect(updateArg).toContain('current_level');
    expect(updateArg).toContain('updated_at');
  });

  it.each(['easiness', 'interval_days', 'repetition', 'next_review_at', 'self_marked_known', 'onboarded_at'])(
    '⛔ %s אינו נכתב',
    (column) => {
      expect(updateArg).not.toContain(column);
    },
  );

  it('משתמש ב-update ⛔ ולא ב-upsert — שורת הפרופיל כבר קיימת מטריגר 0001', () => {
    expect(CODE).not.toContain('.upsert(');
  });
});

describe('שש הרמות מוגדרות במקום אחד', () => {
  it('עובר דרך parseLevel ⛔ ולא מכיל רשימת רמות משלו', () => {
    expect(CODE).toContain('parseLevel(');
    expect(CODE).not.toMatch(/\['A1',\s*'A2'/);
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it('docs/api-contract.md מתעד את הנתיב', () => {
    expect(CONTRACT).toContain('POST /api/levels/current');
  });
});
