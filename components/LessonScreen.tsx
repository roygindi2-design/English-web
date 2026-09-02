'use client';

/**
 * ‏T-089 · § 4.2ט — אנטומיית מסך השיעור. ⛔ מבנה בלבד, ⛔ אפס תוכן לימודי.
 *
 * ארבעה בלוקים, בסדר ש-§ 4.2ט קובעת: ⓐ כותרת סוג השאלה ⓑ הסבר בעברית
 * ⓒ 1–3 פריטי תרגול ⓓ מסך הסיום.
 *
 * ⛔ אין בקובץ הזה ולו תו עברי אחד, וזו הדרישה ⛔ ולא סגנון: שורת T-089 קובעת
 * שהפריטים מגיעים כפרופ מטבלאות התוכן ו⛔ אינם מוקשחים בקוד. כותרת עברית אחת
 * שנשתלת כאן היא בדיוק תוכן לימודי בקוד, וזו ההפרה שמדור 2 קיים כדי למנוע.
 * הבדיקה שלצד הקובץ אוכפת «אפס תו עברי», כי זה הניסוח היחיד שמכונה יכולה למדוד.
 *
 * ⛔ הרכיב חסר מצב לגמרי: `phase` הוא פרופ ⛔ ולא `useState`. מה שמקדם את
 * הלומד מ-ⓒ ל-ⓓ — סימון תשובה, «הבא», ניקוד — ⛔ אינו בשום מקום ב-§ 4.2ט,
 * והמצאתו כאן הייתה החלטת מסך שאינה בסמכות Dev. נרשם כ-F-099.
 *
 * ⚠️ `'use client'` מ-T-143: § 4.2יד נותנת למסך **בחירה** — «האפשרות היא יעד מגע
 * ≥44px, ואחרי הבחירה מוצג הסבר קצר». ⛔ זו ⛔ אינה החלטת מסך של Dev, היא שורת
 * מפרט חתומה (D-078). ⛔ **ומה ש⛔ לא השתנה:** `phase` נשאר **פרופ** ⛔ ולא
 * `useState` — מה שמקדם את הלומד מ-ⓒ ל-ⓓ עדיין אינו במפרט, ו-F-099 נשאר פתוח.
 * המצב היחיד ברכיב הוא `selection`, וההכרעות עליו חיות ב-`lib/core/lesson.ts`.
 */
import { useState } from 'react';
import Link from 'next/link';
import EnWord, { EnText, type EnTextSegment } from '@/components/EnWord';
import {
  EMPTY_LESSON_SELECTION,
  chooseInLesson,
  selectedChoiceId,
  whyForChoice,
  type LessonSelection,
} from '@/lib/core/lesson';

export interface LessonChoice {
  readonly id: string;
  /** האפשרות עצמה — אנגלית, ולכן היא עוברת דרך <EnWord>. */
  readonly text: string;
  /**
   * המשפט העברי «למה המסיח הזה מפתה». § 4.2ט שאלה 3: «טעות מציגה **למה**
   * המסיח מפתה — זה כל השיעור». ⚠️ עודכן ב-T-143 (§ 4.2יד): נחשף **רק** אחרי
   * שהאפשרות שלו נבחרה — `whyForChoice` ב-`lib/core/lesson.ts` היא ההכרעה.
   */
  readonly why: string;
}

export interface LessonItem {
  readonly id: string;
  /**
   * משפט התרגול, מקוטע. התקדים הוא `exampleSegments` של `buildCard`: מי שמפצל
   * לפי רווחים במקום לפי היסטים מרנדר מילים דבוקות על מסך הלומד (TD-11).
   */
  readonly prompt: readonly EnTextSegment[];
  readonly choices: readonly LessonChoice[];
}

export type LessonPhase = 'items' | 'done';

export interface LessonScreenProps {
  readonly questionTypeTitle: string;
  readonly explanation: string;
  readonly items: readonly LessonItem[];
  readonly phase: LessonPhase;
  readonly doneTitle: string;
  readonly doneExitLabel: string;
}

/** § 4.2ט: «1–3 פריטי תרגול». מכסה, ⛔ לא הצעה. */
export const LESSON_MAX_ITEMS = 3;

/** § 4.2ט שאלה 6: «מגיעים מלשונית לימודים, יוצאים במסך הסיום». */
export const LESSON_EXIT_HREF = '/studies';

export default function LessonScreen({
  questionTypeTitle,
  explanation,
  items,
  phase,
  doneTitle,
  doneExitLabel,
}: LessonScreenProps): React.JSX.Element {
  const [selection, setSelection] = useState<LessonSelection>(EMPTY_LESSON_SELECTION);
  return (
    <section className="flex flex-col gap-6">
      {/* ⓐ — הכותרת היחידה של המסך. שתי h1 על מסך אחד שוברות את היררכיית
          הכותרות לקורא מסך. */}
      <h1 data-lesson-type className="text-3xl font-bold leading-tight">
        {questionTypeTitle}
      </h1>

      {phase === 'items' ? (
        <>
          {/* ⓑ — ההסבר. `leading-relaxed` ⛔ ולא גופן גדול יותר: החוקה קפואה
              על סולם הטיפוגרפיה, וריפוד הוא הערוץ שנשאר. */}
          <p data-lesson-explanation className="text-lg leading-relaxed text-ink">
            {explanation}
          </p>

          {/* ⓒ — 1–3 פריטים. החיתוך על הקבוע ⛔ ולא על ליטרל. */}
          <ul data-lesson-items className="flex list-none flex-col gap-6 p-0">
            {items.slice(0, LESSON_MAX_ITEMS).map((item) => {
              const why = whyForChoice(item.choices, selectedChoiceId(selection, item.id));
              return (
                <li key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border-subtle p-4">
                  <EnText segments={item.prompt} className="text-lg leading-relaxed" />
                  <div className="flex flex-col gap-2">
                    {item.choices.map((choice) => (
                      <button
                        key={choice.id}
                        type="button"
                        data-lesson-choice
                        onClick={() => setSelection((current) => chooseInLesson(current, item.id, choice.id))}
                        className="flex min-h-touch w-full items-center rounded-lg border border-border-subtle px-4 py-3 text-start active:opacity-90"
                      >
                        <EnWord className="text-lg">{choice.text}</EnWord>
                      </button>
                    ))}
                  </div>
                  {why !== null ? (
                    <p data-lesson-why className="text-base leading-relaxed text-ink-muted">
                      {why}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}

      {phase === 'done' ? (
        // ⓓ — מסך הסיום, כבלוק ⛔ ולא כמסלול שני. היציאה היא קישור אחד,
        // ⛔ בלי `data-primary-action`: המסלול ⛔ אינו ב-PRIMARY_ACTION_ROUTES,
        // וסימון שאיש אינו מודד הוא סימון שיסחף (התקדים: <AppGrid>, C-0200).
        <div data-lesson-done className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold leading-tight">{doneTitle}</h2>
          <Link
            href={LESSON_EXIT_HREF}
            className="flex min-h-touch items-center justify-center rounded-lg border border-border-strong px-5 py-3 text-lg font-semibold text-ink active:opacity-90"
          >
            {doneExitLabel}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
