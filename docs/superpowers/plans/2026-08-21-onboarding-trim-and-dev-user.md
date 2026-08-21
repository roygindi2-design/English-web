# Onboarding Trim and Dev Test User Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** לסגור את **שתי שורות המשימה היחידות שנשארו כשירות ואין להן תוכנית** — **T-111** (הסרת שאלת המוסד מה-onboarding, D-056) ו-**T-113** (משתמש בדיקה לפיתוח, D-057). שתיהן נגזרות מהוראה חיה של רוי מ-19/08, שתיהן נוגעות ב**שער הכניסה** של המוצר, ולשתיהן אותו כלל מארגן: **מה שאסור להתקיים ⛔ אינו נמחק ונשכח — הוא נמחק ונולד עליו רַצֶ׳ט שנופל בשם ביום שמישהו יחזיר אותו.**

**Architecture:** שתי השורות נבנות באותן שלוש שכבות בדיוק, ⛔ ואין כאן דפוס שלישי:

1. **שכבה טהורה** (`lib/core/`) — ההכרעה. ‏T-111 מסירה את `institution` מחוזה `checkOnboarding`; ‏T-113 מוסיפה את `devUserGate()`, פונקציה **טהורה** שמקבלת שלוש מחרוזות ומחליטה אם השער פתוח. ⛔ אפס `process.env` · React · DOM · שעון · רשת.
2. **קצה** (‏`app/api/*` · `lib/supabase/*`) — קריאת הסביבה והדיבור עם Supabase. ‏T-111 מפסיקה לכתוב עמודה; ‏T-113 מוסיפה נתיב **שמחזיר 404 בייצור**.
3. **רכיב** (`components/`) — ‏T-111 מסירה שדה. ⛔ **ל-T-113 אין רכיב, ⛔ ואין מסך** (סטייה 3).

⛔ **אפס עמודה חדשה · אפס מיגרציה · אפס SQL · אפס `drop column` · אפס תלות חדשה ב-`package.json`.** ‏`profiles.institution` **נשארת בסכמה** (D-056 מפורשות), ומשתמש הבדיקה הוא **משתמש רגיל** ש-RLS חלה עליו במלואה.

**Tech Stack:** TypeScript (ללא `any`, `noUncheckedIndexedAccess` פעיל) · Next.js App Router (Route Handlers) · Supabase `@supabase/ssr` דרך `lib/supabase/auth.ts` בלבד · React 19 client components · Vitest (סביבת `node`, **⛔ בלי jsdom** ⇒ בדיקות רכיב ונתיב הן **סריקת מקור**) · Playwright דרך `npm run check:mobile`.

**Spec:**
`plan/40-decisions.md` — **D-056** (שורה 1525) · **D-057** (שורה 1534) · **§ 4.2ד** (שורה 723, המסך שמתבטל) · **D-063** (שורה ~1720, הלומד החוזר) · **E3** · **R-012** · **A7**
`plan/50-tasks.md` — שורות **T-111** · **T-113**
`plan/60-findings.md` — **F-002** (‏`SESSION_COOKIE_OPTIONS` — הנתיב החדש חייב לעבור דרכן) · **F-010** (‏service-role) · **F-027** (‏`data-primary-action` ⛔ רק במסלול שנמדד) · **F-039 · F-065 · F-087 · F-088** (הלבנת הערות בבדיקות סריקה) · **F-015 · TD-5** (‏`enterKeyHint="go"` = טענה מוקלדת שזה השדה האחרון)
`plan/03-for-roy.md` — **פריט 36** (חוב ההסרה של D-057 — **כבר פתוח**, ראה סטייה 4)
`docs/api-contract.md` — `POST /api/profile` (שורה 122) · השורה המבוטלת `POST /api/onboarding` (שורה 1170)

---

## Global Constraints

- ⛔ `/lib/core/` **טהור**: אפס `React` · `window` · `document` · `localStorage` · `sessionStorage` · `process.env` · `fetch` · `Date.now()` · `Math.random()` (`npm run check:core` ⇒ `scripts/check-core-purity.mjs:16` תופס `process.env` בשם). ⇒ **שער משתמש הבדיקה מפוצל לשניים בכוונה**: ההכרעה טהורה, קריאת הסביבה ב-`lib/supabase/`.
- ⛔ **רכיב ממשק ⛔ אינו ניגש לדאטהבייס.** הכל דרך `app/api/*` ו-`lib/api/client.ts`.
- ⛔ **`SUPABASE_SERVICE_ROLE_KEY` ⛔ אינו נקרא בשום קובץ שהתוכנית נוגעת בו** — `lib/supabase/serviceRole.test.ts` סורק את `app` · `components` · `lib` · `proxy.ts` ויפול בשם. **הנתיב החדש נכנס בדיוק לתחום הסריקה הזה** ⇒ הוא **מוגן מהיום הראשון בלי שורה חדשה.**
- ⛔ **כל `createServerClient` עובר דרך `lib/supabase/auth.ts`** ומקבל את `SESSION_COOKIE_OPTIONS` (‏F-002). ⛔ הנתיב החדש ⛔ אינו יוצר לקוח משלו.
- ⛔ **אפס `drop column`, אפס מיגרציה, אפס קובץ ב-`supabase/`.** מחיקת עמודה הרסנית ואינה סמכות סוכן (D-056 · פריט 8).
- Mobile-First 375px · יעדי מגע 44px (`min-h-touch`) · RTL · TypeScript ללא `any`.
- ⛔ **חוקה § 6 · F-011 · F-016**: אפס מרכוז אנכי · אפס גרדיאנט סגול · אפס `backdrop-blur` · `shadow-2xl` · אפס hex גולמי · אפס `Inter`. ⛔ **אין לערוך את `plan/35-design-constitution.md`.**
- `docs/api-contract.md` מתעדכן **באותו קומיט** של כל שינוי בנקודות קצה (‏Task 2 · Task 6).
- כל בדיקת סריקה **מלבינה הערות לפני כל טענה** (F-039 · F-065 · F-087), **⛔ אלא כשהטענה היא על ההערה עצמה** (F-088).
- ⛔ **כל טיק שנוגע ב-`plan/50-tasks.md` או ב-`plan/60-findings.md` מריץ `npm run measure:plan` ומחייב את `docs/plan-tables.md` באותו קומיט** — זה השורש של F-111, והוא חל על **כל אחת** משש המשימות כאן.
- פקודת האימות המלאה, ⛔ ואין טענת הצלחה בלעדיה:
  `npm run typecheck && npm run check:core && npm test && npm run build`
  ובנוסף `npm run check:mobile` ב-**Task 3** (הרכיב היחיד שנוגעים בו).
- ⛔ **בלי `[skip ci]`** (`RULES § 0.7`). ⛔ דוחפים ל-`dev` בלבד.

---

## ארבע סטיות מוצהרות, ⛔ ולא השמטות

### סטייה 1 — `institution` יורדת מה**שאלה** ומה**כתיבה**, ⛔ ולא מה**תצוגה**

שורת T-111 נוקבת בבדיקה: «סריקת מקור ש-`institution` ⛔ אינו מופיע באף רכיב **onboarding**». **נמדד** שהמחרוזת חיה בשישה קבצי מוצר, ורק שלושה מהם הם onboarding:

| קובץ | מה הוא עושה עם `institution` | ⇒ |
|---|---|---|
| `components/OnboardingForm.tsx:52,74,151` | **שואל** את הלומד ושולח בגוף הבקשה | ⛔ **יורד** (Task 3) |
| `lib/core/onboarding.ts:58,65,163-166,230-232,237` | הטיפוס, שלושת הקבועים והפרסור | ⛔ **יורד** (Task 1) |
| `app/api/profile/route.ts:47,65` | **כותב** לעמודה | ⛔ **יורד** (Task 2) |
| `components/MeScreen.tsx:38,80,86,89-94` | **מציג** את המטרה של הלומד | ✅ **נשאר** |
| `app/(tabs)/me/page.tsx` | מזין את `MeScreen` מהעמודה | ✅ **נשאר** |
| `supabase/migrations/0009_onboarding_institution.sql` | העמודה עצמה + `profiles_institution_length_check` | ✅ **נשארת** |

**וזו ⛔ אינה פרשנות מרחיבה — זה ציטוט:** D-056 אומרת «⛔ **העמודה `profiles.institution` ⛔ אינה נמחקת**», ושורת T-111 אומרת «✅ **בלוק «המטרה שלך» ב-`/me` נשאר** — רוי פסל את השאלה, ⛔ לא את הצגת המטרה».

⚠️ **ומה שזה עולה, ⛔ ולא הוסתר:** ללומד **חדש** העמודה תישאר `NULL` לנצח ⇒ שורת המוסד ב-`/me` ⛔ לעולם לא תוצג לו, והבלוק יציג ציון יעד בלבד (‏`MeScreen.tsx:86` כבר מסתיר את הבלוק כששניהם ריקים — הענף **קיים ונבדק**, `MeScreen.test.ts:120`). ללומד **קיים** שכבר ענה — התצוגה ⛔ לא משתנה. ⇒ **אפס קוד מת: הענף חי לכל מי שכבר במאגר, וזו בדיוק הסיבה שהעמודה נשארת.** נרשם כחוב **TD** ב-`plan/30-architecture.md` (Task 2, צעד 4).

