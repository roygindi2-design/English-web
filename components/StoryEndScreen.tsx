'use client';

import Link from 'next/link';
import { useCallback } from 'react';
import EnWord from '@/components/EnWord';
import { shuffleAnswers, type StoryQuestion } from '@/lib/core/storyQuestion';

/**
 * **כרטיס הגוף במצב `question` של מסך הסיפור** — T-188 · **T-202** · `36 § 7` · D-108א · D-115.
 *
 * ⛔ **⛔ אינו מסך, ו⛔ לא היה צריך להיות (T-202 · F-124).** ‏`render_video_A.py:964` הוא
 * פונקציה **אחת** עם דגל `question=`: הכרום מצויר פעם אחת **מחוץ להחלפה**, ורק כרטיס
 * הגוף מתחלף. ⇒ הרכיב הזה מחזיר **שברי כרטיס**, ⛔ ולא מכולה בגובה מסך עם סמנטיקה של
 * מסך, ⛔ ולא פעולה ראשית משלו: שורת המצב, שורת הסיכום, המקרא והפעולה הראשית שייכים
 * ל-`components/StoryScreen.tsx` ו**שורדים את ההחלפה**.
 * ⛔ **המחרוזות שנפסלו כאן ⛔ אינן מצוטטות בקובץ** — הסריקות ב-
 * `components/StoryScreen.test.ts` קוראות את המקור, והערה שמצטטת אותן מפילה את השמירה.
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
 * 🆕 **T-379 ⓓ — הפעולה המשנית היא משנית, וזה נמדד ⛔ ולא נטען.** היא ישבה ברוחב
 * מלא באותו גובה כמו הפעולה הראשית ⇒ המדרג היחיד שהפריד ביניהן היה **המילוי**. ⇒
 * היא ⛔ כבר אינה נמתחת, וטקסטה וריפודה קטנים ⇒ ההבדל הוא גודל וצורה. ⛔ **הקיום
 * ⛔ לא נגע** (`36 § 7` נוקב ביציאה), ו⛔ גם ⛔ לא 44px.
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
/**
 * 🔙 **T-381ⓐ — התווית נוקבת ביעד, ⛔ ולא בפעולה על התשובה.** «נסה שוב» היה הופך
 * את החזרה לניסיון שני, ו-`§ 4.2יג` סעיף 3 אוסר עונש ⇒ גם את ההיפוך שלו.
 */
const BACK_TO_STORY_HE = 'חזרה לסיפור';
const CARDS_HREF = '/cards';
/**
 * ⚠️ **`px-2.5` ⛔ אינו טעם — הוא המספר שמחזיק את שתי הפעולות בשורה אחת ב-320px.**
 * 🔬 **נמדד חי (‏`next start`, 320×780) ⛔ ולא שוער:** הרוחב הפנוי בעמודה הוא **272px**,
 * ושתי הפעולות ב-`px-4` הן `110 + 169` ועוד `gap-3` ⇒ **291** ⇒ הן נשברות לשתי שורות,
 * והיציאה «חזרה לעולם» נדדה ל-`top = 750` מול תקרת `D-228`ⓐ (‏≤736). ‏`px-2.5` ו-`gap-2`
 * מורידים אותן ל-263 ⇒ שורה אחת, והיציאה חוזרת ל-694.
 * ⛔ **ו-`min-h-touch` ⛔ לא זז** — הריפוד שהצטמצם הוא **אופקי**, ורוחב שני הפקדים
 * (98 · 157) רחוק מעל 44. ⚠️ `flex-wrap` נשאר כרשת ביטחון: אם מתישהו ⛔ לא ייכנסו,
 * הן יישברו ⇒ ⛔ אפס גלילה אופקית, וזה שער קפוא.
 */
const SECONDARY_HE_CLASS =
  'inline-flex min-h-touch items-center rounded-lg border border-border-strong px-2.5 py-2 text-sm text-ink-muted active:opacity-90';

