'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import EnWord from '@/components/EnWord';
import { shuffleAnswers, type StoryQuestion } from '@/lib/core/storyQuestion';

/**
 * מסך הסיום של הסיפור — T-188 · `36 § 7` · D-108א.
 *
 * 🎯 **הרנדר: `docs/design/kol-A-06-question.png`**, וערכיו נלקחו מ-`story_question`
 * ב-`docs/design/render_video_A.py` (שורות 945–963), ⛔ ולא מהעין: התווית «שאלת הבנה»
 * ממורכזת ב-`BRAND_SURFACE` · השאלה **באנגלית** ממורכזת ב-`INK` · שלוש שורות תשובה
 * ברוחב `ST_W - 32`, גובה 50, מרווח 62, רדיוס 14 → `rounded-xl`, עברית עם עוגן ימני ·
 * בחשיפה: נכונה = `SUCCESS` במילוי 46 אלפא **ואייקון וי**, נבחרה-ושגויה = `DANGER`.
 *
 * ⛔ **אפס ציון ו⛔ אפס מונה נכונות** (`36 § 7`). משוב בלבד, והוא ⛔ אינו נשמר בשרת.
 *
 * ⛔ **המשוב ⛔ אינו צבע בלבד** (חוקה שכבה A): כל שורה שנחשפת נושאת **אייקון SVG
 * ותווית עברית כתובה**. ⛔ אמוג'י אסור.
 *
 * ⚠️ **«עברת על N מילים», ⛔ ולעולם לא «אתה יודע אותן»** — `§ 4.2יג-ב ⓒ`, ⛔ לא בוטל:
 * הלומד אולי דילג, ו⛔ אין לנו דרך לדעת. טענה חזקה מזה היא המצאה.
 *
 * ⚠️ **שורות התשובה הן שורות רשימה, ⛔ ולא יעדי הקשה בתוך פסקת קריאה** ⇒ ההחרגה של
 * `36 § 3` ⛔ **אינה** מגיעה אליהן, והן חייבות 44px מלאים.
 *
 * ⛔ **סדר התשובות מגיע מ-`lib/core/storyQuestion.ts`** — דטרמיניסטי לפי מזהה הסיפור,
 * ⛔ ולא מסדר הכתיבה ו⛔ לא אקראי.
 */

const QUESTION_LABEL_HE = 'שאלת הבנה';
const CORRECT_HE = 'נכונה';
const WRONG_HE = 'לא זו';
const PRACTICE_HE = 'לתרגל אותן בכרטיסיות';
const NEXT_STORY_HE = 'הסיפור הבא';
const CARDS_HREF = '/cards';

export interface StoryEndScreenProps {
  readonly storyId: string;
  readonly question: StoryQuestion;
  /** כמה מילים בסיפור היו בתור החזרה של הלומד. ⛔ אפס ⇒ ⛔ אין שורה כלל. */
  readonly reviewedCount: number;
  readonly onNextStory?: () => void;
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

const ANSWER_BASE =
  'flex min-h-touch w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-right text-base active:opacity-90';

export default function StoryEndScreen({
  storyId,
  question,
  reviewedCount,
  onNextStory,
}: StoryEndScreenProps): React.JSX.Element {
  const shuffled = shuffleAnswers(question, storyId);
  const [chosen, setChosen] = useState<number | null>(null);
  const revealed = chosen !== null;

  const choose = useCallback((index: number) => {
    // ⛔ הלומד בוחר פעם אחת, והמשוב מיידי. ⛔ אין כאן ציון, ⛔ אין מונה ו⛔ אין כתיבה
    // לשרת — § 4.2יג סעיף 3: «⛔ אין טעות בקריאה, ולכן ⛔ אין עונש».
    setChosen((prev) => (prev === null ? index : prev));
  }, []);

  return (
    <section dir="rtl" className="flex min-h-[100dvh] flex-col gap-5 pb-8">
      <div className="rounded-2xl border border-border-subtle bg-surface-raised px-5 py-6">
        <p className="text-center text-sm font-semibold text-brand-surface">{QUESTION_LABEL_HE}</p>

        {/* השאלה באנגלית — זה ההפך המדויק מפגם הארקייד (D-087): שם השאלה הייתה עברית
            והמסיחים אנגלית, ולכן הלומד התאים א״ב. כאן הוא חייב **להבין את השאלה
            באנגלית ולקרוא את הסיפור** כדי לענות. */}
        <p className="mt-4 text-center text-base font-semibold text-ink">
          <EnWord>{shuffled.questionEn}</EnWord>
        </p>

        <ul className="mt-5 flex flex-col gap-3">
          {shuffled.answersHe.map((answer, i) => {
            const isCorrect = i === shuffled.correctIndex;
            const isChosen = i === chosen;
            const showCorrect = revealed && isCorrect;
            const showWrong = revealed && isChosen && !isCorrect;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => choose(i)}
                  disabled={revealed}
                  aria-pressed={isChosen}
                  className={[
                    ANSWER_BASE,
                    showCorrect
                      ? 'border-success bg-success/20 text-success'
                      : showWrong
                        ? 'border-danger bg-danger/20 text-danger'
                        : 'border-border-subtle text-ink',
                  ].join(' ')}
                >
                  {/* ⛔ המצב ⛔ אינו בצבע בלבד: אייקון **ותווית כתובה**, שניהם. */}
                  <span className="flex items-center gap-2 text-sm font-bold">
                    {showCorrect ? (
                      <>
                        <CheckIcon />
                        {CORRECT_HE}
                      </>
                    ) : showWrong ? (
                      <>
                        <CrossIcon />
                        {WRONG_HE}
                      </>
                    ) : null}
                  </span>
                  <span>{answer}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ⛔ K=0 ⇒ ⛔ אין שורה כלל, ⛔ ולא «לא היו מילים» — משפט שאין בו מה לומר
          ⛔ אינו משפט (§ 4.2יג-ב ⓒ · T-151ⓔ). */}
      {reviewedCount > 0 ? (
        <p className="text-base text-ink-muted">
          {`בסיפור הזה עברת על ${reviewedCount} מילים שהיו בתור החזרה שלך`}
        </p>
      ) : null}

      {reviewedCount > 0 ? (
        <Link
          href={CARDS_HREF}
          className="inline-flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90"
        >
          {PRACTICE_HE}
        </Link>
      ) : null}

      <button
        type="button"
        onClick={onNextStory}
        className="inline-flex min-h-touch w-full items-center justify-center rounded-2xl bg-brand-surface px-5 py-4 text-lg font-bold text-brand-on active:opacity-90"
      >
        {NEXT_STORY_HE}
      </button>
    </section>
  );
}