### סטייה 2 — `INSTITUTION_MAX_LENGTH` נמחק, ולכן בדיקת המיגרציה **חייבת** לעבור למספר גולמי

**נמדד:** `lib/core/onboarding.test.ts:292-294` טוענת ש-`0009_onboarding_institution.sql` מכיל `char_length(institution) <= ${INSTITUTION_MAX_LENGTH}` — כלומר היא **הצרכן היחיד שנשאר** לקבוע אחרי שהרכיב מפסיק לייבא אותו.

שתי חלופות נשקלו, ואחת נמדדה גרועה:
- ⛔ **להשאיר את הקבוע ב-`lib/core/onboarding.ts` "רק בשביל הבדיקה"** — זהו בדיוק הפגם של F-010 (`lib/supabase/server.ts`): קוד שאיש אינו קורא, שיושב בעץ כדרך מוכנה להחזיר את הפיצ׳ר בייבוא אחד. ⇒ **נדחה.**
- ✅ **הקבוע נמחק, והבדיקה עוברת ל-`120` גולמי בקובץ שכבר קורא את המיגרציה** — האילוץ במסד ⛔ לא זז, ולכן הבדיקה עדיין מודדת אותו. ⇒ **נבחר**, והנימוק נכתב בהערה שלה.

⇒ **הבדיקה ⛔ אינה נמחקת ו⛔ אינה מתרככת** — היא מאבדת ייבוא בלבד. אילוץ שאיש אינו בודק הוא אילוץ שהמיגרציה הבאה תשבור בשקט.

### סטייה 3 — למשתמש הבדיקה ⛔ **אין מסך, ⛔ אין כפתור, ואין רכיב** — הוא **נתיב GET שמחזיר 404 בייצור**

D-057 אוסרת במפורש: «⛔ **נתיב `/dev/*` נגיש בייצור**». ⇒ **שלוש חלופות נשקלו:**

| חלופה | למה נדחתה / נבחרה |
|---|---|
| ⛔ עמוד `/dev/login` עם כפתור | ‏`app/dev/*` **נבנה ונפרס בייצור היום** (20+ פיקסצ׳רים, `robots: noindex` בלבד — `app/dev/onboarding/layout.tsx:4`). עמוד חדש שם הוא **בדיוק** מה ש-D-057 אוסרת |
| ⛔ כפתור ב-`/login` מאחורי `NEXT_PUBLIC_*` | משתנה `NEXT_PUBLIC_` **מוטבע בחבילת הדפדפן בזמן בנייה**. ⇒ ההגנה עוברת מהשרת ללקוח, ואת זה אי אפשר לאכוף בבדיקה שרצה על המקור. ⛔ **נדחה** |
| ✅ **`GET /api/dev/session`** | ⛔ אינו תחת `app/dev/`; מחזיר **404 עירום** כששער סגור, ולכן בייצור הוא **⛔ אינו נגיש ואינו מסגיר את קיומו**; נכנס לתחום הסריקה של `lib/supabase/serviceRole.test.ts` בחינם |

⚠️ **`GET` ⛔ ולא `POST`, וזו הכרעה שנרשמת ⛔ ולא נבלעת:** נתיב `POST` ⛔ אינו נגיש משורת הכתובת, ולכן הפיצ׳ר היה מחייב `curl` שמנהל קובץ עוגיות — כלומר סשן ב-`curl` ⛔ ולא בדפדפן שרוי עובד בו, וזה ⛔ **אינו** הדבר שהמשימה נועדה לתת. ‏`GET` שמפנה ל-`/` נותן «פתח כתובת, אתה מחובר». **המחיר — `GET` עם תופעת לוואי, וטענת CSRF תיאורטית — ⛔ אינו קיים כאן:** השער נפתח **אך ורק** כאשר `NODE_ENV !== 'production'` **וגם** שני משתנים ייעודיים קיימים, כלומר אך ורק על מכונת הפיתוח של מי שהגדיר אותם בעצמו.

### סטייה 4 — משתמש הבדיקה **⛔ אינו נוצר בקוד**; הנתיב **מתחבר בלבד**, והיצירה היא צעד ידני חד-פעמי

D-057 כותבת «✅ נבנה: משתמש בדיקה **שנוצר** ⛔ אך ורק מ-`NODE_ENV !== 'production'` ומשתנה סביבה ייעודי». **הקריאה שנבחרה: זהו תנאי על היצירה, ⛔ ולא חיוב שהקוד יבצע אותה.** שלוש מדידות:

ⓐ **יצירה תוכניתית ⛔ אינה דטרמיניסטית.** ‏`supabase.auth.signUp` תחת «Confirm email» **מחזיר משתמש בלי סשן** — כלומר הנתיב היה מצליח ולא מחבר, וזה כשל שקט. ⛔ ואת ההגדרה הזאת הסוכן ⛔ אינו רואה ואינו שולט בה.
ⓑ **נתיב שיודע ליצור חשבונות הוא שטח תקיפה גדול משמעותית מנתיב שיודע להיכנס לחשבון קיים** — וזו החלטת סיכון שרוי כבר קיבל פעם אחת; ⛔ אין סיבה להרחיב אותה מעבר למה שביקש.
ⓖ **פריט 36 ב-`03-for-roy` — שכבר פתוח — כתוב בדיוק בשפה הזאת:** «ⓑ **למחוק את שורת המשתמש מ-Supabase**». ⇒ הפריט **מניח שהשורה נוצרה ביד**.

⇒ הנתיב מנסה `signInWithPassword` בלבד. נכשל בפרטי הכניסה ⇒ הוא מחזיר **הודעה בעברית שנוקבת בצעד הידני המדויק**, ⛔ ולא 500 ו⛔ לא שתיקה. **פריט 36 מתעדכן במקום** (Task 6) בשמות שני המשתנים ובכתובת המשתמש — ⛔ **ואינו נסגר:** ⛔ Dev אינו סוגר פריט שפתח סוכן אחר (כלל הקובץ), ובלאו הכי הוא נסגר רק בהשקה.

---

## File Structure

| קובץ | אחריות | משימה |
|---|---|---|
| `lib/core/onboarding.ts` (**M**) | הסרת `institution` מ-`OnboardingRaw` · `OnboardingAnswers` · הפרסור · שלושת הקבועים | 1 |
| `lib/core/onboarding.test.ts` (**M**) | ה-`describe` של המוסד יורד; **נולד רַצֶ׳ט היעדר**; בדיקת המיגרציה עוברת ל-`120` גולמי | 1 |
| `app/api/profile/route.ts` (**M**) | ⛔ מפסיק לכתוב `institution` — שתי שורות | 2 |
| `app/api/profile/route.test.ts` (**M**) | שלוש הטענות על המוסד מוחלפות ב**רַצֶ׳ט היעדר** באותו קובץ | 2 |
| `docs/api-contract.md` (**M**) | גוף `POST /api/profile` בלי `institution` + פסקת ההסבר מוחלפת בשורת «מה קרה לשדה» | 2 · 6 |
| `plan/30-architecture.md` (**M**) | ‏TD חדש: עמודה נטושה-בכוונה + חוב משתמש הבדיקה | 2 · 6 |
| `components/OnboardingForm.tsx` (**M**) | הסרת ה-state, ה-`<label>` ומפתח הגוף | 3 |
| `components/OnboardingForm.test.ts` (**M**) | ‏`describe('the institution field')` יורד; **רַצֶ׳ט היעדר** + הטענה על `enterKeyHint="go"` נשמרת | 3 |
| `lib/core/devUser.ts` (**חדש**) | ‏`devUserGate()` — טהור, נכשל **סגור**, ומחזיר סיבה ממוינת | 4 |
| `lib/core/devUser.test.ts` (**חדש**) | טבלת אמת מלאה של השער + האינווריאנט «אין `open:true` בלי שתי מחרוזות» | 4 |
| `lib/supabase/devUser.ts` (**חדש**) | ‏`readDevUserGate()` — הקריאה **היחידה** ל-`process.env` של הפיצ׳ר | 5 |
| `lib/supabase/devUser.test.ts` (**חדש**) | ‏`vi.stubEnv` על שלושת המשתנים + **סריקת מקור** שאיש אחר אינו קורא אותם | 5 |
| `.env.example` (**M**) | שני המשתנים, **בערך ריק**, עם שלוש שורות הסבר | 5 |
| `app/api/dev/session/route.ts` (**חדש**) | ‏GET · 404 כששער סגור · `signInWithPassword` · 302 ל-`/` | 6 |
| `app/api/dev/session/route.test.ts` (**חדש**) | סריקת מקור: השער **לפני** הלקוח · אפס service-role · אפס סיסמה מוטבעת | 6 |
| `plan/03-for-roy.md` (**M**) | **עדכון במקום** של פריט 36 — שמות המשתנים והמייל | 6 |
| `plan/50-tasks.md` · `plan/60-findings.md` · `plan/00-control.md` · `docs/plan-tables.md` | סגירה | 3 · 6 |

