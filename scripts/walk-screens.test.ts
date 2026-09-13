import { describe, expect, it } from 'vitest';

import {
  isAbortedRequestLine,
  requestFailureLine,
  splitAborted,
} from './lib/walk-errors.mjs';

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
