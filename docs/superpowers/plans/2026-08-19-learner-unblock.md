# שחרור ארבעת חסמי הלומד (T-122 · T-123 · T-124 · T-125) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** להסיר את ארבעת החסמים שנמדדו ב-C-0207 (D-063…D-066) ומונעים מלומד אמיתי להגיע לכל מה שכבר נבנה: הזריקה החוזרת ל-`/onboarding`, שלושת האריחים המתים ב-`/cards`, מסכי הכשל בלי יציאה, ומשפט הנעילה השגוי של לשונית «העולם».

**Architecture:** כל החלטת ניתוב או נעילה חדשה נכתבת כפונקציה **טהורה** ב-`lib/core/`, ונבדקת שם בבדיקת יחידה אמיתית; שכבת ה-React ושכבת ה-Edge (`proxy.ts`) רק **קוראות** לה, ונבדקות בשומר-מקור (source guard) כמו כל שאר הרכיבים בריפו. הסיבה מכנית ולא סגנונית: סביבת vitest היא `node` ו-jsdom נעדר בכוונה (`vitest.config.ts`), ולכן בדיקת רינדור **אינה נאספת** ואינה קיימת — פונקציה טהורה היא המקום היחיד שבו התנהגות נבדקת באמת.

**Tech Stack:** Next 16 (App Router · `proxy.ts` במקום `middleware.ts`) · React 19 · TypeScript strict · Tailwind עם טוקנים של `plan/35-design-constitution.md` · Supabase (`@supabase/ssr`) · vitest (`environment: 'node'`).

**Spec:** `plan/50-tasks.md` שורות T-122…T-125 · `plan/40-decisions.md` D-063 · D-064 · D-065 · D-066 · `plan/00-control.md` C-0207 · `docs/api-contract.md` § `GET /api/world/status`

## Global Constraints

- ⛔ `lib/core/` טהור לחלוטין: אפס React · אפס `window` · אפס `document` · אפס `localStorage` · אפס `fetch` · אפס `process.env`. נאכף על ידי `npm run check:core`.
- ⛔ רכיב ממשק לעולם אינו ניגש לדאטהבייס. הכל דרך `app/api/*` ו-`lib/api/client.ts`. (`proxy.ts` אינו רכיב ממשק — הוא שכבת Edge ומותר לו לקרוא Supabase, וכבר עושה זאת.)
- ⛔ אפס `any` ב-TypeScript. `npm run typecheck` חייב לצאת 0.
- ⛔ אין מרכוז אנכי (`justify-center` · `h-screen`) על מכולת מסך · ⛔ אין גרדיאנט סגול · ⛔ אין `Inter`. אלה F-011 ו-F-016, והם **נמדדים** ב-`*.test.ts` הקיימים.
- יעד מגע מינימלי: `min-h-touch` (44px). RTL. Mobile-First ב-375px.
- נוסח כשל מיובא מ-`lib/core/failure.ts` ו⛔ לעולם אינו נכתב מחדש בקובץ מסך (T-056).
- ⛔ צבע אינו הערוץ היחיד: כל מצב נושא גם תווית עברית או צורה (חוקה § 1).
- `docs/api-contract.md` מתעדכן **באותו קומיט** של כל שינוי בהתנהגות נקודת קצה או בהתנהגות הצרכן שלה (התנהגות הצרכן היא חלק מהחוזה — תקדים C-0127).
- אחרי כל משימה: `npm run typecheck && npm run check:core && npm test && npm run build`. ⛔ אין טענת הצלחה בלי הרצה טרייה באותה הודעה.
- ⛔ הדחיפה היא ל-`dev` בלבד. ⛔ אין `[skip ci]` בהודעת קומיט.

---

## File Structure

| קובץ | אחריות | משימה |
|---|---|---|
| `lib/core/entryRoute.ts` | **חדש.** פונקציה טהורה אחת: לאן נשלח לומד **מחובר** שנמצא בנתיב נתון, בהינתן האם סיים onboarding. | 1 |
| `lib/core/entryRoute.test.ts` | **חדש.** בדיקת יחידה אמיתית — טבלת מקרים מלאה, כולל מצב «לא ידוע». | 1 |
| `proxy.ts` | קורא `onboarded_at` **רק** בנתיבי הכניסה, ומאציל את ההחלטה ל-`entryRoute`. | 1 |
| `proxy.test.ts` | שומר-מקור: הקריאה מתבצעת, והיא צרה. | 1 |
| `app/onboarding/page.tsx` | שומר שני על אותה דלת: קורא `onboarded_at` בעצמו ומפנה ל-`/studies`. | 1 |
| `app/onboarding/page.test.ts` | **חדש.** שומר-מקור לשומר השני. | 1 |
| `lib/core/deckTiles.ts` | **חדש.** פונקציה טהורה: האם **כל** האריחים מושבתים ⇒ המסך במצב ריק. | 2 |
| `lib/core/deckTiles.test.ts` | **חדש.** בדיקת יחידה אמיתית. | 2 |
| `components/DeckSelector.tsx` | מצב ריק ברמת הבלוק עם פעולה אחת, במקום שלושה כפתורים מתים. | 2 |
| `components/DeckSelector.test.ts` | שומר-מקור מורחב. | 2 |
| `lib/core/failureExit.ts` | **חדש.** פונקציה טהורה: לכל קוד כשל — מה היציאה, ומתי «נסה שוב» אסור. | 3 |
| `lib/core/failureExit.test.ts` | **חדש.** בדיקת יחידה אמיתית. | 3 |
| `components/LevelMapScreen.tsx` · `components/StudyDeckScreen.tsx` · `app/error.tsx` | כל ענף כשל מקבל יציאה. | 3 |
| `components/LevelMapScreen.test.ts` · `components/StudyDeckScreen.test.ts` · `app/error.test.ts` | שומרי-מקור: אין ענף כשל בלי `<a>`/`<Link>`. | 3 |
| `lib/core/worldGate.ts` | **חדש.** פונקציה טהורה: המשפט שהלומד קורא נגזר מ**שני** התנאים. | 4 |
| `lib/core/worldGate.test.ts` | **חדש.** בדיקת יחידה אמיתית. | 4 |
| `components/TabBar.tsx` | קורא `functionWords` מהתשובה ומציג את המשפט הנכון. | 4 |
| `components/TabBar.test.ts` | שומר-מקור מורחב. | 4 |
| `docs/api-contract.md` | § `GET /api/world/status` — התנהגות הצרכן מעודכנת. | 4 |

---

## Task 1: הלומד החוזר מפסיק להיזרק לטופס ה-onboarding (T-122 · D-063 · TD-25)

**Files:**
- Create: `lib/core/entryRoute.ts`
- Create: `lib/core/entryRoute.test.ts`
- Modify: `proxy.ts:56-62` (ענף `if (user)`)
- Modify: `proxy.test.ts` (הוספת `describe` בסוף הקובץ)
- Modify: `app/onboarding/page.tsx:30-39`
- Create: `app/onboarding/page.test.ts`

**Interfaces:**
- Consumes: `createProxyClient(env, request, response)` ו-`createRouteClient(env, cookieStore)` מ-`@/lib/supabase/auth` — קיימים, ⛔ ללא שינוי.
- Produces:
  ```ts
  // lib/core/entryRoute.ts
  export const ONBOARDING_PATH = '/onboarding';
  export const HOME_PATH = '/studies';
  export const LOGIN_PATH = '/login';
  export type OnboardedState = true | false | 'unknown';
  export function signedInRedirect(pathname: string, onboarded: OnboardedState): string | null;
  export function onboardedFromRow(row: unknown): OnboardedState;
  ```
  `signedInRedirect` מחזיר את הנתיב שאליו יש להפנות לומד **מחובר**, או `null` אם הוא נשאר במקומו.

### הכרעות התכנון, ולמה כל אחת היא כזאת ⛔ ולא טעם

