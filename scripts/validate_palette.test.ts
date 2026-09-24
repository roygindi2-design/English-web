import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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

describe('scripts/validate_palette.mjs — הקובץ ש-RULES § 0.9 מחייב', () => {
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

describe('T-466 · D-286 ⓐ — the part-of-speech palette on the LIGHT surface', () => {
  // The values are read from the token file itself: a fixture copy of them would be a hole.
  const css = readFileSync('components/block-keyboard-tokens.css', 'utf8');
  const light = css.slice(0, css.indexOf('@media (prefers-color-scheme: dark)'));
  const dark = css.slice(css.indexOf('@media (prefers-color-scheme: dark)'));
  const POS = ['verb', 'noun', 'adjective', 'conjunction', 'pronoun'] as const;
  const valueOf = (block: string, pos: string): string =>
    new RegExp(`--pos-${pos}:\\s*(#[0-9a-f]{6})`, 'i').exec(block)?.[1] ?? 'missing';

  it('the five light values pass validate_palette — ≥3:1 on #ffffff and on #f8fafc, 0 pairs under the ΔE floor', () => {
    const colors = POS.map((p) => valueOf(light, p));
    expect(colors).not.toContain('missing');
    for (const surface of ['#ffffff', '#f8fafc']) {
      const r = run(['--colors', colors.join(','), '--surface', surface]);
      expect(r.out, surface).not.toContain('FAIL');
      expect(r.code, surface).toBe(0);
    }
  });

  it('the dark scheme keeps the 39 § 3 values unchanged — ⛔ no change to the spec', () => {
    expect(POS.map((p) => valueOf(dark, p))).toEqual(['#f2b544', '#5b9bf5', '#2ec5c5', '#8b95ab', '#d178e8']);
  });

  it('⛔ a verb is never red (39 § 3), and no --pos value enters palette.ts', () => {
    const verb = valueOf(light, 'verb');
    const r = parseInt(verb.slice(1, 3), 16);
    const g = parseInt(verb.slice(3, 5), 16);
    expect(g / r).toBeGreaterThan(0.3); // amber/brown, ⛔ not a red (#b91c1c ⇒ 0.14)
    expect(readFileSync('lib/core/palette.ts', 'utf8')).not.toMatch(/--pos-/);
  });
});
