import { describe, expect, it } from 'vitest';
import {
  RECALL_OPTION_COUNT,
  ageInDays,
  buildRecallCard,
  pickRecallTarget,
  type LearnerWord,
  type RecallPost,
} from './worldRecall';

const DAY = 86_400_000;
const NOW = Date.parse('2026-08-19T09:00:00Z');
const at = (days: number): string => new Date(NOW - days * DAY).toISOString();

const w = (headword: string, ngslRank: number | null, isFunctionWord = false): LearnerWord => ({
  headword, ngslRank, isFunctionWord, band: 'A1',
});
const WORDS: LearnerWord[] = [
  w('the', 1, true), w('is', 3, true), w('a', 5, true),
  w('table', 900), w('garden', 2600), w('river', 1800), w('market', 2100), w('quiet', 3100),
];
const post = (id: string, bodyEn: string, days: number): RecallPost => ({
  id, bodyEn, createdAt: at(days),
});

describe('ageInDays', () => {
  it('ימים שלמים כלפי מטה, ⛔ ולא עיגול', () => {
    expect(ageInDays(at(3), NOW)).toBe(3);
    expect(ageInDays(new Date(NOW - 3 * DAY - 23 * 3_600_000).toISOString(), NOW)).toBe(3);
    expect(ageInDays(at(0), NOW)).toBe(0);
  });
});

describe('pickRecallTarget', () => {
  it('המילה הנדירה ביותר לפי NGSL מבין מילות הלומד', () => {
    expect(pickRecallTarget('the table is by the river.', WORDS)?.headword).toBe('river');
  });

  it('⛔ מילת תפקוד לעולם אינה יעד — «the» אינו פריט לימוד (מדד ⓒ)', () => {
    expect(pickRecallTarget('the a is the a.', WORDS)).toBeNull();
  });

  it('⛔ מילה שאינה של הלומד אינה יעד', () => {
    expect(pickRecallTarget('the helicopter is loud.', WORDS)).toBeNull();
  });

  it('דירוג חסר (null) ⛔ אינו מנצח דירוג קיים — הוא הפחות ידוע עלינו, ⛔ לא הנדיר ביותר', () => {
    expect(pickRecallTarget('a table and a lamp.', [...WORDS, w('lamp', null)])?.headword)
      .toBe('table');
  });

  it('התאמה היא טוקן שלם ⛔ ולא includes — «car» ⛔ אינו מסופק על ידי «card» (F-020)', () => {
    expect(pickRecallTarget('i have a card.', [...WORDS, w('car', 400)])).toBeNull();
  });
});

describe('buildRecallCard', () => {
  const base = { words: WORDS, nowMs: NOW, seed: 7 };

  it('⛔ משפט מהיום אינו נבחר, ו-3 ימים מנצח 7 ואת 1 (§ 4.2יב)', () => {
    const card = buildRecallCard({
      ...base,
      posts: [post('today', 'the garden is quiet.', 0),
              post('seven', 'the market is quiet.', 7),
              post('three', 'the river is quiet.', 3)],
    });
    expect(card?.postId).toBe('three');
    expect(card?.daysAgo).toBe(3);
  });

  it('⛔ משפט שכל מילותיו מילות תפקוד מדולג **בשקט** (מדד ⓑ)', () => {
    const card = buildRecallCard({ ...base, posts: [post('p1', 'the a is a.', 3),
                                                    post('p2', 'the garden is quiet.', 7)] });
    expect(card?.postId).toBe('p2');
  });

  it('אפס משפטים כשירים ⇒ `null` ⛔ ולא זריקה', () => {
    expect(buildRecallCard({ ...base, posts: [] })).toBeNull();
    expect(buildRecallCard({ ...base, posts: [post('p', 'the a is a.', 3)] })).toBeNull();
  });

  it('ארבע אפשרויות, ⛔ ללא כפילות, כולן מילות הלומד, והתשובה ביניהן (מדד ⓓ)', () => {
    const card = buildRecallCard({ ...base, posts: [post('p', 'the garden is quiet.', 3)] });
    expect(card?.options).toHaveLength(RECALL_OPTION_COUNT);
    expect(new Set(card?.options).size).toBe(RECALL_OPTION_COUNT);
    expect(card?.options).toContain(card?.answer);
    const learner = new Set(WORDS.filter((x) => !x.isFunctionWord).map((x) => x.headword));
    for (const option of card?.options ?? []) expect(learner.has(option)).toBe(true);
  });

  it('פחות מ-4 מילים כשירות ⇒ הכרטיס **מדולג בשקט** ⛔ ולא מוצג עם 2 (§ 4.2יב מצבי קצה)', () => {
    const thin = [w('the', 1, true), w('garden', 2600), w('table', 900)];
    expect(buildRecallCard({ ...base, words: thin, posts: [post('p', 'the garden is here.', 3)] }))
      .toBeNull();
  });

  it('המקטעים מתחברים חזרה למשפט **בית-בבית**, ובדיוק אחד הוא היעד', () => {
    const card = buildRecallCard({ ...base, posts: [post('p', 'the garden is quiet.', 3)] });
    expect(card?.segments.map((s) => s.text).join('')).toBe('the garden is quiet.');
    expect(card?.segments.filter((s) => s.isTarget)).toHaveLength(1);
  });

  it('אותו seed ⇒ אותו סדר אפשרויות. ⛔ אין `Math.random` במודול', () => {
    const posts = [post('p', 'the garden is quiet.', 3)];
    expect(buildRecallCard({ ...base, posts })?.options)
      .toEqual(buildRecallCard({ ...base, posts })?.options);
  });
});
