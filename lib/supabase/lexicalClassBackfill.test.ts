import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutSqlComments } from '@/lib/testSource';

/** F-039 · F-065 · F-087 — הלבנת הערות לפני כל טענה על המקור. אותו עיקרון בדיוק
 *  כמו `withoutComments` ב-`lib/testSource.ts`, בגרסת SQL:
 *  הערת הכותרת של 0016 מסבירה למה המילוי ⛔ אינו `case when … else 'content'`,
 *  ולכן היא מכילה את המחרוזת `'content'` בעצמה. בלי ההלבנה `SQL.split(';')`
 *  מחזיר את בלוק ההערה כ"פקודה" הראשונה שמכילה `'content'`, והבדיקה מודדת
 *  תיעוד במקום SQL. ⛔ הפתרון הוא ההלבנה ⛔ ולא מחיקת ההערה.
 *  T-341: המפשיט עצמו חי ב-`lib/testSource.ts` — ⛔ לא עותק מקומי. */

const SQL = withoutSqlComments(
  readFileSync('supabase/migrations/0016_lexical_class_backfill.sql', 'utf8'),
);

describe('0016 — מילוי lexical_class מהעמודה הפורשת (T-120ⓐ · F-086)', () => {
  it('הטענה החיובית מועברת: is_function_word = true ⇒ function', () => {
    expect(SQL).toMatch(/set\s+lexical_class\s*=\s*'function'/);
    expect(SQL).toMatch(/where[\s\S]*is_function_word\b/);
  });

  it("⛔ false ⛔ אינו הופך ל-content בלי origin = 'generated' — ברירת מחדל אינה טענה", () => {
    const contentStmt = SQL.split(';').find((s) => /'content'/.test(s)) ?? '';
    expect(contentStmt).not.toBe('');
    expect(contentStmt).toMatch(/origin\s*=\s*'generated'/);
    expect(contentStmt).toMatch(/is_function_word\s+is\s+false|not\s+is_function_word/);
  });

  it('אידמפוטנטית — שתי הפקודות נוגעות רק בשורות שעדיין NULL', () => {
    const updates = SQL.split(';').filter((s) => /update\s+public\.words/.test(s));
    expect(updates).toHaveLength(2);
    for (const u of updates) expect(u).toMatch(/lexical_class\s+is\s+null/);
  });

  it('⛔ אינה מוחקת דבר — המחיקה היא 0017 בלבד', () => {
    expect(SQL).not.toMatch(/drop\s+column/i);
    expect(SQL).not.toMatch(/drop\s+constraint/i);
  });

  it('⛔ אינה יוצרת את העמודה מחדש — 0006 הוא הבעלים', () => {
    expect(SQL).not.toMatch(/add\s+column/i);
  });

  it('טרנזקציה אחת', () => {
    expect(SQL).toMatch(/^\s*begin;/im);
    expect(SQL).toMatch(/commit;\s*$/im);
  });
});
