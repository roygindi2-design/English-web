import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const ROUTES = [
  'app/api/world/bank/route.ts',
  'app/api/world/status/route.ts',
  'app/api/world/recall/route.ts',
] as const;

describe('T-120 — קוד המוצר ⛔ אינו קורא את words.is_function_word', () => {
  it.each(ROUTES)('⛔ %s ⛔ אינו מזכיר את העמודה הפורשת בכלל', (path) => {
    expect(withoutComments(readFileSync(path, 'utf8'))).not.toContain('is_function_word');
  });

  // ⚠️ נמדד C-0224 ⛔ ולא שוער — כאן ההלבנה היא **הפגם**, ⛔ לא הפתרון. האזכור היחיד
  //    ב-`lib/core/flashcard.ts` יושב בתוך בלוק `/** */`, ולכן `withoutComments` מוחק
  //    אותו והבדיקה ירוקה **לפני** שנגעו בקובץ: שער שאינו יכול ליפול (F-088).
  //    הטענה האמיתית של הצעד היא «ההערה חדלה לנקוב בשם העמודה» ⇒ המקור **הגולמי**.
  it('⛔ ההערה ב-lib/core/flashcard.ts ⛔ אינה נוקבת בשם העמודה הפורשת', () => {
    expect(readFileSync('lib/core/flashcard.ts', 'utf8')).not.toContain('is_function_word');
  });

  // ⛔ המשלים לבדיקה שמעליה, ומגבלה ⓒ של התוכנית: `is_function_word` ב-`batchRecord`
  //    הוא **שדה ב-jsonl** מול סוכן התוכן, ⛔ ולא עמודה. סחיפה עיוורת שתמחק גם אותו
  //    שוברת כל אצווה קיימת — ולכן הוא נמדד כאן בכיוון החיובי.
  it('חוזה ה-jsonl ב-lib/core/batchRecord.ts ⛔ נשאר — הוא שדה, ⛔ לא עמודה', () => {
    expect(withoutComments(readFileSync('lib/core/batchRecord.ts', 'utf8'))).toMatch(
      /boolean\(row,\s*'is_function_word'\)/,
    );
  });

  // ⛔ הסרה עיוורת ⛔ אינה מספיקה: מסנן שנמחק לגמרי מחזיר את כל אוצר המילים כמילות
  //    תפקוד. שני הבנקים חייבים לקרוא את המקור **החדש**, וזה נמדד באתר הקריאה.
  it.each(['app/api/world/bank/route.ts', 'app/api/world/status/route.ts'])(
    '%s מסנן על lexical_class = function',
    (path) => {
      expect(withoutComments(readFileSync(path, 'utf8'))).toMatch(
        /\.eq\('lexical_class',\s*'function'\)/,
      );
    },
  );

  it('recall שולף את lexical_class בתוך ה-join ומזהה function בהשוואה מפורשת', () => {
    const code = withoutComments(readFileSync('app/api/world/recall/route.ts', 'utf8'));
    expect(code).toMatch(/words!inner\([^)]*lexical_class[^)]*\)/);
    expect(code).toMatch(/lexical_class\s*===\s*'function'/);
  });
});