---

## Task 1: `checkOnboarding` מפסיק להכיר את המוסד  *(T-111, השכבה הטהורה)*

**Files:**
- Modify: `lib/core/onboarding.ts` (הסרת `institution` מ-`OnboardingRaw` ומ-`OnboardingAnswers`, הסרת `INSTITUTION_MAX_LENGTH` · `INSTITUTION_QUESTION_HE` · `INSTITUTION_HELP_HE`, הסרת שתי שורות הפרסור והמפתח ב-`return`)
- Modify: `lib/core/onboarding.test.ts` (מחיקת `describe('the institution …')`, הוספת רַצֶ׳ט היעדר, תיקון בדיקת המיגרציה)

**Interfaces:**
- Consumes: אין חדש.
- Produces (הטיפוסים אחרי השינוי — **זו החתימה המחייבת**):
  ```ts
  export type OnboardingRaw = {
    readonly dailyMinutes: unknown;
    readonly examDate: unknown;
    readonly targetScore: unknown;
    // ⛔ `institution` הוסר — D-056. ⛔ אין כאן `institution?: never`:
    // מפתח מיותר בגוף בקשה ⛔ אינו שגיאה, והטיפוס ⛔ אינו המקום לאכוף את זה.
  };
  export type OnboardingAnswers = {
    readonly dailyMinutes: DailyMinutes;
    readonly examDate: string | null;
    readonly targetScore: number | null;
  };
  ```
  ⛔ `checkOnboarding` **⛔ אינה משנה חתימה** ו⛔ אינה משנה התנהגות בשלושת השדות שנשארו.

- [ ] **Step 1: כתוב את רַצֶ׳ט ההיעדר — הוא נופל, כי הקוד עדיין מכיר את המוסד**

מחק את הבלוק `describe('the institution (A7 …', …)` בשלמותו (‏שורות ~232–285), ואת `INSTITUTION_MAX_LENGTH` · `INSTITUTION_QUESTION_HE` משורת ה-`import` בראש הקובץ. הוסף במקומו:

```ts
/**
 * D-056 · T-111 — רוי הסיר את שאלת המוסד: «לא צריך את זה, שחרר את זה, מיותר».
 *
 * ⚠️ **וזה ⛔ אינו «מחקנו קוד ואין מה לבדוק».** הכשל שהרַצֶ׳ט הזה קיים בשבילו הוא
 * הכשל של F-010: פיצ׳ר שהוסר, וסוכן שמחזיר אותו חצי-שנה אחר כך כי «הטיפוס עדיין
 * מקבל את השדה, אז כנראה מותר». ⇒ שלוש הטענות כאן נופלות **בשם** ביום שמישהו
 * יחזיר את השדה לשכבה הטהורה, ובאותו יום הוא ייאלץ לקרוא את D-056.
 *
 * ⛔ **ומה שהרַצֶ׳ט הזה במפורש ⛔ אינו אוסר:** את **העמודה** `profiles.institution`
 * (‏D-056: «⛔ אינה נמחקת») ואת **התצוגה** ב-`components/MeScreen.tsx` (שורת המשימה:
 * «בלוק «המטרה שלך» ⛔ נשאר»). הסריקה כאן היא על `lib/core/onboarding.ts` בלבד.
 */
describe('the institution question is gone from the pure layer (D-056 · T-111)', () => {
  const CORE = readFileSync('lib/core/onboarding.ts', 'utf8');
  /** ⚠️ ⛔ בלי הלבנת הערות — הטענה כאן היא שהמילה ⛔ אינה בקובץ **כלל**, כולל בהערה
   *  שמסבירה «למה השדה היה כאן». הערה כזאת היא בדיוק הזרע שמצמיח את הפיצ׳ר בחזרה. */

  it('⛔ never mentions the institution again — not in code and not in a comment', () => {
    expect(CORE).not.toMatch(/institution/i);
  });

  it('⛔ exports none of the three strings the question needed', () => {
    for (const gone of ['INSTITUTION_MAX_LENGTH', 'INSTITUTION_QUESTION_HE', 'INSTITUTION_HELP_HE']) {
      expect(CORE).not.toContain(gone);
    }
  });

  it('accepts a body that still carries the old key, and ⛔ answers nothing about it', () => {
    // ⚠️ המדידה שמונעת רגרסיה בייצור: לומד שעמוד ישן שלו נשאר פתוח בדפדפן ישלח
    // עדיין `institution`. הבקשה חייבת להצליח — ⛔ ולא 422 — והשדה נופל לרצפה.
    const result = checkOnboarding(
      { dailyMinutes: 5, examDate: '', targetScore: '', institution: 'אוניברסיטת חיפה' } as OnboardingRaw,
      '2026-08-21',
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(Object.keys(result.answers).sort()).toEqual(['dailyMinutes', 'examDate', 'targetScore']);
  });
});
```

⚠️ **ה-`as OnboardingRaw` בבדיקה השלישית ⛔ אינו רישול והוא מוסבר בהערה:** אחרי הסרת השדה מהטיפוס, אובייקט עם `institution` ⛔ אינו מתקבל ב-`tsc` (‏excess property check על אובייקט מילולי), ובדיוק **זו** הסיבה שהבדיקה נכתבת — היא מודדת את **התנהגות זמן-הריצה** מול גוף בקשה שהטיפוס ⛔ אינו מתאר. ⛔ אין כאן `any`.

- [ ] **Step 2: הרץ — ראה אותו נופל**

```bash
npx vitest run lib/core/onboarding.test.ts
```
**מצופה:** שתי הטענות הראשונות נופלות בשם (`expected 'export const INSTITUTION_MAX_LENGTH…' not to match /institution/i`), והשלישית עוברת. ⛔ **אל תמשיך אם כולן ירוקות** — ‏רַצֶ׳ט שעובר לפני התיקון ⛔ אינו מודד דבר.

- [ ] **Step 3: הסר את המוסד מ-`lib/core/onboarding.ts`**

ארבע עריכות, ⛔ ולא אחת:
1. `OnboardingRaw` — מחק את `readonly institution?: unknown;` ואת בלוק ההערה בן 10 השורות שמעליו.
2. `OnboardingAnswers` — מחק את `readonly institution: string | null;`.
3. שלושת הקבועים `INSTITUTION_MAX_LENGTH` · `INSTITUTION_QUESTION_HE` · `INSTITUTION_HELP_HE` **ובלוק ה-JSDoc בן 11 השורות שמעליהם** (‏A7).
4. בגוף `checkOnboarding` — מחק את בלוק ההערה בן 4 השורות, את שתי שורות `institutionRaw`/`institution`, ואת המפתח `institution` מה-`return`.

- [ ] **Step 4: תקן את בדיקת המיגרציה (סטייה 2)**

ב-`lib/core/onboarding.test.ts`, הבדיקה שקוראת את `0009_onboarding_institution.sql`:

```ts
  /**
   * ⚠️ **`INSTITUTION_MAX_LENGTH` נמחק ב-T-111, והמספר כאן גולמי בכוונה.**
   * העמודה והאילוץ **נשארים במסד** (D-056: «⛔ אינה נמחקת»), ולכן אילוץ שאיש
   * אינו בודק הוא אילוץ שהמיגרציה הבאה תשבור בשקט. ⛔ החלופה — להשאיר קבוע חי
   * ב-`lib/core` "רק בשביל הבדיקה" — היא בדיוק הפגם של F-010: קוד שאיש אינו
   * קורא, שיושב בעץ כדרך מוכנה להחזיר את הפיצ׳ר בייבוא אחד.
   */
  it('still guards the 0009 constraint, ⛔ even though nothing writes the column now', () => {
    const sql = readFileSync('supabase/migrations/0009_onboarding_institution.sql', 'utf8');
    expect(sql).toContain('char_length(institution) <= 120');
    expect(sql).not.toMatch(/institution\s+text\s+not\s+null/i);
  });
```

⚠️ **הבדיקה הזאת חייבת לצאת מה-`describe` שנמחק** — העבר אותה ל-`describe` העליון של הקובץ (או ל-`describe('the 0009 column survives its question', …)` חדש). ⛔ בדיקה שנשארת בתוך בלוק מחוק ⛔ אינה נאספת.

- [ ] **Step 5: הרץ — ראה אותו ירוק**

```bash
npx vitest run lib/core/onboarding.test.ts && npm run check:core
```
**מצופה:** כל הקובץ ירוק · `/lib/core purity: OK`. ⛔ `typecheck` **עדיין אדום** — `app/api/profile/route.ts` ו-`components/OnboardingForm.tsx` מייבאים את מה שנמחק. זה מכוון: הם Task 2 ו-Task 3.

