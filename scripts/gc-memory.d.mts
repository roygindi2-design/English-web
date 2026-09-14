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

/* ─────────────── שלב ג׳ — יומן העברות המקל (`00-control.md § 0.1`), T-249 ─────────────── */

/** ⛔ מועתק במכוון מ-`scripts/loop-health.mjs` בדיקה 9 — אותה תקרה בדיוק. */
export declare const CONTROL_CEILING: number;

/** ⛔ תקרה על שאיפה, ⛔ ולא יעד קבוע — ר׳ ההערה במימוש למדידה החיה שמאחורי המספר. */
export declare const CONTROL_HISTORY_MAX_KEEP: number;

/** גבולות סעיף 0.1: מהכותרת ועד הכותרת הבאה ברמה 1-3, או סוף הקובץ. `null` ⇐ אין כותרת. */
export declare function controlHistorySection(lines: string[]): { start: number; end: number } | null;

/** כל שורת `| C-XXXX | ... |` בתוך גבולות הסעיף, בסדר הופעתן בקובץ. */
export declare function controlHistoryRows(
  lines: string[],
  section: { start: number; end: number },
): { line: number; cycle: string; raw: string }[];

/** ⛔ טהורה — כמה מהשורות (מהחדשה לישנה) יכולות להישאר בלי לחצות את `ceiling`. */
export declare function safeHistoryKeepN(input: {
  otherBytes: number;
  rowSizes: number[];
  ceiling?: number;
  maxKeep?: number;
  min?: number;
}): number;

/** ⛔ זורקת אם משהו מחוץ לגבולות הסעיף השתנה בין `beforeLines` ל-`afterLines`. */
export declare function assertOnlyHistoryRowsChanged(
  beforeLines: string[],
  afterLines: string[],
  section: { start: number; end: number },
): void;

/** ⛔ ההכרעה הטהורה — מגזום ⛔ אפס מחיקה: מה שיוצא מהקובץ החי חוזר ב-`archived`. */
export declare function pruneControlHistory(
  text: string,
  opts?: { maxKeep?: number; ceiling?: number },
): {
  changed: boolean;
  lines: string[];
  archived: string[];
  keepN: number | null;
};

/* ─────────────── ⓐ `T-340` — תקרת תווים על תא «סיבת ההעברה» ─────────────── */

/** המצבה שמסמנת תא סיבה שנגזם. ⛔ אותה מוסכמה כמו `TOMBSTONE_MARK`. */
export declare const REASON_TRIM_MARK: string;

/** ⛔ תקרה מוצהרת, נגזרת ממדידה חיה — ר׳ ההערה במימוש למספרים שמאחוריה. */
export declare const HISTORY_REASON_MAX_CHARS: number;

/** תאי שורת יומן (‏6), ⛔ בלי ה-`|` החיצוניים. `null` ⇐ ⛔ אינה שורת יומן תקינה. */
export declare function historyCellsOf(raw: string): string[] | null;

/** תא «סיבת ההעברה» של שורת יומן, מגוזם מרווחים. `''` ⇐ ⛔ אינה שורה כזאת. */
export declare function reasonCellOf(raw: string): string;

/**
 * ⛔ טהורה — גוזמת את תא הסיבה של שורה אחת לכל היותר `maxChars` תווים **כולל
 * המצבה**. ⛔ אידמפוטנטית, ו⛔ אינה נוגעת בחמשת התאים האחרים.
 * ⛔ זורקת כאשר `maxChars` קטנה מהמצבה עצמה — ⛔ אין גיזום שקט.
 */
export declare function trimHistoryReason(
  raw: string,
  opts?: { maxChars?: number; archive?: string },
): { changed: boolean; row: string; full: string | null };

/** ⛔ טהורה — אותו גיזום על שורות `§ 0.1` **בלבד**; `archived` נושא את המקור המלא. */
export declare function trimControlHistoryReasons(
  text: string,
  opts?: { maxChars?: number },
): { changed: boolean; lines: string[]; archived: string[] };

/** ⛔ שומר כפילות בארכיון — מזהה **תא ראשון**, ⛔ ולא אזכור בפרוזה. */
export declare function archiveHasCycle(archiveText: string, cycle: string): boolean;

/** שלב ג׳ בלבד — יומן העברות המקל. מחזיר את המדידה, ⛔ ואינו מדפיס. */
export declare function runControlHistory(opts?: { dry?: boolean }): {
  archived: number;
  trimmed: number;
  keepN: number | null;
  beforeBytes: number;
  afterBytes: number;
};
