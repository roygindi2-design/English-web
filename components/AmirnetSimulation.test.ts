import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BACK_TO_DASHBOARD_HE,
  HEADING_HE,
  KICKER_HE,
  NO_ITEMS_HE,
} from './AmirnetSimulation';
import {
  CARRY_OVER_NOTICE_HE,
  CHAPTER_TIME_UP_HE,
  FINISH_RUN_HE,
  NEXT_CHAPTER_HE,
  NEXT_QUESTION_HE,
} from '@/lib/core/amirnetSimulation';
import { withoutComments } from '@/lib/testSource';

/** Comments stripped — these rules are about what a LEARNER is shown, ⛔ not about the prose. */
const CODE = withoutComments(readFileSync('components/AmirnetSimulation.tsx', 'utf8'));

describe('AmirnetSimulation — T-296, render kol-D-06-simulation.png', () => {
  it('the binding strings, verbatim from the render (render_video_D.py:22, :288, :290)', () => {
    expect(KICKER_HE).toBe('העולם · אמירנט');
    expect(NEXT_QUESTION_HE).toBe('לשאלה הבאה');
    expect(CARRY_OVER_NOTICE_HE).toBe('אי אפשר להעביר זמן שנותר לפרק הבא');
  });

  it('`41 § 2` rule two is STANDING text on the screen, ⛔ not a comment and ⛔ not a toast', () => {
    expect(CODE).toContain('{CARRY_OVER_NOTICE_HE}');
    // Rendered twice: on the running chapter and on the finished run. ⛔ Never behind a condition
    // that could hide it while a chapter is live.
    expect(CODE.match(/\{CARRY_OVER_NOTICE_HE\}/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('⛔ decides nothing — the clock, the chapter and the transition all come from lib/core', () => {
    for (const fn of [
      'remainingSeconds(',
      'isChapterExpired(',
      'chapterClock(',
      'chapterHeadingHe(',
      'advanceChapter(',
      'advance(',
    ]) {
      expect(CODE, fn).toContain(fn);
    }
    // ⛔ No arithmetic on time in the component: no subtraction of stamps, no /1000, no *60.
    expect(CODE).not.toMatch(/\/\s*1000|\*\s*60|Math\.max|Math\.floor/);
    expect(CODE).not.toMatch(/fetch\(|apiGet|apiPost|supabase|word_progress/);
  });

  it('⛔ has no setInterval that computes state (ⓒ) — the interval moves a timestamp only', () => {
    // ⛔ Same lesson as the button assertion: a lazy `)` closes on the arrow's own `()`.
    const intervals = CODE.split('setInterval(').slice(1).map((c) => c.split(', 1000)')[0] ?? '');
    expect(intervals).toHaveLength(1);
    expect(intervals[0]).toContain('setTickMs');
    // ⛔ The interval ⛔ never touches the simulation state itself.
    expect(intervals[0]).not.toContain('setState');
    expect(intervals[0]).not.toContain('advance');
  });

  it('⛔ no score, ⛔ no score estimate, ⛔ no XP, coin, streak or leaderboard (ⓓ · D-050 · 41 § 9.2)', () => {
    for (const banned of ['אומדן ציון', 'נקודות', 'ניקוד', 'פטור', 'XP', 'רצף', 'מטבע', 'מובילים', '150']) {
      expect(CODE, banned).not.toContain(banned);
    }
    expect(CODE).not.toMatch(/score|streak|combo|leaderboard/i);
  });

  it('⛔ no per-question feedback and ⛔ no correctness channel — an exam grades ⛔ nothing as it lands', () => {
    expect(CODE).not.toMatch(/feedbackFor|verdictHe|correctIndex|isCorrect|נכון/);
  });

  it('⛔ no adaptivity — `advance` is called with the state and a timestamp, ⛔ never an answer', () => {
    expect(CODE).toMatch(/advance\(prev, stamp\)/);
    expect(CODE).not.toMatch(/advance\([^)]*chosen/);
  });

  it('every tappable carries the 44px floor, and ⛔ nothing uses h-screen', () => {
    // ⛔ Split on the tag, ⛔ not a `<button…>` regex: the `=>` inside `onClick` ends a lazy
    // match early, which is exactly the false green this assertion exists to avoid.
    const buttons = CODE.split('<button').slice(1).map((b) => b.split('</button>')[0] ?? '');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    for (const b of buttons) expect(b, b.slice(0, 80)).toContain('min-h-touch');
    expect(CODE).not.toContain('h-screen');
  });

  it('⛔ no hex literal and ⛔ no rgb — product tokens only (36 § 14, palette.ts)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/rgba?\(/);
  });

  it('the radii are the five-value scale only — ⛔ no rounded-lg-14 and ⛔ no arbitrary value', () => {
    const radii = [...CODE.matchAll(/rounded-(\[[^\]]+\]|[a-z0-9]+)/g)].map((m) => m[1]);
    expect(radii.length).toBeGreaterThan(0);
    for (const r of radii) expect(['md', 'lg', 'xl', '2xl', 'full'], r).toContain(r);
  });

  it('the six chapter dots each say what they are IN WORDS — state is ⛔ never colour alone', () => {
    expect(CODE).toContain('aria-label={chapterDotLabelHe(dot, c.index)}');
    expect(CODE).toContain('AMIRNET_CHAPTERS.map');
    /**
     * ⟦`F-236`, 13/09⟧ This line asserted `flex-row-reverse` and CALLED it «chapter 1 rightmost»,
     * which is the shape the render draws — but the class produced the ⛔ opposite, and the test
     * held the defect in place. **Measured live at 375px, ⛔ not argued:** with the old class the
     * dots read chapter 1 at `x=24` and chapter 6 at `x=114` ⇒ progress ran LEFT to RIGHT on an
     * RTL screen; with plain `flex` they read chapter 1 at `x=114` and chapter 6 at `x=24`.
     * ⇒ the document is already `dir="rtl"`, so the row already runs right-to-left and
     * `flex-row-reverse` reverses it a second time. ⛔ The class is now forbidden here.
     */
    expect(CODE).not.toContain('flex-row-reverse');
    expect(CODE).toContain('<ul className="flex items-center gap-2">');
  });

  it('an expired chapter says so in Hebrew as well as in the clock colour', () => {
    expect(CHAPTER_TIME_UP_HE).toBe('הזמן לפרק הזה נגמר');
    expect(CODE).toContain('{CHAPTER_TIME_UP_HE}');
    expect(CODE).toContain('aria-disabled={expired}');
  });

  it('the clock carries its own label, so the number is ⛔ never read from its position', () => {
    expect(CODE).toContain('REMAINING_LABEL_HE');
    expect(CODE).toContain('sr-only');
    expect(CODE).toContain('tabular-nums');
    expect(CODE).toContain('dir="ltr"');
  });

  it('the primary action names what the next press does — three labels, ⛔ never one for all', () => {
    expect(NEXT_QUESTION_HE).not.toBe(NEXT_CHAPTER_HE);
    expect(FINISH_RUN_HE).not.toBe(NEXT_CHAPTER_HE);
    for (const label of ['NEXT_QUESTION_HE', 'NEXT_CHAPTER_HE', 'FINISH_RUN_HE']) {
      expect(CODE, label).toContain(`{${label}`.replace('{', ''));
    }
  });

  it('the empty and finished states are written SENTENCES with a way out, ⛔ not «—»', () => {
    expect(HEADING_HE).toBe('סימולציה');
    expect(NO_ITEMS_HE).toBe('אין פריטים לפרק הזה');
    expect(BACK_TO_DASHBOARD_HE).toBe('חזרה לדשבורד');
    expect(CODE).not.toContain('—');
  });

  it('every English string a learner reads is inside <EnWord> (the RTL invariant)', () => {
    for (const field of ['item.stemEn', 'item.passageEn', 'option']) {
      expect(CODE, field).toMatch(new RegExp(`<EnWord>\\{${field.replace('.', '\\.')}\\}</EnWord>`));
    }
  });

  it('reuses the one tabs bar and ⛔ builds no second one (constitution § 6)', () => {
    expect(CODE).toContain('<AmirnetTabs active="simulation" built={AMIRNET_BUILT_TABS} />');
    expect(CODE).not.toContain('role="tablist"');
  });

  it('⛔ no animation to reduce (ⓔ · check:motion) — the clock is text that updates', () => {
    expect(CODE).not.toMatch(/transition-|animate-|duration-\d|motion-safe/);
  });

  it('the end of the run is announced ONCE — ⛔ never once per render (T-309)', () => {
    // 🔴 The failure this guards: `finished` stays true for every render after the last chapter.
    // An effect without the ref would fire on each of them, and `AmirnetSimulationEntry` writes a
    // completion row on that call ⇒ one evening counted as many (`T-312` reads those rows).
    expect(CODE).toMatch(/announcedRef/);
    expect(CODE).toMatch(/if \(!state\.finished \|\| announcedRef\.current\) return;/);
    expect(CODE).toMatch(/announcedRef\.current = true;/);
  });

  it('⛔ the engine still touches ⛔ no database and derives ⛔ no unlock (T-309ⓑ)', () => {
    for (const banned of [/supabase/i, /\bfetch\(/, /apiPost|apiGet/, /highestUnlocked/]) {
      expect(CODE).not.toMatch(banned);
    }
  });
});
