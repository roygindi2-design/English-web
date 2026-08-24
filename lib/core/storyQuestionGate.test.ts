import { describe, expect, it } from 'vitest';
import {
  ANSWERS_PER_QUESTION,
  storyQuestionGate,
  type StoryQuestionRecord,
} from './storyQuestionGate';

/**
 * ⚠️ The function words are IN the bank, and that is not a convenience for the
 * test — it is what the real bank looks like: `words` carries an
 * `is_function_word` column, so `the` and `what` are entries like any other.
 * `storyGate` checks every token for exactly this reason, and T-189 says the
 * question uses "the same rule, the same gate". My first fixture left them out
 * and the gate correctly rejected `What did the girl…`.
 */
const BANK = new Set([
  'girl', 'book', 'open', 'box', 'find', 'key', 'door', 'happy', 'run', 'novel',
  'what', 'who', 'did', 'do', 'the', 'a', 'in', 'is', 'it', 'for', 'write',
]);
const HEBREW = new Set(['מפתח', 'ספר', 'דלת', 'קופסה', 'ילדה']);
const STORY = 'The girl opens the box. She finds a key. The key opens the door.';

const item = (over: Partial<StoryQuestionRecord> = {}): StoryQuestionRecord => ({
  storyLevel: 'A1',
  storyTitleEn: 'The girl and the box',
  questionEn: 'What did the girl find in the box?',
  answersHe: ['ספר', 'מפתח', 'דלת'],
  correctIndex: 0,
  ...over,
});

const run = (over: Partial<StoryQuestionRecord> = {}, body = STORY) =>
  storyQuestionGate(item(over), {
    allowedLemmas: BANK,
    allowedHebrew: HEBREW,
    storyBodyEn: body,
  });

describe('storyQuestionGate', () => {
  it('passes a well-formed item', () => {
    const r = run();
    expect(r.reasons).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('is PURE — same input, same output, and no ambient dependency', () => {
    // ⛔ `check:core` enforces this structurally; this pins the behaviour.
    expect(run()).toEqual(run());
  });

  it('rejects anything but three answers', () => {
    expect(ANSWERS_PER_QUESTION).toBe(3);
    expect(run({ answersHe: ['ספר', 'מפתח'] }).reasons).toContain('wrong_answer_count');
    expect(run({ answersHe: ['ספר', 'מפתח', 'דלת', 'קופסה'] }).reasons).toContain(
      'wrong_answer_count',
    );
  });

  it('rejects a correct index outside the answers', () => {
    expect(run({ correctIndex: 3 }).reasons).toContain('bad_correct_index');
    expect(run({ correctIndex: -1 }).reasons).toContain('bad_correct_index');
  });

  it('rejects two identical answers — a three-way choice with two same options is a two-way choice', () => {
    expect(run({ answersHe: ['ספר', 'ספר', 'דלת'] }).reasons).toContain('duplicate_answers');
  });

  it('rejects an English word the learner has never seen, and NAMES it', () => {
    // ⛔ Naming the word is the difference between a gate that teaches and one that
    // just says no — the same rule storyGate follows for unknownWords.
    const r = run({ questionEn: 'What did the girl discover in the box?' });
    expect(r.reasons).toContain('unknown_words');
    expect(r.unknownWords).toContain('discover');
  });

  it('accepts an inflected form whose lemma is in the bank', () => {
    // `opened` → `open`. The direction is REDUCTION, never expansion (F-020).
    expect(run({ questionEn: 'What opened the door for the girl?' }).reasons).not.toContain(
      'unknown_words',
    );
  });

  it('rejects a Hebrew answer that is not a translation the learner has met', () => {
    // ⚠️ This is the resolution of T-189's own contradiction: ⓑ demands the bank
    // rule apply to "the question AND the three answers", while T-188 makes the
    // answers Hebrew and the bank is English. The Hebrew set is the bridge.
    const r = run({ answersHe: ['ספר', 'מפתח', 'מזוודה'] });
    expect(r.reasons).toContain('unknown_hebrew');
    expect(r.unknownHebrew).toEqual(['מזוודה']);
  });

  it('rejects a correct answer that is strictly the longest of the three', () => {
    // The oldest giveaway in multiple choice: the longest option is the answer.
    const r = run({ answersHe: ['קופסה', 'ספר', 'דלת'], correctIndex: 0 });
    expect(r.reasons).toContain('correct_is_longest');
  });

  it('allows a tie for longest — ⛔ padding a wrong answer makes a worse item', () => {
    // מפתח and ילדה are both 4 — a genuine tie, ⛔ not a giveaway.
    const r = run({ answersHe: ['מפתח', 'ילדה', 'ספר'], correctIndex: 0 });
    expect(r.reasons).not.toContain('correct_is_longest');
  });

  it('rejects a question answerable without the story', () => {
    // The prohibition T-189 calls measurable. A general-knowledge question shares
    // no content words with the story.
    const r = run({ questionEn: 'What is the girl?' }, 'A book is open. A key is here.');
    expect(r.reasons).toContain('not_grounded');
  });

  it('does not demand that question words appear in the story', () => {
    // ⛔ The closed function-word set exists for exactly this: `what` and `did`
    // carry the SHAPE of the question and are never in the story's content.
    expect(run().reasons).not.toContain('not_grounded');
  });

  it('rejects a question with no content words at all', () => {
    expect(run({ questionEn: 'What is it?' }).reasons).toContain('not_grounded');
  });

  it('measures a one-content-word question against that one word', () => {
    // ⚠️ The floor is min(2, how many there are) — otherwise a legitimately short
    // question could never pass, and the gate would push writers toward padding.
    expect(run({ questionEn: 'What is in the box?' }).reasons).not.toContain('not_grounded');
  });

  it('rejects a digit anywhere — the story rule, unchanged', () => {
    expect(run({ questionEn: 'What did the 2 girls find?' }).reasons).toContain('digit_in_text');
    expect(run({ answersHe: ['ספר', 'מפתח', '3'] }).reasons).toContain('digit_in_text');
  });

  it('reports every reason at once, ⛔ not the first — one regeneration, not five', () => {
    // R-014: a rejected item is REGENERATED. Reporting one reason at a time would
    // mean five regenerations to find five faults.
    const r = run({
      questionEn: 'Who wrote 5 novels?',
      answersHe: ['מזוודה', 'מזוודה'],
      correctIndex: 9,
    });
    expect(r.reasons.length).toBeGreaterThanOrEqual(4);
    expect(r.ok).toBe(false);
  });
});
