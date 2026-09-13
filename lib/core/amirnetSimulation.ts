/**
 * PURE. The amirnet simulation engine — one chapter at a time, each under its OWN clock.
 * `T-296` · `41 § 2` · `41 § 7` · `41 § 8` item 3. **המשך של: T-287** — the question and its four
 * options were built there; this module is the timed chapter wrapper they run inside, and it
 * rewrites ⛔ nothing in `amirnetQuestion.ts`.
 *
 * 🎯 Render: `docs/design/kol-D-06-simulation.png`, drawn by `docs/design/render_video_D.py`
 * `screen_sim` (:255-291) over `CHAPTERS` (:252-253). Every number below was grepped from that
 * file and cross-read against the `41 § 2` table, ⛔ not eyeballed from the PNG.
 *
 * ⛔ Zero React, window, document, localStorage, fetch, process.env — `scripts/check-core-purity.mjs`.
 * ⛔ AND ZERO `Date.now()`: the caller passes `nowMs` in, exactly as `T-287` does. A clock that
 * reads the wall clock itself ⛔ cannot be tested for the one rule that matters here — that a
 * chapter's leftover time reaches the next chapter ⛔ never.
 *
 * ── 🔴 THE COUNTDOWN IS BUILT AS DRAWN, AND THAT IS ⛔ NOT A CONTRADICTION OF `amirnetQuestion.ts`.
 *    That module counts UP, and says why in its own header: `R-020` forbids time pressure outside
 *    the arena, and `D-049` narrows a clock to material the learner already knows. ⛔ Neither
 *    reaches here, and both files already said so before this one existed. `41 § 2` makes a
 *    per-chapter countdown a **binding rule of the exam being simulated** — «שעון נפרד לכל פרק»
 *    and «אי אפשר להעביר זמן שנותר לפרק הבא» — and `41 § 7` lists «שעון הפרק» among what the
 *    screen must show. ⇒ a countdown here is the PRODUCT, ⛔ not a deviation, and `F-222`'s
 *    declared gap on the practice clock is ⛔ untouched.
 *
 * ── ⛔ NO SCORING, ⛔ NO SCORE ESTIMATE, ⛔ NO ADAPTIVE CHAPTER CHOICE (`T-296`ⓓ). Those are
 *    `41 § 8` item 4, and `41 § 9.2` puts the formula with **Roy**. ⇒ `advance()` takes the state
 *    and a timestamp and ⛔ nothing else: it ⛔ cannot see an answer, so it ⛔ cannot adapt to one.
 *    The chapter order is the fixed `41 § 2` table. ⛔ And `41 § 3` is explicit that adapting after
 *    each question is structurally wrong, ⛔ not a tuning choice.
 *
 * ── ⛔ Nothing here reaches `word_progress` (`R-020` · invariant `37 § 13.1`). The module returns
 *    state to the screen and stores ⛔ nothing.
 */

import type { AmirnetPracticeType } from './amirnetPractice';
import type { AmirnetServedItem } from './amirnetQuestion';

/** One core chapter. The `seconds` are the chapter's OWN budget and ⛔ never a share of a total. */
export interface AmirnetChapter {
  readonly index: number;
  readonly type: AmirnetPracticeType;
  readonly questionCount: number;
  readonly seconds: number;
}

/**
 * The six CORE chapters of `41 § 2` — 23 questions, 39 minutes. ⛔ The experimental chapters 7–8
 * are out of scope by that section's own words («⛔ הסימולציה בגרסה הזאת מכסה את ששת פרקי הליבה
 * בלבד»), so there is ⛔ no seventh row here and ⛔ no flag that would add one.
 * ⚠️ Identical to `render_video_D.py:252-253` `CHAPTERS`, whose third tuple member is minutes.
 */
export const AMIRNET_CHAPTERS: readonly AmirnetChapter[] = [
  { index: 0, type: 'sc', questionCount: 4, seconds: 4 * 60 },
  { index: 1, type: 'sc', questionCount: 4, seconds: 4 * 60 },
  { index: 2, type: 'rc', questionCount: 5, seconds: 15 * 60 },
  { index: 3, type: 'rs', questionCount: 3, seconds: 6 * 60 },
  { index: 4, type: 'rs', questionCount: 3, seconds: 6 * 60 },
  { index: 5, type: 'sc', questionCount: 4, seconds: 4 * 60 },
];

export const CHAPTER_COUNT = AMIRNET_CHAPTERS.length;

