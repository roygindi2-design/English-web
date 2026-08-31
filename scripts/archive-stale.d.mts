/**
 * Types for `archive-stale.mjs` — שער הקפאת ממצא בן 14 יום (D-170).
 *
 * ⚠️ **הצהרה בכתב יד ו⛔ לא TypeScript, מאותה סיבה בדיוק כמו `check-motion.d.mts`:**
 * המודול רץ ב-`node` דרך `npm run archive:stale`, ו-`tsconfig.json` מחזיק
 * `allowJs: false` במכוון ⇒ המימוש נשאר `.mjs` והצורה שלו מוצהרת כאן.
 * ⛔ **הסכנה היא סחיפה** — הצהרה שחדלה להתאים מטייפצ׳ק שקר. מה שמחזיק אותה:
 * `archive-stale.test.ts` מריץ את הערכים האמיתיים, כך ש**שינוי בהתנהגות נופל שם**
 * בין אם הטיפוסים נכונים ובין אם לא.
 */

/** המילה שמסמנת שורה מוקפאת בתא הסטטוס. */
export declare const FREEZE_MARK: string;

/** פיצול שורת טבלה שמכבד `\|` מוברח. ⛔ מועתק במכוון, ⛔ ולא מיובא. */
export declare function splitRow(line: string): string[];

/** גליף הסטטוס הראשון בתא, או `null` כשאין. */
export declare function firstGlyph(cell: string): string | null;

/** ההכרעה הטהורה: האם השורה הזאת מוקפאת, ולמה. */
export declare function shouldFreeze(input: {
  id: string;
  severityCell: string;
  statusCell: string;
  ageDays: number | null;
  days: number;
  citedElsewhere: boolean;
}): { freeze: boolean; why: string; id?: string };

/** מזהה ⇢ חותמת זמן (שניות) של הקומיט האחרון שבו גליף הסטטוס שלו השתנה. */
export declare function lastStatusMove(file?: string): Map<string, number>;
