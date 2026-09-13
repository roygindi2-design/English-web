import { describe, expect, it } from 'vitest';
import { amirnetChapterGate, RC_QUESTIONS_PER_CHAPTER } from './amirnetChapterGate';
import type { AmirnetItemRecord } from './amirnetItemGate';

const TIERS = new Map<string, 1 | 2 | 3 | 4>([
  ['committee', 3], ['report', 3], ['ambiguous', 3], ['endorsed', 3], ['merger', 3],
]);

// 188 words — measured with `str.split(/\s+/).length`, inside the level-3
// range [180, 230] (`41 § 6.2`). ⛔ Any edit here must re-measure. Kept
// word-for-word identical to lib/core/amirnetItemGate.test.ts's rcQuestion()
// fixture so a reader comparing the two files sees the same passage.
const PASSAGE =
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
  'the report ultimately recommends.';

const opt = (textEn: string, reason: string) => ({ textEn, reason });

const question = (
  n: number,
  correctIndex: number,
  stemEn = `Question ${n} about the passage?`,
): AmirnetItemRecord => ({
  type: 'rc',
  level: 3,
  stemEn,
  passageEn: PASSAGE,
  options: [
    opt('correct answer text', 'correct — matches the passage'),
    opt('distractor one', 'plausible but unstated'),
    opt('distractor two', 'confuses a later detail'),
    opt('distractor three', 'contradicts the passage'),
  ].map((o, i) => (i === correctIndex ? o : opt(o.textEn + ` ${n}`, o.reason))),
  correctIndex,
  levelRationale: 'academic topic, 180-230 words',
  source: 'original',
  // `F-235`ⓐ — every question the chapter gate sees is an `amirnet_items` row, and the
  // column is `not null`. A chapter whose questions carry ⛔ no band now fails here too.
  vocab_band: 3000,
});

/** Five questions, correctIndex spread across 0..3 so no single index dominates. */
const validChapter = (): AmirnetItemRecord[] => [
  question(1, 0),
  question(2, 1),
  question(3, 2),
  question(4, 3),
  question(5, 1),
];

const run = (qs: AmirnetItemRecord[]) => amirnetChapterGate(qs, { vocabTierByWord: TIERS });

describe('amirnetChapterGate', () => {
  it('passes a well-formed 5-question chapter', () => {
    const result = run(validChapter());
    expect(result.ok).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it(`requires exactly ${RC_QUESTIONS_PER_CHAPTER} questions`, () => {
    expect(run(validChapter().slice(0, 4)).reasons).toContain('wrong_question_count');
  });

  it('rejects a chapter whose questions do not share one passage', () => {
    const qs = validChapter();
    qs[2] = { ...qs[2]!, passageEn: qs[2]!.passageEn + ' Extra sentence added.' };
    expect(run(qs).reasons).toContain('passage_mismatch');
  });

  it('rejects a chapter with mixed levels', () => {
    const qs = validChapter();
    qs[3] = { ...qs[3]!, level: 2 };
    expect(run(qs).reasons).toContain('level_mismatch');
  });

  it('rejects a non-rc question inside a chapter', () => {
    const qs = validChapter();
    qs[1] = { ...qs[1]!, type: 'sc' };
    expect(run(qs).reasons).toContain('not_all_rc');
  });

  it('rejects a chapter where every correct answer sits at the same index', () => {
    const qs = [question(1, 0), question(2, 0), question(3, 0), question(4, 0), question(5, 0)];
    expect(run(qs).reasons).toContain('correct_index_not_spread');
  });

  it('surfaces a per-item failure with its index', () => {
    const qs = validChapter();
    qs[2] = { ...qs[2]!, levelRationale: '' };
    const result = run(qs);
    expect(result.ok).toBe(false);
    expect(result.reasons).toContain('item_2_failed');
    expect(result.perQuestion[2]!.ok).toBe(false);
  });

  // ⛔ `F-235` word for word: the two delivered `rc` chapters carry ⛔ no `vocab_band` on any
  // of their ten questions, and this gate reported them CLEAN — while every one of those
  // questions is a row `0024_amirnet_items.sql` refuses on `not null`. ⇒ a chapter is only
  // ok when all five questions are insertable.
  it('⛔ refuses a chapter whose questions carry ⛔ no vocab_band — every one of the five', () => {
    const qs = validChapter().map((q) => {
      const { vocab_band: _absent, ...withoutBand } = q;
      return withoutBand as typeof q;
    });
    const result = run(qs);
    expect(result.ok).toBe(false);
    for (let i = 0; i < 5; i += 1) {
      expect(result.reasons, `question ${i}`).toContain(`item_${i}_failed`);
      expect(result.perQuestion[i]!.reasons).toContain('bad_vocab_band');
    }
  });
});
