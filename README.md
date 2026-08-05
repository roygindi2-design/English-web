# English Web

אפליקציית לימוד אנגלית אדפטיבית לדוברי עברית. מסלול ראשון: **אמיר״ם**.

הפרויקט נבנה על ידי לופ סוכנים אוטונומי (PM · Dev · Critic) שמתקשרים אך ורק
דרך `project_plan.md`. לפני שנוגעים בקוד — קוראים את `docs/AGENT_BLUEPRINT.md`.

## הרצה מקומית

```bash
npm install
cp .env.example .env.local   # מלא את מפתחות Supabase
npm run dev
```

## אימות לפני כל קומיט

```bash
npm run typecheck && npm run check:core && npm test && npm run build
```

`check:core` אוכף את טוהר `/lib/core/` — הקוד שיעבור לאפליקציית המובייל כמות שהוא.

## ארכיטקטורה

| תיקייה | תפקיד | הכלל |
|---|---|---|
| `lib/core/` | לוגיקה עסקית טהורה | אפס React · אפס DOM · אפס רשת · אפס `process.env` |
| `app/api/` | נקודות קצה HTTP | ולידציה, הרשאות, קריאה ל-core |
| `lib/api/` | לקוח HTTP דק | השכבה היחידה שתוחלף ב-React Native |
| `components/` | ממשק בלבד | לעולם לא ניגש לדאטהבייס |

## פריסה

Netlify מקושר ל-`main` ומעלה כל דחיפה אוטומטית. הגדרות הבנייה ב-`netlify.toml`,
לא בלוח הבקרה.
