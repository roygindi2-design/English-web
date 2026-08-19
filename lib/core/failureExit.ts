/**
 * PURE. ⛔ No React, no DOM, no clock, no env, no I/O.
 *
 * T-124 · D-065 — «⛔ אין מסך כשל בלי יציאה».
 *
 * ⚠️ הכלל הוא טבלה בת שלוש שורות, ולכן הוא נכתב פעם אחת. ארבעה מסכים מימשו
 * אותו בארבע דרכים שונות (נמדד C-0207), ואחד מהם הציע «נסה שוב» על תקלה
 * שלעולם אינה חולפת. זו בדיוק מחלקת T-056: אותו אירוע בארבעה נוסחים.
 *
 * ⛔ הנוסח של הכשל עצמו ⛔ אינו כאן — הוא ב-`failure.ts`. הקובץ הזה עונה על
 * שאלה אחרת: «לאן אפשר ללכת מכאן».
 */

export type FailureCode = 'session_expired' | 'schema_missing' | 'unavailable';

export interface FailureExit {
  readonly href: string;
  readonly labelHe: string;
  /** האם «נסה שוב» רשאי להופיע. ⛔ שתיים מהשלוש — לא. */
  readonly retryable: boolean;
}

const SIGN_IN_AGAIN_HE = 'התחברות מחדש';
const BACK_TO_STUDIES_HE = 'חזרה ללימודים';

const TABLE: Readonly<Record<FailureCode, FailureExit>> = Object.freeze({
  // הסשן איננו. ⛔ ניסיון חוזר יחזיר 401 שוב, ולכן הוא אינו מוצע.
  session_expired: { href: '/login', labelHe: SIGN_IN_AGAIN_HE, retryable: false },
  // תקלת הקמה שרוי חייב לפתור (מיגרציה 0013). ⛔ היא אינה חולפת מפני שלחצו
  // על כפתור, ולכן ⛔ אין כאן «נסה שוב» — יש ניווט ללשונית שכן עובדת.
  schema_missing: { href: '/studies', labelHe: BACK_TO_STUDIES_HE, retryable: false },
  // התקלה החולפת היחידה. «נסה שוב» מותר, ו**בנוסף** יש יציאה: כפתור ניסיון
  // חוזר לבדו הוא מסך ללא דרך החוצה כשהתקלה מתמידה.
  unavailable: { href: '/studies', labelHe: BACK_TO_STUDIES_HE, retryable: true },
});

export function failureExit(code: FailureCode): FailureExit {
  return TABLE[code];
}

export function isRetryable(code: FailureCode): boolean {
  return TABLE[code].retryable;
}
