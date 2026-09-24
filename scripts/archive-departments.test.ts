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

  /**
   * 🔴 ⟦T-336 · 14/09⟧ **השלילה, ⛔ ולא סימן פתוח שנמצא שם במקרה.**
   *
   * 🔬 **נמדד C-0589 (PM) חי:** קיצור שורת `arena` לתקרת בדיקה 19 הוריד ממנה את
   * המילה `חסומות`. התא שנשאר — «⛔ אין ⬜. ⛔ אינה חתומה — ⓑⓒ ב-env» — ⛔ אינו
   * נושא ⛔ אף `T-NNN`, ⛔ אף ①-⑨ ו⛔ אף `חסומ` ⇒ `isSealedRow` החזיר **true**,
   * ‏`npm run archive` מחק את המחלקה כולה, ו-`verify` נפל על הבדיקה שמתחתיה.
   * ⇒ ⛔ **ההגנה היחידה הייתה צירוף מקרים ניסוחי.** ‏`ⓑ`/`ⓒ` הן אותיות מוקפות
   * ⛔ ולא ספרות מוקפות, ולכן ⛔ אינן ב-`OPEN_MARKS`.
   *
   * ⚠️ **והבדיקה כאן היא על ה**כלל**, ⛔ ולא על התסמין:** תא ששולל את החתימה
   * במילים ⛔ אינו מאורכב, ⛔ גם כשאין בו ולו סימן פתוח אחד.
   */
  it.each([
    '⛔ אין ⬜. ⛔ אינה חתומה — ⓑⓒ ב-env',
    '⛔ אין ⬜. אינה חתומה',
    '⛔ אין ⬜. לא חתומה',
    '⛔ אין ⬜. איננה חתומה',
    '⛔ אין ⬜. טרם חתומה',
    '⛔ אין ⬜. אינה ⛔ חתומה',
  ])('🔴 שלילה מפורשת ⇒ ⛔ אינה מאורכבת, ⛔ גם בלי סימן פתוח: %s', (cell) => {
    expect(isSealedRow(cell)).toBe(false);
  });

  // ⛔ והכיוון ההפוך, כדי שהתיקון ⛔ לא יהפוך את המארכב לחסר-שיניים.
  it('חתימה חיובית ⛔ בלי שלילה ו⛔ בלי סימן פתוח ⇒ עדיין מאורכבת', () => {
    expect(isSealedRow('⛔ אין ⬜. חתומה — נמסרה במלואה')).toBe(true);
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

/**
 * `F-326` — **one ceiling, ⛔ not two.** `archive-departments.mjs` printed «מתוך 4096»
 * while check 19 enforced 8192 (raised 15/09) ⇒ an agent reading `npm run archive`
 * concluded the file had crossed a ceiling that no longer existed.
 */
describe('F-326 — the departments ceiling is shared with check 19', () => {
  it('archive-departments and loop-health read the same constant', async () => {
    const { DEPARTMENTS_CEILING } = await import('./archive-departments.mjs');
    expect(DEPARTMENTS_CEILING).toBe(8192);
    const health = readFileSync('scripts/loop-health.mjs', 'utf8');
    expect(health).toMatch(/import \{[^}]*DEPARTMENTS_CEILING[^}]*\} from '\.\/archive-departments\.mjs'/);
    expect(health).not.toMatch(/const CEILING = 8192/);
  });

  it('⛔ no literal ceiling is left in the archive script', () => {
    const src = readFileSync('scripts/archive-departments.mjs', 'utf8');
    expect(src).not.toMatch(/מתוך 4096/);
  });
});
