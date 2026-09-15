import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  isAbortedRequestLine,
  requestFailureLine,
  splitAborted,
} from './lib/walk-errors.mjs';
import { DEFAULT_ROUTES, walkRoutes } from './lib/walk-routes.mjs';

/**
 * 🧹 **`T-305` — ביטול פריפֶּץ' של Next ⛔ אינו «פגם נראה».**  ⟦NEW 13/09 · `D-219` · סוגרת את `F-230`⟧
 *
 * 🔬 **נמדד חי, ⛔ ולא שוער:** הליכה על שלושת מסכי אמירנט החזירה «⛔ 5 פגמים נראים»,
 * וכל חמש השורות ב-`allErrors` היו `REQFAIL net::ERR_ABORTED ⇐ …&_rsc=…` — אותם
 * נתיבים בדיוק ענו **200** ב-`curl` באותה הרצה. ⇒ ⛔ אפס שגיאות אמיתיות.
 *
 * 🔴 **והסינון הוא על `errorText` ⛔ בלבד, ⛔ ולא על הכתובת** — `verify-mobile.mjs:936`
 * כבר מנמק שם למה: סינון לפי כתובת משתיק גם כשל **אמיתי** באותו נתיב. הבדיקה
 * האחרונה כאן היא בדיוק התרחיש הזה.
 */
describe('🧹 T-305 — REQFAIL net::ERR_ABORTED הוא מידע, ⛔ ולא פגם', () => {
  const RSC = 'http://127.0.0.1:3000/world/amirnet/practice?level=b1&_rsc=1a2b3';

  it('⛔ ביטול פריפץ׳ ⛔ אינו נספר כשגיאה', () => {
    expect(isAbortedRequestLine(requestFailureLine('net::ERR_ABORTED', RSC))).toBe(true);
  });

  it('🔴 כשל רשת אמיתי **כן** נספר', () => {
    expect(isAbortedRequestLine(requestFailureLine('net::ERR_CONNECTION_REFUSED', RSC))).toBe(false);
  });

  it('⛔ שתי שורות סינתטיות ⇒ רק השנייה נספרת, והראשונה ⛔ אינה נעלמת', () => {
    const lines = [
      requestFailureLine('net::ERR_ABORTED', RSC),
      requestFailureLine('net::ERR_NAME_NOT_RESOLVED', 'http://127.0.0.1:3000/api/world/story'),
    ];
    const { errors, aborted } = splitAborted(lines);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('net::ERR_NAME_NOT_RESOLVED');
    expect(aborted).toHaveLength(1);
  });

  it('🔴 שגיאת קונסול ופאג׳ארור ⛔ אינן נוגעות לסינון הזה כלל', () => {
    const { errors, aborted } = splitAborted([
      'PAGEERROR: TypeError: x is not a function',
      'HTTP 503 ⇐ http://127.0.0.1:3000/api/world/story',
    ]);
    expect(errors).toHaveLength(2);
    expect(aborted).toHaveLength(0);
  });

  /**
   * 🔴 **הגדר שהופך את זה לתיקון ⛔ ולא להשתקה** — אותו נתיב `_rsc` בדיוק, עם
   * `errorText` אמיתי. סינון לפי כתובת היה בולע אותו; סינון לפי `errorText` ⛔ לא.
   */
  it('🔴 אותו נתיב `_rsc` עם כשל אמיתי ⇒ **נספר** — הסינון הוא על errorText, ⛔ לא על הכתובת', () => {
    const { errors, aborted } = splitAborted([requestFailureLine('net::ERR_FAILED', RSC)]);
    expect(errors).toHaveLength(1);
    expect(aborted).toHaveLength(0);
  });
});

/**
 * ⛔ ההצהרה `walk-errors.d.mts` נכתבת ביד ⇒ היא יכולה לסטות מהמודול. הבלוק למעלה
 * תופס **התנהגות** שהשתנתה; זה תופס **צורה** שהשתנתה — אותו זיווג ש-`next-cycle-id.test.ts`
 * משתמש בו.
 */
