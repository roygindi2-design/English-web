# חוזה ה-API

> מתעדכן **באותו קומיט** של כל שינוי בנקודות הקצה. חוזה לא מעודכן = ממצא 🟠 HIGH.
>
> **הכלל:** רכיב ממשק לעולם אינו ניגש לדאטהבייס. כל תקשורת עוברת דרך `/api/*`
> ודרך `lib/api/client.ts` בלבד. זו השכבה היחידה שתוחלף כשנעבור ל-React Native.

## GET /api/health

בדיקת תקינות סביבה. משמשת גם את סוכן ה-Critic כדי לזהות סביבה שגויה.

**תגובה — 200 כשתקין, 503 כשלא:**

```json
{
  "ok": true,
  "checks": [
    { "name": "supabase_url",                "ok": true, "detail": "configured" },
    { "name": "supabase_anon_key",           "ok": true, "detail": "configured" },
    { "name": "placeholder_content_blocked", "ok": true, "detail": "blocked" }
  ]
}
```

`placeholder_content_blocked` נכשל כאשר `NEXT_PUBLIC_ALLOW_PLACEHOLDER=true` —
כלומר תוכן לימודי לא מאומת חשוף למשתמשים. זהו מצב אסור ב-production.


---

## POST /api/auth/signup

יצירת חשבון. **גוף הבקשה:** `{ "email": string, "password": string }`

**200 — הצלחה:**

```json
{ "ok": true, "outcome": "session_active", "next": "/onboarding", "email": "roy@example.com" }
```

`outcome` הוא `session_active` כשהתקבל session (אימות אימייל כבוי ב-Supabase),
או `awaiting_email_confirmation` כשנשלח מייל אישור ואין session. אז `next` הוא
`/login`. הקוד תומך בשתי ההגדרות ואינו מניח אף אחת מהן — ראה `docs/SETUP.md` נספח ב-2.

**422 — כשל ולידציה מקומי:** `{ "ok": false, "fieldErrors": { "email"?: string, "password"?: string } }`
**409 — האימייל תפוס:** `{ "ok": false, "code": "email_taken", "message": "...", "email": "..." }`
**400 / 503 — אחר:** `{ "ok": false, "code": "...", "message": "..." }`
**400 — גוף בקשה שאינו אובייקט** (`null`, מערך, מחרוזת, מספר): `{ "ok": false, "code": "unavailable", "message": "..." }`.
חל על שני נתיבי האימות. הגוף `null` עובר את `request.json()` בלי לזרוק, ולפני F-004
הפיל את הנתיב ל-500 עם stack trace בלוג. הגנה: `isCredentialPayload` ב-`lib/core/auth.ts`.

בהצלחה עם session נוצרת גם שורת `profiles` עם `track_id='amiram'` (D-016).
המקור הסמכותי ליצירתה הוא טריגר בדאטהבייס (`supabase/migrations/0001_profiles.sql`);
הכתיבה מכאן היא רשת ביטחון לפרויקט שהמיגרציה טרם הורצה בו.

## POST /api/auth/login

התחברות. **גוף הבקשה:** `{ "email": string, "password": string }`

**200:** `{ "ok": true, "next": "/onboarding" }`
**401:** `{ "ok": false, "code": "invalid_credentials", "message": "אימייל או סיסמה שגויים" }`
**429:** `{ "ok": false, "code": "rate_limited", "message": "..." }`
**400:** גוף בקשה שאינו אובייקט — זהה ל-signup לעיל (F-004).

⛔ **כל כשל אימות מוחזר עם אותה הודעה בדיוק.** "המשתמש לא קיים" הופך את נקודת
הקצה לכלי למיפוי משתמשים רשומים.

## POST /logout

פעולה, לא מסך (תוכנית UX של T-002). נשלחת מ-`<form method="post">` רגיל, כך
שהיציאה עובדת גם בלי JavaScript ולא ניתנת להפעלה על ידי תגית `<img>` זרה כמו
יציאה מבוססת GET. מסתיימת **תמיד** ב-`303`, גם אם ה-signOut נכשל.

