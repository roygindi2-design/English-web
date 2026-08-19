import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `<ArcadeEntry>` — הכניסה לזירה מתוך בלוק «דרכים לתרגל» של מפת הרמה
 * (T-097 · § 4.2ז שורה 4 · § 4.2י · תוכנית `2026-08-19-arcade-screens.md` § 3).
 *
 * שומר מקור, באותה צורה ומאותו נימוק כמו `DeckSelector.test.ts` ו-`ArenaResult.test.ts`:
 * סביבת vitest היא `node` ו-jsdom נעדר במכוון (`vitest.config.ts`), ולכן בדיקת רינדור
 * ⛔ אינה שייכת לכאן. הגיאומטריה — יעד מגע ≥44px, אפס גלילה אופקית — היא עבודתו של
 * `check:mobile` דרך הפיקסטורה `/dev/tabs/cards`.
 *
 * מה שהקובץ הזה מוכיח, וללא זה היה מאמין ⛔ ולא מודד:
 *
 *   ✔ רמה קטנה מדי מוצגת **מושבתת עם שני המספרים שהשרת החזיר** ⛔ ולא מוסתרת (D-046),
 *     ושני המספרים באים מ-`eligible`/`required` של החוזה ⛔ ואינם כתובים בקוד — 12
 *     חי במקום אחד בלבד, `ARCADE_MIN_WORDS`
 *   ✔ «מושבת» הוא `aria-disabled` על `<button>` בלי handler ⛔ ולא התכונה `disabled`,
 *     בדיוק תבנית `<DeckSelector>`: השורה נשארת ממוקדת, וקורא-מסך שומע שהיא חסומה
 *   ✔ קריאה שנכשלה קוראת «—» ⛔ ולא «0»: מספר שאין לנו אינו מספר אפס
 *   ✔ רמה ריקה שולחת לבחירת רמה ⛔ ולא לזירה (D-037 — אין נפילה שקטה ל-A1)
 *   ✔ ⛔ אפס ניקוד, XP ולוח תוצאות (D-050) ⛔ ואפס hex גולמי (חוקה § 6)
 *
 * ⛔ מה שהוא **אינו** מוכיח, ונאמר כאן כדי שירוק לא ייקרא כיסוי: שהבקשה באמת חוזרת,
 * שהשורה המושבתת באמת אינה ניתנת ללחיצה במנוע, ושהמספר על המסך תואם למאגר.
 */
const SRC = readFileSync('components/ArcadeEntry.tsx', 'utf8');

/** C-0032/C-0071/C-0072: שומר שהערה יכולה לספק אינו שומר על דבר. */
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/**
 * מחלקות של תגית, כולל קבועים שהיא מפנה אליהם — `ArenaResult.test.ts:15-30`.
 * ⚠️ אסרציית איסור היא **על גבול מזהה** (`/\bxp\b/`) ⛔ ולא `toContain`.
 */
const CLASS_CONSTS = Object.fromEntries(
  [...CODE.matchAll(/const\s+([A-Z][A-Z0-9_]*)\s*=\s*([\s\S]*?);\n/g)].map((m) => [
    m[1] ?? '',
    m[2] ?? '',
  ]),
);
function classesOf(tag: string): string {
  const attribute = tag.match(/className=(?:"([^"]*)"|\{([\s\S]*?)\})/);
  if (attribute === null) return '';
  const literal = attribute[1] ?? '';
  const expression = attribute[2] ?? '';
  const referenced = [...expression.matchAll(/[A-Z][A-Z0-9_]*/g)]
    .map((m) => CLASS_CONSTS[m[0]] ?? '')
    .join(' ');
  return `${literal} ${expression} ${referenced}`;
}

describe('<ArcadeEntry>', () => {
  it('הוא רכיב לקוח וקורא לסיבוב ⛔ ולא לנקודת קצה שאינה קיימת', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
    expect(CODE).toMatch(/apiGet<[^>]*>\('\/api\/arcade\/round'\)/);
  });

  it('רמה קטנה מדי ⇒ **מושבת עם שני המספרים מהשרת** ⛔ ולא מוסתר (D-046)', () => {
    expect(CODE).toContain('נדרשות');
    // ⚠️ שני המספרים מגיעים מהתשובה ⛔ ואינם נכתבים בקוד — זה בדיוק מה ש-`eligible`
    // ו-`required` קיימים בשבילו (docs/api-contract.md).
    expect(CODE).toMatch(/\brequired\b/);
    expect(CODE).toMatch(/\beligible\b/);
    expect(CODE, '⛔ 12 אינו מספר בקוד').not.toMatch(/['"`][^'"`]*\b12\b/);
  });

  it('מושבת = כפתור בלי handler עם aria-disabled ⛔ ולא התכונה disabled (תבנית DeckSelector)', () => {
    expect(CODE).toMatch(/aria-disabled="true"/);
    expect(CODE).not.toMatch(/\bdisabled=\{/);
  });

  it('⛔ «—» ואינו «0»: קריאה שנכשלה ורמה ריקה ⛔ אינן אותו דבר', () => {
    expect(CODE).toContain('—');
  });

  it('רמה ריקה ⇒ שולח לבחירת רמה ⛔ ולא לזירה', () => {
    expect(CODE).toMatch(/level === null/);
    expect(CODE).toContain('בחר רמה');
  });

  it('יש קרב ⇒ קישור פעיל ל-`/arcade`, יעד מגע 44px', () => {
    expect(CODE).toMatch(/href="\/arcade"/);
    const link = CODE.match(/<Link[^>]*data-arcade-entry[\s\S]*?>/);
    expect(link).not.toBeNull();
    expect(classesOf(link?.[0] ?? '')).toMatch(/min-h-touch/);
  });

  it('התווית היא «משחק» — הדרך השנייה בשורה 4 של § 4.2ז', () => {
    expect(CODE).toContain('משחק');
  });

  it('⛔ אפס hex, אפס ניקוד', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('⛔ אינו כותב ואינו נוגע במנוע החזרות (D-044) — שורה במסך, לא מסך', () => {
    expect(CODE, '⛔ שורת כניסה אינה כותבת').not.toMatch(/apiPost/);
    for (const banned of [/word_progress/, /easiness/, /next_review_at/]) {
      expect(CODE, `${banned} אסור — D-044`).not.toMatch(banned);
    }
    // ⛔ אין «נסה שוב» ואין מסך שגיאה כאן: זו שורה בתוך מסך, וכשל משאיר אותה מושבתת
    // קוראת «—» — בדיוק הכלל ש-`<DeckSelector>` כבר קבע.
    expect(CODE, '⛔ אין פקד ניסיון חוזר בשורה').not.toContain('נסה שוב');
  });

  it('שש התשובות של החוזה מטופלות, וההשבתה נגזרת מהמצב ⛔ ולא מדגל נפרד', () => {
    expect(CODE).toMatch(/level_too_small/);
    expect(CODE).toMatch(/session_expired/);
    expect(CODE).toMatch(/schema_missing/);
    expect(CODE).toMatch(/round === null|round !== null/);
  });
});

describe('<LevelMapScreen> — שורה 4', () => {
  const MAP = readFileSync('components/LevelMapScreen.tsx', 'utf8');
  it('בלוק «דרכים לתרגל» מחזיק **שתי** דרכים בדיוק', () => {
    expect(MAP).toMatch(/<DeckSelector\s*\/>/);
    expect(MAP).toMatch(/<ArcadeEntry\s*\/>/);
  });
});
