import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר מקור ל-`app/error.tsx` — T-124 · D-065.
 *
 * סביבת vitest היא `node` ו-jsdom נעדר בכוונה, ולכן בדיקת רינדור אינה שייכת
 * לכאן. מה שנמדד כאן הוא בדיוק הטענה שהמשימה נוקבת בה: לענף הכשל יש יציאה.
 */
const SRC = readFileSync('app/error.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('T-124 · D-065 — גבול השגיאה נושא יציאה', () => {
  it('⛔ אין רק reset() — יש גם ניווט החוצה', () => {
    expect(CODE).toContain('reset');
    expect(CODE).toMatch(/<a\s/);
  });

  it('היעד מגיע מהטבלה ⛔ ואינו נכתב כאן', () => {
    expect(CODE).toContain('failureExit');
    expect(CODE).not.toMatch(/href="\/studies"/);
  });

  it('הנוסח מיובא ⛔ ואינו נכתב מחדש (T-056)', () => {
    expect(CODE).toContain('RETRY_HE');
    expect(CODE).not.toContain('נסה שוב'.concat("'"));
  });

  it('⛔ אין מרכוז אנכי (F-011 · F-016)', () => {
    expect(CODE).not.toContain('justify-center gap');
    expect(CODE).not.toContain('h-screen');
  });
});
