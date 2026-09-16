import StoryScreen from '@/components/StoryScreen';

/**
 * `/dev/story/live` — `T-380`ⓐ. **אותו מסך, ⛔ בלי הפיקסטורה.**
 *
 * 🔑 **מה הנתיב הזה נותן שההליכה ⛔ לא יכלה לקבל:** ‏`/dev/story` מרנדר את
 * `StoryScreenView` עם `app/dev/story/story-fixture.ts` כ-prop ⇒ הוא מודד **פריסה**,
 * ו⛔ אינו נוגע ב-`GET /api/world/story` ולו פעם אחת. ⇒ שלוש-עשרה מסכי ההליכה היו
 * ירוקים בעוד השרשרת האמיתית — טעינה · הקשה · שאלה — ⛔ מעולם ⛔ לא נבדקה מחוץ
 * לפיקסטורה. הנתיב הזה מרנדר את **המכולה** (`StoryScreen`), שהיא זו שקוראת לנתיב.
 *
 * ⚠️ **⛔ וזה ⛔ אינו עותק של `/world/story`:** הוא יושב מחוץ ל-`(tabs)` ⇒ ⛔ בלי סרגל
 * לשוניות (`D-028`), והוא בר-הגעה בהליכה בלי לעבור בטבעת. הסשן הוא זה שכבר קיים —
 * `GET /api/dev/session` — ⛔ ואין כאן ולו שורת אימות אחת: `StoryScreen` כבר מקבל
 * `session_expired` כנתון ומצייר אותו, ובדיקת סשן שנייה כאן הייתה יכולה לחלוק על
 * הראשונה (אותו נימוק בדיוק כמו `app/(tabs)/world/story/page.tsx`).
 *
 * 🔬 **ומה שהוא מודד כשאין env, ⛔ וזה ⛔ לא באג בנתיב:** בלי משתני Supabase הנתיב
 * האמיתי עונה `session_expired` **בחוזה שלו עצמו**, והמסך מצייר את מצב הכשל. ⇒
 * ההליכה מצלמת **מה שהלומד באמת יראה שם**, ⛔ ולא מסך ירוק שנבנה מנתון מומצא.
 * ‏`F-262` מדד שאין env בטיק מתוזמן; זו הצהרה על הסביבה, ⛔ ולא על המסך.
 *
 * ⛔ **⛔ ואינו מסך מוצר** — כמו כל `app/dev/**`, הוא ⛔ אינו מקושר משום מקום בטבעת.
 */
export const metadata = { title: 'dev · story · live' };

export default function DevStoryLivePage() {
  return (
    <main className="mx-auto w-full max-w-md py-6">
      <StoryScreen />
    </main>
  );
}