1. **`unknown` שולח ל-`/studies` ו⛔ לא ל-`/onboarding`.** קריאת `profiles` יכולה להיכשל (סכמה חסרה · רשת · RLS). אם כשל קריאה שולח לטופס — זהו **בדיוק** הבאג שהמשימה נפתחה עליו, רק מסיבה אחרת. `/studies` נושא סרגל לשוניות ומטפל ב-`exam_date` חסר במפורש (`app/(tabs)/studies/page.tsx:29,54` — «תאריך המבחן עוד לא נקבע.»), ולכן הוא ⛔ לעולם אינו מלכודת. `/onboarding` הוא מלכודת: ⛔ אין לו סרגל לשוניות.
2. **הקריאה ל-`profiles` מתבצעת אך ורק בנתיבי הכניסה** (`/` · `/login` · `/signup`) **ובנתיב `/onboarding` עצמו.** ⛔ לא בכל בקשה. `proxy` רץ על כל ניווט, ושאילתה נוספת בכל בקשה היא מס קבוע על מוצר שלם עבור החלטה שרלוונטית לארבעה נתיבים.
3. **שתי הבדיקות, ⛔ ולא אחת.** ניתוב מ-`/` לבדו משאיר את `/onboarding` פתוח בכתובת ישירה, והלומד שמקליד אותה או מגיע מהיסטוריית הדפדפן רואה שוב את הטופס. לכן המסך בודק גם בעצמו — אותו היגיון של F-003 («מנעול אחד על דלת הוא נקודת כשל יחידה»), ואותה פונקציה טהורה בשני הצדדים.
4. **`onboardedFromRow` מקבל `unknown`.** התשובה מ-PostgREST אינה בשליטתנו, ו-cast היה הבטחה על גוף שלא כתבנו. הפונקציה הטהורה היא זו שמחליטה מה נכון.

- [ ] **Step 1: כתוב את בדיקת היחידה שנופלת**

צור `lib/core/entryRoute.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  HOME_PATH,
  ONBOARDING_PATH,
  onboardedFromRow,
  signedInRedirect,
  type OnboardedState,
} from './entryRoute';

/**
 * T-122 · D-063 · TD-25 — הלומד החוזר מפסיק להיזרק לטופס.
 *
 * זו בדיקת יחידה אמיתית ⛔ ולא שומר-מקור: ההחלטה היא פונקציה טהורה, ולכן אפשר
 * להריץ אותה. שומרי המקור על `proxy.ts` ועל `app/onboarding/page.tsx` מוכיחים
 * רק שהם *קוראים* לפונקציה הזאת — ההתנהגות עצמה נמדדת כאן.
 */
describe('signedInRedirect — נתיבי הכניסה', () => {
  const ENTRY_PATHS = ['/', '/login', '/signup'];

  it('לומד שסיים onboarding נשלח מכל נתיב כניסה אל /studies', () => {
    for (const pathname of ENTRY_PATHS) {
      expect(signedInRedirect(pathname, true)).toBe(HOME_PATH);
    }
  });

  it('לומד חדש נשלח מכל נתיב כניסה אל /onboarding', () => {
    for (const pathname of ENTRY_PATHS) {
      expect(signedInRedirect(pathname, false)).toBe(ONBOARDING_PATH);
    }
  });

  it('⛔ קריאה שנכשלה אינה שולחת לטופס — היא שולחת ל-/studies', () => {
    // זהו הבאג עצמו, רק מסיבה אחרת: /studies נושא סרגל לשוניות ומטפל
    // ב-exam_date חסר, ו-/onboarding הוא מלכודת בלי דרך החוצה.
    for (const pathname of ENTRY_PATHS) {
      expect(signedInRedirect(pathname, 'unknown')).toBe(HOME_PATH);
    }
  });
});

describe('signedInRedirect — מסך ה-onboarding עצמו', () => {
  it('לומד שכבר סיים ⛔ אינו רואה את הטופס שוב, גם בכתובת ישירה', () => {
    expect(signedInRedirect(ONBOARDING_PATH, true)).toBe(HOME_PATH);
  });

  it('לומד חדש נשאר בטופס', () => {
    expect(signedInRedirect(ONBOARDING_PATH, false)).toBeNull();
  });

  it('⛔ קריאה שנכשלה אינה זורקת אותו החוצה באמצע הטופס', () => {
    // הוא כבר על המסך. הוצאה בכוח מכשל קריאה תמחק טופס שמולא למחצה.
    expect(signedInRedirect(ONBOARDING_PATH, 'unknown')).toBeNull();
  });
});

describe('signedInRedirect — כל שאר המסכים', () => {
  it('⛔ אינו נוגע במסכים שאינם נתיב כניסה', () => {
    for (const pathname of ['/studies', '/cards', '/me', '/study', '/world', '/arcade']) {
      for (const state of [true, false, 'unknown'] as OnboardedState[]) {
        expect(signedInRedirect(pathname, state)).toBeNull();
      }
    }
  });

  it('⛔ אינו מפיל תת-נתיב של מסך כניסה בטעות', () => {
    // `/login-help` אינו `/login`. התאמת תחילית שמתעלמת מהגבול הייתה
    // מפנה מסך ציבורי עתידי בלי שאיש התכוון.
    expect(signedInRedirect('/login-help', true)).toBeNull();
    expect(signedInRedirect('/onboarding-preview', true)).toBeNull();
  });
});

describe('onboardedFromRow — התשובה מ-PostgREST אינה בשליטתנו', () => {
  it('חותמת זמן ⇒ סיים', () => {
    expect(onboardedFromRow({ onboarded_at: '2026-08-01T10:00:00Z' })).toBe(true);
  });

  it('null בעמודה ⇒ לא סיים. זו שורה שקיימת ונקראה', () => {
    expect(onboardedFromRow({ onboarded_at: null })).toBe(false);
  });

  it('מחרוזת ריקה ⇒ לא סיים', () => {
    expect(onboardedFromRow({ onboarded_at: '   ' })).toBe(false);
  });

  it('⛔ אין שורה, אין אובייקט, או טיפוס לא צפוי ⇒ unknown ⛔ ולא false', () => {
    // ההבדל הוא כל המשימה: `false` שולח לטופס, `unknown` שולח הביתה.
    expect(onboardedFromRow(null)).toBe('unknown');
    expect(onboardedFromRow(undefined)).toBe('unknown');
    expect(onboardedFromRow([])).toBe('unknown');
    expect(onboardedFromRow('2026-08-01')).toBe('unknown');
    expect(onboardedFromRow({})).toBe('unknown');
    expect(onboardedFromRow({ onboarded_at: 42 })).toBe('unknown');
  });
});
```

- [ ] **Step 2: הרץ ואמת שהיא נופלת**

```bash
npm test -- lib/core/entryRoute.test.ts
```

צפוי: FAIL — `Failed to load ./entryRoute` / `Cannot find module`.

- [ ] **Step 3: כתוב את המימוש הטהור**

צור `lib/core/entryRoute.ts`:

```ts
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
```

- [ ] **Step 4: הרץ ואמת שהיא עוברת**

```bash
npm test -- lib/core/entryRoute.test.ts
npm run check:core
```

צפוי: PASS · `check:core` OK (⛔ אפס ייבוא של React/env/IO בקובץ החדש).

- [ ] **Step 5: חבר את `proxy.ts` לפונקציה**

החלף את ענף `if (user)` ב-`proxy.ts` (שורות 56-62 בקוד הנוכחי) בזה:

```ts
  if (user) {
    // ⚠️ TD-25 · T-122: קודם כאן ישב `/onboarding` ללא תנאי, וכל לומד חוזר
    // נזרק לטופס שמילא לפני שבוע. הקריאה למאגר מתבצעת אך ורק בנתיבים
    // שההחלטה נוגעת בהם — ⛔ לא בכל בקשה. `proxy` רץ על כל ניווט, ושאילתה
    // קבועה בכל בקשה היא מס על מוצר שלם עבור החלטה שנוגעת לארבעה נתיבים.
    const needsOnboardingState = isAuthScreen || pathname === '/' || pathname === ONBOARDING_PATH;
    if (!needsOnboardingState) return response;

    const { data } = await supabase
      .from('profiles')
      .select('onboarded_at')
      .eq('id', user.id)
      .maybeSingle();

    // `data` הוא `unknown` מבחינתנו — `onboardedFromRow` הוא שמחליט, ⛔ לא cast.
    const target = signedInRedirect(pathname, onboardedFromRow(data));
    if (target === null) return response;
    return redirectPreservingCookies(request, response, target);
  }
```

והוסף בראש הקובץ, מתחת לייבוא הקיים של `@/lib/supabase/auth`:

```ts
import { ONBOARDING_PATH, onboardedFromRow, signedInRedirect } from '@/lib/core/entryRoute';
```

- [ ] **Step 6: הוסף את שומר המקור ל-`proxy.test.ts`**

הוסף בסוף `proxy.test.ts`:

