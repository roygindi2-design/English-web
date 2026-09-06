import ArenaShell from '@/components/ArenaShell';
import './arcade-tokens.css';

/**
 * T-264 · reversible call under `RULES § 0.22`, logged: `<ArenaShell>` is a Client
 * Component holding `'home' | 'battle'` internal state (T-181, above), so the title
 * cannot follow that state — a static `metadata` export runs once, server-side. Used
 * the screen this route always opens on (`36 § 13`, T-181): `<ArenaHome>`'s own
 * `<h1>` (`components/ArenaHome.tsx` `TITLE_HE`, `'זירת קרב'`). ⛔ Zero new wording.
 */
export const metadata = { title: 'זירת קרב' };

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
 *
 * ⚠️ **T-181 — `/arcade` נפתח על מסך הבית של `37 § 12`, ⛔ ולא בתוך קרב.**
 * ‏`<ArenaShell>` מחזיק `'home' | 'battle'`; ⛔ אין ראוט חדש ⇒ ⛔ אין שינוי ניווט
 * (`RULES § 0.22`). ⛔ **והעמוד ⛔ לא הפך ללקוח** — הוא מרכיב רכיב לקוח אחד, בדיוק
 * כפי שהרכיב קודם את `<ArenaBattle>`.
 */
export default function ArcadePage() {
  return <ArenaShell />;
}
