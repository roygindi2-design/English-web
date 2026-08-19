import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<AppGrid>` — רשת האפליקציות של `העולם` (T-098 · § 4.2יא · D-046 ·
 * תוכנית `2026-08-19-world-home.md` § 1).
 *
 * שומר מקור, באותה צורה ומאותו נימוק כמו `ArcadeEntry.test.ts` ו-`DeckSelector.test.ts`:
 * סביבת vitest היא `node` ו-jsdom נעדר במכוון (`vitest.config.ts`), ולכן בדיקת רינדור
 * ⛔ אינה שייכת לכאן. הגיאומטריה — יעד מגע ≥44px, אפס גלילה אופקית — היא עבודתו של
 * `check:mobile` על `/world` עצמו.
 *
 * מה שהקובץ הזה מוכיח, וללא זה היה מאמין ⛔ ולא מודד:
 *
 *   ✔ הרשת שואלת את הזירה דרך נקודת הקצה שקיימת בחוזה, ⛔ ולא דרך שם שהומצא
 *   ✔ הנוסח «נדרשות N מילים ברמה, יש M» נבנה בשכבה הטהורה ⛔ ואין בו מספר כתוב בקוד
 *   ✔ «מושבת» הוא `aria-disabled` על `<button>` בלי handler ⛔ ולא התכונה שמסירה את
 *     האריח מסדר הטאב — קורא-מסך מגיע אליו ושומע שהוא חסום
 *   ✔ ⛔ אפס `data-primary-action`: `/world` ⛔ אינו ב-`FLOW_ROUTES`, ולכן בדיקת
 *     «בדיוק פעולה ראשית אחת» ⛔ אינה רצה כאן, וסימון כזה היה טענה שאיש אינו מודד
 *   ✔ ⛔ אפס `backdrop-blur` · `shadow-2xl` · סיבוב · תלת-ממד — מדד ⓒ של § 4.2יא
 *     והחוקה § 6, ⛔ ואפס hex גולמי
 *   ✔ ⛔ אפס מדדי משחק מסוג D-050
 *
 * ⛔ מה שהוא **אינו** מוכיח, ונאמר כאן כדי שירוק לא ייקרא כיסוי: שהבקשה באמת חוזרת,
 * שהאריח המושבת באמת אינו ניתן ללחיצה במנוע, ושהמספר על המסך תואם למאגר.
 */
const SRC = readFileSync('components/AppGrid.tsx', 'utf8');

/** C-0032/C-0071/C-0072 · F-065: שומר שהערה יכולה לספק אינו שומר על דבר. */
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('<AppGrid>', () => {
  it('הוא רכיב לקוח וקורא לסיבוב הזירה ⛔ ולא לנקודת קצה שאינה קיימת', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
    expect(CODE).toMatch(/apiGet<[^>]*>\('\/api\/arcade\/round'\)/);
  });

  it('⛔ אפס כתיבה: `apiGet` בלבד, ⛔ אפס `apiPost` ואפס מנוע חזרות (D-044 · D-051)', () => {
    expect(CODE).not.toContain('apiPost');
    for (const banned of [
      /word_progress/,
      /easiness/,
      /interval_days/,
      /next_review_at/,
      /self_marked_known/,
      /current_level/,
    ]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('הנוסח מגיע מהשכבה הטהורה ⛔ והמספר אינו כתוב בקוד (D-046)', () => {
    expect(CODE).toContain('levelTooSmallNoteHe');
    expect(CODE, '⛔ 12 אינו מספר בקוד').not.toMatch(/['"`][^'"`]*\b12\b/);
  });

  it('מושבת = כפתור בלי handler עם aria-disabled ⛔ ולא התכונה disabled', () => {
    expect(CODE).toContain('aria-disabled');
    expect(CODE).not.toMatch(/\bdisabled=\{/);
    expect(CODE).not.toMatch(/\bdisabled\s*\/>/);
  });

  it('⛔ אפס `data-primary-action` — `/world` אינו ב-FLOW_ROUTES ואיש אינו מודד טענה כזאת', () => {
    expect(CODE).not.toContain('data-primary-action');
  });

  it('⛔ אפס אפקט מהסוג שהחוקה § 6 אוסרת, ⛔ ואפס hex גולמי', () => {
    expect(CODE).not.toMatch(/backdrop-blur|shadow-2xl|rotate-|perspective/);
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('⛔ אפס מדדי משחק (D-050)', () => {
    expect(CODE).not.toMatch(/\bxp\b|\bscore\b|\bcoin\b/i);
  });

  it('כל אריח נושא יעד מגע ⛔ ואינו ממורכז אנכית (חוקה § 4 · F-011)', () => {
    expect(CODE).toContain('min-h-touch');
    expect(CODE).not.toMatch(/\bh-screen\b/);
    expect(CODE).not.toMatch(/justify-center/);
  });
});
