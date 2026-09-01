import StudiesScreen from '@/components/StudiesScreen';
import TabBar from '@/components/TabBar';
import type { LevelSummary } from '@/lib/core/levelSummary';

/**
 * רתמת פריסה ל-check:mobile. ⛔ אינו מסך מוצר ו⛔ אינו מקושר משום מקום.
 *
 * `<TabBar />` נקרא כאן מפני שהפיקסטורה חיה **מחוץ** ל-`app/(tabs)` — בדיוק הסיבה
 * שקבוצת המסלול קיימת. בלעדיו הפיקסטורה הייתה קצרה ב-4.5rem מהמסך שהיא מייצגת.
 *
 * `fixtureLevels` קבוע ו⛔ אינו תלוי ברשת: פיקסטורה שתלויה ברגע שהיא רצה בו
 * מייצרת מספרים שאי-אפשר לשחזר בהרצה הבאה — אותו לקח כמו `SAMPLE_TODAY` הישן.
 */
const FIXTURE_LEVELS: readonly LevelSummary[] = [
  { level: 'A1', totalInLevel: 315, known: 189, inReviewList: 18, unseen: 108 },
  { level: 'A2', totalInLevel: 80, known: 10, inReviewList: 4, unseen: 66 },
  { level: 'B1', totalInLevel: 20, known: 0, inReviewList: 0, unseen: 20 },
  { level: 'B2', totalInLevel: 2, known: 0, inReviewList: 0, unseen: 2 },
  { level: 'C1', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 },
  { level: 'C2', totalInLevel: 0, known: 0, inReviewList: 0, unseen: 0 },
];

export default function DevTabsStudiesPage() {
  return (
    <>
      <StudiesScreen fixtureLevels={FIXTURE_LEVELS} />
      <TabBar />
    </>
  );
}
