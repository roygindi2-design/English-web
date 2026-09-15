/**
 * ⛔ הצהרת טיפוסים ל-`walk-routes.mjs`.  ⟦NEW 15/09 · `T-371` · `C-0630`⟧
 *
 * ⚠️ **אותו נימוק בדיוק כמו `walk-errors.d.mts`, ו⛔ לא סיבה חדשה:**
 * `scripts/walk-screens.mjs` הוא סקריפט `node` שרץ ישירות ⇒ ⛔ אינו יכול לייבא `.ts`,
 * בעוד הבדיקה היא `.ts` ועוברת `tsc` בשער. בלי ההצהרה הזאת הייבוא ממנה הוא `any`
 * מרומז והשער נופל (‏TS7016). ⇒ שני הצרכנים, מקור אחד.
 */
export declare const DEFAULT_ROUTES: readonly string[];
export declare const walkRoutes: (routesFlag: string | undefined) => readonly string[];
