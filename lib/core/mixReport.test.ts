import { describe, expect, it } from 'vitest';
import { buildTranslationBank, measureMix } from './mixReport';
import type { GeneratedSense } from './contentSchema';

/**
 * Hand-written, because the point of this suite is the SHAPE of the count and ⛔ not
 * the content of data/generated/. The real batch files are asserted against in
 * scripts/measure-mix.test.ts, where they belong (measure-gate.test.ts is the model).
 */
function sense(
  headword: string,
  translationHe: string,
  distractors: readonly { word: string; relationType: GeneratedSense['distractors'][number]['relationType'] }[],
): GeneratedSense {
  return {
    headword,
    pos: 'noun',
    translationHe,
    definitionEn: `definition of ${headword}`,
    examples: { supportive: 'x', neutral: 'y' },
    items: [{ stem: '____', level: null, levelRationale: null }],
    distractors,
  };
}

describe('buildTranslationBank', () => {
  it('keeps only headwords carrying a non-empty translation', () => {
    const bank = buildTranslationBank([
      sense('cat', 'חתול', []),
      sense('dog', '', []),
    ]);
    expect(bank.has('cat')).toBe(true);
    expect(bank.has('dog')).toBe(false);
  });

  it('lowercases, so casing in either field never breaks a resolution', () => {
    const bank = buildTranslationBank([sense('Cat', 'חתול', [])]);
    expect(bank.has('cat')).toBe(true);
  });
});

describe('measureMix', () => {
  it('counts a sense with ≥2 resolved semantic + ≥1 resolved orthographic as full mix', () => {
    const senses: readonly GeneratedSense[] = [
      sense('cat', 'חתול', []),
      sense('kitten', 'גור חתולים', []),
      sense('cot', 'עריסה', []),
      sense('dog', 'כלב', [
        { word: 'cat', relationType: 'semantic' },
        { word: 'kitten', relationType: 'semantic' },
        { word: 'cot', relationType: 'orthographic' },
      ]),
    ];
    const result = measureMix(senses);
    expect(result.rowsRead).toBe(4);
    expect(result.fullMix).toBe(1);
    expect(result.atLeastOneTagged).toBe(1);
  });

  it('counts at-least-one on a single resolved tagged distractor, short of full mix', () => {
    const senses: readonly GeneratedSense[] = [
      sense('cat', 'חתול', []),
      sense('dog', 'כלב', [{ word: 'cat', relationType: 'semantic' }]),
    ];
    const result = measureMix(senses);
    expect(result.fullMix).toBe(0);
    expect(result.atLeastOneTagged).toBe(1);
  });

  it('does not count a tagged distractor whose word has no translation in the bank', () => {
    const senses: readonly GeneratedSense[] = [
      sense('dog', 'כלב', [
        { word: 'unlisted', relationType: 'semantic' },
        { word: 'unlisted', relationType: 'semantic' },
        { word: 'unlisted', relationType: 'orthographic' },
      ]),
    ];
    const result = measureMix(senses);
    expect(result.fullMix).toBe(0);
    expect(result.atLeastOneTagged).toBe(0);
  });

  it('ignores collocational and near_synonym — only semantic and orthographic are D-023 tagged', () => {
    const senses: readonly GeneratedSense[] = [
      sense('cat', 'חתול', []),
      sense('dog', 'כלב', [
        { word: 'cat', relationType: 'collocational' },
        { word: 'cat', relationType: 'near_synonym' },
      ]),
    ];
    const result = measureMix(senses);
    expect(result.fullMix).toBe(0);
    expect(result.atLeastOneTagged).toBe(0);
  });

  it('does not let an unresolved distractor of one type block another sense that IS resolved', () => {
    const senses: readonly GeneratedSense[] = [
      sense('cat', 'חתול', []),
      sense('kitten', 'גור חתולים', []),
      sense('cot', 'עריסה', []),
      sense('dog', 'כלב', [
        { word: 'cat', relationType: 'semantic' },
        { word: 'kitten', relationType: 'semantic' },
        { word: 'cot', relationType: 'orthographic' },
        { word: 'unlisted', relationType: 'orthographic' },
      ]),
    ];
    const result = measureMix(senses);
    expect(result.fullMix).toBe(1);
  });
});
