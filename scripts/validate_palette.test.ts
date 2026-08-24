import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { CATEGORICAL_MIN_DELTA_E, CVD_TYPES } from '@/lib/core/colorVision';
import { CONTRAST_FLOORS } from '@/lib/core/palette';

const run = (args: string[]): { out: string; code: number } => {
  try {
    return {
      out: execFileSync('node', ['scripts/validate_palette.mjs', ...args], { encoding: 'utf8' }),
      code: 0,
    };
  } catch (e) {
    const err = e as { stdout?: string; status?: number };
    return { out: err.stdout ?? '', code: err.status ?? -1 };
  }
};

describe('scripts/validate_palette.mjs — הקובץ ש-RULES § 0.8 מחייב', () => {
  it('בודק כל רצפה מוצהרת בשני המצבים — ⛔ אינו בוחר תת-קבוצה', () => {
    const r = run([]);
    expect(r.code).toBe(0);
    for (const floor of CONTRAST_FLOORS) {
      for (const mode of ['light', 'dark']) {
        expect(r.out, `${floor.fg}/${floor.bg} ${mode}`).toContain(
          `${mode.padEnd(5)} ${floor.fg} על ${floor.bg}`,
        );
      }
    }
  });

  it('⛔ יוצא 1 על סדרה שקורסת בעין דיכרומטית, ומדווח באיזו', () => {
    // ⛔ המדידה, ⛔ ולא הדעה: כחול ואורכידאה מפלטת § 39.3 קורסים בפרוטן.
    const r = run(['--colors', '#5b9bf5,#d178e8', '--surface', '#0f172a']);
    expect(r.code).toBe(1);
    expect(r.out).toContain('protan');
    expect(r.out).toMatch(/FAIL #5b9bf5 מול #d178e8/);
  });

  it('עובר על סדרה שנבדלת — ⛔ ולא נכשל על כל קלט', () => {
    const r = run(['--colors', '#ffffff,#000000', '--surface', '#808080']);
    expect(r.out).toContain(`ΔE ≥ ${CATEGORICAL_MIN_DELTA_E}`);
    expect(r.out).toContain(CVD_TYPES.join(' · '));
  });

  it('⛔ עוצר בשם על דגל בלי ערך, ⛔ ואינו ממציא ברירת מחדל', () => {
    expect(() => execFileSync('node', ['scripts/validate_palette.mjs', '--colors'])).toThrow();
    expect(() =>
      execFileSync('node', ['scripts/validate_palette.mjs', '--colors', '#ffffff']),
    ).toThrow();
  });

  it('⛔ אינו טוען שבדק טריטן', () => {
    const r = run(['--colors', '#ffffff,#000000', '--surface', '#808080']);
    expect(r.out).toContain('טריטן ⛔ לא נבדק');
  });
});
