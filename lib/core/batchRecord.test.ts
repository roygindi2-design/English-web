import { describe, expect, it } from 'vitest';
import { parseBatchFile, parseBatchRecord } from './batchRecord';

const ROW = {
  headword: 'few',
  pos: 'determiner',
  sense_index: 1,
  definition_en: 'a small number of people or things, not many',
  translation_he: 'מעטים',
  cefr_level: 'A1',
  translation_confidence: 'high',
  examples: { supportive: 'Only a few people are here.', neutral: 'A few students are ready now.' },
  items: ['Only ____ people are at the meeting.'],
  distractors: [{ word: 'much', relation_type: 'semantic' }],
  he_one_to_many_group: null,
  he_interference_note: 'note',
  n_letters: 3,
  n_syllables: 1,
  is_function_word: true,
  spot_check: true,
};

describe('parseBatchRecord', () => {
  it('renames every snake_case field the gate reads', () => {
    const r = parseBatchRecord(ROW);
    expect(r.sense.translationHe).toBe('מעטים');
    expect(r.sense.definitionEn).toBe('a small number of people or things, not many');
    // The one that a bare cast gets wrong and typechecks anyway:
    expect(r.sense.distractors[0]?.relationType).toBe('semantic');
    expect(Object.keys(r.sense.distractors[0] ?? {})).toEqual(['word', 'relationType']);
    // The gate's type carries seven fields and no more. A spread of the row would
    // smuggle n_letters / is_function_word / spot_check in here and typecheck.
    expect(Object.keys(r.sense).sort()).toEqual(
      ['definitionEn', 'distractors', 'examples', 'headword', 'items', 'pos', 'translationHe'],
    );
  });

  it('derives needsHumanReview from confidence — D-024, not a copy of spot_check', () => {
    expect(parseBatchRecord({ ...ROW, translation_confidence: 'low' }).needsHumanReview).toBe(true);
    expect(parseBatchRecord({ ...ROW, translation_confidence: 'medium' }).needsHumanReview).toBe(false);
    expect(parseBatchRecord({ ...ROW, translation_confidence: 'high' }).needsHumanReview).toBe(false);
  });

  it('rejects an unknown pos instead of passing it to the gate', () => {
    expect(() => parseBatchRecord({ ...ROW, pos: 'gerund' })).toThrow(/pos/);
  });

  it('rejects an unknown relation_type', () => {
    expect(() => parseBatchRecord({ ...ROW, distractors: [{ word: 'x', relation_type: 'rhyme' }] })).toThrow(
      /relation_type/,
    );
  });

  it('rejects an unknown cefr_level and an unknown confidence', () => {
    expect(() => parseBatchRecord({ ...ROW, cefr_level: 'B3' })).toThrow(/cefr_level/);
    expect(() => parseBatchRecord({ ...ROW, translation_confidence: 'unsure' })).toThrow(/translation_confidence/);
  });

  it('rejects a missing required field rather than writing undefined to SQL', () => {
    const { translation_he: _drop, ...missing } = ROW;
    expect(() => parseBatchRecord(missing)).toThrow(/translation_he/);
  });

  it('keeps the two nullable Hebrew fields as null, not as the string "null"', () => {
    const r = parseBatchRecord(ROW);
    expect(r.heOneToManyGroup).toBeNull();
    expect(r.heInterferenceNote).toBe('note');
  });

  it('carries the word-level signals verbatim — words.n_letters is not null', () => {
    const r = parseBatchRecord(ROW);
    expect(r.nLetters).toBe(3);
    expect(r.nSyllables).toBe(1);
    // ⛔ Copied, never inferred from pos: see plan/03-for-roy.md item 8.
    expect(r.isFunctionWord).toBe(true);
    expect(parseBatchRecord({ ...ROW, n_syllables: null }).nSyllables).toBeNull();
    expect(() => parseBatchRecord({ ...ROW, n_letters: 'three' })).toThrow(/n_letters/);
  });

  it('names the line number when a file has a bad row', () => {
    const text = `${JSON.stringify(ROW)}\n\n${JSON.stringify({ ...ROW, pos: 'gerund' })}\n`;
    expect(() => parseBatchFile(text)).toThrow(/line 3/);
  });

  it('parses every real batch row shape without loss', () => {
    expect(parseBatchFile(`${JSON.stringify(ROW)}\n`)).toHaveLength(1);
  });
});
