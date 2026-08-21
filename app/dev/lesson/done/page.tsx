import LessonScreen from '@/components/LessonScreen';

/**
 * פיקסטורת פריסה ל-`check:mobile`, ואותו נימוק בדיוק כמו `/dev/deck/done`:
 * `phase` הוא פרופ, ולכן בלוק הסיום ⛔ אינו נגיש מ-`/dev/lesson` — הפיקסטורה
 * מרנדרת אותו ישירות. ⛔ אינה מסך מוצר ו⛔ אינה מקושרת משום מקום.
 *
 * `items` ריק במכוון: הבלוק הזה ⛔ אינו מציג פריטים, ופיקסטורה שממלאת אותם
 * הייתה מודדת מסך שהמוצר לעולם אינו מצייר.
 */
export default function DevLessonDonePage() {
  return (
    <LessonScreen
      questionTypeTitle="כותרת סוג השאלה"
      explanation="⛔ אינו מוצג במצב הזה."
      items={[]}
      phase="done"
      doneTitle="כותרת הסיום"
      doneExitLabel="חזרה ללימודים"
    />
  );
}
