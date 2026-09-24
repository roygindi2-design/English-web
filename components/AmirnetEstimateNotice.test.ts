import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ESTIMATE_NOTICE_HE } from './AmirnetEstimateNotice';
import { withoutComments } from '@/lib/testSource';

/** Comments stripped — every rule below is about what a LEARNER is shown, ⛔ not about the prose. */
const strip = (path: string): string =>
  withoutComments(readFileSync(path, 'utf8'));

const CODE = strip('components/AmirnetEstimateNotice.tsx');
const RESULT = strip('components/AmirnetResult.tsx');
const DASHBOARD = strip('components/AmirnetDashboard.tsx');

describe('AmirnetEstimateNotice — T-304 · D-218 · 41 § 6.1 items 4-5', () => {
  it('the sentence is D-218 word for word — ⛔ not paraphrased', () => {
    expect(ESTIMATE_NOTICE_HE).toBe(
      'אומדן פנימי לתרגול בלבד. אינו ציון של מאל״ו, ואין לנו זיקה אליו.',
    );
  });

  it('it carries BOTH halves of 41 § 6.1 — item 4 (internal estimate) AND item 5 (⛔ no affiliation)', () => {
    // ⛔ Either half alone passes item 4 or item 5 and fails the other one.
    expect(ESTIMATE_NOTICE_HE).toContain('אומדן פנימי לתרגול בלבד');
    expect(ESTIMATE_NOTICE_HE).toContain('אינו ציון של מאל״ו');
    expect(ESTIMATE_NOTICE_HE).toContain('אין לנו זיקה אליו');
  });

  it('⛔ no em-dash in the copy, and it is two sentences (D-218 item 2)', () => {
    expect(ESTIMATE_NOTICE_HE).not.toMatch(/[—–]/);
    expect(ESTIMATE_NOTICE_HE.match(/\./g)).toHaveLength(2);
  });

  it('⛔ never fine print — text-sm (14px), ⛔ never text-xs, and ⛔ never a tooltip (D-218 item 1)', () => {
    expect(CODE).toContain('text-sm');
    expect(CODE).not.toContain('text-xs');
    expect(CODE).not.toMatch(/title=|tooltip|<details|aria-describedby/);
  });

  it('⛔ draws only — no arithmetic, no state, no fetch, no database', () => {
    expect(CODE).not.toMatch(/useState|useEffect|fetch\(|apiGet|apiPost|supabase/);
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(|\.sort\(|\.map\(/);
  });

  it('ONE constant, ONE component, TWO screens — the string is ⛔ never re-typed at a call site', () => {
    for (const [name, code] of [
      ['AmirnetResult', RESULT],
      ['AmirnetDashboard', DASHBOARD],
    ] as const) {
      expect(code, name).toContain('<AmirnetEstimateNotice />');
      // ⛔ A second literal is the drift `amirnetTypeBar.ts` exists against (constitution § 6).
      expect(code, name).not.toContain('אומדן פנימי');
    }
  });

  it('🔴 it sits ABOVE the numbers on BOTH screens — ⛔ never below them (D-218 item 1)', () => {
    // The result screen: after the title, ⛔ before the `<dl>` that prints «18 מתוך 23».
    const resultNotice = RESULT.indexOf('<AmirnetEstimateNotice />');
    const resultNumbers = RESULT.indexOf('<dl');
    expect(resultNotice).toBeGreaterThan(-1);
    expect(resultNumbers).toBeGreaterThan(-1);
    expect(resultNotice).toBeLessThan(resultNumbers);

    // The dashboard: after the header, ⛔ before «ביצועים לפי סוג שאלה» and its percentages.
    const dashNotice = DASHBOARD.indexOf('<AmirnetEstimateNotice />');
    const dashNumbers = DASHBOARD.indexOf('{PERFORMANCE_HEADING_HE}');
    expect(dashNotice).toBeGreaterThan(-1);
    expect(dashNumbers).toBeGreaterThan(-1);
    expect(dashNotice).toBeLessThan(dashNumbers);
  });

  it('⛔ it does not build the estimate dial — 41 § 9.2 is Roy’s formula, ⛔ not ours', () => {
    for (const banned of ['אומדן ציון', '50–150', 'XP', 'רצף', 'מטבע', 'מובילים']) {
      expect(CODE, banned).not.toContain(banned);
    }
  });
});
