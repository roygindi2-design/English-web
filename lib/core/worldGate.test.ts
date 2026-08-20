import { describe, expect, it } from 'vitest';
import { worldGateSentenceHe } from './worldGate';

/**
 * T-125 · D-066 — «כשחסרות מילות תפקוד המשפט אומר זאת מפורשות ⛔ ואינו מציג
 * מספר מטעה».
 *
 * הפגם שנמדד C-0207: הלשונית נעולה על **שני** תנאים, והמשפט סיפר על אחד.
 * במאגר ריק הלומד רואה «12 מילים פעילות» — מספר שלעולם לא יפתח את הלשונית,
 * כי התנאי החוסם ⛔ אינו בשליטתו ו⛔ אינו מוצג.
 */
const T = { minFunctionWords: 100, minActiveWords: 12 };

describe('כשהמאגר עצמו אינו מוכן', () => {
  it('המשפט אומר שהמאגר טרם מוכן ⛔ ואינו מציג יעד שהלומד אינו יכול להזיז', () => {
    const text = worldGateSentenceHe({ functionWords: 0, activeWords: 3 }, T);
    expect(text).toContain('המאגר');
    expect(text).not.toContain('12');
    expect(text).not.toContain('יש לך');
  });

  it('⛔ גם כשהלומד כבר עבר את הסף שלו — התנאי החוסם הוא האחר', () => {
    const text = worldGateSentenceHe({ functionWords: 40, activeWords: 500 }, T);
    expect(text).toContain('המאגר');
    expect(text).not.toContain('500');
  });
});

describe('כשהמאגר מוכן והלומד עדיין לא', () => {
  it('המשפט חוזר להיות המשפט של § 4.2ה, עם הסף ועם הספירה', () => {
    const text = worldGateSentenceHe({ functionWords: 120, activeWords: 5 }, T);
    expect(text).toContain('12');
    expect(text).toContain('יש לך 5');
  });

  it('⛔ הסף מגיע מהארגומנט ⛔ ואינו קשיח בפונקציה', () => {
    const text = worldGateSentenceHe(
      { functionWords: 120, activeWords: 5 },
      { minFunctionWords: 100, minActiveWords: 20 },
    );
    expect(text).toContain('20');
    expect(text).not.toContain('12');
  });
});

describe('כשספירה אינה ידועה', () => {
  it('⛔ `null` אינו `0`: הפסוקית «יש לך» נעדרת, והסף עדיין נאמר', () => {
    const text = worldGateSentenceHe({ functionWords: 120, activeWords: null }, T);
    expect(text).toContain('12');
    expect(text).not.toContain('יש לך');
  });

  it('⛔ מאגר לא ידוע אינו «מאגר לא מוכן» — המשפט אינו טוען עובדה שלא נמדדה', () => {
    const text = worldGateSentenceHe({ functionWords: null, activeWords: null }, T);
    expect(text).not.toContain('המאגר');
    expect(text).toContain('12');
  });
});

/**
 * ⚠️ שלוש הבדיקות הבאות ⛔ אינן בתוכנית. הן נוספו משום שהמעבר של המשפט מ-`TabBar`
 * לכאן **מוציא אותו מתחולת** שומרי המקור ב-`TabBar.test.ts` — הקובץ ההוא מודד
 * מחרוזת בקוד, וכאן אפשר למדוד התנהגות. בלעדיהן הכיסוי שהיה קיים ב-C-0124 (F-039)
 * היה קטן אחרי המשימה מאשר לפניה.
 */
describe('גבולות הסף — הכיסוי שעבר לכאן מ-TabBar', () => {
  it('הסף המדויק עדיין נעול: ספירה השווה לסף אינה «מאגר לא מוכן»', () => {
    // 100 ⩾ 100 ⇒ התנאי החוסם הוא הלומד, ⛔ לא המאגר. `<` ולא `<=`.
    const text = worldGateSentenceHe({ functionWords: 100, activeWords: 5 }, T);
    expect(text).not.toContain('המאגר');
    expect(text).toContain('יש לך 5');
  });

  it('⛔ `0` פעילות אינו `null`: «יש לך 0» נאמר, כי זו עובדה שנמדדה', () => {
    const text = worldGateSentenceHe({ functionWords: 120, activeWords: 0 }, T);
    expect(text).toContain('יש לך 0');
  });

  it('⛔ המשפט אינו נגמר בלי נקודה ואינו ריק בשום ענף', () => {
    for (const counts of [
      { functionWords: 0, activeWords: 0 },
      { functionWords: 120, activeWords: 0 },
      { functionWords: 120, activeWords: null },
      { functionWords: null, activeWords: null },
    ]) {
      const text = worldGateSentenceHe(counts, T);
      expect(text.length).toBeGreaterThan(0);
      expect(text.endsWith('.')).toBe(true);
    }
  });
});
