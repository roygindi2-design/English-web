import { describe, expect, it } from 'vitest';
import { buildGoldSet } from './senseGold';
import {
  buildSecondSourceIndex,
  crossValidate,
  isCrossValidationCandidate,
  tallyCrossValidation,
  verdictFor,
} from './translationConfidence';

const SECOND = buildSecondSourceIndex([
  { en: 'run', he: 'לרוץ' },
  { en: 'Run', he: 'ריצה' },
  { en: 'bank', he: 'בנק' },
]);

describe('isCrossValidationCandidate — D-055 governs `!` records and nothing else', () => {
  it('accepts a bang-prefixed gloss', () => {
    expect(isCrossValidationCandidate('!לרוץ')).toBe(true);
  });

  it('rejects a plain gloss — it was never low, and must not be downgraded', () => {
    expect(isCrossValidationCandidate('לרוץ')).toBe(false);
  });

  it('rejects a GAP record — it is not a translation at all (D-025)', () => {
    expect(isCrossValidationCandidate('GAP!')).toBe(false);
  });
});

describe('verdictFor — the four rules of D-055', () => {
  it('rule 2 — the second source carries the same gloss ⇒ medium, verified', () => {
    expect(verdictFor('run', 'לרוץ', SECOND)).toEqual({
      confidence: 'medium',
      verified: true,
      route: 'second_agrees',
    });
  });

  it('rule 3 — the second source covers the lemma but not this gloss ⇒ stays low', () => {
    expect(verdictFor('bank', 'גדה', SECOND)).toEqual({
      confidence: 'low',
      verified: false,
      route: 'second_disagrees',
    });
  });

  it('rule 4 — the second source does not cover the lemma ⇒ stays low. Absence of evidence is not evidence', () => {
    expect(verdictFor('zzzz', 'משהו', SECOND)).toEqual({
      confidence: 'low',
      verified: false,
      route: 'second_silent',
    });
  });

  it('no second source at all ⇒ stays low, and says so in its own route', () => {
    expect(verdictFor('run', 'לרוץ', null)).toEqual({
      confidence: 'low',
      verified: false,
      route: 'no_second_source',
    });
  });

  it('matches on the NORMALISED lemma — case and spacing never decide', () => {
    expect(verdictFor('  RUN ', 'ריצה', SECOND).route).toBe('second_agrees');
  });

  it('matches Hebrew with niqqud against the same gloss without it', () => {
    const second = buildSecondSourceIndex([{ en: 'run', he: 'לָרוּץ' }]);
    expect(verdictFor('run', 'לרוץ', second).route).toBe('second_agrees');
  });
});

describe('crossValidate — the raw-gloss entry point', () => {
  it('strips the bang and routes exactly as verdictFor does', () => {
    expect(crossValidate('run', '!לרוץ', SECOND).route).toBe('second_agrees');
  });

  it('⛔ throws on a gloss D-055 does not govern, instead of silently downgrading it', () => {
    expect(() => crossValidate('run', 'לרוץ', SECOND)).toThrow(RangeError);
  });
});

describe('tallyCrossValidation', () => {
  const gold = buildGoldSet(['run\t!לרוץ', 'bank\t!גדה', 'zzzz\t!משהו', 'run\tריצה'].join('\n'));

  it('counts every `!` gloss in the gold set and no other', () => {
    expect(tallyCrossValidation(gold, SECOND).candidates).toBe(3);
  });

  it('routes each candidate to exactly one bucket, and the buckets sum to candidates', () => {
    const t = tallyCrossValidation(gold, SECOND);
    expect(t.upgraded + t.disagreed + t.uncovered + t.noSecondSource).toBe(t.candidates);
    expect(t).toMatchObject({ upgraded: 1, disagreed: 1, uncovered: 1, noSecondSource: 0 });
  });

  it('with no second source, every candidate lands in noSecondSource and none is upgraded', () => {
    const t = tallyCrossValidation(gold, null);
    expect(t).toMatchObject({ candidates: 3, upgraded: 0, noSecondSource: 3 });
  });
});

describe('⛔ D-055 — a language model is never a validation source', () => {
  it('names no model anywhere in the module', async () => {
    const src = await import('node:fs').then((fs) =>
      fs.readFileSync('lib/core/translationConfidence.ts', 'utf8'),
    );
    expect(src.toLowerCase()).not.toMatch(/\bllm\b|\bgpt\b|openai|anthropic|\bclaude\b/);
  });
});
