import CollectedWords from '@/components/CollectedWords';

/**
 * «המילים שאספתי» — T-110 · § 4.2יב.
 *
 * ⛔ **אפס גישה לנתונים בקובץ הזה**, אותה הכרעה בדיוק כמו ב-`/world/chain`:
 * ‏`<CollectedWords>` קורא `GET /api/arcade/collected`, שכבר מבצע את סדר השמירה של
 * C-0032 (ENV → סשן → שאילתה) וכבר עונה `session_expired` כנתון. `getUser()` שני כאן
 * היה בדיקת סשן שנייה שיכולה לחלוק על הראשונה.
 *
 * המסלול יושב בתוך `(tabs)` ⇒ הוא כבר נושא את סרגל הלשוניות, ולכן ⛔ אין תחתיו
 * `<ActionBar>` (D-028: סרגל אחד למסך).
 *
 * ⛔ אין כאן גרף ואין מדד (⛔ לא `dataviz`) — «רשימה אינה תצוגת נתונים» (§ 4.2יב).
 */
export default function WorldCollectedPage() {
  return <CollectedWords />;
}
