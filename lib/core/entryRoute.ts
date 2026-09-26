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

/**
 * T-525 · D-304 — the entry screens (`/` · `/login` · `/signup`) left the proxy's
 * `matcher`, so the signed-in redirect above runs client-side for them, through
 * `GET /api/auth/entry`. This is the ONE list that endpoint accepts: anything else
 * answers `target: null`, so the endpoint can never become a redirect oracle for a
 * path nobody meant it to judge.
 */
export function isEntryPath(pathname: string): boolean {
  return ENTRY_PATHS.includes(pathname);
}

/**
 * The session cookies are httpOnly (F-002), so a script cannot tell a guest from a
 * learner. This cookie is the readable HINT that a session probably exists — ⛔ never
 * proof of one, and ⛔ never a secret: its value is `1`, and all it decides is
 * whether an entry screen holds its primary action back until the server answers.
 * A stale hint costs one wait; a missing hint costs a moment of the landing — the
 * server's answer is what redirects, in both cases.
 */
export const SIGNED_IN_HINT_COOKIE = 'kol-signed-in';

/** Reads the hint out of a raw `document.cookie` string. Exact name, ⛔ not a prefix. */
export function hasSignedInHint(cookieHeader: string): boolean {
  return cookieHeader
    .split(';')
    .some((part) => part.trim() === `${SIGNED_IN_HINT_COOKIE}=1`);
}

/** Set on `<html>` while an entry screen waits for `GET /api/auth/entry`. */
export const ENTRY_PENDING_ATTR = 'data-entry-pending';


/**
 * T-524 · D-304 — the installed app's daily open. `start_url` used to be `/`, and `/`
 * was the one route the service worker refused to paint early (`SESSION_ROUTED`) ⇒
 * the learner's most frequent open got ⛔ none of `T-519`. It now opens the home
 * screen directly, marked so the proxy can still send a learner who never finished
 * onboarding where `/` would have sent them. The mark is what keeps that check to
 * the app open alone: `/studies` itself stays ⛔ free of a database read per visit.
 */
export const APP_OPEN_PARAM = 'from';
export const APP_OPEN_VALUE = 'app';
export const APP_START_URL = `${HOME_PATH}?${APP_OPEN_PARAM}=${APP_OPEN_VALUE}`;

export function isAppOpen(pathname: string, params: URLSearchParams): boolean {
  return pathname === HOME_PATH && params.get(APP_OPEN_PARAM) === APP_OPEN_VALUE;
}

/**
 * Where an app open goes, for a signed-in learner. The same rule `/` applied —
 * `signedInRedirect('/')` — minus the move to the home screen, which the app open
 * already is. ⛔ `'unknown'` stays (`null`), exactly as it did there.
 */
export function appOpenRedirect(onboarded: OnboardedState): string | null {
  const target = signedInRedirect('/', onboarded);
  return target === HOME_PATH ? null : target;
}
