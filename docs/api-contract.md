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

| שיטה | נתיב | מטרה | חסום ב- |
|---|---|---|---|
| POST | `/api/onboarding` | שמירת מטרה, מוסד, ציון יעד ותאריך מבחן | — |
| GET | `/api/placement/next` | השאלה הבאה במבחן הרמה האדפטיבי | R-001 |
| POST | `/api/placement/answer` | תשובה + עדכון אומדן הרמה | R-001 |
| GET | `/api/review/queue` | תור החזרות להיום | R-001 |
| POST | `/api/review/answer` | ידעתי / לא ידעתי + רמת ביטחון | R-001 |
| GET | `/api/progress` | דשבורד: שליטה, מומנטום, תחזית | R-001 |