export interface StoryEndScreenProps {
  readonly storyId: string;
  readonly question: StoryQuestion;
  /** כמה מילים בסיפור היו בתור החזרה של הלומד. ⛔ אפס ⇒ ⛔ אין שורה כלל. */
  readonly reviewedCount: number;
  /**
   * 🔙 **T-381ⓐ — הבחירה **נשלטת מבחוץ**, ⛔ ואינה state של הכרטיס הזה.** הכרטיס
   * מורכב ⛔ רק בפאזת השאלה ⇒ state מקומי היה מתאפס בכל חזרה לגוף הסיפור, והמסך
   * היה מציע שלוש תשובות פנויות ללומד שכבר ענה. `null` = עוד לא בחר.
   */
  readonly chosen: number | null;
  readonly onChoose: (index: number) => void;
  /** 🔙 T-381ⓐ — חזרה לגוף הסיפור. ⛔ אינה מאפסת דבר ו⛔ אינה נספרת. */
  readonly onBackToReading: () => void;
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
  chosen,
  onChoose,
  onBackToReading,
}: StoryEndScreenProps): React.JSX.Element {
  const shuffled = shuffleAnswers(question, storyId);
  const revealed = chosen !== null;

  const choose = useCallback(
    (index: number) => {
      // ⛔ הלומד בוחר פעם אחת, והמשוב מיידי. ⛔ אין כאן ציון, ⛔ אין מונה ו⛔ אין כתיבה
      // לשרת — § 4.2יג סעיף 3: «⛔ אין טעות בקריאה, ולכן ⛔ אין עונש».
      // 🔙 **T-381ⓒ — והנעילה היא מה שהופך את החזרה לקריאה חוזרת ⛔ ולא לניסיון שני.**
      // ⛔ היא ⛔ אינה נשענת על `disabled` לבדה: `disabled` הוא מה שהלומד רואה, וזה
      // מה שקורה כשבכל זאת נקראנו.
      if (chosen === null) onChoose(index);
    },
    [chosen, onChoose],
  );

  return (
    <>
      {/* 🎯 רדיוס 22 ברנדר → `rounded-2xl`, על `RAISED` עם מסגרת `BORDER_SUB` — בדיוק
          אותו כרטיס שפסקת הקריאה יושבת בו, כי ברנדר זה **אותו כרטיס**. */}
      {/* ⚠️ `data-story-question` — `T-318`ⓐ. הוא ⛔ אינו סלקטור של בדיקה: הוא הדרך
          היחידה שבה **המכולה** (‏`StoryScreenView`, שאינה יודעת על הפאזה) מזהה שהמסך
          עבר למצב השאלה ומהדקת את הקצב האנכי. ⛔ אין כאן הרמת state ו⛔ אין prop חדש —
          `has-[[data-story-question]]` הוא CSS, ולכן הוא ⛔ אינו יכול להתפצל מהמציאות. */}
      <div
        data-story-question
        className="rounded-2xl border border-border-subtle bg-surface-raised px-5 py-6"
      >
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

      {/* 🔴 **T-379 ⓓ — המדרג ⛔ כבר אינו נשען על צבע בלבד.**
          🔬 **נמדד חי על `/dev/story/done`:** «לתרגל אותן בכרטיסיות» ו«חזרה לעולם»
          היו **שתי פעולות ברוחב מלא באותו גובה** — הראשונה מתאר והשנייה מלאה ⇒ מה
          שמבדיל ביניהן הוא המילוי, כלומר **צבע**. ברנדר יש באזור הזה פעולה ראשית
          **אחת** (`render_video_A.py`: כפתור אחד ב-`ST_Y + ST_H + 50`).
          ⛔ **והיציאה ⛔ אינה נמחקת** — `36 § 7` נוקב בה מילה במילה ⇒ שונה
          **המשקל**, ⛔ ולא הקיום: היא ⛔ כבר אינה נמתחת לרוחב המלא (‏`self-start`
          מבטל את `align-items: stretch` של העמודה), הטקסט יורד מ-`text-lg` ל-`text-sm`
          והריפוד מתהדק ⇒ ההבדל הוא **גודל וצורה**, ⛔ ולא גוון.
          ⚠️ **ו-44px ⛔ אינם זזים** — `min-h-touch` נשאר, וזה שער קפוא. */}
      {/* 🔙 **T-381ⓐ — שתי הפעולות המשניות חולקות **שורה אחת**, ו⛔ זה ⛔ אינו קיצור:**
          🔬 `scripts/verify-mobile.mjs` מודד ש-«חזרה לעולם» נצבעת בתוך המסך הראשון
          (`D-228`ⓐ: ‏`top ≤ 736` בחלון 780), ⇒ כל בלוק חדש **מתחת** לכרטיס השאלה דוחף
          את היציאה החוצה. ⇒ החזרה יושבת לצד «לתרגל אותן», ⛔ ולא מתחתיה: אותו מדרג
          בדיוק (שתיהן משניות לפי `T-379` ⓓ — גודל וצורה, ⛔ לא גוון), ו⛔ אפס פיקסלים
          אנכיים נוספים. ⚠️ `flex-wrap` כי ב-320px שתי התוויות ⛔ אינן נכנסות לשורה,
          ו⛔ אין גלילה אופקית. ⚠️ ו-`min-h-touch` על שתיהן — שער קפוא. */}
      <div data-story-secondary className="flex flex-wrap items-center gap-2 self-start">
        <button type="button" onClick={onBackToReading} className={SECONDARY_HE_CLASS}>
          {BACK_TO_STORY_HE}
        </button>
        {reviewedCount > 0 ? (
          <Link href={CARDS_HREF} className={SECONDARY_HE_CLASS}>
            {PRACTICE_HE}
          </Link>
        ) : null}
      </div>

      {/* ⛔ **הפעולה הראשית ⛔ אינה כאן (T-202ⓑ · T-203).** התווית שהייתה כאן הבטיחה מעבר
          לפריט הבא ברצף, ו-`pickStory` בוחר על אינדקס-יום ⇒ אין רצף כזה (T-151ⓓ). הפעולה
          הראשית שייכת ל-`StoryScreen`, נמצאת **מחוץ להחלפה**, ומצוירת ברנדר פעם אחת. */}
    </>
  );
}