- [ ] **Step 6: מוטציה — הוכח שהרַצֶ׳ט חי**

הוסף זמנית `export const INSTITUTION_MAX_LENGTH = 120;` ל-`lib/core/onboarding.ts`, הרץ את הבדיקה, **וודא ששתי טענות נופלות בשמן**. שחזר (‏`git diff lib/core/onboarding.ts` חייב לחזור למצב שאחרי Step 3).

---

## Task 2: `POST /api/profile` מפסיק לכתוב את העמודה  *(T-111, הקצה + החוזה)*

**Files:**
- Modify: `app/api/profile/route.ts`
- Modify: `app/api/profile/route.test.ts`
- Modify: `docs/api-contract.md`
- Modify: `plan/30-architecture.md`

**Interfaces:** אין חתימה חדשה. ‏`.update({…})` מאבד מפתח אחד.

- [ ] **Step 1: הפוך את שלוש הטענות הקיימות לרַצֶ׳ט היעדר**

ב-`app/api/profile/route.test.ts`, החלף את `describe('the institution reaches the column (T-003 · § 4.2ד)', …)` כולו ב:

```ts
/**
 * D-056 · T-111 — הכתיבה לעמודה נפסקת, ⛔ והעמודה נשארת.
 *
 * ⚠️ **הטענה כאן היא על `.update(` ⛔ ולא על הקובץ כולו**, וזו ⛔ אינה קפדנות
 * מיותרת: הקובץ **חייב** להמשיך להזכיר את השדה בהערה אחת — «העמודה נשארת ואיש
 * אינו כותב אליה» — אחרת הסוכן הבא יראה עמודה יתומה בסכמה ויציע `drop column`,
 * שהוא בדיוק מה ש-D-056 אוסרת. ⇒ סריקה גורפת הייתה **מענישה את התיעוד הנכון**.
 */
describe('the institution column is no longer written (D-056 · T-111)', () => {
  /** ⚠️ ההלבנה כאן חובה (F-039 · F-087) — ההערה שמסבירה למה העמודה נשארת
   *  ⛔ אינה אמורה להפיל את הטענה שאיש אינו כותב אליה. */
  const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

  it('⛔ never passes the field into checkOnboarding', () => {
    expect(CODE).not.toMatch(/institution:\s*body\.institution/);
  });

  it('⛔ never puts the field in the update payload', () => {
    // ⚠️ נמדד: `.slice(indexOf('.update('))` לבדו רץ עד סוף הקובץ ותופס הערות
    // מתחתיו. הטווח נחתך על הסוגר של האובייקט — הוא ⛔ אינו יכול לצאת ממנו.
    const at = CODE.indexOf('.update({');
    expect(at, 'the profile update is not in the source').toBeGreaterThan(-1);
    const payload = CODE.slice(at, CODE.indexOf('})', at));
    expect(payload).not.toContain('institution');
    // ⚠️ והשומר שמונע «עברנו כי ה-slice ריק»: ארבעת השדות שכן נכתבים.
    for (const kept of ['daily_minutes', 'exam_date', 'target_score', 'onboarded_at']) {
      expect(payload).toContain(kept);
    }
  });

  it('keeps the prose that stops the next agent from dropping the column', () => {
    // ⚠️ F-088 — כאן הטענה היא **על ההערה עצמה**, ולכן ⛔ בלי הלבנה: זה המקום
    // היחיד בקובץ שבו הופעת המילה היא הדבר הנדרש ⛔ ולא הדבר האסור.
    expect(SRC).toMatch(/institution/);
    expect(SRC).toMatch(/D-056/);
  });
});
```

⚠️ **הבדיקה על `docs/api-contract.md`** (‏שורה ~87, `expect(section).toContain('institution')`) — **היא נשארת ומתהפכת**: `expect(section).not.toContain('institution')`. ⛔ אל תמחק אותה; היא הראיה שהחוזה עודכן **באותו קומיט**.

- [ ] **Step 2: הרץ — ראה אותה נופלת** — `npx vitest run app/api/profile/route.test.ts`. **מצופה:** שלוש נפילות בשם.

- [ ] **Step 3: הסר את שתי השורות מהנתיב, והשאר את ההערה**

ב-`app/api/profile/route.ts`:
- מחק את `// § 4.2ד: optional free text…` ואת `institution: body.institution,` מהקריאה ל-`checkOnboarding`.
- מחק את `institution: check.answers.institution,` מ-`.update({…})`.
- הוסף **מעל** `.update({`:
  ```ts
  // ⛔ `institution` ⛔ אינו נכתב עוד — D-056 · T-111 (רוי, 19/08). העמודה
  // `profiles.institution` **נשארת** (`0009`, nullable) ומוסיפה להיקרא ב-`/me`
  // עבור לומדים שכבר ענו. ⛔ אל תציע `drop column` — מחיקת עמודה הרסנית ואינה
  // סמכות סוכן, וההחלטה נוקבת בכך במפורש. מתועד כחוב ב-`plan/30-architecture.md`.
  ```

- [ ] **Step 4: עדכן את החוזה ואת מרשם החוב**

`docs/api-contract.md`, `POST /api/profile`:
- גוף הבקשה לדוגמה ⇒ `{ "dailyMinutes": 5, "examDate": "2026-09-10", "targetScore": "" }`
- החלף את פסקת `institution` בת שמונה השורות בשלוש שורות: השאלה הוסרה (D-056 · T-111); מפתח `institution` בגוף בקשה **מתקבל ונופל לרצפה** ⛔ ואינו 422 (לומד עם עמוד ישן פתוח); העמודה נשארת ב-`0009` ונקראת ב-`/me` בלבד.
- שורה 1170 (`POST /api/onboarding` המבוטלת) — מחק את הזנב «נשארה בלבד שאלת **המוסד** (A7)» והחלף ב-«⛔ **בוטלה כולה** — D-056 · T-111».

`plan/30-architecture.md` — הוסף רשומת חוב חדשה במספר **הפנוי הבא**:
> **TD-⟨הבא⟩ · `profiles.institution` — עמודה נטושה בכוונה (D-056 · T-111).** אף קוד ⛔ אינו כותב אליה מ-C-⟨המחזור⟩; `components/MeScreen.tsx` מוסיף לקרוא אותה עבור לומדים שענו לפני ההסרה. ⛔ **אינה נמחקת** — `drop column` הרסני ואינו סמכות סוכן (D-056). הסגירה: החלטת בעלים לנקות שורות היסטוריות, ⛔ ולא טיק סוכן.

- [ ] **Step 5: הרץ** — `npx vitest run app/api/profile/route.test.ts && npm run typecheck`. **מצופה:** הקובץ ירוק; `typecheck` **עדיין אדום על `components/OnboardingForm.tsx` בלבד** (Task 3). רשום את מספר השגיאות שראית — הוא חייב לרדת ל-0 בסוף Task 3.

---

## Task 3: השדה יורד מהמסך  *(T-111, הרכיב — הבדיקה שהמשימה נוקבת בה)*

**Files:**
- Modify: `components/OnboardingForm.tsx`
- Modify: `components/OnboardingForm.test.ts`

**Interfaces:** אין. ‏`OnboardingForm` ⛔ אינו מקבל props ו⛔ אינו מייצא דבר חדש.

- [ ] **Step 1: החלף את `describe('the institution field …')` ברַצֶ׳ט היעדר**

⚠️ **שתי בדיקות מתוך הבלוק הנמחק ⛔ אינן על המוסד ו⛔ אסור לאבד אותן** — נמדד: `'still anchors its column to the top (F-011 · F-016)'` (שורה ~108) היא שער חוקה **על הרכיב כולו**. העבר אותה החוצה, ל-`describe` העליון.

```ts
/**
 * D-056 · T-111 — «לא צריך את זה, שחרר את זה, מיותר» (רוי, 19/08).
 * זו הבדיקה שנוקבת בה שורת המשימה: **סריקת מקור ש-`institution` ⛔ אינו מופיע
 * באף רכיב onboarding.**
 *
 * ⚠️ **הטענה על `enterKeyHint` ⛔ אינה נמחקת, והיא הסיבה שהבלוק הזה ⛔ אינו
 * ריק:** F-015 · TD-5 — `enterKeyHint="go"` הוא **טענה מוקלדת** שזה השדה האחרון
 * במסך. עד היום היא הייתה נכונה **בזכות** מיקום שדה המוסד מעליו (הבדיקה
 * «sits above the target-score field»). מרגע שהשדה יורד, השדה האחרון הוא ציון
 * היעד **מעצם היותו האחרון** — ולכן הטענה עוברת מ«סדר יחסי» ל«הרמז קיים על
 * השדה האחרון בפועל», ⛔ ואינה נעלמת עם השדה שהצדיק אותה.
 */
describe('the institution question is gone from the screen (D-056 · T-111)', () => {
  it('⛔ has no institution input, state or label', () => {
    expect(CODE).not.toMatch(/institution/i);
    expect(CODE).not.toContain('INSTITUTION_');
  });

  it('⛔ never sends the key the route stopped reading', () => {
    const body = CODE.match(/apiPost<SaveResponse>\('\/api\/profile',\s*\{([^}]*)\}/);
    expect(body, 'the /api/profile call is not in the source').not.toBeNull();
    // ⚠️ `[^}]*` ⛔ אינו יכול לצאת מהסוגריים שפתח — זה בדיוק התיקון של C-0081,
    // שם `[\s\S]*?` יצא מהאובייקט ומצא את המילה במרקאפ 60 שורות מתחת.
    expect(body?.[1]).toMatch(/^\s*(?:[A-Za-z]+,\s*)*$/);
    expect(body?.[1]).toContain('dailyMinutes');
    expect(body?.[1]).toContain('examDate');
    expect(body?.[1]).toContain('targetScore');
  });

  it('leaves enterKeyHint="go" on what is now genuinely the last field (F-015 · TD-5)', () => {
    const scoreAt = CODE.indexOf('name="target_score"');
    expect(scoreAt).toBeGreaterThan(-1);
    expect(CODE).toContain('enterKeyHint="go"');
    // ⛔ ואין שדה קלט אחרי ציון היעד. ⚠️ `type="submit"` ⛔ אינו שדה.
    expect(CODE.slice(scoreAt)).not.toMatch(/<input\s/);
  });
});
```

