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

## נקודות קצה מתוכננות (טרם מומשו)

> עמודת "חסום ב-" עודכנה ב-C-0001: **R-001 נסגרה**, אך רוי פסל את EVP כמקור תוויות
> הרמה (H-001 ב-`project_plan.md` 0.2). כל נקודת קצה שתלויה בתווית רמה למילה ממתינה
> למקור החלופי שה-PM יאתר, ולכן חסומה ב-**T-008**.

| שיטה | נתיב | מטרה | חסום ב- |
|---|---|---|---|
| POST | `/api/onboarding` | שמירת מטרה, מוסד, ציון יעד ותאריך מבחן | — |
| GET | `/api/placement/next` | השאלה הבאה במבחן הרמה האדפטיבי | T-008 |
| POST | `/api/placement/answer` | תשובה + עדכון אומדן הרמה | T-008 |
| GET | `/api/review/queue` | תור החזרות להיום | T-008 |
| POST | `/api/review/answer` | ידעתי / לא ידעתי + רמת ביטחון | T-008 |
| GET | `/api/progress` | דשבורד: שליטה, מומנטום, תחזית | T-008 |

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
