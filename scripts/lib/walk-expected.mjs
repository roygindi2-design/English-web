/**
 * `T-380` — **שגיאת קונסול שהיא החוזה, ⛔ ולא פגם.**
 *
 * 🔬 **למה זה נולד, ונמדד ⛔ ולא שוער:** `/dev/story/live` מרנדר את מסך הסיפור מול
 * ה-API **האמיתי**, ובקלון בלי env של Supabase `GET /api/world/story` עונה **503
 * בחוזה שלו עצמו** ⇒ הדפדפן רושם שתי שורות קונסול, וההליכה — שמפילה על כל שגיאה —
 * הייתה מאדימה בכל טיק, אצל כל סוכן, לנצח. ⇒ ⛔ זה ⛔ לא היה מודד מוצר שבור, זה היה
 * מלמד את הלופ להתעלם מהעמודה.
 *
 * ⛔ **וזו ⛔ אינה השתקה — זו אותה תבנית בדיוק** ש-`scripts/verify-mobile.mjs`
 * מחזיק כ-`EXPECTED_CONSOLE` מאז `C-0103`, על אותו נימוק מילה במילה: הפיקסטורה
 * ⛔ אינה מבקשת מהשרת דבר ⇒ ⛔ אין לה רשומה, והשקט הזה הוא ההוכחה שהרשת נמדדת.
 *
 * 🔴 **צר בשלושה צירים, ⛔ ואם אחד מהם זז השורה מאדימה שוב:** המסלול המדויק · הנתיב
 * המדויק · **הסטטוס המדויק**. ⛔ 401 כאן, 500 כאן, או 503 על נתיב אחר — ⛔ אף אחד
 * מהם ⛔ אינו מוחרג.
 */
export const EXPECTED_CONSOLE = {
  '/dev/story/live': [
    // שורת ה-`response` של ההליכה עצמה — היא כן נושאת כתובת, ולכן היא מקודדת אליה.
    /^HTTP 503 ⇐ \S*\/api\/world\/story/,
    // שורת ה-`console` של הדפדפן — ⛔ אינה נושאת כתובת בכלל, ולכן היא מקודדת
    // לסטטוס. ⛔ «Failed to load resource» בלי 503 ⛔ אינו מוחרג.
    /^Failed to load resource: the server responded with a status of 503 /,
  ],
};

/**
 * ⚠️ **מפריד, ⛔ ולא מוחק** — בדיוק כמו `splitAborted`: המוחרגות נספרות לחוד ונכתבות
 * ל-`walk.json`, כדי ש«⛔ אין שגיאות» ו«היו שתיים, שתיהן מוצהרות» ⛔ לא ייראו זהים.
 */
export function splitExpected(route, errors) {
  const patterns = EXPECTED_CONSOLE[route] ?? [];
  if (patterns.length === 0) return { errors: [...errors], expected: [] };
  const kept = [];
  const expected = [];
  for (const line of errors) {
    (patterns.some((p) => p.test(line)) ? expected : kept).push(line);
  }
  return { errors: kept, expected };
}
