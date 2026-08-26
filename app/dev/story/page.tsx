import { StoryScreenView } from '@/components/StoryScreen';
import {
  FIXTURE_BODY_EN,
  FIXTURE_COUNTS,
  FIXTURE_GLOSSES,
  FIXTURE_KNOWN_LEMMAS,
  FIXTURE_QUESTION,
  FIXTURE_STORY_ID,
  FIXTURE_TITLE_EN,
} from './story-fixture';

/**
 * פיקסטורת פריסה ל-`check:mobile` (T-186). ⛔ אינה מסך מוצר ו⛔ אינה מקושרת משום מקום.
 *
 * ⚠️ **בלי הפיקסטורה מסך הקריאה לעולם אינו נמדד:** ‏`/world/story` יושב מחוץ ל-
 * `PROTECTED_SCREENS` ולכן הוא **כן** מרונדר בהרצה, אבל בלי env של Supabase
 * `GET /api/world/story` עונה `session_expired` בחוזה שלו עצמו ⇒ מה שהשורה ההיא מודדת
 * הוא מצב **הכשל**. הפיקסטורה מקבלת את הסיפור כ-prop ו⛔ אינה מבקשת מהשרת דבר ⇒
 * ⛔ אין לה רשומה ב-`EXPECTED_CONSOLE`, והשקט הזה הוא ההוכחה.
 *
 * ⛔ **המחרוזות ⛔ אינן כאן, וזה תיקון F-133:** הן ב-`./story-fixture`, מקור אחד
 * שגוף ושאלה נלקחים בו מאותו סיפור — ‏`STORY` ו-`QUESTION` של
 * `docs/design/render_video_A.py`, הרנדר שממנו נמדדו `kol-A-05-story.png`
 * ו-`kol-A-06-question.png`. ⛔ עותק שני של הפיקסטורה הוא איך ש-F-133 נולדה.
 */
export default function DevStoryPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <StoryScreenView
        state={{
          kind: 'ready',
          payload: {
            story: { id: FIXTURE_STORY_ID, titleEn: FIXTURE_TITLE_EN, bodyEn: FIXTURE_BODY_EN },
            index: 3,
            total: 12,
            level: 'A1',
            glosses: FIXTURE_GLOSSES,
            knownLemmas: FIXTURE_KNOWN_LEMMAS,
            counts: FIXTURE_COUNTS,
            // השאלה נוסעת כדי שהמצב השני יהיה בר-הגעה מהפיקסטורה.
            question: FIXTURE_QUESTION,
          },
        }}
      />
    </main>
  );
}
