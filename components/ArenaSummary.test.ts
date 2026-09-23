import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * T-180 · `37 § 10` — סריקת מקור על התבנית של `components/ArenaStage.test.ts:1-25`.
 * ⚠️ **מולבן, ⛔ ולא `SRC` גולמי:** הרכיב **מתעד בהערה** מה אין בו, ומדידה גולמית
 * הייתה מפילה קובץ ⛔ שאין בו ולו הפרה אחת (F-039 · F-065).
 */
const SRC = readFileSync('components/ArenaSummary.tsx', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('<ArenaSummary> — 37 § 10 · kol-B-07-results.png', () => {
  it('שלוש שורות הסיכום, בשמן מהרנדר', () => {
    for (const label of ['נכונות', 'זמן תגובה ממוצע', 'רצף מרבי']) {
      expect(CODE).toContain(label);
    }
  });

  it('שורת החותם של האינווריאנט מופיעה מילה במילה (37 § 13.1)', () => {
    expect(CODE).toContain('הזירה לא שינתה דבר בהתקדמות הלמידה');
  });

  it('⛔ הרכיב ⛔ אינו כותב — אפס רשת ואפס שם עמודה', () => {
    for (const banned of [/apiPost/, /fetch\(/, /word_progress/, /arcade_progress/]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('⛔ אינו מחשב — הסיכום מגיע כ-prop', () => {
    expect(CODE).toMatch(/summary/);
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(/);
  });

  /**
   * 🥊 **⟦17/09 · `C-0707` · `T-422`⟧ `min-h-[100dvh]` ⛔ **הוחלף**, ⛔ ולא נמחק בשקט.**
   * הטענה כאן דרשה אותו מאז שנכתבה, והמדידה החיה של הטיק הזה הראתה שהוא **הוא עצמו**
   * מקור הגלישה: מקטע בתוך כרום הפריסה שמבקש את מלוא `100dvh` גולש ב-**84px בדיוק**
   * (‏52 כותרת + 32 `pb-32`), ⛔ לפני שנספר ילד אחד. ⇒ הגדר לא ירדה — היא **התהפכה**:
   * הגובה המדויק נדרש, והמינימום נאסר. ‏`h-screen` ⛔ אסור כמקודם (חוקה § 4 · `F-011`).
   */
  it('⛔ אפס hex, ⛔ אפס h-screen, גובה **מדויק** ⛔ ולא מינימום, ⛔ אפס רדיוס מחוץ לסולם', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/\bh-screen\b/);
    // ⟦T-428⟧ בתוך הסקופ הכרום יורד ⇒ `100dvh` **מלא**, ⛔ ולא ניכוי של 84 שאינם קיימים.
    expect(CODE).toMatch(/data-arena-scope className="flex h-\[100dvh\]/);
    expect(CODE).not.toMatch(/h-\[calc\(100dvh-5\.25rem\)\]/);
    expect(CODE, '⛔ המינימום הוא מה שגלש').not.toMatch(/min-h-\[100dvh\]/);
    expect(CODE).not.toMatch(/rounded-\[\d/);
  });

  it('אנגלית מגיעה ללומד אך ורק בתוך <EnWord>', () => {
    expect(CODE).toMatch(/<EnWord/);
  });

  it('T-282 — הלוח הכחול: כותרת הרנדר, hook למדידה, ו⛔ אפס חישוב ברכיב', () => {
    expect(CODE).toMatch(/data-arena-first-met/);
    expect(CODE).toMatch(/firstMetHe\(/);
    expect(CODE).toMatch(/summary\.firstMet\.length > 0 &&/);
    // 12px, ⛔ not the render's 11.5 — Layer A floor (scripts/check-text-floor.mjs). A new
    // 11.5 would be a new baseline violation.
    expect((CODE.match(/text-\[11\.5px\]/g) ?? []).length).toBe(1);
  });

  it('T-283 — שלושה סיומים, ⛔ לא בוליאני; ⛔ «הפסדת» ו⛔ «הקרב נגמר» אינם על המסך', () => {
    expect(CODE).not.toMatch(/enemyDefeated/);
    expect(CODE).not.toMatch(/הפסדת/);
    expect(CODE).not.toMatch(/הקרב נגמר/);
    expect(CODE).toMatch(/ending\.kind === 'victory'/);
    expect(CODE).toMatch(/wordsFromBossHe\(/);
    expect(CODE).toMatch(/data-arena-ending/);
    expect(CODE).toContain('החזקת מעמד עד סוף השעון');
    expect(CODE).toContain('היריב החזיק מעמד');
  });
});

/**
 * 🔴 **T-338 — שלוש שורות הסטטיסטיקה.** `render_video_B.py:620-621` שם את התווית
 * בימין (`anchor="rm"`) ואת הערך בשמאל (`anchor="lm"`); הרכיב גזר מאותן שורות את
 * הגובה והפסיעה ואז הפך את הציר. המדידה בפיקסלים יושבת ב-`verify-mobile.mjs`.
 */
describe('ArenaSummary — ציר ה-RTL (T-338)', () => {
  const SRC_RTL = readFileSync('components/ArenaSummary.tsx', 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/^\s*\/\/.*$/gm, '');

  it('⛔ ⛔ אין `flex-row-reverse` בשורת הסטטיסטיקה', () => {
    expect(SRC_RTL).not.toContain('flex-row-reverse');
  });

  it('שלוש השורות נושאות `data-rtl-row` ⇒ השער מודד כל אחת בדפדפן', () => {
    expect(SRC_RTL.match(/data-rtl-row="summary-stat"/g)).toHaveLength(3);
  });
});

/**
 * 🎬 **T-428 · `36 § 8.0` ① — מסך הסיום נכנס לשפה הכהה של הזירה.**
 * 🔬 `C-0708`: בלי `data-arena-scope` המקטע היה `left=24 w=345` ושקוף על גוף בהיר.
 * ⛔ ושום טוקן `globals` שמתחלף לפי `prefers-color-scheme` ⛔ אינו נשאר: בסכימה בהירה
 * `--ink` הוא דיו כהה, ועל `--arena-night` הוא ⛔ נקרא.
 */
describe('T-428 — הסקופ של הזירה, ⛔ וטוקנים שמתחלפים עם הסכימה', () => {
  const T428_CODE = readFileSync(new URL('./ArenaSummary.tsx', import.meta.url), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
  it('השורש נושא `data-arena-scope` בגובה `100dvh` מלא', () => {
    expect(T428_CODE).toMatch(/<section data-arena-scope className="flex h-\[100dvh\]/);
  });
  it('⛔ אף טוקן צבע של `globals` — רק שמות הזירה', () => {
    const banned = /\b(?:text|bg|border)-(?:ink|ink-muted|brand|brand-surface|brand-on|danger|success|surface|surface-raised|border-subtle|border-strong)\b(?![-\w])/g;
    expect(T428_CODE.match(banned) ?? []).toEqual([]);
  });
  it('בקרה שלילית — הביטוי תופס את הטוקן הישן', () => {
    const banned = /\b(?:text|bg|border)-(?:ink|ink-muted|brand-surface)\b(?![-\w])/;
    expect(banned.test('rounded-2xl bg-brand-surface px-5')).toBe(true);
    expect(banned.test('text-[color:var(--arena-ink)]')).toBe(false);
  });
});
