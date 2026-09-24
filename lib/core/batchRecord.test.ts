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

/** D-141: a batch row using the tagged item shape, alongside a legacy bare-string one. */
const TAGGED_ROW = {
  ...ROW,
  items: [
    'Only ____ people are at the meeting.',
    { stem: 'Very ____ students finished early.', level: 2, level_rationale: 'one connective-free comparative ⇒ 2' },
  ],
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

  it('D-141: normalises a legacy bare-string item to { stem, level: null, levelRationale: null }', () => {
    const r = parseBatchRecord(ROW);
    expect(r.sense.items).toEqual([{ stem: 'Only ____ people are at the meeting.', level: null, levelRationale: null }]);
  });

  it('D-141: parses a tagged object item, camelCasing level_rationale', () => {
    const r = parseBatchRecord(TAGGED_ROW);
    expect(r.sense.items).toEqual([
      { stem: 'Only ____ people are at the meeting.', level: null, levelRationale: null },
      { stem: 'Very ____ students finished early.', level: 2, levelRationale: 'one connective-free comparative ⇒ 2' },
    ]);
  });

  it('D-141: rejects a tagged item whose level is not an integer', () => {
    const bad = { ...ROW, items: [{ stem: 'x ____ y', level: 'two', level_rationale: 'r' }] };
    expect(() => parseBatchRecord(bad)).toThrow(/items\[0\]\.level/);
  });

  it('D-141: rejects a tagged item whose level_rationale is not a string', () => {
    const bad = { ...ROW, items: [{ stem: 'x ____ y', level: 2, level_rationale: 7 }] };
    expect(() => parseBatchRecord(bad)).toThrow(/items\[0\]\.level_rationale/);
  });

  it('D-141: rejects an item that is neither a string nor an object', () => {
    expect(() => parseBatchRecord({ ...ROW, items: [42] })).toThrow(/items\[0\]/);
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

describe('T-353 — a word-only batch row', () => {
  const { examples: _e, items: _i, distractors: _d, ...WORD_ONLY } = ROW;

  it('parses with examples null and no items or distractors', () => {
    const r = parseBatchRecord(WORD_ONLY);
    expect(r.sense.examples).toBeNull();
    expect(r.sense.items).toEqual([]);
    expect(r.sense.distractors).toEqual([]);
    expect(r.sense.translationHe).toBe('מעטים');
  });

  it('`examples: null` is the same declared absence', () => {
    expect(parseBatchRecord({ ...WORD_ONLY, examples: null }).sense.examples).toBeNull();
  });

  it('⛔ translation_he is still required', () => {
    const { translation_he: _t, ...noHebrew } = WORD_ONLY;
    expect(() => parseBatchRecord(noHebrew)).toThrow(/translation_he/);
  });

  it('⛔ a malformed value is still malformed — only ABSENCE is legal', () => {
    expect(() => parseBatchRecord({ ...WORD_ONLY, items: null })).toThrow(/items is not an array/);
    expect(() => parseBatchRecord({ ...WORD_ONLY, distractors: 'x' })).toThrow(/distractors is not an array/);
    expect(() => parseBatchRecord({ ...WORD_ONLY, examples: [] })).toThrow(/examples is not an object/);
    expect(() => parseBatchRecord({ ...WORD_ONLY, examples: { supportive: 'a' } })).toThrow(/neutral/);
  });
});
