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

  it('⛔ אפס hex, ⛔ אפס h-screen, ⛔ אפס רדיוס מחוץ לסולם', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/\bh-screen\b/);
    expect(CODE).toMatch(/min-h-\[100dvh\]/);
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
});
