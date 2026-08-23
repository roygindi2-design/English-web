import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * ‏T-089 · § 4.2ט — אנטומיית מסך השיעור. **מבנה בלבד, אפס תוכן.**
 *
 * שומר מקור ו⛔ לא בדיקת רינדור: סביבת vitest היא node ו-jsdom ⛔ אינו מותקן
 * במכוון (`vitest.config.ts`). גאומטריה היא עבודתו של `check:mobile`, דרך שתי
 * הפיקסטורות `/dev/lesson` ו-`/dev/lesson/done` (משימה 2).
 */
const SRC = readFileSync('components/LessonScreen.tsx', 'utf8');

/** C-0032/C-0071/C-0072: שומר שהערה יכולה לספק ⛔ אינו שומר. */
function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('<LessonScreen> — ארבעת הבלוקים של § 4.2ט (T-089)', () => {
  /**
   * ⛔ הטענה החזקה של המשימה כולה: **אפס תו עברי בקוד**. כל מחרוזת גלויה
   * מגיעה כפרופ, ולכן תוכן לימודי ⛔ אינו יכול להתיישב כאן — גם לא «רק
   * ככותרת», גם לא «רק בפיקסטורה שהועתקה פנימה».
   */
  it('⛔ אינו מחזיק ולו תו עברי אחד — כל מחרוזת גלויה היא פרופ', () => {
    const hebrew = CODE.match(/[֐-׿]/g) ?? [];
    expect(hebrew.join(''), 'Hebrew literal in the component = product copy Dev does not write').toBe('');
  });

  it('מרנדר את ארבעת הבלוקים, כל אחד מסומן כדי שהארנס ימצא אותו', () => {
    expect(CODE).toContain('data-lesson-type');
    expect(CODE).toContain('data-lesson-explanation');
    expect(CODE).toContain('data-lesson-items');
    expect(CODE).toContain('data-lesson-done');
  });

  it('מקבל את ששת הפרופים בשמם ו⛔ אינו גוזר אף אחד מהם', () => {
    for (const prop of [
      'questionTypeTitle',
      'explanation',
      'items',
      'phase',
      'doneTitle',
      'doneExitLabel',
    ]) {
      expect(CODE, `${prop} is not read`).toContain(prop);
    }
    // ⛔ אפס שעון, אפס אקראיות, אפס קריאת רשת — הרכיב הוא פונקציה של הפרופים שלו.
    expect(CODE).not.toContain('new Date');
    expect(CODE).not.toContain('Math.random');
    expect(CODE).not.toContain('fetch(');
    expect(CODE).not.toContain('apiGet');
  });

  /**
   * «1–3 פריטי תרגול» היא מכסה, ⛔ לא הצעה. החיתוך נעשה על הקבוע המיוצא ⛔ ולא
   * על ליטרל: ליטרל הוא עותק שני של אותו מספר שיכול לסחוף ממנו בשקט (התקדים
   * הוא INSTITUTION_MAX_LENGTH ב-C-0081).
   */
  it('חותך את הפריטים ב-LESSON_MAX_ITEMS ⛔ ולא בליטרל', () => {
    expect(CODE).toContain('export const LESSON_MAX_ITEMS = 3');
    expect(CODE).toMatch(/items\.slice\(0,\s*LESSON_MAX_ITEMS\)/);
    expect(CODE).not.toMatch(/items\.slice\(0,\s*3\)/);
  });

  it('מעביר כל אנגלית דרך העטיפה היחידה שכותבת lang=en (חוקה § 2)', () => {
    expect(CODE).toContain('EnText');
    expect(CODE).toContain('EnWord');
    expect(CODE).not.toContain('lang="en"');
    expect(CODE).not.toContain('dir="ltr"');
  });

  /**
   * ⓓ הוא בלוק ולא מסך שני, ו-`phase` הוא פרופ ולא מצב: המעבר בין השניים הוא
   * החלטת מסך של ה-PM ש-§ 4.2ט שותקת בה (F-099). ⛔ אין להמציא אותו כאן.
   */
  it('מפריד את שני המצבים על הפרופ phase ⛔ ואינו מחזיק מצב משלו', () => {
    expect(CODE).toMatch(/phase === 'done'/);
    expect(CODE).toMatch(/phase === 'items'/);
    expect(CODE).not.toContain('useState');
    expect(CODE).not.toContain('onClick');
    expect(CODE).not.toContain("'use client'");
  });

  it('יוצא ל-לשונית לימודים דרך קבוע מיוצא (§ 4.2ט שאלה 6)', () => {
    expect(CODE).toContain("export const LESSON_EXIT_HREF = '/studies'");
    expect(CODE).toContain('href={LESSON_EXIT_HREF}');
  });

  /**
   * ⛔ `/dev/lesson` ⛔ אינו ב-FLOW_ROUTES ואינו ב-PRIMARY_ACTION_ROUTES, ולכן
   * איש אינו מודד «בדיוק סימון אחד למסך» כאן. סימון שאיש אינו מודד הוא סימון
   * שיסחף — התקדים המדויק הוא `<AppGrid>` (C-0200).
   */
  it('⛔ אפס data-primary-action ו⛔ אפס ActionBar', () => {
    expect(CODE).not.toContain('data-primary-action');
    expect(CODE).not.toContain('ActionBar');
  });

  it('מעגן את העמודה למעלה ⛔ ולעולם אינו ממרכז אותה (F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/flex-1[^"'`]*justify-center/);
    expect(CODE).not.toContain('h-screen');
  });

  it('⛔ אינו טוען טענת מוכנות או ציון (4.4.3 · R-002)', () => {
    for (const forbidden of ['%', 'score', 'readiness']) {
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
    }
  });

  it('מחזיק בדיוק כותרת h1 אחת — היררכיית כותרות לקורא מסך', () => {
    expect((CODE.match(/<h1/g) ?? []).length).toBe(1);
  });
});
