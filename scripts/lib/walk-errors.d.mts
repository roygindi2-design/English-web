/**
 * ⛔ הצהרת טיפוסים ל-`walk-errors.mjs`.  ⟦NEW 13/09 · `T-305`⟧
 *
 * ⚠️ **למה קובץ נפרד ו⛔ לא מודול TypeScript:** `scripts/walk-screens.mjs` הוא סקריפט
 * `node` שרץ ישירות (‏`next start` + Playwright), ⇒ הוא ⛔ אינו יכול לייבא `.ts`.
 * הבדיקה, לעומת זאת, היא `.ts` ועוברת `tsc` בשער — ובלי ההצהרה הזאת הייבוא ממנה
 * הוא `any` מרומז, ו-`npm run build` נופל (‏TS7016). ⇒ שני הצרכנים, מקור אחד.
 */
export declare const requestFailureLine: (errorText: string, url: string) => string;
export declare const isAbortedRequestLine: (line: unknown) => boolean;
export declare const splitAborted: (lines: readonly string[]) => {
  errors: string[];
  aborted: string[];
};
