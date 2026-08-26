import StoryEndScreen from '@/components/StoryEndScreen';

/**
 * פיקסטורת פריסה ל-`check:mobile` (T-188). ⛔ אינה מסך מוצר ו⛔ אינה מקושרת משום מקום.
 *
 * ⚠️ **בלי הפיקסטורה מסך הסיום לעולם אינו נמדד** — אותו נימוק בדיוק כמו
 * `/dev/deck/done` מול `/dev/deck` ו-`/dev/lesson/done` מול `/dev/lesson`: מסך הסיום
 * נפתח רק **אחרי** קריאת סיפור שלמה, ובלי env של Supabase המסלול האמיתי עוצר על
 * `session_expired`. הפיקסטורה מקבלת את השאלה כ-prop ו⛔ אינה מבקשת מהשרת דבר ⇒
 * ⛔ אין לה רשומה ב-`EXPECTED_CONSOLE`, והשקט הזה הוא ההוכחה.
 *
 * ⛔ **השאלה כאן ⛔ אינה מומצאת.** היא שורה 2 של
 * `data/generated/story-questions-2026-08-25.jsonl` — הפריט ש-CONTENT מסר ב-C-0295
 * ושעבר את `storyQuestionGate` ‏12/12. ⛔ אין כאן ניסוח, תרגום או מסיח שנכתב כאן.
 */
export default function DevStoryDonePage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <StoryEndScreen
        storyId="aaaaaaaa-0000-4000-8000-000000000001"
        question={{
          questionEn: 'Who wrote the letter that was in the book?',
          answersHe: ['אם', 'אנשים', 'חבר'],
          correctIndex: 2,
        }}
        reviewedCount={4}
      />
    </main>
  );
}