⚠️ **מחק גם את `import { INSTITUTION_MAX_LENGTH } from '@/lib/core/onboarding';`** בראש קובץ הבדיקה — הוא ⛔ אינו קיים עוד ו-`typecheck` ייפול עליו.

⚠️ **ו-`fieldElement()` (שורות ~32–39) הופכת ללא-קרואה** אחרי המחיקה. ⛔ **אל תשאיר אותה** — ‏`noUnusedLocals` יפיל את `typecheck`, וגם אם לא, זו בדיוק הפונקציה שתפתה את הסוכן הבא להחזיר שדה. מחק.

- [ ] **Step 2: הרץ — ראה נופל** — `npx vitest run components/OnboardingForm.test.ts`. **מצופה:** הטענה הראשונה נופלת בשם.

- [ ] **Step 3: הסר את השדה מהרכיב**

ב-`components/OnboardingForm.tsx`:
1. שורה ~52 — מחק `const [institution, setInstitution] = useState('');`
2. שורה ~74 — מחק `institution,` מגוף `apiPost`
3. שורות ~137–160 — מחק את בלוק ההערה בן 10 השורות (`§ 4.2ד: free text…`) **ואת ה-`<label>` כולו**
4. עדכן את שורת ה-`import` מ-`@/lib/core/onboarding` — הסר `INSTITUTION_MAX_LENGTH` · `INSTITUTION_QUESTION_HE` · `INSTITUTION_HELP_HE`
5. ב-JSDoc של הרכיב (שורות ~35–47) — החלף את המשפט על סדר השדות בשורה שנוקבת ב-D-056

⛔ **אל תיגע ב-`<LatinField name="target_score">`** — לא ב-`enterKeyHint`, לא ב-`inputMode`, ולא בטקסט.

- [ ] **Step 4: אימות מלא — כאן `typecheck` חייב להתאפס**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```
**מצופה:** `typecheck` exit 0 (ה-0 הראשון מאז Step 5 של Task 1) · `/lib/core purity: OK` · הסוויטה ירוקה במלואה · `build` exit 0.
⛔ **אם `npm test` אדום על `scripts/measure-plan-tables.test.ts`** — זה ⛔ אינו קוד שנשבר, זה הרַצֶ׳ט: הרץ `npm run measure:plan` וחייב את `docs/plan-tables.md`.

- [ ] **Step 5: `check:mobile` — המסך היחיד שהתקצר**

```bash
npm run check:mobile
```
**מצופה:** ירוק. ⚠️ **ומספר אחד חייב לרדת ולהירשם בדיווח:** `firstPaintTop` של «שמירה והתחלה» ב-`/dev/onboarding` היה **716** בשלושת הרוחבים אחרי F-027 (‏C-0071). ‏מסך שאיבד `<label>` בן שלוש שורות **חייב** לפלוט מספר **קטן** מזה. ⛔ מספר זהה ⇒ הפיקסצ׳ר ⛔ אינו מרנדר את השדה שהסרת ⇒ **F-027ⓑ חזר** (פיקסצ׳ר נמוך מהמסך שהוא מייצג) ⇒ פתח ממצא ⛔ ואל תדווח ירוק.

- [ ] **Step 6: קומיט T-111**

`plan/50-tasks.md` — T-111 ⇒ **🟣 לביקורת**. הרץ `npm run measure:plan`. קומיט אחד לשלוש המשימות:
`loop(DEV): C-XXXX T-111 — שאלת המוסד יורדת מה-onboarding (D-056)`

---

## Task 4: `devUserGate` — השער, טהור ונכשל־סגור  *(T-113ⓐ)*

**Files:**
- Create: `lib/core/devUser.ts`
- Create: `lib/core/devUser.test.ts`

**Interfaces:**
- Consumes: אין. ⛔ אפס ייבוא.
- Produces:
  ```ts
  export type DevUserGateClosedReason =
    | 'production'        // NODE_ENV === 'production' — ⛔ גובר על הכל
    | 'not_configured'    // אחד המשתנים חסר/ריק — ברירת המחדל
    | 'unsafe_password';  // סיסמה קצרה מ-DEV_USER_MIN_PASSWORD

  export type DevUserGate =
    | { readonly open: false; readonly reason: DevUserGateClosedReason }
    | { readonly open: true; readonly credentials: { readonly email: string; readonly password: string } };

  export const DEV_USER_MIN_PASSWORD = 12;

  export function devUserGate(input: {
    readonly nodeEnv: string | undefined;
    readonly email: string | undefined;
    readonly password: string | undefined;
  }): DevUserGate;
  ```

**סדר ההכרעה מחייב, ⛔ ואינו טעם:** `production` נבדק **ראשון**. ⇒ הודעת «לא הוגדר» ⛔ לעולם ⛔ אינה מגיעה בייצור, ולכן היא ⛔ אינה מלמדת קורא לא-מורשה שהפיצ׳ר קיים ומה חסר לו כדי להפעיל אותו. זו בדיוק תבנית «‏a status oracle answered late is still an oracle» מ-`app/api/auth/login/route.ts` (F-008ⓑ).

- [ ] **Step 1: כתוב את הבדיקות — הן נופלות כי אין קובץ**

```ts
import { describe, expect, it } from 'vitest';
import { DEV_USER_MIN_PASSWORD, devUserGate } from './devUser';

/**
 * D-057 · T-113 — משתמש בדיקה לפיתוח.
 *
 * ⚠️ **התנגדות ה-PM וה-Critic נרשמה ונדחתה במפורש על ידי הבעלים** (D-057). זו
 * החלטת סיכון של רוי וזו סמכותו. ⇒ מה שהקוד **כן** אחראי עליו הוא שההחלטה תיאכף
 * **בדיוק כפי שנוסחה** ⛔ ולא רחב ממנה בפסיק אחד.
 *
 * **הכלל המחייב, מילה במילה מ-D-057:** «⛔ הפיצ׳ר נכשל **סגור**: משתנה חסר ⇒ אין
 * משתמש, ⛔ ולא ברירת מחדל שמייצרת אותו». ⇒ **`{open:false}` הוא ברירת המחדל,
 * ו-`{open:true}` דורש שלושה תנאים בו-זמנית.** הבדיקה האחרונה כאן היא האינווריאנט
 * הזה על **כל** צירוף, ⛔ ולא על דוגמה שבחרתי.
 *
 * ⛔ **ולמה `production` נבדק ראשון:** הודעת «לא הוגדר» היא **אורקל** — היא
 * מלמדת שהפיצ׳ר קיים ומה חסר כדי להפעיל אותו. בייצור היא ⛔ לעולם לא נפלטת.
 */
const GOOD = { email: 'dev@example.test', password: 'a-long-enough-secret' };