מקבלת שדה טופס יחיד ואופציונלי, `destination`. הערך היחיד שיש לו משמעות הוא
`fix_address` (T-026) — יציאה שנועדה לתקן כתובת שגויה, שמסתיימת ב-`303` ל-
`/signup?email=<הכתובת שהייתה בסשן>`. **כל** ערך אחר, לרבות נתיב או כתובת מלאה,
מסתיים ב-`303` ל-`/` — הגוף מגיע מבקשה לא מאומתת, ולכן הוא אסימון ולא יעד.

## שדות משותפים לכל נקודות הקצה של האימות

* `message` הוא **תמיד עברית מוכנה להצגה**. קוד שגיאה גולמי או טקסט אנגלי של
  הספק לעולם לא מגיע ללומד — אותו כלל מ-T-001. המיפוי ב-`lib/core/auth.ts`.
* ה-session נשמר ב-cookies מסוג httpOnly שנכתבים על ידי `@supabase/ssr`.
  **לא ב-`localStorage`** — שם כל סקריפט שהוזרק יכול לקרוא אותו.
  ⚠️ `@supabase/ssr` **אינו** מספק את זה כברירת מחדל (`httpOnly: false`, בלי `secure`).
  ההבטחה הזו מתקיימת אך ורק דרך `SESSION_COOKIE_OPTIONS` ב-`lib/supabase/auth.ts`,
  שמועבר כ-`cookieOptions` לכל קריאת `createServerClient`. `secure` דולק בפרודקשן בלבד,
  אחרת `http://localhost` היה מפיל את העוגייה בפיתוח. F-002 — מכוסה בבדיקת יחידה.
* `proxy.ts` **נכשל סגור**: כשחסרים משתני הסביבה של Supabase, נתיב מוגן מופנה ל-`/login`
  ואינו נפתח. בנוסף `app/onboarding/page.tsx` בודק `getUser()` בעצמו — הפרוקסי אינו
  עוד נקודת האכיפה היחידה. F-003.
* רענון ה-session והשמירה על הנתיבים המוגנים מתבצעים ב-`proxy.ts` (שם הקונבנציה
  של Next 16; `middleware` הוצא משימוש).

---

## POST /api/profile

שמירת תשובות ה-Onboarding על שורת הפרופיל של הלומד (T-029 · פרוסת ההתמדה של T-003).
דורש סשן חי — הבדיקה נעשית **לפני** ולידציה של הגוף, כדי שקורא לא מאומת לא ילמד
אילו שדות מתקבלים.

**גוף הבקשה:**

```json
{ "dailyMinutes": 5, "examDate": "2026-09-10", "targetScore": "" }
```

`examDate` ו-`targetScore` ריקים (`""`) פירושם "דילג" ונשמרים כ-`NULL`.
`dailyMinutes` חייב להיות אחד מ-`5 | 10 | 20` (‏`DAILY_MINUTES_OPTIONS` ב-
`lib/core/onboarding.ts`), ואותה שלישייה נאכפת שוב במסד דרך
`profiles_daily_minutes_check` ב-`0004_onboarding_answers.sql`. בדיקת יחידה
נכשלת אם השתיים נפרדות.

⚠️ **"היום" הוא היום בלוח השנה של הלומד, לא של השרת.** ולידציית `examDate` מקבלת
`toIsoDateInZone(new Date(), LEARNER_TIME_ZONE)`. ישראל היא UTC+2/+3, ולכן
בשעתיים-שלוש הראשונות של כל יום מקומי `new Date().toISOString()` עדיין מחזיר את
תאריך **אתמול** — לומד שממלא את הטופס אחרי חצות ביום המבחן היה יכול לשמור תאריך
שכבר עבר (C-0032).

**200 — נשמר:**

```json
{ "ok": true, "next": "/studies" }
```

`next` הוא היעד היחיד שנקבע כאן: `components/OnboardingForm.tsx` מנווט למה שמגיע
בשדה הזה ואינו מחזיק יעד משלו. **C-0073: השתנה מ-`/study` ל-`/studies`** לפי
§ 4.2ב זרימה 1 — `/study` הוא מסך זרימה בלי סרגל לשוניות, ולומד שנחת בו לא יכול
היה להגיע לשלוש הלשוניות האחרות בלי לערוך את כתובת ה-URL.
`app/api/profile/route.test.ts` נכשלת אם המחרוזת כאן והמחרוזת בקוד נפרדות.

