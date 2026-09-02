import { describe, expect, it } from 'vitest';
import {
  EMPTY_LESSON_SELECTION,
  chooseInLesson,
  selectedChoiceId,
  whyForChoice,
  type LessonChoiceFacts,
} from './lesson';

const CHOICES: readonly LessonChoiceFacts[] = [
  { id: 'a', why: 'הסבר א׳' },
  { id: 'b', why: 'הסבר ב׳' },
  { id: 'c', why: 'הסבר ג׳' },
];

describe('lesson selection — T-143 · § 4.2יד', () => {
  it('⛔ אין בחירה בהתחלה, ולכן ⛔ אין הסבר', () => {
    expect(selectedChoiceId(EMPTY_LESSON_SELECTION, 'item-1')).toBeNull();
    expect(whyForChoice(CHOICES, null)).toBeNull();
  });

  it('בחירה נרשמת לפריט שלה בלבד', () => {
    const s = chooseInLesson(EMPTY_LESSON_SELECTION, 'item-1', 'b');
    expect(selectedChoiceId(s, 'item-1')).toBe('b');
    expect(selectedChoiceId(s, 'item-2')).toBeNull();
  });

  it('⛔ אינו משנה את האובייקט שקיבל — המצב הקודם שורד', () => {
    const before = chooseInLesson(EMPTY_LESSON_SELECTION, 'item-1', 'b');
    const after = chooseInLesson(before, 'item-2', 'c');
    expect(before).toEqual({ 'item-1': 'b' });
    expect(after).toEqual({ 'item-1': 'b', 'item-2': 'c' });
    expect(after).not.toBe(before);
  });

  it('הקשה על אפשרות אחרת באותו פריט מחליפה — ⛔ ואינה מוסיפה שנייה', () => {
    const s = chooseInLesson(chooseInLesson(EMPTY_LESSON_SELECTION, 'item-1', 'b'), 'item-1', 'c');
    expect(s).toEqual({ 'item-1': 'c' });
  });

  it('ההסבר שנחשף הוא של האפשרות שנבחרה, ⛔ ולא הראשון ברשימה', () => {
    expect(whyForChoice(CHOICES, 'c')).toBe('הסבר ג׳');
    expect(whyForChoice(CHOICES, 'a')).toBe('הסבר א׳');
  });

  it('מזהה שאינו ברשימה מחזיר null — ⛔ ולא זורק ו⛔ לא מחרוזת ריקה', () => {
    expect(whyForChoice(CHOICES, 'zzz')).toBeNull();
  });
});