```ts
/**
 * T-122 · TD-25 — שומר מקור, ולא בדיקת התנהגות.
 *
 * ⛔ מה שהוא ⛔ אינו מוכיח, ונאמר כאן כדי שאיש לא יטעה בירוק הזה לכיסוי:
 * שהניתוב באמת קורה מול Supabase חי. ההחלטה עצמה נמדדת ב-
 * `lib/core/entryRoute.test.ts`, וזה הקובץ שבו התנהגות נבדקת.
 * מה שהוא כן מוכיח: ש-`proxy.ts` מאציל לפונקציה הטהורה ⛔ ואינו משכפל אותה,
 * ושהיעד הקשיח `/onboarding` נעלם מענף המשתמש המחובר.
 */
describe('T-122: הלומד החוזר ⛔ אינו נזרק לטופס', () => {
  const SRC = readFileSync('proxy.ts', 'utf8');
  const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

  it('ההחלטה מואצלת ל-lib/core ⛔ ואינה משוכפלת כאן', () => {
    expect(CODE).toContain('signedInRedirect');
    expect(CODE).toContain('onboardedFromRow');
  });

  it('⛔ אין עוד יעד /onboarding קשיח בענף המשתמש המחובר', () => {
    // זו השורה עצמה: `redirectPreservingCookies(request, response, '/onboarding')`.
    expect(CODE).not.toMatch(/redirectPreservingCookies\([^)]*['"]\/onboarding['"]/);
  });

  it('onboarded_at נקרא — הבדיקה שהמסך היה חייב לעשות ומעולם לא עשה', () => {
    expect(CODE).toContain('onboarded_at');
  });

  it('⛔ הקריאה למאגר צרה: היא מותנית בנתיב ⛔ ואינה רצה על כל בקשה', () => {
    const guard = CODE.indexOf('needsOnboardingState');
    const query = CODE.indexOf(".from('profiles')");
    expect(guard).toBeGreaterThan(-1);
    expect(query).toBeGreaterThan(guard);
  });
});
```

⚠️ ודא ש-`readFileSync` מיובא בראש `proxy.test.ts` — הוא אינו שם היום. הוסף כשורה ראשונה:

```ts
import { readFileSync } from 'node:fs';
```

- [ ] **Step 7: הוסף את המנעול השני ב-`app/onboarding/page.tsx`**

החלף את גוף `OnboardingPage` עד לתחילת ה-`return` (שורות 30-39 בקוד הנוכחי) בזה:

```ts
export default async function OnboardingPage() {
  const env = readSupabaseEnv();
  if (!env) redirect('/login?expired=1');

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?expired=1');

  // T-122 · TD-25 — המנעול השני על אותה דלת, ואותה פונקציה טהורה שהפרוקסי
  // קורא לה. בלעדיו הכתובת הישירה `/onboarding` עדיין מציגה את הטופס ללומד
  // שמילא אותו לפני שבוע — ניתוב לבדו ⛔ אינו סוגר מסך.
  const { data } = await supabase
    .from('profiles')
    .select('onboarded_at')
    .eq('id', user.id)
    .maybeSingle();
  const target = signedInRedirect(ONBOARDING_PATH, onboardedFromRow(data));
  if (target !== null) redirect(target);

  return (
```

והוסף לייבוא בראש הקובץ:

```ts
import { ONBOARDING_PATH, onboardedFromRow, signedInRedirect } from '@/lib/core/entryRoute';
```

- [ ] **Step 8: כתוב את שומר המקור למסך**

צור `app/onboarding/page.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * T-122 · TD-25 — המנעול השני, כשומר מקור.
 *
 * המסך דורש Supabase env וסשן חי, ולכן התנהגותו אינה ניתנת להרצה כאן (אותה
 * סיבה שבגללה `app/(tabs)/me/page.test.ts` הוא שומר מקור). ההחלטה עצמה נמדדת
 * ב-`lib/core/entryRoute.test.ts`.
 */
const SRC = readFileSync('app/onboarding/page.tsx', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('מסך ה-onboarding בודק בעצמו', () => {
  it('קורא onboarded_at ⛔ ולא רק session', () => {
    expect(CODE).toContain('onboarded_at');
  });

  it('משתמש באותה פונקציה טהורה שהפרוקסי משתמש בה ⛔ ולא בהעתק', () => {
    expect(CODE).toContain('signedInRedirect');
    expect(CODE).toContain('onboardedFromRow');
  });

  it('הבדיקה קודמת לרינדור הטופס במקור', () => {
    expect(CODE.indexOf('signedInRedirect')).toBeLessThan(CODE.indexOf('OnboardingForm />'));
  });
});
```

- [ ] **Step 9: אימות מלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

צפוי: `typecheck` 0 · `check:core` OK · כל הבדיקות עוברות (מספר הבדיקות עולה מ-1792 בכ-19) · `build` 0.
⚠️ אם `npm test` נופל על `proxy.test.ts` בגלל `readFileSync` חסר — זה שלב 6, ⛔ ולא כשל של המימוש.

- [ ] **Step 10: קומיט**

```bash
git add lib/core/entryRoute.ts lib/core/entryRoute.test.ts proxy.ts proxy.test.ts app/onboarding/page.tsx app/onboarding/page.test.ts
git commit -m "loop(DEV): C-XXXX T-122 — הלומד החוזר מפסיק להיזרק ל-onboarding (TD-25)"
```

---

## Task 2: מאגר ריק מפסיק לחסום את הדרך לכרטיסייה (T-123 · D-064 · § 4.2ו)

**Files:**
- Create: `lib/core/deckTiles.ts`
- Create: `lib/core/deckTiles.test.ts`
- Modify: `components/DeckSelector.tsx:139-205`
- Modify: `components/DeckSelector.test.ts`

**Interfaces:**
- Consumes: `signedInRedirect` ⛔ לא נדרש כאן. אין תלות במשימה 1.
- Produces:
  ```ts
  // lib/core/deckTiles.ts
  export interface TileState { readonly enabled: boolean }
  export function allTilesDead(tiles: readonly TileState[]): boolean;
  export const DECK_ALL_EMPTY_TITLE_HE: string;
  export const DECK_ALL_EMPTY_BODY_HE: string;
  export const DECK_ALL_EMPTY_ACTION_HE: string;
  export const DECK_ALL_EMPTY_HREF: string;
  ```

### הכרעות התכנון

1. **הכלל המתוקן של D-064 הוא כלל על ה*מסך*, ⛔ לא על האריח.** אריח מושבת עם המספר שלו הוא נכון ונשאר (§ 4.2ו). מה שאסור הוא **מסך שכל האריחים בו מושבתים** — במצב הזה ⛔ אין שום פעולה, וזה הקיר שהמשימה נפתחה עליו.
2. **הפעולה היחידה מובילה ל-`/study`.** שם — וְרק שם — יושב `<StudyEmptyState>` שנבנה בשביל הרגע הזה ומעולם לא נראה. ⛔ לא ל-`/cards`: הלומד כבר שם.
3. **⛔ הבלוק אינו מחליף את שלושת האריחים בשקט.** הכותרת «דרכים לתרגל» ושלושת האריחים נשארים במסך; המצב הריק **מתווסף מעליהם** כפעולה. הסיבה היא § 4.2ו עצמו: «אריח מושבת עם המספר שלו» הוא מידע, ומחיקתו הופכת מסך שנראה זהה בשני מצבים שונים.
4. **⛔ בזמן טעינה אין מצב ריק.** `loading === true` ⇒ שלושת האריחים מציגים «—» וזה נכון. הצגת «אין מה לתרגל» חצי שנייה לפני שהמספרים נוחתים היא שקר קצר, וזו מחלקת F-027.
5. **⛔ קריאה שנכשלה אינה «ריק».** `counts.due === null` פירושו «לא ידוע». `allTilesDead` נשען על `enabled` בלבד — ולכן במצב כשל **גם** יוצג מצב ריק. ⚠️ זו סטייה מודעת ומוצהרת מסעיף 4 של תיעוד `DeckSelector` («כשל משאיר שלושה מושבתים ⛔ ואינו מציג מסך שגיאה»): מסך בלי שום פעולה הוא קיר גם כשהסיבה היא כשל, ו-D-064 מנסח את הכלל על מצב האריחים ⛔ ולא על סיבתו. הפעולה במצב הזה מובילה לאותו מקום, והנוסח ⛔ אינו טוען שהמאגר ריק — ראה `DECK_ALL_EMPTY_BODY_HE` להלן. **רשום את הסטייה ב-`plan/30-architecture.md` באותו קומיט.**

- [ ] **Step 1: כתוב את בדיקת היחידה שנופלת**