/** `41 § 2` rule two, as a string the screen SHOWS. The render keeps it on screen (:290-291). */
export const CARRY_OVER_NOTICE_HE = 'אי אפשר להעביר זמן שנותר לפרק הבא';
export const NEXT_QUESTION_HE = 'לשאלה הבאה';
export const CHAPTER_TIME_UP_HE = 'הזמן לפרק הזה נגמר';
export const NEXT_CHAPTER_HE = 'לפרק הבא';
export const SIMULATION_OVER_HE = 'הסימולציה הסתיימה';
/**
 * `T-316` — the break slide's one action. ⛔ Deliberately ⛔ NOT «התחל סימולציה»: that intent
 * belongs to the entry screen, and `taste-skill § 4.5` («NO DUPLICATE CTA INTENT») makes two
 * labels for one intent a pre-flight failure. This one starts A CHAPTER, and says so.
 */
export const START_CHAPTER_HE = 'להתחיל את הפרק';
/**
 * `T-316`ⓑ, said out loud. The rule is structural below — `remainingSeconds` returns the full
 * budget while the slide is up — but a learner who ⛔ cannot see that has no way to know the
 * slide is free, and would rush through it. ⛔ A fact about the clock, ⛔ not encouragement.
 */
export const CLOCK_STARTS_ON_TAP_HE = 'השעון מתחיל כשמקישים, ולא כרגע';
export const FINISH_RUN_HE = 'לסיום הסימולציה';
/** The clock's own label, so «what is this number» is ⛔ never inferred from its position. */
export const REMAINING_LABEL_HE = 'זמן שנותר לפרק';

export interface AmirnetSimulationState {
  readonly chapterIndex: number;
  readonly questionIndex: number;
  /**
   * The stamp the CURRENT chapter began at — ⛔ never the stamp the run began at. This single
   * field is what makes rule two of `41 § 2` structural instead of a subtraction someone has to
   * remember: the clock is always `chapter.seconds - (now - chapterStartedAtMs)`, so a chapter
   * that ends early ⛔ has no leftover to hand anywhere.
   */
  readonly chapterStartedAtMs: number;
  readonly finished: boolean;
  /**
   * `T-316` — the learner has LEFT a chapter and ⛔ has not yet started the next one. The break
   * slide is up, and until `startChapter()` is called the clock below reports the next chapter's
   * FULL budget. ⇒ ⛔ the slide itself cannot charge the learner for reading it, which is the
   * whole of `T-316`ⓑ and is ⛔ not left to whoever draws the screen.
   * ⚠️ `false` on the first chapter: the entry screen already announced the run.
   */
  readonly atChapterBreak: boolean;
}

export function startSimulation(nowMs: number): AmirnetSimulationState {
  return {
    chapterIndex: 0,
    questionIndex: 0,
    chapterStartedAtMs: nowMs,
    finished: false,
    atChapterBreak: false,
  };
}

export function chapterAt(chapterIndex: number): AmirnetChapter | undefined {
  return AMIRNET_CHAPTERS[chapterIndex];
}

/** Clamped at zero at BOTH ends: ⛔ never negative, and ⛔ never above the chapter's own budget. */
export function remainingSeconds(state: AmirnetSimulationState, nowMs: number): number {
  const chapter = chapterAt(state.chapterIndex);
  if (chapter === undefined) return 0;
  // `T-316`ⓑ — the chapter ⛔ has not begun, so ⛔ nothing has been spent. ⛔ Not a display trick:
  // `startChapter()` re-stamps from the tap, so this is the same number the learner will get.
  if (state.atChapterBreak) return chapter.seconds;
  const spent = Math.floor(Math.max(0, nowMs - state.chapterStartedAtMs) / 1000);
  return Math.max(0, chapter.seconds - spent);
}

/**
 * `m:ss`. ⛔ There is no wrap — a 15-minute chapter reads `15:00`, ⛔ not `5:00` — and ⛔ no
 * negative value can reach here, because `remainingSeconds` clamps first.
 */
