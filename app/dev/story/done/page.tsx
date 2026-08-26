import { StoryScreenView } from '@/components/StoryScreen';
import {
  FIXTURE_BODY_EN,
  FIXTURE_COUNTS,
  FIXTURE_GLOSSES,
  FIXTURE_KNOWN_LEMMAS,
  FIXTURE_QUESTION,
  FIXTURE_STORY_ID,
  FIXTURE_TITLE_EN,
} from '../story-fixture';

/**
 * פיקסטורת פריסה ל-`check:mobile` ול-`diff:render` — T-188 · **שוכתבה T-202ⓔ** ·
 * **חוברה למקור אחד ב-F-133.**
 *
 * ⛔ **מה שהיה כאן קודם הוא בדיוק איך ש-F-124 שרדה 1,119 בדיקות ירוקות:** הפיקסטורה
 * רינדרה את `StoryEndScreen` **בבידוד**, ולכן היא מדדה רכיב שהעמיד פנים שהוא מסך —
 * `min-h-[100dvh]`, פעולה ראשית משלו, ו⛔ בלי שורת המצב שהרנדר מצייר בשני הפריימים.
 * ⇒ מה שנמדד היה נכון, והמסך שהלומד מקבל היה שגוי. **פיקסטורה של רכיב בבידוד ⛔ אינה
 * בדיקה של מסך.**
 *
 * ⇒ כאן מרונדר **המסך כולו** במצב `question` דרך `initialPhase`, ולכן `check:mobile`
 * מודד את מה שהלומד באמת רואה: שורת המצב · כרטיס השאלה · שורת הסיכום · המקרא ·
 * הפעולה הראשית. ⛔ אין כאן בקשת שרת ⇒ ⛔ אין רשומה ב-`EXPECTED_CONSOLE`, והשקט הוכחה.
 *
 * ⛔ **והשאלה היא שאלתו של הגוף הזה — זה תיקון F-133.** קודם ישבה כאן שורה 2 של
 * `story-questions-2026-08-25.jsonl`, שהיא שאלתו של «The letter in the book» ⇒ מסך
 * הבנה ש⛔ אין ממנו דרך לגזור תשובה. שתיהן באות עכשיו מ-`../story-fixture`, ו-
 * `story-fixture.test.ts` מודד אותן מול הרנדר ומול העיגון בגוף.
 */
export default function DevStoryDonePage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <StoryScreenView
        initialPhase="question"
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
            question: FIXTURE_QUESTION,
          },
        }}
      />
    </main>
  );
}
