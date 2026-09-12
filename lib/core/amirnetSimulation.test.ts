import { describe, expect, it } from 'vitest';
import {
  AMIRNET_CHAPTERS,
  CARRY_OVER_NOTICE_HE,
  advance,
  advanceChapter,
  chapterClock,
  chapterDotLabelHe,
  chapterDotState,
  chapterHeadingHe,
  isChapterExpired,
  isLastQuestionOfChapter,
  isLastQuestionOfRun,
  remainingSeconds,
  SIMULATION_QUESTION_COUNT,
  simulationQueue,
  startSimulation,
} from './amirnetSimulation';
import type { AmirnetServedItem } from './amirnetQuestion';
import type { AmirnetPracticeType } from './amirnetPractice';


/**
 * ⛔ Not a `!` assertion. The `41 § 2` table is fixed at six rows, so a missing row is a real
 * failure of the module under test and ⛔ not a case the test should silently tolerate.
 */
function chapter(i: number) {
  const c = AMIRNET_CHAPTERS[i];
  if (c === undefined) throw new Error(`⛔ no chapter ${i}`);
  return c;
}

/**
 * T-296 · `41 § 2` — the two binding time rules of the exam being simulated. The first two `it`s
 * below are the row's own declared failure scenarios, word for word.
 */
describe('41 § 2 — אי אפשר להעביר זמן שנותר לפרק הבא', () => {
  it('a chapter that ends with 90 seconds left gives the next chapter its FULL time, ⛔ not full + 90', () => {
    const t0 = 1_000_000;
    const first = startSimulation(t0);
    const atEnd = t0 + (chapter(0).seconds - 90) * 1000;

    expect(remainingSeconds(first, atEnd)).toBe(90);

    const second = advance(
      { ...first, questionIndex: chapter(0).questionCount - 1 },
      atEnd,
    );

    expect(second.chapterIndex).toBe(1);
    expect(second.questionIndex).toBe(0);
    expect(remainingSeconds(second, atEnd)).toBe(chapter(1).seconds);
    expect(remainingSeconds(second, atEnd)).not.toBe(chapter(1).seconds + 90);
  });

  it('the clock reaching 00:00 locks the chapter — ⛔ no answer is accepted after it', () => {
    const t0 = 0;
    const state = startSimulation(t0);
    const atZero = t0 + chapter(0).seconds * 1000;

    expect(remainingSeconds(state, atZero)).toBe(0);
    expect(chapterClock(remainingSeconds(state, atZero))).toBe('0:00');
    expect(isChapterExpired(state, atZero)).toBe(true);
    // ⛔ never negative, and ⛔ never wrapping round to a full chapter
    expect(remainingSeconds(state, atZero + 60_000)).toBe(0);
    expect(chapterClock(remainingSeconds(state, atZero + 60_000))).toBe('0:00');
    expect(isChapterExpired(state, atZero + 60_000)).toBe(true);
  });

  it('a chapter still inside its budget is ⛔ not expired', () => {
    const state = startSimulation(0);
    expect(isChapterExpired(state, (chapter(0).seconds - 1) * 1000)).toBe(false);
    expect(isChapterExpired(state, 0)).toBe(false);
  });
});

describe('41 § 2 — the six core chapters, and ⛔ nothing invented', () => {
  it('is the 41 § 2 table exactly — 6 chapters · 23 questions · 39 minutes', () => {
    expect(AMIRNET_CHAPTERS).toHaveLength(6);
    expect(AMIRNET_CHAPTERS.reduce((n, c) => n + c.questionCount, 0)).toBe(23);
    expect(AMIRNET_CHAPTERS.reduce((n, c) => n + c.seconds, 0)).toBe(39 * 60);
  });

  it('carries the types and per-chapter budgets of 41 § 2 in order', () => {
    expect(AMIRNET_CHAPTERS.map((c) => c.type)).toEqual(['sc', 'sc', 'rc', 'rs', 'rs', 'sc']);
    expect(AMIRNET_CHAPTERS.map((c) => c.questionCount)).toEqual([4, 4, 5, 3, 3, 4]);
    expect(AMIRNET_CHAPTERS.map((c) => c.seconds)).toEqual([240, 240, 900, 360, 360, 240]);
  });

  it('indexes itself, so a caller ⛔ never has to keep a parallel counter', () => {
    AMIRNET_CHAPTERS.forEach((c, i) => expect(c.index).toBe(i));
  });
});