describe('devUserGate (D-057 · T-113)', () => {
  it('⛔ is closed in production, even when both variables are set', () => {
    expect(devUserGate({ nodeEnv: 'production', ...GOOD })).toEqual({ open: false, reason: 'production' });
  });

  it('⛔ answers "production" and ⛔ never "not_configured" in production', () => {
    // האורקל: בייצור, סביבה חסרה וסביבה מוגדרת חייבות להיראות זהות מבחוץ.
    expect(devUserGate({ nodeEnv: 'production', email: undefined, password: undefined }))
      .toEqual({ open: false, reason: 'production' });
  });

  it('⛔ is closed when either variable is missing, empty or whitespace', () => {
    for (const bad of [undefined, '', '   ']) {
      expect(devUserGate({ nodeEnv: 'development', email: bad, password: GOOD.password }).open).toBe(false);
      expect(devUserGate({ nodeEnv: 'development', email: GOOD.email, password: bad }).open).toBe(false);
    }
  });

  it('⛔ is closed for a short password — a dev account is still a real account', () => {
    const short = 'x'.repeat(DEV_USER_MIN_PASSWORD - 1);
    expect(devUserGate({ nodeEnv: 'development', email: GOOD.email, password: short }))
      .toEqual({ open: false, reason: 'unsafe_password' });
  });

  it('⛔ is closed when NODE_ENV is undefined — unknown is ⛔ not "safe"', () => {
    // ⚠️ נמדד ⛔ ולא הונח: `next build` מריץ קוד עם NODE_ENV='production', אבל
    // סקריפט או runner שמאבד את המשתנה מגיע לכאן עם `undefined`. ⛔ «לא ייצור»
    // ⛔ אינו נגזר מהיעדר ראיה — הוא נדרש **מפורשות**.
    expect(devUserGate({ nodeEnv: undefined, ...GOOD })).toEqual({ open: false, reason: 'production' });
  });

  it('opens, and trims the address, only when all three hold', () => {
    expect(devUserGate({ nodeEnv: 'development', email: '  Dev@Example.test ', password: GOOD.password }))
      .toEqual({ open: true, credentials: { email: 'dev@example.test', password: GOOD.password } });
  });

  it('⛔ never returns open:true without two non-empty strings — over every combination', () => {
    const envs = ['production', 'development', 'test', '', undefined];
    const values = [undefined, '', '  ', 'x', 'a-long-enough-secret'];
    for (const nodeEnv of envs) {
      for (const email of values) {
        for (const password of values) {
          const gate = devUserGate({ nodeEnv, email, password });
          if (!gate.open) continue;
          expect(nodeEnv).toBe('development');
          expect(gate.credentials.email.length).toBeGreaterThan(0);
          expect(gate.credentials.password.length).toBeGreaterThanOrEqual(DEV_USER_MIN_PASSWORD);
        }
      }
    }
  });
});
```

⚠️ **הבדיקה האחרונה נועלת גם את `nodeEnv: 'test'`** — כלומר השער סגור גם כשהסוויטה עצמה רצה. ⛔ **זה מכוון:** ‏`vitest` מגדיר `NODE_ENV='test'`, ופיצ׳ר שנפתח בזמן בדיקות היה נפתח בכל CI.

- [ ] **Step 2: הרץ — נופל בהעמסה** (`Cannot find module './devUser'`). ⛔ זו ⛔ אינה נפילה טובה מספיק כדי לסמוך עליה — היא הופכת למדידה אמיתית רק ב-Step 4.

- [ ] **Step 3: כתוב את `lib/core/devUser.ts`**

הכללים המחייבים לגוף הפונקציה:
- ⛔ **אפס `process.env`** — ‏`check:core` יתפוס.
- `production` נבדק **ראשון**, ובתנאי `nodeEnv !== 'development'` (⛔ ולא `=== 'production'`) ⇒ `undefined` · `''` · `'test'` · `'staging'` כולם **סגורים**.
- ‏`email` ו-`password` עוברים `trim()` לפני מבחן הריקנות; ⛔ **`password` ⛔ אינו נחתך בהחזרה** אם ה-trim שינה אותו — סיסמה עם רווח בקצה היא סיסמה אחרת, ולכן `unsafe_password` נמדד על **המחרוזת המקורית**. ⚠️ פשט: בדוק ריקנות על `.trim()`, מדוד אורך והחזר את **המקור**.
- מחזיר `as const`-ים כך שהטיפוס הוא בדיוק ה-union שהוצהר.
- JSDoc בן 6–10 שורות שמצטט את D-057 ואת «נכשל סגור», ומסביר **למה** `production` ראשון.

- [ ] **Step 4: הרץ + מוטציה — שתי מוטציות, ⛔ ולא אחת**

```bash
npx vitest run lib/core/devUser.test.ts && npm run check:core
```
**מצופה:** 7/7 ירוק · `/lib/core purity: OK`.
**מוטציה א׳** — הפוך את סדר הבדיקות כך ש-`not_configured` נבדק לפני `production`. **מצופה:** «⛔ answers "production" and ⛔ never "not_configured"» נופלת בשמה. שחזר.
**מוטציה ב׳** — החלף `nodeEnv !== 'development'` ב-`nodeEnv === 'production'`. **מצופה:** «⛔ is closed when NODE_ENV is undefined» נופלת **וגם** האינווריאנט הכולל נופל. שחזר, ואמת `git diff` ריק מול המצב שאחרי Step 3.

---

## Task 5: `readDevUserGate` — נקודת המגע היחידה עם הסביבה  *(T-113ⓑ)*

**Files:**
- Create: `lib/supabase/devUser.ts`
- Create: `lib/supabase/devUser.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: `devUserGate`, `DevUserGate` מ-`@/lib/core/devUser`.
- Produces:
  ```ts
  export const DEV_USER_EMAIL_VAR = 'DEV_TEST_USER_EMAIL';
  export const DEV_USER_PASSWORD_VAR = 'DEV_TEST_USER_PASSWORD';
  /** ⛔ המקום **היחיד** בריפו שקורא את שני המשתנים. נאכף בסריקה. */
  export function readDevUserGate(): DevUserGate;
  ```

⚠️ **`process.env.X` ⛔ ולא `process.env[VAR]`.** נמדד: Next מחליף גישה **סטטית** בלבד בזמן בנייה; גישה דינמית דרך משתנה מחזירה `undefined` בחבילה שנבנתה. ⇒ הקבועים משמשים ל**בדיקה ולתיעוד**, והקריאה עצמה סטטית — וזה נאמר בהערה כדי שאיש לא "ינקה" אותה לגישה דינמית.

- [ ] **Step 1: כתוב את הבדיקות**

