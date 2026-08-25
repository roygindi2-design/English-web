import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/StoryScreen.tsx', 'utf8');

describe('T-186 — the screen the render binds', () => {
  it('carries the three header strings verbatim', () => {
    expect(SRC).toContain('העולם · סיפורים');
    expect(SRC).toContain('סיפור ברמה שלך · הקש על מילה מודגשת לתרגום');
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