**422 — שדה לא תקין.** כל השדות הפגומים מדווחים יחד, לא הראשון בלבד:

```json
{ "ok": false, "fieldErrors": { "examDate": "התאריך הזה כבר עבר." } }
```

**401 — אין סשן:** `{ "ok": false, "code": "session_expired" }`
**400 — גוף שאינו אובייקט** (`null`, מערך, פרימיטיב — F-004): `{ "ok": false, "code": "unavailable" }`
**503 — סביבה לא מוגדרת או כתיבה נכשלה:** `{ "ok": false, "code": "unavailable" }`

הכתיבה היא `update` ולא `upsert`: הטריגר `on_auth_user_created` ב-
`0001_profiles.sql` כבר יצר את השורה, ו-`upsert` היה נאלץ לחזור על `track_id` —
מקום שני שבו ברירת המחדל חיה הוא מקום שני שבו היא יכולה להיות שגויה (D-016).

---

## POST /api/review

תשובה אחת על כרטיס אחד: צבירת ההתקדמות (T-005 · טלמטריית D-010) **וגם** תזמון
החזרה הבאה (מנוע 7.1). דורש סשן חי — הבדיקה נעשית **לפני** קריאת הגוף, כדי שקורא
לא מאומת לא ילמד אילו שדות מתקבלים.

**גוף הבקשה:**

```json
{
  "word_id": "11111111-2222-3333-4444-555555555555",
  "grade": "good",
  "direction": "recognition",
  "elapsed_ms": 4200
}
```

`grade` חייב להיות אחד מ-`BINARY_GRADES` ו-`direction` אחד מ-`CARD_DIRECTIONS`,
ושניהם **מיובאים** מ-`lib/core/flashcard.ts` ולא משוכפלים כאן — הכרטיס מציע בדיוק
את הדירוגים שה-API מקבל, ובדיקה נכשלת אם השניים נפרדים.

⚠️ **`elapsed_ms` חסום ב-`MAX_ELAPSED_MS = 600000` (10 דקות) ונדחה ב-400 מעל זה,
לא נחתך בשקט.** לומד שהשאיר כרטיס פתוח לילה שלם היה כותב `time_to_first_correct`
בן שמונה שעות אל תוך השדה היחיד שכל שכבת הטלמטריה של D-010 קיימת בשבילו; ערך
שנחתך ל-600000 אינו ניתן להבחנה מערך אמיתי.

⚠️ **"היום" הוא היום בלוח השנה של הלומד** — `toIsoDateInZone(new Date(), LEARNER_TIME_ZONE)`.
זו הנקודה היחידה בזרימה שנוגעת בשעון; שלוש הפונקציות הטהורות (`applyGrade` ·
`scheduleReview`) מקבלות אותו כארגומנט.

**200 — נשמר:**

```json
{ "ok": true, "next_review_at": "2026-08-13T00:00:00.000Z", "mode": "classic", "triage": false }
```

`mode` הוא `classic | exam_compressed | triage`. ⛔ התשובה **אינה** כוללת
`missing_word_ids` ואינה כוללת מצב שער — שער עליית הרמה (7.7) הוא נתיב אחר עם
קריאה אחרת (מנה שלמה בבת אחת), ומענה עליו כאן היה מחייב כל כרטיס בודד לשלם על
שאילתה שהוא אינו צריך.

**401 — אין סשן:** `{ "ok": false, "code": "session_expired" }`
**400 — גוף פגום** (לא אובייקט · `word_id` שאינו uuid · דירוג/כיוון לא מוכר · `elapsed_ms` שלילי, שברי או מעל התקרה): `{ "ok": false, "code": "unavailable" }`
**503 — סביבה לא מוגדרת, קריאה או כתיבה נכשלה:** `{ "ok": false, "code": "unavailable" }`

הכתיבה היא `update` על שורה קיימת ו-`insert` על חסרה — ⛔ **לא `upsert`** (D-016):
‏`upsert` היה נאלץ לחזור על `track_id`, ומקום שני שבו ברירת המחדל חיה הוא מקום שני
שבו היא יכולה להיות שגויה. חמש עמודות ה-SM-2 (`easiness` · `interval_days` ·
`repetition` · `next_review_at` · `consecutive_correct_recognition`) מגיעות מ-
`0005_review_state.sql` ויושבות על `word_progress` הקיימת — **שורה אחת לכל (משתמש,
מילה)**, לא יומן אירועים (W4).