צור `lib/core/deckTiles.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DECK_ALL_EMPTY_ACTION_HE,
  DECK_ALL_EMPTY_BODY_HE,
  DECK_ALL_EMPTY_HREF,
  DECK_ALL_EMPTY_TITLE_HE,
  allTilesDead,
} from './deckTiles';

/**
 * T-123 · D-064 — «אריח מושבת ⛔ אינו חוקי כאשר כל האריחים במסך מושבתים».
 * הכלל הוא על המסך ⛔ ולא על האריח, ולכן הפונקציה מקבלת את כולם.
 */
describe('allTilesDead', () => {
  it('שלושה מושבתים ⇒ המסך מת', () => {
    expect(allTilesDead([{ enabled: false }, { enabled: false }, { enabled: false }])).toBe(true);
  });

  it('אריח פעיל אחד מספיק כדי שהמסך יחיה', () => {
    expect(allTilesDead([{ enabled: true }, { enabled: false }, { enabled: false }])).toBe(false);
    expect(allTilesDead([{ enabled: false }, { enabled: false }, { enabled: true }])).toBe(false);
  });

  it('⛔ רשימה ריקה אינה «מסך מת» — היא מסך בלי אריחים, ומצב אחר', () => {
    // `[].every(...)` הוא `true` ב-JS, וזו בדיוק המלכודת: מסך שטרם בנה את
    // האריחים שלו היה מדווח «הכל מת» ומציג מצב ריק על לא כלום.
    expect(allTilesDead([])).toBe(false);
  });
});

describe('נוסח המצב הריק', () => {
  it('הפעולה מובילה ל-/study, המקום היחיד שבו StudyEmptyState חי', () => {
    expect(DECK_ALL_EMPTY_HREF).toBe('/study');
  });

  it('⛔ הנוסח אינו טוען שהמאגר ריק — קריאה שנכשלה נראית זהה', () => {
    expect(DECK_ALL_EMPTY_BODY_HE).not.toContain('ריק');
    expect(DECK_ALL_EMPTY_BODY_HE).not.toContain('אין מילים');
  });

  it('שלושת המחרוזות בעברית ו⛔ אינן ריקות', () => {
    for (const text of [
      DECK_ALL_EMPTY_TITLE_HE,
      DECK_ALL_EMPTY_BODY_HE,
      DECK_ALL_EMPTY_ACTION_HE,
    ]) {
      expect(text.trim().length).toBeGreaterThan(0);
      expect(text).toMatch(/[֐-׿]/);
    }
  });
});
```

- [ ] **Step 2: הרץ ואמת שהיא נופלת**

```bash
npm test -- lib/core/deckTiles.test.ts
```

צפוי: FAIL — `Cannot find module './deckTiles'`.

- [ ] **Step 3: כתוב את המימוש הטהור**

צור `lib/core/deckTiles.ts`:

```ts
/**
 * PURE. ⛔ No React, no DOM, no clock, no env, no I/O.
 *
 * T-123 · D-064 — הכלל המתוקן של § 4.2ו.
 *
 * «אריח מושבת עם המספר שלו» נשאר נכון ו⛔ לא בוטל. מה ש-D-064 אוסר הוא **מסך
 * שכל האריחים בו מושבתים**: במצב הזה ⛔ אין ללומד שום פעולה, ו-`/study` —
 * המקום היחיד שבו `<StudyEmptyState>` חי — הופך בלתי-נגיש. נמדד C-0207.
 */

export interface TileState {
  readonly enabled: boolean;
}

/**
 * ⛔ `tiles.every(...)` לבדו שגוי: `[].every(...)` הוא `true` ב-JS, ולכן מסך
 * שטרם בנה את האריחים שלו היה מדווח «הכל מת» ומציג מצב ריק על לא כלום.
 */
export function allTilesDead(tiles: readonly TileState[]): boolean {
  if (tiles.length === 0) return false;
  return tiles.every((tile) => !tile.enabled);
}

export const DECK_ALL_EMPTY_TITLE_HE = 'אין מה לתרגל כרגע';
/**
 * ⛔ הנוסח אינו אומר «המאגר ריק»: קריאה שנכשלה מגיעה לאותו מצב בדיוק, ומשפט
 * שקובע עובדה על המאגר מתוך קריאה שלא הגיעה הוא טענה שאיש לא מדד — אותו כלל
 * שבגללו `<DeckSelector>` מציג «—» ו⛔ לא `0`.
 */
export const DECK_ALL_EMPTY_BODY_HE = 'אפשר לפתוח את הכרטיסיות ולראות מה מחכה שם.';
export const DECK_ALL_EMPTY_ACTION_HE = 'פתיחת הכרטיסיות';
/** ⛔ לא `/cards` — הלומד כבר שם. `/study` הוא המסך שנושא את `<StudyEmptyState>`. */
export const DECK_ALL_EMPTY_HREF = '/study';
```

- [ ] **Step 4: הרץ ואמת שהיא עוברת**

```bash
npm test -- lib/core/deckTiles.test.ts && npm run check:core
```

צפוי: PASS · `check:core` OK.

- [ ] **Step 5: חבר את `DeckSelector.tsx`**

הוסף לייבוא בראש הקובץ:

```ts
import {
  DECK_ALL_EMPTY_ACTION_HE,
  DECK_ALL_EMPTY_BODY_HE,
  DECK_ALL_EMPTY_HREF,
  DECK_ALL_EMPTY_TITLE_HE,
  allTilesDead,
} from '@/lib/core/deckTiles';
```

מיד אחרי הגדרת `entries` (שורה 149 בקוד הנוכחי) הוסף:

```ts
  // T-123 · D-064: ⛔ בזמן טעינה אין מצב ריק. שלושת האריחים מציגים «—» וזה
  // נכון; «אין מה לתרגל» חצי שנייה לפני שהמספרים נוחתים הוא שקר קצר.
  const dead = !loading && allTilesDead(entries);
```

והחלף את פתיחת ה-`return` כך שהמצב הריק מופיע **מעל** הרשימה ⛔ ואינו מחליף אותה:

```tsx
  return (
    <section className="flex flex-col gap-4">
      {dead && (
        // ⛔ אינו מחליף את שלושת האריחים: «מושבת עם המספר» הוא מידע (§ 4.2ו),
        // ומחיקתו הופכת מסך שנראה זהה בשני מצבים שונים. זו פעולה נוספת,
        // ⛔ לא החלפה.
        <div data-deck-empty className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">{DECK_ALL_EMPTY_TITLE_HE}</h3>
          <p className="text-base text-ink-muted">{DECK_ALL_EMPTY_BODY_HE}</p>
          <Link
            href={DECK_ALL_EMPTY_HREF}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {DECK_ALL_EMPTY_ACTION_HE}
          </Link>
        </div>
      )}

      <ul aria-busy={loading} data-deck-selector className="flex list-none flex-col gap-3 p-0">
```

⚠️ **שים לב:** `data-primary-action="true"` מופיע כעת גם על אריח «מנת היום» (שורה 181/195 בקוד הנוכחי). כאשר `dead === true` אותו אריח מושבת, ולכן שני האלמנטים אינם פעילים בו-זמנית — אבל `check:mobile` סופר את התכונה. **הסר את `data-primary-action` משני מופעיו על אריח `due`** והשאר אותו על הפעולה החדשה בלבד כאשר היא נוכחת; כלומר החלף בשני המקומות:

```tsx
                  data-primary-action={entry.key === 'due' ? 'true' : undefined}
```

ב:

```tsx
                  data-primary-action={entry.key === 'due' && entry.enabled ? 'true' : undefined}
```

כך יש בדיוק פעולה ראשית אחת בכל מצב.

- [ ] **Step 6: הרחב את `components/DeckSelector.test.ts`**

הוסף בסוף הקובץ:

```ts
describe('T-123 · D-064 — מסך שכל האריחים בו מושבתים ⛔ אינו חוקי', () => {
  it('הכלל מואצל ל-lib/core ⛔ ואינו משוכפל כאן', () => {
    expect(CODE).toContain('allTilesDead');
  });

  it('⛔ אין מצב ריק בזמן טעינה — «אין מה לתרגל» לפני שהמספרים נוחתים הוא שקר', () => {
    expect(CODE).toMatch(/!loading\s*&&\s*allTilesDead/);
  });

  it('המצב הריק נושא פעולה אחת שמנווטת ⛔ ולא כפתור מת', () => {
    expect(CODE).toContain('DECK_ALL_EMPTY_HREF');
    expect(CODE).toContain('data-deck-empty');
  });

  it('⛔ שלושת האריחים לא נמחקו — «מושבת עם המספר» הוא מידע (§ 4.2ו)', () => {
    expect(CODE).toContain('data-deck-selector');
    expect(CODE.indexOf('data-deck-empty')).toBeLessThan(CODE.indexOf('data-deck-selector'));
  });

  it('פעולה ראשית אחת בדיוק: היא עוברת לאריח due רק כשהוא פעיל', () => {
    expect(CODE).toMatch(/entry\.key === 'due' && entry\.enabled/);
  });
});
```

