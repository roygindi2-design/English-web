import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { RESULT_TITLE_HE } from './AmirnetResult';
import {
  BACK_TO_DASHBOARD_HE,
  CHAPTER_BREAKDOWN_HE,
  EMPTY_RUN_HE,
  NO_WEAKNESS_HE,
  WEAKNESS_ADVICE_HE,
  resultRows,
  runWeakness,
  type AmirnetChapterOutcome,
} from '@/lib/core/amirnetResult';
import { withoutComments } from '@/lib/testSource';

/** Comments stripped — these rules are about what a LEARNER is shown, ⛔ not about the prose. */
const CODE = withoutComments(readFileSync('components/AmirnetResult.tsx', 'utf8'));

/** The render's own run, transcribed from `render_video_D.py:325-326`, minus its last chapter. */
const FIVE_CHAPTER_RUN: readonly AmirnetChapterOutcome[] = [
  { chapterIndex: 0, correct: 4, answered: 4, elapsedSeconds: 186 },
  { chapterIndex: 1, correct: 3, answered: 4, elapsedSeconds: 216 },
  { chapterIndex: 2, correct: 3, answered: 5, elapsedSeconds: 852 },
  { chapterIndex: 3, correct: 2, answered: 3, elapsedSeconds: 324 },
  { chapterIndex: 4, correct: 2, answered: 3, elapsedSeconds: 348 },
];

