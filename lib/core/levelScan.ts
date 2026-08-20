/**
 * סריקת רמה (Rapid Triage) — D-041 · T-082. טהור: אפס React, DOM, רשת, שעון ו-env.
 *
 * ⛔ הסריקה **אינה טוענת דבר**. היא מתעדת מה הלומד אמר על עצמו, ולכן ⛔ אין כאן ניקוד,
 * ⛔ אין זמן, ⛔ אין תשובה נכונה ו⛔ אין סף. זה מה שמבדיל אותה ממבחן מיצוב (T-004), שדורש
 * מנוע בחירת פריט וכלל עצירה שאין להם היום מקור ב-`plan/70-engines.md`.
 *
 * ⛔ שום דבר כאן אינו נוגע ב-SM-2. `self_marked_known` הוא עמודה נפרדת בדיוק כדי
 * שסימון עצמי לא ייכתב כ-`repetition = 1` — שקר לנוסחה שמניחה חשיפה שנענתה (D-038).
 */

/** D-041 מילה במילה: «מסך רשת של 12 מילים באנגלית בכל מסך». ⛔ לא פרמטר כוונון. */
export const SCAN_PAGE_SIZE = 12;

/**
 * תקרת ביטוח על מספר המילים שנקראות לסריקה אחת, ⛔ ולא מגבלת מוצר ו⛔ לעולם אינה מוצגת.
 * הרמה הגדולה במאגר היום היא A1 עם 315 מילים (נמדד ב-`supabase/seed/0002_word_cefr_levels.sql`),
 * כלומר התקרה רחוקה ממנה ב-185. שליפה שנחתכה בתקרה היא רשימה חלקית, והנתיב עונה עליה
 * 503 ⛔ ולא רשימה קצרה יותר.
 */
export const MAX_SCAN_WORDS = 500;

export interface ScanWord {
  readonly wordId: string;
  readonly headword: string;
}

/**
 * ⓔ סדר אלפביתי, ⛔ ולא אקראי ו⛔ לא לפי תדירות.
 * אקראי אינו יציב בין קריאות ⇒ לומד שיצא באמצע וחזר יראה מילה פעמיים ויפספס אחרת.
 * ‏`ngsl_rank` הוא סדר **פדגוגי**, וסריקה אינה טוענת דבר פדגוגי — סדר אלפביתי הוא
 * הסדר היחיד שאין מאחוריו טענה. שובר-שוויון מלא על `wordId` כדי ששתי מילים זהות
 * לא יתחלפו בין קריאה לקריאה (אותו נימוק כמו `sortQueue` ב-`deck.ts`).
 */
export function sortScanWords(words: readonly ScanWord[]): ScanWord[] {
  return [...words].sort((a, b) => {
    if (a.headword !== b.headword) return a.headword < b.headword ? -1 : 1;
    return a.wordId < b.wordId ? -1 : a.wordId > b.wordId ? 1 : 0;
  });
}

/**
 * ⛔ לא `not.in` בשאילתה — אותה הכרעה בדיוק כמו `excludeSeen` ב-`lib/core/deck.ts`:
 * רשימת המזהים גדלה עם ההיסטוריה של הלומד עד שכתובת ה-URL נשברת בשקט.
 */
export function excludeSeen(
  words: readonly ScanWord[],
  seenWordIds: readonly string[],
): ScanWord[] {
  const seen = new Set(seenWordIds);
  return words.filter((word) => !seen.has(word.wordId));
}

export function pageCount(total: number): number {
  if (!Number.isInteger(total) || total <= 0) return 0;
  return Math.ceil(total / SCAN_PAGE_SIZE);
}

/**
 * חיתוך בלבד. ⛔ אינו ממיין — הסדר נקבע פעם אחת ב-`sortScanWords`, ומיון שני כאן
 * היה הופך את «העמוד הבא» לתלוי במקום שממנו נקרא.
 */
export function pageOf(words: readonly ScanWord[], pageIndex: number): ScanWord[] {
  const index = Number.isInteger(pageIndex) && pageIndex > 0 ? pageIndex : 0;
  const start = index * SCAN_PAGE_SIZE;
  return words.slice(start, start + SCAN_PAGE_SIZE);
}

export type ScanCheck =
  | { readonly ok: true; readonly wordIds: readonly string[] }
  | { readonly ok: false; readonly code: 'unavailable' };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REJECT: ScanCheck = { ok: false, code: 'unavailable' };

/**
 * F-004 על הגבול: מערך הוא אובייקט ו-`null` הוא אובייקט, ולכן הצורה נבדקת לפני שנקראת
 * ולו תכונה אחת.
 *
 * ⛔ **כפילות נדחית ⛔ ואינה מסוננת בשקט.** גוף עם אותו מזהה פעמיים אומר שהלקוח שבור,
 * וסינון שקט היה הופך «סימנתי 12» ל-11 בלי שאיש רואה — בדיוק מחלקת השקט ש-F-030 נפתחה
 * עליה. ⛔ ואין כאן ולידציה שהמילה שייכת לרמת הלומד: RLS כבר מגביל כתיבה לשורות של
 * הלומד עצמו, ולומד שסימן מילה מחוץ לרמתו אמר על עצמו אמת. שער כזה היה כלל מוצר חדש
 * שאיש לא הכריע עליו.
 */
export function checkScanPayload(body: unknown): ScanCheck {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return REJECT;
  const { word_ids: raw } = body as { word_ids?: unknown };
  if (!Array.isArray(raw)) return REJECT;
  if (raw.length === 0 || raw.length > SCAN_PAGE_SIZE) return REJECT;
  const wordIds: string[] = [];
  const seen = new Set<string>();
  for (const value of raw) {
    if (typeof value !== 'string' || !UUID_RE.test(value)) return REJECT;
    if (seen.has(value)) return REJECT;
    seen.add(value);
    wordIds.push(value);
  }
  return { ok: true, wordIds };
}
