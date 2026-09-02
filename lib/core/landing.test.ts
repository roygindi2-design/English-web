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

  it('does not flag a term that merely matches the unescaped wildcard (F-017)', () => {
    // Verified in the finding: the old regex escaped only the FIRST dot, so the
    // second one stayed a regex wildcard and "the A.Ix thing" matched — blocking
    // valid copy at build time.
    expect(forbiddenTermsIn('the A.Ix thing')).toEqual([]);
    expect(forbiddenTermsIn('שיווק עם A.I. בכותרת')).toContain('A.I.');
    for (const near of ['A.Ix', 'A.IX', 'A.Ident', 'USA.I.', 'xA.I.'])
      expect(forbiddenTermsIn(near), `${near} is not the forbidden term`).toEqual([]);
  });

  it('still catches the dotless "A.I" spelling the wildcard used to catch by accident', () => {
    // Escaping the trailing dot strictly is the OTHER half of F-017: it would
    // have silently stopped catching the spelling Hebrew marketing copy actually
    // uses, and R-011-forbidden copy would have shipped green.
    for (const copy of ['ה-A.I שלנו', 'A.I בעברית', 'לומדים עם A.I', 'A.I?', 'A.I, ואז'])
      expect(forbiddenTermsIn(copy), `missed A.I in "${copy}"`).toContain('A.I.');
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
  it('has real content now that a licensed Hebrew source has been ingested (T-034 · F-012)', () => {
    // Empty from T-027 until 2026-08-16 (R-005) — the array is generated from
    // the content bank as of T-034; see lib/core/previewCards.generated.ts.
    expect(PREVIEW_CARDS.length).toBeGreaterThan(0);
    expect(hasPreviewContent()).toBe(true);
    expect(landingPreviewCard()).not.toBeNull();
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

describe('preview content has landed (F-012)', () => {
  it('has preview content', () => {
    expect(hasPreviewContent()).toBe(true);
  });

  it('returns a card from the landing helper', () => {
    expect(landingPreviewCard()).not.toBeNull();
  });

  it('every shipped card is attributed', () => {
    for (const card of PREVIEW_CARDS) expect(isAttributedCard(card)).toBe(true);
  });

  it('no card option sells the technology (R-011)', () => {
    for (const card of PREVIEW_CARDS) {
      expect(forbiddenTermsIn([card.headword, ...card.options].join(' '))).toEqual([]);
    }
  });

  it('the placeholder marker is gone from the source', () => {
    const source = readFileSync('lib/core/landing.ts', 'utf8');
    expect(source).not.toContain('TODO:CONTENT-PLACEHOLDER');
  });

  it('the landing page no longer calls the slot empty', () => {
    const source = readFileSync('app/page.tsx', 'utf8');
    expect(source).not.toContain('TODO:CONTENT-PLACEHOLDER');
    expect(source).not.toContain('the array is empty on purpose');
  });
});