describe('AmirnetResult — T-298, render kol-D-07-result.png', () => {
  it('a run of five chapters renders FIVE rows and ⛔ never a «—» row', () => {
    expect(() => resultRows(FIVE_CHAPTER_RUN)).not.toThrow();
    expect(resultRows(FIVE_CHAPTER_RUN)).toHaveLength(5);
    expect(JSON.stringify(resultRows(FIVE_CHAPTER_RUN))).not.toContain('—');
    // ⛔ And the SCREEN maps what the core returned — ⛔ never the six chapters that exist.
    expect(CODE).toContain('resultRows(outcomes)');
    expect(CODE).toContain('rows.map(');
    expect(CODE).not.toContain('AMIRNET_CHAPTERS');
  });

  it('the binding strings, verbatim from the render (render_video_D.py:313, :318, :344)', () => {
    expect(RESULT_TITLE_HE).toBe('הסימולציה הסתיימה');
    expect(CHAPTER_BREAKDOWN_HE).toBe('פירוט לפי פרק');
    expect(WEAKNESS_ADVICE_HE).toBe('לתרגול ממוקד בסוג הזה');
  });

  it('⛔ decides nothing — every row, total and judgement comes from lib/core', () => {
    for (const fn of [
      'resultRows(',
      'runWeakness(',
      'runCorrectShortHe(',
      'runTimeHe(',
      'chaptersDoneShortHe(',
      'shortRunNoticeHe(',
    ]) {
      expect(CODE, fn).toContain(fn);
    }
    // ⛔ No arithmetic, ⛔ no folding and ⛔ no sorting in the component.
    expect(CODE).not.toMatch(/\breduce\(|\bsort\(|\bfilter\(|\/\s*60|Math\./);
    expect(CODE).not.toMatch(/fetch\(|apiGet|apiPost|supabase|word_progress/);
  });

  it('⛔ NO score, ⛔ no score estimate, ⛔ no 50–150 dial and ⛔ no «עלית N נקודות» (ⓒ)', () => {
    for (const banned of ['אומדן', 'ציון', 'נקודות', 'נקוד', 'פטור', 'עלית', '134', '150']) {
      expect(CODE, banned).not.toContain(banned);
    }
    // ⛔ Word boundaries, ⛔ not substrings: a bare `xp` matches «e**xp**ort» and passes nothing.
    expect(CODE).not.toMatch(/\bscore|\bdial\b|\bstreak\b|\bcombo\b|\bcoin\b|leaderboard|\bxp\b/i);
  });

  it('⛔ no time-based scoring — the minutes are a FACT `41 § 7` asks for (R-020)', () => {
    // The screen prints what was measured and ⛔ derives no rate, bonus or multiplier from it.
    expect(CODE).toContain('{row.timeHe}');
    expect(CODE).not.toMatch(/perMinute|rate|bonus|multiplier|מהירות/i);
  });

  it('the weakest type is chosen in ONE place, and the link carries it preselected (ⓑ)', () => {
    expect(CODE).toContain('${AMIRNET_TAB_HREF.practice}?type=${weakness.type}');
    // ⛔ The component ⛔ never compares the three types itself.
    expect(CODE).not.toContain('weakestType');
    expect(runWeakness(FIVE_CHAPTER_RUN)?.type).toBe('rc');
  });

  it('⛔ a run that reached only one type gets ⛔ NO weakness, and still has a way on', () => {
    expect(runWeakness(FIVE_CHAPTER_RUN.slice(0, 1))).toBeNull();
    expect(NO_WEAKNESS_HE).toBe('אין סוג אחד חלש בריצה הזאת');
    expect(CODE).toContain('{NO_WEAKNESS_HE}');
    expect(CODE).toContain('{PRACTICE_ALL_HE}');
  });

  it('every tappable carries the 44px floor, and ⛔ nothing uses h-screen', () => {
    // ⛔ Split on the tag, ⛔ not a `<Link…>` regex: a lazy match ends early on the `>` inside
    // a template literal, which is exactly the false green this assertion exists to avoid.
    const links = CODE.split('<Link').slice(1).map((l) => l.split('</Link>')[0] ?? '');
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const link of links) expect(link, link.slice(0, 90)).toContain('min-h-touch');
    expect(CODE).not.toContain('h-screen');
  });

  it('⛔ no hex literal and ⛔ no rgb — product tokens only (36 § 14, palette.ts)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/rgba?\(/);
  });

  it('the radii are the five-value scale only — ⛔ no 14 and ⛔ no 20 (D-102)', () => {
    const radii = [...CODE.matchAll(/rounded-(\[[^\]]+\]|[a-z0-9]+)/g)].map((m) => m[1]);
    expect(radii.length).toBeGreaterThan(0);
    for (const r of radii) expect(['md', 'lg', 'xl', '2xl', 'full'], r).toContain(r);
  });

  it('every coloured fraction says its standing IN WORDS — state is ⛔ never colour alone', () => {
    expect(CODE).toContain('{`${row.correctHe}, ${row.standingHe}`}');
    expect(CODE).toContain('sr-only');
    expect(CODE).toContain('tabular-nums');
    expect(CODE).toContain('dir="ltr"');
    const rows = resultRows(FIVE_CHAPTER_RUN);
    for (const row of rows) expect(row.standingHe, row.positionHe).not.toBe('');
  });

  it('⛔ the amber the render draws is ⛔ not built — it has ⛔ no token (amirnetTypeBar)', () => {
    expect(CODE).not.toMatch(/amber|warning|yellow/i);
    // The three standings use ink and status tokens, and ⛔ nothing else.
    expect(CODE).toMatch(/text-success/);
    expect(CODE).toMatch(/text-danger/);
  });

  it('the interrupted and empty runs are written SENTENCES with a way out, ⛔ not «—»', () => {
    expect(EMPTY_RUN_HE).toBe('לא הושלם אף פרק בסימולציה הזאת');
    expect(BACK_TO_DASHBOARD_HE).toBe('חזרה לדשבורד');
    expect(CODE).toContain('{EMPTY_RUN_HE}');
    expect(CODE).toContain('{BACK_TO_DASHBOARD_HE}');
    expect(CODE).not.toContain('—');
  });

  it('⛔ no animation to reduce (check:motion) — the render staggers the rows, the screen ⛔ does not', () => {
    expect(CODE).not.toMatch(/transition-|animate-|duration-\d|motion-safe/);
  });

  it('⛔ builds no second tabs bar and ⛔ no second weakness component (constitution § 6)', () => {
    expect(CODE).not.toContain('role="tablist"');
    expect(CODE).toContain("from '@/components/AmirnetTabs'");
  });
});
