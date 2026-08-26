import { describe, expect, it } from 'vitest';
import { shuffleAnswers, type StoryQuestion } from './storyQuestion';

const Q: StoryQuestion = {
  questionEn: 'Who wrote the letter that was in the book?',
  answersHe: ['אם', 'אנשים', 'חבר'],
  correctIndex: 2,
};

describe('T-188ⓓ — position comes from the story id, ⛔ not from write order', () => {
  it('the same story id gives the same order, every time', () => {
    const a = shuffleAnswers(Q, 'aaaaaaaa-0000-4000-8000-000000000001');
    const b = shuffleAnswers(Q, 'aaaaaaaa-0000-4000-8000-000000000001');
    expect(a.answersHe).toEqual(b.answersHe);
    expect(a.correctIndex).toBe(b.correctIndex);
  });

  it('correctIndex still points at the correct ANSWER after the shuffle', () => {
    const out = shuffleAnswers(Q, 'bbbbbbbb-0000-4000-8000-000000000002');
    expect(out.answersHe[out.correctIndex]).toBe(Q.answersHe[Q.correctIndex]);
    expect([...out.answersHe].sort()).toEqual([...Q.answersHe].sort());
  });

  it('⛔ the correct answer is not pinned to one position across stories', () => {
    const ids = Array.from({ length: 12 }, (_, i) => `cccccccc-0000-4000-8000-00000000000${i.toString(16)}`);
    const positions = new Set(ids.map((id) => shuffleAnswers(Q, id).correctIndex));
    expect(positions.size).toBeGreaterThan(1);
  });

  it('⛔ the correct answer is not the longest one — the fixture proves the screen cannot be gamed by length', () => {
    const longWrong: StoryQuestion = {
      questionEn: 'What did the mother say is the best thing about her job?',
      answersHe: ['אנשים', 'כסף שהיא מקבלת בכל חודש', 'משפחה'],
      correctIndex: 0,
    };
    const out = shuffleAnswers(longWrong, 'dddddddd-0000-4000-8000-000000000003');
    const longest = out.answersHe.reduce((a, b) => (b.length > a.length ? b : a));
    expect(out.answersHe[out.correctIndex]).not.toBe(longest);
  });
});
