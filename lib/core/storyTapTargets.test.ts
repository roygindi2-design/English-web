import { describe, expect, it } from 'vitest';
import {
  buildStorySegments,
  FUNCTION_WORD_FLOOR,
  normalizeWord,
  type StoryGloss,
} from './storyTapTargets';

const BODY = 'Every morning Maya walks to the old library near the river.';
const GLOSSES = new Map<string, StoryGloss>([
  ['library', { translationHe: 'סִפְרִיָּה', posHe: 'שם עצם' }],
  ['river', { translationHe: 'נָהָר', posHe: 'שם עצם' }],
  ['morning', { translationHe: 'בֹּקֶר', posHe: 'שם עצם' }],
]);

describe('36 § 3.1 — only content words that HAVE a translation', () => {
  const segments = buildStorySegments(BODY, GLOSSES, new Set(['river']));
  const targets = segments.filter((s) => s.isTarget).map((s) => s.text.trim());

  it('⛔ of · the · a · to are never targets', () => {
    for (const w of ['to', 'the', 'a', 'of']) expect(targets).not.toContain(w);
  });

  it('a word we cannot translate is simply not a target — ⛔ and there is no «no translation» state', () => {
    expect(targets).not.toContain('walks');
    expect(targets).not.toContain('Maya');
  });

  it('every target has a Hebrew translation behind it', () => {
    expect(targets.sort()).toEqual(['library', 'morning', 'river'].sort());
  });

  it('a word the learner marked ידעתי is marked known, ⛔ and a new word is marked nothing', () => {
    expect(segments.find((s) => s.text.trim() === 'river')?.isKnown).toBe(true);
    expect(segments.find((s) => s.text.trim() === 'library')?.isKnown).toBe(false);
  });

  it('⛔ the segments rejoin to the ORIGINAL body — an off-by-one here respaces the paragraph', () => {
    expect(segments.map((s) => s.text).join('')).toBe(BODY);
  });
});

/**
 * ⛔ The mirror is only safe while it IS a mirror. `FUNCTION_WORD_FLOOR` is duplicated
 * from `scripts/story-tap-audit.mjs` because that file is `.mjs` for the Playwright
 * harness; this test is what stops the two copies drifting apart in silence.
 */
describe('the mirrored floor agrees with the judge, word for word', () => {
  it('holds exactly the same words as scripts/story-tap-audit.mjs', async () => {
    const audit = await import('../../scripts/story-tap-audit.mjs');
    expect([...FUNCTION_WORD_FLOOR].sort()).toEqual([...audit.FUNCTION_WORD_FLOOR].sort());
  });

  it('normalises a word exactly the way the judge does', async () => {
    const audit = await import('../../scripts/story-tap-audit.mjs');
    for (const w of ['The', 'to,', 'river.', "don't", '“quiet”', 'Maya']) {
      expect(normalizeWord(w)).toBe(audit.normalizeWord(w));
    }
  });
});
