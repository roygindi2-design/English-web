import { describe, expect, it } from 'vitest';
import {
  BLANK_TOKEN, SENTENCE_OPTION_COUNT, buildSentenceItems, isUsableCandidate, leaksAnswer,
  usableDistractors, type SentenceCandidate,
} from './sentenceItem';

const alter: SentenceCandidate = {
  wordId: '11111111-1111-4111-8111-111111111111',
  headword: 'alter',
  cefrProfileBand: 'A1',
  stems: [{ itemIndex: 0, stem: 'The workers had to ____ the design after the first test.' }],
  distractors: [
    { text: 'repair', relationType: 'semantic' },
    { text: 'measure', relationType: 'semantic' },
    { text: 'later', relationType: 'orthographic' },
    { text: 'window', relationType: 'unrelated' },
  ],
};

describe('sentenceItem', () => {
  it('כל פריט נושא את החסר ו⛔ אינו מדליף את התשובה', () => {
    const [item] = buildSentenceItems([alter], 7, 10);
    expect(item?.stem).toContain(BLANK_TOKEN);
    expect(item?.stem.toLowerCase()).not.toMatch(/\balter\b/);
    expect(item?.answer).toBe('alter');
  });

  it('ארבע אפשרויות, כולן אנגלית, והתשובה ביניהן', () => {
    const [item] = buildSentenceItems([alter], 7, 10);
    const options = item?.options ?? [];
    expect(options).toHaveLength(SENTENCE_OPTION_COUNT);
    expect(options).toContain('alter');
    expect(new Set(options).size).toBe(SENTENCE_OPTION_COUNT);
    // D-087 בהיפוך: ⛔ אף אפשרות עברית. טווח עברית ב-Unicode.
    for (const option of options) expect(option).not.toMatch(/[֐-׿]/);
  });

  it('D-023 — near_synonym ⛔ אינו הופך לאפשרות', () => {
    const shady: SentenceCandidate = { ...alter, distractors: [
      { text: 'change', relationType: 'near_synonym' },
      ...alter.distractors.slice(0, 3),
    ] };
    const [item] = buildSentenceItems([shady], 7, 10);
    expect(item?.options).not.toContain('change');
    expect(usableDistractors(shady)).not.toContain('change');
  });

  it('פחות משלושה מסיחים כשירים ⇒ המועמד יורד, ⛔ ולא פריט עם שתי אפשרויות', () => {
    const thin: SentenceCandidate = { ...alter, distractors: alter.distractors.slice(0, 2) };
    expect(isUsableCandidate(thin)).toBe(false);
    expect(buildSentenceItems([thin], 7, 10)).toHaveLength(0);
  });

  it('גזע שמדליף את התשובה יורד, ⛔ ואינו מוצג', () => {
    expect(leaksAnswer('We alter the ____ plan.', 'alter')).toBe(true);
    expect(leaksAnswer('The workers had to ____ it.', 'alter')).toBe(false);
    const leaky: SentenceCandidate = { ...alter, stems: [{ itemIndex: 0, stem: 'We alter the ____ plan.' }] };
    expect(buildSentenceItems([leaky], 7, 10)).toHaveLength(0);
  });

  it('גזע בלי החסר ⛔ אינו הופך לפריט', () => {
    const blankless: SentenceCandidate = { ...alter, stems: [{ itemIndex: 0, stem: 'The workers had to decide.' }] };
    expect(buildSentenceItems([blankless], 7, 10)).toHaveLength(0);
  });

  it('אותו seed ⇒ אותו סדר, ⛔ תמיד', () => {
    expect(buildSentenceItems([alter], 7, 10)[0]?.options)
      .toEqual(buildSentenceItems([alter], 7, 10)[0]?.options);
  });

  it('limit חותך, ⛔ ואינו מחזיר יותר ממה שנתבקש', () => {
    const many: SentenceCandidate = { ...alter, stems: [
      { itemIndex: 0, stem: 'The workers had to ____ the design.' },
      { itemIndex: 1, stem: 'She asked them to ____ it again.' },
      { itemIndex: 2, stem: 'They will ____ the plan tomorrow.' },
    ] };
    expect(buildSentenceItems([many], 7, 2)).toHaveLength(2);
    expect(buildSentenceItems([many], 7, 10)).toHaveLength(3);
  });
});