- [ ] **Step 7: רשום את הסטייה המוצהרת**

הוסף ל-`plan/30-architecture.md` בסוף § 3.1 סעיף חדש בנוסח:

```
### 3.1.NN — T-123: מצב «כל האריחים מושבתים» מוצג גם כשהסיבה היא כשל קריאה
תיעוד `<DeckSelector>` סעיף 4 קובע שכשל משאיר שלושה אריחים מושבתים ⛔ ואינו
מציג מסך שגיאה. D-064 מנסח את הכלל על **מצב** האריחים ⛔ ולא על סיבתו, ולכן
מסך בלי שום פעולה הוא קיר גם כשהסיבה היא כשל. הנוסח שנבחר
(`DECK_ALL_EMPTY_BODY_HE`) ⛔ אינו טוען שהמאגר ריק, ולכן אינו הופך לשקר
במצב הכשל. הפעולה מובילה ל-`/study` בשני המצבים.
```

- [ ] **Step 8: אימות מלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

צפוי: `typecheck` 0 · `check:core` OK · הכל ירוק (כ-9 בדיקות נוספות) · `build` 0.

- [ ] **Step 9: קומיט**

```bash
git add lib/core/deckTiles.ts lib/core/deckTiles.test.ts components/DeckSelector.tsx components/DeckSelector.test.ts plan/30-architecture.md
git commit -m "loop(DEV): C-XXXX T-123 — מאגר ריק מפסיק לחסום את הדרך ל-/study"
```

---

## Task 3: ⛔ אין מסך כשל בלי יציאה (T-124 · D-065)

**Files:**
- Create: `lib/core/failureExit.ts`
- Create: `lib/core/failureExit.test.ts`
- Modify: `components/LevelMapScreen.tsx:146-159`
- Modify: `components/StudyDeckScreen.tsx:207-256`
- Modify: `app/error.tsx:12-28`
- Modify: `components/LevelMapScreen.test.ts` · `components/StudyDeckScreen.test.ts`
- Create: `app/error.test.ts`

**Interfaces:**
- Consumes: `FAILURE_HE` · `FAILURE_TITLE_HE` · `RETRY_HE` מ-`@/lib/core/failure` — קיימים, ⛔ ללא שינוי.
- Produces:
  ```ts
  // lib/core/failureExit.ts
  export type FailureCode = 'session_expired' | 'schema_missing' | 'unavailable';
  export interface FailureExit {
    readonly href: string;
    readonly labelHe: string;
    readonly retryable: boolean;
  }
  export function failureExit(code: FailureCode): FailureExit;
  export function isRetryable(code: FailureCode): boolean;
  ```

### הכרעות התכנון

1. **הכלל הבינארי של D-065 הוא טבלה בת שלוש שורות**, ולכן הוא נכתב כטבלה אחת ב-`lib/core` ו⛔ לא כשלושה `if` בשלושה קבצים. שלושת המסכים מייבאים אותה. זו בדיוק הסיבה ש-T-056 קיימת: אותו אירוע בארבעה נוסחים הוא ארבעה מוצרים.
2. **`schema_missing` ⇒ `retryable: false`.** התקלה ⛔ אינה חולפת מעצמה — רוי חייב להריץ מיגרציה. «נסה שוב» כאן הוא כפתור שלעולם לא יצליח, וזה ⓒ במשימה.
3. **`session_expired` ⇒ יציאה ל-`/login`, תמיד.** ⛔ גם הוא אינו `retryable`: טעינה חוזרת עם סשן מת מחזירה 401 שוב.
4. **`unavailable` ⇒ `retryable: true` ו**בנוסף** יציאה.** «נסה שוב» לבדו הוא מסך ללא דרך החוצה כשהתקלה מתמידה.
5. **היציאה היא `<a>` ⛔ ולא `<Link>` עבור `session_expired`** — הנימוק כבר כתוב ב-`StudyDeckScreen.tsx:242-244` (הראוטר של הלקוח עלול לענות מהמטמון), ואותו כלל נשמר.

- [x] **Step 1: כתוב את בדיקת היחידה שנופלת**

צור `lib/core/failureExit.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { failureExit, isRetryable, type FailureCode } from './failureExit';

/**
 * T-124 · D-065 — הכלל הבינארי, כטבלה אחת.
 */
const ALL: readonly FailureCode[] = ['session_expired', 'schema_missing', 'unavailable'];

describe('לכל קוד כשל יש יציאה', () => {
  it('⛔ אין קוד בלי יעד ניווט, ובעברית', () => {
    for (const code of ALL) {
      const exit = failureExit(code);
      expect(exit.href.startsWith('/')).toBe(true);
      expect(exit.labelHe).toMatch(/[֐-׿]/);
    }
  });
});

describe('session_expired', () => {
  it('שולח ל-/login ⇒ תמיד', () => {
    expect(failureExit('session_expired').href).toBe('/login');
  });

  it('⛔ אינו ניתן לניסיון חוזר — טעינה חוזרת עם סשן מת מחזירה 401 שוב', () => {
    expect(isRetryable('session_expired')).toBe(false);
  });
});

describe('schema_missing', () => {
  it('⛔ אינו ניתן לניסיון חוזר — התקלה אינה חולפת מעצמה', () => {
    // זהו ⓒ במשימה: «נסה שוב» שלעולם לא יצליח. מיגרציה שלא רצה
    // לא תרוץ מפני שהלומד לחץ על כפתור.
    expect(isRetryable('schema_missing')).toBe(false);
  });

  it('מנווט ללשונית שכן עובדת ⛔ ולא לאותו מסך', () => {
    expect(failureExit('schema_missing').href).toBe('/studies');
  });
});

describe('unavailable', () => {
  it('ניתן לניסיון חוזר — זו התקלה החולפת היחידה מהשלוש', () => {
    expect(isRetryable('unavailable')).toBe(true);
  });

  it('⛔ ובנוסף יש יציאה: «נסה שוב» לבדו הוא מסך ללא דרך החוצה', () => {
    expect(failureExit('unavailable').href).toBe('/studies');
  });
});
```

- [x] **Step 2: הרץ ואמת שהיא נופלת**

```bash
npm test -- lib/core/failureExit.test.ts
```

צפוי: FAIL — `Cannot find module './failureExit'`.

- [x] **Step 3: כתוב את המימוש הטהור**

צור `lib/core/failureExit.ts`:

```ts
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
```

- [x] **Step 4: הרץ ואמת שהיא עוברת**

```bash
npm test -- lib/core/failureExit.test.ts && npm run check:core
```

צפוי: PASS · `check:core` OK.

- [x] **Step 5: חבר את `LevelMapScreen.tsx` (ⓐ · ⓑ)**

הוסף לייבוא:

```ts
import { failureExit, isRetryable } from '@/lib/core/failureExit';
```

והחלף את בלוק `state.kind === 'failed'` (שורות 146-159 בקוד הנוכחי):

```tsx
      {state.kind === 'failed' ? (
        // T-124 · D-065: כל ענף כשל נושא יציאה. קודם לכן `schema_missing`
        // הופיע בלי שום כפתור ו-`session_expired` בלי קישור ל-/login.
        <div className="flex flex-col gap-3">
          <p className="text-lg">{failureText(state.code)}</p>
          {isRetryable(state.code) ? (
            <button
              type="button"
              onClick={() => void load()}
              className="flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-ink active:opacity-90"
            >
              {RETRY_HE}
            </button>
          ) : null}
          {/* ⛔ `<a>` ולא `<Link>`: כשהסשן מת הבקשה הבאה חייבת להגיע לשרת
              ולקבל רשות להפנות — הראוטר של הלקוח עלול לענות מהמטמון. */}
          <a
            href={failureExit(state.code).href}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {failureExit(state.code).labelHe}
          </a>
        </div>
      ) : null}
```

- [x] **Step 6: חבר את `StudyDeckScreen.tsx` (ⓒ)**

הוסף לייבוא:

```ts
import { failureExit, isRetryable } from '@/lib/core/failureExit';
```

והחלף את שלושת ענפי ה-`ActionBar` (שורות 232-256 בקוד הנוכחי) — הענף `empty` נשאר **כמות שהוא**, ורק ענפי הכשל משתנים:

