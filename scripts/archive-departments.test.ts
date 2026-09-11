import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isSealedRow, goalsCellOf, splitDepartments } from './archive-departments.mjs';

/**
 * ⟦NEW 11/09⟧ ⛔ **הסכנה היחידה במארכב הזה היא חיובי-שגוי** — מחלקה **חיה** שנמחקת
 * מהקובץ שהיא הערוץ היחיד שלה אל DEV. ⇒ הבדיקה נכתבת מהכיוון הזה: ⛔ לא «האם הוא
 * מארכב», אלא **«על מה הוא ⛔ נוגע»**.
 *
 * 🔬 שלוש השורות הקריטיות נלקחות **מהקובץ החי**, ⛔ לא מומצאות.
 */
describe('11/09 — ארכוב מחלקות סגורות ⛔ אינו נוגע במחלקה חיה', () => {
  const live = readFileSync('plan/05-departments.md', 'utf8');

  it('מחלקה חתומה ⛔ בלי יעד פתוח ⇒ מאורכבת', () => {
    expect(isSealedRow('⛔ אין. חתומה')).toBe(true);
  });

  // 🔴 ⛔ נמדד 11/09: שלוש המחלקות האלה נושאות «⛔ אין ⬜» — וכלל שמסתמך על זה
  // היה מוחק שלושה **חסמים חיים** (‏`env` · `T-246`) מהקובץ שבו DEV קורא אותם.
  it.each([
    ['⛔ אין ⬜. ⛔ אינה חתומה — ⓑⓒ חסומות ב-env', 'cards/arena'],
    ['⛔ אין ⬜. `T-247` חסומה ב-`T-246` עד מיזוג', 'studies'],
    ['① פופאובר מעוגן (`T-290`). חתומה בעבר', 'חתומה + יעד פתוח'],
  ])('⛔ אינה מאורכבת: %s', (cell) => {
    expect(isSealedRow(cell)).toBe(false);
  });

  it('התא הנקרא הוא האחרון, ⛔ ולא אינדקס קבוע', () => {
    expect(goalsCellOf('| `nav` | טבעת | ⛔ אין. חתומה |')).toBe('⛔ אין. חתומה');
  });

  // ⛔ הטענה שמגנה על דרישת רוי: «אל תפתור את זה בדרך שמונעת פתיחת מחלקה חדשה».
  it('מחלקה חדשה עם יעדים ⛔ אינה נוגעת, והקובץ ⛔ לא מאבד אותה', () => {
    const withNew = `${live}\n| \`newdept\` | משהו חדש | ① יעד ראשון (\`T-999\`) |`;
    const { keep, archived } = splitDepartments(withNew);
    expect(keep, 'המחלקה החדשה נשארת בקובץ החי').toContain('`newdept`');
    expect(archived.join('\n'), '⛔ ואינה מאורכבת').not.toContain('newdept');
  });

  it('אידמפוטנטי — ריצה שנייה על הפלט ⛔ אינה מוציאה דבר', () => {
    const first = splitDepartments(live);
    const second = splitDepartments(first.keep);
    expect(second.archived).toHaveLength(0);
  });

  it('כל מחלקה שנשארת חיה עדיין בקובץ אחרי ארכוב', () => {
    const { keep } = splitDepartments(live);
    for (const d of ['story', 'cards', 'arena', 'studies', 'msgs', 'amirnet']) {
      expect(keep, `${d} ⛔ נמחקה`).toContain(`\`${d}\``);
    }
  });
});
