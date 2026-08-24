import { describe, expect, it } from 'vitest';
import { REQUIRED_WORDS_PER_MESSAGE, messageGate, type MessageRecord } from './messageGate';

// Function words live in the bank — `words` carries an `is_function_word` column.
const BANK = new Set([
  'the', 'a', 'i', 'you', 'is', 'are', 'am', 'can', 'do', 'to', 'at', 'on', 'in', 'and',
  'my', 'your', 'we', 'it', 'be', 'will', 'have', 'come', 'go', 'meet', 'help', 'want',
  'me', 'with',
  'book', 'shop', 'bring', 'time', 'open', 'walk', 'friend', 'buy', 'money', 'late',
]);
const SENDERS = new Set(['Tom', 'Sarah', 'Mr. Levi']);

const item = (over: Partial<MessageRecord> = {}): MessageRecord => ({
  level: 'A1',
  senderName: 'Tom',
  subjectEn: 'The shop',
  bodyEn: 'I want to go to the shop. Can you come with me?',
  requiredWordsEn: ['buy', 'money', 'late'],
  ...over,
});

const run = (over: Partial<MessageRecord> = {}) =>
  messageGate(item(over), { allowedLemmas: BANK, allowedSenders: SENDERS });

describe('messageGate', () => {
  it('passes a well-formed message', () => {
    const r = run();
    expect(r.reasons).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it('is PURE', () => {
    expect(run()).toEqual(run());
  });

  it('rejects a sender outside the closed list', () => {
    // T-193ⓒ: the list is WRITTEN IN THE BRIEF. ⛔ Not derived, ⛔ not guessed.
    expect(run({ senderName: 'Jonathan' }).reasons).toContain('sender_not_allowed');
    expect(run({ senderName: 'Sarah' }).reasons).not.toContain('sender_not_allowed');
  });

  it('rejects a name in the BODY even when that name is an allowed sender', () => {
    // ⚠️ THE REASON THIS CHECK EXISTS SEPARATELY: an allowed name is in the allowed
    // list, so `unknown_words` would never catch it. The name rule is rewritten for
    // messages and ⛔ not inherited from the stories brief — a name is structural in
    // the sender field and forbidden everywhere else.
    const r = run({ bodyEn: 'I want to go to the shop with Sarah.' });
    expect(r.reasons).toContain('name_in_body');
    expect(r.leakedNames).toEqual(['Sarah']);
  });

  it('catches a leaked name that is not this message’s own sender', () => {
    // A message from Tom that says "ask Sarah" leaks a name just as surely.
    expect(run({ senderName: 'Tom', bodyEn: 'Can you meet tom at the shop?' }).leakedNames).toEqual(
      ['Tom'],
    );
  });

  it('rejects an English word the learner has never seen, and NAMES it', () => {
    const r = run({ bodyEn: 'I want to purchase the book.' });
    expect(r.reasons).toContain('unknown_words');
    expect(r.unknownWords).toContain('purchase');
  });

  it('demands exactly three required words', () => {
    expect(REQUIRED_WORDS_PER_MESSAGE).toBe(3);
    expect(run({ requiredWordsEn: ['buy', 'money'] }).reasons).toContain('wrong_required_count');
  });

  it('rejects a required word the learner has never seen', () => {
    expect(run({ requiredWordsEn: ['buy', 'money', 'invoice'] }).reasons).toContain(
      'required_not_in_bank',
    );
  });

  it('rejects a required word that already appears in the message', () => {
    // ⛔ Otherwise the task is COPYING, not producing — and production is the whole
    // point of the product (`01-vision`: "הפקה, ולא רק זיהוי").
    expect(run({ requiredWordsEn: ['shop', 'money', 'late'] }).reasons).toContain(
      'required_not_in_body',
    );
  });

  it('catches an inflected form of a required word sitting in the body', () => {
    // `walking` reduces to `walk`; a required `walk` would be a copy task.
    const r = run({
      bodyEn: 'I am walking to the shop.',
      requiredWordsEn: ['walk', 'money', 'late'],
    });
    expect(r.reasons).toContain('required_not_in_body');
  });

  it('rejects a digit — zero claim about the world (T-193ⓓ)', () => {
    expect(run({ bodyEn: 'Come at 5 to the shop.' }).reasons).toContain('digit_in_text');
    expect(run({ subjectEn: 'Shop at 9' }).reasons).toContain('digit_in_text');
  });

  it('reports every reason at once — one regeneration, ⛔ not five (R-014)', () => {
    const r = run({
      senderName: 'Nobody',
      subjectEn: 'Invoice 5',
      bodyEn: 'Sarah will purchase it.',
      requiredWordsEn: ['buy'],
    });
    expect(r.reasons.length).toBeGreaterThanOrEqual(5);
    expect(r.ok).toBe(false);
  });
});
