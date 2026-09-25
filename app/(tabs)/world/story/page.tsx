import StoryScreen from '@/components/StoryScreen';

/**
 * T-264 · reversible call under `RULES § 0.22`, logged: this screen's real `<h1>` is
 * the story's English title, fetched client-side inside `<StoryScreen>` (no data
 * access happens in this Server Component — see the note below), so it is not known
 * at the time the static `metadata` export runs and cannot be the tab/history title.
 * Used `KICKER_HE` instead (`components/StoryScreen.tsx` `'העולם · סיפורים'`) — the
 * nearest already-written, static text identifying this screen, sitting directly
 * above the dynamic `<h1>` in the same header block. ⛔ Zero new wording either way.
 */
export const metadata = { title: 'העולם · סיפורים' };

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
export default async function WorldStoryPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // 📚 T-511ⓑ — a card in «ספריית הסיפורים» opens `?id=<uuid>`. Only a string is passed
  // on; the route validates it and falls back to the day's pick (`T-510`ⓒ).
  const { id } = await searchParams;
  return <StoryScreen storyId={typeof id === 'string' ? id : undefined} />;
}