🔒 **האכיפה היא בצד השרת.** הדירוג, המרווח, הרצף ותאריך החזרה הבאה מחושבים כאן
מהמצב השמור ומתאריך המבחן שבפרופיל; הלקוח שולח מה קרה, לא מה התוצאה. אותו כלל
חל על שער עליית הרמה (7.7) בנתיב שלו: לקוח אינו יכול לפתוח לעצמו רמה.

---

## נקודות קצה מתוכננות (טרם מומשו)

> עמודת "חסום ב-" עודכנה ב-C-0001: **R-001 נסגרה**, אך רוי פסל את EVP כמקור תוויות
> הרמה (H-001 ב-`project_plan.md` 0.2). כל נקודת קצה שתלויה בתווית רמה למילה ממתינה
> למקור החלופי שה-PM יאתר, ולכן חסומה ב-**T-008**.

| שיטה | נתיב | מטרה | חסום ב- |
|---|---|---|---|
| POST | `/api/onboarding` | ~~שמירת מטרה, ציון יעד ותאריך מבחן~~ → **מומש כ-`POST /api/profile`** (C-0032). נשארה בלבד שאלת **המוסד** (A7) | T-003 |
| GET | `/api/placement/next` | השאלה הבאה במבחן הרמה האדפטיבי | T-008 |
| POST | `/api/placement/answer` | תשובה + עדכון אומדן הרמה | T-008 |
| GET | `/api/review/queue` | תור החזרות להיום | T-008 |
| POST | `/api/review/answer` | ידעתי / לא ידעתי + רמת ביטחון | T-008 |
| GET | `/api/progress` | דשבורד: שליטה, מומנטום, תחזית | T-008 |

> **C-0015 (T-041):** מסך `/study` קיים ומרנדר מצב ריק כן — `GET /api/review/queue`
> עדיין לא קיים, ואין תוכן מורשה במאגר (P-001). ברגע שהנתיב ייכתב, המסך ימשוך דרך
> `lib/api/client.ts` ויעביר `Card` ל-`<Flashcard>`; הרכיב עצמו שלם ונמדד ב-`/dev/card`
> ו-`/dev/card/typed`. שני המסלולים האלה הם מתקני מדידה בלבד — `noindex`, לא מקושרים,
> ואינם תוכן לימודי.

---

## אימות מובייל ו-PWA — `npm run check:mobile`

חוזה ה-API אינו הדבר היחיד שנאכף אוטומטית. `scripts/verify-mobile.mjs` מריץ את
הערבויות של מדורים 3.2 ו-3.3 מול בילד הפרודקשן, ומחזיר קוד יציאה 1 על כל הפרה:

* אפס גלילה אופקית ב-320px · 375px · 414px (MF-4)
* כל יעד מגע ≥ 44×44px, בכל מסך ובכל רוחב (MF-2)
* `dir="rtl"` ו-`lang="he"` נשמרים בכל נתיב — כולל 404 ומסכי שגיאה (MF-3)
* הפעולה הראשית יושבת בחצי המסך התחתון (MF-5)
* manifest תקין: `standalone` · `theme_color` · אייקוני 192/512 · maskable · כולם נגישים (PW-1)
* ה-Service Worker נרשם, מופעל, ומגיש מסך עברי אמיתי במצב אופליין (PW-2)
* הצעת ההתקנה **אינה** מוצגת בטעינת הדף (תוכנית UX של T-001)

הרצה: `npm run build && npm start` ואז `npm run check:mobile`.
בסביבה שבה Chromium מותקן מראש: `CHROME_PATH=/path/to/chrome npm run check:mobile`.

**למה זה קיים:** Lighthouse 13 הסיר את קטגוריית ה-PWA ואת audit ה-tap-targets,
כך שמדד ההצלחה של T-001 לא ניתן היה למדוד דרכו. הסקריפט מודד את מה שהובטח בפועל.

## Not an endpoint: `npm run measure:coverage`

A local batch script (`scripts/measure-coverage.mjs`), never reachable over HTTP
and never called at request time. It reads `data/` and writes
`docs/coverage-report.md`. Documented here so a future reader looking for where
coverage numbers come from does not go hunting for a route.
