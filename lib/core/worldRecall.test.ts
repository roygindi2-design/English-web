import { describe, expect, it } from 'vitest';
import {
  RECALL_OPTION_COUNT,
  RECALL_REQUIRED_ELIGIBLE,
  ageInDays,
  buildRecallCard,
  pickRecallTarget,
  recallCounts,
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

/**
 * D-075 — «מה שכתבת אתמול»: **שני מצבים ללומד, ⛔ ולא שלושה.** המונים נגזרים בזמן
 * השאילתה (תבנית D-043) ⛔ ואין להם עמודה, מיגרציה או שדה.
 *
 * ⚠️ **המצב השלישי — «אין מילת יעד במשפט שלך» — ⛔ אסור להיאמר ללומד** (R-016):
 * הוא נספר ב-`posts`, ⛔ אינו נספר ב-`eligible`, והמסך זהה. הבדיקה השלישית כאן היא
 * בדיוק המדידה הזאת.
 */
describe('recallCounts (D-075 · F-080)', () => {
  // ⚠️ שמות ייעודיים ⛔ ולא `NOW`/`WORDS`: הקובץ כבר מגדיר את שניהם ברמת המודול,
  // והצללה בתוך `describe` היא בדיוק סוג הטעות שקוראים אותה שגוי בסקירה.
  const D75_NOW = Date.parse('2026-08-21T09:00:00Z');
  const daysBack = (n: number): string => new Date(D75_NOW - n * 86_400_000).toISOString();

  /** ארבע מילות תוכן בדיוק — הרצפה של `RECALL_OPTION_COUNT` — ומילת תפקוד אחת. */
  const D75_WORDS: readonly LearnerWord[] = [
    { headword: 'garden', band: 'A2', ngslRank: 1800, isFunctionWord: false },
    { headword: 'table', band: 'A1', ngslRank: 900, isFunctionWord: false },
    { headword: 'river', band: 'A2', ngslRank: 1500, isFunctionWord: false },
    { headword: 'market', band: 'A2', ngslRank: 1200, isFunctionWord: false },
    { headword: 'the', band: 'A1', ngslRank: 1, isFunctionWord: true },
  ];

  /** ⛔ אין בו ולו מילת תוכן אחת של הלומד ⇒ ⛔ אין מילת יעד ⇒ ⛔ אינו כשיר. */
  const NO_TARGET = { id: 'a', bodyEn: 'the sun is warm.', createdAt: daysBack(3) };
  /** יש בו יעד, אבל הוא **מהיום** ⇒ ⛔ אינו נבחר (§ 4.2יב) ⇒ ⛔ אינו כשיר. */
  const TODAY = { id: 'b', bodyEn: 'the garden is quiet.', createdAt: daysBack(0) };
  /** יש בו יעד והוא בן שלושה ימים ⇒ **כשיר**. */
  const READY = { id: 'c', bodyEn: 'the garden is quiet.', createdAt: daysBack(3) };

  it('⛔ אפס משפטים ⇒ posts=0 · eligible=0 · required מהשרת', () => {
    expect(recallCounts({ posts: [], words: D75_WORDS, nowMs: D75_NOW })).toEqual({
      posts: 0,
      eligible: 0,
      required: RECALL_REQUIRED_ELIGIBLE,
    });
  });

  it('שני משפטים ו⛔ אף אחד כשיר ⇒ posts=2 · eligible=0 — וזה ⛔ אינו «אפס משפטים»', () => {
    const counts = recallCounts({ posts: [NO_TARGET, TODAY], words: D75_WORDS, nowMs: D75_NOW });
    expect(counts.posts).toBe(2);
    expect(counts.eligible).toBe(0);
  });

  it('שני משפטים ואחד כשיר ⇒ posts=2 · eligible=1', () => {
    const counts = recallCounts({ posts: [NO_TARGET, READY], words: D75_WORDS, nowMs: D75_NOW });
    expect(counts.posts).toBe(2);
    expect(counts.eligible).toBe(1);
  });

  it('גוף ריק ⛔ אינו משפט שהלומד הרכיב — `posts` סופר גוף לא-ריק בלבד', () => {
    const blank = { id: 'd', bodyEn: '   ', createdAt: daysBack(2) };
    expect(recallCounts({ posts: [READY, blank], words: D75_WORDS, nowMs: D75_NOW }).posts).toBe(1);
  });

  it('פחות מארבע מילות תוכן ⇒ eligible=0 גם כשיש יעד — ארבע אפשרויות הן הרצפה', () => {
    const three = D75_WORDS.filter((word) => !word.isFunctionWord).slice(0, 3);
    expect(recallCounts({ posts: [READY], words: three, nowMs: D75_NOW }).eligible).toBe(0);
  });

  /**
   * ⚠️ **האינווריאנט, וזו הבדיקה היחידה כאן שאינה יכולה להירקב בשקט:** `eligible`
   * ו-`buildRecallCard` **חייבים** לענות על אותה שאלה. שני עותקים של הפרדיקט הם
   * בדיוק החצי שלא יזוז — ולכן שניהם קוראים ל-`retrievableTarget` היחיד.
   */
  it('`eligible ≥ required` ⟺ יש כרטיס — ⛔ פרדיקט אחד, ⛔ ולא שני עותקים', () => {
    const cases: readonly {
      readonly posts: readonly RecallPost[];
      readonly words: readonly LearnerWord[];
    }[] = [
      { posts: [], words: D75_WORDS },
      { posts: [NO_TARGET, TODAY], words: D75_WORDS },
      { posts: [NO_TARGET, READY], words: D75_WORDS },
      { posts: [READY], words: D75_WORDS.filter((word) => !word.isFunctionWord).slice(0, 3) },
    ];
    for (const [i, input] of cases.entries()) {
      const counts = recallCounts({ ...input, nowMs: D75_NOW });
      const card = buildRecallCard({ ...input, nowMs: D75_NOW, seed: 7 });
      expect(counts.eligible >= counts.required, `מקרה ${i}`).toBe(card !== null);
    }
  });
});