export function chapterClock(remaining: number): string {
  const total = Math.max(0, Math.floor(remaining));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * The chapter is over. ⇒ the screen stops accepting answers — `T-296`'s second failure scenario.
 * ⚠️ A finished RUN is expired too: there is no chapter left to be inside.
 */
export function isChapterExpired(state: AmirnetSimulationState, nowMs: number): boolean {
  if (state.finished) return true;
  // ⛔ A chapter that has not started ⛔ cannot have run out (`T-316`ⓑ).
  if (state.atChapterBreak) return false;
  return remainingSeconds(state, nowMs) <= 0;
}

export function chapterHeadingHe(chapterIndex: number): string {
  return `פרק ${chapterIndex + 1} מתוך ${CHAPTER_COUNT}`;
}

/**
 * «כמה זמן יש לי בפרק הזה» — `T-316`ⓐ. Derived from `AMIRNET_CHAPTERS`, which is `41 § 2`'s own
 * table, so a budget that changes there changes here. ⛔ Never a literal on a screen: a minute
 * count written twice is a minute count that drifts.
 * ⛔ An index outside the table returns `''` and ⛔ not `NaN דקות`.
 */
export function chapterBudgetHe(chapterIndex: number): string {
  const chapter = chapterAt(chapterIndex);
  if (chapter === undefined) return '';
  return `${Math.round(chapter.seconds / 60)} דקות`;
}

export type AmirnetDotState = 'done' | 'current' | 'upcoming';

export function chapterDotState(i: number, chapterIndex: number): AmirnetDotState {
  if (i < chapterIndex) return 'done';
  if (i === chapterIndex) return 'current';
  return 'upcoming';
}

/**
 * Every dot carries WORDS. The render distinguishes the three states by fill alone (:266-269),
 * and the constitution's layer A forbids state in colour alone ⇒ the gap is closed with a label,
 * ⛔ not with a second colour.
 */
export function chapterDotLabelHe(state: AmirnetDotState, i: number): string {
  const n = i + 1;
  if (state === 'done') return `פרק ${n} — הסתיים`;
  if (state === 'current') return `פרק ${n} — הפרק הנוכחי`;
  return `פרק ${n} — טרם התחיל`;
}

/**
 * THE ONE TRANSITION, and it takes ⛔ no answer.
 *
 * Inside a chapter it moves to the next question and ⛔ leaves `chapterStartedAtMs` alone — the
 * clock belongs to the chapter, ⛔ not to the question. At the chapter's last question it moves to
 * the next chapter and **re-stamps from `nowMs`**, which is the whole of `41 § 2` rule two: the
 * new chapter's remaining time is computed from its own budget and its own stamp, so a chapter
 * that ended with 90 seconds left hands the next one ⛔ nothing.
 * After the last chapter's last question the run is `finished`, and ⛔ advancing again is a no-op.
 */
export function advance(
  state: AmirnetSimulationState,
  nowMs: number,
): AmirnetSimulationState {
  if (state.finished) return state;
  const chapter = chapterAt(state.chapterIndex);
  if (chapter === undefined) return { ...state, finished: true };

  const nextQuestion = state.questionIndex + 1;
  if (nextQuestion < chapter.questionCount) {
    return { ...state, questionIndex: nextQuestion };
  }

  const nextChapter = state.chapterIndex + 1;
  if (nextChapter >= CHAPTER_COUNT) {
    return { ...state, finished: true };
  }

  // `T-316` — the learner stops at the break slide. `chapterStartedAtMs` is stamped here only so
  // the field is ⛔ never stale; while `atChapterBreak` is true ⛔ nothing reads it, and
  // `startChapter()` re-stamps it from the tap.
  return {
    chapterIndex: nextChapter,
    questionIndex: 0,
    chapterStartedAtMs: nowMs,
    finished: false,
    atChapterBreak: true,
  };
}

/**
 * THE SECOND TRANSITION — the chapter's time ran out.
 *
 * ⚠️ It exists because `advance()` alone ⛔ cannot express it: a chapter that expires on question 2
 * of 4 must move to the NEXT CHAPTER, ⛔ not to question 3 of a chapter the learner can no longer
 * answer in. `T-296`ⓑ says it in those words — «ובסיום הפרק הוא מעביר לפרק הבא». ⇒ the question
 * index is abandoned, ⛔ not walked, and the new chapter is re-stamped from `nowMs` exactly as in
 * `advance()` — so rule two of `41 § 2` holds on this path too.
 */
export function advanceChapter(
  state: AmirnetSimulationState,
  nowMs: number,
): AmirnetSimulationState {
  if (state.finished) return state;
  const nextChapter = state.chapterIndex + 1;
  if (nextChapter >= CHAPTER_COUNT) return { ...state, finished: true };
  return {
    chapterIndex: nextChapter,
    questionIndex: 0,
    chapterStartedAtMs: nowMs,
    finished: false,
    atChapterBreak: true,
  };
}

/**
 * THE THIRD TRANSITION — `T-316`ⓑ. The learner read the break slide and tapped `להתחיל את הפרק`.
 *
 * 🔴 **This is the only place a chapter's clock starts after the first**, and it starts from the
 * TAP. ⇒ a learner who leaves the slide open for ten minutes still gets the chapter's full budget,
 * and the transition screen the product itself put in front of them costs them ⛔ nothing.
 * ⛔ A no-op on a run that is finished or already inside a running chapter — ⛔ a second tap
 * ⛔ cannot re-stamp a chapter that is already counting down and hand back time.
 */
export function startChapter(
  state: AmirnetSimulationState,
  nowMs: number,
): AmirnetSimulationState {
  if (state.finished || !state.atChapterBreak) return state;
  return { ...state, chapterStartedAtMs: nowMs, atChapterBreak: false };
}

/** The learner is on the last question of the last chapter ⇒ the next press ENDS the run. */
export function isLastQuestionOfRun(state: AmirnetSimulationState): boolean {
  const chapter = chapterAt(state.chapterIndex);
  if (chapter === undefined) return true;
  return (
    state.chapterIndex === CHAPTER_COUNT - 1 && state.questionIndex >= chapter.questionCount - 1
  );
}

/** The learner is on the last question of THIS chapter ⇒ the next press leaves the chapter. */
export function isLastQuestionOfChapter(state: AmirnetSimulationState): boolean {
  const chapter = chapterAt(state.chapterIndex);
  if (chapter === undefined) return true;
  return state.questionIndex >= chapter.questionCount - 1;
}

/**
 * THE RUN'S QUEUE — `T-308`ⓒ. Pure, and it is the reason the screen can «start the existing
 * engine» without knowing what a chapter is.
 *
 * `AmirnetSimulation` walks `AMIRNET_CHAPTERS` and reads `items[questionIndex]` straight through,
 * so the queue it is handed must be the six chapters laid END TO END in order — 4 `sc` · 4 `sc` ·
 * 5 `rc` · 3 `rs` · 3 `rs` · 4 `sc`, 23 items. ⛔ A flat bank read in `created_at` order is ⛔ not
 * that, and handing one over would put an `rs` item under an `sc` chapter heading.
 *
 * 🔴 ⛔ AND IT ⛔ NEVER SHORTENS A RUN TO WHAT THE BANK HAPPENS TO HOLD. A bank that cannot fill
 * every chapter returns **`null`**, and the screen says so in words. ⛔ A four-chapter «full
 * simulation» is the `41 § 2` failure this module was written against: the exam's shape is the
 * product, ⛔ not a target to approximate. ⚠️ Measured C-0553: the DB bank is EMPTY (there is
 * ⛔ no `build:amirnet-items` ingest yet — `03-for-roy`), so `null` is what a learner meets today,
 * and that is a **statement of fact**, ⛔ not a dead end (`D-152 § ב׳`).
 *
 * ⛔ No shuffle, ⛔ no sampling, ⛔ no `Math.random()`: the caller hands the order it read, and the
 * same bank produces the same run. A random pick here would make every walk unrepeatable.
 * ⛔ No adaptivity (`41 § 3`): the chapter table is fixed and ⛔ nothing here reads an answer.
 */
export function simulationQueue(
  items: readonly AmirnetServedItem[],
): readonly AmirnetServedItem[] | null {
  const pools = new Map<AmirnetPracticeType, AmirnetServedItem[]>();
  for (const item of items) {
    const pool = pools.get(item.type);
    if (pool === undefined) pools.set(item.type, [item]);
    else pool.push(item);
  }

  const queue: AmirnetServedItem[] = [];
  for (const chapter of AMIRNET_CHAPTERS) {
    const pool = pools.get(chapter.type) ?? [];
    // ⛔ `splice` and ⛔ not a re-scan: an item serves ⛔ once in a run, so the same `sc` item
    // ⛔ cannot appear in chapters 1, 2 and 6.
    const taken = pool.splice(0, chapter.questionCount);
    if (taken.length < chapter.questionCount) return null;
    queue.push(...taken);
  }
  return queue;
}

/** 23 — `AMIRNET_CHAPTERS` summed, ⛔ never a literal a second file has to keep in step. */
export const SIMULATION_QUESTION_COUNT = AMIRNET_CHAPTERS.reduce(
  (sum, chapter) => sum + chapter.questionCount,
  0,
);
