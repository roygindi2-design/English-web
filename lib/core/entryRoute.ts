/**
 * PURE. ⛔ No React, no DOM, no clock, no env, no I/O.
 *
 * T-122 · D-063 · TD-25 — לאן נשלח לומד **מחובר**.
 *
 * ⚠️ ההחלטה חיה כאן ⛔ ולא ב-`proxy.ts` וגם ⛔ לא ב-`app/onboarding/page.tsx`,
 * משום ששני המקומות האלה אוכפים אותה — והם חייבים לאכוף את **אותה** החלטה.
 * `proxy.ts` הוא Edge ו-`page.tsx` הוא Server Component; אף אחד מהם אינו נבדק
 * בבדיקת התנהגות בריפו הזה (הסביבה `node`, jsdom נעדר בכוונה). פונקציה טהורה
 * היא המקום היחיד שבו הכלל נמדד ולא מובטח.
 */

export const ONBOARDING_PATH = '/onboarding';
export const HOME_PATH = '/studies';
export const LOGIN_PATH = '/login';

/** ⛔ `'unknown'` אינו `false`. קריאה שנכשלה אינה עדות לכך שהלומד חדש. */
export type OnboardedState = true | false | 'unknown';

/**
 * המסכים שלומד מחובר ⛔ לעולם אינו נשאר בהם: שער השיווק ושני מסכי האימות.
 * התאמה מדויקת ו⛔ לא תחילית — `/login-help` אינו `/login`, וניתוב שלא מכבד
 * את הגבול היה מפנה מסך ציבורי עתידי בלי שאיש התכוון (אותו לקח של
 * `isProtectedPath` ב-`proxy.ts`).
 */
const ENTRY_PATHS: readonly string[] = ['/', '/login', '/signup'];

export function signedInRedirect(pathname: string, onboarded: OnboardedState): string | null {
  if (ENTRY_PATHS.includes(pathname)) {
    // ⛔ `'unknown'` נופל לכאן יחד עם `true` בכוונה: `/studies` נושא סרגל
    // לשוניות ומטפל ב-`exam_date` חסר במפורש, ולכן הוא לעולם אינו מלכודת.
    // `/onboarding` הוא מלכודת — ⛔ אין לו סרגל לשוניות, וזריקה לשם על סמך
    // קריאה שנכשלה היא בדיוק הבאג שהמשימה הזאת נפתחה עליו.
    return onboarded === false ? ONBOARDING_PATH : HOME_PATH;
  }
  if (pathname === ONBOARDING_PATH) {
    // ⛔ `'unknown'` ⇒ `null`: הלומד כבר על המסך, ואולי כבר מילא חצי טופס.
    // הוצאה בכוח על סמך קריאה שנכשלה מוחקת עבודה שהוא עשה.
    return onboarded === true ? HOME_PATH : null;
  }
  return null;
}

/**
 * מה שחזר מ-`profiles.onboarded_at`, בלי cast. הגוף מגיע מ-PostgREST ואינו
 * בשליטתנו, ולכן הטיפוס הנכנס הוא `unknown` — cast כאן היה הבטחה על נתון
 * שלא כתבנו, וזו בדיוק מחלקת F-004.
 */
export function onboardedFromRow(row: unknown): OnboardedState {
  if (typeof row !== 'object' || row === null || Array.isArray(row)) return 'unknown';
  if (!('onboarded_at' in row)) return 'unknown';
  const value = (row as { onboarded_at: unknown }).onboarded_at;
  if (value === null) return false;
  if (typeof value !== 'string') return 'unknown';
  return value.trim() !== '';
}
