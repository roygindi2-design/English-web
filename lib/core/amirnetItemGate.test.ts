import { describe, expect, it } from 'vitest';
import {
  AMIRNET_OPTIONS_PER_ITEM,
  AMIRNET_VOCAB_BANDS,
  amirnetItemGate,
  toServedItems,
  type AmirnetItemRecord,
  type AmirnetItemRow,
  type AmirnetVocabBand,
} from './amirnetItemGate';
import { servableItems } from './amirnetQuestion';

/**
 * Tier map fixture. Deliberately invented words, ⛔ not drawn from
 * plan/41-amirnet-spec.md § 6.3 (forbidden — brief § 1 point 2).
 * tier 1 = A2, 2 = B1, 3 = B2, 4 = C1 (data/amirnet-vocab-README.md § 3).
 */
const TIERS = new Map<string, 1 | 2 | 3 | 4>([
  ['museum', 1], ['closed', 1], ['visit', 1], ['garden', 1],
  ['despite', 2], ['training', 2], ['knee', 2],
  ['ambiguous', 3], ['committee', 3], ['endorsed', 3],
  ['circumstantial', 4], ['conclusive', 4], ['suspended', 4],
]);

const opt = (textEn: string, reason: string) => ({ textEn, reason });

const scItem = (over: Partial<AmirnetItemRecord> = {}): AmirnetItemRecord => ({
  type: 'sc',
  level: 1,
  stemEn: 'The garden was ______ after the storm.',
  passageEn: '',
  options: [
    opt('closed', 'correct — matches "after the storm" cause/effect'),
    opt('open', 'plausible surface reading, contradicts the cause given'),
    opt('crowded', 'unrelated to storm damage'),
    opt('painted', 'unrelated to storm damage'),
  ],
  correctIndex: 0,
  levelRationale: 'one blank, common vocabulary, no contrast connector',
  source: 'original',
  vocab_band: 1000,
  ...over,
});

const rcQuestion = (over: Partial<AmirnetItemRecord> = {}): AmirnetItemRecord => ({
  type: 'rc',
  level: 3,
  stemEn: 'What did the committee decide to do with the report?',
  // 188 words — measured in this plan with `str.split(/\s+/).length`, inside
  // the level-3 range [180, 230] (`41 § 6.2`). ⛔ Any edit here must re-measure.
  passageEn:
    'The committee spent three months preparing its final report on the ' +
    'proposed merger between the two regional transport companies. Members ' +
    'disagreed sharply on almost every point under discussion, and the ' +
    'disagreements grew more public as the deadline approached, with several ' +
    'members giving interviews that hinted at the internal disputes long ' +
    'before the report was due. In the end the committee\'s final report was ' +
    'deliberately ambiguous, allowing both sides of the dispute to claim ' +
    'afterward that their position had been endorsed by the group as a ' +
    'whole. Critics called the decision a failure of leadership, arguing ' +
    'that a clear recommendation, even an unpopular one, would have served ' +
    'the public better than a document that satisfied no one fully. ' +
    'Supporters described it as the only realistic way to keep the group ' +
    'from splitting apart entirely over a single disputed clause about ' +
    'ticket pricing. Neither side has changed its account of the meeting ' +
    'since the report was published two months ago, and no further ' +
    'statement is expected before the board\'s review in the spring, which ' +
    'several members now say they expect to be delayed regardless of what ' +
    'the report ultimately recommends.',
  options: [
    opt('It kept the wording ambiguous on purpose.', 'correct — matches paragraph 3'),
    opt('It rejected the merger outright.', 'plausible but not stated in the passage'),
    opt('It postponed its decision indefinitely.', 'confuses with the board review mentioned later'),
    opt('It endorsed one side publicly.', 'contradicts "allowing both sides to claim"'),
  ],
  correctIndex: 0,
  levelRationale: 'academic topic, 180-230 words, main-idea inference question',
  source: 'original',
  vocab_band: 3000,
  ...over,
});

const run = (item: AmirnetItemRecord) => amirnetItemGate(item, { vocabTierByWord: TIERS });

