import StoryScreen from '@/components/StoryScreen';

/**
 * `/world/story` — T-186 · `36 § 7` · D-108. סוגר את D-091: `WORLD_APP_HREF.library`
 * הצביע לכאן והעמוד ⛔ לא היה קיים (404 נמדד C-0273).
 *
 * ⛔ **אפס גישה לנתונים בקובץ הזה**, אותה הכרעה בדיוק כמו `/world/collected`:
 * ‏`<StoryScreen>` קורא `GET /api/world/story`, שכבר מבצע את סדר השומרים של C-0032
 * (ENV → סשן → שאילתה) וכבר עונה `session_expired` כנתון. ‏`getUser()` שני כאן היה
 * בדיקת סשן שנייה שיכולה לחלוק על הראשונה.
 *
 * המסלול יושב בתוך `(tabs)` ⇒ הוא כבר נושא את סרגל הלשוניות כמו ברנדר, ולכן ⛔ אין
 * תחתיו `<ActionBar>` (D-028: סרגל אחד למסך).
 */
export default function WorldStoryPage() {
  return <StoryScreen />;
}
