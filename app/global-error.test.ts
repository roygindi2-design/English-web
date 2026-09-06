import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * שומר מקור ל-`app/global-error.tsx` — תבנית `app/error.test.ts` (T-124 · D-065),
 * מילה במילה: סביבת vitest היא `node`, jsdom נעדר בכוונה, ולכן הבדיקה סורקת מקור.
 *
 * T-267 · נמדד חי בטיק הזה: בדיוק כמו `app/error.tsx`, `GlobalError({ reset })`
 * מפרק רק את `reset` ⛔ ומעולם לא קורא ל-`error` — הגבול האחרון-שבאחרונים (קריסה
 * ב-root layout עצמו) שותק בדיוק כמו הגבול הרגיל.
 */
const SRC = readFileSync('app/global-error.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('T-267 — הגבול האחרון גם הוא חייב לתעד את השגיאה', () => {
  it('הפרמטר `error` נקרא ⛔ ולא מדולג בפירוק', () => {
    expect(CODE).toMatch(/\{\s*error\s*,\s*reset\s*\}/);
  });

  it('השגיאה נכתבת ליומן — console.error', () => {
    expect(CODE).toMatch(/console\.error\([^)]*error/);
  });
});