describe('amirnetItemGate', () => {
  it('passes a well-formed sc item', () => {
    expect(run(scItem())).toEqual({ ok: true, reasons: [], aboveTierWords: [] });
  });

  it('passes a well-formed rc question', () => {
    expect(run(rcQuestion())).toEqual({ ok: true, reasons: [], aboveTierWords: [] });
  });

  it('rejects the wrong option count', () => {
    const result = run(scItem({ options: scItem().options.slice(0, 3) }));
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('wrong_option_count');
  });

  it('rejects a correctIndex out of range', () => {
    const result = run(scItem({ correctIndex: 4 }));
    expect(result.reasons).toContain('bad_correct_index');
  });

  it('rejects a correctIndex that is not an integer', () => {
    const result = run(scItem({ correctIndex: 1.5 }));
    expect(result.reasons).toContain('bad_correct_index');
  });

  it('rejects duplicate options', () => {
    const item = scItem();
    const options = [...item.options];
    options[1] = options[0]!;
    const result = run(scItem({ options }));
    expect(result.reasons).toContain('duplicate_options');
  });

  it('rejects a missing distractor reason', () => {
    const item = scItem();
    const options = [...item.options];
    options[2] = opt(options[2]!.textEn, '   ');
    const result = run(scItem({ options }));
    expect(result.reasons).toContain('missing_distractor_reason');
  });

  it('rejects a level outside 1..4', () => {
    expect(run(scItem({ level: 5 })).reasons).toContain('bad_level');
    expect(run(scItem({ level: 0 })).reasons).toContain('bad_level');
    expect(run(scItem({ level: 2.5 })).reasons).toContain('bad_level');
  });

  it('rejects an empty level_rationale', () => {
    expect(run(scItem({ levelRationale: '  ' })).reasons).toContain('missing_level_rationale');
  });

  it('rejects a source other than "original"', () => {
    expect(run(scItem({ source: 'commercial_bank' })).reasons).toContain('bad_source');
  });

  it('rejects "all of the above" as an option, case-insensitively', () => {
    const item = scItem();
    const options = [...item.options];
    options[3] = opt('All Of The Above', 'n/a');
    expect(run(scItem({ options })).reasons).toContain('all_or_none_option');
  });

  it('rejects "none of the above" as an option', () => {
    const item = scItem();
    const options = [...item.options];
    options[1] = opt('none of the above', 'n/a');
    expect(run(scItem({ options })).reasons).toContain('all_or_none_option');
  });

  it('rejects a correct answer that is the longest option by a wide margin', () => {
    const result = run(
      scItem({
        options: [
          opt(
            'closed for extensive structural repairs following storm damage',
            'correct, but written far longer than the distractors — a giveaway',
          ),
          opt('open', 'short distractor'),
          opt('crowded', 'short distractor'),
          opt('painted', 'short distractor'),
        ],
        correctIndex: 0,
      }),
    );
    expect(result.reasons).toContain('correct_length_outlier');
  });

  it('rejects a headword above the item level\'s tier ceiling, and names it', () => {
    // "circumstantial" is tier 4 in the fixture map; item is level 1.
    const result = run(
      scItem({ stemEn: 'The evidence was entirely circumstantial after the storm.' }),
    );
    expect(result.reasons).toContain('vocab_above_tier');
    expect(result.aboveTierWords).toContain('circumstantial');
  });

  it('allows a tier-4 word when the item is level 4', () => {
    const result = run(
      scItem({
        level: 4,
        stemEn: 'The evidence was entirely circumstantial after the storm.',
        levelRationale: 'two dependent blanks, top of the vocabulary range',
      }),
    );
    expect(result.reasons).not.toContain('vocab_above_tier');
  });

  it('rejects an rc passage shorter than the level range', () => {
    const result = run(rcQuestion({ passageEn: 'Too short for level 3.' }));
    expect(result.reasons).toContain('passage_length_out_of_range');
  });

  it('rejects an rc passage longer than the level range', () => {
    const longPassage = Array(260).fill('word').join(' ');
    const result = run(rcQuestion({ passageEn: longPassage }));
    expect(result.reasons).toContain('passage_length_out_of_range');
  });

  it('ignores passage length for sc/rs — passageEn is always empty there', () => {
    expect(run(scItem()).reasons).not.toContain('passage_length_out_of_range');
  });

  it(`AMIRNET_OPTIONS_PER_ITEM is ${4}`, () => {
    expect(AMIRNET_OPTIONS_PER_ITEM).toBe(4);
  });

  // ─── F-235ⓐ — `vocab_band` is a field of every item (`41 § 6.5`), and the
  // table already refuses what is missing or off-set
  // (`0024_amirnet_items.sql`: `vocab_band smallint not null` +
  // `amirnet_items_vocab_band_check (1000, 2000, 3000)`). Until now the gate
  // ⛔ could not see the field at all, so it reported 26/26 passing on a bank
  // whose 10 `rc` questions ⛔ cannot be inserted. Two places, one refusal.
  it('passes each of the three declared bands, and ⛔ nothing else', () => {
    for (const band of [1000, 2000, 3000] as const) {
      expect(run(scItem({ vocab_band: band })).reasons, String(band)).not.toContain('bad_vocab_band');
    }
  });

  it('rejects an item that carries ⛔ no vocab_band at all — the case F-235 measured', () => {
    const item = scItem();
    const { vocab_band: _dropped, ...withoutBand } = item;
    const result = amirnetItemGate(withoutBand as AmirnetItemRecord, { vocabTierByWord: TIERS });
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('bad_vocab_band');
  });

  // ⛔ The casts are the point of the test, ⛔ not a way around the type: these records
  // arrive as JSONL that TypeScript ⛔ never saw, so the gate is the only thing standing
  // between an off-set band and an `insert` that dies on the check constraint.
  const band = (value: unknown) => value as AmirnetVocabBand;

  it('rejects a band outside the closed set the table declares', () => {
    expect(run(scItem({ vocab_band: band(1500) })).reasons).toContain('bad_vocab_band');
    expect(run(scItem({ vocab_band: band(4000) })).reasons).toContain('bad_vocab_band');
    expect(run(scItem({ vocab_band: band(0) })).reasons).toContain('bad_vocab_band');
  });

  it('rejects a band that is not a number — a string "1000" is ⛔ not a smallint', () => {
    expect(run(scItem({ vocab_band: band('1000') })).reasons).toContain('bad_vocab_band');
  });

  it('AMIRNET_VOCAB_BANDS is the set `0024` declares, ⛔ and is not widened here', () => {
    expect([...AMIRNET_VOCAB_BANDS].sort((a, b) => a - b)).toEqual([1000, 2000, 3000]);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// T-297ⓓ — the DB row ⇢ served item mapping. ⛔ It maps; it ⛔ never repairs.
// ═══════════════════════════════════════════════════════════════════════════════

const ROW: AmirnetItemRow = {
  id: '7c2f0f4e-0000-4000-8000-000000000001',
  type: 'sc',
  level: 3,
  stem_en: 'The meeting was ___ until next week.',
  passage_en: '',
  options_en: ['postponed', 'postponing', 'postpone', 'postpones'],
  correct_index: 0,
  distractor_reasons: ['correct — passive past', 'active gerund', 'bare infinitive', 'present simple'],
  explanation_he: 'המשפט בפסיב, ולכן נדרשת צורת ה-participle.',
  level_rationale: 'one blank, NGSL 2000 band',
  vocab_band: 2000,
  source: 'original',
};

describe('T-297ⓓ — toServedItems', () => {
  it('maps a row to the shape the screen already consumes', () => {
    expect(toServedItems([ROW])).toEqual([
      {
        id: ROW.id,
        type: 'sc',
        level: 3,
        stemEn: ROW.stem_en,
        passageEn: '',
        optionsEn: ROW.options_en,
        correctIndex: 0,
        explanationHe: ROW.explanation_he,
      },
    ]);
  });

  it('a null passage is an empty passage — ⛔ never the string "null"', () => {
    expect(toServedItems([{ ...ROW, type: 'rc', passage_en: null }])[0]!.passageEn).toBe('');
  });

  it('⛔ never invents an explanation: a null explanation stays empty, so the gate drops it', () => {
    const mapped = toServedItems([{ ...ROW, explanation_he: null }]);
    expect(mapped[0]!.explanationHe).toBe('');
    expect(servableItems(mapped)).toEqual([]);
  });

  it('⛔ never invents a level: a null level stays out of 1–4, so the gate drops it', () => {
    const mapped = toServedItems([{ ...ROW, level: null }]);
    expect(servableItems(mapped)).toEqual([]);
  });

  it('a null options array becomes an empty array, ⛔ not four blanks', () => {
    const mapped = toServedItems([{ ...ROW, options_en: null }]);
    expect(mapped[0]!.optionsEn).toEqual([]);
    expect(servableItems(mapped)).toEqual([]);
  });

  it('passes a whole row through the existing serving gate untouched', () => {
    expect(servableItems(toServedItems([ROW]))).toHaveLength(1);
  });
});
