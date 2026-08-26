/**
 * מקור **אחד** לפיקסטורת מסך הסיפור — `/dev/story` · `/dev/story/done` ·
 * `components/StoryScreen.dom.test.tsx`. **סוגר F-133ⓐ.**
 *
 * ⛔ **מה שהיה כאן קודם הוא בדיוק איך ש-F-133 נולדה:** אותה פיקסטורה הועתקה **ביד
 * לשלושה קבצים**, והגוף והשאלה נלקחו מ**שני מקורות שאין ביניהם קשר** — הגוף מ-`STORY`
 * של `docs/design/render_video_A.py`, והשאלה לפי **מספר שורה** ב-jsonl
 * (`story-questions-2026-08-25.jsonl:2`), שהיא שאלתו של סיפור **אחר**, «The letter in
 * the book». התוצאה: מסך הבנה ש⛔ אין ממנו דרך לגזור את התשובה — ו-2,676 בדיקות ירוקות,
 * כי הבדיקה קיבעה בדיוק את הזיווג השגוי.
 *
 * ⚠️ **הנתיב האמיתי מזווג לפי מפתח, ⛔ ולא לפי מספר שורה:**
 * `app/api/world/story/route.ts` שואל `story_questions` ב-`.eq('story_id', …)`.
 * ⇒ הפיקסטורה חייבת להחזיק את אותה תכונה: **גוף ושאלה מאותו סיפור אחד**.
 *
 * ⛔ **ואין כאן מחרוזת שנכתבה כאן.** הגוף **וגם** השאלה הם `STORY` ו-`QUESTION` של
 * `docs/design/render_video_A.py` — אותו רנדר עוגן שממנו נמדדו `kol-A-05-story.png`
 * ו-`kol-A-06-question.png`. `story-fixture.test.ts` קורא את קובץ הפייתון ומשווה
 * מחרוזת מול מחרוזת ⇒ סטייה מהרנדר **מפילה את הבנייה**.
 *
 * ⚠️ **הרנדר הוא מוק פריסה, ⛔ ולא פריט תוכן שעבר שער:** התשובה הנכונה שלו היא גם
 * הארוכה, ולכן `storyQuestionGate` היה פוסל אותה ב-`correct_is_longest`. זה **מכוון**
 * — שלוש התשובות שם נבחרו כדי להעמיד גלישה עברית ארוכה מול קצרה ב-320px, וזה בדיוק מה
 * שפיקסטורת פריסה אמורה למדוד. ⛔ פריט תוכן אמיתי עובר בשער; מוק פריסה ⛔ אינו מתיימר.
 */
export const FIXTURE_STORY_ID = 'aaaaaaaa-0000-4000-8000-000000000001';

export const FIXTURE_TITLE_EN = 'The library near the river';

/** `render_video_A.py` › `STORY`, מילה במילה. */
export const FIXTURE_BODY_EN =
  'Every morning Maya walks to the old library near the river. She likes the quiet ' +
  'rooms and the smell of old paper. One day she found a small book with no title on ' +
  'it. Inside, someone had written one sentence in pencil.';

/** `render_video_A.py` › `GLOSS`. */
export const FIXTURE_GLOSSES = {
  library: { translationHe: 'סִפְרִיָּה', posHe: 'שם עצם', wordId: 'fixture-library' },
  river: { translationHe: 'נָהָר', posHe: 'שם עצם', wordId: 'fixture-river' },
  quiet: { translationHe: 'שָׁקֵט', posHe: 'שם תואר', wordId: 'fixture-quiet' },
  smell: { translationHe: 'רֵיחַ', posHe: 'שם עצם', wordId: 'fixture-smell' },
  found: { translationHe: 'מָצְאָה', posHe: 'פועל', wordId: 'fixture-found' },
  book: { translationHe: 'סֵפֶר', posHe: 'שם עצם', wordId: 'fixture-book' },
  sentence: { translationHe: 'מִשְׁפָּט', posHe: 'שם עצם', wordId: 'fixture-sentence' },
} as const;

/** `render_video_A.py` › `KNOWN`. */
export const FIXTURE_KNOWN_LEMMAS: readonly string[] = ['river', 'book'];

/**
 * `render_video_A.py:999` — שורת הסיכום שהרנדר מצייר, מילה במילה:
 * «5 מילים חדשות · 2 שכבר ידעת». ⚠️ ‏`done/page.tsx` נשא עד F-133 `alreadyKnown: 4`,
 * סטייה שקטה מהרנדר על אותו סיפור בדיוק.
 */
export const FIXTURE_COUNTS = { newWords: 5, alreadyKnown: 2 } as const;

/**
 * `render_video_A.py` › `QUESTION` — **שאלתו של הגוף שמעליה**, ⛔ ולא של סיפור אחר:
 * «one sentence in pencil» נמצא בגוף, מילה במילה.
 */
export const FIXTURE_QUESTION = {
  questionEn: 'What did Maya find inside the book?',
  answersHe: ['מִשְׁפָּט אֶחָד בְּעִפָּרוֹן', 'מַפָּה יְשָׁנָה', 'תְּמוּנָה שֶׁל נָהָר'],
  correctIndex: 0,
} as const;