```tsx
      <ActionBar>
        {state.kind === 'session_expired' ? (
          <a
            href={failureExit('session_expired').href}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {SIGN_IN_AGAIN_HE}
          </a>
        ) : state.kind === 'schema_missing' ? (
          // ⛔ אין «נסה שוב» כאן, וזה ⓒ במשימה: המיגרציה לא תרוץ מפני שהלומד
          // לחץ על כפתור, ולכן הכפתור ההוא לעולם לא היה מצליח.
          <a
            href={failureExit('schema_missing').href}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {failureExit('schema_missing').labelHe}
          </a>
        ) : state.kind === 'empty' ? (
          <Link
            href={deck === 'due' ? '/study?deck=unknown' : '/cards'}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-base font-semibold text-brand-on active:opacity-90"
          >
            {deck === 'due' ? START_NEW_HE : BACK_TO_CARDS_HE}
          </Link>
        ) : isRetryable('unavailable') ? (
          <button
            type="button"
            onClick={() => void load()}
            data-primary-action="true"
            className="flex w-full min-h-touch items-center justify-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90"
          >
            {RETRY_HE}
          </button>
        ) : null}
      </ActionBar>
```

⚠️ אם `ActionBar` אינו מסוגל להכיל שני ילדים, השאר את מבנה הענף היחיד כפי שהוא כאן — כל ענף מפיק אלמנט אחד בדיוק. ⛔ אל תוסיף שני כפתורים לתוך `ActionBar` בלי לבדוק את `components/ActionBar.tsx` תחילה; `ActionBar.test.ts` נועל את המבנה שלו.

- [x] **Step 7: חבר את `app/error.tsx` (ⓓ)**

```tsx
'use client';

/**
 * Route-level error boundary. UX plan T-001: never a white screen, and never
 * an English stack trace in front of a Hebrew-speaking learner.
 *
 * T-056: the wording is imported and ⛔ never restated here.
 * T-124 · D-065: `reset()` לבדו הוא מסך ללא דרך החוצה כשהתקלה מתמידה —
 * הלומד לוחץ, המסך קורס שוב, ואין לאן ללכת. היציאה נוספה לצידו.
 */
import { FAILURE_HE, FAILURE_TITLE_HE, RETRY_HE } from '@/lib/core/failure';
import { failureExit } from '@/lib/core/failureExit';

export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  const exit = failureExit('unavailable');
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold leading-tight">{FAILURE_TITLE_HE.route}</h1>
        <p className="text-lg leading-relaxed text-ink-muted">{FAILURE_HE.crash}</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          {RETRY_HE}
        </button>
        {/* ⛔ `<a>` ולא `<Link>`: הראוטר של הלקוח הוא בדיוק מה שקרס. */}
        <a
          href={exit.href}
          className="flex min-h-touch items-center justify-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90"
        >
          {exit.labelHe}
        </a>
      </div>
    </div>
  );
}
```

- [x] **Step 8: כתוב את שומרי המקור — הבדיקה שהמשימה נוקבת בה**

צור `app/error.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/error.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('T-124 · D-065 — גבול השגיאה נושא יציאה', () => {
  it('⛔ אין רק reset() — יש גם ניווט החוצה', () => {
    expect(CODE).toContain('reset');
    expect(CODE).toMatch(/<a\s/);
  });

  it('היעד מגיע מהטבלה ⛔ ואינו נכתב כאן', () => {
    expect(CODE).toContain('failureExit');
    expect(CODE).not.toMatch(/href="\/studies"/);
  });

  it('⛔ אין מרכוז אנכי (F-011 · F-016)', () => {
    expect(CODE).not.toContain('justify-center gap');
    expect(CODE).not.toContain('h-screen');
  });
});
```

הוסף ל-`components/LevelMapScreen.test.ts`:

```ts
describe('T-124 · D-065 — כל ענף כשל נושא יציאה', () => {
  it('הטבלה מיובאת ⛔ והכלל אינו משוכפל כאן', () => {
    expect(CODE).toContain('failureExit');
    expect(CODE).toContain('isRetryable');
  });

  it('⛔ «נסה שוב» כבר אינו מותנה בקוד קשיח בקובץ הזה', () => {
    expect(CODE).not.toMatch(/state\.code === 'unavailable' \?/);
  });

  it('בלוק הכשל מכיל <a> — יציאה, ⛔ ולא רק משפט', () => {
    const start = CODE.indexOf("state.kind === 'failed'");
    expect(start).toBeGreaterThan(-1);
    const block = CODE.slice(start, start + 1400);
    expect(block).toMatch(/<a\s/);
  });
});
```

הוסף ל-`components/StudyDeckScreen.test.ts`:

