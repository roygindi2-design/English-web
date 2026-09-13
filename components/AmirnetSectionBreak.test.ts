import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  AMIRNET_CHAPTERS,
  CARRY_OVER_NOTICE_HE,
  CLOCK_STARTS_ON_TAP_HE,
  START_CHAPTER_HE,
  chapterBudgetHe,
  chapterHeadingHe,
} from '@/lib/core/amirnetSimulation';

/** Comments stripped — these rules are about what a LEARNER is shown, ⛔ not about the prose. */
const CODE = readFileSync('components/AmirnetSectionBreak.tsx', 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

const RUN = readFileSync('components/AmirnetSimulation.tsx', 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
  .replace(/^\s*\/\/.*$/gm, '');

describe('AmirnetSectionBreak — T-316, the moment between two chapters', () => {
  it('answers the three things the row names: which chapter, what kind, how long', () => {
    expect(CODE).toContain('{chapterHeadingHe(chapterIndex)}');
    expect(CODE).toContain('{typeNameHe(chapter?.type ?? \'\')}');
    expect(CODE).toContain('{chapterBudgetHe(chapterIndex)}');
    // And each is a real sentence for a real chapter, ⛔ not a shape that happens to compile.
    expect(chapterHeadingHe(2)).toBe('פרק 3 מתוך 6');
    expect(chapterBudgetHe(2)).toBe('15 דקות');
  });

  it('⛔ says the clock has ⛔ not started — `T-316`ⓑ, in words and ⛔ not only in the core', () => {
    expect(CODE).toContain('{CLOCK_STARTS_ON_TAP_HE}');
    expect(CLOCK_STARTS_ON_TAP_HE).toBe('השעון מתחיל כשמקישים, ולא כרגע');
  });

  it('ONE action, and its intent is ⛔ not the entry screen\'s (taste-skill § 4.5)', () => {
    expect(CODE.match(/<button/g)).toHaveLength(1);
    expect(CODE).toContain('{START_CHAPTER_HE}');
    expect(START_CHAPTER_HE).toBe('להתחיל את הפרק');
    // ⛔ «סימולציה» is the RUN's intent and belongs to `AmirnetSimulationEntry`.
    expect(START_CHAPTER_HE).not.toContain('סימולציה');
  });

  it('⛔ NO reward, ⛔ no score, ⛔ no comparison with the chapter just left (T-316ⓒ · D-050)', () => {
    for (const banned of ['כל הכבוד', 'מצוין', 'יפה', 'נקודות', 'רצף', 'ציון', 'ניקוד', 'XP']) {
      expect(CODE).not.toContain(banned);
    }
  });

  it('⛔ decides nothing — every fact on the screen comes from lib/core', () => {
    for (const fn of ['chapterAt(', 'chapterBudgetHe(', 'chapterHeadingHe(', 'chapterDotState(']) {
      expect(CODE).toContain(fn);
    }
    // ⛔ No minute count typed onto a screen, and ⛔ no second chapter table.
    expect(CODE).not.toMatch(/\d+ דקות/);
    expect(CODE).not.toContain('seconds / 60');
  });

  it('44px on the only tap target, and ⛔ no fixed width that could scroll at 320px', () => {
    expect(CODE).toContain('min-h-touch w-full');
    expect(CODE).not.toMatch(/\bw-\[\d{3,}px\]/);
    expect(CODE).not.toMatch(/\bmin-w-\[\d{3,}px\]/);
  });

  it('⛔ state is ⛔ never colour alone — every dot carries its own words', () => {
    expect(CODE).toContain('aria-label={chapterDotLabelHe(dot, c.index)}');
    expect(AMIRNET_CHAPTERS).toHaveLength(6);
  });

  it('⛔ chapter 1 is RIGHTMOST — ⛔ no `flex-row-reverse` on an already-RTL row (`F-236`)', () => {
    // Measured live at 375px this tick: with the class, chapter 1 sat at `x=24` and chapter 6 at
    // `x=114`; without it, chapter 1 sits at `x=320` and chapter 6 at `x=230`. ⛔ The document is
    // `dir="rtl"` already, so the class reverses a row that was ⛔ already reversed.
    expect(CODE).not.toContain('flex-row-reverse');
    expect(CODE).toContain('<ul className="mt-5 flex items-center gap-2">');
  });

  it('⛔ NO animation to reduce — `prefers-reduced-motion` (T-316ⓓ · check:motion)', () => {
    for (const banned of ['transition', 'animate-', 'duration-', 'motion-safe', '@keyframes']) {
      expect(CODE).not.toContain(banned);
    }
  });

  it('`41 § 2` rule two stands on this screen too — it is the moment it is about', () => {
    expect(CODE).toContain('{CARRY_OVER_NOTICE_HE}');
    expect(CARRY_OVER_NOTICE_HE).toBe('אי אפשר להעביר זמן שנותר לפרק הבא');
  });

  it('the run screen HANDS OVER to it, and the tap is what starts the chapter', () => {
    expect(RUN).toContain('if (state.atChapterBreak)');
    expect(RUN).toContain('<AmirnetSectionBreak');
    expect(RUN).toContain('startChapter(prev, clockRef.current())');
    // ⛔ And the once-a-second display timer ⛔ does not run behind a screen with no clock on it.
    expect(RUN).toContain('state.finished || state.atChapterBreak');
  });
});
