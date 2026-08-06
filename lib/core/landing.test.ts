import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  FORBIDDEN_MARKETING_TERMS,
  LANDING_HEADLINE,
  LANDING_SUBHEAD,
  LANDING_VALUE_POINTS,
  PREVIEW_CARDS,
  forbiddenTermsIn,
  hasPreviewContent,
  isAttributedCard,
  landingPreviewCard,
} from './landing';

/**
 * T-027 guards. Two things can silently rot on this screen:
 *   1. someone re-adds "adaptive"/"AI" to the marketing copy (R-011 · D-017);
 *   2. someone fills the preview card with a word pair they made up, or copied
 *      from a MAL"O practice exam (R-010 · content rule).
 * Both are invisible in a diff review of a Hebrew page. They are not invisible
 * to these tests.
 */
describe('landing copy — R-011', () => {
  const copy = [LANDING_HEADLINE, LANDING_SUBHEAD, ...LANDING_VALUE_POINTS];

  it('sells three concrete things the learner receives', () => {
    expect(LANDING_VALUE_POINTS).toHaveLength(3);
    for (const point of LANDING_VALUE_POINTS) expect(point.trim().length).toBeGreaterThan(10);
  });

  it('never sells "AI" or "adaptive"', () => {
    for (const line of copy) expect(forbiddenTermsIn(line)).toEqual([]);
  });

  it('catches a forbidden term if one is reintroduced', () => {
    expect(forbiddenTermsIn('לימוד אנגלית אדפטיבי מבוסס AI')).toEqual(
      expect.arrayContaining(['AI', 'אדפטיבי']),
    );
    // "said" / "maintain" must not trip the English-token rule.
    expect(forbiddenTermsIn('MAINTAIN plaid')).toEqual([]);
  });

  it('keeps the rendered screens free of forbidden terms', () => {
    for (const file of ['app/page.tsx', 'app/layout.tsx']) {
      const src = readFileSync(file, 'utf8');
      const hits = FORBIDDEN_MARKETING_TERMS.filter((t) =>
        t === 'AI' || t === 'A.I.' ? false : src.includes(t),
      );
      expect(hits, `${file} sells ${hits.join(', ')}`).toEqual([]);
    }
  });
});

describe('preview card — content provenance', () => {
  it('ships empty while no licensed Hebrew source exists (R-005)', () => {
    expect(PREVIEW_CARDS).toHaveLength(0);
    expect(hasPreviewContent()).toBe(false);
    expect(landingPreviewCard()).toBeNull();
  });

  it('rejects a card with no source attribution', () => {
    const base = { headword: 'x', pos: 'noun', options: ['א', 'ב'], correctIndex: 0 };
    expect(isAttributedCard({ ...base, sourceId: 'ngsl-v1.2' })).toBe(true);
    expect(isAttributedCard({ ...base, sourceId: '  ' })).toBe(false);
    expect(isAttributedCard({ ...base, sourceId: 'ngsl-v1.2', options: ['א'] })).toBe(false);
    expect(isAttributedCard({ ...base, sourceId: 'ngsl-v1.2', correctIndex: 5 })).toBe(false);
    expect(isAttributedCard({ ...base, sourceId: 'ngsl-v1.2', options: ['א', ' '] })).toBe(false);
  });

  it('every card that ever ships carries provenance', () => {
    for (const card of PREVIEW_CARDS) expect(isAttributedCard(card)).toBe(true);
  });
});
