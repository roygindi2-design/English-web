/**
 * ‏T-143 · § 4.2יד — מצב הבחירה של מסך השיעור, כפונקציה טהורה.
 *
 * ⛔ אפס React · DOM · שעון · אקראיות · רשת. ⛔ ואפס תו עברי בתוצאה: כל מחרוזת
 * שנחשפת ללומד מגיעה מ-`why` שהגיע כפרופ, ⛔ ואינה נכתבת כאן (T-089 · R-018).
 *
 * ⛔ **אין כאן `isCorrect` ואין להוסיף:** T-143ⓒ אוסר תווית ערך «נכון/לא נכון»,
 * והמנגנון היחיד הוא «מה שנבחר מסביר את עצמו» (D-050).
 */

export interface LessonChoiceFacts {
  readonly id: string;
  readonly why: string;
}

/** ‏itemId → choiceId. ⛔ מפה ⛔ ולא מזהה יחיד: § 4.2ט נותנת 1–3 פריטים במסך אחד. */
export type LessonSelection = Readonly<Record<string, string>>;

export const EMPTY_LESSON_SELECTION: LessonSelection = Object.freeze({});

/** ⛔ מחזיר אובייקט חדש — הקורא הוא `useState`, ומוטציה שם ⛔ אינה מרנדרת מחדש. */
export function chooseInLesson(
  selection: LessonSelection,
  itemId: string,
  choiceId: string,
): LessonSelection {
  return { ...selection, [itemId]: choiceId };
}

export function selectedChoiceId(selection: LessonSelection, itemId: string): string | null {
  return selection[itemId] ?? null;
}

/** ⛔ `null` ⛔ ולא מחרוזת ריקה: «טרם בחר» ו«בחר ואין הסבר» ⛔ אינם אותו מצב. */
export function whyForChoice(
  choices: readonly LessonChoiceFacts[],
  choiceId: string | null,
): string | null {
  if (choiceId === null) return null;
  return choices.find((choice) => choice.id === choiceId)?.why ?? null;
}