describe('advance — questions inside a chapter, then chapters, then the end', () => {
  it('walks the questions of a chapter without touching the clock', () => {
    const t0 = 500;
    const first = startSimulation(t0);
    const second = advance(first, t0 + 9_000);

    expect(second.chapterIndex).toBe(0);
    expect(second.questionIndex).toBe(1);
    // ⛔ The stamp is the CHAPTER's, so moving between questions ⛔ must not reset it.
    expect(second.chapterStartedAtMs).toBe(t0);
    expect(remainingSeconds(second, t0 + 9_000)).toBe(chapter(0).seconds - 9);
  });

  it('runs the whole simulation to its end and then stays finished', () => {
    let state = startSimulation(0);
    let steps = 0;
    while (!state.finished && steps < 100) {
      state = advance(state, steps * 1000);
      steps += 1;
    }

    expect(state.finished).toBe(true);
    // 23 questions ⇒ 23 advances: the last one ends the run.
    expect(steps).toBe(23);
    expect(advance(state, 999_999)).toEqual(state);
  });

  it('⛔ does not choose the next chapter from an answer — the order is the fixed 41 § 2 table', () => {
    // `advance` takes ⛔ no answer, ⛔ no correctness and ⛔ no score. Adaptivity is 41 § 8 item 4.
    expect(advance.length).toBe(2);
  });
});

describe('the written channel — Hebrew strings and the dots', () => {
  it('heading counts chapters from one, in Hebrew', () => {
    expect(chapterHeadingHe(0)).toBe('פרק 1 מתוך 6');
    expect(chapterHeadingHe(5)).toBe('פרק 6 מתוך 6');
  });

  it('the clock is m:ss and ⛔ never drops the leading zero of the seconds', () => {
    expect(chapterClock(147)).toBe('2:27');
    expect(chapterClock(240)).toBe('4:00');
    expect(chapterClock(9)).toBe('0:09');
    expect(chapterClock(900)).toBe('15:00');
  });

  it('every dot says what it is in words, so state is ⛔ never colour alone', () => {
    expect(chapterDotState(0, 2)).toBe('done');
    expect(chapterDotState(2, 2)).toBe('current');
    expect(chapterDotState(3, 2)).toBe('upcoming');
    expect(chapterDotLabelHe('done', 0)).toContain('1');
    expect(chapterDotLabelHe('current', 2)).toContain('3');
    expect(chapterDotLabelHe('upcoming', 5)).toContain('6');
    const labels = ['done', 'current', 'upcoming'] as const;
    expect(new Set(labels.map((s) => chapterDotLabelHe(s, 0))).size).toBe(3);
  });

  it('carries 41 § 2 rule two as a string the screen shows, ⛔ not as a comment', () => {
    expect(CARRY_OVER_NOTICE_HE).toBe('אי אפשר להעביר זמן שנותר לפרק הבא');
  });
});

describe('advanceChapter — the clock ran out mid-chapter (T-296ⓑ)', () => {
  it('abandons the rest of the chapter and starts the NEXT one with its full time', () => {
    const t0 = 0;
    const midChapter = { ...startSimulation(t0), questionIndex: 1 };
    const atZero = t0 + chapter(0).seconds * 1000;

    expect(isChapterExpired(midChapter, atZero)).toBe(true);

    const next = advanceChapter(midChapter, atZero);

    // ⛔ NOT question 2 of a chapter the learner can no longer answer in.
    expect(next.chapterIndex).toBe(1);
    expect(next.questionIndex).toBe(0);
    expect(remainingSeconds(next, atZero)).toBe(chapter(1).seconds);
    expect(isChapterExpired(next, atZero)).toBe(false);
  });

  it('on the last chapter it ends the run instead of inventing a seventh', () => {
    const last = { chapterIndex: 5, questionIndex: 0, chapterStartedAtMs: 0, finished: false };
    expect(advanceChapter(last, 1_000).finished).toBe(true);
    expect(advanceChapter(last, 1_000).chapterIndex).toBe(5);
  });
});

