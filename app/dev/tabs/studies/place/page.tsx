import StudiesScreen from '@/components/StudiesScreen';
import TabBar from '@/components/TabBar';
import type { LevelSummary } from '@/lib/core/levelSummary';
import type { StudyPlace } from '@/lib/core/studyPlace';

/**
 * `T-409`ⓒ · רתמת פריסה ל-`check:mobile`. ⛔ אינו מסך מוצר ו⛔ אינו מקושר משום מקום.
 *
 * 🔴 **מה זה מודד ש-`/dev/tabs/studies` ⛔ אינו יכול למדוד, ⛔ ולמה זה מסלול נפרד.**
 * המסלול שמעליו נפתח תמיד על `STUDY_TRACKS[0]` — הוא ⛔ אינו מקבל `fixturePlaces`,
 * ו-`GET /api/study/place` עונה 401 בלי env ⇒ ענף השחזור ⛔ אינו נגיש ממנו **בשום**
 * רוחב. ⇒ אותו נימוק בדיוק שכבר הצדיק את `/dev/deck/done` מול `/dev/deck`: ענף
 * שאי-אפשר להגיע אליו מהמסלול שמעליו מקבל מסלול משלו.
 *
 * ⛔ **וזה בדיוק המחלקה ש-`F-282` מדד** — שם מצב שנבנה (`level_done`) ⛔ לא היה ניתן
 * לרינדור בשום פיקסטורה, ⇒ סגירתו נשענה כולה על קריאת קוד. כאן המצב המשוחזר
 * **מרונדר**, והשער מודד אותו חי.
 *
 * ⛔ **הפיקסטורה קבועה ו⛔ אינה תלויה ברשת ו⛔ לא ברגע שהיא רצה בו** — אותו לקח כמו
 * `FIXTURE_LEVELS` שמעליה: שתי חותמות זמן כתובות ביד, ⛔ ולא שעון.
 */
const FIXTURE_LEVELS: readonly LevelSummary[] = [
  { level: 'A1', totalInLevel: 315, known: 189, inReviewList: 18, unseen: 108 },
  { level: 'A2', totalInLevel: 80, known: 10, inReviewList: 4, unseen: 66 },
  { level: 'B1', totalInLevel: 20, known: 0, inReviewList: 0, unseen: 20 },
  { level: 'B2', totalInLevel: 2, known: 0, inReviewList: 0, unseen: 2 },
  { level: 'C1', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 },
  { level: 'C2', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 },
];

/**
 * ⛔ **שתי שורות ו⛔ לא אחת, ובכוונה:** שורה יחידה הייתה עוברת גם אילו הרכיב פשוט
 * לקח את האיבר הראשון במערך. `אוצר מילים` — שהוא גם `STUDY_TRACKS[0]`, כלומר
 * ברירת המחדל — יושב כאן **ראשון ברשימה ועם החותמת הישנה**, ⇒ שבב `הבנת הנקרא`
 * פעיל על המסך הוא הוכחה שהמיון לפי `updatedAt` הוא שהכריע (`latestStudyPlace`).
 */
const FIXTURE_PLACES: readonly StudyPlace[] = [
  { trackId: 'vocabulary', moduleId: 'B1', updatedAt: '2026-09-16T08:00:00Z' },
  { trackId: 'reading', moduleId: null, updatedAt: '2026-09-17T08:00:00Z' },
];

export default function DevTabsStudiesPlacePage() {
  return (
    <>
      <StudiesScreen fixtureLevels={FIXTURE_LEVELS} fixturePlaces={FIXTURE_PLACES} />
      <TabBar />
    </>
  );
}
