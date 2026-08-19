import ArenaBoard from '@/components/ArenaBoard';

/**
 * `/arcade` — הקרב. T-095 · § 4.2י.
 *
 * ⛔ **הקובץ יושב מחוץ ל-`app/(tabs)/`, וזה מבנה ⛔ ולא סגנון.** § 4.2י קורא לזה מסך זרימה
 * מלא-מסך, D-028 מתיר סרגל אחד למסך, וסרגל מסך הזרימה הוא ה-`<ActionBar>`. קובץ **מחוץ**
 * לקבוצה הופך את «בלי סרגל תחתון» לבלתי-שביר — סרגל הלשוניות חי ב-layout של הקבוצה,
 * והקובץ הזה אינו בה. אותו נימוק בדיוק של `app/world/compose/page.tsx`.
 *
 * Server Component ⛔ בלי גישה לנתונים: `<ArenaBoard>` קורא `GET /api/arcade/round`, שכבר
 * מבצע את סדר השמירה של C-0032 ומחזיר `session_expired` **כנתון**. `getUser()` שני כאן
 * היה בדיקת סשן שנייה שיכולה לחלוק על הראשונה, והשפעתה הנראית היחידה — הפניה שמתחרה
 * ב-fetch. ⛔ ומאותה סיבה `/arcade` ⛔ אינו נכנס ל-`PROTECTED_SCREENS`.
 */
export default function ArcadePage() {
  return <ArenaBoard />;
}
