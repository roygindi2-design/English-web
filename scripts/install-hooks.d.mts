/**
 * Types for `install-hooks.mjs` — התקנת ומדידת ה-hook של `verify`
 * (הכרעה 100 · הוראה מפורשת של רוי, 06/09/2026).
 *
 * ⚠️ **הצהרה בכתב יד ו⛔ לא TypeScript, מאותה סיבה בדיוק כמו `gc-memory.d.mts`:**
 * המודול רץ ב-`node` דרך npm `prepare`/`hooks:install`, ו-`tsconfig.json` מחזיק
 * `allowJs: false` במכוון ⇒ המימוש נשאר `.mjs` והצורה שלו מוצהרת כאן.
 * ⛔ **הסכנה היא סחיפה** — הצהרה שחדלה להתאים מטייפצ׳ק שקר. מה שמחזיק אותה:
 * `install-hooks.test.ts` מריץ את הפונקציות האמיתיות על שורש זמני, כך ש**שינוי
 * בהתנהגות נופל שם** בין אם הטיפוסים נכונים ובין אם לא.
 */

/** ⛔ רשימה סגורה ומוצהרת. hook שאינו כאן ⛔ אינו מותקן ו⛔ אינו נמדד. */
export declare const HOOKS: readonly string[];

/** מעתיק את `scripts/hooks/*` ל-`.git/hooks/` ומסמן אותם כניתנים להרצה.
 *  ⛔ לעולם אינו זורק: `.git` חסר או worktree ⇒ `reason` מוחזרת, ⛔ ולא חריגה. */
export declare function installHooks(root?: string): {
  installed: string[];
  skipped: string[];
  reason: string | null;
};

/** ⛔ המדידה בלבד — ⛔ אינו מתקין דבר. בודק שמותקן וזהה למקור. */
export declare function hookState(root?: string): {
  ok: boolean;
  missing: string[];
  stale: string[];
};