describe('the hand-written declaration file', () => {
  // ⟦הורחב C-0630 · `T-371`⟧ שתי הצהרות ידניות עכשיו, ⛔ ולא אחת ⇒ הבדיקה עוברת על
  // שתיהן. הצהרה שנייה שהבדיקה ⛔ אינה מכסה היא בדיוק הסטייה שהבלוק הזה קיים נגדה.
  it.each([
    ['./lib/walk-errors.mjs', 'scripts/lib/walk-errors.d.mts'],
    ['./lib/walk-routes.mjs', 'scripts/lib/walk-routes.d.mts'],
  ])('%s declares exactly the names the module exports', async (spec, decl) => {
    const mod = await import(spec);
    const declared = [
      ...readFileSync(decl, 'utf8').matchAll(
        /export declare (?:const|function)\s+([A-Za-z_$][\w$]*)/g,
      ),
    ].map((m) => m[1]);
    expect([...declared].sort()).toEqual(Object.keys(mod).sort());
  });
});

/**
 * 🔭 **`T-371` — השער שמעולם ⛔ לא ראה את `amirnet`.**  ⟦NEW 15/09 · `C-0630`⟧
 *
 * 🔬 **נמדד לפני השינוי, ⛔ ולא שוער:** `grep -c amirnet` על רשימת המסלולים המוצהרת
 * של ההליכה ⇒ **0**, בעוד ששת מסכי `/dev/amirnet/*` מחזירים 200 ו-`/dev/amirnet`
 * עצמו החזיר 404. ⇒ ההליכה של `STEP 6.5` — הכלי **היחיד** שמצלם מסך — ⛔ מעולם
 * ⛔ לא צילמה ולו מסך אמירנט אחד, וב-`T-370` בדיוק עכשיו נפתחו ששת המסכים האלה
 * ללומד דרך הטבעת.
 *
 * ⛔ **הבדיקות האלה מודדות את הרשימה, ⛔ ולא מריצות הליכה** — בדיוק בשביל זה
 * `DEFAULT_ROUTES` יצא ל-`lib/walk-routes.mjs`: כל עוד הוא ישב בתוך סקריפט עם
 * `await` ברמה העליונה שמפעיל דפדפן, ⛔ אי אפשר היה לייבא אותו בלי להריץ את הכול.
 */
describe('🔭 T-371 — רשימת ההליכה רואה את amirnet', () => {
  it('שלושת מסכי amirnet שהלומד נוחת עליהם נמצאים ברשימה המוצהרת', () => {
    expect(DEFAULT_ROUTES).toContain('/dev/amirnet/dashboard');
    expect(DEFAULT_ROUTES).toContain('/dev/amirnet/practice');
    expect(DEFAULT_ROUTES).toContain('/dev/amirnet/simulation');
  });

  it('⛔ ולא ששת המסכים — שלושת מצבי הביניים ⛔ אינם ברשימה, וזו הצהרה', () => {
    // ⛔ «כל `page.tsx` במאגר» היה הופך את הרשימה לגלוב, וזה בדיוק מה שהקבוע ⛔ אינו.
    for (const midFlow of [
      '/dev/amirnet/question',
      '/dev/amirnet/levels',
      '/dev/amirnet/result',
    ]) {
      expect(DEFAULT_ROUTES).not.toContain(midFlow);
    }
  });

  it('🔴 המספר שהשורה מודדת: 13 מסכים, ⛔ ולא 10', () => {
    expect(DEFAULT_ROUTES).toHaveLength(13);
    expect(DEFAULT_ROUTES.filter((r: string) => r.includes('amirnet'))).toHaveLength(3);
  });

  it('⛔ ⛔ אין מסלול כפול, ו⛔ אין מסלול בלי / מוביל', () => {
    expect(new Set(DEFAULT_ROUTES).size).toBe(DEFAULT_ROUTES.length);
    for (const route of DEFAULT_ROUTES) expect(route.startsWith('/')).toBe(true);
  });

  it('⛔ `--routes=` ריק פירושו «⛔ לא נמסר דגל», ⛔ ולא «אפס מסכים»', () => {
    expect(walkRoutes('')).toBe(DEFAULT_ROUTES);
    expect(walkRoutes(undefined)).toBe(DEFAULT_ROUTES);
    expect(walkRoutes('   ')).toBe(DEFAULT_ROUTES);
  });

  it('🔴 `--routes=` מלא **כן** גובר — אחרת הדגל היה קוד מת ביום שנולד', () => {
    expect(walkRoutes('/a, /b ,')).toEqual(['/a', '/b']);
  });
});
