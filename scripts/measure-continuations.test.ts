import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const DATA = join('data', 'generated');
const run = (dir?: string): string =>
  execFileSync('node', ['scripts/measure-continuations.mjs'], {
    encoding: 'utf8',
    env: dir === undefined ? process.env : { ...process.env, CONTINUATIONS_DATA: dir },
  });

/** ⛔ נמדד מהקבצים, ⛔ לא מוצהר מחדש: תקתוק CONTENT רק מוסיף שורות. */
const SOURCE_FILES = readdirSync(DATA).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort();
const SOURCE_ROWS = SOURCE_FILES.reduce(
  (n, f) =>
    n +
    readFileSync(join(DATA, f), 'utf8')
      .split('\n')
      .filter((l) => l.trim() !== '' && !l.trim().startsWith('#')).length,
  0,
);

describe('scripts/measure-continuations.mjs', () => {
  const out = run();
  /** אחוזי הצמצום לפי סדר המודל, כפי שהדוח מדפיס אותם. */
  const reductions = (): number[] =>
    [...out.matchAll(/צמצום: המנוע פוסל ([\d.]+)% מהבלוקים/g)].map((m) => Number(m[1]));

  it('קורא כל שורה בכל אצווה — ⛔ אינו מדלג על קובץ', () => {
    expect(SOURCE_FILES.length).toBeGreaterThanOrEqual(13);
    expect(out).toContain(`${SOURCE_FILES.length} קבצי אצווה · ${SOURCE_ROWS} שורות משמעות`);
  });

  it('מוציא מילה רב-משמעית מהספירה במקום לנחש לה חלק דיבר', () => {
    const m = /לקסיקון: (\d+) מילים · (\d+) חד-משמעיות · (\d+) רב-משמעיות/.exec(out);
    expect(m).not.toBeNull();
    const [, all, unambiguous, ambiguous] = m!.map(Number);
    expect(Number(unambiguous) + Number(ambiguous)).toBe(Number(all));
    expect(Number(ambiguous)).toBeGreaterThan(0);
  });

  it('מדווח כיסוי טוקנים נמוך מ-100% — ⛔ ואינו מעגל אותו כלפי מעלה', () => {
    const m = /כיסוי טוקנים: (\d+)\/(\d+)/.exec(out);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeLessThan(Number(m![2]));
  });

  /**
   * ⚠️ **זו הטענה היחידה שבגללה הקובץ נכתב.** ההזמנה K-003 נשענה על מודל סדר 1.
   * אם הוא יתחיל לצמצם באמת — הבדיקה תיפול, וזה בדיוק הדיווח הרצוי: ההנחה שעליה
   * נחסמה ההזמנה השתנתה. ⛔ אין כאן קיבוע של מספר, יש קיבוע של **מסקנה**.
   */
  it('מודל סדר 1 ⛔ אינו מצמצם — פחות מ-10% מהבלוקים נפסלים', () => {
    expect(reductions()).toHaveLength(2);
    expect(reductions()[0]).toBeLessThan(10);
  });

  /**
   * 🔴 ⟦שוכתב 18/09 · `C-0714` · `F-286` · אישור רוי⟧ **יחס, ⛔ ולא הפרש — והסיבה מדודה.**
   *
   * 🔬 **מה שקרה, ⛔ ולא מה ששיערתי.** הטענה דרשה `order2 > order1 + 20`. על 1,605
   * שורות היא מדדה **24.0% מול 0.1%** ועברה; אצווה של **15 מילים** הביאה את הקורפוס
   * ל-1,620 שורות ⇒ **19.0% מול 0.1%**, והיא נפלה ב-**1.1 נקודות**. אומת בשני הכיוונים
   * ב-worktree, על שני הקומיטים. ⇒ **המסקנה ⛔ לא השתנתה כהוא זה** — `order2` מצמצם
   * פי **190** מ-`order1` — אבל **הפרש מוחלט על מדד שמתכווץ ככל שהקורפוס גדל**
   * הוא שעון עצר: כל תקתוק CONTENT מקרב אותו לאדום, וכל הורדת-סף תאדים שוב.
   *
   * ⛔ **ולמה זה ⛔ אינו ריכוך של שער.** הקובץ הזה מצהיר על עצמו: «⛔ אין כאן קיבוע
   * של מספר, יש קיבוע של **מסקנה**». ⇒ `+20` היה **מספר**, וזה בדיוק מה שהתיעוד
   * אומר שהוא ⛔ לא. הניסוח כאן מחזיק את המסקנה בשתי טענות שאי-אפשר לעבור בטעות:
   *   ⓐ **`order2` מצמצם** — הרצפה היא `>= 10`, **המראה המדויקת** של «`order1` ⛔ אינו
   *      מצמצם ⇒ `< 10`» בטענה שמעל. ⛔ המספר ⛔ לא נבחר כדי לעבור את 19.0.
   *   ⓑ **והוא מצמצם פי כמה** — `order2 > order1 * 5`, שהוא **חסין לגודל הקורפוס**
   *      כי שני האגפים מתכווצים יחד.
   *
   * ⇒ **מה שעדיין מאדים, וזה מה שהשער נועד לו:** ‏`order1` שמתחיל לצמצם (הטענה שמעל,
   * ⛔ לא נגעתי בה) · `order2` שמתדרדר מתחת ל-10% · ושניהם מתכנסים זה לזה.
   */
  it('מודל סדר 2 מצמצם, ⛔ וסדר 1 לא — היחס הוא הראיה, ⛔ לא ההפרש', () => {
    const [order1, order2] = reductions();
    expect(order1).toBeDefined();
    expect(order2).toBeDefined();
    // ⓐ ‏`order2` **מצמצם** — הרצפה היא המראה של «`order1` ⛔ אינו מצמצם».
    expect(order2 as number, 'סדר 2 חדל לצמצם ⇒ ההנחה שעליה נחסמה K-003 השתנתה').
      toBeGreaterThanOrEqual(10);
    // ⓑ ‏ו**פי כמה**, ⛔ ולא בהפרש: שני האגפים מתכווצים יחד ⇒ הקורפוס ⛔ אינו מזיז את זה.
    expect(order2 as number, 'שני המודלים התכנסו ⇒ סדר 2 חדל להיות המודל הטוב יותר').
      toBeGreaterThan((order1 as number) * 5);
  });

  it('מונה את חלקי הדיבר שאין להם צבע ב-§ 39.3, ⛔ ואינו ממציא להם אחד', () => {
    expect(out).toContain('חלקי דיבר בלקסיקון שאין להם צבע');
    for (const pos of ['adverb', 'determiner', 'preposition']) expect(out).toContain(pos);
    for (const coloured of ['\n  verb —', '\n  noun —']) expect(out).not.toContain(coloured);
  });

  it('⛔ עוצר בשם על אצווה פגומה, ⛔ ואינו מדלג עליה בשקט', () => {
    const dir = mkdtempSync(join(tmpdir(), 'continuations-'));
    writeFileSync(join(dir, 'batch-2026-01-01.jsonl'), '{"headword":"a"\n');
    expect(() => run(dir)).toThrow(/is not JSON/);
  });

  it('⛔ עוצר בשם כשאין אצוות כלל, ⛔ ואינו מדווח אפס כאילו נמדד', () => {
    const dir = mkdtempSync(join(tmpdir(), 'continuations-empty-'));
    expect(() => run(dir)).toThrow(/no batch files/);
  });

  it('D-141: counts a tagged object item\'s stem as a sentence, not just a bare-string item', () => {
    const dir = mkdtempSync(join(tmpdir(), 'continuations-items-'));
    writeFileSync(
      join(dir, 'batch-2026-01-01.jsonl'),
      `${JSON.stringify({
        headword: 'test',
        pos: 'verb',
        examples: { supportive: 'They test the machine.', neutral: 'She will test it soon.' },
        items: [
          'They ____ the machine every day.',
          { stem: 'She will ____ it again tomorrow.', level: 2, level_rationale: 'x' },
        ],
      })}\n`,
    );
    const out = run(dir);
    expect(out).toContain('1 קבצי אצווה · 1 שורות משמעות · 4 משפטים');
  });
});
