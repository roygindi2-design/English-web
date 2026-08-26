/**
 * «כאן היית» — הצומת האחרון שהלומד פתח בטבעת (T-206 · D-119).
 *
 * ⛔ **זיכרון ניווט של מכשיר, ⛔ ולא התקדמות למידה.** ⛔ אינו נקודות, ⛔ אינו
 * מטבע, ⛔ אינו רצף, ⛔ אינו לוח תוצאות (**D-050 נשמרת במלואה**), ו⛔ **אינו
 * נוגע ב-`word_progress`** — כרטיס הבידוד ב-`36 § 6` אומר זאת על המסך עצמו.
 *
 * ⚠️ **הפונקציה מקבלת מחרוזת ו⛔ לא `Storage`, וזו ⛔ אינה העדפת סגנון:**
 * `check:core` אוסר DOM ב-`lib/core`, ולכן ה-`try/catch` סביב `localStorage`
 * חי ב-`components/WorldRing.tsx` (T-206ⓔ) — בעוד **ההכרעה מה ערך שמור אומר**
 * חיה כאן, במקום שבדיקה מגיעה אליו בלי דפדפן.
 *
 * ⛔ **המודול ⛔ אינו מנווט ו⛔ אינו סופר** (T-206ⓓ): הוא מחזיר מזהה או `null`.
 */
import { RING_ORDER, type RingNodeId } from './worldRing';

export const LAST_NODE_KEY = 'kol.world.lastNode';

/**
 * ⛔ **רשימת היתר, ⛔ ולא בדיקת צורה.** `RING_ORDER` הוא המקור היחיד, ולכן צומת
 * שיוסר מהטבעת מפסיק להיות ערך קביל **באותו רגע** ⛔ ובלי עריכה שנייה כאן —
 * וחיפוש במערך ⛔ אינו נוגע ב-prototype, כך ש-`'__proto__'` ו-`'toString'`
 * מקבלים `null` כמו כל מחרוזת זרה.
 */
export function parseLastNode(raw: string | null): RingNodeId | null {
  if (raw === null) return null;
  const hit = RING_ORDER.find((id) => id === raw);
  return hit ?? null;
}
