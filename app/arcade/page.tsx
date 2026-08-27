import ArenaBattle from '@/components/ArenaBattle';
import './arcade-tokens.css';

/**
 * `/arcade` — הקרב. T-177 · `37-arena-spec § 12` · `36 § 8`.
 *
 * ⛔ **הקובץ יושב מחוץ ל-`app/(tabs)/`, וזה מבנה ⛔ ולא סגנון.** § 4.2י קורא לזה מסך זרימה
 * מלא-מסך, D-028 מתיר סרגל אחד למסך, וסרגל מסך הזרימה הוא ה-`<ActionBar>`. קובץ **מחוץ**
 * לקבוצה הופך את «בלי סרגל תחתון» לבלתי-שביר — סרגל הלשוניות חי ב-layout של הקבוצה,
 * והקובץ הזה אינו בה. ⛔ והרנדר `docs/design/kol-B-03-battle.png` אכן ⛔ אינו מציג סרגל.
 *
 * ⚠️ **`./arcade-tokens.css` נטען כאן, ⛔ ולא ב-`globals.css`** — אינווריאנט `37 § 13.5`:
 * חמשת ערכי הזירה הם **חריגה מגודרת**, ולכן הם חיים בקובץ שנטען מ-`app/arcade/*` בלבד
 * ו⛔ אינם נכנסים ל-`lib/core/palette.ts`. ‏`app/arcade/page.test.ts` אוכף את שניהם.
 *
 * Server Component ⛔ בלי גישה לנתונים: `<ArenaBattle>` קורא `GET /api/arcade/round`, שכבר
 * מבצע את סדר השמירה של C-0032 ומחזיר `session_expired` **כנתון**. ⛔ ומאותה סיבה
 * `/arcade` ⛔ אינו נכנס ל-`PROTECTED_SCREENS`.
 */
export default function ArcadePage() {
  return <ArenaBattle />;
}
