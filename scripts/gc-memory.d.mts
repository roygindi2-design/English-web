/**
 * Types for `gc-memory.mjs` — פינוי אשפה דטרמיניסטי לזיכרון הלופ
 * (הוראה מפורשת של רוי, 01/09/2026).
 *
 * ⚠️ **הצהרה בכתב יד ו⛔ לא TypeScript, מאותה סיבה בדיוק כמו `archive-stale.d.mts`:**
 * המודול רץ ב-`node` דרך `npm run gc:memory`, ו-`tsconfig.json` מחזיק
 * `allowJs: false` במכוון ⇒ המימוש נשאר `.mjs` והצורה שלו מוצהרת כאן.
 * ⛔ **הסכנה היא סחיפה** — הצהרה שחדלה להתאים מטייפצ׳ק שקר. מה שמחזיק אותה:
 * `gc-memory.test.ts` מריץ את הערכים האמיתיים, כך ש**שינוי בהתנהגות נופל שם**
 * בין אם הטיפוסים נכונים ובין אם לא.
 */

/** ⛔ שני הקבצים ש-`gc:memory` ⛔ אינו נוגע בהם לעולם. נמדד ב-SHA-256 בכל הרצה. */
export declare const NEVER_TOUCH: readonly string[];

/** הקבצים שנקראים בכל טיק. `D-xxx` שמצוטט באחד מהם ⛔ אינו מוגדם בגלל גיל. */
export declare const LIVE_CONTRACT: readonly string[];

/** המילה שמסמנת סעיף מוגדם. אותה מוסכמה של המצבות הידניות מ-C-0374. */
export declare const TOMBSTONE_MARK: string;

/** כותרת סעיף החלטה. ⛔ ⛔ אינה תופסת שורת טבלה ב-§ 4.1. */
export declare const HEADING: RegExp;

/** כל התאריכים בטקסט, בשתי הצורות שהלופ כותב בהן, כ-`YYYY-MM-DD` ממוין. */
export declare function datesIn(text: string): string[];

/** הפרש ימים קלנדרי בין שתי מחרוזות `YYYY-MM-DD`. ⛔ בלי שעון ו⛔ בלי אזור זמן. */
export declare function daysBetween(from: string, to: string): number;

/** נתיבי קבצים ושמות תוכניות בטקסט. זה מה שמחזיק את `loop:health` בדיקה 6 ירוקה. */
export declare function citationsIn(text: string): string[];

/** כותרת נקייה מהדגשה, מגרשיים ומהערת מחזור, חתוכה על גבול מילה. */
export declare function cleanTitle(raw: string): string;

/** חלוקת הקובץ לסעיפי `D-xxx`. סעיף נמשך עד כותרת ברמה שווה או גבוהה. */
export declare function sectionsOf(lines: string[]): {
  start: number;
  end: number;
  depth: number;
  id: string;
  title: string;
}[];

/** אוסף את כל `D-xxx` שמצוטטים ב-`LIVE_CONTRACT`. קובץ חסר ⇒ `null` ⇒ מדולג. */
export declare function liveCitedIds(readText: (path: string) => string | null): Set<string>;

/** ההכרעה הטהורה: האם הסעיף הזה מוגדם, ולמה. */
export declare function shouldTombstone(input: {
  id: string;
  body: string;
  rank: number;
  keepN: number;
  ageDays: number | null;
  days: number;
  citedLive?: boolean;
}): { tomb: boolean; why: string; id?: string };

/** שורות המצבה שנשארות בקובץ החי — לכל היותר כותרת + שתי שורות + ריק. */
export declare function tombstoneFor(input: {
  id: string;
  title: string;
  cites: string[];
  today: string;
}): string[];

/** שלב ב׳ בלבד — המצבות. מחזיר את המדידה, ⛔ ואינו מדפיס. */
export declare function runDecisions(opts?: {
  dry?: boolean;
  keepN?: number;
  days?: number;
  today?: string;
}): {
  sections: number;
  tombstoned: number;
  kept: number;
  liveKept: number;
  beforeBytes: number;
  afterBytes: number;
};
