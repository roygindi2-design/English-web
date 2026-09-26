import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { withoutComments } from '@/lib/testSource';

/**
 * 🌫️ ⟦`C-0872` · זירה — עיצוב חופשי⟧ **קצה גלילה, ⛔ ולא חיתוך.** כל אזור גמיש של הזירה
 * שנגלל בתוך עצמו מעל פעולות מעוגנות נושא `data-arena-scroll-edge`, והכלל ב-`arcade-tokens.css`
 * מחזיק את המסכה **ואת הריפוד באותו משתנה** — מסכה בלי ריפוד הייתה משאירה את השורה
 * האחרונה דהויה לתמיד, גם בסוף הגלילה.
 */
const CSS = readFileSync(new URL('./arcade-tokens.css', import.meta.url), 'utf8');
const RULE = CSS.match(/\[data-arena-scroll-edge\]\s*\{[^}]*\}/)?.[0] ?? '';

/** כל רכיב, והסמן של האזור הגמיש שלו. ⛔ לא כל `overflow-y-auto`: רשת הארון היא גיליון,
 *  ⛔ ולא אזור מעל פעולות מעוגנות. */
const SCROLLERS: ReadonlyArray<readonly [string, string]> = [['ArenaHome', 'data-arena-home-body']];

describe('זירה — קצה הגלילה', () => {
  it('הכלל קיים: מסכה וריפוד על אותו `--arena-scroll-fade`', () => {
    expect(RULE).not.toBe('');
    expect(RULE).toMatch(/--arena-scroll-fade:\s*1rem/);
    expect(RULE).toContain('padding-bottom: var(--arena-scroll-fade)');
    expect(RULE).toMatch(/(?<!-webkit-)mask-image:[^;]*var\(--arena-scroll-fade\)/);
    expect(RULE).toMatch(/-webkit-mask-image:[^;]*var\(--arena-scroll-fade\)/);
  });

  it.each(SCROLLERS)('%s — האזור הגמיש (`%s`) נושא את הקצה', (name, marker) => {
    const code = withoutComments(readFileSync(new URL(`../../components/${name}.tsx`, import.meta.url), 'utf8'));
    const region = code.split('\n').filter((line) => line.includes(marker) && line.includes('overflow-y-auto'));
    expect(region).toHaveLength(1);
    expect(region[0]).toContain('data-arena-scroll-edge');
  });
});
