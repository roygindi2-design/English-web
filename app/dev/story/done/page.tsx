import { StoryScreenView } from '@/components/StoryScreen';

/**
 * פיקסטורת פריסה ל-`check:mobile` ול-`diff:render` — T-188 · **שוכתבה T-202ⓔ**.
 * ⛔ אינה מסך מוצר ו⛔ אינה מקושרת משום מקום.
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
 * ⛔ **השאלה ⛔ אינה מומצאת.** היא שורה 2 של
 * `data/generated/story-questions-2026-08-25.jsonl` — הפריט ש-CONTENT מסר ב-C-0295
 * ושעבר את `storyQuestionGate` ‏12/12. ⛔ אין כאן ניסוח, תרגום או מסיח שנכתב כאן.
 * ⛔ **והאנגלית של הגוף** היא **בדיוק** `STORY` של `docs/design/render_video_A.py` —
 * אותו טקסט פריסה שממנו נמדד `kol-A-06-question.png`.
 */
const FIXTURE_BODY =
  'Every morning Maya walks to the old library near the river. She likes the quiet ' +
  'rooms and the smell of old paper. One day she found a small book with no title on ' +
  'it. Inside, someone had written one sentence in pencil.';

export default function DevStoryDonePage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <StoryScreenView
        initialPhase="question"
        state={{
          kind: 'ready',
          payload: {
            story: {
              id: 'aaaaaaaa-0000-4000-8000-000000000001',
              titleEn: 'The library near the river',
              bodyEn: FIXTURE_BODY,
            },
            index: 3,
            total: 12,
            level: 'A1',
            glosses: {
              library: { translationHe: 'סִפְרִיָּה', posHe: 'שם עצם', wordId: 'fixture-library' },
              river: { translationHe: 'נָהָר', posHe: 'שם עצם', wordId: 'fixture-river' },
              quiet: { translationHe: 'שָׁקֵט', posHe: 'שם תואר', wordId: 'fixture-quiet' },
              smell: { translationHe: 'רֵיחַ', posHe: 'שם עצם', wordId: 'fixture-smell' },
              found: { translationHe: 'מָצְאָה', posHe: 'פועל', wordId: 'fixture-found' },
              book: { translationHe: 'סֵפֶר', posHe: 'שם עצם', wordId: 'fixture-book' },
              sentence: { translationHe: 'מִשְׁפָּט', posHe: 'שם עצם', wordId: 'fixture-sentence' },
            },
            knownLemmas: ['river', 'book', 'quiet', 'smell'],
            counts: { newWords: 5, alreadyKnown: 4 },
            question: {
              questionEn: 'Who wrote the letter that was in the book?',
              answersHe: ['אם', 'אנשים', 'חבר'],
              correctIndex: 2,
            },
          },
        }}
      />
    </main>
  );
}
