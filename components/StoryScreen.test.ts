import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/StoryScreen.tsx', 'utf8');
const END = readFileSync('components/StoryEndScreen.tsx', 'utf8');

describe('T-186 — the screen the render binds', () => {
  it('carries the three header strings verbatim', () => {
    expect(SRC).toContain('העולם · סיפורים');
    expect(SRC).toContain('סיפור ברמה שלך · הקש על מילה לתרגום');
  });

  it('marks the paragraph so `check:mobile` can find it (T-183 contract)', () => {
    expect(SRC).toContain('data-story-body');
  });

  it('⛔ never pre-marks a new word — § 4.2יג-ב ⓑ', () => {
    expect(SRC).not.toMatch(/isNew[^\n]*underline|new-word-underline/);
  });

  it('the legend is written, ⛔ not only coloured', () => {
    expect(SRC).toContain('ידועה');
  });

  it('⛔ h-screen is banned; the page is min-h-[100dvh]', () => {
    expect(SRC).not.toContain('h-screen');
    expect(SRC).toContain('min-h-[100dvh]');
  });

  it('⛔ zero database access from a component', () => {
    expect(SRC).not.toContain('@/lib/supabase');
    expect(SRC).not.toMatch(/\bfetch\s*\(/);
  });
});

describe('T-150 — the intro layer states what the learner ALREADY has', () => {
  it('⛔ never «חסרות לך K מילים» — the encouraging sentence is ⛔ not a debt list (T-150ⓒ)', () => {
    expect(SRC).not.toContain('חסרות');
  });

  it('the two numbers are derived at display time, ⛔ not read off a new wire field (T-150ⓐ)', () => {
    expect(SRC).toContain("from '@/lib/core/storyIntro'");
    expect(SRC).toContain('בסיפור הזה ${total} מילים. ${known} מהן אתה כבר מכיר.');
  });

  it('⛔ zero pre-marking: `isKnown` branches EXACTLY once (T-150ⓑ · § 4.2יג-ב ⓑ)', () => {
    expect(SRC.match(/isKnown/g)?.length ?? 0).toBe(1);
  });
});

describe('T-203 — a string that promises what the screen does not do', () => {
  it('⛔ zero «the emphasised word»: nothing on the screen is emphasised, so nothing may say it is', () => {
    // ⛔ The scan reads the SOURCE — a comment quoting the retired string defeats it,
    // which is why neither file quotes it, not even in documentation.
    expect(SRC).not.toContain('מודגשת');
    expect(SRC).toContain('סיפור ברמה שלך · הקש על מילה לתרגום');
  });

  it('⛔ zero «the next story» anywhere: `storyPick` is a DAY index (T-151ⓓ)', () => {
    expect(SRC).not.toContain('הסיפור הבא');
    expect(END).not.toContain('הסיפור הבא');
  });

  it('both phase labels exist, and they name what the button does', () => {
    expect(SRC).toContain('סיימתי לקרוא');
    expect(SRC).toContain('חזרה לעולם');
  });
});
