/**
 * § 4.2ז — שלוש הספירות הזרות של רמה אחת. טהור: אפס React, DOM, רשת ו-env.
 *
 * ⚠️ זהו **המקום היחיד** שבו כתובות ההגדרות. הנתיב `app/api/levels/summary/route.ts`
 * שואל את הדאטהבייס «אילו שורות התקדמות יש ללומד הזה ברמה הזאת» ומעביר אותן לכאן —
 * ⛔ הוא אינו סופר בעצמו ב-SQL. שלוש שאילתות count עם שלושה predicate היו שלוש
 * הגדרות מקבילות, ו-§ 4.2ז אוסר זאת במפורש («⛔ אין הגדרה שנייה»); הן גם היו הופכות
 * את מדד ההצלחה ⓐ — פיקסטורה שבה אותה מילה גם self_marked_known וגם attempts>0 —
 * לבדיקה שאי-אפשר לכתוב.
 *
 * ⛔ שום דבר כאן אינו כותב, מחשב או מפרש SM-2. `repetition` **נקרא** כקריטריון סיווג,
 * וזה הכל: easiness · interval_days · next_review_at אינם מופיעים בקובץ.
 */
import { BAND_ORDER, type CefrBand } from './cefrLevels';

export interface ProgressFacts {
  readonly attempts: number;
  readonly repetition: number;
  readonly selfMarkedKnown: boolean;
}

export type ProgressClass = 'known' | 'in_review' | 'not_started';

export interface LevelSummary {
  readonly level: CefrBand;
  readonly totalInLevel: number;
  readonly known: number;
  readonly inReviewList: number;
  /** § 4.2ז שורה 2: זה המספר הגדול במסך. 315 − 189 − 18 = 108, מהדוגמה של המפרט עצמו. */
  readonly unseen: number;
}

const BANDS = new Set<string>(BAND_ORDER);

/** null על כל קלט שאינו אחת משש הרמות — ⛔ ולא זריקה: «טרם בחר» הוא מצב תקין. */
export function parseLevel(value: unknown): CefrBand | null {
  return typeof value === 'string' && BANDS.has(value) ? (value as CefrBand) : null;
}

/**
 * הסדר כאן הוא ההגדרה: «ידוע» נבדק ראשון, ולכן מילה שגם סומנה עצמית וגם נוסתה
 * נספרת פעם אחת — כידועה. היפוך שני הענפים הוא בדיוק הספירה הכפולה ש-§ 4.2ז
 * נותן לה פיקסטורה בשמה.
 */
export function classifyProgress(row: ProgressFacts): ProgressClass {
  if (row.selfMarkedKnown || row.repetition >= 1) return 'known';
  if (row.attempts > 0 && row.repetition === 0) return 'in_review';
  return 'not_started';
}

function requireCount(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`levelSummary: ${label} must be a non-negative integer, got ${value}`);
  }
}

export function summarizeLevel(input: {
  readonly level: CefrBand;
  readonly totalInLevel: number;
  readonly rows: readonly ProgressFacts[];
}): LevelSummary {
  requireCount(input.totalInLevel, 'totalInLevel');

  let known = 0;
  let inReviewList = 0;
  for (const row of input.rows) {
    const kind = classifyProgress(row);
    if (kind === 'known') known += 1;
    else if (kind === 'in_review') inReviewList += 1;
  }

  // ⚠️ נגזר בחיסור, ⛔ ולא נספר: «טרם נראה» הוא היעדר שורה, ו-PostgREST אינו יודע
  // לבטא anti-join מהנתיב (אותה מגבלה שכבר רשומה כחוב טכני סביב MAX_SEEN_ROWS).
  // שורה קיימת עם אפס ניסיונות ובלי סימון נופלת לכאן, וזו הכרעה מוצהרת: מבחינת
  // הלומד היא אינה נבדלת ממילה שמעולם לא נגע בה.
  const unseen = input.totalInLevel - known - inReviewList;
  if (unseen < 0) {
    // המשמעות היחידה: שתי השאילתות בנתיב סיננו לרמות שונות. מספר שלילי על המסך
    // נראה כמו באג תצוגה; חריגה כאן מפילה את הבקשה ל-503 ואומרת את האמת.
    throw new RangeError(
      `levelSummary: counted ${known + inReviewList} progress rows in ${input.level}, ` +
        `which holds ${input.totalInLevel} words`,
    );
  }

  return { level: input.level, totalInLevel: input.totalInLevel, known, inReviewList, unseen };
}

/**
 * ⚠️ תווית סידורית ו⛔ לא שם איכותי. § 4.2ז ממחיש «מתחילים» ל-A1 בלבד, ולחמש
 * האחיות אין מקור בפרויקט — המצאתן היא טענה פדגוגית, בדיוק מה ש-R-017 נפתחה נגדו.
 * מה שיש לו מקור: `plan/15-syllabus-digest.md:42` — «שש רמות בלבד, L1..L6 = A1..C2;
 * זו החלוקה היחידה עם מקור אמפירי (D-003)». מילה אחת של ה-PM מחליפה את הקבוע הזה.
 */
export const LEVEL_LABELS_HE: Readonly<Record<CefrBand, string>> = Object.freeze({
  A1: 'רמה 1 מתוך 6',
  A2: 'רמה 2 מתוך 6',
  B1: 'רמה 3 מתוך 6',
  B2: 'רמה 4 מתוך 6',
  C1: 'רמה 5 מתוך 6',
  C2: 'רמה 6 מתוך 6',
});
