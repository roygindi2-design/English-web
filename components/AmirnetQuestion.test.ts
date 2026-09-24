import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CORRECT_HE, INCORRECT_HE, NO_MORE_ITEMS_HE } from '@/lib/core/amirnetQuestion';
import { HEADING_HE } from './AmirnetQuestion';
import { withoutComments } from '@/lib/testSource';

/**
 * ⚠️ Comments are stripped first, and that is ⛔ not a loophole — the same reasoning as
 * `AmirnetTabs.test.ts`: these rules are about what a LEARNER is shown, and a doc comment that
 * names a banned word in order to explain the ban is the opposite of the defect.
 */
const CODE = withoutComments(readFileSync('components/AmirnetQuestion.tsx', 'utf8'));

describe('AmirnetQuestion — T-287, renders kol-D-04 · kol-D-05', () => {
  it('draws only — ⛔ no fetch and ⛔ no database, ever (RULES: a component never touches the DB)', () => {
    expect(CODE).not.toMatch(/fetch\(|supabase|createRouteClient/);
  });

  it('⟦T-372ⓒ⟧ reports the answer up, ⛔ and still ⛔ never writes it itself', () => {
    // The callback carries the four facts the route needs and ⛔ nothing derived.
    expect(CODE).toMatch(/onAnswered\?\.\(\{/);
    expect(CODE).toMatch(/itemId:\s*item\.id/);
    expect(CODE).toMatch(/correct:\s*verdict\.correct/);
    // ⛔ The write stays the caller's: a fetch here would make every host of this component a
    // writer, the two dev harnesses included.
    expect(CODE).not.toMatch(/fetch\(/);
  });

  it('⟦T-372ⓒ⟧ fires on the CHOICE, ⛔ not on `הבא`, and ⛔ never twice', () => {
    // `answer()` returns early once `answered`, so the guard is what makes «once» true.
    const answerFn = CODE.slice(CODE.indexOf('const answer ='), CODE.indexOf('const advance ='));
    expect(answerFn).toMatch(/if \(answered\) return;/);
    expect(answerFn).toMatch(/onAnswered/);
    const advanceFn = CODE.slice(CODE.indexOf('const advance ='), CODE.indexOf('return ('));
    expect(advanceFn).not.toMatch(/onAnswered/);
  });

  it('⟦T-372ⓒ⟧ ⛔ hands up no response time — R-020 forbids scoring by time outside the arena', () => {
    const answerFn = CODE.slice(CODE.indexOf('const answer ='), CODE.indexOf('const advance ='));
    for (const banned of [/seconds/, /elapsed/, /startedAt:/]) {
      expect(answerFn).not.toMatch(banned);
    }
  });

  it('⛔ recomputes no verdict of its own — the core module decides (one place to be wrong)', () => {
    expect(CODE).toMatch(/feedbackFor\(/);
    expect(CODE).not.toMatch(/===\s*item\.correctIndex|!==\s*item\.correctIndex/);
  });

  it('states correct and incorrect IN WORDS beside the icon — ⛔ never colour alone', () => {
    expect(CODE).toMatch(/verdictHe/);
    expect(CORRECT_HE).toBe('נכון');
    expect(INCORRECT_HE).toBe('לא נכון');
    // An SVG mark, ⛔ not an emoji (constitution, layer A).
    expect(CODE).toMatch(/<svg/);
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}]/u);
  });

  it('⛔ carries no countdown, no deadline and no danger clock (R-020 · D-049 · F-222)', () => {
    expect(CODE).toMatch(/elapsedClock\(/);
    // The render's countdown shape: a remaining-time subtraction or a danger-tinted clock.
    expect(CODE).not.toMatch(/remainingMs|timeLeft|secondsLeft|deadline/i);
    expect(CODE).not.toMatch(/text-danger[^\n]*elapsed|elapsed[^\n]*text-danger/);
  });

  it('⛔ carries no score, XP, currency, streak or leaderboard (D-050)', () => {
    expect(CODE).not.toMatch(/\bxp\b|נקודות|ניקוד|מטבע|רצף|טבלת מובילים/i);
  });

  it('⛔ writes no explanation of its own — an item without one is never served (R-010)', () => {
    expect(CODE).toMatch(/explanationHe/);
    expect(CODE).not.toMatch(/explanationHe\s*(\|\||\?\?)/);
  });

  it('every tap target carries the 44px floor — the render draws options 54px and a 24px button', () => {
    // Two shapes, and BOTH are checked: a literal className on the tag, and the shared helper the
    // option rows go through. Checking only the tag would have passed a helper that dropped it.
    // ⚠️ The tag is matched to its CLOSING tag, ⛔ not to the first `>`: an arrow handler
    // (`onClick={() =>`) contains a `>` and a lazy `<button[\s\S]*?>` stops inside it, which is
    // how this assertion first passed a button it had only half read.
    const buttons = CODE.match(/<button[\s\S]*?<\/button>/g) ?? [];
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) expect(b).toMatch(/min-h-touch|className=\{optionClasses\(/);
    // The helper every option row shares — its base must carry the floor, or none of them do.
    const helper = /function optionClasses\([\s\S]*?\n\}/.exec(CODE);
    expect(helper).not.toBeNull();
    expect(helper?.[0]).toMatch(/min-h-touch/);
  });

  it('⛔ uses no radius outside the five-value scale (D-102) — the render r=14 and r=18 map in', () => {
    const radii = CODE.match(/rounded-\[[^\]]+\]/g) ?? [];
    expect(radii).toEqual([]);
  });

  it('says the queue is spent in words, and offers the way back (T-287ⓓ)', () => {
    expect(CODE).toMatch(/NO_MORE_ITEMS_HE/);
    expect(NO_MORE_ITEMS_HE).toBe('אין עוד פריטים ברמה הזאת');
    expect(CODE).toMatch(/BACK_TO_MENU_HE/);
  });

  it('is Hebrew and RTL; English appears ⛔ only inside <EnText>/<EnWord>', () => {
    expect(HEADING_HE).toBe('תרגול ממוקד');
    expect(CODE).toMatch(/<EnText|<EnWord/);
  });

  it('⛔ runs no interval that computes state — the clock ticks for DISPLAY only', () => {
    // The answer's elapsed time is captured at answer time from a start stamp, ⛔ not accumulated
    // by the interval, so a throttled or backgrounded tab reports the real gap.
    expect(CODE).toMatch(/startedAt/);
  });
});
