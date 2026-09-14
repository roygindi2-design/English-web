import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 🧪 **T-339 — הסורק שיתפוס את הבא.** המשך של `F-236`, וזה החצי שלא נעשה אז.
 *
 * 🔬 **מה נמדד, ⛔ ולא שוער (C-0595):** `F-236` נסגר ב-C-0562 ב**קובץ אחד**
 * (`AmirnetSimulation.tsx`), הכלל אף **נכתב** בהערה ב-`AmirnetSectionBreak.tsx:81-83`,
 * ו⛔ אז ⛔ לא נאכף בשום מקום — ⇒ **תשעה** מופעים חיים ב-**ארבעה** רכיבים שרדו שלושה
 * שבועות (`FilterBar` · `ArenaSummary` · `ArenaCharacterChoice` ×2 · `ArenaHome` ×5).
 * שלושת השערים הירוקים (`check:mobile` · `check:motion` · `check:text-floor`) ⛔ אינם
 * מודדים כיוון ציר ולו פעם אחת.
 *
 * **הכלל:** במיכל RTL — והמסמך כולו `dir="rtl"` — `flex-direction: row` **כבר** מניח
 * את הילד הראשון בימין. `flex-row-reverse` הופך זאת **פעם שנייה** ומחזיר ל-LTR.
 *
 * ⚠️ **המחלקה ⛔ אינה אסורה — היא אסורה בשתיקה.** מסך שבאמת צריך היפוך שני כותב
 * בשורה שמעליו `⟨RTL-REVERSE: <סיבה>⟩`, והסורק עובר. ⇒ ההיתר נשאר אפשרי, ⛔ אבל
 * ⛔ לא שקוף: מי שכותב אותו אומר למה.
 *
 * ⚠️ **⛔ והבדיקה הזאת ⛔ אינה שער** — היא `npm test` רגיל, ⛔ לא `verify` נוסף
 * (`§ 0.31`: מספרי שערים ⛔ אינם זזים כאן). המדידה בפיקסלים של הצירים עצמם יושבת
 * ב-`scripts/verify-mobile.mjs` (`[data-rtl-row]`, `T-337` · `T-338`).
 */

const ROOTS = ['app', 'components'];
const ALLOW = /⟨RTL-REVERSE:\s*[^⟩\s]/;

/** ⛔ מסתיר הערות ו**שומר על מספרי השורות** — בלי זה כל הסבר על הכלל היה נספר כהפרה. */
function maskComments(src: string): string {
  const keepNewlines = (m: string): string => m.replace(/[^\n]/g, ' ');
  return src
    .replace(/\/\*[\s\S]*?\*\//g, keepNewlines)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, keepNewlines)
    .replace(/^([^\n]*?)\/\/[^\n]*$/gm, (_m, before: string) => before);
}

function tsxFiles(dir: string): readonly string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...tsxFiles(full));
      continue;
    }
    if (!full.endsWith('.tsx')) continue;
    if (full.includes('.test.')) continue; // ⛔ קובץ בדיקה ⛔ אינו מסך
    out.push(full);
  }
  return out;
}

type Occurrence = { readonly file: string; readonly line: number; readonly text: string };

function scan(): readonly Occurrence[] {
  const found: Occurrence[] = [];
  for (const root of ROOTS) {
    for (const file of tsxFiles(root)) {
      const raw = readFileSync(file, 'utf8');
      if (!raw.includes('flex-row-reverse')) continue;
      const original = raw.split('\n');
      const masked = maskComments(raw).split('\n');
      for (let i = 0; i < masked.length; i += 1) {
        const code = masked[i] ?? '';
        if (!code.includes('flex-row-reverse')) continue;
        // ההיתר יושב בשורה שמעליו — או בשורה עצמה, כשהמחלקה בתוך מערך מחרוזות.
        const above = original.slice(Math.max(0, i - 1), i + 1).join('\n');
        if (ALLOW.test(above)) continue;
        found.push({ file, line: i + 1, text: (original[i] ?? '').trim() });
      }
    }
  }
  return found;
}

describe('ציר ה-RTL — `flex-row-reverse` ⛔ לעולם ⛔ לא בשתיקה (T-339)', () => {
  it('⛔ אפס מופעים בלי `⟨RTL-REVERSE: …⟩` בשורה שמעליהם', () => {
    const found = scan();
    const report = found.map((f) => `${f.file}:${f.line} — ${f.text}`).join('\n');
    expect(report).toBe('');
    expect(found).toHaveLength(0);
  });

  it('הסורק באמת רואה מופע — ⛔ בדיקה שלא יכולה להיכשל ⛔ אינה בדיקה', () => {
    const masked = maskComments([
      '/* prose about flex-row-reverse, and it is ⛔ not code */',
      '<div className="flex flex-row-reverse" />',
      '{/* another comment: flex-row-reverse */}',
    ].join('\n')).split('\n');
    expect(masked[0]).not.toContain('flex-row-reverse');
    expect(masked[1]).toContain('flex-row-reverse');
    expect(masked[2]).not.toContain('flex-row-reverse');
  });

  it('ההיתר `⟨RTL-REVERSE: …⟩` פותח, ⛔ אבל ⛔ לא ריק', () => {
    expect(ALLOW.test('{/* ⟨RTL-REVERSE: המספרים נקראים כיחידה לטינית⟩ */}')).toBe(true);
    expect(ALLOW.test('{/* ⟨RTL-REVERSE: ⟩ */}')).toBe(false);
    expect(ALLOW.test('{/* just a comment */}')).toBe(false);
  });

  it('הכלל כתוב בחוקה כ**כיוון** — ⛔ ולא רק בהערה ברכיב אחד', () => {
    const constitution = readFileSync('plan/35-design-constitution.md', 'utf8');
    expect(constitution).toContain('flex-row-reverse');
    expect(constitution).toContain('⟨RTL-REVERSE:');
  });

  it('⛔ ואינה סורקת קובצי בדיקה — הם ⛔ אינם מסך', () => {
    expect(tsxFiles('components').some((f) => f.includes('.test.'))).toBe(false);
  });
});