```ts
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEV_USER_EMAIL_VAR, DEV_USER_PASSWORD_VAR, readDevUserGate } from './devUser';

/**
 * D-057 · T-113 — קריאת הסביבה, ⛔ ולא ההכרעה. ההכרעה ב-`lib/core/devUser.ts`
 * ונבדקה שם על טבלת אמת מלאה; כאן נבדק **רק** שהמשתנים הנכונים מגיעים לשם.
 *
 * ⚠️ **הסריקה בסוף הקובץ היא החצי החשוב:** שער שיושב בקובץ אחד ⛔ אינו שווה כלום
 * אם קובץ שני קורא את אותם משתנים ישירות. ⇒ הבדיקה סופרת את **כל** המופעים בעץ
 * ומתעקשת על רשימה סגורה.
 */
afterEach(() => vi.unstubAllEnvs());

describe('readDevUserGate (D-057 · T-113)', () => {
  it('⛔ is closed with nothing set', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv(DEV_USER_EMAIL_VAR, '');
    vi.stubEnv(DEV_USER_PASSWORD_VAR, '');
    expect(readDevUserGate().open).toBe(false);
  });

  it('⛔ stays closed in production with both set — the gate ⛔ is not the caller’s job', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv(DEV_USER_EMAIL_VAR, 'dev@example.test');
    vi.stubEnv(DEV_USER_PASSWORD_VAR, 'a-long-enough-secret');
    expect(readDevUserGate()).toEqual({ open: false, reason: 'production' });
  });

  it('opens with both set outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv(DEV_USER_EMAIL_VAR, 'dev@example.test');
    vi.stubEnv(DEV_USER_PASSWORD_VAR, 'a-long-enough-secret');
    const gate = readDevUserGate();
    expect(gate.open).toBe(true);
    if (gate.open) expect(gate.credentials.email).toBe('dev@example.test');
  });

  it('reads the variables STATICALLY — a dynamic lookup is erased by the bundler', () => {
    const SRC = readFileSync('lib/supabase/devUser.ts', 'utf8');
    expect(SRC).toContain('process.env.DEV_TEST_USER_EMAIL');
    expect(SRC).toContain('process.env.DEV_TEST_USER_PASSWORD');
    expect(SRC).not.toMatch(/process\.env\[/);
  });

  it('is the ONLY file in the tree that reads them', () => {
    // ⚠️ אותה תבנית כמו `lib/supabase/serviceRole.test.ts`, ומאותו טעם: מחיקה
    // בלי שומר מבוטלת על ידי הסוכן הבא שיצטרך את הדבר שנמחק.
    const offenders = sourceFilesUnder(['app', 'components', 'lib', 'scripts'])
      .filter((f) => f !== 'lib/supabase/devUser.ts' && !f.endsWith('devUser.test.ts'))
      .filter((f) => /process\s*\.\s*env\s*[.[]\s*['"`]?DEV_TEST_USER_/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('⛔ scans a non-empty set, so a passing run means something', () => {
    expect(sourceFilesUnder(['app', 'components', 'lib', 'scripts']).length).toBeGreaterThan(50);
  });
});
```

⚠️ **`sourceFilesUnder` ⛔ אינו מיובא מ-`serviceRole.test.ts`** (הוא ⛔ אינו מיוצא שם). העתק את שש השורות שלו לראש הקובץ — ⛔ **ורשום בהערה שזו העתקה מכוונת**: קובץ בדיקה שמייצא עוזרים מושך את vitest לגרף ייבוא של קובץ בדיקה אחר, וזו תקלה גרועה מכפילות של שש שורות.

- [ ] **Step 2: הרץ — נופל בהעמסה.**

- [ ] **Step 3: כתוב את `lib/supabase/devUser.ts`** — שני הקבועים, ה-JSDoc, ו-`readDevUserGate()` שמעביר `process.env.NODE_ENV` · `process.env.DEV_TEST_USER_EMAIL` · `process.env.DEV_TEST_USER_PASSWORD` ל-`devUserGate`. ⛔ אפס לוגיקה משלו — כל `if` כאן הוא ההכרעה שכפולה.

- [ ] **Step 4: הוסף ל-`.env.example`** — בסוף הקובץ, **בערך ריק**:

```
# --- D-057 · T-113 — משתמש בדיקה לפיתוח. ⛔ לפיתוח מקומי בלבד. ---
# ⛔ אל תגדיר את שני אלה ב-Netlify. השער נסגר בכל מקרה כש-NODE_ENV=production,
# אבל סוד בלוח הבקרה הוא סוד שדולף גם כשאיש אינו קורא אותו.
# שניהם ריקים ⇒ אין משתמש בדיקה, ⛔ ולא ברירת מחדל שמייצרת אותו.
# חוב ההסרה לפני ההשקה: plan/03-for-roy.md פריט 36.
DEV_TEST_USER_EMAIL=
DEV_TEST_USER_PASSWORD=
```

- [ ] **Step 5: הרץ + מוטציה**

```bash
npx vitest run lib/supabase/devUser.test.ts && npm run check:core
```
**מצופה:** 6/6 ירוק. ⚠️ `check:core` חייב להישאר `OK` — ‏`lib/supabase/` ⛔ אינו בתחום `lib/core/`, אבל אמת שלא הוספת `process.env` ל-`lib/core/devUser.ts` בטעות.
**מוטציה** — הוסף `const x = process.env.DEV_TEST_USER_EMAIL;` ל-`app/api/health/route.ts`. **מצופה:** «is the ONLY file in the tree that reads them» נופלת ומדפיסה את הנתיב. שחזר.

---

## Task 6: `GET /api/dev/session` — הנתיב, החוזה, וחוב ההסרה  *(T-113ⓒ)*

**Files:**
- Create: `app/api/dev/session/route.ts`
- Create: `app/api/dev/session/route.test.ts`
- Modify: `docs/api-contract.md`
- Modify: `plan/03-for-roy.md` (**עדכון במקום** של פריט 36)
- Modify: `plan/30-architecture.md`

**Interfaces:**
- Consumes: `readDevUserGate` · `createRouteClient` · `readSupabaseEnv` · `cookies` מ-`next/headers`.
- Produces: `export const dynamic = 'force-dynamic';` · `export async function GET(): Promise<Response>`

**חוזה התשובה, ⛔ ואין בו ענף רביעי:**

| מצב | תשובה |
|---|---|
| שער סגור (כל סיבה) | **404**, גוף **ריק**. ⛔ אין JSON, אין קוד, אין הודעה |
| שער פתוח · אין env של Supabase | **503** `{ ok: false, code: 'unavailable' }` |
| שער פתוח · `signInWithPassword` נכשל | **401** `{ ok: false, code: 'dev_user_missing', message: <עברית שנוקבת בצעד הידני> }` |
| שער פתוח · הצלחה | **302** ל-`/` עם עוגיית הסשן |

- [ ] **Step 1: כתוב את בדיקת הסריקה**

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * D-057 · T-113 — שומר מקור, באותה צורה ובאותן מגבלות כמו
 * `app/api/auth/login/route.test.ts`: הסביבה היא `node`, אין פרויקט Supabase
 * כאן, ולכן ההתנהגות ⛔ אינה ניתנת להגעה. **מה שכן נמדד הוא הדבר שאחרת מאמינים
 * לו במקום למדוד אותו — ה-סדר**, שהוא כל תכונת האבטחה של הפיצ׳ר הזה.
 */
const SRC = readFileSync('app/api/dev/session/route.ts', 'utf8');
// ⚠️ הייבואים מוסרים, וזו הטענה שנושאת את הקובץ — הלקח של C-0160: עם בלוק
// הייבוא במקומו, `indexOf('readDevUserGate')` מוצא את ה-**ייבוא**, שהוא מעל כל
// פקודה בהגדרה, ולכן מבחן הסדר עובר גם אחרי שהשער הועבר מתחת להתחברות.
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '')
  .replace(/^import[\s\S]*?;$/gm, '');

describe('GET /api/dev/session — the gate', () => {
  it('checks the gate BEFORE it reads env or builds a client', () => {
    const gate = CODE.indexOf('readDevUserGate(');
    expect(gate).toBeGreaterThan(-1);
    for (const after of ['readSupabaseEnv(', 'createRouteClient(', 'signInWithPassword']) {
      expect(CODE.indexOf(after), `${after} must come after the gate`).toBeGreaterThan(gate);
    }
  });

  it('answers a bare 404 when the gate is closed — ⛔ no body, ⛔ no reason', () => {
    const closed = CODE.slice(CODE.indexOf('readDevUserGate('), CODE.indexOf('readSupabaseEnv('));
    expect(closed).toMatch(/status:\s*404/);
    // ⛔ הסיבה מהשער ⛔ לעולם אינה יוצאת בתשובה — היא אורקל.
    for (const leak of ['not_configured', 'unsafe_password', 'reason']) {
      expect(closed).not.toContain(leak);
    }
  });

  it('⛔ never embeds a password and ⛔ never names the variables itself', () => {
    expect(CODE).not.toMatch(/DEV_TEST_USER_/);
    expect(CODE).not.toMatch(/process\s*\.\s*env/);
  });

  it('signs in as an ordinary user — ⛔ no signUp, ⛔ no admin, ⛔ no service role', () => {
    expect(CODE).toContain('signInWithPassword');
    for (const forbidden of ['signUp', 'auth.admin', 'SERVICE_ROLE', 'createServerClient']) {
      expect(CODE).not.toContain(forbidden);
    }
  });

  it('is force-dynamic, so the 404 is ⛔ never cached as the answer for everyone', () => {
    expect(SRC).toMatch(/export const dynamic = 'force-dynamic'/);
  });

  it('⛔ is not a page: nothing under app/dev/ is touched by this route', () => {
    expect(SRC).not.toContain('app/dev/');
    expect(SRC).not.toMatch(/data-primary-action/); // F-027 — סימון בלי מדידה
  });
});
```

- [ ] **Step 2: הרץ — נופל בהעמסה** (`ENOENT … app/api/dev/session/route.ts`).

- [ ] **Step 3: כתוב את הנתיב**

מבנה מחייב, בסדר הזה בדיוק:
1. `export const dynamic = 'force-dynamic';`
2. JSDoc בן 10–14 שורות: מצטט את D-057, מצהיר ש**התנגדות ה-PM וה-Critic נדחתה על ידי הבעלים**, מסביר את סטייה 3 (למה `GET`) ואת סטייה 4 (למה **אין** `signUp`), ומפנה לפריט 36.
3. `const gate = readDevUserGate(); if (!gate.open) return new NextResponse(null, { status: 404 });`
4. `const env = readSupabaseEnv(); if (!env) return NextResponse.json({ ok: false, code: 'unavailable' }, { status: 503 });`
5. `const supabase = createRouteClient(env, await cookies());`
6. `const { error } = await supabase.auth.signInWithPassword(gate.credentials);`
7. שגיאה ⇒ **401** `dev_user_missing` + מחרוזת עברית שנוקבת בצעד הידני המדויק («צור את המשתמש פעם אחת ב-Supabase → Authentication → Users, באותה כתובת ובאותה סיסמה שב-`.env.local`»). ⛔ **הודעת Supabase עצמה ⛔ אינה נכנסת לגוף** — זהו הכלל הקיים «⛔ never puts the database message in the response body».
8. הצלחה ⇒ `NextResponse.redirect(new URL('/', request.url), 302)`.

⚠️ **העוגיות והפניה — הפגם שקל ליפול בו:** ‏`createRouteClient` כותב את הסשן ל-`cookies()` של הבקשה. ‏`NextResponse.redirect` יוצר תשובה **חדשה**. אמת ידנית (Step 5) שהעוגייה אכן נשלחת; אם לא — בנה את התשובה כ-`NextResponse.redirect` **לפני** ההתחברות והעבר את מאגר העוגיות שלה, בדיוק כמו `redirectPreservingCookies` ב-`proxy.ts:80`. ⛔ **אל תדווח ירוק על סמך הבדיקות בלבד** — הן סריקת מקור ו⛔ אינן יכולות לראות עוגייה.

