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

/**
 * T-267 · נמדד חי בטיק הזה: `RouteError({ reset })` מפרק רק את `reset` מה-props,
 * ⛔ ומעולם לא קורא ל-`error` שהריאקט/נקסט מוסרים לו — כלומר כל קריסה שמגיעה
 * לגבול הזה (כולל זו שדווחה על «התחל קרב», 06/09) נזרקת **בלי אף שורת יומן**.
 * ⛔ זה ⛔ אינו תיקון השורש של T-267 — הקריסה עצמה ⛔ לא שוחזרה בטיק הזה (לא ב-jsdom
 * ולא בדפדפן חי, ראו את הערת ה-DEV בתיעוד המשימה) — זו הסיבה **שהיא אינה ניתנת
 * לאבחון**: השגיאה האמיתית נזרקת לרצפה. ⇒ בלי לוג, כל קריסה עתידית תישאר תעלומה.
 */
describe('T-267 — הגבול חייב לתעד את השגיאה ⛔ ולא רק להציג אותה', () => {
  it('הפרמטר `error` נקרא ⛔ ולא מדולג בפירוק', () => {
    expect(CODE).toMatch(/\{\s*error\s*,\s*reset\s*\}/);
  });

  it('השגיאה נכתבת ליומן — console.error, ⛔ ולא try/catch שמשתיק אותה', () => {
    expect(CODE).toMatch(/console\.error\([^)]*error/);
  });
});
