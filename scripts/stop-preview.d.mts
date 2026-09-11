/**
 * Types for `stop-preview.mjs` — הריגת שרת התצוגה המקדימה (`TD-26` · דפוס ה-pkill).
 *
 * ⚠️ **בכתב יד ו⛔ לא TypeScript, כמו `archive-stale.d.mts`:** `tsconfig.json` מחזיק
 * `allowJs: false` במכוון, ⇒ המימוש נשאר `.mjs` והצורה מוצהרת כאן.
 * ⛔ **הגדר מפני סחיפה:** `stop-preview.test.ts` מריץ את הערכים האמיתיים מול `/proc`
 * מזויף ⇒ שינוי בהתנהגות נופל שם, בין אם ההצהרה נכונה ובין אם לא.
 */

/** שורת הפקודה המלאה של תהליך, או `''` אם הוא כבר מת. */
export declare function cmdlineOf(pid: number, root?: string): string;

/** שרשרת ה-PPID שלי — ⛔ הגדר שמונעת הריגה של מי שקרא לי. */
export declare function ancestorsOf(pid: number, root?: string): Set<number>;

/** תהליכי Next שמותר להרוג: ⛔ ⛔ לא אני ו⛔ לא אב קדמון שלי. */
export declare function targetsIn(
  root?: string,
  self?: number,
): { pid: number; cmd: string }[];