- [ ] **Step 4: עדכן חוזה, מרשם החוב, ופריט 36**

`docs/api-contract.md` — סעיף חדש **בסוף**, `GET /api/dev/session`: ארבעת המצבים מהטבלה למעלה + שלוש שורות: ⛔ לפיתוח מקומי בלבד · השער ב-`lib/core/devUser.ts` · **⛔ בייצור הנתיב מחזיר 404 ו⛔ אינו מסגיר את קיומו**.

`plan/30-architecture.md` — רשומת חוב חדשה: **TD-⟨הבא+1⟩ · משתמש בדיקה לפיתוח (D-057 · T-113).** הכרעת סיכון מפורשת של הבעלים; ההתנגדות נרשמה ונדחתה. ⛔ אינו נסגר על ידי סוכן — הסגירה היא פריט 36.

`plan/03-for-roy.md` — **עדכון במקום** של פריט 36. ⛔ **אל תפתח פריט חדש ו⛔ אל תסגור אותו** (הוא של ה-PM). הוסף לתא «מה נדרש»:
> ⚠️ **עודכן C-XXXX (DEV) — הפיצ׳ר נבנה ונדחף ל-`dev`, וכעת שלושת הצעדים קונקרטיים:** ⓐ שני המשתנים הם `DEV_TEST_USER_EMAIL` ו-`DEV_TEST_USER_PASSWORD`, והם ⛔ **אינם** מוגדרים ב-Netlify ואינם אמורים להיות · ⓑ המשתמש עצמו **נוצר על ידך פעם אחת** ב-Supabase → Authentication → Users (⛔ הקוד ⛔ אינו יוצר אותו — ראה סטייה 4 בתוכנית), ולכן המחיקה לפני ההשקה היא מחיקת אותה שורה · ⓖ הנתיב הוא `GET /api/dev/session`, והוא מחזיר **404** בכל סביבה שבה `NODE_ENV=production` — כלומר **הוא כבר לא נגיש באתר החי היום**. ⚠️ **אין צורך בתשובה** — ⛔ הלופ ⛔ לא נעצר.

- [ ] **Step 5: אימות מלא + בדיקה ידנית אחת שאינה ניתנת לאוטומציה**

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```
**מצופה:** ארבעתן ירוקות. ⛔ **`npm run check:mobile` ⛔ אינו נדרש כאן** — ‏Task 6 ⛔ אינו נוגע ברכיב ו⛔ אינו מוסיף מסך.

⚠️ **והצעד הידני, שנרשם כמוגבלות ⛔ ולא נטען כירוק:** ‏`build` מריץ עם `NODE_ENV=production` ⇒ הוא מוכיח שהנתיב **מתקמפל**, ⛔ ולא שהוא מחבר. הרצה חיה דורשת `.env.local` + משתמש אמיתי, ⛔ ואין לסוכן פרויקט Supabase. ⇒ **דווח במפורש: «‏הנתיב נבנה ונבדק בסריקה; ⛔ הוא ⛔ לא הורץ מול Supabase חי»**, והוסף את זה כשורה בפריט 36. ⛔ **אל תכתוב «עובד».**

- [ ] **Step 6: סגירת T-113 וקומיט**

`plan/50-tasks.md` — T-113 ⇒ **🟣 לביקורת**. הרץ `npm run measure:plan` וחייב את `docs/plan-tables.md`.
`loop(DEV): C-XXXX T-113 — משתמש בדיקה לפיתוח, שער שנכשל סגור (D-057)`

---

## סגירה — ⛔ חובה בכל טיק שנכתב בו קוד

- [ ] `plan/30-architecture.md` — שתי רשומות החוב (Task 2 · Task 6)
- [ ] `plan/50-tasks.md` — T-111 · T-113 ⇒ 🟣
- [ ] `plan/60-findings.md` — כל ממצא שנמדד תוך כדי. ⛔ **אל תמציא ממצא כדי למלא שורה**
- [ ] **`npm run measure:plan` ו-`docs/plan-tables.md` בקומיט — בכל אחד משני הקומיטים** (‏F-111)
- [ ] `plan/00-control.md` — `CYCLE_ID` (‏`git pull` ואז מקסימום+1) · `ACTIVE_TASK_ID` · `NEXT_AGENT=CRITIC` · שחרור `LOCK` · `MILESTONE_TICKS` +1 · שורה ביומן 0.1 (עד 2 שורות, ⛔ **ותקרת 12KB לקובץ**)
- [ ] ⛔ **בלי `[skip ci]`** · ⛔ `git push origin dev` בלבד

## Self-Review — נבדק מול המפרט

| דרישה | היכן היא מומשה | ⇒ |
|---|---|---|
| D-056 «העמודה ⛔ אינה נמחקת» | ⛔ אפס `drop column` · אפס קובץ ב-`supabase/` · בדיקת `0009` **נשארת** (סטייה 2) | ✅ |
| שורת T-111 «בלוק «המטרה שלך» נשאר» | `MeScreen.tsx` ⛔ **לא נגעו בו** — סטייה 1, הטבלה נוקבת בשישה קבצים ובאילו שלושה | ✅ |
| שורת T-111 «סריקת מקור ש-`institution` אינו באף רכיב onboarding» | Task 3 Step 1, טענה 1 | ✅ |
| D-057 «⛔ אין סיסמה בקוד או בריפו» | ‏`.env.example` **בערך ריק** · בדיקת הנתיב אוסרת `DEV_TEST_USER_` ו-`process.env` בקובץ הנתיב | ✅ |
| D-057 «⛔ אין יצירה בזמן build של ייצור» | ‏`nodeEnv !== 'development'` ⇒ סגור; `build` רץ תחת `production` ⇒ **סגור בבנייה** | ✅ |
| D-057 «⛔ אין דילוג על RLS · אין service-role» | ‏`signInWithPassword` דרך `createRouteClient` (anon key) ⇒ משתמש רגיל · `serviceRole.test.ts` סורק את `app/` וחל על הנתיב בלי שורה חדשה · בדיקת הנתיב אוסרת `auth.admin` ו-`signUp` | ✅ |
| D-057 «⛔ נתיב `/dev/*` נגיש בייצור» | הנתיב **⛔ אינו** תחת `app/dev/`, ומחזיר **404 עירום** בייצור (סטייה 3) | ✅ |
| D-057 «נכשל **סגור**: משתנה חסר ⇒ אין משתמש» | ‏Task 4, האינווריאנט על **כל** 125 הצירופים | ✅ |
| D-057 «חובה: פריט ב-`03-for-roy` «להסרה לפני השקה»» | **פריט 36 כבר פתוח** (PM, C-0190) ⇒ **עדכון במקום** ⛔ ולא כפילות, ⛔ ולא סגירה (סטייה 4ⓖ) | ✅ |
| F-002 — עוגיות הסשן | הנתיב ⛔ אינו יוצר `createServerClient` בעצמו; הבדיקה אוסרת את המחרוזת | ✅ |
| F-111 — הרַצֶ׳ט | `measure:plan` בשני הקומיטים, ורשום בשלושה מקומות בתוכנית | ✅ |
| ⛔ המצאת מסך | ‏T-113 ⛔ אינה מוסיפה מסך, כפתור או רכיב; T-111 **מסירה** שדה לפי הכרעה חתומה | ✅ |

⚠️ **מה שהתוכנית הזאת במפורש ⛔ אינה מכסה, ולמה:** **T-103** («סיבוב שטף» בזירה) הייתה השורה השלישית הכשירה. היא ⛔ **לא נלקחה**: היא משימת ממשק (`app/arcade/*` · סקיל `ui-styling`), ו⛔ **אין לה תוכנית UX** — נמדד, אין סעיף `§ 4.2` שנוקב ב-T-103, ו-D-049/D-062 קובעות **מה אסור** (⛔ אין ספירה לאחור · ⛔ אין מכפיל · ⛔ אין «הפסדת») ⛔ **ואינן קובעות מה כן על המסך**: איפה יושבת הבחירה, מה מציג הדדליין אם ⛔ אין שעון, ומה מסך הסיום. ⇒ **ממצא ל-PM**, ⛔ ולא המצאת מסך על ידי ה-Dev. ⚠️ **ונמדדה סתירה שנייה שחייבת להיסגר באותו ממצא:** שורת T-103 עדיין נוקבת במאגר `self_marked_known OR repetition>=1` — **שני שדות של הצד הלימודי ש-D-052 אוסר על הזירה לקרוא**, ו-D-062 כבר החליפה אותם ב-`timesCorrect >= 3` (‏`lib/core/arcadeFluency.ts:24`, ⛔ קיים ובנוי). ⇒ שורת המשימה מתארת קוד **בלתי חוקי**, וזה בדיוק מה ש-D-062 נכתבה כדי למנוע.
