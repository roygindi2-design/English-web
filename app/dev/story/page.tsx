import { StoryScreenView } from '@/components/StoryScreen';

/**
 * פיקסטורת פריסה ל-`check:mobile` (T-186). ⛔ אינה מסך מוצר ו⛔ אינה מקושרת משום מקום.
 *
 * ⚠️ **בלי הפיקסטורה מסך הקריאה לעולם אינו נמדד:** ‏`/world/story` יושב מחוץ ל-
 * `PROTECTED_SCREENS` ולכן הוא **כן** מרונדר בהרצה, אבל בלי env של Supabase
 * `GET /api/world/story` עונה `session_expired` בחוזה שלו עצמו ⇒ מה שהשורה ההיא מודדת
 * הוא מצב **הכשל**. הפיקסטורה מקבלת את הסיפור כ-prop ו⛔ אינה מבקשת מהשרת דבר ⇒
 * ⛔ אין לה רשומה ב-`EXPECTED_CONSOLE`, והשקט הזה הוא ההוכחה.
 *
 * ⛔ **המחרוזות כאן ⛔ אינן תוכן לימודי.** האנגלית היא **בדיוק** `STORY` של
 * `docs/design/render_video_A.py` — אותו טקסט פריסה שממנו נמדד `kol-A-05-story.png` —
 * ⛔ ואין כאן טענה לשונית, פריט לימודי או תרגום שהומצא.
 */
const FIXTURE_BODY =
  'Every morning Maya walks to the old library near the river. She likes the quiet ' +
  'rooms and the smell of old paper. One day she found a small book with no title on ' +
  'it. Inside, someone had written one sentence in pencil.';

export default function DevStoryPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-6">
      <StoryScreenView
        state={{
          kind: 'ready',
          payload: {
            story: { id: 'fixture-story', titleEn: 'The library near the river', bodyEn: FIXTURE_BODY },
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
            knownLemmas: ['river', 'book'],
            counts: { newWords: 5, alreadyKnown: 2 },
            // ⛔ **השאלה ⛔ אינה מומצאת** — שורה 2 של
            // `data/generated/story-questions-2026-08-25.jsonl`, הפריט ש-CONTENT מסר
            // ב-C-0295 ושעבר את `storyQuestionGate` ‏12/12. ⛔ אין כאן ניסוח, תרגום
            // או מסיח שנכתב כאן. היא נוסעת כדי שהמצב השני יהיה בר-הגעה מהפיקסטורה.
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