describe('which press ends what — the button label depends on these two, ⛔ not on the component', () => {
  it('knows the last question of a chapter', () => {
    expect(isLastQuestionOfChapter(startSimulation(0))).toBe(false);
    expect(isLastQuestionOfChapter({ ...startSimulation(0), questionIndex: 3 })).toBe(true);
  });

  it('knows the last question of the whole run, and ⛔ only on the sixth chapter', () => {
    expect(isLastQuestionOfRun({ ...startSimulation(0), questionIndex: 3 })).toBe(false);
    expect(
      isLastQuestionOfRun({ chapterIndex: 5, questionIndex: 3, chapterStartedAtMs: 0, finished: false }),
    ).toBe(true);
    expect(
      isLastQuestionOfRun({ chapterIndex: 5, questionIndex: 2, chapterStartedAtMs: 0, finished: false }),
    ).toBe(false);
  });
});


/**
 * `T-308`ⓒ — the queue the run is served, and the one case that matters: a bank that ⛔ cannot
 * fill every chapter is a bank that serves ⛔ no run at all.
 */
function servedItem(id: string, type: AmirnetPracticeType): AmirnetServedItem {
  return {
    id,
    type,
    level: 1,
    stemEn: 'The rain __ heavily.',
    passageEn: type === 'rc' ? 'A short passage.' : '',
    optionsEn: ['fell', 'fall', 'falling', 'fallen'],
    correctIndex: 0,
    explanationHe: 'עבר פשוט אחרי תיאור זמן.',
  };
}

/** A bank that holds exactly what the six chapters ask for: 12 `sc` · 5 `rc` · 6 `rs`. */
function fullBank(): readonly AmirnetServedItem[] {
  const out: AmirnetServedItem[] = [];
  for (let i = 0; i < 12; i += 1) out.push(servedItem(`sc-${i}`, 'sc'));
  for (let i = 0; i < 5; i += 1) out.push(servedItem(`rc-${i}`, 'rc'));
  for (let i = 0; i < 6; i += 1) out.push(servedItem(`rs-${i}`, 'rs'));
  return out;
}

describe('simulationQueue — T-308ⓒ · 41 § 2', () => {
  it('lays the six chapters end to end, in the table\u2019s own order', () => {
    const queue = simulationQueue(fullBank());
    expect(queue).not.toBeNull();
    expect(queue).toHaveLength(SIMULATION_QUESTION_COUNT);
    expect(SIMULATION_QUESTION_COUNT).toBe(23);
    // 4 sc \u00b7 4 sc \u00b7 5 rc \u00b7 3 rs \u00b7 3 rs \u00b7 4 sc
    expect((queue ?? []).map((i) => i.type).join(',')).toBe(
      ['sc', 'sc', 'sc', 'sc', 'sc', 'sc', 'sc', 'sc', 'rc', 'rc', 'rc', 'rc', 'rc',
        'rs', 'rs', 'rs', 'rs', 'rs', 'rs', 'sc', 'sc', 'sc', 'sc'].join(','),
    );
  });

  it('every chapter of the queue matches the chapter AMIRNET_CHAPTERS declares at that offset', () => {
    const queue = simulationQueue(fullBank()) ?? [];
    let at = 0;
    for (const chapter of AMIRNET_CHAPTERS) {
      for (let i = 0; i < chapter.questionCount; i += 1, at += 1) {
        expect(queue[at]?.type).toBe(chapter.type);
      }
    }
    expect(at).toBe(queue.length);
  });

  it('\u26d4 serves an item once \u2014 the same `sc` item \u26d4 cannot fill chapters 1, 2 and 6', () => {
    const ids = (simulationQueue(fullBank()) ?? []).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('\u26d4 NEVER shortens the run: one item short of a chapter \u21d2 null, \u26d4 not a partial queue', () => {
    const short = fullBank().filter((i) => i.id !== 'sc-11');
    expect(simulationQueue(short)).toBeNull();
    expect(simulationQueue([])).toBeNull();
    // \u26d4 And a bank rich in one type is still short: 40 `sc` and nothing else is \u26d4 no run.
    const scOnly = Array.from({ length: 40 }, (_, i) => servedItem(`sc-${i}`, 'sc'));
    expect(simulationQueue(scOnly)).toBeNull();
  });

  it('is deterministic \u2014 the same bank produces the same run, twice', () => {
    const a = (simulationQueue(fullBank()) ?? []).map((i) => i.id);
    const b = (simulationQueue(fullBank()) ?? []).map((i) => i.id);
    expect(a).toEqual(b);
  });

  it('\u26d4 does not mutate the bank it was handed', () => {
    const bank = fullBank();
    simulationQueue(bank);
    expect(bank).toHaveLength(23);
    expect(bank[0]?.id).toBe('sc-0');
  });
});
