import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  EMPTY_BODY_HE,
  EMPTY_TITLE_HE,
  HEADING_HE,
  KICKER_HE,
  PERFORMANCE_HEADING_HE,
  PRACTICE_HREF,
  TO_PRACTICE_HE,
} from './AmirnetDashboard';
import { withoutComments } from '@/lib/testSource';

/** Comments stripped — these rules are about what a LEARNER is shown, ⛔ not about the prose. */
const CODE = withoutComments(readFileSync('components/AmirnetDashboard.tsx', 'utf8'));

describe('AmirnetDashboard — T-291, render kol-D-02-dashboard.png', () => {
  it('the binding strings, verbatim from the render (render_video_D.py:22, :63, :67)', () => {
    expect(KICKER_HE).toBe('העולם · אמירנט');
    expect(HEADING_HE).toBe('סימולציות אמירנט');
    expect(PERFORMANCE_HEADING_HE).toBe('ביצועים לפי סוג שאלה');
  });

  it('⛔ no score estimate, ⛔ no 50–150 meter, ⛔ no XP, coin, streak or leaderboard (41 § 9.2 · D-050)', () => {
    // The render draws all of these (score_dial :45-59, :66). They are Roy's heuristic, ⛔ not ours.
    for (const banned of ['אומדן ציון', 'נקודות', 'פטור', 'XP', 'רצף', 'מטבע', 'מובילים', '150']) {
      expect(CODE, banned).not.toContain(banned);
    }
  });

  it('⛔ draws only — no arithmetic, no filter/reduce/sort, no fetch, no database', () => {
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(|\.sort\(/);
    expect(CODE).not.toMatch(/fetch\(|apiGet|apiPost|supabase|word_progress/);
    expect(CODE).not.toMatch(/correct\s*\/\s*answered/);
  });

  it('⛔ never shows a percentage for a type with no answers — successPct null is the guard', () => {
    expect(CODE.match(/card\.successPct === null \? null :/g)).toHaveLength(2);
    expect(CODE).not.toMatch(/successPct \?\? 0|successPct \|\| 0/);
  });

  it('the empty state is a written SENTENCE plus a way out — ⛔ not «—» and ⛔ not 0% (ⓓ)', () => {
    expect(EMPTY_TITLE_HE).toContain('עדיין לא תרגלת');
    expect(EMPTY_BODY_HE.length).toBeGreaterThan(40);
    expect(TO_PRACTICE_HE).toBe('לתפריט התרגול');
    // `hasAnswers`, ⛔ never `cards.length`: three cards and zero answers is the day-one learner.
    expect(CODE).toMatch(/\{!hasAnswers \?/);
    expect(CODE).not.toMatch(/cards\.length === 0/);
    expect(CODE).not.toContain('—');
  });

  it('the weakness strip is drawn ⛔ only when the core handed one over — ⛔ never guessed here', () => {
    expect(CODE).toMatch(/\{weakness !== null &&/);
    // ⛔ No local fallback: a `?? cards[0]` here would reintroduce exactly the guess weakestType refuses.
    expect(CODE).not.toMatch(/weakness \?\?|weakness \|\|/);
  });

  it('the strip carries an ICON and WORDS, so the state is ⛔ never colour alone (palette.ts)', () => {
    expect(CODE).toMatch(/<CrossMarkIcon \/>/);
    expect(CODE).toMatch(/\{weakness\.titleHe\}/);
    expect(CODE).toMatch(/\{weakness\.adviceHe\}/);
    // Inline SVG, ⛔ never a character or an emoji (constitution § 6).
    expect(CODE).toMatch(/<svg[\s\S]*aria-hidden="true"/);
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}]/u);
  });

  it('the strip LINKS to the practice menu with the weak type already chosen (ⓒ)', () => {
    expect(PRACTICE_HREF).toBe('/world/amirnet/practice');
    expect(CODE).toMatch(/href=\{`\$\{PRACTICE_HREF\}\?type=\$\{weakness\.type\}`\}/);
  });

  it('every tappable thing clears the 44px floor — the strip is a link, ⛔ not a band (layer A)', () => {
    for (const m of CODE.matchAll(/<Link[\s\S]*?className="([^"]*)"/g)) {
      expect(m[1], m[1]).toContain('min-h-touch');
    }
  });

  it('ⓐ ONE tabs component, with `דשבורד` active — ⛔ no second bar (T-291ⓐ)', () => {
    expect(CODE).toMatch(/<AmirnetTabs active="dashboard" built=\{AMIRNET_BUILT_TABS\} \/>/);
    expect(CODE.match(/<AmirnetTabs/g)).toHaveLength(1); // ⛔ drawn once, ⛔ never a second bar
    // ⛔ never a literal here: the walk measured every other screen calling this one «טרם»
    // after it was built. AmirnetTabs owns the list.
    expect(CODE).not.toMatch(/built=\{\[/);
  });

  it('the three bars take the SHARED tint table — ⛔ not a second copy (F-138 class)', () => {
    expect(CODE).toMatch(/TYPE_BAR_CLASS\[card\.type\]/);
    expect(CODE).not.toMatch(/bg-brand-surface'?,?\s*\n\s*rs:/);
  });

  it('the English type name travels inside <EnWord> — ⛔ never a bare English run (T-009)', () => {
    expect(CODE).toMatch(/<EnWord>\{card\.nameEn\}<\/EnWord>/);
  });

  it('⟦T-492⟧ the type cards are py-3 with a 10px gap — ⛔ p-4, which cut the weakness card at 375×812', () => {
    // Measured C-0819: +62px at 375×812. check:mobile measures the pixels; this guards the shape.
    expect(CODE).toMatch(/className="rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3"/);
    expect(CODE).toMatch(/<ul className="mt-3 space-y-2\.5">/);
  });
});
