import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CHOOSE_TYPE_HE,
  HEADING_HE,
  NO_ADAPTIVITY_HE,
  PICK_LEVEL_FIRST_HE,
} from './AmirnetPracticeMenu';
import { withoutComments } from '@/lib/testSource';

/** Comments stripped — these rules are about what a LEARNER is shown, ⛔ not about the prose. */
const CODE = withoutComments(readFileSync('components/AmirnetPracticeMenu.tsx', 'utf8'));

describe('AmirnetPracticeMenu — T-286, render kol-D-03-practice-menu.png', () => {
  it('the binding strings, verbatim from the render (render_video_D.py:104-105, :128, :125)', () => {
    expect(HEADING_HE).toBe('תרגול ממוקד');
    expect(CHOOSE_TYPE_HE).toBe('בחר סוג שאלות לתרגול');
    expect(NO_ADAPTIVITY_HE).toBe('הרמה נבחרת ידנית · אין כאן אדפטיביות');
    for (const s of ['רמת קושי', 'תרגל']) expect(CODE).toContain(s);
  });

  it('⛔ opens nothing until BOTH choices exist — practiceReady is the only gate (41 § 7)', () => {
    expect(CODE).toMatch(/const ready = practiceReady\(card\.type, level\)/);
    expect(CODE).toMatch(/if \(ready\) onStart\?\.\(card\.type, level as AmirnetLevel\);/);
    expect(PICK_LEVEL_FIRST_HE).toContain('בחר רמת קושי');
  });

  it('⛔ ONE start affordance, exactly as the render draws it (taste-skill § 4.5)', () => {
    // `תרגל` is a start. A second control carrying the same word is the same intent twice.
    expect(CODE.match(/\{PRACTISE_HE\}/g)).toHaveLength(1);
  });

  it('the disabled start says WHY in words, ⛔ not by going grey (layer A)', () => {
    expect(CODE).toMatch(/aria-disabled=\{!ready\}/);
    expect(CODE).toMatch(/level === null && .*PICK_LEVEL_FIRST_HE/s);
  });

  it('the four level chips sit in ONE row, as the render draws them (:129-139)', () => {
    expect(CODE).toMatch(/grid grid-cols-4/);
    expect(CODE).not.toMatch(/flex flex-wrap gap-2/);
  });

  it('⛔ draws only — no arithmetic, no filter/reduce/sort, no fetch, no database', () => {
    expect(CODE).not.toMatch(/\.filter\(|\.reduce\(|\.sort\(/);
    expect(CODE).not.toMatch(/fetch\(|apiGet|apiPost|supabase|word_progress/);
    expect(CODE).not.toMatch(/correct\s*\/\s*answered/);
  });

  it('⛔ never shows a percentage for a type with no answers — successPct null is the guard', () => {
    expect(CODE).toMatch(/card\.successPct === null \? null :/);
    expect(CODE).not.toMatch(/successPct \?\? 0|successPct \|\| 0/);
  });

  it('⛔ no score estimate, no 50–150 meter, no XP, no streak (41 § 9.2 · D-050)', () => {
    for (const banned of ['אומדן ציון', 'נקודות', 'XP', 'רצף', 'מטבע', 'פטור']) {
      expect(CODE, banned).not.toContain(banned);
    }
  });

  it('every tap target carries the 44px floor — the render 24/32px do not survive (36 § 14.4)', () => {
    // ⛔ Not a `<button…>` regex: an arrow function inside the tag carries a `>` of its own
    // and truncates the match before `className` ever appears. Split on the element instead.
    const buttons = CODE.split('<button').slice(1).map((b) => b.split('</button>')[0] ?? '');
    expect(buttons.length).toBeGreaterThanOrEqual(2); // the card start + the level chip
    for (const b of buttons) expect(b, b.slice(0, 80)).toMatch(/min-h-touch/);
  });

  it('selection and disabled state are never colour alone — ARIA carries both', () => {
    // The chosen level is `aria-pressed`; the not-yet-startable card is `aria-disabled`
    // AND carries the written reason. ⛔ Neither state is a colour and nothing else.
    expect(CODE).toMatch(/aria-pressed=\{on\}/);
    expect(CODE).toMatch(/aria-disabled=\{!ready\}/);
  });

  it('⛔ uses no status token as a category colour — --danger stays the incorrect state', () => {
    expect(CODE).not.toMatch(/bg-danger|text-danger|border-danger|bg-success|text-success/);
  });

  it('the English type name lives inside <EnWord> — ⛔ never a bare English string', () => {
    expect(CODE).toMatch(/<EnWord>\{card\.nameEn\}<\/EnWord>/);
  });

  it('⛔ adds no second gutter — the layout already owns the product one (T-285ⓓ · D-206)', () => {
    expect(CODE).not.toMatch(/className="[^"]*\bpx-4\b[^"]*"/);
  });
});
