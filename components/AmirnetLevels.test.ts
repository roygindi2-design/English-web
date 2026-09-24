import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ADAPTIVE_NOTICE_HE,
  AMIRNET_LEVEL_ROWS,
  HEADING_HE,
  LOCKED_LABEL_HE,
  OPEN_LABEL_HE,
  SUMMARY_HE,
  lockedReasonHe,
} from './AmirnetLevels';
import { withoutComments } from '@/lib/testSource';

/** Comments stripped — these rules are about what a LEARNER is shown, ⛔ not about the prose. */
const CODE = withoutComments(readFileSync('components/AmirnetLevels.tsx', 'utf8'));

describe('AmirnetLevels — T-307, render_video_D.py screen_levels (:195-235)', () => {
  it('the four levels are 41 § 4 exactly — band, classification and characteristic', () => {
    expect(AMIRNET_LEVEL_ROWS).toHaveLength(4);
    expect(AMIRNET_LEVEL_ROWS.map((r) => r.band)).toEqual(['50–84', '85–110', '111–133', '134–150']);
    expect(AMIRNET_LEVEL_ROWS.map((r) => r.nameHe)).toEqual([
      'רמה 1 · בסיסי',
      'רמה 2 · מתקדמים א׳',
      'רמה 3 · מתקדמים ב׳',
      'רמה 4 · פטור',
    ]);
    expect(AMIRNET_LEVEL_ROWS.map((r) => r.descHe)[2]).toBe('אוצר מילים אקדמי · הסקה');
    expect(AMIRNET_LEVEL_ROWS.map((r) => r.level)).toEqual([1, 2, 3, 4]);
  });

  it('the three summary strings are the render, word for word (:203-209)', () => {
    expect(HEADING_HE).toBe('סימולציה מלאה');
    expect(SUMMARY_HE).toBe('6 פרקים · 23 שאלות · 39 דקות');
    expect(ADAPTIVE_NOTICE_HE).toBe('אדפטיבי בין פרקים, כמו במבחן האמיתי');
  });

  it('a locked level says WHY in words, and names the level that opens it (:227-228)', () => {
    expect(lockedReasonHe(4)).toBe('עבור רמה 3 כדי לפתוח');
    expect(lockedReasonHe(2)).toBe('עבור רמה 1 כדי לפתוח');
  });

  it('⛔ locked is ⛔ not «the same style as enabled» — opacity AND a word AND aria-disabled', () => {
    // `ui-ux-pro-max` ux › Interaction › Disabled States: «Don't: Confuse disabled with normal state».
    expect(CODE).toMatch(/aria-disabled/);
    expect(CODE).toMatch(/opacity-/);
    expect(CODE).toMatch(/lockedReasonHe\(/);
    // ⛔ and a locked card is ⛔ not a button at all — ⛔ not a disabled one.
    expect(CODE).toMatch(/unlocked \?/);
    // the state is a WORD on the card, ⛔ never the border colour alone.
    expect(OPEN_LABEL_HE).toBe('פתוח');
    expect(LOCKED_LABEL_HE).toBe('נעול');
    expect(CODE).toContain('OPEN_LABEL_HE');
    expect(CODE).toContain('LOCKED_LABEL_HE');
  });

  it("⛔ no score, ⛔ no score estimate, ⛔ no progress bar derived from one (41 § 9.2 is Roy's)", () => {
    for (const s of ['הושלם', 'הכי גבוה', 'ציון', 'XP', 'streak']) expect(CODE).not.toContain(s);
  });

  it('every tappable carries the 44px floor, and ⛔ no hex literal reaches the screen', () => {
    expect(CODE).toMatch(/min-h-touch/);
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/h-screen/);
  });

  it('⛔ draws only — no arithmetic, no fetch, no database, no adaptivity', () => {
    expect(CODE).not.toMatch(/fetch\(|supabase|createClient/);
    expect(CODE).not.toMatch(/\.reduce\(|\.sort\(/);
    // the unlock state ARRIVES; the component ⛔ never derives it (T-307ⓕ · T-309ⓒ).
    expect(CODE).toMatch(/unlockedThrough/);
  });

  it('the English name of the exam is ⛔ not printed raw — this screen is Hebrew end to end', () => {
    expect(CODE).not.toMatch(/[A-Za-z]{4,}<\/(p|h1|h2|h3|span)>/);
  });

  it('⟦T-491ⓒ⟧ the open state sits BESIDE the description, as the render draws it — ⛔ a row of its own', () => {
    // Measured C-0819: that row was 32px a card and the whole +126px of /dev/amirnet/levels.
    expect(CODE).toMatch(/<div className="mt-1 flex items-baseline justify-between gap-3">\s*<p className="text-sm text-ink-muted">\{row\.descHe\}<\/p>\s*<p className="shrink-0[^"]*">\{OPEN_LABEL_HE\}<\/p>/);
  });
});