```ts
describe('T-124 · D-065 — schema_missing ⛔ אינו מציע «נסה שוב»', () => {
  it('יש ענף schema_missing נפרד ב-ActionBar', () => {
    expect(CODE).toMatch(/state\.kind === 'schema_missing' \?/);
  });

  it('הטבלה מיובאת ⛔ והיעדים אינם קשיחים כאן', () => {
    expect(CODE).toContain('failureExit');
  });

  it('⛔ «נסה שוב» אינו ענף ברירת המחדל שתופס גם את schema_missing', () => {
    // זה היה הבאג: `: (` תפס schema_missing והציע כפתור שלעולם לא יצליח.
    const retry = CODE.indexOf('RETRY_HE');
    const schema = CODE.indexOf("state.kind === 'schema_missing' ?");
    expect(schema).toBeLessThan(retry);
  });
});
```

- [x] **Step 9: אימות מלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

צפוי: `typecheck` 0 · `check:core` OK · הכל ירוק (כ-17 בדיקות נוספות) · `build` 0.
⚠️ אם בדיקה קיימת ב-`StudyDeckScreen.test.ts` נועלת את המבנה הישן של `ActionBar` — **אל תמחק אותה. תקן את הטענה** כך שתתאר את הכלל החדש, ורשום את השינוי בהודעת הקומיט.

- [x] **Step 10: קומיט**

```bash
git add lib/core/failureExit.ts lib/core/failureExit.test.ts components/LevelMapScreen.tsx components/LevelMapScreen.test.ts components/StudyDeckScreen.tsx components/StudyDeckScreen.test.ts app/error.tsx app/error.test.ts
git commit -m "loop(DEV): C-XXXX T-124 — ⛔ אין מסך כשל בלי יציאה (D-065)"
```

---

## Task 4: לשונית «העולם» מפסיקה לשקר על תנאי הפתיחה (T-125 · D-066 · § 4.2יא)

**Files:**
- Create: `lib/core/worldGate.ts`
- Create: `lib/core/worldGate.test.ts`
- Modify: `components/TabBar.tsx:63-89` · `:110-130`
- Modify: `components/TabBar.test.ts`
- Modify: `docs/api-contract.md` § `GET /api/world/status`

**Interfaces:**
- Consumes: `GET /api/world/status` ⇒ `{ ok: true, unlocked: boolean, functionWords: number, activeWords: number }` — הגוף **כבר** נושא את `functionWords` (`app/api/world/status/route.ts:99-106`, דרך `...counts`). ⛔ אין שינוי בשרת ואין מיגרציה.
- Produces:
  ```ts
  // lib/core/worldGate.ts
  export interface WorldGateCounts {
    readonly functionWords: number | null;
    readonly activeWords: number | null;
  }
  export interface WorldGateThresholds {
    readonly minFunctionWords: number;
    readonly minActiveWords: number;
  }
  export function worldGateSentenceHe(
    counts: WorldGateCounts,
    thresholds: WorldGateThresholds,
  ): string;
  ```

### הכרעות התכנון

1. **הפגם הוא משפט, ⛔ לא סף.** הסף `MIN_FUNCTION_WORDS = 100` נשאר בדיוק כפי שהוא — הוא מדיניות מוצר (D-031), ו-D-066 ⛔ אינו מבקש לשנותו. מה שמשתנה הוא שהמשפט מפסיק להציג מספר שלעולם לא יפתח את הלשונית.
2. **הספים מגיעים כארגומנט ⛔ ואינם מיובאים.** זהו בדיוק הכלל שכבר נאכף ב-`isWorldUnlocked` (`lib/core/world.ts:6-10`): קבוע שמיוצא מהשכבה הטהורה מצוטט אחר כך כאילו היא גזרה אותו. ⚠️ **אבל הספים עצמם חיים היום ב-`route.ts` ⛔ ואינם על החוט.** ⇒ `TabBar` חייב לקבל אותם, ולכן **המסלול מוסיף שני שדות לתשובה**: `minFunctionWords` ו-`minActiveWords`. ⛔ זה שינוי חוזה, ולכן `docs/api-contract.md` מתעדכן באותו קומיט.
3. **⛔ אין העתק של `12` ב-`TabBar`.** היום המספר כתוב בעברית בתוך המחרוזת (`TabBar.tsx:77-78`) — כלומר העתק שקט של הסף שהשרת מחזיק. הוא נמחק.
4. **`null` נשאר `null`.** כל עוד הספירה אינה ידועה, המשפט מציג את התנאי **בלי** «יש לך ‎<n>‎» — הכלל הקיים בחוזה (`docs/api-contract.md:460`), ⛔ והוא לא משתנה.

- [ ] **Step 1: כתוב את בדיקת היחידה שנופלת**

צור `lib/core/worldGate.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { worldGateSentenceHe } from './worldGate';

/**
 * T-125 · D-066 — «כשחסרות מילות תפקוד המשפט אומר זאת מפורשות ⛔ ואינו מציג
 * מספר מטעה».
 *
 * הפגם שנמדד C-0207: הלשונית נעולה על **שני** תנאים, והמשפט סיפר על אחד.
 * במאגר ריק הלומד רואה «12 מילים פעילות» — מספר שלעולם לא יפתח את הלשונית,
 * כי התנאי החוסם ⛔ אינו בשליטתו ו⛔ אינו מוצג.
 */
const T = { minFunctionWords: 100, minActiveWords: 12 };

describe('כשהמאגר עצמו אינו מוכן', () => {
  it('המשפט אומר שהמאגר טרם מוכן ⛔ ואינו מציג יעד שהלומד אינו יכול להזיז', () => {
    const text = worldGateSentenceHe({ functionWords: 0, activeWords: 3 }, T);
    expect(text).toContain('המאגר');
    expect(text).not.toContain('12');
    expect(text).not.toContain('יש לך');
  });

  it('⛔ גם כשהלומד כבר עבר את הסף שלו — התנאי החוסם הוא האחר', () => {
    const text = worldGateSentenceHe({ functionWords: 40, activeWords: 500 }, T);
    expect(text).toContain('המאגר');
    expect(text).not.toContain('500');
  });
});

describe('כשהמאגר מוכן והלומד עדיין לא', () => {
  it('המשפט חוזר להיות המשפט של § 4.2ה, עם הסף ועם הספירה', () => {
    const text = worldGateSentenceHe({ functionWords: 120, activeWords: 5 }, T);
    expect(text).toContain('12');
    expect(text).toContain('יש לך 5');
  });

  it('⛔ הסף מגיע מהארגומנט ⛔ ואינו קשיח בפונקציה', () => {
    const text = worldGateSentenceHe(
      { functionWords: 120, activeWords: 5 },
      { minFunctionWords: 100, minActiveWords: 20 },
    );
    expect(text).toContain('20');
    expect(text).not.toContain('12');
  });
});

describe('כשספירה אינה ידועה', () => {
  it('⛔ `null` אינו `0`: הפסוקית «יש לך» נעדרת, והסף עדיין נאמר', () => {
    const text = worldGateSentenceHe({ functionWords: 120, activeWords: null }, T);
    expect(text).toContain('12');
    expect(text).not.toContain('יש לך');
  });

  it('⛔ מאגר לא ידוע אינו «מאגר לא מוכן» — המשפט אינו טוען עובדה שלא נמדדה', () => {
    const text = worldGateSentenceHe({ functionWords: null, activeWords: null }, T);
    expect(text).not.toContain('המאגר');
    expect(text).toContain('12');
  });
});
```

- [ ] **Step 2: הרץ ואמת שהיא נופלת**

```bash
npm test -- lib/core/worldGate.test.ts
```

צפוי: FAIL — `Cannot find module './worldGate'`.

- [ ] **Step 3: כתוב את המימוש הטהור**

צור `lib/core/worldGate.ts`:

```ts
/**
 * PURE. ⛔ No React, no DOM, no clock, no env, no I/O.
 *
 * T-125 · D-066 — המשפט שהלומד קורא כשלשונית «העולם» נעולה.
 *
 * ⚠️ הלשונית נעולה על **שני** תנאים (`isWorldUnlocked`), והמשפט סיפר על אחד.
 * במאגר ריק הלומד ראה יעד של 12 מילים פעילות שלעולם לא היה פותח את הלשונית,
 * כי התנאי החוסם ⛔ אינו בשליטתו ו⛔ לא הוצג לו.
 *
 * ⛔ הספים ⛔ אינם כאן. הם מגיעים כארגומנט, מאותה סיבה בדיוק ש-`isWorldUnlocked`
 * מקבל אותם: קבוע שמיוצא מהשכבה הטהורה מצוטט אחר כך כאילו היא גזרה אותו,
 * ו-D-031 קובע שאלה מספרי מוצר ⛔ ולא מספרים פדגוגיים.
 */

export interface WorldGateCounts {
  /** ⛔ `null` הוא «לא ידוע» ⛔ ואינו `0`. */
  readonly functionWords: number | null;
  readonly activeWords: number | null;
}

export interface WorldGateThresholds {
  readonly minFunctionWords: number;
  readonly minActiveWords: number;
}

/** ⛔ כשהמאגר טרם מוכן ⛔ אין מספר במשפט: היעד אינו בשליטת הלומד. */
const BANK_NOT_READY_HE = 'המאגר עדיין נבנה. העולם ייפתח כשהוא יהיה מוכן.';

export function worldGateSentenceHe(
  counts: WorldGateCounts,
  thresholds: WorldGateThresholds,
): string {
  // ⛔ `null` ⇒ ⛔ לא «לא מוכן». ספירה שלא הגיעה אינה עדות לכך שהמאגר חסר,
  // וטענה כזאת היא עובדה שאיש לא מדד — אותו כלל של «—» מול `0`.
  if (counts.functionWords !== null && counts.functionWords < thresholds.minFunctionWords) {
    return BANK_NOT_READY_HE;
  }
  const base = `העולם ייפתח כשיהיו לך ${thresholds.minActiveWords} מילים פעילות.`;
  return counts.activeWords === null ? base : `${base} יש לך ${counts.activeWords}.`;
}
```

- [ ] **Step 4: הרץ ואמת שהיא עוברת**

```bash
npm test -- lib/core/worldGate.test.ts && npm run check:core
```

צפוי: PASS · `check:core` OK.

- [ ] **Step 5: שלח את הספים על החוט**

ב-`app/api/world/status/route.ts`, החלף את בלוק ה-`return` (שורות 99-106):

```ts
  // ⛔ Computed on every call. A cached unlock state is a wrong unlock state.
  const thresholds = {
    minFunctionWords: MIN_FUNCTION_WORDS,
    minActiveWords: MIN_ACTIVE_WORDS,
  };
  // T-125 · D-066: הספים עולים על החוט משום שהלשונית נעולה על שניהם והמשפט
  // חייב לדעת על שניהם. ⛔ הם עדיין חיים כאן ו⛔ לא ב-lib/core (D-031) —
  // הצרכן מקבל אותם, ⛔ ואינו מחזיק העתק שיכול לחלוק בשקט.
  return NextResponse.json({
    ok: true,
    unlocked: isWorldUnlocked(counts, thresholds),
    ...counts,
    ...thresholds,
  });
```

- [ ] **Step 6: חבר את `TabBar.tsx`**

מחק את `worldSheetTextHe` על כל התיעוד שלו (שורות 63-78) והוסף לייבוא:

```ts
import { worldGateSentenceHe } from '@/lib/core/worldGate';
```

הרחב את שני הטיפוסים (שורות 80-89):

```ts
/**
 * ⚠️ `functionWords` נקרא כאן מאז T-125. קודם לכן הוא נחשב «עניין של המאגר
 * ולא של הלשונית» — וזה היה הפגם: הלשונית נעולה על **שני** התנאים, והמשפט
 * סיפר על אחד. הספים מגיעים מהשרת ⛔ ואינם מועתקים לכאן.
 */
type WorldStatus = {
  readonly unlocked: boolean;
  readonly functionWords: number;
  readonly activeWords: number;
  readonly minFunctionWords: number;
  readonly minActiveWords: number;
};

type StatusResponse = ({ readonly ok: true } & WorldStatus) | { readonly ok: false; readonly code: string };
```

בתוך ה-`useEffect` (שורה 120), החלף את שורת ה-`setWorldStatus`:

```ts
        setWorldStatus({
          unlocked: body.unlocked,
          functionWords: body.functionWords,
          activeWords: body.activeWords,
          minFunctionWords: body.minFunctionWords,
          minActiveWords: body.minActiveWords,
        });
```

ובגוף הגיליון, החלף את הקריאה ל-`worldSheetTextHe(...)` ב:

```tsx
              {worldGateSentenceHe(
                {
                  functionWords: worldStatus?.functionWords ?? null,
                  activeWords: worldStatus?.activeWords ?? null,
                },
                {
                  // ⛔ ברירת המחדל היא הסף שהשרת שלח. כשהוא לא הגיע — הפונקציה
                  // מקבלת `null` בשתי הספירות וממילא אינה טוענת דבר על המאגר.
                  minFunctionWords: worldStatus?.minFunctionWords ?? 0,
                  minActiveWords: worldStatus?.minActiveWords ?? 0,
                },
              )}
```

⚠️ **בדוק את מזהה האלמנט:** הגיליון נושא `aria-labelledby="world-sheet-text"`, ולכן האלמנט שמכיל את המשפט חייב לשמור על `id="world-sheet-text"`. ⛔ אל תמחק אותו.

⚠️ כאשר הסטטוס `null` לגמרי, `minActiveWords` יהיה `0` והמשפט יאמר «כשיהיו לך 0 מילים פעילות» — **וזה שגוי**. לכן העטוף כולו מותנה: כשה-`worldStatus === null` הצג את המחרוזת הקבועה

```tsx
              {worldStatus === null
                ? 'העולם ייפתח בהמשך.'
                : worldGateSentenceHe(/* כמו למעלה */)}
```

והוסף את המחרוזת הזאת כקבוע `WORLD_SHEET_UNKNOWN_HE` בראש הקובץ.

- [ ] **Step 7: עדכן את `docs/api-contract.md`**

בסעיף `## GET /api/world/status`, אחרי הפסקה על התנהגות הצרכן, הוסף:

```
⚠️ **התשובה נושאת גם את שני הספים** — `minFunctionWords` ו-`minActiveWords` (T-125 · D-066).
⛔ הם ⛔ אינם מועתקים ל-`TabBar`: הלשונית נעולה על **שניהם**, והמשפט שהלומד קורא חייב
לדעת על שניהם. עד T-125 הגיליון הציג יעד של 12 מילים פעילות גם כשהתנאי החוסם היה
`functionWords < 100` — מספר שלעולם לא היה פותח את הלשונית, ושהלומד ⛔ אינו יכול להזיז.
⛔ הספים עצמם עדיין חיים במסלול הזה ו⛔ לא ב-`lib/core` (D-031).
```

- [ ] **Step 8: הרחב את `components/TabBar.test.ts`**

```ts
describe('T-125 · D-066 — המשפט מכיר בשני התנאים', () => {
  it('⛔ אין העתק של הסף בתוך מחרוזת עברית בקובץ הזה', () => {
    // זה היה ההעתק השקט: «12 מילים פעילות» כתוב בעברית בתוך TabBar,
    // בזמן שהמספר שמחליט חי בשרת.
    expect(CODE).not.toMatch(/כשיהיו לך 12/);
  });

  it('המשפט מואצל ל-lib/core ⛔ ואינו נבנה כאן', () => {
    expect(CODE).toContain('worldGateSentenceHe');
  });

  it('functionWords נקרא — התנאי שהיה חוסם ובלתי-נראה', () => {
    expect(CODE).toContain('functionWords');
  });

  it('הספים מגיעים מהשרת ⛔ ואינם קבועים כאן', () => {
    expect(CODE).toContain('minFunctionWords');
    expect(CODE).toContain('minActiveWords');
  });

  it('⛔ סטטוס לא ידוע אינו מייצר «כשיהיו לך 0 מילים»', () => {
    expect(CODE).toContain('WORLD_SHEET_UNKNOWN_HE');
    expect(CODE).toMatch(/worldStatus === null/);
  });

  it('מזהה הגיליון נשמר — aria-labelledby מצביע עליו', () => {
    expect(CODE).toContain('world-sheet-text');
  });
});
```

⚠️ בדוק אם `TabBar.test.ts` הקיים נועל את המחרוזת «כשיהיו לך 12 מילים פעילות». אם כן — **תקן את הטענה** לכלל החדש; ⛔ אל תמחק אותה.

- [ ] **Step 9: בדוק את בדיקות המסלול**

```bash
npm test -- app/api/world/status/route.test.ts
```

צפוי: אם בדיקה קיימת נועלת את **צורת** הגוף (`toEqual` על אובייקט מדויק) — היא תיפול על שני השדות החדשים. **הרחב את הציפייה**; ⛔ אל תמחק את הבדיקה.

- [ ] **Step 10: אימות מלא**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

צפוי: `typecheck` 0 · `check:core` OK · הכל ירוק (כ-14 בדיקות נוספות) · `build` 0.

- [ ] **Step 11: קומיט**

```bash
git add lib/core/worldGate.ts lib/core/worldGate.test.ts components/TabBar.tsx components/TabBar.test.ts app/api/world/status/route.ts app/api/world/status/route.test.ts docs/api-contract.md
git commit -m "loop(DEV): C-XXXX T-125 — לשונית העולם מפסיקה לשקר על תנאי הפתיחה (D-066)"
```

---

## Self-Review

**1. כיסוי המפרט**

| דרישה | משימה | מכוסה |
|---|---|---|
| T-122 ⓐ — ניתוב מ-`/` מוביל ל-`/studies` כשה-onboarding הושלם | 1 · שלב 5 | ✅ |
| T-122 ⓑ — `/onboarding` בודק בעצמו ומפנה הלאה | 1 · שלב 7 | ✅ |
| T-123 · D-064 — «אריח מושבת ⛔ אינו חוקי כשכל האריחים מושבתים» | 2 · שלבים 3 · 5 | ✅ |
| T-123 — הפעולה מובילה ל-`/study` ⛔ ולא לשלושה כפתורים מתים | 2 · שלב 5 | ✅ |
| T-124 ⓐ — `LevelMapScreen` `schema_missing` בלי יציאה | 3 · שלב 5 | ✅ |
| T-124 ⓑ — `LevelMapScreen` `session_expired` בלי קישור ל-`/login` | 3 · שלב 5 | ✅ |
| T-124 ⓒ — `StudyDeckScreen` «נסה שוב» על `schema_missing` | 3 · שלב 6 | ✅ |
| T-124 ⓓ — `app/error.tsx` `reset()` בלבד | 3 · שלב 7 | ✅ |
| T-124 — בדיקה: כל ענף כשל מכיל `<a>` או `<Link>` | 3 · שלב 8 | ✅ |
| T-125 · D-066 — «כשחסרות מילות תפקוד המשפט אומר זאת מפורשות» | 4 · שלב 3 | ✅ |
| T-125 — ⛔ אינו מציג מספר מטעה | 4 · שלבים 3 · 6 | ✅ |

**2. סריקת מציין־מקום** — ⛔ אין `TODO` · ⛔ אין «טיפול בשגיאות מתאים» · ⛔ אין «בדיקות כמו במשימה N». כל בלוק קוד הוא הקוד עצמו.

**3. עקביות טיפוסים** — `OnboardedState` מוגדר במשימה 1 ומשמש שם בלבד. `FailureCode` מוגדר במשימה 3 ומשמש בשלושת המסכים באותה משימה. `WorldGateCounts` מקבל `number | null` ומקבל אותו בפועל מ-`worldStatus?.x ?? null` (משימה 4 שלב 6). `TileState` מקבל `{ enabled: boolean }` ו-`DeckEntry` הקיים ב-`DeckSelector` נושא `enabled` — ⚠️ **`DeckEntry` הוא איחוד מובחן (`enabled: true` \| `enabled: false`)**, והוא מתקבל על ידי `readonly TileState[]` משום ש-`boolean` הוא העל-טיפוס של שניהם. ✅

**4. מה שהתוכנית הזאת ⛔ אינה עושה, ונאמר כדי שאיש לא יטעה בירוק שלה לכיסוי**

- ⛔ אינה מריצה את `0015_arcade_decoupling.sql` ואינה טוענת תוכן למאגר. הפריט 40 ב-`03-for-roy` נשאר פתוח, ו-T-123 היא בדיוק הכרה בכך שמאגר ריק הוא מצב שהמוצר חייב לשרוד.
- ⛔ אינה נוגעת ב-T-126 (סף הזירה) ⛔ ולא ב-T-130 (מונה התחמושת). הן P1, וסדר העבודה D-069 קובע P0 קודם.
- ⛔ אינה מוכיחה התנהגות מול Supabase חי. שומרי המקור מוכיחים שהקוד קורא לפונקציה הנכונה; ההחלטות עצמן נמדדות בארבעת קובצי ה-`lib/core/*.test.ts` החדשים.
