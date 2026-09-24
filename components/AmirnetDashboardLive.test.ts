import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FAILURE_HE, SCHEMA_MISSING_HE } from '@/lib/core/failure';
import { failureHe, NOT_A_ZERO_HE, SESSION_EXPIRED_HE } from './AmirnetDashboardLive';
import { withoutComments } from '@/lib/testSource';

/** Comments stripped first — the `AmirnetQuestion.test.ts` reasoning, for the same reason. */
const CODE = withoutComments(readFileSync('components/AmirnetDashboardLive.tsx', 'utf8'));

/**
 * ⚠️ Comments stripped here too, and it is ⛔ not a loophole: the page's header DOCUMENTS the
 * removal of `zeroStats()` by name, and convicting it for saying so is how a guard starts
 * deleting the explanation in order to please itself (`lib/core/failure.test.ts` `markupOnly`).
 */
const PAGE = withoutComments(readFileSync('app/(tabs)/world/amirnet/page.tsx', 'utf8'));

describe('AmirnetDashboardLive — T-372ⓓ', () => {
  it('🔴 the page no longer feeds the dashboard a CONSTANT', () => {
    // This is the row itself: `zeroStats()` in the page made «ביצועים לפי סוג שאלה» report a
    // number the product never collected, and it looked correct because zero is a legal state.
    expect(PAGE).not.toMatch(/zeroStats/);
    expect(PAGE).toMatch(/AmirnetDashboardLive/);
  });

  it('a page never touches the database — the fetch lives in the client component', () => {
    expect(PAGE).not.toMatch(/fetch\(|supabase|createRouteClient/);
    expect(CODE).toMatch(/fetch\('\/api\/amirnet\/practice\/result'\)/);
  });

  it('⛔ does no arithmetic — the pure layer turns stats into the screen', () => {
    expect(CODE).toMatch(/toTypeCards/);
    expect(CODE).toMatch(/weakestCard/);
    expect(CODE).toMatch(/hasAnyAnswers/);
    for (const banned of [/successPct\s*=/, /\.reduce\(/, /Math\.round/]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('⛔ three states, ⛔ not two — «still asking» and «could not ask» are different facts', () => {
    for (const kind of ["'checking'", "'ready'", "'blocked'"]) {
      expect(CODE).toContain(kind);
    }
  });

  it('🔴 a failed read is ⛔ never drawn as «you practised nothing»', () => {
    // The blocked branch prints a sentence; it must ⛔ not fall through to the empty state, which
    // is an assertion about a zero the product did not measure.
    const blocked = CODE.slice(CODE.indexOf("phase.kind === 'checking'"));
    expect(blocked).toMatch(/failureHe\(phase\.code\)/);
    expect(blocked).toMatch(/NOT_A_ZERO_HE/);
    expect(blocked).not.toMatch(/hasAnswers=\{false\}|EMPTY_TITLE_HE/);
  });

  it('reuses the one failure copy — ⛔ no fourth wording, ⛔ no restated retry label', () => {
    expect(failureHe('unavailable')).toBe(FAILURE_HE.load);
    expect(failureHe(undefined)).toBe(FAILURE_HE.load);
    expect(failureHe('schema_missing')).toBe(SCHEMA_MISSING_HE);
    expect(failureHe('session_expired')).toBe(SESSION_EXPIRED_HE);
    // `lib/core/failure.test.ts` scans every screen for the literal; this is the same rule stated
    // where the component can see it.
    expect(`${SESSION_EXPIRED_HE}${NOT_A_ZERO_HE}`).not.toContain('נסה שוב');
  });

  it('every learner-facing string here is Hebrew', () => {
    for (const text of [SESSION_EXPIRED_HE, NOT_A_ZERO_HE]) {
      expect(text).toMatch(/[֐-׿]/);
      expect(text).not.toMatch(/[A-Za-z]/);
    }
  });

  it('🔴 ⛔ the prompt notation ⛔ never ships to a learner', () => {
    // Measured in the STEP 6.5 walk of C-0633, ⛔ not argued: this string shipped as
    // «זה ⛔ לא אומר…» and the walk read it back off the live screen. The registers, the plans and
    // these comments are written in that notation; a string a LEARNER reads is ⛔ not, and the
    // constitution's layer A bans the glyph outright (SVG icons, ⛔ no emoji).
    for (const text of [SESSION_EXPIRED_HE, NOT_A_ZERO_HE, failureHe('unavailable')]) {
      expect(text).not.toMatch(/[⛔🔴⚠️🆕▶️]/u);
    }
  });

  it('the loading branch is a SKELETON, ⛔ not a spinner, and ⛔ carries no animation', () => {
    expect(CODE).toMatch(/CardSkeleton/);
    expect(CODE).toMatch(/rounded-2xl/);
    // `check:motion` — and taste-skill § 6.B: there is nothing here to reduce because there is
    // nothing here that moves.
    for (const banned of [/animate-/, /transition-/, /spin/i]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('⛔ no score, estimate, streak or leaderboard (D-050 · 41 § 9.2)', () => {
    for (const banned of [/\bxp\b/i, /score/i, /streak/i, /leaderboard/i, /rank/i]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('the fetch cannot set state after unmount', () => {
    expect(CODE).toMatch(/let live = true/);
    expect(CODE).toMatch(/live = false/);
  });
});
