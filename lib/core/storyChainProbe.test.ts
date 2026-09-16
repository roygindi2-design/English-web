import { describe, expect, it } from 'vitest';
import {
  REQUIRED_ANSWERS,
  reportStoryChain,
  storyChainLineHe,
  type StoryChainSample,
} from './storyChainProbe';

const whole = (id: string): StoryChainSample => ({
  storyId: id,
  glossCount: 4,
  tapOk: true,
  answerCount: REQUIRED_ANSWERS,
});

describe('reportStoryChain', () => {
  it('דגימה ריקה היא אפס סיפורים, ⛔ ולא שבר — «⛔ לא נמדד» אינו «נמדד ויצא אפס»', () => {
    const report = reportStoryChain([]);
    expect(report.stories).toBe(0);
    expect(report.firstBreak).toBeNull();
    expect(storyChainLineHe(report)).toContain('⛔ לא נדגם');
  });

  it('שרשרת שלמה על כל הסיפורים ⇒ ⛔ אין שבר', () => {
    const report = reportStoryChain([whole('a'), whole('b')]);
    expect(report).toMatchObject({ stories: 2, withGlosses: 2, withTap: 2, withQuestion: 2 });
    expect(report.firstBreak).toBeNull();
    expect(storyChainLineHe(report)).toContain('השרשרת שלמה');
  });

  it('סיפור בלי ולו gloss אחד שובר בשלב הראשון — הקשה ⛔ אינה אפשרית בו', () => {
    const report = reportStoryChain([whole('a'), { ...whole('b'), glossCount: 0 }]);
    expect(report.withGlosses).toBe(1);
    expect(report.firstBreak).toBe('load');
  });

  it('⛔ השבר הראשון בלבד — טעינה קודמת להקשה ולשאלה, ⛔ גם כששלושתם שבורים', () => {
    const broken: StoryChainSample = { storyId: 'b', glossCount: 0, tapOk: false, answerCount: 0 };
    expect(reportStoryChain([broken]).firstBreak).toBe('load');
  });

  it('הקשה ש⛔ לא נוסתה ⛔ אינה הקשה שנכשלה', () => {
    const untried: StoryChainSample = { storyId: 'a', glossCount: 2, answerCount: REQUIRED_ANSWERS };
    const report = reportStoryChain([untried]);
    expect(report.withTap).toBe(0);
    expect(report.firstBreak).toBeNull();
  });

  it('הקשה שנוסתה ונכשלה כן שוברת, ⛔ ואחרי הטעינה', () => {
    const report = reportStoryChain([{ ...whole('a'), tapOk: false }]);
    expect(report.firstBreak).toBe('tap');
  });

  it(`שאלה בת ${REQUIRED_ANSWERS - 1} תשובות ⛔ אינה «כמעט» — היא ⛔ אינה נספרת`, () => {
    const report = reportStoryChain([{ ...whole('a'), answerCount: REQUIRED_ANSWERS - 1 }]);
    expect(report.withQuestion).toBe(0);
    expect(report.firstBreak).toBe('question');
  });

  it('⛔ אין שאלה כלל ⇒ 0 תשובות, ⛔ ולא «שאלה ריקה»', () => {
    const report = reportStoryChain([{ ...whole('a'), answerCount: 0 }]);
    expect(report.withQuestion).toBe(0);
    expect(storyChainLineHe(report)).toContain('שאלת ההבנה');
  });

  it('‏glossTotal הוא הסכום הגולמי, ⛔ ולא ממוצע', () => {
    const report = reportStoryChain([
      { ...whole('a'), glossCount: 3 },
      { ...whole('b'), glossCount: 7 },
    ]);
    expect(report.glossTotal).toBe(10);
  });
});
