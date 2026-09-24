/**
 * Types for `archive-departments.mjs` — ארכוב מחלקות שנחתמו (בדיקה 19).
 *
 * ⚠️ בכתב יד, מאותה סיבה כמו `archive-stale.d.mts` (‏`allowJs: false`).
 * ⛔ **הגדר מפני סחיפה:** `archive-departments.test.ts` מריץ את הערכים האמיתיים
 * מול `plan/05-departments.md` החי.
 */

/** האם תא היעדים מתאר מחלקה שנסגרה: `חתומה` ⛔ ובלי ולו סימן יעד פתוח אחד. */
export declare function isSealedRow(goalsCell: string): boolean;

/** תא היעדים של שורת טבלה — התא ה**אחרון**, ⛔ ולא אינדקס קבוע. */
export declare function goalsCellOf(line: string): string;

/** הקובץ החי אחרי ההוצאה, והשורות שיצאו — מילה במילה. */
export declare function splitDepartments(text: string): { keep: string; archived: string[] };

/** The byte ceiling of `plan/05-departments.md` — shared with check 19 (`F-326`). */
export declare const DEPARTMENTS_CEILING: number;
